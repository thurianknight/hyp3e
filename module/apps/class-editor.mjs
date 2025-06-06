// systems/hyp3e/module/apps/class-editor.mjs
import { Hyp3eCharacter } from "../helpers/character.mjs";
import { HYP3E } from "../helpers/config.mjs"

export class HYP3EClassEditor extends Application {
    /** @param {string|null} [classKey] - Class key for editing, or null for new class */
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
        // Prepare data for the template
        const baseClassNames = ["cleric", "fighter", "magician", "thief"];
        const baseClasses = Object.fromEntries(baseClassNames.map(n => [n, n.charAt(0).toUpperCase() + n.slice(1)]));

        const spellcasters = ["Cleric", "Druid", "Magician", "Cryomancer", "Illusionist", "Necromancer", "Pyromancer", "Witch"];
        const spellLists = Object.fromEntries(baseClassNames.map(n => [n, n]));

        const attributes = CONFIG.HYP3E.attributes;
        console.log("All attributes:", attributes);

        const attrReqs = {};
        const attributeKeys = Object.keys(attributes);
        for (const attr of attributeKeys) {
            attrReqs[attr] = this.classData.attrReqs?.[attr] ?? "";
        }
        console.log("Attribute requirements:", attrReqs);

        const xpBonusReqs = {};
        for (const attr of attributeKeys) {
            xpBonusReqs[attr] = this.classData.xpBonusReq?.[attr] ?? "";
        }
        console.log("Attribute requirements:", xpBonusReqs);


        const saves = CONFIG.HYP3E.saves;
        console.log("Available saves:", saves);

        // If no classData provided, initialize with empty structure
        if (Object.keys(this.classData).length === 0) {
            this.classData = {
                name: "New Class",
                description: "",
                baseClass: "",
                attributes: CONFIG.HYP3E.attributes,
                attrReqs: attrReqs,
                xpBonusReqs: xpBonusReqs,
                levelAdvancement: this.buildEmptyLevelAdvancement(),
                spellLists: spellLists,
                saves: saves,
                startingPack: {},
            };
        }

        console.log("Class Editor Data:", {
            classKey: this.classKey,
            classData: this.classData,
            baseClasses: baseClasses,
        });

        // Return data for the template
        return {
            classKey: this.classKey,
            classData: this.classData,
            baseClasses: baseClasses,
            attributes: CONFIG.HYP3E.attributes,
            attrReqs: attrReqs,
            spellLists: spellLists,
            saves: CONFIG.HYP3E.saves,
        };
    }

    async _updateObject(event, formData) {
        // Flattened formData to structured object
        const form = expandObject(formData);
        const data = form.classData;

        // Save to world settings
        const settings = game.settings.get(game.system.id, "customClassData") || {};
        const className = data.name || "Unnamed-Class";
        settings[className] = data;
        await game.settings.set(game.system.id, "customClassData", settings);

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
        console.log("Saving new class with form data:", formData);

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

        const allClasses = foundry.utils.deepClone(game.settings.get(game.system.id, "customClassData") || {});
        allClasses[key] = data;

        await game.settings.set(game.system.id, "customClassData", allClasses);
        ui.notifications.info(`Class "${key}" saved.`);
        this.close();
    }

    buildEmptyLevelAdvancement() {
        let levelAdvancement = {};
        for (let i = 1; i <= 12; i++) {
            levelAdvancement[i] = {
                xp: null,
                fa: null,
                ca: null,
                ta: null,
            };
        }
        return levelAdvancement;
    }

}
