// pbs_parser.js


export function parseTownMap(text) {
  const regions = [];
  let currentRegion = null;
  const lines = text.split(/\r?\n/);

  for (let line of lines) {
    line = line.trim();

    if (!line || line.startsWith('#')) continue;


    const sectionMatch = line.match(/^\[(\d+)\]$/);
    if (sectionMatch) {
      currentRegion = {
        id: parseInt(sectionMatch[1], 10),
        name: "",
        filename: "",
        points: []
      };
      regions.push(currentRegion);
      continue;
    }

    if (!currentRegion) continue;


    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.substring(0, eqIndex).trim();
    const value = line.substring(eqIndex + 1).trim();

    if (key === "Name") {
      currentRegion.name = value;
    } else if (key === "Filename") {
      currentRegion.filename = value;
    } else if (key === "Point") {
      // Point = X,Y,Name,POI,HealingMap,HealingX,HealingY,Switch
      const parts = value.split(',');
      currentRegion.points.push({
        x: parseInt(parts[0] || "0", 10),
        y: parseInt(parts[1] || "0", 10),
        name: parts[2] || "",
        poi: parts[3] || "",
        healingMap: parts[4] || "",
        healingX: parts[5] || "",
        healingY: parts[6] || "",
        switchId: parts[7] || ""
      });
    }
  }
  return regions;
}


export function serializeTownMap(regions) {
  
  let out = "";
  for (const r of regions) {
    out += `[${r.id}]\n`;
    if (r.name) out += `Name = ${r.name}\n`;
    if (r.filename) out += `Filename = ${r.filename}\n`;
    
    for (const p of r.points) {

      const params = [
        p.x, p.y, p.name, p.poi, 
        p.healingMap, p.healingX, p.healingY, p.switchId
      ].join(',');
      

      const cleanParams = params.replace(/,+$/, '');
      out += `Point = ${cleanParams}\n`;
    }
    out += "#-------------------------------\n";
  }
  return out;
}