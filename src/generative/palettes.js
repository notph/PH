import { PALETTES } from "./core/field-core.js";

export const ENGINE_PALETTES = {
  light: {
    ...PALETTES.light,
    role: "Warm paper, graphite, grey-blue lines.",
  },
  dawn: {
    ...PALETTES.dawn,
    role: "Warm early light, restrained amber measurement accents.",
  },
  dusk: {
    ...PALETTES.dusk,
    role: "Low blue dusk, softened copper measurement accents.",
  },
  night: {
    ...PALETTES.night,
    role: "Matte blue-black depth, never neon.",
  },
};

export function resolveTheme(theme) {
  if (theme === "night" || theme === "dawn" || theme === "dusk") return theme;
  return "light";
}

export function resolvePalette(theme) {
  return ENGINE_PALETTES[resolveTheme(theme)];
}
