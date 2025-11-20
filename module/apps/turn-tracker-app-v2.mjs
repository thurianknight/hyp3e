// systems/hyp3e/module/apps/turn-tracker-app.mjs
import { HYP3E } from "../helpers/config.mjs"
import { Hyp3eLogger } from "../helpers/logger.mjs";
import { TurnAdvanceActionsConfig } from "./turn-advance-actions-config.mjs";

const {
    HandlebarsApplicationMixin,
    ApplicationV2
} = foundry.applications.api;

export class HYP3ETurnTrackerAppV2 extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "hyp3e-turn-tracker-app",
        tag: "div",
        window: {
            title: "Turn Tracker",
        },
        classes: ["turn-tracker"],
        position: {
            width: 290,
            height: "auto"
        },
    };

    /** Path to the Handlebars template */
    static PARTS = {
        content: {
            template: `${HYP3E.templatePath}/apps/turn-tracker-app-v2.hbs`,
        }
    };

    static _hooksRegistered = false;

    constructor(options = {}) {
        super(options);

        // Only register hooks once
        if (!HYP3ETurnTrackerAppV2._hooksRegistered) {
            Hooks.on("explorationTurnAdvanced", this._onTurnAdvanced.bind(this));
            Hooks.on("explorationTurnRetreat", this._onTurnRetreat.bind(this));
            Hooks.on("explorationTurnReset", this._onTurnReset.bind(this));
            HYP3ETurnTrackerAppV2._hooksRegistered = true;
            Hyp3eLogger.info("HYP3ETurnTrackerAppV2 constructor", "Registered turn tracker hooks");
        }
    }

    /** Render this app embedded into a given container (chat bar by default). */
    async renderEmbedded(container) {
        // Resolve container as jQuery
        const $container = $(container);
        if (!$container.length) throw new Error("HYP3ETurnTrackerAppV2 renderEmbedded: container not found");
        Hyp3eLogger.info("HYP3ETurnTrackerAppV2 renderEmbedded", "Rendering into container:", $container);

        // Render the template with current data
        const htmlString = await foundry.applications.handlebars.renderTemplate(HYP3ETurnTrackerAppV2.PARTS.content.template, this._prepareContext());
        Hyp3eLogger.info("HYP3ETurnTrackerAppV2 renderEmbedded", "Rendering turn tracker:", htmlString);
        const $html = $(htmlString).addClass("turn-tracker");

        // Remove a previous embedded instance if present
        if (this._embeddedElement) {
            this.closeEmbedded();
        }

        // Insert the HTML into the DOM (before container)
        $container.before($html);

        // Keep a reference so closeEmbedded can remove it later (NOT USED YET)
        this._embeddedElement = $html;

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
        }
    }

    // static get defaultOptions() {
    //     return foundry.utils.mergeObject(super.defaultOptions, {
    //         id: "hyp3e-turn-tracker-app",
    //         classes: ["turn-tracker"],
    //         title: "Turn Tracker",
    //         template: `${HYP3E.templatePath}/apps/turn-tracker-app.hbs`,
    //         // popOut: true,
    //         popOut: false, // Disable popout for now
    //         resizable: false,
    //         width: 290,
    //         height: "auto",
    //     });
    // }

    // getData() {
    _prepareContext(_options) {
        Hyp3eLogger.info("HYP3ETurnTrackerAppV2 _prepareContext", `Turn Tracker options:`, _options)
        const currentTurn = game.hyp3e.turnTracker.getTurn();
        const currentTime = game.hyp3e.turnTracker.getTime();
        Hyp3eLogger.info("HYP3ETurnTrackerAppV2 _prepareContext", "Current turn and time:", { currentTurn, currentTime });
        return { currentTurn, currentTime, isGM: game.user.isGM };
    }

    _onRender(context, options) {
        super._onRender(context, options);
        Hyp3eLogger.info("HYP3ETurnTrackerAppV2 _onRender", `Turn Tracker parameters:`, {context, options})
    }

    _onTurnAdvanced(data) {
        Hyp3eLogger.info("HYP3ETurnTrackerAppV2 _onTurnAdvanced", "Turn advanced:", data);
        // this.render(false); // Update the tracker
        this.updateTurnDisplay(data);
    }

    _onTurnRetreat(data) {
        Hyp3eLogger.info("HYP3ETurnTrackerAppV2 _onTurnRetreat", "Turn retreat:", data);
        // this.render(false); // Update the tracker
        this.updateTurnDisplay(data);
    }

    _onTurnReset(data) {
        Hyp3eLogger.info("HYP3ETurnTrackerAppV2 _onTurnReset", "Turn reset:", data);
        // this.render(false); // Update the tracker
        this.updateTurnDisplay(data);
    }

    activateListeners(htmlData) {
        // super.activateListeners(htmlData);
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
            const currentTime = game.hyp3e.turnTracker.getTime();
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

    updateTurnDisplay(turn) {
        if (!this._embeddedElement) return;

        // Update the turn field
        const turnField = this._embeddedElement.find("#current-turn");
        turnField.val(turn);

        // Trigger visual flash
        turnField.addClass("turn-advance-flash");
        setTimeout(() => turnField.removeClass("turn-advance-flash"), 600);

        // Update the time field
        const currentTime = game.hyp3e.turnTracker.getTime();
        this._embeddedElement.find("#current-time")?.val(currentTime);
    }
}