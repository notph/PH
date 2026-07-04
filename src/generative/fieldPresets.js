import { DENSITY_PRESETS } from "./core/density-core.js";
import {
  NARRATIVE_PRESETS,
  getNarrativeState,
} from "./core/narrative-core.js";

export const ENGINE_DENSITIES = Object.freeze(["open", "balanced", "dense", "abstract"]);

export function resolveDensity(density, fallback = "balanced") {
  return ENGINE_DENSITIES.includes(density) ? density : fallback;
}

export function resolveNarrativePreset(preset) {
  return NARRATIVE_PRESETS[preset] ? preset : "clarification";
}

export function getEngineNarrativeState(progress, options = {}) {
  return getNarrativeState(progress, {
    preset: resolveNarrativePreset(options.preset),
  });
}

export function densityContract() {
  return ENGINE_DENSITIES.map((density) => {
    const preset = DENSITY_PRESETS[density];
    return {
      density,
      desktopLines: preset.tuning.desktopLines,
      mobileLines: preset.tuning.mobileLines,
      maxSteps: preset.tuning.maxSteps,
      role: preset.role,
    };
  });
}
