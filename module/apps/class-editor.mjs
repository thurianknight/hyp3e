// systems/hyp3e/module/apps/class-editor.mjs
import { Hyp3eCharacter } from "../helpers/character.mjs";
import { HYP3E } from "../helpers/config.mjs"
import { findItemsByFolderOrCompendiumName } from "../helpers/folders-and-compendia.mjs"

export class HYP3EClassEditor extends FormApplication {
    /** @param {string|null} [classKey] - Class key for editing, or null for new class */
    /** @param {Object} [classData] - Existing class data if editing */
    constructor(classKey = null, classData = {}) {
        super();
        this.classKey = classKey; // e.g. "Chronomancer"
        this.classData = foundry.utils.deepClone(classData);
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
            closeOnSubmit: false,
            submitOnClose: true,
        });
    }

    async getData(options) {
        // Prepare data for the template
        const baseClassNames = ["cleric", "fighter", "magician", "thief"];
        const baseClasses = Object.fromEntries(baseClassNames.map(n => [n, n.charAt(0).toUpperCase() + n.slice(1)]));

        const spellcasters = ["Cleric", "Druid", "Magician", "Cryomancer", "Illusionist", "Necromancer", "Pyromancer", "Witch"];
        const spellLists = Object.fromEntries(baseClassNames.map(n => [n, n]));

        const attributes = CONFIG.HYP3E.attributes;
        // Attribute requirements
        const attrReqs = {};
        for (const attr of Object.keys(attributes)) {
            attrReqs[attr] = {
                label: game.i18n.localize(`HYP3E.attributes.${attr}.name`),
                value: this.classData.attrReqs?.[attr] ?? "",
            };
        }
        // XP Bonus requirements
        const xpBonusReqs = {};
        for (const attr of Object.keys(attributes)) {
            xpBonusReqs[attr] = {
                label: game.i18n.localize(`HYP3E.attributes.${attr}.name`),
                value: this.classData.xpBonusReq?.[attr] ?? "",
            };
        }

        // Saving throws
        const saves = CONFIG.HYP3E.saves;
        const savingThrows = {};
        for (const save of Object.keys(saves)) {
            savingThrows[save] = {
                label: game.i18n.localize(`HYP3E.saves.${save}.name`),
                value: this.classData.saves?.[save] ?? 16,
            };
        }

        // If no classData provided, initialize with an empty structure
        if (Object.keys(this.classData).length === 0) {
            this.name = "New Class";
            this.classData = {
                baseClass: "",
                attrReqs: attrReqs,
                xpBonusReqs: xpBonusReqs,
                saves: saves,
                levelAdvancement: this.buildEmptyLevelAdvancement(),
                startingPack: this.buildEmptyStartingPack(),
            };
        }

        // Split startingPack into separate display components
        const startingPack = this.classData.startingPack ?? {};
        const equipmentCategories = {};
        const coreCategories = {};
        for (const [key, value] of Object.entries(startingPack)) {
            if (key === "gold") {
                coreCategories[key] = foundry.utils.deepClone(value)
            } else if (key === "equipment - general") {
                equipmentCategories[key] = Array.isArray(value) ? foundry.utils.deepClone(value) : [];
            } else {
                coreCategories[key] = Array.isArray(value) ? foundry.utils.deepClone(value) : [];
            }
        }

        const armorNames = await findItemsByFolderOrCompendiumName("armor, armour", "armor");
        const weaponNames = await findItemsByFolderOrCompendiumName("weapons, melee, missile", "weapon");
        const gearNames = await findItemsByFolderOrCompendiumName("equipment, gear", "item", "religion, religious, provision, provisions");
        const provisionNames = await findItemsByFolderOrCompendiumName("provision, provisions", "item");
        const religiousNames = await findItemsByFolderOrCompendiumName("religious, religion", "item");

        return {
            classKey: this.classKey,
            classData: foundry.utils.deepClone(this.classData),
            baseClasses,
            attributes,
            attrReqs,
            xpBonusReqs,
            saves: savingThrows,
            spellLists,
            corePack: coreCategories,
            equipmentPack: equipmentCategories,
            armorOptions: Object.fromEntries(armorNames.map(n => [n, n])),
            weaponOptions: Object.fromEntries(weaponNames.map(n => [n, n])),
            gearOptions: Object.fromEntries(gearNames.map(n => [n, n])),
            provisionOptions: Object.fromEntries(provisionNames.map(n => [n, n])),
            religiousOptions: Object.fromEntries(religiousNames.map(n => [n, n])),
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".delete-item").on("click", async ev => {
            const pack = ev.currentTarget.dataset.pack;
            const index = parseInt(ev.currentTarget.dataset.index);

            // Get current form state
            const formData = this._getSubmitData(); // Already expanded

            // Save any other changes in process first
            await this._updateObject(new Event("submit"), formData);

            if (!isNaN(index)) this.classData.startingPack[pack].splice(index, 1);
            this.render(true);
        });

        html.find(".add-item").on("click", async ev => {
            const pack = ev.currentTarget.dataset.pack;
            const newItem = { name: "", quantity: null };

            // Get current form state
            const formData = this._getSubmitData(); // Already expanded

            // Save any other changes in process first
            await this._updateObject(new Event("submit"), formData);

            // Now refresh the updated data from settings
            // this.classData = duplicate(game.settings.get(game.system.id, "customClassData"));

            // Now we can merge those same changes in memory
            console.log("Current form data:", formData)
            this.classData = mergeObject(this.classData, formData.classData || {}, { inplace: false });
            console.log("Merged class data:", this.classData);

            // Add the new item to the correct pack
            if (!Array.isArray(this.classData.startingPack[pack])) {
                this.classData.startingPack[pack] = [];
            }
            this.classData.startingPack[pack].push(newItem);

            this.render(true);
        });
    }

    async _updateObject(event, formData) {
        const data = foundry.utils.expandObject(formData);
        console.log("Saving class with form data:", data);
        this.name = data.name?.trim() || this.classKey;
        this.classData = mergeObject(this.classData, data.classData || {}, { inplace: false });
        console.log("Merged class data:", this.classKey, this.name, this.classData);

        // If the class has been renamed, tag it here
        let renameClass = false;
        if (this.classKey && this.name != this.classKey) {
            renameClass = true;
            console.log(`Renaming class from ${this.classKey} to ${this.name}...`)
        }
        let { startingPack } = this.classData;
        const result = {
            gold: startingPack.gold,
            armour: Object.values(startingPack.armour || {}),
            weapons: Object.values(startingPack.weapons || {}),
            "equipment - general": Object.values(startingPack["equipment - general"] || {}),
            "equipment - provisions": Object.values(startingPack["equipment - provisions"] || {}),
            "equipment - religious": Object.values(startingPack["equipment - religious"] || {}),
        };
        this.classData.startingPack = result;

        const key = this.name?.trim() || this.classKey;
        if (!key) return ui.notifications.error("Nameless class not saved.");

        const allClasses = foundry.utils.deepClone(game.settings.get(game.system.id, "customClassData") || {});
        allClasses[key] = this.classData;
        if (renameClass) delete allClasses[this.classKey];
        await game.settings.set(game.system.id, "customClassData", allClasses);

        // ui.notifications.info(`Class "${key}" saved.`);
    }

    buildEmptyLevelAdvancement() {
        let levelAdvancement = {};
        for (let i = 1; i <= 12; i++) {
            levelAdvancement[i] = { xp: null, fa: null, ca: null, ta: null };
        }
        return levelAdvancement;
    }

    buildEmptyStartingPack() {
        return {
            gold: "1d4+1",
            armour: [{ name: "", quantity: null }],
            weapons: [{ name: "", quantity: null }],
            "equipment - general": [{ name: "", quantity: null }],
            "equipment - provisions": [{ name: "", quantity: null }],
            "equipment - religious": [{ name: "", quantity: null }],
        };
    }
}
