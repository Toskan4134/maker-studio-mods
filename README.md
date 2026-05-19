# Maker Studio Mods Registry 

This repository is the curated index for the Maker Studio mod marketplace. The editor fetches `index.json` from this repo to populate the in-app Marketplace.

## For users

Open Maker Studio → **Mods** menu → **Mod Manager** → **Marketplace** tab. The editor reads this `index.json` directly — no separate install step is needed.

## For mod authors

Want your mod listed here? Start with:

- **[docs/](docs/)** — Mod API reference, events list, getting-started, changelog, and `mod-api.d.ts` for IDE autocomplete.
- **[examples/](examples/)** — every bundled example mod with annotated walkthroughs. Best way to learn the API in context.
- **[`scripts/new-mod.ps1`](scripts/new-mod.ps1) / [`new-mod.sh`](scripts/new-mod.sh)** — scaffold a fresh mod folder (manifest + activate stub + README) in one prompt.
- **[KEYS.md](KEYS.md)** — generate your minisign signing keypair (uses the [`scripts/`](scripts/) helpers).
- **[PUBLISHING.md](PUBLISHING.md)** — full step-by-step guide: release format, signing, registry PR, updates.
- **[SUBMISSION.md](SUBMISSION.md)** — short rules and PR checklist.

In short:

1. Run `.\scripts\new-mod.ps1` (or `.sh`) → answers a couple prompts → gives you a starter mod folder.
2. Edit `index.js`, test locally.
3. Push to a **public** GitHub repo, tag `vX.Y.Z`, attach `<modId>-<version>.zip` (+ optional `.minisig` — see [KEYS.md](KEYS.md)) to a Release.
4. Open a PR here adding your entry to `index.json`. CI validates schema + checks your release assets exist before merge.

## Maintainer's signing key

The maintainer's minisign public key is in [`pubkey.txt`](pubkey.txt). This key is only used for mods the maintainer publishes themselves. Each independent author publishes their own pubkey via their own registry entry.

## Registry schema

Canonical JSON Schema lives at [`schema/index.schema.json`](schema/index.schema.json) and is referenced from `index.json` via `$schema` — IDE autocomplete + validation work out of the box.

Example entry:

```json
{
  "id": "com.author.modname",
  "name": "Human Name",
  "author": "Author Name",
  "repo": "owner/repo-name",
  "description": "One sentence pitch.",
  "tags": ["tag1", "tag2"],
  "icon": "https://...",
  "homepage": "https://...",
  "minStudioVersion": "2.0.0",
  "apiVersion": "1.x",
  "pubkey": "RWQ..."
}
```

Editor caches the index for 1 hour. New entries go live within an hour of merge. CI ([`.github/workflows/validate-pr.yml`](.github/workflows/validate-pr.yml)) blocks PRs that fail schema validation, contain duplicate ids, or reference a release whose assets don't exist.

## License

[MIT](LICENSE). Covers the registry tooling (schema, scripts, docs, examples). Third-party mods listed in `index.json` retain their own authors' copyright.

## Reporting a malicious mod

Open an issue on this repo with the mod id and what you observed. Confirmed malicious mods are removed from `index.json` and stop appearing in the Marketplace.
