# Tutorial — Your First Marketplace Mod

Hands-on walkthrough from zero to a live, installable mod in the Maker Studio Marketplace. Should take about 25 minutes the first time. Subsequent mods take 10.

We'll pretend you're an author called "Alex" publishing a mod called **Hello Streak** (`com.alex.hello-streak`) that tracks how many days in a row you've opened the editor.

Substitute your own GitHub handle, mod id, and name as you go.

---

## Before you start

You'll need:

- A **public** GitHub account.
- Maker Studio installed locally (to test the mod).
- Git on your machine. PowerShell on Windows, or bash on macOS/Linux.

Clone the registry repo locally — you'll need its scaffold scripts and the workflow template:

```powershell
gh repo clone Toskan4134/maker-studio-mods
cd maker-studio-mods
```

(No `gh`? `git clone https://github.com/Toskan4134/maker-studio-mods.git` works the same.)

---

## Step 1 — Scaffold your mod folder

The registry ships a scaffold script that fills in `manifest.json` + an `activate(ctx)` skeleton + a starter `README.md`.

```powershell
# Windows
.\scripts\new-mod.ps1

# macOS / Linux
./scripts/new-mod.sh
```

It asks four questions:

```
Mod id (reverse-DNS, e.g. com.yourname.mymod): com.alex.hello-streak
Display name (shown in Mod Manager): Hello Streak
Author (your display name): Alex
Description (one short sentence — optional): Tracks how many days in a row you've opened the editor.
```

You'll get a new `hello-streak/` folder with:

```
hello-streak/
├── manifest.json
├── index.js
└── README.md
```

Move it out of the registry clone — your mod needs its own repo. Drop it on your Desktop or anywhere you keep code:

```powershell
Move-Item .\hello-streak C:\Users\Alex\Desktop\ms-hello-streak
cd C:\Users\Alex\Desktop\ms-hello-streak
```

---

## Step 2 — Write your mod logic

Open `index.js`. The scaffold gives you:

```js
export function activate(ctx) {
  ctx.log.info("Hello Streak activated");
  ctx.ui.showToast({ message: "Hello from Hello Streak!", level: "info" });
  // ...
}
```

Replace it with your actual feature. For Hello Streak it might look like:

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

The full Mod API surface (every method on `ctx`) is in the registry's `docs/` folder — see `docs/api-reference.md` for the narrative reference, `docs/quick-reference.md` for the one-page cheat sheet, and `docs/mod-api.d.ts` for TypeScript types you can drop into your editor for autocomplete.

Open `manifest.json` and declare the permissions you actually use. Hello Streak uses `ctx.storage` (no permission needed — it's mod-local) and `ctx.ui.showToast` (needs `ui.toasts`):

```json
"permissions": ["ui.toasts"]
```

---

## Step 3 — Test locally

Drop your mod folder into the global mods directory and restart the editor.

**Windows:**
```powershell
Copy-Item -Recurse C:\Users\Alex\Desktop\ms-hello-streak "$env:APPDATA\maker-studio\Mods\hello-streak"
```
**macOS:** `~/Library/Application Support/maker-studio/Mods/hello-streak/`
**Linux:** `~/.local/share/maker-studio/Mods/hello-streak/`

Boot Maker Studio → **Mods → Mod Manager**. Your mod appears in the **Installed** tab with the **global** badge. Open any project — the toast should fire.

If the mod fails to load, expand its row in Mod Manager to see error logs. Fix, then click **Reload** on the row (no full restart needed).

Repeat edit → reload until it works.

When done testing, delete the test copy:
```powershell
Remove-Item -Recurse "$env:APPDATA\maker-studio\Mods\hello-streak"
```

---

## Step 4 — Drop in the GitHub Actions workflow (recommended)

The registry ships a workflow at [`templates/publish.yml`](templates/publish.yml). It takes care of zipping the mod, computing the SHA-256, creating the GitHub Release, and printing the exact registry-PR diff. Copy it into your mod repo:

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
- Repository name: `ms-hello-streak` (or anything you like)
- Visibility: **Public**
- Don't initialize with README / .gitignore / license — you're pushing your own.

Click **Create repository**. Copy the repo URL (e.g. `https://github.com/alex/ms-hello-streak.git`).

---

## Step 6 — Push and tag the release

```powershell
cd C:\Users\Alex\Desktop\ms-hello-streak

git init
git add .
git commit -m "v1.0.0 — initial release"
git branch -M main
git remote add origin https://github.com/alex/ms-hello-streak.git
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
   "assetName": "com.alex.hello-streak-1.0.0.zip",
   "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
   ```
3. Copy those three lines. You'll paste them into the registry PR in Step 7.

### If you're doing it manually

```powershell
$zip = "com.alex.hello-streak-1.0.0.zip"
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
     "id": "com.alex.hello-streak",
     "name": "Hello Streak",
     "authors": [{ "name": "Alex", "url": "https://github.com/alex" }],
     "repo": "alex/ms-hello-streak",
     "version": "1.0.0",
     "assetName": "com.alex.hello-streak-1.0.0.zip",
     "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
     "description": "Tracks how many days in a row you've opened the editor.",
     "tags": ["stats", "motivation"],
     "homepage": "https://github.com/alex/ms-hello-streak",
     "apiVersion": "1.0.0",
     "permissions": ["ui.toasts"]
   }
   ```
   Replace `version`, `assetName`, and `sha256` with what Step 6 printed. If there are already entries, add yours as the last item (don't forget the comma after the previous one).
5. Also update `updatedAt` to the current ISO-8601 timestamp.
6. Scroll down to **Propose changes**. Commit message can be anything — `add: com.alex.hello-streak` works.
7. **Create pull request** → fill in the PR template (it auto-loads). Submit.

### Path B — Local fork (for power users / multiple mods)

```powershell
gh repo fork Toskan4134/maker-studio-mods --clone --remote
cd maker-studio-mods
git checkout -b add-hello-streak
# edit index.json same as above
git add index.json
git commit -m "add: com.alex.hello-streak"
git push origin add-hello-streak
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
- Wait for the "Installed Hello Streak v1.0.0" toast.
- Switch to the **Installed** tab — your mod is loaded and active.

That's it. You shipped a mod.

---

## Releasing updates

Every subsequent release is the same loop — including the registry PR:

1. Edit code.
2. Bump `manifest.json#version` (`1.0.0` → `1.0.1`).
3. Commit, tag `v1.0.1`, push.
4. Template Action builds the zip, hashes it, publishes the release, prints the new 3-line diff.
5. Open a PR to the registry that **only** changes `version`, `assetName`, and `sha256` on your entry.
6. Merge → users get the update.

That's the whole point of the SHA-256 pin: a new release on your repo doesn't reach users until the registry PR merges. If you skip step 5, users keep installing v1.0.0 — by design.

---

## Common first-time pitfalls

- **Tag doesn't match manifest version.** Tag must be exactly `v1.0.0` if manifest says `"version": "1.0.0"`. Off by one character → install rejects.
- **Forgot to flip the repo to public.** Default for new GitHub repos can be Private. Settings → General → Visibility → Change → Public.
- **Zip wraps content in a deep folder.** The installer only auto-strips a single top-level folder. `my-mod/manifest.json` inside the zip = fine. `Documents/stuff/my-mod/manifest.json` = breaks.
- **Recomputed the hash after editing the release.** If you re-upload the zip, you must recompute and re-open / re-push the registry PR with the new sha256.
- **Permissions in manifest don't match code.** If you `ctx.fs.writeProjectFile(...)` but don't declare `fs.write.project`, reviewers will reject.

---

## Where to ask for help

Open a [discussion on the registry](https://github.com/Toskan4134/maker-studio-mods/discussions) for general questions, or file an [issue](https://github.com/Toskan4134/maker-studio-mods/issues) for a specific bug in the docs, scaffolder, or schema.
