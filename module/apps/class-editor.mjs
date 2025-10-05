// systems/hyp3e/module/apps/class-editor.mjs
import { Hyp3eCharacter } from "../helpers/character.mjs";
import { HYP3E } from "../helpers/config.mjs"
import { Hyp3eLogger } from "../helpers/logger.mjs";
import { findItemsByFolderOrCompendiumName } from "../helpers/folders-and-compendia.mjs"

const { 
    ApplicationV2, 
    HandlebarsApplicationMixin 
} = foundry.applications.api

// export class HYP3EClassEditor extends FormApplication {
export class HYP3EClassEditor extends HandlebarsApplicationMixin(ApplicationV2) {
    /** @param {string|null} [classKey] - Class key for editing, or null for new class */
    /** @param {Object} [classData] - Existing class data if editing */
    constructor(classKey = null, classData = {}) {
        super();
        this.classKey = classKey; // e.g. "Chronomancer"
        this.classData = foundry.utils.deepClone(classData);
    }

    get title() {
        return game.i18n.localize(`HYP3E.classEditor.title`);
    }

    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        id: "hyp3e-class-editor",
        tag: 'form',
        classes: ["hyp3e", "sheet", "class-editor"],
        window: {
            icon: "fa-solid fa-book",
            resizable: true,
        },
        position: {
            width: 700,
            height: "auto",
        },
        form: {
            // handler: HYP3EClassEditor.#saveClass,
            submitOnChange: false,
            closeOnSubmit: false,
            submitOnClose: true,
        },
        actions: {
            addItem: HYP3EClassEditor.#addItem,
            deleteItem: HYP3EClassEditor.#deleteItem,
            saveClass: HYP3EClassEditor.#saveClass,
        }
    }
    /** @inheritDoc */
    static PARTS = {
        form: {
            template: `${HYP3E.templatePath}/apps/class-editor.hbs`,
            scrollable: [""],
        }
    }

    // async getData(options) {
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Prepare data for the template
        context.classKey = this.classKey;
        context.classData = foundry.utils.deepClone(this.classData);

        const baseClassNames = ["cleric", "fighter", "magician", "thief"];
        // const baseClasses = Object.fromEntries(baseClassNames.map(n => [n, n.charAt(0).toUpperCase() + n.slice(1)]));
        context.baseClasses = Object.fromEntries(baseClassNames.map(n => [n, n.charAt(0).toUpperCase() + n.slice(1)]));

        const spellcasters = ["Cleric", "Druid", "Magician", "Cryomancer", "Illusionist", "Necromancer", "Pyromancer", "Witch"];
        // const spellLists = Object.fromEntries(spellcasters.map(n => [n, n]));
        context.spellLists = Object.fromEntries(spellcasters.map(n => [n, n]));

        const attributes = CONFIG.HYP3E.attributes;
        context.attributes = attributes;
        // Attribute requirements
        const attrReqs = {};
        for (const attr of Object.keys(attributes)) {
            attrReqs[attr] = {
                label: game.i18n.localize(`HYP3E.attributes.${attr}.name`),
                value: this.classData.attrReqs?.[attr] ?? "",
            };
        }
        context.attrReqs = attrReqs;

        // XP Bonus requirements
        const xpBonusReqs = {};
        for (const attr of Object.keys(attributes)) {
            xpBonusReqs[attr] = {
                label: game.i18n.localize(`HYP3E.attributes.${attr}.name`),
                value: this.classData.xpBonusReq?.[attr] ?? "",
            };
        }
        context.xpBonusReqs = xpBonusReqs;

        // Saving throws
        const saves = CONFIG.HYP3E.saves;
        const savingThrows = {};
        for (const save of Object.keys(saves)) {
            savingThrows[save] = {
                label: game.i18n.localize(`HYP3E.saves.${save}.name`),
                value: this.classData.saves?.[save] ?? 16,
            };
        }
        context.saves = savingThrows;

        // If no classData provided, initialize with an empty structure
        if (Object.keys(this.classData).length === 0) {
            this.name = game.i18n.localize(`HYP3E.classEditor.defaultName`);
            this.classData = {
                baseClass: "",
                attrReqs: attrReqs,
                xpBonusReqs: xpBonusReqs,
                spellLists: ["", ""],
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
        context.corePack = coreCategories;
        context.equipmentPack = equipmentCategories;

        const armorNames = await findItemsByFolderOrCompendiumName("armor, armour", "armor");
        context.armorOptions = Object.fromEntries(armorNames.map(n => [n, n]));

        const weaponNames = await findItemsByFolderOrCompendiumName("weapons, melee, missile, ammunition", "weapon");
        context.weaponOptions = Object.fromEntries(weaponNames.map(n => [n, n]));

        const gearNames = await findItemsByFolderOrCompendiumName("equipment, gear, general, clothing, weapons, ammunition", "item", "religious, religion, provisions, provision, food, supplies");
        context.gearOptions = Object.fromEntries(gearNames.map(n => [n, n]));

        const provisionNames = await findItemsByFolderOrCompendiumName("equipment, provision, provisions, food, supplies", "item", "clothing, gear, general, religious, religion");
        context.provisionOptions = Object.fromEntries(provisionNames.map(n => [n, n]));

        const religiousNames = await findItemsByFolderOrCompendiumName("equipment, religious, religion", "item", "clothing, gear, general, provisions, provision, food, supplies");
        context.religiousOptions = Object.fromEntries(religiousNames.map(n => [n, n]));

        return context;
    }

    /**
     * Add a blank item to the requested items list
     * @param {*} event 
     * @param {*} target 
     */
    static async #addItem(event, target) {
        const pack = target.dataset.pack;
        const newItem = { name: "", quantity: 1 };

        // Find the nearest form ancestor
        const form = target.closest("form");
        if (!form) return;

        // Collect data
        const fd = new FormDataExtended(form);
        const formData = fd.object; // returns a deep object of all form fields
        Hyp3eLogger.info("#addItem", `Form data:`, formData);

        // Save any other changes in process first
        // await HYP3EClassEditor.#saveClass(event, target);
        await HYP3EClassEditor.#saveClass.call(this, event, target);

        // Now we can merge those same changes in memory
        Hyp3eLogger.info("#addItem", `Previous changes saved, now we can add the new item...`);
        this.classData = foundry.utils.mergeObject(this.classData, formData.classData || {}, { inplace: false });
        Hyp3eLogger.info("#addItem", `Merged class data:`, this.classData);

        // Add the new item to the correct pack
        if (!Array.isArray(this.classData.startingPack[pack])) {
            this.classData.startingPack[pack] = [];
        }
        this.classData.startingPack[pack].push(newItem);

        this.render(true);
    }

    /**
     * Delete an item from the requested items list
     * @param {*} event 
     * @param {*} target 
     */
    static async #deleteItem(event, target) {
        const pack = target.dataset.pack;
        const index = parseInt(target.dataset.index);

        // Log the delete data
        Hyp3eLogger.info("deleteItem", "Deleting item:", { pack, index });

        // Save any other changes in process first
        // await HYP3EClassEditor.#saveClass(event, target);
        await HYP3EClassEditor.#saveClass.call(this, event, target);

        if (!isNaN(index)) this.classData.startingPack[pack].splice(index, 1);
        this.render(true);
    }

    /**
     * Save the complete class data
     * @param {*} event 
     * @param {*} target 
     * @returns 
     */
    static async #saveClass(event, target) {
        event.preventDefault();

        // Find the nearest form ancestor
        const form = target.closest("form");
        if (!form) return;

        // Collect data
        const fd = new FormDataExtended(form);
        const formData = fd.object; // returns a deep object of all form fields
        Hyp3eLogger.info("#saveClass", `Form data:`, formData);

        const data = foundry.utils.expandObject(formData);
        Hyp3eLogger.info("#saveClass", "Saving class with expanded data:", data);
        this.name = data.name?.trim() || this.classKey;
        this.classData = foundry.utils.mergeObject(this.classData, data.classData || {}, { inplace: false });
        Hyp3eLogger.info("#saveClass", "Merged class data:", this.classKey, this.name, this.classData);

        // If the class has been renamed, flag it here
        let renameClass = false;
        if (this.classKey && this.name != this.classKey) {
            renameClass = true;
            Hyp3eLogger.info("#saveClass", `Renaming class from ${this.classKey} to ${this.name}...`);
        } else if (!this.classKey && this.name != "") {
            // This is not renaming, it is giving a name to a new (unnamed) class
            this.classKey = this.name;
        }

        // Don't forget these fields, they are not on the form itself
        const level1 = this.classData.levelAdvancement["1"]
        this.classData.fa = level1.fa;
        this.classData.ca = level1.ca;
        this.classData.ta = level1.ta;

        // spellLists must be stored as an array, but it comes from the form as an indexed object
        this.classData.spellLists = Object.values(this.classData.spellLists);

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
        if (!key) return ui.notifications.warn("Nameless class not saved.");

        const allClasses = foundry.utils.deepClone(game.settings.get(game.system.id, "customClassData") || {});
        allClasses[key] = this.classData;
        if (renameClass) delete allClasses[this.classKey];
        await game.settings.set(game.system.id, "customClassData", allClasses);

        ui.notifications.info(`Class "${this.name}" saved.`);

        // Reload custom classes
        CONFIG.HYP3E.customClassData = game.settings.get(game.system.id, "customClassData");

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
            armour: [],
            weapons: [],
            "equipment - general": [],
            "equipment - provisions": [],
            "equipment - religious": [],
        };
    }
}
