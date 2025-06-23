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
        // Replace default image for items, but if an image is defined, leave it be
        if (!data.img || data.img == "") {
            switch(data.type) {
                case "spell":
                data.img = `icons/svg/book.svg`
                break
                case "feature":
                data.img = `icons/svg/target.svg`
                break
                case "armor":
                data.img = `icons/svg/shield.svg`
                break
                case "weapon":
                data.img = `icons/svg/combat.svg`
                break
                case "item":
                data.img = `icons/svg/item-bag.svg`
                break
                case "container":
                data.img = `icons/svg/item-bag.svg`
                break
                default:
                data.img = `icons/svg/item-bag.svg`
            }      
        }
        // A newly-created item won't have the system attribute (or any child attributes) yet
        if (data.system?.ammunition == "true") { data.system.isAmmunition = true }
        if (data.system?.consumable == "true") { data.system.isConsumable = true }
        if (data.system?.containerId) {
            // If an item is copied from one actor to another, blank out the containerId & location
            if (data.system.containerId != "") {
                data.system.containerId = ""
                data.system.location = ""
            }
        }
        if (CONFIG.HYP3E.debugMessages) { console.log("Pre-created item data", data) }
        return this.updateSource(data)
    }

    prepareData() {
        // As with the actor class, items are documents that can have their data
        // preparation methods overridden (such as prepareBaseData()).
        super.prepareData();

        // Get the Item's data
        const item = this;
        const itemData = item.system;

        // Setup the item's realName to be its name, if realName is blank
        if (!item.system?.realName || item.system?.realName.trim() === "") {
            item.system.realName = item.name
        }

        // If the item is identified but has no realDescription, set it to the description
        if (itemData.identified && (!itemData.realDescription || itemData.realDescription.trim() === "")) {
            itemData.realDescription = itemData.description
        }

        // Fix weapon & spell missing or invalid damage type
        if (item.type == "weapon" || item.type == "spell") {
            if (!itemData.dmgType || itemData.dmgType == "" || CONFIG.HYP3E.damageTypes[itemData.dmgType] == undefined) {
                console.log("ITEM ERROR: Weapon/spell has missing or invalid damage type! Setting to Basic...")
                itemData.dmgType = "basic"
            }
        }

        // Handle weapon attack roll formula
        if (item.type == "weapon") {
            // For all weapons, atkRoll is obviously true
            itemData.atkRoll = true
            // Set melee & missile flags and attack formulas
            if (itemData.type == "melee") {
                itemData.melee = true
                itemData.missile = false
                // Area effects do not require an attack roll, all else does
                if (!itemData.isAreaEffect) {
                    // Set attack formula if it doesn't already exist, else leave it alone
                    if (!itemData.formula || itemData.formula == '') {
                        itemData.formula = '1d20 + @str.atkMod'
                    }
                } else {
                    // Clear the attack roll if this is an area effect attack
                    itemData.formula = ""
                }
            } else if (itemData.type == "missile") {
                itemData.melee = false
                itemData.missile = true
                // Area effects do not require an attack roll, all else does
                if (!itemData.isAreaEffect) {
                    // Set attack formula if it doesn't already exist, else leave it alone
                    if (!itemData.formula || itemData.formula == '') {
                        if (!itemData.isGrenade) {
                            // Standard missile weapons. We handle grenades further down.
                            itemData.formula = '1d20 + @dex.atkMod'
                        }
                    }
                } else {
                    // Clear the attack roll if this is an area effect attack
                    itemData.formula = ""
                }
                // If weapon launches ammo, set the usesAmmo property
                if (item.name.toLowerCase().includes("bow") || item.name.toLowerCase().includes("sling") || item.name.toLowerCase().includes("gun")) {
                    itemData.usesAmmo = true
                }
            } else {
                // This should never happen, unless an item is imported with missing data
                console.log("ITEM ERROR: Weapon has neither melee nor missile property set! Setting to melee...")
                itemData.type = "melee"
                itemData.melee = true
                itemData.missile = false
                itemData.isGrenade = false
                itemData.isAreaEffect = false
                // Set attack formula if it doesn't already exist, else leave it alone
                if (itemData.formula == '') {
                    itemData.formula = '1d20 + @str.atkMod'
                }
            }
            // The grenade and area effect checkboxes override standard attack formulas
            if (itemData.isGrenade) {
                itemData.melee = false
                itemData.missile = true
                itemData.isAreaEffect = false
                itemData.formula = '1d20 + @dex.atkMod'
            }
            if (itemData.isAreaEffect) {
                itemData.melee = false
                itemData.missile = true
                itemData.isGrenade = false
                itemData.formula = ''
            }

        } else { // ==> Anything else...
            // For non-weapons (like spells), is the Attack Roll checkbox selected?
            if (itemData.atkRoll) {
                // Set attack formula if it doesn't already exist, else leave it alone
                if (itemData.formula == '') {
                    itemData.formula = '1d20 + @fa'
                }
            } else {
                // Handle item check roll formula
                if (itemData.formula == '' && itemData.check != '') {
                    itemData.formula = itemData.check
                }
            }
        }
        // Log the item data
        //console.log("Item Data:", item)

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
        let effects = this.effects
        let effectsArray = []
        effects.forEach(effect => {
            // Log the effect
            if (CONFIG.HYP3E.debugMessages) { console.log(`_getEffectNames: Effect ${effect.name}:`, effect) }
            effectsArray.push(effect.name)
        })
        return effectsArray
    }
    
    /**
     * Handle displaying an Item description in the chat.
     * @private
     */
    async _displayItemInChat(actorData) {
        // const item = this
        const item = foundry.utils.deepClone(this)
        const itemData = item.system
        // const actor = item.actor
        // const actorData = actor.system
        
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
