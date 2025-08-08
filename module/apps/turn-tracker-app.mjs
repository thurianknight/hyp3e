// systems/hyp3e/module/apps/turn-tracker-app.mjs
import { HYP3E } from "../helpers/config.mjs"

export class HYP3ETurnTrackerApp extends Application {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "hyp3e-exploration-timer-app",
            title: "Exploration Timer",
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

    activateListeners(htmlData) {
        super.activateListeners(htmlData);
        const html = $(htmlData); // Wrap in jQuery

        html.find(".advance-turn").on("click", async ev => {
            await game.hyp3e.advanceTurn();
            this.render(true); // Re-render to update UI
        });
        html.find(".reset").on("click", async ev => {
            await game.hyp3e.resetTurn();
            this.render(true); // Re-render to update UI
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
