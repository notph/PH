import { PALETTES, hashString, mulberry32 } from "./field-core.js";
import { generateStreamlines } from "./streamline-core.js";

export const DENSITY_PRESETS = {
  open: {
    label: "Open",
    role: "Hero clair / lecture prioritaire",
    basePreset: "survey",
    backgroundPresence: 0.82,
    tuning: {
      desktopLines: 92,
      mobileLines: 42,
      candidateRatio: 7,
      stepPx: 7.1,
      minSteps: 16,
      maxSteps: 58,
      minPoints: 12,
      minDistancePx: 18,
      collisionLimit: 2,
      densityPower: 1.72,
      densityFloor: 0.28,
      calmStop: 0.14,
      opacityLight: 0.105,
      opacityNight: 0.145,
      secondaryOpacity: 0.16,
      lineWidth: 0.45,
      edgeFade: 0.34,
      flowBias: 1.55,
      curlBias: 0.9,
    },
  },
  balanced: {
    label: "Balanced",
    role: "Fond principal / presence stable",
    basePreset: "survey",
    backgroundPresence: 1,
    tuning: {
      desktopLines: 260,
      mobileLines: 96,
      candidateRatio: 8,
      stepPx: 6.1,
      minSteps: 24,
      maxSteps: 82,
      minPoints: 18,
      minDistancePx: 8.2,
      collisionLimit: 8,
      densityPower: 1.36,
      densityFloor: 0.18,
      calmStop: 0.11,
      opacityLight: 0.16,
      opacityNight: 0.21,
      secondaryOpacity: 0.46,
      lineWidth: 0.54,
      edgeFade: 0.26,
      flowBias: 1.45,
      curlBias: 0.94,
    },
  },
  dense: {
    label: "Dense",
    role: "Transition / section projet",
    basePreset: "survey",
    backgroundPresence: 1.1,
    tuning: {
      desktopLines: 520,
      mobileLines: 168,
      candidateRatio: 7,
      stepPx: 5.7,
      minSteps: 18,
      maxSteps: 72,
      minPoints: 14,
      minDistancePx: 6.2,
      collisionLimit: 18,
      densityPower: 1.08,
      densityFloor: 0.12,
      calmStop: 0.08,
      opacityLight: 0.12,
      opacityNight: 0.17,
      secondaryOpacity: 0.34,
      lineWidth: 0.46,
      edgeFade: 0.22,
      flowBias: 1.32,
      curlBias: 0.98,
    },
  },
  abstract: {
    label: "Abstract",
    role: "Complexite courte / entree narrative",
    basePreset: "contour",
    backgroundPresence: 1.18,
    tuning: {
      desktopLines: 760,
      mobileLines: 224,
      candidateRatio: 7,
      stepPx: 5.2,
      minSteps: 14,
      maxSteps: 58,
      minPoints: 10,
      minDistancePx: 4.2,
      collisionLimit: 42,
      densityPower: 0.72,
      densityFloor: 0.04,
      calmStop: 0.06,
      opacityLight: 0.085,
      opacityNight: 0.125,
      secondaryOpacity: 0.24,
      lineWidth: 0.38,
      edgeFade: 0.18,
      flowBias: 1.18,
      curlBias: 1.06,
    },
  },
};

function mix(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rgba(rgb, alpha) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function drawGrain(ctx, width, height, palette, dpr, seed, theme, presence) {
  const grainCanvas = document.createElement("canvas");
  const grainSize = Math.max(96, Math.floor(150 * dpr));
  grainCanvas.width = grainSize;
  grainCanvas.height = grainSize;
  const grainCtx = grainCanvas.getContext("2d");
  const image = grainCtx.createImageData(grainSize, grainSize);
  const random = mulberry32(hashString(`${seed}:phase3:grain:${theme}`));

  for (let i = 0; i < image.data.length; i += 4) {
    const bright = random() > 0.5;
    const source = bright ? palette.grainLight : palette.grainDark;
    const alpha = (bright ? random() * 6 : random() * 4) * presence;
    image.data[i] = source[0];
    image.data[i + 1] = source[1];
    image.data[i + 2] = source[2];
    image.data[i + 3] = alpha;
  }

  grainCtx.putImageData(image, 0, 0);
  ctx.save();
  ctx.globalAlpha = (theme === "night" ? 0.4 : 0.3) * presence;
  ctx.drawImage(grainCanvas, 0, 0, width, height);
  ctx.restore();
}

function strokeDensityLine(ctx, line, palette, profile, theme) {
  const preset = profile.tuning;
  const primary = line.phase > 0.84 ? palette.secondary : palette.primary;
  const alphaBase = theme === "night" ? preset.opacityNight : preset.opacityLight;
  const local = clamp(line.density * 0.6 + line.energy * 0.4, 0, 1);
  const alpha = alphaBase * mix(0.36, 1, local) * mix(0.86, 1.08, line.phase);
  const width = preset.lineWidth * mix(0.78, 1.16, local);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = rgba(primary, alpha);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(line.points[0].px, line.points[0].py);

  for (let i = 1; i < line.points.length - 1; i += 1) {
    const current = line.points[i];
    const next = line.points[i + 1];
    ctx.quadraticCurveTo(current.px, current.py, (current.px + next.px) * 0.5, (current.py + next.py) * 0.5);
  }

  const last = line.points[line.points.length - 1];
  ctx.lineTo(last.px, last.py);
  ctx.stroke();

  if (line.phase > 0.76 && profile !== DENSITY_PRESETS.open) {
    ctx.strokeStyle = rgba(palette.accent, alpha * preset.secondaryOpacity);
    ctx.lineWidth = width * 0.55;
    ctx.stroke();
  }

  ctx.restore();
}

export function renderDensity(canvas, options = {}) {
  const renderStart = globalThis.performance?.now?.() ?? Date.now();
  const ctx = canvas.getContext("2d", { alpha: false });
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(options.dpr ?? window.devicePixelRatio ?? 1, options.maxDpr ?? 2);
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  const cssWidth = rect.width;
  const cssHeight = rect.height;
  const theme = options.theme === "night" ? "night" : "light";
  const density = DENSITY_PRESETS[options.density] ? options.density : "balanced";
  const profile = DENSITY_PRESETS[density];
  const seed = options.seed ?? "PHASE3";
  const palette = PALETTES[theme];

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);
  drawGrain(ctx, width, height, palette, dpr, seed, theme, profile.backgroundPresence);

  const generated = generateStreamlines(width, height, `${seed}:${density}`, {
    preset: profile.basePreset,
    presetTuning: profile.tuning,
    reducedMotion: options.reducedMotion,
    cssWidth,
    cssHeight,
  });

  ctx.save();
  ctx.scale(dpr, dpr);
  for (const line of generated.lines) {
    strokeDensityLine(ctx, line, palette, profile, theme);
  }
  ctx.restore();

  const result = {
    seed,
    theme,
    density,
    label: profile.label,
    role: profile.role,
    targetCount: generated.targetCount,
    lineCount: generated.lines.length,
    pointCount: generated.lines.reduce((sum, line) => sum + line.points.length, 0),
    longestLinePx: Math.round(
      generated.lines.reduce((max, line) => Math.max(max, line.lengthPx), 0),
    ),
    renderMs: Math.round(((globalThis.performance?.now?.() ?? Date.now()) - renderStart) * 10) / 10,
    criteria:
      "Phase 3 only: density presets over the validated Phase 2 streamlines. No animation, pointer interaction, scroll narrative, or final engine.",
  };

  canvas.dataset.phase = "3";
  canvas.dataset.seed = result.seed;
  canvas.dataset.theme = result.theme;
  canvas.dataset.density = result.density;
  canvas.dataset.lineCount = String(result.lineCount);
  canvas.dataset.pointCount = String(result.pointCount);
  canvas.dataset.renderMs = String(result.renderMs);
  canvas.dataset.longestLinePx = String(result.longestLinePx);

  return result;
}
