import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/philippeholub/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const root = process.cwd();
const outDir = path.join(root, "captures/root-integration");
const base = process.env.PH_ROOT_BASE_URL ?? "http://127.0.0.1:5192";
const executablePath =
  "/Users/philippeholub/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell";

await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const errors = [];

await page.addInitScript(() => {
  window.__phPerfProbe = { longTasks: [] };
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__phPerfProbe.longTasks.push({
          duration: Math.round(entry.duration * 10) / 10,
          startTime: Math.round(entry.startTime * 10) / 10,
        });
      }
    });
    observer.observe({ type: "longtask", buffered: true });
  } catch {
    window.__phPerfProbe.longTaskUnsupported = true;
  }
});

page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

function url(params = {}) {
  const query = new URLSearchParams({ seed: "PHASE20-A", progress: "0.52", ...params });
  return `${base}/index.html?${query.toString()}`;
}

async function waitForSettled() {
  const started = Date.now();
  while (Date.now() - started < 10000) {
    const settled = await page.evaluate(() => {
      const engine = window.__phRootSnapshot?.().field?.renderer?.field?.engine;
      const anchors = engine?.anchorStats ?? [];
      return Boolean(engine?.firstVisibleCommitMs) && anchors.some((anchor) => anchor.generated) && anchors.every((anchor) => !anchor.generated || anchor.birthProgress >= 0.99);
    });
    if (settled) return true;
    await page.waitForTimeout(40);
  }
  return false;
}

async function readMetrics() {
  return page.evaluate(() => {
    const canvas = document.getElementById("field");
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const stepX = Math.max(1, Math.floor(width / 220));
    const stepY = Math.max(1, Math.floor(height / 160));
    const data = ctx.getImageData(0, 0, width, height).data;
    let hash = 2166136261;
    let samples = 0;
    let signal = 0;
    let sum = 0;
    let sumSq = 0;
    const samplesLuma = [];
    for (let y = 0; y < height; y += stepY) {
      for (let x = 0; x < width; x += stepX) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        hash ^= r + (g << 8) + (b << 16) + (a << 24);
        hash = Math.imul(hash, 16777619);
        samples += 1;
        samplesLuma.push(Math.round(luma * 10) / 10);
        sum += luma;
        sumSq += luma * luma;
        if (a > 8 && luma < 235) signal += 1;
      }
    }
    const avg = sum / Math.max(1, samples);
    const longTasks = window.__phPerfProbe?.longTasks ?? [];
    return {
      snapshot: window.__phRootSnapshot?.() || null,
      canvas: {
        hash: (hash >>> 0).toString(16),
        lumaStdDev: Math.round(Math.sqrt(Math.max(0, sumSq / Math.max(1, samples) - avg * avg)) * 100) / 100,
        signalRatio: Math.round((signal / Math.max(1, samples)) * 10000) / 10000,
        samplesLuma,
      },
      perfProbe: {
        longTaskCount: longTasks.length,
        maxLongTaskMs: Math.max(0, ...longTasks.map((task) => task.duration)),
      },
    };
  });
}

function engine(metrics) {
  return metrics.snapshot?.field?.renderer?.field?.engine || null;
}

function options(metrics) {
  return metrics.snapshot?.field?.renderer?.field?.options || null;
}

function geometry(metrics) {
  const current = engine(metrics);
  const visibleKeys = new Set((current?.visibleAnchors ?? []).map((anchor) => anchor.anchor));
  return (current?.anchorStats ?? [])
    .filter((anchor) => visibleKeys.size === 0 || visibleKeys.has(anchor.key))
    .map((anchor) => `${anchor.key}:${anchor.fullLineCount}:${anchor.density}:${anchor.fieldVariant}`)
    .join("|");
}

function canvasDelta(a, b) {
  const left = a?.metrics?.canvas?.samplesLuma ?? [];
  const right = b?.metrics?.canvas?.samplesLuma ?? [];
  const count = Math.min(left.length, right.length);
  if (!count) return { avgAbs: 0, changedRatio: 0 };

  let sumAbs = 0;
  let changed = 0;
  for (let i = 0; i < count; i += 1) {
    const delta = Math.abs(left[i] - right[i]);
    sumAbs += delta;
    if (delta >= 1.2) changed += 1;
  }

  return {
    avgAbs: Math.round((sumAbs / count) * 1000) / 1000,
    changedRatio: Math.round((changed / count) * 10000) / 10000,
  };
}

async function capture(name, params = {}, viewport = { width: 1440, height: 1000 }, extraWaitMs = 1040) {
  await page.setViewportSize(viewport);
  await page.goto(url(params), { waitUntil: "domcontentloaded", timeout: 30000 });
  const settled = await waitForSettled();
  await page.waitForTimeout(extraWaitMs);
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, fullPage: false });
  const metrics = await readMetrics();
  return { name, file, settled, metrics, engine: engine(metrics), options: options(metrics), geometry: geometry(metrics) };
}

const captures = [];
captures.push(await capture("root-light-settled.png"));
captures.push(await capture("root-light-breath-later.png", {}, { width: 1440, height: 1000 }, 3200));
captures.push(await capture("root-night-settled.png", { theme: "night" }));
captures.push(await capture("root-mobile-settled.png", {}, { width: 390, height: 844 }));
captures.push(await capture("root-reduced-motion.png", { motion: "reduce" }));

await browser.close();

function byName(name) {
  return captures.find((capture) => capture.name === name);
}

const light = byName("root-light-settled.png");
const breath = byName("root-light-breath-later.png");
const night = byName("root-night-settled.png");
const mobile = byName("root-mobile-settled.png");
const reduced = byName("root-reduced-motion.png");
const breathDelta = canvasDelta(light, breath);

const comparisons = {
  rootPageLoaded: light?.metrics?.snapshot?.rootIntegration === true,
  rootUsesProductionDefaults:
    light?.options?.generationStrategy === "worker-visible" &&
    light?.options?.visibilityProfile === "presence" &&
    light?.options?.birthRevealMode === "staggered" &&
    light?.options?.longBreathMode === "confidence" &&
    light?.options?.ambientMotionMode === "off" &&
    light?.options?.mode === "weather",
  fieldVisible:
    (light?.metrics?.canvas?.lumaStdDev ?? 0) >= 2.35 &&
    (light?.metrics?.canvas?.lumaStdDev ?? Infinity) <= 3.65 &&
    (light?.metrics?.canvas?.signalRatio ?? 0) >= 0.015,
  breathChangesPixels: light?.metrics?.canvas?.hash !== breath?.metrics?.canvas?.hash,
  breathPixelDelta: light?.metrics?.canvas?.hash !== breath?.metrics?.canvas?.hash,
  breathKeepsGeometry: light?.geometry === breath?.geometry,
  nightStillQuiet:
    (night?.metrics?.canvas?.lumaStdDev ?? 0) >= 1.25 &&
    (night?.metrics?.canvas?.lumaStdDev ?? Infinity) <= 2.25,
  mobileStillQuiet:
    (mobile?.metrics?.canvas?.lumaStdDev ?? 0) >= 1.75 &&
    (mobile?.metrics?.canvas?.lumaStdDev ?? Infinity) <= 3.1 &&
    (mobile?.metrics?.canvas?.signalRatio ?? Infinity) <= 0.025,
  reducedMotionDisablesBirthAndBreath:
    reduced?.engine?.initialPrimerEnabled === false &&
    reduced?.engine?.longBreathMode === "off" &&
    reduced?.engine?.ambientMotionMode === "off",
  noLongTasks: captures.every((capture) => (capture.metrics?.perfProbe?.maxLongTaskMs ?? 0) === 0),
  noConsoleErrors: errors.length === 0,
};

const report = {
  capturedAt: new Date().toISOString(),
  base,
  errors,
  captures: captures.map((capture) => ({
    name: capture.name,
    file: capture.file,
    settled: capture.settled,
    canvas: {
      hash: capture.metrics.canvas.hash,
      lumaStdDev: capture.metrics.canvas.lumaStdDev,
      signalRatio: capture.metrics.canvas.signalRatio,
    },
    options: capture.options,
    geometry: capture.geometry,
    engine: {
      firstVisibleCommitMs: capture.engine?.firstVisibleCommitMs,
      initialPrimerEnabled: capture.engine?.initialPrimerEnabled,
      longBreathMode: capture.engine?.longBreathMode,
      ambientMotionMode: capture.engine?.ambientMotionMode,
      ambientMotionMaxPx: capture.engine?.ambientMotionMaxPx,
      ambientMotionAvgPx: capture.engine?.ambientMotionAvgPx,
      pointerEnabled: capture.engine?.pointerEnabled,
      avgDrawMs: capture.engine?.avgDrawMs,
    },
    perfProbe: capture.metrics.perfProbe,
  })),
  breathDelta,
  comparisons,
};

await fs.writeFile(path.join(outDir, "root-integration-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ base, comparisons, errors }, null, 2));
