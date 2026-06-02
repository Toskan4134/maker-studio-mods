# Town Map Editor

Editor for town_map.txt. Inspect and edit fly points and locations directly in MakerStudio.

## Try it locally

1. Copy this folder into your global mods dir:
   - macOS: `~/Library/Application Support/maker-studio/Mods/Town-map-editor/`
   - Linux: `~/.local/share/maker-studio/Mods/Town-map-editor/`
   Or into a project's mods dir at `<gameRoot>/Plugins/MakerStudio/003_Editor/Mods/Town-map-editor/`.
2. Restart the editor (or **Mods → Mod Manager → Rescan**).
3. Open any project — toast appears, menu item shows up under **Mods**.

## Publish it

1. Push this folder to a public GitHub repo (one repo per mod).
2. Tag `v1.0.0` (must match `manifest.json#version`).
3. Build the release zip + compute its SHA-256:
   ```bash
   zip -r com.Miolthor.Town-map-editor-1.0.0.zip manifest.json index.js README.md
   sha256sum com.Miolthor.Town-map-editor-1.0.0.zip
   ```
   (Or drop the registry's `templates/publish.yml` workflow into `.github/workflows/` —
   it builds and hashes on every tag push.)
4. Create a GitHub Release for the tag, attach the zip.
5. Open a PR to the [registry](https://github.com/Toskan4134/maker-studio-mods)
   adding your entry to `index.json` with `version`, `assetName`, and `sha256`.
   See `../PUBLISHING.md` for the full walkthrough.
