import { createFieldRenderer } from "./FieldRenderer.js?v=stable-field-20260703-scroll7";

const DEFAULTS = {
  seed: "PHASE20-A",
  theme: "light",
  mode: "productionStill",
  visibilityProfile: "presence",
  interaction: "softDrift",
  generationStrategy: "worker-visible",
  prewarmStrategy: "idle-batched",
  prewarmBatchBudgetMs: 8,
  prewarmBatchCandidateLimit: 72,
  prewarmBatchDelayMs: 8,
  workerPrewarm: true,
  initialPrimer: false,
  initialPrimerMode: "progressive",
  birthRevealDurationMs: 1450,
  birthRevealMode: "staggered",
  longBreathMode: "confidence",
  ambientMotionMode: "off",
  mobileFirstImpression: true,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function defaultScrollProgress() {
  const panelDistance = Math.max(1, window.innerHeight * 3.4);
  return clamp(window.scrollY / panelDistance, 0, 1);
}

function contentRectsFrom(selector) {
  const zones = [...document.querySelectorAll(selector)];
  let cachedKey = "";
  let cachedRects = [];

  return () => {
    const key = [
      window.scrollX,
      window.scrollY,
      window.innerWidth,
      window.innerHeight,
      document.fonts?.status || "unknown",
    ].join(":");
    if (key === cachedKey) return cachedRects;

    cachedKey = key;
    cachedRects = zones.flatMap((zone) => {
      const range = document.createRange();
      range.selectNodeContents(zone);
      const rects = [...range.getClientRects()].filter((rect) => rect.width > 3 && rect.height > 3);
      range.detach();
      return rects.length ? rects : [zone.getBoundingClientRect()];
    }).filter((rect) => rect.bottom > -180 && rect.top < window.innerHeight + 180);
    return cachedRects;
  };
}

function resolveTheme(requestedTheme) {
  if (requestedTheme === "night" || requestedTheme === "light" || requestedTheme === "dawn" || requestedTheme === "dusk") {
    return requestedTheme;
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "night" : "light";
}

export function createProductionField(options = {}) {
  if (!options.canvas) throw new Error("createProductionField requires a canvas.");

  const reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const contentProvider =
    typeof options.contentProvider === "function"
      ? options.contentProvider
      : contentRectsFrom(options.contentSelector || "[data-content-zone]");
  const workerUrl =
    options.workerUrl ||
    new URL(options.workerPath || "./streamline-worker.js?v=stable-field-20260703-scroll7", import.meta.url);

  const renderer = createFieldRenderer({
    ...DEFAULTS,
    ...options,
    canvas: options.canvas,
    pointerTarget: options.pointerTarget || document.body,
    seed: options.seed || DEFAULTS.seed,
    theme: resolveTheme(options.theme),
    progress: Number.isFinite(options.progress) ? options.progress : defaultScrollProgress(),
    interaction: options.interaction === "off" ? undefined : options.interaction || DEFAULTS.interaction,
    workerUrl,
    reducedMotionProvider: () => Boolean(options.reducedMotion || reducedMotionQuery?.matches),
    scrollProvider: options.scrollProvider || defaultScrollProgress,
    contentProvider,
  });

  return {
    renderer,
    setProgress(progress) {
      renderer.setProgress(progress);
      return this;
    },
    setPointer(x, y, strength = 1) {
      renderer.setPointer(x, y, strength);
      return this;
    },
    releasePointer() {
      renderer.releasePointer();
      return this;
    },
    setTheme(theme) {
      renderer.update({ theme: resolveTheme(theme) });
      return this;
    },
    snapshot() {
      return {
        phase: 25,
        productionCandidate: true,
        defaults: DEFAULTS,
        renderer: renderer.snapshot(),
      };
    },
    destroy() {
      renderer.destroy();
    },
  };
}

export { DEFAULTS as PRODUCTION_FIELD_DEFAULTS };
