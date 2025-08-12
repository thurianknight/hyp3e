export class TurnAdvanceActionsConfig extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "turn-advance-actions-config",
            title: "Turn Advance Actions",
            template: "systems/hyp3e/templates/apps/turn-advance-actions-config.hbs",
            width: 400,
            classes: ["hyp3e", "turn-advance-actions-config"],
            resizable: true,
            closeOnSubmit: true
        });
  }

    getData() {
        return {
            actions: game.settings.get(game.system.id, "turnAdvanceActions") || []
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Add a new action
        html.find(".add-action").on("click", ev => {
            const list = html.find(".action-list");
            const li = $(`
                <li class="action-item">
                    <div class="flexrow">
                        <span class="action-label">UUID:</span>
                        <input type="text" name="uuid" placeholder="UUID">
                    </div>
                    <div class="flexrow">
                        <span class="action-label">Name:</span>
                        <input type="text" name="label" placeholder="Label (optional)">
                    </div>
                    <div class="flexrow">
                        <span class="action-label">Chat Mode:</span>
                        <select name="output">
                            <option value="public">Public</option>
                            <option value="gm">Whisper to GM</option>
                        </select>
                    </div>
                    <button type="button" class="remove-action">Remove</button>
                </li>
            `);
            list.append(li);
            li.find(".remove-action").on("click", () => li.remove());
            // Attach drag/drop listener for the new input
            this._attachUuidDropListener(li.find("input[name='uuid']"));
        });

        // Remove an action
        html.find(".remove-action").on("click", ev => {
            $(ev.currentTarget).closest("li").remove();
        });

        // Attach drag/drop to existing inputs
        html.find("input[name='uuid']").each((_, el) => {
            this._attachUuidDropListener($(el));
        });
    }

    _attachUuidDropListener($input) {
        $input.on("dragover", ev => {
            ev.preventDefault();
            ev.originalEvent.dataTransfer.dropEffect = "copy";
        });

        $input.on("drop", ev => {
            ev.preventDefault();
            const data = JSON.parse(ev.originalEvent.dataTransfer.getData("text/plain"));
            const uuid = fromUuidSync(data.uuid ?? data.id ? data.uuid || `Macro.${data.id}` : "");
            // Foundry already includes uuid in drag data for documents
            if (data.uuid) {
                $input.val(data.uuid);
            } else {
                ui.notifications.warn("That item cannot be dropped here. Please drop a Macro or RollTable.");
            }
        });
    }

    async _updateObject(event, formData) {
        const actions = [];
        const uuids = formData["uuid"];
        const labels = formData["label"];
        const outputs = formData["output"];

        // Normalize in case of single entry (not array)
        const count = Array.isArray(uuids) ? uuids.length : 1;
        for (let i = 0; i < count; i++) {
            const uuid = Array.isArray(uuids) ? uuids[i] : uuids;
            const label = Array.isArray(labels) ? labels[i] : labels;
            const output = Array.isArray(outputs) ? outputs[i] : outputs;
            if (!uuid) continue;
            actions.push({ uuid, label, output });
        }
        console.log("Saving turn advance actions:", actions);
        await game.settings.set(game.system.id, "turnAdvanceActions", actions);
    }
}
