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

    static getCycleYear(year) {
        // 1–13, wrapping properly
        return ((year - 1) % 13) + 1;
    }

    static async setCurrentDate({year, month, day}) {
        await game.settings.set("hyp3e", "calendarDate", {year, month, day});

        // Broadcast a global hook so all apps refresh
        Hooks.callAll("calendarDateSet", {year, month, day});
    }

    static async advanceDay(resetTurns = false) {
        let {year, month, day} = this.getCurrentDate();
        day++;
        if (day > 28) {
            day = 1; month++;
            if (month > 13) {
                month = 1; year++;
            }
        }
        await this.setCurrentDate({ year, month, day });

        Hyp3eLogger.info("advanceDay", `Calendar advanced to ${this.formatDate()}`);
        Hooks.call("calendarDayAdvanced", { year, month, day });

        if (resetTurns && game.hyp3e?.turnTrackerApp) {
            game.hyp3e.resetTurn();
        }
    }

    static formatDate(verbose = true) {
        const {year, month, day} = this.getCurrentDate();
        const cycleYear = this.getCycleYear(year);

        const y = HYP3E_CALENDAR.years[cycleYear - 1];
        const m = HYP3E_CALENDAR.months[month - 1];
        const weekday = HYP3E_CALENDAR.weekdays[(day - 1) % 7];

        if (!verbose) return `Y${year}/M${month}/D${day}`;
        return `${weekday}, the ${day} of ${m.name}, ${year} (Year of the ${y.name})`;
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