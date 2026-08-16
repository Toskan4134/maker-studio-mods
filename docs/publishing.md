# Publishing a Mod

Hands-on walkthrough from zero to a live, installable mod in the Maker Studio Marketplace. Should take about 25 minutes the first time. Subsequent mods take 10.

The example mod — **YOUR_MOD** (`com.YOUR_USERNAME.YOUR_MOD`) — tracks how many days in a row you've opened the editor.

Substitute your own GitHub handle, mod id, and name as you go.

> Already know the flow and just want the spec? Jump to [Publishing — the reference](#publishing-a-mod) below.

---

## Before you start

You'll need:

- A **public** GitHub account.
- Maker Studio installed locally (to test the mod).
- Git on your machine. PowerShell on Windows, or bash on macOS/Linux.

Clone the registry repo locally — you'll copy from its `examples/` and grab the workflow template:

```powershell
gh repo clone Toskan4134/maker-studio-mods
cd maker-studio-mods
```

(No `gh`? `git clone https://github.com/Toskan4134/maker-studio-mods.git` works the same.)

---

## Step 1 — Create your mod folder

A mod is a folder with three files: `manifest.json` (metadata), `index.js` (your code), and `README.md`. The fastest start is to copy one of the registry's [`examples/mods/`](../examples/mods/) and edit it. Here we'll build it from scratch so you see every piece.

Create the folder anywhere outside the registry clone — your mod needs its own repo. On your Desktop:

```powershell
mkdir ms-YOUR_MOD
cd ms-YOUR_MOD
```

Add the three files.

### `manifest.json`

```json
{
  "id": "com.YOUR_USERNAME.YOUR_MOD",
  "name": "YOUR_MOD",
  "version": "1.0.0",
  "authors": [{ "name": "YOUR_USERNAME", "url": "https://github.com/YOUR_USERNAME" }],
  "description": "Tracks how many days in a row you've opened the editor.",
  "tags": ["tools", "ui"],
  "apiVersion": "1.0.0",
  "main": "index.js",
  "permissions": ["ui.toasts"]
}
```

The `id` is reverse-DNS (must contain a `.`). `permissions` declares every API capability your code uses — reviewers check this against the code. In `authors`, `url` is optional, and a plain `"author": "YOUR_USERNAME"` string works too.

`tags` are the Marketplace's search and filter keywords, and they are yours to choose — up to 8. Write them however reads best (`"Terrain Tags"`, `"Essentials 19.1"`); publishing slugs them to the `^[a-z0-9-]+$` the registry stores (`terrain-tags`, `essentials-19-1`). Omit the field and the registry maintainer picks tags for you on review.

### `index.js`

A starter that logs, shows a toast, and adds a menu item:

```js
export function activate(ctx) {
  ctx.log.info("YOUR_MOD activated");

  ctx.ui.showToast({
    message: "Hello from YOUR_MOD!",
    level: "info",
  });

  ctx.menu.registerMenuItem({
    menu: "Mods",
    label: "YOUR_MOD — Say Hi",
    handler: () => {
      ctx.ui.showToast({ message: "Hi from YOUR_MOD!" });
    },
  });
}

export function deactivate() {
  // Disposables registered through ctx are auto-cleaned. Nothing else to do.
}
```

### `README.md`

A short note for yourself — anything works. The build + release steps are covered later in this guide (see [Publishing](#publishing-a-mod) below).

You should now have:

```
ms-YOUR_MOD/
├── manifest.json
├── index.js
└── README.md
```

---

## Step 2 — Write your mod logic

Open `index.js` and replace the starter with your real feature. For YOUR_MOD it might look like:

```js
const STORAGE_KEY = "streak";

export async function activate(ctx) {
  const today = new Date().toISOString().slice(0, 10);
  const prev = await ctx.storage.get(STORAGE_KEY, { lastDay: null, count: 0 });

  let count = prev.count;
  if (prev.lastDay !== today) {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    count = prev.lastDay === yesterday ? prev.count + 1 : 1;
    await ctx.storage.set(STORAGE_KEY, { lastDay: today, count });
  }

  ctx.ui.showToast({
    message: `🔥 ${count}-day streak — keep going!`,
    level: "info",
    durationMs: 4000,
  });
}
```

The full Mod API surface (every method on `ctx`) is in this `docs/` folder — see [api-reference.md](api-reference.md) for the narrative reference, [quick-reference.md](quick-reference.md) for the one-page cheat sheet, and [mod-api.d.ts](mod-api.d.ts) for TypeScript types you can drop into your editor for autocomplete.

Open `manifest.json` and declare the permissions you actually use. YOUR_MOD uses `ctx.storage` (no permission needed — it's mod-local) and `ctx.ui.showToast` (needs `ui.toasts`):

```json
"permissions": ["ui.toasts"]
```

---

## Step 3 — Test locally

Drop your mod folder into the global mods directory and restart the editor.

**Windows:**
```powershell
Copy-Item -Recurse C:\Users\YOUR_USERNAME\Desktop\ms-YOUR_MOD "$env:APPDATA\maker-studio\Mods\YOUR_MOD"
```
**macOS:** `~/Library/Application Support/maker-studio/Mods/YOUR_MOD/`
**Linux:** `~/.local/share/maker-studio/Mods/YOUR_MOD/`

Boot Maker Studio → **Mods → Mod Manager**. Your mod appears in the **Installed** tab with the **global** badge. Open any project — the toast should fire.

If the mod fails to load, expand its row in Mod Manager to see error logs. Fix, then click **Reload** on the row (no full restart needed).

Repeat edit → reload until it works.

When done testing, delete the test copy:
```powershell
Remove-Item -Recurse "$env:APPDATA\maker-studio\Mods\YOUR_MOD"
```

---

## Step 4 — Drop in the GitHub Actions workflow (recommended)

The registry ships a workflow at [`templates/publish.yml`](../templates/publish.yml). It takes care of zipping the mod, computing the SHA-256, creating the GitHub Release, and printing the exact registry-PR diff. Copy it into your mod repo:

```powershell
mkdir .github\workflows
Copy-Item C:\path\to\maker-studio-mods\templates\publish.yml .github\workflows\publish.yml
```

Commit it now along with your code. No secrets to configure — the default `GITHUB_TOKEN` is enough to publish a release on your own repo.

If you'd rather build releases manually, skip this step and do `Compress-Archive` + `Get-FileHash` by hand in Step 6. The rest of the flow is identical.

---

## Step 5 — Create the GitHub repo for your mod

Web: <https://github.com/new>

- Owner: your account
- Repository name: `ms-YOUR_MOD` (or anything you like)
- Visibility: **Public**
- Don't initialize with README / .gitignore / license — you're pushing your own.

Click **Create repository**. Copy the repo URL (e.g. `https://github.com/YOUR_USERNAME/ms-YOUR_MOD.git`).

---

## Step 6 — Push and tag the release

```powershell
cd C:\Users\YOUR_USERNAME\Desktop\ms-YOUR_MOD

git init
git add .
git commit -m "v1.0.0 — initial release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ms-YOUR_MOD.git
git push -u origin main

# Tag the release. Tag must match manifest version exactly — without 'v'.
git tag v1.0.0
git push --tags
```

### If you copied the template Action

Pushing the tag fires `.github/workflows/publish.yml`. Open the **Actions** tab on your mod repo:

1. Watch the run. It zips, hashes, and creates the GitHub Release automatically.
2. Open the final `Print registry PR block` step. It prints something like:
   ```
   "version": "1.0.0",
   "assetName": "com.YOUR_USERNAME.YOUR_MOD-1.0.0.zip",
   "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
   ```
3. Copy those three lines. You'll paste them into the registry PR in Step 7.

### If you're doing it manually

```powershell
$zip = "com.YOUR_USERNAME.YOUR_MOD-1.0.0.zip"
Compress-Archive -Path manifest.json,index.js,README.md -DestinationPath $zip
$sha = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
Write-Host "sha256: $sha"

gh release create v1.0.0 $zip `
  --title "v1.0.0" `
  --notes "Initial release. Tracks daily editor-open streak."
```

Save `$sha` somewhere — you'll need it in Step 7.

---

## Step 7 — Submit to the registry

This is the only step that touches the maker-studio-mods repo. Two paths.

### Path A — GitHub web UI (zero local git)

1. Go to <https://github.com/Toskan4134/maker-studio-mods/blob/main/index.json>
2. Click the **pencil icon** (top right of the file view) — **Edit this file**.
3. GitHub auto-forks the registry to your account behind the scenes. No `git` commands.
4. Add your mod entry inside the `"mods": [ ... ]` array:
   ```json
   {
     "id": "com.YOUR_USERNAME.YOUR_MOD",
     "name": "YOUR_MOD",
     "authors": [{ "name": "YOUR_USERNAME", "url": "https://github.com/YOUR_USERNAME" }],
     "repo": "YOUR_USERNAME/ms-YOUR_MOD",
     "version": "1.0.0",
     "assetName": "com.YOUR_USERNAME.YOUR_MOD-1.0.0.zip",
     "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
     "description": "Tracks how many days in a row you've opened the editor.",
     "tags": ["stats", "motivation"],
     "homepage": "https://github.com/YOUR_USERNAME/ms-YOUR_MOD",
     "apiVersion": "1.0.0",
     "permissions": ["ui.toasts"]
   }
   ```
   Replace `version`, `assetName`, and `sha256` with what Step 6 printed. If there are already entries, add yours as the last item (don't forget the comma after the previous one).
5. Also update `updatedAt` to the current ISO-8601 timestamp.
6. Scroll down to **Propose changes**. Commit message can be anything — `add: com.YOUR_USERNAME.YOUR_MOD` works.
7. **Create pull request** → fill in the PR template (it auto-loads). Submit.

### Path B — Local fork (for power users / multiple mods)

```powershell
gh repo fork Toskan4134/maker-studio-mods --clone --remote
cd maker-studio-mods
git checkout -b add-YOUR_MOD
# edit index.json same as above
git add index.json
git commit -m "add: com.YOUR_USERNAME.YOUR_MOD"
git push origin add-YOUR_MOD
gh pr create --fill
```

---

## Step 8 — Wait for CI, respond to review

When the PR opens, the registry's CI workflow runs these checks:

| Check | What it does |
|-------|--------------|
| **Schema validation** | `index.json` matches `schema/index.schema.json` (required fields, valid id pattern, semver shape, 64-hex sha256) |
| **Duplicate id check** | No two entries share the same `id` |
| **Release asset check** | The repo you listed has a release at the pinned `v{version}` tag containing an asset matching `assetName` |
| **Hash check** | The maintainer (or CI, if available) verifies the listed `sha256` matches the actual bytes on the release |

All green? The maintainer reviews and merges. If something's red, click the failed check for the exact error message. Common fixes:

| Error | Cause | Fix |
|-------|-------|-----|
| `should match pattern "^[a-zA-Z0-9._-]+$"` for `id` | Used spaces or unusual chars in the id | Edit to only letters/digits/`._-` |
| `repo has no release at tag v{version}` | You forgot to publish the Release in Step 6 | Publish the release, push the PR again |
| `release has no asset named '<assetName>'` | Zip is named differently from what your PR claims | Re-upload the zip with the right name, or fix `assetName` in the PR |
| `sha256 doesn't match release asset` | You edited or rebuilt the zip after computing the hash | Re-download from the release, recompute `sha256sum`, update the PR |

Push fixes to the same branch — CI re-runs automatically. Once merged, you're live within ~1 hour (editor caches the index for that long).

---

## Step 9 — Verify in the editor

Open Maker Studio → **Mods → Mod Manager → Marketplace** → click **Refresh** (forces an immediate fetch).

- Your card should appear, pinned to `v1.0.0`.
- Click **Install**. A consent dialog lists your declared permissions. Accept.
- The editor downloads from your release, verifies the SHA-256 matches the registry, and installs.
- Wait for the "Installed YOUR_MOD v1.0.0" toast.
- Switch to the **Installed** tab — your mod is loaded and active.

That's it. You shipped a mod.

---

## Releasing updates

Every subsequent release repeats the same loop — bump version, tag, push, then a registry PR that only changes `version`, `assetName`, and `sha256`. See [Releasing an Update](#5--releasing-an-update) for the canonical steps.

---

## Common first-time pitfalls

- **Forgot to flip the repo to public.** Default for new GitHub repos can be Private. Settings → General → Visibility → Change → Public.

The rest — tag/version mismatch, deep-folder zips, stale hashes, permission mismatches — are covered in [Common Mistakes](#8--common-mistakes) and [Rejection reasons](#rejection-reasons).

---

## Where to ask for help

Open a [discussion on the registry](https://github.com/Toskan4134/maker-studio-mods/discussions) for general questions, or file an [issue](https://github.com/Toskan4134/maker-studio-mods/issues) for a specific bug in the docs or schema.

---

# Publishing a Mod

End-to-end reference for getting your mod into the Maker Studio Marketplace. Skip ahead to whichever section you need:

1. [At a glance](#at-a-glance)
2. [Your mod repo](#1--your-mod-repo)
3. [Release convention](#2--release-convention)
4. [Automating releases](#3--automating-releases-with-github-actions)
5. [Registry submission](#4--get-listed-in-the-registry)
6. [Updating](#5--releasing-an-update)
7. [Removing or renaming](#6--removing-or-renaming-a-mod)
8. [What users see](#7--what-users-see)
9. [Common mistakes](#8--common-mistakes)
10. [Rejection reasons](#rejection-reasons)

The Marketplace is server-less but **not trust-on-first-use**. The registry's `index.json` pins each mod to an exact `version` and the SHA-256 of its release asset. The editor downloads the pinned tag (`/releases/tags/v{version}`), hashes the bytes locally, and refuses to install on mismatch. So you keep ownership of your mod repo, but **every new release needs a PR here** — that PR is the security boundary.

## At a glance

Your mod must:

1. Live in a **public** GitHub repo you own.
2. Have a `manifest.json` at the root with at least these fields:
   - `id` (reverse-DNS, e.g. `com.yourname.modname`) — permanent identity
   - `name` (human-readable)
   - `version` (semver, must match release tag)
   - `apiVersion` (the minimum Mod API your mod needs, e.g. `"1.0.0"`)
   - `main` (relative path to JS entry file, e.g. `"index.js"`)
3. Tag each release `vX.Y.Z` matching `manifest.json#version` exactly (without the leading `v`).
4. Attach a zip asset named `<modId>-<version>.zip` to each GitHub Release, with `manifest.json` at the zip root (or wrapped in one top-level folder — installer auto-strips it).
5. Be loadable cleanly in the latest version of Maker Studio (test by dropping the unzipped folder into `%APPDATA%/maker-studio/Mods/` and restarting).

Recommended:

- Drop [`templates/publish.yml`](../templates/publish.yml) into your mod repo at `.github/workflows/publish.yml`. It builds the zip, computes the SHA-256, attaches both as release assets, and prints the exact `index.json` block you need to PR.
- Start from one of the [`examples/mods/`](../examples/mods/) folders — fastest way to learn the API and avoid common mistakes.
- Provide a clear release-notes body — it becomes the changelog shown to users.
- Provide an icon (64×64 PNG) hosted in your repo or as a release asset.
- Declare every capability you use in the manifest's `permissions` array. Users see the list before installing — undeclared usage is a red flag.

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
| `apiVersion` | yes | Minimum Mod API your mod needs — the version that introduced the newest API it calls. Editors older than this refuse to install or load it |
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

- Read the bundled example mods under [`examples/mods/`](../examples/mods/) — every folder ships with a walkthrough README explaining what API surface it uses.
- Read the API reference docs in this folder — [api-reference.md](api-reference.md), [events-reference.md](events-reference.md), [quick-reference.md](quick-reference.md). For IDE autocomplete, drop [mod-api.d.ts](mod-api.d.ts) next to your `index.js`.

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

The registry ships a ready-to-use workflow at [`templates/publish.yml`](../templates/publish.yml). Drop it into your mod repo at `.github/workflows/publish.yml` and it does the whole release-side dance for you:

1. Triggered when you push a tag matching `v*.*.*`.
2. Reads `manifest.json#version` and refuses to continue if it doesn't match the tag.
3. Zips the repo (excluding `.git`, `.github`, existing zips) as `<modId>-<version>.zip`.
4. Computes `sha256sum`, writes a `SHA256SUMS.txt`.
5. Creates the GitHub Release for the tag and uploads both files as assets.
6. Prints the exact 3-line block (`"version"`, `"assetName"`, `"sha256"`) you paste into your registry entry's PR.

The default `GITHUB_TOKEN` is enough — no extra secrets to configure. There's an optional commented-out follow-up job in the template that auto-opens the registry PR for you if you set a `REGISTRY_PAT` secret — see step 4.

## 4 — Get Listed in the Registry

Publish the first GitHub Release on your mod repo (push tag `v1.0.0`). If you copied the template Action, it builds the zip and computes the SHA-256 automatically; otherwise run `sha256sum <modId>-1.0.0.zip` yourself.

Then open a PR that adds an entry to the `mods` array in [`index.json`](../index.json):

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
  "apiVersion": "1.0.1"
}
```

Drop `icon`, `homepage`, `minStudioVersion`, `tags` if not applicable. `id`, `name`, `authors`, `repo`, `version`, `assetName`, `sha256` are mandatory — the editor will not install otherwise.

Keep `apiVersion` identical to your `manifest.json` (the automatic PR job copies it for you). The editor reads it off the card and blocks Install / Update when it provides an older Mod API, so a too-high value hides your mod from editors that could actually run it, and a too-low one lets the install through only for the mod to land as `error` in the Mod Manager.

Three ways to open the PR:

- **Automatic:** enable the `registry-pr` job in the template Action (fork the registry, add a `REGISTRY_PAT` secret, set `FORK_OWNER`). Every release then opens the PR for you — adding this entry the first time, bumping `version`/`assetName`/`sha256` after that. It fills every field from your `manifest.json`, including `tags`; `icon` and `minStudioVersion` are ours to add on review.
- **Easiest (no local git):** open [`index.json`](../index.json) on github.com → pencil icon → paste your entry into the `mods` array (including the `version`, `sha256`, and `assetName` from your release) → **Propose changes** → cross-repo PR. Also update `updatedAt` to the current ISO-8601 timestamp.
- **Local fork (power users / multiple mods):**

  ```powershell
  gh repo fork Toskan4134/maker-studio-mods --clone --remote
  cd maker-studio-mods
  git checkout -b add-my-mod
  # edit index.json same as above
  git add index.json
  git commit -m "add: com.yourname.mymod"
  git push origin add-my-mod
  gh pr create --fill
  ```

The PR template asks you to confirm: tested on the latest editor, no obfuscated code, permissions justified, hash matches the released zip. Fill it in.

Once merged, your mod is live within one hour for everyone using the Marketplace.

## 5 — Releasing an Update

Every new version needs a registry PR — this is the security boundary (see the [intro](#publishing-a-mod) for why the pin matters).

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

## Rejection reasons

PRs may be rejected for:

- Mod doesn't load on latest Maker Studio.
- `sha256` in the PR doesn't match the actual release asset on GitHub.
- Obfuscated or minified JS without source.
- Hidden network calls to unknown domains.
- Permissions in manifest don't match what the code actually uses.
- Misleading name/description.
- License conflicts (your mod repo must be openly available; the mod itself can be any OSI license).
