import { HYP3E_CALENDAR } from "./calendar-data.mjs"
import { HYP3E } from "./config.mjs"
import { Hyp3eLogger } from "./logger.mjs";

export async function setupCalendarHooks() {
  console.log("[HYP3E] HYP3ECalendar: Initializing Calendar hooks...");
  /**
   * Custom hooks for handling calendar updates.
   */
  Hooks.on("calendarDayAdvanced", ({ year, month, day }) => {
    Hyp3eLogger.info("HYP3ECalendar calendarDayAdvanced", `Calendar advanced to ${year}-${month}-${day}`);
    // Nothing to do at this time...
  });
  Hooks.on("calendarDayRetreated", ({ year, month, day }) => {
    Hyp3eLogger.info("HYP3ECalendar calendarDayRetreated", `Calendar retreated to ${year}-${month}-${day}`);
    // Nothing to do at this time...
  });
  Hooks.on("calendarDateSet", ({ year, month, day }) => {
    Hyp3eLogger.info("HYP3ECalendar calendarDateSet", `Calendar date set to ${year}-${month}-${day}`);
    // Nothing to do at this time...
  });
}

export class HYP3ECalendar {

  /** Call this once during system ready */
  static initSync() {
    /**
     * Hook into setting updates to monitor changes to the calendar date.
     */
    Hyp3eLogger.info("HYP3ECalendar initSync", `Initializing updateSetting hook...`);
    Hooks.on("updateSetting", (setting, value, options, userId) => {
      if (setting.key !== "hyp3e.calendarDate") return;
      Hyp3eLogger.info("HYP3ECalendar updateSetting", `Setting updated:`, { setting, value, options, userId });
    });
  }

  // Moon phase data is stored in calendar-data.mjs, but these are the icons to use for each phase
  static phobosIcons = {
    "New": `${HYP3E.assetsPath}/moon-phases/moon-phobos-new.png`,
    "Waxing Crescent": `${HYP3E.assetsPath}/moon-phases/moon-phobos-waxing-crescent.png`,
    "First Quarter": `${HYP3E.assetsPath}/moon-phases/moon-phobos-first-quarter.png`,
    "Waxing Gibbous": `${HYP3E.assetsPath}/moon-phases/moon-phobos-waxing-gibbous.png`,
    "Full": `${HYP3E.assetsPath}/moon-phases/moon-phobos-full.png`,
    "Waning Gibbous": `${HYP3E.assetsPath}/moon-phases/moon-phobos-waning-gibbous.png`,
    "Third Quarter": `${HYP3E.assetsPath}/moon-phases/moon-phobos-third-quarter.png`,
    "Waning Crescent": `${HYP3E.assetsPath}/moon-phases/moon-phobos-waning-crescent.png`,
  };
  static seleneIcons = {
    "New": `${HYP3E.assetsPath}/moon-phases/moon-selene-new.png`,
    "Waxing Crescent": `${HYP3E.assetsPath}/moon-phases/moon-selene-waxing-crescent.png`,
    "First Quarter": `${HYP3E.assetsPath}/moon-phases/moon-selene-first-quarter.png`,
    "Waxing Gibbous": `${HYP3E.assetsPath}/moon-phases/moon-selene-waxing-gibbous.png`,
    "Full": `${HYP3E.assetsPath}/moon-phases/moon-selene-full.png`,
    "Waning Gibbous": `${HYP3E.assetsPath}/moon-phases/moon-selene-waning-gibbous.png`,
    "Third Quarter": `${HYP3E.assetsPath}/moon-phases/moon-selene-third-quarter.png`,
    "Waning Crescent": `${HYP3E.assetsPath}/moon-phases/moon-selene-waning-crescent.png`,
  };

  /**--------------------------------------------------------------------------
   * Epoch date/time calculations are based on the Hyperborean calendar, which has:
   * - 13 months per year
   * - 28 days per month
   * - 7-day week (but no named weekdays in the calendar itself, just for formatting)
   * - Time of day is standard 24-hour clock with minutes
   * 
   * The epoch starts at Year 1, Month 1, Day 1, 00:00 
   *  (Sun-day, 1st of Aries, Year of the Bear, or Genesis)
   *-------------------------------------------------------------------------*/

  /**
   * Calculates the number of seconds since the epoch for a given date and time.
   * @param {*} year 
   * @param {*} month 
   * @param {*} day 
   * @param {*} hour 
   * @param {*} minute 
   * @returns 
   */
  static _calculateSecondsSinceEpoch(year, month, day, hour, minute) {
    // Hyperborean epoch starts at Year 1, Month 1, Day 1, 00:00
    //  I.e. Sun-day, 1st of Aries, Year 1 CÆ (Year of the Bear, or Genesis)
    const yearsSinceEpoch = year - 1;
    const monthsSinceEpoch = month - 1;
    const daysSinceEpoch = day - 1;

    const secondsFromYears = yearsSinceEpoch * 13 * 28 * 24 * 60 * 60;
    const secondsFromMonths = monthsSinceEpoch * 28 * 24 * 60 * 60;
    const secondsFromDays = daysSinceEpoch * 24 * 60 * 60;
    const secondsFromHours = hour * 60 * 60;
    const secondsFromMinutes = minute * 60;

    return secondsFromYears + secondsFromMonths + secondsFromDays + secondsFromHours + secondsFromMinutes;
  }

  /**
   * Calculates the date components (year, month, day) from a total number of seconds since 
   *  the epoch. Ignores time components.
   * @param {Number} totalSeconds 
   * @returns {Object} - returns {year, month, day}
   */
  static _calculateDateFromSeconds(totalSeconds) {
    const secondsPerDay = 86400;                    // 24 * 60 * 60
    const secondsPerMonth = secondsPerDay * 28;     // 28 days per month
    const secondsPerYear = secondsPerMonth * 13;    // 13 months per year

    const years = Math.floor(totalSeconds / secondsPerYear) + 1;
    const months = Math.floor((totalSeconds % secondsPerYear) / secondsPerMonth) + 1;
    const days = Math.floor((totalSeconds % secondsPerMonth) / secondsPerDay) + 1;

    return { year: years, month: months, day: days };
  }

  /**
   * Calculates the time components (hour, minute) from a total number of seconds since 
   *  the epoch. Ignores date components.
   * @param {Number} totalSeconds 
   * @returns {Object} - returns {hour, minute}
   */
  static _calculateTimeFromSeconds(totalSeconds) {
    const secondsPerDay = 86400;                    // 24 * 60 * 60
    const secondsIntoDay = totalSeconds % secondsPerDay;

    const hours = Math.floor(secondsIntoDay / 3600);
    const minutes = Math.floor((secondsIntoDay % 3600) / 60);

    return { hour: hours, minute: minutes };
  }


  /**--------------------------------------------------------------------------
   * Date-related methods
   *  These are the main methods for getting/setting the calendar date, advancing/retreating 
   *  the day, and formatting the date for display.
   *  They will also handle syncing with the Foundry world time and broadcasting hooks for 
   *  other apps to update.
   *-------------------------------------------------------------------------*/

  /**
   * Gets the current calendar date from the world settings.
   *  This is the main method that apps should call to get the current date, as it includes 
   *  logging and can be extended in the future if needed.
   * @returns {Object} - returns {year, month, day}
   */
  static getCurrentDate() {
    const worldTime = game.time.worldTime;
    const worldDate = this._calculateDateFromSeconds(worldTime);
    // const worldDateStr = `${worldDate.year}-${worldDate.month}-${worldDate.day}`;
    // const calendarDate = game.settings.get("hyp3e", "calendarDate");
    // const calendarDateStr = `${calendarDate.year}-${calendarDate.month}-${calendarDate.day}`;
    // if (calendarDateStr == worldDateStr) {
    //   Hyp3eLogger.info("HYP3ECalendar getCurrentDate", `Hyp3e calendar date is in sync with world time:`, calendarDateStr);
    // } else {
    //   Hyp3eLogger.info("HYP3ECalendar getCurrentDate", `Hyp3e calendar date (${calendarDateStr}) is NOT in sync with world date (${worldDateStr}).`);
    // }
    // return calendarDate;
    return worldDate;
  }

  static async setCurrentDate({year, month, day}) {
    if (!game.user.isGM) {
      Hyp3eLogger.warn("HYP3ECalendar setCurrentDate", "Only the GM can change the date.");
      return;
    }

    const worldTime = game.time.worldTime;
    const currentTime = this._calculateTimeFromSeconds(worldTime);

    // Set the hyp3e world setting for the calendar date
    //  For now, this will override the Foundry built-in calendar
    // await game.settings.set("hyp3e", "calendarDate", {year, month, day});

    // Get current time of day (hh:mm) so we can preserve it
    // const currentTimeStr = game.settings.get("hyp3e", "currentTime");
    // const [hour, minute] = currentTimeStr.split(":").map(Number);

    // Calculate total seconds using the NEW date + CURRENT time
    const newTotalSeconds = this._calculateSecondsSinceEpoch(year, month, day, currentTime.hour, currentTime.minute);

    // Set the Foundry world time
    await game.time.advance(newTotalSeconds - game.time.worldTime);

    // Broadcast a global hook so all apps refresh
    Hyp3eLogger.info("HYP3ECalendar setCurrentDate", `Calendar date set to ${this.formatDate(this.getCurrentDate(), false)}`);
    Hooks.callAll("calendarDateSet", {year, month, day});
  }

  /**
   * Advances the calendar by one day, with proper handling of month/year boundaries. Only GMs can do this.
   * @param {*} resetTurns 
   * @returns 
   */
  static async advanceDay(resetTurns = false) {
    if (!game.user.isGM) return;

    // let {year, month, day} = this.getCurrentDate();
    // day++;
    // if (day > 28) {
    //   day = 1; month++;
    //   if (month > 13) {
    //     month = 1; year++;
    //   }
    // }

    // Set the hyp3e world setting for the calendar date
    //  For now, this will override the Foundry built-in calendar
    // await game.settings.set("hyp3e", "calendarDate", {year, month, day});
    // await this.setCurrentDate({ year, month, day });

    // Update the world time by exactly 24 hours, preserving the current time of day
    const secondsPerDay = 86400;                    // 24 * 60 * 60
    await game.time.advance(secondsPerDay);

    if (resetTurns && game.hyp3e?.turnTrackerApp) {
      await game.hyp3e.turnTracker.resetTurn();
    }

    const {year, month, day} = this.getCurrentDate();
    Hyp3eLogger.info("HYP3ECalendar advanceDay", `Calendar advanced to ${this.formatDate(this.getCurrentDate(), false)}`);
    Hooks.callAll("calendarDayAdvanced", { year, month, day });
  }

  /**
   * Backs up the calendar by one day, with proper handling of month/year boundaries. Only GMs can do this.
   * @param {*} resetTurns 
   * @returns 
   */
  static async retreatDay(resetTurns = false) {
    if (!game.user.isGM) {
      Hyp3eLogger.warn("HYP3ECalendar retreatDay", "Only the GM can change the date.");
      return;
    }

    // let {year, month, day} = this.getCurrentDate();
    // day--;
    // if (day < 1) {
    //   month--;
    //   if (month < 1) {
    //     month = 13; year--;
    //   }
    //   day = 28;
    // }

    // Set the hyp3e world setting for the calendar date
    //  For now, this will override the Foundry built-in calendar
    // await game.settings.set("hyp3e", "calendarDate", {year, month, day});

    // Update the world time by exactly 24 hours, preserving the current time of day
    const secondsPerDay = -86400;                    // 24 * 60 * 60
    await game.time.advance(secondsPerDay);

    if (resetTurns && game.hyp3e?.turnTrackerApp) {
      await game.hyp3e.turnTracker.resetTurn();
    }

    const {year, month, day} = this.getCurrentDate();
    Hyp3eLogger.info("HYP3ECalendar retreatDay", `Calendar retreated to ${this.formatDate(this.getCurrentDate(), false)}`);
    Hooks.callAll("calendarDayRetreated", { year, month, day });
  }

  /**
   * Gets the cycle (sidereal) year for a given Hyperborean year, wrapping properly.
   * @param {*} year 
   * @returns 
   */
  static getCycleYear(year) {
    // Returns 1–13, wrapping properly
    return ((year - 1) % 13) + 1;
  }

  /**
   * Gets the current season for a given year and month, based on the calendar data. Handles split seasons as well.
   * @param {*} year 
   * @param {*} month 
   * @returns {String} - returns the season name, or "Unknown" if not defined
   */
  static getSeason(year, month) {
    const y = HYP3E_CALENDAR.years[this.getCycleYear(year) - 1];
    Hyp3eLogger.info("HYP3ECalendar getSeason", `Resolved cycle year for ${year} and month ${month}:`, y)
    if (!y?.season) return "Unknown";

    const parts = y.season.split("|");
    if (parts.length === 1) return parts[0];

    // Handle split seasons
    return (month <= 6) ? parts[0] : parts[1];
  }

  /**
   * Formats the current date in a human-readable way, with an optional verbose mode that 
   *  includes more details. Uses the calendar data to get the names of the year and month.
   * @param {Object} dateObj - expects {year, month, day}
   * @param {Boolean} verbose 
   * @returns {String} - returns the formatted date string
   */
  static formatDate(dateObj, verbose = false) {
    Hyp3eLogger.info("HYP3ECalendar formatDate", `formatDate called with verbose: ${verbose}`);
    const {year, month, day} = dateObj || this.getCurrentDate();
    Hyp3eLogger.info("HYP3ECalendar formatDate", `Current date:`, {year, month, day})
    const cycleYear = this.getCycleYear(year);
    Hyp3eLogger.info("HYP3ECalendar formatDate", `Cycle year: ${cycleYear}`)

    const y = HYP3E_CALENDAR.years[cycleYear - 1];
    const m = HYP3E_CALENDAR.months[month - 1];
    const weekday = HYP3E_CALENDAR.weekdays[(day - 1) % 7];

    // helper for ordinals
    function ordinal(n) {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    const dayOrdinal = ordinal(day);

    if (!verbose) {
      // Short version: "Sun, 8th Libra, 576"
      return `${weekday}, ${dayOrdinal} ${m.name}, ${year}`;
    }
    return `${weekday}, the ${dayOrdinal} of ${m.name}, ${year} (Year of the ${y.name})`;
  }

  /**
   * Gets the moon phase for a given date and moon name
   * @param {*} year 
   * @param {*} monthNum 
   * @param {*} day 
   * @param {*} moonName 
   * @returns {String} - returns the moon phase name, or "" if not defined
   */
  static getMoonPhase(year, monthNum, day, moonName) {
    const month = HYP3E_CALENDAR.months.find(m => m.num === monthNum);
    if (!month) return "";
    const phases = month.moonPhases?.[moonName];
    if (!phases) return "";

    // Direct match, when it happens
    if (phases[day]) return phases[day];

    // Find most recent defined phase
    const days = Object.keys(phases).map(d => parseInt(d)).sort((a, b) => a - b);
    let lastPhase = "";
    for (let d of days) {
      if (d <= day) lastPhase = phases[d];
      else break;
    }
    return lastPhase;
  }

  /**--------------------------------------------------------------------------
   * Time-related methods
   *  These are the main methods for getting/setting the current time and formatting the 
   *  date for display.
   *-------------------------------------------------------------------------*/

  /**
   * Gets the current time from the world time, calculating hours and minutes based on the 
   *  total seconds since epoch.
   * @returns {Object} - returns {hour, minute}
   */
  static getCurrentTime() {
    const worldTime = game.time.worldTime;
    return this._calculateTimeFromSeconds(worldTime);
  }

  /**
   * Formats a time object into a string
   * @param {Object} timeObj - expects {hour, minute}
   * @returns {String} - returns the formatted time string
   */
  static formatTime({hour, minute}) {
    // Format time as "hh:mm"
    const hourStr = hour.toString();
    const minuteStr = minute.toString().padStart(2, "0");
    return `${hourStr}:${minuteStr}`;
  }

  /**
   * Sends the current date to chat in a nicely formatted way, including the current time from the turn tracker.
   * This is used by the "/cal chat" command, and can also be called by other apps that want to display the date in chat.
   */
  static sendDateToChat() {
    // Get the current time
    const timeString = this.formatTime(this.getCurrentTime());
    const dateString = this.formatDate(this.getCurrentDate(), game.settings.get("hyp3e", "calendarVerbose"));
    ChatMessage.create({
      user: game.user.id,
      content: `<div class="hyp3e-calendar-date">${dateString}, time is ${timeString}.</div>`
    });
  }
}