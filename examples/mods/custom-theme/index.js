/**
 * One Dark Pro — VS Code's theme as a Maker Studio editor theme.
 *
 * ONE entry in View > Theme with two looks: it declares `dark` and `light`
 * variants, so it follows the editor's Dark Mode toggle instead of pinning the
 * editor to one scheme. Turn Dark Mode off and One Dark Pro becomes One Light,
 * the Atom palette it was derived from.
 *
 * The whole mod is a single `ctx.theme.register` call: no <style> tag to
 * inject, no `!important`, no MutationObserver to keep it winning the cascade.
 */

const DARK = {
  bg: "#282c34",        // editor background
  bgDeep: "#21252b",    // sidebar / activity bar
  bgRaised: "#2c313a",  // hover
  bgSelect: "#3e4451",  // selection
  border: "#181a1f",
  fg: "#abb2bf",        // default foreground
  fgBright: "#d7dae0",
  fgMuted: "#5c6370",   // comments
  blue: "#61afef",
  blueLight: "#7cc0f5",
  green: "#98c379",
  red: "#e06c75",
  yellow: "#e5c07b",
  orange: "#d19a66",
  purple: "#c678dd",
  cyan: "#56b6c2",
  input: "#21252b",
  canvas: "#1b1f27",
  checkerA: "#2b3038",
  checkerB: "#343a44",
  accentMuted: "rgba(97, 175, 239, 0.16)",
  accentText: "#282c34",
  shadow: "rgba(0, 0, 0, 0.45)",
  successBg: "#3f7f4f",
  successBgHover: "#4b9760",
  conditional: "rgba(171, 178, 191, 0.75)",
  enemy: "#bf6a58",
  moveSub: "#3f8b94",
};

// Atom's One Light — the palette One Dark was derived from. Same hues at a
// lightness that survives a white background.
const LIGHT = {
  bg: "#fafafa",
  bgDeep: "#eaeaeb",
  bgRaised: "#f0f0f1",
  bgSelect: "#dbdbdc",
  border: "#c9c9ca",
  fg: "#494b53",
  fgBright: "#383a42",
  fgMuted: "#a0a1a7",
  blue: "#4078f2",
  blueLight: "#5a8bf5",
  green: "#50a14f",
  red: "#e45649",
  yellow: "#c18401",
  orange: "#986801",
  purple: "#a626a4",
  cyan: "#0184bc",
  input: "#ffffff",
  canvas: "#dcdcde",
  checkerA: "#d6d6d8",
  checkerB: "#e9e9eb",
  accentMuted: "rgba(64, 120, 242, 0.12)",
  accentText: "#ffffff",
  shadow: "rgba(0, 0, 0, 0.14)",
  successBg: "#3f8b48",
  successBgHover: "#4a9c54",
  conditional: "rgba(56, 58, 66, 0.62)",
  enemy: "#a04a2f",
  moveSub: "#0f6b74",
};

/**
 * A light theme is not a dark theme with the colours flipped — but it is the
 * same set of ROLES, so the roles live here once and each palette fills them.
 */
function vars(p) {
  return {
    "--bg-primary": p.bg,
    "--bg-secondary": p.bgDeep,
    "--bg-tertiary": p.bgRaised,
    "--bg-hover": p.bgSelect,
    "--input-bg": p.input,
    "--border": p.border,
    "--canvas-bg": p.canvas,

    "--text-primary": p.fgBright,
    "--text-secondary": p.fg,
    "--text-tertiary": p.fgMuted,

    "--accent": p.blue,
    "--accent-hover": p.blueLight,
    "--accent-muted": p.accentMuted,
    "--accent-text": p.accentText,

    "--danger": p.red,
    "--warning": p.yellow,
    "--highlight": p.orange,
    "--success": p.successBg,
    "--success-hover": p.successBgHover,
    "--success-border": p.green,
    "--shadow": p.shadow,

    "--tile-preview-bg-a": p.checkerA,
    "--tile-preview-bg-b": p.checkerB,

    // Event command list — the same hues One Dark gives those roles in code.
    "--ec-comment": p.green,
    "--ec-conditional": p.conditional,
    "--ec-flow": p.orange,
    "--ec-text": p.fgBright,
    "--ec-vars": p.red,
    "--ec-party": p.orange,
    "--ec-map": p.blue,
    "--ec-move": p.cyan,
    "--ec-move-sub": p.moveSub,
    "--ec-picture": p.purple,
    "--ec-audio": p.cyan,
    "--ec-system": p.red,
    "--ec-actor": p.yellow,
    "--ec-enemy": p.enemy,
    "--ec-script": p.purple,
    "--ec-default": p.fg,
    "--ec-end": p.fgMuted,

    // Ruby in the Scripts editor.
    "--code-keyword": p.purple,
    "--code-string": p.green,
    "--code-comment": p.fgMuted,
    "--code-number": p.orange,
    "--code-def": p.blue,
    "--code-variable": p.red,
    "--code-operator": p.fg,
    "--code-meta": p.cyan,
  };
}

/** Named parts (data-ms-part) instead of app class names, which are not API. */
function css(p) {
  return `
    [data-ms-part="menubar"],
    [data-ms-part="toolbar"] {
      background: ${p.bgDeep};
      border-bottom: 1px solid ${p.border};
    }
    [data-ms-part="statusbar"] {
      background: ${p.bgDeep};
      border-top: 1px solid ${p.border};
    }
    [data-ms-part="panel-header"] {
      background: ${p.bgDeep};
      color: ${p.fg};
      letter-spacing: 0.04em;
    }
    [data-ms-part="dialog"] {
      border: 1px solid ${p.border};
      box-shadow: 0 12px 32px ${p.shadow};
    }
    /* One Dark marks the active thing with a blue rule rather than a fill. */
    .dv-tab.dv-active-tab {
      box-shadow: inset 0 -2px 0 ${p.blue};
    }
  `;
}

export function activate(ctx) {
  ctx.theme.register({
    id: "com.toskan4134.custom-theme.one-dark-pro",
    name: "One Dark Pro",
    // Which built-in palette fills whatever this theme doesn't set. Because the
    // variants below exist, it does NOT pin the editor to dark.
    base: "dark",
    // Declaring both makes it one theme that changes with the Dark Mode toggle.
    dark: { vars: vars(DARK), css: css(DARK) },
    light: { vars: vars(LIGHT), css: css(LIGHT) },
  });

  ctx.log.info("One Dark Pro registered — View > Theme, and it follows Dark Mode");
}
