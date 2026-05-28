# Submitting a Mod

Short version. Full step-by-step guide: [PUBLISHING.md](PUBLISHING.md).

## Requirements

Your mod must:

1. Live in a **public** GitHub repo you own.
2. Have a `manifest.json` at the root with at least these fields:
   - `id` (reverse-DNS, e.g. `com.yourname.modname`) — permanent identity
   - `name` (human-readable)
   - `version` (semver, must match release tag)
   - `apiVersion` (the Mod API version your mod targets, e.g. `"1.0.0"`)
   - `main` (relative path to JS entry file, e.g. `"index.js"`)
3. Tag each release `vX.Y.Z` matching `manifest.json#version` exactly (without the leading `v`).
4. Attach a zip asset named `<modId>-<version>.zip` to each GitHub Release, with `manifest.json` at the zip root (or wrapped in one top-level folder — installer auto-strips it).
5. Be loadable cleanly in the latest version of Maker Studio (test by dropping the unzipped folder into `%APPDATA%/maker-studio/Mods/` and restarting).

## Recommended

- Drop [`templates/publish.yml`](templates/publish.yml) into your mod repo at `.github/workflows/publish.yml`. It builds the zip, computes the SHA-256, attaches both as release assets, and prints the exact `index.json` block you need to PR.
- Start from one of the [`examples/mods/`](examples/mods/) folders — fastest way to learn the API and avoid common mistakes.
- Provide a clear release-notes body — it becomes the changelog shown to users.
- Provide an icon (64×64 PNG) hosted in your repo or as a release asset.
- Declare every capability you use in the manifest's `permissions` array. Users see the list before installing — undeclared usage is a red flag.

## How to submit

First-timer? Follow the hands-on walkthrough in **[TUTORIAL.md](TUTORIAL.md)** — covers scaffolding the mod, releasing, and submitting from scratch.

Otherwise the short version:

1. Publish the first GitHub Release on your mod repo (push tag `v1.0.0`). If you copied the template Action it builds the zip and computes the SHA-256 automatically; otherwise run `sha256sum <modId>-1.0.0.zip` yourself.
2. **Easiest (no local git):** open [`index.json`](index.json) on github.com → pencil icon → paste your entry into `mods` (including the `version`, `sha256`, and `assetName` from step 1) → **Propose changes** → cross-repo PR.
3. **Local fork (multiple mods):** `gh repo fork Toskan4134/maker-studio-mods --clone` → branch → edit `index.json` → push → `gh pr create`.
4. Maintainer reviews. Once merged, your mod is live for users within 1 hour.

## Updating

Every new release needs a registry PR — that is the whole point of the SHA-256 pin. The flow is:

1. Tag and publish the new release on your repo (zip + SHA-256 in release assets).
2. Open a PR here updating your entry's `version`, `assetName`, and `sha256`. If you use the template workflow, the action prints the exact 3-line diff to copy.
3. After merge, users see the update on their next check (within ~1 hour).

Until that PR is merged, users keep installing the previously approved version even if you've already shipped the new tag on GitHub — that's the safety guarantee.

## Removal

Open a PR removing your entry from `index.json`.

## `index.json` entry template

```json
{
  "id": "com.yourname.modname",
  "name": "My Mod",
  "authors": [{ "name": "Your Name", "url": "https://your-site" }],
  "repo": "your-handle/your-repo",
  "version": "1.0.0",
  "assetName": "com.yourname.modname-1.0.0.zip",
  "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "description": "One-sentence pitch.",
  "tags": ["tools"],
  "icon": "https://raw.githubusercontent.com/your-handle/your-repo/main/icon.png",
  "homepage": "https://your-site",
  "minStudioVersion": "2.0.0",
  "apiVersion": "1.x"
}
```

Drop `icon`, `homepage`, `minStudioVersion`, `tags` if not applicable. `id`, `name`, `authors`, `repo`, `version`, `assetName`, `sha256` are mandatory.

## Rejection reasons

PRs may be rejected for:

- Mod doesn't load on latest Maker Studio.
- `sha256` in the PR doesn't match the actual release asset on GitHub.
- Obfuscated or minified JS without source.
- Hidden network calls to unknown domains.
- Permissions in manifest don't match what the code actually uses.
- Misleading name/description.
- License conflicts (your mod repo must be openly available; the mod itself can be any OSI license).
