import { createNarrativeField } from "./core/narrative-core.js?v=stable-field-20260703-scroll7";
import { resolveInteraction } from "./interactions.js?v=stable-field-20260703-scroll7";
import { resolveTheme } from "./palettes.js";
import { resolveNarrativePreset } from "./fieldPresets.js";
import { summarizePerformance } from "./performance.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function stableOptions(options = {}) {
  const prewarmStrategy =
    options.prewarmStrategy === "idle-batched" ? "idle-batched" : options.prewarmStrategy === "idle" ? "idle" : "none";
  const generationStrategy =
    options.generationStrategy === "worker-visible"
      ? "worker-visible"
      : options.generationStrategy === "visible-batched"
      ? "visible-batched"
      : options.generationStrategy === "visible-first"
        ? "visible-first"
        : "eager";
  const interaction = options.interaction === "softDrift" || options.interaction === "softRepel" ? options.interaction : undefined;
  const visibilityProfile =
    options.visibilityProfile === "instrument" || options.visibilityProfile === "clearer" || options.visibilityProfile === "presence"
      ? options.visibilityProfile
      : "baseline";
  return {
    seed: options.seed || "PHASE10-A",
    theme: resolveTheme(options.theme),
    preset: resolveNarrativePreset(options.preset),
    mode: options.mode || "glacial",
    progress: clamp(Number.isFinite(options.progress) ? options.progress : 0, 0, 1),
    lockProgress: options.lockProgress === true,
    reducedMotion: Boolean(options.reducedMotion),
    interaction,
    visibilityProfile,
    pointerEnabled: options.pointerEnabled,
    viewportWidth: options.viewportWidth,
    maxDpr: options.maxDpr,
    generationStrategy,
    prewarmStrategy,
    prewarmBatchBudgetMs: options.prewarmBatchBudgetMs,
    prewarmBatchCandidateLimit: options.prewarmBatchCandidateLimit,
    prewarmBatchDelayMs: options.prewarmBatchDelayMs,
    workerPrewarm: options.workerPrewarm === true,
    initialPrimer: options.initialPrimer === true,
    initialPrimerMode: options.initialPrimerMode === "progressive" ? "progressive" : "separate",
    birthRevealDurationMs: options.birthRevealDurationMs,
    birthRevealMode: options.birthRevealMode === "staggered" ? "staggered" : "uniform",
    longBreathMode: options.longBreathMode === "confidence" ? "confidence" : "off",
    ambientMotionMode: options.ambientMotionMode === "weather" ? "weather" : "off",
    mobileFirstImpression: options.mobileFirstImpression === true,
    workerUrl: options.workerUrl,
    contentProvider: options.contentProvider,
  };
}

function requiresRebuild(previous, next) {
  if (!previous) return true;
  return [
    "seed",
    "theme",
    "preset",
    "mode",
    "lockProgress",
    "reducedMotion",
    "interaction",
    "visibilityProfile",
    "pointerEnabled",
    "viewportWidth",
    "maxDpr",
    "generationStrategy",
    "prewarmStrategy",
    "prewarmBatchBudgetMs",
    "prewarmBatchCandidateLimit",
    "prewarmBatchDelayMs",
    "workerPrewarm",
    "initialPrimer",
    "initialPrimerMode",
    "birthRevealDurationMs",
    "birthRevealMode",
    "longBreathMode",
    "ambientMotionMode",
    "mobileFirstImpression",
    "workerUrl",
    "contentProvider",
  ].some((key) => previous[key] !== next[key]);
}

export class FieldEngine {
  constructor(canvas, options = {}) {
    if (!canvas) throw new Error("FieldEngine requires a canvas.");
    this.canvas = canvas;
    this.options = stableOptions(options);
    this.controller = null;
    this.mounted = false;
  }

  mount() {
    if (!this.mounted) {
      this.rebuild();
      this.mounted = true;
    }
    return this;
  }

  rebuild() {
    if (this.controller) this.controller.destroy();

    const interaction = resolveInteraction(this.options.interaction, {
      viewportWidth: this.options.viewportWidth ?? this.canvas.getBoundingClientRect().width,
      reducedMotion: this.options.reducedMotion,
      pointerEnabled: this.options.pointerEnabled,
    });

    this.controller = createNarrativeField(this.canvas, {
      seed: this.options.seed,
      theme: this.options.theme,
      preset: this.options.preset,
      mode: this.options.mode,
      progress: this.options.progress,
      lockProgress: this.options.lockProgress,
      reducedMotion: this.options.reducedMotion,
      interaction: interaction.interaction,
      visibilityProfile: this.options.visibilityProfile,
      pointerEnabled: interaction.pointerEnabled,
      attachPointerEvents: false,
      maxDpr: this.options.maxDpr,
      generationStrategy: this.options.generationStrategy,
      prewarmStrategy: this.options.prewarmStrategy,
      prewarmBatchBudgetMs: this.options.prewarmBatchBudgetMs,
      prewarmBatchCandidateLimit: this.options.prewarmBatchCandidateLimit,
      prewarmBatchDelayMs: this.options.prewarmBatchDelayMs,
      workerPrewarm: this.options.workerPrewarm,
      initialPrimer: this.options.initialPrimer,
      initialPrimerMode: this.options.initialPrimerMode,
      birthRevealDurationMs: this.options.birthRevealDurationMs,
      birthRevealMode: this.options.birthRevealMode,
      longBreathMode: this.options.longBreathMode,
      ambientMotionMode: this.options.ambientMotionMode,
      mobileFirstImpression: this.options.mobileFirstImpression,
      workerUrl: this.options.workerUrl,
      contentProvider: this.options.contentProvider,
    });

    this.controller.start();
    return this;
  }

  update(options = {}) {
    const next = stableOptions({ ...this.options, ...options });
    if (requiresRebuild(this.options, next)) {
      this.options = next;
      this.rebuild();
    } else {
      this.options = next;
      this.setScrollProgress(next.progress);
    }
    return this;
  }

  setScrollProgress(progress) {
    const next = clamp(Number(progress) || 0, 0, 1);
    this.options.progress = next;
    if (!this.controller) return this;
    if (this.options.lockProgress) this.controller.setProgress(next);
    else this.controller.setTargetProgress(next);
    return this;
  }

  setPointer(x, y, strength = 1) {
    this.controller?.pointerMove(x, y, strength);
    return this;
  }

  releasePointer() {
    this.controller?.pointerLeave();
    return this;
  }

  snapshot() {
    const engine = this.controller?.snapshot() || null;
    return {
      phase: 10,
      architecture: {
        module: "FieldEngine",
        isolated: true,
        productionIntegration: false,
        contentIndependent: typeof this.options.contentProvider === "function",
        receivesTheme: true,
        receivesScroll: true,
        receivesPointer: Boolean(this.options.interaction),
        receivesViewport: true,
        receivesReducedMotion: true,
      },
      options: {
        seed: this.options.seed,
        theme: this.options.theme,
        preset: this.options.preset,
        mode: this.options.mode,
        progress: this.options.progress,
        lockProgress: this.options.lockProgress,
        reducedMotion: this.options.reducedMotion,
        interaction: this.options.interaction,
        visibilityProfile: this.options.visibilityProfile,
        generationStrategy: this.options.generationStrategy,
        prewarmStrategy: this.options.prewarmStrategy,
        prewarmBatchBudgetMs: this.options.prewarmBatchBudgetMs,
        prewarmBatchCandidateLimit: this.options.prewarmBatchCandidateLimit,
        prewarmBatchDelayMs: this.options.prewarmBatchDelayMs,
        workerPrewarm: this.options.workerPrewarm,
        initialPrimer: this.options.initialPrimer,
        initialPrimerMode: this.options.initialPrimerMode,
        birthRevealDurationMs: this.options.birthRevealDurationMs,
        birthRevealMode: this.options.birthRevealMode,
        longBreathMode: this.options.longBreathMode,
        ambientMotionMode: this.options.ambientMotionMode,
        mobileFirstImpression: this.options.mobileFirstImpression,
        workerUrl: this.options.workerUrl,
      },
      engine,
      performance: summarizePerformance({
        ...engine,
        cssWidth: this.canvas.getBoundingClientRect().width,
      }),
    };
  }

  destroy() {
    if (this.controller) this.controller.destroy();
    this.controller = null;
    this.mounted = false;
  }
}

export function createFieldEngine(canvas, options = {}) {
  return new FieldEngine(canvas, options).mount();
}
