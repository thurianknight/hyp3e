import { HYP3E_CALENDAR } from "../helpers/calendar-data.mjs"
// import { HYP3ECalendar } from "../helpers/calendar.mjs";
import { HYP3E } from "../helpers/config.mjs"
import { Hyp3eLogger } from "../helpers/logger.mjs";

const {
  HandlebarsApplicationMixin,
  ApplicationV2
} = foundry.applications.api;

export class HYP3ECalendarApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "hyp3e-calendar",
    tag: "section",
    classes: ["hyp3e-calendar"],
    window: {
      title: "Hyperborean Calendar",
      icon: "fa-solid fa-calendar-days",
      resizable: true
    },
    position: {
      width: 560,
      height: "auto"
    },
    form: {
      handler: HYP3ECalendarApp.onSubmit,
      closeOnSubmit: false
    }
  };

  /** Path to the Handlebars template */
  static PARTS = {
    content: {
      template: `${HYP3E.templatePath}/apps/calendar-app.hbs`
    }
  };

  constructor(...args) {
    super(...args);
    this.showAllMoonPhases = game.settings.get("hyp3e", "showAllMoonPhases");
    Hooks.on("calendarDateSet", () => this.render(true));
    Hooks.on("calendarDayAdvanced", () => this.render(true));
    Hooks.on("calendarDayRetreated", () => this.render(true));
    Hooks.on("explorationTurnReset", () => this.render(true));
    Hooks.on("timeAdvanced", () => this.render(true));
    Hooks.on("timeRewound", () => this.render(true));
  }

  _prepareContext(options) {
    // Hyp3eLogger.info("HYP3ECalendarApp _prepareContext", `Calendar options:`, options)
    const date = game.hyp3e.calendar.getCurrentDate();
    const currentYear = date.year;
    const monthIndex = date.month - 1;
    const { years, months, weekdays } = HYP3E_CALENDAR;
    const verbose = game.settings.get(game.system.id, "calendarVerbose");
    // Hyp3eLogger.info("HYP3ECalendarApp _prepareContext", `Retrieving Hyperborea calendar date...${game.hyp3e.calendar.formatDate(game.hyp3e.calendar.getCurrentDate(), verbose)}`)

    try {
      // Get the named year and month... remember arrays are zero-indexed
      const year = years[game.hyp3e.calendar.getCycleYear(date.year) - 1];
      const month = months[date.month - 1];
      const festival = month.festivals?.name ? month.festivals : null;
      // Hyp3eLogger.info("HYP3ECalendarApp _prepareContext", `Array element year (${year.num}) and month (${month.num}).`)

      // Build day grid (7 days per week, 4 weeks)
      const days = [];
      for (let w = 0; w < 4; w++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
          const dayNum = w * 7 + d + 1;
          const isToday = dayNum === date.day
          const isFestival =
                    festival &&
                    dayNum >= festival.startDay &&
                    dayNum <= festival.endDay;

          // Only include moon phases if toggle is ON, or if it's today
          const includePhases = this.showAllMoonPhases || isToday;
          let phobosPhase = null;
          let selenePhase = null;
          if (includePhases) {
            phobosPhase = game.hyp3e.calendar.getMoonPhase(currentYear, date.month, dayNum, "Phobos");
            selenePhase = game.hyp3e.calendar.getMoonPhase(currentYear, date.month, dayNum, "Selene");
          }

          week.push({
            number: dayNum,
            weekday: weekdays[d],
            isToday,
            isFestival,
            phobosPhase,
            phobosIcon: game.hyp3e.calendar.phobosIcons[phobosPhase] ?? null,
            selenePhase,
            seleneIcon: game.hyp3e.calendar.seleneIcons[selenePhase] ?? null
          });
        }
        days.push(week);
      }
      const phobosPhase = game.hyp3e.calendar.getMoonPhase(currentYear, date.month, date.day, "Phobos");
      const selenePhase = game.hyp3e.calendar.getMoonPhase(currentYear, date.month, date.day, "Selene");

      // Get turn-related time data
      const turnStartTime = game.hyp3e.turnTracker.turnStartTime();
      const timeString = game.hyp3e.calendar.formatTime(game.hyp3e.calendar.getCurrentTime());
      // Hyp3eLogger.info("HYP3ECalendarApp _prepareContext", `Turn start time: ${turnStartTime}, current time: ${timeString}`);

      const context = {
        date,
        year,
        currentYear,
        monthIndex,
        months,
        weekdays,
        days,
        currentFestival: festival,
        season: game.hyp3e.calendar.getSeason(currentYear, date.month),
        turnStartTime,
        timeString,
        isGM: game.user.isGM
      };
      Hyp3eLogger.info("HYP3ECalendarApp _prepareContext", `Calendar context:`, context)
      return context;
    } catch (err) {
      Hyp3eLogger.error("HYP3ECalendarApp _prepareContext", `Error preparing context:`, err);
      throw err;
    }
  }

  _onRender(context, options) {
    super._onRender(context, options);
    // Hyp3eLogger.info("HYP3ECalendarApp _onRender", `Calendar render parameters:`, {context, options})

    // `this.element` is the root DOM element
    const root = this.element;

    // Handle year input changes
    const yearInput = root.querySelector("#calendar-year");
    if (yearInput) {
      // Read-only for players
      if (!game.user.isGM) {
        // yearInput.prop("readonly", true);
        yearInput.readOnly = true;
      }
      yearInput.addEventListener("change", async (event) => {
        const newYear = parseInt(event.target.value);
        if (!isNaN(newYear)) {
          await game.hyp3e.calendar.setCurrentDate({
            ...game.hyp3e.calendar.getCurrentDate(),
            year: newYear
          });
        }
      });
    }

    // Handle Month selection changes
    const monthSelect = this.element.querySelector("#calendar-month");
    if (monthSelect) {
      // Read-only for players
      if (!game.user.isGM) {
        // monthSelect.prop("disabled", true);
        monthSelect.disabled = true;
      }
      monthSelect.addEventListener("change", async (event) => {
        const newMonth = parseInt(event.target.value) + 1;
        await game.hyp3e.calendar.setCurrentDate({
          ...game.hyp3e.calendar.getCurrentDate(),
          month: newMonth
        });
      });
    }

    // Only add listener for the GM, not players
    if (game.user.isGM) {
      // Handle date-grid selection changes
      root.querySelectorAll("td[data-day]").forEach(td => {
        td.addEventListener("click", async ev => {
          const day = Number(ev.currentTarget.dataset.day);
          console.log("[HYP3E] Clicked day:", day);
          await game.hyp3e.calendar.setCurrentDate({
            ...game.hyp3e.calendar.getCurrentDate(),
            day
          });
        });
      });
    }

    // Handle Turn Start Time input
    const timeInput = root.querySelector("#start-time");
    if (timeInput) {
      if (!game.user.isGM) {
        // Disable time input for players
        timeInput.disabled = true;
      }
      timeInput.addEventListener("change", async (ev) => {
        const newTime = ev.target.value;
        // Basic validation of H:mm format
        const timePattern = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
        if (timePattern.test(newTime)) {
          await game.settings.set("hyp3e", "turnStartTime", newTime);
          this.render(true);
        } else {
          ui.notifications.error("Invalid time format. Please use H:mm (e.g., 8:00).");
          // Reset to previous valid value
          ev.target.value = game.hyp3e.turnTracker.turnStartTime();
        }
      });
    }

    // Button listeners for time changes
    if (game.user.isGM) {
      root.querySelector("[data-action='advanceHour']")?.addEventListener("click", async () => {
        await game.hyp3e.calendar.advanceHour(false);
      });
    }
    if (game.user.isGM) {
      root.querySelector("[data-action='rewindHour']")?.addEventListener("click", async () => {
        await game.hyp3e.calendar.rewindHour(false);
      });
    }
    if (game.user.isGM) {
      root.querySelector("[data-action='advanceMinute']")?.addEventListener("click", async () => {
        await game.hyp3e.calendar.advanceMinute(false);
      });
    }
    if (game.user.isGM) {
      root.querySelector("[data-action='rewindMinute']")?.addEventListener("click", async () => {
        await game.hyp3e.calendar.rewindMinute(false);
      });
    }

    // Button listeners for date advance & turn reset
    if (game.user.isGM) {
      root.querySelector("[data-action='advance']")?.addEventListener("click", async () => {
        // Hyp3eLogger.info("HYP3ECalendarApp advanceDay(false)", "Advance day button clicked by GM.");
        // Sending 'false' tells advanceDay() to NOT reset the turn counter
        await game.hyp3e.calendar.advanceDay(false);
      });
    }

    root.querySelector("[data-action='chat']")?.addEventListener("click", () => {
      game.hyp3e.calendar.sendDateToChat();
    });

    if (game.user.isGM) {
      root.querySelector("[data-action='advance-reset']")?.addEventListener("click", async () => {
        // Hyp3eLogger.info("HYP3ECalendarApp advanceDay(true)", "Advance day + reset turn button clicked by GM.");
        // Sending 'true' tells advanceDay() to also reset the turn counter
        await game.hyp3e.calendar.advanceDay(true);
      });
    }

    if (game.user.isGM) {
      root.querySelector("[data-action='reset']")?.addEventListener("click", async() => {
        // Hyp3eLogger.info("HYP3ECalendarApp resetTurn", "Reset turn button clicked by GM.");
        await game.hyp3e.turnTracker.resetTurn();
      });
    }
  }

  /** Example form handler */
  static async onSubmit(event, form, formData) {
    // Hyp3eLogger.info("HYP3ECalendarApp onSubmit", `Form submitted`, formData);
  }
}
