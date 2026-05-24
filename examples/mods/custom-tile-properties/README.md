# Custom Tile Properties

Adds custom **terrain tags** and **tile priorities** to the Tileset Editor's
dropdowns, on top of the built-in values.

## What it does

On activate it registers:

- Terrain tags `18: Lava`, `19: Swamp`, `20: Spikes` (built-in tags are `0–17`).
- Priorities `6: Above 6`, `7: Above 7` (built-in priorities are `0–5`).

Open the Tileset Editor, switch to **Terrain Tag** or **Priority** mode, and the
new entries appear in the searchable dropdown. Selecting one paints that integer
into `@terrain_tags` / `@priorities` in `Tilesets.rxdata` exactly like a built-in
value.

## API used

```js
ctx.tileset.registerTerrainTag({ id: 18, name: "Lava" });
ctx.tileset.registerPriority({ id: 6, name: "Above 6" });
```

- `id` is the integer stored on the tile (no clamp; use 18+ for tags, 6+ for
  priorities to avoid clobbering built-ins).
- Duplicate ids are ignored (first registration wins).
- Both return a `Disposable` and are auto-removed when the mod unloads.

## Making a tag do something in-game

The editor only contributes the **picker label + range** — there is no runtime
dispatcher. Read the value back in your own game scripts and branch on it:

```ruby
tag = $game_map.terrain_tag(x, y)   # RMXP/BES/LBDS: Integer
if tag == 18                        # Lava
  # ... your behavior ...
end
```

In Pokemon Essentials, `terrain_tag` resolves through `PBTerrain` /
`GameData::TerrainTag`; add the id to `PBS/terrain_tags.txt` for a named tag, or
read the raw integer if you only need the value.
