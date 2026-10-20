# Discord Rich Presence

Shows your current project, map name, and elapsed time in Discord.

> Maker Studio now has rich presence built in (**Settings → Editor → Show my activity in Discord**).
> Keep this mod as an IPC example only: running it alongside the built-in presence makes the two
> overwrite each other's status.

## What you'll learn

- Calling Tauri IPC commands directly from a mod
- Reacting to `map.loaded` / `map.unloaded` events
- Using `ctx.map.info()` to get map names
- Cleanup on mod disable

## Prerequisites

1. Create a Discord Application at [discord.com/developers/applications](https://discord.com/developers/applications)
2. Copy the **Application ID**
3. (Optional) Upload rich presence art assets under **Rich Presence → Art Assets**

## Source

```js
const DISCORD_APP_ID = "YOUR_APP_ID";

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
  connect(ctx).then(() => updatePresence(ctx));

  ctx.bus.on("map.loaded", () => updatePresence(ctx));
  ctx.bus.on("map.unloaded", () => updatePresence(ctx));

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
  if (connected) {
    try {
      await invoke("discord_rpc_clear");
      await invoke("discord_rpc_disconnect");
    } catch (_) {}
    connected = false;
  }
}
```

## How it works

1. **`activate(ctx)`** — connects to Discord IPC via `discord_rpc_connect`, then sets initial presence.
2. **`map.loaded` / `map.unloaded`** — re-evaluates `ctx.editor.activeMapId()`. If a map is open, reads its name via `ctx.map.info(mapId).name`. If none, shows idle.
3. **`deactivate()`** — clears presence then disconnects. The Rust backend also implements `Drop` on the connection state, so presence is cleaned up even if the app exits unexpectedly.
4. **Reconnect menu** — resets connection state and reconnects, useful if Discord was closed and reopened.

## Key patterns

- **Direct Tauri IPC**: `window.__TAURI__.core.invoke("command_name", { args })` calls Rust commands not exposed through `ctx`.
- **Map names**: `ctx.map.info(mapId)` returns `{ id, name, width, height, tilesetId, layerCount }`. Use the `name` field for display.
- **Elapsed time**: `startTimestamp` is set once on connect. Discord displays "X minutes elapsed" automatically.
