import { HYP3E } from "../helpers/config.mjs"
import { Hyp3eLogger } from "../helpers/logger.mjs";
import {onManageActiveEffectV2, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import HYP3EItemSetAnnotations from "../apps/item-set-annotations.mjs";
import HYP3EItemSetDmgTypes from "../apps/item-set-dmg-types.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api
const { ItemSheetV2 } = foundry.applications.sheets

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheetV2}
 */
export class Hyp3eItemSheetV2 extends HandlebarsApplicationMixin(ItemSheetV2) {

    static ITEM_ANNOTATIONS_APP = new HYP3EItemSetAnnotations();
    static ITEM_SET_DMG_TYPES_APP = new HYP3EItemSetDmgTypes();

    // ===========================================================================
    // ITEM SHEET SETUP
    // ===========================================================================

    get title() {
        const typeLabel = game.i18n.localize(`TYPES.item.${this.item.type}`);
        return `${typeLabel}: ${this.item.name}`;
    }

    static DEFAULT_OPTIONS = {
        classes: ["hyp3e", "item"],
        position: {
            width: 600,
            height: 550,
        },
        form: {
            submitOnChange: true
        },
        window: {
            icon: "fas fa-book",
            resizable: true,
        },
        actions: {
            // This is where we will define the sheet's clickable actions
            editImage: Hyp3eItemSheetV2._onEditImage,
            toggleIdentified: Hyp3eItemSheetV2._toggleIdentified,
            toggleWeaponType: Hyp3eItemSheetV2._toggleWeaponType,
            toggleWeaponHands: Hyp3eItemSheetV2._toggleWeaponHands,
            handleWeaponMastery: Hyp3eItemSheetV2._handleWeaponMastery,
            openItemSheet: Hyp3eItemSheetV2._openItemSheet,
            deleteSpell: Hyp3eItemSheetV2._handleSpellDelete,
            setGrenadeOrAreaEffect: Hyp3eItemSheetV2._onSetGrenadeOrAreaEffect,
            setDmgTypes: Hyp3eItemSheetV2._openDmgTypesApp,
            setAnnotations: Hyp3eItemSheetV2._openAnnotationsApp,
            dropItemDescription: Hyp3eItemSheetV2._toggleItemSummary,
            createEffect: Hyp3eItemSheetV2._onManageActiveEffect,
            editEffect: Hyp3eItemSheetV2._onManageActiveEffect,
            deleteEffect: Hyp3eItemSheetV2._onManageActiveEffect,
            toggleEffect: Hyp3eItemSheetV2._onManageActiveEffect,
        },
    }

    static TABS = {
        primary: {
            tabs: [
                { id: 'details'  },
                { id: 'attributes'  },
                { id: 'effects' }
            ],
            labelPrefix: 'HYP3E.tabs',
            initial: 'details'
        }
    }

    static PARTS = {
        header: {
            template: `${HYP3E.templatePath}/item/item-header-sheet-v2.hbs`,
        },
        tabs: {
            // Foundry-provided generic template
            template: 'templates/generic/tab-navigation.hbs',
        },
        details: {
            template: `${HYP3E.templatePath}/item/parts/tab-item-details.hbs`,
            scrollable: ["", ".main-content", ".tab-content"],
        },
        attributes: {
            template: `${HYP3E.templatePath}/item/parts/tab-item-attributes.hbs`,
            scrollable: ["", ".main-content"],
        },
        spells: {
            template: `${HYP3E.templatePath}/item/parts/tab-item-spells.hbs`,
            scrollable: ["", ".main-content"],
        },
        effects: {
            template: `${HYP3E.templatePath}/item/parts/tab-item-effects.hbs`,
            scrollable: ["", ".main-content"],
        },
    }

    // ===========================================================================
    // OVERRIDES
    // ===========================================================================

    /** @override */
    get document() {
        return this.options.document  // Document comes from options
    }

    /** @override */
    async _prepareContext(options) {
        // Retrieve base data structure.
        const context = await super._prepareContext(options);
        context.item = this.item
        context.isGM = game.user.isGM
        Hyp3eLogger.info("_prepareContext", `Preparing Item Sheet for type "${this.item.type}"...`, { item: this.item, options })

        // Retrieve the actor's roll data for TinyMCE editors.
        context.rollData = this.item.actor?.getRollData() ?? {};
        Hyp3eLogger.info("_prepareContext", `Roll Data in ItemSheet:`, context.rollData);

        // Prepare item-spell list
        const spellRefs = this.item.system?.spellcasting?.spellRefs ?? [];
        context.spells = (await Promise.all(spellRefs.map(async (ref, i) => ({
            spell: await fromUuid(ref.uuid),
            charges: ref.charges,
            uuid: ref.uuid,
            index: i
        })))).filter(Boolean);

        // Prepare active effects
        context.effects = prepareActiveEffectCategories(this.item.effects);
        // Add the item's system data and flags to context root for easier access
        context.system = this.item.system;
        context.flags = this.item.flags;

        // Prepare tab and part data
        context.tabs = this._prepareTabs("primary");

        // Log item-sheet context data
        Hyp3eLogger.info("_prepareContext", `Item-Sheet Context Data:`, context);
        // Prepare item data & return context
        this._prepareItemData(context);
        return context;
    }

    /**
     * @override
     * Organize and classify data for Item sheets.
     * @param {Object} context - The item to prepare.
     * @return {undefined} - Returns nothing. Modifies context in place.
     */
    _prepareItemData(context) {
        // All item sheets get the same basic data
        context.weaponTypes = CONFIG.HYP3E.weaponTypes;
        context.armorTypes = CONFIG.HYP3E.armorTypes;
        context.shieldTypes = CONFIG.HYP3E.shieldTypes;
        context.weaponAnnotations = CONFIG.HYP3E.weaponAnnotations;
        context.damageTypes = CONFIG.HYP3E.damageTypes;
        context.blindRollOpts = CONFIG.HYP3E.blindRollOpts;
        context.rollModes = CONFIG.Dice.rollModes;
        context.saveThrows = CONFIG.HYP3E.saves;

        // This is mostly an issue with new compendium items
        if (context.item.system.realName?.trim() === "") {
            context.item.system.realName = context.item.name
        }

        // Add isPhysical flag for armor, item, shield, weapon
        context.item.system.isPhysical = ["armor", "item", "shield", "weapon"].includes(context.item.type);

        // Set isShield flag for armor items
        if (context.item.type === 'armor') {
            context.item.system.isShield = context.item.system.type === "shield" ? true : false
        }
        if (context.item.type === 'shield') {
            context.item.system.isShield = true
        }

        // Refresh the annotations list for weapons
        if (context.item.type === 'weapon') {
            context.annotList = []
            try {
                if (Array.isArray(context.item.system?.annotations) && context.item.system?.annotations.length > 0) {
                    context.item.system.annotations.forEach(annot => {
                        context.annotList.push(context.weaponAnnotations[annot])
                    })
                }
            } catch (err) {
                Hyp3eLogger.error("_prepareItemData", `Error loading weapon annotations:`, err)
            }
        }
    }

    /** @override */
    async _preparePartContext(partId, context) {
        if (partId === "header" || partId === "tabs") {
            // Header and tabs parts do not need special tab handling
            return context;
        }
        if (!context.tabs || !context.tabs[partId]) {
            Hyp3eLogger.info("_preparePartContext", `No tab data found for part "${partId}".`);
            return context;
        }
        // Process tabs
        Hyp3eLogger.info("_preparePartContext", `Preparing tab part "${partId}"...`, context);
        if (context.tabs[partId].active) {
            context.tab = context.tabs[partId];
        }

        // Enrich text editor fields as needed
        switch (partId) {
            case 'details':
                // Enrich content for display
                context.realDescriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
                    this.document.system.realDescription,
                    {
                        secrets: this.document.isOwner,
                        relativeTo: this.document
                    }
                )
                context.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
                    this.document.system.description,
                    {
                        secrets: this.document.isOwner,
                        relativeTo: this.document
                    }
                )
                break;
            case 'attributes':
                break;
            case 'spells':
                break;
            case 'effects':
                break;
            default:
        }
        return context;
    }

    /** @override */
    _getTabsConfig(group) {
        const tabs = foundry.utils.deepClone(super._getTabsConfig(group))

        // Insert Spells tab if item has spellcasting ability
        if (this.document.system?.spellcasting?.hasSpells) {
            // tabs.tabs.push({ id: 'spells', group: 'primary' })
            tabs.tabs.splice(tabs.tabs.length - 1, 0, { id: 'spells', group: 'primary' });
        }
        return tabs
    }

    /** @override */
    async _onRender(context, options) {
        await super._onRender(context, options);

        // If the sheet is not editable, exit early
        if (!this.isEditable) return;

        // Enable drag & drop functionality
        new CONFIG.ux.DragDrop({
            dragSelector: ":is([data-effect-id], [data-spell-id])",
            dropSelector: null,
            callbacks: {
                dragstart: this._onDragStart.bind(this),
                dragover: this._onDragOver.bind(this),
                drop: this._onDrop.bind(this)
            }
        }).bind(this.element);

        // Log render completion
        Hyp3eLogger.info("_onRender", `Item Sheet rendered and listeners activated.`, { context, options, sheet: this });
    }

    /** @override */
    _processFormData(event, form, formData) {
        // This is where we can manipulate the formData before it's applied to the item
        Hyp3eLogger.info("_processFormData", `Processing form data...`, { event, form, formData });
        Hyp3eLogger.info("_processFormData", `this item:`, this.item);

        // Only applies to weapons, armor, and physical items
        if (!["weapon", "armor", "item"].includes(this.item.type)) {
            // If the item is not a weapon, armor, or physical item, we don't need to do any processing
            return super._processFormData(event, form, formData);
        }

        const formDataObj = formData.object;
        const isIdentified = foundry.utils.getProperty(formDataObj, "system.identified") || this.item.system.identified;
        Hyp3eLogger.info("_processFormData", `Is item identified?`, isIdentified);

        // Apply name and description based on identification state.
        if (isIdentified) {
            const realName = foundry.utils.getProperty(formDataObj, "system.realName") || this.item.system.realName;
            const realDesc = foundry.utils.getProperty(formDataObj, "system.realDescription") || this.item.system.realDescription;

            formDataObj["name"] = realName;
            formDataObj["system.description"] = realDesc;
        } else {
            let aliasName = foundry.utils.getProperty(formDataObj, "system.itemAlias") || this.item.system.itemAlias;
            const aliasDesc = foundry.utils.getProperty(formDataObj, "system.aliasDescription") || this.item.system.aliasDescription;

            // Ensure aliasName is not empty or just whitespace
            if (!aliasName || aliasName.trim() === "") {
                aliasName = "Unidentified Item";
                formDataObj["system.itemAlias"] = aliasName;
            }

            formDataObj["name"] = aliasName?.trim();
            formDataObj["system.description"] = aliasDesc;
        }

        // Item-spell references must be converted from a keyed object to an array
        const data = foundry.utils.expandObject(formData.object);
        const refs = foundry.utils.getProperty(data, "system.spellcasting.spellRefs");
        if (refs && !Array.isArray(refs)) {
            data.system.spellcasting.spellRefs = Object.values(refs);
        }
        Hyp3eLogger.info("_processFormData", `Updated form data:`, data);
        foundry.utils.mergeObject(formData.object, data, {performDeletions: true});
        Hyp3eLogger.info("_processFormData", `Merged form data:`, formData);

        return super._processFormData(event, form, formData);
    }

    _prepareSubmitData(event, form, formData, updateData) {
        Hyp3eLogger.info("_prepareSubmitData", `Preparing submitted data...`, { formData, updateData });
        return super._prepareSubmitData(event, form, formData, updateData);
    }

    // ===========================================================================
    // EVENT HANDLERS
    // ===========================================================================

    /**
     * Allow the user to select an item image from the FilePicker
     * @param {*} event 
     * @param {*} target 
     */
    static async _onEditImage(event, target) {
        const field = target.dataset.field || "img"
        const current = foundry.utils.getProperty(this.document, field)

        const fp = new foundry.applications.apps.FilePicker({
            type: "image",
            current: current,
            callback: (path) => this.document.update({ [field]: path })
        })

        fp.render(true)
    }

    /**
     * Toggle item identified state
     * @param {*} event 
     * @param {*} target 
     */
    static async _toggleIdentified(event, target) {
        Hyp3eLogger.info("_toggleIdentified", `Toggling item identified state...`, { event, target });
        const identified = target.checked;
        await this.item.toggleIdentified(identified);
    }

    /**
     * Toggle weapon type (melee/missile)
     * @param {*} event 
     * @param {*} target 
     */
    static async _toggleWeaponType(event, target) {
        Hyp3eLogger.info("_toggleWeaponType", `Toggling weapon type...`, { event, target });
        const attackType = target.dataset["attackType"];
        await this.item.updateWeaponType(attackType);
        await this.item.applyAttackFormula();
    }

    /**
     * Toggle number of hands required to wield weapon (1/2)
     * @param {*} event 
     * @param {*} target 
     */
    static async _toggleWeaponHands(event, target) {
        Hyp3eLogger.info("_toggleWeaponHands", `Toggling weapon hands...`, { event, target });
        const hands = target.dataset["hands"];
        await this.item.updateWeaponHands(hands);
    }

    /**
     * Handle weapon mastery and grand-mastery toggles
     * @param {*} event 
     * @param {*} target 
     */
    static async _handleWeaponMastery(event, target) {
        Hyp3eLogger.info("_handleWeaponMastery", `Updating weapon mastery...`, { event, target });
        const mastery = target.dataset["mastery"];
        await this.item.updateWeaponMastery(mastery);
    }

    /**
     * Handle checkbox changes related to isGrenade and isAreaEffect
     * @param {*} event 
     * @param {*} target 
     * @private
     */
    static async _onSetGrenadeOrAreaEffect(event, target) {
        Hyp3eLogger.info("_onSetGrenadeOrAreaEffect", `Handling grenade/area-effect checkbox change...`, { event, target });
        // The trick is that we need to get the current state of both checkboxes, not just the one that was clicked
        const html = $(event.currentTarget).closest("form");
        const isGrenade = html.find('input[name="system.isGrenade"]').prop("checked");
        const isAreaEffect = html.find('input[name="system.isAreaEffect"]').prop("checked");
        Hyp3eLogger.info("_onSetGrenadeOrAreaEffect", `isGrenade: ${isGrenade}, isAreaEffect: ${isAreaEffect}`);

        // Update the item with both values
        await this.item.updateGrenadeOrAreaEffect(isGrenade, isAreaEffect);
        // Apply attack formula logic
        await this.item.applyAttackFormula();
    }

    // Open the Annotations app
    static _openAnnotationsApp() {
        Hyp3eItemSheetV2.ITEM_ANNOTATIONS_APP.render(true, { itemUuid: this.item.uuid, focus: true })
    }

    // Open the Damage Types app
    static _openDmgTypesApp() {
        Hyp3eItemSheetV2.ITEM_SET_DMG_TYPES_APP.render(true, { itemUuid: this.item.uuid, focus: true })
    }

    /**
     * Active Effect management handler
     * @param {*} event 
     * @param {*} target 
     */
    static async _onManageActiveEffect(event, target) {
        event.preventDefault();
        event.stopPropagation();
        const action = target.dataset["action"];
        // Log the action and then handle it
        Hyp3eLogger.info("_onManageActiveEffect", `Managing active effect...`, { event, target, action });
        await onManageActiveEffectV2(target, this.item);

        // Re-render the sheet to reflect changes
        this.render();
    }

    // Spell delete handler
    static async _handleSpellDelete(event, target) {
        const uuid = target.dataset["spellId"]
        await this.item.removeSpell(uuid);
        this.render();
    }

    /**
     * Handle toggling an Item description in the character sheet.
     * @param {Event} event   The originating click event
     * @private
     */
    static _toggleItemSummary(event, target) {
        event.preventDefault()
        Hyp3eLogger.info("_toggleItemSummary", `Toggling item summary...`, { event, target });
        const summary = target.closest(".item-entry.item").querySelector(".item-summary");
        summary.style.display = summary.style.display === "block" ? "" : "block";
    }

    /**
     * Handle opening an embedded spell's item sheet.
     * @param {Event} event   The originating click event
     * @private
     */
    static async _openItemSheet(event, target) {
        Hyp3eLogger.info("_openItemSheet", `Opening spell sheet...`, { event, target });
        const item = await fromUuid(target.dataset["spellId"]);
        if (item?.sheet) item.sheet.render(true);
    }

    /**
     * Helper for drag & drop events, to get the element dataset
     * @param {*} element 
     * @param {*} attribute 
     * @returns 
     */
    static findDataset(element, attribute) {
        while (element && !(attribute in element.dataset)) {
            element = element.parentElement
        }
        return element?.dataset[attribute] || null
    }

    // ===========================================================================
    // DRAG AND DROP HANDLERS
    // ===========================================================================

    async _onDragStart(event) {
        event.stopPropagation();
        Hyp3eLogger.info("_onDragStart", `Drag start event:`, event);
        const index = Hyp3eItemSheetV2.findDataset(event.target, "index");
        const dragData = {
            type: "Item",
            uuid: event.target.dataset["spellId"] ?? event.target.dataset["effectId"] ?? null,
            index: index,
            data: {
                uuid: this.item.uuid,
                type: this.item.type
            }
        };
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        Hyp3eLogger.info("_onDragStart", `Started dragging item...`, { event, dragData });
    }

    _onDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        // Optionally, we could add visual feedback for valid drop targets
    }

    async _onDrop(event) {
        event.preventDefault();
        event.stopPropagation();

        // Prevent multiple handling of the same event
        if (event._dropHandled) return;
        event._dropHandled = true;

        // Read dropped data
        const dataTransfer = event.dataTransfer?.getData("text/plain");
        if (!dataTransfer) return;

        let dropData;
        try {
            dropData = JSON.parse(dataTransfer);
            Hyp3eLogger.info("_onDrop", `Dropped data:`, dropData);
        } catch {
            return;
        }

        // Verify it's an Item drop
        if (dropData.type !== "Item") return;

        // Lookup the dropped item
        const uuid = dropData.uuid ?? dropData.data?.uuid;
        let droppedItem = null;
        droppedItem = await fromUuid(uuid);
        if (!droppedItem) {
            // This shouldn't happen, but just in case
            Hyp3eLogger.warn("_onDrop", `Could not retrieve dropped item with UUID: ${uuid}. Trying effects...`);
            droppedItem = this.item.effects.get(uuid);
        }
        Hyp3eLogger.info("_onDrop", `Dropped item:`, droppedItem);
        if (!droppedItem) return;

        // If a spell was dropped, either re-sort the list or add the spell to this item
        if (droppedItem.type === "spell") {
            // Update spell sort order if the drop was an existing spell (has a valid fromIndex)
            const fromIndex = Number(dropData.index);
            const toElement = event.target.closest(".spell-entry");
            const toIndex = Number(toElement?.dataset.index);
            if (Number.isInteger(fromIndex) && Number.isInteger(toIndex) && fromIndex !== toIndex) {
                Hyp3eLogger.info("_onDrop", `Handling spell re-ordering...`, { fromIndex, toElement });
                await this.item.reorderSpell(fromIndex, toIndex);
                this.render();
            }
            if (Number.isInteger(fromIndex) && fromIndex >= 0) return;

            // If there is no fromIndex, this is a new drop, so we add the spell to the item
            const spellRefs = foundry.utils.deepClone(this.item.system.spellcasting?.spellRefs ?? []);
            if (spellRefs.some(ref => ref.uuid === uuid)) {
                // Prevent duplicate inserts
                const msg = `Spell ${droppedItem.name} is already linked to this item.`;
                ui.notifications.warn(msg);
                Hyp3eLogger.warn("_onDrop", msg);
                return;
            }
            await this.item.addSpell(droppedItem);
        }

        // NOTE: Effects cannot be reordered via drag & drop at this time

        // If an effectTemplate was dropped, add the effect to the item
        if (droppedItem.type === "effectTemplate") {
            const droppedEffectNames = droppedItem.effects.map(e => e.name);
            const existing = this.item.effects.find(e => droppedEffectNames.includes(e.name));
            if (existing) { 
                // Prevent duplicate inserts
                const msg = `Effect ${existing.name} is already linked to this item.`;
                ui.notifications.warn(msg);
                Hyp3eLogger.warn("_onDrop", msg);
                return; 
            }

            // Copy the effectTemplate's ActiveEffects to this item
            const effects = droppedItem.effects.contents.map(e => {
                let effectData = e.toObject();
                effectData.origin = this.item.uuid;
                effectData.sourceName = this.item.system?.friendlyName ? this.item.system.friendlyName : this.item.name;
                return effectData;
            });

            if (!effects.length) {
                const msg = `No ActiveEffects found on template: ${droppedItem.name}`;
                Hyp3eLogger.warn("_onDrop", msg);
                ui.notifications.warn(msg);
                return;
            }

            // Duplicate template effects onto this item
            await this.item.createEmbeddedDocuments("ActiveEffect", effects);

            const msg = `Applied ${effects.length} effect(s) from template "${droppedItem.name}" to ${this.item.name}.`;
            Hyp3eLogger.info("_onDrop", msg);
            ui.notifications.info(msg);
        }

        // Re-render the sheet
        this.render();
    }

}
