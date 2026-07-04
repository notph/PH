import { PALETTES, hashString, mulberry32 } from "./field-core.js";
import { generateStreamlines } from "./streamline-core.js";
import { DENSITY_PRESETS } from "./density-core.js";

export const ANIMATION_MODES = {
  productionStill: {
    label: "Production still",
    role: "Champ de fond stable pour la page publique.",
    timeScale: 0.000025,
    lineRefreshInterval: 120000,
    fullCycleDuration: 900,
    transitionRatio: 0.98,
    maxDpr: 1.45,
  },
  glacial: {
    label: "Glacial",
    role: "Presence presque immobile, hero et lecture longue.",
    timeScale: 0.00003,
    lineRefreshInterval: 20000,
    fullCycleDuration: 420,
    transitionRatio: 0.96,
    maxDpr: 1.6,
  },
  tidal: {
    label: "Tidal",
    role: "Respiration mesurable, fond principal.",
    timeScale: 0.00005,
    lineRefreshInterval: 16000,
    fullCycleDuration: 300,
    transitionRatio: 0.94,
    maxDpr: 1.5,
  },
  measured: {
    label: "Measured",
    role: "Banc limite: vivant mais proche du visible.",
    timeScale: 0.00009,
    lineRefreshInterval: 10000,
    fullCycleDuration: 180,
    transitionRatio: 0.9,
    maxDpr: 1.4,
  },
  weather: {
    label: "Weather",
    role: "Derive atmospherique abstraite, lisible mais calme.",
    timeScale: 0.000075,
    lineRefreshInterval: 12000,
    fullCycleDuration: 220,
    transitionRatio: 0.92,
    maxDpr: 1.45,
  },
};

function mix(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smooth(t) {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function rgba(rgb, alpha) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function drawGrain(ctx, grain, width, height, theme, presence) {
  ctx.save();
  ctx.globalAlpha = (theme === "night" ? 0.34 : 0.26) * presence;
  ctx.drawImage(grain, 0, 0, width, height);
  ctx.restore();
}

function createGrain(width, height, palette, dpr, seed, theme, presence) {
  const grainCanvas = document.createElement("canvas");
  const grainSize = Math.max(96, Math.floor(150 * dpr));
  grainCanvas.width = grainSize;
  grainCanvas.height = grainSize;
  const grainCtx = grainCanvas.getContext("2d");
  const image = grainCtx.createImageData(grainSize, grainSize);
  const random = mulberry32(hashString(`${seed}:phase4:grain:${theme}`));

  for (let i = 0; i < image.data.length; i += 4) {
    const bright = random() > 0.5;
    const source = bright ? palette.grainLight : palette.grainDark;
    const alpha = (bright ? random() * 5 : random() * 3.5) * presence;
    image.data[i] = source[0];
    image.data[i + 1] = source[1];
    image.data[i + 2] = source[2];
    image.data[i + 3] = alpha;
  }

  grainCtx.putImageData(image, 0, 0);

  const scaled = document.createElement("canvas");
  scaled.width = width;
  scaled.height = height;
  const scaledCtx = scaled.getContext("2d", { alpha: true });
  scaledCtx.drawImage(grainCanvas, 0, 0, width, height);
  return scaled;
}

function strokeAnimatedLine(ctx, line, palette, profile, theme, opacityScale) {
  if (opacityScale <= 0.001) return;

  const preset = profile.tuning;
  const primary = line.phase > 0.84 ? palette.secondary : palette.primary;
  const alphaBase = theme === "night" ? preset.opacityNight : preset.opacityLight;
  const local = clamp(line.density * 0.6 + line.energy * 0.4, 0, 1);
  const alpha = alphaBase * mix(0.34, 0.94, local) * mix(0.9, 1.04, line.phase) * opacityScale;
  const width = preset.lineWidth * mix(0.78, 1.12, local);

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

  if (line.phase > 0.78 && profile !== DENSITY_PRESETS.open) {
    ctx.strokeStyle = rgba(palette.accent, alpha * preset.secondaryOpacity * 0.72);
    ctx.lineWidth = width * 0.5;
    ctx.stroke();
  }

  ctx.restore();
}

function configureCanvas(canvas, maxDpr) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  const cssWidth = Math.max(1, rect.width);
  const cssHeight = Math.max(1, rect.height);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  return { dpr, width, height, cssWidth, cssHeight };
}

function frameStats(frame) {
  return {
    lineCount: frame.generated.lines.length,
    pointCount: frame.generated.lines.reduce((sum, line) => sum + line.points.length, 0),
    longestLinePx: Math.round(frame.generated.lines.reduce((max, line) => Math.max(max, line.lengthPx), 0)),
  };
}

function createGeneratedFrame(state, index) {
  const started = performance.now();
  const fieldTime = index * state.mode.lineRefreshInterval * state.mode.timeScale;
  const generated = generateStreamlines(state.width, state.height, `${state.seed}:${state.density}`, {
    preset: state.profile.basePreset,
    presetTuning: state.profile.tuning,
    reducedMotion: state.reducedMotion,
    cssWidth: state.cssWidth,
    cssHeight: state.cssHeight,
    time: fieldTime,
  });

  return {
    index,
    fieldTime,
    generated,
    generationMs: Math.round((performance.now() - started) * 10) / 10,
  };
}

function drawGeneratedFrame(ctx, frame, palette, profile, theme, opacityScale) {
  for (const line of frame.generated.lines) {
    strokeAnimatedLine(ctx, line, palette, profile, theme, opacityScale);
  }
}

export function createBreathingField(canvas, options = {}) {
  const theme = options.theme === "night" ? "night" : "light";
  const density = DENSITY_PRESETS[options.density] ? options.density : "balanced";
  const modeKey = ANIMATION_MODES[options.mode] ? options.mode : "glacial";
  const mode = ANIMATION_MODES[modeKey];
  const seed = options.seed ?? "PHASE4";
  const profile = DENSITY_PRESETS[density];
  const palette = PALETTES[theme];
  const reducedMotion = Boolean(options.reducedMotion);
  const ctx = canvas.getContext("2d", { alpha: false });
  const size = configureCanvas(canvas, options.maxDpr ?? mode.maxDpr);

  const state = {
    ...size,
    canvas,
    ctx,
    seed,
    theme,
    density,
    modeKey,
    mode,
    profile,
    palette,
    reducedMotion,
    grain: createGrain(size.width, size.height, palette, size.dpr, seed, theme, profile.backgroundPresence),
    current: null,
    next: null,
    frameIndex: 0,
    raf: 0,
    running: false,
    startedAt: 0,
    transitionStart: 0,
    frameCount: 0,
    generationCount: 0,
    sumDrawMs: 0,
    maxDrawMs: 0,
    sumFrameMs: 0,
    maxFrameMs: 0,
    lastFrameAt: 0,
    lastGenerationMs: 0,
  };

  function updateDataset(snapshot) {
    canvas.dataset.phase = "4";
    canvas.dataset.seed = snapshot.seed;
    canvas.dataset.theme = snapshot.theme;
    canvas.dataset.density = snapshot.density;
    canvas.dataset.mode = snapshot.modeKey;
    canvas.dataset.reducedMotion = String(snapshot.reducedMotion);
    canvas.dataset.lineCount = String(snapshot.lineCount);
    canvas.dataset.pointCount = String(snapshot.pointCount);
    canvas.dataset.avgDrawMs = String(snapshot.avgDrawMs);
    canvas.dataset.maxDrawMs = String(snapshot.maxDrawMs);
    canvas.dataset.avgFrameMs = String(snapshot.avgFrameMs);
    canvas.dataset.generationCount = String(snapshot.generationCount);
  }

  function generateInitialFrames() {
    state.current = createGeneratedFrame(state, 0);
    state.next = reducedMotion ? null : createGeneratedFrame(state, 1);
    state.frameIndex = 1;
    state.generationCount = reducedMotion ? 1 : 2;
    state.lastGenerationMs = Math.max(state.current.generationMs, state.next?.generationMs ?? 0);
  }

  function paint(now) {
    const drawStart = performance.now();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, state.width, state.height);
    drawGrain(ctx, state.grain, state.width, state.height, theme, profile.backgroundPresence);

    ctx.save();
    ctx.scale(state.dpr, state.dpr);

    if (reducedMotion || !state.next) {
      drawGeneratedFrame(ctx, state.current, palette, profile, theme, 1);
    } else {
      const transitionDuration = mode.lineRefreshInterval * mode.transitionRatio;
      const progress = smooth((now - state.transitionStart) / transitionDuration);
      drawGeneratedFrame(ctx, state.current, palette, profile, theme, 1 - progress);
      drawGeneratedFrame(ctx, state.next, palette, profile, theme, progress);
    }

    ctx.restore();

    const drawMs = performance.now() - drawStart;
    state.frameCount += 1;
    state.sumDrawMs += drawMs;
    state.maxDrawMs = Math.max(state.maxDrawMs, drawMs);
    if (state.lastFrameAt > 0) {
      const frameMs = now - state.lastFrameAt;
      state.sumFrameMs += frameMs;
      state.maxFrameMs = Math.max(state.maxFrameMs, frameMs);
    }
    state.lastFrameAt = now;

    if (state.frameCount === 1 || state.frameCount % 90 === 0) {
      updateDataset(snapshot());
    }
  }

  function tick(now) {
    if (!state.running) return;

    if (!reducedMotion && now - state.transitionStart >= mode.lineRefreshInterval) {
      state.current = state.next;
      state.frameIndex += 1;
      state.next = createGeneratedFrame(state, state.frameIndex);
      state.generationCount += 1;
      state.lastGenerationMs = state.next.generationMs;
      state.transitionStart = now;
    }

    paint(now);
    state.raf = requestAnimationFrame(tick);
  }

  function snapshot() {
    const currentStats = state.current ? frameStats(state.current) : { lineCount: 0, pointCount: 0, longestLinePx: 0 };
    const elapsedMs = state.startedAt ? performance.now() - state.startedAt : 0;
    const measuredFrames = Math.max(1, state.frameCount - 1);
    const transitionProgress = reducedMotion
      ? 0
      : clamp((performance.now() - state.transitionStart) / mode.lineRefreshInterval, 0, 1);

    return {
      phase: 4,
      seed,
      theme,
      density,
      modeKey,
      label: mode.label,
      role: mode.role,
      timeScale: mode.timeScale,
      lineRefreshIntervalSeconds: mode.lineRefreshInterval / 1000,
      fullCycleDurationSeconds: mode.fullCycleDuration,
      reducedMotion,
      elapsedSeconds: Math.round((elapsedMs / 1000) * 10) / 10,
      transitionProgress: Math.round(transitionProgress * 1000) / 1000,
      lineCount: currentStats.lineCount,
      pointCount: currentStats.pointCount,
      longestLinePx: currentStats.longestLinePx,
      generationCount: state.generationCount,
      lastGenerationMs: state.lastGenerationMs,
      frameCount: state.frameCount,
      avgDrawMs: Math.round((state.sumDrawMs / Math.max(1, state.frameCount)) * 10) / 10,
      maxDrawMs: Math.round(state.maxDrawMs * 10) / 10,
      avgFrameMs: Math.round((state.sumFrameMs / measuredFrames) * 10) / 10,
      maxFrameMs: Math.round(state.maxFrameMs * 10) / 10,
      criteria:
        "Phase 4 only: slow cached animation over the validated Phase 3 density presets. No pointer interaction, scroll narrative, or final engine.",
    };
  }

  generateInitialFrames();
  paint(performance.now());
  updateDataset(snapshot());

  return {
    start() {
      if (state.running || reducedMotion) return;
      state.running = true;
      state.startedAt = performance.now();
      state.transitionStart = state.startedAt;
      state.lastFrameAt = 0;
      state.raf = requestAnimationFrame(tick);
    },
    stop() {
      state.running = false;
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = 0;
      updateDataset(snapshot());
    },
    destroy() {
      this.stop();
    },
    snapshot,
    renderStill() {
      paint(performance.now());
      updateDataset(snapshot());
      return snapshot();
    },
  };
}

export function estimateCanvasDelta(canvas, previousImageData, sampleStep = 12) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if (!previousImageData) {
    return {
      imageData: current,
      meanDelta: 0,
      maxDelta: 0,
      sampledPixels: 0,
    };
  }

  let total = 0;
  let max = 0;
  let count = 0;
  const step = Math.max(4, sampleStep);

  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const index = (y * canvas.width + x) * 4;
      const delta =
        Math.abs(current.data[index] - previousImageData.data[index]) +
        Math.abs(current.data[index + 1] - previousImageData.data[index + 1]) +
        Math.abs(current.data[index + 2] - previousImageData.data[index + 2]);
      total += delta / 3;
      max = Math.max(max, delta / 3);
      count += 1;
    }
  }

  return {
    imageData: current,
    meanDelta: Math.round((total / Math.max(1, count)) * 1000) / 1000,
    maxDelta: Math.round(max * 1000) / 1000,
    sampledPixels: count,
  };
}
