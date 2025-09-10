import { Hyp3eLogger } from "../helpers/logger.mjs";
import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import HYP3EItemSetAnnotations from "../apps/item-set-annotations.mjs";
import HYP3EItemSetDmgTypes from "../apps/item-set-dmg-types.mjs";

// Note: this must be declared outside the class to avoid re-initialization on each instance creation
const _recentSpellDrops = new Set();

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class Hyp3eItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["hyp3e", "sheet", "item"],
            width: 540,
            height: 500,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    static ITEM_ANNOTATIONS_APP = new HYP3EItemSetAnnotations();
    static ITEM_SET_DMG_TYPES_APP = new HYP3EItemSetDmgTypes();

    /** @override */
    get template() {
        return `${CONFIG.HYP3E.templatePath}/item/item-${this.item.type}-sheet.hbs`;
    }

    /* -------------------------------------------- */

    /** @override */
    async getData() {
        // Retrieve base data structure.
        const context = super.getData();
        context.isGM = game.user.isGM

        // Retrieve the actor's roll data for TinyMCE editors.
        context.rollData = {};
        const actor = this.actor;
        context.rollData = this.actor?.getRollData();
        Hyp3eLogger.info("getData" `Roll Data in ItemSheet:`, context.rollData);

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
        // Add the item's data to context.data for easier access, as well as flags.
        context.system = context.item.system;
        context.flags = context.item.flags;

        // Log item context data
        Hyp3eLogger.info("getData" `Item Context Data:`, context);

        // Enrich the description field for TinyMCE editors
        context.enrichedDescription = await TextEditor.enrichHTML(
            context.system.description,
            { 
                rollData: context.rollData, 
                async: true 
            }
        );
        context.enrichedRealDescription = await TextEditor.enrichHTML(
            context.system.realDescription,
            { 
                rollData: context.rollData, 
                async: true 
            }
        );

        // Prepare item data & return context
        this._prepareItemData(context);
        return context;
    }

    /**
     * Organize and classify data for Item sheets.
     * @param {Object} context The item to prepare.
     * @return {undefined}
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

        // Set isShield flag for armor items
        if (context.item.type === 'armor') {
            context.system.isShield = context.system.type === "shield" ? true : false
        }
        if (context.item.type === 'shield') {
            context.system.isShield = true
        }

        // Refresh the annotations list for weapons
        if (context.item.type === 'weapon') {
            context.annotList = []
            try {
                context.system.annotations.forEach(annot => {
                    context.annotList.push(context.weaponAnnotations[annot])
                })
            } catch (err) {
                Hyp3eLogger.error("_prepareItemData" `Error loading weapon annotations:`, err)
            }
        }
    }

    async _updateObject(event, formData) {
        // Only applies to weapons, armor, and physical items.
        if (!["weapon", "armor", "item"].includes(this.object.type)) {
            // If the item is not a weapon, armor, or physical item, we don't need to update the name and description.
            return super._updateObject(event, formData);
        }

        const isIdentified = foundry.utils.getProperty(formData, "system.identified") || this.object.system.identified;
        Hyp3eLogger.info("_updateObject" `Is item identified?`, isIdentified);

        // Apply name and description based on identification state.
        if (isIdentified) {
            const realName = foundry.utils.getProperty(formData, "system.realName") || this.object.system.realName;
            const realDesc = foundry.utils.getProperty(formData, "system.realDescription") || this.object.system.realDescription;

            formData["name"] = realName;
            formData["system.description"] = realDesc;
        } else {
            let aliasName = foundry.utils.getProperty(formData, "system.itemAlias") || this.object.system.itemAlias;
            const aliasDesc = foundry.utils.getProperty(formData, "system.aliasDescription") || this.object.system.aliasDescription;

            // Ensure aliasName is not empty or just whitespace
            if (!aliasName || aliasName.trim() === "") {
                aliasName = "Unidentified Item";
                formData["system.itemAlias"] = aliasName;
            }

            formData["name"] = aliasName?.trim();
            formData["system.description"] = aliasDesc;
        }

        // Spell references must be converted from a keyed object to an array.
        //  Need to expand the formData first.
        const data = expandObject(formData);
        const refs = getProperty(data, "system.spellcasting.spellRefs");
        if (refs && !Array.isArray(refs)) {
            data.system.spellcasting.spellRefs = Object.values(refs);
        }

        Hyp3eLogger.info("_updateObject" `Updated item data:`, data);
        return super._updateObject(event, data);
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // If the sheet is not editable, do nothing.
        if (!this.isEditable) return;

        // Everything below here is only needed if the sheet is editable
        // Roll handlers, click handlers, etc. would go here.

        // Enable drop functionality on item sheets
        this.element[0].addEventListener("drop", this._onDrop.bind(this));

        // Rollable elements
        html.find('.rollable').click(this._onRoll.bind(this));

        // Handle displaying item description in the chat log
        html.find('.item-show').click(event => this._openItemSheet(event));

        // Toggle spell description as pop-down text
        html.find(".item-drop").click(event => this._toggleItemSummary(event));

        // Toggle weapon melee/missile attack type
        html.find('.weapon-type').click(event => this._handleWeaponType(event));

        // Toggle weapon one-handed/two-handed
        html.find('.weapon-hands').click(event => this._handleWeaponHands(event));

        // Toggle weapon mastery & grand-mastery true/false
        html.find('.weapon-mastery').click(event => this._handleWeaponMastery(event));

        // Handle isGrenade and isAreaEffect checkboxes
        html.find('input[name="system.isGrenade"]').on("change", this._onTypeRelatedChange.bind(this));
        html.find('input[name="system.isAreaEffect"]').on("change", this._onTypeRelatedChange.bind(this));

        // Set weapon base & alternate damage types
        html.find('.item-button[data-control="set-dmg-types"]').click((ev) => {
            Hyp3eItemSheet.ITEM_SET_DMG_TYPES_APP.render(true, { itemUuid: this.item.uuid, focus: true });
        });

        // Set item annotations
        html.find('.item-button[data-control="set-annotations"]').click((ev) => {
            Hyp3eItemSheet.ITEM_ANNOTATIONS_APP.render(true, { itemUuid: this.item.uuid, focus: true });
        });

        // Handle item name/realName changes, only if the item IS identified
        html.find('.item-name').change(async (event) => {
            const name = event.target.value.trim();
            if (this.item.system.identified) {
                if (name !== this.item.name) {
                    await this.item.update({ name: name });
                }
            }
        });
        // Handle item name/itemAlias changes, only if the item IS NOT identified
        html.find('.item-alias').change(async (event) => {
            const alias = event.target.value.trim();
            if (!this.item.system.identified) {
                if (alias !== this.item.name) {
                    await this.item.update({ name: alias });
                }
            }
        });

        // Toggle item status identified / not identified
        html.find(".identified").click(async (event) => {
            const identified = event.target.checked
            await this.item.toggleIdentified(identified)
        });

        // Handle item spell functionality
        html.find(".item-spells .spell-entry").on("dragstart", this._handleSpellDrag.bind(this));
        html.find(".item-spells").on("dragover", ev => ev.preventDefault());
        html.find(".item-spells").on("drop", this._handleSpellDrop.bind(this));
        html.find(".item-delete-spell").click(this._handleSpellDelete.bind(this));

        // Active Effect management
        html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.item));

    }

    async _handleWeaponType(event) {
        const attackType = $(event.currentTarget).data("attackType");
        await this.item.updateWeaponType(attackType);
        await this.item.applyAttackFormula();
    }

    async _handleWeaponHands(event) {
        const hands = $(event.currentTarget).data("hands");
        await this.item.updateWeaponHands(hands);
    }

    async _handleWeaponMastery(event) {
        const mastery = $(event.currentTarget).data("mastery");
        await this.item.updateWeaponMastery(mastery);
    }

    _handleSpellDrag(ev) {
        ev.originalEvent.dataTransfer.setData("text/plain", ev.currentTarget.dataset.index);
    }

    async _handleSpellDrop(ev) {
        const fromIndex = Number(ev.originalEvent.dataTransfer.getData("text/plain"));
        const toElement = ev.target.closest(".spell-entry");
        if (!toElement) return;

        const toIndex = Number(toElement.dataset.index);
        if (isNaN(fromIndex) || isNaN(toIndex) || fromIndex === toIndex) return;

        await this.item.reorderSpell(fromIndex, toIndex);
        this.render();
    }

    async _handleSpellDelete(ev) {
        const uuid = $(ev.currentTarget).closest("[data-spell-id]").data("spellId");
        await this.item.removeSpell(uuid);
        this.render();
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    async _onRoll(event) {
        // Currently, no item sheets support clickable rolls, so this is a no-op.
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const formula = element.dataset.formula;
        const flavor = element.dataset.tooltip;
    
        // Log the element
        Hyp3eLogger.info("_onRoll" `Clicked element:`, element)

        // Perform the roll
        const roll = new Roll(formula);
        roll.toMessage({
            flavor: flavor,
            speaker: ChatMessage.getSpeaker({ actor: this.item.actor })
        });
    }

    /**
     * Handle all document drop events
     * @param {*} event - The drop event
     * @returns null
     */
    async _onDrop(event) {
        event.preventDefault();
        event.stopPropagation();

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

        // Check if it's an Item
        if (dropData.type !== "Item") return;
        const uuid = dropData.uuid ?? dropData.data?.uuid;
        const droppedItem = await fromUuid(uuid);
        if (!droppedItem) return;

        // If a spell was dropped, add the spell to the item
        if (droppedItem.type === "spell") {
            // Prevent duplicate inserts
            const spellRefs = foundry.utils.deepClone(this.item.system.spellcasting?.spellRefs ?? []);
            if (spellRefs.some(ref => ref.uuid === uuid)) {
                ui.notifications.info(`Spell ${droppedItem.name} is already linked to this item.`);
                return;
            }
            await this.item.addSpell(droppedItem);
        }

        // If an effectTemplate was dropped, add the effect to the item
        if (droppedItem.type === "effectTemplate") {
            // Prevent duplicate inserts
            const droppedEffectNames = droppedItem.effects.map(e => e.name);
            const existing = this.item.effects.find(e => droppedEffectNames.includes(e.name));
            if (existing) { 
                ui.notifications.info(`Effect ${existing.name} is already linked to this item.`);
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

    /**
     * Handle toggling an Item description in the character sheet.
     * @param {Event} event   The originating click event
     * @private
     */
    _toggleItemSummary(event) {
        // event.preventDefault()
        const summary = event.currentTarget.closest(".item-entry.item").querySelector(".item-summary");
        summary.style.display = summary.style.display === "block" ? "" : "block";
    }

    /**
     * Handle displaying an Item description in the chat.
     * @param {Event} event   The originating click event
     * @private
     */
    async _openItemSheet(event) {
        const item = await fromUuid($(event.currentTarget).closest(".item-entry").data("spellId"));
        if (item?.sheet) item.sheet.render(true);
    }

    /**
     * Handle checkbox changes related to attack type (e.g., isGrenade, isAreaEffect)
     * @param {*} event 
     * @private
     */
    async _onTypeRelatedChange(event) {
        event.preventDefault();

        const formData = this._getSubmitData();
        // Merge or update item data as needed
        await this.item.update(formData);

        // Apply attack formula logic
        await this.item.applyAttackFormula();

        // Optionally re-render to show changes live
        this.render(true);
    }

}
