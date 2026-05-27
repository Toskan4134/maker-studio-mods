# Getting Started

This guide walks through writing the smallest possible mod and verifying it
loads in the editor.

## 1. Create the folder

Inside your game project:

```
<gameRoot>/Plugins/MakerStudio/003_Editor/Mods/hello-world/
├── manifest.json
└── index.js
```

If the `Mods` folder does not exist, create it. The editor will scan it on every
project load.

Alternatively, place your mod in the global mods directory at
`<APPDATA>/maker-studio/Mods/hello-world/` to make it available across
all projects. Project mods take priority over global mods with the same id.

## 2. Write the manifest

`manifest.json`:

```json
{
  "id": "com.toskan4134.hello-world",
  "name": "Hello World",
  "version": "1.0.0",
  "authors": [{ "name": "You" }],
  "description": "Says hello when a map loads.",
  "apiVersion": "1.0.0",
  "main": "index.js"
}
```

Required fields:

| Field         | Notes |
|---------------|-------|
| `id`          | Reverse-DNS, must be unique. Used as the folder identity. |
| `name`        | Display name in the Mod Manager. |
| `version`     | Semver. Your mod's version. |
| `apiVersion`  | Editor API version your mod targets (semver). |
| `main`        | Path to the JS entry, relative to the mod folder. |

Optional: `authors` (array of `{name, url?}` — supports multiple authors), `description`, `homepage`, `dependencies`, `permissions`.

## 3. Write the mod

`index.js`:

```js
export function activate(ctx) {
  ctx.log.info("Hello World mod loaded.");

  ctx.bus.on("map.loaded", (e) => {
    ctx.ui.showToast({ message: `Loaded map ${e.mapId} (${e.width}x${e.height})` });
  });
}

export function deactivate() {
  // Optional cleanup. Disposables registered via ctx are auto-disposed.
}
```

Key points:

- **`activate(ctx)` is required.** It runs once when the mod loads.
- **Use `ctx.bus.on(...)` to react to editor events.** The returned
  `Disposable` is auto-cleaned on mod unload.
- **`ctx.ui.showToast(...)`** pops a transient notification.
- **`ctx.log.info(...)`** writes to the mod's log buffer (visible in the
  Mod Manager panel).

## 4. Reload the editor

Re-open your project. Open **Mods → Mod Manager**. You should see
`Hello World` listed as `active`. Click it to view logs.

Now load any map — a toast should appear in the bottom-right.

## 5. Iterate

While developing, click **Reload** on your mod row in the Mod Manager
to re-scan its files without restarting the editor.

## Next steps

- Browse the [API Reference](./api-reference.md) for all available methods.
- Add a menu item via `ctx.menu.registerMenuItem({ menu: "Mods", label: "...", handler: ... })`.
- Add a context menu item via `ctx.ui.registerContextMenuItem({ context: "map-tile", label: "...", handler: ... })`.
- Add a canvas overlay via `ctx.ui.registerOverlay({ id, render })`.
- Register keyboard shortcuts via `ctx.ui.registerShortcut(key, handler)`.
- Toggle view options via `ctx.editor.viewOptions()` / `setViewOptions(...)`.
- Add a Dockview panel via `ctx.ui.registerPanel({ id, title, render })`.
- Call any Tauri command directly via `window.__TAURI__.core.invoke("command_name", args)` — see the [Available Tauri Commands](./api-reference.md#available-tauri-commands-for-mods) section.
- Check the [API Changelog](./api-changelog.md) for what's new in each version.
- Look at [examples/mods/](../examples/mods/) for nine bundled mods with annotated walkthroughs.
