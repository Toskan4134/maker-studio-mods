# Troubleshooting

Common problems and how to fix them.

## Mod doesn't show up in Mod Manager

**Symptom**: You placed a folder in `Mods/` but the editor doesn't list it.

**Checklist**:

1. **Folder location is correct**:
   - Project: `<gameRoot>/Plugins/MakerStudio/003_Editor/Mods/<your-mod-id>/`
   - Global: `%APPDATA%/maker-studio/Mods/<your-mod-id>/`
   - The folder must be inside `Mods/`, not next to it.

2. **manifest.json exists and is valid JSON**. Required fields: `id`, `name`, `version`, `apiVersion`, `main`. Common mistake: missing comma or trailing comma in JSON.

3. **apiVersion matches**. Must be `"1.0.0"`. A wrong version like `"2.0.0"` will be rejected.

4. **Entry file matches `main` field**. If `main` is `"index.js"`, the file `index.js` must exist in the mod folder.

5. **Re-open the project** or click **Reload** in Mod Manager. The editor only scans on project open or manual reload.

## Mod shows "error" status

**Symptom**: Mod appears in the list but its status is red/errored.

1. **Open the Mod Manager**, click on the mod row to expand its log. The error message is there.
2. **Check the browser console** (`Ctrl+Shift+I` in the editor window) for the full stack trace.
3. **Common causes**:
   - Syntax error in `index.js` — validate with a linter.
   - Missing `export function activate(ctx) { ... }` — this is required.
   - Importing external packages — mods run in a sandboxed context. Only bare ESM syntax works. Use `window.__TAURI__` for Tauri commands instead of importing `@tauri-apps/api`.
   - Runtime error inside `activate()` — wrap in try/catch to narrow down.

## Mod loads but does nothing

**Symptom**: Status shows "active" but toasts/events/menu items don't appear.

1. **Check the mod log** in Mod Manager — did `activate()` actually run? Add `ctx.log.info("activate called")` as the first line.
2. **Check event names** — they are case-sensitive. `"map.loaded"` not `"Map.Loaded"`.
3. **Menu items need a menu** — `menu: "Mods"` places it under the Mods menu. A typo creates a new top-level menu you might not notice.
4. **`isEnabled` returning false** — if your `isEnabled` callback returns false, the menu item is grayed out.

## Changes to mod files don't take effect

**Symptom**: You edited `index.js` but the behavior didn't change.

1. **Click Reload** on the mod row in Mod Manager. The editor reads files once on load.
2. **Check you're editing the right file** — if the same mod id exists in both project and global locations, the project version shadows the global one. Check the source badge (blue = project, purple = global).
3. **Clear browser cache** — unlikely but possible if you changed the manifest.

## "Permission denied" on file operations

**Symptom**: `ctx.fs.readProjectFile(...)` or `ctx.fs.writeModFile(...)` throws `PermissionDeniedError`.

- **Path traversal is blocked** — paths containing `..` or absolute paths are rejected. Use relative paths.
- **`readProjectFile` / `writeProjectFile`** — scoped to the game root. You can only access files within the project.
- **`readModFile` / `writeModFile`** — scoped to your mod's own folder. You can't write outside it.

## Mod's panel doesn't show up

**Symptom**: `ctx.ui.registerPanel(...)` was called but no panel is visible.

1. **Panels start in the default position** — check the edges of the editor window. It may be docked but collapsed.
2. **Use `defaultPosition`** — set it to `"left"`, `"right"`, `"below"`, or `"above"`.
3. **Check the console** — if `render(host)` throws, the panel content is empty but the tab should still appear.
4. **Unique id required** — if another mod (or the same mod reloaded) registered the same panel id, the second registration is silently ignored.

## Two mods conflict

**Symptom**: Both mods work alone but break when both are active.

1. **Check command id collisions** — command ids are global. If both mods register `"export.map"`, the second overwrites the first. Namespace with your mod id: `"my-mod.export.map"`.
2. **Check event handler order** — bus handlers run in registration order. If both cancel `save.before`, the first one wins.
3. **Check tool id collisions** — same issue as commands. Use unique tool ids.

## TypeScript / type checking

**Symptom**: You want IntelliSense for `ctx`.

```json
// tsconfig.json in your mod folder
{
  "compilerOptions": {
    "types": ["../../path/to/editor/src/mod-api"]
  }
}
```

Or use a `/// <reference types="..." />` directive in your entry file.
The type definitions live in `src/mod-api/types.ts` in the editor source.

## Context menu item doesn't appear

**Symptom**: `ctx.ui.registerContextMenuItem()` was called but item doesn't show in the right-click menu.

1. **Check context name** — must be one of `"map-tile"`, `"map-event"`, `"tile-palette"`, `"tile-palette-extra"`, `"layer"`, `"map-tree"`, `"event-editor"`. Case-sensitive.
2. **Check `parentMenu` spelling** — if using `parentMenu`, the submenu label must match exactly (case-sensitive). Check the editor's context menu for the exact label (including ellipsis `…`).
3. **Check `isEnabled`** — if your callback returns false, the item is greyed out but still visible.

## Overlay doesn't render

**Symptom**: `ctx.ui.registerOverlay()` was called but nothing draws on the map canvas.

1. **Check render function** — ensure you're actually drawing to the canvas context (e.g. `ctx.fillStyle = ...`, `ctx.fillRect(...)`).
2. **Check viewport math** — tile positions must be converted to screen coords: `(tileCoord * tileSize - viewportOffset) * zoom`. Out-of-viewport draws are clipped.
3. **Check `zOrder`** — overlays with higher `zOrder` render on top. Default is 0.
4. **Check `info.mapId`** — if your overlay only draws for specific maps, verify the mapId matches.

## Keyboard shortcut doesn't fire

**Symptom**: `ctx.ui.registerShortcut()` was called but pressing the keys does nothing.

1. **Check key format** — must be `"Ctrl+Shift+F"`, `"Alt+G"`, etc. Case-sensitive, `+` separated.
2. **Check for conflicts** — built-in editor shortcuts take priority. Avoid `Ctrl+S` (save), `Ctrl+Z` (undo), etc.
3. **Check mod is active** — shortcuts only work while the mod is loaded and enabled.
