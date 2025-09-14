import { HYP3E_CALENDAR } from "./calendar-data.mjs"
import { Hyp3eLogger } from "./logger.mjs";

export async function setupCalendarHooks() {
    /**
     * Custom hook for handling calendar day advancement.
     */
    Hooks.on("calendarDayAdvanced", async (newDate) => {
        // Do stuff

    });
}

export class HYP3ECalendar {

    static getCurrentDate() {
        return game.settings.get("hyp3e", "calendarDate");
    }

    static setCurrentDate({year, month, day}) {
        game.settings.set("hyp3e", "calendarDate", {year, month, day});
    }

    static advanceDay(resetTurns = false) {
        let {year, month, day} = this.getCurrentDate();
        day++;
        if (day > 28) {
            day = 1; month++;
            if (month > 13) {
                month = 1; year++;
                if (year > 13) year = 1; // loop cycle
            }
        }
        const newDate = { year, month, day };
        this.setCurrentDate(newDate);

        Hyp3eLogger.info("advanceDay", `Calendar advanced to ${this.formatDate()}`);
        Hooks.call("calendarDayAdvanced", newDate);

        if (resetTurns && game.hyp3e?.turnTracker) {
            game.hyp3e.turnTracker.reset();
        }
    }

    static formatDate(verbose = true) {
        const {year, month, day} = this.getCurrentDate();
        const y = HYP3E_CALENDAR.years[year-1];
        const m = HYP3E_CALENDAR.months[month-1];
        const weekday = HYP3E_CALENDAR.weekdays[(day-1)%7];

        if (!verbose) return `Y${year}/M${month}/D${day}`;
        return `${weekday}, the ${day} of ${m.name}, Year of the ${y.name}`;
    }

    static sendDateToChat() {
        ChatMessage.create({
            user: game.user.id,
            content: `<div class="hyp3e-calendar-date">${this.formatDate(
                game.settings.get("hyp3e", "calendarVerbose")
            )}</div>`
        });
    }
}