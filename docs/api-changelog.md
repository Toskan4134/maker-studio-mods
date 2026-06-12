# API Changelog

The mod API follows [semver](https://semver.org):

- **Major** — breaking changes. Existing mods targeting the previous major version are routed through a compatibility shim. If no shim exists, the mod is refused with a clear error in the Mod Manager.
- **Minor** — additive changes (new optional fields, new event names, new context methods). Old mods keep working without changes.
- **Patch** — internal-only fixes; no observable changes.

When a major bump happens, this file gets a section with the new shape and a link to a migration guide.

---

## v1.0.0 — Initial Release

First public API. Includes the full modding surface for the 1.0 release.

- **`ctx.panorama`** *(additive)* — multi-layer panoramas. Same `FogCtx` surface as `ctx.fog`
  (`list` / `setVisible` / `info` / `create` / `delete` / `setOpacity` / `setConfig`), operating on the
  **panorama** graphic layer group (drawn beneath the map tiles, in-game priority -1000; graphics from
  `Graphics/Panoramas/`). `create` defaults to opacity 255 + `parallax: 0.5`.
- **`ctx.layerGroups`** *(additive)* — mod-registered **custom graphic layer groups** with custom
  priorities (`LayerGroupsCtx`): `register(mapId, { key, name, priority, folder })` (key must not be
  `"fog"`/`"panorama"`; `folder` = a single `Graphics/` subfolder), `remove`, `list` (incl.
  `layerCount`), `setPriority`, `layers`, `addLayer`, `deleteLayer`, `updateLayer`. `priority` is the
  in-game Plane z — `< 0` renders beneath the tiles (panorama = -1000), `>= 0` above (fog = 3000).
  Groups persist per map inside `@extended_layers` (descriptor + layers), so the game renders them even
  without the mod installed, and they show as editable group rows in the editor's Layer panel.
  `LayerGroupDef` / `LayerGroupsCtx` exported from `src/mod-api/types.ts`.
- **`PublicFogConfig.parallax?: number`** *(additive)* — camera-follow factor for world-anchored layers
  (0..1, default 1): `1` = moves 1:1 with the map (classic fog), `0.5` = RMXP native panorama
  half-speed, `0` = screen-locked. Ignored while `followPlayer` is `true`. Honored by the editor
  canvas, the simulator, and the game-side plugin. Applies to fog, panorama, and custom-group layers.
- **`ctx.events.registerCommand(def): Disposable`** — register a custom RMXP event command. It
  appears on a dedicated puzzle-icon mod page (`🧩1`, `🧩2`, …; 24 per page) in the event-command
  picker and edits through a native declarative form (`ModCommandDef` / `ModCommandField` /
  `ModCommandParams` / `CoordinateValue`). The form builds a plain code-355 Script command from
  `def.script(params)` that runs in-game directly — no dispatcher — and `def.parse` recovers params so
  it stays re-editable. Field types: `number`, `text`, `select`, `checkbox`, `switch`, `variable`,
  `coordinate` (Transfer-Player Direct/Variables source), `record` (`recordKind`), `event`, `graphic`
  (`subfolder`), `audio` (`category`); any field can set `disabled` / `hidden` predicates
  `(params) => boolean`. Omitting `fields` gives a freeform script textarea. Mod commands can be
  favourited (the ★ tab tracks them by registry key).
- **`ctx.selectors`** — Promise-based modal pickers that mount the editor's stock selector dialogs.
  Methods: `pickActor`, `pickClass`, `pickSkill`, `pickItem`, `pickWeapon`, `pickArmor`, `pickEnemy`,
  `pickTroop`, `pickState`, `pickAnimation`, `pickCommonEvent`, `pickEntity`, `pickSwitch`,
  `pickVariable`, `pickMap`, `pickEvent`, `pickTileset`, `pickAudio`, `pickGraphic`,
  `pickKeyboardButton`, `pickCoordinate`. Each resolves to the picked value or `null` on cancel.
  `MapSelector` and `TilesetSelector` back `pickMap` / `pickTileset`.
- **`ctx.projectData`** — read-only access to project-wide RPG record lists (actors, classes, skills,
  items, weapons, armors, enemies, troops, states, animations, common events) plus switch/variable
  name arrays and the map info list.
- **Selector / project-data types** — `PublicRpgRecord`, `PublicRecordKind`, `EntityPickResult`,
  `AudioPickResult`, `GraphicPickResult`, `KeyboardButtonPickResult`, `CoordinatePickResult`,
  `SelectorExtra`, `SelectorOpts`, `AudioCategory`, `SelectorsCtx`, and `ProjectDataCtx` are exported
  from `src/mod-api/types.ts`.
- **`ctx.keybinds`** — query and modify keyboard shortcuts. Methods: `list()`, `get(actionId)`,
  `set(actionId, key)`, `reset(actionId)`, `onChanged(cb)`. Fires the `"keybind.changed"` event
  (`{ actionId, oldKey, newKey }`). `list()` / `get()` return `KeybindInfo`
  (`{ actionId, label, category, key, defaultKey, isCustom }`).
- **`ctx.mods`** — query other installed mods at runtime: `list()`, `get(id)`, `isInstalled(id)`,
  `isActive(id)`. For soft/optional dependencies and feature detection (hard deps belong in
  `manifest.requires`). `InstalledModInfo = { id, name, version, enabled, status:
  "active"|"error"|"disabled", source: "project"|"global" }`; mods blocked before load are not listed.
- **`ctx.plugins`** — query installed Essentials plugins at runtime: `available()` (false on v16/BES
  with no `Plugins/` dir), `list()`, `get(name)`, `isInstalled(name)`. `InstalledPluginInfo` exposes
  the plugin's full `meta.txt`: `{ name, version, essentials: string[], link, credits: string[],
  requires: PluginRequirement[], exact: PluginRequirement[], optional: PluginRequirement[], conflicts:
  string[] }`, where `PluginRequirement = { name, version: string | null }`. Repeatable fields
  (`Requires`/`Exact`/`Optional`/`Conflicts`) collect every line; comma-list fields
  (`Essentials`/`Credits`) are split.
- **`ctx.clipboard`** — read/write the OS text clipboard (system-wide, shared with other apps):
  `readText(): Promise<string | null>` (null when empty/unavailable) and `writeText(text):
  Promise<void>`. Backed by the Tauri clipboard-manager plugin; degrades to null/no-op when
  unavailable. Distinct from the tile clipboard on `ctx.map.getClipboard()` / `setClipboard()`.
- **`ctx.ui.openUrl(url)`** — open a URL in the user's default browser after a confirmation dialog.
- **`ctx.tileset.registerTerrainTag(def)`** and **`ctx.tileset.registerPriority(def)`** — register a
  custom terrain tag / tile priority (`{ id, name }`) that appears, named, in the Tileset Editor's
  Terrain Tag / Priority dropdowns. Built-in ids are terrain tags 0–17 and priorities 0–5; use 18+ /
  6+ for custom entries. The id is written verbatim to `@terrain_tags` / `@priorities` (Table1, i16,
  no clamp); duplicate ids are ignored (first registration wins) and both auto-remove on unload. Game
  behavior is read back via the engine's `terrain_tag`. See the `custom-tile-properties` example mod.
- **`MenuItemDef.icon`** — optional `icon?: string` on menu items registered via
  `ctx.menu.registerMenuItem(def)`, rendered like built-in menu items. Accepts a built-in icon name
  (kebab-case), raw inline SVG, or a single unicode glyph — resolved in that order. Mirrors `icon` on
  `ToolDef` / `PanelDef` / `ToolbarButtonDef`. Built-in names include `database`, `code`, `save`,
  `grid`, `lock`, `plus` (`add`), `settings` (`gear`/`cog`), `edit` (`pencil`/`rename`), `trash`
  (`delete`/`remove`), `switch` (`swap`/`repeat`), `versions` (`git-branch`/`branch`), `x` (`close`),
  `warning` (`alert`), `star`/`star-filled` (`favourite`), `refresh` (`restart`), `eye`/`eye-off`
  (`visible`/`hidden`), `chevron-up`/`chevron-down`/`chevron-left`, `arrow-up`/`arrow-down`/
  `arrow-left`/`arrow-right`, `pause`, `stop`, `step` (`step-forward`), `camera`, `video`, and `clock`
  (`timer`).
- **`MenuItemDef.shortcut`** — `shortcut?: string` registers a real keyboard binding that fires the
  item's `handler`. It appears in the editor's Keyboard Shortcuts dialog under a "Mods" section and is
  rebindable there; user overrides persist. Don't also call `ctx.ui.registerShortcut` for the same
  combo — that double-registers the key.
- **`ToastOptions.durationMs`** — `0` makes a toast sticky (stays until the user dismisses it via its ×
  button). Other values auto-dismiss, floored at 500 ms; default 3000 ms. Toasts are hover-pausable,
  copyable, and have a manual close button.
- **Theme CSS variables** — panel/dialog hosts render in the editor DOM, so the editor's theme
  variables (`--bg-primary`, `--text-primary`, `--accent`, `--border`, `--danger`, …) cascade into mod
  UI. Style with `var(--…)` to match the app and auto-flip on light/dark.
- **Manifest `authors`** — optional array of `{ name: string; url?: string }`. Supports multiple
  authors, each with their own link. The Mod Manager and Marketplace cards truncate authors that don't
  fit, showing a "+N more" button that opens a popover with the rest. Each `url` renders as a clickable
  link on the author name and opens after a confirmation dialog. The legacy flat `author` + `url`
  string fields are still accepted and auto-converted.
- **`manifest.requires`** — unified dependency array. Each entry is a discriminated union on `type`:
  `{ type: "mod", id, version? }` for another installed mod (topo-sorted on load; a missing id blocks
  the dependent mod) or `{ type: "plugin", name, url?, enforcement?, version?, versionCheck? }` for an
  Essentials plugin. `ModRequirement` and `ModDependency` types are exported from
  `src/mod-api/types.ts`.
- **`PluginDependency` interface** — `{ type: "plugin"; name: string; url?: string; enforcement?:
  "plugin" | "pluginAndVersion" | "none"; version?: string; versionCheck?: "greaterOrEqual" | "exact"
  | "compatible" }`. `name` matches the `Name` field in the plugin's `meta.txt`. `enforcement`:
  `"plugin"` (default) blocks if the plugin is missing but ignores version; `"pluginAndVersion"` blocks
  if missing or the version doesn't satisfy `versionCheck`; `"none"` only warns. `version` is a semver
  constraint checked only when `enforcement` is `"pluginAndVersion"` (any version satisfies if
  omitted). `versionCheck`: `"greaterOrEqual"` (default), `"exact"`, or `"compatible"` (same major,
  installed minor.patch >= required). On v21+ projects a missing/outdated plugin blocks the mod with a
  descriptive warning; on v16 / BES v5 projects (no `Plugins/` dir) a console warning is logged and the
  mod loads anyway. Setting `"pluginAndVersion"` without a `version` is a `ManifestError`.
- **Multi-file ESM mods** — mods can use native ES module `import` statements to split code across
  multiple `.js` files (e.g. `import { helper } from './utils.js'`). The loader discovers all `.js`
  files in the mod directory, builds a dependency graph, topo-sorts it, creates blob URLs bottom-up
  while rewriting relative imports, then imports the entry module. Single-file mods work unchanged;
  CommonJS mods remain single-file only. No manifest changes required.
- **`pickGraphic` property fields** — `ctx.selectors.pickGraphic` gained `fields?: GraphicField[]`
  (built-in `hue`/`opacity`/`blend`/`direction`/`pattern`/`sheetCols`/`sheetRows` controls),
  `extraFields?: GraphicPickerField[]` (custom `number`/`range`/`select`/`checkbox` controls), and
  `showGrid?` (clickable character-sheet cell grid). `GraphicPickResult` gained the matching optional
  props (`opacity`, `blend`, `direction`, `pattern`, `sheetCols`, `sheetRows`) plus `extra` for custom
  field values. Existing `{ showHue, title, initial }` calls are unchanged (default returns `{ name, hue }`).
- **`ctx.i18n`** *(additive)* — mod translations and runtime locale packs (`I18nCtx`). Tier 1:
  `addTranslations(locale, dict): Disposable` registers/merges a per-mod dictionary and the scoped
  `t(source, vars?)` resolves it (mod dict → app dict → source string; `{name}` substitution after
  lookup). Tier 2: `registerLocale({ code, name, dict }): Disposable` adds a **whole-app locale** that
  appears in View → Language (entries win over built-ins; later mod registrations win; reusing a
  built-in code such as `"es"` patches it). Plus `getLocale()`, `locales(): LocaleInfo[]`
  (`{ code, name }`), `setLocale(code)`, and `onChanged(cb): Disposable`. All registrations are
  auto-disposed on unload/hot-reload; a saved language provided by a mod is restored automatically when
  the mod re-registers it. New types: `I18nCtx`, `LocaleInfo`.
- **`locale.changed` event** *(additive)* — new bus event fired when the active editor language
  changes: `{ locale: string }`. The event bus now carries **26** stable events.
- **Mod panel layout persistence** *(behavior)* — panels registered via `ctx.ui.registerPanel` now keep
  their slot in the user's saved dock layout across mod unload / hot reload / disable / uninstall: the
  editor shows a "not loaded" placeholder and swaps your content back in when the panel re-registers.
  Exported layout configurations (`tile-editor-config.json` v2) record a `mods` manifest
  (`{ id, name, version?, panelIds[] }[]`); importing a layout with missing mods warns the user and
  keeps those panels as placeholders. v1 configs still import. No `PanelDef` change — don't close your
  own panel on deactivate.

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
| `fog`        | Fog layer list, visibility, CRUD, setOpacity, setConfig (above-tile graphic layer group) |
| `panorama`   | Panorama layers — same surface as `fog`, beneath the tiles |
| `layerGroups`| Custom graphic layer groups with mod-defined priorities (register, remove, list, setPriority, layer CRUD) |
| `events`     | RMXP-style events: list, get, getFull, create, delete, move, rename, update |
| `tools`      | Register custom editing tools |
| `menu`       | Add menu items (with isChecked, isEnabled) |
| `commands`   | Cross-mod command registry |
| `ui`         | Panels, dialogs, toasts, overlays, context menus, shortcuts |
| `bus`        | Subscribe to / emit events |
| `fs`         | Path-scoped filesystem (mod folder + project folder) |
| `storage`    | Per-mod persistent K/V |
| `clipboard`  | OS text clipboard read/write (system-wide; not the tile clipboard) |
| `log`        | Namespaced logger |
| `lifecycle`  | Activation hooks (onMapLoad, onSave, onActivate, onDeactivate, onToolChange, onLayerChange) |
| `stats`      | Editor usage statistics (global + per-project), single-stat getters, custom stats (get/set/increment), combined snapshots |
| `keybinds`   | Query and modify keyboard shortcuts, listen for changes |
| `i18n`       | Mod translations (scoped `t`) + runtime locale packs for the whole app |
| `selectors`  | Modal pickers (actor, class, skill, item, weapon, armor, enemy, troop, state, animation, common event, switch, variable, event, map, tileset, audio, graphic, keyboard button, coordinate) |
| `projectData`| Read-only RPG record lists (actors, items, classes, …) plus switch/variable names and map info |
| `mods`       | Query other installed mods (list, get, isInstalled, isActive) |
| `plugins`    | Query installed Essentials plugins (available, list, get, isInstalled) |

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

26 stable events. See [events-reference.md](./events-reference.md) for the full list.
`save.before` and `paste.before` are cancellable.

### Direct Tauri access

Mods can call any registered Tauri command via `window.__TAURI__.core.invoke(...)`.
Available commands: file I/O, file management, image processing, tileset management, dialogs.
See [api-reference.md](./api-reference.md) for the full list.

### Backend commands

General-purpose Tauri commands callable via `window.__TAURI__.core.invoke`:

`read_text_file`, `write_text_file`, `read_binary_file`, `write_binary_file`, `list_directory`, `file_exists`, `copy_file`, `rename_file`, `delete_file`, `get_image_dimensions`, `get_tileset_image`, `get_tileset_info`, `list_autotile_files`, `list_tileset_files`, `list_character_files`, `list_graphic_files`, `get_graphic_image`, `clear_image_cache`, `create_tileset`, `delete_tileset`, `update_tileset_name_graphic`, `save_tileset_properties`, `save_expanded_autotiles`, `plugin:dialog|open`, `plugin:dialog|save`, `discord_rpc_connect`, `discord_rpc_update`, `discord_rpc_clear`, `discord_rpc_disconnect`

### Stability tests

CI runs the bundled example mods as smoke tests. Their snapshot of the `ModContext` shape is asserted on every PR — accidental changes to the contract surface fail the build.
