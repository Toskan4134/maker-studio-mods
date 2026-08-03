# Changelog de la API

La API de mods sigue [semver](https://semver.org):

- **Major** — cambios rompedores. Los mods existentes que apuntan a la versión major anterior se enrutan a través de una capa de compatibilidad. Si no existe tal capa, el mod se rechaza con un error claro en el Mod Manager.
- **Minor** — cambios aditivos (nuevos campos opcionales, nuevos nombres de evento, nuevos métodos de contexto). Los mods antiguos siguen funcionando sin cambios.
- **Patch** — arreglos solo internos; sin cambios observables.

Cuando hay un salto de versión major, este archivo recibe una sección con la nueva forma y un enlace a una guía de migración.

---

## Adiciones desde 1.0.0

- **`PanelDef.defaultSize`**: `{ width, height }` (px), fija el tamaño de la ventana flotante
  la primera vez que un panel se abre — antes de tener posición de dock o de que el usuario
  lo redimensione. El valor por defecto no cambia (`{ width: 480, height: 360 }`). Aditivo:
  los mods que no lo configuran no ven ningún cambio. Ver [api-reference.md](./api-reference.md)
  (`ui.registerPanel`).
- **Nuevo evento de bus `keybind.triggered`**: `{ actionId: string }`, se dispara cuando el
  dispatcher global de shortcuts resuelve un keydown a una acción nativa, justo antes de
  llamar `e.stopImmediatePropagation()`. Ese llamado es la razón por la que un listener de
  `keydown` propio de un mod — en `window` o `document`, cualquier fase — nunca ve el evento
  de un shortcut que efectivamente se disparó: el dispatcher está montado en `window` en fase
  de captura antes de que cargue cualquier mod, así que siempre corre primero. Este evento es
  la única forma confiable de saber "recién se usó el teclado para X"; no intentes
  reconstruirlo escuchando `keydown` crudo vos mismo. No cubre shortcuts registrados por mods
  (`shortcut` de `registerMenuItem`, `ui.registerShortcut`) — esos se resuelven por otro
  camino. Ver [events-reference.md](./events-reference.md).
- **`ctx.editor.viewOptions()` / `setViewOptions()` ganan `showEventCells`**, reflejando la
  opción de vista "Toggle Event Cells" del editor (keybind `view.toggleEventCells`) — antes
  ilegible e imposible de escribir desde un mod. Aditivo: el destructuring existente del
  objeto devuelto sigue funcionando. Ver [api-reference.md](./api-reference.md) (`editor`).
- **Nuevo evento de bus `game.launch`**: `{ gameRoot: string }`, se dispara una vez por cada
  invocación de Run Game (botón de toolbar, ítem de menú, o el atajo `app.runGame`) sin
  importar el resultado — una señal confiable de "el usuario pidió correr el juego", ya que
  no hay otra forma de observar esa acción (es momentánea, no un estado que se pueda alternar).
  Ver [events-reference.md](./events-reference.md).
- **Botones de acción en toasts** (`ctx.ui.showToast`). `ToastOptions` gana los campos
  opcionales `action` y `secondaryAction`, cada uno `{ label, onClick }` — hasta dos
  botones clicables en un toast, el secundario se renderiza a la izquierda del
  primario. Al hacer click en cualquiera de los dos se cierra el toast y luego se
  ejecuta `onClick`. También nuevo: **`ctx.ui.openKeyboardShortcuts(actionId?)`** abre
  el diálogo nativo de Atajos de Teclado del editor (igual que Ayuda → Atajos de
  Teclado…); pasando un `actionId` nativo se abre ya scrolleado a esa fila y
  escuchando una tecla — combinalo con un botón de toast para mandar al usuario
  directo a reasignar una acción puntual. Aditivo: los mods que nunca configuran
  `action`/`secondaryAction` no ven ningún cambio. Ver [api-reference.md](./api-reference.md) (`ui`).
- **`ctx.selectors.pickGraphic(..., { allowTileSelect: true })`**. Ofrece **selección de tiles**,
  pero solo cuando el gráfico elegido es un **tileset** (uno que esté en `Graphics/Tilesets`): la
  vista previa muestra entonces una cuadrícula de tiles, con clic para elegir uno y arrastre para
  elegir un bloque. Cualquier otro gráfico no se ve afectado, así que la opción se puede dejar
  activada sin riesgo. La selección vuelve en `GraphicPickResult.srcRect` como `{ x, y, w, h }` en
  píxeles de la imagen original —siempre un número entero de tiles de 32px— con `w`/`h` a 0
  significando la imagen completa (que es también lo que obtienes sin la opción), así que el código
  existente se lee igual. El editor trata la selección como si *fuera* la imagen completa: la
  cuadrícula de la hoja la divide y `direction`/`pattern` indexan dentro de ella, y al elegir tiles
  se ajustan `sheetCols`/`sheetRows`. En el juego necesita el plugin MakerStudio —los gráficos de
  evento e imagen del propio editor llevan el mismo campo, así que un proyecto con el plugin
  respeta lo que elegiste.

- **`ctx.theme`** (`ThemeCtx`). Registra temas del editor: `register({ id, name, base, vars?, css?, canvas? })`,
  `apply(id | null)`, `current()`, `list()` y `assetUrl(rutaRelativa)` para convertir un fichero de la
  carpeta de tu mod en un `data:` URI. Solo hay un tema activo a la vez, se elige en **Ver → Tema** y
  se recuerda entre sesiones; las reglas de un tema están acotadas a él, así que registrarlo no
  cambia nada hasta que se aplica, y al descargar tu mod desaparece. `canvas.image` lo pinta el
  propio render del mapa, por debajo del mapa — sin `--canvas-bg` transparente ni overlays con
  z-order. Puntos estables para el CSS:
  `data-ms-part="menubar|toolbar|statusbar|panel-header|dialog|canvas"`.
  Un tema declara variantes `dark` / `light` para seguir el interruptor de Modo oscuro del editor
  (una entrada en Ver → Tema, dos aspectos); declarar solo una de ellas — o ninguna — fuerza ese
  esquema y bloquea el interruptor mientras el tema esté activo.
- **`ctx.fs.readModFileBytes(rutaRelativa)`**. Bytes en crudo de la carpeta de tu propio mod, para
  imágenes y fuentes.

- **`manifest.tags`** (`ModManifest`). `string[]` opcional con los tags de búsqueda y filtrado del
  Marketplace, p. ej. `["tilesets", "ui"]`. El editor los registra; el workflow de publicación los
  copia a tu entrada de `index.json` normalizando cada uno al `^[a-z0-9-]+$` del registro (así
  `"Terrain Tags"` pasa a `terrain-tags`) y quedándose con los 8 primeros. Aditivo: si lo omites
  nada cambia — los tags los elige quien mantiene el registro al revisar, como hasta ahora.

- **Pestañas de comandos de mod** (`ModCommandDef`, `ctx.events.registerCommand`). `page` ahora
  es funcional: titula la pestaña propia del comando en el selector de comandos de evento, y los
  comandos que comparten la misma cadena `page` se agrupan en una sola pestaña con nombre (omítelo y
  se agrupan bajo el id del mod). El nuevo `pageDescription` opcional rellena la franja de una línea
  que se muestra bajo esa pestaña mientras está activa — entre los comandos que comparten una página,
  gana el primero que lo define. Aditivo: los mods existentes siguen funcionando; un comando sin
  `page` simplemente obtiene una pestaña con el nombre de su mod. Consulta
  [api-reference.md](api-reference.md) (`events.registerCommand`).

- **Estilo de las marcas del Tileset Editor** (`ctx.tileset`). `registerPriority` acepta un
  `color` opcional (cualquier color CSS) que pinta la marca de ese nivel sobre el tile y su
  cuadrito en el desplegable Priority; sin él sigue el ciclo de cinco colores incluido, así que
  el id 6 continúa reutilizando el color del 1. El nuevo **`setGlyphStyle(style)`** recolorea
  todas las marcas que dibuja el Tileset Editor — `passageOpen` / `passageBlocked` /
  `passagePartial`, `bush`, `counter`, `terrain`, la lista cíclica `priority`, `neutral`
  (prioridad 0 y flags apagados), además de `shadowColor`, `shadowBlur` y `strokeWidth` (estos
  dos últimos como fracciones del tamaño de celda del tile; `shadowBlur: 0` quita la sombra).
  Todos los campos son opcionales y se fusionan sobre los valores por defecto, gana el último
  registro campo a campo, y el `Disposable` devuelto restaura los valores por defecto al
  descargar el mod. Aditivo: los mods que no lo llamen no notan ningún cambio. Consulta
  [api-reference.md](api-reference.md) (`tileset`).

## Arreglos desde 1.0.0

- **Las listas de comandos de evento ahora son legibles y escribibles** (`ctx.events`). `PublicEventPage`
  lleva `list?: PublicEventCommand[]`. `events.getFull()` devuelve los comandos de cada página
  (antes los descartaba, así que los mods nunca podían leer lo que hace un evento), y `events.update()`
  reescribe el `list` que definas en una página (antes lo ignoraba, así que no se podían escribir
  comandos en absoluto). Omite el `list` de una página para dejar sus comandos existentes intactos;
  `update()` añade el terminador de página RMXP code-0 cuando tu lista no lo tiene, de modo que las
  listas construidas por mods no necesitan incluirlo. Esto hace usable `events.createCommand()` —antes
  producía estructuras de comando sin dónde colocarlas— y arregla `events.validateEvent()`, que nunca
  veía una lista de comandos y por tanto informaba `{ valid: true, errors: [] }` para cada evento,
  incluidos los que tenían códigos de comando desconocidos. Aditivo: los mods escritos contra 1.0.0
  siguen funcionando sin cambios. Consulta
  [api-reference.md](api-reference.md) (`events`).

## v1.0.0 — Versión inicial

Primera API pública de mods, publicada con Maker Studio 1.0. Una superficie `ctx` estable permite
a los mods extender el editor de punta a punta: editar mapas, añadir herramientas y UI, engancharse
al bus de eventos y enviar contenido personalizado hasta el juego.

La referencia completa de métodos/tipos está en [api-reference.md](api-reference.md) y
[mod-api.d.ts](../mod-api.d.ts); cada evento del editor está documentado en
[events-reference.md](events-reference.md). Esta entrada enumera las capacidades esenciales,
no la superficie exhaustiva.

### Características esenciales

- **Ciclo de vida del mod y manifest** — cada mod envía un `ModManifest` (`id`, `version`,
  `apiVersion`, entrada `main`) con hooks `activate(ctx)` / `deactivate()`. Admite `authors`
  opcional multi-autor y un array unificado `requires` (otros mods y/o plugins de Essentials,
  ordenados topológicamente al cargar). Se admiten mods de un solo archivo, CommonJS y ESM
  multi-archivo.
- **Edición de mapas** — lectura/escritura de tiles y datos por tile, consulta y gestión de capas
  (nativas, extendidas, sombra), selecciones con transformaciones, agrupación de undo y scopes,
  portapapeles de tiles y CRUD completo de mapas (crear, borrar, redimensionar, renombrar, reparent).
- **Tilesets** — imágenes de tileset, propiedades de tile (passage / priority / terrain tag),
  CRUD de tilesets y **terrain tags y priorities personalizados** registrados por el mod que aparecen
  con nombre en el Tileset Editor y se escriben tal cual en los datos del juego.
- **Grupos de capa gráfica** — `ctx.fog`, `ctx.panorama` y **grupos de capa personalizados**
  registrados por el mod (`ctx.layerGroups`) con prioridades arbitrarias dentro del juego. Todos
  admiten un factor `parallax` de seguimiento de cámara, persisten por mapa dentro de
  `@extended_layers` y se renderizan en el juego mediante el plugin incluido —incluso sin el mod
  instalado.
- **Eventos** — listar / crear / mover / actualizar eventos estilo RMXP, más
  `ctx.events.registerCommand` para añadir **comandos de evento personalizados** con formularios
  declarativos (número, texto, select, coordenada, gráfico, audio, …) que se compilan a comandos
  Script ejecutables en el juego y siguen siendo reeditables.
- **UI personalizada** — registrar **herramientas** de edición, **items de menú** (con iconos y
  atajos), **paneles** acoplables, **diálogos** (confirmar / input / personalizado), **toasts**,
  **overlays** Canvas2D, **items de menú contextual**, **items de toolbar / status bar** y **atajos**
  globales. La UI de paneles y diálogos hereda las variables CSS del tema del editor.
- **Selectors** — selectores modales basados en promesas para cada registro RPG (actor, class,
  skill, item, weapon, armor, enemy, troop, state, animation, common event, switch, variable,
  mapa, evento, tileset, audio, gráfico, botón de teclado, coordenada).
- **Datos del proyecto** — acceso de solo lectura a las listas de registros del proyecto (actores,
  classes, skills, items, weapons, armors, enemies, troops, states, animations, common events),
  arrays de nombres de switch / variable y la lista de map-info.
- **Bus de eventos** — 25 eventos estables del editor; `save.before` y `paste.before` son
  cancelables.
- **Hooks de ciclo de vida** — `onMapLoad`, `onSave`, `onActivate`, `onDeactivate`,
  `onToolChange`, `onLayerChange`, `onUndo` / `onRedo`, `onBrushChange`, `onTilesetChange`.
- **Sistema de archivos y persistencia** — sistema de archivos con scope por ruta (carpeta del mod
  + carpeta del proyecto), `storage` K/V por mod, `clipboard` de texto del SO (todo el sistema) y un
  `log` con namespace.
- **Consultas en tiempo de ejecución** — `ctx.mods` / `ctx.plugins` para detección de
  características y dependencias blandas, `ctx.keybinds` para leer y modificar atajos de teclado, y
  `ctx.stats` para estadísticas de uso del editor además de estadísticas personalizadas del mod.
- **Acceso directo a Tauri** — los mods pueden invocar comandos de backend registrados vía
  `window.__TAURI__.core.invoke(...)` para E/S de archivos, trabajo con imágenes / tilesets y
  diálogos nativos.

### Estabilidad

CI ejecuta los mods de ejemplo incluidos como pruebas de humo y comprueba la snapshot de la forma
de `ModContext` en cada PR —los cambios accidentales en la superficie del contrato hacen fallar el
build.
