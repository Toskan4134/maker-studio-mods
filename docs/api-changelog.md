# API Changelog

The mod API follows [semver](https://semver.org):

- **Major** — breaking changes. Existing mods targeting the previous major version are routed through a compatibility shim. If no shim exists, the mod is refused with a clear error in the Mod Manager.
- **Minor** — additive changes (new optional fields, new event names, new context methods). Old mods keep working without changes.
- **Patch** — internal-only fixes; no observable changes.

When a major bump happens, this file gets a section with the new shape and a link to a migration guide.

---

## Additions since 1.0.0

- **`PanelDef.defaultSize`**: `{ width, height }` (px), sets the floating window's size the
  very first time a panel opens — before it has a dock position or the user has resized it.
  Default unchanged (`{ width: 480, height: 360 }`). Additive: mods that don't set it see no
  change. See [api-reference.md](./api-reference.md) (`ui.registerPanel`).
- **New bus event `keybind.triggered`**: `{ actionId: string }`, fires when the global
  shortcut dispatcher resolves a keydown to a built-in action, right before it calls
  `e.stopImmediatePropagation()`. That call is why a mod's own `keydown` listener — on
  `window` or `document`, any phase — never sees the event for a shortcut that actually
  fired: the dispatcher is mounted on `window` in the capture phase before any mod loads,
  so it always runs first. This event is the only reliable way to know "the keyboard was
  just used for X"; don't try to reconstruct it by listening for raw `keydown` yourself.
  Doesn't cover mod-registered shortcuts (`registerMenuItem`'s `shortcut`,
  `ui.registerShortcut`) — those resolve on a separate path. See
  [events-reference.md](./events-reference.md).
- **`ctx.editor.viewOptions()` / `setViewOptions()` gain `showEventCells`**, matching the
  editor's "Toggle Event Cells" view option (`view.toggleEventCells` keybind) — previously
  unreadable and unwritable by mods. Additive: existing destructuring of the returned object
  keeps working. See [api-reference.md](./api-reference.md) (`editor`).
- **New bus event `game.launch`**: `{ gameRoot: string }`, fires once per Run Game invocation
  (toolbar button, menu item, or the `app.runGame` shortcut) regardless of outcome — a
  reliable "the user asked to run the game" signal, since there's no other way to observe
  that action (it's momentary, not a toggleable state). See
  [events-reference.md](./events-reference.md).
- **Toast action buttons** (`ctx.ui.showToast`). `ToastOptions` gains optional
  `action` and `secondaryAction`, each `{ label, onClick }` — up to two clickable
  buttons on a toast, secondary rendered left of primary. Clicking either dismisses
  the toast, then runs `onClick`. Also new: **`ctx.ui.openKeyboardShortcuts(actionId?)`**
  opens the editor's native Keyboard Shortcuts dialog (same as Help → Keyboard
  Shortcuts…); pass a built-in `actionId` and it opens pre-scrolled to that row,
  already listening for a keypress — pair it with a toast button to send the user
  straight into rebinding a specific action. Additive: mods that never set
  `action`/`secondaryAction` see no change. See [api-reference.md](./api-reference.md) (`ui`).
- **`ctx.selectors.pickGraphic(..., { allowTileSelect: true })`**. Offers **tile picking**, but only
  once the chosen graphic is a **tileset** (one living in `Graphics/Tilesets`): the preview then
  gains a tile grid, click picks one tile and drag picks a block. Any other graphic is unaffected,
  so the option is safe to leave on. The selection comes back on `GraphicPickResult.srcRect` as
  `{ x, y, w, h }` in source-image pixels — always a whole number of 32px tiles — with `w`/`h` of 0
  meaning the whole image (which is also what you get without the option), so existing code reads
  unchanged. The editor treats the selection as if it *were* the whole image: the sheet grid divides
  it and `direction`/`pattern` index inside it, and picking tiles sets `sheetCols`/`sheetRows` to
  match. In-game it needs the MakerStudio plugin — the editor's own event/picture graphics carry the
  same field, so a project that has the plugin honours what you picked.

- **`ctx.theme`** (`ThemeCtx`). Register editor themes: `register({ id, name, base, vars?, css?, canvas? })`,
  `apply(id | null)`, `current()`, `list()`, and `assetUrl(relPath)` for turning a file in your mod
  folder into a `data:` URI. One theme is active at a time, chosen in **View → Theme** and
  remembered between sessions; a theme's rules are scoped to it, so registering one changes nothing
  until it is applied, and unloading your mod removes it. `canvas.image` is painted by the map
  renderer itself, under the map — no transparent `--canvas-bg` and no z-ordered overlay. Stable
  hooks for the CSS: `data-ms-part="menubar|toolbar|statusbar|panel-header|dialog|canvas"`.
  A theme declares `dark` / `light` variants to follow the editor's Dark Mode toggle (one entry in
  View → Theme, two looks); declaring only one of them — or neither — forces that scheme and locks
  the toggle while the theme is active.
- **`ctx.fs.readModFileBytes(relPath)`**. Raw bytes from your own mod folder, for images and fonts.

- **`manifest.tags`** (`ModManifest`). Optional `string[]` of Marketplace search/filter tags,
  e.g. `["tilesets", "ui"]`. The editor records them; the publishing workflow copies them into
  your `index.json` entry, slugging each one to the registry's `^[a-z0-9-]+$` (so `"Terrain
  Tags"` becomes `terrain-tags`) and keeping the first 8. Additive: omit it and nothing changes
  — the registry maintainer picks your tags on review, as before.

- **Mod command tabs** (`ModCommandDef`, `ctx.events.registerCommand`). `page` is now
  functional: it titles the command's own tab in the event-command picker, and commands
  sharing the same `page` string collect under one named tab (omit it and they group under
  the mod id). New optional `pageDescription` fills the one-line description strip shown
  beneath that tab while it is active — among commands sharing a page, the first one that
  sets it wins. Additive: existing mods keep working; a command with no `page` simply gets a
  tab named after its mod. See [api-reference.md](./api-reference.md) (`events.registerCommand`).

- **Tileset Editor glyph styling** (`ctx.tileset`). `registerPriority` takes an optional
  `color` (any CSS colour) that paints that level's marker on the tile and its chip in the
  Priority dropdown; without one the built-in five-colour cycle continues, so id 6 still
  reuses id 1's colour. New **`setGlyphStyle(style)`** restyles every marker the Tileset
  Editor draws — `passageOpen` / `passageBlocked` / `passagePartial`, `bush`, `counter`,
  `terrain`, the cycling `priority` list, `neutral` (priority 0 and flags-off), plus
  `shadowColor`, `shadowBlur` and `strokeWidth` (the last two as fractions of the tile cell
  size; `shadowBlur: 0` turns the shadow off). Every field is optional and merged over the
  defaults, later registrations win per field, and the returned `Disposable` restores the
  defaults on unload. Additive: mods that never call it see no change. See
  [api-reference.md](./api-reference.md) (`tileset`).

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

- **`PublicEventPage.always_on_bottom`** (`ctx.events`). Maker Studio's mirror of RPG Maker XP's
  `always_on_top`: the event draws **below** every character. `getFull()` reports it and
  `update()` writes it, like every other page field. `always_on_top` wins when both are set, and
  the flag only takes effect in-game with the MakerStudio plugin installed. Additive: mods that
  never touch the field keep working unchanged. See
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
