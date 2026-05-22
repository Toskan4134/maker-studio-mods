# API Changelog

The mod API follows [semver](https://semver.org):

- **Major** — breaking changes. Existing mods targeting the previous major version are routed through a compatibility shim. If no shim exists, the mod is refused with a clear error in the Mod Manager.
- **Minor** — additive changes (new optional fields, new event names, new context methods). Old mods keep working without changes.
- **Patch** — internal-only fixes; no observable changes.

When a major bump happens, this file gets a section with the new shape and a link to a migration guide.

---

## v1.0.0 — Initial Release

First public API. Includes the full modding surface for the 1.0 release.

### Additions since initial release

- **`ctx.events.registerCommand(def): Disposable`** — register a custom RMXP
  event command. It appears on a dedicated puzzle-icon mod page (`🧩1`, `🧩2`, …; 24 per page)
  in the event-command picker and edits through a native declarative form
  (`ModCommandDef` / `ModCommandField` / `ModCommandParams` / `CoordinateValue`
  types). The form builds a plain code-355 Script command from `def.script(params)`
  that runs in-game directly — no dispatcher — and `def.parse` recovers params so
  it stays re-editable. Field types: `number`, `text`, `select`, `checkbox`,
  `switch`, `variable`, `coordinate` (Transfer-Player Direct/Variables source),
  `record` (`recordKind`), `event`, `graphic` (`subfolder`), `audio` (`category`);
  any field can set `disabled` / `hidden` predicates `(params) => boolean`.
  Omitting `fields` gives a freeform script textarea. Mod commands can be
  favourited (the ★ tab tracks them by registry key). Additive, non-breaking.
- **`ctx.selectors`** — Promise-based modal pickers that mount the editor's stock selector dialogs. Methods: `pickActor`, `pickClass`, `pickSkill`, `pickItem`, `pickWeapon`, `pickArmor`, `pickEnemy`, `pickTroop`, `pickState`, `pickAnimation`, `pickCommonEvent`, `pickEntity`, `pickSwitch`, `pickVariable`, `pickMap`, `pickEvent`, `pickTileset`, `pickAudio`, `pickGraphic`, `pickKeyboardButton`. Each resolves to the picked value or `null` on cancel. Additive, non-breaking.
- **`ctx.projectData`** — Read-only access to project-wide RPG record lists (actors, classes, skills, items, weapons, armors, enemies, troops, states, animations, common events) plus switch/variable name arrays and the map info list. Additive, non-breaking.
- **`PublicRpgRecord`, `PublicRecordKind`, `EntityPickResult`, `AudioPickResult`, `GraphicPickResult`, `KeyboardButtonPickResult`, `SelectorExtra`, `SelectorOpts`, `AudioCategory`, `SelectorsCtx`, `ProjectDataCtx` interfaces** — exported from `src/mod-api/types.ts` for type-safe consumers.
- **New selector components** — `MapSelector` (project map tree picker) and `TilesetSelector` (tileset picker) added to the React component library and surfaced via `ctx.selectors.pickMap` / `pickTileset`.
- **`ctx.ui.openUrl(url)`** — Opens a URL in the user's default browser after showing a confirmation dialog. Additive, non-breaking.
- **Manifest `url` field** — Optional string. Displayed as a clickable link on the author name in the Mod Manager. Shows the same confirmation dialog before opening.
- **`ctx.keybinds`** — Query and modify keyboard shortcuts. Methods: `list()`, `get(actionId)`, `set(actionId, key)`, `reset(actionId)`, `onChanged(cb)`. Fires `"keybind.changed"` event.
- **`"keybind.changed"` event** — `{ actionId, oldKey, newKey }`. Fired when any keybind changes.
- **`KeybindInfo` interface** — `{ actionId, label, category, key, defaultKey, isCustom }`. Returned by `ctx.keybinds.list()` and `ctx.keybinds.get()`.

### Core context

The `ctx` argument passed to `activate(ctx)` provides:

| Field        | Purpose |
|--------------|---------|
| `apiVersion` | Echoes the editor's API version |
| `manifest`   | This mod's manifest |
| `editor`     | Active map / layer / tool / brush / viewport / view options state |
| `map`        | Read and write tiles, query layers, selection, CRUD maps, undo grouping |
| `tileset`    | Tileset images, tile properties, create/delete tilesets |
| `shadow`     | Shadow layer list, visibility, CRUD, setOpacity, generateFromTiles |
| `fog`        | Fog layer list, visibility, CRUD, setOpacity, setConfig |
| `events`     | RMXP-style events: list, get, getFull, create, delete, move, rename, update |
| `tools`      | Register custom editing tools |
| `menu`       | Add menu items (with isChecked, isEnabled) |
| `commands`   | Cross-mod command registry |
| `ui`         | Panels, dialogs, toasts, overlays, context menus, shortcuts |
| `bus`        | Subscribe to / emit events |
| `fs`         | Path-scoped filesystem (mod folder + project folder) |
| `storage`    | Per-mod persistent K/V |
| `log`        | Namespaced logger |
| `lifecycle`  | Activation hooks (onMapLoad, onSave, onActivate, onDeactivate, onToolChange, onLayerChange) |
| `stats`      | Editor usage statistics (global + per-project), single-stat getters, custom stats (get/set/increment), combined snapshots |
| `keybinds`   | Query and modify keyboard shortcuts, listen for changes |
| `selectors`  | Modal pickers (actor, class, skill, item, weapon, armor, enemy, troop, state, animation, common event, switch, variable, event, map, tileset, audio, graphic, keyboard button) |
| `projectData`| Read-only RPG record lists (actors, items, classes, …) plus switch/variable names and map info |

### Editor accessors

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
editor.theme(): "dark" | "light"
editor.animationFrame(): number
editor.requestRedraw(): void
editor.setStatusBarText(text: string | null): void
editor.recentMaps(): number[]
editor.projectName(): string | null
```

### Map operations

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
map.transformSelection(mapId, opts: SelectionTransformOpts): void
map.recalculateAutotiles(mapId, layerIndex, tiles: Array<{x, y}>): void
map.getNativeTileProperties(mapId, layer, x, y): NativeTileProps | null
map.setNativeTileProperties(mapId, layer, x, y, props: Partial<NativeTileProps>): void
map.getClipboard(): PublicClipboardData | null
map.setClipboard(data: PublicClipboardData): void
map.createUndoScope(mapId, label): UndoScope
```

### Tileset operations

```ts
tileset.getImageBlobUrl(tilesetId): Promise<string | null>
tileset.getTileProperties(tilesetId, tileId): { passage, priority, terrainTag } | null
tileset.list(): Array<{ id, name, tilesetName }>
tileset.info(tilesetId): { id, name, tilesetName, autotileNames, panoramaName, fogName, battlebackName } | null
tileset.setTileProperties(tilesetId, tileId, { passage?, priority?, terrainTag? }): Promise<void>
tileset.currentId(): number | null
tileset.current(): { id, name, tilesetName, autotileNames, panoramaName, fogName, battlebackName } | null
tileset.mapTilesetId(mapId): number | null
tileset.transformTileProperties(tilesetId, tileId, transform: { rotation?, flipH?, flipV? }): { passage, priority, terrainTag }
tileset.resolveTileProperties(tileId, tilesetId?): { passage, priority, terrainTag } | null
```

### Shadow operations

```ts
shadow.list(mapId): { id, name, visible }[]
shadow.setVisible(mapId, shadowId, visible): void
shadow.info(mapId, shadowId): { id, name, visible, opacity } | null
shadow.create(mapId, name?): { id, name }
shadow.delete(mapId, shadowId): void
shadow.setOpacity(mapId, shadowId, opacity: number): void
shadow.generateFromTiles(mapId, tiles: Array<{x, y, tileId, tileData?}>, config?): Promise<{ shadowId: number }>
```

### Stats operations

```ts
stats.global(): GlobalStatsSnapshot
stats.project(): ProjectStatsSnapshot | null
stats.all(): CombinedStatsSnapshot
stats.getGlobalStat(key: GlobalStatKey): number | string
stats.getProjectStat(key: ProjectStatKey): number | string | null
stats.getCustomGlobal(key, defaultValue?): number
stats.getCustomProject(key, defaultValue?): number
stats.setCustomGlobal(key, value): void
stats.setCustomProject(key, value): void
stats.incrementCustomGlobal(key, amount?): number
stats.incrementCustomProject(key, amount?): number
stats.registerStat(def: { id, name, description?, category, scope, format? }): void
stats.onStatsChanged(fn): Disposable
```

### Event operations

```ts
events.list(mapId): PublicEvent[]
events.get(mapId, eventId): PublicEvent | null
events.getFull(mapId, eventId): PublicEventFull | null
events.create(mapId, x, y, name?): number | null
events.delete(mapId, eventId): void
events.move(mapId, eventId, x, y): void
events.rename(mapId, eventId, name): void
events.update(mapId, event: PublicEventFull): void
events.commandSchemas(): PublicCommandSchema[]
events.getCommandSchema(code: number): PublicCommandSchema | null
events.createCommand(code: number, params?: unknown[]): PublicEventCommand
events.validateEvent(event: PublicEventFull): { valid: boolean; errors: string[] }
```

### Tools, menus, commands

- `ctx.tools.registerTool(def)` — custom editing tools with pointer events
- `ctx.menu.registerMenuItem(def)` — menu items with isEnabled, isChecked, submenu targeting
- `ctx.commands.register(id, handler)` / `ctx.commands.execute(id, ...)` — cross-mod commands

### UI

- `ctx.ui.registerPanel(def)` — dockable panels with vanilla DOM render
- `ctx.ui.openPanel(id)` / `closePanel(id)` / `isPanelOpen(id)`
- `ctx.ui.showConfirmDialog(opts)` / `showInputDialog(opts)` / `showCustomDialog(opts)` / `showToast(opts)`
- `ctx.ui.showContextMenu(x, y, items)` — native context menu with submenu support
- `ctx.ui.registerContextMenuItem(def)` — inject items into 7 editor right-click menus, optional `parentMenu` for submenu nesting
- `ctx.ui.registerOverlay(def)` — custom Canvas2D rendering on the map canvas (with zOrder)
- `ctx.ui.registerShortcut(key, handler)` — global keyboard shortcuts
- `ctx.ui.showColorPicker(opts?)` — native color picker, returns hex string or `null`
- `ctx.ui.showFilePicker(opts?)` — native file-open dialog
- `ctx.ui.showSavePicker(opts?)` — native save-file dialog
- `ctx.ui.confirmDestructive(opts)` — dialog with danger styling
- `ctx.ui.registerAdvancedOverlay(def)` — like `registerOverlay` but `info.animFrame` is provided
- `ctx.ui.registerStatusBarItem(def)` — contribute a status bar segment
- `ctx.ui.registerToolbarButton(def)` — contribute a toolbar button

### Filesystem

- `ctx.fs.readModFile(relPath)` / `writeModFile(relPath, content)` — mod folder
- `ctx.fs.readProjectFile(relPath)` / `writeProjectFile(relPath, content)` — project folder
- `ctx.fs.exists(relPath)` / `listDir(relPath)` / `mkdir(relPath)` — mod folder
- `ctx.fs.projectExists(relPath)` / `listProjectDir(relPath)` / `projectMkdir(relPath)` — project folder

### Storage

- `ctx.storage.set(key, value)` / `ctx.storage.get(key, defaultValue)` — per-mod K/V

### Logging

- `ctx.log.info(...)` / `ctx.log.warn(...)` / `ctx.log.error(...)`

### Lifecycle hooks

- `ctx.lifecycle.onMapLoad(fn)` / `onSave(fn)` / `onActivate(fn)` / `onDeactivate(fn)` / `onToolChange(fn)` / `onLayerChange(fn)`
- `ctx.lifecycle.onUndo(fn)` / `onRedo(fn)`
- `ctx.lifecycle.onBrushChange(fn)`
- `ctx.lifecycle.onTilesetChange(fn)`

### Events

25 stable events. See [events-reference.md](./events-reference.md) for the full list.
`save.before` and `paste.before` are cancellable.

### Direct Tauri access

Mods can call any registered Tauri command via `window.__TAURI__.core.invoke(...)`.
Available commands: file I/O, file management, image processing, tileset management, dialogs.
See [api-reference.md](./api-reference.md) for the full list.

### Backend commands

General-purpose Tauri commands callable via `window.__TAURI__.core.invoke`:

`read_text_file`, `write_text_file`, `read_binary_file`, `write_binary_file`, `list_directory`, `file_exists`, `copy_file`, `rename_file`, `delete_file`, `get_image_dimensions`, `get_tileset_image`, `get_tileset_info`, `list_autotile_files`, `list_tileset_files`, `list_character_files`, `clear_image_cache`, `create_tileset`, `delete_tileset`, `update_tileset_name_graphic`, `save_tileset_properties`, `save_expanded_autotiles`, `plugin:dialog|open`, `plugin:dialog|save`, `discord_rpc_connect`, `discord_rpc_update`, `discord_rpc_clear`, `discord_rpc_disconnect`

### Stability tests

CI runs the bundled example mods as smoke tests. Their snapshot of the `ModContext` shape is asserted on every PR — accidental changes to the contract surface fail the build.
