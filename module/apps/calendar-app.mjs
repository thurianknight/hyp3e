import { HYP3E_CALENDAR } from "./calendar-data.mjs"
import { Hyp3eLogger } from "../helpers/logger.mjs";

const {
    HandlebarsApplicationMixin,
    ApplicationV2
} = foundry.applications.api;

export class HYP3ECalendarApp extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "hyp3e-calendar",
        title: "Hyperborean Calendar",
        template: "systems/hyp3e/templates/apps/calendar.hbs",
        width: 500,
        height: "auto"
    };

    _prepareContext(options) {
        const date = getCurrentDate();
        const { years, months, weekdays } = HYP3E_CALENDAR;
        Hyp3eLogger.info("_prepareContext", `Retrieving Hyperborea calendar data...`)
        return {
            years,
            months,
            weekdays,
            current: date
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".day-cell").on("click", ev => {
            const day = Number(ev.currentTarget.dataset.day);
            const { year, month } = getCurrentDate();
            setCurrentDate({ year, month, day });
            this.render();
        });

        html.find(".advance-day").on("click", ev => {
            advanceDay();
            this.render();
        });

        html.find(".send-to-chat").on("click", ev => {
            sendDateToChat();
        });
    }
}
