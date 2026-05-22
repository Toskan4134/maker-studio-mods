# Example: Custom Event Commands

Registers brand-new RMXP event commands that show up on their own page in the
Event Commands picker, edited through a native dialog built from a declarative
field schema. The form is essentially a **builder for a Script command**:
filling it in generates plain Ruby that runs in-game directly — there is no
runtime dispatcher. Demonstrates `ctx.events.registerCommand`.

### What it does

1. **Camera Scroll To** — generates the literal script
   `pbCameraScrollTo(x, y[, speed])`. Its dialog uses:
   - a **coordinate field** (`target`) built exactly like Transfer Player's
     destination — a **Source** dropdown:
     - *Direct appointment* — a map-dialog picker button **plus** editable X / Y numbers,
     - *Appoint with variables* — X / Y variable pickers (emits `$game_variables[id]`),

     (`showMapSelector` adds the Map ID dimension + map tree; the example leaves it off
     so the picker is locked to the current map),
   - a **checkbox** (`useSpeed`) — when unchecked the `speed` argument is omitted, so it defaults to **nil**,
   - a **number** field for `speed`, **hidden until "Set speed" is checked**.
2. **Raw Snippet** — a command with **no `fields`**, so the editor shows the
   default freeform **script textarea**. With no `parse`, the inserted command
   simply becomes an ordinary Script command.

### Concepts covered

| Concept                  | API used                                                        |
|--------------------------|-----------------------------------------------------------------|
| Declarative command      | `ctx.events.registerCommand({ id, name, fields, script, parse, summary })` |
| Coordinate field (Transfer-Player) | `{ type: "coordinate", key, label, showMapSelector? }` → `{ mode, mapId, x, y, varMapId, varX, varY }` |
| Conditional show/disable | `hidden` / `disabled: (params) => boolean` on a field           |
| Generated script         | `script(params) => "pbCameraScrollTo(...)"` (stored as a Script command) |
| Re-editable round-trip   | `parse(text) => params \| null` recovers the form from the script |
| Optional/nil argument    | `checkbox` gate (`useSpeed`) + hidden `number` (`speed`)        |
| Script-fallback command  | omit `fields` → editor renders a script textarea                |

### How it runs in-game

A mod command is stored as an ordinary **Script command (code 355)** whose text
is exactly what `script(params)` returns:

```
pbCameraScrollTo(0, -4)              # Direct appointment (picked or typed)
pbCameraScrollTo($game_variables[5], $game_variables[6], 8)   # variables + speed
```

That round-trips through `.rxdata` unchanged and the engine runs it like any
other event script — **no plugin code or handler registration is required**.
`parse` lets the editor recognise the script later so the row still reads
*Camera Scroll To* and double-clicking reopens the form with the X/Y restored.

> `pbCameraScrollTo` must exist in your game's scripts (Pokémon Essentials).
> Swap the `script`/`parse` for whatever call your project provides.

### Try it

1. Copy this folder into `<gameRoot>/Plugins/MakerStudio/003_Editor/Mods/`.
2. Open the editor, open a map event, and click **Insert** in the command list.
3. In the Event Commands picker, open the first **🧩** (mod) page → choose **Camera Scroll To**.
4. Pick a **Source** for the target tile, set it, optionally tick **Set speed**
   (the speed box appears), click OK.
5. The list row reads `@>Camera Scroll To: (x, y)`. Re-open it — the values round-trip.
6. Pick **Raw Snippet** to see the script-textarea fallback.

> Mod commands can be favourited like built-in ones (the ★ button) — they're
> tracked separately by registry key since they all share code 355.
