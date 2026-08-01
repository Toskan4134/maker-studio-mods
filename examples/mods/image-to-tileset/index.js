/**
 * Image to Tileset — import any image, process into a 256px-wide tileset,
 * and create a full tileset entry in Tilesets.rxdata.
 *
 * Output is ALWAYS 8 tiles × 32px = 256px wide (RMXP standard).
 * Source tiles (user-chosen size) are scaled to 32×32px in the output.
 * Vertical strip layout: first 8 source columns, then next 8, etc.
 *
 * Uses ctx.ui.showCustomDialog for the editor's standard dialog shell
 * (overlay, draggable header, close button).
 */

const TILE_PX = 32;
const COLS = 8;
const OUT_W = COLS * TILE_PX; // 256px always

export function activate(ctx) {
  ctx.log.info("Image to Tileset mod activated");

  function tauriInvoke(cmd, args) {
    return window.__TAURI__.core.invoke(cmd, args);
  }

  function injectStyles() {
    if (document.getElementById("its-styles")) return;
    const s = document.createElement("style");
    s.id = "its-styles";
    s.textContent = `
      .its-btn {
        padding:5px 12px;border:1px solid var(--border-color,#555);border-radius:3px;
        background:var(--bg-secondary,#2a2a2a);color:var(--text-primary,#e0e0e0);
        cursor:pointer;font-size:12px;
      }
      .its-btn:hover { background:var(--bg-hover,#3a3a3a); }
      .its-btn-primary {
        background:var(--accent,#4f9cff);color: var(--accent-text, #fff);
        border-color:var(--accent,#4f9cff);font-weight:600;
      }
      .its-btn-primary:hover { opacity:0.9; }
      .its-btn-primary:disabled { opacity:0.4;cursor:not-allowed; }
      .its-input {
        padding:4px 6px;border:1px solid var(--border-color,#555);
        border-radius:3px;background:var(--bg-secondary,#2a2a2a);
        color:var(--text-primary,#e0e0e0);font-size:12px;width:60px;
      }
      .its-input:focus { outline:1px solid var(--accent,#4f9cff); }
      .its-label { min-width:90px;font-weight:600;font-size:12px; }
      .its-row { display:flex;gap:8px;align-items:center; }
      .its-info { font-size:11px;color:var(--text-secondary,#aaa); }
      .its-status { padding:4px 8px;border-radius:3px;font-size:11px; }
      .its-status.ok { background:rgba(80,200,120,0.15);color:#50c878; }
      .its-status.err { background:rgba(220,80,80,0.15);color:#dc5050; }
      .its-checkbox { display:flex;gap:6px;align-items:center;font-size:12px;cursor:pointer; }
      .its-checkbox input { cursor:pointer; }
      .its-section { border-top:1px solid var(--border-color,#333);padding-top:8px; }
      .its-compact-row { display:flex;gap:6px;align-items:center; }
      .its-compact-row label { font-size:11px;min-width:30px; }
    `;
    document.head.appendChild(s);
  }

  function openWindow() {
    injectStyles();

    let sourcePath = null;
    let sourceImg = null;
    let origW = 0, origH = 0;
    let blobUrl = null;

    const dialog = ctx.ui.showCustomDialog({
      title: "Import Image as Tileset",
      width: "460px",
      render(body) {
        // === Browse ===
        const browseRow = document.createElement("div");
        browseRow.className = "its-row";
        const browseBtn = document.createElement("button");
        browseBtn.className = "its-btn";
        browseBtn.textContent = "Browse...";
        const pathLabel = document.createElement("span");
        pathLabel.className = "its-info";
        pathLabel.textContent = "No image selected";
        browseRow.appendChild(browseBtn);
        browseRow.appendChild(pathLabel);
        body.appendChild(browseRow);

        // === Preview container ===
        const previewWrap = document.createElement("div");
        previewWrap.style.cssText =
          "border:1px solid var(--border-color,#555);border-radius:3px;" +
          "overflow:auto;max-height:300px;background:var(--bg-secondary,#1a1a1a);display:none;";
        body.appendChild(previewWrap);

        // === Tileset name ===
        const nameRow = document.createElement("div");
        nameRow.className = "its-row";
        const nameLabel = document.createElement("span");
        nameLabel.className = "its-label";
        nameLabel.textContent = "Tileset Name:";
        const nameInput = document.createElement("input");
        nameInput.className = "its-input";
        nameInput.style.cssText = "flex:1;";
        nameInput.placeholder = "my_tileset";
        nameRow.appendChild(nameLabel);
        nameRow.appendChild(nameInput);
        body.appendChild(nameRow);

        // === Tile size ===
        const tileSizeRow = document.createElement("div");
        tileSizeRow.className = "its-row";
        const tileSizeLabel = document.createElement("span");
        tileSizeLabel.className = "its-label";
        tileSizeLabel.textContent = "Tile Size (px):";
        const tileSizeInput = document.createElement("input");
        tileSizeInput.className = "its-input";
        tileSizeInput.type = "number";
        tileSizeInput.value = "32";
        tileSizeInput.min = "8";
        tileSizeInput.max = "256";
        tileSizeRow.appendChild(tileSizeLabel);
        tileSizeRow.appendChild(tileSizeInput);
        body.appendChild(tileSizeRow);

        // === Adapt to map ===
        const adaptSection = document.createElement("div");
        adaptSection.className = "its-section";
        const adaptCheck = document.createElement("label");
        adaptCheck.className = "its-checkbox";
        const adaptCb = document.createElement("input");
        adaptCb.type = "checkbox";
        adaptCheck.appendChild(adaptCb);
        adaptCheck.appendChild(document.createTextNode("Adapt to map size"));
        adaptSection.appendChild(adaptCheck);

        const mapSizeRow = document.createElement("div");
        mapSizeRow.className = "its-compact-row";
        mapSizeRow.style.cssText = "margin-top:6px;display:none;";
        const mwLabel = document.createElement("label");
        mwLabel.textContent = "Width:";
        const mwInput = document.createElement("input");
        mwInput.className = "its-input";
        mwInput.type = "number"; mwInput.value = "20"; mwInput.min = "1";
        const mhLabel = document.createElement("label");
        mhLabel.textContent = "Height:";
        mhLabel.style.marginLeft = "8px";
        const mhInput = document.createElement("input");
        mhInput.className = "its-input";
        mhInput.type = "number"; mhInput.value = "15"; mhInput.min = "1";
        mapSizeRow.appendChild(mwLabel);
        mapSizeRow.appendChild(mwInput);
        mapSizeRow.appendChild(mhLabel);
        mapSizeRow.appendChild(mhInput);
        adaptSection.appendChild(mapSizeRow);
        body.appendChild(adaptSection);

        adaptCb.addEventListener("change", () => {
          mapSizeRow.style.display = adaptCb.checked ? "flex" : "none";
          if (sourceImg) drawPreview();
        });

        // === Info ===
        const infoDiv = document.createElement("div");
        infoDiv.className = "its-info";
        infoDiv.textContent = "Select an image to see preview and dimensions.";
        body.appendChild(infoDiv);

        // === Create button ===
        const createBtn = document.createElement("button");
        createBtn.className = "its-btn its-btn-primary";
        createBtn.textContent = "Create Tileset";
        createBtn.disabled = true;
        body.appendChild(createBtn);

        // === Status ===
        const statusDiv = document.createElement("div");
        statusDiv.className = "its-status";
        statusDiv.style.display = "none";
        body.appendChild(statusDiv);

        // --- Browse handler ---
        browseBtn.addEventListener("click", async () => {
          try {
            const path = await tauriInvoke("plugin:dialog|open", {
              options: {
                title: "Select Image for Tileset",
                filters: [{ name: "Images", extensions: ["png", "bmp", "gif", "jpg", "jpeg"] }],
                multiple: false,
                directory: false,
              },
            });
            if (!path) return;
            sourcePath = path;
            const fileName = path.split(/[/\\]/).pop() || "tileset";
            const stem = fileName.replace(/\.[^.]+$/, "");
            pathLabel.textContent = fileName;
            nameInput.value = stem.replace(/[^a-zA-Z0-9_-]/g, "_");
            await loadPreview(path);
          } catch (err) {
            showStatus("Failed to open dialog: " + err, true);
          }
        });

        tileSizeInput.addEventListener("input", () => { if (sourceImg) drawPreview(); });
        mwInput.addEventListener("input", () => { if (sourceImg && adaptCb.checked) drawPreview(); });
        mhInput.addEventListener("input", () => { if (sourceImg && adaptCb.checked) drawPreview(); });

        // --- Create handler ---
        createBtn.addEventListener("click", async () => {
          const tilesetName = nameInput.value.trim();
          const gameRoot = ctx.editor.gameRoot();
          const out = getOutput();

          if (!sourcePath || !sourceImg || !out) { showStatus("Select an image first.", true); return; }
          if (!gameRoot) { showStatus("No project loaded.", true); return; }
          if (!tilesetName || !/^[a-zA-Z0-9_-]+$/.test(tilesetName)) {
            showStatus("Name: letters, digits, dashes, underscores.", true);
            return;
          }

          try {
            const existing = await tauriInvoke("list_tileset_files", { gameRoot });
            if (existing && existing.includes(tilesetName)) {
              showStatus(`"${tilesetName}" already exists. Choose a different name.`, true);
              return;
            }
          } catch { /* ignore */ }

          createBtn.disabled = true;
          createBtn.textContent = "Processing...";
          showStatus("Rearranging image into 8-tile strips (256px wide)...", false);

          try {
            const processedCanvas = document.createElement("canvas");
            processedCanvas.width = out.outW;
            processedCanvas.height = out.outH;
            const pc = processedCanvas.getContext("2d");
            drawRearranged(pc, sourceImg, out);

            const blob = await new Promise(resolve => processedCanvas.toBlob(resolve, "image/png"));
            const arrayBuf = await blob.arrayBuffer();
            const bytes = Array.from(new Uint8Array(arrayBuf));

            const destPath = gameRoot.replace(/[/\\]+$/, "") + "/Graphics/Tilesets/" + tilesetName + ".png";
            await tauriInvoke("write_binary_file", { path: destPath, data: bytes });

            showStatus("Image saved. Creating tileset entry...", false);

            const newId = await tauriInvoke("create_tileset", { gameRoot, name: tilesetName, tilesetName });

            await ctx.editor.reloadTilesets();

            showStatus(
              `Tileset #${newId} "${tilesetName}" created! ${out.outW}×${out.outH}px, ${out.totalTiles} tiles.`,
              false
            );
            ctx.ui.showToast({ message: `Tileset "${tilesetName}" created!`, level: "info" });
            createBtn.textContent = "Done";
          } catch (err) {
            showStatus("Error: " + err, true);
            createBtn.disabled = false;
            createBtn.textContent = "Create Tileset";
          }
        });

        // --- Helpers (closured over dialog-scoped vars) ---

        async function loadPreview(path) {
          previewWrap.style.display = "block";
          previewWrap.innerHTML = '<div style="padding:12px;color:var(--text-secondary,#aaa);">Loading...</div>';
          try {
            const bytes = await tauriInvoke("read_binary_file", { path });
            if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
            const blob = new Blob([new Uint8Array(bytes)], { type: "image/png" });
            blobUrl = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
              sourceImg = img;
              origW = img.width;
              origH = img.height;
              drawPreview();
            };
            img.onerror = () => {
              previewWrap.innerHTML = '<div style="padding:12px;color:#dc5050;">Invalid image.</div>';
            };
            img.src = blobUrl;
          } catch (err) {
            previewWrap.innerHTML = '<div style="padding:12px;color:#dc5050;">' + err + '</div>';
          }
        }

        function getOutput() {
          if (!sourceImg) return null;
          let tileSize = parseInt(tileSizeInput.value) || 32;
          tileSize = Math.max(8, Math.min(256, tileSize));

          if (adaptCb.checked) {
            const mapW = parseInt(mwInput.value) || 20;
            const mapH = parseInt(mhInput.value) || 15;
            tileSize = Math.max(Math.ceil(origW / mapW), Math.ceil(origH / mapH));
            tileSize = Math.max(8, Math.min(256, tileSize));
            tileSizeInput.value = tileSize;
          }

          const srcTilesX = Math.ceil(origW / tileSize);
          const srcTilesY = Math.ceil(origH / tileSize);
          const numStrips = Math.ceil(srcTilesX / COLS);
          const outRows = numStrips * srcTilesY;
          const outH = outRows * TILE_PX;
          const totalTiles = COLS * outRows;

          return { tileSize, srcTilesX, srcTilesY, numStrips, outRows, outW: OUT_W, outH, totalTiles };
        }

        function drawPreview() {
          if (!sourceImg) return;
          const out = getOutput();
          if (!out) return;

          const containerWidth = previewWrap.clientWidth - 2;
          if (containerWidth <= 0) return;

          const canvas = document.createElement("canvas");
          canvas.width = out.outW;
          canvas.height = out.outH;
          canvas.style.width = containerWidth + "px";
          canvas.style.height = "auto";
          canvas.style.display = "block";

          const c = canvas.getContext("2d");
          drawRearranged(c, sourceImg, out);

          // Grid overlay
          c.strokeStyle = "rgba(255,255,255,0.2)";
          c.lineWidth = 1;
          for (let x = TILE_PX; x < out.outW; x += TILE_PX) {
            c.beginPath(); c.moveTo(x, 0); c.lineTo(x, out.outH); c.stroke();
          }
          for (let y = TILE_PX; y < out.outH; y += TILE_PX) {
            c.beginPath(); c.moveTo(0, y); c.lineTo(out.outW, y); c.stroke();
          }

          // Strip separators
          c.strokeStyle = "rgba(79,156,255,0.5)";
          c.lineWidth = 2;
          for (let s = 1; s < out.numStrips; s++) {
            const y = s * out.srcTilesY * TILE_PX;
            c.beginPath(); c.moveTo(0, y); c.lineTo(out.outW, y); c.stroke();
          }

          previewWrap.innerHTML = "";
          previewWrap.appendChild(canvas);
          updateInfo();
        }

        function updateInfo() {
          const out = getOutput();
          if (!out) {
            infoDiv.textContent = "Select an image to see preview and dimensions.";
            createBtn.disabled = true;
            return;
          }
          infoDiv.textContent =
            `Source: ${origW}×${origH}px → ${out.srcTilesX}×${out.srcTilesY} tiles @ ${out.tileSize}px | ` +
            `Output: ${out.outW}×${out.outH}px, ${out.totalTiles} tiles (${out.numStrips} strip${out.numStrips > 1 ? "s" : ""})`;
          createBtn.disabled = false;
        }

        function showStatus(msg, isErr) {
          statusDiv.style.display = "block";
          statusDiv.textContent = msg;
          statusDiv.className = "its-status " + (isErr ? "err" : "ok");
        }

        // Cleanup: revoke blob URL on dialog close
        return () => {
          if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
          sourceImg = null;
        };
      },
    });
  }

  // Shared draw helper (not closured, pure)
  function drawRearranged(c, img, out) {
    for (let strip = 0; strip < out.numStrips; strip++) {
      const srcStartCol = strip * COLS;
      const srcEndCol = Math.min(srcStartCol + COLS, out.srcTilesX);
      for (let sy = 0; sy < out.srcTilesY; sy++) {
        for (let col = 0; col < srcEndCol - srcStartCol; col++) {
          const dstIdx = strip * COLS * out.srcTilesY + sy * COLS + col;
          const dstCol = dstIdx % COLS;
          const dstRow = Math.floor(dstIdx / COLS);
          c.drawImage(
            img,
            (srcStartCol + col) * out.tileSize, sy * out.tileSize,
            out.tileSize, out.tileSize,
            dstCol * TILE_PX, dstRow * TILE_PX,
            TILE_PX, TILE_PX
          );
        }
      }
    }
  }

  ctx.menu.registerMenuItem({
    menu: "Tools",
    label: "Create Tileset from Image...",
    handler: () => openWindow(),
  });
}

export function deactivate() {}
