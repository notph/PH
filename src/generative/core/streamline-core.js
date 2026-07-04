import {
  PALETTES,
  createParams,
  densityMask,
  hashString,
  mulberry32,
  pointToWorld,
  sampleField,
} from "./field-core.js?v=stable-field-20260703-scroll7";

const DEFAULT_FIELD_VARIANT = "potential";

export const STREAMLINE_VARIANTS = {
  survey: {
    label: "A - Releve continu",
    hypothesis: "Trajectoires longues, lecture physique, grands vides.",
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
  contour: {
    label: "B - Relief / isobathes",
    hypothesis: "Courbes plus cartographiques, topographie plus lisible.",
    desktopLines: 340,
    mobileLines: 126,
    candidateRatio: 8,
    stepPx: 4.3,
    minSteps: 28,
    maxSteps: 96,
    minPoints: 22,
    minDistancePx: 8.8,
    collisionLimit: 7,
    densityPower: 1.16,
    densityFloor: 0.16,
    calmStop: 0.08,
    opacityLight: 0.16,
    opacityNight: 0.21,
    secondaryOpacity: 0.42,
    lineWidth: 0.48,
    edgeFade: 0.24,
    flowBias: 0.9,
    curlBias: 1.05,
  },
  drift: {
    label: "C - Derive / courant",
    hypothesis: "Ecoulement plus directionnel, lisible mais moins mysterieux.",
    desktopLines: 210,
    mobileLines: 82,
    candidateRatio: 10,
    stepPx: 5.4,
    minSteps: 24,
    maxSteps: 104,
    minPoints: 18,
    minDistancePx: 9.4,
    collisionLimit: 7,
    densityPower: 1.2,
    densityFloor: 0.16,
    calmStop: 0.09,
    opacityLight: 0.18,
    opacityNight: 0.23,
    secondaryOpacity: 0.34,
    lineWidth: 0.52,
    edgeFade: 0.3,
    flowBias: 1.75,
    curlBias: 0.86,
  },
};

function mix(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

function rgba(rgb, alpha) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function drawGrain(ctx, width, height, palette, dpr, seed, theme) {
  const grainCanvas = document.createElement("canvas");
  const grainSize = Math.max(96, Math.floor(150 * dpr));
  grainCanvas.width = grainSize;
  grainCanvas.height = grainSize;
  const grainCtx = grainCanvas.getContext("2d");
  const image = grainCtx.createImageData(grainSize, grainSize);
  const random = mulberry32(hashString(`${seed}:phase2:grain:${theme}`));

  for (let i = 0; i < image.data.length; i += 4) {
    const bright = random() > 0.5;
    const source = bright ? palette.grainLight : palette.grainDark;
    const alpha = bright ? random() * 7 : random() * 5;
    image.data[i] = source[0];
    image.data[i + 1] = source[1];
    image.data[i + 2] = source[2];
    image.data[i + 3] = alpha;
  }

  grainCtx.putImageData(image, 0, 0);
  ctx.save();
  ctx.globalAlpha = theme === "night" ? 0.42 : 0.32;
  ctx.drawImage(grainCanvas, 0, 0, width, height);
  ctx.restore();
}

function worldToPoint(point, cssWidth, cssHeight, aspect) {
  return {
    x: ((point.x / aspect + 1) * 0.5) * cssWidth,
    y: ((point.y + 1) * 0.5) * cssHeight,
  };
}

function inWorldBounds(point, aspect) {
  return Math.abs(point.x / aspect) <= 1.04 && Math.abs(point.y) <= 1.04;
}

function edgeWeight(point, aspect, preset) {
  const edge = Math.max(Math.abs(point.x / aspect), Math.abs(point.y));
  return smooth(clamp((1.04 - edge) / preset.edgeFade, 0, 1));
}

function makeOccupancy(cssWidth, cssHeight, minDistancePx) {
  const cell = Math.max(8, minDistancePx);
  const cols = Math.ceil(cssWidth / cell);
  const rows = Math.ceil(cssHeight / cell);
  const occupied = new Uint8Array(cols * rows);

  function indexFor(px, py) {
    const x = Math.floor(px / cell);
    const y = Math.floor(py / cell);
    if (x < 0 || y < 0 || x >= cols || y >= rows) return -1;
    return y * cols + x;
  }

  return {
    hits(points) {
      let count = 0;
      for (let i = 0; i < points.length; i += 4) {
        const index = indexFor(points[i].px, points[i].py);
        if (index >= 0 && occupied[index]) count += 1;
      }
      return count;
    },
    mark(points) {
      for (let i = 0; i < points.length; i += 3) {
        const x = Math.floor(points[i].px / cell);
        const y = Math.floor(points[i].py / cell);
        for (let yy = y - 1; yy <= y + 1; yy += 1) {
          for (let xx = x - 1; xx <= x + 1; xx += 1) {
            if (xx < 0 || yy < 0 || xx >= cols || yy >= rows) continue;
            occupied[yy * cols + xx] = 1;
          }
        }
      }
    },
  };
}

function stepField(point, direction, stepWorld, t, params) {
  const first = sampleField(point.x, point.y, t, params);
  const mid = {
    x: point.x + first.x * direction * stepWorld * 0.5,
    y: point.y + first.y * direction * stepWorld * 0.5,
  };
  const second = sampleField(mid.x, mid.y, t, params);
  return {
    x: point.x + second.x * direction * stepWorld,
    y: point.y + second.y * direction * stepWorld,
    energy: second.energy,
  };
}

function integrate(seed, direction, steps, stepWorld, t, params, preset, random) {
  const points = [];
  let point = { x: seed.x, y: seed.y };

  for (let i = 0; i < steps; i += 1) {
    const next = stepField(point, direction, stepWorld, t, params);
    point = { x: next.x, y: next.y };
    if (!inWorldBounds(point, params.aspect)) break;

    const density = densityMask(point.x, point.y, params);
    const edge = edgeWeight(point, params.aspect, preset);
    if (edge <= 0.02) break;
    if (next.energy < preset.calmStop && random() > 0.68) break;

    points.push({
      x: point.x,
      y: point.y,
      energy: next.energy,
      density,
      edge,
    });
  }

  return points;
}

function candidatePriority(candidate, params, preset) {
  const density = densityMask(candidate.x, candidate.y, params);
  const edge = edgeWeight(candidate, params.aspect, preset);
  return {
    ...candidate,
    density,
    edge,
    priority: Math.pow(Math.max(0, density - preset.densityFloor), preset.densityPower) * edge +
      candidate.random * 0.14,
  };
}

function createCandidates(cssWidth, cssHeight, params, preset, seed, count) {
  const random = mulberry32(hashString(`${seed}:phase2:candidates:${preset.label}`));
  const candidates = [];
  const max = Math.ceil(count * preset.candidateRatio);

  for (let i = 0; i < max; i += 1) {
    const px = mix(cssWidth * -0.02, cssWidth * 1.02, random());
    const py = mix(cssHeight * -0.02, cssHeight * 1.02, random());
    const world = pointToWorld(px, py, cssWidth, cssHeight, params.aspect);
    candidates.push(
      candidatePriority(
        {
          ...world,
          px,
          py,
          random: random(),
        },
        params,
        preset,
      ),
    );
  }

  candidates.sort((a, b) => b.priority - a.priority);
  return candidates;
}

function buildLine(candidate, context) {
  const { cssWidth, cssHeight, params, preset, random, stepWorld, t } = context;
  const totalSteps = Math.floor(mix(preset.minSteps, preset.maxSteps, random()));
  const backwardSteps = Math.floor(totalSteps * mix(0.36, 0.64, random()));
  const forwardSteps = totalSteps - backwardSteps;
  const seed = { x: candidate.x, y: candidate.y };
  const centerField = sampleField(seed.x, seed.y, t, params);
  const backward = integrate(seed, -1, backwardSteps, stepWorld, t, params, preset, random).reverse();
  const forward = integrate(seed, 1, forwardSteps, stepWorld, t, params, preset, random);
  const center = {
    x: seed.x,
    y: seed.y,
    energy: centerField.energy,
    density: candidate.density,
    edge: candidate.edge,
  };
  const points = [...backward, center, ...forward].map((point) => {
    const screen = worldToPoint(point, cssWidth, cssHeight, params.aspect);
    return {
      ...point,
      px: screen.x,
      py: screen.y,
    };
  });

  if (points.length < preset.minPoints) return null;

  let lengthPx = 0;
  let energy = 0;
  let density = 0;
  for (let i = 1; i < points.length; i += 1) {
    lengthPx += Math.hypot(points[i].px - points[i - 1].px, points[i].py - points[i - 1].py);
    energy += points[i].energy;
    density += points[i].density;
  }

  if (lengthPx < Math.min(cssWidth, cssHeight) * 0.08) return null;

  const divisor = Math.max(1, points.length - 1);
  return {
    points,
    lengthPx,
    energy: energy / divisor,
    density: density / divisor,
    phase: random(),
  };
}

function createGenerationContext(width, height, seed, options = {}) {
  const presetKey = options.preset ?? "survey";
  const basePreset = STREAMLINE_VARIANTS[presetKey] ?? STREAMLINE_VARIANTS.survey;
  const preset = {
    ...basePreset,
    ...(options.presetTuning ?? {}),
  };
  const fieldVariant = options.fieldVariant ?? DEFAULT_FIELD_VARIANT;
  const cssWidth = options.cssWidth ?? width;
  const cssHeight = options.cssHeight ?? height;
  const params = createParams(cssWidth, cssHeight, seed, fieldVariant, options.fieldTuning);
  const globalFlowMultiplier = Number.isFinite(options.fieldTuning?.globalFlowMultiplier)
    ? clamp(options.fieldTuning.globalFlowMultiplier, 0.35, 2.2)
    : 1;
  const curlMultiplier = Number.isFinite(options.fieldTuning?.curlMultiplier)
    ? clamp(options.fieldTuning.curlMultiplier, 0.35, 1.9)
    : 1;
  params.globalFlow = {
    ...params.globalFlow,
    strength: params.globalFlow.strength * preset.flowBias * globalFlowMultiplier,
  };
  params.variant = {
    ...params.variant,
    curlWeight: params.variant.curlWeight * preset.curlBias * curlMultiplier,
  };
  const baseCount = cssWidth < 720 ? preset.mobileLines : preset.desktopLines;
  const referenceArea = cssWidth < 720 ? 390 * 844 : 1440 * 900;
  const areaScale = clamp((cssWidth * cssHeight) / referenceArea, 0.45, 1.1);
  const count = Math.max(24, Math.round(baseCount * areaScale));
  const random = mulberry32(hashString(`${seed}:phase2:${presetKey}:${cssWidth}:${cssHeight}`));
  const candidates = createCandidates(cssWidth, cssHeight, params, preset, seed, count);
  const occupancy = makeOccupancy(cssWidth, cssHeight, preset.minDistancePx);
  const stepWorld = (preset.stepPx * 2) / cssHeight;
  const t = options.reducedMotion ? 0 : options.time ?? 0.00001;
  return {
    presetKey,
    preset,
    fieldVariant,
    params,
    count,
    random,
    candidates,
    occupancy,
    stepWorld,
    t,
    cssWidth,
    cssHeight,
    candidateIndex: 0,
    processedCandidates: 0,
    lines: [],
  };
}

function resultFromGenerationContext(context) {
  return {
    presetKey: context.presetKey,
    preset: context.preset,
    fieldVariant: context.fieldVariant,
    params: context.params,
    lines: context.lines,
    targetCount: context.count,
  };
}

export function createStreamlineGenerationJob(width, height, seed, options = {}) {
  const context = createGenerationContext(width, height, seed, options);

  function isDone() {
    return context.lines.length >= context.count || context.candidateIndex >= context.candidates.length;
  }

  function processCandidate(candidate) {
    if (candidate.priority <= 0.01) return false;

    const line = buildLine(candidate, {
      cssWidth: context.cssWidth,
      cssHeight: context.cssHeight,
      params: context.params,
      preset: context.preset,
      random: context.random,
      stepWorld: context.stepWorld,
      t: context.t,
    });

    if (!line) return false;
    if (context.occupancy.hits(line.points) > context.preset.collisionLimit) return false;
    context.occupancy.mark(line.points);
    context.lines.push(line);
    return true;
  }

  return {
    processBatch(batchOptions = {}) {
      const started = globalThis.performance?.now?.() ?? Date.now();
      const maxCandidates = Number.isFinite(batchOptions.maxCandidates)
        ? Math.max(1, Math.floor(batchOptions.maxCandidates))
        : Infinity;
      const timeBudgetMs = Number.isFinite(batchOptions.timeBudgetMs)
        ? Math.max(0, batchOptions.timeBudgetMs)
        : Infinity;
      const beforeLines = context.lines.length;
      let processed = 0;

      while (!isDone() && processed < maxCandidates) {
        const candidate = context.candidates[context.candidateIndex];
        context.candidateIndex += 1;
        context.processedCandidates += 1;
        processed += 1;
        processCandidate(candidate);

        const elapsed = (globalThis.performance?.now?.() ?? Date.now()) - started;
        if (processed > 0 && elapsed >= timeBudgetMs) break;
      }

      const durationMs = (globalThis.performance?.now?.() ?? Date.now()) - started;
      return {
        done: isDone(),
        durationMs,
        processedCandidates: processed,
        acceptedLines: context.lines.length - beforeLines,
        candidateIndex: context.candidateIndex,
        candidatesTotal: context.candidates.length,
        lineCount: context.lines.length,
        targetCount: context.count,
      };
    },
    finish() {
      while (!isDone()) this.processBatch();
      return resultFromGenerationContext(context);
    },
    getResult() {
      return resultFromGenerationContext(context);
    },
    snapshot() {
      return {
        done: isDone(),
        processedCandidates: context.processedCandidates,
        candidateIndex: context.candidateIndex,
        candidatesTotal: context.candidates.length,
        lineCount: context.lines.length,
        targetCount: context.count,
      };
    },
  };
}

export function generateStreamlines(width, height, seed, options = {}) {
  return createStreamlineGenerationJob(width, height, seed, options).finish();
}

function strokeStreamline(ctx, line, palette, preset, theme) {
  const primary = line.phase > 0.82 ? palette.secondary : palette.primary;
  const alphaBase = theme === "night" ? preset.opacityNight : preset.opacityLight;
  const local = clamp(line.density * 0.62 + line.energy * 0.38, 0, 1);
  const alpha = alphaBase * mix(0.44, 1, local) * mix(0.88, 1.08, line.phase);
  const width = preset.lineWidth * mix(0.82, 1.18, local);

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

  if (line.phase > 0.72 && line.lengthPx > 260) {
    ctx.strokeStyle = rgba(palette.accent, alpha * preset.secondaryOpacity);
    ctx.lineWidth = width * 0.58;
    ctx.stroke();
  }

  ctx.restore();
}

export function renderStreamlines(canvas, options = {}) {
  const renderStart = globalThis.performance?.now?.() ?? Date.now();
  const ctx = canvas.getContext("2d", { alpha: false });
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(options.dpr ?? window.devicePixelRatio ?? 1, options.maxDpr ?? 2);
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  const cssWidth = rect.width;
  const cssHeight = rect.height;
  const theme = options.theme === "night" ? "night" : "light";
  const seed = options.seed ?? "PHASE2";
  const presetKey = options.preset ?? "survey";
  const palette = PALETTES[theme];

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);
  drawGrain(ctx, width, height, palette, dpr, seed, theme);

  const generated = generateStreamlines(width, height, seed, {
    preset: presetKey,
    fieldVariant: options.fieldVariant ?? DEFAULT_FIELD_VARIANT,
    reducedMotion: options.reducedMotion,
    cssWidth,
    cssHeight,
  });

  ctx.save();
  ctx.scale(dpr, dpr);
  for (const line of generated.lines) {
    strokeStreamline(ctx, line, palette, generated.preset, theme);
  }
  ctx.restore();

  const result = {
    seed,
    theme,
    presetKey: generated.presetKey,
    label: generated.preset.label,
    fieldVariant: generated.fieldVariant,
    targetCount: generated.targetCount,
    lineCount: generated.lines.length,
    pointCount: generated.lines.reduce((sum, line) => sum + line.points.length, 0),
    longestLinePx: Math.round(
      generated.lines.reduce((max, line) => Math.max(max, line.lengthPx), 0),
    ),
    renderMs: Math.round(((globalThis.performance?.now?.() ?? Date.now()) - renderStart) * 10) / 10,
    criteria:
      "Phase 2 only: streamlines integrated through the validated Phase 1 vector field. No density presets, animation, pointer interaction, scroll narrative, text, or final engine.",
  };

  canvas.dataset.phase = "2";
  canvas.dataset.seed = result.seed;
  canvas.dataset.theme = result.theme;
  canvas.dataset.preset = result.presetKey;
  canvas.dataset.lineCount = String(result.lineCount);
  canvas.dataset.pointCount = String(result.pointCount);
  canvas.dataset.renderMs = String(result.renderMs);
  canvas.dataset.longestLinePx = String(result.longestLinePx);

  return result;
}
