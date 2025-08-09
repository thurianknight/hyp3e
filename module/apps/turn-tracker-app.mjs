// systems/hyp3e/module/apps/turn-tracker-app.mjs
import { HYP3E } from "../helpers/config.mjs"

export class HYP3ETurnTrackerApp extends Application {
    constructor(options = {}) {
        super(options);

        // Only register once
        Hooks.on("explorationTurnAdvanced", this._onTurnAdvanced.bind(this));
        Hooks.on("explorationTurnReset", this._onTurnReset.bind(this));
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "hyp3e-turn-tracker-app",
            title: "Turn Tracker",
            template: `${HYP3E.templatePath}/apps/turn-tracker-app.hbs`,
            popOut: true,
            resizable: false,
            width: 300,
            height: "auto",
        });
    }

    getData() {
        const currentTurn = game.hyp3e.getTurn();
        return { currentTurn };
    }

    _onTurnAdvanced(data) {
        console.log("Turn advanced:", data);
        this.render(false); // Update the tracker
    }

    _onTurnReset(data) {
        console.log("Turn reset:", data);
        this.render(false); // Update/reset display
    }

    activateListeners(htmlData) {
        super.activateListeners(htmlData);
        const html = $(htmlData); // Wrap in jQuery

        html.find(".advance-turn").on("click", async ev => {
            await game.hyp3e.advanceTurn();
        });
        html.find(".reset").on("click", async ev => {
            await game.hyp3e.resetTurn();
        });
        html.find(".show-turn").on("click", async ev => {
            const turn = game.hyp3e.getTurn();
            ChatMessage.create({
                content: `Current exploration turn: ${turn}.`,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER
            });
        });
    }
}
