/**
 * Mod API — Stable Contract (v1).
 *
 * This is a published mirror of the editor's internal `src/mod-api/types.ts`
 * file, distributed here so mod authors can:
 *   - Browse the full API surface without owning the editor source.
 *   - Drop this `.d.ts` into their own TypeScript project for autocomplete
 *     and type-checking against `ctx` in their `activate(ctx)` function.
 *
 * Stability rules (paraphrased — see api-changelog.md for version history):
 *   - Adding a new optional field to an interface = MINOR (additive, safe).
 *   - Adding a new required field, removing a field, changing a type = MAJOR.
 *
 * Pin your mod to a specific API version via `manifest.json#apiVersion`. The
 * editor refuses to load a mod whose major version doesn't match its own.
 *
 * Sister documents:
 *   - api-reference.md        — narrative reference with examples.
 *   - events-reference.md     — every event the editor emits.
 *   - quick-reference.md      — one-page cheat sheet.
 *   - api-changelog.md        — what changed in each API version.
 */

// ============================================================================
// Manifest
// ============================================================================

export interface ModManifest {
  /** Reverse-DNS unique id, e.g. "com.author.mod". */
  id: string;
  /** The mod's display name, shown in the Mod Manager and Marketplace. */
  name: string;
  /** Mod version (semver). */
  version: string;
  /** Optional author / description / homepage metadata. */
  author?: string;
  /** URL for the author — shown as clickable link in Mod Manager. */
  url?: string;
  description?: string;
  homepage?: string;
  /** Editor API version this mod targets (semver). */
  apiVersion: string;
  /** Path to the JS entry file, relative to the mod folder. */
  main: string;
  /** Map of mod id -> semver range. Topo-sorted on load. */
  dependencies?: Record<string, string>;
  /** Forward-compat. Recorded but not enforced in v1. */
  permissions?: ModPermission[];
}

export type ModPermission =
  | "fs.mod"        // Read/write inside the mod's own folder.
  | "fs.project"       // Read project assets (game folder).
  | "fs.write.project" // Write inside the project (export, save).
  | "events.cancel.save"
  | "ui.dialogs"
  | "ui.toasts";

// ============================================================================
// Disposable
// ============================================================================

export interface Disposable {
  dispose(): void;
}

// ============================================================================
// Public POJO data shapes — stable. Internal types never surface here.
// ============================================================================

export interface PublicTile {
  /** Tile id (0 = empty). */
  id: number;
  /** 0..360 rotation. */
  rotation?: number;
  flipH?: boolean;
  flipV?: boolean;
  opacity?: number;
}

export interface PublicMapInfo {
  id: number;
  name: string;
  width: number;
  height: number;
  tilesetId: number;
  layerCount: number;
}

export interface PublicLayerInfo {
  index: number;
  name: string;
  visible: boolean;
  opacity: number;
  /** "native" (0-2 baked in mapData), "extended", or "shadow". */
  kind: "native" | "extended" | "shadow";
}

export interface PublicEvent {
  id: number;
  name: string;
  x: number;
  y: number;
  /** Number of event pages. */
  pages?: number;
  /** Trigger type of the first page (0=action, 1=player_touch, 2=event_touch, 3=autorun, 4=parallel). */
  trigger?: number;
}

export interface PublicEventPage {
  trigger: number;
  graphic: { character_name: string; character_hue: number; direction: number; pattern: number; opacity: number };
  move_type: number;
  move_speed: number;
  move_frequency: number;
  walk_anime: boolean;
  step_anime: boolean;
  direction_fix: boolean;
  through: boolean;
  always_on_top: boolean;
  condition: {
    switch1_valid: boolean; switch1_id: number;
    switch2_valid: boolean; switch2_id: number;
    variable_valid: boolean; variable_id: number; variable_value: number;
    self_switch_valid: boolean; self_switch_ch: string;
  };
}

export interface PublicEventFull {
  id: number;
  name: string;
  x: number;
  y: number;
  pages: PublicEventPage[];
}

export interface PublicSelection {
  bounds: { x: number; y: number; w: number; h: number } | null;
  count: number;
}

// ============================================================================
// Tool / Menu / Panel / Command definitions
// ============================================================================

export interface ToolDef {
  id: string;
  label: string;
  /** Optional icon SVG string or unicode glyph. */
  icon?: string;
  /** Mouse handlers — all optional. */
  onPointerDown?(ctx: ToolPointerEvent): void;
  onPointerMove?(ctx: ToolPointerEvent): void;
  onPointerUp?(ctx: ToolPointerEvent): void;
  /** Called when user activates the tool. */
  onActivate?(): void;
  /** Called when user switches to a different tool. */
  onDeactivate?(): void;
}

export interface ToolPointerEvent {
  mapId: number;
  tileX: number;
  tileY: number;
  layerIndex: number;
  buttons: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}

export interface MenuItemDef {
  /** Top-level menu to insert into: "Project" | "Edit" | "View" | "Tools" | "Info" | custom. */
  menu: string;
  label: string;
  /** Optional keyboard shortcut hint string, e.g. "Ctrl+Shift+P". */
  shortcut?: string;
  handler: () => void | Promise<void>;
  /** Optional state evaluator — invoked when menu opens. */
  isEnabled?: () => boolean;
  isChecked?: () => boolean;
}

export interface PanelDef {
  /** Component id used as Dockview registration key. Must be unique. */
  id: string;
  /** Title shown in tab. */
  title: string;
  /** React component (or function returning element). The loader will pass it
   *  through as a Dockview component factory. */
  render: (host: HTMLElement) => void | (() => void);
  /** Where to dock by default when first opened. */
  defaultPosition?: "right" | "left" | "below" | "above";
  /** If false, the panel will NOT be auto-listed in the Mods menu. Default: true. */
  showInMenu?: boolean;
  /** Optional icon string (SVG markup or unicode glyph). */
  icon?: string;
}

export interface DialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export interface InputDialogOptions {
  title: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface CustomDialogOptions {
  title: string;
  width?: string;
  height?: string;
  zIndex?: number;
  /** Render content into the dialog body. Return a cleanup function or void. */
  render(body: HTMLElement): (() => void) | void;
}

export interface ToastOptions {
  message: string;
  level?: "info" | "warn" | "error";
  /** Auto-dismiss after N ms; default 3000. */
  durationMs?: number;
}

// ============================================================================
// Stats snapshots (read-only views exposed to mods)
// ============================================================================

export interface GlobalStatsSnapshot {
  totalActiveMinutes: number;
  totalTilesPlaced: number;
  totalUndoCount: number;
  totalRedoCount: number;
  totalMapsCreated: number;
  totalMapsSaved: number;
  totalSessions: number;
  firstLaunchDate: string;
  custom: Record<string, number>;
}

export interface ProjectStatsSnapshot {
  activeMinutes: number;
  tilesPlaced: number;
  undoCount: number;
  redoCount: number;
  mapsCreated: number;
  mapsSaved: number;
  mapEdits: Record<number, number>;
  sessionCount: number;
  firstOpened: string;
  custom: Record<string, number>;
}

/** Combined stats (global + project) returned by stats.all(). */
export interface CombinedStatsSnapshot {
  global: GlobalStatsSnapshot;
  project: ProjectStatsSnapshot | null;
}

/** Key names for built-in global stats. */
export type GlobalStatKey = "totalActiveMinutes" | "totalTilesPlaced" | "totalUndoCount" | "totalRedoCount" | "totalMapsCreated" | "totalMapsSaved" | "totalSessions" | "firstLaunchDate";

/** Key names for built-in project stats. */
export type ProjectStatKey = "activeMinutes" | "tilesPlaced" | "undoCount" | "redoCount" | "mapsCreated" | "mapsSaved" | "sessionCount" | "firstOpened";

// ============================================================================
// Event bus
// ============================================================================

/**
 * Stable event names. Adding a new event is MINOR. Removing one or
 * changing its payload shape is MAJOR.
 */
export interface EventMap {
  "map.loaded":         { mapId: number; width: number; height: number };
  "map.unloaded":       { mapId: number };
  "map.tile.changed":   { mapId: number; layer: number; x: number; y: number; oldId: number; newId: number };
  "map.batch.changed":  { mapId: number; layer: number; count: number; label: string };
  "tool.activated":     { toolId: string };
  "selection.changed":  { mapId: number; bounds: { x: number; y: number; w: number; h: number } | null; count: number };
  "save.before":        { mapId: number };
  "save.after":         { mapId: number };
  "mod.loaded":      { id: string };
  "mod.unloaded":    { id: string };
  "panel.opened":       { panelId: string };
  "panel.closed":       { panelId: string };
  "layer.changed":      { mapId: number; layerIndex: number; change: "visibility" | "opacity" | "added" | "removed" | "active" };
  "viewport.changed":   { mapId: number; x: number; y: number; zoom: number };

  /** Fired when the mouse enters or leaves a tile. x/y are null when cursor leaves the map. */
  "hover.changed":      { mapId: number; x: number | null; y: number | null };
  /** Fired when the tile clipboard changes (copy, cut, or clear). */
  "clipboard.changed":  { hasData: boolean; tiles?: number };
  /** Fired when any brush property changes (size, rotation, flip, color effects). */
  "brush.changed":      { size: number; rotation: number; flipH: boolean; flipV: boolean; opacity: number; hue: number; saturation: number; lighting: number };
  /** Fired when the active tileset in the palette changes or is reloaded. */
  "tileset.changed":    { tilesetId: number; reason: "selected" | "edited" | "reloaded" };
  /** Fired after an undo operation completes. */
  "undo":               { mapId: number; label: string };
  /** Fired after a redo operation completes. */
  "redo":               { mapId: number; label: string };
  /** Fired if a save fails. */
  "save.failed":        { mapId: number; error: string };
  /** Fired when an RMXP event is created, deleted, moved, or updated. */
  "event.changed":      { mapId: number; eventId: number; change: "created" | "deleted" | "moved" | "updated" };
  /** Fired before a paste operation. Cancellable — return `{cancel:true}` to abort. */
  "paste.before":       { mapId: number; x: number; y: number; tileCount: number };
  /** Fired periodically (~60s) with updated editor statistics. */
  "stats.changed":      { global: GlobalStatsSnapshot; project: ProjectStatsSnapshot | null };
  /** Fired when a keybind is changed via the settings dialog or mod API. */
  "keybind.changed":    { actionId: string; oldKey: string; newKey: string };
}

export type EventName = keyof EventMap;

export interface CancellableResult {
  cancel?: boolean;
  reason?: string;
}

// ============================================================================
// Sub-context interfaces
// ============================================================================

export interface EditorCtx {
  /** The running editor's version (e.g. "0.1.1") — same value the updater checks. */
  version(): string;
  activeMapId(): number | null;
  activeLayerIndex(): number;
  activeTool(): string;
  setTool(toolId: string): void;
  setActiveLayer(index: number): void;
  listOpenMaps(): number[];
  gameRoot(): string | null;
  /** Reload tilesets from Tilesets.rxdata and refresh all UI. */
  reloadTilesets(): Promise<void>;
  /** Current brush size (1-5). */
  brushSize(): number;
  /** Set brush size (1-5). */
  setBrushSize(size: number): void;
  /** Current brush tile properties. */
  brushTileProperties(): {
    rotation: number;
    flipH: boolean;
    flipV: boolean;
    opacity: number;
    hue: number;
    saturation: number;
    lighting: number;
  };
  /** Set brush tile properties (partial merge). */
  setBrushTileProperties(props: Partial<{
    rotation: number;
    flipH: boolean;
    flipV: boolean;
    opacity: number;
    hue: number;
    saturation: number;
    lighting: number;
  }>): void;
  /** Tile coordinate under the mouse cursor, or null. */
  hoverTile(): { x: number; y: number } | null;
  /** Viewport position and zoom for the active map. */
  viewport(): { x: number; y: number; zoom: number };
  /** Set viewport for the active map. */
  setViewport(viewport: { x?: number; y?: number; zoom?: number }): void;
  /** Read current view toggles. */
  viewOptions(): { showGrid: boolean; showCollision: boolean; showEvents: boolean; showDim: boolean; darkMode: boolean };
  /** Set view toggles (partial update). */
  setViewOptions(opts: Partial<{ showGrid: boolean; showCollision: boolean; showEvents: boolean; showDim: boolean; darkMode: boolean }>): void;

  /** Current theme. Shorthand for `viewOptions().darkMode ? "dark" : "light"`. */
  theme?(): "dark" | "light";
  /** Coarse animation frame counter (increments ~10fps). Useful for overlay animations. */
  animationFrame?(): number;
  /** Signal the canvas to repaint on the next frame. */
  requestRedraw?(): void;
  /** Set a transient status bar message for this mod. Pass null to clear. Auto-cleared on mod unload. */
  setStatusBarText?(text: string | null): void;
  /** IDs of recently opened maps, most-recent first. */
  recentMaps?(): number[];
  /** Game title from System.rxdata, or null if not loaded. */
  projectName?(): string | null;
}

export interface MapCtx {
  info(mapId: number): PublicMapInfo | null;
  layers(mapId: number): PublicLayerInfo[];
  readTile(mapId: number, layer: number, x: number, y: number): number;
  /** Single tile write — auto-grouped into a 1-tile undo entry. */
  writeTile(mapId: number, layer: number, x: number, y: number, tileId: number, label?: string): void;
  /** Multi-tile write — single undo entry. tiles is `"x,y" -> tileId`. */
  batchWrite(mapId: number, layer: number, tiles: Map<string, number>, label: string): void;
  selection(mapId: number): PublicSelection;
  /** Read full tile data including per-tile properties (rotation, flip, opacity, etc.). */
  readTileData(mapId: number, layer: number, x: number, y: number): PublicTileData | null;
  /** Write full tile data with per-tile properties. Only effective on extended layers (3+). */
  writeTileData(mapId: number, layer: number, x: number, y: number, data: PublicTileData, label?: string): void;
  /** Get actual tiles within the current selection. Returns null if no selection. */
  selectionTiles(mapId: number): Array<{ x: number; y: number; tileId: number; layerIndex: number }> | null;
  /** Set selection for a map. Pass null to clear. */
  setSelection(mapId: number, tiles: Array<{ x: number; y: number }> | null): void;
  /** Create a new extended layer. Returns the new layer index. */
  addLayer(mapId: number, name?: string): number;
  /** Remove an extended layer by index. */
  removeLayer(mapId: number, layerIndex: number): void;
  /** Rename a layer (works on native and extended). */
  renameLayer(mapId: number, layerIndex: number, name: string): void;
  /** Set layer visibility. */
  setLayerVisible(mapId: number, layerIndex: number, visible: boolean): void;
  /** Set layer opacity (0-255). */
  setLayerOpacity(mapId: number, layerIndex: number, opacity: number): void;
  /** Create a new map. Returns the new map ID. */
  createMap(opts: { width?: number; height?: number; tilesetId?: number; name?: string; parentId?: number }): Promise<number>;
  /** Delete a map by ID. */
  deleteMap(mapId: number): Promise<void>;
  /** Resize a map. Clears undo history for that map. */
  resize(mapId: number, newWidth: number, newHeight: number, shiftX?: number, shiftY?: number): void;
  /** Rename a map in the tree. */
  renameMap(mapId: number, name: string): void;
  /** Move a map to a new parent in the tree. */
  reparentMap(mapId: number, parentId: number): Promise<void>;
  /** Start an undo group. Tile writes between begin/end create a single undo entry. */
  beginUndoGroup(label: string): void;
  /** End the current undo group and commit it as a single undo entry. */
  endUndoGroup(): void;

  /** Rotate/flip/recolor the current selection in-place. Wraps selection-transform.ts. */
  transformSelection?(mapId: number, opts: SelectionTransformOpts): void;
  /**
   * Recalculate autotile patterns for tiles adjacent to the given positions.
   * Call after any batch write that places autotiles to fix neighbor seams.
   */
  recalculateAutotiles?(mapId: number, layerIndex: number, tiles: Array<{ x: number; y: number }>): void;
  /** Read per-tile properties stored on native layers (0-2). Returns null if no properties set. */
  getNativeTileProperties?(mapId: number, layer: number, x: number, y: number): NativeTileProps | null;
  /** Write per-tile properties on a native layer (0-2). Triggers a repaint. */
  setNativeTileProperties?(mapId: number, layer: number, x: number, y: number, props: Partial<NativeTileProps>): void;
  /** Read the current tile clipboard (last copy/cut). Returns null if clipboard is empty. */
  getClipboard?(): PublicClipboardData | null;
  /** Replace the tile clipboard. Fires `clipboard.changed`. */
  setClipboard?(data: PublicClipboardData | null): void;
  /**
   * Create a write scope that batches all writes into a single undo entry on commit.
   * More ergonomic than beginUndoGroup/endUndoGroup for programmatic multi-layer edits.
   */
  createUndoScope?(mapId: number, label: string): UndoScope;
}

export interface PublicTileData {
  tileId: number;
  rotation?: number;
  flipH?: boolean;
  flipV?: boolean;
  opacity?: number;
  hue?: number;
  saturation?: number;
  lighting?: number;
  /** Cross-tileset: tileset ID for the source tileset. Extended layers only. */
  tilesetId?: number;
  /** Extra autotile name. Extended layers only. */
  autotileName?: string;
}

/** Per-tile properties for native layers (layers 0-2). */
export interface NativeTileProps {
  rotation?: number;
  flipH?: boolean;
  flipV?: boolean;
  opacity?: number;
  hue?: number;
  saturation?: number;
  lighting?: number;
  /** Extra autotile name painted on native layer. */
  autotileName?: string;
  /** Autotile pattern index for extra autotiles on native layers. */
  autotilePattern?: number;
}

/** Tile clipboard snapshot (copy/paste). */
export interface PublicClipboardData {
  tiles: Array<{ x: number; y: number; tileId: number; layerIndex: number; tileData?: PublicTileData }>;
  bounds: { x: number; y: number; w: number; h: number } | null;
}

/** Options for transformSelection. */
export interface SelectionTransformOpts {
  rotation?: 0 | 90 | 180 | 270;
  flipH?: boolean;
  flipV?: boolean;
  /** When true, adds rotation/flip on top of existing tile transforms (default false = replace). */
  incremental?: boolean;
  colorOverride?: { hue?: number; saturation?: number; lighting?: number; opacity?: number };
}

/** Scoped write scope for fine-grained undo grouping. */
export interface UndoScope {
  write(layer: number, x: number, y: number, tileId: number): void;
  writeData(layer: number, x: number, y: number, data: PublicTileData): void;
  /** Commit all writes as a single undo entry. No-op if already committed. */
  commit(): void;
  /** Discard all writes without creating an undo entry. */
  abort(): void;
}

/** Event command schema (matches RPG Maker XP command structure). */
export interface PublicCommandSchema {
  code: number;
  name: string;
  /** 1 = flow/vars/party, 2 = map/screen/audio, 3 = battle/actor/system */
  category: 1 | 2 | 3;
  defaultParams: unknown[];
  blockOpener?: boolean;
  blockCloser?: boolean;
  continuation?: boolean;
}

/** Single RMXP event command. */
export interface PublicEventCommand {
  code: number;
  indent: number;
  parameters: unknown[];
}

/** Result of validateEvent. */
export interface EventCommandValidationResult {
  valid: boolean;
  errors: string[];
}

/** A tile coordinate captured by a `coordinate` field. Mirrors RPG Maker's
 *  Transfer Player destination: `mode` is either `"direct"` (a value picked on a
 *  map or typed in) or `"variable"` (read from game variables at runtime). */
export interface CoordinateValue {
  mode: "direct" | "variable";
  /** Used by `direct` mode (mapId only when the field shows the map selector). */
  mapId: number;
  x: number;
  y: number;
  /** Variable ids used by `variable` mode. */
  varMapId: number;
  varX: number;
  varY: number;
}

/** A declarative field in a mod-defined event command's editor UI. Each type
 *  maps to a native editor control (number box, dropdown, switch/variable
 *  picker, map picker, entity picker, graphic/audio browser…) so the dialog
 *  matches the built-in command dialogs. `disabled` greys the control out, and
 *  `hidden` removes it entirely, based on the current params (e.g. hide "speed"
 *  until a "set speed" box is on). */
export type ModCommandField = {
  disabled?: (params: Record<string, unknown>) => boolean;
  hidden?: (params: Record<string, unknown>) => boolean;
} & (
  | { type: "number"; key: string; label: string; min?: number; max?: number; step?: number; default?: number }
  | { type: "text"; key: string; label: string; default?: string }
  | { type: "select"; key: string; label: string; options: { value: number; label: string }[]; default?: number }
  | { type: "checkbox"; key: string; label: string; default?: boolean }
  | { type: "switch"; key: string; label: string; default?: number }
  | { type: "variable"; key: string; label: string; default?: number }
  | { type: "coordinate"; key: string; label: string; showMapSelector?: boolean; default?: Partial<CoordinateValue> }
  | { type: "record"; key: string; label: string; recordKind: "actor" | "class" | "skill" | "item" | "weapon" | "armor" | "enemy" | "troop" | "state" | "animation" | "common_event"; default?: number }
  | { type: "event"; key: string; label: string; includePlayer?: boolean; includeThisEvent?: boolean; default?: number }
  | { type: "graphic"; key: string; label: string; subfolder: string; showHue?: boolean; default?: string }
  | { type: "audio"; key: string; label: string; category: "BGM" | "BGS" | "ME" | "SE"; default?: { name: string; volume: number; pitch: number } }
);

/** A mod command's parameter values, keyed by each field's `key`. */
export type ModCommandParams = Record<string, unknown>;

/** Definition of a mod-provided event command, registered via
 *  `ctx.events.registerCommand(def)`. The command appears on a dedicated page in
 *  the event-command picker. Filling its form generates a normal RMXP Script
 *  command (code 355) whose text is `script(params)` — that literal Ruby runs
 *  in-game as-is (no runtime dispatcher). Omit `fields` for a freeform script
 *  command (the editor shows a script textarea bound to `params.script`). */
export interface ModCommandDef {
  /** Unique within the mod (e.g. "cameraScrollTo"). Combined with the mod id. */
  id: string;
  /** Display name in the picker and the command list. */
  name: string;
  /** Optional grouping label (reserved for future per-mod page titles). */
  page?: string;
  /** Declarative parameter fields. Omit for a freeform script command. */
  fields?: ModCommandField[];
  /** Build the Script command text from the params. Stored verbatim and run
   *  in-game directly. Required when `fields` are given; for a fields-less
   *  command the editor stores `params.script` as-is. */
  script?: (params: ModCommandParams) => string;
  /** Recognize a previously generated script back into params so the command
   *  keeps its name and reopens its custom form. Return null if not this
   *  command. Without it, an inserted command becomes an ordinary Script. */
  parse?: (scriptText: string) => ModCommandParams | null;
  /** Optional one-line summary shown after the name in the command list. */
  summary?: (params: ModCommandParams) => string;
}

/** Info passed to advanced overlay render callbacks. */
export interface AdvancedOverlayInfo {
  mapId: number;
  tileSize: number;
  zoom: number;
  viewportX: number;
  viewportY: number;
  canvasWidth: number;
  canvasHeight: number;
  /** Coarse animation frame counter (increments ~10fps). Use for autotile frame cycling. */
  animFrame: number;
}

/** Overlay definition with access to animFrame. */
export interface AdvancedOverlayDef {
  id: string;
  render(ctx: CanvasRenderingContext2D, info: AdvancedOverlayInfo): void;
  zOrder?: number;
}

/** Status bar item contributed by a mod. */
export interface StatusBarItemDef {
  id: string;
  render(host: HTMLElement): void | (() => void);
  align?: "left" | "right";
}

/** Toolbar button contributed by a mod. */
export interface ToolbarButtonDef {
  id: string;
  icon: string;
  tooltip: string;
  handler(): void;
  isActive?(): boolean;
}

export interface PublicTilesetListEntry {
  id: number;
  name: string;
  tilesetName: string;
}

export interface PublicTilesetInfo {
  id: number;
  name: string;
  tilesetName: string;
  autotileNames: string[];
  panoramaName: string;
  fogName: string;
  battlebackName: string;
}

export interface TilesetCtx {
  /** Returns image as a blob URL. Cached per (gameRoot, tilesetName). */
  getImageBlobUrl(tilesetId: number): Promise<string | null>;
  getTileProperties(tilesetId: number, tileId: number): {
    passage: number;
    priority: number;
    terrainTag: number;
  } | null;
  /** List all loaded tilesets with basic metadata. */
  list(): PublicTilesetListEntry[];
  /** Get tileset metadata including autotile names, panorama, fog, battleback. */
  info(tilesetId: number): PublicTilesetInfo | null;
  /** Write passage/priority/terrain for a single tile. Persists to disk. */
  setTileProperties(tilesetId: number, tileId: number, props: {
    passage?: number; priority?: number; terrainTag?: number;
  }): Promise<void>;
  /** Currently selected tileset in the tile palette (browseTilesetId). Null if no map open. */
  currentId(): number | null;
  /** Full info of the currently selected tileset. Null if none. */
  current(): PublicTilesetInfo | null;
  /** Tileset ID assigned to a specific map. Null if map not loaded. */
  mapTilesetId(mapId: number): number | null;

  /**
   * Return passage/priority/terrain for a tile adjusted for the given rotation/flip.
   * Passage direction bits are rotated to match the visual transform.
   */
  transformTileProperties?(tilesetId: number, tileId: number, t: { rotation?: number; flipH?: boolean; flipV?: boolean }): { passage: number; priority: number; terrainTag: number } | null;
  /**
   * Resolve tile properties for any tile, optionally from a specific tileset.
   * Falls back to the map's default tileset when tilesetId is omitted.
   */
  resolveTileProperties?(tileId: number, tilesetId?: number): { passage: number; priority: number; terrainTag: number } | null;
}

export interface ShadowCtx {
  list(mapId: number): { id: number; name: string; visible: boolean }[];
  setVisible(mapId: number, shadowId: number, visible: boolean): void;
  /** Get shadow details including opacity. */
  info(mapId: number, shadowId: number): { id: number; name: string; visible: boolean; opacity: number } | null;
  /** Create a new shadow layer. Returns the new shadow's id and name. */
  create(mapId: number, name?: string): { id: number; name: string };
  /** Delete a shadow layer by id. */
  delete(mapId: number, shadowId: number): void;

  /** Set opacity (0-255) for a shadow layer. */
  setOpacity?(mapId: number, shadowId: number, opacity: number): void;
  /**
   * Generate a shadow from an explicit tile list and config.
   * Returns the new shadow layer id, or null if generation failed.
   */
  generateFromTiles?(
    mapId: number,
    tiles: Array<{ x: number; y: number; tileId: number; tileData?: PublicTileData }>,
    config?: { blurRadius?: number; offsetX?: number; offsetY?: number; color?: string },
  ): Promise<{ shadowId: number } | null>;
}

export interface PublicFogConfig {
  graphicName: string;
  hue: number;
  blendType: number;
  zoom: number;
  sx: number;
  sy: number;
  followPlayer: boolean;
}

export interface FogCtx {
  list(mapId: number): { id: number; name: string; visible: boolean }[];
  setVisible(mapId: number, fogId: number, visible: boolean): void;
  /** Get fog details including opacity and full config. */
  info(mapId: number, fogId: number): { id: number; name: string; visible: boolean; opacity: number; config: PublicFogConfig } | null;
  /** Create a new fog layer. Returns the new fog's id and name. */
  create(mapId: number, name?: string): { id: number; name: string };
  /** Delete a fog layer by id. */
  delete(mapId: number, fogId: number): void;
  /** Set opacity (0-255) for a fog layer. */
  setOpacity(mapId: number, fogId: number, opacity: number): void;
  /** Update fog config (graphicName, hue, blendType, zoom, sx, sy, followPlayer). */
  setConfig(mapId: number, fogId: number, config: Partial<PublicFogConfig>): void;
}

export interface EventsCtx {
  list(mapId: number): PublicEvent[];
  get(mapId: number, eventId: number): PublicEvent | null;
  /** Create a new event at the given position. Returns the new event ID. */
  create(mapId: number, x: number, y: number, name?: string): number | null;
  /** Delete an event by ID. */
  delete(mapId: number, eventId: number): void;
  /** Move an event to a new position. */
  move(mapId: number, eventId: number, x: number, y: number): void;
  /** Rename an event. */
  rename(mapId: number, eventId: number, name: string): void;
  /** Get full event data including all pages. */
  getFull(mapId: number, eventId: number): PublicEventFull | null;
  /** Update full event data (pages, graphics, triggers, etc.). */
  update(mapId: number, event: PublicEventFull): void;

  /** All known RMXP event command schemas. */
  commandSchemas?(): PublicCommandSchema[];
  /** Get schema for a single command code. Returns null for unknown codes. */
  getCommandSchema?(code: number): PublicCommandSchema | null;
  /** Create a valid event command struct with default parameters. */
  createCommand?(code: number, params?: unknown[]): PublicEventCommand;
  /** Validate all commands in an event. Returns {valid, errors}. */
  validateEvent?(event: PublicEventFull): EventCommandValidationResult;

  /** Register a new event command contributed by this mod. It appears on a
   *  dedicated page in the event-command picker, edits through a native
   *  declarative form, and is stored as a plain Script command (`def.script`)
   *  that runs in-game directly. Returns a Disposable that removes it. */
  registerCommand?(def: ModCommandDef): Disposable;
}

export interface ToolsCtx {
  registerTool(def: ToolDef): Disposable;
}

export interface MenuCtx {
  registerMenuItem(def: MenuItemDef): Disposable;
}

export interface CommandsCtx {
  register(commandId: string, handler: (...args: unknown[]) => unknown): Disposable;
  execute(commandId: string, ...args: unknown[]): Promise<unknown>;
  list(): string[];
}

export interface UiCtx {
  registerPanel(def: PanelDef): Disposable;
  /** Open a previously registered panel by id. */
  openPanel(panelId: string): void;
  /** Close a previously opened panel. No-op if not open. */
  closePanel(panelId: string): void;
  /** Check whether a panel is currently open in the dock. */
  isPanelOpen(panelId: string): boolean;
  showConfirmDialog(opts: DialogOptions): Promise<boolean>;
  /** Show an input dialog with a text field. Returns the entered string or null if cancelled. */
  showInputDialog(opts: InputDialogOptions): Promise<string | null>;
  /** Show a custom dialog with the editor's standard shell (overlay, draggable header, close button).
   *  The mod provides a render callback that receives the body element. Returns a close function. */
  showCustomDialog(opts: CustomDialogOptions): { close: () => void };
  showToast(opts: ToastOptions): void;
  /** Convenience — equivalent to showToast({message, level:"info"}). */
  log(message: string): void;
  /** Show a native context menu at screen coordinates. */
  showContextMenu(x: number, y: number, items: Array<ContextMenuItemDef>): void;
  /** Register a context menu item that appears in editor context menus. */
  registerContextMenuItem(def: ContextMenuRegistration): Disposable;
  /** Register an overlay that renders on top of the map canvas. */
  registerOverlay(def: OverlayDef): Disposable;
  /** Register a keyboard shortcut. Key format: "Ctrl+Shift+F". */
  registerShortcut(key: string, handler: () => void): Disposable;

  /** Open a native color picker. Returns hex string (e.g. "#ff0000") or null if cancelled. */
  showColorPicker?(opts?: { title?: string; initial?: string }): Promise<string | null>;
  /** Open a native file picker. Returns array of selected paths, or null if cancelled. */
  showFilePicker?(opts?: { directory?: boolean; multiple?: boolean; filters?: Array<{ name: string; extensions: string[] }> }): Promise<string[] | null>;
  /** Open a native save-file picker. Returns the chosen path, or null if cancelled. */
  showSavePicker?(opts?: { defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }): Promise<string | null>;
  /** Variant of showConfirmDialog styled for destructive actions (red confirm button). */
  confirmDestructive?(opts: { title: string; message: string; confirmLabel?: string }): Promise<boolean>;
  /** Register an overlay with access to animFrame and the full render context. */
  registerAdvancedOverlay?(def: AdvancedOverlayDef): Disposable;
  /** Register a persistent item in the status bar. Auto-removed on mod unload. */
  registerStatusBarItem?(def: StatusBarItemDef): Disposable;
  /** Register a button in the mod toolbar strip. Auto-removed on mod unload. */
  registerToolbarButton?(def: ToolbarButtonDef): Disposable;
  /** Open a URL in the user's default browser. */
  openUrl(url: string): Promise<void>;
}

export interface ContextMenuItemDef {
  label: string;
  action?: () => void;
  disabled?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItemDef[];
}

// ============================================================================
// Context menu registration
// ============================================================================

export type ContextMenuContext =
  | "map-tile"           // right-click on map canvas (tile mode)
  | "map-event"          // right-click on map canvas (event mode)
  | "tile-palette"       // right-click on tile palette (main tiles)
  | "tile-palette-extra" // right-click on extra autotiles
  | "layer"              // right-click on layer panel
  | "map-tree"           // right-click on map tree
  | "event-editor";      // right-click on event command list

export interface ContextMenuInfo {
  mapId?: number;
  tileX?: number;
  tileY?: number;
  tileId?: number;
  layerIndex?: number;
  eventId?: number;
  mapName?: string;
  layerName?: string;
  autotileName?: string;
}

export interface ContextMenuRegistration {
  context: ContextMenuContext;
  label: string;
  handler: (info: ContextMenuInfo) => void;
  isEnabled?: (info: ContextMenuInfo) => boolean;
  /** When set, the item is placed inside an existing submenu with this label. */
  parentMenu?: string;
}

export interface OverlayDef {
  id: string;
  render(ctx: CanvasRenderingContext2D, info: {
    mapId: number;
    tileSize: number;
    zoom: number;
    viewportX: number;
    viewportY: number;
    canvasWidth: number;
    canvasHeight: number;
  }): void;
  /** z-order. Higher = drawn later (on top). Default 0. */
  zOrder?: number;
}

export interface BusCtx {
  on<E extends EventName>(event: E, fn: (payload: EventMap[E]) => void | Promise<CancellableResult | void>): Disposable;
  off<E extends EventName>(event: E, fn: Function): void;
  emit<E extends EventName>(event: E, payload: EventMap[E]): void;
}

export interface FsCtx {
  /** Read a file inside the mod's own folder. */
  readModFile(relPath: string): Promise<string>;
  /** Write a file inside the mod's own folder. Permission: fs.mod. */
  writeModFile(relPath: string, content: string): Promise<void>;
  /** Read a project asset by path relative to gameRoot. Permission: fs.project. */
  readProjectFile(relPath: string): Promise<string>;
  /** Write a project file. Permission: fs.write.project. */
  writeProjectFile(relPath: string, content: string): Promise<void>;
  /** Check if a file or directory exists in mod folder. */
  exists(relPath: string): Promise<boolean>;
  /** List directory contents in mod folder. Returns entry names. */
  listDir(relPath: string): Promise<string[]>;
  /** Create a directory (and parents) in mod folder. Permission: fs.mod. */
  mkdir(relPath: string): Promise<void>;
  /** Check if a file or directory exists in project folder. Permission: fs.project. */
  projectExists(relPath: string): Promise<boolean>;
  /** List directory contents in project folder. Returns entry names. Permission: fs.project. */
  listProjectDir(relPath: string): Promise<string[]>;
  /** Create a directory (and parents) in project folder. Permission: fs.write.project. */
  projectMkdir(relPath: string): Promise<void>;
}

export interface StorageCtx {
  get<T = unknown>(key: string, fallback?: T): Promise<T | undefined>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

export interface LogCtx {
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  debug(...args: unknown[]): void;
}

export interface LifecycleCtx {
  onActivate(fn: () => void | Promise<void>): Disposable;
  onDeactivate(fn: () => void | Promise<void>): Disposable;
  onMapLoad(fn: (mapId: number) => void | Promise<void>): Disposable;
  onSave(fn: (mapId: number) => void | Promise<void>): Disposable;
  /** React to tool switches. */
  onToolChange(fn: (toolId: string) => void): Disposable;
  /** React to layer switches on any open map. */
  onLayerChange(fn: (mapId: number, layerIndex: number) => void): Disposable;

  /** React to undo operations. */
  onUndo?(fn: (mapId: number, label: string) => void): Disposable;
  /** React to redo operations. */
  onRedo?(fn: (mapId: number, label: string) => void): Disposable;
  /** React to brush property changes (size, rotation, flip, color). */
  onBrushChange?(fn: (props: { size: number; rotation: number; flipH: boolean; flipV: boolean; opacity: number; hue: number; saturation: number; lighting: number }) => void): Disposable;
  /** React to tileset palette changes or reloads. */
  onTilesetChange?(fn: (tilesetId: number, reason: "selected" | "edited" | "reloaded") => void): Disposable;
}

export interface StatsCtx {
  /** Read-only snapshot of global (lifetime) stats. */
  global(): GlobalStatsSnapshot;
  /** Read-only snapshot of current project stats. Null if no project open. */
  project(): ProjectStatsSnapshot | null;
  /** Combined snapshot of both global and project stats. */
  all(): CombinedStatsSnapshot;
  /** Get a single built-in global stat by key name. */
  getGlobalStat(key: GlobalStatKey): number | string;
  /** Get a single built-in project stat by key name. Null if no project. */
  getProjectStat(key: ProjectStatKey): number | string | null;
  /** Get a custom stat value from global stats. Returns defaultValue (0) if not set. */
  getCustomGlobal(key: string, defaultValue?: number): number;
  /** Get a custom stat value from project stats. Returns defaultValue (0) if not set or no project. */
  getCustomProject(key: string, defaultValue?: number): number;
  /** Set a custom stat value on global stats. Overwrites existing value. */
  setCustomGlobal(key: string, value: number): void;
  /** Set a custom stat value on project stats. No-op if no project open. */
  setCustomProject(key: string, value: number): void;
  /** Increment a custom global stat by amount (default 1). Returns new value. */
  incrementCustomGlobal(key: string, amount?: number): number;
  /** Increment a custom project stat by amount (default 1). Returns new value, or 0 if no project. */
  incrementCustomProject(key: string, amount?: number): number;
  /** Register display metadata for a custom stat. Values still use setCustomGlobal/setCustomProject. */
  registerStat(def: { id: string; name: string; description?: string; category: string; scope: "global" | "project"; format?: "number" | "time" | "date" }): void;
  /** Subscribe to periodic stats updates (~60s). */
  onStatsChanged(fn: (global: GlobalStatsSnapshot, project: ProjectStatsSnapshot | null) => void): Disposable;
}

// ============================================================================
// Keybinds context
// ============================================================================

export interface KeybindInfo {
  actionId: string;
  label: string;
  category: string;
  key: string;
  defaultKey: string;
  isCustom: boolean;
}

export interface KeybindsCtx {
  list(): KeybindInfo[];
  get(actionId: string): KeybindInfo | null;
  set(actionId: string, key: string): string | null;
  reset(actionId: string): void;
  onChanged(cb: (actionId: string, oldKey: string, newKey: string) => void): Disposable;
}

// ============================================================================
// Project data (read-only RPG record lists)
// ============================================================================

/** Minimal RPG Maker XP record exposed to mods. 1-indexed (id 0 reserved as nil). */
export interface PublicRpgRecord {
  id: number;
  name: string;
  /** Skills/Items/Weapons/Armors carry an icon graphic name. Empty otherwise. */
  iconName?: string;
}

/** Discriminator for record-list selectors. Mirrors the editor's `ProjectRecordKind`. */
export type PublicRecordKind =
  | "actor" | "class" | "skill" | "item" | "weapon" | "armor"
  | "enemy" | "troop" | "state" | "animation" | "common_event";

export interface ProjectDataCtx {
  /** All actors (1-indexed). Index 0 is `{ id:0, name:"" }`. */
  actors(): readonly PublicRpgRecord[];
  classes(): readonly PublicRpgRecord[];
  skills(): readonly PublicRpgRecord[];
  items(): readonly PublicRpgRecord[];
  weapons(): readonly PublicRpgRecord[];
  armors(): readonly PublicRpgRecord[];
  enemies(): readonly PublicRpgRecord[];
  troops(): readonly PublicRpgRecord[];
  states(): readonly PublicRpgRecord[];
  animations(): readonly PublicRpgRecord[];
  commonEvents(): readonly PublicRpgRecord[];
  /** Generic by kind. Returns `[]` if no project loaded. */
  records(kind: PublicRecordKind): readonly PublicRpgRecord[];
  /** Single record lookup. Returns `null` if not found. */
  getRecord(kind: PublicRecordKind, id: number): PublicRpgRecord | null;
  /** System.rxdata switch names indexed by id (0 unused). */
  switchNames(): readonly string[];
  /** System.rxdata variable names indexed by id (0 unused). */
  variableNames(): readonly string[];
  /** All maps from MapInfos.rxdata. */
  maps(): ReadonlyArray<{ id: number; name: string; parentId: number; order: number }>;
}

// ============================================================================
// Selectors (modal pickers usable by mods)
// ============================================================================

/** Common option overrides for picker dialogs. */
export interface SelectorOpts {
  /** Initial selected id. Defaults to 0 (first real record). */
  value?: number;
  /** Override dialog title. */
  title?: string;
}

/** Synthetic above-the-list entry for entity pickers (e.g. "Entire Party"). */
export interface SelectorExtra {
  id: number;
  label: string;
}

export interface EntityPickResult {
  id: number;
  name: string;
}

export interface AudioPickResult {
  /** Filename without extension. Empty string = (none). */
  name: string;
  /** 0-100. */
  volume: number;
  /** 50-150. */
  pitch: number;
}

export interface GraphicPickResult {
  /** Filename without extension. Empty string = (none). */
  name: string;
  /** 0-359 hue rotation degrees. */
  hue: number;
}

export interface KeyboardButtonPickResult {
  /** RMXP `Input.trigger?` numeric code. */
  code: number;
  label: string;
}

/** Audio category subfolder under `<gameRoot>/Audio/`. */
export type AudioCategory = "BGM" | "BGS" | "ME" | "SE";

/** Result of picking a coordinate on a map. */
export interface CoordinatePickResult {
  mapId: number;
  mapName: string;
  x: number;
  y: number;
}

export interface SelectorsCtx {
  // -- RPG record pickers (return record id or null if cancelled) --
  /** Pick an actor (1-indexed). */
  pickActor(opts?: SelectorOpts & { extras?: SelectorExtra[] }): Promise<EntityPickResult | null>;
  pickClass(opts?: SelectorOpts & { extras?: SelectorExtra[] }): Promise<EntityPickResult | null>;
  pickSkill(opts?: SelectorOpts & { extras?: SelectorExtra[] }): Promise<EntityPickResult | null>;
  pickItem(opts?: SelectorOpts & { extras?: SelectorExtra[] }): Promise<EntityPickResult | null>;
  pickWeapon(opts?: SelectorOpts & { extras?: SelectorExtra[] }): Promise<EntityPickResult | null>;
  pickArmor(opts?: SelectorOpts & { extras?: SelectorExtra[] }): Promise<EntityPickResult | null>;
  pickEnemy(opts?: SelectorOpts & { extras?: SelectorExtra[] }): Promise<EntityPickResult | null>;
  pickTroop(opts?: SelectorOpts & { extras?: SelectorExtra[] }): Promise<EntityPickResult | null>;
  pickState(opts?: SelectorOpts & { extras?: SelectorExtra[] }): Promise<EntityPickResult | null>;
  pickAnimation(opts?: SelectorOpts & { extras?: SelectorExtra[] }): Promise<EntityPickResult | null>;
  pickCommonEvent(opts?: SelectorOpts & { extras?: SelectorExtra[] }): Promise<EntityPickResult | null>;
  /** Generic record picker. */
  pickEntity(kind: PublicRecordKind, opts?: SelectorOpts & { extras?: SelectorExtra[] }): Promise<EntityPickResult | null>;

  // -- System pickers --
  /** Pick a global switch by id. List is taken from System.rxdata. */
  pickSwitch(opts?: SelectorOpts): Promise<EntityPickResult | null>;
  /** Pick a global variable by id. */
  pickVariable(opts?: SelectorOpts): Promise<EntityPickResult | null>;

  // -- Map / event / tileset pickers --
  /** Pick an event from the given map. `mapId` must be loaded. */
  pickEvent(mapId: number, opts?: SelectorOpts & { includePlayer?: boolean; includeThisEvent?: boolean }): Promise<EntityPickResult | null>;
  /** Pick a map from MapInfos.rxdata. */
  pickMap(opts?: SelectorOpts & { includeCurrentMap?: boolean }): Promise<EntityPickResult | null>;
  /** Pick a tileset from Tilesets.rxdata. Returns the full tileset info on success. */
  pickTileset(opts?: SelectorOpts): Promise<PublicTilesetInfo | null>;

  // -- File-backed pickers --
  /** Pick an audio file from `<gameRoot>/Audio/<category>/`. Includes volume + pitch. */
  pickAudio(category: AudioCategory, opts?: { initial?: AudioPickResult; title?: string }): Promise<AudioPickResult | null>;
  /** Pick an image from `<gameRoot>/Graphics/<subfolder>/` with optional hue rotation. */
  pickGraphic(subfolder: string, opts?: { initial?: GraphicPickResult; showHue?: boolean; title?: string }): Promise<GraphicPickResult | null>;

  // -- Input pickers --
  /** Pick an RMXP `Input.trigger?` button (directional, action, modifier, F-key). */
  pickKeyboardButton(opts?: { value?: number }): Promise<KeyboardButtonPickResult | null>;

  // -- Map coordinate picker --
  /** Pick a tile coordinate on a map. Opens the LocationPicker dialog.
   *  Set `lockMap` to hide the map tree and constrain to one map
   *  (uses `initial.mapId` or the active map as fallback). */
  pickCoordinate(opts?: { initial?: CoordinatePickResult; lockMap?: boolean; title?: string }): Promise<CoordinatePickResult | null>;
}

// ============================================================================
// ModContext — the root facade passed to activate(ctx).
// ============================================================================

export interface ModContext {
  /** API version this context implements. */
  readonly apiVersion: string;
  /** This mod's manifest. Read-only copy. */
  readonly manifest: Readonly<ModManifest>;

  editor: EditorCtx;
  map: MapCtx;
  tileset: TilesetCtx;
  shadow: ShadowCtx;
  fog: FogCtx;
  events: EventsCtx;
  tools: ToolsCtx;
  menu: MenuCtx;
  commands: CommandsCtx;
  ui: UiCtx;
  bus: BusCtx;
  fs: FsCtx;
  storage: StorageCtx;
  log: LogCtx;
  lifecycle: LifecycleCtx;
  stats: StatsCtx;
  keybinds: KeybindsCtx;
  /** Modal pickers that mount the editor's stock selector dialogs. */
  selectors: SelectorsCtx;
  /** Read-only access to project-wide RPG record lists (actors, items, …). */
  projectData: ProjectDataCtx;
}

// ============================================================================
// Mod module shape
// ============================================================================

export interface ModModule {
  /** Called once after the module loads. May be async. */
  activate(ctx: ModContext): void | Promise<void>;
  /** Optional — called before unload. May be async. */
  deactivate?(): void | Promise<void>;
}
