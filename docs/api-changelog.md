# API Changelog

The mod API follows [semver](https://semver.org):

- **Major** — breaking changes. Existing mods targeting the previous major version are routed through a compatibility shim. If no shim exists, the mod is refused with a clear error in the Mod Manager.
- **Minor** — additive changes (new optional fields, new event names, new context methods). Old mods keep working without changes.
- **Patch** — internal-only fixes; no observable changes.

When a major bump happens, this file gets a section with the new shape and a link to a migration guide.

---

## Fixes since 1.0.0

- **Event command lists are now readable and writable** (`ctx.events`). `PublicEventPage`
  carries `list?: PublicEventCommand[]`. `events.getFull()` returns each page's commands
  (it used to drop them, so mods could never read what an event does), and `events.update()`
  writes back the `list` you set on a page (it used to ignore it, so commands could not be
  written at all). Omit a page's `list` to leave its existing commands untouched; `update()`
  appends the RMXP code-0 page terminator when your list lacks one, so mod-built lists don't
  need it. This makes `events.createCommand()` usable — it previously produced command structs
  with nowhere to put them — and fixes `events.validateEvent()`, which never saw a command list
  and so reported `{ valid: true, errors: [] }` for every event, including ones with unknown
  command codes. Additive: mods written against 1.0.0 keep working unchanged. See
  [api-reference.md](./api-reference.md) (`events`).

## v1.0.0 — Initial Release

First public mod API, shipping with Maker Studio 1.0. A stable `ctx` surface lets
mods extend the editor end-to-end: editing maps, adding tools and UI, hooking the
event bus, and shipping custom content through to the game.

The full method/type reference lives in [api-reference.md](./api-reference.md) and
[mod-api.d.ts](./mod-api.d.ts); every editor event is documented in
[events-reference.md](./events-reference.md). This entry lists the essential
capabilities, not the exhaustive surface.

### Essential features

- **Mod lifecycle & manifest** — each mod ships a `ModManifest` (`id`, `version`,
  `apiVersion`, `main` entry) with `activate(ctx)` / `deactivate()` hooks. Optional
  multi-author `authors` and a unified `requires` array (other mods and/or Essentials
  plugins, topo-sorted on load). Single-file, CommonJS, and multi-file ESM mods are
  all supported.
- **Map editing** — read/write tiles and per-tile data, query and manage layers
  (native, extended, shadow), selections with transforms, undo grouping and scopes,
  a tile clipboard, and full map CRUD (create, delete, resize, rename, reparent).
- **Tilesets** — tileset images, tile properties (passage / priority / terrain tag),
  tileset CRUD, and mod-registered **custom terrain tags & priorities** that appear
  named in the Tileset Editor and are written verbatim to the game data.
- **Graphic layer groups** — `ctx.fog`, `ctx.panorama`, and mod-registered **custom
  layer groups** (`ctx.layerGroups`) with arbitrary in-game priorities. All support a
  `parallax` camera-follow factor, persist per map inside `@extended_layers`, and
  render in-game via the bundled plugin — even without the mod installed.
- **Events** — list / create / move / update RMXP-style events, plus
  `ctx.events.registerCommand` to add **custom event commands** with declarative
  forms (number, text, select, coordinate, graphic, audio, …) that compile to
  runnable in-game Script commands and stay re-editable.
- **Custom UI** — register editing **tools**, **menu items** (with icons & shortcuts),
  dockable **panels**, **dialogs** (confirm / input / custom), **toasts**, Canvas2D
  **overlays**, **context-menu items**, **toolbar / status-bar items**, and global
  **shortcuts**. Panel and dialog UI inherits the editor's theme CSS variables.
- **Selectors** — promise-based modal pickers for every RPG record (actor, class,
  skill, item, weapon, armor, enemy, troop, state, animation, common event, switch,
  variable, map, event, tileset, audio, graphic, keyboard button, coordinate).
- **Project data** — read-only access to project record lists (actors, classes,
  skills, items, weapons, armors, enemies, troops, states, animations, common
  events), switch / variable name arrays, and the map-info list.
- **Event bus** — 25 stable editor events; `save.before` and `paste.before` are
  cancellable.
- **Lifecycle hooks** — `onMapLoad`, `onSave`, `onActivate`, `onDeactivate`,
  `onToolChange`, `onLayerChange`, `onUndo` / `onRedo`, `onBrushChange`,
  `onTilesetChange`.
- **Filesystem & persistence** — path-scoped filesystem (mod folder + project
  folder), per-mod K/V `storage`, OS text `clipboard` (system-wide), and a
  namespaced `log`.
- **Runtime queries** — `ctx.mods` / `ctx.plugins` for feature detection and soft
  dependencies, `ctx.keybinds` to read and modify keyboard shortcuts, and `ctx.stats`
  for editor usage statistics plus custom mod statistics.
- **Direct Tauri access** — mods can invoke registered backend commands via
  `window.__TAURI__.core.invoke(...)` for file I/O, image / tileset work, and native
  dialogs.

### Stability

CI runs the bundled example mods as smoke tests and asserts their `ModContext`
shape snapshot on every PR — accidental changes to the contract surface fail the
build.
