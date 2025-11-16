// systems/hyp3e/module/apps/turn-tracker-app.mjs
import { HYP3E } from "../helpers/config.mjs"
import { Hyp3eLogger } from "../helpers/logger.mjs";
import { TurnAdvanceActionsConfig } from "./turn-advance-actions-config.mjs";

export class HYP3ETurnTrackerApp extends Application {
    constructor(options = {}) {
        super(options);

        // Only register once
        Hooks.on("explorationTurnAdvanced", this._onTurnAdvanced.bind(this));
        Hooks.on("explorationTurnRetreat", this._onTurnRetreat.bind(this));
        Hooks.on("explorationTurnReset", this._onTurnReset.bind(this));
    }

    /** Render this app embedded into a given container (jQuery element or selector). */
    async renderEmbedded(container) {
        // Resolve container as jQuery
        const $container = $(container);
        if (!$container.length) throw new Error("renderEmbedded: container not found");

        // Render the template with current data
        const htmlString = await foundry.applications.handlebars.renderTemplate(this.options.template, this.getData());
        const $html = $(htmlString).addClass("turn-tracker");

        // Remove a previous embedded instance if present
        if (this._embeddedElement) {
            this.closeEmbedded();
        }

        // Insert the HTML into the DOM (before container)
        $container.before($html);

        // Keep a reference so closeEmbedded can remove it later (NOT USED YET)
        this._embeddedElement = $html;
        this._embedded = true;

        // Activate listeners (activateListeners expects a jQuery element)
        this.activateListeners($html);

        // Return the instance for chaining
        return this;
    }

    /** Remove the embedded DOM (if any) and clean references */
    closeEmbedded() {
        if (this._embeddedElement) {
            this._embeddedElement.remove();
            this._embeddedElement = null;
            this._isEmbedded = false;
        }
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "hyp3e-turn-tracker-app",
            classes: ["turn-tracker"],
            title: "Turn Tracker",
            template: `${HYP3E.templatePath}/apps/turn-tracker-app.hbs`,
            // popOut: true,
            popOut: false, // Disable popout for now
            resizable: false,
            width: 290,
            height: "auto",
        });
    }

    getData() {
        const currentTurn = game.hyp3e.turnTracker.getTurn();
        return { currentTurn };
    }

    _onTurnAdvanced(data) {
        Hyp3eLogger.info("_onTurnAdvanced", "Turn advanced:", data);
        // Update the turn tracker display in the chat log
        const tracker = $(".turn-tracker");
        if (!tracker.length) return;
        tracker.find(".turn-label").text(`Turn: ${data}`);
        this.render(false); // Update the tracker
    }

    _onTurnRetreat(data) {
        Hyp3eLogger.info("_onTurnRetreat", "Turn retreat:", data);
        this.render(false); // Update the tracker
    }

    _onTurnReset(data) {
        Hyp3eLogger.info("_onTurnReset", "Turn reset:", data);
        this.render(false); // Update/reset display
    }

    activateListeners(htmlData) {
        super.activateListeners(htmlData);
        const html = $(htmlData); // Wrap in jQuery

        html.find(".open-calendar").on("click", ev => {
            game.hyp3e.openCalendar();
        });
        html.find(".advance-turn").on("click", async ev => {
            await game.hyp3e.turnTracker.advanceTurn();
            if (game.hyp3e?.calendar) {
                game.hyp3e.calendar.render(false);
            }
        });
        html.find(".retreat-turn").on("click", async ev => {
            await game.hyp3e.turnTracker.retreatTurn();
            if (game.hyp3e?.calendar) {
                game.hyp3e.calendar.render(false);
            }
        });
        html.find(".reset").on("click", async ev => {
            await game.hyp3e.turnTracker.resetTurn();
            if (game.hyp3e?.calendar) {
                game.hyp3e.calendar.render(false);
            }
        });
        html.find(".show-turn").on("click", async ev => {
            const turn = game.hyp3e.turnTracker.getTurn();
            const currentTime = game.hyp3e.turnTracker.currentTime();
            ChatMessage.create({
                content: `Current exploration turn: ${turn}, time is ${currentTime}.`,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER
            });
        });
        html.find(".open-turn-actions").on("click", ev => {
            ev.preventDefault();
            new TurnAdvanceActionsConfig().render(true);
        });
    }
}
