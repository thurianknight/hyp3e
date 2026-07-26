/**
 * Return roll-mode choices in the label-map shape expected by Handlebars selectOptions.
 * Foundry v14 stores richer mode definitions under CONFIG.ChatMessage.modes, while
 * Foundry v13 stores a label map under CONFIG.Dice.rollModes.
 * @param {object} [config=CONFIG] - Foundry's CONFIG object
 * @returns {Record<string, string>}
 */
export function getRollModeChoices(config = CONFIG) {
  const messageModes = config.ChatMessage?.modes;
  if (!messageModes) return config.Dice.rollModes;

  return Object.fromEntries(
    Object.entries(messageModes).map(([mode, definition]) => [
      mode,
      typeof definition === "string" ? definition : definition.label
    ])
  );
}

/**
 * Return the Roll#toMessage option supported by the active Foundry generation.
 * @param {string} mode - Selected message visibility mode
 * @param {number} [generation=game.release?.generation] - Foundry generation
 * @returns {{rollMode: string}|{messageMode: string}}
 */
export function getRollMessageOptions(mode, generation = game.release?.generation) {
  return generation >= 14 ? { messageMode: mode } : { rollMode: mode };
}

/**
 * Return the mergeObject option that enables deletion/operator processing.
 * @param {number} [generation=game.release?.generation] - Foundry generation
 * @returns {{performDeletions: boolean}|{applyOperators: boolean}}
 */
export function getMergeObjectDeletionOptions(generation = game.release?.generation) {
  return generation >= 14 ? { applyOperators: true } : { performDeletions: true };
}
