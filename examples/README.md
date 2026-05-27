# Example Mods

Reference mods you can clone, study, and adapt. None of these are listed in `index.json` — they ship with the editor binary itself (under `examples/mods/`). The copies here exist so authors can browse them on GitHub without owning a local editor checkout.

Each mod folder is self-contained: `manifest.json`, `index.js`, and a `README.md` walkthrough that explains what the code does and the API surface it uses.

## Layout

```
examples/mods/
├── hello-world/
│   ├── manifest.json
│   ├── index.js
│   └── README.md       ← walkthrough renders on GitHub when you click into the folder
├── achievements/
│   └── ...
└── ...
```

## Index

| Mod | What it shows |
|-----|---------------|
| [`hello-world`](mods/hello-world/) | The smallest mod: toast on map load, menu item, keyboard shortcut |
| [`achievements`](mods/achievements/) | Custom stats + stat watchers + achievement unlocks |
| [`extra-export`](mods/extra-export/) | Plain-text map export + nested map-tree context menu |
| [`tile-stats`](mods/tile-stats/) | Live histogram panel + view options readout |
| [`image-to-tileset`](mods/image-to-tileset/) | Convert an image into a tileset via Tools menu |
| [`tile-highlighter`](mods/tile-highlighter/) | Canvas overlay + map-tile context menu highlights |
| [`event-inspector`](mods/event-inspector/) | Inspect / clone events via map-event context menu |
| [`quick-tools`](mods/quick-tools/) | View toggle shortcuts + fill-layer with undo grouping |
| [`discord-rich-presence`](mods/discord-rich-presence/) | Discord status: project, current map, elapsed time |

## How to run an example locally

1. Pick a folder under `examples/mods/`.
2. Copy it into one of your mods folders:
   - **Global** (always loaded): `%APPDATA%/maker-studio/Mods/<example-folder>/`
   - **Project** (per-project): `<gameRoot>/Plugins/MakerStudio/003_Editor/Mods/<example-folder>/`
3. Restart the editor (or use **Mods → Mod Manager → Rescan**).
4. The mod appears in the Mod Manager. Open the matching `README.md` inside the folder to learn what it does.

## How to copy an example as a starting point for your own mod

1. Copy the example folder under a new name.
2. Edit `manifest.json`:
   - Change `id` to your own reverse-DNS (e.g. `com.yourname.yourmod`).
   - Change `name`, `authors`, `description`.
   - Reset `version` to `1.0.0`.
3. Edit `index.js` — write your own logic, keep what you need from the example.
4. Rewrite the folder's `README.md` to describe your mod.
5. Test locally (drop into the mods folder above).
6. When ready to publish, follow [PUBLISHING.md](../PUBLISHING.md).

## API hint

Each example uses a small slice of the Mod API exposed through `ctx`:
`ctx.editor`, `ctx.map`, `ctx.tileset`, `ctx.events`, `ctx.tools`, `ctx.menu`,
`ctx.commands`, `ctx.ui`, `ctx.bus`, `ctx.fs`, `ctx.storage`, `ctx.log`,
`ctx.lifecycle`, `ctx.stats`, `ctx.keybinds`, `ctx.selectors`, `ctx.projectData`.

For the full method reference, event payloads, and TypeScript types, see **[../docs/](../docs/)**. Reading one or two examples in tandem with `docs/api-reference.md` is the fastest way to internalize the surface.
