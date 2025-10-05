import { HYP3E } from "../helpers/config.mjs"
import { Hyp3eLogger } from "../helpers/logger.mjs";

const { 
    ApplicationV2, 
    HandlebarsApplicationMixin 
} = foundry.applications.api

// export class TurnAdvanceActionsConfig extends FormApplication {
export class TurnAdvanceActionsConfig extends HandlebarsApplicationMixin(ApplicationV2) {

    get title() {
        return game.i18n.localize(`Turn-Advance Actions`);
    }

    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        id: "turn-advance-actions-config",
        classes: ["hyp3e", "turn-advance-actions-config-window"],
        tag: "form",
        window: {
            resizable: true,
        },
        position: {
            width: 400,
        },
        form: {
            submitOnChange: false,
            closeOnSubmit: false,
            submitOnClose: false,
        },
        actions: {
            addAction: TurnAdvanceActionsConfig.#addAction,
            removeAction: TurnAdvanceActionsConfig.#removeAction,
            saveActions: TurnAdvanceActionsConfig.#saveActions,
        }
    }
    /** @inheritDoc */
    static PARTS = {
        form: {
            template: `${HYP3E.templatePath}/apps/turn-advance-actions-config.hbs`,
            scrollable: [""],
        }
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.actions = game.settings.get(game.system.id, "turnAdvanceActions") || [];
        return context;
    }

    /** @override */
    _onRender(context, options) {
        // Enable drag & drop functionality
        new CONFIG.ux.DragDrop({
            dropSelector: "input[name='uuid']",
            callbacks: {
                drop: this._onDrop.bind(this)
            }
        }).bind(this.element);
    }

    /**
     * Add a new empty turn-advance action to the data
     * @param {*} event 
     * @param {*} target 
     */
    static async #addAction(event, target) {
        // Get the current actions
        const actions = game.settings.get(game.system.id, "turnAdvanceActions") || [];

        // Create a new, blank action, and update the data
        actions.push({ uuid: "", label: "", output: "gm", enabled: true });
        await game.settings.set(game.system.id, "turnAdvanceActions", actions);

        // Refresh the form
        this.render(true);
    }

    /**
     * Delete the specified action from the data
     * @param {*} event 
     * @param {*} target 
     */
    static async #removeAction(event, target) {
        const uuidToRemove = target.dataset.uuid;
        const actions = game.settings.get(game.system.id, "turnAdvanceActions") || [];
        // Find the UUID, to remove its action
        const index = actions.findIndex(action => action.uuid === uuidToRemove);
        if (index !== -1) {
            actions.splice(index, 1);
        }
        // Update the data and refresh the form
        await game.settings.set(game.system.id, "turnAdvanceActions", actions);
        this.render(true);
    }

    /**
     * Save all valid actions in the form, overwriting the data
     * @param {*} event 
     * @param {*} target 
     */
    static async #saveActions(event, target) {
        event.preventDefault();

        // Find the nearest form ancestor
        const form = target.closest("form");
        if (!form) return;

        // Collect data
        const fd = new FormDataExtended(form);
        const formData = fd.object; // returns a deep object of all form fields
        Hyp3eLogger.info("#saveActions", `Form data:`, formData);

        const actions = [];
        const uuids = formData["uuid"];
        const labels = formData["label"];
        const outputs = formData["output"];
        const enableds = formData["enabled"];

        // Normalize in case of single entry (not array)
        const count = Array.isArray(uuids) ? uuids.length : 1;
        for (let i = 0; i < count; i++) {
            const uuid = Array.isArray(uuids) ? uuids[i] : uuids;
            const label = Array.isArray(labels) ? labels[i] : labels;
            const output = Array.isArray(outputs) ? outputs[i] : outputs;
            const enabled = Array.isArray(enableds) ? enableds[i] : enableds;
            if (!uuid) continue;
            actions.push({ uuid, label, output, enabled });
        }

        // Log the data & save
        const msg = `Saving turn-advance actions`;
        Hyp3eLogger.info("#saveActions", `${msg}:`, actions);
        ui.notifications.info(msg)
        await game.settings.set(game.system.id, "turnAdvanceActions", actions);

        // Re-render the form
        this.render(true);
    }

    async _onDrop(event) {
        event.preventDefault();
        Hyp3eLogger.info("_onDrop", `Drop event triggered:`, event)

        // Read dropped data
        const dataTransfer = event.dataTransfer?.getData("text/plain");
        if (!dataTransfer) return;

        let dropData;
        try {
            dropData = JSON.parse(dataTransfer);
            Hyp3eLogger.info("_onDrop", `Data from drop event:`, dropData)
        } catch {
            return;
        }

        // Verify it's an Item drop
        if (dropData.type !== "Macro" && dropData.type !== "RollTable") {
            ui.notifications.warn("That item cannot be dropped here. Please drop a Macro or RollTable.");
            return;
        }

        if (!dropData.uuid) {
            ui.notifications.warn("That item cannot be dropped here. Please drop a Macro or RollTable.");
            return;
        }

        // Resolve the dropped document
        const doc = await fromUuid(dropData.uuid);
        if (!doc) {
            ui.notifications.warn("Unable to resolve dropped document.");
            return;
        }

        // Set the UUID in the field
        event.target.value = doc.uuid;
        const $element = $(event.target)
        // Set the label field to the document's name
        const $labelInput = $element.closest(".action-item").find('input[name="label"]');
        $labelInput.val(doc.name);

        // Automatically save the form
        await TurnAdvanceActionsConfig.#saveActions.call(this, event, event.target);

    }
}
