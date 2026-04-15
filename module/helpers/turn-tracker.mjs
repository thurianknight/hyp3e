import { Hyp3eLogger } from "./logger.mjs";

export async function setupTurnTrackerHooks() {
  console.log("[HYP3E] HYP3ETurnTracker: Initializing Turn Tracker hooks...");

  /**
   * Custom hook for handling exploration turn reset to 1.
   */
  Hooks.on("explorationTurnReset", (turn) => {
    Hyp3eLogger.info("explorationTurnReset", `Current turn reset to ${turn}`);
    // Nothing to do at this time...
  });

  /**
   * Custom hook for handling exploration turn advancement.
   */
  Hooks.on("explorationTurnAdvanced", async (turn) => {
    Hyp3eLogger.info("explorationTurnAdvanced", `Advance to turn ${turn} triggered.`);

    // Only the GM can run turn advancement logic
    if (!game.user.isGM) return;

    // Build a Set of actors to process
    const actors = new Set(
      canvas.tokens.placeables
        .map(t => t.actor)
        .filter(Boolean)
    );
    Hyp3eLogger.info("explorationTurnAdvanced", `Processing effects on current actors:`, actors);

    // Foundry v14 introduced the ActiveEffect registry
    if (ActiveEffect?.registry) {
      // Process all tokens on the canvas
      for (const actor of actors) {
        await ActiveEffect.registry.addFromParent(actor);
      }

      // Log the updated registry
      Hyp3eLogger.info("explorationTurnAdvanced", "ActiveEffect Registry contents:", 
        Array.from(ActiveEffect.registry)
      );

      // Simulate 60 rounds passing -- these are the primary events that we expect to see
      for (let i = 0; i < 60; i++) {
        await ActiveEffect.registry.refresh("roundStart", { actors });
        await ActiveEffect.registry.refresh("turnStart", { actors });
        await ActiveEffect.registry.refresh("turnEnd", { actors });
        await ActiveEffect.registry.refresh("roundEnd", { actors });
      }

      // Clean up once at the end and send a single chat message per actor
      for (const actor of actors) {
        await actor.deleteExpiredEffects();
      }

    } else {  // Foundry v13 and earlier
      for (const actor of actors) {
        actor.advanceExplorationTurn(turn);
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
    Hyp3eLogger.info("explorationTurnRetreat", `Retreat to turn ${turn} triggered.`);

    // Only the GM can run turn retreat logic
    if (!game.user.isGM) return;

    // Process all tokens on the canvas
    for (const token of canvas.tokens.placeables) {
      const actor = token?.actor || null;
      if (!actor) continue;

      actor.retreatExplorationTurn(turn);

      // Process equipped items
      for (const item of actor.items) {
        if (!item) continue;
        item.retreatExplorationTurn(turn);
      }
    }
  });

  /**
   * Global listeners for calendar changes
   */
  Hooks.on("calendarDateSet", () => {
    if (game.hyp3e?.turnTrackerApp) {
      game.hyp3e.turnTrackerApp._refreshDisplay();
    }
  });
  Hooks.on("calendarDayAdvanced", () => {
    if (game.hyp3e?.turnTrackerApp) {
      game.hyp3e.turnTrackerApp._refreshDisplay();
    }
  });
  Hooks.on("calendarDayRetreated", () => {
    if (game.hyp3e?.turnTrackerApp) {
      game.hyp3e.turnTrackerApp._refreshDisplay();
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
      // Calendar updates are handled separately in the calendar app, but we can trigger a render here as a safety net
      if (setting.key === "hyp3e.calendarDate" && game.hyp3e?.turnTrackerApp) {
        game.hyp3e.turnTrackerApp.render(false);
      }

      if (setting.key === "hyp3e.explorationTurn") {
        // Hyp3eLogger.info("HYP3ETurnTracker", `Setting updated:`, { setting, value, options, userId });

        const oldTurn = this._lastTurn;
        const newTurn = value.value;
        // Hyp3eLogger.info("HYP3ETurnTracker", `Turn changed from ${oldTurn} to ${newTurn} by user ${userId.name}`);
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
      }
    });
  }

  static async advanceTurn() {
    // Hyp3eLogger.info("advanceTurn", `advanceTurn() fired on: ${game.user.id}, GM? ${game.user.isGM}`);
    await this.advanceTime(10); // Advance time by 10 minutes per turn

    const newTurn = this.currentTurn + 1;
    await game.settings.set("hyp3e", "explorationTurn", newTurn);
    // Hyp3eLogger.info("advanceTurn", `Turn tracker advanced to turn ${newTurn}`);
    return newTurn;
  }

  static async advanceTime(minutes) {
    const currentTime = game.settings.get("hyp3e", "currentTime");
    const [currHour, currMinute] = currentTime.split(":").map(Number);
    let newMinute = currMinute + minutes;
    let newHour = currHour;
    if (newMinute >= 60) {
      // Reset the minutes and advance the hour
      // Hyp3eLogger.info("advanceTime", `Minute overflow: ${newMinute} minutes, advancing hour.`);
      newHour += Math.floor(newMinute / 60);
      newMinute = newMinute % 60;
      if (newHour >= 24) {
        // Advance the day if hours exceed 24
        // Hyp3eLogger.info("advanceTime", `Hour overflow: ${newHour} hours, rolling over to next day.`);
        newHour = newHour % 24;
        game.hyp3e.calendar.advanceDay(false); // Advance the day
      }
    }
    const newTime = `${newHour.toString()}:${newMinute.toString().padStart(2, '0')}`;
    await game.settings.set("hyp3e", "currentTime", newTime);
    // Hyp3eLogger.info("advanceTime", `Turn tracker time advanced to ${newTime}`);
    return newTime;
  }

  static async retreatTurn() {
    if (this.currentTurn <= 1) return;  // Don't let turn go below 1

    await this.retreatTime(10); // Retreat time by 10 minutes per turn

    const newTurn = this.currentTurn - 1;
    await game.settings.set("hyp3e", "explorationTurn", newTurn);
    // Hyp3eLogger.info("retreatTurn", `Turn tracker retreated to turn ${newTurn}`);
    return newTurn;
  }

  static async retreatTime(minutes) {
    const currentTime = game.settings.get("hyp3e", "currentTime");
    const [currHour, currMinute] = currentTime.split(":").map(Number);
    let newMinute = currMinute - minutes;
    let newHour = currHour;
    if (newMinute < 0) {
      // Reset the minutes and retreat the hour
      // Hyp3eLogger.info("retreatTime", `Minute underflow: ${newMinute} minutes, retreating hour.`);
      newHour -= Math.ceil(Math.abs(newMinute) / 60);
      newMinute = (newMinute % 60 + 60) % 60; // Handle negative modulo
      if (newHour < 0) {
        // Retreat the day if hours go below 0
        // Hyp3eLogger.info("retreatTime", `Hour underflow: ${newHour} hours, rolling back to previous day.`);
        newHour = (newHour % 24 + 24) % 24; // Handle negative modulo
        game.hyp3e.calendar.retreatDay(false); // Retreat the day
      }
    }
    const newTime = `${newHour.toString()}:${newMinute.toString().padStart(2, '0')}`;
    await game.settings.set("hyp3e", "currentTime", newTime);
    // Hyp3eLogger.info("retreatTime", `Turn tracker time retreated to ${newTime}`);
    return newTime;
  }

  static async reset() {
    const currentTime = this.turnStartTime;
    await game.settings.set("hyp3e", "currentTime", currentTime); // Reset time to turn start time

    const newTurn = 1;
    await game.settings.set("hyp3e", "explorationTurn", newTurn);
    // Hyp3eLogger.info("reset", `Turn tracker reset to turn ${newTurn} and time ${currentTime}.`);
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

  /**
   * Get daylight hours as a decimal (0–24) for the current date in the 13-year cycle
   * @returns {number}
   */
  static getCurrentDaylightHours() {
    const currentTime = game.settings.get("hyp3e", "currentTime");
    let {year, month, day} = game.hyp3e.calendar.getCurrentDate();
    const week  = ((day - 1) % 7) + 1;   // 1–4

    // Normalize year to the 13-year solar cycle (1–13)
    year = ((year - 1) % 13) + 1;

    const monthData = HYP3E_DAYLIGHT_TABLE[month];
    if (!monthData) return 12; // safe default

    const weekData = monthData[week];
    if (!weekData || weekData.length < 13) return 12;

    return weekData[year - 1] ?? 12;
  }

  /**
   * Get daylight fraction (0.0 = total darkness, 1.0 = full 24h daylight)
   */
  static getDaylightFraction() {
    return Math.max(0, Math.min(1, this.getCurrentDaylightHours() / 24));
  }
}