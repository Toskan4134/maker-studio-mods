# API Reference

The current API version is **1.0.0**. Mods declare it via `manifest.apiVersion`.

The TypeScript source of truth is [`mod-api.d.ts`](./mod-api.d.ts).
This document mirrors that file.

---

## `ctx` (Mod Context)

The `ctx` argument passed to `activate(ctx)`. Internally typed as `ModContext`.
All mod capabilities are reached through it.

| Field        | Type                  | Purpose |
|--------------|-----------------------|---------|
| `apiVersion` | `string`              | Echoes the editor's API version. |
| `manifest`   | `Readonly<Manifest>`  | This mod's manifest. |
| `editor`     | `EditorCtx`           | Active map / layer / tool state. |
| `map`        | `MapCtx`              | Read and write tiles, query layers. |
| `tileset`    | `TilesetCtx`          | Tileset images and tile properties. |
| `shadow`     | `ShadowCtx`           | Shadow layer queries. |
| `fog`        | `FogCtx`              | Fog layer queries and config. |
| `events`     | `EventsCtx`           | RMXP-style events on a map. |
| `tools`      | `ToolsCtx`            | Register custom editing tools. |
| `menu`       | `MenuCtx`             | Add menu items. |
| `commands`   | `CommandsCtx`         | Cross-mod command registry. |
| `ui`         | `UiCtx`               | Panels, dialogs, toasts. |
| `bus`        | `BusCtx`              | Subscribe to / emit events. |
| `fs`         | `FsCtx`               | Path-scoped filesystem. |
| `storage`    | `StorageCtx`          | Per-mod persistent K/V. |
| `stats`      | `StatsCtx`            | Read editor usage statistics. |
| `keybinds`   | `KeybindsCtx`         | Query and modify keyboard shortcuts. |
| `selectors`  | `SelectorsCtx`        | Modal pickers (actor, item, switch, map, tileset, audio, graphic, …). |
| `projectData`| `ProjectDataCtx`      | Read-only RPG record lists (actors, items, switches, …). |
| `log`        | `LogCtx`              | Namespaced logger. |
| `lifecycle`  | `LifecycleCtx`        | Activation hooks. |

---

## `editor`

```ts
editor.version(): string
editor.activeMapId(): number | null
editor.activeLayerIndex(): number
editor.activeTool(): string
editor.setTool(toolId: string): void
editor.setActiveLayer(index: number): void
editor.listOpenMaps(): number[]
editor.gameRoot(): string | null
editor.brushSize(): number
editor.setBrushSize(size: number): void
editor.brushTileProperties(): { rotation, flipH, flipV, opacity, hue, saturation, lighting }
editor.setBrushTileProperties(props: Partial<{...}>): void
editor.hoverTile(): { x, y } | null
editor.viewport(): { x, y, zoom }
editor.setViewport(viewport: { x?, y?, zoom? }): void
editor.viewOptions(): { showGrid, showCollision, showEvents, showDim, darkMode }
editor.setViewOptions(opts: Partial<{...}>): void
```

Read/write access to editor state. `version()` returns the running editor's
version (e.g. `"0.1.1"`) — the same value the in-app updater compares against;
handy for gating features behind a `minStudioVersion`. `setTool` accepts both
built-in ids (`"brush"`, `"eraser"`, ...) and ids of mod-registered tools.

`setBrushSize` changes the active brush size. `setBrushTileProperties` merges
partial props into the current brush. `setViewport` pans/zooms the active map.

```ts
editor.theme(): "dark" | "light"
editor.animationFrame(): number
editor.requestRedraw(): void
editor.setStatusBarText(text: string | null): void
editor.recentMaps(): number[]
editor.projectName(): string | null
```

`theme()` is a shorthand for `viewOptions().darkMode ? "dark" : "light"`.
`animationFrame()` returns a coarse counter (~10fps) useful for overlay animation.
`requestRedraw()` fires a `mod:requestRedraw` DOM event for canvas re-renders.
`setStatusBarText(text)` sets a transient mod-owned status message (pass `null` to clear). Auto-cleared on mod unload.
`recentMaps()` returns open map IDs most-recent first. `projectName()` returns the game folder name.

---

## `map`

```ts
map.info(mapId): PublicMapInfo | null
map.layers(mapId): PublicLayerInfo[]
map.readTile(mapId, layer, x, y): number
map.writeTile(mapId, layer, x, y, tileId, label?): void
map.batchWrite(mapId, layer, tiles: Map<"x,y", tileId>, label): void
map.selection(mapId): { bounds, count }
map.readTileData(mapId, layer, x, y): PublicTileData | null
map.writeTileData(mapId, layer, x, y, data, label?): void
map.selectionTiles(mapId): Array<{ x, y, tileId, layerIndex }> | null
map.setSelection(mapId, tiles: Array<{ x, y }> | null): void
map.addLayer(mapId, name?): number
map.removeLayer(mapId, layerIndex): void
map.renameLayer(mapId, layerIndex, name): void
map.setLayerVisible(mapId, layerIndex, visible): void
map.setLayerOpacity(mapId, layerIndex, opacity): void
map.createMap(opts: { width?, height?, tilesetId?, name?, parentId? }): Promise<number>
map.deleteMap(mapId): Promise<void>
map.resize(mapId, newWidth, newHeight, shiftX?, shiftY?): void
map.renameMap(mapId, name): void
map.reparentMap(mapId, parentId): Promise<void>
map.beginUndoGroup(label): void
map.endUndoGroup(): void
```

`writeTile` and `batchWrite` go through the editor's normal undo/redo
pipeline — your changes are undoable like any built-in edit.

`writeTileData` writes full per-tile properties (rotation, flip, opacity, etc.)
on extended layers. `setSelection` creates or clears a tile selection.
Layer management operates on extended layers (3+). `createMap` creates a new
map file and registers it in MapInfos. `deleteMap` removes the map file.

```ts
map.transformSelection(mapId, opts: {
  rotation?: 0|90|180|270; flipH?: boolean; flipV?: boolean;
  incremental?: boolean;
  colorOverride?: { hue?, saturation?, lighting?, opacity? };
}): void
map.recalculateAutotiles(mapId, layerIndex, tiles: Array<{x,y}>): void
map.getNativeTileProperties(mapId, layer, x, y): NativeTileProps | null
map.setNativeTileProperties(mapId, layer, x, y, props: Partial<NativeTileProps>): void
map.getClipboard(): PublicClipboardData | null
map.setClipboard(data: PublicClipboardData | null): void
map.createUndoScope(mapId, label): UndoScope
```

`transformSelection` rotates/flips/recolors the current selection, permuting tile positions so the group visually rotates.
`recalculateAutotiles` fixes autotile seams after bulk writes — call it with the affected tiles.
`getNativeTileProperties` / `setNativeTileProperties` read and write per-tile properties on native layers (0-2).
`getClipboard` / `setClipboard` read and replace the tile clipboard; `setClipboard(null)` clears it.
`createUndoScope` returns a scope object — call `.write()`/`.writeData()` to queue writes, then `.commit()` to apply them as a single undo entry (or `.abort()` to discard).

---

## `tileset`

```ts
tileset.getImageBlobUrl(tilesetId): Promise<string | null>
tileset.getTileProperties(tilesetId, tileId): { passage, priority, terrainTag } | null
tileset.list(): Array<{ id, name, tilesetName }>
tileset.info(tilesetId): { id, name, tilesetName, autotileNames, panoramaName, fogName, battlebackName } | null
tileset.setTileProperties(tilesetId, tileId, { passage?, priority?, terrainTag? }): Promise<void>
tileset.currentId(): number | null
tileset.current(): { id, name, tilesetName, autotileNames, panoramaName, fogName, battlebackName } | null
tileset.mapTilesetId(mapId): number | null
```

The blob URL stays valid for the lifetime of the editor session.

`list` returns all loaded tilesets. `info` returns tileset metadata including
the autotile name array, panorama, fog, and battleback names.

`currentId` returns the tileset currently selected in the tile palette
(not the map's assigned tileset). Returns `null` if no map is open.

`current` returns full info of the currently selected tileset. Equivalent
to `tileset.info(tileset.currentId())`.

`mapTilesetId` returns the tileset ID assigned to a specific map.
Returns `null` if the map is not loaded.

```ts
tileset.transformTileProperties(tilesetId, tileId, { rotation?, flipH?, flipV? }):
  { passage, priority, terrainTag } | null
tileset.resolveTileProperties(tileId, tilesetId?): { passage, priority, terrainTag } | null
```

`transformTileProperties` returns passage/priority/terrain adjusted for the given rotation/flip — passage direction bits are rotated to match the visual transform.
`resolveTileProperties` resolves tile properties from any tileset (falls back to the active palette tileset when `tilesetId` is omitted).

```ts
tileset.registerTerrainTag({ id, name }): Disposable
tileset.registerPriority({ id, name }): Disposable
```

`registerTerrainTag` / `registerPriority` add a named entry to the Tileset
Editor's **Terrain Tag** / **Priority** dropdowns. `id` is the integer written
verbatim to `@terrain_tags` / `@priorities` (Table1, i16, no clamp) when the user
paints that value. Built-in ids are **0–17** for terrain tags (the Pokemon
Essentials defaults) and **0–5** for priorities (0 = ground, 1–5 = tiles
overhead), so use **18+** / **6+** for custom entries to avoid clobbering them.
Duplicate ids are ignored (first registration wins). Both return a `Disposable`
and are auto-removed when the mod unloads.

The editor only contributes the picker label + selectable range — there is **no
runtime dispatcher**. To give a tag in-game behavior, read it back in your game
scripts (`$game_map.terrain_tag(x, y)` — a plain Integer in RMXP/BES/LBDS; resolved
through `PBTerrain` / `GameData::TerrainTag` in Pokemon Essentials) and branch on
the value. See the `custom-tile-properties` example mod.

---

## `selectors`

Modal pickers that mount the editor's stock selector dialogs. Every method
returns a `Promise` that resolves to the picked value or `null` when the
user cancels.

```ts
// RPG records (1-indexed; index 0 reserved for "nil")
selectors.pickActor(opts?): Promise<EntityPickResult | null>
selectors.pickClass(opts?): Promise<EntityPickResult | null>
selectors.pickSkill(opts?): Promise<EntityPickResult | null>
selectors.pickItem(opts?): Promise<EntityPickResult | null>
selectors.pickWeapon(opts?): Promise<EntityPickResult | null>
selectors.pickArmor(opts?): Promise<EntityPickResult | null>
selectors.pickEnemy(opts?): Promise<EntityPickResult | null>
selectors.pickTroop(opts?): Promise<EntityPickResult | null>
selectors.pickState(opts?): Promise<EntityPickResult | null>
selectors.pickAnimation(opts?): Promise<EntityPickResult | null>
selectors.pickCommonEvent(opts?): Promise<EntityPickResult | null>
selectors.pickEntity(kind, opts?): Promise<EntityPickResult | null>

// System
selectors.pickSwitch(opts?): Promise<EntityPickResult | null>
selectors.pickVariable(opts?): Promise<EntityPickResult | null>

// Map / event / tileset
selectors.pickMap(opts?: { value?, title?, includeCurrentMap? }): Promise<EntityPickResult | null>
selectors.pickEvent(mapId, opts?: { value?, title?, includePlayer?, includeThisEvent? }): Promise<EntityPickResult | null>
selectors.pickTileset(opts?): Promise<PublicTilesetInfo | null>

// File-backed
selectors.pickAudio("BGM"|"BGS"|"ME"|"SE", opts?: { initial?, title? }): Promise<AudioPickResult | null>
selectors.pickGraphic(subfolder, opts?: { initial?, showHue?, title? }): Promise<GraphicPickResult | null>

// Input
selectors.pickKeyboardButton(opts?: { value? }): Promise<KeyboardButtonPickResult | null>
```

`EntityPickResult` = `{ id, name }`. `AudioPickResult` = `{ name, volume, pitch }`.
`GraphicPickResult` = `{ name, hue }`. `KeyboardButtonPickResult` = `{ code, label }`.
For RPG-record pickers, `opts.extras: SelectorExtra[]` lets you place synthetic rows
above the real list (e.g. `{ id: 0, label: "Entire Party" }` for actor target params).
For `pickEvent`, `includePlayer` adds id `-1` and `includeThisEvent` adds id `0`.

```ts
// Example — let the user pick an item, then award it
const item = await ctx.selectors.pickItem({ title: "Reward" });
if (item) ctx.ui.showToast({ message: `You got ${item.name}!`, level: "info" });

// Example — pick a graphic from Graphics/Pictures with hue slider
const pic = await ctx.selectors.pickGraphic("Pictures", { showHue: true });
if (pic) console.log(pic.name, pic.hue);

// Example — pick BGM with custom initial volume
const bgm = await ctx.selectors.pickAudio("BGM", {
  initial: { name: "001-Battle01", volume: 80, pitch: 100 },
});
```

Selectors mount the same React components used by the built-in event editor
(`EntitySelector`, `EventSelector`, `MapSelector`, `TilesetSelector`,
`SwitchPicker`, `KeyboardButtonSelector`, `AudioSelector`, `GraphicSelector`).
Only one selector can be active at a time — opening a second one before the
first resolves will replace it (the first resolves with `null`).

---

## `projectData`

Read-only views of the project-wide RPG record lists loaded from `.rxdata`.
Use these when you want to enumerate or look up records without showing a
modal picker. Lists are 1-indexed: `index 0` is the reserved nil slot
(`{ id: 0, name: "" }`), and IDs map directly to list indices.

```ts
projectData.actors(): readonly PublicRpgRecord[]
projectData.classes(): readonly PublicRpgRecord[]
projectData.skills(): readonly PublicRpgRecord[]
projectData.items(): readonly PublicRpgRecord[]
projectData.weapons(): readonly PublicRpgRecord[]
projectData.armors(): readonly PublicRpgRecord[]
projectData.enemies(): readonly PublicRpgRecord[]
projectData.troops(): readonly PublicRpgRecord[]
projectData.states(): readonly PublicRpgRecord[]
projectData.animations(): readonly PublicRpgRecord[]
projectData.commonEvents(): readonly PublicRpgRecord[]
projectData.records(kind: PublicRecordKind): readonly PublicRpgRecord[]
projectData.getRecord(kind, id): PublicRpgRecord | null

projectData.switchNames(): readonly string[]
projectData.variableNames(): readonly string[]
projectData.maps(): ReadonlyArray<{ id, name, parentId, order }>
```

`PublicRpgRecord = { id, name, iconName? }`. `PublicRecordKind = "actor" | "class"
| "skill" | "item" | "weapon" | "armor" | "enemy" | "troop" | "state" |
"animation" | "common_event"`.

```ts
// Example — find all common events whose name starts with "boss_"
const boss = ctx.projectData.commonEvents().filter((c) => c.name.startsWith("boss_"));
```

---

## Manifest: `pluginDependencies`

Mods can declare dependencies on Essentials plugins (Ruby, installed in
`<gameRoot>/Plugins/*/meta.txt`) via the optional `pluginDependencies` array
in `manifest.json`:

```json
{
  "pluginDependencies": [
    { "name": "My Plugin" },
    { "name": "Other Plugin", "url": "https://example.com/other" },
    { "name": "Strict Plugin", "enforcement": "pluginAndVersion", "version": "1.2.0" },
    { "name": "Optional Plugin", "enforcement": "none", "url": "https://example.com/opt" }
  ]
}
```

```ts
interface PluginDependency {
  /** Plugin name as it appears in meta.txt's Name field. */
  name: string;
  /** URL where the plugin can be found/downloaded (shown in warnings). */
  url?: string;
  /**
   * How strictly to enforce this dependency.
   * - "plugin" (default) — block if the plugin is missing; ignore version.
   * - "pluginAndVersion" — block if missing OR version doesn't satisfy versionCheck.
   * - "none" — never block, only warn.
   */
  enforcement?: "plugin" | "pluginAndVersion" | "none";
  /**
   * Required plugin version (semver). Only checked when enforcement is
   * "pluginAndVersion". Setting enforcement to "pluginAndVersion" without
   * a version is a ManifestError.
   */
  version?: string;
  /**
   * How to compare installed version against version. Default: "greaterOrEqual".
   * - "greaterOrEqual" — installed >= required
   * - "exact"          — installed == required
   * - "compatible"     — same major, installed minor.patch >= required
   */
  versionCheck?: "greaterOrEqual" | "exact" | "compatible";
}
```

**Behaviour at load time:**

- **v21+ projects** (Plugins/ directory exists): the editor scans
  `Plugins/*/meta.txt` and checks each declared dependency according to its
  `enforcement` setting:
  - `"plugin"` (default): blocks the mod if the plugin is missing; version is
    ignored.
  - `"pluginAndVersion"`: blocks the mod if the plugin is missing or its
    installed version does not satisfy the `versionCheck` comparison against
    `version`. Setting this without a `version` is a `ManifestError`.
  - `"none"`: never blocks the mod; the editor only logs a warning.
- **v16 / BES v5 projects** (no Plugins/ directory): the editor logs a console
  warning but loads the mod anyway, since plugin presence cannot be verified.

The version comparison uses simple semver major.minor.patch (pre-release
suffixes are ignored). The `versionCheck` field controls the comparison
operator: `"greaterOrEqual"` (default, installed >= required), `"exact"`
(installed == required), or `"compatible"` (same major, installed
minor.patch >= required).

In the Mod Manager's expanded detail view, plugin dependencies are listed with
clickable links (if `url` is provided), the enforcement level, and the version
requirement (when applicable).

---

## Direct Tauri Access

Mods run in the same web context as the editor. When `withGlobalTauri`
is enabled (it is by default), `window.__TAURI__.core.invoke` is
available for calling any registered Tauri command — including ones not
exposed through the `ctx` API.

```js
const invoke = window.__TAURI__.core.invoke;

// Call any registered Tauri command
const bytes = await invoke("read_binary_file", { path: "/path/to/file" });
```

This is useful when a mod needs capabilities beyond what `ctx` provides.
See [Available Tauri Commands](#available-tauri-commands-for-mods) below.

---

## Available Tauri Commands for Mods

These general-purpose Rust commands can be called via
`window.__TAURI__.core.invoke`. They complement the scoped `ctx.fs` API
with binary and file-management operations.

### File I/O

| Command | Args | Returns | Purpose |
|---------|------|---------|---------|
| `read_text_file` | `path` | `string` | Read file as text |
| `write_text_file` | `path, content` | `void` | Write text file |
| `read_binary_file` | `path` | `number[]` | Read file as raw bytes |
| `write_binary_file` | `path, data` | `void` | Write raw bytes |

### File Management

| Command | Args | Returns | Purpose |
|---------|------|---------|---------|
| `list_directory` | `path` | `FileEntry[]` | List directory entries. Each entry: `{ name, path, isFile, isDir, size }` |
| `file_exists` | `path` | `boolean` | Check if a file or directory exists |
| `copy_file` | `src, dst` | `void` | Copy file (creates parent dirs) |
| `rename_file` | `oldPath, newPath` | `void` | Rename or move a file (creates parent dirs) |
| `delete_file` | `path` | `void` | Delete a single file (refuses directories) |

### Image

| Command | Args | Returns | Purpose |
|---------|------|---------|---------|
| `get_image_dimensions` | `path` | `[width, height]` | Get image dimensions without full decode |
| `get_tileset_image` | `gameRoot, tilesetName` | `number[]` (PNG) | Get tileset image as PNG bytes |
| `get_tileset_info` | `gameRoot, tilesetName` | `[w, h]` | Tileset image dimensions |
| `list_autotile_files` | `gameRoot` | `string[]` | List autotile names in Graphics/Autotiles/ |
| `list_tileset_files` | `gameRoot` | `string[]` | List tileset image names in Graphics/Tilesets/ |
| `list_character_files` | `gameRoot` | `string[]` | List character sheet names |
| `clear_image_cache` | — | `void` | Clear the Rust-side image cache |

### Tileset Management

| Command | Args | Returns | Purpose |
|---------|------|---------|---------|
| `create_tileset` | `gameRoot, name, tilesetName` | `u32` | Create blank tileset in first nil slot. Returns new tileset ID |
| `delete_tileset` | `gameRoot, tilesetId` | `void` | Set tileset slot to nil in Tilesets.rxdata |
| `update_tileset_name_graphic` | `gameRoot, tilesetId, name, tilesetName` | `void` | Patch @name/@tileset_name on a tileset |
| `save_tileset_properties` | `gameRoot, tilesetId, passages, priorities, terrainTags` | `void` | Patch passage/priority/terrain arrays |
| `save_expanded_autotiles` | `gameRoot, tilesetId, expandedAutotiles` | `void` | Patch @expanded_autotiles JSON |

### Dialog

| Command | Args | Returns | Purpose |
|---------|------|---------|---------|
| `plugin:dialog\|open` | `{ options: { title?, filters?, multiple?, directory? } }` | `string \| null` | Native file/folder picker |
| `plugin:dialog\|save` | `{ options: { defaultPath?, filters? } }` | `string \| null` | Native save-file picker |

> **Note**: `plugin:dialog|open` / `plugin:dialog|save` are Tauri dialog plugin commands — the "plugin" prefix is Tauri's naming, not the editor's mod system.

### Discord Rich Presence

| Command | Args | Returns | Purpose |
|---------|------|---------|---------|
| `discord_rpc_connect` | `appId: string` | `void` | Connect to Discord IPC with your Discord Application ID |
| `discord_rpc_update` | `details?, stateText?, largeImage?, largeText?, smallImage?, smallText?, startTimestamp?` | `void` | Set Discord rich presence activity |
| `discord_rpc_clear` | — | `void` | Clear presence (keep connection open) |
| `discord_rpc_disconnect` | — | `void` | Close Discord IPC connection |

These commands wrap the `discord-rich-presence` Rust crate. Connection is managed by the editor backend and cleaned up automatically when the app exits.

Image assets (`largeImage`, `smallImage`) must be uploaded in the [Discord Developer Portal](https://discord.com/developers/applications) under Rich Presence → Art Assets. The key passed (e.g. `"icon"`) must match the uploaded asset name.

---

## `shadow`

```ts
shadow.list(mapId): { id, name, visible }[]
shadow.setVisible(mapId, shadowId, visible): void
shadow.info(mapId, shadowId): { id, name, visible, opacity } | null
shadow.create(mapId, name?): { id, name }
shadow.delete(mapId, shadowId): void
shadow.setOpacity(mapId, shadowId, opacity: number): void
shadow.generateFromTiles(
  mapId,
  tiles: Array<{ x, y, tileId, tileData? }>,
  config?: { blurRadius?, offsetX?, offsetY?, color? }
): Promise<{ shadowId: number } | null>
```

`setOpacity` sets the opacity (0-255) of an existing shadow layer.
`generateFromTiles` programmatically generates a shadow image from an explicit tile list and appends it as a new shadow layer. Returns the new shadow id, or `null` if generation failed (e.g. tileset atlas not loaded).

---

## `fog`

```ts
fog.list(mapId): { id, name, visible }[]
fog.setVisible(mapId, fogId, visible): void
fog.info(mapId, fogId): { id, name, visible, opacity, config } | null
fog.create(mapId, name?): { id, name }
fog.delete(mapId, fogId): void
fog.setOpacity(mapId, fogId, opacity: number): void
fog.setConfig(mapId, fogId, config: Partial<PublicFogConfig>): void
```

`config` shape (`PublicFogConfig`): `{ graphicName, hue, blendType, zoom, sx, sy, followPlayer }`.

| Field           | Type      | Notes |
|-----------------|-----------|-------|
| `graphicName`   | `string`  | Filename in `Graphics/Fogs/` (no extension). |
| `hue`           | `number`  | 0-360. |
| `blendType`     | `number`  | 0=normal, 1=add, 2=subtract, 3=multiply. |
| `zoom`          | `number`  | Scale factor (0.1-8.0). |
| `sx`            | `number`  | Horizontal scroll speed (px/frame). Positive = right. |
| `sy`            | `number`  | Vertical scroll speed (px/frame). Positive = down. |
| `followPlayer`  | `boolean` | `true` = screen-locked, `false` = world-anchored. |

`setConfig` merges partial config into the existing config. New fog layers default to opacity 51 (20%) and empty graphic.

---

## `events`

```ts
events.list(mapId): PublicEvent[]
events.get(mapId, eventId): PublicEvent | null
events.create(mapId, x, y, name?): number | null
events.delete(mapId, eventId): void
events.move(mapId, eventId, x, y): void
events.rename(mapId, eventId, name): void
events.getFull(mapId, eventId): PublicEventFull | null
events.update(mapId, event: PublicEventFull): void
```

`PublicEvent = { id, name, x, y, pages?, trigger? }`. `pages` is the event
page count. `trigger` is the first page trigger type (0=action, 1=player_touch,
2=event_touch, 3=autorun, 4=parallel).

`create` adds a new event at the given position, returns the event ID.
`delete`, `move`, and `rename` modify existing events. All changes are undoable.

```ts
events.commandSchemas(): PublicCommandSchema[]
events.getCommandSchema(code: number): PublicCommandSchema | null
events.createCommand(code: number, params?: unknown[]): { code, indent, parameters }
events.validateEvent(event: PublicEventFull): { valid: boolean; errors: string[] }
events.registerCommand(def: ModCommandDef): Disposable
```

`commandSchemas()` returns all known RMXP event command schemas (code, name, category, defaultParams).
`getCommandSchema(code)` looks up a single schema by code (returns `null` for unknown codes).
`createCommand(code)` builds a valid command struct with default parameters — use when inserting commands into event pages.
`validateEvent` checks that all command codes in an event's pages are known. Use before calling `events.update`.

### `events.registerCommand(def)` — custom event commands

Register a brand-new event command that map makers can insert from the
event-command picker. Your command appears on a dedicated **mod page** in the
picker (puzzle-icon tabs `🧩1`, `🧩2`, … after the built-in `1 2 3`, 24 commands per page) and
edits through a native declarative form. The form is a **builder for a Script
command**: filling it in generates plain Ruby that the engine runs directly —
there is no runtime dispatcher.

```ts
events.registerCommand(def: ModCommandDef): Disposable
```

```ts
interface ModCommandDef {
  id: string;                              // unique within your mod, e.g. "cameraScrollTo"
  name: string;                            // shown in the picker + command list
  page?: string;                           // reserved (per-mod page titles)
  fields?: ModCommandField[];              // omit → freeform script textarea (params.script)
  script?: (params: ModCommandParams) => string;  // the Ruby stored & run in-game
  parse?: (scriptText: string) => ModCommandParams | null;  // recover params to re-edit
  summary?: (params: ModCommandParams) => string; // one-line label in the command list
}
```

The registry key is `"<modId>:<id>"`. Duplicate keys are skipped (first wins).
The returned `Disposable` unregisters the command; it is also auto-removed when
your mod unloads.

**Declarative fields** (`def.fields`) render with the editor's own controls and
selectors, so the dialog matches the built-in command dialogs. Each field's
`key` becomes a property on the `params` object passed to `script`, `parse`, and
`summary`. Any field may set `disabled: (params) => boolean` to grey its control
out, or `hidden: (params) => boolean` to remove it entirely, conditionally.

| `type`     | Renders | Stored value |
|------------|---------|--------------|
| `number`   | number box (`min`/`max`/`step`) | `number` |
| `text`     | text input | `string` |
| `select`   | dropdown from `options: { value, label }[]` | `number` |
| `checkbox` | checkbox | `boolean` |
| `switch`   | switch picker | switch id (`number`) |
| `variable` | variable picker | variable id (`number`) |
| `coordinate` | Transfer-Player-style tile input: a **Source** dropdown — *Direct appointment* (map-dialog picker **+** editable X/Y) or *Appoint with variables* (X/Y variable pickers). `showMapSelector?` adds the Map ID dimension + map tree | `{ mode, mapId, x, y, varMapId, varX, varY }` |
| `record`   | record picker (`recordKind`: actor/class/skill/item/weapon/armor/enemy/troop/state/animation/common_event) | record id (`number`) |
| `event`    | event picker (`includePlayer?`/`includeThisEvent?`) | event id (`number`) |
| `graphic`  | graphic browser under `Graphics/<subfolder>/` (`showHue?`) | filename (`string`) |
| `audio`    | audio browser (`category`: BGM/BGS/ME/SE) | `{ name, volume, pitch }` |

Omitting `fields` gives a freeform script command: the editor shows a single
script textarea bound to `params.script`.

```js
const off = ctx.events.registerCommand({
  id: "cameraScrollTo",
  name: "Camera Scroll To",
  fields: [
    { type: "coordinate", key: "target", label: "Target tile", showMapSelector: true },
    { type: "checkbox", key: "useSpeed", label: "Set speed" },
    { type: "number", key: "speed", label: "Speed", min: 1, default: 4, hidden: (p) => !p.useSpeed },
  ],
  script: (p) => {
    const t = p.target || {};
    const cx = t.mode === "variable" ? `$game_variables[${t.varX | 0}]` : (t.x | 0);
    const cy = t.mode === "variable" ? `$game_variables[${t.varY | 0}]` : (t.y | 0);
    const args = [cx, cy];
    if (p.useSpeed) args.push(p.speed | 0);
    return `pbCameraScrollTo(${args.join(", ")})`;
  },
  parse: (text) => {
    const m = /^pbCameraScrollTo\(\s*(-?\d+)\s*,\s*(-?\d+)\s*(?:,\s*(\d+)\s*)?\)$/.exec(text.trim());
    return m ? { target: { mode: "direct", mapId: 0, x: +m[1], y: +m[2], varMapId: 1, varX: 1, varY: 1 },
                 useSpeed: m[3] != null, speed: m[3] != null ? +m[3] : 4 } : null;
  },
  summary: (p) => `(${p.target?.x ?? 0}, ${p.target?.y ?? 0})`,
});
// off.dispose() to remove it early.
```

**How it round-trips & runs.** A mod command is stored as an ordinary RMXP
Script command (code 355) whose `parameters[0]` is exactly the string your
`script(params)` returns, e.g. `pbCameraScrollTo(0, -4)`. That keeps the map's
`.rxdata` round-tripping unchanged, passes `validateEvent`, and runs in-game like
any other event script — **no plugin code or handler is required**. `parse`
recognises a stored script so the command keeps its name in the list and reopens
its form (provide it for re-editability; without it, an inserted command becomes
an ordinary Script command once the dialog closes).

**Limitations**: values the generated script can't carry back (e.g. a picked
`coordinate` `mapId`, or whether a literal coordinate was *picked* vs *typed*)
reset on reopen; there is no imperative custom-render field type yet.

---

## `tools.registerTool(def)`

```ts
ctx.tools.registerTool({
  id: "my.tool",
  label: "My Tool",
  icon: "★",
  onActivate() { /* selected from toolbar */ },
  onDeactivate() { /* user switched away */ },
  onPointerDown(ev) { /* ... */ },
  onPointerMove(ev) { /* ... */ },
  onPointerUp(ev) { /* ... */ },
});
```

Returns a `Disposable` you can `dispose()` to unregister early. Otherwise the
tool is removed automatically when the mod unloads.

---

## `menu.registerMenuItem(def)`

```ts
ctx.menu.registerMenuItem({
  menu: "Mods",          // any existing or new top-level menu
  label: "Do Something",
  shortcut: "Ctrl+Shift+D", // hint only — register the binding separately
  handler: () => { /* ... */ },
  isEnabled: () => true,
  isChecked: () => false,
});
```

If `menu` matches an existing top-level (`"Project"`, `"Edit"`, `"View"`,
`"Tools"`, `"Mods"`, `"About"`), the item is appended to it. If it matches
a submenu label within a top-level menu (e.g. `"Import & Export Maps"`),
the item is inserted there. Otherwise a new top-level menu is created with
that label.

---

## `commands.register / .execute`

```ts
ctx.commands.register("mymod.export.xml", async (mapId) => {
  // ...
});

await ctx.commands.execute("mymod.export.xml", 1);
```

Use commands when one mod wants to invoke functionality from another.
Command ids are global — namespace them with your mod id.

---

## `ui`

```ts
ctx.ui.registerPanel({
  id: "mymod.tilestats",
  title: "Tile Stats",
  defaultPosition: "right",
  showInMenu: true,    // default true; set false to hide from Mods menu
  icon: "📊",          // optional: SVG markup or unicode glyph
  render(host) {
    host.innerHTML = "<h2>Hello panel</h2>";
    return () => { /* optional cleanup */ };
  },
});

ctx.ui.openPanel("mymod.tilestats");
ctx.ui.closePanel("mymod.tilestats");
ctx.ui.isPanelOpen("mymod.tilestats"); // → boolean

const value = await ctx.ui.showInputDialog({
  title: "Rename",
  message: "Enter new name:",
  defaultValue: "old name",
});
// value is string or null (cancelled)

ctx.ui.showContextMenu(400, 300, [
  { label: "Action 1", action: () => { ... } },
  { label: "", separator: true },
  { label: "Disabled", disabled: true },
  { label: "Submenu", submenu: [
    { label: "Sub-action", action: () => { ... } },
  ]},
]);

const ok = await ctx.ui.showConfirmDialog({ title: "Confirm", message: "Sure?" });
ctx.ui.showToast({ message: "Done", level: "info" });
```

`render(host)` is a vanilla DOM callback — use any framework you want
inside, or no framework. Return a cleanup function if you need it.

`openPanel(panelId)` opens a previously registered panel. `closePanel` closes
it. `isPanelOpen` checks visibility. `showInMenu: false` hides the auto-entry
from the Mods menu (use with your own `registerMenuItem` instead).

`showInputDialog` shows a text input dialog — returns the entered string or
null if cancelled. `showContextMenu` displays a native context menu at the
given screen coordinates with labels, actions, separators, and submenus.

### Theming & CSS variables

Panels (`registerPanel`) and custom dialogs (`showCustomDialog`) render into the
editor's own DOM — not an iframe or shadow root. The editor sets its theme
variables on the `<html>` element, so **they cascade into your UI**. Reference
them with `var(--name)` instead of hardcoding colors, and your panel matches the
app and flips automatically when the user toggles light/dark.

```js
ctx.ui.registerPanel({
  id: "mymod.panel",
  title: "My Panel",
  render(host) {
    host.innerHTML = `
      <div style="
        padding: 8px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 13px;">
        <div style="
          font-weight: 600; text-transform: uppercase; font-size: 11px;
          color: var(--text-tertiary); margin-bottom: 6px;">Header</div>
        <button style="
          padding: 4px 10px; border-radius: 4px; cursor: pointer;
          border: 1px solid var(--border);
          background: var(--accent); color: var(--accent-text);">OK</button>
        <button style="
          padding: 4px 10px; border-radius: 4px; cursor: pointer;
          border: 1px solid var(--danger); background: transparent;
          color: var(--danger);">Delete</button>
      </div>`;
  },
});
```

Stable palette (same names in both themes — values differ per active theme):

| Variable | Role |
|----------|------|
| `--bg-primary`    | Main panel background |
| `--bg-secondary`  | Sidebar / inset background |
| `--bg-tertiary`   | Headers, toolbars, raised controls |
| `--bg-hover`      | Hover-state background |
| `--input-bg`      | Form input background |
| `--border`        | Borders and dividers |
| `--text-primary`  | Primary text |
| `--text-secondary`| Labels / secondary text |
| `--text-tertiary` | Muted / placeholder text |
| `--accent`        | Accent / primary-action color |
| `--accent-hover`  | Accent hover |
| `--accent-muted`  | Translucent accent (subtle fills, highlights) |
| `--accent-text`   | Text on an accent background |
| `--danger`        | Destructive / error |
| `--warning`       | Warning |
| `--highlight`     | Selection / emphasis |
| `--success`, `--success-hover`, `--success-border` | Success states |
| `--shadow`        | Drop-shadow color (rgba) |
| `--canvas-bg`     | Map canvas backdrop |

The body font is inherited too — set `font-family: inherit` (13px base) to match.

Notes:
- Treat the names above as the **public** palette. Other variables exist
  (`--ec-*` event-command syntax colors, `--dv-*` Dockview tab tokens,
  `--tile-preview-*`) but are internal and may change — don't depend on them,
  and don't override the `--dv-*` tokens.
- CSS variables only apply to **DOM**. Canvas overlays (`registerOverlay` /
  `registerAdvancedOverlay`) draw with a `CanvasRenderingContext2D` where
  `var(--…)` does nothing — branch on `ctx.editor.theme()` for a literal color,
  or read one with
  `getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()`.

### Context menu registration

```ts
ctx.ui.registerContextMenuItem({
  context: "map-tile",  // "map-tile" | "map-event" | "tile-palette" | "tile-palette-extra" | "layer" | "map-tree" | "event-editor"
  label: "My Action",
  handler: (info) => { /* info has mapId, tileX, tileY, tileId, layerIndex, etc. */ },
  isEnabled: (info) => true,  // optional
  parentMenu: "Export Map…",  // optional — nest inside an existing submenu
});
```

Injects menu items into any of 7 editor right-click menus. The `info` object
contains context-specific data (tile coords, event id, layer name, etc.).

Set `parentMenu` to an existing submenu label (e.g. `"Export Map…"` in the
map-tree context menu) to nest your item inside that submenu instead of
appending it at the top level. If no matching submenu is found, the item
is appended at the top level as a fallback.

### Overlay rendering

```ts
ctx.ui.registerOverlay({
  id: "mymod.highlight",
  zOrder: 0,  // higher = on top
  render(ctx, info) {
    // ctx = CanvasRenderingContext2D
    // info = { mapId, tileSize, zoom, viewportX, viewportY, canvasWidth, canvasHeight }
    ctx.fillStyle = "rgba(255,0,0,0.3)";
    ctx.fillRect(x, y, w, h);
  },
});
```

Renders custom overlays on the map canvas after tiles/events, before UI overlays.
Multiple overlays sorted by `zOrder`.

### Keyboard shortcuts

```ts
ctx.ui.registerShortcut("Ctrl+Shift+F", () => {
  // handle shortcut
});
```

Register global keyboard shortcuts. Key format: `"Ctrl+Shift+F"`, `"Alt+G"`, etc.
Mod shortcuts take priority over built-in shortcuts.

### Additional dialogs and pickers

```ts
ctx.ui.showColorPicker(opts?: { title?, initial?: string }): Promise<string | null>
ctx.ui.showFilePicker(opts?: { directory?, multiple?, filters? }): Promise<string[] | null>
ctx.ui.showSavePicker(opts?: { defaultPath?, filters? }): Promise<string | null>
ctx.ui.confirmDestructive(opts: { title, message, confirmLabel? }): Promise<boolean>
```

`showColorPicker` opens a native color picker; returns hex string (e.g. `"#ff0000"`) or `null` if dismissed.
`showFilePicker` wraps the Tauri file-open dialog; returns array of paths or `null`.
`showSavePicker` wraps the Tauri save dialog; returns path or `null`.
`confirmDestructive` is `showConfirmDialog` with a red confirm button — use for irreversible operations.

### Custom dialogs

```ts
const { close } = ctx.ui.showCustomDialog({
  title: "My Dialog",
  width: "460px",        // optional
  height: "400px",       // optional
  zIndex: 5000,          // optional
  render(body) {
    // body is an HTMLElement — append your UI
    const btn = document.createElement("button");
    btn.textContent = "Close";
    btn.addEventListener("click", () => close());
    body.appendChild(btn);

    // Return cleanup function (optional)
    return () => { /* teardown */ };
  },
});
```

Opens a styled modal dialog using the editor's standard shell (overlay, draggable
header with title + close button, scrollable body). The `render` callback receives
the body element — append any DOM content. Returns `{ close }` to close programmatically.

### Advanced overlay

```ts
ctx.ui.registerAdvancedOverlay({
  id: "mymod.overlay",
  zOrder: 0,
  render(ctx, info) {
    // info.animFrame — coarse frame counter for animation
    ctx.fillStyle = "rgba(255,0,0,0.3)";
    ctx.fillRect(x, y, w, h);
  },
}): Disposable
```

Like `registerOverlay` but `info` includes `animFrame` for animation-aware rendering.

### Status bar and toolbar (registry — rendering coming soon)

```ts
ctx.ui.registerStatusBarItem({ id, render(host), align?: "left"|"right" }): Disposable
ctx.ui.registerToolbarButton({ id, icon, tooltip, handler, isActive? }): Disposable
```

Registers a status bar segment or toolbar button contributed by the mod. Both are removed automatically on mod unload.

### Opening URLs

```ts
await ctx.ui.openUrl("https://example.com");
```

Opens a URL in the user's default browser. The editor shows a confirmation dialog first (with the URL displayed in a monospace box) — the user must click "Open Link" to proceed. Returns immediately if cancelled.

---

## `keybinds`

```ts
keybinds.list(): KeybindInfo[]
keybinds.get(actionId: string): KeybindInfo | null
keybinds.set(actionId: string, key: string): string | null
keybinds.reset(actionId: string): void
keybinds.onChanged(cb: (actionId, oldKey, newKey) => void): Disposable
```

Query and modify the editor's keyboard shortcuts. `KeybindInfo` contains `actionId`, `label`, `category`, `key`, `defaultKey`, and `isCustom`.

`set` returns the conflicting action ID if the key is already bound, or `null` on success. The key format uses normalized notation: `"ctrl+s"`, `"ctrl+shift+s"`, `"g"`, etc.

`onChanged` subscribes to any keybind change (from the settings dialog or other mods). Returns a `Disposable`.

Built-in action IDs include: `tool.brush`, `tool.eraser`, `tool.fill`, `tool.rectangle`, `tool.eyedropper`, `tool.select`, `tool.pan`, `view.toggleGrid`, `view.toggleCollision`, `view.toggleDim`, `brush.sizeUp`, `brush.sizeDown`, `brush.rotateCW`, `brush.rotateCCW`, `zoom.in`, `zoom.out`, `layer.select1`–`layer.select9`, `edit.save`, `edit.saveAll`, `edit.saveShadow`, `edit.undo`, `edit.redo`, `edit.selectAll`, `edit.deselect`, `edit.copy`, `edit.paste`, `edit.cut`, `app.runGame`, `dev.toggleDevTools`. Call `ctx.keybinds.list()` for the full set.

### Lifecycle

```ts
ctx.lifecycle.onUndo(fn: (mapId, label) => void): Disposable
ctx.lifecycle.onRedo(fn: (mapId, label) => void): Disposable
ctx.lifecycle.onBrushChange(fn: (props) => void): Disposable
ctx.lifecycle.onTilesetChange(fn: (tilesetId, reason) => void): Disposable
```

Convenience wrappers around `bus.on("undo")`, `bus.on("redo")`, `bus.on("brush.changed")`, `bus.on("tileset.changed")`.

---

## `bus`

```ts
const sub = ctx.bus.on("map.tile.changed", (e) => { ... });
sub.dispose();   // optional — happens automatically on unload

ctx.bus.emit("mod.loaded", { id: "..." });   // editor-level events
```

`save.before` is cancellable: return `{ cancel: true, reason: "..." }` to
abort the save.

See [events-reference.md](./events-reference.md) for the full list.

---

## `fs`

```ts
// Mod folder operations
const txt = await ctx.fs.readModFile("data.txt");
await ctx.fs.writeModFile("output.txt", "hello");
const exists = await ctx.fs.exists("data.txt");
const entries = await ctx.fs.listDir("subfolder/");
await ctx.fs.mkdir("output/cache");

// Project folder operations
const projTxt = await ctx.fs.readProjectFile("Data/System.rxdata");
await ctx.fs.writeProjectFile("Data/custom.json", content);
const projExists = await ctx.fs.projectExists("Graphics/Tilesets/my_tile.png");
const projEntries = await ctx.fs.listProjectDir("Graphics/Tilesets/");
await ctx.fs.projectMkdir("Graphics/Custom");
```

Paths are normalized — absolute paths and `..` traversal raise
`PermissionDeniedError`.

`exists`/`listDir`/`mkdir` operate in the mod folder. `projectExists`/
`listProjectDir`/`projectMkdir` operate in the project (game) folder and
require `fs.project` or `fs.write.project` permissions.

---

## `storage`

```ts
await ctx.storage.set("counter", 1);
const v = await ctx.storage.get<number>("counter", 0);
```

Backed by `<modDir>/.storage.json`.

---

## `log`

```ts
ctx.log.info("hello", { foo: 1 });
ctx.log.warn(...);
ctx.log.error(err);
```

Visible in the Mod Manager log pane.

---

## `lifecycle`

```ts
ctx.lifecycle.onMapLoad((mapId) => { ... });
ctx.lifecycle.onSave((mapId) => { ... });
ctx.lifecycle.onActivate(() => { /* runs after activate() returns */ });
ctx.lifecycle.onDeactivate(() => { /* runs on mod unload */ });
ctx.lifecycle.onToolChange((toolId) => { ... });
ctx.lifecycle.onLayerChange((mapId, layerIndex) => { ... });
```

Convenience wrappers around `bus.on(...)` for common hooks.
`onToolChange` fires on `tool.activated`. `onLayerChange` fires on
`layer.changed` (visibility, opacity, added, removed, active).

---

## `stats`

Read editor usage statistics and define custom stats.

### Snapshot getters

```ts
const g = ctx.stats.global();          // GlobalStatsSnapshot
const p = ctx.stats.project();         // ProjectStatsSnapshot | null
const a = ctx.stats.all();             // CombinedStatsSnapshot { global, project }
```

`GlobalStatsSnapshot` fields: `totalActiveMinutes`, `totalTilesPlaced`, `totalUndoCount`, `totalRedoCount`, `totalMapsCreated`, `totalMapsSaved`, `totalSessions`, `firstLaunchDate`, `custom`.

`ProjectStatsSnapshot` fields: `activeMinutes`, `tilesPlaced`, `undoCount`, `redoCount`, `mapsCreated`, `mapsSaved`, `mapEdits`, `sessionCount`, `firstOpened`, `custom`.

### Single-stat getters

```ts
const tiles = ctx.stats.getGlobalStat("totalTilesPlaced");  // number | string
const pTiles = ctx.stats.getProjectStat("tilesPlaced");      // number | string | null
```

### Custom stats

Mods can define arbitrary numeric stats that persist alongside built-in stats:

```ts
// Read
const v = ctx.stats.getCustomGlobal("my_counter", 0);
const pv = ctx.stats.getCustomProject("my_project_counter", 0);

// Write
ctx.stats.setCustomGlobal("my_counter", 42);
ctx.stats.setCustomProject("my_project_counter", 10);

// Increment (returns new value)
const newV = ctx.stats.incrementCustomGlobal("my_counter");       // +1
const newP = ctx.stats.incrementCustomProject("my_counter", 5);   // +5
```

Custom stats appear in the Stats dialog under a "Custom" section.
Project custom stats are per-project; global custom stats are shared across all projects.

### Stat metadata

Mods can register display metadata for custom stats so they appear with a name,
description, and category in the Stats dialog:

```ts
ctx.stats.registerStat({
  id: "achievements_unlocked",        // matches the key used in setCustomGlobal/setCustomProject
  name: "Achievements Unlocked",      // display name shown in the Stats dialog
  description: "Total achievements unlocked across all projects", // shown on hover
  category: "Achievements",           // section header in the Stats dialog
  scope: "global",                    // "global" or "project"
  format: "number",                   // optional: "number" (default) | "time" | "date"
});
```

Stats with the same category are grouped under a single heading. Built-in stats use
"Project" and "Global" categories. Mods can reuse these or create custom categories.

### Subscription

```ts
ctx.stats.onStatsChanged((global, project) => {
  // Fires ~every 60s with fresh snapshots
});
```
