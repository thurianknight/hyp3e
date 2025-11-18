import { Hyp3eLogger } from "./logger.mjs";

export async function setupTurnTrackerHooks() {
    console.log("[HYP3E] HYP3ETurnTracker: Initializing Turn Tracker hooks...");

    /**
     * Custom hook for handling exploration turn reset to 1.
     */
    Hooks.on("explorationTurnReset", (turn) => {
        Hyp3eLogger.info("explorationTurnReset", `Exploration turn reset to ${turn}`);
        // Update the turn tracker display (if it exists) in the chat log
        // const tracker = $(".turn-tracker");
        // if (!tracker.length) return;
        // $("#current-turn").val(turn);
    });

    /**
     * Custom hook for handling exploration turn advancement.
     */
    Hooks.on("explorationTurnAdvanced", async (turn) => {
        Hyp3eLogger.info("explorationTurnAdvanced", `Exploration turn ${turn} triggered.`);

        // Update the turn tracker display (if it exists) in the chat log
        // const tracker = $(".turn-tracker");
        // if (!tracker.length) return;
        // $("#current-turn").val(turn);

        // The rest is for GMs only
        if (!game.user.isGM) return;

        // Process all tokens on the canvas
        for (const token of canvas.tokens.placeables) {
            const actor = token.actor;
            if (!actor) continue;

            actor.advanceExplorationTurn(turn);

            // Process equipped items
            for (const item of actor.items) {
                if (!item) continue;
                item.advanceExplorationTurn(turn);
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
        Hyp3eLogger.info("explorationTurnRetreat", `Exploration turn ${turn} triggered.`);

        // Update the turn tracker display (if it exists) in the chat log
        // const tracker = $(".turn-tracker");
        // if (!tracker.length) return;
        // $("#current-turn").val(turn);

        // The rest is for GMs only
        if (!game.user.isGM) return;

        // Process all tokens on the canvas
        for (const token of canvas.tokens.placeables) {
            const actor = token.actor;
            if (!actor) continue;

            actor.retreatExplorationTurn(turn);

            // Process equipped items
            for (const item of actor.items) {
                if (!item) continue;
                item.retreatExplorationTurn(turn);
            }
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

    static get currentTime() {
        const startTime = this.turnStartTime;
        const [startHour, startMinute] = startTime.split(":").map(Number);
        const totalMinutes = startHour * 60 + startMinute + (this.currentTurn - 1) * 10;
        const currentHour = Math.floor(totalMinutes / 60) % 24;
        const currentMinute = totalMinutes % 60;
        return `${currentHour.toString()}:${currentMinute.toString().padStart(2, '0')}`;
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
            Hyp3eLogger.info("HYP3ETurnTracker", `Setting updated:`, { setting, value, options, userId });
            if (setting.key !== "hyp3e.explorationTurn") return;

            const oldTurn = this._lastTurn;
            const newTurn = value.value;
            Hyp3eLogger.info("HYP3ETurnTracker", `Turn changed from ${oldTurn} to ${newTurn} by user ${userId}`);
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
        });
    }

    static async advanceTurn() {
        Hyp3eLogger.info("advanceTurn", `advanceTurn() fired on: ${game.user.id}, GM? ${game.user.isGM}`);
        const newTurn = this.currentTurn + 1;
        await game.settings.set("hyp3e", "explorationTurn", newTurn);
        Hyp3eLogger.info("advanceTurn", `Turn tracker advanced to turn ${newTurn}`);
        return newTurn;
    }

    static async retreatTurn() {
        if (this.currentTurn <= 1) return;  // Don't let turn go below 1
        const newTurn = this.currentTurn - 1;
        await game.settings.set("hyp3e", "explorationTurn", newTurn);
        Hyp3eLogger.info("retreatTurn", `Turn tracker retreated to turn ${newTurn}`);
        return newTurn;
    }

    static async reset() {
        const newTurn = 1;
        await game.settings.set("hyp3e", "explorationTurn", newTurn);
        Hyp3eLogger.info("reset", `Turn tracker reset to turn ${newTurn}.`);
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

}
