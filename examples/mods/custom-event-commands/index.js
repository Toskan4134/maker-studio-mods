/**
 * Custom Event Commands — registers new RMXP event commands from a mod.
 *
 * Demonstrates: ctx.events.registerCommand.
 *
 * Each registered command appears on a dedicated "M1" page in the event-command
 * picker. The editor builds its parameter dialog from the declarative `fields`
 * schema using the same native controls (the coordinate picker, number box,
 * checkbox…) as the built-in commands.
 *
 * Filling the form generates a plain RMXP **Script command** (code 355) whose
 * text is `script(params)` — that literal Ruby runs in-game as-is, with no
 * runtime dispatcher. `parse` recovers the params from a stored script so the
 * command keeps its name in the list and reopens its custom form.
 */

export function activate(ctx) {
  ctx.log.info("Custom Event Commands mod activated");

  // Camera Scroll To → emits the literal script: pbCameraScrollTo(x, y[, speed]).
  // The target tile uses a `coordinate` field whose source can be a map pick,
  // typed constants, or a pair of game variables. Speed defaults to nil — the
  // third argument is only emitted when "Set speed" is checked, and the speed
  // input is hidden until then.
  ctx.events.registerCommand({
    id: "cameraScrollTo",
    name: "Camera Scroll To",
    fields: [
      { type: "coordinate", key: "target", label: "Target tile", showMapSelector: false },
      { type: "checkbox", key: "useSpeed", label: "Set speed (otherwise nil)" },
      { type: "number", key: "speed", label: "Speed", min: 1, default: 4, hidden: (p) => !p.useSpeed },
    ],
    script: (p) => {
      const t = p.target || {};
      const cx = t.mode === "variable" ? `$game_variables[${t.varX | 0}]` : (t.x | 0);
      const cy = t.mode === "variable" ? `$game_variables[${t.varY | 0}]` : (t.y | 0);
      const args = [cx, cy];
      if (p.useSpeed) args.push(p.speed | 0);
      return `pbCameraScrollTo(${args.join(", ")})`;
    },
    parse: (text) => {
      const AXIS = String.raw`(\$game_variables\[\d+\]|-?\d+)`;
      const m = new RegExp(`^pbCameraScrollTo\\(\\s*${AXIS}\\s*,\\s*${AXIS}\\s*(?:,\\s*(\\d+)\\s*)?\\)$`).exec(text.trim());
      if (!m) return null;
      const axis = (s) => {
        const v = /^\$game_variables\[(\d+)\]$/.exec(s);
        return v ? { isVar: true, id: parseInt(v[1], 10) } : { isVar: false, n: parseInt(s, 10) };
      };
      const ax = axis(m[1]);
      const ay = axis(m[2]);
      const isVar = ax.isVar || ay.isVar;
      return {
        target: {
          mode: isVar ? "variable" : "direct",
          mapId: 0,
          x: ax.isVar ? 0 : ax.n,
          y: ay.isVar ? 0 : ay.n,
          varMapId: 1,
          varX: ax.isVar ? ax.id : 1,
          varY: ay.isVar ? ay.id : 1,
        },
        useSpeed: m[3] != null,
        speed: m[3] != null ? parseInt(m[3], 10) : 4,
      };
    },
    summary: (p) => {
      const t = p.target || {};
      const coord = t.mode === "variable" ? `[v${t.varX}], [v${t.varY}]` : `${t.x ?? 0}, ${t.y ?? 0}`;
      return `(${coord})${p.useSpeed ? `, speed ${p.speed}` : ""}`;
    },
  });

  // No fields → the editor shows the default freeform script textarea. With no
  // `parse`, the inserted command is just an ordinary Script command afterwards.
  ctx.events.registerCommand({
    id: "rawSnippet",
    name: "Raw Snippet",
    summary: () => "custom script",
  });
}

export function deactivate() {
  // registerCommand returns a Disposable tracked by the mod's bag; auto-cleaned.
}
