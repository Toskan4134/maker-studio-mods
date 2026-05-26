/**
 * Discord Rich Presence — shows project name, current map, and elapsed time
 * in your Discord status.
 *
 * Requires a Discord Application ID. Set it below or the mod will warn on load.
 * Create one at https://discord.com/developers/applications
 *
 * Demonstrates: ctx.editor, ctx.bus, ctx.ui.showToast, ctx.map.info,
 *               window.__TAURI__ IPC.
 */

const DISCORD_APP_ID = '1498950175740137595';

const invoke = window.__TAURI__.core.invoke;

let connected = false;
let startTime = Date.now();
let currentMapName = null;

function projectName(gameRoot) {
  if (!gameRoot) return null;
  const parts = gameRoot.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || null;
}

async function connect(ctx) {
  if (connected) return;
  try {
    await invoke("discord_rpc_connect", { appId: DISCORD_APP_ID });
    connected = true;
    startTime = Date.now();
    ctx.log.info("Connected to Discord RPC");
  } catch (e) {
    ctx.log.warn(`Discord RPC connect failed: ${e}`);
  }
}

async function updatePresence(ctx) {
  if (!connected) return;

  const gameRoot = ctx.editor.gameRoot();
  const project = projectName(gameRoot);
  const mapId = ctx.editor.activeMapId();

  let state;
  if (mapId != null) {
    const info = ctx.map.info(mapId);
    currentMapName = info ? info.name : `Map ${mapId}`;
    state = `🗺️ ${currentMapName}`;
  } else {
    currentMapName = null;
    state = "⌛ Idling";
  }

  const details = project
    ? `📂 ${project}`
    : "Maker Studio";

  try {
    await invoke("discord_rpc_update", {
      details,
      stateText: state,
      startTimestamp: startTime,
      largeText: "Maker Studio",
    });
  } catch (e) {
    ctx.log.warn(`Discord RPC update failed: ${e}`);
    connected = false;
  }
}

export function activate(ctx) {
  connected = false;
  // Delay Discord connection so it doesn't compete with mod loading.
  // The Rust command is async (spawn_blocking) so it won't freeze IPC,
  // but giving it a beat avoids overlapping with other initialization.
  setTimeout(() => {
    connect(ctx).then(() => updatePresence(ctx));
  }, 300);

  ctx.bus.on("map.loaded", () => {
    updatePresence(ctx);
  });

  ctx.bus.on("map.unloaded", () => {
    updatePresence(ctx);
  });

  ctx.menu.registerMenuItem({
    menu: "Mods",
    label: "Discord RPC — Reconnect",
    handler: () => {
      connected = false;
      connect(ctx).then(() => updatePresence(ctx));
      ctx.ui.showToast({ message: "Discord RPC reconnecting...", level: "info" });
    },
  });
}

export async function deactivate() {
  try {
    await invoke("discord_rpc_clear");
    await invoke("discord_rpc_disconnect");
  } catch (_) {}
  connected = false;
}
