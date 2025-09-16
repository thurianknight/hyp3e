import { HYP3E_CALENDAR } from "../helpers/calendar-data.mjs"
import { HYP3ECalendar } from "../helpers/calendar.mjs";
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
        window: {
            title: "Hyperborean Calendar",
            icon: "fa-solid fa-calendar-days",
            resizable: true
        },
        classes: ["hyp3e-calendar"],
        position: {
            width: 550,
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
        Hooks.on("calendarDateSet", () => this.render(true));
    }

    _prepareContext(partId, context, options) {
        Hyp3eLogger.info("_prepareContext", `Calendar parameters:`, {partId, context, options})
        const date = HYP3ECalendar.getCurrentDate();
        const currentYear = date.year;
        const monthIndex = date.month - 1;
        const { years, months, weekdays } = HYP3E_CALENDAR;
        const verbose = game.settings.get(game.system.id, "calendarVerbose");
        Hyp3eLogger.info("_prepareContext", `Retrieving Hyperborea calendar date...${HYP3ECalendar.formatDate(verbose)}`)

        try {
            // Get the named year and month... remember arrays are zero-indexed
            const year = years[HYP3ECalendar.getCycleYear(date.year) - 1];
            const month = months[date.month - 1];
            const festival = month.festivals?.name ? month.festivals : null;
            Hyp3eLogger.info("_prepareContext", `Array element year (${year.num}) and month (${month.num}).`)

            // Build day grid (7 days per week, 4 weeks)
            const days = [];
            for (let w = 0; w < 4; w++) {
                const week = [];
                for (let d = 0; d < 7; d++) {
                    const dayNum = w * 7 + d + 1;
                    const isFestival =
                                festival &&
                                dayNum >= festival.startDay &&
                                dayNum <= festival.endDay;
                    const phobosPhase = HYP3ECalendar.getMoonPhase(currentYear, date.month, dayNum, "Phobos");
                    const selenePhase = HYP3ECalendar.getMoonPhase(currentYear, date.month, dayNum, "Selene");

                    week.push({
                        number: dayNum,
                        weekday: weekdays[d],
                        isToday: dayNum === date.day,
                        isFestival,
                        phobosPhase,
                        phobosIcon: HYP3ECalendar.phaseIcons[phobosPhase],
                        selenePhase,
                        seleneIcon: HYP3ECalendar.phaseIcons[selenePhase]
                    });
                }
                days.push(week);
            }
            const phobosPhase = HYP3ECalendar.getMoonPhase(currentYear, date.month, date.day, "Phobos");
            const selenePhase = HYP3ECalendar.getMoonPhase(currentYear, date.month, date.day, "Selene");

            return {
                date,
                year,
                currentYear,
                monthIndex,
                months,
                weekdays,
                days,
                currentFestival: festival,
                season: HYP3ECalendar.getSeason(currentYear, date.month),
                phaseIcons: HYP3ECalendar.phaseIcons,
                todayPhobos: {
                    phase: phobosPhase,
                    icon: HYP3ECalendar.phaseIcons[phobosPhase] || ""
                },
                todaySelene: {
                    phase: selenePhase,
                    icon: HYP3ECalendar.phaseIcons[selenePhase] || ""
                }
            };
        } catch (err) {
            Hyp3eLogger.error("_prepareContext", `Error preparing context:`, err);
            throw err;
        }
    }

    _onRender(context, options) {
        super._onRender(context, options);
        Hyp3eLogger.info("_onRender", `Calendar parameters:`, {context, options})

        // `this.element` is the root DOM element
        const root = this.element;

        // Handle year input changes
        const yearInput = root.querySelector("#calendar-year");
        if (yearInput) {
            yearInput.addEventListener("change", async (event) => {
                const newYear = parseInt(event.target.value);
                if (!isNaN(newYear)) {
                    await HYP3ECalendar.setCurrentDate({
                        ...HYP3ECalendar.getCurrentDate(),
                        year: newYear
                    });
                }
            });
        }
        // Handle Month selection changes
        const monthSelect = this.element.querySelector("#calendar-month");
        if (monthSelect) {
            monthSelect.addEventListener("change", async (event) => {
                const newMonth = parseInt(event.target.value) + 1;
                await HYP3ECalendar.setCurrentDate({
                    ...HYP3ECalendar.getCurrentDate(),
                    month: newMonth
                });
            });
        }

        root.querySelector("[data-action='advance']")
            ?.addEventListener("click", () => {
                HYP3ECalendar.advanceDay(false);
                this.render(true);
            });

        root.querySelector("[data-action='chat']")
            ?.addEventListener("click", () => {
                HYP3ECalendar.sendDateToChat();
            });

        root.querySelector("[data-action='reset']")
            ?.addEventListener("click", () => {
                HYP3ECalendar.advanceDay(true);
                this.render(true);
            });

        root.querySelectorAll("td[data-day]").forEach(td => {
            td.addEventListener("click", async ev => {
                const day = Number(ev.currentTarget.dataset.day);
                console.log("[HYP3E] Clicked day:", day);
                await HYP3ECalendar.setCurrentDate({
                    ...HYP3ECalendar.getCurrentDate(),
                    day
                });
                // this.render(true);
            });
        });
    }

    /** Example form handler */
    static async onSubmit(event, form, formData) {
        Hyp3eLogger.info("onSubmit", `Form submitted`, formData);
    }    
}
