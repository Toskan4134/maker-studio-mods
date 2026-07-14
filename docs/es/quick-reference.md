# Referencia rápida

Chuleta de una página para las llamadas más comunes de la API de mods.

## Punto de entrada

```js
export function activate(ctx) {
  // Tu mod empieza aquí. ctx = contexto del mod (ModContext)
}

export function deactivate() {
  // Limpieza opcional. Los elementos auto-descartados no necesitan limpieza manual.
}
```

## Mod multi-archivo (opcional)

```js
// utils.js — colócalo junto a index.js en la carpeta de tu mod
export function myHelper() { return 42; }

// index.js (entry, coincide con "main" del manifest)
import { myHelper } from './utils.js';  // specifier relativo obligatorio

export function activate(ctx) {
  ctx.ui.showToast({ message: `Answer: ${myHelper()}`, level: "info" });
}
```

Se descubren todos los archivos `.js` del directorio del mod (incluidos subdirectorios). Solo se reescriben los imports relativos `./` y `../`. Los mods CommonJS siguen siendo de un solo archivo.

## Mostrar un toast

```js
ctx.ui.showToast({ message: "Done!", level: "info" });
// level: "info" | "warn" | "error"
```

## Añadir un elemento de menú

```js
ctx.menu.registerMenuItem({
  menu: "Mods",
  label: "My Action",
  icon: "database",          // opcional: nombre de icono integrado, markup SVG o glifo unicode
  shortcut: "Ctrl+Shift+D",  // opcional: registra un binding real y reasignable (NO solo una pista)
  handler: () => { /* haz algo */ },
  isEnabled: () => true,
});
// `shortcut` vincula la tecla y dispara `handler`; es reasignable en el diálogo
// Keyboard Shortcuts del editor (sección "Mods"). No llames también a registerShortcut
// con la misma tecla — eso la doble-registra.
```

## Escuchar eventos del editor

```js
ctx.bus.on("map.loaded", (e) => {
  console.log(e.mapId, e.width, e.height);
});

ctx.bus.on("map.tile.changed", (e) => {
  console.log(e.mapId, e.layer, e.x, e.y, e.oldId, e.newId);
});

ctx.bus.on("save.before", async (e) => {
  return { cancel: true, reason: "not ready" }; // cancelar guardado
});
```

## Leer y escribir tiles

```js
const tileId = ctx.map.readTile(mapId, layer, x, y);
ctx.map.writeTile(mapId, layer, x, y, newTileId, "paint");
```

## Leer info del mapa

```js
const info = ctx.map.info(mapId);
// { id, name, width, height, tilesetId, layerCount }

const layers = ctx.map.layers(mapId);
// [{ index, name, visible, opacity, kind }]
```

## Leer datos de tileset

```js
const blobUrl = await ctx.tileset.getImageBlobUrl(tilesetId);
const props = ctx.tileset.getTileProperties(tilesetId, tileId);
// { passage, priority, terrainTag }
```

## Añadir terrain tags / prioridades personalizadas

```js
// Aparecen (con nombre) en los desplegables Terrain Tag / Priority del editor de tilesets.
// Ids integrados: terrain tags 0-17, prioridades 0-5 — usa 18+ / 6+ para personalizados.
ctx.tileset.registerTerrainTag({ id: 18, name: "Lava" });
ctx.tileset.registerPriority({ id: 6, name: "Above 6" });
// El id elegido se escribe literalmente en @terrain_tags / @priorities. Sin dispatcher
// de runtime — léelo en el juego vía $game_map.terrain_tag(x, y) y ramifica según él.
```

## Grupos de capa de fog / panorama / personalizados

```js
// ctx.fog (encima de los tiles) y ctx.panorama (debajo de los tiles) comparten superficie:
const { id } = ctx.panorama.create(mapId, "Sky");        // panorama por defecto: opacity 255, parallax 0.5
ctx.panorama.setConfig(mapId, id, { graphicName: "Clouds", sx: 1, parallax: 0.5 });
ctx.fog.setOpacity(mapId, fogId, 128);
ctx.fog.info(mapId, fogId);   // { id, name, visible, opacity, config }
// config: { graphicName, hue, blendType, zoom, sx, sy, followPlayer, parallax? }
// parallax (0..1, solo anclado al mundo): 1 = con el mapa, 0.5 = panorama RMXP, 0 = fijo a pantalla

// Grupo personalizado con tu propia prioridad de dibujo (< 0 debajo de los tiles, >= 0 encima):
ctx.layerGroups.register(mapId, { key: "my-mod.glow", name: "Glow", priority: 500, folder: "Pictures" });
const layer = ctx.layerGroups.addLayer(mapId, "my-mod.glow", { config: { graphicName: "halo" } });
ctx.layerGroups.updateLayer(mapId, "my-mod.glow", layer.id, { opacity: 96 });
// Los grupos persisten dentro del archivo del mapa — se renderizan en el juego incluso sin el mod.
// key no debe ser "fog"/"panorama"; folder = una sola subcarpeta Graphics/.
```

## Registrar una herramienta personalizada

```js
ctx.tools.registerTool({
  id: "my-mod.magic-wand",
  label: "Magic Wand",
  icon: "✦",
  onActivate() { /* herramienta seleccionada */ },
  onDeactivate() { /* herramienta deseleccionada */ },
  onPointerDown(ev) { /* ev: { mapId, tileX, tileY, layerIndex, buttons, shiftKey, ctrlKey, altKey } */ },
  onPointerMove(ev) { /* ... */ },
  onPointerUp(ev) { /* ... */ },
});
```

## Registrar un panel acoplable

```js
ctx.ui.registerPanel({
  id: "my-mod.my-panel",
  title: "My Panel",
  defaultPosition: "right",
  render(host) {
    host.innerHTML = "<p>Hello from my mod!</p>";
    return () => { /* limpieza al cerrar el panel */ };
  },
});
```

## Igualar el tema del editor

```js
// Los paneles y diálogos personalizados se renderizan en el DOM del editor — sus
// variables CSS de tema cascadean dentro. Usa var(--name) para que tu UI cambie con
// claro/oscuro automáticamente.
host.innerHTML = `<div style="
  background: var(--bg-primary); color: var(--text-primary);
  border: 1px solid var(--border); font-family: inherit; padding: 8px;">…</div>`;
// Comunes: --bg-primary/secondary/tertiary --bg-hover --border --input-bg
//          --text-primary/secondary/tertiary --accent --accent-hover --accent-text
//          --danger --warning --success
// Los overlays de canvas no pueden usar variables CSS — ramifica con ctx.editor.theme().
```

## Registrar un elemento de menú contextual

```js
ctx.ui.registerContextMenuItem({
  context: "map-tile", // o "map-event", "tile-palette", "tile-palette-extra", "layer", "map-tree", "event-editor"
  label: "My Action",
  handler: (info) => { /* info: { mapId, tileX, tileY, tileId, layerIndex, ... } */ },
  isEnabled: (info) => true, // opcional
  parentMenu: "Export Map…", // opcional: anidar dentro de un submenú existente
});
```

## Registrar un overlay

```js
ctx.ui.registerOverlay({
  id: "my-mod.overlay",
  zOrder: 10, // mayor = encima
  render(ctx, info) {
    // ctx: CanvasRenderingContext2D
    // info: { mapId, tileSize, zoom, viewportX, viewportY, canvasWidth, canvasHeight }
    const px = (tileX * info.tileSize - info.viewportX) * info.zoom;
    const py = (tileY * info.tileSize - info.viewportY) * info.zoom;
    ctx.fillStyle = "rgba(255,0,0,0.3)";
    ctx.fillRect(px, py, info.tileSize * info.zoom, info.tileSize * info.zoom);
  },
});
```

## Registrar un atajo de teclado

```js
ctx.ui.registerShortcut("Ctrl+Shift+F", () => {
  // el handler se dispara al pulsar el atajo
});
```

## Traducir tu mod / añadir un idioma

```js
// Nivel 1 — traduce tus propias cadenas (keys = tus cadenas fuente en inglés)
ctx.i18n.addTranslations("es", { "Export finished": "Exportación completada" });
ctx.ui.showToast({ message: ctx.i18n.t("Export finished") });
// búsqueda de t(): dict de tu mod → dict de la app → la cadena fuente. Variables {name} sustituidas después.

// Nivel 2 — registra un locale completo de la app (aparece en View → Language)
ctx.i18n.registerLocale({ code: "fr", name: "Français", dict: frenchDict });
// Reusar un código integrado (p. ej. "es") parchea las cadenas de app de ese locale.

ctx.i18n.getLocale();                 // código de locale activo
ctx.i18n.locales();                   // [{ code, name }]
ctx.i18n.setLocale("fr");
ctx.i18n.onChanged((locale) => { /* re-renderizar */ });   // = bus "locale.changed"
// Todo se auto-descarta al descargar; un locale activo aportado por un mod se restaura
// automáticamente cuando el mod se re-registra (seguro ante hot reload).
```

## Opciones de vista

```js
const opts = ctx.editor.viewOptions();
// { showGrid, showCollision, showEvents, showDim, darkMode }
ctx.editor.setViewOptions({ showGrid: false }); // actualización parcial
```

## Agrupar deshacer

```js
ctx.map.beginUndoGroup("My Operation");
ctx.map.writeTile(mapId, layer, x1, y1, tileId);
ctx.map.writeTile(mapId, layer, x2, y2, tileId);
ctx.map.endUndoGroup(); // todas las escrituras se vuelven un solo paso de deshacer
```

## Operaciones de archivo

```js
// Leer/escribir dentro de la carpeta de tu mod
const data = await ctx.fs.readModFile("config.json");
await ctx.fs.writeModFile("output.txt", "hello");

// Leer/escribir dentro del proyecto de juego
const rxdata = await ctx.fs.readProjectFile("Data/Map001.rxdata");
await ctx.fs.writeProjectFile("exports/map.txt", content);
```

## Almacenamiento persistente

```js
await ctx.storage.set("myKey", { count: 42 });
const val = await ctx.storage.get("myKey", { count: 0 });
```

## Portapapeles de texto del SO

```js
await ctx.clipboard.writeText("hello");
const text = await ctx.clipboard.readText();   // string | null
```

No es el portapapeles de tiles — ese es `ctx.map.getClipboard()` / `setClipboard()`.

## Comandos entre mods

```js
// Registra un comando que otros mods pueden llamar
ctx.commands.register("my-mod.do-thing", async (arg) => {
  return result;
});

// Llama al comando de otro mod
const result = await ctx.commands.execute("other-mod.do-thing", arg);
```

## Leer / escribir los comandos de un evento

```js
const ev = ctx.events.getFull(mapId, eventId);   // pages[].list siempre viene presente

// Reemplazar los comandos de la página 1 (Show Text "Hola")
ev.pages[0].list = [ctx.events.createCommand(101, ["Hola"])];

// ...o añadir a los existentes (quita antes el terminador código 0 del final)
const list = (ev.pages[0].list ?? []).filter((c) => c.code !== 0);
list.push(ctx.events.createCommand(101, ["Una línea más"]));
ev.pages[0].list = list;

const check = ctx.events.validateEvent(ev);      // { valid, errors: ["Unknown command code …"] }
if (check.valid) ctx.events.update(mapId, ev);   // se puede deshacer
// update() vuelve a añadir el terminador código 0 si falta — no tienes que ponerlo tú.
// Omite el `list` de una página para dejar sus comandos intactos.
// createCommand() devuelve indent: 0 — dentro de ramas/bucles fija tú el `indent`.
```

## Registrar un comando de evento personalizado

```js
ctx.events.registerCommand({
  id: "cameraScrollTo",
  name: "Camera Scroll To",
  fields: [
    { type: "coordinate", key: "target", label: "Target tile", showMapSelector: true },
    { type: "checkbox", key: "useSpeed", label: "Set speed" },
    { type: "number", key: "speed", label: "Speed", min: 1, default: 4, hidden: (p) => !p.useSpeed },
  ],
  // El formulario construye un comando Script normal; este Ruby literal corre en el juego.
  script: (p) => `pbCameraScrollTo(${p.target.x | 0}, ${p.target.y | 0}${p.useSpeed ? `, ${p.speed | 0}` : ""})`,
  // parse() recupera los params para que el comando siga con nombre + reeditable.
  parse: (t) => { const m = /^pbCameraScrollTo\((-?\d+), (-?\d+)(?:, (\d+))?\)$/.exec(t);
    return m ? { target: { mode: "direct", mapId: 0, x: +m[1], y: +m[2], varMapId: 1, varX: 1, varY: 1 }, useSpeed: m[3] != null, speed: +m[3] || 4 } : null; },
  summary: (p) => `(${p.target.x}, ${p.target.y})`,
});
// Omite `fields` para un comando de script libre (params.script).
// Tipos de campo: number, text, select, checkbox, switch, variable,
//   coordinate (fuente Direct/Variables de Transfer-Player), record (recordKind),
//   event, graphic (subcarpeta), audio (categoría). Cualquier campo: disabled/hidden(params).
// Aparece en una página de mod con icono de puzle (🧩1, 🧩2, …) en el picker; se guarda como
// comando Script código-355 que corre el texto literal — sin dispatcher de runtime.
```

## Llamar comandos Tauri directamente

```js
const invoke = window.__TAURI__.core.invoke;

// E/S de archivos
const bytes = await invoke("read_binary_file", { path: "/path/to/file" });
await invoke("write_binary_file", { path: "/path/to/file", data: bytes });

// Gestión de archivos
const entries = await invoke("list_directory", { path: "/some/dir" });
const exists = await invoke("file_exists", { path: "/some/file" });
await invoke("copy_file", { src: "/a", dst: "/b" });

// Imagen
const [w, h] = await invoke("get_image_dimensions", { path: "/img.png" });

// Selector de archivos nativo
const filePath = await invoke("plugin:dialog|open", {
  options: { title: "Pick a file", filters: [{ name: "Images", extensions: ["png", "jpg"] }] }
});

// Gestión de tilesets
const newId = await invoke("create_tileset", { gameRoot, name: "My Tileset", tilesetName: "my_tile" });
```

## Hooks de ciclo de vida

```js
ctx.lifecycle.onMapLoad((mapId) => { /* mapa abierto */ });
ctx.lifecycle.onSave((mapId) => { /* mapa guardado */ });
ctx.lifecycle.onActivate(() => { /* tras retornar activate() */ });
ctx.lifecycle.onDeactivate(() => { /* mod descargándose */ });
```

## Estado del editor

```js
const mapId = ctx.editor.activeMapId();
const layer = ctx.editor.activeLayerIndex();
const tool = ctx.editor.activeTool();
const root = ctx.editor.gameRoot();
const maps = ctx.editor.listOpenMaps();

ctx.editor.setTool("brush");
ctx.editor.setActiveLayer(0);
```

## Logging

```js
ctx.log.info("Something happened", { detail: "value" });
ctx.log.warn("Unexpected state");
ctx.log.error(err);
```

## Consultar mods / plugins instalados (runtime)

```js
// Otros mods (deps opcionales/blandas, detección de características):
ctx.mods.list();                         // [{ id, name, version, enabled, status, source }]
ctx.mods.isInstalled("com.author.x");    // presente en cualquier estado
ctx.mods.isActive("com.author.x");       // presente Y en ejecución
ctx.mods.get("com.author.x");            // InstalledModInfo | null

// Plugins de Essentials (de <gameRoot>/Plugins/), meta.txt completo:
ctx.plugins.available();                 // false en v16/BES (sin dir Plugins/)
ctx.plugins.list();                      // [{ name, version, essentials, link, credits,
                                         //    requires, exact, optional, conflicts }]
ctx.plugins.isInstalled("Following Pokemon EX");
ctx.plugins.get("Following Pokemon EX"); // InstalledPluginInfo | null
```

Para dependencias *duras* que deban impedir que tu mod cargue, usa el array `requires` del manifest de abajo en su lugar.

## Dependencias (manifest `requires`)

```jsonc
// En manifest.json — un único array unificado para dependencias de mod + plugin.
// Cada entrada se discrimina por "type". Los plugins cargan desde <gameRoot>/Plugins/.
{
  "requires": [
    // -- otros mods (orden topológico; un id ausente bloquea este mod) --
    { "type": "mod", "id": "com.author.coremod" },          // debe estar instalado
    { "type": "mod", "id": "com.author.utils",
      "version": "^1.2.0" },                                 // rango registrado, no forzado en v1

    // -- plugins de Essentials --
    { "type": "plugin", "name": "My Plugin" },               // bloquear si falta, ignorar versión
    { "type": "plugin", "name": "Other Plugin",
      "url": "https://example.com/plugin" },                 // enlace mostrado en las advertencias
    { "type": "plugin", "name": "Strict Plugin",
      "enforcement": "pluginAndVersion",
      "version": "1.2.0" },                                  // bloquear si falta O < 1.2.0
    { "type": "plugin", "name": "Exact Plugin",
      "enforcement": "pluginAndVersion",
      "versionCheck": "exact",
      "version": "2.0.0" },                                  // bloquear salvo exactamente 2.0.0
    { "type": "plugin", "name": "Optional Plugin",
      "enforcement": "none",
      "url": "https://example.com/opt" }                     // nunca bloquear, solo advertir
  ]
}
// enforcement de plugin: "plugin" (por defecto) | "pluginAndVersion" | "none"
// versionCheck de plugin: "greaterOrEqual" (por defecto) | "exact" | "compatible"
// "compatible" = mismo major, minor.patch instalado >= requerido
// "pluginAndVersion" sin version → ManifestError
// proyectos v21+: enforcement controla el bloqueo (ver arriba).
// proyectos v16 (sin carpeta Plugins/): advertencia en consola, el mod carga igual.
```
