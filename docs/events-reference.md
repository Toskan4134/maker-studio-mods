# Events Reference

All event names and payload shapes. Listen via `ctx.bus.on(name, fn)`. Emit
via `ctx.bus.emit(name, payload)` (rarely needed — most mods only listen).

The TypeScript source of truth is the `EventMap` interface in
[`mod-api.d.ts`](./mod-api.d.ts).

| Event                | Payload                                                                  | Cancellable |
|----------------------|---------------------------------------------------------------------------|-------------|
| `map.loaded`         | `{ mapId, width, height }`                                                | no          |
| `map.unloaded`       | `{ mapId }`                                                               | no          |
| `map.tile.changed`   | `{ mapId, layer, x, y, oldId, newId }` (single-tile writes only)          | no          |
| `map.batch.changed`  | `{ mapId, layer, count, label }`                                          | no          |
| `tool.activated`     | `{ toolId }`                                                              | no          |
| `selection.changed`  | `{ mapId, bounds, count }`                                                | no          |
| `save.before`        | `{ mapId }`                                                               | **yes**     |
| `save.after`         | `{ mapId }`                                                               | no          |
| `save.failed`        | `{ mapId, error: string }`                                                | no          |
| `mod.loaded`         | `{ id }`                                                                  | no          |
| `mod.unloaded`       | `{ id }`                                                                  | no          |
| `panel.opened`       | `{ panelId }`                                                             | no          |
| `panel.closed`       | `{ panelId }`                                                             | no          |
| `layer.changed`      | `{ mapId, layerIndex, change }`                                           | no          |
| `viewport.changed`   | `{ mapId, x, y, zoom }`                                                   | no          |
| `hover.changed`      | `{ mapId, x: number\|null, y: number\|null }`                             | no          |
| `clipboard.changed`  | `{ hasData: boolean, tiles?: number }`                                    | no          |
| `brush.changed`      | `{ size, rotation, flipH, flipV, opacity, hue, saturation, lighting }`   | no          |
| `tileset.changed`    | `{ tilesetId, reason: "selected"\|"edited"\|"reloaded" }`                | no          |
| `undo`               | `{ mapId, label }`                                                        | no          |
| `redo`               | `{ mapId, label }`                                                        | no          |
| `event.changed`      | `{ mapId, eventId, change: "created"\|"deleted"\|"moved"\|"updated" }`   | no          |
| `paste.before`       | `{ mapId, x, y, tileCount }`                                              | **yes**     |
| `stats.changed`      | `{ global: GlobalStatsSnapshot, project: ProjectStatsSnapshot \| null }`  | no          |
| `keybind.changed`    | `{ actionId: string, oldKey: string, newKey: string }`                   | no          |

## When events fire

- **`map.loaded`** — after a map's tiles, layers, and shadow data have been
  loaded into memory and a tab opened. Safe time to query `ctx.map.info(...)`.
- **`map.unloaded`** — after a map tab is closed and removed from the editor.
  `ctx.editor.activeMapId()` returns `null` when the last map is closed.
- **`map.tile.changed`** — fires once for each single-tile edit. For brush
  strokes that write many tiles, `map.batch.changed` fires once with the
  total count.
- **`map.batch.changed`** — fires for every tile write batch (brush, fill,
  rectangle, paste, undo/redo). Use this when you want a coarse "the map
  changed" signal.
- **`save.before`** — fires before the editor writes the map's `.rxdata`
  file. **Cancellable.** Return `{ cancel: true, reason: "..." }` to abort.
  Listeners are awaited in registration order; the first cancel wins.
- **`save.after`** — fires after a successful write. A good place to
  generate companion artefacts (XML exports, manifests, etc.).
- **`tool.activated`** — fires when the user (or a mod) switches the
  active tool, including switches to mod-registered tools.
- **`mod.loaded` / `mod.unloaded`** — fires for any mod including
  yours. Useful when a mod depends on optional collaborators.
- **`panel.opened` / `panel.closed`** — fires when a mod panel is opened
  or closed in the dock.
- **`selection.changed`** — fires when the tile selection changes (set,
  clear, modify).
- **`layer.changed`** — fires when a layer is mutated. `change` is one of:
  `"visibility"`, `"opacity"`, `"added"`, `"removed"`, `"active"`.
- **`viewport.changed`** — fires when the map viewport pans or zooms.
- **`hover.changed`** — fires when the cursor moves to a different tile. `x`/`y` are `null` when the cursor leaves the map canvas.
- **`clipboard.changed`** — fires after any copy, cut, or clipboard clear. `tiles` is the count of copied tiles (absent when cleared).
- **`brush.changed`** — fires when the user changes any brush property (size, rotation, flip, opacity, hue, saturation, lighting).
- **`tileset.changed`** — fires when the palette tileset is switched (`"selected"`), a tileset property is edited (`"edited"`), or tilesets are reloaded from disk (`"reloaded"`).
- **`undo`** / **`redo`** — fire after a successful undo or redo. `label` is the undo entry description.
- **`save.failed`** — fires when a save operation throws an error. `error` is the error message string.
- **`event.changed`** — fires after any RMXP event mutation (create, delete, move, update).
- **`paste.before`** — fires before a paste operation is committed. **Cancellable** — return `{ cancel: true, reason: "..." }` to abort. `tileCount` is the number of tiles in the clipboard.
- **`stats.changed`** — fires periodically (~60s) with updated editor statistics snapshots. `global` contains lifetime stats, `project` contains current project stats (or `null` if no project open).
- **`keybind.changed`** — fires when a keybind is changed via the settings dialog or the `ctx.keybinds` API. `actionId` is the affected action, `oldKey` and `newKey` are the normalized combo strings (e.g. `"ctrl+s"`).

## Cancellable handlers

`save.before` and `paste.before` are the cancellable events. Listeners may return a
Promise — the editor awaits all of them with a 5-second per-handler timeout.
A handler that times out is treated as non-cancel and a warning is logged.

```js
ctx.bus.on("save.before", async (e) => {
  const ok = await checkSomething(e.mapId);
  if (!ok) return { cancel: true, reason: "validation failed" };
});
```

## Inter-mod events

Mods can emit and listen to the standard events freely. There is no
sandboxing in v1 — all mods share the same bus. Use the `commands` API
(via `ctx.commands.register/execute`) for direct request/response patterns
where the bus would be awkward.

## Custom event commands (not bus events)

Distinct from the editor event **bus** above, a mod can also register a custom
**RMXP event command** that map makers insert into event pages — see
[`events.registerCommand`](./api-reference.md). These are not emitted on the bus;
they are stored on the map and run in-game.

Each mod command is saved as a standard RMXP Script command (code 355) whose
`parameters[0]` is the literal Ruby that the command's `script(params)` returns
(e.g. `pbCameraScrollTo(0, -4)`). This keeps the map's `.rxdata` round-tripping
unchanged, passes `validateEvent` (355 is a known code), and runs in-game like
any other event script — there is no runtime dispatcher or handler to register.
