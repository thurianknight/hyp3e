import { Hyp3eLogger } from "./logger.mjs";

export async function setupTurnTrackerHooks() {
  console.log("[HYP3E] HYP3ETurnTracker: Initializing Turn Tracker hooks...");

  /**
   * Custom hook for handling exploration turn reset to 1.
   */
  Hooks.on("explorationTurnReset", (turn) => {
    Hyp3eLogger.info("explorationTurnReset", `Exploration turn reset to ${turn}`);
    // Nothing to do at this time...
  });

  /**
   * Custom hook for handling exploration turn advancement.
   */
  Hooks.on("explorationTurnAdvanced", async (turn) => {
    Hyp3eLogger.info("explorationTurnAdvanced", `Exploration turn ${turn} triggered.`);

    // Only the GM can run turn advancement logic
    if (!game.user.isGM) return;

    // Process all tokens on the canvas
    for (const token of canvas.tokens.placeables) {
      const actor = token.actor;
      if (!actor) continue;

      actor.advanceExplorationTurn(turn);

      // Process equipped items
      for (const item of actor.items) {
        if (!item) continue;
        item.advanceExplorationTurn(turn);
      }
    }

    // Execute any actions defined in the settings for turn advancement
    const actions = game.settings.get(game.system.id, "turnAdvanceActions") || [];
    for (const action of actions) {
      if (!action.enabled) continue; // Skip if not enabled
      const doc = await fromUuid(action.uuid);
      if (!doc) {
        ui.notifications.warn(`Could not find document for ${action.label || action.uuid}`);
        continue;
      }
      const rollMode = action.output === "gm" ? "gmroll" : "publicroll";
      if (doc instanceof RollTable) {
        await doc.draw({ displayChat: true, rollMode: rollMode });
      } else if (doc instanceof Macro) {
        await doc.execute();
      } else {
        ui.notifications.warn(`${action.label || action.uuid} is not a Roll Table or Macro, cannot execute.`);
      }
    }
  });

  /**
   * Custom hook for handling exploration turn retreat.
   */
  Hooks.on("explorationTurnRetreat", (turn) => {
    Hyp3eLogger.info("explorationTurnRetreat", `Exploration turn ${turn} triggered.`);

    // Only the GM can run turn retreat logic
    if (!game.user.isGM) return;

    // Process all tokens on the canvas
    for (const token of canvas.tokens.placeables) {
      const actor = token.actor;
      if (!actor) continue;

      actor.retreatExplorationTurn(turn);

      // Process equipped items
      for (const item of actor.items) {
        if (!item) continue;
        item.retreatExplorationTurn(turn);
      }
    }
  });
}

export class HYP3ETurnTracker {

  static get currentTurn() {
    return game.settings.get("hyp3e", "explorationTurn") || 1;
  }

  static get turnStartTime() {
    return game.settings.get("hyp3e", "turnStartTime") || "8:00";
  }

  static set currentTurn(value) {
    game.settings.set("hyp3e", "explorationTurn", value);
  }

  static set currentTime(value) {
    game.settings.set("hyp3e", "currentTime", value);
  }

  static get currentTime() {
    return game.settings.get("hyp3e", "currentTime") || "8:00";
    // const startTime = this.turnStartTime;
    // const [startHour, startMinute] = startTime.split(":").map(Number);
    // const totalMinutes = startHour * 60 + startMinute + (this.currentTurn - 1) * 10;
    // const currentHour = Math.floor(totalMinutes / 60) % 24;
    // const currentMinute = totalMinutes % 60;
    const currentTime = game.settings.get("hyp3e", "currentTime");
    const currentHour = currentTime ? parseInt(currentTime.split(":")[0]) : 0;
    const currentMinute = currentTime ? parseInt(currentTime.split(":")[1]) : 0;
    return `${currentHour.toString()}:${currentMinute.toString().padStart(2, '0')}`;
  }

  /** Call this once during system ready */
  static initSync() {
    // Initialize previous turn on load
    this._lastTurn = this.currentTurn;

    /**
     * Hook into setting updates to monitor changes to the exploration turn.
     */
    Hyp3eLogger.info("HYP3ETurnTracker initSync", `Initializing updateSetting hook...`);
    Hooks.on("updateSetting", (setting, value, options, userId) => {
      if (setting.key !== "hyp3e.explorationTurn") return;
      Hyp3eLogger.info("HYP3ETurnTracker", `Setting updated:`, { setting, value, options, userId });

      const oldTurn = this._lastTurn;
      const newTurn = value.value;
      Hyp3eLogger.info("HYP3ETurnTracker", `Turn changed from ${oldTurn} to ${newTurn} by user ${userId.name}`);
      // update cache
      this._lastTurn = newTurn;

      if (newTurn > oldTurn) {
        Hooks.callAll("explorationTurnAdvanced", newTurn);
      } else if (newTurn === 1 && oldTurn !== 1) {
        Hooks.callAll("explorationTurnReset", newTurn);
      } else if (newTurn < oldTurn) {
        Hooks.callAll("explorationTurnRetreat", newTurn);
      } else {
        Hooks.callAll("explorationTurnUpdated", newTurn);
      }
    });
  }

  static async advanceTurn() {
    Hyp3eLogger.info("advanceTurn", `advanceTurn() fired on: ${game.user.id}, GM? ${game.user.isGM}`);
    await this.advanceTime(10); // Advance time by 10 minutes per turn

    const newTurn = this.currentTurn + 1;
    await game.settings.set("hyp3e", "explorationTurn", newTurn);
    Hyp3eLogger.info("advanceTurn", `Turn tracker advanced to turn ${newTurn}`);
    return newTurn;
  }

  static async advanceTime(minutes) {
    const currentTime = game.settings.get("hyp3e", "currentTime");
    const [currHour, currMinute] = currentTime.split(":").map(Number);
    let newMinute = currMinute + minutes;
    let newHour = currHour;
    if (newMinute >= 60) {
      Hyp3eLogger.info("advanceTime", `Minute overflow: ${newMinute} minutes, advancing hour.`);
      newHour += Math.floor(newMinute / 60);
      newMinute = newMinute % 60;
      if (newHour >= 24) {
        Hyp3eLogger.info("advanceTime", `Hour overflow: ${newHour} hours, rolling over to next day.`);
        newHour = newHour % 24;
        game.hyp3e.calendar.advanceDay(false); // Advance the day
      }
    }
    const newTime = `${newHour.toString()}:${newMinute.toString().padStart(2, '0')}`;
    await game.settings.set("hyp3e", "currentTime", newTime);
    Hyp3eLogger.info("advanceTime", `Turn tracker time advanced to ${newTime}`);
    return newTime;
  }

  static async retreatTurn() {
    if (this.currentTurn <= 1) return;  // Don't let turn go below 1

    await this.retreatTime(10); // Retreat time by 10 minutes per turn

    const newTurn = this.currentTurn - 1;
    await game.settings.set("hyp3e", "explorationTurn", newTurn);
    Hyp3eLogger.info("retreatTurn", `Turn tracker retreated to turn ${newTurn}`);
    return newTurn;
  }

  static async retreatTime(minutes) {
    const currentTime = game.settings.get("hyp3e", "currentTime");
    const [currHour, currMinute] = currentTime.split(":").map(Number);
    let newMinute = currMinute - minutes;
    let newHour = currHour;
    if (newMinute < 0) {
      Hyp3eLogger.info("retreatTime", `Minute underflow: ${newMinute} minutes, retreating hour.`);
      newHour -= Math.ceil(Math.abs(newMinute) / 60);
      newMinute = (newMinute % 60 + 60) % 60; // Handle negative modulo
      if (newHour < 0) {
        Hyp3eLogger.info("retreatTime", `Hour underflow: ${newHour} hours, rolling back to previous day.`);
        newHour = (newHour % 24 + 24) % 24; // Handle negative modulo
        game.hyp3e.calendar.retreatDay(false); // Retreat the day
      }
    }
    const newTime = `${newHour.toString()}:${newMinute.toString().padStart(2, '0')}`;
    await game.settings.set("hyp3e", "currentTime", newTime);
    Hyp3eLogger.info("retreatTime", `Turn tracker time retreated to ${newTime}`);
    return newTime;
  }

  static async reset() {
    const currentTime = this.turnStartTime;
    await game.settings.set("hyp3e", "currentTime", currentTime); // Reset time to turn start time

    const newTurn = 1;
    await game.settings.set("hyp3e", "explorationTurn", newTurn);
    Hyp3eLogger.info("reset", `Turn tracker reset to turn ${newTurn} and time ${currentTime}.`);
    return newTurn;
  }

  static getTurn() {
    return this.currentTurn;
  }

  static getTurnStartTime() {
    return this.turnStartTime;
  }

  static getTime() {
    return this.currentTime;
  }

}
