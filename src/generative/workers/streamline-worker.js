import {
  createStreamlineGenerationJob,
  generateStreamlines,
} from "../core/streamline-core.js?v=stable-field-20260703-scroll7";

function framePayload(descriptor, generated, generationMs) {
  return {
    anchorKey: descriptor.anchorKey,
    density: descriptor.density,
    profile: descriptor.profile,
    tuning: descriptor.tuning,
    index: descriptor.index,
    fieldTime: descriptor.fieldTime,
    generated,
    generationMs,
  };
}

function cloneGenerated(generated) {
  return {
    ...generated,
    lines: generated.lines.map((line) => ({
      ...line,
      points: line.points.map((point) => ({ ...point })),
    })),
  };
}

function generateClassicFrame(message) {
  const started = performance.now();
  const { descriptor, width, height, taskId } = message;
  const generated = generateStreamlines(width, height, descriptor.seed, descriptor.options);
  const generationMs = Math.round((performance.now() - started) * 10) / 10;

  self.postMessage({
    type: "frame",
    taskId,
    frame: framePayload(descriptor, generated, generationMs),
  });
}

function generateProgressiveFrame(message) {
  const started = performance.now();
  const { descriptor, width, height, taskId } = message;
  const job = createStreamlineGenerationJob(width, height, descriptor.seed, descriptor.options);
  const initialSnapshot = job.snapshot();
  const targetRatio = Number.isFinite(message.primer?.targetRatio) ? message.primer.targetRatio : 0.26;
  const minLines = Number.isFinite(message.primer?.minLines) ? message.primer.minLines : 72;
  const maxMs = Number.isFinite(message.primer?.maxMs) ? message.primer.maxMs : 64;
  const primerTarget = Math.max(18, Math.min(initialSnapshot.targetCount, Math.round(initialSnapshot.targetCount * targetRatio)));
  const primerMinimum = Math.min(primerTarget, Math.max(12, Math.round(minLines)));
  let primerSent = false;

  while (!job.snapshot().done) {
    job.processBatch({ maxCandidates: 48, timeBudgetMs: 6 });
    const snapshot = job.snapshot();
    const elapsed = performance.now() - started;
    const reachedTarget = snapshot.lineCount >= primerTarget;
    const reachedMinimumAfterBudget = elapsed >= maxMs && snapshot.lineCount >= primerMinimum;
    const exceededHardBudget = elapsed >= maxMs * 1.45 && snapshot.lineCount > 0;

    if (!primerSent && (reachedTarget || reachedMinimumAfterBudget || exceededHardBudget || snapshot.done)) {
      primerSent = true;
      self.postMessage({
        type: "primerFrame",
        taskId,
        frame: framePayload(descriptor, cloneGenerated(job.getResult()), Math.round(elapsed * 10) / 10),
      });
      break;
    }
  }

  job.finish();
  self.postMessage({
    type: "frame",
    taskId,
    frame: framePayload(descriptor, job.getResult(), Math.round((performance.now() - started) * 10) / 10),
  });
}

self.onmessage = (event) => {
  const message = event.data || {};
  if (message.type !== "generateFrame" && message.type !== "generateProgressiveFrame") return;

  try {
    if (message.type === "generateProgressiveFrame") generateProgressiveFrame(message);
    else generateClassicFrame(message);
  } catch (error) {
    self.postMessage({
      type: "error",
      taskId: message.taskId,
      error: error?.message || "Worker generation failed",
    });
  }
};
