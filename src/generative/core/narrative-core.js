import { PALETTES, hashString, mulberry32 } from "./field-core.js?v=stable-field-20260703-scroll7";
import {
  createStreamlineGenerationJob,
  generateStreamlines,
} from "./streamline-core.js?v=stable-field-20260703-scroll7";
import { DENSITY_PRESETS } from "./density-core.js?v=stable-field-20260703-scroll7";
import { ANIMATION_MODES } from "./animation-core.js?v=stable-field-20260703-scroll7";

export const NARRATIVE_PRESETS = {
  clarification: {
    label: "Clarification progressive",
    role: "Debut complexe, milieu organise, fin lisible.",
    progressSmoothing: 0.036,
    anchors: [
      {
        key: "beginning",
        label: "Complexite",
        progress: 0,
        density: "balanced",
        mobileDensity: "balanced",
        fieldVariant: "bathymetric",
        opacityScale: 0.76,
        protectionMinLight: 0.07,
        protectionMinNight: 0.06,
        protectionFalloff: 95,
        tuning: {
          desktopLines: 285,
          mobileLines: 132,
          candidateRatio: 12,
          minSteps: 58,
          maxSteps: 196,
          minDistancePx: 9.6,
          collisionLimit: 9,
          opacityLight: 0.22,
          opacityNight: 0.24,
          secondaryOpacity: 0.48,
          lineWidth: 0.66,
          flowBias: 1.28,
          curlBias: 0.86,
        },
      },
      {
        key: "middle",
        label: "Organisation",
        progress: 0.28,
        density: "balanced",
        mobileDensity: "open",
        fieldVariant: "current",
        opacityScale: 0.76,
        protectionMinLight: 0.075,
        protectionMinNight: 0.065,
        protectionFalloff: 270,
        tuning: {
          desktopLines: 220,
          mobileLines: 62,
          candidateRatio: 14,
          minSteps: 66,
          maxSteps: 190,
          minDistancePx: 17.5,
          collisionLimit: 7,
          opacityLight: 0.22,
          opacityNight: 0.23,
          secondaryOpacity: 0.5,
          lineWidth: 0.64,
          flowBias: 1.78,
          curlBias: 0.68,
        },
      },
      {
        key: "end",
        label: "Equilibre",
        progress: 0.58,
        density: "open",
        mobileDensity: "open",
        fieldVariant: "bathymetric",
        opacityScale: 0.7,
        protectionMinLight: 0.09,
        protectionMinNight: 0.075,
        protectionFalloff: 240,
        tuning: {
          desktopLines: 120,
          mobileLines: 28,
          candidateRatio: 12,
          minSteps: 62,
          maxSteps: 156,
          minDistancePx: 23,
          collisionLimit: 5,
          opacityLight: 0.18,
          opacityNight: 0.2,
          secondaryOpacity: 0.26,
          lineWidth: 0.66,
          flowBias: 1.86,
          curlBias: 0.66,
        },
      },
    ],
  },
};

const CONTENT_PROTECTION = {
  paddingX: 34,
  paddingY: 24,
};

const NARRATIVE_INTERACTION_PRESETS = {
  softRepel: {
    mode: "softRepel",
    radius: 190,
    strength: 0.075,
    decay: 0.955,
    opening: 0.11,
    stiffness: 0.15,
  },
  softDrift: {
    mode: "linePush",
    radius: 260,
    strength: 0.015,
    decay: 0.982,
    opening: 0,
    stiffness: 0.045,
  },
};

const AMBIENT_MOTION_PROFILES = {
  off: {
    key: "off",
    amplitudeDesktop: 0,
    amplitudeMobile: 0,
  },
  weather: {
    key: "weather",
    amplitudeDesktop: 10.5,
    amplitudeMobile: 4.8,
    secondaryAmplitude: 3.2,
    periodMinMs: 11800,
    periodMaxMs: 23500,
  },
};

const NARRATIVE_VISIBILITY_PROFILES = {
  baseline: {
    key: "baseline",
    lightOpacity: 1,
    nightOpacity: 1,
    lightWidth: 1,
    nightWidth: 1,
    secondaryOpacity: 1,
  },
  clearer: {
    key: "clearer",
    lightOpacity: 1.46,
    nightOpacity: 1,
    lightWidth: 1.02,
    nightWidth: 1,
    secondaryOpacity: 1.08,
  },
  instrument: {
    key: "instrument",
    lightOpacity: 2.3,
    nightOpacity: 1.16,
    lightWidth: 1.1,
    nightWidth: 1,
    secondaryOpacity: 1.12,
  },
  presence: {
    key: "presence",
    lightOpacity: 2.9,
    nightOpacity: 1.62,
    lightWidth: 1.26,
    nightWidth: 1.18,
    secondaryOpacity: 1.18,
    lightOpacityCap: 0.46,
    nightOpacityCap: 0.36,
    secondaryOpacityCap: 0.58,
    mobileOpacity: 1.34,
    mobileWidth: 1.14,
    mobileLightOpacityCap: 0.42,
    mobileNightOpacityCap: 0.36,
  },
};

function mix(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function resolveNarrativeTheme(theme) {
  if (theme === "night" || theme === "dawn" || theme === "dusk") return theme;
  return "light";
}

function isDarkTheme(theme) {
  return theme === "night" || theme === "dusk";
}

function sanitizeDebugParams(params = {}) {
  const density = DENSITY_PRESETS[params.density] ? params.density : "narrative";
  return {
    seed: typeof params.seed === "string" && params.seed.trim() ? params.seed.trim() : "",
    density,
    turbulence: clamp(finiteNumber(params.turbulence, 1), 0.55, 1.45),
    globalFlow: clamp(finiteNumber(params.globalFlow, 1), 0.55, 1.65),
    attractorCount: Math.round(clamp(finiteNumber(params.attractorCount, 4), 2, 5)),
    vortexStrength: clamp(finiteNumber(params.vortexStrength, 1), 0.45, 1.7),
    lineOpacity: clamp(finiteNumber(params.lineOpacity, 1), 0.55, 1.55),
    lineWidth: clamp(finiteNumber(params.lineWidth, 1), 0.72, 1.38),
    timeScale: clamp(finiteNumber(params.timeScale, 1), 0.45, 2.4),
    interactionStrength: clamp(finiteNumber(params.interactionStrength, 0.075), 0.03, 0.18),
  };
}

function withDebugPreset(basePreset, debugParams) {
  if (!debugParams) return basePreset;

  return {
    ...basePreset,
    anchors: basePreset.anchors.map((anchor) => {
      const tuning = {
        ...anchor.tuning,
        opacityLight: anchor.tuning.opacityLight * debugParams.lineOpacity,
        opacityNight: anchor.tuning.opacityNight * debugParams.lineOpacity,
        secondaryOpacity: anchor.tuning.secondaryOpacity * debugParams.lineOpacity,
        lineWidth: anchor.tuning.lineWidth * debugParams.lineWidth,
      };

      return {
        ...anchor,
        density: debugParams.density === "narrative" ? anchor.density : debugParams.density,
        mobileDensity: debugParams.density === "narrative" ? anchor.mobileDensity : debugParams.density,
        tuning,
      };
    }),
  };
}

function withDebugMode(baseMode, debugParams) {
  if (!debugParams) return baseMode;
  return {
    ...baseMode,
    timeScale: baseMode.timeScale * debugParams.timeScale,
  };
}

function smooth(t) {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function rgba(rgb, alpha) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function createGrain(width, height, palette, dpr, seed, theme, presence) {
  const grainCanvas = document.createElement("canvas");
  const grainSize = Math.max(96, Math.floor(150 * dpr));
  grainCanvas.width = grainSize;
  grainCanvas.height = grainSize;
  const grainCtx = grainCanvas.getContext("2d");
  const image = grainCtx.createImageData(grainSize, grainSize);
  const random = mulberry32(hashString(`${seed}:phase7:grain:${theme}`));

  for (let i = 0; i < image.data.length; i += 4) {
    const bright = random() > 0.5;
    const source = bright ? palette.grainLight : palette.grainDark;
    const alpha = bright ? random() * 4.6 : random() * 3.4;
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

function drawGrain(ctx, grain, width, height, theme) {
  ctx.save();
  ctx.globalAlpha = isDarkTheme(theme) ? 0.3 : 0.22;
  ctx.drawImage(grain, 0, 0, width, height);
  ctx.restore();
}

function nightMarinePresenceForTheme(theme) {
  if (theme === "night") {
    return {
      veilAlpha: 0.032,
      pointAlpha: 0.105,
      pointCountDesktop: 7,
      pointCountMobile: 4,
    };
  }
  if (theme === "dusk") {
    return {
      veilAlpha: 0.018,
      pointAlpha: 0.042,
      pointCountDesktop: 4,
      pointCountMobile: 2,
    };
  }
  return null;
}

function contentFactorForAmbientPoint(point, zones, anchor, theme) {
  if (!anchor || zones.length === 0) return 1;

  let factor = 1;
  for (const zone of zones) {
    factor = Math.min(factor, factorForZone(point, zone, anchor, theme));
  }

  return factor;
}

function drawNightMarineVeil(ctx, state, active, zonesByAnchor, now, stats) {
  const presence = nightMarinePresenceForTheme(state.theme);
  if (!presence) return;

  const random = mulberry32(hashString(`${state.seed}:night-marine-veil:${state.theme}`));
  const mobile = state.cssWidth < 680;
  const veilCount = mobile ? 1 : 2;
  const breath = state.reducedMotion ? 1 : 0.94 + Math.sin(now / 12800 + random() * Math.PI) * 0.06;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < veilCount; i += 1) {
    const x = mix(state.cssWidth * 0.12, state.cssWidth * 0.9, random());
    const y = mix(state.cssHeight * 0.08, state.cssHeight * 0.88, random());
    const radius = Math.max(state.cssWidth, state.cssHeight) * mix(0.28, 0.46, random());
    const gradient = ctx.createRadialGradient(x, y, radius * 0.08, x, y, radius);
    const alpha = presence.veilAlpha * breath * mix(0.55, 1, random());
    gradient.addColorStop(0, rgba(state.palette.accent, alpha));
    gradient.addColorStop(0.42, rgba(state.palette.secondary, alpha * 0.34));
    gradient.addColorStop(1, rgba(state.palette.primary, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.cssWidth, state.cssHeight);
  }

  ctx.restore();
  stats.nightMarineVeils = veilCount;
}

function drawNightMarineMeasurements(ctx, state, active, zonesByAnchor, now, stats) {
  const presence = nightMarinePresenceForTheme(state.theme);
  if (!presence) return;

  const random = mulberry32(hashString(`${state.seed}:night-marine-measurements:${state.theme}:${Math.round(state.cssWidth)}x${Math.round(state.cssHeight)}`));
  const mobile = state.cssWidth < 680;
  const count = mobile ? presence.pointCountMobile : presence.pointCountDesktop;
  const activeEntries = active.length ? active : [{ anchor: state.anchors[0]?.anchor, weight: 1 }];
  let drawn = 0;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < count; i += 1) {
    const entry = activeEntries[i % activeEntries.length];
    const anchorState = state.anchors.find((item) => item.anchor.key === entry.anchor?.key);
    const anchor = anchorState?.anchor ?? entry.anchor;
    const zones = zonesByAnchor.get(anchor?.key) ?? [];
    const x = mix(state.cssWidth * 0.08, state.cssWidth * 0.94, random());
    const y = mix(state.cssHeight * 0.08, state.cssHeight * 0.92, random());
    const point = { px: x, py: y };
    const contentFactor = contentFactorForAmbientPoint(point, zones, anchor, state.theme);
    const phase = random();
    const breath = state.reducedMotion ? 1 : 0.92 + Math.sin(now / mix(9800, 15400, phase) + phase * Math.PI * 2) * 0.08;
    const alpha = presence.pointAlpha * contentFactor * breath * mix(0.45, 1, random());
    const radius = mix(mobile ? 0.55 : 0.65, mobile ? 1.15 : 1.35, random());

    if (alpha < 0.012) continue;

    const halo = ctx.createRadialGradient(x, y, 0, x, y, radius * 7);
    halo.addColorStop(0, rgba(state.palette.accent, alpha * 0.16));
    halo.addColorStop(1, rgba(state.palette.accent, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, radius * 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = rgba(state.palette.accent, alpha);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    drawn += 1;
  }

  ctx.restore();
  stats.nightMarineMeasurements = drawn;
}

function drawNightMarineLayer(ctx, state, active, zonesByAnchor, now, stats) {
  drawNightMarineVeil(ctx, state, active, zonesByAnchor, now, stats);
  drawNightMarineMeasurements(ctx, state, active, zonesByAnchor, now, stats);
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

function densityForAnchor(anchor, cssWidth) {
  if (cssWidth < 680 && anchor.mobileDensity) return anchor.mobileDensity;
  return anchor.density;
}

function profileForAnchor(anchor, cssWidth) {
  return DENSITY_PRESETS[densityForAnchor(anchor, cssWidth)] ?? DENSITY_PRESETS.balanced;
}

function tuningForAnchor(anchor, cssWidth) {
  const profile = profileForAnchor(anchor, cssWidth);
  return {
    ...profile.tuning,
    ...anchor.tuning,
  };
}

function applyVisibilityProfile(tuning, theme, profile, cssWidth) {
  if (!profile || profile.key === "baseline") return tuning;
  const mobile = cssWidth < 680;
  const mobileOpacity = mobile ? (profile.mobileOpacity ?? 1) : 1;
  const mobileWidth = mobile ? (profile.mobileWidth ?? 1) : 1;
  const dark = isDarkTheme(theme);
  const opacityScale = (dark ? profile.nightOpacity : profile.lightOpacity) * mobileOpacity;
  const widthScale = (dark ? profile.nightWidth : profile.lightWidth) * mobileWidth;
  const lightOpacityCap =
    mobile && profile.mobileLightOpacityCap
      ? profile.mobileLightOpacityCap
      : profile.lightOpacityCap ?? (profile.key === "instrument" ? 0.33 : 0.255);
  const nightOpacityCap =
    mobile && profile.mobileNightOpacityCap ? profile.mobileNightOpacityCap : profile.nightOpacityCap ?? 0.235;
  const secondaryOpacityCap = profile.secondaryOpacityCap ?? 0.44;

  return {
    ...tuning,
    opacityLight: Math.min(lightOpacityCap, tuning.opacityLight * profile.lightOpacity * mobileOpacity),
    opacityNight: Math.min(nightOpacityCap, tuning.opacityNight * profile.nightOpacity * mobileOpacity),
    secondaryOpacity: Math.min(secondaryOpacityCap, tuning.secondaryOpacity * profile.secondaryOpacity * opacityScale),
    lineWidth: tuning.lineWidth * widthScale,
  };
}

function createAnchorFrameDescriptor(state, anchor, index, options = {}) {
  const density = densityForAnchor(anchor, state.cssWidth);
  const profile = DENSITY_PRESETS[density] ?? DENSITY_PRESETS.balanced;
  const tuning = applyVisibilityProfile(
    tuningForAnchor(anchor, state.cssWidth),
    state.theme,
    state.visibilityProfile,
    state.cssWidth,
  );
  const primer = options.primer === true;
  const mobileFirstImpression = state.mobileFirstImpression && state.cssWidth < 680;
  let presetTuning = primer
    ? {
        ...tuning,
        desktopLines: Math.max(42, Math.round(tuning.desktopLines * 0.22)),
        mobileLines: Math.max(18, Math.round(tuning.mobileLines * 0.36)),
        candidateRatio: Math.max(3.2, Math.min(5.2, (tuning.candidateRatio ?? profile.tuning.candidateRatio ?? 8) * 0.56)),
        minDistancePx: tuning.minDistancePx * 1.34,
        collisionLimit: Math.max(2, Math.floor(tuning.collisionLimit * 0.72)),
        minSteps: Math.max(14, Math.floor(tuning.minSteps * 0.72)),
        maxSteps: Math.max(36, Math.floor(tuning.maxSteps * 0.58)),
        minPoints: Math.max(12, Math.floor(tuning.minPoints * 0.7)),
        opacityLight: tuning.opacityLight * 0.96,
        opacityNight: tuning.opacityNight * 0.96,
      }
    : tuning;

  if (mobileFirstImpression) {
    presetTuning = {
      ...presetTuning,
      mobileLines: Math.max(presetTuning.mobileLines, Math.round(tuning.mobileLines * 1.38)),
      minDistancePx: presetTuning.minDistancePx * 0.86,
      collisionLimit: Math.max(presetTuning.collisionLimit + 1, Math.ceil(tuning.collisionLimit * 1.08)),
      lineWidth: presetTuning.lineWidth * 1.08,
      secondaryOpacity: Math.min(0.5, presetTuning.secondaryOpacity * 1.08),
    };
  }
  const fieldTime = index * state.mode.lineRefreshInterval * state.mode.timeScale;
  const seed = `${state.seed}:phase7:${anchor.key}:${density}${primer ? ":primer" : ""}`;
  const frameOptions = {
    preset: profile.basePreset,
    fieldVariant: anchor.fieldVariant,
    presetTuning,
    fieldTuning: state.fieldTuning,
    reducedMotion: state.reducedMotion,
    cssWidth: state.cssWidth,
    cssHeight: state.cssHeight,
    time: fieldTime,
  };

  return {
    anchorKey: anchor.key,
    density,
    profile,
    tuning: presetTuning,
    index,
    fieldTime,
    seed,
    primer,
    options: frameOptions,
  };
}

function createAnchorFrame(state, anchor, index) {
  const started = performance.now();
  const descriptor = createAnchorFrameDescriptor(state, anchor, index);
  const generated = generateStreamlines(state.width, state.height, descriptor.seed, descriptor.options);

  return {
    anchorKey: descriptor.anchorKey,
    density: descriptor.density,
    profile: descriptor.profile,
    tuning: descriptor.tuning,
    index: descriptor.index,
    fieldTime: descriptor.fieldTime,
    generated,
    generationMs: Math.round((performance.now() - started) * 10) / 10,
  };
}

function createAnchorFrameGenerationJob(state, anchor, index) {
  const descriptor = createAnchorFrameDescriptor(state, anchor, index);
  const job = createStreamlineGenerationJob(state.width, state.height, descriptor.seed, descriptor.options);
  let generationMs = 0;

  return {
    processBatch(batchOptions) {
      const result = job.processBatch(batchOptions);
      generationMs += result.durationMs;
      return result;
    },
    getFrame() {
      return {
        anchorKey: descriptor.anchorKey,
        density: descriptor.density,
        profile: descriptor.profile,
        tuning: descriptor.tuning,
        index: descriptor.index,
        fieldTime: descriptor.fieldTime,
        generated: job.getResult(),
        generationMs: Math.round(generationMs * 10) / 10,
      };
    },
    snapshot: () => job.snapshot(),
  };
}

function createFrameFromWorkerResult(payload) {
  return {
    anchorKey: payload.anchorKey,
    density: payload.density,
    profile: payload.profile,
    tuning: payload.tuning,
    index: payload.index,
    fieldTime: payload.fieldTime,
    generated: payload.generated,
    generationMs: payload.generationMs,
  };
}

function frameStats(frame) {
  return {
    lineCount: frame.generated.lines.length,
    pointCount: frame.generated.lines.reduce((sum, line) => sum + line.points.length, 0),
    longestLinePx: Math.round(frame.generated.lines.reduce((max, line) => Math.max(max, line.lengthPx), 0)),
  };
}

function pointsMatch(a, b, epsilon = 0.035) {
  return Math.abs(a.px - b.px) <= epsilon && Math.abs(a.py - b.py) <= epsilon;
}

function linesMatch(a, b) {
  if (!a || !b) return false;
  if (a.points.length !== b.points.length) return false;
  if (Math.abs(a.lengthPx - b.lengthPx) > 0.08) return false;

  const middleIndex = Math.floor(a.points.length / 2);
  return pointsMatch(a.points[0], b.points[0]) &&
    pointsMatch(a.points[middleIndex], b.points[middleIndex]) &&
    pointsMatch(a.points[a.points.length - 1], b.points[b.points.length - 1]);
}

function framePrefixMatches(primer, full) {
  if (!primer || !full) return null;
  const primerLines = primer.generated.lines;
  const fullLines = full.generated.lines;
  if (primerLines.length < 1 || primerLines.length > fullLines.length) return false;

  for (let i = 0; i < primerLines.length; i += 1) {
    if (!linesMatch(primerLines[i], fullLines[i])) return false;
  }

  return true;
}

function createPointerState(enabled, x, y) {
  return {
    enabled,
    active: false,
    x,
    y,
    targetX: x,
    targetY: y,
    previousX: x,
    previousY: y,
    velocityX: 0,
    velocityY: 0,
    strength: 0,
    targetStrength: 0,
    lastMoveAt: 0,
  };
}

function updatePointer(pointer, preset, now) {
  if (!pointer.enabled) return;

  if (pointer.active && now - pointer.lastMoveAt > 1400) {
    pointer.targetStrength = 0;
    pointer.active = false;
  }

  pointer.previousX = pointer.x;
  pointer.previousY = pointer.y;
  pointer.x += (pointer.targetX - pointer.x) * preset.stiffness;
  pointer.y += (pointer.targetY - pointer.y) * preset.stiffness;
  pointer.velocityX = pointer.x - pointer.previousX;
  pointer.velocityY = pointer.y - pointer.previousY;

  if (pointer.targetStrength > 0) {
    pointer.strength += (pointer.targetStrength - pointer.strength) * 0.12;
  } else {
    pointer.strength *= preset.decay;
  }

  if (pointer.strength < 0.001) pointer.strength = 0;
}

function pointPushOffset(point, pointer, preset) {
  if (!pointer.enabled || pointer.strength <= 0.001) {
    return {
      x: 0,
      y: 0,
      influence: 0,
      displacement: 0,
    };
  }

  const dx = point.px - pointer.x;
  const dy = point.py - pointer.y;
  const distance = Math.hypot(dx, dy);
  const q = distance / preset.radius;
  if (q >= 1) {
    return {
      x: 0,
      y: 0,
      influence: 0,
      displacement: 0,
    };
  }

  const safeDistance = distance || 0.0001;
  const falloff = (1 - smooth(q)) * pointer.strength;
  const maxDisplacement = preset.radius * preset.strength;
  const displacement = maxDisplacement * falloff;

  return {
    x: (dx / safeDistance) * displacement,
    y: (dy / safeDistance) * displacement,
    influence: falloff,
    displacement,
  };
}

function displacedLinePoints(line, pointer, preset, ambientOffset, stats) {
  let affectedPoints = 0;
  let totalInfluence = 0;
  let maxDisplacement = 0;
  const ambient = ambientOffset ?? { x: 0, y: 0 };
  const points = line.points.map((point) => {
    const push = pointPushOffset(point, pointer, preset);
    if (push.influence > 0.001) {
      affectedPoints += 1;
      totalInfluence += push.influence;
      maxDisplacement = Math.max(maxDisplacement, push.displacement);
    }
    return {
      ...point,
      px: point.px + ambient.x + push.x,
      py: point.py + ambient.y + push.y,
    };
  });

  if (affectedPoints > 0) {
    stats.affectedLines += 1;
    stats.affectedPoints += affectedPoints;
    stats.totalInfluence += totalInfluence;
    stats.maxDisplacementPx = Math.max(stats.maxDisplacementPx, maxDisplacement);
  }

  return points;
}

function resolveContentZones(state, anchor, rects, canvasRect) {
  if (!Array.isArray(rects) || rects.length === 0) return [];

  const mobile = state.cssWidth < 680;
  const px = mobile
    ? Math.min(CONTENT_PROTECTION.paddingX * 0.9, state.cssWidth * 0.16)
    : CONTENT_PROTECTION.paddingX;
  const py = mobile
    ? Math.min(CONTENT_PROTECTION.paddingY * 0.95, state.cssHeight * 0.075)
    : CONTENT_PROTECTION.paddingY;
  const falloff = mobile
    ? Math.min(anchor.protectionFalloff * 0.7, state.cssWidth * 0.38, state.cssHeight * 0.22)
    : anchor.protectionFalloff;
  const mobileFirstImpression = state.mobileFirstImpression && mobile;

  return rects
    .filter((rect) => rect && rect.width > 0 && rect.height > 0)
    .map((rect) => ({
      left: rect.left - canvasRect.left - px,
      top: rect.top - canvasRect.top - py,
      right: rect.right - canvasRect.left + px,
      bottom: rect.bottom - canvasRect.top + py,
      falloff: mobileFirstImpression ? Math.min(falloff, state.cssHeight * 0.1, state.cssWidth * 0.2) : falloff,
      minLight: mobileFirstImpression ? Math.max(anchor.protectionMinLight, 0.24) : anchor.protectionMinLight,
      minNight: mobileFirstImpression ? Math.max(anchor.protectionMinNight, 0.2) : anchor.protectionMinNight,
    }));
}

function factorForZone(point, zone, anchor, theme) {
  const dx = Math.max(zone.left - point.px, 0, point.px - zone.right);
  const dy = Math.max(zone.top - point.py, 0, point.py - zone.bottom);
  const distance = Math.hypot(dx, dy);
  const minFactor = isDarkTheme(theme) ? (zone.minNight ?? anchor.protectionMinNight) : (zone.minLight ?? anchor.protectionMinLight);

  if (distance <= 0.001) return minFactor;
  if (distance >= zone.falloff) return 1;
  return mix(minFactor, 1, smooth(distance / zone.falloff));
}

function contentFactorForPoint(point, zones, anchor, theme, stats) {
  if (zones.length === 0) return 1;

  let factor = 1;
  for (const zone of zones) {
    factor = Math.min(factor, factorForZone(point, zone, anchor, theme));
  }

  if (factor < 0.98) {
    stats.protectedPoints += 1;
    stats.sumContentFactor += factor;
    stats.minContentFactor = Math.min(stats.minContentFactor, factor);
  }

  return factor;
}

function lineContentFactor(line, zones, anchor, theme, stats) {
  if (zones.length === 0) return 1;

  let factor = 1;
  const stride = Math.max(1, Math.floor(line.points.length / 18));
  for (let i = 0; i < line.points.length; i += stride) {
    factor = Math.min(factor, contentFactorForPoint(line.points[i], zones, anchor, theme, stats));
  }

  const last = line.points[line.points.length - 1];
  factor = Math.min(factor, contentFactorForPoint(last, zones, anchor, theme, stats));
  if (factor < 0.98) stats.protectedLines += 1;
  return factor;
}

function lineEndpointScale(index, count) {
  if (count <= 5) return 1;
  const head = smooth(index / Math.max(1, Math.min(9, count * 0.18)));
  const tail = smooth((count - 1 - index) / Math.max(1, Math.min(9, count * 0.18)));
  return mix(0.35, 1, clamp(Math.min(head, tail), 0, 1));
}

function strokeTaperedNarrativeLine(ctx, points, primary, alpha, width, drawProgress = 1) {
  const count = points.length;
  if (count < 2) return;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const progress = clamp(drawProgress, 0, 1);
  const drawableSegments = Math.max(0, (count - 1) * progress);
  const fullSegments = Math.floor(drawableSegments);
  const partialSegment = drawableSegments - fullSegments;

  for (let i = 1; i < count && i <= fullSegments + 1; i += 1) {
    const previous = points[i - 1];
    const sourceCurrent = points[i];
    const segmentProgress = i <= fullSegments ? 1 : partialSegment;
    if (segmentProgress <= 0.001) continue;
    const current = segmentProgress >= 0.999
      ? sourceCurrent
      : {
          px: mix(previous.px, sourceCurrent.px, segmentProgress),
          py: mix(previous.py, sourceCurrent.py, segmentProgress),
        };
    const segmentScale = Math.min(lineEndpointScale(i - 1, count), lineEndpointScale(i, count));
    if (segmentScale <= 0.018) continue;

    ctx.strokeStyle = rgba(primary, alpha * segmentScale * smooth(segmentProgress));
    ctx.lineWidth = width * mix(0.68, 1, segmentScale);
    ctx.beginPath();
    ctx.moveTo(previous.px, previous.py);
    ctx.lineTo(current.px, current.py);
    ctx.stroke();
  }
}

function strokeNarrativeLine(
  ctx,
  line,
  frame,
  anchor,
  palette,
  theme,
  opacityScale,
  zones,
  stats,
  pointer,
  interactionPreset,
  lineOpacityScale = 1,
  ambientOffset = null,
  lineDrawProgress = 1,
) {
  if (opacityScale <= 0.001 || lineOpacityScale <= 0.001 || line.points.length < 2) return;

  const contentFactor = lineContentFactor(line, zones, anchor, theme, stats);
  if (contentFactor <= 0.012) return;

  const preset = frame.tuning;
  const primary = line.phase > 0.84 ? palette.secondary : palette.primary;
  const alphaBase = isDarkTheme(theme) ? preset.opacityNight : preset.opacityLight;
  const local = clamp(line.density * 0.6 + line.energy * 0.4, 0, 1);
  const opening = pointer.enabled ? 1 - pointer.strength * interactionPreset.opening : 1;
  const displacedPoints = displacedLinePoints(line, pointer, interactionPreset, ambientOffset, stats);
  const alpha =
    alphaBase *
    mix(0.34, 0.94, local) *
    mix(0.9, 1.04, line.phase) *
    opacityScale *
    lineOpacityScale *
    anchor.opacityScale *
    contentFactor *
    opening;
  const width = preset.lineWidth * mix(0.78, 1.12, local);

  ctx.save();
  strokeTaperedNarrativeLine(ctx, displacedPoints, primary, alpha, width, lineDrawProgress);

  if (line.phase > 0.78 && frame.density !== "open") {
    strokeTaperedNarrativeLine(ctx, displacedPoints, palette.accent, alpha * preset.secondaryOpacity * 0.42, width * 0.5, lineDrawProgress);
  }

  ctx.restore();
}

function signaturePulse(progress) {
  const p = clamp(progress, 0, 1);
  const decision = Math.exp(-Math.pow((p - 0.42) / 0.18, 2));
  const anticipation = Math.exp(-Math.pow((p - 0.78) / 0.16, 2));
  return clamp(0.18 + decision * 0.58 + anticipation * 0.42, 0, 1);
}

function signatureFocus(state, progress) {
  const p = clamp(progress, 0, 1);
  const mobile = state.cssWidth < 680;
  const x = mobile
    ? mix(state.cssWidth * 0.74, state.cssWidth * 0.64, smooth(p))
    : mix(state.cssWidth * 0.82, state.cssWidth * 0.42, smooth((p - 0.24) / 0.66));
  const y = mobile
    ? mix(state.cssHeight * 0.68, state.cssHeight * 0.76, smooth(p))
    : mix(state.cssHeight * 0.42, state.cssHeight * 0.7, smooth(p));

  return { x, y };
}

function drawSignatureFragment(ctx, line, pointIndex, focus, palette, theme, alpha, widthScale, offset = 0) {
  const point = line.points[pointIndex];
  const previous = line.points[Math.max(0, pointIndex - 2)];
  const next = line.points[Math.min(line.points.length - 1, pointIndex + 2)];
  const dx = next.px - previous.px;
  const dy = next.py - previous.py;
  const length = Math.hypot(dx, dy) || 1;
  const tx = dx / length;
  const ty = dy / length;
  const nx = -ty;
  const ny = tx;
  const half = mix(11, 24, clamp(line.energy, 0, 1));
  const pull = clamp(1 - Math.hypot(point.px - focus.x, point.py - focus.y) / 240, 0, 1);
  const bend = pull * 8;

  ctx.strokeStyle = rgba(isDarkTheme(theme) ? palette.secondary : palette.primary, alpha);
  ctx.lineWidth = widthScale * mix(0.72, 1.16, clamp(line.density, 0, 1));
  ctx.beginPath();
  ctx.moveTo(point.px - tx * half + nx * offset, point.py - ty * half + ny * offset);
  ctx.quadraticCurveTo(point.px + nx * (offset + bend), point.py + ny * (offset + bend), point.px + tx * half + nx * offset, point.py + ty * half + ny * offset);
  ctx.stroke();
}

function drawDecisionSignature(ctx, state, active, contentRects, canvasRect, now, stats) {
  if (state.reducedMotion || state.cssWidth < 360) return;

  const pulse = signaturePulse(state.narrativeProgress);
  if (pulse <= 0.05) return;

  const focus = signatureFocus(state, state.narrativeProgress);
  const mobile = state.cssWidth < 680;
  const radius = mobile ? 170 : 290;
  const maxFragments = mobile ? 5 : 11;
  const zones = contentRects.length > 0 && canvasRect
    ? contentRects.map((rect) => ({
        left: rect.left - canvasRect.left - 36,
        top: rect.top - canvasRect.top - 30,
        right: rect.right - canvasRect.left + 36,
        bottom: rect.bottom - canvasRect.top + 30,
        falloff: 180,
        minLight: 0,
        minNight: 0,
      }))
    : [];
  const candidates = [];

  for (const entry of active) {
    const anchorState = state.anchors.find((item) => item.anchor.key === entry.anchor.key);
    const frame = anchorState?.current ?? anchorState?.primer;
    if (!frame || entry.weight <= 0.001) continue;

    const stride = Math.max(1, Math.floor(frame.generated.lines.length / 92));
    for (let lineIndex = 0; lineIndex < frame.generated.lines.length; lineIndex += stride) {
      const line = frame.generated.lines[lineIndex];
      if (!line || line.points.length < 8) continue;

      const pointIndex = Math.floor(line.points.length * mix(0.35, 0.68, line.phase));
      const point = line.points[pointIndex];
      const distance = Math.hypot(point.px - focus.x, point.py - focus.y);
      if (distance > radius) continue;
      if (zones.length && contentFactorForPoint(point, zones, anchorState.anchor, state.theme, stats) < 0.92) continue;

      const score = (1 - distance / radius) * 0.64 + clamp(line.energy, 0, 1) * 0.22 + clamp(line.density, 0, 1) * 0.14;
      candidates.push({ line, pointIndex, score, distance, weight: entry.weight });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  if (candidates.length === 0) return;

  const palette = state.palette;
  const alphaBase = (isDarkTheme(state.theme) ? 0.2 : 0.17) * pulse;
  const widthScale = mobile ? 0.58 : 0.82;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const markerAlpha = (isDarkTheme(state.theme) ? 0.18 : 0.15) * pulse;
  const markerColor = isDarkTheme(state.theme) ? palette.secondary : palette.primary;
  const angle = mix(-0.28, 0.42, smooth(state.narrativeProgress)) + Math.sin(now / 18000) * 0.035;
  const tx = Math.cos(angle);
  const ty = Math.sin(angle);
  const nx = -ty;
  const ny = tx;
  const markerLength = mobile ? 18 : 28;
  const markerGap = mobile ? 5.2 : 7.5;
  ctx.strokeStyle = rgba(markerColor, markerAlpha);
  ctx.lineWidth = mobile ? 0.58 : 0.72;
  for (let i = -1; i <= 1; i += 1) {
    const cx = focus.x + nx * markerGap * i;
    const cy = focus.y + ny * markerGap * i;
    ctx.beginPath();
    ctx.moveTo(cx - tx * markerLength * 0.5, cy - ty * markerLength * 0.5);
    ctx.lineTo(cx + tx * markerLength * 0.5, cy + ty * markerLength * 0.5);
    ctx.stroke();
  }

  const count = Math.min(maxFragments, candidates.length);
  for (let i = 0; i < count; i += 1) {
    const candidate = candidates[i];
    const alpha = alphaBase * candidate.weight * mix(0.55, 1, candidate.score);
    drawSignatureFragment(ctx, candidate.line, candidate.pointIndex, focus, palette, state.theme, alpha, widthScale, i % 2 ? 1.6 : -1.2);
  }

  const pointAlpha = alphaBase * 0.92;
  ctx.fillStyle = rgba(isDarkTheme(state.theme) ? palette.accent : palette.secondary, pointAlpha);
  for (let i = 0; i < Math.min(3, candidates.length); i += 1) {
    const point = candidates[i].line.points[candidates[i].pointIndex];
    const r = mobile ? 1.15 : 1.35;
    ctx.beginPath();
    ctx.arc(point.px, point.py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  stats.signatureFragments = count;
  stats.signaturePulse = Math.round(pulse * 1000) / 1000;
}

function birthProgressForAnchor(anchorState, now) {
  if (!anchorState.birthStartedAt || !anchorState.current) return 1;
  return smooth((now - anchorState.birthStartedAt) / Math.max(1, anchorState.birthDurationMs));
}

function startFrameBirth(anchorState, baseLineCount = 0, durationMs) {
  anchorState.birthStartedAt = performance.now();
  anchorState.birthBaseLineCount = Math.max(0, Math.round(baseLineCount));
  anchorState.birthDurationMs = durationMs;
}

function birthLineOpacityScale(anchorState, line, lineIndex, birthProgress) {
  const baseLineCount = anchorState.birthBaseLineCount || 0;
  if (!anchorState.current || birthProgress >= 1 || lineIndex < baseLineCount) return 1;
  if (anchorState.birthRevealMode !== "staggered") return Math.max(0.08, birthProgress);

  const fullLineCount = anchorState.current.generated.lines.length;
  const addedLineCount = Math.max(1, fullLineCount - baseLineCount);
  const addedIndex = Math.max(0, lineIndex - baseLineCount);
  const order = addedLineCount <= 1 ? 0 : addedIndex / Math.max(1, addedLineCount - 1);
  const density = Number.isFinite(line.density) ? line.density : 0.5;
  const energy = Number.isFinite(line.energy) ? line.energy : 0.5;
  const phase = Number.isFinite(line.phase) ? line.phase : 0.5;
  const structuralConfidence = clamp(density * 0.58 + energy * 0.34 + (1 - Math.abs(phase - 0.5) * 2) * 0.08, 0, 1);
  const revealStart = clamp(order * 0.7 + (1 - structuralConfidence) * 0.2 + (phase - 0.5) * 0.06, 0, 0.84);
  const surveyTrace = smooth((birthProgress - revealStart * 0.72) / 0.52) * 0.035;
  const materialized = smooth((birthProgress - revealStart) / 0.34);

  return Math.max(surveyTrace, materialized);
}

function birthEffectiveLineCount(anchorState, birthProgress) {
  if (!anchorState.current || birthProgress >= 1) return anchorState.current?.generated.lines.length ?? 0;

  let weightedLines = 0;
  for (let lineIndex = 0; lineIndex < anchorState.current.generated.lines.length; lineIndex += 1) {
    const line = anchorState.current.generated.lines[lineIndex];
    weightedLines += clamp(birthLineOpacityScale(anchorState, line, lineIndex, birthProgress), 0, 1);
  }

  return Math.round(weightedLines);
}

function birthVisibleLineCount(anchorState, birthProgress) {
  if (!anchorState.current || birthProgress >= 1) return anchorState.current?.generated.lines.length ?? 0;

  let visibleLines = 0;
  for (let lineIndex = 0; lineIndex < anchorState.current.generated.lines.length; lineIndex += 1) {
    const line = anchorState.current.generated.lines[lineIndex];
    if (birthLineOpacityScale(anchorState, line, lineIndex, birthProgress) >= 0.5) visibleLines += 1;
  }

  return visibleLines;
}

function longBreathScale(anchorState, line, now) {
  if (anchorState.longBreathMode !== "confidence" || !anchorState.current) return 1;
  if (birthProgressForAnchor(anchorState, now) < 1) return 1;

  const density = Number.isFinite(line.density) ? line.density : 0.5;
  const energy = Number.isFinite(line.energy) ? line.energy : 0.5;
  const phase = Number.isFinite(line.phase) ? line.phase : 0.5;
  const confidence = clamp(density * 0.52 + energy * 0.36 + (1 - Math.abs(phase - 0.5) * 2) * 0.12, 0, 1);
  const periodMs = mix(9200, 14600, phase);
  const localTime = (now + phase * 5300 + density * 1800) / periodMs;
  const wave = Math.sin(localTime * Math.PI * 2);
  const amplitude = 0.018 + confidence * 0.02;

  return clamp(1 + wave * amplitude, 0.955, 1.045);
}

function ambientLineOffset(anchorState, line, lineIndex, now, state, stats) {
  const profile = state.ambientMotionProfile;
  if (state.reducedMotion || !profile || profile.key !== "weather") return null;
  if (birthProgressForAnchor(anchorState, now) < 1) return null;

  const density = Number.isFinite(line.density) ? line.density : 0.5;
  const energy = Number.isFinite(line.energy) ? line.energy : 0.5;
  const phase = Number.isFinite(line.phase) ? line.phase : 0.5;
  const mobile = state.cssWidth < 680;
  const baseAmplitude = mobile ? profile.amplitudeMobile : profile.amplitudeDesktop;
  const fieldEnergy = clamp(density * 0.42 + energy * 0.44 + (1 - Math.abs(phase - 0.5) * 2) * 0.14, 0, 1);
  const amplitude = baseAmplitude * mix(0.42, 1, fieldEnergy);
  const period = mix(profile.periodMinMs, profile.periodMaxMs, (phase * 0.71 + density * 0.29) % 1);
  const localTime = (now + phase * 9200 + density * 3100 + lineIndex * 137) / period;
  const angle = phase * Math.PI * 2 + density * 1.7 + Math.sin(localTime * Math.PI * 2) * 0.44;
  const primaryWave = Math.sin(localTime * Math.PI * 2);
  const secondaryWave = Math.cos(localTime * Math.PI * 2 * 0.63 + energy * Math.PI * 2);
  const x = Math.cos(angle) * amplitude * primaryWave + Math.cos(angle + Math.PI * 0.5) * profile.secondaryAmplitude * secondaryWave;
  const y = Math.sin(angle) * amplitude * primaryWave + Math.sin(angle + Math.PI * 0.5) * profile.secondaryAmplitude * secondaryWave;
  const displacement = Math.hypot(x, y);

  stats.ambientMotionLines += 1;
  stats.ambientMotionMaxPx = Math.max(stats.ambientMotionMaxPx, displacement);
  stats.ambientMotionSumPx += displacement;

  return { x, y };
}

function drawAnchorFrame(ctx, anchorState, palette, theme, opacityScale, zones, stats, pointer, interactionPreset, now, state, lineStride = 1) {
  const baseFrame = anchorState.current ?? anchorState.primer;
  if (!baseFrame) return;

  const frames = [baseFrame];
  const opacities = [1];
  const birthProgress = birthProgressForAnchor(anchorState, now);

  for (let frameIndex = 0; frameIndex < frames.length; frameIndex += 1) {
    const frame = frames[frameIndex];
    const frameOpacity = opacityScale * opacities[frameIndex];
    for (let lineIndex = 0; lineIndex < frame.generated.lines.length; lineIndex += lineStride) {
      const line = frame.generated.lines[lineIndex];
      const isCurrentBirthFrame = frame === anchorState.current && birthProgress < 1;
      const birthDrawProgress = isCurrentBirthFrame ? birthLineOpacityScale(anchorState, line, lineIndex, birthProgress) : 1;
      const breathScale = frame === anchorState.current ? longBreathScale(anchorState, line, now) : 1;
      const ambientOffset = frame === anchorState.current ? ambientLineOffset(anchorState, line, lineIndex, now, state, stats) : null;
      const lineOpacityScale = breathScale;
      strokeNarrativeLine(
        ctx,
        line,
        frame,
        anchorState.anchor,
        palette,
        theme,
        frameOpacity,
        zones,
        stats,
        pointer,
        interactionPreset,
        lineOpacityScale,
        ambientOffset,
        birthDrawProgress,
      );
    }
  }
}

function zoneAreaRatio(zones, width, height) {
  if (zones.length === 0) return 0;
  let area = 0;
  for (const zone of zones) {
    const w = clamp(zone.right, 0, width) - clamp(zone.left, 0, width);
    const h = clamp(zone.bottom, 0, height) - clamp(zone.top, 0, height);
    area += Math.max(0, w) * Math.max(0, h);
  }
  return clamp(area / Math.max(1, width * height), 0, 1);
}

function activeAnchorBlend(progress, anchors) {
  const p = clamp(progress, 0, 1);

  for (let i = 0; i < anchors.length - 1; i += 1) {
    const from = anchors[i];
    const to = anchors[i + 1];
    if (p <= to.progress || i === anchors.length - 2) {
      const local = smooth((p - from.progress) / Math.max(0.001, to.progress - from.progress));
      return {
        from,
        to,
        fromWeight: 1 - local,
        toWeight: local,
        local,
      };
    }
  }

  const last = anchors[anchors.length - 1];
  return { from: last, to: last, fromWeight: 1, toWeight: 0, local: 1 };
}

function advanceNarrativeProgress(state, now) {
  const delta = state.targetProgress - state.narrativeProgress;
  if (Math.abs(delta) < 0.0008) {
    state.narrativeProgress = state.targetProgress;
    return;
  }

  const elapsedMs = state.lastFrameAt > 0 ? now - state.lastFrameAt : 16.7;
  const dt = clamp(elapsedMs / 1000, 1 / 120, 1 / 24);
  const distance = Math.abs(delta);
  const velocityFactor = clamp(state.scrollVelocity / 2.2, 0, 1);
  const jumpFactor = clamp((distance - 0.08) / 0.3, 0, 1);
  const glide = Math.max(velocityFactor, jumpFactor);
  const upward = delta < 0;
  const response = upward ? mix(4.8, 7.2, glide) : mix(3.4, 5.6, glide);
  const maxStepPerSecond = upward ? mix(0.52, 0.86, glide) : mix(0.36, 0.62, glide);
  const easedStep = delta * (1 - Math.exp(-response * dt));
  const maxStep = maxStepPerSecond * dt;

  state.narrativeProgress += clamp(easedStep, -maxStep, maxStep);
}

function blendPairKey(entries) {
  return entries.map((entry) => entry.anchor.key).join(">");
}

function combineBlendEntries(previous, next, t) {
  if (!previous || previous.length === 0 || t >= 0.995) return next;
  const byKey = new Map();

  for (const entry of previous) {
    byKey.set(entry.anchor.key, {
      anchor: entry.anchor,
      weight: entry.weight * (1 - t),
    });
  }

  for (const entry of next) {
    const existing = byKey.get(entry.anchor.key);
    if (existing) existing.weight += entry.weight * t;
    else byKey.set(entry.anchor.key, { anchor: entry.anchor, weight: entry.weight * t });
  }

  const total = [...byKey.values()].reduce((sum, entry) => sum + entry.weight, 0) || 1;
  return [...byKey.values()]
    .map((entry) => ({ ...entry, weight: entry.weight / total }))
    .filter((entry) => entry.weight > 0.01);
}

function mixBlendEntries(base, overlay, amount) {
  const t = clamp(amount, 0, 1);
  if (t <= 0.001 || overlay.length === 0) return base;
  const byKey = new Map();

  for (const entry of base) {
    byKey.set(entry.anchor.key, {
      anchor: entry.anchor,
      weight: entry.weight * (1 - t),
    });
  }

  for (const entry of overlay) {
    const existing = byKey.get(entry.anchor.key);
    if (existing) existing.weight += entry.weight * t;
    else byKey.set(entry.anchor.key, { anchor: entry.anchor, weight: entry.weight * t });
  }

  return [...byKey.values()].filter((entry) => entry.weight > 0.01);
}

export function getNarrativeState(scrollProgress, options = {}) {
  const preset = NARRATIVE_PRESETS[options.preset] ?? NARRATIVE_PRESETS.clarification;
  const anchors = preset.anchors;
  const progress = clamp(scrollProgress, 0, 1);
  const blend = activeAnchorBlend(progress, anchors);
  const clarified = smooth(progress);
  const stage =
    progress < 0.34 ? "beginning" : progress < 0.72 ? "middle" : "end";

  return {
    preset: "clarification",
    label: preset.label,
    progress: Math.round(progress * 1000) / 1000,
    stage,
    from: blend.from.key,
    to: blend.to.key,
    blend: Math.round(blend.local * 1000) / 1000,
    density:
      blend.toWeight > 0.66
        ? blend.to.density
        : blend.fromWeight > 0.66
          ? blend.from.density
          : `${blend.from.density}->${blend.to.density}`,
    complexity: Math.round(mix(0.88, 0.18, clarified) * 1000) / 1000,
    turbulence: Math.round(mix(0.74, 0.16, clarified) * 1000) / 1000,
    structure: Math.round(mix(0.28, 0.9, clarified) * 1000) / 1000,
    attractorCount: Math.round(mix(5, 4, clarified)),
    globalFlow: Math.round(mix(0.2, 0.46, clarified) * 1000) / 1000,
    contrast: Math.round(mix(0.9, 0.62, clarified) * 1000) / 1000,
    speed: Math.round(mix(0.00005, 0.00003, clarified) * 1000000) / 1000000,
  };
}

export function createNarrativeField(canvas, options = {}) {
  const theme = resolveNarrativeTheme(options.theme);
  const presetKey = NARRATIVE_PRESETS[options.preset] ? options.preset : "clarification";
  const debugParams = options.debugParams ? sanitizeDebugParams(options.debugParams) : null;
  const preset = withDebugPreset(NARRATIVE_PRESETS[presetKey], debugParams);
  const visibilityProfile =
    NARRATIVE_VISIBILITY_PROFILES[options.visibilityProfile] ?? NARRATIVE_VISIBILITY_PROFILES.baseline;
  const modeKey = ANIMATION_MODES[options.mode] ? options.mode : "glacial";
  const mode = withDebugMode(ANIMATION_MODES[modeKey], debugParams);
  const interactionKey = NARRATIVE_INTERACTION_PRESETS[options.interaction] ? options.interaction : null;
  const interactionPresetBase = interactionKey ? NARRATIVE_INTERACTION_PRESETS[interactionKey] : NARRATIVE_INTERACTION_PRESETS.softRepel;
  const interactionPreset = {
    ...interactionPresetBase,
    strength: debugParams?.interactionStrength ?? interactionPresetBase.strength,
  };
  const seed = debugParams?.seed || options.seed || "PHASE7";
  const reducedMotion = Boolean(options.reducedMotion);
  const lockedProgress = options.lockProgress === true;
  const generationStrategy =
    options.generationStrategy === "worker-visible"
      ? "worker-visible"
      : options.generationStrategy === "visible-batched"
      ? "visible-batched"
      : options.generationStrategy === "visible-first"
        ? "visible-first"
        : "eager";
  const workerPrewarmEnabled = generationStrategy === "worker-visible" && options.workerPrewarm === true;
  const initialPrimerEnabled = generationStrategy === "worker-visible" && options.initialPrimer === true && !reducedMotion;
  const initialPrimerMode = options.initialPrimerMode === "progressive" ? "progressive" : "separate";
  const progressivePrimerEnabled = initialPrimerEnabled && initialPrimerMode === "progressive";
  const birthRevealDurationMs = clamp(finiteNumber(options.birthRevealDurationMs, 1450), 520, 2600);
  const birthRevealMode = options.birthRevealMode === "staggered" ? "staggered" : "uniform";
  const longBreathMode = !reducedMotion && options.longBreathMode === "confidence" ? "confidence" : "off";
  const ambientMotionMode = !reducedMotion && options.ambientMotionMode === "weather" ? "weather" : "off";
  const ambientMotionProfile = AMBIENT_MOTION_PROFILES[ambientMotionMode];
  const mobileFirstImpression = options.mobileFirstImpression === true;
  const requestedPrewarmStrategy = options.prewarmStrategy === "idle-batched" ? "idle-batched" : options.prewarmStrategy;
  const prewarmStrategy =
    generationStrategy !== "eager" && (requestedPrewarmStrategy === "idle" || requestedPrewarmStrategy === "idle-batched")
      ? requestedPrewarmStrategy
      : "none";
  const initialProgress = clamp(options.progress ?? 0, 0, 1);
  const ctx = canvas.getContext("2d", { alpha: false });
  const size = configureCanvas(canvas, options.maxDpr ?? mode.maxDpr);
  const palette = PALETTES[theme];
  const finePointer = window.matchMedia?.("(pointer: fine)")?.matches ?? true;
  const pointerEnabled =
    Boolean(interactionKey) &&
    !reducedMotion &&
    size.cssWidth >= 680 &&
    (options.pointerEnabled ?? finePointer);

  const state = {
    ...size,
    canvas,
    ctx,
    seed,
    theme,
    presetKey,
    preset,
    visibilityProfile,
    modeKey,
    mode,
    interactionKey,
    interactionPreset,
    palette,
    debugParams,
    fieldTuning: debugParams
      ? {
          attractorCount: debugParams.attractorCount,
          globalFlowMultiplier: debugParams.globalFlow,
          curlMultiplier: debugParams.turbulence,
          vortexStrengthMultiplier: debugParams.vortexStrength,
        }
      : null,
    reducedMotion,
    generationStrategy,
    prewarmStrategy,
    workerPrewarmEnabled,
    initialPrimerEnabled,
    initialPrimerMode,
    progressivePrimerEnabled,
    birthRevealDurationMs,
    birthRevealMode,
    longBreathMode,
    ambientMotionMode,
    ambientMotionProfile,
    mobileFirstImpression,
    pointerEnabled,
    pointer: createPointerState(pointerEnabled, size.cssWidth * 0.58, size.cssHeight * 0.48),
    attachPointerEvents: options.attachPointerEvents !== false,
    lockedProgress,
    contentProvider: options.contentProvider,
    targetProgress: initialProgress,
    narrativeProgress: initialProgress,
    lastScrollTargetAt: performance.now(),
    lastScrollTargetProgress: initialProgress,
    scrollVelocity: 0,
    lastBlendPairKey: "",
    lastBlendEntries: null,
    previousBlendEntries: null,
    blendPairChangedAt: 0,
    grain: createGrain(size.width, size.height, palette, size.dpr, seed, theme),
    anchors: [],
    raf: 0,
    running: false,
    createdAt: performance.now(),
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
    initialGenerationMs: 0,
    deferredGenerationMs: 0,
    deferredGenerationCount: 0,
    deferredAnchorKeys: [],
    initialVisibleQueue: [],
    initialVisibleActiveJob: null,
    initialVisibleHandle: 0,
    initialVisibleGeneratedCount: 0,
    initialVisibleGenerationMs: 0,
    initialVisibleMaxTaskMs: 0,
    initialVisibleBatchCount: 0,
    initialVisibleProcessedCandidates: 0,
    initialVisibleCompleted: generationStrategy !== "visible-batched" && generationStrategy !== "worker-visible",
    firstVisibleCommitMs: 0,
    firstPrimerCommitMs: 0,
    initialPrimerGeneratedCount: 0,
    initialPrimerGenerationMs: 0,
    initialPrimerRoundTripMs: 0,
    initialPrimerMaxRoundTripMs: 0,
    initialPrimerMessageCount: 0,
    progressivePrimerSharedCount: 0,
    progressivePrimerMismatchCount: 0,
    prewarmQueue: [],
    prewarmActiveJob: null,
    prewarmHandle: 0,
    worker: null,
    workerTaskId: 0,
    workerPending: new Map(),
    workerGeneratedCount: 0,
    workerGenerationMs: 0,
    workerRoundTripMs: 0,
    workerMaxRoundTripMs: 0,
    workerMessageCount: 0,
    workerError: "",
    workerFallbackActive: false,
    workerFallbackReason: "",
    workerUrl: options.workerUrl,
    workerPrewarmGeneratedCount: 0,
    workerPrewarmGenerationMs: 0,
    workerPrewarmRoundTripMs: 0,
    workerPrewarmMaxRoundTripMs: 0,
    workerPrewarmMessageCount: 0,
    prewarmGeneratedCount: 0,
    prewarmGenerationMs: 0,
    prewarmMaxTaskMs: 0,
    prewarmBatchCount: 0,
    prewarmProcessedCandidates: 0,
    prewarmBatchBudgetMs: clamp(finiteNumber(options.prewarmBatchBudgetMs, 7), 3, 14),
    prewarmBatchCandidateLimit: Math.round(clamp(finiteNumber(options.prewarmBatchCandidateLimit, 42), 12, 96)),
    prewarmBatchDelayMs: clamp(finiteNumber(options.prewarmBatchDelayMs, 16), 8, 48),
    prewarmCompleted: prewarmStrategy === "none",
    lastNarrativeStats: {
      protectedLines: 0,
      protectedPoints: 0,
      sumContentFactor: 0,
      minContentFactor: 1,
      zoneAreaRatio: 0,
      zoneCount: 0,
      linePasses: 0,
      pointPasses: 0,
      affectedLines: 0,
      affectedPoints: 0,
      maxDisplacementPx: 0,
      totalInfluence: 0,
      signatureFragments: 0,
      signaturePulse: 0,
      nightMarineVeils: 0,
      nightMarineMeasurements: 0,
      ambientMotionLines: 0,
      ambientMotionMaxPx: 0,
      ambientMotionSumPx: 0,
    },
  };

  function updateDataset(snapshot) {
    canvas.dataset.phase = "7";
    canvas.dataset.seed = snapshot.seed;
    canvas.dataset.theme = snapshot.theme;
    canvas.dataset.mode = snapshot.modeKey;
    canvas.dataset.progress = String(snapshot.progress);
    canvas.dataset.targetProgress = String(snapshot.targetProgress);
    canvas.dataset.scrollVelocity = String(snapshot.scrollVelocity);
    canvas.dataset.stage = snapshot.stage;
    canvas.dataset.density = snapshot.density;
    canvas.dataset.from = snapshot.from;
    canvas.dataset.to = snapshot.to;
    canvas.dataset.blend = String(snapshot.blend);
    canvas.dataset.complexity = String(snapshot.complexity);
    canvas.dataset.structure = String(snapshot.structure);
    canvas.dataset.protectedLines = String(snapshot.protectedLines);
    canvas.dataset.protectedPoints = String(snapshot.protectedPoints);
    canvas.dataset.linePasses = String(snapshot.linePasses);
    canvas.dataset.pointPasses = String(snapshot.pointPasses);
    canvas.dataset.avgDrawMs = String(snapshot.avgDrawMs);
    canvas.dataset.maxDrawMs = String(snapshot.maxDrawMs);
    canvas.dataset.reducedMotion = String(snapshot.reducedMotion);
    canvas.dataset.pointerEnabled = String(snapshot.pointerEnabled);
    canvas.dataset.pointerStrength = String(snapshot.pointerStrength);
    canvas.dataset.affectedLines = String(snapshot.affectedLines);
  }

  function generateInitialAnchors() {
    const started = performance.now();
    const initialBlend = activeAnchorBlend(state.narrativeProgress, preset.anchors);
    const visibleInitialKeys = new Set(
      [
        { anchor: initialBlend.from, weight: initialBlend.fromWeight },
        { anchor: initialBlend.to, weight: initialBlend.toWeight },
      ]
        .filter((entry, index, entries) => entry.weight > 0.001 && (index === 0 || entry.anchor.key !== entries[0].anchor.key))
        .map((entry) => entry.anchor.key),
    );
    const generateNext = !reducedMotion && !(lockedProgress && generationStrategy === "visible-first");

    state.anchors = preset.anchors.map((anchor) => {
      const isVisibleInitial = visibleInitialKeys.has(anchor.key);
      const shouldGenerateNow = generationStrategy === "eager" || (generationStrategy === "visible-first" && isVisibleInitial);
      const current = shouldGenerateNow ? createAnchorFrame(state, anchor, 0) : null;
      const next = shouldGenerateNow && generateNext ? createAnchorFrame(state, anchor, 1) : null;
      if (current) state.generationCount += 1;
      if (next) state.generationCount += 1;
      state.lastGenerationMs = Math.max(state.lastGenerationMs, current?.generationMs ?? 0, next?.generationMs ?? 0);
      if (!shouldGenerateNow && !isVisibleInitial) state.deferredAnchorKeys.push(anchor.key);
      return {
        anchor,
        current,
        next,
        primer: null,
        birthStartedAt: 0,
        birthBaseLineCount: 0,
        birthDurationMs: state.birthRevealDurationMs,
        birthRevealMode: state.birthRevealMode,
        longBreathMode: state.longBreathMode,
        primerSharesFullPrefix: null,
        visibleInitial: isVisibleInitial,
        frameIndex: next ? 1 : 0,
        frameBlend: 0,
      };
    });

    state.initialGenerationMs = Math.round((performance.now() - started) * 10) / 10;
    state.initialVisibleQueue =
      generationStrategy === "visible-batched" || generationStrategy === "worker-visible"
        ? state.anchors.filter((anchorState) => anchorState.visibleInitial && !anchorState.current)
        : [];
    state.prewarmQueue = state.anchors.filter(
      (anchorState) => !anchorState.current || (!lockedProgress && !reducedMotion && !anchorState.next),
    );
  }

  function generateAnchorFrames(anchorState, includeNext) {
    let generated = 0;
    if (!anchorState.current) {
      anchorState.current = createAnchorFrame(state, anchorState.anchor, anchorState.frameIndex);
      startFrameBirth(anchorState, 0, state.birthRevealDurationMs);
      state.generationCount += 1;
      state.lastGenerationMs = Math.max(state.lastGenerationMs, anchorState.current.generationMs);
      generated += 1;
    }

    if (includeNext && !reducedMotion && !anchorState.next) {
      anchorState.next = createAnchorFrame(state, anchorState.anchor, anchorState.frameIndex + 1);
      anchorState.frameIndex += 1;
      state.generationCount += 1;
      state.lastGenerationMs = Math.max(state.lastGenerationMs, anchorState.next.generationMs);
      generated += 1;
    }

    return generated;
  }

  function ensureAnchorFrames(anchorState, reason) {
    const started = performance.now();
    const deferNextGeneration = generationStrategy === "visible-batched" || generationStrategy === "worker-visible";
    const generated = generateAnchorFrames(anchorState, !lockedProgress && !deferNextGeneration);
    if (generated > 0) {
      state.deferredGenerationCount += generated;
      state.deferredGenerationMs += performance.now() - started;
    }
    if (deferNextGeneration && anchorState.current && !anchorState.next && !lockedProgress && !reducedMotion) {
      queuePrewarmAnchor(anchorState);
    }
  }

  function requestIdle(callback) {
    if (typeof window.requestIdleCallback === "function") {
      return window.requestIdleCallback(callback, { timeout: 900 });
    }
    return window.setTimeout(() => callback({ timeRemaining: () => 0, didTimeout: true }), 260);
  }

  function cancelIdle(handle) {
    if (!handle) return;
    if (typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(handle);
    } else {
      window.clearTimeout(handle);
    }
  }

  function workerPendingEntries(phase) {
    return [...state.workerPending.values()].filter((pending) => !phase || pending.phase === phase);
  }

  function workerPendingCount(phase) {
    return workerPendingEntries(phase).length;
  }

  function workerInitialPendingCount() {
    return workerPendingEntries().filter((pending) => pending.phase === "initial" || pending.phase === "initial-progressive").length;
  }

  function hasPendingWorkerFrame(anchorState, kind) {
    return workerPendingEntries().some((pending) => pending.anchorState === anchorState && (!kind || pending.kind === kind));
  }

  function hasPendingPrewarmFrame(anchorState) {
    return workerPendingEntries("prewarm").some((pending) => pending.anchorState === anchorState);
  }

  function requeueWorkerPending(pending) {
    if (!pending?.anchorState) return;
    if (pending.phase === "primer") return;
    if (pending.phase === "initial" || pending.phase === "initial-progressive") {
      if (!pending.anchorState.current && !state.initialVisibleQueue.includes(pending.anchorState)) {
        state.initialVisibleQueue.unshift(pending.anchorState);
      }
      return;
    }

    if (pending.phase === "prewarm" && hasPrewarmWork(pending.anchorState)) {
      if (pending.kind === "current") {
        state.prewarmQueue.unshift(pending.anchorState);
      } else {
        state.prewarmQueue.push(pending.anchorState);
      }
      state.prewarmCompleted = false;
    }
  }

  function completeWorkerPrimerFrame(pending, frame) {
    const { anchorState } = pending;
    const roundTripMs = performance.now() - pending.started;

    state.initialPrimerMessageCount += 1;

    if (!anchorState.current && !anchorState.primer) {
      anchorState.primer = frame;
      state.lastGenerationMs = Math.max(state.lastGenerationMs, frame.generationMs);
      state.initialPrimerGeneratedCount += 1;
      state.initialPrimerGenerationMs += frame.generationMs;
      state.initialPrimerRoundTripMs += roundTripMs;
      state.initialPrimerMaxRoundTripMs = Math.max(state.initialPrimerMaxRoundTripMs, roundTripMs);

      if (!state.firstPrimerCommitMs) {
        state.firstPrimerCommitMs = performance.now() - state.createdAt;
      }

      paint(performance.now());
    }
  }

  function nextInitialVisibleJob() {
    while (state.initialVisibleQueue.length > 0) {
      const anchorState = state.initialVisibleQueue[0];
      if (!anchorState.current) {
        return {
          anchorState,
          frameJob: createAnchorFrameGenerationJob(state, anchorState.anchor, anchorState.frameIndex),
        };
      }
      state.initialVisibleQueue.shift();
    }

    return null;
  }

  function queueVisibleGeneration(anchorState) {
    if ((generationStrategy !== "visible-batched" && generationStrategy !== "worker-visible") || anchorState.current) return;
    if (state.initialVisibleActiveJob?.anchorState === anchorState) return;
    if (state.prewarmActiveJob?.anchorState === anchorState) return;
    if (hasPendingWorkerFrame(anchorState, "current")) return;
    if (!state.initialVisibleQueue.includes(anchorState)) {
      state.initialVisibleQueue.unshift(anchorState);
    }
    state.initialVisibleCompleted = false;
    if (generationStrategy === "worker-visible" && !state.workerFallbackActive) scheduleInitialWorkerVisible();
    else scheduleInitialVisible();
  }

  function completeInitialVisibleJob(activeJob) {
    const frame = activeJob.frameJob.getFrame();
    const { anchorState } = activeJob;

    if (!anchorState.current) {
      anchorState.current = frame;
      state.generationCount += 1;
      state.lastGenerationMs = Math.max(state.lastGenerationMs, frame.generationMs);
      state.initialVisibleGeneratedCount += 1;
      state.initialVisibleGenerationMs += frame.generationMs;
      if (!state.firstVisibleCommitMs) {
        state.firstVisibleCommitMs = performance.now() - state.createdAt;
      }
    }

    state.initialVisibleQueue.shift();
  }

  function scheduleInitialVisible() {
    const canUseLocalBatch =
      generationStrategy === "visible-batched" || (generationStrategy === "worker-visible" && state.workerFallbackActive);
    if (!canUseLocalBatch || state.initialVisibleCompleted || state.initialVisibleHandle) return;

    state.initialVisibleHandle = window.setTimeout(() => {
      const started = performance.now();
      state.initialVisibleHandle = 0;

      if (!state.initialVisibleActiveJob) {
        state.initialVisibleActiveJob = nextInitialVisibleJob();
      }

      if (state.initialVisibleActiveJob) {
        const result = state.initialVisibleActiveJob.frameJob.processBatch({
          maxCandidates: state.prewarmBatchCandidateLimit,
          timeBudgetMs: state.prewarmBatchBudgetMs,
        });
        const duration = performance.now() - started;
        state.initialVisibleBatchCount += 1;
        state.initialVisibleProcessedCandidates += result.processedCandidates;
        state.initialVisibleMaxTaskMs = Math.max(state.initialVisibleMaxTaskMs, duration);

        if (result.done) {
          completeInitialVisibleJob(state.initialVisibleActiveJob);
          state.initialVisibleActiveJob = null;
          paint(performance.now());
        }

        updateDataset(snapshot());
      }

      if (!state.initialVisibleActiveJob && state.initialVisibleQueue.length === 0) {
        state.initialVisibleCompleted = true;
        updateDataset(snapshot());
        schedulePrewarm();
        return;
      }

      scheduleInitialVisible();
    }, state.prewarmBatchDelayMs);
  }

  function activateWorkerFallback(reason) {
    const fallbackReason = reason || "Worker fallback";
    if (state.workerFallbackActive) {
      state.workerError = state.workerError || fallbackReason;
      state.workerFallbackReason = state.workerFallbackReason || fallbackReason;
      return;
    }

    state.workerFallbackActive = true;
    state.workerFallbackReason = fallbackReason;
    state.workerError = fallbackReason;

    if (state.worker) {
      state.worker.terminate();
      state.worker = null;
    }

    const pendingEntries = [...state.workerPending.values()];
    state.workerPending.clear();
    for (const pending of pendingEntries) requeueWorkerPending(pending);

    const hasMissingInitial = state.initialVisibleQueue.some((anchorState) => !anchorState.current);
    if (hasMissingInitial) {
      state.initialVisibleCompleted = false;
      scheduleInitialVisible();
    } else {
      state.initialVisibleCompleted = true;
      schedulePrewarm();
    }

    updateDataset(snapshot());
  }

  function postWorkerFrame(anchorState, descriptor, phase, kind) {
    const worker = ensureWorker();
    if (!worker) return false;

    const taskId = ++state.workerTaskId;
    state.workerPending.set(taskId, {
      anchorState,
      phase,
      kind,
      frameIndex: descriptor.index,
      started: performance.now(),
    });
    worker.postMessage({
      type: "generateFrame",
      taskId,
      width: state.width,
      height: state.height,
      descriptor,
    });
    return true;
  }

  function postWorkerProgressiveInitialFrame(anchorState, descriptor) {
    const worker = ensureWorker();
    if (!worker) return false;

    const taskId = ++state.workerTaskId;
    state.workerPending.set(taskId, {
      anchorState,
      phase: "initial-progressive",
      kind: "current",
      frameIndex: descriptor.index,
      started: performance.now(),
      primerDelivered: false,
    });
    worker.postMessage({
      type: "generateProgressiveFrame",
      taskId,
      width: state.width,
      height: state.height,
      descriptor,
      primer: {
        targetRatio: state.cssWidth < 680 ? 0.4 : 0.26,
        minLines: state.cssWidth < 680 ? 24 : 72,
        maxMs: state.cssWidth < 680 ? 30 : 64,
      },
    });
    return true;
  }

  function recordWorkerFrame(pending, frame, generated) {
    if (!generated) return;
    const roundTripMs = performance.now() - pending.started;

    state.generationCount += 1;
    state.lastGenerationMs = Math.max(state.lastGenerationMs, frame.generationMs);
    state.workerGeneratedCount += 1;
    state.workerGenerationMs += frame.generationMs;
    state.workerRoundTripMs += roundTripMs;
    state.workerMaxRoundTripMs = Math.max(state.workerMaxRoundTripMs, roundTripMs);

    if (pending.phase === "prewarm") {
      state.workerPrewarmGeneratedCount += 1;
      state.workerPrewarmGenerationMs += frame.generationMs;
      state.workerPrewarmRoundTripMs += roundTripMs;
      state.workerPrewarmMaxRoundTripMs = Math.max(state.workerPrewarmMaxRoundTripMs, roundTripMs);
      state.prewarmGeneratedCount += 1;
      state.prewarmGenerationMs += frame.generationMs;
    }
  }

  function completeWorkerInitialFrame(pending, frame) {
    const { anchorState } = pending;
    let generated = false;

    if (!anchorState.current) {
      anchorState.current = frame;
      const sharesPrefix = framePrefixMatches(anchorState.primer, frame);
      anchorState.primerSharesFullPrefix = sharesPrefix;
      if (sharesPrefix === true) {
        startFrameBirth(anchorState, anchorState.primer.generated.lines.length, state.birthRevealDurationMs);
        state.progressivePrimerSharedCount += 1;
      } else if (sharesPrefix === false) {
        startFrameBirth(anchorState, 0, state.birthRevealDurationMs);
        state.progressivePrimerMismatchCount += 1;
      } else {
        startFrameBirth(anchorState, 0, state.birthRevealDurationMs);
      }
      state.initialVisibleGeneratedCount += 1;
      state.initialVisibleGenerationMs += frame.generationMs;
      generated = true;

      if (!state.firstVisibleCommitMs) {
        state.firstVisibleCommitMs = performance.now() - state.createdAt;
      }
    }

    recordWorkerFrame(pending, frame, generated);
    state.initialVisibleQueue = state.initialVisibleQueue.filter((queued) => queued !== anchorState || !anchorState.current);
    paint(performance.now());
  }

  function completeWorkerPrewarmFrame(pending, frame) {
    const { anchorState } = pending;
    let generated = false;

    if (pending.kind === "current") {
      if (!anchorState.current) {
        anchorState.current = frame;
        startFrameBirth(anchorState, 0, state.birthRevealDurationMs);
        generated = true;
      }
    } else if (!anchorState.next && !lockedProgress && !reducedMotion) {
      anchorState.next = frame;
      anchorState.frameIndex += 1;
      generated = true;
    }

    recordWorkerFrame(pending, frame, generated);
    if (hasPrewarmWork(anchorState)) queuePrewarmAnchor(anchorState);
    paint(performance.now());
  }

  function completeWorkerFrame(pending, message) {
    const frame = createFrameFromWorkerResult(message.frame);
    if (pending.phase === "primer") {
      completeWorkerPrimerFrame(pending, frame);
      return;
    }

    if (pending.phase === "prewarm") {
      state.workerPrewarmMessageCount += 1;
      completeWorkerPrewarmFrame(pending, frame);
      return;
    }

    completeWorkerInitialFrame(pending, frame);
  }

  function ensureWorker() {
    if (state.worker || state.workerError) return state.worker;
    if (!state.workerUrl || typeof Worker === "undefined") {
      activateWorkerFallback("Worker unavailable");
      return null;
    }

    try {
      state.worker = new Worker(state.workerUrl, { type: "module" });
    } catch (error) {
      activateWorkerFallback(error?.message || "Worker creation failed");
      return null;
    }

    state.worker.onmessage = (event) => {
      const message = event.data || {};
      state.workerMessageCount += 1;

      if (message.type === "error") {
        const pending = state.workerPending.get(message.taskId);
        state.workerPending.delete(message.taskId);
        requeueWorkerPending(pending);
        activateWorkerFallback(message.error || "Worker generation failed");
        return;
      }

      const pending = state.workerPending.get(message.taskId);
      if (!pending) return;

      if (message.type === "primerFrame") {
        pending.primerDelivered = true;
        completeWorkerPrimerFrame(pending, createFrameFromWorkerResult(message.frame));
        updateDataset(snapshot());
        return;
      }

      if (message.type !== "frame") return;

      state.workerPending.delete(message.taskId);

      completeWorkerFrame(pending, message);
      updateDataset(snapshot());

      if (state.initialVisibleQueue.length === 0 && workerInitialPendingCount() === 0) {
        state.initialVisibleCompleted = true;
        updateDataset(snapshot());
        schedulePrewarm();
      } else if (workerInitialPendingCount() > 0 || state.initialVisibleQueue.length > 0) {
        scheduleInitialWorkerVisible();
      }

      if (state.workerPrewarmEnabled) scheduleWorkerPrewarm();
    };

    state.worker.onerror = (error) => {
      activateWorkerFallback(error?.message || "Worker error");
    };

    return state.worker;
  }

  function scheduleInitialWorkerVisible() {
    if (generationStrategy !== "worker-visible" || state.initialVisibleCompleted) return;
    if (state.workerFallbackActive) {
      scheduleInitialVisible();
      return;
    }
    const worker = ensureWorker();
    if (!worker) return;

    for (const anchorState of state.initialVisibleQueue) {
      if (anchorState.current) continue;
      if (
        state.initialPrimerEnabled &&
        !state.progressivePrimerEnabled &&
        !anchorState.primer &&
        !hasPendingWorkerFrame(anchorState, "primer") &&
        !state.workerFallbackActive
      ) {
        const primerDescriptor = createAnchorFrameDescriptor(state, anchorState.anchor, anchorState.frameIndex, { primer: true });
        postWorkerFrame(anchorState, primerDescriptor, "primer", "primer");
      }

      if (hasPendingWorkerFrame(anchorState, "current")) continue;

      const descriptor = createAnchorFrameDescriptor(state, anchorState.anchor, anchorState.frameIndex);
      if (state.progressivePrimerEnabled) {
        postWorkerProgressiveInitialFrame(anchorState, descriptor);
      } else {
        postWorkerFrame(anchorState, descriptor, "initial", "current");
      }
    }
  }

  function hasPrewarmWork(anchorState) {
    if (!anchorState.current) return true;
    return !lockedProgress && !reducedMotion && !anchorState.next;
  }

  function queuePrewarmAnchor(anchorState, front = false) {
    if (state.prewarmStrategy === "none" || !hasPrewarmWork(anchorState)) return;
    if (
      !state.prewarmQueue.includes(anchorState) &&
      state.prewarmActiveJob?.anchorState !== anchorState &&
      !hasPendingPrewarmFrame(anchorState)
    ) {
      if (front) state.prewarmQueue.unshift(anchorState);
      else state.prewarmQueue.push(anchorState);
    }
    state.prewarmCompleted = false;
    schedulePrewarm();
  }

  function nextWorkerPrewarmJob() {
    while (state.prewarmQueue.length > 0) {
      const anchorState = state.prewarmQueue.shift();
      if (!hasPrewarmWork(anchorState)) continue;
      if (hasPendingPrewarmFrame(anchorState)) continue;
      if (!anchorState.current && (state.initialVisibleQueue.includes(anchorState) || hasPendingWorkerFrame(anchorState, "current"))) {
        state.prewarmQueue.push(anchorState);
        return null;
      }

      if (!anchorState.current) {
        return {
          anchorState,
          kind: "current",
          descriptor: createAnchorFrameDescriptor(state, anchorState.anchor, anchorState.frameIndex),
        };
      }

      if (!lockedProgress && !reducedMotion && !anchorState.next) {
        return {
          anchorState,
          kind: "next",
          descriptor: createAnchorFrameDescriptor(state, anchorState.anchor, anchorState.frameIndex + 1),
        };
      }
    }

    return null;
  }

  function scheduleWorkerPrewarm() {
    if (!state.workerPrewarmEnabled || state.workerFallbackActive) return;
    if (state.prewarmCompleted || !state.initialVisibleCompleted) return;
    const worker = ensureWorker();
    if (!worker) return;

    const maxConcurrentPrewarm = 1;
    while (workerPendingCount("prewarm") < maxConcurrentPrewarm) {
      const job = nextWorkerPrewarmJob();
      if (!job) break;
      if (!postWorkerFrame(job.anchorState, job.descriptor, "prewarm", job.kind)) break;
    }

    if (state.prewarmQueue.length === 0 && workerPendingCount("prewarm") === 0) {
      state.prewarmCompleted = true;
      updateDataset(snapshot());
    }
  }

  function nextBatchedPrewarmJob() {
    while (state.prewarmQueue.length > 0) {
      const anchorState = state.prewarmQueue[0];

      if (!anchorState.current) {
        return {
          anchorState,
          kind: "current",
          frameJob: createAnchorFrameGenerationJob(state, anchorState.anchor, anchorState.frameIndex),
        };
      }

      if (!lockedProgress && !reducedMotion && !anchorState.next) {
        return {
          anchorState,
          kind: "next",
          frameJob: createAnchorFrameGenerationJob(state, anchorState.anchor, anchorState.frameIndex + 1),
        };
      }

      state.prewarmQueue.shift();
    }

    return null;
  }

  function completeBatchedPrewarmJob(activeJob) {
    const frame = activeJob.frameJob.getFrame();
    const { anchorState } = activeJob;
    let generated = 0;

    if (activeJob.kind === "current") {
      if (!anchorState.current) {
        anchorState.current = frame;
        startFrameBirth(anchorState, 0, state.birthRevealDurationMs);
        generated = 1;
      }
    } else if (!anchorState.next && !lockedProgress && !reducedMotion) {
      anchorState.next = frame;
      anchorState.frameIndex += 1;
      generated = 1;
    }

    if (generated > 0) {
      state.generationCount += generated;
      state.lastGenerationMs = Math.max(state.lastGenerationMs, frame.generationMs);
      state.prewarmGeneratedCount += generated;
      state.prewarmGenerationMs += frame.generationMs;
    }

    if (!hasPrewarmWork(anchorState)) state.prewarmQueue.shift();
  }

  function scheduleBatchedPrewarm() {
    state.prewarmHandle = window.setTimeout(() => {
      const started = performance.now();
      state.prewarmHandle = 0;

      if (!state.prewarmActiveJob) {
        state.prewarmActiveJob = nextBatchedPrewarmJob();
      }

      if (state.prewarmActiveJob) {
        const result = state.prewarmActiveJob.frameJob.processBatch({
          maxCandidates: state.prewarmBatchCandidateLimit,
          timeBudgetMs: state.prewarmBatchBudgetMs,
        });
        const duration = performance.now() - started;
        state.prewarmBatchCount += 1;
        state.prewarmProcessedCandidates += result.processedCandidates;
        state.prewarmMaxTaskMs = Math.max(state.prewarmMaxTaskMs, duration);

        if (result.done) {
          completeBatchedPrewarmJob(state.prewarmActiveJob);
          state.prewarmActiveJob = null;
        }

        updateDataset(snapshot());
      }

      if (!state.prewarmActiveJob && state.prewarmQueue.length === 0) {
        state.prewarmCompleted = true;
        updateDataset(snapshot());
        return;
      }

      schedulePrewarm();
    }, state.prewarmBatchDelayMs);
  }

  function schedulePrewarm() {
    if (state.prewarmStrategy === "none" || state.prewarmCompleted || state.prewarmHandle) return;
    if (!state.initialVisibleCompleted) return;
    if (state.workerPrewarmEnabled && !state.workerFallbackActive) {
      scheduleWorkerPrewarm();
      return;
    }
    if (state.prewarmStrategy === "idle-batched") {
      scheduleBatchedPrewarm();
      return;
    }
    if (state.prewarmQueue.length === 0) {
      state.prewarmCompleted = true;
      updateDataset(snapshot());
      return;
    }

    state.prewarmHandle = requestIdle(() => {
      state.prewarmHandle = 0;
      const anchorState = state.prewarmQueue.shift();
      if (anchorState) {
        const started = performance.now();
        const generated = generateAnchorFrames(anchorState, !lockedProgress);
        const duration = performance.now() - started;
        state.prewarmGeneratedCount += generated;
        state.prewarmGenerationMs += duration;
        state.prewarmMaxTaskMs = Math.max(state.prewarmMaxTaskMs, duration);
        updateDataset(snapshot());
      }
      schedulePrewarm();
    });
  }

  function advanceGeneratedFrames(now) {
    if (reducedMotion || lockedProgress) return;
    if (now - state.transitionStart < mode.lineRefreshInterval) return;
    const deferNextGeneration = generationStrategy === "visible-batched" || generationStrategy === "worker-visible";

    for (const anchorState of state.anchors) {
      if (!anchorState.current) continue;
      if (!anchorState.next) {
        if (deferNextGeneration) {
          queuePrewarmAnchor(anchorState);
          continue;
        }
        anchorState.next = createAnchorFrame(state, anchorState.anchor, anchorState.frameIndex + 1);
        anchorState.frameIndex += 1;
        state.generationCount += 1;
        state.lastGenerationMs = Math.max(state.lastGenerationMs, anchorState.next.generationMs);
        continue;
      }
      anchorState.current = anchorState.next;
      anchorState.frameIndex += 1;
      if (deferNextGeneration) {
        anchorState.next = null;
        queuePrewarmAnchor(anchorState);
      } else {
        anchorState.next = createAnchorFrame(state, anchorState.anchor, anchorState.frameIndex);
        state.generationCount += 1;
        state.lastGenerationMs = Math.max(state.lastGenerationMs, anchorState.next.generationMs);
      }
      anchorState.frameBlend = 0;
    }
    state.transitionStart = now;
  }

  function paint(now) {
    const drawStart = performance.now();
    if (!lockedProgress && !reducedMotion) {
      advanceNarrativeProgress(state, now);
    } else {
      state.narrativeProgress = state.targetProgress;
    }

    const narrative = getNarrativeState(state.narrativeProgress, { preset: presetKey });
    const blend = activeAnchorBlend(state.narrativeProgress, preset.anchors);
    const stats = {
      protectedLines: 0,
      protectedPoints: 0,
      sumContentFactor: 0,
      minContentFactor: 1,
      zoneAreaRatio: 0,
      zoneCount: 0,
      linePasses: 0,
      pointPasses: 0,
      affectedLines: 0,
      affectedPoints: 0,
      maxDisplacementPx: 0,
      totalInfluence: 0,
      signatureFragments: 0,
      signaturePulse: 0,
      nightMarineVeils: 0,
      nightMarineMeasurements: 0,
      ambientMotionLines: 0,
      ambientMotionMaxPx: 0,
      ambientMotionSumPx: 0,
    };

    updatePointer(state.pointer, interactionPreset, now);

    if (!reducedMotion && !lockedProgress) {
      const transitionDuration = mode.lineRefreshInterval * mode.transitionRatio;
      const frameBlend = smooth((now - state.transitionStart) / transitionDuration);
      for (const anchorState of state.anchors) anchorState.frameBlend = frameBlend;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, state.width, state.height);
    drawGrain(ctx, state.grain, state.width, state.height, theme);

    ctx.save();
    ctx.scale(state.dpr, state.dpr);

    const scrollActive =
      !lockedProgress &&
      (Math.abs(state.targetProgress - state.narrativeProgress) > 0.003 || now - state.lastScrollTargetAt < 900);
    const blendedActiveRaw = [
      { anchor: blend.from, weight: blend.fromWeight },
      { anchor: blend.to, weight: blend.toWeight },
    ].filter((entry, index, entries) => entry.weight > 0.001 && (index === 0 || entry.anchor.key !== entries[0].anchor.key));
    const blendKey = blendPairKey(blendedActiveRaw);
    if (state.lastBlendPairKey && blendKey !== state.lastBlendPairKey) {
      state.previousBlendEntries = state.lastBlendEntries;
      state.blendPairChangedAt = now;
    }
    state.lastBlendPairKey = blendKey;
    const pairFade = smooth((now - state.blendPairChangedAt) / (scrollActive ? 920 : 620));
    let blendedActive = combineBlendEntries(state.previousBlendEntries, blendedActiveRaw, pairFade);
    const targetBlend = activeAnchorBlend(state.targetProgress, preset.anchors);
    const targetActive = [
      { anchor: targetBlend.from, weight: targetBlend.fromWeight },
      { anchor: targetBlend.to, weight: targetBlend.toWeight },
    ].filter((entry, index, entries) => entry.weight > 0.001 && (index === 0 || entry.anchor.key !== entries[0].anchor.key));
    const targetPreview = scrollActive
      ? smooth((now - state.lastScrollTargetAt) / 760) *
        clamp((Math.abs(state.targetProgress - state.narrativeProgress) - 0.18) / 0.48, 0, 1) *
        0.46
      : 0;
    blendedActive = mixBlendEntries(blendedActive, targetActive, targetPreview);
    state.lastBlendEntries = blendedActiveRaw.map((entry) => ({ anchor: entry.anchor, weight: entry.weight }));
    const dominant = blendedActive.reduce(
      (best, candidate) => (candidate.weight > best.weight ? candidate : best),
      blendedActive[0],
    );
    const scrollGlide = scrollActive
      ? Math.max(
          clamp(state.scrollVelocity / 2.2, 0, 1),
          clamp((Math.abs(state.targetProgress - state.narrativeProgress) - 0.1) / 0.28, 0, 1),
        )
      : 0;
    const dominantPull = mix(0.34, 0.1, scrollGlide);
    const secondaryScale = mix(0.28, 0.58, scrollGlide);
    const active = blendedActive
      .map((entry) => {
        if (entry.anchor.key === dominant.anchor.key) return { ...entry, weight: mix(entry.weight, 1, dominantPull) };
        return { ...entry, weight: entry.weight * secondaryScale };
      })
      .filter((entry) => entry.weight > 0.025);
    const contentRects = typeof state.contentProvider === "function" ? state.contentProvider() || [] : [];
    const canvasRect = contentRects.length > 0 ? state.canvas.getBoundingClientRect() : null;
    const lineStride = 1;
    const zonesByAnchor = new Map();

    for (const entry of active) {
      const anchorState = state.anchors.find((item) => item.anchor.key === entry.anchor.key);
      if (!anchorState || zonesByAnchor.has(anchorState.anchor.key)) continue;
      const zones = canvasRect ? resolveContentZones(state, anchorState.anchor, contentRects, canvasRect) : [];
      zonesByAnchor.set(anchorState.anchor.key, zones);
      stats.zoneCount = Math.max(stats.zoneCount, zones.length);
      stats.zoneAreaRatio = Math.max(stats.zoneAreaRatio, zoneAreaRatio(zones, state.cssWidth, state.cssHeight));
    }

    drawNightMarineLayer(ctx, state, active, zonesByAnchor, now, stats);

    for (const entry of active) {
      const anchorState = state.anchors.find((item) => item.anchor.key === entry.anchor.key);
      if (!anchorState) continue;
      if (!anchorState.current && (generationStrategy === "visible-batched" || generationStrategy === "worker-visible")) {
        queueVisibleGeneration(anchorState);
        if (!anchorState.primer) continue;
      }
      if (anchorState.current) {
        ensureAnchorFrames(anchorState, "visible");
      }
      const zones = zonesByAnchor.get(anchorState.anchor.key) ?? [];
      const beforeLines = stats.protectedLines;
      const beforePoints = stats.protectedPoints;
      drawAnchorFrame(ctx, anchorState, palette, theme, entry.weight, zones, stats, state.pointer, interactionPreset, now, state, lineStride);
      const statsBaseFrame = anchorState.current ?? anchorState.primer;
      stats.linePasses += statsBaseFrame?.generated.lines.length ?? 0;
      stats.pointPasses += statsBaseFrame?.generated.lines.reduce((sum, line) => sum + line.points.length, 0) ?? 0;
      if (stats.protectedLines > beforeLines || stats.protectedPoints > beforePoints) {
        stats.protectedLines = stats.protectedLines;
      }
    }

    drawDecisionSignature(ctx, state, active, contentRects, canvasRect, now, stats);

    ctx.restore();
    stats.zoneAreaRatio = Math.round(stats.zoneAreaRatio * 1000) / 1000;
    state.lastNarrativeStats = stats;

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

    if (state.frameCount === 1 || state.frameCount % 30 === 0 || Math.abs(state.targetProgress - state.narrativeProgress) > 0.01) {
      updateDataset(snapshot(narrative));
    }
  }

  function tick(now) {
    if (!state.running) return;
    advanceGeneratedFrames(now);
    paint(now);
    state.raf = requestAnimationFrame(tick);
  }

  function setPointerFromEvent(event) {
    if (!state.pointer.enabled) return;
    const rect = canvas.getBoundingClientRect();
    state.pointer.targetX = event.clientX - rect.left;
    state.pointer.targetY = event.clientY - rect.top;
    state.pointer.targetStrength = 1;
    state.pointer.active = true;
    state.pointer.lastMoveAt = performance.now();
  }

  function releasePointer() {
    if (!state.pointer.enabled) return;
    state.pointer.targetStrength = 0;
    state.pointer.active = false;
  }

  function attachPointer() {
    if (!state.pointer.enabled || !state.attachPointerEvents) return;
    canvas.addEventListener("pointerenter", setPointerFromEvent, { passive: true });
    canvas.addEventListener("pointermove", setPointerFromEvent, { passive: true });
    canvas.addEventListener("pointerleave", releasePointer, { passive: true });
    canvas.addEventListener("pointercancel", releasePointer, { passive: true });
  }

  function detachPointer() {
    canvas.removeEventListener("pointerenter", setPointerFromEvent);
    canvas.removeEventListener("pointermove", setPointerFromEvent);
    canvas.removeEventListener("pointerleave", releasePointer);
    canvas.removeEventListener("pointercancel", releasePointer);
  }

  function snapshot(existingNarrative) {
    const narrative = existingNarrative ?? getNarrativeState(state.narrativeProgress, { preset: presetKey });
    const elapsedMs = state.startedAt ? performance.now() - state.startedAt : 0;
    const measuredFrames = Math.max(1, state.frameCount - 1);
    const active = activeAnchorBlend(state.narrativeProgress, preset.anchors);
    const visibleAnchors = [
      { anchor: active.from.key, weight: Math.round(active.fromWeight * 1000) / 1000 },
      { anchor: active.to.key, weight: Math.round(active.toWeight * 1000) / 1000 },
    ].filter((entry, index, entries) => entry.weight > 0.001 && (index === 0 || entry.anchor !== entries[0].anchor));
    const anchorStats = state.anchors.map((anchorState) => {
      const displayedFrame = anchorState.current ?? anchorState.primer;
      const displayedStats = displayedFrame
        ? frameStats(displayedFrame)
        : {
            lineCount: 0,
            pointCount: 0,
            longestLinePx: 0,
          };
      const birthProgress = birthProgressForAnchor(anchorState, performance.now());
      const fullLineCount = anchorState.current?.generated.lines.length ?? 0;
      const primerLineCount = anchorState.primer?.generated.lines.length ?? 0;
      const birthBaseLineCount = anchorState.birthBaseLineCount || 0;
      const effectiveLineCount =
        anchorState.current && birthProgress < 1 ? birthEffectiveLineCount(anchorState, birthProgress) : displayedStats.lineCount;
      const visibleBirthLineCount =
        anchorState.current && birthProgress < 1 ? birthVisibleLineCount(anchorState, birthProgress) : displayedStats.lineCount;
      return {
        key: anchorState.anchor.key,
        generated: Boolean(anchorState.current),
        primerGenerated: Boolean(anchorState.primer),
        visibleGenerated: Boolean(displayedFrame),
        density: displayedFrame?.density ?? densityForAnchor(anchorState.anchor, state.cssWidth),
        fieldVariant: anchorState.anchor.fieldVariant,
        ...displayedStats,
        effectiveLineCount,
        visibleBirthLineCount,
        primerLineCount,
        fullLineCount,
        primerSharesFullPrefix: anchorState.primerSharesFullPrefix,
        birthProgress: Math.round(birthProgress * 1000) / 1000,
        birthRevealMode: anchorState.birthRevealMode,
        longBreathMode: anchorState.longBreathMode,
        birthBaseLineCount,
        birthAddedLineCount: Math.max(0, fullLineCount - birthBaseLineCount),
      };
    });
    const protectedSample = Math.max(1, state.lastNarrativeStats.protectedPoints);
    const avgProtectedFactor = state.lastNarrativeStats.protectedPoints
      ? state.lastNarrativeStats.sumContentFactor / protectedSample
      : 1;

    return {
      phase: 7,
      seed,
      theme,
      presetKey,
      modeKey,
      reducedMotion,
      lockedProgress,
      progress: narrative.progress,
      targetProgress: Math.round(state.targetProgress * 1000) / 1000,
      scrollVelocity: Math.round(state.scrollVelocity * 1000) / 1000,
      stage: narrative.stage,
      from: narrative.from,
      to: narrative.to,
      blend: narrative.blend,
      density: narrative.density,
      complexity: narrative.complexity,
      turbulence: narrative.turbulence,
      structure: narrative.structure,
      attractorCount: narrative.attractorCount,
      globalFlow: narrative.globalFlow,
      contrast: narrative.contrast,
      speed: narrative.speed,
      debugParams,
      visibilityProfile: visibilityProfile.key,
      visibleAnchors,
      anchorStats,
      generationStrategy,
      prewarmStrategy,
      initialPrimerEnabled: state.initialPrimerEnabled,
      initialPrimerMode: state.initialPrimerMode,
      progressivePrimerEnabled: state.progressivePrimerEnabled,
      birthRevealDurationMs: state.birthRevealDurationMs,
      birthRevealMode: state.birthRevealMode,
      longBreathMode: state.longBreathMode,
      ambientMotionMode: state.ambientMotionMode,
      ambientMotionLines: state.lastNarrativeStats.ambientMotionLines,
      ambientMotionMaxPx: Math.round(state.lastNarrativeStats.ambientMotionMaxPx * 10) / 10,
      ambientMotionAvgPx: Math.round(
        (state.lastNarrativeStats.ambientMotionSumPx / Math.max(1, state.lastNarrativeStats.ambientMotionLines)) * 10,
      ) / 10,
      mobileFirstImpression: state.mobileFirstImpression,
      progressivePrimerSharedCount: state.progressivePrimerSharedCount,
      progressivePrimerMismatchCount: state.progressivePrimerMismatchCount,
      workerPrewarmEnabled: state.workerPrewarmEnabled,
      zoneCount: state.lastNarrativeStats.zoneCount,
      zoneAreaRatio: state.lastNarrativeStats.zoneAreaRatio,
      protectedLines: state.lastNarrativeStats.protectedLines,
      protectedPoints: state.lastNarrativeStats.protectedPoints,
      nightMarineVeils: state.lastNarrativeStats.nightMarineVeils,
      nightMarineMeasurements: state.lastNarrativeStats.nightMarineMeasurements,
      minContentFactor: Math.round(state.lastNarrativeStats.minContentFactor * 1000) / 1000,
      avgProtectedFactor: Math.round(avgProtectedFactor * 1000) / 1000,
      linePasses: state.lastNarrativeStats.linePasses,
      pointPasses: state.lastNarrativeStats.pointPasses,
      interactionKey,
      interactionMode: interactionPreset.mode,
      pointerEnabled: state.pointer.enabled,
      pointerActive: state.pointer.active,
      pointerStrength: Math.round(state.pointer.strength * 1000) / 1000,
      pointerRadius: interactionPreset.radius,
      pointerStrengthConfig: interactionPreset.strength,
      pointerDecay: interactionPreset.decay,
      affectedLines: state.lastNarrativeStats.affectedLines,
      affectedPoints: state.lastNarrativeStats.affectedPoints,
      signatureFragments: state.lastNarrativeStats.signatureFragments,
      signaturePulse: state.lastNarrativeStats.signaturePulse,
      maxDisplacementPx: Math.round(state.lastNarrativeStats.maxDisplacementPx * 10) / 10,
      avgInfluence: Math.round(
        (state.lastNarrativeStats.totalInfluence / Math.max(1, state.lastNarrativeStats.affectedPoints)) * 1000,
      ) / 1000,
      timeScale: mode.timeScale,
      lineRefreshIntervalSeconds: mode.lineRefreshInterval / 1000,
      elapsedSeconds: Math.round((elapsedMs / 1000) * 10) / 10,
      generationCount: state.generationCount,
      lastGenerationMs: state.lastGenerationMs,
      initialGenerationMs: state.initialGenerationMs,
      initialVisibleGeneratedCount: state.initialVisibleGeneratedCount,
      initialVisibleGenerationMs: Math.round(state.initialVisibleGenerationMs * 10) / 10,
      initialVisibleMaxTaskMs: Math.round(state.initialVisibleMaxTaskMs * 10) / 10,
      initialVisibleBatchCount: state.initialVisibleBatchCount,
      initialVisibleProcessedCandidates: state.initialVisibleProcessedCandidates,
      initialVisiblePendingCount: state.initialVisibleQueue.filter((anchorState) => !anchorState.current).length,
      initialVisibleCompleted: state.initialVisibleCompleted,
      firstVisibleCommitMs: Math.round(state.firstVisibleCommitMs * 10) / 10,
      firstPrimerCommitMs: Math.round(state.firstPrimerCommitMs * 10) / 10,
      initialPrimerGeneratedCount: state.initialPrimerGeneratedCount,
      initialPrimerGenerationMs: Math.round(state.initialPrimerGenerationMs * 10) / 10,
      initialPrimerRoundTripMs: Math.round(state.initialPrimerRoundTripMs * 10) / 10,
      initialPrimerMaxRoundTripMs: Math.round(state.initialPrimerMaxRoundTripMs * 10) / 10,
      initialPrimerPendingCount:
        workerPendingCount("primer") +
        workerPendingEntries("initial-progressive").filter((pending) => !pending.primerDelivered).length,
      initialPrimerMessageCount: state.initialPrimerMessageCount,
      workerGeneratedCount: state.workerGeneratedCount,
      workerGenerationMs: Math.round(state.workerGenerationMs * 10) / 10,
      workerRoundTripMs: Math.round(state.workerRoundTripMs * 10) / 10,
      workerMaxRoundTripMs: Math.round(state.workerMaxRoundTripMs * 10) / 10,
      workerPendingCount: state.workerPending.size,
      workerPrimerPendingCount: workerPendingCount("primer"),
      workerInitialPendingCount: workerInitialPendingCount(),
      workerPrewarmPendingCount: workerPendingCount("prewarm"),
      workerMessageCount: state.workerMessageCount,
      workerError: state.workerError,
      workerFallbackActive: state.workerFallbackActive,
      workerFallbackReason: state.workerFallbackReason,
      workerPrewarmGeneratedCount: state.workerPrewarmGeneratedCount,
      workerPrewarmGenerationMs: Math.round(state.workerPrewarmGenerationMs * 10) / 10,
      workerPrewarmRoundTripMs: Math.round(state.workerPrewarmRoundTripMs * 10) / 10,
      workerPrewarmMaxRoundTripMs: Math.round(state.workerPrewarmMaxRoundTripMs * 10) / 10,
      workerPrewarmMessageCount: state.workerPrewarmMessageCount,
      deferredGenerationMs: Math.round(state.deferredGenerationMs * 10) / 10,
      deferredGenerationCount: state.deferredGenerationCount,
      deferredAnchorKeys: [...state.deferredAnchorKeys],
      prewarmGeneratedCount: state.prewarmGeneratedCount,
      prewarmGenerationMs: Math.round(state.prewarmGenerationMs * 10) / 10,
      prewarmMaxTaskMs: Math.round(state.prewarmMaxTaskMs * 10) / 10,
      prewarmBatchCount: state.prewarmBatchCount,
      prewarmProcessedCandidates: state.prewarmProcessedCandidates,
      prewarmBatchBudgetMs: state.prewarmBatchBudgetMs,
      prewarmBatchCandidateLimit: state.prewarmBatchCandidateLimit,
      prewarmBatchDelayMs: state.prewarmBatchDelayMs,
      prewarmActive: Boolean(state.prewarmActiveJob),
      prewarmPendingCount: state.prewarmQueue.filter(hasPrewarmWork).length + workerPendingCount("prewarm"),
      prewarmCompleted: state.prewarmCompleted,
      frameCount: state.frameCount,
      avgDrawMs: Math.round((state.sumDrawMs / Math.max(1, state.frameCount)) * 10) / 10,
      maxDrawMs: Math.round(state.maxDrawMs * 10) / 10,
      avgFrameMs: Math.round((state.sumFrameMs / measuredFrames) * 10) / 10,
      maxFrameMs: Math.round(state.maxFrameMs * 10) / 10,
      criteria:
        "Phase 7 only: scroll narrative over validated field, density, animation, interaction and content rules. No final engine integration.",
    };
  }

  generateInitialAnchors();
  paint(performance.now());
  updateDataset(snapshot());
  attachPointer();
  scheduleInitialVisible();
  scheduleInitialWorkerVisible();
  schedulePrewarm();

  return {
    start() {
      if (state.running || reducedMotion || (lockedProgress && !state.pointer.enabled)) return;
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
      detachPointer();
      window.clearTimeout(state.initialVisibleHandle);
      if (state.prewarmStrategy === "idle-batched") {
        window.clearTimeout(state.prewarmHandle);
      } else {
        cancelIdle(state.prewarmHandle);
      }
      state.initialVisibleHandle = 0;
      state.initialVisibleActiveJob = null;
      if (state.worker) state.worker.terminate();
      state.worker = null;
      state.workerPending.clear();
      state.prewarmHandle = 0;
      state.prewarmActiveJob = null;
    },
    setTargetProgress(progress) {
      const nextProgress = clamp(progress, 0, 1);
      const now = performance.now();
      const elapsedSeconds = Math.max(0.016, (now - state.lastScrollTargetAt) / 1000);
      state.scrollVelocity = Math.abs(nextProgress - state.lastScrollTargetProgress) / elapsedSeconds;
      state.targetProgress = nextProgress;
      state.lastScrollTargetProgress = nextProgress;
      state.lastScrollTargetAt = now;
      if (lockedProgress || reducedMotion) {
        state.narrativeProgress = state.targetProgress;
        paint(performance.now());
        updateDataset(snapshot());
      }
    },
    setProgress(progress) {
      state.targetProgress = clamp(progress, 0, 1);
      state.narrativeProgress = state.targetProgress;
      paint(performance.now());
      updateDataset(snapshot());
    },
    renderStill() {
      paint(performance.now());
      updateDataset(snapshot());
      return snapshot();
    },
    pointerMove(x, y, strength = 1) {
      if (!state.pointer.enabled) return;
      state.pointer.targetX = clamp(x, 0, state.cssWidth);
      state.pointer.targetY = clamp(y, 0, state.cssHeight);
      state.pointer.targetStrength = clamp(strength, 0, 1);
      state.pointer.active = state.pointer.targetStrength > 0;
      state.pointer.lastMoveAt = performance.now();
      if (!state.running) {
        paint(performance.now());
        updateDataset(snapshot());
      }
    },
    pointerLeave() {
      releasePointer();
      if (!state.running) {
        paint(performance.now());
        updateDataset(snapshot());
      }
    },
    snapshot,
  };
}
