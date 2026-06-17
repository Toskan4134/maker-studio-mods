# Documentación de la API de mods

Documentación de referencia de todo lo que puede hacer un mod. Espejo de la documentación interna mod-api del editor, publicada aquí para que los autores puedan navegarla sin necesitar el código fuente del editor.

## Documentos

| Documento | Qué aprenderás |
|----------|-------------------|
| **[getting-started](getting-started.md)** | Escribe tu primer mod en cinco minutos |
| **[api-reference](api-reference.md)** | Cada método, tipo y superficie de ctx disponible para los mods |
| **[events-reference](events-reference.md)** | Cada evento que emite el editor, con las formas de payload |
| **[quick-reference](quick-reference.md)** | Chuleta de una página para las llamadas comunes de la API |
| **[api-changelog](api-changelog.md)** | Qué cambió en cada versión de la API |
| **[troubleshooting](troubleshooting.md)** | Problemas comunes y cómo arreglarlos |
| **[mod-api.d.ts](/mod-api.d.ts)** | Definiciones de tipo TypeScript — colócalas en tu proyecto para autocompletado en el IDE |

¿Publicas tu mod a través del Marketplace? Consulta **[PUBLISHING.md](https://github.com/Toskan4134/maker-studio-mods/blob/main/PUBLISHING.md)** en la raíz del repositorio.

## Usar `mod-api.d.ts` en tu proyecto de mod

Si escribes tu mod en TypeScript (o usas VS Code con comprobación de tipos JS), descarga `mod-api.d.ts` y referéncialo para autocompletado completo sobre `ctx`:

```js
// index.js
/** @param {import("./mod-api").ModContext} ctx */
export function activate(ctx) {
  ctx.ui.showToast({ message: "typed!" });  // ← el autocompletado funciona
}
```

O para TypeScript:

```ts
// index.ts
import type { ModContext } from "./mod-api";

export function activate(ctx: ModContext): void {
  ctx.ui.showToast({ message: "typed!" });
}
```

El archivo es un único `.d.ts` autocontenido sin dependencias. Cópialo junto a tu `index.js` / `index.ts`.

## Versionado de la API

`manifest.json#apiVersion` ancla tu mod a una versión mayor concreta de la API de mods. El editor se negará a cargar un mod cuya versión mayor no coincida con la suya — garantizando que tu mod no se rompa en silencio en una actualización del editor. Consulta [api-changelog](api-changelog.md) para el historial.

## Reportar errores de documentación

Abre un issue en este repositorio si una doc es incorrecta, está desactualizada o le falta algo. Las correcciones de docs son bienvenidas vía PR.
