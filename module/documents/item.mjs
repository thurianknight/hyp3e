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
        if (CONFIG.HYP3E.debugMessages) { console.log("Pre-created item data", data) }
        return this.updateSource(data)
    }

    prepareData() {
        // As with the actor class, items are documents that can have their data
        // preparation methods overridden (such as prepareBaseData()).
        super.prepareData();

        // Get the Item's data
        const itemData = this;
        // const actorData = this.actor ? this.actor : {};
        // const data = itemData;
        // console.log("Item data:", itemData)

        // Handle weapon attack roll formula
        if (itemData.type == "weapon") {
        // For all weapons, atkRoll is obviously true
        itemData.system.atkRoll = true
        // Set melee & missile flags and attack formulas
        if (itemData.system.type == "melee") {
            itemData.system.melee = true
            itemData.system.missile = false
            // Area effects do not require an attack roll, all else does
            if (!itemData.system.isAreaEffect) {
                // Set attack formula if it doesn't already exist, else leave it alone
                if (!itemData.system.formula || itemData.system.formula == '') {
                    itemData.system.formula = '1d20 + @fa + @str.atkMod + @item.atkMod'
                }
            } else {
                // Clear the attack roll if this is an area effect attack
                itemData.system.formula = ""
            }
        } else if (itemData.system.type == "missile") {
            itemData.system.melee = false
            itemData.system.missile = true
            // Area effects do not require an attack roll, all else does
            if (!itemData.system.isAreaEffect) {
                // Set attack formula if it doesn't already exist, else leave it alone
                if (!itemData.system.formula || itemData.system.formula == '') {
                    if (!itemData.system.isGrenade) {
                        // Standard missile weapons
                        itemData.system.formula = '1d20 + @fa + @dex.atkMod + @item.atkMod'
                    } else {
                        // Grenade-like splash-effect items
                        itemData.system.formula = '1d20 + @dex.atkMod'
                    }
                }
            } else {
                // Clear the attack roll if this is an area effect attack
                itemData.system.formula = ""
            }
        } else {
            // This should never happen, unless an item is imported with missing data
            console.log("ITEM ERROR: Weapon has neither melee nor missile property set! Setting to melee...")
            itemData.system.type = "melee"
            itemData.system.melee = true
            itemData.system.missile = false
            // Set attack formula if it doesn't already exist, else leave it alone
            if (itemData.system.formula == '') {
                itemData.system.formula = '1d20 + @fa + @str.atkMod + @item.atkMod'
            }
        }

        } else { // ==> Anything NOT a weapon...
        // For non-weapons, is the Attack Roll checkbox selected?
        if (itemData.system.atkRoll) {
            // Set attack formula if it doesn't already exist, else leave it alone
            if (itemData.system.formula == '') {
                itemData.system.formula = '1d20 + @fa'
            }
        } else {
            // Handle item check roll formula
            if (itemData.system.formula == '' && itemData.system.check != '') {
                itemData.system.formula = itemData.system.check
            }
        }
        }
        // Log the item data
        //console.log("Item Data:", itemData)

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
     * Handle displaying an Item description in the chat.
     * @private
     */
    async _displayItemInChat() {
        const item = this
        const actor = this.actor
        const actorData = actor.system
        // const speaker = ChatMessage.getSpeaker()
        
        // The system uses the term 'feature' under the covers, but Hyperborea uses 'ability'
        let typeLabel = ""
        if (item.type == 'feature') {
            typeLabel = 'Ability'
        } else {
            typeLabel = (item.type).capitalize()
        }
        // Replace names like "Bow, composite, long" with something that looks nicer
        let itemName = ""
        if (item.system.friendlyName != "") {
            itemName = item.system.friendlyName
        } else {
            itemName = item.name
        }

        // Chat message header text
        const label = `<h3>${typeLabel}: ${itemName}</h3>`
        
        if (CONFIG.HYP3E.debugMessages) { console.log("Item clicked:", item) }
        let content = item.system.description

        // Setup clickable buttons for item properties if they have a roll macro,
        //  otherwise just display the value.

        // Features/Abilities
        if (item.type == 'feature') {
            if (item.system.formula && item.system.tn) {
                // Display the ability check roll with target number
                content += `<p>Ability Check: ${item.system.formula} equal or under ${item.system.tn}</p>`
            }
        }

        // Weapons
        if (item.type == 'weapon') {
            if (item.system.rof) {
                // Display missile rate of fire or melee attack rate
                content += `<p>Atk Rate: ${item.system.rof}</p>`
            }
            if (item.system.type == 'missile') {
                // For a missile weapon we display the range increments
                content += `<p>Range: ${item.system.range.short} / ${item.system.range.medium} / ${item.system.range.long}</p>`
            } else {
                // For melee weapons we display the weapon class
                content += `<p>Wpn Class: ${item.system.wc}</p>`
            }
            if (item.system.damage) {
                if (Roll.validate(item.system.damage)) {
                    // Resolve damage string & variables to a rollable formula
                    const roll = new Roll(item.system.damage, actorData)
                    console.log("Spell damage roll: ", roll)
                    content += `<div class='dmg-roll-button' data-formula='${roll.formula}'></div>`;
                } else {
                    content += `<p>Damage: ${item.system.damage}</p>`
                }
            }
        }

        // Spells
        if (item.type == 'spell') {
            if (item.system.range) {
                // Display the range
                content += `<p>Range: ${item.system.range}</p>`
            }
            if (item.system.duration) {
                if (Roll.validate(item.system.duration)) {
                    // Add a duration roll macro
                    content += `<p>Duration: [[/r ${item.system.duration}]]</p>`
                } else {
                    // If duration is not variable, simply display the value
                    content += `<p>Duration: ${item.system.duration}</p>`
                }
            }
            if (item.system.affected) {
                if (Roll.validate(item.system.affected)) {
                    // Add a number affected roll macro
                    content += `<p># Affected: [[/r ${item.system.affected}</p>`
                } else {
                    content += `<p># Affected: ${item.system.affected}</p>`
                }
            }
            if (item.system.damage) {
                if (Roll.validate(item.system.damage)) {
                    // Resolve damage string & variables to a rollable formula
                    const roll = new Roll(item.system.damage, actorData)
                    content += `<div class='dmg-roll-button' data-formula='${roll.formula}' data-source-type='${item.type}'></div>`;
                } else {
                    content += `<p>Damage: ${item.system.damage}</p>`
                }
            } else {
                if (CONFIG.HYP3E.debugMessages) { console.log(`Damage roll for spell ${item.name}, ${item.system.damage}, is not rollable.`) }
            }
        }
        // Both spells and weapons might have a Saving Throw
        if (item.system.save && item.system.save !== "") {
            content += `<div class='save-button' data-save='${item.system.save}'></div>`;
        }

        // Item
        if (item.type == 'item') {
            if (item.system.formula && item.system.tn) {
                // Display the item check roll with target number
                content += `<p>Item Check: ${item.system.formula} equal or under ${item.system.tn}</p>`
            }
        }

        // Now we can display the chat message
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: label,
            content: content ?? ''
        })
    }
}
