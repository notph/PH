import { createFieldEngine } from "./FieldEngine.js?v=stable-field-20260703-scroll7";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function defaultScrollProgress() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return clamp(window.scrollY / maxScroll, 0, 1);
}

export class FieldRenderer {
  constructor(options = {}) {
    if (!options.canvas) throw new Error("FieldRenderer requires a canvas.");
    this.canvas = options.canvas;
    this.pointerTarget = options.pointerTarget || options.canvas;
    this.scrollProvider = options.scrollProvider || defaultScrollProgress;
    this.reducedMotionProvider = options.reducedMotionProvider || (() => false);
    this.contentProvider = options.contentProvider;
    this.options = {
      seed: options.seed,
      theme: options.theme,
      progress: options.progress,
      lockProgress: options.lockProgress,
      interaction: options.interaction,
      visibilityProfile: options.visibilityProfile,
      pointerEnabled: options.pointerEnabled,
      generationStrategy: options.generationStrategy,
      prewarmStrategy: options.prewarmStrategy,
      prewarmBatchBudgetMs: options.prewarmBatchBudgetMs,
      prewarmBatchCandidateLimit: options.prewarmBatchCandidateLimit,
      prewarmBatchDelayMs: options.prewarmBatchDelayMs,
      workerPrewarm: options.workerPrewarm,
      initialPrimer: options.initialPrimer,
      initialPrimerMode: options.initialPrimerMode,
      birthRevealDurationMs: options.birthRevealDurationMs,
      birthRevealMode: options.birthRevealMode,
      longBreathMode: options.longBreathMode,
      ambientMotionMode: options.ambientMotionMode,
      mobileFirstImpression: options.mobileFirstImpression,
      workerUrl: options.workerUrl,
      maxDpr: options.maxDpr,
      mode: options.mode,
      preset: options.preset,
    };
    this.engine = null;
    this.resizeTimer = 0;
    this.scrollRaf = 0;
    this.pointerRaf = 0;
    this.pendingPointer = null;
    this.canvasRect = null;
    this.onScroll = this.onScroll.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  mount() {
    const rect = this.canvas.getBoundingClientRect();
    const progress = Number.isFinite(this.options.progress) ? this.options.progress : this.scrollProvider();

    this.engine = createFieldEngine(this.canvas, {
      ...this.options,
      progress,
      reducedMotion: this.reducedMotionProvider(),
      viewportWidth: rect.width,
      contentProvider: this.contentProvider,
    });

    this.canvasRect = rect;
    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.onResize, { passive: true });
    if (this.options.pointerEnabled !== false) {
      this.pointerTarget.addEventListener("pointermove", this.onPointerMove, { passive: true });
      this.pointerTarget.addEventListener("pointerleave", this.onPointerLeave, { passive: true });
      this.pointerTarget.addEventListener("pointercancel", this.onPointerLeave, { passive: true });
    }
    return this;
  }

  onScroll() {
    if (!this.engine || this.options.lockProgress) return;
    if (this.scrollRaf) return;
    this.scrollRaf = window.requestAnimationFrame(() => {
      this.scrollRaf = 0;
      if (!this.engine || this.options.lockProgress) return;
      this.engine.setScrollProgress(this.scrollProvider());
    });
  }

  onPointerMove(event) {
    if (!this.engine) return;
    this.pendingPointer = { x: event.clientX, y: event.clientY };
    if (this.pointerRaf) return;
    this.pointerRaf = window.requestAnimationFrame(() => {
      this.pointerRaf = 0;
      if (!this.engine || !this.pendingPointer) return;
      const rect = this.canvasRect || this.canvas.getBoundingClientRect();
      this.engine.setPointer(this.pendingPointer.x - rect.left, this.pendingPointer.y - rect.top, 1);
    });
  }

  onPointerLeave() {
    this.pendingPointer = null;
    this.engine?.releasePointer();
  }

  onResize() {
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      if (!this.engine) return;
      const rect = this.canvas.getBoundingClientRect();
      this.canvasRect = rect;
      this.engine.update({
        reducedMotion: this.reducedMotionProvider(),
        viewportWidth: rect.width,
      });
    }, 180);
  }

  setProgress(progress) {
    this.options.progress = clamp(Number(progress) || 0, 0, 1);
    this.engine?.setScrollProgress(this.options.progress);
    return this;
  }

  update(options = {}) {
    this.options = { ...this.options, ...options };
    const rect = this.canvas.getBoundingClientRect();
    this.canvasRect = rect;
    this.engine?.update({
      ...this.options,
      reducedMotion: this.reducedMotionProvider(),
      viewportWidth: rect.width,
      contentProvider: this.contentProvider,
    });
    return this;
  }

  setPointer(x, y, strength = 1) {
    this.engine?.setPointer(x, y, strength);
    return this;
  }

  releasePointer() {
    this.engine?.releasePointer();
    return this;
  }

  snapshot() {
    return {
      phase: 10,
      renderer: {
        module: "FieldRenderer",
        hostOwnsContent: true,
        hostTransmitsScroll: true,
        hostTransmitsPointer: true,
        hostTransmitsTheme: true,
        hostTransmitsViewport: true,
        hostTransmitsReducedMotion: true,
      },
      field: this.engine?.snapshot() || null,
    };
  }

  destroy() {
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.onResize);
    this.pointerTarget.removeEventListener("pointermove", this.onPointerMove);
    this.pointerTarget.removeEventListener("pointerleave", this.onPointerLeave);
    this.pointerTarget.removeEventListener("pointercancel", this.onPointerLeave);
    window.clearTimeout(this.resizeTimer);
    if (this.scrollRaf) window.cancelAnimationFrame(this.scrollRaf);
    if (this.pointerRaf) window.cancelAnimationFrame(this.pointerRaf);
    this.scrollRaf = 0;
    this.pointerRaf = 0;
    this.pendingPointer = null;
    this.engine?.destroy();
    this.engine = null;
  }
}

export function createFieldRenderer(options = {}) {
  return new FieldRenderer(options).mount();
}
