// exploration-timer.mjs

export class ExplorationTimer {

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
        console.log(`Current Exploration Turn: ${newTurn}`);
        Hooks.call("explorationTurnAdvanced", newTurn);
        return newTurn;
    }

    static reset() {
        this.currentTurn = 1;
        console.log("Exploration timer reset to turn 1.");
    }

    static getTurn() {
        return this.currentTurn;
    }

}
