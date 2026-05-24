/**
 * Custom Tile Properties — adds new terrain tags + tile priorities to the
 * Tileset Editor's **Terrain Tag** / **Priority** dropdowns.
 *
 * Demonstrates: ctx.tileset.registerTerrainTag, ctx.tileset.registerPriority.
 *
 * The chosen id is written verbatim to @terrain_tags / @priorities in
 * Tilesets.rxdata (Table1, i16, no clamp). The editor only contributes the
 * picker label + selectable range — there is NO runtime dispatcher. To make a
 * tag DO something in-game, read it back in your own game scripts:
 *
 *   RMXP / BES / LBDS:    tag = $game_map.terrain_tag(x, y)   # plain Integer
 *   Pokemon Essentials:   tag = $game_map.terrain_tag(x, y)   # resolves via PBTerrain;
 *                         to get a named GameData::TerrainTag, also add the id to
 *                         PBS/terrain_tags.txt — otherwise read the raw integer.
 *
 * then branch on the value, e.g.  `if tag == 18 then # Lava ... end`.
 */

// Custom terrain tags — ids 18+ (0-17 are the built-in Essentials defaults).
const TERRAIN_TAGS = [
  { id: 18, name: "Lava" },
  { id: 19, name: "Swamp" },
  { id: 20, name: "Spikes" },
];

// Custom tile priorities — ids 6+ (0-5 are built-in: 0 = ground, 1-5 = overhead).
const PRIORITIES = [
  { id: 6, name: "Above 6" },
  { id: 7, name: "Above 7" },
];

export function activate(ctx) {
  // These methods are optional in the API — guard so the mod degrades cleanly
  // on an editor that predates them.
  if (!ctx.tileset.registerTerrainTag || !ctx.tileset.registerPriority) {
    ctx.log.warn("This editor build has no registerTerrainTag/registerPriority; update Maker Studio.");
    ctx.ui.showToast({ message: "Custom Tile Properties needs a newer Maker Studio build", level: "warn" });
    return;
  }

  for (const t of TERRAIN_TAGS) ctx.tileset.registerTerrainTag(t);
  for (const p of PRIORITIES) ctx.tileset.registerPriority(p);

  ctx.log.info(`Registered ${TERRAIN_TAGS.length} terrain tags + ${PRIORITIES.length} priorities`);
  ctx.ui.showToast({
    message: "Custom tile properties added — open the Tileset Editor's Terrain Tag / Priority dropdowns",
    level: "info",
  });
}

// Registrations return Disposables tracked by the mod's auto-cleanup bag, so
// they are removed automatically on unload — no deactivate() needed.
