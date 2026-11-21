# Maker Studio Mods Registry

This repository is the curated index for the Maker Studio mod marketplace. The editor fetches `index.json` from this repo to populate the in-app Marketplace.

Looking for the editor itself? Download it and follow the installation guide in the main
[**Toskan4134/maker-studio**](https://github.com/Toskan4134/maker-studio#maker-studio) repo.

## How install is secured

The registry pins each mod to an exact `version` (semver tag) and the SHA-256 of its release zip. The editor:

1. Reads `index.json`.
2. Fetches the release at `/repos/{repo}/releases/tags/v{version}` — never `/releases/latest`.
3. Downloads the asset whose name matches `assetName`.
4. Hashes the bytes locally and refuses to install on any mismatch with the `sha256` field.

That means every new release a mod author publishes goes through a registry PR before it reaches users. The PR is the security boundary, not GitHub release auth.

## For users

Open Maker Studio → **Mods** menu → **Mod Manager** → **Marketplace** tab. The editor reads this `index.json` directly — no separate install step is needed. Don't have the editor yet? Get it from the [main repo](https://github.com/Toskan4134/maker-studio#maker-studio) (download buttons + [installation guide](https://github.com/Toskan4134/maker-studio/blob/main/docs/getting-started.md#installation)).

## For mod authors

Want your mod listed here? Start with:

- **[docs/publishing.md](docs/publishing.md)** — **first-timers start here:** hands-on walkthrough (create → write → test → release → submit, ~25 min), then the full reference (release format, automation, registry PR, updates, submission rules, rejection reasons).
- **[docs/](docs/)** — Mod API reference, events list, getting-started, changelog, and `mod-api.d.ts` for IDE autocomplete.
- **[examples/](examples/)** — every bundled example mod with annotated walkthroughs. Best way to learn the API in context.
- **[`templates/publish.yml`](templates/publish.yml)** — drop-in GitHub Actions workflow that builds the zip, computes the SHA-256, attaches both to a GitHub Release, and prints the exact registry-PR diff.

In short:

1. Create a mod folder — copy one from [`examples/`](examples/) or hand-write `manifest.json` + `index.js` + `README.md` (the [walkthrough in Publishing](docs/publishing.md) walks through it).
2. Edit `index.js`, test locally.
3. Push to a **public** GitHub repo, tag `vX.Y.Z`. The template Action attaches `<modId>-<version>.zip` to a Release and prints the SHA-256.
4. Open a PR here adding your entry to `index.json` with `version`, `assetName`, and `sha256`. CI validates schema + checks release assets exist before merge.

## Registry schema

Canonical JSON Schema lives at [`schema/index.schema.json`](schema/index.schema.json) and is referenced from `index.json` via `$schema` — IDE autocomplete + validation work out of the box.

Example entry:

```json
{
  "id": "com.author.modname",
  "name": "My Mod",
  "authors": [{ "name": "Author Name", "url": "https://your-site" }],
  "repo": "owner/repo-name",
  "version": "1.0.0",
  "assetName": "com.author.modname-1.0.0.zip",
  "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "description": "One sentence pitch.",
  "tags": ["tag1", "tag2"],
  "icon": "https://...",
  "homepage": "https://...",
  "minStudioVersion": "2.0.0",
  "apiVersion": "1.0.1"
}
```

`version`, `assetName`, `sha256` are mandatory — the editor refuses to install without them. Editor caches the index for 1 hour. New entries go live within an hour of merge. CI ([`.github/workflows/validate-pr.yml`](.github/workflows/validate-pr.yml)) blocks PRs that fail schema validation, contain duplicate ids, or reference a release whose pinned asset doesn't exist.

## License

The registry schema, scripts, documentation, and examples are licensed under [GPLv3](LICENSE).
New Marketplace listings must offer the mod and its corresponding source as free downloads under
the [Maker Studio Mod Free Distribution License](templates/MOD-LICENSE.txt). Authors can also
adopt these terms for mods they publish independently. The terms apply to copies of a mod released
under this license wherever they are shared. Check each existing mod for its published terms.
The desktop editor's source code is currently private. See
[Maker Studio's licensing information](https://github.com/Toskan4134/maker-studio#licensing)
for details on the editor and game integrations.

## Marketplace listing terms

By requesting a new listing, the publisher agrees to release the submitted mod under
the [Maker Studio Mod Free Distribution License](templates/MOD-LICENSE.txt) and to keep
the package and corresponding source available free of charge while that version is listed.
This applies to access through the Marketplace and any other channel where the publisher
distributes the listed version. The publisher must own or have permission to license the
code and assets included in the submission. The maintainer may reject or remove listings
that do not meet these terms.

## Reporting a mod

Open an issue here with the mod ID, affected version, and links or screenshots showing
the issue. For a paid download or missing source, include the download page, checkout
page, or source link that shows the problem. The maintainer can remove listings that
violate the listing terms. For unauthorized copies hosted elsewhere, contact the host
if you own or represent the rights to the copied material.
