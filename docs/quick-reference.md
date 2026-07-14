# Quick Reference

One-page cheat sheet for the most common mod API calls.

## Entry point

```js
export function activate(ctx) {
  // Your mod starts here. ctx = mod context (ModContext)
}

export function deactivate() {
  // Optional cleanup. Auto-disposed items don't need manual cleanup.
}
```

## Multi-file mod (optional)

```js
// utils.js — place alongside index.js in your mod folder
export function myHelper() { return 42; }

// index.js (entry, matches manifest "main")
import { myHelper } from './utils.js';  // relative specifier required

export function activate(ctx) {
  ctx.ui.showToast({ message: `Answer: ${myHelper()}`, level: "info" });
}
```

All `.js` files in the mod directory (including subdirectories) are discovered.
Only `./` and `../` relative imports are rewritten. CommonJS mods stay single-file.

## Show a toast

```js
ctx.ui.showToast({ message: "Done!", level: "info" });
// level: "info" | "warn" | "error"
```

## Add a menu item

```js
ctx.menu.registerMenuItem({
  menu: "Mods",
  label: "My Action",
  icon: "database",          // optional: built-in icon name, SVG markup, or unicode glyph
  shortcut: "Ctrl+Shift+D",  // optional: registers a real, rebindable binding (NOT just a hint)
  handler: () => { /* do something */ },
  isEnabled: () => true,
});
// `shortcut` binds the key and fires `handler`; it's rebindable in the editor's
// Keyboard Shortcuts dialog ("Mods" section). Don't also call registerShortcut
// for the same key — that double-registers it.
```

## Listen to editor events

```js
ctx.bus.on("map.loaded", (e) => {
  console.log(e.mapId, e.width, e.height);
});

ctx.bus.on("map.tile.changed", (e) => {
  console.log(e.mapId, e.layer, e.x, e.y, e.oldId, e.newId);
});

ctx.bus.on("save.before", async (e) => {
  return { cancel: true, reason: "not ready" }; // cancel save
});
```

## Read and write tiles

```js
const tileId = ctx.map.readTile(mapId, layer, x, y);
ctx.map.writeTile(mapId, layer, x, y, newTileId, "paint");
```

## Read map info

```js
const info = ctx.map.info(mapId);
// { id, name, width, height, tilesetId, layerCount }

const layers = ctx.map.layers(mapId);
// [{ index, name, visible, opacity, kind }]
```

## Read tileset data

```js
const blobUrl = await ctx.tileset.getImageBlobUrl(tilesetId);
const props = ctx.tileset.getTileProperties(tilesetId, tileId);
// { passage, priority, terrainTag }
```

## Add custom terrain tags / priorities

```js
// Appear (named) in the Tileset Editor's Terrain Tag / Priority dropdowns.
// Built-in ids: terrain tags 0-17, priorities 0-5 — use 18+ / 6+ for custom.
ctx.tileset.registerTerrainTag({ id: 18, name: "Lava" });
ctx.tileset.registerPriority({ id: 6, name: "Above 6" });
// The chosen id is written verbatim to @terrain_tags / @priorities. No runtime
// dispatcher — read it in-game via $game_map.terrain_tag(x, y) and branch on it.
```

## Fog / panorama / custom layer groups

```js
// ctx.fog (above tiles) and ctx.panorama (beneath tiles) share one surface:
const { id } = ctx.panorama.create(mapId, "Sky");        // panorama default: opacity 255, parallax 0.5
ctx.panorama.setConfig(mapId, id, { graphicName: "Clouds", sx: 1, parallax: 0.5 });
ctx.fog.setOpacity(mapId, fogId, 128);
ctx.fog.info(mapId, fogId);   // { id, name, visible, opacity, config }
// config: { graphicName, hue, blendType, zoom, sx, sy, followPlayer, parallax? }
// parallax (0..1, world-anchored only): 1 = with the map, 0.5 = RMXP panorama, 0 = screen-locked

// Custom group with your own draw priority (< 0 beneath tiles, >= 0 above):
ctx.layerGroups.register(mapId, { key: "my-mod.glow", name: "Glow", priority: 500, folder: "Pictures" });
const layer = ctx.layerGroups.addLayer(mapId, "my-mod.glow", { config: { graphicName: "halo" } });
ctx.layerGroups.updateLayer(mapId, "my-mod.glow", layer.id, { opacity: 96 });
// Groups persist inside the map file — they render in-game even without the mod.
// key must not be "fog"/"panorama"; folder = single Graphics/ subfolder.
```

## Register a custom tool

```js
ctx.tools.registerTool({
  id: "my-mod.magic-wand",
  label: "Magic Wand",
  icon: "✦",
  onActivate() { /* tool selected */ },
  onDeactivate() { /* tool deselected */ },
  onPointerDown(ev) { /* ev: { mapId, tileX, tileY, layerIndex, buttons, shiftKey, ctrlKey, altKey } */ },
  onPointerMove(ev) { /* ... */ },
  onPointerUp(ev) { /* ... */ },
});
```

## Register a dockable panel

```js
ctx.ui.registerPanel({
  id: "my-mod.my-panel",
  title: "My Panel",
  defaultPosition: "right",
  render(host) {
    host.innerHTML = "<p>Hello from my mod!</p>";
    return () => { /* cleanup on panel close */ };
  },
});
```

## Match the editor's theme

```js
// Panels & custom dialogs render in the editor DOM — its theme CSS vars
// cascade in. Use var(--name) so your UI flips with light/dark automatically.
host.innerHTML = `<div style="
  background: var(--bg-primary); color: var(--text-primary);
  border: 1px solid var(--border); font-family: inherit; padding: 8px;">…</div>`;
// Common: --bg-primary/secondary/tertiary --bg-hover --border --input-bg
//         --text-primary/secondary/tertiary --accent --accent-hover --accent-text
//         --danger --warning --success
// Canvas overlays can't use CSS vars — branch on ctx.editor.theme() instead.
```

## Register a context menu item

```js
ctx.ui.registerContextMenuItem({
  context: "map-tile", // or "map-event", "tile-palette", "tile-palette-extra", "layer", "map-tree", "event-editor"
  label: "My Action",
  handler: (info) => { /* info: { mapId, tileX, tileY, tileId, layerIndex, ... } */ },
  isEnabled: (info) => true, // optional
  parentMenu: "Export Map…", // optional: nest inside existing submenu
});
```

## Register an overlay

```js
ctx.ui.registerOverlay({
  id: "my-mod.overlay",
  zOrder: 10, // higher = on top
  render(ctx, info) {
    // ctx: CanvasRenderingContext2D
    // info: { mapId, tileSize, zoom, viewportX, viewportY, canvasWidth, canvasHeight }
    const px = (tileX * info.tileSize - info.viewportX) * info.zoom;
    const py = (tileY * info.tileSize - info.viewportY) * info.zoom;
    ctx.fillStyle = "rgba(255,0,0,0.3)";
    ctx.fillRect(px, py, info.tileSize * info.zoom, info.tileSize * info.zoom);
  },
});
```

## Register a keyboard shortcut

```js
ctx.ui.registerShortcut("Ctrl+Shift+F", () => {
  // handler fires when shortcut is pressed
});
```

## Translate your mod / add a language

```js
// Tier 1 — translate your own strings (keys = your English source strings)
ctx.i18n.addTranslations("es", { "Export finished": "Exportación completada" });
ctx.ui.showToast({ message: ctx.i18n.t("Export finished") });
// t() lookup: your mod dict → app dict → the source string. {name} vars substituted after.

// Tier 2 — register a whole app locale (appears in View → Language)
ctx.i18n.registerLocale({ code: "fr", name: "Français", dict: frenchDict });
// Reusing a built-in code (e.g. "es") patches that locale's app strings.

ctx.i18n.getLocale();                 // active locale code
ctx.i18n.locales();                   // [{ code, name }]
ctx.i18n.setLocale("fr");
ctx.i18n.onChanged((locale) => { /* re-render */ });   // = bus "locale.changed"
// Everything auto-disposes on unload; a mod-provided active locale is restored
// automatically when the mod re-registers (hot reload safe).
```

## View options

```js
const opts = ctx.editor.viewOptions();
// { showGrid, showCollision, showEvents, showDim, darkMode }
ctx.editor.setViewOptions({ showGrid: false }); // partial update
```

## Undo grouping

```js
ctx.map.beginUndoGroup("My Operation");
ctx.map.writeTile(mapId, layer, x1, y1, tileId);
ctx.map.writeTile(mapId, layer, x2, y2, tileId);
ctx.map.endUndoGroup(); // all writes become one undo step
```

## File operations

```js
// Read/write within your mod folder
const data = await ctx.fs.readModFile("config.json");
await ctx.fs.writeModFile("output.txt", "hello");

// Read/write within the game project
const rxdata = await ctx.fs.readProjectFile("Data/Map001.rxdata");
await ctx.fs.writeProjectFile("exports/map.txt", content);
```

## Persistent storage

```js
await ctx.storage.set("myKey", { count: 42 });
const val = await ctx.storage.get("myKey", { count: 0 });
```

## OS text clipboard

```js
await ctx.clipboard.writeText("hello");
const text = await ctx.clipboard.readText();   // string | null
```

Not the tile clipboard — that's `ctx.map.getClipboard()` / `setClipboard()`.

## Cross-mod commands

```js
// Register a command other mods can call
ctx.commands.register("my-mod.do-thing", async (arg) => {
  return result;
});

// Call another mod's command
const result = await ctx.commands.execute("other-mod.do-thing", arg);
```

## Read / write an event's commands

```js
const ev = ctx.events.getFull(mapId, eventId);   // pages[].list is always present

// Replace page 1's commands (Show Text "Hello")
ev.pages[0].list = [ctx.events.createCommand(101, ["Hello"])];

// ...or append to what's there (drop the trailing code-0 terminator first)
const list = (ev.pages[0].list ?? []).filter((c) => c.code !== 0);
list.push(ctx.events.createCommand(101, ["One more line"]));
ev.pages[0].list = list;

const check = ctx.events.validateEvent(ev);      // { valid, errors: ["Unknown command code …"] }
if (check.valid) ctx.events.update(mapId, ev);   // undoable
// update() re-adds the code-0 terminator if missing — you don't have to.
// Omit a page's `list` entirely to leave that page's commands untouched.
// createCommand() returns indent: 0 — set `indent` yourself inside branches/loops.
```

## Register a custom event command

```js
ctx.events.registerCommand({
  id: "cameraScrollTo",
  name: "Camera Scroll To",
  fields: [
    { type: "coordinate", key: "target", label: "Target tile", showMapSelector: true },
    { type: "checkbox", key: "useSpeed", label: "Set speed" },
    { type: "number", key: "speed", label: "Speed", min: 1, default: 4, hidden: (p) => !p.useSpeed },
  ],
  // The form builds a plain Script command; this literal Ruby runs in-game.
  script: (p) => `pbCameraScrollTo(${p.target.x | 0}, ${p.target.y | 0}${p.useSpeed ? `, ${p.speed | 0}` : ""})`,
  // parse() recovers params so the command stays named + re-editable.
  parse: (t) => { const m = /^pbCameraScrollTo\((-?\d+), (-?\d+)(?:, (\d+))?\)$/.exec(t);
    return m ? { target: { mode: "direct", mapId: 0, x: +m[1], y: +m[2], varMapId: 1, varX: 1, varY: 1 }, useSpeed: m[3] != null, speed: +m[3] || 4 } : null; },
  summary: (p) => `(${p.target.x}, ${p.target.y})`,
});
// Omit `fields` for a freeform script command (params.script).
// Field types: number, text, select, checkbox, switch, variable,
//   coordinate (Transfer-Player Direct/Variables source), record (recordKind),
//   event, graphic (subfolder), audio (category). Any field: disabled/hidden(params).
// Appears on a puzzle-icon mod page (🧩1, 🧩2, …) in the picker; stored as code-355
// Script command running the literal text — no runtime dispatcher.
```

## Call Tauri commands directly

```js
const invoke = window.__TAURI__.core.invoke;

// File I/O
const bytes = await invoke("read_binary_file", { path: "/path/to/file" });
await invoke("write_binary_file", { path: "/path/to/file", data: bytes });

// File management
const entries = await invoke("list_directory", { path: "/some/dir" });
const exists = await invoke("file_exists", { path: "/some/file" });
await invoke("copy_file", { src: "/a", dst: "/b" });

// Image
const [w, h] = await invoke("get_image_dimensions", { path: "/img.png" });

// Native file picker
const filePath = await invoke("plugin:dialog|open", {
  options: { title: "Pick a file", filters: [{ name: "Images", extensions: ["png", "jpg"] }] }
});

// Tileset management
const newId = await invoke("create_tileset", { gameRoot, name: "My Tileset", tilesetName: "my_tile" });
```

## Lifecycle hooks

```js
ctx.lifecycle.onMapLoad((mapId) => { /* map opened */ });
ctx.lifecycle.onSave((mapId) => { /* map saved */ });
ctx.lifecycle.onActivate(() => { /* after activate() returns */ });
ctx.lifecycle.onDeactivate(() => { /* mod unloading */ });
```

## Editor state

```js
const mapId = ctx.editor.activeMapId();
const layer = ctx.editor.activeLayerIndex();
const tool = ctx.editor.activeTool();
const root = ctx.editor.gameRoot();
const maps = ctx.editor.listOpenMaps();

ctx.editor.setTool("brush");
ctx.editor.setActiveLayer(0);
```

## Logging

```js
ctx.log.info("Something happened", { detail: "value" });
ctx.log.warn("Unexpected state");
ctx.log.error(err);
```

## Query installed mods / plugins (runtime)

```js
// Other mods (soft/optional deps, feature detection):
ctx.mods.list();                         // [{ id, name, version, enabled, status, source }]
ctx.mods.isInstalled("com.author.x");    // present in any status
ctx.mods.isActive("com.author.x");       // present AND running
ctx.mods.get("com.author.x");            // InstalledModInfo | null

// Essentials plugins (from <gameRoot>/Plugins/), full meta.txt:
ctx.plugins.available();                 // false on v16/BES (no Plugins/ dir)
ctx.plugins.list();                      // [{ name, version, essentials, link, credits,
                                         //    requires, exact, optional, conflicts }]
ctx.plugins.isInstalled("Following Pokemon EX");
ctx.plugins.get("Following Pokemon EX"); // InstalledPluginInfo | null
```

For *hard* dependencies that should block your mod from loading, use the
manifest `requires` array below instead.

## Dependencies (manifest `requires`)

```jsonc
// In manifest.json — one unified array for mod + plugin dependencies.
// Each entry is discriminated by "type". Plugins load from <gameRoot>/Plugins/.
{
  "requires": [
    // -- other mods (topo-sorted; missing id blocks this mod) --
    { "type": "mod", "id": "com.author.coremod" },          // must be installed
    { "type": "mod", "id": "com.author.utils",
      "version": "^1.2.0" },                                 // range recorded, not enforced in v1

    // -- Essentials plugins --
    { "type": "plugin", "name": "My Plugin" },               // block if missing, ignore version
    { "type": "plugin", "name": "Other Plugin",
      "url": "https://example.com/plugin" },                 // link shown in warnings
    { "type": "plugin", "name": "Strict Plugin",
      "enforcement": "pluginAndVersion",
      "version": "1.2.0" },                                  // block if missing OR < 1.2.0
    { "type": "plugin", "name": "Exact Plugin",
      "enforcement": "pluginAndVersion",
      "versionCheck": "exact",
      "version": "2.0.0" },                                  // block unless exactly 2.0.0
    { "type": "plugin", "name": "Optional Plugin",
      "enforcement": "none",
      "url": "https://example.com/opt" }                     // never block, only warn
  ]
}
// plugin enforcement: "plugin" (default) | "pluginAndVersion" | "none"
// plugin versionCheck: "greaterOrEqual" (default) | "exact" | "compatible"
// "compatible" = same major, installed minor.patch >= required
// "pluginAndVersion" without version → ManifestError
// v21+ projects: enforcement controls blocking (see above).
// v16 projects (no Plugins/ folder): console warning, mod loads anyway.
```
