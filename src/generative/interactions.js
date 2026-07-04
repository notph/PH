export const POINTER_INFLUENCE = {
  softRepel: {
    radius: 190,
    strength: 0.075,
    decay: 0.955,
    mode: "softRepel",
    role: "Weak local opening, felt more than seen.",
  },
  softDrift: {
    radius: 260,
    strength: 0.015,
    decay: 0.982,
    mode: "softDrift",
    role: "Weak local drift, no circular opening.",
  },
};

export function resolveInteraction(interaction, options = {}) {
  const contract = POINTER_INFLUENCE[interaction];
  if (!contract) {
    return {
      interaction: undefined,
      pointerEnabled: false,
      contract: null,
    };
  }

  const mobile = options.viewportWidth !== undefined && options.viewportWidth < 680;
  const reducedMotion = Boolean(options.reducedMotion);
  const pointerEnabled = !mobile && !reducedMotion && options.pointerEnabled !== false;

  return {
    interaction,
    pointerEnabled,
    contract: {
      ...contract,
      enabled: pointerEnabled,
      mobileDisabled: mobile,
      reducedMotionDisabled: reducedMotion,
    },
  };
}
