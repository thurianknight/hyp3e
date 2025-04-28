import { Hyp3eCharacter } from "../helpers/character.mjs";
import { Hyp3eDice } from "../helpers/dice.mjs";
import { Hyp3eDialog } from "../helpers/dialog.mjs";
import { HYP3E } from "../helpers/config.mjs"

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class Hyp3eActor extends Actor {

    /** @override */
    prepareData() {
        // Prepare data for the actor. Calling the super version of this executes
        // the following, in order: data reset (to clear active effects),
        // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
        // prepareDerivedData().
        super.prepareData();
    }

    /** @override */
    prepareBaseData() {
        // Data modifications in this step occur before processing embedded
        // documents or derived data.
        const actorData = this;
        const systemData = actorData.system;

        // Notes on system.tempModifiers:
        //  I'm not sure this code should go here, but since it is disabled anyway, it doesn't 
        //  matter... yet.
        //
        //  This is an array of modifiers that may be applied to any field in the data template.
        //  However, note that it is better to use effects and apply them to the data template
        //  whenever possible. The known exceptions are AC and MV, as these are auto-calculated
        //  below and cannot be modified by effects.
        //
        //  Example tempModifiers entry:
        //      {
        //          templateField: "system.ac.value",
        //          source: "isEncumbered",
        //          modifier: 1
        //      }
        //  Each entry must be unique by templateField and source!
        //  In theory, we could use an effect to create an entry... need to test.
        // if (CONFIG.HYP3E.debugMessages) { console.log(`tempModifiers[]:`, systemData.tempModifiers) }
        systemData.tempModifiers.forEach((mod, id) => {
            // if (CONFIG.HYP3E.debugMessages) { console.log(`tempModifiers[${id}]:`, mod) }
            // const obj = JSON.parse(mod)
            // let obj = JSON.parse('{"templateField": "system.ac.value", "source": "isEncumbered", "modifier": 1}')
            // if (CONFIG.HYP3E.debugMessages) { console.log(`tempModifiers[${id}]:`, obj) }
        })

        // If tempAcMod is an object, convert it to zero
        if (typeof systemData.ac.tempAcMod == "object") {
            systemData.ac.tempAcMod = 0
        }

    }

    /**
     * @override
     * Augment the basic actor data with additional dynamic data. Typically,
     * you'll want to handle most of your calculated/derived data in this step.
     * Data calculated in this step should generally not exist in template.json
     * (such as attribute modifiers rather than attribute scores) and should be
     * available both inside and outside of character sheets (such as if an actor
     * is queried and has a roll executed directly from it).
     */
    prepareDerivedData() {
        const actorData = this;
        const systemData = actorData.system;
        const flags = actorData.flags.hyp3e || {};
        // systemData.hp.percentage = Math.clamp((systemData.hp.value * 100) / systemData.hp.max, 0, 100);
        systemData.hp.percentage = Math.min(Math.max((systemData.hp.value * 100) / systemData.hp.max, 0), 100);

        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        this._prepareCharacterData(actorData);
        this._prepareNpcData(actorData);
    }

    /**
     * Prepare Character type specific data
     */
    _prepareCharacterData(actorData) {
        if (actorData.type !== 'character') return;

        // Make modifications to data here. For example:
        const systemData = actorData.system;

        // Calculated fields go here...

        // Add actor type & base class, used for crit hit & crit miss tables
        try {
            systemData.actorType = actorData.type
            // systemData.baseClass = this.classData[systemData.details.class].baseClass
            systemData.baseClass = Hyp3eCharacter.classData[systemData.details.class].baseClass
        } catch (err) {
            // No match found (happens with custom classes), use "npc"
            systemData.baseClass = "npc"
        }

        // Add task resolution
        systemData.taskResolution = {}
        for (let [key, value] of Object.entries(CONFIG.HYP3E.taskResolution)) {
            systemData.taskResolution[key] = value
            systemData.taskResolution[key].name = game.i18n.localize(CONFIG.HYP3E.taskResolution[key].name)
            systemData.taskResolution[key].hint = game.i18n.localize(CONFIG.HYP3E.taskResolution[key].hint)
        }

        // Auto-calculate AC if configuration is enabled
        if (CONFIG.HYP3E.autoCalcAc) {
            // systemData.unarmoredAc = 9 - systemData.attributes.dex.defMod
            // if (CONFIG.HYP3E.debugMessages) { console.log("Unarmored AC: ", systemData.unarmoredAc) }

            // Calculate current AC & DR based on equipped armor, shield, and DX defense mod
            // Start by resetting base AC and DR
            systemData.ac.value = 9 - systemData.attributes.dex.defMod
            systemData.ac.dr = 0
            let tempAC = 9
            let tempMV = 40
            let shieldMod = 0
            let tempDR = 0
            // Loop through all inventory item types to find armor
            for (let itmType of Object.entries(actorData.itemTypes)) {
                if (itmType[0] == "armor") {
                    // Armor as an item type can include armor, shields, and some protective magic items
                    for (let [key, obj] of Object.entries(itmType[1])) {
                        if (CONFIG.HYP3E.debugMessages) { console.log("Armor data: ", obj) }
                        // Only count an item if it is equipped... but also note that only 1 suit of armor and
                        //   1 shield will ever be counted -- no stacking of items.
                        // The logic here should use the best AC if multiple armor types are equipped, as in 
                        //   the case where someone is wearing both armor and a ring of protection.
                        // HOWEVER, this logic is partially broken. Need to map out all possibilities for magical
                        //   protection items, what stacks & when, then we can fix this logic.
                        if (obj.system.equipped) {
                            // DR can be updated by armor or shield (not in core rules, but...)
                            if (obj.system.dr > tempDR) {
                                // Only update DR if this equipped item is superior to the current DR
                                tempDR = obj.system.dr
                            }
                            if (obj.system.type != "shield") {
                                // Armor AC overrides the unarmored AC of 9 (DX mod subtracted later)
                                if (obj.system.ac < tempAC) {
                                    // Only update AC if this equipped item is superior to the current AC
                                    tempAC = obj.system.ac
                                    tempMV = obj.system.mv
                                }
                                if (CONFIG.HYP3E.debugMessages) { 
                                    console.log(`Armor equipped: ${obj.name}, Base AC: ${tempAC}, Base DR: ${tempDR}, Base MV: ${tempMV}`)
                                }
                            } else {
                                // Shield AC is a modifier subtracted from base AC.
                                // We allow shield modifiers to stack because many protective magic items give an AC bonus
                                //  similar to shields, and they should stack.
                                shieldMod += obj.system.ac
                                if (CONFIG.HYP3E.debugMessages) {
                                    console.log("Shield equipped: ", obj.name, ", Shield Mod: ", shieldMod)
                                }
                            }
                        } else {
                            if (CONFIG.HYP3E.debugMessages) { console.log("Armor not equipped: ", obj.name) }
                        }
                    }
                }
            }
            if (game.settings.get(game.system.id, "enableEncumbrance")) {
                // Encumbered and Heavily Encumbered negatively impact both AC and MV
                if (this.getFlag(game.system.id, "isEncumbered")) {
                    tempAC += 1
                    tempMV -= 10
                    // These temp modifiers aren't really used yet, but maybe in the future
                    // this.addTempModifier("ac.value", "isEncumbered", 1)
                    // this.addTempModifier("movement.base.value", "isEncumbered", -10)
                    this.deleteTempModifier("ac.value", "isHeavilyEncumbered")
                    this.deleteTempModifier("movement.base.value", "isHeavilyEncumbered",)
                    if (CONFIG.HYP3E.debugMessages) { console.log(`Encumbered: AC ${tempAC}, MV ${tempMV}`) }
                } else if (this.getFlag(game.system.id, "isHeavilyEncumbered")) {
                    tempAC += 2
                    tempMV -= 20
                    // These temp modifiers aren't really used yet, but maybe in the future
                    // this.addTempModifier("ac.value", "isHeavilyEncumbered", 2)
                    // this.addTempModifier("movement.base.value", "isHeavilyEncumbered", -20)
                    this.deleteTempModifier("ac.value", "isEncumbered")
                    this.deleteTempModifier("movement.base.value", "isEncumbered",)
                    if (CONFIG.HYP3E.debugMessages) { console.log(`Heavily Encumbered: AC ${tempAC}, MV ${tempMV}`) }
                } else {
                    // Not encumbered -- find any instances of encumbrance mods and remove them
                    // These temp modifiers aren't really used yet, but maybe in the future
                    this.deleteTempModifier("ac.value", "isEncumbered")
                    this.deleteTempModifier("movement.base.value", "isEncumbered",)
                    this.deleteTempModifier("ac.value", "isHeavilyEncumbered")
                    this.deleteTempModifier("movement.base.value", "isHeavilyEncumbered",)
                    if (CONFIG.HYP3E.debugMessages) { console.log(`Not Encumbered: AC ${tempAC}, MV ${tempMV}`) }
                }
            }
            // Apply temporary modifiers (typically from effects) to AC and DR
            if (parseInt(systemData.ac.tempAcMod)) {
                if (CONFIG.HYP3E.debugMessages) { console.log(`Temp AC mod: ${systemData.ac.tempAcMod}`) }
                tempAC -= parseInt(systemData.ac.tempAcMod)
            }
            if (parseInt(systemData.ac.tempDrMod)) {
                if (CONFIG.HYP3E.debugMessages) { console.log(`Temp DR mod: ${systemData.ac.tempDrMod}`) }
                tempDR += parseInt(systemData.ac.tempDrMod)
            }
            // Apply temporary modifier (typically from effects) to encounter-mode MV
            if (parseInt(systemData.tempMvMod)) {
                if (CONFIG.HYP3E.debugMessages) { console.log(`Temp MV mod: ${systemData.tempMvMod}`) }
                tempMV += parseInt(systemData.tempMvMod)
            }
            // Now calculate & set the final values...
            systemData.ac.value = tempAC - systemData.attributes.dex.defMod - shieldMod
            // AC can't be worse (higher) than 9, nor better than -9
            systemData.ac.value = systemData.ac.value > 9 ? 9 : systemData.ac.value
            systemData.ac.value = systemData.ac.value < -9 ? -9 : systemData.ac.value
            // DR & MV
            systemData.ac.dr = tempDR
            systemData.movement.base.value = tempMV
        }

        // Log the prepared data
        if (CONFIG.HYP3E.debugMessages) { console.log("Prepared Character Data: ", systemData) }

    }

    /**
     * Prepare NPC type specific data.
     */
    _prepareNpcData(actorData) {
        if (actorData.type !== 'npc') return;

        // Make modifications to data here
        const systemData = actorData.system
        // NPCs and monsters don't get the -10 hp benefit that PCs do
        systemData.hp.min = 0

        // Calculated fields go here...

        // Apply temporary modifiers (typically from effects) to AC and DR
        if (parseInt(systemData.ac.tempAcMod)) {
            if (CONFIG.HYP3E.debugMessages) { console.log(`Temp AC mod: ${systemData.ac.tempAcMod}`) }
            systemData.ac.value -= parseInt(systemData.ac.tempAcMod)
            // AC can't be worse (higher) than 9, nor better than -9
            systemData.ac.value = systemData.ac.value > 9 ? 9 : systemData.ac.value
            systemData.ac.value = systemData.ac.value < -9 ? -9 : systemData.ac.value
        }
        if (parseInt(systemData.ac.tempDrMod)) {
            if (CONFIG.HYP3E.debugMessages) { console.log(`Temp DR mod: ${systemData.ac.tempDrMod}`) }
            systemData.ac.dr += parseInt(systemData.ac.tempDrMod)
        }

        // Add actor type & base class, used for crit hit & crit miss tables
        systemData.actorType = actorData.type
        systemData.baseClass = "npc"
    }

    /**
     * Set token defaults when actor is created
     */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);
        if (data.type == "character") {
            this.updateSource({
                "prototypeToken.actorLink": true,
                "prototypeToken.sight.enabled": true,
                "prototypeToken.disposition": 0
            });
        }
        if (data.type == "npc") {
            // Do nothing for now
        }
    }

    /**
     * Override getRollData() that's supplied to rolls.
     */
    getRollData() {
        const data = super.getRollData();

        // Prepare character roll data.
        this._getCharacterRollData(data);
        this._getNpcRollData(data);

        return data;
    }

    /**
     * Prepare character roll data.
     */
    _getCharacterRollData(data) {
        if (this.type !== 'character') return;

        // Copy the attribute scores to the top level, so that rolls can use
        //   formulas like `@str.atkMod`.
        if (data.attributes) {
            for (let [k, v] of Object.entries(data.attributes)) {
                data[k] = foundry.utils.deepClone(v);
            }
        }
        // Add character's level to top level of data
        if (data.details.level) {
            data.lvl = data.details.level.value ?? 0;
        }
    }

    /**
     * Prepare NPC roll data.
     */
    _getNpcRollData(data) {
        if (this.type !== 'npc') return;
        // Anything to load?

    }

    /**
     * Add a temporary modifier to the actor's system.tempModifiers array
     * @param {*} templateField 
     * @param {*} source 
     * @param {*} modifier 
     */
    addTempModifier(templateField, source, modifier) {
        //  Example tempModifiers entry:
        //      {
        //          templateField: "ac.value",
        //          source: "isEncumbered",
        //          modifier: 1
        //      }

        // Check for existence of this modifier, before we try adding it
        this.system.tempModifiers.forEach((mod, id) => {
            if (mod.templateField == templateField && mod.source == source) { 
                if (CONFIG.HYP3E.debugMessages) { console.log(`Cannot add temp modifier, it already exists! templateField ${templateField}, source ${source}.`) }
                return
            }
        })
        this.system.tempModifiers.push(
            {
                templateField: templateField,
                source: source,
                modifier: modifier
            }
        )
    }

    /**
     * Remove a temporary modifier from the actor's system.tempModifiers array
     * @param {*} templateField 
     * @param {*} source 
     */
    deleteTempModifier(templateField, source) {
        // Find & delete the modifier
        this.system.tempModifiers.forEach((mod, id) => {
            if (mod.templateField == templateField && mod.source == source) {
                if (CONFIG.HYP3E.debugMessages) { console.log(`Found temp modifier, deleting. templateField ${templateField}, source ${source}.`) }
                this.system.tempModifiers.splice(id, 1)
            }
        })
    }

    /**
     * Apply a health change to the actor, either damage or healing
     * @param {*} change
     * @param {*} applyDr
     */
    async applyHealthChange(change, applyDr=true) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`applyHealthChange: ${change} HP to be applied to ${this.name}.`) }
        // Check if the change is a number
        if (typeof change !== "number") {
            ui.notifications?.error(`Invalid health change: ${change}`);
            return;
        }
        // Check if the actor is dead, no need to do more damage--but healing will work
        if (this.system.hp.value <= this.system.hp.min && change > 0) {
            if (CONFIG.HYP3E.debugMessages) { console.log(`applyHealthChange: ${this.name} is already dead!`) }
            return;
        }
        // Check if the change is zero
        if (change == 0) {
            if (CONFIG.HYP3E.debugMessages) { console.log(`applyHealthChange: ${this.name} has no health change!`) }
            return;
        }

        // Update Health
        const oldHp = this.system.hp.value;

        let netChange = change;
        // If applying damage, check DR
        if (applyDr && netChange > 0 && this.system.ac.dr > 0) {
            netChange = Math.max(0, change - this.system.ac.dr);
        }
        // Did DR soak up all the damage?
        if (netChange == 0) {
            if (CONFIG.HYP3E.debugMessages) { console.log(`applyHealthChange: ${this.name} is unharmed!`) }
            return;
        }

        // Calculate updated health & apply it
        let newHp = oldHp - netChange;
        if (newHp < this.system.hp.min) {
            newHp = this.system.hp.min;
        } else if (newHp > this.system.hp.max) {
            newHp = this.system.hp.max;
        }
        try {
            await this.update({ "system.hp.value": newHp }, { async: true });
            if (CONFIG.HYP3E.debugMessages) { console.log(`applyHealthChange: ${this.name} took ${netChange} damage!`) }
            return;
        } catch (err) {
            console.error(`applyHealthChange: Error applying health change to ${this.name}:`, err);
            ui.notifications?.error(`Error applying health change to ${this.name}. See console log for details.`);
            return err;
        }
    }

    /**
     * Process temporary effects on the actor, including persistent damage. Disable any expired effects.
     */
    async processTemporaryEffects() {
        let totalDamage = 0;
        let damageMessages = [];
    
        // Collect updates to disable expired effects
        const expiredEffectUpdates = [];
    
        for (const effect of this.effects) {
            if (effect.isTemporary && !effect.disabled) {
                const persistentDamage = effect.changes.find(c => c.key === "system.tempPersistentDamage");
                if (persistentDamage) {
                    if (CONFIG.HYP3E.debugMessages) { console.log(`processTemporaryEffects: ${effect.name}`, persistentDamage); }
                    
                    const [damageType, rawDamageRoll] = persistentDamage.value.split(",");
                    const damageRollFormula = rawDamageRoll.replace(";", "").trim();
    
                    if (CONFIG.HYP3E.debugMessages) { console.log(`processTemporaryEffects: rolling ${damageRollFormula} ${damageType}`); }
    
                    const roll = new Roll(damageRollFormula);
                    await roll.evaluate();
    
                    if (CONFIG.HYP3E.debugMessages) { console.log(`processTemporaryEffects roll result:`, roll); }
    
                    totalDamage += roll.total;
    
                    damageMessages.push(`${this.name} takes ${roll.total} ${damageType} damage!`);
                }
    
                if (effect.duration.remaining != null && effect.duration.remaining <= 0) {
                    expiredEffectUpdates.push(effect);
                }
            }
        }
    
        // Apply total damage once
        if (totalDamage > 0) {
            await this.applyHealthChange(totalDamage, false);
    
            // Post all the damage messages together
            let chatContent = "Applying persistent damage effects...<ul><li>";
            chatContent += damageMessages.join("</li><li>");
            chatContent += "</li></ul>";
            await ChatMessage.create({
                author: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor: this }),
                content: chatContent
            });
        }
    
        // Update all expired effects
        if (expiredEffectUpdates.length > 0) {
            const updates = expiredEffectUpdates.map(effect => ({
                _id: effect.id,
                disabled: true,
                "duration.startRound": null,
                "duration.startTurn": null
            }));
            await this.updateEmbeddedDocuments("ActiveEffect", updates);
        }
            
        if (CONFIG.HYP3E.debugMessages) {
            console.log(`processTemporaryEffects: ${this.name} took ${totalDamage} total damage!`);
        }
    }
    
    /**
     * Use a consumable inventory item, decrementing its qty by 1
     * @param {*} itemId
     */
    async useItem(itemId) {
        if (CONFIG.HYP3E.debugMessages) { console.log("useItem: All actor items:", this.items) }
        const item = this.items?.get(itemId);
        if (CONFIG.HYP3E.debugMessages) { console.log("useItem: Using item:", item) }
        if (!item) {
            ui.notifications?.error(`Use Item: Item ${itemId} not found! See console log for details.`);
            if (CONFIG.HYP3E.debugMessages) {
                console.log(`useItem: Item ${itemId} not found!`)
                console.log(`useItem: Likely issue is that the item is owned by a token, but not the base actor.`)
                console.log(`useItem: This is most common with NPCs and monsters, if the GM drags an item or creates a new item directly in the token sheet.`)
            }
            return;
        }
        const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name
        let message = `<p>${this.name} used ${itemName}.</p>`
        // Decrement qty if it's consumable, otherwise just allow it to be used
        if (item.system.isConsumable && item.system.quantity.value > 0) {
            const newQuantity = item.system.quantity.value - 1;
            // Update the embedded item document
            this.updateEmbeddedDocuments("Item", [
                { _id: item.id, "system.quantity.value": newQuantity },
            ]);
        }
        // Send a chat message that the item was used
        const chatData = {
            author: game.user_id,
            content: message
        };
        ChatMessage.create(chatData, {});
    }

    /**
     * Execute an item check or attack roll
     * @param {*} dataset 
     */
    async rollItem(dataset) {
        // Get item info to execute a standard roll
        const item = this.items.get(dataset.itemId)
        dataset.roll = item.system.formula
        let itemName = item.system.friendlyName != "" ? item.system.friendlyName : item.name

        if (CONFIG.HYP3E.debugMessages) { console.log(`Rolling ${item.type} ${itemName}:`, item) }
        if (item.type == "weapon") {
            // Are we enforcing the weapon equippage rule for PCs?
            if (CONFIG.HYP3E.forceWeaponEquip && this.type == "character") {
                // Check if the weapon is equipped
                if (!item.system.equipped) {
                    ui.notifications.warn(`${itemName} is not equipped!`)
                    return
                }
            }
            // The default for weapons is an attack
            let mastery = "Attack"
            if (item.system.wpnGrandmaster) {
                mastery = "Grandmaster attack"
            } else if (item.system.wpnMaster) {
                mastery = "Master attack"
            }
            dataset.isGrenade = item.system.isGrenade
            dataset.isAreaEffect = item.system.isAreaEffect
            dataset.label = `${mastery} with ${itemName}`
            if (item.system.isAreaEffect) {
                dataset.details = `No attack roll required to use ${itemName}.`
                dataset.noRoll = true
            }
            this.rollAttackOrSpell(dataset)
        } else if (item.type == "spell") {
            // Are we enforcing the spell memorization rule for PCs?
            if (CONFIG.HYP3E.forceSpellMemorize && this.type == "character") {
                // Check if the spell is memorized
                if (item.system.quantity.value <= 0) {
                    ui.notifications.warn(`${itemName} is not memorized!`)
                    return
                }
            }
            // The default for spells is to cast
            dataset.label = `Cast spell ${itemName}`
            if (item.system.formula == "" || item.system.formula == undefined) {
                dataset.details = `No attack roll required to cast ${itemName}.`
                dataset.noRoll = true
            }
            this.rollAttackOrSpell(dataset)
        } else {  // ==> Neither a weapon nor a spell
            // The default for other item types (i.e. class abilities and actual items) is a check,
            //  followed by using inventory and applying applicable effects if the check succeeded
            //  or no check was required to proceed.
            let proceed = true
            let ranCheck = false
            dataset.label = `Using ${itemName}`
            if (item.system.formula && item.system.formula != "") {
                dataset.rollTarget = item.system.tn
                proceed = this.rollCheck(dataset)
                ranCheck = true
            }
            if (proceed) {
                // If a check was done, proceed immediately
                if (ranCheck) {
                    if (item.system.isConsumable) {
                        this.useItem(item.id)
                    }
                    if (item.effects.size > 0) {
                        item._displayItemInChat()
                    }
                } else {
                    // No item check, so we will popup a basic dialog to confirm use
                    if (item.effects.size > 0) {
                        let effectList = []
                        item.effects.forEach(effect => {
                            effectList.push(effect.name)
                        });
                        dataset.details = `Using ${itemName} applies the following: ${effectList.join(", ")}.`
                        dataset.noRoll = true
                    }
                    // let label = `${dataset.label}...`
                    dataset.rollButtonLabel = "Use Item"
                    // Log the dataset before the dialog renders
                    if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} dataset: `, dataset) }
                    try {
                        let rollResponse = await Hyp3eDialog.ShowBasicRollDialog(dataset)
                        if (item.system.isConsumable) {
                            this.useItem(item.id)
                        }
                        // Since we don't need to roll anything, just display the item in chat.
                        if (CONFIG.HYP3E.debugMessages) { console.log(`Roll response: `, rollResponse) }
                        item._displayItemInChat()
                    } catch(err) {
                        return
                    }
                }
            }
        }
    }

    /**
     * Execute an item macro
     * @param {*} itemUuid 
     */
    async rollMacro(itemUuid = null) {
        const dropData = {
            type: 'Item',
            uuid: itemUuid
        };
        // Load the item from the uuid.
        // wsAI not sure if geting the item this way is good or not.
        Item.fromDropData(dropData).then(item => {
            // Determine if the item loaded and if it's an owned item.
            if (!item || !item.parent) {
                const itemName = item?.name ?? itemUuid;
                return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
            }

            // Trigger the item roll
            if (CONFIG.HYP3E.debugMessages) { console.log(`Macro actor: `, this) }
            if (CONFIG.HYP3E.debugMessages) { console.log(`Macro item: `, item) }
            if (CONFIG.HYP3E.debugMessages) { console.log(`Rolling macro for ${item.type} ${item.name}:`, item) }

            // Create dataset object and start populating it
            let dataset = {}
            dataset.itemId = item.id
            dataset.actorId = this.id
            dataset.baseClass = this.system.baseClass
            dataset.roll = item.system.formula
            dataset.rollType = 'item'
            dataset.rollMode = item.system.rollMode
            // Execute the item roll
            this.rollItem(dataset)
        });
    }

    /**
     * Execute a basic roll directly from the actor sheet
     * @param {*} dataset 
     */
    async rollBasic(dataset) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`Rolling ${dataset.label}...`) }

        let rollResponse
        let label = `${dataset.label}...`
        dataset.rollButtonLabel = "Roll"

        // Log the dataset before the dialog renders
        if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} dataset: `, dataset) }
        try {
            rollResponse = await Hyp3eDialog.ShowBasicRollDialog(dataset)
        } catch(err) {
            return
        }

        // Add situational modifier from the dice dialog
        const rollFormula = `${dataset.roll} + ${rollResponse.sitMod}`
        
        // Roll the dice!
        let roll = new Roll(rollFormula, this.getRollData())
        // Resolve the roll
        let result = await roll.roll()
        if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} roll result: `, result) }

        // Output roll result to a chat message
        this.sendRollToChat(roll, label, "", rollResponse.rollMode)
        
        return roll
    }

    /**
     * Execute a reaction roll directly from the actor sheet
     * @param {*} dataset 
     */
    async rollReaction(dataset) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`Rolling ${dataset.label}...`) }

        let rollResponse
        let label = `${dataset.label}...`
        dataset.rollButtonLabel = "Roll Reaction"

        // Log the dataset before the dialog renders
        if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} dataset: `, dataset) }
        try {
            rollResponse = await Hyp3eDialog.ShowBasicRollDialog(dataset)
        } catch(err) {
            return
        }

        // Add situational modifier from the dice dialog
        const rollFormula = `${dataset.roll} + ${rollResponse.sitMod}`
        
        // Roll the dice!
        let roll = new Roll(rollFormula, this.getRollData())
        // Resolve the roll
        let result = await roll.roll()
        if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} roll result: `, result) }
        // The roll shouldn't go below zero, even if modifiers would make it so
        let rollTotal = roll.total
        if (rollTotal < 0) { rollTotal = 0 }

        let reaction = this._valueFromTable(this.reactionTable, rollTotal)
        if (CONFIG.HYP3E.debugMessages) { console.log(reaction) }
        label += `<br /><b>${reaction}</b>`

        // Output roll result to a chat message
        this.sendRollToChat(roll, label, "", rollResponse.rollMode)
        
        return roll
    }

    /**
     * Execute a check roll directly from the actor sheet
     * @param {*} dataset 
     */
    async rollCheck(dataset) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`Rolling ${dataset.label}...`) }

        // Declare vars
        let tokenId = ""
        let itemId = ""
        let itemName = ""
        let label = ""
        let checkText = dataset.label
        let rollFormula = ""
        let rollResponse
        let success = true

        // Did we get a token ID?
        if (dataset.tokenId) {
            // Get the token ID from the dataset
            tokenId = dataset.tokenId
            // Get the token from the canvas
            const token = canvas.tokens.get(tokenId)
            if (CONFIG.HYP3E.debugMessages) { console.log(`Token (ID ${tokenId}): `, token) }
            if (token) {
                // Get the token's actor
                const tokenActor = token.actor
                if (CONFIG.HYP3E.debugMessages) { console.log(`Token actor: `, tokenActor) }
            }
        }

        // Is this an item or ability check?
        const item = this.items.get(dataset.itemId) ?? null
        if (item) {
            itemId = item.id
            itemName = item.system.friendlyName != "" ? item.system.friendlyName : item.name
            // let label = `<img src="${item.img}" style="border: none; float: left; padding: 3px 0;" width="24px"> <span style="padding: 3px 3px;">${dataset.label}...</span>`
            // let label = `<img src="${item.img}" style="border: none; float: left; padding: 3px 0;" width="24px"> <span style="padding: 3px 3px;">${itemName}</span>`
            label = `
            <hr class="plain-hr" />
            <div style="margin: 10px 0;">
                <img src="${item.img}" style="border: none; float: left;" width="24px" height="24px">
                <span style="text-align: left; font-size: 12pt; font-weight: bold; margin-left: 6px;">
                    ${itemName}
                </span>
            </div>
            <hr class="plain-hr" />`
        }

        // Determine whether we have a valid target number or formula
        if (dataset.rollTarget == '' || dataset.rollTarget == undefined || dataset.rollTarget <= 0) {
            console.log("Missing or invalid target number, cannot confirm success of check!")
            ui.notifications.info("Missing or invalid target number, cannot confirm success of check!")
            return false
        }

        // Retrieve roll data from the actor
        const rollData = this.getRollData();
        if (CONFIG.HYP3E.debugMessages) { console.log("Actor roll data:", rollData) }

        // Get the item's ID and friendly name if it has one
        if (item) {
            // Determine the roll-button label to use
            switch (item.type) {
                case "item":
                    dataset.rollButtonLabel = "Use Item"
                    break
                case "feature":
                    dataset.rollButtonLabel = "Use Ability"
                    break
                default:
                    dataset.rollButtonLabel = "Use"
                    break
            }
        } else {
            dataset.rollButtonLabel = "Roll"
        }

        // This is needed for Turn Undead results
        let turnUndeadHtml = ""
    
        // Resolve target formula to a number, if necessary
        const targetRoll = new Roll(dataset.rollTarget, rollData)
        await targetRoll.roll()
        if (CONFIG.HYP3E.debugMessages) {
            console.log(`Check target formula: ${dataset.rollTarget} evaluates to ${targetRoll.formula} = ${targetRoll.total}`)
            console.log("Target formula eval: ", targetRoll)
        }
        // Override rollTarget, even if it has the same value
        dataset.rollTarget = targetRoll.total
        // label += ` (target ${targetRoll.total})`
        checkText += ` (target ${targetRoll.total})... `

        // Log the dataset before the dialog renders
        if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} dataset: `, dataset) }
        try {
            rollResponse = await Hyp3eDialog.ShowBasicRollDialog(dataset)
        } catch(err) {
            return false
        }

        // Add/subtract situational modifier from the dice dialog
        if (CONFIG.HYP3E.flipRollUnderMods) {
            rollFormula = `${dataset.roll} - ${rollResponse.sitMod}`
        } else {
            rollFormula = `${dataset.roll} + ${rollResponse.sitMod}`
        }

        // Roll the dice!
        let roll = new Roll(rollFormula, rollData)
        // Resolve the roll
        let result = await roll.roll()
        if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} roll result: `, result) }

        // We use simple word parsing in the ability name to determine if this is a cleric turning undead
        let turnUndead = false
        let itemNameLower = itemName.toLowerCase()
        if (itemNameLower.indexOf("turn") >= 0 && itemNameLower.indexOf("undead") >= 0) {
            turnUndead = true
            // If we are turning undead, that resolution is executed separately...
        }

        // Determine success or failure on a simple check, not turning undead
        if (!turnUndead) {
            if (roll.total <= dataset.rollTarget) {
                if (CONFIG.HYP3E.debugMessages) { console.log(roll.total + " is less than or equal to " + dataset.rollTarget + "!") }
                // label += "<br /><b>Success!</b>"
                checkText += "<b>Success!</b>"
                success = true
        
            } else {
                if (CONFIG.HYP3E.debugMessages) { console.log(roll.total + " is greater than " + dataset.rollTarget + "!") }
                // label += "<br /><b>Fail.</b>"
                checkText += "<b>Fail.</b>"
                success = false
            }
        } else {
            // Resolve the results of the attempted turning undead
            turnUndeadHtml = this.resolveTurnUndead(roll.total, rollData)
            success = true
        }
        // Hit must be false so we don't display any damage buttons
        roll.hit = false

        // Construct a custom chat card for the check
        await this.renderCustomChat(roll, item, tokenId, label, "", checkText, turnUndeadHtml, rollResponse.rollMode)

        return success
    }

    /**
     * Use an item to apply its effects to the owner or another target
     * @param {*} dataset 
     */
    async rollApplyEffects(dataset) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`rollApplyEffects: ${dataset.label}...`) }

        const item = this.items.get(dataset.itemId)
        let label = `${dataset.label}...`
        dataset.rollButtonLabel = "Use Item"

        // Log the dataset before the dialog renders
        if (CONFIG.HYP3E.debugMessages) { console.log(`rollApplyEffects: ${dataset.label} dataset: `, dataset) }
        try {
            let rollResponse = await Hyp3eDialog.ShowBasicRollDialog(dataset)
            // Since we don't need to roll anything, just display the item in chat.
            if (CONFIG.HYP3E.debugMessages) { console.log(`rollApplyEffects: roll response: `, rollResponse) }
            item._displayItemInChat()
        } catch(err) {
            return
        }

    }

    /**
     * Execute an attack roll or cast a spell
     * @param {*} dataset 
     */
    async rollAttackOrSpell(dataset) {

        // Declare vars
        let tokenId = ""
        let attacker, target = null
        let rollFormula = ""
        let rollResponse
        let naturalRoll = 0
        let ammoMods = {}
        let ranges = {}
        let rangeGroup = ""
        let chosen = ""
        let targetAc = 9
        let targetName = ""
        let targetSize = ""
        let gridDistance = 0
        let debugAtkRollFormula = ""
        let itemName = ""
        let label = ""
        let attackText = ""

        // Log the dataset and item (if any) before proceeding
        if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Rolling ${dataset.label}...`) }
        if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: ${dataset.label} dataset: `, dataset) }

        // Did we get a token ID? For NPCs and monsters this should pretty much always be true,
        //  but for PCs, it may not be true if the attack was made from the macro bar.
        if (dataset.tokenId) {
            // Get the token ID from the dataset
            tokenId = dataset.tokenId
            // Get the token from the canvas
            // const token = canvas.tokens.get(tokenId)
            attacker = canvas.tokens.get(tokenId)
            if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Token (ID ${tokenId}): `, attacker) }
            if (attacker) {
                // Log the token's actor
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Token actor: `, attacker.actor) }
            }
        }

        // Is this an item-based attack?
        const item = this.items.get(dataset.itemId) ?? null
        if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Item:", item) }
        const itemData = item ? {...item.system} : null
        if (item) {
            // Get the item's friendly name if it has one
            itemName = itemData.friendlyName != "" ? itemData.friendlyName : item.name
            dataset.itemName = itemName
            if (item.type == "weapon") {
                // The default for weapons is an attack
                attackText = "Attack"
                // if (item.system.wpnGrandmaster) {
                //     attackText = "Grandmaster attack"
                // } else if (item.system.wpnMaster) {
                //     attackText = "Master attack"
                // }
            } else if (item.type == "spell") {
                attackText = "Cast spell"
            }
        }
        if (itemData) {
            itemData.itemType = item.type
        }
        if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Item roll data:", itemData) }

        // Retrieve roll data from the actor
        const actorData = this.getRollData()
        if (actorData) {
            actorData.actorType = this.type
        }
        if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Actor roll data:", actorData) }

        // let label = `<img src="${item.img}" style="border: none; float: left; padding: 3px 0;" width="24px"> <span style="padding: 3px 3px;">${dataset.label}</span>`
        label = `
        <hr class="plain-hr" />
        <div style="margin: 10px 0;">
            <img src="${item.img}" style="border: none; float: left;" width="24px" height="24px">
            <span style="text-align: left; font-size: 12pt; font-weight: bold; margin-left: 6px;">
                ${itemName}
            </span>
        </div>
        <hr class="plain-hr" />`

        // Filter the actor's inventory items for ammunition
        let ammoList = this.items.filter(i => i.system.isAmmunition)
        if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Carried ammo: ", ammoList) }
        let carriedAmmo = {"":""}
        if (ammoList.length > 0) {
            for (let ammo of ammoList) {
                if (ammo.system.quantity.value > 0) {
                    carriedAmmo[ammo._id] = `${ammo.name} (${ammo.system.quantity.value})`
                }
            }
        }

        // Get the range unit of measure for the scene
        dataset.rangeUoM = canvas.scene?.grid.units ? canvas.scene?.grid.units : "ft";

        // // Get the attacking token's location on the scene
        // // const attacker = canvas.tokens.placeables.find(t => t.actor && t.actor.id === this.id);
        // // Try to get the attacking token

        // No token in the incoming dataset, so we need to find it. If the actor is linked to a token, 
        //  use that token.
        if (!attacker) {
            if (this.token) {
                // Get the token from the actor, if it is linked
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Attacker actual token:`, this.token) }
                attacker = this.token
            } else {
                // No token in the dataset and no linked token, so we need to find it.
                // Get the first matching token based on actorId. This works fine for player characters
                //  but not so well for NPCs. It will always return the first token that matches the actor ID,
                //  and with unlinked tokens, there may be multiple actors with the same ID. So we need to 
                //  filter out unlinked tokens and deal with them separately.
                const tempToken = canvas.tokens.placeables.find(t => t.document.isLinked && t.actor && t.actor.id === this.id);
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Attacker discovered token:`, tempToken) }
                attacker = tempToken ? tempToken : null
            }
        }
        // If we still have no attacker, check if the user has a controlled token. Ideally this should
        //  never happen, but it can if the actor is not linked to a token and the user has multiple tokens
        //  selected. This is preferred for GMs who may have multiple tokens selected.
        if (!attacker && canvas.tokens.controlled[0]) {
            // Get the currently selected token, since the actor was not attached to one. To do this, 
            //  we get the first controlled token. This is preferred for GMs who may have multiple tokens
            //  selected. Players running multiple characters will need to select the correct token before 
            //  rolling.
            if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Player-controlled token:`, canvas.tokens.controlled[0]) }
            attacker = canvas.tokens.controlled[0]
        }

        const attackerPos = attacker ? attacker.center : null
        if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Attacker position:", attackerPos) }

        // Has the user targeted a token? If so, get it's AC and name
        const userTargets = Array.from(game.user.targets)
        // let target
        if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Target Actor Data:", userTargets) }
        if (userTargets.length > 0) {
            target = userTargets[0]
            const targetPos = target.center
            if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Target position:", targetPos) }
            const primaryTargetData = target.actor
            targetAc = primaryTargetData.system.ac.value
            targetName = primaryTargetData.name
            targetSize = primaryTargetData.system.size ? primaryTargetData.system.size : "M"

            // Calculate the distance to the target in pixels
            const dx = targetPos.x - attackerPos.x;
            const dy = targetPos.y - attackerPos.y;
            const distancePixels = Math.sqrt(dx * dx + dy * dy);
            // Convert to grid distance
            gridDistance = (distancePixels / canvas.grid.size) * canvas.scene.grid.distance;
            // Round to nearest whole number
            gridDistance = Math.round(gridDistance)
            // Adjust distance downward based on token size
            if (targetSize == "L") {
                gridDistance -= 5
            } else if (targetSize == "H") {
                gridDistance -= 10
            }
            // If the distance is negative, set it to 0
            if (gridDistance < 0) {
                gridDistance = 0
            }
            if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Distance to target:", gridDistance) }
            dataset.gridDistance = gridDistance
            dataset.range = `${gridDistance} ${canvas.scene.grid.units}`;
        } else {
            // No target selected, so we can't get AC or name
            targetAc = 9
            targetName = ""
            targetSize = ""
            dataset.range = "No target!"
            if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: No target selected!") }
            // Popup a notification if this is an untargeted weapon or spell attack
            if (item && (item.type == "weapon" || (item.type == "spell" && itemData.atkRoll))) {
                ui.notifications.info("No target selected!")
            }
        }

        if (item) {
            // const itemMods = this._parseItemMod(itemName)
            // Melee weapons have a range based on their weapon class
            if (itemData.melee) {
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Weapon class:`, itemData.wc) }
                if (itemData.wc <= 3) {
                    // We need to allow for diagonal distances, so range 5 => 8
                    dataset.meleeRange = 8
                } else if (itemData.wc <= 5) {
                    // Range 10 => 14
                    dataset.meleeRange = 14
                } else {
                    //itemData.wc == 6
                    // Range 15 => 20
                    dataset.meleeRange = 20
                }
                if (gridDistance > dataset.meleeRange) {
                    if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Target is beyond melee range! Calculated distance is ${gridDistance} ft.`) }
                    ui.notifications.warn(`Target is beyond melee range! Calculated distance is ${gridDistance} ft.`)
                    if (CONFIG.HYP3E.forceRangeLimit) {
                        // If the target is out of range, prevent the attack from proceeding
                        return
                    }
                }
            }
            // Missile weapons need to show a range selector in the dialog
            if (itemData.missile) {
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Range increments:`, itemData.range) }
                dataset.showAmmo = itemData?.usesAmmo ? itemData?.usesAmmo : false
                dataset.showRanges = true
                rangeGroup = "rangeGroup"
                ranges = {
                    short: `Short (${itemData.range.short})`,
                    medium: `Med (${itemData.range.medium})`,
                    long: `Long (${itemData.range.long})`
                }
                // Where does our range fall in the range categories?
                if (gridDistance <= itemData.range.short) {
                    chosen = "short"
                    if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Target is at short range. Calculated distance is ${gridDistance} ft.`) }
                } else if (gridDistance <= itemData.range.medium) {
                    chosen = "medium"
                    if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Target is at medium range. Calculated distance is ${gridDistance} ft.`) }
                } else if (gridDistance <= itemData.range.long) {
                    chosen = "long"
                    if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Target is at long range. Calculated distance is ${gridDistance} ft.`) }
                } else {
                    // If the range is longer than the long range, give a warning
                    chosen = "long"
                    if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Target is out of range! Calculated distance is ${gridDistance} ft.`) }
                    ui.notifications.warn(`Target is out of range! Calculated distance is ${gridDistance} ft.`)
                    if (CONFIG.HYP3E.forceRangeLimit) {
                        // If the target is out of range, prevent the attack from proceeding
                        return
                    }
                }
            }
            if (itemData.itemType == "spell" && itemData.atkRoll) {
                dataset.showSpellRange = true
                dataset.spellRange = itemData.range
                // Get distance to target and compare with spell range
                let spellRange = this._parseSpellRange(itemData.range)
                if (gridDistance > spellRange) {
                    // If the target is out of range, give a warning
                    if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Target is out of range! Calculated distance is ${gridDistance} ft.`) }
                    ui.notifications.warn(`Target is out of range! Calculated distance is ${gridDistance} ft.`)
                    if (CONFIG.HYP3E.forceRangeLimit) {
                        // If the target is out of range, prevent the attack from proceeding
                        return
                    }
                }
            }
        }

        // Initialize sitMod and sitModList
        dataset.sitMod = 0
        dataset.sitModList = ""

        // Get any situational modifiers that can be detected from token status or other means
        if (game.settings.get(game.system.id, "enableCombatSitModDetection")) {
            let sitModObj = this._getCombatantSitMods(attacker, target)
            if (sitModObj.sitModList  && sitModObj?.sitModList != "") {
                if (dataset.sitModList != "") {
                    dataset.sitModList += ", "
                }
                dataset.sitMod = parseInt(dataset.sitMod) + parseInt(sitModObj?.sitMod)
                dataset.sitModList += sitModObj?.sitModList
            }
        }

        // Show the roll dialog (type and item-dependent)
        if (!item) {
            // Since removing the basic attack from Fighting Ability, this should not be needed
            try {
                rollResponse = await Hyp3eDialog.ShowAttackRollDialog(dataset)
            } catch(err) {
                return
            }
        } else if (item && item.type == "weapon") {
            try {
                rollResponse = await Hyp3eDialog.ShowAttackRollDialog(dataset, carriedAmmo, rangeGroup, ranges, chosen)
            } catch(err) {
                if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: ERROR: ", err) }
                return
            }
        } else if (item && item.type == "spell") {
            try {
                rollResponse = await Hyp3eDialog.ShowSpellcastingDialog(dataset)
            } catch(err) {
                if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: ERROR: ", err) }
                return
            }
            // Decrement the number memorized
            if (item.type == "spell" && itemData.quantity.value > 0) {
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Cast memorized spell: ${item.name}`) }
                // Update the embedded item document
                this.updateEmbeddedDocuments("Item", [
                    { _id: item.id, "system.quantity.value": itemData.quantity.value-1 },
                ])
            }
        }

        // Log the roll-dialog response
        if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Dialog response:", rollResponse) }

        // Decrement ammunition if selected in the attack dialog
        // if (item && item.type == "weapon" && itemData.usesAmmo && rollResponse.ammunition) {
        if (item && item.type == "weapon" && rollResponse.ammunition) {
            const ammo = this.items.get(rollResponse.ammunition)
            const ammoData = ammo ? {...ammo.system} : null
            if (ammo && ammoData) {
                ammoMods = this._parseItemMod(ammo.name)
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Use ammo: ${ammo.name}`, ammoData) }
                // Update the embedded item document
                this.updateEmbeddedDocuments("Item", [
                    { _id: ammo.id, "system.quantity.value": ammoData.quantity.value-1 },
                ])
            }
        }

        // Add situational modifier and roll mode from the dialog
        dataset.sitMod = rollResponse.sitMod
        dataset.rollMode = rollResponse.rollMode
        // Did we get a range modifier from the dialog?
        if (rollResponse.rangeGroup != "") {
            switch (rollResponse.rangeGroup) {
                case "short":
                    dataset.rangeMod = 0
                    break
                case "medium":
                    dataset.rangeMod = -2
                    break
                case "long":
                    dataset.rangeMod = -5
                    break
            }
        }

        // Does the item have an attack formula?
        if (item) {
            // If there's no item roll formula (typically a spell), send a chat message and exit
            if (!itemData.formula) {
                item._displayItemInChat()
                return null
            }
        }

        // Construct our attack roll formula
        const atkObj = Hyp3eDice.buildAttackFormula(dataset, itemData, ammoMods, actorData)
        rollFormula = atkObj.formula
        debugAtkRollFormula = atkObj.debugFormula
        if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Final attack formula:", rollFormula) }

        // Roll the dice!
        let atkRoll = new Roll(rollFormula, actorData)
        if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Attack roll: ", atkRoll) }
        // Resolve the roll
        let result = await atkRoll.roll()
        if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Roll result: ", result) }
        // Get d20 natural roll
        naturalRoll = atkRoll.dice[0].total

        // Update chat card label based on whether we have a target
        if (targetName != "") {
            // label += ` vs. ${targetName}...`
            attackText += ` vs. ${targetName}...`
        } else {
            // label += `...`
            attackText += `...`
        }

        // Footer used for adding crit buttons (if enabled)
        let critFooterHTML = "";

        // Determine hit or miss
        let hit = false
        let tn = 31 // some fake number just to initialize the variable
        if (!itemData.isGrenade) {
            // If this is a normal attack, TN is based on target's AC
            tn = 20 - targetAc
            if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Attack roll ${atkRoll.total} hits AC [20 - ${atkRoll.total} => ] ${eval(20 - atkRoll.total)}`) }
            if (naturalRoll == 20) {
                if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Natural 20 always crit hits!") }
                // label += `<br /><span style='color:#00b34c'><b>Critical Hit!</b></span>`
                attackText += `<span style='color:#00b34c'><b>Critical Hit!</b></span>`
                hit = true
                if (game.settings.get(game.system.id, "critHit") && item) {
                    // critFooterHTML += `<div class='critical-hit' data-base-class='${this.system.baseClass}'><h4>Critical Hit:</h4></div>`;
                    critFooterHTML += `<div class='critical-hit' data-base-class='${this.system.baseClass}' data-actor-id='${this.id}'></div>`;
                }
            } else if (naturalRoll == 1) {
                if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Natural 1 always crit misses!") }
                // label += "<br /><span style='color:#e90000'><b>Critical Miss!</b></span>"
                attackText += "<span style='color:#e90000'><b>Critical Miss!</b></span>"

                if (game.settings.get(game.system.id, "critMiss") && item) {
                    // critFooterHTML += `<div class='critical-miss' data-base-class='${this.system.baseClass}'><h4>Xathoqqua’s Woe:</h4></div>`;
                    critFooterHTML += `<div class='critical-miss' data-base-class='${this.system.baseClass}' data-actor-id='${this.id}'></div>`;
                }
            } else if (atkRoll.total >= tn) {
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Hit! Attack roll ${atkRoll.total} is greater than or equal to [20 - ${targetAc} => ] ${tn}.`) }
                // label += `<br /><b>Hits AC ${eval(20 - atkRoll.total)}!</b>`
                attackText += `<b>Hits AC ${eval(20 - atkRoll.total)}!</b>`
                hit = true
            } else {
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Miss! Attack roll ${atkRoll.total} is less than [20 - ${targetAc} => ] ${tn}.`) }
                if (eval(20 - atkRoll.total) <= 9) {
                    // label += `<br /><b>Miss, would have hit AC ${eval(20 - atkRoll.total)}.</b>`
                    attackText += `<b>Miss, would have hit AC ${eval(20 - atkRoll.total)}.</b>`
                } else {
                    // label += `<br /><b>Misses AC 9.</b>`
                    attackText += `<b>Misses AC 9.</b>`
                }
            }

        } else {
            // This is a grenade-like attack
            let sizeFromTable = ""
            switch (targetSize) {
                case "S":
                    sizeFromTable = "Small"
                    tn = 13
                    break
                case "M":
                    sizeFromTable = "Medium"
                    tn = 11
                    break
                case "L":
                    sizeFromTable = "Large"
                    tn = 9
                    break
                default:
                    // No target selected (or no size specified), assume an area or object
                    sizeFromTable = "Stationary"
                    tn = 7
                    break
                }
            if (atkRoll.total >= tn) {
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Hit! Attack roll ${atkRoll.total} is greater than or equal to ${tn}.`) }
                // label += `<br /><b>Hits a ${sizeFromTable} target!</b>`
                attackText += `<b>Hits a ${sizeFromTable} target!</b>`
                hit = true
            } else {
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell: Miss! Attack roll ${atkRoll.total} is less than ${tn}.`) }
                // label += `<br /><b>Misses a ${sizeFromTable} target.</b>`
                attackText += `<b>Misses a ${sizeFromTable} target.</b>`
            }
        }
        // Pass hit status to the attack chat
        atkRoll.hit = hit

        // If the item attack hit, calculate the damage formula and include it in the chat message
        if (hit && item) {
            if (Roll.validate(itemData.damage)) {
                // Build our primary damage formula
                const dmgObj = Hyp3eDice.buildDamageFormula(itemData, ammoMods, actorData)
                item.dmgFormula = dmgObj.formula
                item.debugDmgRollFormula = dmgObj.debugFormula
                if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Damage formula:", item.dmgFormula) }
                // Do we have 2-hand damage?
                if (item.system.damage2h > "") {
                    item.dmgFormula2h = dmgObj.formula2h
                    item.debugDmgRollFormula2h = dmgObj.debugFormula2h
                    if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Damage formula 2H:", item.dmgFormula2h) }
                }
            }
        }

        // Construct a custom chat card for the attack
        await this.renderCustomChat(atkRoll, item, tokenId, label, debugAtkRollFormula, attackText, critFooterHTML, rollResponse.rollMode);

        return atkRoll
    }

    /**
     * Execute a saving throw
     * @param {*} dataset 
     */
    async rollSave(dataset) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`Rolling ${dataset.label}...`) }

        let saveRollParts = []
        let rollFormula = ""
        let rollResponse
        let label = `${dataset.label}...`

        if (this.type == "character") {
            // Get the character's saving throw modifiers
            dataset.avoidMod = this.system.attributes.dex.defMod
            dataset.poisonMod = this.system.attributes.con.poisRadMod
            dataset.willMod = this.system.attributes.wis.willMod

            // Log the dataset before the dialog renders
            if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} dataset: `, dataset) }
            try {
                rollResponse = await Hyp3eDialog.ShowSaveRollDialog(dataset)
            } catch(err) {
                return
            }

            // Default basic save with only sit mod from dice dialog
            saveRollParts.push(dataset.roll)

            // Get saving throw modifer if one was selected
            if (rollResponse.avoidMod) {
                saveRollParts.push(rollResponse.avoidMod)
                label = `${dataset.label} with Avoidance modifier...`
            }
            if (rollResponse.poisonMod) {
                saveRollParts.push(rollResponse.poisonMod)
                label = `${dataset.label} with Poison/Radiation modifier...`
            }
            if (rollResponse.willMod) {
                saveRollParts.push(rollResponse.willMod)
                label = `${dataset.label} with Willpower modifier...`
            }
        } else {
            // NPC/monster save, no attribute-based mods
            dataset.rollButtonLabel = "Roll Save"
            // Log the dataset before the dialog renders
            if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} dataset: `, dataset) }
            try {
                rollResponse = await Hyp3eDialog.ShowBasicRollDialog(dataset);
                // Default basic save with only sit mod from dice dialog
                saveRollParts.push(dataset.roll)
            } catch(err) {
                return
            }
        }

        // Add situational modifier from the dice dialog
        saveRollParts.push(rollResponse.sitMod)

        // Construct our save roll formula
        rollFormula = saveRollParts.join(" + ")
        if (CONFIG.HYP3E.debugMessages) {
            console.log("Save roll parts:", saveRollParts)
            console.log("Save formula:", rollFormula)
        }

        // Roll the dice!
        let roll = new Roll(rollFormula, this.getRollData())
        // Resolve the roll
        let result = await roll.roll()
        if (CONFIG.HYP3E.debugMessages) { console.log("Roll result: ", result) }
        // Determine success or failure
        if (roll.total >= dataset.rollTarget) {
            if (CONFIG.HYP3E.debugMessages) { console.log(roll.total + " is greater than or equal to " + dataset.rollTarget + "!") }
            label += "<br /><b>Success!</b>"
        } else {
            if (CONFIG.HYP3E.debugMessages) { console.log(roll.total + " is less than " + dataset.rollTarget + "!") }
            label += "<br /><b>Fail.</b>"
        }

        // Output roll result to a chat message
        this.sendRollToChat(roll, label, "", rollResponse.rollMode)

        return roll
    }

    /**
     * Execute a hit-die roll directly from the npc-actor sheet
     * @param {*} dataset 
     */
    async rollHD() {
        if (this.type !== 'npc') return;
        if (!this.system.hd){
            if (CONFIG.HYP3E.debugMessages) { console.log("rollHD: No HD value to roll!") }
            return;
        }
        if (CONFIG.HYP3E.debugMessages) { console.log(`rollHD: Rolling HD ${this.system.hd}...`) }
        const roll = new Roll(this.system.hd);
        await roll.roll();
        if (roll != undefined && roll.total != undefined) {
            const newHealth = roll.total;
            await this.update({
                system: {
                hp: {
                    value: newHealth,
                    max: newHealth
                }
                }
            });
        } else {
            if (CONFIG.HYP3E.debugMessages) { console.log("rollHD: Roll failed, no total value!") }
        }
    }

    /**
     * Execute a hit-point increase (hit die + CN roll) directly from the character-actor sheet
     * @param {*} dataset 
     */
    async rollHP() {
        if (this.type !== 'character') return;
        if (!this.system.hd){
            if (CONFIG.HYP3E.debugMessages) { console.log("rollHP: No HD value to roll!") }
            return;
        }
        if (CONFIG.HYP3E.debugMessages) { console.log(`rollHP: Rolling HD ${this.system.hd} + ${this.system.attributes.con.hpMod}...`) }
        const roll = new Roll(`${this.system.hd} + ${this.system.attributes.con.hpMod}`);
        await roll.roll();
        if (CONFIG.HYP3E.debugMessages) { console.log("rollHP: Roll result: ", roll) }
        if (roll != undefined && roll.total != undefined) {
            const hpIncrease = roll.total;
            const newHealth = parseInt(this.system.hp.value) + hpIncrease;
            const newMax = parseInt(this.system.hp.max) + hpIncrease;
            // Log the update
            if (CONFIG.HYP3E.debugMessages) { console.log("rollHP: Updated HP:", newHealth, "Max HP:", newMax) }
            await this.update({
                system: {
                    hp: {
                        value: newHealth,
                        max: newMax
                    }
                }
            });
        } else {
            if (CONFIG.HYP3E.debugMessages) { console.log("rollHP: Roll failed, no total value!") }
        }
    }

    // Build the chat message for turning undead
    resolveTurnUndead(rollTotal, rollData) {
        /*
        Turning Undead
        ==============
        Cross-reference the cleric (or sub-class) TA and die roll against the Turn Undead table to determine possible 
        results, and output those to the chat.
        We can just use the actor's TA and dynamically calculate the results row from the Turn Undead table, since the 
        minimum value for success is always a target number of 10, affecting undead at Type [TA - 1].
        
        Logic:
        - If TA is 1, it is possible to completely fail.
        - If TA is 2 or higher, we have the chance for an automatic turn of undead.
        - As long as we have some kind of success, we always roll 2d6 for the number of undead affected (except if 
        TA >= 7, see below).
        - If TA >= 2, then it is possible that some undead will be turned automatically without even requiring a roll.
        - If TA >= 4, it is possible that lower-Type undead may be Destroyed.
        - If TA >= 7, it is possible that some lower-Type undead may be Utterly Destroyed. All this does is change the 
        number affected from 2d6 to 1d6+6, thus increasing the average roll.

        Example: a cleric with TA of 5 can turn undead up to Type 3 automatically, turn undead of 
        type 4 with a target number of 10, type 5 with a target number of 7, type 6 with a target 
        number of 4, and finally type 7 with a target number of 1.
        Knowing that all TA numbers calculate the same way, we know that:
        - A target number of 10 will turn undead of Type [cleric TA - 1].
        - A target number of 7 will turn undead of Type [cleric TA].
        - A TN of 4 affects undead of Type [cleric TA + 1].
        - And a TN of 1 affects undead of Type [cleric TA + 2].
        And with all of this information, we can also calculate the Types of undead that may be 
        Turned automatically (undead Type == [cleric TA] - 2), or Destroyed (undead Type == 
        [cleric TA] - 4), or Ultimately Destroyed (undead Type == [cleric TA] - 7).
        */
        let turnUndeadHtml = ''
        let orLess = ''
        let results = []
        let rollAffected = '2d6'
    
        // Was this a complete fail?
        if (rollData.ta <= 1 && rollTotal > 10) {
            return 'No undead were turned...'
        }

        // From here on it's all some level of success
        if (rollTotal <= 1) {
            if ((rollData.ta+2) > 0) { orLess = 'or less ' }
            results.push(`<li>Undead of Type ${rollData.ta+2} ${orLess}are <b>turned</b>.</li>`)
        } else if (rollTotal <= 4) {
            if ((rollData.ta+1) > 0) { orLess = 'or less ' }
            results.push(`<li>Undead of Type ${rollData.ta+1} ${orLess}are <b>turned</b>.</li>`)
        } else if (rollTotal <= 7) {
            if ((rollData.ta) > 0) { orLess = 'or less ' }
            results.push(`<li>Undead of Type ${rollData.ta} ${orLess}are <b>turned</b>.</li>`)
        } else if (rollTotal <= 10) {
            if ((rollData.ta-1) > 0) { orLess = 'or less ' }
            results.push(`<li>Undead of Type ${rollData.ta-1} ${orLess}are <b>turned</b>.</li>`)
        } else {
            // Even a roll of 11 or 12 is still successful against weaker undead
            if ((rollData.ta-2) > 0) { orLess = 'or less ' }
            results.push(`<li>Undead of Type ${rollData.ta-2} ${orLess}are <b>turned</b>.</li>`)
        }
        // Reset orLess
        orLess = ''
        // At TA 4+, the cleric can actually destroy undead
        if (rollData.ta >= 4) {
            if ((rollData.ta-4) > 0) { orLess = 'or less ' }
            results.push(`<li>Undead of Type ${rollData.ta-4} ${orLess}are <b>destroyed</b>.</li>`)
        }
            // At TA 7+, the cleric is so powerful that his number affected is greatly improved
            if (rollData.ta >= 7) {
            rollAffected = '1d6+6'
        }

        // Now we can setup our description output from the results
        turnUndeadHtml = `Roll [[/r ${rollAffected}]] for the total number of undead affected. Starting from the weakest (lowest Type)...<ul>`
        for (let i = results.length-1; i >=0; i--) {
            turnUndeadHtml += results[i]
        }
        turnUndeadHtml += `</ul>`

        if (CONFIG.HYP3E.debugMessages) { console.log("Turn Undead: ", turnUndeadHtml) }
        return turnUndeadHtml
    }

    // Send roll results to the chat window
    sendRollToChat(roll, label, content, rollMode) {
        // Prettify label
        // label = "<h3>" + label + "</h3>"
        label = "<div class='medium'>" + label + "</div>"

        // Send to chat
        roll.toMessage({
            author: game.user_id,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            flavor: label,
            content: content
        },{
            rollMode: rollMode
        })
    }

    // Render custom html for attacks and turning undead
    async renderCustomChat(roll, item, tokenId, label, debugRollFormula, headerHTML, footerHTML, rollMode) {
        // Prettify label
        // label = "<h3>" + label + "</h3>"
        label = "<div class='medium'>" + label + "</div>"
        headerHTML = "<div class='medium'>" + headerHTML + "</div>"
        footerHTML = "<div class='medium'>" + footerHTML + "</div>"

        const templateData = {
            roll: roll,
            headerHTML: headerHTML,
            debugRollFormula: debugRollFormula,
            item: item,
            actorId: this.id,
            tokenId: tokenId,
            footerHTML: footerHTML,
        };

        const template = `${HYP3E.templatePath}/chat/attack-roll.hbs`;
        let customChat = await renderTemplate(template, templateData);

        // Send to chat
        roll.toMessage({
            author: game.user_id,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            flavor: label,
            content: customChat
        },{
            rollMode: rollMode
        })
    }

    // Render html template for damage rolls
    // async renderDamageChat(dmgRoll, debugDmgRollFormula, naturalDmgRoll, dmgBaseRoll, sourceItem = null) {

    //     const title = "Rolling Damage..."
    //     const templateData = {
    //         title: title,
    //         dmgRoll: dmgRoll,
    //         debugDmgRollFormula: debugDmgRollFormula,
    //         naturalDmgRoll: naturalDmgRoll,
    //         dmgBaseRoll: dmgBaseRoll,
    //         itemId: sourceItem.id,
    //         actorId: this.id,
    //         sourceType: sourceItem.type,
    //         save: sourceItem.system.save,
    //         hasEffects: sourceItem.effects.size > 0 ? true : false,
    //         description: sourceItem.system.description
    //     };

    //     const template = `${HYP3E.templatePath}/chat/damage-roll.hbs`;
    //     let damageChat = await renderTemplate(template, templateData);

    //     // Send to chat
    //     dmgRoll.toMessage({
    //         author: game.user_id,
    //         speaker: ChatMessage.getSpeaker({ actor: this }),
    //         content: damageChat
    //     })
    // }

    _getCombatantSitMods(attacker, target) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`_getCombatantSitMods: Getting situational modifiers for attacker ${this.name}...`) }

        // Our return object
        let sitModObj = {}

        let attackerEffects
        if (!foundry.utils.isNewerVersion(game.version, "13")) {
            // For Foundry v12...
            attackerEffects = this.effects
        } else if (foundry.utils.isNewerVersion(game.version, "13")) {
            // For Foundry v13...
            attackerEffects = this._getAllApplicableEffects()
        }
        if (CONFIG.HYP3E.debugMessages) { console.log(`_getCombatantSitMods: Attacker effects:`, attackerEffects) }
        // const effects = this._getEffectNames()

        // Hopefully we have a target!
        let targetEffects
        if (target) {
            if (!foundry.utils.isNewerVersion(game.version, "13")) {
                // For Foundry v12...
                targetEffects = target.actor.effects
            } else if (foundry.utils.isNewerVersion(game.version, "13")) {
                // For Foundry v13...
                targetEffects = target.actor._getAllApplicableEffects()
            }
            if (CONFIG.HYP3E.debugMessages) { console.log(`_getCombatantSitMods: Target effects:`, targetEffects) }
            // targetEffects = targetActor._getEffectNames()
        }

        // Start gathering situational modifiers
        let sitModSum = 0
        let sitModsArr = []
        // Effect names can be arbitrary, what we care about is the token status/condition
        attackerEffects.forEach(effect => {
            if (!effect.disabled) {
                if (CONFIG.HYP3E.debugMessages) { console.log(`_getCombatantSitMods: Actor effect statuses:`, effect.statuses) }
                // Does the effect apply a tempAtkMod?
                const chg = effect.changes.find(c => c.key === "system.tempAtkMod")
                if (chg) {
                    if (CONFIG.HYP3E.debugMessages) { console.log(`_getCombatantSitMods: Actor ${this.name} has tempAtkMod: ${chg.value}`) }
                    // Add the tempAtkMod to the sitMod
                    sitModSum += parseInt(chg.value)
                    const changeString = parseInt(chg.value) > 0 ? `+${chg.value}` : `${chg.value}`
                    sitModsArr.push(`${effect.name} (${changeString})`)
                }
                // Status effects that may not apply any changes...
                //      The assumption here is that if an effect has at least one change 
                //      being applied, it is probably modifying the attacker's roll. So we don't
                //      want to "double-dip" that modifier by applying it again here.
                //      But if the status was just applied from the token right-click menu,
                //      then there won't be any changes, and we should handle it here.
                if (!chg) {
                    if (effect.statuses.has("blind")) {
                        sitModSum += -4
                        sitModsArr.push("Blind (-4)")
                    }
                    if (effect.statuses.has("invisible")) {
                        sitModSum += 4
                        sitModsArr.push("Invisible (+4)")
                    }
                }
            }
        });
        // Hopefully we have a target!
        if (target) {
            if (CONFIG.HYP3E.debugMessages) { console.log(`_getCombatantSitMods: Target elevation (${target.document.elevation}) vs. Attacker elevation (${attacker.document.elevation})...`) }
            // Attacker on higher ground (token height vs. target token height)
            if (attacker.document.elevation > target.document.elevation) {
            // if (attacker.elevation > target.elevation) {
                sitModSum += 1
                sitModsArr.push("Higher Ground (+1)")
            }
            // Defender is on higher ground
            if (attacker.document.elevation < target.document.elevation) {
            // if (attacker.elevation < target.elevation) {
                sitModSum += -1
                sitModsArr.push("Defender on Higher Ground (-1)")
            }

            // Effect names can be arbitrary, what we care about is the token status/condition
            targetEffects.forEach(effect => {
                if (!effect.disabled) {
                    if (CONFIG.HYP3E.debugMessages) { console.log(`_getCombatantSitMods: Target effect statuses:`, effect.statuses) }
                    // Status effects that may not apply any changes...
                    //      The assumption here is that if an effect has at least one change 
                    //      being applied, it is probably modifying the target's AC. So we don't
                    //      want to "double-dip" that modifier by applying it again here.
                    //      But if the status was just applied from the token right-click menu,
                    //      then there won't be any changes, and we should handle it here.
                    if (!effect.changes.find(c => c.key == "system.ac.tempAcMod")) {
                        if (effect.statuses.has("blind")) {
                            sitModSum += 4
                            sitModsArr.push("Defender Blind (+4)")
                        }
                        if (effect.statuses.has("invisible")) {
                            sitModSum += -4
                            sitModsArr.push("Defender Invisible (-4)")
                        }
                        if (effect.statuses.has("restrain")) {
                            sitModSum += 2
                            sitModsArr.push("Defender Hindered (+2)")
                        }
                        if (effect.statuses.has("prone")) {
                            sitModSum += 4
                            sitModsArr.push("Defender Prone (+4)")
                        }
                        if (effect.statuses.has("stun")) {
                            sitModSum += 4
                            sitModsArr.push("Defender Stunned (+4)")
                        }
                    }
                }
            });

            // Attacker is flanking, +1 (Three or more melee combatants engage a single opponent)
            // We have the target token. The token does have a "targeted" array which is an array
            //  of USERs (not actors) who have selected this token to target. So we could count the
            //  length of the array and if it is 3 or more, apply this modifier. However we also
            //  need to make sure that they are all engaged in melee (not missile) combat... so we
            //  would need to get the actual tokens owned by the players, and then determine whether
            //  they are in melee range of their target. It gets really complicated.

            // Target of missile attack engaged in melee with ally of attacker, -2
            // Similar to the above, determining other tokens that are in melee with the targeted
            //  token gets really complicated. May be possible, just need to think hard on this.
            //  And then determine whether it is really worth it.

            // Defender is encumbered or heavily encumbered - this is handled by a different option.

        }
        // Finalize the modifiers & return
        sitModObj = {
            sitMod: sitModSum,
            sitModList: sitModsArr.join(", ")
        }
        return sitModObj
    }

    // Return an array of applicable effects
    _getAllApplicableEffects() {
        let effects = []
        // Get all effects from the actor
        for ( const effect of this.effects ) {
            effects.push(effect);
        }
        for ( const item of this.items ) {
            for ( const effect of item.effects ) {
                if ( effect.transfer ) effects.push(effect);
            }
        }
        return effects;
    }

    // Get the names of effects applied to the actor, and return an array
    _getEffectNames() {
        let effects
        if (!foundry.utils.isNewerVersion(game.version, "13")) {
            // For Foundry v12...
            effects = this.effects
        } else if (foundry.utils.isNewerVersion(game.version, "13")) {
            // For Foundry v13...
            effects = this._getAllApplicableEffects()
        }
        let effectsArray = []
        effects.forEach(effect => {
            // Log the effect
            if (CONFIG.HYP3E.debugMessages) { console.log(`Actor ${this.name}, effect ${effect.name}:`, effect) }
            effectsArray.push(effect.name)
        })
        return effectsArray
    }

    // Parse spell range to get distance in feet
    _parseSpellRange(range) {
        let distance = 0
        if (range.includes("ft") || range.includes("feet") || range.includes("foot")) {
            distance = parseInt(range.split(" ")[0])
        } else if (range.includes("yd") || range.includes("yard")) {
            distance = parseInt(range.split(" ")[0]) * 3
        } else if (range.includes("in")) {
            distance = parseInt(range.split(" ")[0]) / 12
        } else if (range.includes("mi")) {
            distance = parseInt(range.split(" ")[0]) * 5280
        } else if (range.includes("touch")) {
            distance = 7
        } else if (range.includes("m") || range.includes("meter")) {
            // Hopefully this is a unusual, the game is built around empirical units
            distance = parseInt(range.split(" ")[0]) * 3
        }
        // Log original range and calculated distance
        if (CONFIG.HYP3E.debugMessages) { console.log(`Spell range: ${range} = ${distance} feet`) }

        return distance
    }

    // Parse item name to see if it has an attack/damage modifier
    _parseItemMod(itemName) {
        let itemData = {
            atkMod: 0,
            dmgMod: 0
        }
        // Use a regex to find the attack and damage bonus
        let mod = itemName.match(/\+(\d+)/g)
        // Log the regex results
        if (CONFIG.HYP3E.debugMessages) { console.log("Item mod regex:", mod) }
        // If we found a modifier, parse
        if (mod) {
            itemData.atkMod = parseInt(mod[0].replace("+", ""))
            itemData.dmgMod = parseInt(mod[0].replace("+", ""))
        } else {
            // Check for penalty, if no bonus found
            mod = itemName.match(/\-(\d+)/g)
            if (mod) {
                itemData.atkMod = parseInt(mod[0])
                itemData.dmgMod = parseInt(mod[0])
            }
        }
        // Log the parsed item data
        if (CONFIG.HYP3E.debugMessages) { console.log("Item mod data:", itemData) }
        return itemData
    }

    /**
     * Reaction lookup table
     */
    reactionTable = {
        0: "Violent: immediate attack",
        2: "Violent: immediate attack",
        3: "Hostile: antagonistic; attack likely",
        4: "Unfriendly: negative inclination",
        6: "Neutral: disinterested or uncertain (reroll once)",
        9: "Friendly: considers ideas/proposals",
        11: "Agreeable: willing and helpful",
        12: "Affable: extremely accomodating"
    }

    /**
     * Hurled item results table
     */
    hurlingResults = {
        0: "Miss!",
        7: "Stationary or unaware target",
        9: "Large (over 8 ft.)",
        11: "Medium (about 4-8 ft.)",
        13: "Small (under 4 ft.)"
    }

    _valueFromTable(table, val) {
        let output;
        for (let i = 0; i <= val; i++) {
            if (table[i] != undefined) {
                output = table[i];
            }
        }
        return output;
    }

    _stringFromTable(table, val) {
        let output = ""
        output = table[val]
        return output
    }

    isAttributeLow(attr) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`Checking ${attr} attribute for ${this.system.details.class}...`) }
        // const attrReqs = this.classData[this.system.details.class]?.attrReqs
        const attrReqs = Hyp3eCharacter.classData[this.system.details.class]?.attrReqs
        // if (CONFIG.HYP3E.debugMessages) { console.log(`Attribute requirements: `, attrReqs) }
        if (attrReqs[attr]) {
            if (this.system.attributes[attr].value < attrReqs[attr]) {
                return true
            }    
        }
        return false
    }

    /**
     * Handle adding and removing a bonus spell
     * @param {String} spellLvl The bonus spell level to be updated
     * @param {Bool} val The true or false value to be assigned
     */
    async updateBonusSpell(spellLvl, val) {
        switch (spellLvl) {
        case "intLvl1":
            await this.update({
                system: {
                    attributes: {
                        int: {
                            bonusSpells: {
                                lvl1: val,
                            }
                        }
                    }
                }
            })
            break
        case "intLvl2":
            await this.update({
                system: {
                    attributes: {
                        int: {
                            bonusSpells: {
                                lvl2: val,
                            }
                        }
                    }
                }
            })
            break
        case "intLvl3":
            await this.update({
                system: {
                    attributes: {
                        int: {
                            bonusSpells: {
                                lvl3: val,
                            }
                        }
                    }
                }
            })
            break
        case "intLvl4":
            await this.update({
                system: {
                    attributes: {
                        int: {
                            bonusSpells: {
                                lvl4: val,
                            }
                        }
                    }
                }
            })
            break
        case "wisLvl1":
            await this.update({
                system: {
                    attributes: {
                        wis: {
                            bonusSpells: {
                                lvl1: val,
                            }
                        }
                    }
                }
            })
            break
        case "wisLvl2":
            await this.update({
                system: {
                    attributes: {
                        wis: {
                            bonusSpells: {
                                lvl2: val,
                            }
                        }
                    }
                }
            })
            break
        case "wisLvl3":
            await this.update({
                system: {
                    attributes: {
                        wis: {
                            bonusSpells: {
                                lvl3: val,
                            }
                        }
                    }
                }
            })
            break
        case "wisLvl4":
            await this.update({
                system: {
                    attributes: {
                        wis: {
                            bonusSpells: {
                                lvl4: val,
                            }
                        }
                    }
                }
            })
            break
        }
        // this.render(true)
        if (CONFIG.HYP3E.debugMessages) { console.log("Bonus spell update:", this.system) }
    }

}