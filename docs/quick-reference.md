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
  handler: () => { /* do something */ },
  isEnabled: () => true,
});
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

## Cross-mod commands

```js
// Register a command other mods can call
ctx.commands.register("my-mod.do-thing", async (arg) => {
  return result;
});

// Call another mod's command
const result = await ctx.commands.execute("other-mod.do-thing", arg);
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

## Plugin dependencies (manifest)

```jsonc
// In manifest.json — declare dependencies on Essentials plugins.
// Plugins are loaded from <gameRoot>/Plugins/*/meta.txt.
{
  "pluginDependencies": [
    { "name": "My Plugin" },                                // block if missing, ignore version
    { "name": "Other Plugin",
      "url": "https://example.com/plugin" },                // link shown in warnings
    { "name": "Strict Plugin",
      "enforcement": "pluginAndVersion",
      "version": "1.2.0" },                                 // block if missing OR < 1.2.0
    { "name": "Exact Plugin",
      "enforcement": "pluginAndVersion",
      "versionCheck": "exact",
      "version": "2.0.0" },                                 // block unless exactly 2.0.0
    { "name": "Optional Plugin",
      "enforcement": "none",
      "url": "https://example.com/opt" }                    // never block, only warn
  ]
}
// enforcement: "plugin" (default) | "pluginAndVersion" | "none"
// versionCheck: "greaterOrEqual" (default) | "exact" | "compatible"
// "compatible" = same major, installed minor.patch >= required
// "pluginAndVersion" without version → ManifestError
// v21+ projects: enforcement controls blocking (see above).
// v16 projects (no Plugins/ folder): console warning, mod loads anyway.
```
