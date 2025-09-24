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
        // Returns 1–13, wrapping properly
        return ((year - 1) % 13) + 1;
    }

    static getSeason(year, month) {
        const y = HYP3E_CALENDAR.years[this.getCycleYear(year) - 1];
        Hyp3eLogger.info("getSeason", `Resolved cycle year for ${year} and month ${month}:`, y)
        if (!y?.season) return "Unknown";

        const parts = y.season.split("|");
        if (parts.length === 1) return parts[0];

        // Handle split seasons
        return (month <= 6) ? parts[0] : parts[1];
    }

    static phaseIcons = {
        "New": "🌑",
        "Waxing Crescent": "🌒",
        "First Quarter": "🌓",
        "Waxing Gibbous": "🌔",
        "Waxing": "🌔",
        "Full": "🌕",
        "Waning Gibbous": "🌖",
        "Third Quarter": "🌗",
        "Waning Crescent": "🌘",
        "Waning": "🌘",
    };

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

    static async setCurrentDate({year, month, day}) {
        if (!game.user.isGM) {
            Hyp3eLogger.warn("setCurrentDate", "Only the GM can change the date.");
            return;
        }

        await game.settings.set("hyp3e", "calendarDate", {year, month, day});

        // Broadcast a global hook so all apps refresh
        Hooks.callAll("calendarDateSet", {year, month, day});
    }

    static async advanceDay(resetTurns = false) {
        if (!game.user.isGM) {
            Hyp3eLogger.warn("advanceDay", "Only the GM can change the date.");
            return;
        }

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
            await game.hyp3e.turnTracker.resetTurn();
        }
    }

    static formatDate(verbose = true) {
        const {year, month, day} = this.getCurrentDate();
        Hyp3eLogger.info("formatDate", `Current date:`, {year, month, day})
        const cycleYear = this.getCycleYear(year);
        Hyp3eLogger.info("formatDate", `Cycle year: ${cycleYear}`)

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
            // Short version: "8th Libra, 576"
            return `${dayOrdinal} ${m.name}, ${year}`;
        }
        return `${weekday}, the ${dayOrdinal} of ${m.name}, ${year} (Year of the ${y.name})`;
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