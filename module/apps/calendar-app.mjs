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
            icon: "fa-solid fa-calendar-days"
        },
        template: `${HYP3E.templatePath}/apps/calendar-app.hbs`,
        width: 500,
        height: "auto"
    };

    /** Path to the Handlebars template */
    static PARTS = {
        calendar: {
            template: `${HYP3E.templatePath}/apps/calendar-app.hbs`
        }
    };

    _prepareContext(options) {
        const { year, month, day } = game.hyp3e.getCurrentDate();
        const { years, months, weekdays } = HYP3E_CALENDAR;
        const verbose = game.settings.get(game.system.id, "calendarVerbose");
        Hyp3eLogger.info("_prepareContext", `Retrieving Hyperborea calendar date...${year}/${month}/${day}`)
        Hyp3eLogger.info("_prepareContext", `Retrieving Hyperborea calendar years...`, years)
        Hyp3eLogger.info("_prepareContext", `Retrieving Hyperborea calendar months...`, months)
        Hyp3eLogger.info("_prepareContext", `Retrieving Hyperborea calendar weekdays...`, weekdays)
        return {
            years,
            months,
            weekdays,
            currentDate: HYP3ECalendar.formatDate(verbose),
            year,
            month,
            day,
            verbose,
        };
    }

    /** Button handlers */
    static async #onAdvanceDay(event, app) {
        event.preventDefault();
        HYP3ECalendar.advanceDay();
        app.render(true);
    }

    static async #onSendDate(event, app) {
        event.preventDefault();
        HYP3ECalendar.sendDateToChat();
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".day-cell").on("click", ev => {
            const day = Number(ev.currentTarget.dataset.day);
            const { year, month } = game.hyp3e.getCurrentDate();
            game.hyp3e.setCurrentDate({ year, month, day });
            this.render();
        });
    }
}
