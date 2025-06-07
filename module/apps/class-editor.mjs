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

        // Attribute requirements
        const attrReqs = {};
        const attributeKeys = Object.keys(attributes);
        for (const attr of attributeKeys) {
            attrReqs[attr] = {
                label: game.i18n.localize(`HYP3E.attributes.${attr}.name`),
                value: this.classData.attrReqs?.[attr] ?? "",
            };
        }
        console.log("Attribute requirements:", attrReqs);

        // XP Bonus requirements
        const xpBonusReqs = {};
        for (const attr of attributeKeys) {
            xpBonusReqs[attr] = {
                label: game.i18n.localize(`HYP3E.attributes.${attr}.name`),
                value: this.classData.xpBonusReq?.[attr] ?? "",
            };
        }
        console.log("XP Bonus requirements:", xpBonusReqs);

        // Starting packs
        const startingPacks = { gold: "", armour: {}, weapons: {}, "equipment - general": {}, "equipment - provisions": {}, "equipment - religious": {} };

        // Saving throws
        const savingThrows = {};
        const saves = CONFIG.HYP3E.saves;
        const saveKeys = Object.keys(saves);
        for (const save of saveKeys) {
            savingThrows[save] = {
                label: game.i18n.localize(`HYP3E.saves.${save}.name`),
                value: this.classData.saves?.[save] ?? 16, // Default to 16 if not set
            };
        }
        console.log("Saving throws:", savingThrows);

        // If no classData provided, initialize with empty structure
        if (Object.keys(this.classData).length === 0) {
            this.classData = {
                name: "New Class",
                baseClass: "",
                attrReqs: attrReqs,
                xpBonusReqs: xpBonusReqs,
                saves: saves,
                levelAdvancement: this.buildEmptyLevelAdvancement(),
                startingPack: this.buildEmptyStartingPack(),
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
            xpBonusReqs: xpBonusReqs,
            saves: savingThrows,
            spellLists: spellLists,
            startingPacks: startingPacks,
        };
    }

    // async _updateObject(event, formData) {
    //     // Flattened formData to structured object
    //     const form = expandObject(formData);
    //     const data = form.classData;

    //     // Save to world settings
    //     const settings = game.settings.get(game.system.id, "customClassData") || {};
    //     const className = data.name || "Unnamed-Class";
    //     settings[className] = data;
    //     await game.settings.set(game.system.id, "customClassData", settings);

    //     ui.notifications.info(`Saved class data for ${className}`);
    // }

    activateListeners(html) {
        super.activateListeners(html);

        // Handle Save button
        html.find(".save-class").on("click", (event) => this._onSave(event));

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
            // Log the key-value pairs for debugging
            console.log(`Form data: ${key} = ${value}`);
            // Handle nested properties
            if (key.startsWith("classData.")) {
                key = key.replace("classData.", "");
            }
            foundry.utils.setProperty(data, key, value);
        }

        const key = this.classKey || data["name"]?.trim();
        if (!key) {
            ui.notifications.error("You must provide a class name.");
            return;
        }

        const allClasses = foundry.utils.deepClone(game.settings.get(game.system.id, "customClassData") || {});
        allClasses[key] = data;

        // For testing purposes, log the class data
        console.log("Saving class data:", key, data);
        // Save the class data to game settings
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

    buildEmptyStartingPack() {
        return {
            gold: "1d4+1",
            armour: { name: "", quantity: null },
            weapons: { name: "", quantity: null },
            "equipment - general": { name: "", quantity: null },
            "equipment - provisions": { name: "", quantity: null },
            "equipment - religious": { name: "", quantity: null },
        };
    }

}
