export const PERFORMANCE_BUDGETS = {
  desktop: {
    targetFps: 60,
    maxAverageDrawMs: 16.7,
    maxGenerationMsResearch: 520,
    lineRange: [250, 900],
    maxPointsPerLine: 220,
  },
  mobile: {
    targetFps: 30,
    maxAverageDrawMs: 33.3,
    maxGenerationMsResearch: 120,
    lineRange: [80, 250],
    maxPointsPerLine: 220,
  },
};

export function classifyViewport(width) {
  return width < 680 ? "mobile" : "desktop";
}

export function summarizePerformance(snapshot) {
  const viewportClass = classifyViewport(snapshot?.cssWidth ?? 1440);
  const budget = PERFORMANCE_BUDGETS[viewportClass];
  const avgDrawMs = snapshot?.avgDrawMs ?? 0;
  const visibleBatched = snapshot?.generationStrategy === "visible-batched";
  const workerVisible = snapshot?.generationStrategy === "worker-visible";
  const workerFallbackActive = workerVisible && Boolean(snapshot?.workerFallbackActive);

  let generationMs = snapshot?.initialGenerationMs ?? snapshot?.lastGenerationMs ?? 0;
  let maxGenerationTaskMs = generationMs;

  if (visibleBatched) {
    generationMs = snapshot?.initialVisibleGenerationMs ?? generationMs;
    maxGenerationTaskMs = snapshot?.initialVisibleMaxTaskMs ?? generationMs;
  } else if (workerFallbackActive) {
    generationMs = snapshot?.initialVisibleGenerationMs ?? snapshot?.lastGenerationMs ?? 0;
    maxGenerationTaskMs = snapshot?.initialVisibleMaxTaskMs ?? generationMs;
  } else if (workerVisible) {
    generationMs = snapshot?.initialVisibleGenerationMs || snapshot?.workerGenerationMs || snapshot?.lastGenerationMs || 0;
    maxGenerationTaskMs = 0;
  }

  const firstVisibleCommitMs =
    visibleBatched || workerVisible ? (snapshot?.firstVisibleCommitMs ?? 0) : generationMs;

  return {
    viewportClass,
    avgDrawMs,
    generationMs,
    maxGenerationTaskMs,
    firstVisibleCommitMs,
    workerGenerationMs: workerVisible ? generationMs : undefined,
    workerTotalGenerationMs: workerVisible ? (snapshot?.workerGenerationMs ?? 0) : undefined,
    workerRoundTripMs: workerVisible ? (snapshot?.workerRoundTripMs ?? 0) : undefined,
    workerPrewarmEnabled: workerVisible ? Boolean(snapshot?.workerPrewarmEnabled) : undefined,
    workerPrewarmGenerationMs: workerVisible ? (snapshot?.workerPrewarmGenerationMs ?? 0) : undefined,
    workerPrewarmRoundTripMs: workerVisible ? (snapshot?.workerPrewarmRoundTripMs ?? 0) : undefined,
    drawWithinBudget: avgDrawMs <= budget.maxAverageDrawMs,
    generationWithinResearchBudget: maxGenerationTaskMs <= budget.maxGenerationMsResearch,
    workerFallbackActive: workerVisible ? workerFallbackActive : undefined,
    budget,
  };
}
