# Publishing a Mod

> **First time publishing?** Use the hands-on walkthrough in **[TUTORIAL.md](TUTORIAL.md)** instead — it walks you through the same steps with concrete commands and example output. Come back here for reference once you know the flow.

End-to-end reference for getting your mod into the Maker Studio Marketplace. Skip ahead to whichever section you need:

1. [Repo layout](#1--your-mod-repo)
2. [Release convention](#2--release-convention)
3. [Automating releases](#3--automating-releases-with-github-actions)
4. [Registry submission](#4--get-listed-in-the-registry)
5. [Updating](#5--releasing-an-update)
6. [Removing or renaming](#6--removing-or-renaming-a-mod)
7. [What users see](#7--what-users-see)
8. [Common mistakes](#8--common-mistakes)

The Marketplace is server-less but **not trust-on-first-use**. The registry's `index.json` pins each mod to an exact `version` and the SHA-256 of its release asset. The editor downloads the pinned tag (`/releases/tags/v{version}`), hashes the bytes locally, and refuses to install on mismatch. So you keep ownership of your mod repo, but **every new release needs a PR here** — that PR is the security boundary.

## 1 — Your Mod Repo

Your mod needs a `manifest.json` and at least one JavaScript file. A typical repo layout:

```
ms-my-mod/
├── manifest.json
├── index.js
├── README.md
└── (any assets you need)
```

### `manifest.json` minimum

```json
{
  "id": "com.yourname.mymod",
  "name": "My Mod",
  "version": "1.0.0",
  "apiVersion": "1.0.0",
  "main": "index.js",
  "authors": [{ "name": "Your Name", "url": "https://your-site-or-handle" }],
  "description": "What it does in one sentence.",
  "permissions": ["ui.toasts"]
}
```

Field rules:

| Field | Required | Notes |
|-------|----------|-------|
| `id` | yes | Reverse-DNS, permanent. Cannot change once published |
| `name` | yes | Shown in Mod Manager and Marketplace cards |
| `version` | yes | Semver. Must match release tag (without leading `v`) |
| `apiVersion` | yes | Editor's Mod API version your mod targets |
| `main` | yes | Relative path to JS entry. No `..` or absolute paths |
| `authors` | recommended | Array of `{ name, url? }`. Shown as clickable links |
| `description` | recommended | Long descriptions get truncated in the card |
| `homepage` | optional | Mod homepage, separate from author URL |
| `dependencies` | optional | `{ "other.mod.id": "^1.0.0" }` — loader topo-sorts |
| `permissions` | optional | See [Permissions](#permissions) below |

### Mod entry file

A mod exports an `activate(ctx)` function and optionally `deactivate()`:

```js
export function activate(ctx) {
  ctx.log.info("My Mod loaded");

  ctx.ui.showToast({ message: "Hello!" });

  ctx.menu.registerMenuItem({
    menu: "Mods",
    label: "My Mod — Do Thing",
    handler: () => ctx.ui.showToast({ message: "Did the thing." }),
  });
}

export function deactivate() {
  // Disposables registered through ctx are auto-cleaned. Nothing else to do.
}
```

The `ctx` argument exposes the full editor API: `editor`, `map`, `tileset`, `events`, `tools`, `menu`, `commands`, `ui`, `bus`, `fs`, `storage`, `log`, `lifecycle`, `stats`, `keybinds`, `selectors`, `projectData`.

Two ways to learn it:

- Read the bundled example mods under [`examples/mods/`](examples/mods/) — every folder ships with a walkthrough README explaining what API surface it uses.
- Read the API reference docs under [`docs/`](docs/) — [api-reference.md](docs/api-reference.md), [events-reference.md](docs/events-reference.md), [quick-reference.md](docs/quick-reference.md). For IDE autocomplete, drop [`docs/mod-api.d.ts`](docs/mod-api.d.ts) next to your `index.js`.

### Permissions

Declared in `manifest.json#permissions`. Users see the list before installing.

| Permission | What it grants |
|------------|----------------|
| `fs.mod` | Read/write inside the mod's own folder |
| `fs.project` | Read project assets (game folder) |
| `fs.write.project` | Write inside the project (modify game data) |
| `events.cancel.save` | Cancel save operations via the `save.before` event |
| `ui.dialogs` | Show dialogs |
| `ui.toasts` | Show toasts |

Declare every permission you actually use. Undeclared usage is a red flag for reviewers and users.

## 2 — Release Convention

Each release on your repo must follow these rules:

- **Git tag**: `vX.Y.Z` (semver). Example: `v1.2.0`.
- **`manifest.json#version`** must match the tag without the leading `v`. If they disagree the editor refuses to install.
- **Zip asset**: named `<modId>-<version>.zip`. Example: `com.yourname.mymod-1.2.0.zip`. The registry pins this exact filename — typos are a hard install failure.
- **Zip layout**: `manifest.json` lives at the zip root. Either zip the contents of your mod folder directly, or zip the folder itself — the installer auto-strips a single top-level folder.
- **SHA-256**: the editor refuses to install bytes that don't match the SHA-256 your registry entry pins. Compute it after the zip is built — `sha256sum <modId>-<version>.zip` on macOS/Linux, `Get-FileHash <modId>-<version>.zip -Algorithm SHA256` on Windows.
- **Release body**: this markdown becomes the changelog shown in the Marketplace card.

### Building the zip on Windows

```powershell
Compress-Archive -Path manifest.json,index.js,README.md -DestinationPath com.yourname.mymod-1.2.0.zip
Get-FileHash com.yourname.mymod-1.2.0.zip -Algorithm SHA256
```

### Building the zip on macOS/Linux

```bash
zip -r com.yourname.mymod-1.2.0.zip manifest.json index.js README.md
sha256sum com.yourname.mymod-1.2.0.zip
```

Test before publishing: unzip into `%APPDATA%/maker-studio/Mods/com.yourname.mymod/`, restart the editor, confirm the mod loads in the Mod Manager.

## 3 — Automating Releases with GitHub Actions

The repo ships a ready-to-use workflow at [`templates/publish.yml`](templates/publish.yml). Drop it into your mod repo at `.github/workflows/publish.yml` and it does the whole release-side dance for you:

1. Triggered when you push a tag matching `v*.*.*`.
2. Reads `manifest.json#version` and refuses to continue if it doesn't match the tag.
3. Zips the repo (excluding `.git`, `.github`, existing zips) as `<modId>-<version>.zip`.
4. Computes `sha256sum`, writes a `SHA256SUMS.txt`.
5. Creates the GitHub Release for the tag and uploads both files as assets.
6. Prints the exact 3-line block (`"version"`, `"assetName"`, `"sha256"`) you paste into your registry entry's PR.

The default `GITHUB_TOKEN` is enough — no extra secrets to configure. There's an optional commented-out follow-up job in the template that auto-opens the registry PR for you if you set a `REGISTRY_PAT` secret.

## 4 — Get Listed in the Registry

Fork this repo. Open `index.json` and add an entry to the `mods` array:

```json
{
  "id": "com.yourname.mymod",
  "name": "My Mod",
  "authors": [{ "name": "Your Name", "url": "https://your-site-or-twitter" }],
  "repo": "your-github-handle/ms-my-mod",
  "version": "1.0.0",
  "assetName": "com.yourname.mymod-1.0.0.zip",
  "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "description": "One-line pitch of what the mod does.",
  "tags": ["tools", "ui"],
  "icon": "https://raw.githubusercontent.com/your-github-handle/ms-my-mod/main/icon.png",
  "homepage": "https://your-site-or-twitter",
  "minStudioVersion": "2.0.0",
  "apiVersion": "1.x"
}
```

`version`, `assetName`, and `sha256` are mandatory — the editor will not install otherwise.

Open a PR. The PR template asks you to confirm: tested on the latest editor, no obfuscated code, permissions justified, hash matches the released zip. Fill it in.

Once merged, your mod is live within one hour for everyone using the Marketplace.

## 5 — Releasing an Update

Every new version needs a registry PR. That's the whole point of the SHA-256 pin — if you could ship a new release on GitHub without an approval pass through this repo, the registry would protect nothing.

Per new version:

1. Bump `manifest.json#version` (e.g. `1.2.0` → `1.2.1`).
2. Commit, tag `v1.2.1`, push the tag. If you copied the template Action, it builds, hashes, and publishes the GitHub Release automatically.
3. Open a PR here that **only changes `version`, `assetName`, and `sha256`** on your entry. The Action prints the exact diff to copy.
4. After merge, users see the update on their next check (within ~1 hour). Until merge, users keep installing the previously approved version — that's the security guarantee, not a bug.

## 6 — Removing or Renaming a Mod

If you abandon a mod or want to take it down: open a PR to this repo removing your `index.json` entry. The mod stops appearing in the Marketplace, but anyone who already installed it keeps it until they manually uninstall.

If you want to rename or restructure: **you cannot change `id`**. Publish under a new id and ask users to migrate. Old installs of the old id are unaffected.

## 7 — What Users See

When someone clicks **Install** on your mod they see:

- Your icon, name, and author.
- A **Verified** chip if the maintainers of this registry have flagged the mod as curated (independent of integrity — the SHA-256 pin always applies).
- The exact list of capabilities your manifest's `permissions` array declares.
- A Cancel / Install button.

Keep your `permissions` minimal — every extra permission scares users away.

## 8 — Common Mistakes

- **Tag doesn't match manifest version** → installer refuses. `manifest.json#version` must equal the tag without the `v`.
- **Zip wraps everything in a deep folder** → only single-level wrapping is auto-stripped. Don't zip `Documents/my-mod/manifest.json`.
- **`assetName` in the registry doesn't match the actual asset on the release** → install fails with "release has no asset named ...".
- **SHA-256 in the registry doesn't match the uploaded zip** → install fails with "sha256 mismatch". Recompute after every rebuild.
- **Pushed a new tag but forgot the registry PR** → users won't see the new version. By design.
- **`manifest.id` doesn't match what's in `index.json`** → installer rejects with "manifest id mismatch".
