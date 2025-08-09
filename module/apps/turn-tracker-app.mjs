// systems/hyp3e/module/apps/turn-tracker-app.mjs
import { HYP3E } from "../helpers/config.mjs"

export class HYP3ETurnTrackerApp extends Application {
    constructor(options = {}) {
        super(options);

        // Only register once
        Hooks.on("explorationTurnAdvanced", this._onTurnAdvanced.bind(this));
        Hooks.on("explorationTurnReset", this._onTurnReset.bind(this));
    }

    // async render(force = false, options = {}) {
    //     // Call super to get the HTML, but don't attach it to the body
    //     const html = await super._renderHTML(force, options);
        
    //     // Inject into the Chat Log before the input
    //     const $chatForm = $("#chat .chat-form");
    //     if ($chatForm.length) {
    //         $chatForm.before(html);
    //     }

    //     // Activate listeners on the injected HTML
    //     this._element = html; // Store reference so close(), etc. still work
    //     this.activateListeners(html);
    //     return this;
    // }

    /** Render this app embedded into a given container (jQuery element or selector). */
    async renderEmbedded(container) {
        // Resolve container as jQuery
        const $container = $(container);
        if (!$container.length) throw new Error("renderEmbedded: container not found");

        // Render the template with current data
        const htmlString = await renderTemplate(this.options.template, this.getData());
        const $html = $(htmlString).addClass("hyp3e-turn-tracker");

        // Remove a previous embedded instance if present
        if (this._embeddedElement) {
            this.closeEmbedded();
        }

        // Insert the HTML into the DOM (before container, similar to your previous code)
        $container.before($html);

        // Keep a reference so closeEmbedded can remove it later
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
