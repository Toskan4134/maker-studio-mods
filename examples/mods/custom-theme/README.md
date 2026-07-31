# Example: Custom Theme

An editor theme, using VS Code's One Dark Pro as the worked example. **One**
entry in View → Theme with two looks: turn Dark Mode off and it becomes One Light, the
Atom palette One Dark was derived from.

### What it does

1. Registers a single theme that declares both a `dark` and a `light` variant,
   so it follows the editor's Dark Mode toggle instead of pinning the scheme.
2. Overrides the app's colour tokens in each variant — surfaces, text, the blue
   accent, the event-command list hues, and the Ruby syntax colours in the
   Scripts editor.
3. Restyles a few named regions (`data-ms-part`) that colour alone doesn't
   reach: the menu bar, toolbar, status bar, panel headers, dialogs, and the
   blue rule under the active tab.

Both variants come out of one `vars(palette)` / `css(palette)` pair. A light
theme is not a dark theme with the colours flipped — but it is the same set of
*roles*, so the roles live in one place and each palette fills them in.

Declaring only one of the two would have forced that scheme and locked the Dark
Mode toggle, which is the right call for a theme that only works one way.

### Concepts covered

| Concept                  | API used                                        |
|--------------------------|-------------------------------------------------|
| Registering a theme      | `ctx.theme.register({ id, name, base, dark, light })` |
| Light + dark in one theme| `dark` / `light` variants                        |
| Colour tokens            | `vars` — any `--custom-property` the app reads   |
| Styling by named region  | `[data-ms-part="toolbar"]` and friends           |
| Logging                  | `ctx.log.info(...)`                              |

### Try it

1. Copy this folder into `<gameRoot>/Plugins/MakerStudio/003_Editor/Mods/`.
2. Open the project in the editor.
3. **View → Theme → One Dark Pro**.
4. Toggle **View → Dark Mode** — the same theme switches between its dark and
   light halves.

The choice sticks between sessions, and **View → Theme → Default** goes back to
the built-in dark/light.

### Notes

- Registering a theme changes nothing on its own — every rule is scoped to the
  theme, and only applying it has any effect. That is also why two theme mods
  can be installed at once: the user picks which one is active instead of the
  two fighting over the cascade.
- `base` is the built-in palette behind whatever a theme doesn't set, so a token
  added to the app later doesn't leave a hole. With both variants declared it no
  longer decides the scheme — the Dark Mode toggle does, which is also what sets
  `color-scheme` and therefore how native controls and scrollbars render.
- Style through `data-ms-part`, not app class names — those are internal and do
  change. The parts are `menubar`, `toolbar`, `statusbar`, `panel-header`,
  `dialog` and `canvas`.
- The map canvas is a `<canvas>`, so CSS cannot reach inside it. `--canvas-bg`
  sets the colour around the map; for a picture behind the map use
  `canvas: { image: await ctx.theme.assetUrl("bg.png") }` instead of trying to
  make the canvas transparent.
