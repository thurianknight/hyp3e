// systems/hyp3e/module/apps/class-editor.mjs
import { Hyp3eCharacter } from "../helpers/character.mjs";
import { HYP3E } from "../helpers/config.mjs"
import { findItemsByFolderOrCompendiumName } from "../helpers/folders-and-compendia.mjs"

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

    async getData() {
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

        // If no classData provided, initialize with an empty structure
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

        // Split startingPack into separate display components
        const startingPack = this.classData.startingPack ?? {};
        const equipmentCategories = {};
        const coreCategories = {};
        for (const [key, value] of Object.entries(startingPack)) {
            if (key.startsWith("equipment")) {
                equipmentCategories[key] = Array.isArray(value) ? foundry.utils.deepClone(value) : [];
            } else if (["armour", "weapons"].includes(key)) {
                coreCategories[key] = Array.isArray(value) ? foundry.utils.deepClone(value) : [];
            } else if (["gold"].includes(key)) {
                coreCategories[key] = foundry.utils.deepClone(value)
            }
        }

        // All armors in folders and compendia
        const armorNames = await findItemsByFolderOrCompendiumName("armor, armour", "armor");
        const armorOptions = Object.fromEntries(armorNames.map(n => [n, n]));
        // All weapons in folders and compendia
        const weaponNames = await findItemsByFolderOrCompendiumName("weapons, melee, missile", "weapon");
        const weaponOptions = Object.fromEntries(weaponNames.map(n => [n, n]));
        // All general equipment in folders and compendia
        const gearNames = await findItemsByFolderOrCompendiumName("equipment, gear", "item", "religion, religious, provision, provisions");
        const gearOptions = Object.fromEntries(gearNames.map(n => [n, n]));
        // All provisions in folders and compendia
        const provisionNames = await findItemsByFolderOrCompendiumName("provision, provisions", "item");
        const provisionOptions = Object.fromEntries(provisionNames.map(n => [n, n]));
        // All religious equipment in folders and compendia
        const religiousNames = await findItemsByFolderOrCompendiumName("religious, religion", "item");
        const religiousOptions = Object.fromEntries(religiousNames.map(n => [n, n]));

        console.log("Class Editor Data:", {
            classKey: this.classKey,
            classData: this.classData,
            baseClasses: baseClasses,
            corePack: coreCategories,
            equipmentPack: equipmentCategories,
            armorNames: armorNames,
            weaponNames: weaponNames,
            gearNames: gearNames,
            provisionNames: provisionNames,
            religiousNames: religiousNames,
        });

        // Return data for the template
        return {
            classKey: this.classKey,
            classData: foundry.utils.deepClone(this.classData),
            baseClasses: baseClasses,
            attributes: CONFIG.HYP3E.attributes,
            attrReqs: attrReqs,
            xpBonusReqs: xpBonusReqs,
            saves: savingThrows,
            spellLists: spellLists,
            corePack: coreCategories,
            equipmentPack: equipmentCategories,
            armorOptions: armorOptions,
            weaponOptions: weaponOptions,
            gearOptions: gearOptions,
            provisionOptions: provisionOptions,
            religiousOptions: religiousOptions,
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Handle starting pack - Delete item
        html.find(".delete-item").on("click", ev => {
            const pack = ev.currentTarget.dataset.pack;
            const index = parseInt(ev.currentTarget.dataset.index);
            if (isNaN(index)) return;

            const packData = this.classData.startingPack[pack];
            packData.splice(index, 1);
            this.render(true);
        });
        // Handle starting pack - Add item
        html.find(".add-item").on("click", ev => {
            const pack = ev.currentTarget.dataset.pack;
            const newItem = { name: "", quantity: null };

            // Get the current DOM state and save it, so we don't lose any changes in progress
            const formData = this._getFormData(html);
            const expanded = foundry.utils.expandObject(formData); // optional but good practice
            this.classData = foundry.utils.mergeObject(this.classData, expanded.classData || {}, {inplace: false});

            // Now we can add the new item
            if (!Array.isArray(this.classData.startingPack[pack])) {
                this.classData.startingPack[pack] = [];
            }
            this.classData.startingPack[pack].push(newItem);

            this.render(true);
        });

        // Handle class - Save button
        html.find(".save-class").on("click", (event) => this._onSave(event));

    }

    _getFormData(html) {
        const form = html[0].querySelector("form");
        if (!form) return {};

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        return foundry.utils.expandObject(data);
    }

    /** Collect data and save to game.settings */
    async _onSave(event) {
        event.preventDefault();
        const form = this.element.find("form")[0];
        const formData = new FormData(form);
        const data = {};
        console.log("Saving class with form data:", formData);

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

        // We need to handle startingPack item categories specially since they start out as 
        // numeric-keyed objects but must be transformed into arrays of objects
        let armour, gearItems, provisionItems, religiousItems, weapons = [];
        for (let [type, items] of Object.entries(data.startingPack)) {
            console.log("Gear Type:", type)
            // Parse out the nested types
            switch (type) {
                case "armour":
                    // Object.values is an array, so it handles our transformation for us
                    console.log("Armour Items: ", items)
                    armour = Object.values(items);
                    break;
                case "equipment - general":
                    console.log("General Equipment Items: ", items)
                    gearItems = Object.values(items);
                    break;
                case "equipment - provisions":
                    console.log("Provision Items: ", items)
                    provisionItems = Object.values(items);
                    break;
                case "equipment - religious":
                    console.log("Religious Items: ", items)
                    religiousItems = Object.values(items);
                    break;
                case "weapons":
                    console.log("Weapon Items: ", items)
                    weapons = Object.values(items);
                    break;
                case "gold":
                    // Do nothing, this was handled ok above
                    break;
                default:
                    console.warn("Warning: startingPack type not valid!")
            }
        }
        // Now reconstruct our data.startingPack
        data.startingPack = {};
        data.startingPack["armour"] = armour;
        data.startingPack["equipment - general"] = gearItems;
        data.startingPack["equipment - provisions"] = provisionItems;
        data.startingPack["equipment - religious"] = religiousItems;
        data.startingPack["weapons"] = weapons;

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
            armour: [{ name: "", quantity: null }],
            weapons: [{ name: "", quantity: null }],
            "equipment - general": [{ name: "", quantity: null }],
            "equipment - provisions": [{ name: "", quantity: null }],
            "equipment - religious": [{ name: "", quantity: null }],
        };
    }

}
