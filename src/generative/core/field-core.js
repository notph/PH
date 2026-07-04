const TAU = Math.PI * 2;

export const PALETTES = {
  light: {
    background: "#F6F4EF",
    grainDark: [38, 63, 82],
    grainLight: [255, 255, 255],
    primary: [38, 63, 82],
    secondary: [90, 124, 150],
    accent: [78, 139, 184],
  },
  dawn: {
    background: "#F7F1EA",
    grainDark: [92, 73, 62],
    grainLight: [255, 252, 247],
    primary: [48, 63, 78],
    secondary: [132, 111, 96],
    accent: [190, 112, 74],
  },
  dusk: {
    background: "#111725",
    grainDark: [168, 184, 204],
    grainLight: [8, 10, 18],
    primary: [166, 184, 205],
    secondary: [113, 132, 162],
    accent: [205, 154, 118],
  },
  night: {
    background: "#081220",
    grainDark: [156, 194, 224],
    grainLight: [2, 8, 16],
    primary: [156, 194, 224],
    secondary: [87, 129, 162],
    accent: [180, 217, 245],
  },
};

export const VARIANTS = {
  instrument: {
    label: "A - Instrument calme",
    hypothesis: "Tres discret, presque mesure scientifique en veille.",
    countDesktop: 5,
    countMobile: 4,
    influencePlan: ["converge", "calm", "vortex", "diverge", "shear"],
    potentialScale: [0.36, 0.54],
    lowerScale: 0.22,
    curlWeight: 1,
    angleNoiseWeight: 0.035,
    globalFlow: [0.2, 0.32],
    influenceStrength: [0.18, 0.48],
    influenceRadius: [0.48, 0.92],
    densityRange: [0.2, 0.47],
    densityInfluence: 0.18,
    lineLength: 10.4,
    lineWidth: 0.58,
    opacityLight: 0.18,
    opacityNight: 0.23,
    detailOpacityScale: 0.45,
    calmCut: 0.7,
    edgeFade: 0.34,
  },
  potential: {
    label: "B - Potentiel / relief lisible",
    hypothesis: "Zones lisibles, tension topographique sans foyer ponctuel.",
    countDesktop: 5,
    countMobile: 4,
    influencePlan: ["shear", "calm", "shear", "calm", "shear"],
    potentialScale: [0.44, 0.66],
    lowerScale: 0.32,
    curlWeight: 1.12,
    angleNoiseWeight: 0.05,
    globalFlow: [0.14, 0.22],
    influenceStrength: [0.28, 0.7],
    influenceRadius: [0.42, 0.86],
    densityRange: [0.38, 0.74],
    densityInfluence: 0.3,
    lineLength: 15.4,
    lineWidth: 0.72,
    opacityLight: 0.34,
    opacityNight: 0.36,
    detailOpacityScale: 0.38,
    calmCut: 0.62,
    edgeFade: 0.28,
  },
  bathymetric: {
    label: "D - Isobathes / depressions",
    hypothesis: "Relief marin, grandes courbes de niveau et lignes de pente.",
    countDesktop: 5,
    countMobile: 4,
    influencePlan: ["shelf", "ridge", "shelf", "ridge", "shelf"],
    potentialScale: [0.2, 0.33],
    lowerScale: 0.18,
    curlWeight: 0.94,
    angleNoiseWeight: 0.014,
    globalFlow: [0.08, 0.16],
    influenceStrength: [0.24, 0.52],
    influenceRadius: [0.72, 1.32],
    densityRange: [0.22, 0.56],
    densityInfluence: 0.24,
    lineLength: 17.8,
    lineWidth: 0.66,
    opacityLight: 0.26,
    opacityNight: 0.31,
    detailOpacityScale: 0.34,
    calmCut: 0.56,
    edgeFade: 0.32,
  },
  current: {
    label: "C - Courant / cisaillement",
    hypothesis: "Champ plus oriente, proche vent marin ou courant lateral.",
    countDesktop: 4,
    countMobile: 4,
    influencePlan: ["shear", "calm", "shear", "calm"],
    potentialScale: [0.38, 0.62],
    lowerScale: 0.2,
    curlWeight: 0.82,
    angleNoiseWeight: 0.045,
    globalFlow: [0.3, 0.46],
    influenceStrength: [0.2, 0.55],
    influenceRadius: [0.5, 0.98],
    densityRange: [0.24, 0.54],
    densityInfluence: 0.16,
    lineLength: 13.2,
    lineWidth: 0.56,
    opacityLight: 0.18,
    opacityNight: 0.24,
    detailOpacityScale: 0.42,
    calmCut: 0.66,
    edgeFade: 0.32,
  },
};

export function hashString(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(initial) {
  let a = initial >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function smooth(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rgba(rgb, alpha) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function valueNoise3(x, y, z, salt) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const zf = smooth(z - zi);

  const corner = (dx, dy, dz) => {
    let n = Math.imul(xi + dx, 374761393);
    n ^= Math.imul(yi + dy, 668265263);
    n ^= Math.imul(zi + dz, 2147483647);
    n ^= Math.imul(salt, 1274126177);
    n = (n ^ (n >>> 13)) >>> 0;
    n = Math.imul(n, 1274126177) >>> 0;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };

  const x00 = mix(corner(0, 0, 0), corner(1, 0, 0), xf);
  const x10 = mix(corner(0, 1, 0), corner(1, 1, 0), xf);
  const x01 = mix(corner(0, 0, 1), corner(1, 0, 1), xf);
  const x11 = mix(corner(0, 1, 1), corner(1, 1, 1), xf);
  const y0 = mix(x00, x10, yf);
  const y1 = mix(x01, x11, yf);
  return mix(y0, y1, zf);
}

function fbm(x, y, z, salt) {
  let value = 0;
  let amplitude = 0.58;
  let frequency = 1;
  let total = 0;
  for (let octave = 0; octave < 4; octave += 1) {
    value += valueNoise3(x * frequency, y * frequency, z, salt + octave * 97) * amplitude;
    total += amplitude;
    amplitude *= 0.52;
    frequency *= 2.05;
  }
  return value / total;
}

export function createParams(width, height, seed, variantKey, tuning = {}) {
  tuning = tuning ?? {};
  const variant = VARIANTS[variantKey] ?? VARIANTS.potential;
  const random = mulberry32(hashString(`${seed}:${variantKey}`));
  const aspect = width / height;
  const baseCount = width < 680 ? variant.countMobile : variant.countDesktop;
  const count = Number.isFinite(tuning.attractorCount)
    ? Math.max(2, Math.min(5, Math.round(tuning.attractorCount)))
    : baseCount;
  const influenceStrengthMultiplier = Number.isFinite(tuning.influenceStrengthMultiplier)
    ? Math.max(0.4, Math.min(1.8, tuning.influenceStrengthMultiplier))
    : 1;
  const vortexStrengthMultiplier = Number.isFinite(tuning.vortexStrengthMultiplier)
    ? Math.max(0.35, Math.min(1.9, tuning.vortexStrengthMultiplier))
    : 1;
  const influences = [];
  const bathymetricLayout = [
    { x: -1.08 * aspect, y: -0.56 },
    { x: 1.14 * aspect, y: -0.08 },
    { x: -0.44 * aspect, y: 0.68 },
    { x: 0.06 * aspect, y: -1.02 },
    { x: 1.24 * aspect, y: 0.84 },
  ];

  for (let i = 0; i < count; i += 1) {
    const type = variant.influencePlan[i % variant.influencePlan.length];
    const calmBias = type === "calm" ? 0.16 : 0;
    const radius = mix(variant.influenceRadius[0], variant.influenceRadius[1], random());
    const strength = mix(variant.influenceStrength[0], variant.influenceStrength[1], random());
    const localStrengthMultiplier = type === "vortex" ? vortexStrengthMultiplier : 1;
    const planned = variantKey === "bathymetric" ? bathymetricLayout[i % bathymetricLayout.length] : null;

    influences.push({
      type,
      x: planned ? planned.x + mix(-0.08, 0.08, random()) : mix(-0.78 * aspect, 0.78 * aspect, random()) + calmBias,
      y: planned ? planned.y + mix(-0.08, 0.08, random()) : mix(-0.74, 0.74, random()),
      radius,
      strength: strength * (type === "calm" ? 0.92 : 1) * influenceStrengthMultiplier * localStrengthMultiplier,
      polarity: random() > 0.5 ? 1 : -1,
      angle: random() * TAU,
    });
  }

  return {
    seed,
    variantKey,
    variant,
    seedHash: hashString(`${seed}:${variantKey}:field`),
    aspect,
    potentialScale: mix(variant.potentialScale[0], variant.potentialScale[1], random()),
    noiseScale: mix(0.5, 0.78, random()),
    globalFlow: {
      angle: mix(-0.18, 0.18, random()) + (random() > 0.5 ? 0 : Math.PI),
      strength: mix(variant.globalFlow[0], variant.globalFlow[1], random()),
    },
    influences,
    timeScale: 0.00003,
  };
}

function scalarPotential(x, y, t, params) {
  const variant = params.variant;
  const low = fbm(
    x * params.potentialScale + 11.7,
    y * params.potentialScale - 4.3,
    t,
    params.seedHash,
  );
  const lower = fbm(
    x * variant.lowerScale - 19.2,
    y * variant.lowerScale + 8.1,
    t * 0.35,
    params.seedHash + 541,
  );
  let value = (low * 0.72 + lower * 0.28) * 2 - 1;

  for (const influence of params.influences) {
    if (influence.type !== "depression" && influence.type !== "ridge" && influence.type !== "shelf") continue;

    const dx = x - influence.x;
    const dy = y - influence.y;
    const cos = Math.cos(influence.angle);
    const sin = Math.sin(influence.angle);
    const rx = dx * cos + dy * sin;
    const ry = -dx * sin + dy * cos;
    const stretch = influence.type === "ridge" ? 0.42 : influence.type === "shelf" ? 0.58 : 0.82;
    const q = Math.hypot(rx / influence.radius, ry / (influence.radius * stretch));
    const basin = Math.exp(-q * q * 1.55) * influence.strength;

    if (influence.type === "depression") {
      value -= basin * 0.9;
      value += Math.exp(-Math.pow(q - 0.82, 2) * 7.5) * influence.strength * 0.22;
    } else if (influence.type === "ridge") {
      value += basin * 0.46 * influence.polarity;
    } else if (influence.type === "shelf") {
      value += Math.tanh((rx / Math.max(0.2, influence.radius)) * 1.8) * basin * 0.34;
    }
  }

  return value;
}

export function sampleField(x, y, t, params) {
  const variant = params.variant;
  const epsilon = 0.0065;
  const pY1 = scalarPotential(x, y + epsilon, t, params);
  const pY0 = scalarPotential(x, y - epsilon, t, params);
  const pX1 = scalarPotential(x + epsilon, y, t, params);
  const pX0 = scalarPotential(x - epsilon, y, t, params);

  let vx = ((pY1 - pY0) / (epsilon * 2)) * variant.curlWeight;
  let vy = (-(pX1 - pX0) / (epsilon * 2)) * variant.curlWeight;

  const angleNoise =
    fbm(x * params.noiseScale + 34.1, y * params.noiseScale - 17.6, t, params.seedHash + 901) *
    TAU;
  vx += Math.cos(angleNoise) * variant.angleNoiseWeight;
  vy += Math.sin(angleNoise) * variant.angleNoiseWeight;

  vx += Math.cos(params.globalFlow.angle) * params.globalFlow.strength;
  vy += Math.sin(params.globalFlow.angle) * params.globalFlow.strength;

  let localEnergy = Math.hypot(vx, vy);
  let calmDamping = 1;

  for (const influence of params.influences) {
    const dx = x - influence.x;
    const dy = y - influence.y;
    const distance = Math.hypot(dx, dy) || 0.0001;
    const q = distance / influence.radius;
    const falloff = Math.exp(-q * q * 2.35);
    const nx = dx / distance;
    const ny = dy / distance;
    const amount = influence.strength * falloff;

    if (influence.type === "converge") {
      vx -= nx * amount;
      vy -= ny * amount;
    } else if (influence.type === "diverge") {
      vx += nx * amount;
      vy += ny * amount;
    } else if (influence.type === "vortex") {
      vx += -ny * amount * influence.polarity;
      vy += nx * amount * influence.polarity;
    } else if (influence.type === "calm") {
      calmDamping *= 1 - falloff * variant.calmCut;
    } else if (influence.type === "shear") {
      const side = Math.tanh((dx * 0.72 + dy * 0.38) / Math.max(0.12, influence.radius * 0.42));
      vx += ny * side * amount * 0.34;
      vy -= nx * side * amount * 0.34;
    }

    localEnergy += amount * 0.42;
  }

  vx *= calmDamping;
  vy *= calmDamping;

  const length = Math.hypot(vx, vy) || 1;
  return {
    x: vx / length,
    y: vy / length,
    energy: clamp(localEnergy * calmDamping * 0.4, 0, 1),
  };
}

export function getVector(x, y, t, params) {
  const vector = sampleField(x, y, t, params);
  return { x: vector.x, y: vector.y };
}

export function pointToWorld(px, py, width, height, aspect) {
  return {
    x: ((px / width) * 2 - 1) * aspect,
    y: (py / height) * 2 - 1,
  };
}

export function densityMask(x, y, params) {
  const variant = params.variant;
  const n = fbm(x * 0.92 - 2.4, y * 0.92 + 6.8, 0, params.seedHash + 2401);
  let density = mix(variant.densityRange[0], variant.densityRange[1], n);

  for (const influence of params.influences) {
    const distance = Math.hypot(x - influence.x, y - influence.y);
    const falloff = Math.exp(-Math.pow(distance / influence.radius, 2) * 1.7);
    if (influence.type === "calm") density -= falloff * variant.densityInfluence * 1.18;
    if (influence.type === "vortex" || influence.type === "converge") {
      density += falloff * variant.densityInfluence;
    }
    if (influence.type === "shear") density += falloff * variant.densityInfluence * 0.5;
    if (influence.type === "depression") {
      const ring = Math.exp(-Math.pow(distance / influence.radius - 0.82, 2) * 7);
      density += ring * variant.densityInfluence * 0.85;
      density -= falloff * variant.densityInfluence * 0.22;
    }
    if (influence.type === "ridge" || influence.type === "shelf") density += falloff * variant.densityInfluence * 0.38;
  }

  const edge = Math.max(Math.abs(x / params.aspect), Math.abs(y));
  density *= smooth(clamp((1.08 - edge) / variant.edgeFade, 0, 1));
  return clamp(density, 0.03, 0.82);
}

function drawGrain(ctx, width, height, palette, dpr, seed, theme) {
  const grainCanvas = document.createElement("canvas");
  const grainSize = Math.max(96, Math.floor(160 * dpr));
  grainCanvas.width = grainSize;
  grainCanvas.height = grainSize;
  const grainCtx = grainCanvas.getContext("2d");
  const image = grainCtx.createImageData(grainSize, grainSize);
  const random = mulberry32(hashString(`${seed}:grain:${theme}`));

  for (let i = 0; i < image.data.length; i += 4) {
    const bright = random() > 0.5;
    const source = bright ? palette.grainLight : palette.grainDark;
    const alpha = bright ? random() * 9 : random() * 7;
    image.data[i] = source[0];
    image.data[i + 1] = source[1];
    image.data[i + 2] = source[2];
    image.data[i + 3] = alpha;
  }

  grainCtx.putImageData(image, 0, 0);
  ctx.save();
  ctx.globalAlpha = theme === "night" ? 0.48 : 0.38;
  ctx.drawImage(grainCanvas, 0, 0, width, height);
  ctx.restore();
}

export function renderField(canvas, options = {}) {
  const renderStart = globalThis.performance?.now?.() ?? Date.now();
  const ctx = canvas.getContext("2d", { alpha: false });
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(options.dpr ?? window.devicePixelRatio ?? 1, options.maxDpr ?? 2);
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  const cssWidth = rect.width;
  const cssHeight = rect.height;
  const theme = options.theme === "night" ? "night" : "light";
  const seed = options.seed ?? "PHASE1";
  const variantKey = options.variant ?? "potential";
  const params = createParams(width, height, seed, variantKey);
  const variant = params.variant;
  const palette = PALETTES[theme];
  const random = mulberry32(hashString(`${seed}:${variantKey}:${width}:${height}:accept`));
  const t = options.reducedMotion ? 0 : 0.00001;
  const cell = cssWidth < 720 ? 18 : 16;
  const opacity = theme === "night" ? variant.opacityNight : variant.opacityLight;
  const layers = [
    { offset: 0, opacity, width: variant.lineWidth, length: variant.lineLength },
    {
      offset: 1849,
      opacity: opacity * variant.detailOpacityScale,
      width: variant.lineWidth * 0.72,
      length: variant.lineLength * 0.62,
    },
  ];

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);
  drawGrain(ctx, width, height, palette, dpr, seed, theme);

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.lineCap = "round";

  let drawn = 0;
  for (const layer of layers) {
    const layerRandom = mulberry32(hashString(`${seed}:${variantKey}:${layer.offset}`));
    const spacing = cell * (layer.offset ? 0.86 : 1);
    const cols = Math.ceil(cssWidth / spacing) + 2;
    const rows = Math.ceil(cssHeight / spacing) + 2;

    for (let row = -1; row < rows; row += 1) {
      for (let col = -1; col < cols; col += 1) {
        const jitterX = (layerRandom() - 0.5) * spacing * 0.88;
        const jitterY = (layerRandom() - 0.5) * spacing * 0.88;
        const px = col * spacing + jitterX;
        const py = row * spacing + jitterY;
        const world = pointToWorld(px, py, cssWidth, cssHeight, params.aspect);
        const density = densityMask(world.x, world.y, params);
        const acceptance = layer.offset ? density * 0.72 : density;

        if (random() > acceptance) continue;

        const field = sampleField(world.x, world.y, t, params);
        const local = density * 0.5 + field.energy * 0.5;
        const dashLength = layer.length * mix(0.68, 1.52, local) * mix(0.88, 1.12, layerRandom());
        const alpha = layer.opacity * mix(0.36, 1, local) * mix(0.65, 1.08, layerRandom());
        const color =
          local > 0.68 && layerRandom() > 0.84
            ? palette.accent
            : layer.offset
              ? palette.secondary
              : palette.primary;

        ctx.strokeStyle = rgba(color, alpha);
        ctx.lineWidth = layer.width;
        ctx.beginPath();
        ctx.moveTo(px - field.x * dashLength * 0.5, py - field.y * dashLength * 0.5);
        ctx.lineTo(px + field.x * dashLength * 0.5, py + field.y * dashLength * 0.5);
        ctx.stroke();
        drawn += 1;
      }
    }
  }

  ctx.restore();

  return {
    seed,
    theme,
    variantKey,
    label: variant.label,
    getVector,
    sampleField,
    params,
    drawn,
    renderMs: Math.round(((globalThis.performance?.now?.() ?? Date.now()) - renderStart) * 10) / 10,
    criteria:
      "Phase 1 only: local vector directions. No streamlines, scroll narrative, pointer interaction, or final engine.",
  };
}
