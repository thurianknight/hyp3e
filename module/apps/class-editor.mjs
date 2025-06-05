// systems/hyp3e/module/apps/class-editor.mjs
import { Hyp3eCharacter } from "../helpers/character.mjs";
import { HYP3E } from "../helpers/config.mjs"

export class HYP3EClassEditor extends Application {
    /** @param {Object} [classData] - Existing class data if editing */
    constructor(classKey = null, classData = {}) {
        super();
        this.classKey = classKey; // e.g. "Runegraver"
        this.classData = foundry.utils.deepClone(classData); // Deep clone to avoid mutations
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "hyp3e-class-editor",
            title: "Class Editor",
            template: `${HYP3E.templatePath}/apps/class-editor.hbs`,
            classes: ["hyp3e", "sheet", "class-editor"],
            width: 800,
            height: "auto",
            resizable: true,
            submitOnChange: false,
            closeOnSubmit: true,
            submitOnClose: true,
        });
    }

    getData() {
        return {
            classKey: this.classKey,
            classData: this.classData,
        };
    }

    async _updateObject(event, formData) {
        // Flattened formData to structured object
        const form = expandObject(formData);
        const data = form.classData;

        // Save to world settings
        const settings = game.settings.get("hyp3e", "customClassData") || {};
        const className = data.name || "Unnamed-Class";
        settings[className] = data;
        await game.settings.set("hyp3e", "customClassData", settings);

        ui.notifications.info(`Saved class data for ${className}`);
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".add-level").on("click", (event) => {
            const levels = this.classData.levelAdvancement || {};
            const maxLevel = Math.max(0, ...Object.keys(levels).map(Number));
            levels[maxLevel + 1] = { xp: 0, fa: 0, ca: 0 };
            this.render();
        });

        html.find(".remove-level").on("click", (event) => {
            const level = Number(event.currentTarget.dataset.level);
            delete this.classData.levelAdvancement[level];
            this.render();
        });

        // Handle Save button
        html.find("button.save").on("click", (event) => this._onSave(event));
        
        // Handle Cancel button
        html.find("button.cancel").on("click", () => this.close());

    }

    /** Collect data and save to game.settings */
    async _onSave(event) {
        event.preventDefault();
        const form = this.element.find("form")[0];
        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            // Convert string numbers to actual numbers if needed
            if (!isNaN(value) && value.trim() !== "") {
                value = Number(value);
            }
            foundry.utils.setProperty(data, key, value);
        }

        const key = this.classKey || data["newClassName"]?.trim();
        if (!key) {
            ui.notifications.error("You must provide a class name.");
            return;
        }

        const allClasses = foundry.utils.deepClone(game.settings.get("hyp3e", "customClasses") || {});
        allClasses[key] = data;

        await game.settings.set("hyp3e", "customClasses", allClasses);
        ui.notifications.info(`Class "${key}" saved.`);
        this.close();
    }

}
