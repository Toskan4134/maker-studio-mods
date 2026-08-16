# Referencia de la API

La versión actual de la API es **1.0.1**. Los mods declaran vía `manifest.apiVersion` la versión que
introdujo lo más nuevo que usan — un editor más antiguo rechaza un mod que pide más de lo que ofrece.
Consulta [api-changelog.md](api-changelog.md) para ver qué entró en cada versión.

La fuente de verdad en TypeScript es [`mod-api.d.ts`](../mod-api.d.ts).
Este documento refleja ese archivo.

---

## `ctx` (Mod Context)

El argumento `ctx` que se pasa a `activate(ctx)`. Tipado internamente como `ModContext`.
Todas las capacidades del mod se alcanzan a través de él.

| Campo        | Tipo                  | Propósito |
|--------------|-----------------------|-----------|
| `apiVersion` | `string`              | Refleja la versión de la API del editor. |
| `manifest`   | `Readonly<Manifest>`  | El manifest de este mod. |
| `editor`     | `EditorCtx`           | Estado activo de mapa / capa / herramienta. |
| `map`        | `MapCtx`              | Leer y escribir tiles, consultar capas. |
| `tileset`    | `TilesetCtx`          | Imágenes de tileset y propiedades de tile. |
| `shadow`     | `ShadowCtx`           | Consultas de la capa de sombra. |
| `fog`        | `FogCtx`              | Consultas y configuración de la capa de fog (grupo de capa gráfica por encima de los tiles). |
| `panorama`   | `FogCtx`              | Capas de panorama — misma superficie que `fog`, bajo los tiles. |
| `layerGroups`| `LayerGroupsCtx`      | Grupos de capa gráfica personalizados con prioridades definidas por el mod. |
| `events`     | `EventsCtx`           | Eventos estilo RMXP en un mapa. |
| `tools`      | `ToolsCtx`            | Registrar herramientas de edición personalizadas. |
| `menu`       | `MenuCtx`             | Añadir items de menú. |
| `commands`   | `CommandsCtx`         | Registro de comandos entre mods. |
| `ui`         | `UiCtx`               | Paneles, diálogos, toasts. |
| `bus`        | `BusCtx`              | Suscribirse a / emitir eventos. |
| `fs`         | `FsCtx`               | Sistema de archivos con scope por ruta. |
| `storage`    | `StorageCtx`          | K/V persistente por mod. |
| `clipboard`  | `ClipboardCtx`        | Lectura/escritura del portapapeles de texto del SO (no el portapapeles de tiles). |
| `stats`      | `StatsCtx`            | Leer estadísticas de uso del editor. |
| `keybinds`   | `KeybindsCtx`         | Consultar y modificar atajos de teclado. |
| `i18n`       | `I18nCtx`             | Traducir las cadenas propias del mod, registrar locales de toda la app. |
| `selectors`  | `SelectorsCtx`        | Selectores modales (actor, item, switch, mapa, tileset, audio, gráfico, …). |
| `projectData`| `ProjectDataCtx`      | Listas de registros RPG de solo lectura (actores, items, switches, …). |
| `mods`       | `ModsCtx`             | Consultar otros mods instalados (presencia, estado). |
| `plugins`    | `PluginsCtx`          | Consultar plugins de Essentials instalados. |
| `log`        | `LogCtx`              | Logger con namespace. |
| `lifecycle`  | `LifecycleCtx`        | Hooks de activación. |

---

## `editor`

```ts
editor.version(): string
editor.activeMapId(): number | null
editor.activeLayerIndex(): number
editor.activeTool(): string
editor.setTool(toolId: string): void
editor.setActiveLayer(index: number): void
editor.listOpenMaps(): number[]
editor.gameRoot(): string | null
editor.brushSize(): number
editor.setBrushSize(size: number): void
editor.brushTileProperties(): { rotation, flipH, flipV, opacity, hue, saturation, lighting }
editor.setBrushTileProperties(props: Partial<{...}>): void
editor.hoverTile(): { x, y } | null
editor.viewport(): { x, y, zoom }
editor.setViewport(viewport: { x?, y?, zoom? }): void
editor.viewOptions(): { showGrid, showCollision, showEvents, showEventCells, showDim, darkMode }
editor.setViewOptions(opts: Partial<{...}>): void
```

Acceso de lectura/escritura al estado del editor. `version()` devuelve la versión del editor en
ejecución (p. ej. `"1.0.0"`) — el mismo valor contra el que compara el actualizador interno de la
app; útil para gating de características detrás de un `minStudioVersion`. `setTool` admite tanto ids
incluidos (`"brush"`, `"eraser"`, ...) como ids de herramientas registradas por mods.

`setBrushSize` cambia el tamaño activo del pincel. `setBrushTileProperties` fusiona props parciales
en el pincel actual. `setViewport` hace pan/zoom sobre el mapa activo.

```ts
editor.theme(): "dark" | "light"
editor.animationFrame(): number
editor.requestRedraw(): void
editor.setStatusBarText(text: string | null): void
editor.recentMaps(): number[]
editor.projectName(): string | null
```

`theme()` es un atajo para `viewOptions().darkMode ? "dark" : "light"`.
`animationFrame()` devuelve un contador grueso (~10fps) útil para animar overlays.
`requestRedraw()` dispara un evento DOM `mod:requestRedraw` para re-renderizados del canvas.
`setStatusBarText(text)` define un mensaje de estado transitorio propiedad del mod (pasa `null` para limpiarlo). Se limpia automáticamente al descargar el mod.
`recentMaps()` devuelve los IDs de mapas abiertos, los más recientes primero. `projectName()` devuelve el nombre de la carpeta del juego.

---

## `map`

```ts
map.info(mapId): PublicMapInfo | null
map.layers(mapId): PublicLayerInfo[]
map.readTile(mapId, layer, x, y): number
map.writeTile(mapId, layer, x, y, tileId, label?): void
map.batchWrite(mapId, layer, tiles: Map<"x,y", tileId>, label): void
map.selection(mapId): { bounds, count }
map.readTileData(mapId, layer, x, y): PublicTileData | null
map.writeTileData(mapId, layer, x, y, data, label?): void
map.selectionTiles(mapId): Array<{ x, y, tileId, layerIndex }> | null
map.setSelection(mapId, tiles: Array<{ x, y }> | null): void
map.addLayer(mapId, name?): number
map.removeLayer(mapId, layerIndex): void
map.renameLayer(mapId, layerIndex, name): void
map.setLayerVisible(mapId, layerIndex, visible): void
map.setLayerOpacity(mapId, layerIndex, opacity): void
map.createMap(opts: { width?, height?, tilesetId?, name?, parentId? }): Promise<number>
map.deleteMap(mapId): Promise<void>
map.resize(mapId, newWidth, newHeight, shiftX?, shiftY?): void
map.renameMap(mapId, name): void
map.reparentMap(mapId, parentId): Promise<void>
map.beginUndoGroup(label): void
map.endUndoGroup(): void
```

`writeTile` y `batchWrite` pasan por el pipeline normal de undo/redo del editor — tus cambios son
reversibles como cualquier edición incluida.

`writeTileData` escribe propiedades completas por tile (rotación, flip, opacidad, etc.) en capas
extendidas. `setSelection` crea o limpia una selección de tiles.
La gestión de capas opera sobre capas extendidas (3+). `createMap` crea un archivo de mapa nuevo y
lo registra en MapInfos. `deleteMap` elimina el archivo de mapa.

```ts
map.transformSelection(mapId, opts: {
  rotation?: 0|90|180|270; flipH?: boolean; flipV?: boolean;
  incremental?: boolean;
  colorOverride?: { hue?, saturation?, lighting?, opacity? };
}): void
map.recalculateAutotiles(mapId, layerIndex, tiles: Array<{x,y}>): void
map.getNativeTileProperties(mapId, layer, x, y): NativeTileProps | null
map.setNativeTileProperties(mapId, layer, x, y, props: Partial<NativeTileProps>): void
map.getClipboard(): PublicClipboardData | null
map.setClipboard(data: PublicClipboardData | null): void
map.createUndoScope(mapId, label): UndoScope
```

`transformSelection` rota/invierte/recolorea la selección actual, permutando las posiciones de los tiles para que el grupo rote visualmente.
`recalculateAutotiles` arregla las costuras de autotile tras escrituras masivas — llámalo con los tiles afectados.
`getNativeTileProperties` / `setNativeTileProperties` leen y escriben propiedades por tile en capas nativas (0-2).
`getClipboard` / `setClipboard` leen y reemplazan el portapapeles de tiles; `setClipboard(null)` lo limpia.
`createUndoScope` devuelve un objeto scope — llama a `.write()`/`.writeData()` para encolar escrituras, luego `.commit()` para aplicarlas como una sola entrada de undo (o `.abort()` para descartarlas).

---

## `tileset`

```ts
tileset.getImageBlobUrl(tilesetId): Promise<string | null>
tileset.getTileProperties(tilesetId, tileId): { passage, priority, terrainTag } | null
tileset.list(): Array<{ id, name, tilesetName }>
tileset.info(tilesetId): { id, name, tilesetName, autotileNames, panoramaName, fogName, battlebackName } | null
tileset.setTileProperties(tilesetId, tileId, { passage?, priority?, terrainTag? }): Promise<void>
tileset.currentId(): number | null
tileset.current(): { id, name, tilesetName, autotileNames, panoramaName, fogName, battlebackName } | null
tileset.mapTilesetId(mapId): number | null
```

La blob URL sigue siendo válida durante toda la sesión del editor.

`list` devuelve todos los tilesets cargados. `info` devuelve los metadatos del tileset, incluidos
el array de nombres de autotile y los nombres de panorama, fog y battleback.

`currentId` devuelve el tileset actualmente seleccionado en la paleta de tiles
(no el tileset asignado al mapa). Devuelve `null` si no hay ningún mapa abierto.

`current` devuelve la información completa del tileset actualmente seleccionado. Equivalente a
`tileset.info(tileset.currentId())`.

`mapTilesetId` devuelve el ID de tileset asignado a un mapa concreto.
Devuelve `null` si el mapa no está cargado.

```ts
tileset.transformTileProperties(tilesetId, tileId, { rotation?, flipH?, flipV? }):
  { passage, priority, terrainTag } | null
tileset.resolveTileProperties(tileId, tilesetId?): { passage, priority, terrainTag } | null
```

`transformTileProperties` devuelve passage/priority/terrain ajustados a la rotación/flip indicados — los bits de dirección de passage se rotan para coincidir con la transformación visual.
`resolveTileProperties` resuelve propiedades de tile desde cualquier tileset (cae al tileset activo de la paleta cuando se omite `tilesetId`).

```ts
tileset.registerTerrainTag({ id, name }): Disposable
tileset.registerPriority({ id, name, color? }): Disposable
```

`registerTerrainTag` / `registerPriority` añaden una entrada con nombre a los desplegables **Terrain
Tag** / **Priority** del Tileset Editor. `id` es el entero que se escribe tal cual en
`@terrain_tags` / `@priorities` (Table1, i16, sin clamp) cuando el usuario pinta ese valor. Los ids
incluidos son **0–17** para terrain tags (los por defecto de Pokemon Essentials) y **0–5** para
priorities (0 = suelo, 1–5 = tiles por encima), de modo que usa **18+** / **6+** para entradas
personalizadas y no pisarlos. Los ids duplicados se ignoran (gana el primer registro). Ambos
devuelven un `Disposable` y se eliminan automáticamente al descargar el mod.

El modo Priority va coloreado por nivel: el editor recorre una lista de cinco colores (amarillo /
naranja / rosa / morado / azul) desde la prioridad 1 en adelante, así que una priority registrada por
encima de 5 continúa el ciclo — el id 6 reutiliza el color del 1, y así sucesivamente. Pasa
**`color`** (cualquier color CSS) para darle a tu nivel uno propio. En ambos casos el color pinta la
marca dibujada sobre el tile y el cuadrito junto al valor en el desplegable. Los terrain tags no
tienen color.

El editor solo aporta la etiqueta del picker + el rango seleccionable — **no hay runtime dispatcher**.
Para darle a un tag un comportamiento en el juego, léelo de vuelta en tus scripts de juego
(`$game_map.terrain_tag(x, y)` — un Integer plano en RMXP/BES/LBDS; resuelto a través de
`PBTerrain` / `GameData::TerrainTag` en Pokemon Essentials) y ramifica según el valor. Consulta el
mod de ejemplo `custom-tile-properties`.

```ts
tileset.setGlyphStyle(style: Partial<TilesetGlyphStyle>): Disposable
```

`setGlyphStyle` recolorea las marcas que el Tileset Editor dibuja sobre cada tile — el punto/aspa de
passage, la estrella de prioridad, la **B** de bush, el número de terrain tag. Todos los campos son
opcionales y se fusionan sobre los valores por defecto, así que un mod que solo quiere otros colores
de prioridad pasa únicamente `priority`:

```js
ctx.tileset.setGlyphStyle({
  priority: ["#ffcc00", "#ff8a3d", "#ff5c8a"], // niveles 1..n, cicla al pasarse del final
  passageBlocked: "#ff0000",
  shadowBlur: 0,                               // sin sombra
});
```

| Campo | Tipo | Por defecto | Marca |
|---|---|---|---|
| `passageOpen` | color CSS | `#66ff66` | passage totalmente abierto |
| `passageBlocked` | color CSS | `#ff4444` | passage totalmente bloqueado |
| `passagePartial` | color CSS | `#ffcc00` | algunas direcciones bloqueadas |
| `bush` | color CSS | `#66ff66` | flag de bush |
| `counter` | color CSS | `#66aaff` | flag de counter |
| `terrain` | color CSS | `#ff66aa` | número de terrain tag |
| `priority` | color CSS[] | `["#ffcc00","#ff8a3d","#ff5c8a","#b48cff","#4fc3f7"]` | niveles de prioridad 1..n — **cicla** al pasarse del final de la lista |
| `neutral` | color CSS | `rgba(255,255,255,0.5)` | «aquí no hay nada»: prioridad 0, bush/counter apagados, terrain 0 |
| `shadowColor` | color CSS | `rgba(0,0,0,0.9)` | sombra que sigue el contorno de la marca |
| `shadowBlur` | número | `1/11` | desenfoque de la sombra como **fracción del tamaño de celda** del tile; `0` la desactiva |
| `strokeWidth` | número | `1/14` | grosor del trazo de la marca como fracción del tamaño de celda |

Una priority registrada con su propio `color` sigue ganando a la lista `priority` para ese nivel
concreto. Una lista `priority` vacía se ignora (el ciclo necesita al menos un color). Cuando varios
mods definen un estilo, **gana el último registro campo a campo**, así que dos mods pueden ocuparse
cada uno de una parte del aspecto. Devuelve un `Disposable` y se elimina automáticamente al descargar
el mod, restaurando los valores por defecto.

---

## `selectors`

Selectores modales que montan los diálogos de selector incluidos en el editor. Cada método
devuelve una `Promise` que se resuelve al valor elegido o a `null` cuando el usuario cancela.

```ts
// Registros RPG (1-indexados; el índice 0 está reservado para "nil")
selectors.pickActor(opts?): Promise<EntityPickResult | null>
selectors.pickClass(opts?): Promise<EntityPickResult | null>
selectors.pickSkill(opts?): Promise<EntityPickResult | null>
selectors.pickItem(opts?): Promise<EntityPickResult | null>
selectors.pickWeapon(opts?): Promise<EntityPickResult | null>
selectors.pickArmor(opts?): Promise<EntityPickResult | null>
selectors.pickEnemy(opts?): Promise<EntityPickResult | null>
selectors.pickTroop(opts?): Promise<EntityPickResult | null>
selectors.pickState(opts?): Promise<EntityPickResult | null>
selectors.pickAnimation(opts?): Promise<EntityPickResult | null>
selectors.pickCommonEvent(opts?): Promise<EntityPickResult | null>
selectors.pickEntity(kind, opts?): Promise<EntityPickResult | null>

// Sistema
selectors.pickSwitch(opts?): Promise<EntityPickResult | null>
selectors.pickVariable(opts?): Promise<EntityPickResult | null>

// Mapa / evento / tileset
selectors.pickMap(opts?: { value?, title?, includeCurrentMap? }): Promise<EntityPickResult | null>
selectors.pickEvent(mapId, opts?: { value?, title?, includePlayer?, includeThisEvent? }): Promise<EntityPickResult | null>
selectors.pickTileset(opts?): Promise<PublicTilesetInfo | null>

// Respaldados por archivo
selectors.pickAudio("BGM"|"BGS"|"ME"|"SE", opts?: { initial?, title? }): Promise<AudioPickResult | null>
selectors.pickGraphic(subfolder, opts?: { initial?, fields?: GraphicField[], extraFields?: GraphicPickerField[], showGrid?, allowTileSelect?, showHue?, title? }): Promise<GraphicPickResult | null>

// Input
selectors.pickKeyboardButton(opts?: { value? }): Promise<KeyboardButtonPickResult | null>
```

`EntityPickResult` = `{ id, name }`. `AudioPickResult` = `{ name, volume, pitch }`.
`GraphicPickResult` = `{ name, hue, opacity?, blend?, direction?, pattern?, sheetCols?, sheetRows?, srcRect?, extra? }` — las props opcionales solo aparecen cuando su entrada de `fields` estaba habilitada (los valores `extraFields` personalizados vuelven bajo `extra`, con clave el `key` del campo). `srcRect` (`{ x, y, w, h }`) solo aparece con `allowTileSelect`, y solo si el usuario eligió un **tileset**: son los tiles que seleccionó, expresados en píxeles de la imagen original (siempre un número entero de tiles de 32px). `w`/`h` a 0 significa la imagen completa. `KeyboardButtonPickResult` = `{ code, label }`.
Para los pickers de registros RPG, `opts.extras: SelectorExtra[]` permite colocar filas sintéticas
por encima de la lista real (p. ej. `{ id: 0, label: "Entire Party" }` para parámetros de actor objetivo).
Para `pickEvent`, `includePlayer` añade el id `-1` y `includeThisEvent` añade el id `0`.

```ts
// Ejemplo — deja que el usuario elija un item y luego se lo entrega
const item = await ctx.selectors.pickItem({ title: "Reward" });
if (item) ctx.ui.showToast({ message: `You got ${item.name}!`, level: "info" });

// Ejemplo — elige un gráfico de Graphics/Pictures con slider de hue
const pic = await ctx.selectors.pickGraphic("Pictures", { showHue: true });
if (pic) console.log(pic.name, pic.hue);

// Ejemplo — elige una character sheet con el conjunto completo de propiedades + un campo personalizado.
// `fields` habilita controles incluidos; `extraFields` añade los tuyos (devueltos en `.extra`).
const ch = await ctx.selectors.pickGraphic("Characters", {
  showGrid: true,
  fields: ["hue", "opacity", "blend", "direction", "pattern", "sheetCols", "sheetRows"],
  extraFields: [{ key: "zHeight", label: "Z Height", control: "number", min: 0, default: 0 }],
});
if (ch) console.log(ch.name, ch.direction, ch.pattern, ch.sheetCols, ch.extra?.zHeight);

// Ejemplo — deja que el usuario elija tiles de un tileset. La cuadrícula aparece
// porque el gráfico elegido es un tileset; al elegir se ajustan sheetCols/sheetRows.
// Necesita el plugin MakerStudio en el juego para que se respete allí.
const tile = await ctx.selectors.pickGraphic("Tilesets", {
  allowTileSelect: true,
  fields: ["sheetCols", "sheetRows"],
});
if (tile?.srcRect?.w) console.log(tile.name, tile.srcRect); // { x, y, w, h } en píxeles

// Ejemplo — elige BGM con volumen inicial personalizado
const bgm = await ctx.selectors.pickAudio("BGM", {
  initial: { name: "001-Battle01", volume: 80, pitch: 100 },
});
```

Los selectors montan los mismos componentes React que usa el editor de eventos incluido
(`EntitySelector`, `EventSelector`, `MapSelector`, `TilesetSelector`,
`SwitchPicker`, `KeyboardButtonSelector`, `AudioSelector`, `GraphicSelector`).
Solo puede haber un selector activo a la vez — abrir un segundo antes de que el primero se resuelva
lo reemplaza (el primero se resuelve con `null`).

---

## `projectData`

Vistas de solo lectura de las listas de registros RPG de todo el proyecto cargadas desde `.rxdata`.
Úsalas cuando quieras enumerar o buscar registros sin mostrar un selector modal. Las listas están
1-indexadas: `index 0` es el slot nil reservado
(`{ id: 0, name: "" }`), y los IDs se mapean directamente a índices de la lista.

```ts
projectData.actors(): readonly PublicRpgRecord[]
projectData.classes(): readonly PublicRpgRecord[]
projectData.skills(): readonly PublicRpgRecord[]
projectData.items(): readonly PublicRpgRecord[]
projectData.weapons(): readonly PublicRpgRecord[]
projectData.armors(): readonly PublicRpgRecord[]
projectData.enemies(): readonly PublicRpgRecord[]
projectData.troops(): readonly PublicRpgRecord[]
projectData.states(): readonly PublicRpgRecord[]
projectData.animations(): readonly PublicRpgRecord[]
projectData.commonEvents(): readonly PublicRpgRecord[]
projectData.records(kind: PublicRecordKind): readonly PublicRpgRecord[]
projectData.getRecord(kind, id): PublicRpgRecord | null

projectData.switchNames(): readonly string[]
projectData.variableNames(): readonly string[]
projectData.maps(): ReadonlyArray<{ id, name, parentId, order }>
```

`PublicRpgRecord = { id, name, iconName? }`. `PublicRecordKind = "actor" | "class"
| "skill" | "item" | "weapon" | "armor" | "enemy" | "troop" | "state" |
"animation" | "common_event"`.

```ts
// Ejemplo — encuentra todos los common events cuyo nombre empiece por "boss_"
const boss = ctx.projectData.commonEvents().filter((c) => c.name.startsWith("boss_"));
```

---

## `mods`

Consulta los otros mods de los que el editor sabe algo actualmente — para dependencias blandas/opcionales,
detección de características o integrarte con un mod companion. (Las dependencias duras que deberían
bloquear la carga de tu mod van en [`manifest.requires`](#manifest-requires) en su lugar.)

```ts
mods.list(): InstalledModInfo[]            // cada mod conocido, incluido este
mods.get(id: string): InstalledModInfo | null
mods.isInstalled(id: string): boolean      // presente en cualquier estado
mods.isActive(id: string): boolean         // presente Y cargado/en ejecución
```

```ts
interface InstalledModInfo {
  id: string;
  name: string;
  version: string;
  enabled: boolean;                         // false si el usuario lo desactivó
  status: "active" | "error" | "disabled";  // los mods bloqueados no se listan
  source: "project" | "global";
}
```

El snapshot es de solo lectura y refleja el ciclo de carga actual. Los mods bloqueados antes de la
carga (dependencia faltante, bloqueo de versión de plugin, id duplicado) **no** se listan — solo los
mods que cargaron (`active`), fallaron al activarse (`error`) o fueron desactivados por el usuario
(`disabled`).

```ts
// Ejemplo — registra una integración solo cuando un mod companion está activo.
if (ctx.mods.isActive("com.author.coremod")) {
  ctx.commands.execute("com.author.coremod:registerExtension", myExtension);
}
```

---

## `plugins`

Consulta los plugins de Essentials instalados bajo `<gameRoot>/Plugins/` (Ruby). Los mismos
datos que el editor usa para validar las entradas `requires` de plugin, expuestos para detección de
características en tiempo de ejecución.

```ts
plugins.available(): boolean               // false en v16/BES (sin dir Plugins/)
plugins.list(): InstalledPluginInfo[]       // vacío cuando no available
plugins.get(name: string): InstalledPluginInfo | null
plugins.isInstalled(name: string): boolean
```

```ts
interface InstalledPluginInfo {
  name: string;                  // meta.txt Name
  version: string | null;        // Version, o null si no se declara
  essentials: string[];          // Essentials — versiones compatibles, p. ej. ["19.1","20"]
  link: string | null;           // Link — URL de homepage / descarga
  credits: string[];             // Credits — autores
  requires: PluginRequirement[]; // Requires — plugins necesarios (cualquier/min versión)
  exact: PluginRequirement[];    // Exact — plugins necesarios a una versión exacta
  optional: PluginRequirement[]; // Optional — cargar antes que este si está instalado
  conflicts: string[];           // Conflicts — nombres de plugin incompatibles
}

interface PluginRequirement {
  name: string;
  version: string | null;        // min versión (requires) / versión exacta (exact), o null
}
```

Cada campo del `meta.txt` del plugin queda expuesto. Los campos repetibles
(`Requires`, `Exact`, `Optional`, `Conflicts`) recogen cada línea; los campos con lista separada por
comas (`Essentials`, `Credits`) se separan y recortan. Los valores de `Requires` / `Exact` /
`Optional` se parsean como `Name` o `Name,version`.

`available()` es `false` en proyectos sin directorio `Plugins/` (RMXP v16 /
Base Essentials v5), donde la presencia del plugin no puede verificarse — en ese caso las otras
consultas siempre reportan "not installed". Los nombres coinciden con el campo `Name` del `meta.txt`
del plugin (la misma cadena que pondrías en una entrada `requires` de plugin).

```ts
// Ejemplo — adapta el comportamiento a la versión de un plugin instalado.
const fp = ctx.plugins.get("Following Pokemon EX");
if (fp && fp.version && fp.version >= "1.5.0") {
  // usa la característica más nueva del plugin
}
```

---

## Manifest: `requires`

Los mods declaran todo de lo que dependen — otros mods instalados **y** plugins de Essentials
(Ruby) — a través de un único array unificado `requires` en `manifest.json`. Cada entrada es una
unión discriminada por `type`:

```json
{
  "requires": [
    { "type": "mod", "id": "com.author.coremod" },
    { "type": "mod", "id": "com.author.utils", "version": "^1.2.0" },

    { "type": "plugin", "name": "My Plugin" },
    { "type": "plugin", "name": "Other Plugin", "url": "https://example.com/other" },
    { "type": "plugin", "name": "Strict Plugin", "enforcement": "pluginAndVersion", "version": "1.2.0" },
    { "type": "plugin", "name": "Optional Plugin", "enforcement": "none", "url": "https://example.com/opt" }
  ]
}
```

```ts
type ModRequirement = ModDependency | PluginDependency;

/** Una dependencia de otro mod instalado. */
interface ModDependency {
  type: "mod";
  /** Reverse-DNS id del mod requerido (el `id` de su manifest). */
  id: string;
  /**
   * Rango semver opcional. Registrado para tooling; el loader impone la presencia
   * (el mod está instalado y se carga antes), no el rango, en v1.
   */
  version?: string;
}

/** Una dependencia de un plugin de Essentials (instalado bajo `<gameRoot>/Plugins/`). */
interface PluginDependency {
  type: "plugin";
  /** Nombre del plugin tal como aparece en el campo Name de meta.txt. */
  name: string;
  /** URL donde puede encontrarse/descargarse el plugin (se muestra en avisos). */
  url?: string;
  /**
   * Cuán estrictamente imponer esta dependencia.
   * - "plugin" (por defecto) — bloquear si falta el plugin; ignorar la versión.
   * - "pluginAndVersion" — bloquear si falta O la versión no satisface versionCheck.
   * - "none" — nunca bloquear, solo avisar.
   */
  enforcement?: "plugin" | "pluginAndVersion" | "none";
  /**
   * Versión requerida del plugin (semver). Solo se comprueba cuando enforcement es
   * "pluginAndVersion". Poner enforcement a "pluginAndVersion" sin
   * una versión es un ManifestError.
   */
  version?: string;
  /**
   * Cómo comparar la versión instalada contra version. Por defecto: "greaterOrEqual".
   * - "greaterOrEqual" — instalada >= requerida
   * - "exact"          — instalada == requerida
   * - "compatible"     — misma major, minor.patch instalada >= requerida
   */
  versionCheck?: "greaterOrEqual" | "exact" | "compatible";
}
```

**Comportamiento en tiempo de carga:**

**Dependencias de mod** (`type: "mod"`): el editor ordena topológicamente los mods para que cada
dependencia cargue antes que los mods que la necesitan. Si un id de mod requerido no está instalado,
el mod dependiente se bloquea con `missing dependency "<id>"`; un ciclo de dependencias bloquea cada
mod del ciclo. El rango `version` se registra pero no se impone en v1 (lo que se comprueba es la
presencia).

**Dependencias de plugin** (`type: "plugin"`):

- **Proyectos v21+** (existe el directorio Plugins/): el editor escanea
  `Plugins/*/meta.txt` y comprueba cada dependencia declarada según su ajuste de
  `enforcement`:
  - `"plugin"` (por defecto): bloquea el mod si falta el plugin; la versión se
    ignora.
  - `"pluginAndVersion"`: bloquea el mod si falta el plugin o su versión instalada no
    satisface la comparación `versionCheck` contra `version`. Ponerlo sin una `version` es un
    `ManifestError`.
  - `"none"`: nunca bloquea el mod; el editor solo registra un aviso.
- **Proyectos v16 / BES v5** (sin directorio Plugins/): el editor registra un aviso por consola
  pero carga el mod de todos modos, ya que la presencia del plugin no puede verificarse.

La comparación de versión usa semver simple major.minor.patch (los sufijos de pre-release se
ignoran). El campo `versionCheck` controla el operador de comparación: `"greaterOrEqual"` (por
defecto, instalada >= requerida), `"exact"` (instalada == requerida), o `"compatible"` (misma major,
minor.patch instalada >= requerida).

En la vista de detalle expandida del Mod Manager, las dependencias de plugin se listan con enlaces
clicables (si se proporciona `url`), el nivel de enforcement y el requisito de versión (cuando
aplica).

---

## Estructura de mod multi-archivo

Los mods pueden repartir código entre varios archivos `.js` usando `import` nativo de ES module:

```js
// utils.js
export function helper() { return 42; }

// index.js (entry — coincide con el "main" del manifest)
import { helper } from './utils.js';

export function activate(ctx) {
  ctx.ui.showToast({ message: `Answer: ${helper()}`, level: "info" });
}
```

**Cómo funciona**: el editor descubre todos los archivos `.js` de tu carpeta de mod, construye un
grafo de dependencias a partir de los especificadores `import`/`from`, los ordena topológicamente
(módulos hoja primero), crea blob URLs de abajo arriba reescribiendo los imports relativos a blob
URLs, y luego importa tu módulo entry. No hace falta tocar el manifest — solo añade archivos `.js`
junto a tu entry.

**Reglas**:

- Solo se descubren los archivos `.js` del directorio del mod (subdirectorios incluidos).
- Solo se reescriben los especificadores **relativos** que empiezan por `./` o `../`. Los
  especificadores bare (p. ej. `import _ from 'lodash'`) se dejan tal cual y fallarán en tiempo de
  ejecución.
- Las dependencias circulares se manejan con elegancia (se rompe el ciclo y los módulos siguen
  cargando).
- Los mods CommonJS (`module.exports = ...`) siguen siendo **solo de un archivo** — el fallback de
  `new Function` no soporta multi-archivo.
- Los mods de un solo archivo funcionan exactamente igual que antes — sin cambios.

---

## Acceso directo a Tauri

Los mods se ejecutan en el mismo contexto web que el editor. Cuando `withGlobalTauri`
está habilitado (lo está por defecto), `window.__TAURI__.core.invoke` está
disponible para llamar a cualquier comando de Tauri registrado — incluidos los no
expuestos a través de la API `ctx`.

```js
const invoke = window.__TAURI__.core.invoke;

// Llama a cualquier comando de Tauri registrado
const bytes = await invoke("read_binary_file", { path: "/path/to/file" });
```

Esto es útil cuando un mod necesita capacidades más allá de las que ofrece `ctx`.
Consulta [Comandos de Tauri disponibles](#comandos-de-tauri-disponibles-para-mods) más abajo.

---

## Comandos de Tauri disponibles para mods

Estos comandos Rust de propósito general pueden invocarse vía
`window.__TAURI__.core.invoke`. Complementan la API con scope `ctx.fs` con
operaciones binarias y de gestión de archivos.

### E/S de archivos

| Comando | Args | Devuelve | Propósito |
|---------|------|----------|-----------|
| `read_text_file` | `path` | `string` | Leer archivo como texto |
| `write_text_file` | `path, content` | `void` | Escribir archivo de texto |
| `read_binary_file` | `path` | `number[]` | Leer archivo como bytes en crudo |
| `write_binary_file` | `path, data` | `void` | Escribir bytes en crudo |

### Gestión de archivos

| Comando | Args | Devuelve | Propósito |
|---------|------|----------|-----------|
| `list_directory` | `path` | `FileEntry[]` | Lista las entradas del directorio. Cada entrada: `{ name, path, isFile, isDir, size }` |
| `file_exists` | `path` | `boolean` | Comprueba si existe un archivo o directorio |
| `copy_file` | `src, dst` | `void` | Copia un archivo (crea directorios padre) |
| `rename_file` | `oldPath, newPath` | `void` | Renombra o mueve un archivo (crea directorios padre) |
| `delete_file` | `path` | `void` | Borra un solo archivo (rechaza directorios) |

### Imagen

| Comando | Args | Devuelve | Propósito |
|---------|------|----------|-----------|
| `get_image_dimensions` | `path` | `[width, height]` | Obtiene dimensiones de imagen sin decodificar todo |
| `get_tileset_image` | `gameRoot, tilesetName` | `number[]` (PNG) | Obtiene la imagen del tileset como bytes PNG |
| `get_tileset_info` | `gameRoot, tilesetName` | `[w, h]` | Dimensiones de la imagen del tileset |
| `list_autotile_files` | `gameRoot` | `string[]` | Lista nombres de autotile en Graphics/Autotiles/ |
| `list_tileset_files` | `gameRoot` | `string[]` | Lista nombres de imagen de tileset en Graphics/Tilesets/ |
| `list_character_files` | `gameRoot` | `string[]` | Lista nombres de character sheet |
| `list_graphic_files` | `gameRoot, folder` | `string[]` | Lista nombres de imagen (sin extensión) en `Graphics/<folder>/` — `folder` debe ser un solo componente de ruta (p. ej. `"Pictures"`) |
| `get_graphic_image` | `gameRoot, folder, name` | `number[]` (PNG) | Obtiene una imagen de `Graphics/<folder>/` como bytes PNG (cacheada). Misma validación de carpeta que `list_graphic_files` |
| `clear_image_cache` | — | `void` | Limpia la caché de imágenes del lado Rust |

### Gestión de tilesets

| Comando | Args | Devuelve | Propósito |
|---------|------|----------|-----------|
| `create_tileset` | `gameRoot, name, tilesetName` | `u32` | Crea un tileset en blanco en el primer slot nil. Devuelve el nuevo ID de tileset |
| `delete_tileset` | `gameRoot, tilesetId` | `void` | Pone el slot del tileset a nil en Tilesets.rxdata |
| `update_tileset_name_graphic` | `gameRoot, tilesetId, name, tilesetName` | `void` | Parchea @name/@tileset_name en un tileset |
| `save_tileset_properties` | `gameRoot, tilesetId, passages, priorities, terrainTags` | `void` | Parchea los arrays passage/priority/terrain |
| `save_expanded_autotiles` | `gameRoot, tilesetId, expandedAutotiles` | `void` | Parchea el JSON de @expanded_autotiles |

### Diálogo

| Comando | Args | Devuelve | Propósito |
|---------|------|----------|-----------|
| `plugin:dialog\|open` | `{ options: { title?, filters?, multiple?, directory? } }` | `string \| null` | Selector nativo de archivo/carpeta |
| `plugin:dialog\|save` | `{ options: { defaultPath?, filters? } }` | `string \| null` | Selector nativo de guardado de archivo |

> **Nota**: `plugin:dialog|open` / `plugin:dialog|save` son comandos del plugin de diálogo de Tauri — el prefijo "plugin" es nomenclatura de Tauri, no del sistema de mods del editor.

### Discord Rich Presence

| Comando | Args | Devuelve | Propósito |
|---------|------|----------|-----------|
| `discord_rpc_connect` | `appId: string` | `void` | Conecta al IPC de Discord con tu Discord Application ID |
| `discord_rpc_update` | `details?, stateText?, largeImage?, largeText?, smallImage?, smallText?, startTimestamp?` | `void` | Define la actividad de rich presence de Discord |
| `discord_rpc_clear` | — | `void` | Limpia la presencia (mantiene la conexión abierta) |
| `discord_rpc_disconnect` | — | `void` | Cierra la conexión IPC de Discord |

Estos comandos envuelven el crate de Rust `discord-rich-presence`. La conexión la gestiona el backend
del editor y se limpia automáticamente cuando se cierra la app.

Los assets de imagen (`largeImage`, `smallImage`) deben subirse en el [Discord Developer Portal](https://discord.com/developers/applications)
bajo Rich Presence → Art Assets. La clave pasada (p. ej. `"icon"`) debe coincidir con el nombre del
asset subido.

---

## `shadow`

```ts
shadow.list(mapId): { id, name, visible }[]
shadow.setVisible(mapId, shadowId, visible): void
shadow.info(mapId, shadowId): { id, name, visible, opacity } | null
shadow.create(mapId, name?): { id, name }
shadow.delete(mapId, shadowId): void
shadow.setOpacity(mapId, shadowId, opacity: number): void
shadow.generateFromTiles(
  mapId,
  tiles: Array<{ x, y, tileId, tileData? }>,
  config?: { blurRadius?, offsetX?, offsetY?, color? }
): Promise<{ shadowId: number } | null>
```

`setOpacity` define la opacidad (0-255) de una capa de sombra existente.
`generateFromTiles` genera programáticamente una imagen de sombra a partir de una lista explícita de tiles y la añade como nueva capa de sombra. Devuelve el nuevo id de sombra, o `null` si la generación falló (p. ej. atlas de tileset no cargado).

---

## `fog`

`FogCtx` es la superficie CRUD compartida para un **grupo de capa gráfica** — una pila de capas de
imagen dibujadas por encima o por debajo de los tiles del mapa. `ctx.fog` opera sobre el grupo
**fog** (por encima de los tiles, prioridad en el juego 3000); `ctx.panorama` expone exactamente la
misma superficie sobre el grupo **panorama** (bajo los tiles, prioridad -1000); los grupos
registrados por mods van por `ctx.layerGroups` más abajo.

```ts
fog.list(mapId): { id, name, visible }[]
fog.setVisible(mapId, fogId, visible): void
fog.info(mapId, fogId): { id, name, visible, opacity, config } | null
fog.create(mapId, name?): { id, name }
fog.delete(mapId, fogId): void
fog.setOpacity(mapId, fogId, opacity: number): void
fog.setConfig(mapId, fogId, config: Partial<PublicFogConfig>): void
```

Forma de `config` (`PublicFogConfig`): `{ graphicName, hue, blendType, zoom, sx, sy, followPlayer, parallax? }`.

| Campo           | Tipo      | Notas |
|-----------------|-----------|-------|
| `graphicName`   | `string`  | Nombre de archivo en la carpeta de gráficos del grupo (sin extensión) — `Graphics/Fogs/` para fog, `Graphics/Panoramas/` para panorama. |
| `hue`           | `number`  | 0-360. |
| `blendType`     | `number`  | 0=normal, 1=add, 2=subtract, 3=multiply. |
| `zoom`          | `number`  | Factor de escala (0.1-8.0). |
| `sx`            | `number`  | Velocidad de scroll horizontal (px/frame). Positivo = derecha. |
| `sy`            | `number`  | Velocidad de scroll vertical (px/frame). Positivo = abajo. |
| `followPlayer`  | `boolean` | `true` = fijo a pantalla, `false` = anclado al mundo. |
| `parallax`      | `number?` | Factor de seguimiento de cámara cuando está anclado al mundo (0..1, por defecto 1): `1` = se mueve 1:1 con el mapa (fog clásico), `0.5` = panorama nativo RMXP a mitad de velocidad, `0` = fijo a pantalla. Se ignora mientras `followPlayer` sea `true`. |

`setConfig` fusiona config parcial en la config existente. Las capas de fog nuevas tienen por defecto opacidad 51 (20%) y gráfico vacío.

---

## `panorama`

```ts
panorama.list(mapId): { id, name, visible }[]
panorama.setVisible(mapId, layerId, visible): void
panorama.info(mapId, layerId): { id, name, visible, opacity, config } | null
panorama.create(mapId, name?): { id, name }
panorama.delete(mapId, layerId): void
panorama.setOpacity(mapId, layerId, opacity: number): void
panorama.setConfig(mapId, layerId, config: Partial<PublicFogConfig>): void
```

Mismo tipo `FogCtx` que `ctx.fog`, operando sobre las **capas de panorama** del mapa
(dibujadas bajo los tiles; gráficos de `Graphics/Panoramas/`). `create` da a las capas nuevas
opacidad por defecto 255 y `parallax: 0.5` (la velocidad de scroll clásica de panorama en RMXP). Las
capas de panorama persisten en el archivo del mapa y se renderizan en el juego mediante el plugin de
MakerStudio; un mapa que aún muestre el panorama nativo de su tileset lo mantiene intacto hasta que
las capas de panorama se editan por primera vez.

---

## `layerGroups`

Registra **grupos de capa gráfica personalizados** — grupos extra como los de fog/panorama con una
prioridad de render definida por el mod. Un grupo persiste por mapa dentro de `@extended_layers`
(descriptor + capas), de modo que el juego lo renderiza incluso cuando el mod **no** está instalado.

```ts
layerGroups.register(mapId, def: LayerGroupDef): void
layerGroups.remove(mapId, key): void
layerGroups.list(mapId): (LayerGroupDef & { layerCount: number })[]
layerGroups.setPriority(mapId, key, priority: number): void
layerGroups.layers(mapId, key): { id, name, visible, opacity, config }[]
layerGroups.addLayer(mapId, key, opts?: { name?, opacity?, config? }): { id, name }
layerGroups.deleteLayer(mapId, key, layerId): void
layerGroups.updateLayer(mapId, key, layerId, patch: { name?, visible?, opacity?, config? }): void
```

`LayerGroupDef`: `{ key, name, priority, folder }`.

| Campo      | Notas |
|------------|-------|
| `key`      | Id único del grupo. **No** debe ser `"fog"` ni `"panorama"` (esos son los grupos incluidos). |
| `name`     | Nombre a mostrar como fila del grupo en el panel de capas del editor. |
| `priority` | Plane z en el juego. `< 0` se renderiza **bajo** los tiles del mapa (panorama es -1000), `>= 0` **por encima** (fog es 3000). Los grupos del mismo lado se renderizan en orden ascendente por prioridad. |
| `folder`   | La subcarpeta única de `Graphics/` de la que el grupo carga sus gráficos (un solo componente de ruta, p. ej. `"Pictures"`). |

`register` crea el grupo en el mapa o actualiza su descriptor — las capas existentes se conservan
cuando la `key` ya existe. Las capas comparten la forma de fog
(`PublicFogConfig`, incluido `parallax`). Las filas de grupo aparecen en el panel de capas como las
de Fog/Panorama Layers, de modo que los map makers pueden editar las capas que añadas.

---

## `events`

```ts
events.list(mapId): PublicEvent[]
events.get(mapId, eventId): PublicEvent | null
events.create(mapId, x, y, name?): number | null
events.delete(mapId, eventId): void
events.move(mapId, eventId, x, y): void
events.rename(mapId, eventId, name): void
events.getFull(mapId, eventId): PublicEventFull | null
events.update(mapId, event: PublicEventFull): void
```

`PublicEvent = { id, name, x, y, pages?, trigger? }`. `pages` es el número de páginas del
evento. `trigger` es el tipo de trigger de la primera página (0=action, 1=player_touch,
2=event_touch, 3=autorun, 4=parallel).

`create` añade un evento nuevo en la posición dada y devuelve el ID del evento.
`delete`, `move` y `rename` modifican eventos existentes. Todos los cambios son reversibles.

`getFull` / `update` transportan el evento entero, páginas incluidas:

```ts
PublicEventFull = { id, name, x, y, pages: PublicEventPage[] }
PublicEventCommand = { code: number; indent: number; parameters: unknown[] }
```

Cada `PublicEventPage` contiene los ajustes de la página (trigger, gráfico, movimiento,
condición) más su lista de comandos:

```ts
page.list?: PublicEventCommand[]
```

`list` está **siempre presente** en las páginas devueltas por `getFull()`, y es **opcional**
cuando devuelves páginas a `update()` — ómítelo para dejar intactos los comandos existentes de esa
página, o ponlo para reemplazarlos.

### Leer y escribir comandos de evento

```ts
events.commandSchemas(): PublicCommandSchema[]
events.getCommandSchema(code: number): PublicCommandSchema | null
events.createCommand(code: number, params?: unknown[]): PublicEventCommand
events.validateEvent(event: PublicEventFull): { valid: boolean; errors: string[] }
events.registerCommand(def: ModCommandDef): Disposable
```

`commandSchemas()` devuelve todos los schemas conocidos de comandos de evento RMXP (code, name, category, defaultParams).
`getCommandSchema(code)` busca un único schema por code (devuelve `null` para códigos desconocidos).
`createCommand(code, params?)` construye una estructura de comando válida — con los parámetros por defecto del schema cuando omites `params`.
`validateEvent` comprueba que cada code de comando en las páginas del evento sea un code conocido, y devuelve los desconocidos en `errors`. Ejecútalo antes de `events.update`.

El ciclo completo de lectura / modificación / escritura:

```ts
const ev = ctx.events.getFull(mapId, eventId);
if (ev) {
  // Reemplaza los comandos de la página 1 con una línea "Show Text".
  ev.pages[0].list = [ctx.events.createCommand(101, ["Hello"])];

  const check = ctx.events.validateEvent(ev);
  if (!check.valid) {
    ctx.log.error(check.errors.join("\n"));
  } else {
    ctx.events.update(mapId, ev); // deshacible, como cualquier otro cambio de evento
  }
}
```

Para **añadir** en vez de reemplazar, parte de lo que te dio `getFull` — pero quita antes
el comando terminador final (ver más abajo):

```ts
const list = (ev.pages[0].list ?? []).filter((c) => c.code !== 0);
list.push(ctx.events.createCommand(101, ["One more line"]));
ev.pages[0].list = list;
```

**Terminador**: la lista de comandos de una página RMXP siempre termina con un terminador
`{ code: 0, indent: 0, parameters: [] }`, del que dependen tanto el intérprete del juego como el
simulador incluido. **No** necesitas añadirlo — `update()` lo añade al escribir cuando la lista no
termina ya en un comando code-0. Sí está presente en las listas que devuelve `getFull()`, así que
fíltralo cuando añadas a una lista existente.

**Indent**: `createCommand` devuelve `indent: 0`. Los comandos dentro del cuerpo de un conditional
branch / loop deben llevar el indent del bloque que los contiene — define `indent` tú mismo cuando
construyas listas anidadas.

### `events.registerCommand(def)` — comandos de evento personalizados

Registra un comando de evento totalmente nuevo que los map makers pueden insertar desde el selector
de comandos de evento. Tu comando aparece en su propia **pestaña con nombre** del selector
(una pestaña con icono de puzzle detrás de las incluidas — ver `page` más abajo) y
se edita mediante un formulario declarativo nativo. El formulario es un **builder para un comando
Script**: rellenarlo genera Ruby plano que el motor ejecuta directamente — no hay runtime dispatcher.

```ts
events.registerCommand(def: ModCommandDef): Disposable
```

```ts
interface ModCommandDef {
  id: string;                              // único dentro de tu mod, p. ej. "cameraScrollTo"
  name: string;                            // se muestra en el selector + lista de comandos
  page?: string;                           // título de la pestaña del selector (los comandos que lo comparten se agrupan; por defecto el id del mod)
  pageDescription?: string;                // franja de una línea bajo la pestaña activa
  fields?: ModCommandField[];              // omitir → textarea de script libre (params.script)
  script?: (params: ModCommandParams, ctx: ModCommandContext) => string;  // el Ruby almacenado y ejecutado en el juego
  parse?: (scriptText: string) => ModCommandParams | null;  // recupera params para reeditar
  summary?: (params: ModCommandParams, ctx: ModCommandContext) => string; // etiqueta de una línea en la lista de comandos
}
```

La clave de registro es `"<modId>:<id>"`. Las claves duplicadas se saltan (gana la primera).
El `Disposable` devuelto desregistra el comando; también se elimina automáticamente cuando tu mod se
descarga.

**Tu propia pestaña del selector.** Cada comando que registras aparece en una pestaña con icono de
puzzle detrás de las categorías incluidas. Define `page` para darle un título a esa pestaña; los
comandos que comparten la misma cadena `page` se agrupan en una sola pestaña, y `pageDescription`
rellena la franja de una línea que se muestra bajo ella mientras la pestaña está activa (gana el
primer comando del grupo que define una descripción). Omite `page` y tus comandos se agrupan en una
pestaña con el nombre del id de tu mod.

**Campos declarativos** (`def.fields`) se renderizan con los propios controles y selectors del
editor, de modo que el diálogo coincide con los diálogos de comando incluidos. El `key` de cada
campo se convierte en una propiedad del objeto `params` que se pasa a `script`, `parse` y
`summary`. Cualquier campo puede definir `disabled: (params, ctx) => boolean` para grisear su
control, o `hidden: (params, ctx) => boolean` para eliminarlo por completo, condicionalmente.

**Dónde está colocado el comando** (`ctx`) — `script`, `summary` y los predicados
`disabled`/`hidden` de los campos reciben un segundo argumento que describe el sitio que ocupa el
comando dentro del evento:

```ts
interface ModCommandContext {
  mapId: number;
  eventId: number | null;    // null en Base de datos → Eventos comunes
  pageIndex: number | null;  // null en Base de datos → Eventos comunes
  index: number;             // posición plana en la lista de comandos de la página, base 0
  count: number;             // entradas de la lista, sin contar el terminador final
  indent: number;            // profundidad de anidamiento (0 en el nivel superior de la página)
}
```

Así, `ctx.index === 0` es el primer comando y `ctx.index === ctx.count - 1` el último;
`ctx.indent > 0` significa que está dentro de una condición o un bucle. La granularidad de
`index`/`count` coincide con `events.getFull().pages[pageIndex].list`, así que las filas de
continuación (líneas de texto 401, sub-comandos de movimiento 509…) cuentan como entradas.
Mientras se está insertando el comando, el contexto describe el sitio en el que va a caer,
incluyéndose a sí mismo en `count`. Ambos callbacks se vuelven a ejecutar cada vez que el editor
relee el comando, así que un comando movido vuelve a renderizar su resumen con la nueva posición
— pero el **Ruby almacenado solo se reescribe al editar el formulario**: arrastrar un comando a
otro sitio no vuelve a ejecutar `script`.

```js
// El mismo comando genera Ruby distinto según dónde se haya soltado.
script: (p, ctx) => ctx.index === 0
  ? `pbSceneStart(${p.id | 0})`
  : `pbSceneStep(${p.id | 0})`,
summary: (p, ctx) => `página ${(ctx.pageIndex ?? 0) + 1}, #${ctx.index + 1}/${ctx.count}`,
```

| `type`     | Renderiza | Valor almacenado |
|------------|-----------|------------------|
| `number`   | caja de número (`min`/`max`/`step`) | `number` |
| `text`     | input de texto | `string` |
| `select`   | desplegable desde `options: { value, label }[]` | `number` |
| `checkbox` | checkbox | `boolean` |
| `switch`   | picker de switch | id de switch (`number`) |
| `variable` | picker de variable | id de variable (`number`) |
| `coordinate` | input de tile estilo Transfer-Player: un desplegable **Source** — *Direct appointment* (selector de mapa **+** X/Y editables) o *Appoint with variables* (pickers de variable X/Y). `showMapSelector?` añade la dimensión Map ID + árbol de mapas | `{ mode, mapId, x, y, varMapId, varX, varY }` |
| `record`   | picker de registro (`recordKind`: actor/class/skill/item/weapon/armor/enemy/troop/state/animation/common_event) | id de registro (`number`) |
| `event`    | picker de evento (`includePlayer?`/`includeThisEvent?`) | id de evento (`number`) |
| `graphic`  | navegador de gráficos bajo `Graphics/<subfolder>/` (`showHue?`) | nombre de archivo (`string`) |
| `audio`    | navegador de audio (`category`: BGM/BGS/ME/SE) | `{ name, volume, pitch }` |

Omitir `fields` da un comando de script libre: el editor muestra una sola textarea de script ligada
a `params.script`.

```js
const off = ctx.events.registerCommand({
  id: "cameraScrollTo",
  name: "Camera Scroll To",
  page: "Camera",                          // agrupa este y otros comandos "Camera" en una pestaña
  pageDescription: "Scroll and shake the camera.",
  fields: [
    { type: "coordinate", key: "target", label: "Target tile", showMapSelector: true },
    { type: "checkbox", key: "useSpeed", label: "Set speed" },
    { type: "number", key: "speed", label: "Speed", min: 1, default: 4, hidden: (p) => !p.useSpeed },
  ],
  script: (p) => {
    const t = p.target || {};
    const cx = t.mode === "variable" ? `$game_variables[${t.varX | 0}]` : (t.x | 0);
    const cy = t.mode === "variable" ? `$game_variables[${t.varY | 0}]` : (t.y | 0);
    const args = [cx, cy];
    if (p.useSpeed) args.push(p.speed | 0);
    return `pbCameraScrollTo(${args.join(", ")})`;
  },
  parse: (text) => {
    const m = /^pbCameraScrollTo\(\s*(-?\d+)\s*,\s*(-?\d+)\s*(?:,\s*(\d+)\s*)?\)$/.exec(text.trim());
    return m ? { target: { mode: "direct", mapId: 0, x: +m[1], y: +m[2], varMapId: 1, varX: 1, varY: 1 },
                 useSpeed: m[3] != null, speed: m[3] != null ? +m[3] : 4 } : null;
  },
  summary: (p) => `(${p.target?.x ?? 0}, ${p.target?.y ?? 0})`,
});
// off.dispose() para eliminarlo antes de tiempo.
```

**Cómo hace el round-trip y se ejecuta.** Un comando de mod se almacena como un comando Script RMXP
ordinario (code 355) cuyo `parameters[0]` es exactamente la cadena que tu `script(params)` devuelve,
p. ej. `pbCameraScrollTo(0, -4)`. Eso mantiene el `.rxdata` del mapa con un round-trip sin cambios,
pasa `validateEvent`, y se ejecuta en el juego como cualquier otro event script — **no se necesita
código de plugin ni handler**. `parse` reconoce un script almacenado para que el comando conserve su
nombre en la lista y reabra su formulario (proporciónalo para reeditabilidad; sin él, un comando
insertado se convierte en un comando Script ordinario al cerrarse el diálogo).

**Limitaciones**: los valores que el script generado no puede devolver (p. ej. un `mapId` de
`coordinate` elegido, o si una coordenada literal fue *elegida* frente a *tecleada*) se resetean al
reabrir; todavía no hay un tipo de campo custom-render imperativo.

---

## `tools.registerTool(def)`

```ts
ctx.tools.registerTool({
  id: "my.tool",
  label: "My Tool",
  icon: "★",
  onActivate() { /* seleccionada desde la toolbar */ },
  onDeactivate() { /* el usuario cambió a otra */ },
  onPointerDown(ev) { /* ... */ },
  onPointerMove(ev) { /* ... */ },
  onPointerUp(ev) { /* ... */ },
});
```

Devuelve un `Disposable` cuyo `dispose()` la desregistra antes de tiempo. En caso contrario la
herramienta se elimina automáticamente al descargar el mod.

---

## `menu.registerMenuItem(def)`

```ts
ctx.menu.registerMenuItem({
  menu: "Mods",          // cualquier menú top-level existente o nuevo
  label: "Do Something",
  shortcut: "Ctrl+Shift+D", // registra un binding real y rebindeable — NO llames también registerShortcut
  icon: "database",      // opcional: nombre de icono incluido, markup SVG, o glifo
  handler: () => { /* ... */ },
  isEnabled: () => true,
  isChecked: () => false,
});
```

Si `menu` coincide con un top-level existente (`"File"`, `"Edit"`, `"View"`,
`"Map"`, `"Tools"`, `"Mods"`, `"Help"`), el item se añade a él. Si coincide
con la etiqueta de un submenú dentro de un menú top-level (p. ej. `"Import & Export Maps"`),
el item se inserta ahí. En caso contrario se crea un menú top-level nuevo con esa etiqueta.

El `shortcut` opcional (p. ej. `"Ctrl+Shift+D"`) registra un **binding de teclado real y funcional**
que dispara el `handler` del item — no es solo una pista mostrada junto a la etiqueta. El binding
aparece en el diálogo **Keyboard Shortcuts** del editor bajo una sección **"Mods"**, donde el
usuario puede rebindearlo; su override persiste y se refleja en el atajo mostrado en el menú. Como
poner `shortcut` ya bindea la tecla, **no** llames también a
`ctx.ui.registerShortcut` para la misma combinación — eso la doble-registra. (Usa
`ctx.ui.registerShortcut` solo para atajos que no tienen item de menú.)

El `icon` opcional se renderiza en el mismo estilo que los items de menú incluidos.
Admite cualquiera de tres formas, resueltas en orden:

1. **Un nombre de icono incluido** (kebab-case) — renderiza el icono del editor que coincida en la
   misma familia que los items de menú nativos. Nombres comunes: `database`, `code`,
   `save`, `save-all`, `grid`, `layers`, `undo`, `redo`, `cut`, `copy`,
   `paste`, `import`, `export`, `download`, `zoom-in`, `zoom-out`,
   `select-all`, `collision`, `events`, `dim`, `lock`, `unlock`, `info`,
   `mods`, `keyboard`, `terminal`, `run`, `plus`, `settings`, `edit`,
   `trash`, `switch`, `versions`, `x`, `warning`, `star`, `refresh`,
   `eye`, `eye-off`, `chevron-up`, `chevron-down`, `chevron-left`,
   `chevron-right`, `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`,
   `pause`, `stop`, `step`, `camera`, `video`, `clock`, `language`. (Existen alias, p. ej. `recent` /
   `history`, `new` / `file-plus`, `scripts` / `code`, `dark-mode` / `moon`,
   `add` / `plus`, `gear` / `cog` / `settings`, `pencil` / `rename` / `edit`,
   `delete` / `remove` / `trash`, `swap` / `repeat` / `switch`,
   `git-branch` / `branch` / `versions`, `globe` / `translate` / `language`.)
2. **Markup SVG inline en crudo** — cualquier cadena que contenga un `<` se renderiza tal cual.
3. **Un único glifo unicode** — cualquier otra cosa (p. ej. `"📊"`).

---

## `commands.register / .execute`

```ts
ctx.commands.register("mymod.export.xml", async (mapId) => {
  // ...
});

await ctx.commands.execute("mymod.export.xml", 1);
```

Usa comandos cuando un mod quiera invocar funcionalidad de otro.
Los ids de comando son globales — ponles namespace con tu id de mod.

---

## `ui`

```ts
ctx.ui.registerPanel({
  id: "mymod.tilestats",
  title: "Tile Stats",
  defaultPosition: "right",
  showInMenu: true,    // por defecto true; pon false para ocultar del menú Mods
  icon: "📊",          // opcional: markup SVG o glifo unicode
  defaultSize: { width: 640, height: 460 }, // opcional: tamaño flotante inicial, por defecto 480×360
  render(host) {
    host.innerHTML = "<h2>Hello panel</h2>";
    return () => { /* cleanup opcional */ };
  },
});

ctx.ui.openPanel("mymod.tilestats");
ctx.ui.closePanel("mymod.tilestats");
ctx.ui.isPanelOpen("mymod.tilestats"); // → boolean

const value = await ctx.ui.showInputDialog({
  title: "Rename",
  message: "Enter new name:",
  defaultValue: "old name",
});
// value es string o null (cancelado)

ctx.ui.showContextMenu(400, 300, [
  { label: "Action 1", action: () => { ... } },
  { label: "", separator: true },
  { label: "Disabled", disabled: true },
  { label: "Submenu", submenu: [
    { label: "Sub-action", action: () => { ... } },
  ]},
]);

const ok = await ctx.ui.showConfirmDialog({ title: "Confirm", message: "Sure?" });
ctx.ui.showToast({ message: "Done", level: "info" });
```

`render(host)` es un callback DOM vanilla — usa cualquier framework que quieras
dentro, o ninguno. Devuelve una función de cleanup si la necesitas.

`openPanel(panelId)` abre un panel registrado previamente. `closePanel` lo cierra.
`isPanelOpen` comprueba la visibilidad. `showInMenu: false` oculta la entrada automática
del menú Mods (úsalo con tu propio `registerMenuItem` en su lugar — si no, terminás con
dos entradas que abren el mismo panel).

`defaultSize` fija el ancho/alto (px) de la ventana flotante la primera vez que un panel
se abre — antes de tener posición de dock o de que el usuario lo redimensione. Por
defecto `{ width: 480, height: 360 }`; subilo si el contenido de tu panel necesita más
espacio de entrada. No tiene efecto en aperturas siguientes una vez que el panel está
dockeado o redimensionado — de ahí en más es el layout del usuario.

**Persistencia de paneles**: los paneles de mod conservan su slot en el layout de dock guardado del
usuario. Cuando tu mod se descarga (hot reload, disable, uninstall), el panel **no** se cierra — el
editor muestra un placeholder "Panel provided by mod … — not loaded" en su lugar y vuelve a meter tu
contenido vivo cuando el mod re-registra el panel. Las configuraciones de layout exportadas también
registran qué mods proporcionaron qué paneles, de modo que importar un layout en una máquina donde
falte tu mod avisa al usuario y mantiene el slot como placeholder. No intentes cerrar tu panel en
`deactivate` para "limpiar" — dejar el slot es el comportamiento intencionado; solo el usuario cierra
paneles.

`showInputDialog` muestra un diálogo de input de texto — devuelve la cadena introducida o
null si se cancela. `showContextMenu` muestra un menú contextual nativo en las coordenadas de
pantalla dadas, con etiquetas, acciones, separadores y submenús.

### Botones de acción en toasts

```js
ctx.ui.showToast({
  message: "Esta acción todavía no tiene atajo.",
  level: "info",
  durationMs: 0, // fijo — permanece hasta que el usuario hace click en un botón
  action: { label: "Asignar atajo", onClick: () => ctx.ui.openKeyboardShortcuts("edit.save") },
  secondaryAction: { label: "No volver a mostrar", onClick: () => recordarDescartado() },
});
```

`ToastOptions.action` / `.secondaryAction` toman cada uno `{ label, onClick }` y se
renderizan como botones en el toast — `secondaryAction` a la izquierda de `action`, ambos
a la izquierda de los botones nativos de copiar/cerrar. Al hacer click en cualquiera de
los dos se cierra el toast y luego se llama a `onClick`; un error lanzado dentro de
`onClick` se captura y se registra en el log, no rompe el editor. Omite ambos para un
toast de solo mensaje (el comportamiento anterior, sin cambios).

### Theming y variables CSS

Los paneles (`registerPanel`) y los diálogos personalizados (`showCustomDialog`) se renderizan en el
propio DOM del editor — no en un iframe ni en un shadow root. El editor define sus variables de tema
en el elemento `<html>`, así que **se cascadenan a tu UI**. Referéncialas con `var(--name)` en vez
de harcodear colores, y tu panel coincidirá con la app y cambiará automáticamente cuando el usuario
alterne claro/oscuro.

```js
ctx.ui.registerPanel({
  id: "mymod.panel",
  title: "My Panel",
  render(host) {
    host.innerHTML = `
      <div style="
        padding: 8px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 13px;">
        <div style="
          font-weight: 600; text-transform: uppercase; font-size: 11px;
          color: var(--text-tertiary); margin-bottom: 6px;">Header</div>
        <button style="
          padding: 4px 10px; border-radius: 4px; cursor: pointer;
          border: 1px solid var(--border);
          background: var(--accent); color: var(--accent-text);">OK</button>
        <button style="
          padding: 4px 10px; border-radius: 4px; cursor: pointer;
          border: 1px solid var(--danger); background: transparent;
          color: var(--danger);">Delete</button>
      </div>`;
  },
});
```

Paleta estable (mismos nombres en ambos temas — los valores difieren según el tema activo):

| Variable | Rol |
|----------|-----|
| `--bg-primary`    | Fondo principal del panel |
| `--bg-secondary`  | Fondo de sidebar / insets |
| `--bg-tertiary`   | Cabeceras, toolbars, controles elevados |
| `--bg-hover`      | Fondo en estado hover |
| `--input-bg`      | Fondo de inputs de formulario |
| `--border`        | Bordes y separadores |
| `--text-primary`  | Texto primario |
| `--text-secondary`| Etiquetas / texto secundario |
| `--text-tertiary` | Texto apagado / placeholder |
| `--accent`        | Color de acento / acción primaria |
| `--accent-hover`  | Acento en hover |
| `--accent-muted`  | Acento translúcido (rellenos sutiles, highlights) |
| `--accent-text`   | Texto sobre un fondo de acento |
| `--danger`        | Destructivo / error |
| `--warning`       | Aviso |
| `--highlight`     | Selección / énfasis |
| `--success`, `--success-hover`, `--success-border` | Estados de éxito |
| `--shadow`        | Color de drop-shadow (rgba) |
| `--canvas-bg`     | Fondo del canvas del mapa |

La fuente del body también se hereda — pon `font-family: inherit` (base 13px) para coincidir.

Notas:
- Trata los nombres anteriores como la paleta **pública**. Existen otras variables
  (`--ec-*` colores de sintaxis de event-command, `--dv-*` tokens de pestañas Dockview,
  `--tile-preview-*`) pero son internas y pueden cambiar — no dependas de ellas,
  y no sobrescribas los tokens `--dv-*`.
- Las variables CSS solo aplican a **DOM**. Los overlays de canvas (`registerOverlay` /
  `registerAdvancedOverlay`) dibujan con un `CanvasRenderingContext2D` donde
  `var(--…)` no hace nada — rama según `ctx.editor.theme()` para un color literal,
  o lee uno con
  `getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()`.

### Registro de menú contextual

```ts
ctx.ui.registerContextMenuItem({
  context: "map-tile",  // "map-tile" | "map-event" | "tile-palette" | "tile-palette-extra" | "layer" | "map-tree" | "event-editor"
  label: "My Action",
  handler: (info) => { /* info tiene mapId, tileX, tileY, tileId, layerIndex, etc. */ },
  isEnabled: (info) => true,  // opcional
  parentMenu: "Export Map…",  // opcional — anida dentro de un submenú existente
});
```

Inyecta items de menú en cualquiera de los 7 menús de botón derecho del editor. El objeto `info`
contiene datos específicos del contexto (coords de tile, id de evento, nombre de capa, etc.).

Pon `parentMenu` en la etiqueta de un submenú existente (p. ej. `"Export Map…"` en el
menú contextual del map-tree) para anidar tu item dentro de ese submenú en vez de
añadirlo al nivel superior. Si no se encuentra un submenú que coincida, el item se
añade al nivel superior como fallback.

### Renderizado de overlays

```ts
ctx.ui.registerOverlay({
  id: "mymod.highlight",
  zOrder: 0,  // mayor = por encima
  render(ctx, info) {
    // ctx = CanvasRenderingContext2D
    // info = { mapId, tileSize, zoom, viewportX, viewportY, canvasWidth, canvasHeight }
    ctx.fillStyle = "rgba(255,0,0,0.3)";
    ctx.fillRect(x, y, w, h);
  },
});
```

Renderiza overlays personalizados en el canvas del mapa después de tiles/eventos, antes de los overlays de UI.
Múltiples overlays ordenados por `zOrder`.

### Atajos de teclado

```ts
ctx.ui.registerShortcut("Ctrl+Shift+F", () => {
  // manejar atajo
});
```

Registra atajos de teclado globales. Formato de tecla: `"Ctrl+Shift+F"`, `"Alt+G"`, etc.
Los atajos de mod tienen prioridad sobre los atajos incluidos.

### Diálogos y pickers adicionales

```ts
ctx.ui.showColorPicker(opts?: { title?, initial?: string }): Promise<string | null>
ctx.ui.showFilePicker(opts?: { directory?, multiple?, filters? }): Promise<string[] | null>
ctx.ui.showSavePicker(opts?: { defaultPath?, filters? }): Promise<string | null>
ctx.ui.confirmDestructive(opts: { title, message, confirmLabel? }): Promise<boolean>
```

`showColorPicker` abre un selector de color nativo; devuelve una cadena hex (p. ej. `"#ff0000"`) o `null` si se descarta.
`showFilePicker` envuelve el diálogo de apertura de archivo de Tauri; devuelve un array de rutas o `null`.
`showSavePicker` envuelve el diálogo de guardado de Tauri; devuelve una ruta o `null`.
`confirmDestructive` es `showConfirmDialog` con un botón de confirmar rojo — úsalo para operaciones irreversibles.

### Diálogos personalizados

```ts
const { close } = ctx.ui.showCustomDialog({
  title: "My Dialog",
  width: "460px",        // opcional
  height: "400px",       // opcional
  zIndex: 5000,          // opcional
  render(body) {
    // body es un HTMLElement — añade tu UI
    const btn = document.createElement("button");
    btn.textContent = "Close";
    btn.addEventListener("click", () => close());
    body.appendChild(btn);

    // Devuelve función de cleanup (opcional)
    return () => { /* teardown */ };
  },
});
```

Abre un diálogo modal con estilo usando el shell estándar del editor (overlay, cabecera arrastrable
con título + botón de cerrar, cuerpo con scroll). El callback `render` recibe
el elemento body — añade cualquier contenido DOM. Devuelve `{ close }` para cerrar programáticamente.

### Overlay avanzado

```ts
ctx.ui.registerAdvancedOverlay({
  id: "mymod.overlay",
  zOrder: 0,
  render(ctx, info) {
    // info.animFrame — contador de frames grueso para animación
    ctx.fillStyle = "rgba(255,0,0,0.3)";
    ctx.fillRect(x, y, w, h);
  },
}): Disposable
```

Como `registerOverlay` pero `info` incluye `animFrame` para renderizado con sensibilidad de animación.

### Status bar y toolbar (registro — renderizado próximamente)

```ts
ctx.ui.registerStatusBarItem({ id, render(host), align?: "left"|"right" }): Disposable
ctx.ui.registerToolbarButton({ id, icon, tooltip, handler, isActive? }): Disposable
```

Registra un segmento de status bar o un botón de toolbar aportado por el mod. Ambos se eliminan automáticamente al descargar el mod.

### Abrir URLs

```ts
await ctx.ui.openUrl("https://example.com");
```

Abre una URL en el navegador por defecto del usuario. El editor muestra primero un diálogo de confirmación (con la URL en una caja monoespaciada) — el usuario debe pulsar "Open Link" para continuar. Devuelve inmediatamente si se cancela.

### Abrir el diálogo de Atajos de Teclado

```ts
ctx.ui.openKeyboardShortcuts?.(actionId?: string);
```

Abre el diálogo nativo de Atajos de Teclado del editor — el mismo que hay detrás de
Ayuda → Atajos de Teclado…. Llamado sin argumento abre la lista completa sin filtrar.
Pasá un `actionId` (uno de los ids nativos de [`keybinds`](#keybinds) más abajo) y el
diálogo se abre ya scrolleado a esa fila y **escuchando una tecla**, exactamente como
si el usuario hubiera hecho click ahí — combina bien con un [botón de acción de
toast](#botones-de-acción-en-toasts) que ofrezca "Asignar atajo" para una acción que
todavía no tiene uno. Solo funciona con los ids nativos que conoce `ctx.keybinds` —
no puede apuntar a un atajo registrado por otro mod.

---

### Extender la interfaz del editor

Dos mecanismos, el general primero.

#### `ui.decorate(selector, apply)` — en cualquier sitio

```ts
const d = ctx.ui.decorate(".fc-popup .fc-actions", (el, info) => {
  const row = document.createElement("label");
  row.innerHTML = "<input type='checkbox'> Nieve en esta fog";
  el.before(row);
  return () => row.remove();   // limpieza opcional
});
```

Tu callback se ejecuta para **todos los elementos que casen con el selector: los que ya están en
pantalla y todos los que se monten después**. Si abres el diálogo de Edit Fog dentro de cinco
minutos, se decora igual que uno que ya estuviera abierto. A partir de ahí tienes un
`HTMLElement` real: añádele cosas, cámbiale el estilo, engancha listeners o sustitúyelo entero
con `replaceWith()`.

```ts
// Convertir un valor de solo lectura en un campo editable
ctx.ui.decorate(".properties-panel .prop-value", (el) => {
  const input = document.createElement("input");
  input.value = el.textContent ?? "";
  el.replaceWith(input);
});
```

Notas:

- El valor devuelto es una limpieza; se ejecuta cuando el elemento sale del DOM **o** cuando se
  descarta el decorador. Todo lo que hayas añadido debería quitarse ahí.
- Cada elemento se decora una sola vez por decorador, así que los re-renders nunca duplican nada.
- Todo se descarta automáticamente al descargar el mod / recargar en caliente.
- Un único `MutationObserver` da servicio a todos los decoradores y **solo está conectado
  mientras haya al menos uno registrado**: si tu mod no usa `decorate`, no cuesta nada.

**Elegir un selector.** `[data-ms-part]` es un contrato estable y documentado, compartido con el
sistema de temas: `dialog`, `menubar`, `toolbar`, `statusbar`, `panel-header`, `canvas`. Los
nombres de clase de los componentes (`.fc-popup`, `.cpf-body`, `.ts-sidebar-section`,
`.prop-value`, …) también funcionan y son los que más usarás, pero son **internos** y pueden
cambiar entre versiones.

#### `ui.registerSlot(slot, render, opts?)` — puntos con nombre y datos

```ts
ctx.ui.registerSlot("event.command.form.101", (host, slot) => {
  const btn = document.createElement("button");
  btn.textContent = "Insertar saludo";
  btn.onclick = () => slot.data().setParameter(0, "Hola!");
  host.appendChild(btn);
});
```

Los slots son los pocos puntos que el editor declara explícitamente, y su ventaja frente a
`decorate` es el **payload**: ids y setters que el DOM no puede darte.

| Slot | Dónde | `slot.data()` |
|------|-------|---------------|
| `fog.config` | popup de Edit Fog / Panorama / grupo de capas, encima del footer | `{ groupKey, mapId, layerId }` |
| `tileset.editor.tile` | barra lateral del Tileset Editor | `{ tilesetId, mode, hoverCell, selectedCells }` |
| `event.command.form` | todos los formularios de comando de evento | `{ code, parameters, setParameter(i, v) }` |
| `event.command.form.<code>` | un formulario concreto (`.101` = Show Text) | igual |
| `properties.panel` | cuerpo del panel Tile Info | `{ tileId, tilesetId, priority, terrainTag, passable, isBush, isCounter }` |

- `slot.data()` es un **getter**: el elemento host se reutiliza entre re-renders, así que llámalo
  cada vez en lugar de cachearlo. `slot.onUpdate(fn)` se dispara cuando cambia el payload.
- `{ replace: true }` oculta el contenido propio del slot y muestra solo el tuyo.
- `{ order: n }` ordena varios registros en el mismo slot.

Ejemplo completo de los dos mecanismos juntos: [`script-bridge`](../../examples/mods/script-bridge/).

---

## `simulator`

El Game Simulator interpreta un subconjunto útil de RMXP. Lo que no puede ejecutar — sobre todo
los comandos Script, que son Ruby y aquí no hay Ruby — se registra como no soportado. Estos
hooks permiten que tu mod aporte lo que falta.

```ts
// Encargarse de un comando Script (355), de un Script dentro de una ruta de
// movimiento (move code 45) o de una condición de tipo Script (kind 12).
ctx.simulator.registerScriptHandler("pbSetSwitch", (script, sim) => {
  const m = script.match(/pbSetSwitch\((\d+),\s*(\w+)\)/);
  if (!m) return null;                       // renuncia: que lo intente otro
  sim.setSwitch(Number(m[1]), m[2] === "true");
});

// Implementar (o sustituir) un código de comando de evento.
ctx.simulator.registerCommandHandler(201, (params, sim) => {
  sim.log(`transfer to map ${params[1]}`);
});
```

`match` filtra lo que llega a un handler de script: un **string** casa con los scripts que
*empiezan* por él, una **RegExp** se prueba contra todo el cuerpo, un **predicado** hace lo que
quieras, y si lo omites lo ves todo.

| Devuelve | Significado |
|----------|-------------|
| `null` | Renuncia — lo coge el siguiente handler (y luego el camino interno) |
| `true` / `false` | La respuesta de una **condición de tipo Script**; también cuenta como atendido |
| cualquier otra cosa | Atendido |

Los handlers de `registerCommandHandler` se ejecutan **antes** que la implementación interna, así
que puedes sustituir un código que el simulador ya soporta; devuelve `false` para renunciar.

### `SimApi`

El segundo argumento es una vista reducida de la simulación en marcha; el runtime interno nunca
se expone.

```ts
interface SimApi {
  frame: number;                  // contador de frames del simulador
  eventId: number | null;         // evento que ejecuta el comando (-1 = jugador)
  mapId: number;
  getSwitch(id): boolean;         setSwitch(id, value): void;
  getVariable(id): number;        setVariable(id, value): void;
  getSelfSwitch(letter, eventId?): boolean;
  setSelfSwitch(letter, value, eventId?): void;
  character(target): SimCharacterView | null;   // -1 jugador, 0 este evento, N id de evento
  characters(): SimCharacterView[];
  wait(frames): void;             // detiene el intérprete
  showText(lines): void;          // caja de mensaje, como Show Text
  log(message, level?): void;     // una fila en el panel de log del simulador
}

interface SimCharacterView {
  id: number; name: string; x: number; y: number;
  direction: 2 | 4 | 6 | 8; moving: boolean; erased: boolean;
  setPosition(x, y): void; setDirection(dir): void;
  setTransparent(on): void; setThrough(on): void;
}
```

Los cambios de switch y variable se aplican en el siguiente tick, cuando el simulador reevalúa
las condiciones de página. Si un handler lanza una excepción se captura, se registra en el panel
del simulador y cuenta como atendido, así que un mod roto no puede bloquear la simulación. Todos
los handlers se descartan al descargar el mod.

Mira el mod de ejemplo [`script-bridge`](../../examples/mods/script-bridge/): registra un handler
para una tabla de one-liners de Ruby habituales, implementa Change Gold y marca las filas Script
que puede ejecutar — un ejemplo completo de `ctx.simulator` junto a `ui.decorate` y
`ui.registerSlot`.

---

## `keybinds`

```ts
keybinds.list(): KeybindInfo[]
keybinds.get(actionId: string): KeybindInfo | null
keybinds.set(actionId: string, key: string): string | null
keybinds.reset(actionId: string): void
keybinds.onChanged(cb: (actionId, oldKey, newKey) => void): Disposable
```

Consulta y modifica los atajos de teclado del editor. `KeybindInfo` contiene `actionId`, `label`, `category`, `key`, `defaultKey`, e `isCustom`.

`set` devuelve el ID de acción en conflicto si la tecla ya está bindeada, o `null` en caso de éxito. El formato de tecla usa notación normalizada: `"ctrl+s"`, `"ctrl+shift+s"`, `"g"`, etc.

`onChanged` se suscribe a cualquier cambio de keybind (desde el diálogo de ajustes u otros mods). Devuelve un `Disposable`.

Los IDs de acción incluidos comprenden: `tool.brush`, `tool.eraser`, `tool.fill`, `tool.rectangle`, `tool.eyedropper`, `tool.select`, `tool.pan`, `view.toggleGrid`, `view.toggleCollision`, `view.toggleDim`, `brush.sizeUp`, `brush.sizeDown`, `brush.rotateCW`, `brush.rotateCCW`, `zoom.in`, `zoom.out`, `layer.select1`–`layer.select9`, `edit.save`, `edit.saveAll`, `edit.saveShadow`, `edit.undo`, `edit.redo`, `edit.selectAll`, `edit.deselect`, `edit.copy`, `edit.paste`, `edit.cut`, `app.runGame`, `dev.toggleDevTools`. Llama a `ctx.keybinds.list()` para el conjunto completo.

### Ciclo de vida

```ts
ctx.lifecycle.onUndo(fn: (mapId, label) => void): Disposable
ctx.lifecycle.onRedo(fn: (mapId, label) => void): Disposable
ctx.lifecycle.onBrushChange(fn: (props) => void): Disposable
ctx.lifecycle.onTilesetChange(fn: (tilesetId, reason) => void): Disposable
```

Wrappers de conveniencia sobre `bus.on("undo")`, `bus.on("redo")`, `bus.on("brush.changed")`, `bus.on("tileset.changed")`.

---

## `i18n`

Traducciones y control de locale. Dos niveles:

- **Nivel 1 — traduce tus propias cadenas.** Registra diccionarios por locale para la UI de tu mod,
  y resuélvelos con el `i18n.t()` con scope.
- **Nivel 2 — localiza toda la app.** Registra un locale nuevo completo — aparece en
  **View → Language** — o parchea uno existente (incluidos los incluidos `en` / `es`).

```ts
i18n.addTranslations(locale: string, dict: Record<string, string>): Disposable
i18n.t(source: string, vars?: Record<string, string | number>): string
i18n.getLocale(): string
i18n.locales(): LocaleInfo[]                 // [{ code, name }] — incluidos + locales de mod
i18n.setLocale(code: string): void
i18n.registerLocale(loc: { code: string; name: string; dict: Record<string, string> }): Disposable
i18n.onChanged(cb: (locale: string) => void): Disposable
```

```js
// Nivel 1 — las cadenas propias de tu mod
ctx.i18n.addTranslations("es", {
  "Export finished": "Exportación completada",
  "Exported {n} maps": "Se exportaron {n} mapas",
});
ctx.ui.showToast({ message: ctx.i18n.t("Exported {n} maps", { n: 3 }) });

// Nivel 2 — un locale de app totalmente nuevo (aparece en View → Language)
ctx.i18n.registerLocale({ code: "fr", name: "Français", dict: frenchDict });

// Reacciona a cambios de idioma
ctx.i18n.onChanged((locale) => rerenderMyPanel(locale));
```

Detalles:

- **Las claves son cadenas fuente en inglés** (estilo gettext), la misma convención que los
  diccionarios propios de la app. `i18n.t()` busca en el dict de tu mod el locale actual, luego en el
  diccionario de la app, y por último cae a la propia cadena fuente — las cadenas sin traducir nunca
  se rompen, solo quedan en inglés. Los placeholders `{name}` se sustituyen desde `vars` **después**
  de la búsqueda, de modo que las claves del diccionario mantienen las llaves literales.
- `addTranslations` fusiona — llamarlo otra vez para el mismo locale añade/sobrescribe claves. El
  `Disposable` devuelto elimina exactamente las claves que esa llamada añadió.
- `registerLocale` superpone el `t()` de la **app** para ese locale y lo lista en
  **View → Language**. Reutilizar un code incluido (p. ej. `"es"`) parchea las cadenas de app de ese
  locale. Las entradas de mod ganan a las incluidas; entre mods, gana el registro posterior.
- Si el idioma guardado de un usuario viene de tu mod, se restaura automáticamente cuando tu mod
  (re)registra el locale — también en hot reloads. Mientras el mod está descargado el editor cae a su
  default detectado.
- Todo se auto-dispone en unload/hot-reload.
- Los cambios de locale disparan el evento del bus `"locale.changed"` (`{ locale }`) —
  `i18n.onChanged` es el wrapper de conveniencia. Consulta
  [events-reference.md](events-reference.md).

### Traducir el editor entero — `app-strings.json`

Cada cadena fuente en inglés que el editor pasa por `t()` está exportada en
**[app-strings.json](../app-strings.json)** — ordenada alfabéticamente, con los valores vacíos,
lista para rellenar. Un mod de traducción es ese archivo con los valores rellenados y pasado a
`registerLocale`:

```js
import fr from "./app-strings.fr.json";

export function activate(ctx) {
  ctx.i18n.registerLocale({ code: "fr", name: "Français", dict: fr });
}
```

- Las entradas que dejes como `""` caen a inglés, así que puedes publicar traducciones parciales
  sin terminarlo todo.
- Los placeholders `{name}` deben sobrevivir en tu traducción (se sustituyen después de la
  búsqueda); reordena las palabras que los rodean libremente, pero mantén las llaves literales.
- El archivo se regenera en cada release del editor. Diferéncialo con tu dict para encontrar las
  cadenas nuevas — las claves que desaparecen simplemente se ignoran.
- Para corregir o ampliar un idioma existente en lugar de añadir uno, usa `registerLocale` con ese
  code (`"es"`, `"en"`) y solo las claves que cambias.

---

## `bus`

```ts
const sub = ctx.bus.on("map.tile.changed", (e) => { ... });
sub.dispose();   // opcional — ocurre automáticamente al descargar

ctx.bus.emit("mod.loaded", { id: "..." });   // eventos a nivel de editor
```

`save.before` es cancelable: devuelve `{ cancel: true, reason: "..." }` para
abortar el guardado.

Consulta [events-reference.md](events-reference.md) para la lista completa.

---

## `fs`

```ts
// Operaciones en la carpeta del mod
const txt = await ctx.fs.readModFile("data.txt");
await ctx.fs.writeModFile("output.txt", "hello");
const exists = await ctx.fs.exists("data.txt");
const entries = await ctx.fs.listDir("subfolder/");
await ctx.fs.mkdir("output/cache");

// Operaciones en la carpeta del proyecto
const projTxt = await ctx.fs.readProjectFile("Data/System.rxdata");
await ctx.fs.writeProjectFile("Data/custom.json", content);
const projExists = await ctx.fs.projectExists("Graphics/Tilesets/my_tile.png");
const projEntries = await ctx.fs.listProjectDir("Graphics/Tilesets/");
await ctx.fs.projectMkdir("Graphics/Custom");
```

Las rutas se normalizan — las rutas absolutas y el recorrido con `..` lanzan
`PermissionDeniedError`.

`exists`/`listDir`/`mkdir` operan en la carpeta del mod. `projectExists`/
`listProjectDir`/`projectMkdir` operan en la carpeta del proyecto (del juego) y
requieren permisos `fs.project` o `fs.write.project`.

---

## `storage`

```ts
await ctx.storage.set("counter", 1);
const v = await ctx.storage.get<number>("counter", 0);
```

Respaldado por `<modDir>/.storage.json`.

---

## `clipboard`

El **portapapeles de texto del SO** — el portapapeles de todo el sistema compartido con cualquier
otra aplicación.

```ts
clipboard.readText(): Promise<string | null>
clipboard.writeText(text: string): Promise<void>
```

```ts
await ctx.clipboard.writeText("hello");
const text = await ctx.clipboard.readText();   // null si vacío / no disponible
```

`readText` devuelve cualquier texto en crudo que el portapapeles del SO tenga — que puede ser una
copia hecha por otra app — o `null` cuando está vacío o el portapapeles no está disponible (permiso /
headless).
`writeText` es un no-op cuando el portapapeles no está disponible; ningún método lanza.

Esto **no** es el portapapeles de tiles: `ctx.map.getClipboard()` / `setClipboard()` contienen tiles
de mapa copiados, disparan `clipboard.changed`, y nunca tocan el portapapeles del SO.

---

## `log`

```ts
ctx.log.info("hello", { foo: 1 });
ctx.log.warn(...);
ctx.log.error(err);
```

Visible en el panel de logs del Mod Manager.

---

## `lifecycle`

```ts
ctx.lifecycle.onMapLoad((mapId) => { ... });
ctx.lifecycle.onSave((mapId) => { ... });
ctx.lifecycle.onActivate(() => { /* se ejecuta tras devolver activate() */ });
ctx.lifecycle.onDeactivate(() => { /* se ejecuta al descargar el mod */ });
ctx.lifecycle.onToolChange((toolId) => { ... });
ctx.lifecycle.onLayerChange((mapId, layerIndex) => { ... });
```

Wrappers de conveniencia sobre `bus.on(...)` para hooks comunes.
`onToolChange` se dispara en `tool.activated`. `onLayerChange` se dispara en
`layer.changed` (visibilidad, opacidad, añadida, eliminada, activa).

---

## `stats`

Lee estadísticas de uso del editor y define stats personalizadas.

### Getters de snapshot

```ts
const g = ctx.stats.global();          // GlobalStatsSnapshot
const p = ctx.stats.project();         // ProjectStatsSnapshot | null
const a = ctx.stats.all();             // CombinedStatsSnapshot { global, project }
```

Campos de `GlobalStatsSnapshot`: `totalActiveMinutes`, `totalTilesPlaced`, `totalUndoCount`, `totalRedoCount`, `totalMapsCreated`, `totalMapsSaved`, `totalSessions`, `firstLaunchDate`, `custom`.

Campos de `ProjectStatsSnapshot`: `activeMinutes`, `tilesPlaced`, `undoCount`, `redoCount`, `mapsCreated`, `mapsSaved`, `mapEdits`, `sessionCount`, `firstOpened`, `custom`.

### Getters de stat individual

```ts
const tiles = ctx.stats.getGlobalStat("totalTilesPlaced");  // number | string
const pTiles = ctx.stats.getProjectStat("tilesPlaced");      // number | string | null
```

### Stats personalizadas

Los mods pueden definir stats numéricas arbitrarias que persisten junto a las stats incluidas:

```ts
// Leer
const v = ctx.stats.getCustomGlobal("my_counter", 0);
const pv = ctx.stats.getCustomProject("my_project_counter", 0);

// Escribir
ctx.stats.setCustomGlobal("my_counter", 42);
ctx.stats.setCustomProject("my_project_counter", 10);

// Incrementar (devuelve el nuevo valor)
const newV = ctx.stats.incrementCustomGlobal("my_counter");       // +1
const newP = ctx.stats.incrementCustomProject("my_counter", 5);   // +5
```

Las stats personalizadas aparecen en el diálogo de Stats bajo una sección "Custom".
Las stats personalizadas de proyecto son por proyecto; las globales se comparten entre todos los proyectos.

### Metadatos de stat

Los mods pueden registrar metadatos de display para stats personalizadas de modo que aparezcan con un nombre,
descripción y categoría en el diálogo de Stats:

```ts
ctx.stats.registerStat({
  id: "achievements_unlocked",        // coincide con la clave usada en setCustomGlobal/setCustomProject
  name: "Achievements Unlocked",      // nombre a mostrar en el diálogo de Stats
  description: "Total achievements unlocked across all projects", // al pasar el ratón
  category: "Achievements",           // cabecera de sección en el diálogo de Stats
  scope: "global",                    // "global" o "project"
  format: "number",                   // opcional: "number" (por defecto) | "time" | "date"
});
```

Las stats con la misma categoría se agrupan bajo una sola cabecera. Las stats incluidas usan
las categorías "Project" y "Global". Los mods pueden reutilizarlas o crear categorías personalizadas.

### Suscripción

```ts
ctx.stats.onStatsChanged((global, project) => {
  // Se dispara ~cada 60s con snapshots frescas
});
```

## `ctx.theme` — temas del editor

```js
export async function activate(ctx) {
  const fondo = await ctx.theme.assetUrl("bg.png");

  ctx.theme.register({
    id: "com.ejemplo.dusk",
    name: "Dusk",
    base: "dark",
    vars: {
      "--accent": "#ffc50b",
      "--bg-primary": "#0e0e0f",
      "--bg-secondary": "#141414",
    },
    css: `
      [data-ms-part="toolbar"] { border-bottom: 1px solid var(--accent); }
      [data-ms-part="dialog"]  { border-radius: 14px; }
    `,
    canvas: { image: fondo, fit: "cover", opacity: 0.9 },
  });
}
```

| Miembro | Para qué |
|---------|----------|
| `register(tema)` | Lo añade a **Ver → Tema**. Devuelve un disposer; también se quita al descargar el mod |
| `apply(id \| null)` | Cambia de tema, o `null` para el dark/light integrado |
| `current()` | Id del tema de mod activo, o `null` |
| `list()` | Todos los temas registrados, incluidos los de otros mods |
| `assetUrl(ruta)` | Un fichero de tu carpeta como `data:` URI — para `canvas.image`, `background-image`, `@font-face` |

**Cómo se aplica.** Se añade `data-ms-theme="<tu id>"` a la raíz y **cada regla que aportas se
reescribe para colgar de él** — tu `css` incluido, así que un tema registrado no cambia nada hasta
que el usuario lo elige. Lo que no sobrescribas sigue resolviéndose contra `base`. No necesitas
`!important` ni reañadir una etiqueta `<style>`: la hoja de estilos y su orden los gestiona el
editor.

Escribe el `css` como si aplicara a toda la app (`[data-ms-part="toolbar"] { … }`); el acotado lo
pone el editor. Una regla dirigida a `:root` o `html` pasa a ser el propio ámbito del tema, se entra
en `@media`/`@supports`, y `@keyframes`/`@font-face` se dejan intactos.

**Zonas con nombre.** Estiliza mediante `data-ms-part` en vez de nombres de clase internos, que no
son API y cambian: `menubar`, `toolbar`, `statusbar`, `panel-header`, `dialog`, `canvas`.

**El canvas del mapa.** Es un `<canvas>`, así que el CSS no puede entrar dentro. Dale una imagen a
`canvas.image` y el render la pinta sobre el canvas ya limpiado y por debajo del mapa. No lo intentes
poniendo `--canvas-bg` transparente: entonces el canvas deja de limpiarse entre frames y el mapa
deja estelas al moverlo.

**Claro, oscuro o ambos.** Lo que declares decide cómo responde el tema al interruptor **Modo
oscuro** del editor:

| Declarado | Resultado |
|-----------|-----------|
| `dark` **y** `light` | Una entrada en la lista, dos aspectos — sigue el interruptor |
| solo `dark` (o solo `light`) | Ese esquema se fuerza y el interruptor queda **bloqueado** mientras el tema esté activo |
| ninguno | Se fuerza `base`, con el mismo bloqueo |

```js
ctx.theme.register({
  id: "com.ejemplo.dusk",
  name: "Dusk",
  base: "dark",                                   // paleta detrás de lo que no definas
  vars: { "--radius": "10px" },                   // en ambos esquemas
  dark:  { vars: { "--accent": "#61afef" } },
  light: { vars: { "--accent": "#4078f2" } },
});
```

Un tema bloqueado mueve el ajuste de Modo oscuro en vez de pelearse con él, y la entrada del menú
pasa a *Modo oscuro (lo fija el tema)* y se deshabilita — así el interruptor nunca parece roto. La
preferencia del usuario no se toca y vuelve al elegir otro tema.

**Solo hay un tema activo**, así que dos mods de temas ya no pelean por la cascada — el usuario elige
uno en Ver → Tema.
