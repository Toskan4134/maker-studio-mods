# Referencia de eventos

Todos los nombres de evento y formas de payload. Escucha vía `ctx.bus.on(name, fn)`. Emite vía `ctx.bus.emit(name, payload)` (rara vez necesario — la mayoría de los mods solo escuchan).

La fuente de verdad en TypeScript es la interfaz `EventMap` en [`mod-api.d.ts`](../mod-api.d.ts).

| Evento               | Payload                                                                  | Cancelable |
|----------------------|---------------------------------------------------------------------------|-------------|
| `map.loaded`         | `{ mapId, width, height }`                                                | no          |
| `map.unloaded`       | `{ mapId }`                                                               | no          |
| `map.tile.changed`   | `{ mapId, layer, x, y, oldId, newId }` (solo escrituras de un tile)       | no          |
| `map.batch.changed`  | `{ mapId, layer, count, label }`                                          | no          |
| `tool.activated`     | `{ toolId }`                                                              | no          |
| `selection.changed`  | `{ mapId, bounds, count }`                                                | no          |
| `save.before`        | `{ mapId }`                                                               | **sí**      |
| `save.after`         | `{ mapId }`                                                               | no          |
| `save.failed`        | `{ mapId, error: string }`                                                | no          |
| `mod.loaded`         | `{ id }`                                                                  | no          |
| `mod.unloaded`       | `{ id }`                                                                  | no          |
| `panel.opened`       | `{ panelId }`                                                             | no          |
| `panel.closed`       | `{ panelId }`                                                             | no          |
| `layer.changed`      | `{ mapId, layerIndex, change }`                                           | no          |
| `viewport.changed`   | `{ mapId, x, y, zoom }`                                                   | no          |
| `hover.changed`      | `{ mapId, x: number\|null, y: number\|null }`                             | no          |
| `clipboard.changed`  | `{ hasData: boolean, tiles?: number }`                                    | no          |
| `brush.changed`      | `{ size, rotation, flipH, flipV, opacity, hue, saturation, lighting }`   | no          |
| `tileset.changed`    | `{ tilesetId, reason: "selected"\|"edited"\|"reloaded" }`                | no          |
| `undo`               | `{ mapId, label }`                                                        | no          |
| `redo`               | `{ mapId, label }`                                                        | no          |
| `event.changed`      | `{ mapId, eventId, change: "created"\|"deleted"\|"moved"\|"updated" }`   | no          |
| `paste.before`       | `{ mapId, x, y, tileCount }`                                              | **sí**      |
| `stats.changed`      | `{ global: GlobalStatsSnapshot, project: ProjectStatsSnapshot \| null }`  | no          |
| `keybind.changed`    | `{ actionId: string, oldKey: string, newKey: string }`                   | no          |
| `locale.changed`     | `{ locale: string }`                                                      | no          |

## Cuándo se disparan los eventos

- **`map.loaded`** — después de que los tiles, capas y datos de sombra de un mapa se hayan cargado en memoria y se haya abierto una pestaña. Momento seguro para consultar `ctx.map.info(...)`.
- **`map.unloaded`** — después de que una pestaña de mapa se cierra y se quita del editor. `ctx.editor.activeMapId()` devuelve `null` cuando se cierra el último mapa.
- **`map.tile.changed`** — se dispara una vez por cada edición de un solo tile. Para trazos de pincel que escriben muchos tiles, `map.batch.changed` se dispara una vez con el total.
- **`map.batch.changed`** — se dispara por cada lote de escritura de tiles (pincel, fill, rectángulo, pegado, deshacer/rehacer). Úsalo cuando quieras una señal gruesa de "el mapa cambió".
- **`save.before`** — se dispara antes de que el editor escriba el archivo `.rxdata` del mapa. **Cancelable.** Devuelve `{ cancel: true, reason: "..." }` para abortar. Los listeners se esperan en orden de registro; gana el primer cancel.
- **`save.after`** — se dispara tras una escritura exitosa. Buen sitio para generar artefactos acompañantes (exportaciones XML, manifests, etc.).
- **`tool.activated`** — se dispara cuando el usuario (o un mod) cambia la herramienta activa, incluidos los cambios a herramientas registradas por mods.
- **`mod.loaded` / `mod.unloaded`** — se dispara para cualquier mod, incluido el tuyo. Útil cuando un mod depende de colaboradores opcionales.
- **`panel.opened` / `panel.closed`** — se dispara cuando un panel de mod se abre o se cierra en el dock.
- **`selection.changed`** — se dispara cuando la selección de tiles cambia (establecer, limpiar, modificar).
- **`layer.changed`** — se dispara cuando una capa muta. `change` es uno de: `"visibility"`, `"opacity"`, `"added"`, `"removed"`, `"active"`.
- **`viewport.changed`** — se dispara cuando el viewport del mapa se desplaza o hace zoom.
- **`hover.changed`** — se dispara cuando el cursor se mueve a otro tile. `x`/`y` son `null` cuando el cursor sale del lienzo del mapa.
- **`clipboard.changed`** — se dispara tras cualquier copia, corte o limpieza del portapapeles. `tiles` es el número de tiles copiados (ausente al limpiar).
- **`brush.changed`** — se dispara cuando el usuario cambia cualquier propiedad del pincel (tamaño, rotación, volteo, opacidad, hue, saturación, iluminación).
- **`tileset.changed`** — se dispara cuando se cambia el tileset de la paleta (`"selected"`), se edita una propiedad de tileset (`"edited"`), o los tilesets se recargan del disco (`"reloaded"`).
- **`undo`** / **`redo`** — se disparan tras un deshacer o rehacer exitoso. `label` es la descripción de la entrada de deshacer.
- **`save.failed`** — se dispara cuando una operación de guardado lanza un error. `error` es la cadena del mensaje de error.
- **`event.changed`** — se dispara tras cualquier mutación de evento RMXP (crear, borrar, mover, actualizar).
- **`paste.before`** — se dispara antes de confirmar una operación de pegado. **Cancelable** — devuelve `{ cancel: true, reason: "..." }` para abortar. `tileCount` es el número de tiles en el portapapeles.
- **`stats.changed`** — se dispara periódicamente (~60s) con capturas de estadísticas del editor actualizadas. `global` contiene estadísticas de por vida, `project` contiene las del proyecto actual (o `null` si no hay proyecto abierto).
- **`keybind.changed`** — se dispara cuando se cambia un keybind vía el diálogo de ajustes o la API `ctx.keybinds`. `actionId` es la acción afectada, `oldKey` y `newKey` son las cadenas de combo normalizadas (p. ej. `"ctrl+s"`).
- **`locale.changed`** — se dispara cuando cambia el idioma activo del editor (View → Language, `ctx.i18n.setLocale`, o un locale aportado por un mod que se registra/desregistra). `locale` es el nuevo código de locale (p. ej. `"en"`, `"es"`, o un código registrado por un mod). `ctx.i18n.onChanged(cb)` es el wrapper de conveniencia.

## Handlers cancelables

`save.before` y `paste.before` son los eventos cancelables. Los listeners pueden devolver una Promise — el editor los espera todos con un timeout de 5 segundos por handler. Un handler que excede el tiempo se trata como no-cancel y se registra una advertencia.

```js
ctx.bus.on("save.before", async (e) => {
  const ok = await checkSomething(e.mapId);
  if (!ok) return { cancel: true, reason: "validation failed" };
});
```

## Eventos entre mods

Los mods pueden emitir y escuchar los eventos estándar libremente. No hay sandboxing en v1 — todos los mods comparten el mismo bus. Usa la API `commands` (vía `ctx.commands.register/execute`) para patrones directos de petición/respuesta donde el bus sería incómodo.

## Comandos de evento personalizados (no eventos del bus)

A diferencia del **bus** de eventos del editor de arriba, un mod también puede registrar un **comando de evento RMXP** personalizado que los map makers insertan en las páginas de evento — consulta [`events.registerCommand`](api-reference.md). Estos no se emiten en el bus; se guardan en el mapa y corren en el juego.

Cada comando de mod se guarda como un comando Script estándar de RMXP (código 355) cuyo `parameters[0]` es el Ruby literal que devuelve el `script(params)` del comando (p. ej. `pbCameraScrollTo(0, -4)`). Esto mantiene el round-trip del `.rxdata` del mapa sin cambios, pasa `validateEvent` (355 es un código conocido) y corre en el juego como cualquier otro script de evento — no hay dispatcher ni handler de runtime que registrar.

## Editar los comandos de un evento (no eventos del bus)

También aparte del bus: un mod puede leer y reescribir la lista de comandos de la
página de un evento **existente**. `events.getFull()` devuelve cada página con su
`list` de comandos; asigna una `list` nueva y llama a `events.update()` para
escribirla (un solo paso de deshacer):

```js
const ev = ctx.events.getFull(mapId, eventId);
ev.pages[0].list = [ctx.events.createCommand(101, ["Hola"])];
ctx.events.update(mapId, ev);
```

`update()` añade el terminador de página (código 0) de RMXP si tu lista no lo
tiene, y deja los comandos de una página intactos si omites su `list`. Las reglas
completas — añadir a una lista existente, `validateEvent` y el indent de los
comandos — están en [api-reference.md](api-reference.md) (`events`).
