# Mod API Documentation

Reference docs for everything a mod can do. Mirror of the editor's internal mod-api documentation, published here so authors can browse without needing the editor source.

## Documents

| Document | What you'll learn |
|----------|-------------------|
| **[getting-started.md](getting-started.md)** | Write your first mod in five minutes |
| **[publishing.md](publishing.md)** | Hands-on walkthrough (build, release, submit your first mod, ~25 min) + full publishing reference |
| **[api-reference.md](api-reference.md)** | Every method, type, and ctx surface available to mods |
| **[events-reference.md](events-reference.md)** | Every event the editor emits, with payload shapes |
| **[quick-reference.md](quick-reference.md)** | One-page cheat sheet for common API calls |
| **[api-changelog.md](api-changelog.md)** | What changed in each API version |
| **[troubleshooting.md](troubleshooting.md)** | Common problems and how to fix them |
| **[mod-api.d.ts](mod-api.d.ts)** | TypeScript type definitions — drop into your project for IDE autocomplete |
| **[app-strings.json](app-strings.json)** | Every translatable editor string, empty-valued — the template for a translation mod |

Publishing your mod through the Marketplace? See **[publishing.md](publishing.md)** — it starts with a hands-on tutorial, then the full reference.

## Using `mod-api.d.ts` in your mod project

If you write your mod in TypeScript (or use VS Code with JS type-checking), grab `mod-api.d.ts` from this folder and reference it for full autocomplete on `ctx`:

```js
// index.js
/** @param {import("./mod-api").ModContext} ctx */
export function activate(ctx) {
  ctx.ui.showToast({ message: "typed!" });  // ← autocomplete works
}
```

Or for TypeScript:

```ts
// index.ts
import type { ModContext } from "./mod-api";

export function activate(ctx: ModContext): void {
  ctx.ui.showToast({ message: "typed!" });
}
```

The file is a single self-contained `.d.ts` with no dependencies. Copy it next to your `index.js` / `index.ts`.

## API versioning

`manifest.json#apiVersion` is the **minimum Mod API your mod needs** — the version that introduced the newest method, event, or field it uses. Every API change gets a new version (patch included), and an editor that doesn't provide the version you ask for refuses the mod up front: blocked in the Marketplace, `error` in the Mod Manager. So your mod never half-loads against an editor that lacks what it calls, and targeting an older version stays safe forever. See [api-changelog.md](api-changelog.md) for what each version added.

## Reporting doc bugs

Open an issue on this repo if a doc is wrong, outdated, or missing something. Doc fixes are welcome via PR.
