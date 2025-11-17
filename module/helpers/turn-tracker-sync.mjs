import { Hyp3eLogger } from "./logger.mjs";

/**
 * HYP3ETurnTrackerSync
 * 
 * Listens for changes to the "explorationTurn" world setting.
 * Automatically calls the same hooks that your previous socket sync did.
 * This ensures all clients update their UIs when the GM changes the turn,
 * without relying on game.socket.
 */
export class HYP3ETurnTrackerSync {

  static init() {
    Hyp3eLogger.info("HYP3ETurnTrackerSync", "Turn Tracker Sync ready to receive.");

    Hooks.on("updateSetting", (setting, value, options, userId) => {
      if (setting.key === "explorationTurn" && setting.namespace === "hyp3e") {
        const newTurn = value;
        Hyp3eLogger.info("HYP3ETurnTrackerSync", `Turn changed to ${newTurn} by user ${userId}`);
        
        const oldTurn = HYP3ETurnTracker.currentTurn;
        if (newTurn > oldTurn) {
          Hooks.callAll("explorationTurnAdvanced", newTurn);
        } else if (newTurn < oldTurn) {
          Hooks.callAll("explorationTurnRetreat", newTurn);
        } else if (newTurn === 1 && oldTurn !== 1) {
          Hooks.callAll("explorationTurnReset", newTurn);
        } else {
          // fallback for any other case
          Hooks.callAll("explorationTurnUpdated", newTurn);
        }
      }
    });
  }
}
