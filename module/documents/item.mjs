import {Hyp3eDice} from "../helpers/dice.mjs";
import { HYP3E } from "../helpers/config.mjs"
// import {Hyp3eDialog} from "../helpers/dialog.mjs";

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
            spell: "icons/svg/book.svg",
            feature: "icons/svg/target.svg",
            armor: "icons/svg/shield.svg",
            weapon: "icons/svg/combat.svg",
            item: "icons/svg/item-bag.svg",
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

    prepareData() {
        // As with the actor class, items are documents that can have their data
        // preparation methods overridden (such as prepareBaseData()).
        super.prepareData();

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
        if (this.type === "weapon" || itemData.atkRoll) {
            this.applyAttackFormula();
        }

        // Ammo usage flag
        if (this.type === "weapon" && itemData.type === "missile") {
            itemData.usesAmmo = /(bow|sling|gun)/i.test(this.name);
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

    // Get the names of effects applied to the item, and return an array
    _getEffectNames() {
        return this.effects.map(e => e.name);
    }

    applyAttackFormula() {
        const itemData = this.system;

        // If this is not a weapon, but has an atkRoll, set the formula to 1d20 + @fa
        if (this.type !== "weapon") {
            if (itemData.atkRoll && !itemData.formula?.trim()) {
                itemData.formula = "1d20 + @fa";
            }
            return;
        }

        // Area effects and grenades override all variables
        if (itemData.isAreaEffect) {
            itemData.formula = "";
            itemData.melee = false;
            itemData.missile = true;
            itemData.isGrenade = false;
            return;
        }
        if (itemData.isGrenade) {
            itemData.formula = "1d20 + @dex.atkMod";
            itemData.melee = false;
            itemData.missile = true;
            itemData.isAreaEffect = false;
            return;
        }

        // If this is a weapon, set the attack formula based on type
        if (itemData.type === "melee") {
            itemData.formula ||= "1d20 + @str.atkMod";
            itemData.melee = true;
            itemData.missile = false;
        } else if (itemData.type === "missile") {
            itemData.formula ||= "1d20 + @dex.atkMod";
            itemData.melee = false;
            itemData.missile = true;
        } else {
            console.warn(`ITEM ERROR: Weapon ${this.name} has invalid type. Defaulting to melee.`);
            itemData.type = "melee";
            itemData.formula = "1d20 + @str.atkMod";
            itemData.melee = true;
            itemData.missile = false;
        }
    }

    /**
     * Handle displaying an Item description in the chat.
     * @private
     */
    async _displayItemInChat(actorData) {
        const item = foundry.utils.deepClone(this)
        const itemData = item.system
        
        // The system uses the term 'feature' under the covers, but Hyperborea uses 'ability'
        let typeLabel = ""
        if (item.type == 'feature') {
            typeLabel = 'Ability'
        } else {
            typeLabel = (item.type).capitalize()
        }
        // itemName should be prioritized as (1) itemAlias [but only if not identified], 
        //  (2) friendlyName, and (3) realName
        let itemName = ""
        if (!itemData.identified && itemData.itemAlias != "") {
            itemName = itemData.itemAlias
        } else {
            itemName = item ? (itemData.friendlyName || item.name) : "Unknown Action";
        }

        // Chat message header text
        const label = `
        <hr class="plain-hr" />
        <div style="margin: 10px 0;">
            <img src="${item.img}" style="border: none; float: left;" width="24px" height="24px">
            <span style="text-align: left; font-size: 12pt; font-weight: bold; margin-left: 6px;">
                ${typeLabel}: ${itemName}
            </span>
        </div>
        <hr class="plain-hr" />`

        if (CONFIG.HYP3E.debugMessages) { console.log("_displayItemInChat: Item clicked:", item) }
        let content = itemData.description

        // Setup clickable buttons for item properties if they have a roll macro,
        //  otherwise just display the value.

        // Features/Abilities
        if (item.type == 'feature') {
            if (itemData.formula && itemData.tn) {
                // Display the ability check roll with target number
                content += `<p>Ability Check: ${itemData.formula} equal or under ${itemData.tn}</p>`
            }
        }

        // Weapons
        if (item.type == 'weapon') {
            if (itemData.rof) {
                // Display missile rate of fire or melee attack rate
                content += `<p>Atk Rate: ${itemData.rof}</p>`
            }
            if (itemData.type == 'missile') {
                // For a missile weapon we display the range increments
                content += `<p>Range: ${itemData.range.short} / ${itemData.range.medium} / ${itemData.range.long}</p>`
            } else {
                // For melee weapons we display the weapon class
                content += `<p>Wpn Class: ${itemData.wc}</p>`
            }
            if (itemData.damage) {
                if (Roll.validate(itemData.damage)) {
                    // Build our damage roll formula, including actor and weapon mods
                    const dmgObj = Hyp3eDice.buildDamageFormula(itemData, null, actorData)
                    const dmgFormula = dmgObj.formula
                    const debugDmgRollFormula = dmgObj.debugFormula
                    // Resolve damage string & variables to a rollable formula
                    const roll = new Roll(dmgFormula, actorData)
                    // if (CONFIG.HYP3E.debugMessages) { console.log("_displayItemInChat: Damage roll: ", roll) }
                    content += `<div class='dmg-roll-button' data-item-id='${item.id}' data-item-uuid='${item.uuid}' data-actor-id='${actorData.actorId}' data-formula='${roll.formula}' data-debug-formula='${debugDmgRollFormula}' data-source-type='${item.type}'></div>`;
                } else {
                    content += `<p>Damage: ${itemData.damage}</p>`
                }
            }
        }

        // Spells
        if (item.type == 'spell') {
            if (itemData.range) {
                // Display the range
                content += `<p>Range: ${itemData.range}</p>`
            }
            if (itemData.duration) {
                if ((itemData.duration).match(/.*d[1-9].*/) && Roll.validate(itemData.duration)) {
                    // Add a duration roll macro
                    content += `<p>Duration: [[/r ${itemData.duration}]]</p>`
                } else {
                    // If duration is not variable, simply display the value
                    content += `<p>Duration: ${itemData.duration}</p>`
                }
            }
            if (itemData.affected) {
                if ((itemData.affected).match(/.*d[1-9].*/) && Roll.validate(itemData.affected)) {
                    // Add a number affected roll macro
                    content += `<p># Affected: [[/r ${itemData.affected}</p>`
                } else {
                    content += `<p># Affected: ${itemData.affected}</p>`
                }
            }
            if (itemData.damage) {
                if (Roll.validate(itemData.damage)) {
                    // Build our damage roll formula, including actor and weapon mods
                    const dmgObj = Hyp3eDice.buildDamageFormula(itemData, null, actorData)
                    const dmgFormula = dmgObj.formula
                    const debugDmgRollFormula = dmgObj.debugFormula
                    // Resolve damage string & variables to a rollable formula
                    const roll = new Roll(dmgFormula, actorData)
                    // if (CONFIG.HYP3E.debugMessages) { console.log("_displayItemInChat: Damage roll: ", roll) }
                    content += `<div class='dmg-roll-button' data-item-id='${item.id}' data-item-uuid='${item.uuid}' data-actor-id='${actorData.actorId}' data-formula='${roll.formula}' data-debug-formula='${debugDmgRollFormula}' data-source-type='${item.type}'></div>`;
                } else {
                    content += `<p>Damage: ${itemData.damage}</p>`
                }
            } else {
                if (CONFIG.HYP3E.debugMessages) { console.warn(`_displayItemInChat: Damage roll for spell ${item.name}, ${itemData.damage}, is not rollable.`) }
            }
        }

        // Item
        if (item.type == 'item') {
            if (itemData.formula && itemData.tn) {
                // Display the item check roll with target number
                content += `<p>Item Check: ${itemData.formula} equal or under ${itemData.tn}</p>`
            }
        }

        // Items might have Effects, but only show the button if item is identified
        if (item.effects.size > 0 && itemData.identified) {
            content += `<div class='apply-effects-button' data-item-id='${item.id}' data-item-uuid='${item.uuid}' data-actor-id='${actorData.actorId}'></div>`;
        }
        // Items might have a Saving Throw, but only show the button if item is identified
        if (itemData.save && itemData.save !== "" && itemData.identified) {
            content += `<div class='save-button' data-save='${itemData.save}'></div>`;
        }

        // Setup & display the item in chat
        const templateData = {
            // item: item,
            // actor: actor,
            // user: game.user,
            content: content,
        };
        const template = `${HYP3E.templatePath}/chat/show-item.hbs`;
        let itemChat = await renderTemplate(template, templateData);
        // Log the rendered chat message
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: actorData.actorId }),
            flavor: label,
            content: itemChat
        });
    }
}
