# Resolución de problemas

Problemas comunes y cómo arreglarlos.

## El mod no aparece en el Mod Manager

**Síntoma**: colocaste una carpeta en `Mods/` pero el editor no la lista.

**Lista de comprobación**:

1. **La ubicación de la carpeta es correcta**:
   - Proyecto: `<gameRoot>/Plugins/MakerStudio/003_Editor/Mods/<your-mod-id>/`
   - Global: `%APPDATA%/maker-studio/Mods/<your-mod-id>/`
   - La carpeta debe estar dentro de `Mods/`, no junto a ella.

2. **manifest.json existe y es JSON válido**. Campos requeridos: `id`, `name`, `version`, `apiVersion`, `main`. Error común: coma faltante o coma final en el JSON.

3. **apiVersion coincide**. Debe ser `"1.0.0"`. Una versión incorrecta como `"2.0.0"` se rechazará.

4. **El archivo de entrada coincide con el campo `main`**. Si `main` es `"index.js"`, el archivo `index.js` debe existir en la carpeta del mod.

5. **Reabre el proyecto** o haz clic en **Reload** en el Mod Manager. El editor solo escanea al abrir el proyecto o al recargar manualmente.

## El mod muestra estado "error"

**Síntoma**: el mod aparece en la lista pero su estado es rojo/con error.

1. **Abre el Mod Manager**, haz clic en la fila del mod para expandir su log. El mensaje de error está ahí.
2. **Revisa la consola del navegador** (`Ctrl+Shift+I` en la ventana del editor) para el stack trace completo.
3. **Causas comunes**:
   - Error de sintaxis en `index.js` — valídalo con un linter.
   - Falta `export function activate(ctx) { ... }` — es obligatorio.
   - Importar paquetes externos — los mods corren en un contexto aislado. Solo funciona la sintaxis ESM pura. Usa `window.__TAURI__` para comandos Tauri en vez de importar `@tauri-apps/api`.
   - Error de runtime dentro de `activate()` — envuélvelo en try/catch para acotar.

## El mod carga pero no hace nada

**Síntoma**: el estado muestra "active" pero los toasts/eventos/elementos de menú no aparecen.

1. **Revisa el log del mod** en el Mod Manager — ¿realmente corrió `activate()`? Añade `ctx.log.info("activate called")` como primera línea.
2. **Revisa los nombres de evento** — distinguen mayúsculas. `"map.loaded"` no `"Map.Loaded"`.
3. **Los elementos de menú necesitan un menú** — `menu: "Mods"` lo coloca bajo el menú Mods. Una errata crea un nuevo menú de nivel superior que podrías no notar.
4. **`isEnabled` devuelve false** — si tu callback `isEnabled` devuelve false, el elemento de menú aparece atenuado.

## Los cambios en los archivos del mod no surten efecto

**Síntoma**: editaste `index.js` pero el comportamiento no cambió.

1. **Haz clic en Reload** en la fila del mod en el Mod Manager. El editor lee los archivos una vez al cargar.
2. **Comprueba que editas el archivo correcto** — si el mismo id de mod existe en las ubicaciones de proyecto y global, la versión de proyecto eclipsa a la global. Revisa la insignia de origen (azul = proyecto, púrpura = global).
3. **Limpia la caché del navegador** — improbable pero posible si cambiaste el manifest.

## "Permission denied" en operaciones de archivo

**Síntoma**: `ctx.fs.readProjectFile(...)` o `ctx.fs.writeModFile(...)` lanza `PermissionDeniedError`.

- **El path traversal está bloqueado** — los paths que contienen `..` o paths absolutos se rechazan. Usa paths relativos.
- **`readProjectFile` / `writeProjectFile`** — limitados a la raíz del juego. Solo puedes acceder a archivos dentro del proyecto.
- **`readModFile` / `writeModFile`** — limitados a la propia carpeta de tu mod. No puedes escribir fuera de ella.

## El panel del mod no aparece

**Síntoma**: se llamó a `ctx.ui.registerPanel(...)` pero no hay panel visible.

1. **Los paneles empiezan en la posición por defecto** — revisa los bordes de la ventana del editor. Puede estar acoplado pero plegado.
2. **Usa `defaultPosition`** — ponlo en `"left"`, `"right"`, `"below"` o `"above"`.
3. **Revisa la consola** — si `render(host)` lanza, el contenido del panel queda vacío pero la pestaña debería seguir apareciendo.
4. **Se requiere id único** — si otro mod (o el mismo mod recargado) registró el mismo id de panel, el segundo registro se ignora en silencio.
5. **Marcador "Panel provided by mod … — not loaded"** — el hueco del panel persiste en la disposición del usuario mientras tu mod está descargado (hot reload, desactivado, error). Ese marcador es normal; tu contenido vuelve a aparecer cuando el mod re-registra el panel. Si se queda como marcador, tu mod no logró activarse — revisa el log del Mod Manager.

## Dos mods entran en conflicto

**Síntoma**: ambos mods funcionan solos pero se rompen cuando los dos están activos.

1. **Revisa colisiones de id de comando** — los ids de comando son globales. Si ambos mods registran `"export.map"`, el segundo sobrescribe al primero. Pon un namespace con tu id de mod: `"my-mod.export.map"`.
2. **Revisa el orden de los handlers de evento** — los handlers del bus corren en orden de registro. Si ambos cancelan `save.before`, gana el primero.
3. **Revisa colisiones de id de herramienta** — mismo problema que los comandos. Usa ids de herramienta únicos.

## TypeScript / comprobación de tipos

**Síntoma**: quieres IntelliSense para `ctx`.

```json
// tsconfig.json en la carpeta de tu mod
{
  "compilerOptions": {
    "types": ["../../path/to/editor/src/mod-api"]
  }
}
```

O usa una directiva `/// <reference types="..." />` en tu archivo de entrada. Las definiciones de tipo viven en `src/mod-api/types.ts` en el código fuente del editor.

## El elemento de menú contextual no aparece

**Síntoma**: se llamó a `ctx.ui.registerContextMenuItem()` pero el elemento no aparece en el menú de clic derecho.

1. **Revisa el nombre del contexto** — debe ser uno de `"map-tile"`, `"map-event"`, `"tile-palette"`, `"tile-palette-extra"`, `"layer"`, `"map-tree"`, `"event-editor"`. Distingue mayúsculas.
2. **Revisa la ortografía de `parentMenu`** — si usas `parentMenu`, la etiqueta del submenú debe coincidir exactamente (distingue mayúsculas). Comprueba el menú contextual del editor para la etiqueta exacta (incluida la elipsis `…`).
3. **Revisa `isEnabled`** — si tu callback devuelve false, el elemento aparece atenuado pero sigue visible.

## El overlay no se renderiza

**Síntoma**: se llamó a `ctx.ui.registerOverlay()` pero no se dibuja nada en el lienzo del mapa.

1. **Revisa la función de render** — asegúrate de estar dibujando realmente en el contexto del canvas (p. ej. `ctx.fillStyle = ...`, `ctx.fillRect(...)`).
2. **Revisa las matemáticas del viewport** — las posiciones de tile deben convertirse a coords de pantalla: `(tileCoord * tileSize - viewportOffset) * zoom`. Los dibujos fuera del viewport se recortan.
3. **Revisa `zOrder`** — los overlays con mayor `zOrder` se dibujan encima. Por defecto es 0.
4. **Revisa `info.mapId`** — si tu overlay solo dibuja para mapas concretos, verifica que el mapId coincida.

## El atajo de teclado no se dispara

**Síntoma**: se llamó a `ctx.ui.registerShortcut()` (o al `shortcut` de un elemento de menú) pero pulsar las teclas no hace nada.

1. **Revisa el formato de la tecla** — debe ser `"Ctrl+Shift+F"`, `"Alt+G"`, etc. Distingue mayúsculas, separado por `+`.
2. **Revisa conflictos** — si tu tecla choca con un atajo integrado o de otro mod, abre el diálogo **Keyboard Shortcuts** del editor (la sección "Mods" lista cada atajo de menú de mod) y reasigna el lado que quieras. Evita los integrados comunes como `Ctrl+S` (guardar) y `Ctrl+Z` (deshacer).
3. **Revisa que el mod esté activo** — los atajos solo funcionan mientras el mod está cargado y activado.

> **Nota**: el `shortcut` de un elemento de menú (`ctx.menu.registerMenuItem({ shortcut })`) ahora dispara `handler` por sí solo y es reasignable en el diálogo Keyboard Shortcuts. **No** necesitas un `ctx.ui.registerShortcut` aparte para él — llamar a ambos doble-registra la tecla.

## El import multi-archivo no funciona

**Síntoma**: `import { x } from './utils.js'` hace que el mod no cargue.

1. **Usa solo specifiers relativos** — los imports deben empezar con `./` o `../`. Specifiers desnudos como `'lodash'` o `'my-lib'` no funcionarán — el editor no empaqueta paquetes npm.
2. **Incluye la extensión `.js`** — escribe siempre `'./utils.js'`, no `'./utils'`. La extensión de archivo es obligatoria.
3. **El archivo debe existir en la carpeta del mod** — todos los archivos importados deben ser archivos `.js` dentro del directorio del mod (los subdirectorios están bien). El editor descubre archivos escaneando el árbol de directorios.
4. **Revisa errores de sintaxis en archivos importados** — cualquier error de sintaxis en cualquier archivo `.js` de la carpeta del mod puede impedir que el mod cargue. Revisa el log del Mod Manager para el archivo y la línea concretos.
5. **Los mods CommonJS son de un solo archivo** — si tu entrada usa `module.exports = ...`, el fallback de `new Function` no admite imports multi-archivo. Usa sintaxis ESM (`export function ...`) en tu entrada para habilitar el soporte multi-archivo.
