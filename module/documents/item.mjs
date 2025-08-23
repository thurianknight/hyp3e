import {Hyp3eDice} from "../helpers/dice.mjs";
import { HYP3E } from "../helpers/config.mjs"

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class Hyp3eItem extends Item {
    /**
     * Augment the basic Item data model with additional dynamic data.
     */

    // Override the base Item _preCreate function
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);
        const updateData = {};

        // Replace default image for new items, but if an image is defined, leave it be
        const TYPE_IMAGES = {
            armor: "icons/svg/shield.svg",
            effectTemplate: "icons/svg/aura.svg",
            feature: "icons/svg/target.svg",
            item: "icons/svg/item-bag.svg",
            spell: "icons/svg/book.svg",
            weapon: "icons/svg/combat.svg",
            container: "icons/svg/item-bag.svg"
        };
        if (!data.img || data.img === "") {
            updateData.img = TYPE_IMAGES[this.type] || "icons/svg/item-bag.svg";
        }

        // A newly-created item won't have the system attribute yet, but cloned items will
        if (data.system?.containerId) {
            updateData["system.containerId"] = "";
            updateData["system.location"] = "";
        }
        if (CONFIG.HYP3E.debugMessages) { console.log("Hyp3eItem _preCreate: updateData", updateData) }
        this.updateSource(updateData);
    }

    /** @override */
    prepareData() {
        // As with the actor class, items are documents that can have their data
        // preparation methods overridden (such as prepareBaseData()).
        super.prepareData();

        // Skip processing if this item is in a compendium
        if (this.pack) return;

        // Get the Item's data
        const itemData = this.system;

        // Setup the item's realName to be its name, if realName is blank
        if (!itemData.realName?.trim()) itemData.realName = this.name;
        // If the item is identified but has no realDescription, set it to the description
        if (itemData.identified && !itemData.realDescription?.trim()) {
            itemData.realDescription = itemData.description;
        }

        // Fix weapon & spell missing or invalid damage type
        if (["weapon", "spell"].includes(this.type)) {
            if (!CONFIG.HYP3E.damageTypes[itemData.dmgType]) {
                console.log(`ITEM ERROR: Invalid damage type on ${this.name}. Setting to Basic...`)
                itemData.dmgType = "basic"
            }
        }

        // Apply attack formula logic if weapon or atkRoll
        if ((this.type === "weapon" || itemData.atkRoll) && !itemData.formula?.trim()) {
            this.applyAttackFormula();
        }

        // Ammo usage flag
        if (this.type === "weapon" && itemData.type === "missile" && (itemData.usesAmmo === false || typeof itemData.usesAmmo === "undefined")) {
            if (/(bow|sling|gun)/i.test(this.name)) {
                itemData.usesAmmo = true;
            }
        }

        // isLightSource flag (physical items & spells)
        if (["armor", "item", "weapon", "spell"].includes(this.type)) {
            if (itemData.isLightSource === undefined || itemData.isLightSource === null) {
                // Match item name to a light source in the lookup table
                const lightSourceProps = this._getLightSourceProperties();
                if (lightSourceProps) {
                    itemData.isLightSource = true;
                    itemData.light.dim = lightSourceProps.radius;
                    itemData.light.bright = Math.floor(lightSourceProps.radius/2);
                    itemData.light.angle = lightSourceProps.angle;
                } else {
                    itemData.isLightSource = false;
                }
            }
        }
    }

    /**
     * Prepare a data object which is passed to any Roll formulas which are created related to this Item
     * @private
     */
    getRollData() {
        // If present, return the actor's roll data.
        if ( !this.actor ) return null
    
        const rollData = this.actor.getRollData();
        // Grab the item's system data as well.
        rollData.item = foundry.utils.deepClone(this.system);

        return rollData;
    }

    /**
     * Toggle the identified state of the item.
     * If identified, set item.name to system.realName and item.system.description to item.system.realDescription.
     * If not identified, set item.name to system.itemAlias and item.system.description to item.system.aliasDescription.
     * @param {Boolean} identified - Whether the item is identified or not.
     * @public
     */
    async toggleIdentified(identified) {
        const item = this
        if (identified) {
            // If identified, set item.name to system.realName and item.system.description to item.system.realDescription
            const name = this.system?.realName > "" ? this.system.realName : this.name
            const updates = { name: name, "system.description": this.system.realDescription }
            await this.update(updates)
        } else {
            // If not identified, set item.name to system.itemAlias and item.system.description to item.system.aliasDescription
            const name = this.system?.itemAlias > "" ? this.system.itemAlias : this.name
            const updates = { name: name, "system.description": this.system.aliasDescription }
            await this.update(updates)
        }
    }

    /**
     * Update the weapon type based on the attackType.
     * This method sets the appropriate flags and type for the item based on whether it is a melee or missile weapon.
     * @param {String} attackType - The type of attack, either "melee" or "missile".
     * @public
     */
    async updateWeaponType(attackType) {
        const updates = {};
        switch (attackType) {
            case "melee":
                updates["system.melee"] = true;
                updates["system.missile"] = false;
                updates["system.isGrenade"] = false;
                updates["system.isAreaEffect"] = false;
                updates["system.type"] = "melee";
                break;
            case "missile":
                updates["system.melee"] = false;
                updates["system.missile"] = true;
                updates["system.type"] = "missile";
                break;
        }
        await this.update(updates);
    }

    /**
     * Apply the attack formula based on the item type and properties.
     * This method sets the formula for attack rolls based on whether the item is a weapon,
     * grenade, area effect, or other item type.
     * @public
     */
    async applyAttackFormula() {
        const itemData = this.system;

        let updateData = {};

        // If this is not a weapon, but has an atkRoll, set the formula to 1d20 + @fa
        if (this.type !== "weapon") {
            if (itemData.atkRoll && !itemData.formula?.trim()) {
                itemData.formula = "1d20 + @fa";
            }
            return;
        }

        // Area effects and grenades override all variables
        if (itemData.isAreaEffect) {
            updateData = {
                melee: false,
                missile: true,
                isGrenade: false,
                formula: "",
                type: "missile"
            }
            return await this.update({ system: updateData });
        }
        if (itemData.isGrenade) {
            updateData = {
                melee: false,
                missile: true,
                isAreaEffect: false,
                formula: "1d20 + @dex.atkMod",
                type: "missile"
            }
            return await this.update({ system: updateData });
        }

        // If this is a weapon, set the attack formula based on type
        if (itemData.type === "melee") {
            updateData = {
                melee: true,
                missile: false,
                isGrenade: false,
                isAreaEffect: false,
                formula: "1d20 + @str.atkMod", //formula: itemData.formula || "1d20 + @str.atkMod",
                type: "melee"
            }
            return await this.update({ system: updateData });
        }
        if (itemData.type === "missile") {
            updateData = {
                melee: false,
                missile: true,
                formula: "1d20 + @dex.atkMod", //formula: itemData.formula || "1d20 + @dex.atkMod",
                type: "missile"
            }
            return await this.update({ system: updateData });
        }
        // Default if invalid weapon type
        console.warn(`ITEM ERROR: Weapon ${this.name} has invalid type. Defaulting to melee.`);
        updateData = {
            melee: true,
            missile: false,
            isGrenade: false,
            isAreaEffect: false,
            formula: "1d20 + @str.atkMod",
            type: "melee"
        }
        return await this.update({ system: updateData });
    }

    /**
     * Toggle weapon mastery and grand-mastery
     * @param {String} mastery The mastery level to be updated
     * @public
     */
    async updateWeaponMastery(mastery) {
        const isMaster = this.system.wpnMaster;
        const isGrandmaster = this.system.wpnGrandmaster;

        let updateData = {};

        // Enabling a mastery level should disable the other one. However, disabling a mastery
        //  level does not need to enable the other one -- they can both be false.
        switch (mastery) {
            case "master":
                updateData = {
                    wpnMaster: !isMaster,
                    wpnGrandmaster: isGrandmaster && !isMaster ? false : isGrandmaster
                };
                break;
            case "grandMaster":
                updateData = {
                    wpnMaster: isMaster && !isGrandmaster ? false : isMaster,
                    wpnGrandmaster: !isGrandmaster
                };
                break;
            default:
                console.warn(`Invalid mastery type: ${mastery}`);
                return;
        }

        if (CONFIG.HYP3E.debugMessages) {
            console.log(`Updating Weapon Mastery:`, updateData);
        }

        return await this.update({ system: updateData });
    }

    /**
     * Add a spell reference to this item's spellcasting list.
     * Prevents duplicates and handles charges initialization.
     * @param {Item} droppedItem - The spell item being added.
     */
    async addSpell(droppedItem) {
        if (!droppedItem || droppedItem.type !== "spell") {
            ui.notifications.warn("Only spells can be added to this item.");
            return;
        }

        const uuid = droppedItem.uuid;
        const spellRefs = foundry.utils.deepClone(this.system.spellcasting?.spellRefs ?? []);

        // Check for duplicates
        if (spellRefs.some(ref => ref.uuid === uuid)) {
            ui.notifications.info(`Spell ${droppedItem.name} is already linked to this item.`);
            return;
        }

        spellRefs.push({ uuid, charges: 1 });
        await this.update({ "system.spellcasting.spellRefs": spellRefs });
    }

    /**
     * Reorder a spell reference in the item's spellcasting list.
     * @param {number} fromIndex - The current index of the spell.
     * @param {number} toIndex - The new index for the spell.
     */
    async reorderSpell(fromIndex, toIndex) {
        const refs = foundry.utils.deepClone(this.system.spellcasting?.spellRefs ?? []);
        if (!Array.isArray(refs)) return;

        const [moved] = refs.splice(fromIndex, 1);
        refs.splice(toIndex, 0, moved);

        return this.update({ "system.spellcasting.spellRefs": refs });
    }

    /**
     * Remove a spell reference from the item's spellcasting list.
     * @param {string} uuid - The UUID of the spell to remove.
     */
    async removeSpell(uuid) {
        const spellRefs = foundry.utils.deepClone(this.system.spellcasting?.spellRefs ?? []);
        const updatedRefs = spellRefs.filter(ref => ref.uuid !== uuid);

        return this.update({ "system.spellcasting.spellRefs": updatedRefs });
    }

    // Get the names of effects applied to the item, and return an array
    _getEffectNames() {
        return this.effects.map(e => e.name);
    }

    /**
     * Handle displaying an Item description in the chat.
     * @private
     */
    async _displayItemInChat(actorData) {
        const item = foundry.utils.deepClone(this)
        const itemData = item.system
        // if (CONFIG.HYP3E.debugMessages) { console.log("_displayItemInChat: Item clicked:", item) }

        // The system uses the term 'feature' under the covers, but Hyperborea uses 'ability'
        const typeLabel = item.type === 'feature' ? 'Ability' : item.type.capitalize();

        // itemName should be prioritized as (1) itemAlias [but only if not identified], 
        //  (2) friendlyName, and (3) realName
        const itemName = (!itemData.identified && itemData.itemAlias) ? itemData.itemAlias : (itemData.friendlyName || item.name);

        // Chat message header text
        const label = this._renderItemHeader(typeLabel, itemName, item.img);

        let content = itemData.description || "";
        content += this._renderItemProperties(item, itemData, actorData);

        // Items might have Effects, but only show the button if item is identified
        if (item.effects.size > 0 && itemData.identified) {
            content += `<div class='apply-effects-button' data-item-id='${item.id}' data-item-uuid='${item.uuid}' data-actor-id='${actorData.actorId}'></div>`;
        }
        // Items might have a Saving Throw, but only show the button if item is identified
        if (itemData.save && itemData.save !== "" && itemData.identified) {
            content += `<div class='save-button' data-save='${itemData.save}'></div>`;
        }

        // Setup & display the item in chat
        const templateData = { content };

        const template = `${HYP3E.templatePath}/chat/show-item.hbs`;
        const itemChat = await renderTemplate(template, templateData);
        // Log the rendered chat message
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: actorData.actorId }),
            flavor: label,
            content: itemChat
        });
    }

    _renderItemHeader(typeLabel, itemName, imgSrc) {
        return `
            <hr class="plain-hr" />
            <div style="margin: 10px 0;">
                <img src="${imgSrc}" style="border: none; float: left;" width="24px" height="24px">
                <span style="text-align: left; font-size: 12pt; font-weight: bold; margin-left: 6px;">
                    ${typeLabel}: ${itemName}
                </span>
            </div>
            <hr class="plain-hr" />`;
    }

    _renderItemProperties(item, itemData, actorData) {
        const parts = [];

        if (item.type === 'feature') parts.push(this._renderFeatureSection(itemData));
        if (item.type === 'weapon') parts.push(this._renderWeaponSection(itemData, item, actorData));
        if (item.type === 'spell') parts.push(this._renderSpellSection(itemData, item, actorData));
        if (item.type === 'item') parts.push(this._renderItemCheckSection(itemData));

        return parts.join("");
    }

    _renderFeatureSection(itemData) {
        if (itemData.formula && itemData.tn) {
            return `<p>Ability Check: ${itemData.formula} equal or under ${itemData.tn}</p>`;
        }
        return "";
    }

    _renderWeaponSection(itemData, item, actorData) {
        const parts = [];
        if (itemData.rof) parts.push(`<p>Atk Rate: ${itemData.rof}</p>`);
        if (itemData.type === 'missile') {
            parts.push(`<p>Range: ${itemData.range.short} / ${itemData.range.medium} / ${itemData.range.long}</p>`);
        } else {
            parts.push(`<p>Wpn Class: ${itemData.wc}</p>`);
        }
        parts.push(this._renderDamageRoll(itemData, item, actorData));
        return parts.join("");
    }

    _renderSpellSection(itemData, item, actorData) {
        const parts = [];
        if (itemData.range) parts.push(`<p>Range: ${itemData.range}</p>`);
        if (itemData.duration) {
            parts.push(itemData.duration.match(/.*d[1-9].*/) && Roll.validate(itemData.duration) ?
                `<p>Duration: [[/r ${itemData.duration}]]</p>` : `<p>Duration: ${itemData.duration}</p>`);
        }
        if (itemData.affected) {
            parts.push(itemData.affected.match(/.*d[1-9].*/) && Roll.validate(itemData.affected) ?
                `<p># Affected: [[/r ${itemData.affected}]]</p>` : `<p># Affected: ${itemData.affected}</p>`);
        }
        parts.push(this._renderDamageRoll(itemData, item, actorData));
        return parts.join("");
    }

    _renderDamageRoll(itemData, item, actorData) {
        if (!itemData.damage || !Roll.validate(itemData.damage)) return `<p>Damage: ${itemData.damage || ""}</p>`;

        const dmgObj = Hyp3eDice.buildDamageFormula(itemData, null, actorData);
        const roll = new Roll(dmgObj.formula, actorData);
        return `<div class='dmg-roll-button' data-item-id='${item.id}' data-item-uuid='${item.uuid}' 
            data-actor-id='${actorData.actorId}' data-formula='${roll.formula}' 
            data-damage-type='${itemData.dmgType}' data-debug-formula='${dmgObj.debugFormula}' 
            data-source-type='${item.type}'></div>`;
    }

    _renderItemCheckSection(itemData) {
        if (itemData.formula && itemData.tn) {
            return `<p>Item Check: ${itemData.formula} equal or under ${itemData.tn}</p>`;
        }
        return "";
    }

    /**
     * Handle active effects that might expire, or events that occur, with a new turn.
     * @param {*} turn - The current game-world turn number.
     */
    async advanceExplorationTurn(turn) {
        if (this.system.duration > 0) {
            // Handle temporary or ephemeral items
            const duration = this.system.duration;
        }
    }

    /**
     * Handle active effects that might expire, or events that occur, with a new turn.
     * @param {*} turn - The current game-world turn number.
     */
    async retreatExplorationTurn(turn) {
        // Handle temporary or ephemeral items
        const duration = this.system.duration;
    }

    /** LOOKUP TABLES AND FUNCTIONS ---------------------*/

    /**
     * Check if this item is a light source based on its name. Return properties if found.
     * @param {*} name - Simple name of the light source, e.g. "Torch", "Lantern, Hooded", etc.
     * @returns 
     */
    _getLightSourceProperties() {
        // If the item hasn't been initialized yet, return null
        if (!this.name || !this.system) return null;

        // Light source lookup table
        const lightSources = {
            "bonfire": { "radius": 60, "angle": 360 },
            "campfire": { "radius": 40, "angle": 360 },
            "candle": { "radius": 5, "angle": 360 },
            "continuous_light_spell": { "radius": 30, "angle": 360 },
            "lantern": { "radius": 30, "angle": 360 },
            "lantern_bullseye": { "radius": 60, "angle": 15 },
            "lantern_hooded": { "radius": 30, "angle": 360 },
            "light_spell": { "radius": 15, "angle": 360 },
            "produce_flame_spell": { "radius": 40, "angle": 360 },
            "torch": { "radius": 30, "angle": 360 }
        }

        // Convert the name to lowercase and replace spaces with underscores
        let normalized = this.name.toLowerCase().replace(/\s+/g, "_");
        // Replace hyphens, commas, and apostrophes with null
        normalized = normalized.replace(/[-,']/g, "");
        // Check if the normalized name exists in the lightSources table
        let lightSourceProps
        lightSourceProps = lightSources[normalized];
        if (lightSourceProps) {
            return lightSourceProps;
        } else {
            return null;
        }
    }

    _stringOrObjectFromTable(table, val) {
        const output = table[val]
        return output
    }

}
