# Primeros pasos

Esta guía recorre la escritura del mod más pequeño posible y la verificación de que carga en el editor.

## 1. Crea la carpeta

Dentro de tu proyecto de juego:

```
<gameRoot>/Plugins/MakerStudio/003_Editor/Mods/hello-world/
├── manifest.json
└── index.js
```

Si la carpeta `Mods` no existe, créala. El editor la escaneará en cada carga de proyecto.

Como alternativa, coloca tu mod en el directorio global de mods en `<APPDATA>/maker-studio/Mods/hello-world/` para que esté disponible en todos los proyectos. Los mods de proyecto tienen prioridad sobre los mods globales con el mismo id.

## 2. Escribe el manifest

`manifest.json`:

```json
{
  "id": "com.example.hello-world",
  "name": "Hello World",
  "version": "1.0.0",
  "authors": [{ "name": "You" }],
  "description": "Says hello when a map loads.",
  "apiVersion": "1.0.0",
  "main": "index.js"
}
```

Campos requeridos:

| Campo         | Notas |
|---------------|-------|
| `id`          | Reverse-DNS, debe ser único. Se usa como identidad de la carpeta. |
| `name`        | Nombre visible en el Mod Manager. |
| `version`     | Semver. La versión de tu mod. |
| `apiVersion`  | Versión de la API del editor a la que apunta tu mod (semver). |
| `main`        | Ruta al entry JS, relativa a la carpeta del mod. |

Opcionales: `authors` (array de `{name, url?}` — admite varios autores), `description`, `homepage`, `requires` (dependencias unificadas de mod + plugin — consulta la referencia de la API), `permissions`.

## 3. Escribe el mod

`index.js`:

```js
export function activate(ctx) {
  ctx.log.info("Hello World mod loaded.");

  ctx.bus.on("map.loaded", (e) => {
    ctx.ui.showToast({ message: `Loaded map ${e.mapId} (${e.width}x${e.height})` });
  });
}

export function deactivate() {
  // Limpieza opcional. Los disposables registrados vía ctx se descartan solos.
}
```

Puntos clave:

- **`activate(ctx)` es obligatorio.** Se ejecuta una vez cuando el mod carga.
- **Usa `ctx.bus.on(...)` para reaccionar a eventos del editor.** El `Disposable` devuelto se limpia solo al descargar el mod.
- **`ctx.ui.showToast(...)`** muestra una notificación transitoria.
- **`ctx.log.info(...)`** escribe en el buffer de log del mod (visible en el panel Mod Manager).

## 4. Recarga el editor

Reabre tu proyecto. Abre **Mods → Mod Manager**. Deberías ver `Hello World` listado como `active`. Haz clic en él para ver los logs.

Ahora carga cualquier mapa — debería aparecer un toast abajo a la derecha.

## 5. Itera

Mientras desarrollas, haz clic en **Reload** en la fila de tu mod en el Mod Manager para reescanear sus archivos sin reiniciar el editor.

## Próximos pasos

- Explora la [Referencia de la API](api-reference.md) para todos los métodos disponibles.
- Añade un elemento de menú vía `ctx.menu.registerMenuItem({ menu: "Mods", label: "...", handler: ... })`.
- Añade un elemento de menú contextual vía `ctx.ui.registerContextMenuItem({ context: "map-tile", label: "...", handler: ... })`.
- Añade un overlay de lienzo vía `ctx.ui.registerOverlay({ id, render })`.
- Registra atajos de teclado vía `ctx.ui.registerShortcut(key, handler)`.
- Alterna opciones de vista vía `ctx.editor.viewOptions()` / `setViewOptions(...)`.
- Añade un panel de Dockview vía `ctx.ui.registerPanel({ id, title, render })`.
- Llama a cualquier comando Tauri directamente vía `window.__TAURI__.core.invoke("command_name", args)` — consulta la sección [Available Tauri Commands](api-reference.md#available-tauri-commands-for-mods).
- Revisa el [API Changelog](api-changelog.md) para ver las novedades de cada versión.
- Mira [examples/mods/](https://github.com/Toskan4134/maker-studio-mods/tree/main/examples/mods) para nueve mods incluidos con recorridos anotados.
