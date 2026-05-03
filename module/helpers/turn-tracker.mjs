import { HYP3E_DAYLIGHT_TABLE } from "./daylight-data.mjs"
import { Hyp3eLogger } from "./logger.mjs";
import { logEffectRegistry } from "./effects.mjs";

export async function setupTurnTrackerHooks() {
  console.log("[HYP3E] HYP3ETurnTracker: Initializing Turn Tracker hooks...");

  /**
   * Custom hook for handling exploration turn reset to 1.
   */
  Hooks.on("explorationTurnReset", (turn) => {
    // Only the GM can run turn reset logic
    if (!game.user.isGM) return;

    Hyp3eLogger.info("explorationTurnReset", `Current turn reset to ${turn}`);
    // Nothing to do at this time...
  });

  /**
   * Custom hook for handling exploration turn advancement.
   */
  Hooks.on("explorationTurnAdvanced", async (turn) => {
    // Only the GM can run turn advancement logic
    if (!game.user.isGM) return;

    Hyp3eLogger.info("explorationTurnAdvanced", `Advance to turn ${turn} triggered.`);

    // Build a Set of actors to process
    const actors = new Set(
      canvas.tokens.placeables
        .map(t => t.actor)
        .filter(Boolean)
    );
    Hyp3eLogger.info("explorationTurnAdvanced", `Advancing the turn on current actors:`, actors);

    // Foundry v14 introduced the ActiveEffect registry
    if (ActiveEffect?.registry) {
      // Process all tokens on the canvas
      for (const actor of actors) {
        await ActiveEffect.registry.addFromParent(actor);
      }
      // Log the updated registry
      // logEffectRegistry();
    }

    // Advance the turn for each actor
    for (const actor of actors) {
      actor.advanceExplorationTurn(turn);
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
    // Only the GM can run turn retreat logic
    if (!game.user.isGM) return;

    Hyp3eLogger.info("explorationTurnRetreat", `Retreat to turn ${turn} triggered.`);

    // Build a Set of actors to process
    const actors = new Set(
      canvas.tokens.placeables
        .map(t => t.actor)
        .filter(Boolean)
    );
    Hyp3eLogger.info("explorationTurnRetreat", `Retreating the turn on current actors:`, actors);

    // Retreat the turn for each actor
    for (const actor of actors) {
      actor.retreatExplorationTurn(turn);
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
    const worldTime = game.hyp3e.calendar.calculateTimeFromSeconds(game.time.worldTime);
    const worldTimeStr = `${worldTime.hour}:${worldTime.minute.toString().padStart(2, '0')}`;
    const hyp3eTime = game.settings.get("hyp3e", "currentTime") || "8:00";
    if (worldTimeStr == hyp3eTime) {
      Hyp3eLogger.info("HYP3ETurnTracker currentTime", `Hyp3e time is in sync with world time:`, hyp3eTime);
    } else {
      Hyp3eLogger.info("HYP3ETurnTracker currentTime", `Hyp3e time (${hyp3eTime}) is NOT in sync with world time (${worldTimeStr}).`);
    }
    return worldTimeStr;
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
      }
    });
  }

  static async advanceTurn() {
    if (!game.user.isGM) return;

    // Hyp3eLogger.info("advanceTurn", `advanceTurn() fired on: ${game.user.id}, GM? ${game.user.isGM}`);
    await this.advanceTime(10); // Advance time by 10 minutes per turn

    const newTurn = this.currentTurn + 1;
    await game.settings.set("hyp3e", "explorationTurn", newTurn);

    Hyp3eLogger.info("advanceTurn", `Turn tracker advanced to turn ${newTurn}`);
    Hooks.callAll("explorationTurnAdvanced", newTurn);

    return newTurn;
  }

  static async advanceTime(minutes) {
    if (!game.user.isGM) return;

    // Update the world time to match the new time
    const secondsPerMinute = 60;
    await game.time.advance(secondsPerMinute * minutes);

    const newTime = game.hyp3e.calendar.formatTime(game.hyp3e.calendar.getCurrentTime());
    Hyp3eLogger.info("advanceTime", `Turn tracker time advanced to ${newTime}`);
    return newTime;
  }

  static async retreatTurn() {
    if (!game.user.isGM) return;

    if (this.currentTurn <= 1) return;  // Don't let turn go below 1

    await this.retreatTime(10); // Retreat time by 10 minutes per turn

    const newTurn = this.currentTurn - 1;
    await game.settings.set("hyp3e", "explorationTurn", newTurn);

    Hyp3eLogger.info("retreatTurn", `Turn tracker retreated to turn ${newTurn}`);
    Hooks.callAll("explorationTurnRetreat", newTurn);

    return newTurn;
  }

  static async retreatTime(minutes) {
    if (!game.user.isGM) return;

    // Update the world time to match the new time
    const secondsPerMinute = 60;
    await game.time.advance(secondsPerMinute * minutes * -1); // Retreat time by advancing negative seconds

    const newTime = game.hyp3e.calendar.formatTime(game.hyp3e.calendar.getCurrentTime());
    Hyp3eLogger.info("retreatTime", `Turn tracker time retreated to ${newTime}`);
    return newTime;
  }

  /**
   * Reverse turn counter and time to turn 1 and the calendar-configured start time.
   * @returns {Number} Turn number reset to 1
   */
  static async reset() {
    if (!game.user.isGM) return;

    const turnStartTime = this.turnStartTime;
    // await game.settings.set("hyp3e", "currentTime", currentTime); // Reset time to turn start time

    // Update the world time to match the new time
    const {year, month, day} = game.hyp3e.calendar.getCurrentDate();
    const [hour, minute] = turnStartTime.split(":").map(Number);
    const totalSeconds = game.hyp3e.calendar.calculateSecondsSinceEpoch(year, month, day, hour, minute);
    const worldTimeSeconds = game.time.worldTime;
    // Even if the date was advanced, time reverses back to the start time
    const secondsToReverse = totalSeconds - worldTimeSeconds;
    await game.time.advance(secondsToReverse); // Reverse world time to match the day's start time

    const newTurn = 1;
    await game.settings.set("hyp3e", "explorationTurn", newTurn);

    Hyp3eLogger.info("reset", `Turn tracker reset to turn ${newTurn} and time ${turnStartTime}.`);
    Hooks.callAll("explorationTurnReset", newTurn);

    return newTurn;
  }

  static getTurn() {
    return this.currentTurn;
  }

  static getTurnStartTime() {
    return this.turnStartTime;
  }

  static getTime() {
    Hyp3eLogger.warn("HYP3ETurnTracker getTime", `getTime() is deprecated. Use game.hyp3e.calendar.getCurrentTime() instead.`);
    return this.currentTime;
  }

  /**--------------------------------------------------------------------------
   * Daylight-related methods for display
   *  These methods calculate the current daylight hours based on the calendar date and the 13-year cycle, and format it for display in the turn tracker.
   *  They also calculate the daylight fraction for use in dynamic lighting or other effects that depend on the time of day.
   *-------------------------------------------------------------------------*/

  /**
   * Get daylight hours as a decimal (0–24) for the current date in the 13-year cycle
   * @returns {number}
   */
  static getCurrentDaylightHours() {
    let {year, month, day} = game.hyp3e.calendar.getCurrentDate();
    const week  = Math.floor((day - 1) / 7) + 1;   // Normalize week to numbers 1–4

    // Normalize year to the 13-year solar cycle (1–13)
    year = ((year - 1) % 13) + 1;
    // Hyp3eLogger.info("HYP3ETurnTracker getCurrentDaylightHours", `year: ${year}, month: ${month}, day: ${day}, week: ${week}`);
    const monthData = HYP3E_DAYLIGHT_TABLE[month];
    // Hyp3eLogger.info("HYP3ETurnTracker getCurrentDaylightHours", `monthData:`, monthData);
    if (!monthData) return 12; // safe default

    const weekData = monthData[week];
    // Hyp3eLogger.info("HYP3ETurnTracker getCurrentDaylightHours", `weekData:`, weekData);
    if (!weekData || weekData.length < 13) return 12;

    const daylightHours = weekData[year - 1];
    // Hyp3eLogger.info("HYP3ETurnTracker getCurrentDaylightHours", `daylightHours: ${daylightHours}`);
    return daylightHours ?? 12;
  }

  /**
   * Convert decimal daylight hours to "hh:mm" format
   * @param {number} decimalHours - e.g. 8.75, 17.4167, 23.9167, 0, etc.
   * @returns {string} Formatted as "hh:mm" with leading zeros (e.g. "08:45", "23:55", "00:00")
   */
  static formatDaylightAsHHMM(decimalHours) {
    // Clamp to valid range just in case
    // Hyp3eLogger.info("HYP3ETurnTracker formatDaylightAsHHMM", `decimalHours: ${decimalHours}`);
    decimalHours = Math.max(0, Math.min(24, decimalHours));
    // Hyp3eLogger.info("HYP3ETurnTracker formatDaylightAsHHMM", `decimalHours: ${decimalHours}`);
  
    const totalMinutes = Math.round(decimalHours * 60);   // round to nearest minute
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
  
    // Format minutes with leading zeros
    return `${hours.toString()}h ${minutes.toString().padStart(2, '0')}m`;
  }

  /**
   * Get daylight fraction (0.0 = total darkness, 1.0 = full 24h daylight).
   * @returns {number} 0.0, 0.5, or 1.0 based on current time and daylight hours, with twilight periods as 0.5
   */
  static getDaylightFraction() {
    // const currentTime = game.settings.get("hyp3e", "currentTime");
    const daylightHours = this.getCurrentDaylightHours();  // Total hours of daylight, decimal
    // const [currHour, currMinute] = currentTime.split(":").map(Number);
    const {hour, minute} = game.hyp3e.calendar.getCurrentTime();
    const now = hour + (minute <= 15 ? 0 : minute <= 30 ? 0.25 : minute <= 45 ? 0.5 : 0.75);
    // Sunrise and sunset are each 1/2 of daylightHours before/after noon
    const sunrise = 12 - (daylightHours * 0.5);
    const sunset = 12 + (daylightHours * 0.5);

    const TWILIGHT = 0.5; // 30 minutes of twilight on either side of sunrise/sunset

    // Twilight windows
    const sunriseStart = sunrise - TWILIGHT;
    const sunriseEnd   = sunrise + TWILIGHT < 12 ? sunrise + TWILIGHT : 12;
    const sunsetStart  = sunset - TWILIGHT > 12 ? sunset - TWILIGHT : 12;
    const sunsetEnd    = sunset + TWILIGHT;

    // --- Twilight checks (priority first) ---
    if (
      (now >= sunriseStart && now <= sunriseEnd) ||
      (now >= sunsetStart && now <= sunsetEnd)
    ) {
      return 0.5;
    }

    // --- Full daylight ---
    if (now > sunriseEnd && now < sunsetStart) {
      return 1.0;
    }

    // --- Full darkness ---
    return 0.0;
  }
}