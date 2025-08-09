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
