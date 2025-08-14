export async function setupTurnTrackerHooks() {
    /**
     * Custom hook for handling exploration turn reset to 1.
     */
    Hooks.on("explorationTurnReset", (turn) => {
        console.log(`Exploration turn reset to ${turn}`);
        // Update the turn tracker display in the chat log
        const tracker = $(".turn-tracker");
        if (!tracker.length) return;
        tracker.find(".turn-label").text(`Turn: ${turn}`);
    });

    /**
     * Custom hook for handling exploration turn advancement.
     */
    Hooks.on("explorationTurnAdvanced", async (turn) => {
        console.log(`Exploration turn ${turn} triggered.`);

        // Update the turn tracker display in the chat log
        const tracker = $(".turn-tracker");
        if (!tracker.length) return;
        tracker.find(".turn-label").text(`Turn: ${turn}`);

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
        console.log(`Exploration turn ${turn} triggered.`);

        // Update the turn tracker display in the chat log
        const tracker = $(".turn-tracker");
        if (!tracker.length) return;
        tracker.find(".turn-label").text(`Turn: ${turn}`);

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

    static set currentTurn(value) {
        game.settings.set("hyp3e", "explorationTurn", value);
    }

    static async advanceTurn() {
        const newTurn = this.currentTurn + 1;
        await game.settings.set("hyp3e", "explorationTurn", newTurn);
        this.currentTurn = newTurn;
        console.log(`Turn tracker advanced to turn ${newTurn}`);
        Hooks.call("explorationTurnAdvanced", newTurn);
        return newTurn;
    }

    static async retreatTurn() {
        const newTurn = this.currentTurn - 1;
        await game.settings.set("hyp3e", "explorationTurn", newTurn);
        this.currentTurn = newTurn;
        console.log(`Turn tracker retreated to turn ${newTurn}`);
        Hooks.call("explorationTurnRetreat", newTurn);
        return newTurn;
    }

    static async reset() {
        const newTurn = 1;
        await game.settings.set("hyp3e", "explorationTurn", newTurn);
        this.currentTurn = newTurn;
        console.log(`Turn tracker reset to turn ${newTurn}.`);
        Hooks.call("explorationTurnReset", newTurn);
        return newTurn;
    }

    static getTurn() {
        return this.currentTurn;
    }

}
