// editor_ui.js
import { parseTownMap, serializeTownMap } from './pbs_parser.js';

export async function mountTownMapEditor(ctx, host) {
  const GRID_SIZE = 16;
  
  let regions = [];
  let activeRegion = null;
  let selectedPoint = null;
  let blobUrlCache = null;

  let zoom = 1;
  let imgWidth = 0;
  let imgHeight = 0;
  let isPanning = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let isDraggingPoint = false;

  host.innerHTML = `
    <div style="display: flex; flex-direction: column; height: 100%; background: var(--bg-primary); color: var(--text-primary); font-family: inherit;">
      
      <!-- Toolbar -->
      <div style="padding: 8px; background: var(--bg-tertiary); border-bottom: 1px solid var(--border); display: flex; gap: 8px; align-items: center; z-index: 100;">
        <select id="tme-region-select" style="background: var(--input-bg); color: var(--text-primary); border: 1px solid var(--border); padding: 4px; border-radius: 4px; min-width: 150px; outline: none;"></select>
        <button id="tme-btn-save" style="background: var(--accent); color: var(--accent-text); border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">Save PBS</button>
        <div style="margin-left: auto; font-size: 11px; color: var(--text-secondary);">
          <span id="tme-zoom-level">Zoom: 100%</span>
        </div>
      </div>

      <!-- Main Area -->
      <div style="display: flex; flex: 1; overflow: hidden; position: relative;">
        
        <div id="tme-viewport" style="flex: 2; overflow: auto; background: var(--canvas-bg); position: relative; cursor: crosshair;">
          
          <!-- SPACER: Fuerza a que aparezcan las barras de scroll al hacer zoom -->
          <div id="tme-layout-spacer" style="position: absolute; top: 0; left: 0; pointer-events: none;"></div>

          <!-- CONTENEDOR ESCALADO: Todo aquí adentro se dibuja a escala 1:1 y el CSS hace el zoom -->
          <div id="tme-map-container" style="position: absolute; top: 0; left: 0; user-select: none; transform-origin: 0 0;">
            <img id="tme-map-img" style="display: block; width: 100%; height: 100%;" alt="Town Map" draggable="false" />
            
            <div id="tme-points-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
              background-image: linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px);
              background-size: 16px 16px;">
            </div>
          </div>

        </div>

        <!-- Tooltip-->
        <div id="tme-tooltip" style="display: none; position: absolute; background: rgba(0,0,0,0.85); 
        color: #fff; padding: 6px 10px; border-radius: 4px; font-size: 11px; pointer-events: none; z-index: 1000; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.5); white-space: nowrap;">
        </div>

        <!-- Properties Sidebar -->
        <div style="flex: 1; min-width: 250px; max-width: 300px; border-left: 1px solid var(--border); padding: 16px; background: var(--bg-secondary); overflow-y: auto; z-index: 100;">
          <div id="tme-properties"></div>
        </div>

      </div>
    </div>
  `;

  const viewport = host.querySelector('#tme-viewport');
  const layoutSpacer = host.querySelector('#tme-layout-spacer');
  const mapContainer = host.querySelector('#tme-map-container');
  const pointsLayer = host.querySelector('#tme-points-layer');
  const propertiesPanel = host.querySelector('#tme-properties');
  const tooltip = host.querySelector('#tme-tooltip');
  const imgElement = host.querySelector('#tme-map-img');

  try {
    const pbsText = await ctx.fs.readProjectFile("PBS/town_map.txt");
    regions = parseTownMap(pbsText);
    
    const select = host.querySelector('#tme-region-select');
    const updateSelect = () => {
      select.innerHTML = '';
      regions.forEach((r, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `[${r.id}] ${r.name || 'Unnamed'}`;
        select.appendChild(option);
      });
      if (activeRegion) select.value = regions.indexOf(activeRegion);
    };
    
    updateSelect();
    host.updateRegionSelect = updateSelect;

    select.addEventListener('change', (e) => {
      activeRegion = regions[e.target.value];
      selectedPoint = null;
      zoom = 1;
      loadRegionImage(activeRegion);
    });
    
    if (regions.length > 0) {
      activeRegion = regions[0];
      loadRegionImage(activeRegion);
    }
  } catch (err) {
    ctx.ui.showToast({ message: "PBS/town_map.txt not found", level: "error" });
  }

  imgElement.onload = () => {
    imgWidth = imgElement.naturalWidth;
    imgHeight = imgElement.naturalHeight;
    updateZoom();
    renderPoints();
  };

  async function loadRegionImage(region) {
    if (!region || !region.filename) return;
    const gameRoot = ctx.editor.gameRoot();
    if (!gameRoot) return;

    try {
      const bytes = await window.__TAURI__.core.invoke("read_binary_file", { 
        path: `${gameRoot}/Graphics/UI/Town Map/${region.filename}` 
      });
      
      const blob = new Blob([new Uint8Array(bytes)], { type: 'image/png' });
      if (blobUrlCache) URL.revokeObjectURL(blobUrlCache);
      blobUrlCache = URL.createObjectURL(blob);
      
      imgElement.src = blobUrlCache;
      renderSidebar();
    } catch (err) {
      ctx.ui.showToast({ message: `Error loading image: ${region.filename}`, level: "error" });
    }
  }


  function updateZoom() {
    host.querySelector('#tme-zoom-level').textContent = `Zoom: ${Math.round(zoom * 100)}%`;
    

    layoutSpacer.style.width = `${imgWidth * zoom}px`;
    layoutSpacer.style.height = `${imgHeight * zoom}px`;
    

    mapContainer.style.width = `${imgWidth}px`;
    mapContainer.style.height = `${imgHeight}px`;
    mapContainer.style.transform = `scale(${zoom})`;
  }

  viewport.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault(); 
      
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
      const oldZoom = zoom;
      zoom = Math.max(0.5, Math.min(4, zoom + zoomDelta));

      const rect = viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const scrollX = viewport.scrollLeft;
      const scrollY = viewport.scrollTop;
      
      updateZoom();
      
      viewport.scrollLeft = ((scrollX + mouseX) * (zoom / oldZoom)) - mouseX;
      viewport.scrollTop = ((scrollY + mouseY) * (zoom / oldZoom)) - mouseY;
    }
  });

  function renderPoints() {
    pointsLayer.innerHTML = '';
    if (!activeRegion) return;

    activeRegion.points.forEach(pt => {
      const isSelected = (selectedPoint === pt);
      const div = document.createElement('div');
      
      div.style.position = 'absolute';
      
      div.style.left = `${pt.x * GRID_SIZE}px`;
      div.style.top = `${pt.y * GRID_SIZE}px`;
      div.style.width = `${GRID_SIZE}px`;
      div.style.height = `${GRID_SIZE}px`;
      div.style.boxSizing = 'border-box';
      div.style.pointerEvents = 'none';
      
      if (isSelected) {
        div.style.border = '1px solid var(--accent)';
        div.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        div.style.boxShadow = '0 0 8px var(--accent)';
        div.style.zIndex = '10';
      } else {
        div.style.border = '1px solid rgba(255, 255, 255, 0.8)';
        div.style.backgroundColor = 'rgba(68, 249, 252, 0.14)';
        div.style.zIndex = '1';
      }

      pointsLayer.appendChild(div);
    });
  }

  function renderSidebar() {
    if (!activeRegion) return;

    let html = `
      <h3 style="margin-top: 0; margin-bottom: 12px; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">Current Region</h3>
      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border);">
        <div>
          <label style="font-size: 11px; font-weight: bold; color: var(--text-secondary);">REGION NAME</label>
          <input type="text" id="reg-name" value="${activeRegion.name}" style="width: 100%; box-sizing: border-box; background: var(--input-bg); color: var(--text-primary); border: 1px solid var(--border); padding: 6px; border-radius: 4px; margin-top: 4px;" />
        </div>
        <div>
          <label style="font-size: 11px; font-weight: bold; color: var(--text-secondary);">BACKGROUND IMAGE</label>
          <div style="display: flex; gap: 4px; margin-top: 4px;">
            <input type="text" disabled value="${activeRegion.filename}" style="flex: 1; min-width: 0; background: var(--bg-tertiary); color: var(--text-tertiary); border: 1px solid var(--border); padding: 6px; border-radius: 4px;" />
            <button id="reg-pick-graphic" style="background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); border-radius: 4px; padding: 0 8px; cursor: pointer;" title="Change Image">⟲</button>
          </div>
        </div>
      </div>
      
      <h3 style="margin-top: 0; margin-bottom: 12px; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">Point Properties</h3>
    `;

    if (!selectedPoint) {
      html += '<p style="color: var(--text-tertiary); font-size: 13px; text-align: center; margin-top: 20px;">Select a point with a <b>click</b>.<br><br><b>Double-click</b> on an empty space to create a new one.<br><br><b>Drag</b> a point to move it.</p>';
      propertiesPanel.innerHTML = html;
    } else {
      const hasFly = selectedPoint.healingMap !== "" && selectedPoint.healingMap !== undefined;
      const hasSwitch = selectedPoint.switchId !== "" && selectedPoint.switchId !== undefined;

      let flyDisplayName = "";
      if (hasFly) {
        const mapId = parseInt(selectedPoint.healingMap, 10);
        const maps = ctx.projectData.maps(); 
        const mapData = maps.find(m => m.id === mapId);
        const mapName = mapData ? mapData.name : "Unknown Map";
        flyDisplayName = `[${mapId}] ${mapName} (${selectedPoint.healingX}, ${selectedPoint.healingY})`;
      }

      let switchDisplayName = "";
      if (hasSwitch) {
        const swId = parseInt(selectedPoint.switchId, 10);
        const switchNames = ctx.projectData.switchNames();
        const swName = switchNames[swId] || "Unnamed";
        switchDisplayName = `[${swId}] ${swName}`;
      }

      html += `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="font-size: 11px; font-weight: bold; color: var(--text-secondary);">COORDINATES (X, Y)</label>
            <input type="text" id="pt-coords" disabled value="${selectedPoint.x}, ${selectedPoint.y}" style="width: 100%; box-sizing: border-box;
              background: var(--bg-tertiary); color: var(--text-tertiary); border: 1px solid var(--border); padding: 6px; border-radius: 4px; margin-top: 4px;" 
            />
          </div>
          <div>
            <label style="font-size: 11px; font-weight: bold; color: var(--text-secondary);">PLACE NAME</label>
            <input type="text" id="pt-name" value="${selectedPoint.name}" placeholder="" style="width: 100%; box-sizing: border-box; background: var(--input-bg); color: var(--text-primary); border: 1px solid var(--border); padding: 6px; border-radius: 4px; margin-top: 4px;" />
          </div>
          <div>
            <label style="font-size: 11px; font-weight: bold; color: var(--text-secondary);">POINT OF INTEREST (POI)</label>
            <input type="text" id="pt-poi" value="${selectedPoint.poi}" placeholder="" style="width: 100%; box-sizing: border-box; background: var(--input-bg); color: var(--text-primary); border: 1px solid var(--border); padding: 6px; border-radius: 4px; margin-top: 4px;" />
          </div>
          
          <!-- FLY DESTINATION SECTION -->
          <div>
            <label style="font-size: 11px; font-weight: bold; color: var(--text-secondary);">FLY DESTINATION</label>
            ${hasFly ? `
              <div style="display: flex; gap: 4px; margin-top: 4px;">
                <button id="pt-pick-coord" style="flex: 1; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); padding: 6px; border-radius: 4px; cursor: pointer; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${flyDisplayName}">
                  ${flyDisplayName}
                </button>
                 <button id="pt-clear-coord" style="background: var(--danger); color: white; border: none; border-radius: 4px; padding: 0 12px; cursor: pointer;" title="Remove Destination">✖</button>
              </div>
            ` : `
              <button id="pt-pick-coord" style="width: 100%; margin-top: 4px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); padding: 6px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: background 0.2s;">
                 Assign fly point
              </button>
            `}
          </div>

          <!-- SWITCH SECTION -->
          <div>
            <label style="font-size: 11px; font-weight: bold; color: var(--text-secondary);">SWITCH</label>
            ${hasSwitch ? `
              <div style="display: flex; gap: 4px; margin-top: 4px;">
                <button id="pt-pick-switch" style="flex: 1; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); padding: 6px; border-radius: 4px; cursor: pointer; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${switchDisplayName}">
                  ${switchDisplayName}
                </button>
                 <button id="pt-clear-switch" style="background: var(--danger); color: white; border: none; border-radius: 4px; padding: 0 12px; cursor: pointer;" title="Remove Switch">✖</button>
              </div>
            ` : `
              <button id="pt-pick-switch" style="width: 100%; margin-top: 4px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); padding: 6px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: background 0.2s;">
                 Assign Switch
              </button>
            `}
          </div>

          <button id="pt-delete" style="margin-top: 16px; background: transparent; color: var(--danger); border: 1px solid var(--danger); padding: 8px; border-radius: 4px; cursor: pointer; font-weight: bold;">
            Delete Point
          </button>
        </div>
      `;
      propertiesPanel.innerHTML = html;
    }

    // --- EVENT LISTENERS SIDEBAR ---

    host.querySelector('#reg-name').addEventListener('input', (e) => {
      activeRegion.name = e.target.value;
      host.updateRegionSelect();
    });

    host.querySelector('#reg-pick-graphic').addEventListener('click', async () => {
      const img = await ctx.selectors.pickGraphic("UI/Town Map", { title: "Choose Region Background" });
      if (img) {
        activeRegion.filename = img.name + ".png";
        loadRegionImage(activeRegion);
      }
    });

    if (selectedPoint) {
      const bindInput = (id, key) => {
        const el = host.querySelector(`#${id}`);
        if (el) el.addEventListener('input', (e) => selectedPoint[key] = e.target.value);
      };
      
      bindInput('pt-name', 'name');
      bindInput('pt-poi', 'poi');
      
      host.querySelector('#pt-pick-coord')?.addEventListener('click', async () => {
        const mId = parseInt(selectedPoint.healingMap, 10);
        const mX = parseInt(selectedPoint.healingX, 10);
        const mY = parseInt(selectedPoint.healingY, 10);
        const initialOpts = (!isNaN(mId) && !isNaN(mX) && !isNaN(mY)) ? { mapId: mId, x: mX, y: mY } : undefined;

        const coord = await ctx.selectors.pickCoordinate({ initial: initialOpts, title: "Fly Destination" });
        if (coord) {
          selectedPoint.healingMap = coord.mapId.toString();
          selectedPoint.healingX = coord.x.toString();
          selectedPoint.healingY = coord.y.toString();
          renderSidebar();
        }
      });

      host.querySelector('#pt-clear-coord')?.addEventListener('click', () => {
        selectedPoint.healingMap = "";
        selectedPoint.healingX = "";
        selectedPoint.healingY = "";
        renderSidebar(); 
      });

      host.querySelector('#pt-pick-switch')?.addEventListener('click', async () => {
        const currentId = parseInt(selectedPoint.switchId, 10);
        const sw = await ctx.selectors.pickSwitch({ value: isNaN(currentId) ? 0 : currentId });
        if (sw) {
          selectedPoint.switchId = sw.id.toString();
          renderSidebar();
        }
      });

      host.querySelector('#pt-clear-switch')?.addEventListener('click', () => {
        selectedPoint.switchId = "";
        renderSidebar();
      });

      host.querySelector('#pt-delete').addEventListener('click', () => {
        activeRegion.points = activeRegion.points.filter(p => p !== selectedPoint);
        selectedPoint = null;
        renderPoints();
        renderSidebar();
      });
    }
  }

  function getGridCoords(e) {
    const rect = mapContainer.getBoundingClientRect(); 
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    return {
      x: Math.floor(clickX / (GRID_SIZE * zoom)),
      y: Math.floor(clickY / (GRID_SIZE * zoom))
    };
  }

  viewport.addEventListener('mousedown', (e) => {
    if (!activeRegion) return;

    if (e.button === 1 || e.altKey) {
      isPanning = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      viewport.style.cursor = 'grabbing';
      return;
    }

    if (e.button === 0) {
      const grid = getGridCoords(e);
      const existingPoint = activeRegion.points.find(p => p.x === grid.x && p.y === grid.y);

      if (existingPoint) {
        selectedPoint = existingPoint;
        isDraggingPoint = true;
      } else {
        selectedPoint = null;
      }
      renderPoints();
      renderSidebar();
    }
  });

  const onMouseMove = (e) => {
    if (isPanning) {
      viewport.scrollLeft -= e.clientX - lastMouseX;
      viewport.scrollTop -= e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      return;
    }

    if (isDraggingPoint && selectedPoint) {
      const grid = getGridCoords(e);
      const collision = activeRegion.points.find(p => p !== selectedPoint && p.x === grid.x && p.y === grid.y);
      
      if (!collision && (selectedPoint.x !== grid.x || selectedPoint.y !== grid.y)) {
        selectedPoint.x = grid.x;
        selectedPoint.y = grid.y;
        renderPoints();
        const coordInput = host.querySelector('#pt-coords');
        if (coordInput) coordInput.value = `${grid.x}, ${grid.y}`;
      }
    }

    // Tooltips
    if (!isDraggingPoint && !isPanning && activeRegion) {
      const rect = viewport.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const grid = getGridCoords(e);
        const hoverPt = activeRegion.points.find(p => p.x === grid.x && p.y === grid.y);
        
        if (hoverPt) {
          const parentRect = tooltip.parentElement.getBoundingClientRect();
          tooltip.style.display = 'block';
          tooltip.style.left = (e.clientX - parentRect.left + 15) + 'px';
          tooltip.style.top = (e.clientY - parentRect.top + 15) + 'px';
          tooltip.innerHTML = `<strong style="color: var(--accent);">${hoverPt.name || 'Unnamed'}</strong>${hoverPt.poi ? `<br/>${hoverPt.poi}` : ''}`;
        } else {
          tooltip.style.display = 'none';
        }
      } else {
        tooltip.style.display = 'none';
      }
    }
  };

  const onMouseUp = () => {
    isPanning = false;
    isDraggingPoint = false;
    viewport.style.cursor = 'crosshair';
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  viewport.addEventListener('dblclick', (e) => {
    if (!activeRegion || e.button !== 0 || e.altKey) return;
    const grid = getGridCoords(e);
    const existingPoint = activeRegion.points.find(p => p.x === grid.x && p.y === grid.y);

    if (!existingPoint) {
      const newPoint = { x: grid.x, y: grid.y, name: "", poi: "", healingMap: "", healingX: "", healingY: "", switchId: "" };
      activeRegion.points.push(newPoint);
      selectedPoint = newPoint;
      
      renderPoints();
      renderSidebar();
      setTimeout(() => host.querySelector('#pt-name')?.focus(), 50);
    }
  });

  host.querySelector('#tme-btn-save').addEventListener('click', async () => {
    try {
      const newPbs = serializeTownMap(regions);
      await ctx.fs.writeProjectFile("PBS/town_map.txt", newPbs);
      ctx.ui.showToast({ message: "town_map.txt saved successfully.", level: "info" });
    } catch (err) {
      ctx.log.error(err);
      ctx.ui.showToast({ message: "Error saving town_map.txt", level: "error" });
    }
  });

  return () => {
    if (blobUrlCache) URL.revokeObjectURL(blobUrlCache);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };
}
