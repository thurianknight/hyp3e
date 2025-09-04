import { Hyp3eCharacter } from "../helpers/character.mjs";
import { Hyp3eDice } from "../dice/dice.mjs";
import { Hyp3eDialog } from "../helpers/dialog.mjs";
import { HYP3E } from "../helpers/config.mjs"
import { parseAndResolveChangeValue, checkAndResolveDuration } from "../helpers/effects.mjs";
import { sendSimpleChat, sendRollToChat, renderCustomChat } from "../chat/chat.mjs"

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class Hyp3eActor extends Actor {

    /** CORE OVERRIDES ----------------------------------*/

    /** @override */
    prepareData() {
        // Prepare data for the actor. Calling the super version of this executes
        // the following, in order: data reset (to clear active effects),
        // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
        // prepareDerivedData().
        super.prepareData();
    }

    /** @override */
    async prepareBaseData() {
        // Data modifications in this step occur before processing embedded
        // documents or derived data.

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
        const systemData = this.system;
        const flags = this.flags.hyp3e || {};
        systemData.hp.percentage = Math.clamp((systemData.hp.value * 100) / systemData.hp.max, 0, 100);
        // systemData.hp.percentage = Math.min(Math.max((systemData.hp.value * 100) / systemData.hp.max, 0), 100);

        // Notes on system.tempModifiers:
        //  This is an array of modifiers that may be applied to any field in the data template.
        //  However, note that it is better to use effects and apply them to the data template
        //  whenever possible. The known exceptions are AC, DR, and MV, as these are auto-calculated
        //  and cannot be modified by effects.
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
            // EXAMPLE: obj = JSON.parse('{"templateField": "system.ac.value", "source": "isEncumbered", "modifier": 1}')
            // if (CONFIG.HYP3E.debugMessages) { console.log(`tempModifiers[${id}]:`, obj) }
        })

        // Make separate methods for each Actor type (character vs. npc) to keep
        // things organized.
        this._prepareCharacterData();
        this._prepareNpcData();
    }

    /**
     * Prepare Character type specific data
     */
    _prepareCharacterData() {
        if (this.type !== 'character') return;

        // Make modifications to data here. For example:
        const systemData = this.system;

        // Calculated fields go here...

        // Add actor type & base class, used for crit hit & crit miss tables
        try {
            systemData.actorType = this.type
            systemData.baseClass = Hyp3eCharacter.classData[systemData.details.class].baseClass || CONFIG.HYP3E.customClassData[charClass].baseClass;
        } catch (err) {
            // No match found (happens with custom classes), use "npc"
            systemData.baseClass = "npc"
        }

        // Add task resolution
        this._setupTaskResolution(systemData);

        // // Auto-calculate AC, DR, MV if configuration is enabled
        if (CONFIG.HYP3E.autoCalcAc) {
            this.getCharacterAcAndMv(this, systemData)
        }

        // Apply temp AC, DR, and MV modifiers
        this._applyTempModifiers(systemData);

        // Log the prepared data
        if (CONFIG.HYP3E.debugMessages) { console.log("Prepared Character Data: ", systemData) }

    }

    /**
     * Prepare NPC type specific data.
     */
    _prepareNpcData() {
        if (this.type !== 'npc') return;

        // Make modifications to data here
        const systemData = this.system
        // NPCs and monsters don't get the -10 hp benefit that PCs do
        systemData.hp.min = 0

        // Calculated fields go here...

        // Apply temp AC, DR, and MV modifiers
        this._applyTempModifiers(systemData);

        // Add actor type & base class, used for crit hit & crit miss tables
        systemData.actorType = this.type
        systemData.baseClass = "npc"
    }

    /**
     * @override
     * Set token defaults when actor is created
     */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);
        if (data.type === "character") {
            this.updateSource({
                "prototypeToken.actorLink": true,
                "prototypeToken.sight.enabled": true,
                "prototypeToken.disposition": 0
            });
        }
        // POSSIBLE FUTURE USE
        // if (data.type === "npc") {
            // Do nothing for now
        // }
    }

    /**
     * @override
     * Override getRollData() that's supplied to rolls.
     */
    getRollData() {
        const data = super.getRollData();
        data.actorId = this.id
        data.actorType = this.type;
        // Prepare character/npc roll data.
        this._getCharacterRollData(data);
        // this._getNpcRollData(data);  // POSSIBLE FUTURE USE
        if (CONFIG.HYP3E.debugMessages) { console.log(`getRollData: Actor ${this.name}`, data) }
        return data;
    }

    /**
     * @override
     * Overrides the core system applyActiveEffects method on the actor.
     * Capture change values that include roll formulas or data paths, and resolve them
     * to a final number that can be applied to the actor.
     */
    async applyActiveEffects() {
        // For items that apply effects with variables, we resolve those variables 
        //  on the item effect rather than the actor
        this.updateItemEffects()

        const overrides = {};
        this.statuses.clear();

        // Organize non-disabled effects by their application priority
        const changes = [];
        for ( const effect of this.allApplicableEffects() ) {
            if ( effect.disabled || !effect.active ) continue;
            if (CONFIG.HYP3E.debugMessages) { console.log(`applyActiveEffects: ${effect.name}:`, effect) }
            changes.push(...effect.changes.map(change => {
                const c = foundry.utils.deepClone(change);
                c.effect = effect;
                c.priority = c.priority ?? (c.mode * 10);
                if (CONFIG.HYP3E.debugMessages) { console.log(`applyActiveEffects: ${effect.name} ${change.key}:`, change) }
                return c;
            }));
            for ( const statusId of effect.statuses ) this.statuses.add(statusId);
        }
        changes.sort((a, b) => a.priority - b.priority);
        if (CONFIG.HYP3E.debugMessages) { console.log(`applyActiveEffects: Prioritized changes to ${this.name}:`, changes) }

        // Apply all changes
        for ( const change of changes ) {
            if ( !change.key ) continue;
            // Here is where we resolve roll formulas and data paths to a number, if needed
            // if (isNaN(change.value)) {
            //     change.value = await parseAndResolveChangeValue(change.value, this)
            // }
            // Now we can apply the resolved change
            const changes = change.effect.apply(this, change);
            if (CONFIG.HYP3E.debugMessages) { console.log(`applyActiveEffects: Updated changes object:`, changes) }
            Object.assign(overrides, changes);
        }

        // Expand the set of final overrides
        this.overrides = foundry.utils.expandObject(overrides);
    }

    /** ACTOR DATA HELPERS ------------------------------*/

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
        // Add character's class to top level of data
        if (data.details.class) {
            data.class = data.details.class ?? "npc";
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
     * Apply temporary AC, DR, and MV modifiers to the actor's system data.
     * Centralized helper used by both character and NPC preparation functions.
     * @param {Object} systemData
     */
    _applyTempModifiers(systemData) {
        const tempAcMod = parseInt(systemData.ac?.tempAcMod) || 0;
        const tempDrMod = parseInt(systemData.ac?.tempDrMod) || 0;
        const tempMvMod = parseInt(systemData.movement?.tempMvMod) || 0;

        if (tempAcMod) {
            if (CONFIG.HYP3E.debugMessages) console.log(`Applying temp AC mod: ${tempAcMod}`);
            systemData.ac.value = Math.clamp(systemData.ac.value - tempAcMod, -9, 9);
        }

        if (tempDrMod) {
            if (CONFIG.HYP3E.debugMessages) console.log(`Applying temp DR mod: ${tempDrMod}`);
            systemData.ac.dr += tempDrMod;
        }

        if (tempMvMod) {
            if (CONFIG.HYP3E.debugMessages) console.log(`Applying temp MV mod: ${tempMvMod}`);
            systemData.movement.base.value += tempMvMod;
        }
    }

    _setupTaskResolution(systemData) {
        systemData.taskResolution = {};
        for (const [key, value] of Object.entries(CONFIG.HYP3E.taskResolution)) {
            systemData.taskResolution[key] = {
                ...value,
                name: game.i18n.localize(value.name),
                hint: game.i18n.localize(value.hint)
            };
        }
    }

    /**
     * Calculate the character's AC, DR, and MV
     * @param {*} actorData // The actor data object
     * @param {*} systemData // The actor's system data object
     */
    getCharacterAcAndMv(actorData, systemData) {
        // Calculate current AC, DR, and MV based on equipped armor, shield, and DX defense mod
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
                    // Only count an item if it is equipped... but also note that only 1 suit of armor 
                    //   will ever be counted -- no stacking of armor.
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
                if (CONFIG.HYP3E.debugMessages) { console.log(`Encumbered: AC ${tempAC}, MV ${tempMV}`) }
            } else if (this.getFlag(game.system.id, "isHeavilyEncumbered")) {
                tempAC += 2
                tempMV -= 20
                if (CONFIG.HYP3E.debugMessages) { console.log(`Heavily Encumbered: AC ${tempAC}, MV ${tempMV}`) }
            } else {
                if (CONFIG.HYP3E.debugMessages) { console.log(`Not Encumbered: AC ${tempAC}, MV ${tempMV}`) }
            }
        }

        // Now calculate & set the final values...
        tempAC = tempAC - systemData.attributes.dex.defMod - shieldMod
        // tempAC = Math.max(-9, Math.min(9, tempAC));

        // AC must be between 9 and -9, regardless of modifiers
        systemData.ac.value = Math.clamp(tempAC, -9, 9);
        systemData.ac.dr = tempDR
        systemData.movement.base.value = tempMV
    }

    /**
     * Handle adding and removing a bonus spell
     * @param {String} spellLvl The bonus spell level to be updated
     * @param {Bool} val The true or false value to be assigned
     */
    async updateBonusSpell(spellLvl, val) {
        const attr = spellLvl.substring(0,3) // Get the attribute name (int or wis)
        const spellLevel = spellLvl.substring(3).toLowerCase() // Get the spell level (Lvl1, Lvl2, etc.)
        const key = `system.attributes.${attr}.bonusSpells.${spellLevel}`;
        await this.update({ [key]: val });
        // this.render(true)
        if (CONFIG.HYP3E.debugMessages) { console.log("updateBonusSpell update:", key, val) }
    }

    // Get the names of effects applied to the actor, and return an array
    _getEffectNames() {
        let effects
        if (!foundry.utils.isNewerVersion(game.version, "13")) {
            // For Foundry v12...
            effects = this.effects
        } else if (foundry.utils.isNewerVersion(game.version, "13")) {
            // For Foundry v13...
            // effects = this._getAllApplicableEffects()
            effects = this.allApplicableEffects()
        }
        return this.effects.map(e => e.name);
    }

    /** CUSTOM TEMPORARY MODIFIERS (NOT USED YET) -------*/

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

    /** ACTIVE EFFECTS HELPERS --------------------------*/

    /**
     * Resolve item effects and changes that include data paths or roll formulas.
     * Then update the item's effect/change with a number, so it becomes "permanent".
     */
    async updateItemEffects() {
        for ( const item of this.items ) {
            if ( !item.system.equipped ) continue;
            for ( const effect of item.effects ) {
                if ( !effect.transfer ) continue;

                // Flag to track whether anything needs to be updated
                let didUpdate = false;

                // Check to see if we have a rollable duration formula, and resolve it if so
                const { updatedDuration, updated } = await checkAndResolveDuration(effect);
                if (CONFIG.HYP3E.debugMessages) { console.log(`updateItemEffects: Effect "${effect.name}" duration:`, updatedDuration) };
                if (updated) didUpdate = true;
                // // Store duration for a batch update at the end
                // let updatedDuration = {...effect.duration};  // Start with a shallow copy

                // // Check to see if we have a rollable duration formula
                // const formula = effect.getFlag("hyp3e", "durationFormula");
                // if (formula) {
                //     try {
                //         const roll = await new Roll(formula).evaluate({async: true});
                //         updatedDuration = { "rounds": roll.total, "turns": roll.total };
                //         if (CONFIG.HYP3E.debugMessages) { console.log(`updateItemEffects: Effect "${effect.name}" resolved duration "${formula}" to ${roll.total} rounds`) };
                //         didUpdate = true;
                //     } catch (err) {
                //         console.error("updateItemEffects: Invalid duration formula:", formula, err);
                //     }
                // }

                // Store all changes for a batch update at the end
                let updatedChanges = [...effect.changes];  // Start with a shallow copy
                if (CONFIG.HYP3E.debugMessages) { console.log(`updateItemEffects: Checking effect ${effect.name} for changes to resolve...`, updatedChanges) }
                for (let i = 0; i < updatedChanges.length; i++) {
                    const change = updatedChanges[i];
                    let resolvedChange = change.value
                    if (isNaN(change.value)) {
                        // Parse the change.value string and resolve it into a number if possible
                        resolvedChange = await parseAndResolveChangeValue(change.value, this)
                    }
                    if (updatedChanges[i].value !== resolvedChange) {
                        updatedChanges[i] = {
                            ...change,
                            value: resolvedChange
                        };
                        didUpdate = true;
                    }
                }
                // Batch out the updates to the effect
                if (didUpdate) {
                    if (CONFIG.HYP3E.debugMessages) {
                        console.log("updateItemEffects: Duration: ", updatedDuration)
                        console.log("updateItemEffects: Changes: ", updatedChanges)
                    }
                    await effect.update({
                        duration: updatedDuration,
                        changes: updatedChanges
                    });
                }
            }
        }
    }

    /**
     * Process temporary effects on the actor, including persistent damage.
     *  Disable any expired effects.
     */
    async processTemporaryEffects() {
        let totalDamage = 0;
        let damageType = ""
        let rawDamageRoll = ""
        let damageMessages = [];

        // Collect updates to disable expired effects
        const expiredEffectUpdates = [];

        for (const effect of this.effects) {
            if (effect.isTemporary && !effect.disabled) {
                const persistentDamage = effect.changes.find(c => c.key === "system.tempPersistentDamage");
                if (persistentDamage) {
                    if (CONFIG.HYP3E.debugMessages) { console.log(`processTemporaryEffects: ${effect.name}`, persistentDamage); }

                    [damageType, rawDamageRoll] = persistentDamage.value.split(",");
                    const damageRollFormula = rawDamageRoll.replace(";", "").trim();

                    if (CONFIG.HYP3E.debugMessages) { console.log(`processTemporaryEffects: rolling ${damageRollFormula} ${damageType}`); }

                    const roll = new Roll(damageRollFormula);
                    await roll.evaluate({ evaluateSync: true });

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
            await this.applyHealthChange(totalDamage, damageType, false);
            if (CONFIG.HYP3E.debugMessages) {
                console.log(`processTemporaryEffects: ${this.name} took ${totalDamage} total damage!`);
            }
            // Post all the damage messages together
            const persistentDamageMsg = `Applying persistent damage effects...<ul><li>${damageMessages.join("</li><li>")}</li></ul>`;
            sendSimpleChat(this, "", persistentDamageMsg)
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
            // Post all the expirations together
            const effectNames = expiredEffectUpdates.map(effect => effect.name)
            const expiredEffectsMsg = `Active effects have expired...<ul><li>${effectNames.join("</li><li>")}</li></ul>`;
            sendSimpleChat(this, "", expiredEffectsMsg)
        }
    }

    /**
     * Update the value of an effect's change
     * @param {*} key // Effect change-key to find
     * @param {*} updateValue // Value to subtract from the effect's change
     */
    async updateEffectValue(key, updateValue, minVal = 0, maxVal = 100) {
        // Find the effect specified by key
        const effect = this.effects.find(e => e.changes.some(c => c.key === key));
        if (!effect) {
            return updateValue; // No effect found, return same value (no change)
        }

        // Store all changes for a single batch update at the end
        let updatedChanges = [...effect.changes];  // Start with a shallow copy
        let didUpdate = false;
        let newValue = 0;
        let excess = 0;

        for (let i = 0; i < updatedChanges.length; i++) {
            const change = updatedChanges[i];
            if (change.key === key) {
                // Update the value of the change
                newValue = change.value - updateValue;
                if (newValue < minVal) {
                    excess = Math.abs(newValue);
                }
                // Clamp the value between minVal and maxVal
                newValue = Math.max(minVal, Math.min(newValue, maxVal));
                updatedChanges[i] = { ...change, value: newValue };
                didUpdate = true;
            }
        }
        // Batch out the updates to the effect
        if (didUpdate) {
            await effect.update({
                changes: updatedChanges
            });
        }
        // Return any excess that could not be removed from the effect
        return excess;
    }

    /**
     * Create a temporary item owned by the actor, using the provided dataset (NOT USED YET)
     * @param {*} dataset 
     */
    async createTempItem(dataset) {
        // const name = dataset.name
        // const type = dataset.type
        // const system = { ...dataset.system }

        // Prepare the item object
        const itemData = {
            name: dataset.name,
            type: dataset.type,
            system: { ...dataset.system }
        };
        console.log(`createTempItem: Creating ${itemData.name} with data:`, itemData)
        // Finally, create the item!
        return await Item.create(itemData, {parent: this});
    }

    /**
     * Process temporary items on the actor, deleting any that are expired.
     */
    async processTemporaryItems(rounds = 1) {
        // Filter items with numeric duration > 0
        const tempItems = this.items.filter(item => {
            const dur = item.system?.duration;
            return typeof dur === "number" && dur > 0 && item.type != "spell";
        });

        // Log items to decrement duration
        const namesToReduce = tempItems.map(item => item.name);
        if (namesToReduce.length > 0) console.log(`processTemporaryItems: Updating duration for ${namesToReduce.join(", ")}...`)

        // Update duration on temporary items
        const updates = [];
        for (const item of tempItems) {
            const dur = item.system?.duration;
            // Duration must be a positive number
            if (typeof dur === "number" && dur > 0) {
                updates.push({
                    _id: item.id,
                    "system.duration": dur - rounds
                });
            }
        }
        if (updates.length > 0) {
            await this.updateEmbeddedDocuments("Item", updates);
        }

        // Filter items with numeric duration <= 0
        const expiredItems = this.items.filter(item => {
            const dur = item.system?.duration;
            return typeof dur === "number" && dur <= 0 && item.type != "spell";
        });

        if (expiredItems.length == 0) return;

        // Log items to delete
        const namesToDelete = expiredItems.map(item => item.name);
        if (namesToDelete.length > 0) {
            console.log(`processTemporaryItems: Deleting ${namesToDelete.join(", ")}...`)
            // Post all the item expiration messages together
            const chatContent = `Conjured item has expired...<ul><li>${namesToDelete.join("</li><li>")}</li></ul>`;
            sendSimpleChat(this, "", chatContent)
        }

        // Delete all expired items
        const idsToDelete = expiredItems.map(item => item.id);
        await this.deleteEmbeddedDocuments("Item", idsToDelete);
    }

    /** DAMAGE/HEALING APPLICATION ----------------------*/

    /**
     * Apply a hit point change (damage or healing) to the actor, optionally considering Damage Reduction (DR).
     * Handles HP clamping, DR application, and prevents updates if no actual change occurs.
     * @param {number} amount - The amount of HP change. Positive values represent damage, negative values represent healing.
     * @param {boolean} [applyDr=true] - If true (default), apply the actor's Damage Reduction (system.ac.dr) against positive (damage) amounts.
     * @returns {Promise<void|Error>} Returns nothing on success or early exit, or the Error object if the actor update fails.
     */
    async applyHealthChange(amount, damageType = "basic", applyDr = true) {
        const actorName = this.name ?? 'Unknown Actor'; // Use actor's name for logging

        // Input Validation
        if (typeof amount !== "number" || isNaN(amount)) {
            const errorMsg = `Invalid health change amount: '${amount}'. Must be a valid number.`;
            console.error(`applyHealthChange Error for ${actorName}: ${errorMsg}`);
            ui.notifications?.error(errorMsg);
            return; // Exit early for invalid input
        }

        if (CONFIG.HYP3E.debugMessages) {
            console.log(`applyHealthChange: Processing ${amount} HP change for ${actorName}. Damage type: ${damageType}. Apply DR: ${applyDr}`);
        }

        // Get Current State & Define Change Type
        const currentHp = this.system.hp?.value ?? 0;
        let tempHp = this.system.hp?.tempHp ?? 0; // Temporary HP, if any
        let newHp = 0; // New HP after applying the change
        const minHp = this.system.hp?.min ?? 0; // Default to 0 if min HP isn't defined
        const maxHp = this.system.hp?.max ?? Infinity; // Default to Infinity if max HP isn't defined
        const isDamage = amount > 0;
        const isHealing = amount < 0;

        // Check Early Exit Conditions
        // Condition: Trying to damage an already incapacitated/dead actor
        if (isDamage && currentHp <= minHp) {
            if (CONFIG.HYP3E.debugMessages) { console.log(`applyHealthChange: ${actorName} is already incapacitated (HP <= ${minHp}). No damage applied.`); }
            // We might want to trigger "overkill" effects or messages here...
            return;
        }
        // Condition: Change amount is zero
        if (amount === 0) {
            if (CONFIG.HYP3E.debugMessages) { console.log(`applyHealthChange: Health change for ${actorName} is zero. No changes needed.`); }
            return;
        }

        // Calculate Net Change (Applying DR if applicable)
        let netChange = amount; // This is the raw amount before DR/clamping affects the *final* HP

        // Apply Damage Reduction only if it's damage and the flag is set
        if (isDamage && applyDr) {
            const drValue = this.system.ac?.dr ?? 0; // Safely access DR, defaulting to 0
            if (drValue > 0) {
                const damageAfterDr = Math.max(0, amount - drValue); // Ensure damage doesn't become negative healing due to DR
                if (CONFIG.HYP3E.debugMessages) { console.log(`applyHealthChange: Applying DR ${drValue} to ${amount} damage for ${actorName}. Resulting damage: ${damageAfterDr}`); }

                // Condition: DR absorbed all the damage
                if (damageAfterDr === 0 && amount > 0) { // Check amount > 0 to ensure it was actual damage initially
                    if (CONFIG.HYP3E.debugMessages) { console.log(`applyHealthChange: DR absorbed all damage for ${actorName}.`); }
                    // Optionally, trigger chat message or automation for "damage absorbed"
                    // ChatMessage.create({content: `${this.name}'s armor absorbs the blow!`});
                    return; // Exit as no health change will occur
                }
                netChange = damageAfterDr; // Update netChange to the post-DR damage amount
            }
        }
        // If it was healing (amount < 0), netChange remains negative here.

        // Apply the Net Change.
        //  We *subtract* the netChange. If netChange is positive (damage), HP decreases.
        //  If netChange is negative (healing), subtracting a negative increases HP.
        if (isDamage) {
            // Subtract from any effect that is adding temporary HP first, then from currentHp
            if (tempHp > 0) {
                // Is the temp HP being applied by an ActiveEffect?
                const tempHpEffect = this.effects.find(e => e.changes.some(c => c.key === "system.hp.tempHp"));
                if (tempHpEffect) {
                    if (CONFIG.HYP3E.debugMessages) { console.log(`applyHealthChange: Effect applying temp HP: ${tempHpEffect.name}.`); }
                    // Find the effect that is applying temp HP, and update it
                    netChange = await this.updateEffectValue("system.hp.tempHp", netChange, 0, 100);
                } else {
                    if (CONFIG.HYP3E.debugMessages) { console.log(`applyHealthChange: Temp HP was applied manually.`); }
                    // No effect found, just subtract from tempHp directly
                    const originalTempHp = tempHp;
                    tempHp = Math.max(0, tempHp - netChange);
                    netChange = Math.max(0, netChange - originalTempHp);
                    // Directly update the actor's tempHp value
                    await this.update({ "system.hp.tempHp": tempHp });
                }
                // Lock netChange to zero if it came back negative
                netChange = netChange < 0 ? 0 : netChange;
                if (CONFIG.HYP3E.debugMessages) { console.log(`applyHealthChange: Net change after temp HP: ${netChange}.`); }
            }
            // Now apply the remaining damage (if any) to current HP.
            //  Prevent the new HP from going below the allowed minimum.
            newHp = Math.max(minHp, currentHp - netChange);
        } else if (isHealing) {
            // Healing: Only add to real HP, not temp HP
            newHp = currentHp - netChange;
        }

        // Clamp the calculated HP between the actor's min and max HP values
        newHp = Math.max(minHp, Math.min(newHp, maxHp));
        if (CONFIG.HYP3E.debugMessages) { console.log(`applyHealthChange: New HP for ${actorName}: ${newHp}.`); }

        // Check if Update is Necessary
        // Avoid updating the actor if the clamped HP is the same as the current HP
        // (e.g., healing when already at max HP, or taking 0 damage after DR)
        if (newHp === currentHp) {
            if (CONFIG.HYP3E.debugMessages) { console.log(`applyHealthChange: No actual HP change needed for ${actorName} after clamping/DR (Current: ${currentHp}, Calculated New: ${newHp}).`); }
            return; // No update needed
        }

        // Perform Actor Update
        if (CONFIG.HYP3E.debugMessages) {
            const actualChangeAmount = Math.abs(currentHp - newHp); // How much HP *really* changed
            const changeType = (newHp < currentHp) ? "damage" : "healing";
            console.log(`applyHealthChange: Updating ${actorName} HP. Old: ${currentHp}, New: ${newHp} (${actualChangeAmount} ${changeType}).`);
        }
        try {
            // Perform the asynchronous update on the actor document
            await this.update({ "system.hp.value": newHp });

            // Optional: Add hook calls after successful update if other modules/systems need to react
            Hooks.callAll("actorHealthChanged", this, currentHp, newHp, netChange, isDamage, isHealing);

        } catch (err) {
            // Log the error and notify the user if the update fails
            console.error(`applyHealthChange: Failed to update HP for ${actorName}:`, err);
            ui.notifications?.error(`Failed to update HP for ${actorName}. See console log for details.`);
            return err; // Return the error object
        }

        // Implicitly return undefined on successful update or handled early exit
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
        sendSimpleChat(this, "", message)
    }

    /** ROLL FUNCTIONS ----------------------------------*/

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
            if (CONFIG.HYP3E.debugMessages) { 
                console.log(`Macro actor: `, this)
                console.log(`Macro item: `, item)
                console.log(`Rolling macro for ${item.type} ${item.name}:`, item) 
            }

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
        sendRollToChat(roll, this, label, "", rollResponse.rollMode)
        
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
        sendRollToChat(roll, this, label, "", rollResponse.rollMode)
        
        return roll
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
        const { roll, total, success } = await Hyp3eDice.rollFormulaAndEvaluateSuccess(rollFormula, this.getRollData(), dataset.rollTarget, "ge");
        if (success) {
            label += "<br /><b>Success!</b>"
        } else {
            label += "<br /><b>Fail.</b>"
        }

        // Output roll result to a chat message
        sendRollToChat(roll, this, label, "", rollResponse.rollMode)

        return roll
    }

    /**
     * Initialize an NPC's hit points by executing a hit-die roll from the npc-actor sheet
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
            await this.update({ system: { hp: { value: newHealth, max: newHealth } } });
        } else {
            if (CONFIG.HYP3E.debugMessages) { console.log("rollHD: Roll failed, no total value!") }
        }
    }

    /**
     * Heal a PC by rolling its hit die + CN mod (NOT CURRENTLY USED)
     * @param {*} dataset 
     */
    async rollHP() {
        if (this.type !== 'character') return;
        if (!this.system.hd){
            if (CONFIG.HYP3E.debugMessages) { console.error("rollHP: No HD value to roll!") }
            return;
        }
        if (CONFIG.HYP3E.debugMessages) { console.log(`rollHP: Rolling hit points ${this.system.hd} + ${this.system.attributes.con.hpMod}...`) }
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
                system: { hp: { value: newHealth, max: newMax } }
            });
        } else {
            if (CONFIG.HYP3E.debugMessages) { console.log("rollHP: Roll failed, no total value!") }
        }
    }

    /**
     * Begin processing an item check or attack roll
     * @param {*} dataset 
     */
    async rollItem(dataset) {
        // Get item info to execute a standard roll
        const { item, itemData, itemName, attackTextBase } = await this._getItemDetails(dataset.itemId);
        if (!item) {
            ui.notifications.warn(`Item ${dataset.itemId} was not found!`)
            return
        }
        // dataset.roll = item.system.formula
        dataset.attackTextBase = attackTextBase

        // Are we enforcing the item equippage rule for PCs?
        if (CONFIG.HYP3E.forceWeaponEquip && this.type === "character") {
            // Only apply to physical items: armor, items, weapons
            if (["armor", "item", "weapon"].includes(item.type)) {
                // Check if the item is equipped & has available quantity
                if (!this._checkItemPreconditions(item, { checkEquipped: true, checkQuantity: true })) return;
            }
        }

        // Gather dataset properties from the item and actor
        dataset = await this._prepareRollDataset(dataset.itemId, dataset);
        if (!dataset) return;

        if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label}:`, item) }
        if (item.type === "weapon") {
            // Attack with the weapon
            this.rollAttackOrSpell(dataset)
        } else if (item.type === "spell") {
            // Are we enforcing the spell memorization rule for PCs?
            if (CONFIG.HYP3E.forceSpellMemorize && this.type === "character" && !dataset.isItemSpell) {
                // Check if the spell is memorized
                if (!this._checkItemPreconditions(item, { checkMemorized: true })) return;
            }
            // Cast the spell
            this.rollAttackOrSpell(dataset)
        } else {  // ==> Neither a weapon nor a spell (armor, feature, item)
            // The default for other item types (i.e. class abilities and actual items) is a check,
            //  followed by using inventory and applying applicable effects if the check succeeded
            //  or no check was required to proceed.
            let okToContinue = true;
            const hasFormula = item.system.formula?.trim() !== "";
            if (hasFormula) {
                // Roll the item or ability check and display the result in chat
                okToContinue = this.rollCheck(dataset)
                if (!okToContinue) return;

                if (item.system.isConsumable) {
                    this.useItem(item.id)
                }
                if (item.effects.size > 0) {
                    // Only give this (secondary) chat if there are effects to apply
                    item._displayItemInChat(dataset.actorData)
                }
                return
            }

            // No item check, so we will popup a basic dialog to confirm use
            if (item.effects.size > 0) {
                const effectList = Array.from(item.effects).map(e => e.name).join(", ");
                dataset.details = `Using ${itemName} applies the following: ${effectList}.`
                dataset.noRoll = true
            }
            dataset.rollButtonLabel = "Use Item"
            try {
                await Hyp3eDialog.ShowBasicRollDialog(dataset)
            } catch(err) {
                // This usually just means the dialog was canceled
                return
            }
            if (item.system.isConsumable) {
                this.useItem(item.id)
            }
            // No roll chats were needed, so we show this one chat message
            item._displayItemInChat(dataset.actorData)
        }
    }

    /** ITEM, ATTACK & SPELL ROLL SUB-FUNCTIONS ---------*/

    /**
     * Execute a check roll directly from the actor sheet
     * @param {*} dataset 
     */
    async rollCheck(dataset) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`rollCheck: Rolling ${dataset.label}...`) }

        // Declare vars
        const itemId = dataset.itemId ?? null
        const tokenId = dataset.tokenId ?? null
        let itemName = ""
        let label = ""
        let checkText = dataset.label
        let rollFormula = ""
        let rollResponse

        // Did we get a token ID?
        if (tokenId) {
            // Get the token from the canvas
            const token = canvas.tokens.get(tokenId)
            if (CONFIG.HYP3E.debugMessages) { console.log(`rollCheck: Token (ID ${tokenId}): `, token) }
            if (token) {
                // Get the token's actor
                const tokenActor = token.actor
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollCheck: Token actor: `, tokenActor) }
            }
        }

        // Is this an item or ability check?
        const item = this.items.get(itemId) ?? null
        if (item) {
            itemName = item.system.friendlyName != "" ? item.system.friendlyName : item.name
            label = this._createChatLabel(item.img, itemName)
        }

        // Determine whether we have a valid target number or formula
        if (dataset.rollTarget == '' || dataset.rollTarget == undefined || dataset.rollTarget <= 0) {
            console.log("Missing or invalid target number, cannot confirm success of check!")
            ui.notifications.info("Missing or invalid target number, cannot confirm success of check!")
            return false
        }

        // Retrieve roll data from the actor
        const rollData = this.getRollData();

        // Set the roll button label based on item type
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

        // Check to see if we need to add an attribute modifier for thief skills
        dataset.sitMod = 0;
        dataset.sitModList = "";
        const actorAttributes = { 
            dx: this.system.attributes.dex.value, 
            in: this.system.attributes.wis.value, 
            ws: this.system.attributes.int.value
        };
        const sitModObj = this._getThiefSkillModifier(itemName, actorAttributes)
        if (sitModObj.modifier > 0) {
            dataset.sitMod = sitModObj.modifier
            dataset.sitModList = `${sitModObj.attribute.toUpperCase()} modifier (+${sitModObj.modifier})`
        }

        // This is needed for Turn Undead & Assassinate results
        let htmlContent = ""
        // Use simple word parsing in the ability name to determine if this is a cleric turning undead
        let turnUndead = false
        let itemNameLower = itemName.toLowerCase()
        if (itemNameLower.indexOf("turn") >= 0 && itemNameLower.indexOf("undead") >= 0) {
            // This flag is used to determine if we are turning undead
            turnUndead = true
            // Special case: if the user forgot to include @cha.turnUndead in the formula,
            //  we will add it here, so the roll will be correct
            if (dataset.roll.indexOf("@cha.turnUndead") < 0) {
                dataset.roll = `${dataset.roll} - @cha.turnUndead`
            }
            // Override the roll target in the dataset
            dataset.rollTarget = 10
        }

        // Use simple word parsing in the ability name to determine if this is an assassin plying her trade
        let assassinate = false
        const userTargets = Array.from(game.user.targets);
        let targetToken = null
        if (itemNameLower.indexOf("assassinate") >= 0) {
            // This flag is used to determine if we are assassinating
            assassinate = true
            // Ensure we have a targeted token
            targetToken = userTargets.length > 0 ? userTargets[0] : null;
            if (!targetToken) {
                ui.notifications.warn("No target token selected!")
                return false
            }
        }

        // If the Target has variables like a roll formula, resolve it to a number
        if (isNaN(dataset.rollTarget)) {
            const targetRoll = new Roll(dataset.rollTarget, rollData)
            await targetRoll.roll()
            if (CONFIG.HYP3E.debugMessages) {
                console.log(`Check target formula: ${dataset.rollTarget} evaluates to ${targetRoll.formula} = ${targetRoll.total}`)
                console.log("Target formula eval: ", targetRoll)
            }
            // Override rollTarget, even if it has the same value
            dataset.rollTarget = targetRoll.total
        }
        checkText += ` (target ${dataset.rollTarget})... `

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
        const { roll, total, success } = await Hyp3eDice.rollFormulaAndEvaluateSuccess(rollFormula, rollData, dataset.rollTarget, "le");

        // Determine success or failure on a simple check, not turning undead or assassinating
        if (!turnUndead && !assassinate) {
            // if (roll.total <= dataset.rollTarget) {
            if (success) {
                checkText += "<b>Success!</b>"
            } else {
                checkText += "<b>Fail.</b>"
            }
        } else if (turnUndead) {
            // Resolve the results of the attempted turning undead
            htmlContent = this._resolveTurnUndead(roll.total, rollData)
        } else if (assassinate) {
            // Resolve the results of the attempted assassination
            htmlContent = this._resolveAssassination(targetToken, roll.total, rollData)
        }
        // Hit must be false so we don't display any damage buttons
        roll.hit = false

        // Construct a custom chat card for the check
        await renderCustomChat(roll, item, this, tokenId, label, "", checkText, htmlContent, rollResponse.rollMode)

        return true
    }

    /**
     * Main orchestrator for executing an attack roll or casting a spell.
     * @param {object} dataset - Initial data for the roll (label, itemId, tokenId, etc.).
     */
    async rollAttackOrSpell(dataset) {
        if (CONFIG.HYP3E.debugMessages) {
            console.log(`rollAttackOrSpell: Rolling ${dataset.label}...`, dataset);
        }

        // Gather Initial Information
        const { attacker, attackerPos } = await this._getAttackerDetails(dataset);
        const { item, itemData, itemName, attackTextBase } = await this._getItemDetails(dataset.itemId);
        const actorData = this.getRollData();

        if (!item && !dataset.formula) { // If there's no item and no predefined formula (e.g., basic attack removed)
            console.warn("rollAttackOrSpell: No item or formula provided for the roll.");
            ui.notifications.warn("Cannot perform action: No item or formula specified.");
            return null;
        }
        dataset.itemName = itemName || "";

        // Early exit if item requires a roll but has no formula (data setup errors)
        if (item && !itemData.formula && (item.type === "weapon" || (item.type === "spell" && itemData.atkRoll))) {
            if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Item has no roll formula, displaying description instead."); }
            item._displayItemInChat(actorData);
            return null;
        }

        // Gather Target Information & Calculate Distance/Range
        const { target, targetData, gridDistance } = this._getTargetDetails(attacker);
        dataset.rangeUoM = canvas.scene?.grid.units || "ft";
        dataset.gridDistance = gridDistance;
        dataset.targetName = targetData.name; // Store for later use
        dataset.targetAc = targetData.ac;     // Store for later use
        dataset.targetSize = targetData.size; // Store for later use

        // Warn if attack or spell requires a target, but no tokens were selected
        if (item && (item.type === "weapon" || item.type === "spell" && itemData.atkRoll) && !target) {
            ui.notifications.warn(`No target selected for ${item.name}!`);
        }

        // Prepare Data for Dialog (Range, Ammo, Initial Mods)
        const { rangeText, ranges, rangeGroup, chosenRange, rangeMessages, isOutOfRange } = this._prepareRangeData(itemData, gridDistance);
        rangeMessages.forEach(msg => ui.notifications.warn(msg)); // Show range warnings immediately
        if (isOutOfRange && CONFIG.HYP3E.forceRangeLimit) {
            if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Target out of range, or too close, and forceRangeLimit enabled. Aborting."); }
            return null; // Abort if out of range and setting is enabled
        }

        const carriedAmmo = this._getCarriedAmmo();
        dataset.sitMod = 0;
        dataset.sitModList = "";
        if (game.settings.get(game.system.id, "enableCombatSitModDetection")) {
            const sitModObj = this._getCombatantSitMods(attacker, target); // Assuming this function exists
            dataset.sitMod = parseInt(sitModObj?.sitMod || 0);
            dataset.sitModList = sitModObj?.sitModList || "";
        }

        // Combine item/roll specific data for the dialog
        const dialogData = {
            ...dataset, // Include initial dataset
            showAmmo: itemData?.usesAmmo ?? false,
            showRanges: !!itemData?.missile,
            showSpellRange: item?.type === "spell" && itemData?.atkRoll,
            spellRange: itemData?.range, // Use descriptive range text for spells
            rangeText: rangeText,
            isGrenade: itemData?.isGrenade ?? false, // Pass grenade status
            itemName: itemName // Ensure item name is in dialog data
        };

        // Show Dialog and Get User Input
        let rollResponse;
        try {
            rollResponse = await this._showRollDialog(dialogData, item?.type, carriedAmmo, rangeGroup, ranges, chosenRange);
            if (!rollResponse) { // Handle dialog cancellation
                if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Dialog cancelled by user."); }
                return null;
            }
        } catch (err) {
            console.error("rollAttackOrSpell: Error displaying dialog:", err);
            return null;
        }

        // Temporarily override the actor's CA
        if (dataset.isItemSpell) {
            actorData.ca = dataset.itemCa
        }
        // Handle spell slot consumption if applicable
        if (!dataset.isItemSpell && item?.type === "spell" && itemData?.quantity?.value > 0) {
            await this._consumeSpellSlot(item);
        }
        // If there's no item roll formula (typically a spell), send a chat message and exit
        if (!itemData.formula) {
            item._displayItemInChat(actorData);
            return null;
        }
        // Use ammo or consumable item, and return ammo atk/dmg mods if applicable
        const { ammoMods, ammoUpdated } = await this._consumeAmmoOrItem(rollResponse, item, itemData);
        if (ammoUpdated) {
            // If ammo was used, refresh the actor sheet or relevant UI if needed
            // this.sheet.render(false);
        }

        // Update dataset with final situational mods and roll mode from dialog
        dataset.sitMod = rollResponse.sitMod;
        dataset.rollMode = rollResponse.rollMode;
        dataset.rangeMod = this._getRangeModifier(rollResponse.rangeGroup); // Calculate range mod based on selection

        // Build Roll Formula
        const { formula: rollFormula, debugFormula: debugAtkRollFormula } = Hyp3eDice.buildAttackFormula(dataset, itemData, ammoMods, actorData); // Assuming this exists
        if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Final attack formula:", rollFormula); }

        // Execute the Roll
        const { atkRoll, naturalRoll } = await this._executeRoll(rollFormula, actorData);
        if (!atkRoll) {
            console.error("rollAttackOrSpell: Roll execution failed.");
            return null;
        }

        // Determine Hit/Miss Result
        const { hit, attackTextResult, critFooterHTML } = this._determineHitResult(
            atkRoll,
            naturalRoll,
            itemData,
            dataset.targetAc,
            dataset.targetSize,
            this.system.baseClass, // Pass base class for crit/fumble tables
            this.id // Pass actor ID for crit/fumble tables
        );
        atkRoll.hit = hit; // Attach hit status to the roll object

        // Prepare Damage Formula (if hit)
        let damageFormulas = {};
        if (hit && item && Roll.validate(itemData.damage)) {
            damageFormulas = this._prepareDamageFormulas(itemData, ammoMods, actorData);
            // Temporarily attach to item object for chat card context
            item.dmgFormula = damageFormulas.primary?.formula;
            item.debugDmgRollFormula = damageFormulas.primary?.debugFormula;
            item.dmgFormula2h = damageFormulas.secondary?.formula;
            item.debugDmgRollFormula2h = damageFormulas.secondary?.debugFormula;
        }

        // Render chat message
        const chatLabel = this._createChatLabel(item?.img, itemName);
        const finalAttackText = `${attackTextBase}${dataset.targetName ? ` vs. ${dataset.targetName}` : ''}... ${attackTextResult}`;

        await renderCustomChat(atkRoll, item, this, attacker?.id, chatLabel, debugAtkRollFormula, finalAttackText, critFooterHTML, rollResponse.rollMode); // Assuming this exists

        // Return Roll Result
        return atkRoll;
    }

    /** ITEM, ATTACK & SPELL ROLL HELPERS ---------------*/

    /**
     * Validate item state before performing an action.
     * @param {Item} item
     * @param {Object} options
     * @param {boolean} [options.checkEquipped=false] - Require the item to be equipped.
     * @param {boolean} [options.checkQuantity=false] - Require the item quantity > 0.
     * @param {boolean} [options.checkMemorized=false] - Require spell memorization (quantity > 0).
     * @returns {boolean} - True if all checks pass, false if any check fails (also shows notification).
     */
    _checkItemPreconditions(item, { checkEquipped = false, checkQuantity = false, checkMemorized = false } = {}) {
        if (!item) {
            ui.notifications.warn("No item provided.");
            return false;
        }

        const itemName = item.system?.friendlyName || item.name || "Item";

        if (checkEquipped && !item.system?.equipped) {
            ui.notifications.warn(`${itemName} is not equipped!`);
            return false;
        }

        if (checkQuantity && (item.system?.quantity?.value ?? 0) <= 0) {
            ui.notifications.warn(`${itemName} quantity is zero, you must resupply.`);
            return false;
        }

        if (checkMemorized && (item.system?.quantity?.value ?? 0) <= 0) {
            ui.notifications.warn(`${itemName} is not memorized!`);
            return false;
        }

        return true;
    }

    /**
     * Prepare a standardized dataset for rolling, resolving the item and basic metadata.
     * @param {string} itemId - The ID of the item to roll.
     * @param {object} [dataset={}] - Optional initial dataset values.
     * @returns {object|null} - Returns dataset with populated defaults or null if item not found.
     */
    async _prepareRollDataset(itemId, dataset = {}) {
        const item = this.items.get(itemId) ?? await fromUuid(itemId);
        if (!item) {
            ui.notifications.warn(`Item with ID ${itemId} not found.`);
            return null;
        }

        const itemData = item.system;
        const itemName = itemData?.friendlyName?.trim() || item.name;
        const actorData = this.getRollData();

        dataset.itemType = item.type;
        dataset.itemName = itemName;
        dataset.roll = itemData.formula || "";
        dataset.actorId = this.id;

        if (item.type === "weapon") {
            dataset.label = `${dataset.attackTextBase} with ${itemName}`;
            dataset.isGrenade = itemData.isGrenade;
            dataset.isAreaEffect = itemData.isAreaEffect;
            if (itemData.isAreaEffect) {
                dataset.details = `No attack roll required to use ${itemName}.`
                dataset.noRoll = true
            }
        }

        if (item.type === "spell") {
            dataset.isMemorized = (itemData.quantity?.value ?? 0) > 0;
            dataset.label = `${dataset.attackTextBase} ${itemName}`
            if (item.system.formula == "" || item.system.formula == undefined) {
                dataset.details = `No attack roll required to cast ${itemName}.`
                dataset.noRoll = true
            }
        }

        if (item.type === "item" || item.type === "feature") {
            dataset.label = `Using ${itemName}`;
            dataset.rollTarget = item.system.tn
        }

        // Optionally inject rollData reference for later convenience
        dataset.actorData = actorData;

        if (CONFIG.HYP3E.debugMessages) {
            console.log("_prepareRollDataset: Actor roll data:", actorData);
            console.log("_prepareRollDataset: Prepared dataset:", dataset);
        }

        return dataset;
    }

    // Helper Functions
    /**
     * Gets the attacker token and position.
     * @param {object} dataset - Initial roll dataset, may contain tokenId.
     * @returns {Promise<{attacker: Token|null, attackerPos: Point|null}>}
     */
    async _getAttackerDetails(dataset) {
        let attacker = null;
        if (dataset.tokenId) {
            attacker = canvas.tokens.get(dataset.tokenId);
        }

        if (!attacker) {
            // Try linked token first
            attacker = this.token ?? null;
            if (!attacker) {
                // Find first linked token matching the actor
                attacker = canvas.tokens.placeables.find(t => t.document.isLinked && t.actor?.id === this.id) ?? null;
                // Fallback to the first controlled token if still no attacker (common for GMs)
                if (!attacker && canvas.tokens.controlled.length > 0) {
                    attacker = canvas.tokens.controlled[0];
                }
            }
        }

        const attackerPos = attacker?.center ?? null;
        if (CONFIG.HYP3E.debugMessages) {
            console.log("rollAttackOrSpell/_getAttackerDetails: Attacker:", attacker);
            console.log("rollAttackOrSpell/_getAttackerDetails: Attacker Position:", attackerPos);
        }
        return { attacker, attackerPos };
    }

    /**
     * Retrieves item details.
     * @param {string} itemId - The ID of the item to retrieve.
     * @returns {{item: Item|null, itemData: object|null, itemName: string, attackTextBase: string}}
     */
    async _getItemDetails(itemId) {
        const item = this.items.get(itemId) ?? await fromUuid(itemId);
        const itemData = item ? { ...item.system, itemType: item.type } : null;
        if (CONFIG.HYP3E.debugMessages) {
            console.log(`_getItemDetails: Item ${itemId}:`, item);
            console.log("_getItemDetails: Item Data:", itemData);
        }

        // itemName should be prioritized as (1) itemAlias [but only if not identified], 
        //  (2) friendlyName, and (3) realName
        let itemName = ""
        if (!item.system.identified && item.system.itemAlias != "") {
            itemName = item.system.itemAlias
        } else {
            itemName = item ? (item.system.friendlyName || item.name) : "Unknown Action";
        }
        // Start of the chat message
        let attackTextBase = "Attack";

        if (item) {
            if (item.type === "weapon") {
                // Potentially add master/grandmaster text later if needed
            } else if (item.type === "spell") {
                attackTextBase = "Cast spell";
            }
        }
        return { item, itemData, itemName, attackTextBase };
    }

    /**
     * Gets details of the primary targeted token.
     * @param {Token|null} attacker - The attacking token (used for distance calculation).
     * @returns {{target: Token|null, targetData: {ac: number, name: string, size: string}, gridDistance: number}}
     */
    _getTargetDetails(attacker) {
        const userTargets = Array.from(game.user.targets);
        const target = userTargets.length > 0 ? userTargets[0] : null;
        let targetData = { ac: 9, name: "", size: "" }; // Default values
        let gridDistance = 0;

        if (target && target.actor && attacker) {
            const targetActorData = target.actor.system;
            targetData.ac = targetActorData.ac?.value ?? 9;
            // Use token name if possible, otherwise actor name
            targetData.name = target.name ? target.name : target.actor.name;
            targetData.size = targetActorData.size ?? "M";
            // Get the attacker's actual token size
            const attackerWidth = attacker.document.width ?? 1; // Default to 1 if not found
            const attackerHeight = attacker.document.height ?? 1; // Default to 1 if not found
            // Get the target's actual token size
            const targetWidth = target.document.width ?? 1; // Default to 1 if not found
            const targetHeight = target.document.height ?? 1; // Default to 1 if not found

            // Calculate distance
            const attackerPos = attacker.center;
            const targetPos = target.center;
            const dx = targetPos.x - attackerPos.x;
            const dy = targetPos.y - attackerPos.y;
            const distancePixels = Math.sqrt(dx * dx + dy * dy);
            gridDistance = (distancePixels / canvas.grid.size) * canvas.scene.grid.distance;
            gridDistance = Math.round(gridDistance);

            // If either token is larger than 1, reduce the grid distance to account for reach
            if (attackerWidth > 1 || attackerHeight > 1) {
                gridDistance -= (Math.max(attackerWidth, attackerHeight) - 1) * 5;
            }
            if (targetWidth > 1 || targetHeight > 1) {
                gridDistance -= (Math.max(targetWidth, targetHeight) - 1) * 5;
            }
            // Ensure distance is not negative
            if (gridDistance < 0) gridDistance = 0;

            if (CONFIG.HYP3E.debugMessages) {
                console.log("rollAttackOrSpell/_getTargetDetails: Target:", target);
                console.log("rollAttackOrSpell/_getTargetDetails: Target Data:", targetData);
                console.log("rollAttackOrSpell/_getTargetDetails: Distance:", gridDistance);
            }
        } else {
            if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell/_getTargetDetails: No target selected or attacker missing."); }
            // Optionally notify if an attack requires a target but none is selected
            // ui.notifications.info("No target selected!"); // Consider moving this notification logic elsewhere if needed more broadly
        }

        return { target, targetData, gridDistance };
    }

    /**
     * Calculates melee range based on weapon class.
     * @param {number} wc - Weapon class.
     * @returns {number} Melee reach distance in grid units.
     */
    _getMeleeRange(wc) {
        if (wc <= 3) return 7; // Adjust for diagonal? Base 5ft -> 7 allows diagonal
        if (wc <= 5) return 12; // Base 10ft -> 12 allows diagonal
        return 20; // Base 15ft -> 20 allows diagonal
    }

    /**
     * Parses spell range string into a numerical distance.
     * @param {string} rangeStr - The spell range description (e.g., "Touch", "60 ft", "Self").
     * @returns {number} Numerical range in grid units, or Infinity for non-distance ranges.
     */
    _parseSpellRange(rangeStr) {
        if (!rangeStr) return Infinity; // Or handle as error?
        rangeStr = rangeStr.toLowerCase();
        if (rangeStr === "touch" || rangeStr === "melee") return 7; // Assume touch = melee reach
        if (rangeStr === "self") return 0;
        const match = rangeStr.match(/(\d+)\s*(ft|feet|yd|yards|m|meters)/);
        if (match) {
            let value = parseInt(match[1]);
            const unit = match[2];
            // Convert other units to feet if necessary, assuming base grid is feet
            if (unit === 'yd' || unit === 'yards') value *= 3;
            if (unit === 'm' || unit === 'meters') value *= 3.28084;
            if (unit === 'mi' || unit === 'miles') value *= 5280;
            if (CONFIG.HYP3E.debugMessages) { console.log(`_parseSpellRange: Spell range: ${rangeStr} = ${value} feet`) }
            return Math.round(value);
        }
        if (CONFIG.HYP3E.debugMessages) { console.log(`_parseSpellRange: Spell range ${rangeStr} could not be determined!`) }
        return Infinity; // Unknown range format
    }

    /**
     * Prepares range data, checks limits, and determines the default range category.
     * @param {object|null} itemData - The system data of the item.
     * @param {number} gridDistance - Calculated distance to the target.
     * @returns {{ranges: object, rangeGroup: string, chosenRange: string, rangeMessages: string[], isOutOfRange: boolean}}
     */
    _prepareRangeData(itemData, gridDistance) {
        let ranges = {};
        let rangeText = "";
        let rangeGroup = "";
        let chosenRange = "";
        let rangeMessages = [];
        let isOutOfRange = false;

        if (!itemData) return { ranges, rangeGroup, chosenRange, rangeMessages, isOutOfRange };

        // Melee Check
        if (itemData.melee) {
            const meleeRange = this._getMeleeRange(itemData.wc);
            if (gridDistance > meleeRange) {
                const msg = `Target is beyond melee range! (${gridDistance} ${canvas.scene.grid.units} > ${meleeRange} ${canvas.scene.grid.units})`;
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell/_prepareRangeData: ${msg}`); }
                rangeMessages.push(msg);
                isOutOfRange = true;
            }
        }

        // Missile Check
        if (itemData.missile && itemData.range) {
            const meleeRange = this._getMeleeRange(0);
            rangeGroup = "rangeGroup"; // Identifier for the dialog field
            ranges = {
                short: `Short (${itemData.range.short})`,
                medium: `Med (${itemData.range.medium})`,
                long: `Long (${itemData.range.long})`
            };
            if (gridDistance > 0 && gridDistance <= meleeRange) {
                // If gridDistance == 0, then we assume no target and allow the attack to go through
                chosenRange = "short"; // Set to Short even if too close
                const msg = `Target is in melee range! (${gridDistance} ${canvas.scene.grid.units})`;
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell/_prepareRangeData: ${msg}`); }
                rangeMessages.push(msg);
                isOutOfRange = true;
            } else if (gridDistance <= itemData.range.short) {
                chosenRange = "short";
            } else if (gridDistance <= itemData.range.medium) {
                chosenRange = "medium";
            } else if (gridDistance <= itemData.range.long) {
                chosenRange = "long";
            } else {
                chosenRange = "long"; // Set to Long even if out of range
                const msg = `Target is out of missile range! (${gridDistance} ${canvas.scene.grid.units} > ${itemData.range.long} ${canvas.scene.grid.units})`;
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell/_prepareRangeData: ${msg}`); }
                rangeMessages.push(msg);
                isOutOfRange = true;
            }
        }

        // Spell Attack Roll Check
        if (itemData.itemType === "spell" && itemData.range) {
            const spellRange = this._parseSpellRange(itemData.range);
            if (gridDistance > spellRange) {
                const msg = `Target is out of spell range! (${gridDistance} ${canvas.scene.grid.units} > ${spellRange} ${canvas.scene.grid.units})`;
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell/_prepareRangeData: ${msg}`); }
                rangeMessages.push(msg);
                isOutOfRange = true;
            }
        }
        rangeText = `${gridDistance} ${canvas.scene.grid.units}`;

        return { rangeText, ranges, rangeGroup, chosenRange, rangeMessages, isOutOfRange };
    }

    /**
     * Filters inventory for usable ammunition.
     * @returns {object} Object suitable for dropdown { ammoId: "Ammo Name (Qty)" }.
     */
    _getCarriedAmmo() {
        const ammoList = this.items.filter(i => i.system.isAmmunition && i.system.quantity?.value > 0);
        let carriedAmmo = { "": "None" }; // Start with a None option
        for (let ammo of ammoList) {
            carriedAmmo[ammo._id] = `${ammo.name} (${ammo.system.quantity.value})`;
        }
        if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell/_getCarriedAmmo: Carried ammo:", carriedAmmo); }
        return carriedAmmo;
    }

    /**
     * Shows the appropriate roll dialog.
     * @param {object} dataset - Data for the dialog template.
     * @param {string|null} itemType - Type of the item ('weapon', 'spell', null).
     * @param {object} carriedAmmo - List of available ammo.
     * @param {string} rangeGroup - Name for the range input group.
     * @param {object} ranges - Available range options.
     * @param {string} chosenRange - Pre-selected range category.
     * @returns {Promise<object|null>} The dialog response object, or null if cancelled.
     */
    async _showRollDialog(dataset, itemType, carriedAmmo, rangeGroup, ranges, chosenRange) {
        try {
            let rollResponse;
            if (itemType === "weapon") {
                rollResponse = await Hyp3eDialog.ShowAttackRollDialog(dataset, carriedAmmo, rangeGroup, ranges, chosenRange); // Assuming this exists
            } else if (itemType === "spell") {
                rollResponse = await Hyp3eDialog.ShowSpellcastingDialog(dataset); // Assuming this exists
            } else {
                // Fallback for non-item rolls if needed, potentially reusing ShowAttackRollDialog
                rollResponse = await Hyp3eDialog.ShowAttackRollDialog(dataset, {}, "", {}, "");
            }
            if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell/_showRollDialog: Dialog response:", rollResponse); }
            return rollResponse;
        } catch (err) {
            // Catch dialog cancellation (often returns null or throws specific error)
            if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell/_showRollDialog: Dialog closed or error:", err); }
            return null; // Indicate cancellation
        }
    }

    /**
     * Gets the attack modifier based on the selected range band.
     * @param {string} rangeSelection - 'short', 'medium', or 'long'.
     * @returns {number} The modifier for the range.
     */
    _getRangeModifier(rangeSelection) {
        switch (rangeSelection) {
            case "short": return 0;
            case "medium": return -2;
            case "long": return -5;
            default: return 0; // Default if no range or invalid selection
        }
    }

    /**
     * Executes the dice roll.
     * @param {string} rollFormula - The formula string to roll.
     * @param {object} actorData - Roll data context.
     * @returns {Promise<{atkRoll: Roll|null, naturalRoll: number}>} The completed Roll object and the natural d20 result.
     */
    async _executeRoll(rollFormula, actorData) {
        try {
            const atkRoll = new Roll(rollFormula, actorData);
            await atkRoll.evaluate({ evaluateSync: true });
            const d20Die = atkRoll.dice.find(d => d.faces === 20);
            const naturalRoll = d20Die ? d20Die.results[0].result : 0;

            if (CONFIG.HYP3E.debugMessages) {
                console.log("rollAttackOrSpell/_executeRoll: Attack Roll:", atkRoll);
                console.log("rollAttackOrSpell/_executeRoll: Roll Result:", atkRoll.total);
                console.log("rollAttackOrSpell/_executeRoll: Natural d20 Roll:", naturalRoll);
            }
            return { atkRoll, naturalRoll };
        } catch (err) {
            console.error("rollAttackOrSpell/_executeRoll: Error rolling formula:", rollFormula, err);
            ui.notifications.error(`Error rolling formula: ${rollFormula}`);
            return { atkRoll: null, naturalRoll: 0 };
        }
    }

    /**
     * Determines if the roll hits or misses and generates result text.
     * @param {Roll} atkRoll - The completed roll object.
     * @param {number} naturalRoll - The natural d20 result.
     * @param {object|null} itemData - System data of the item used.
     * @param {number} targetAc - AC of the target.
     * @param {string} targetSize - Size category of the target.
     * @param {string} actorBaseClass - Base class for crit/fumble tables.
     * @param {string} actorId - Actor ID for crit/fumble tables.
     * @returns {{hit: boolean, attackTextResult: string, critFooterHTML: string}}
     */
    _determineHitResult(atkRoll, naturalRoll, itemData, targetAc, targetSize, actorBaseClass, actorId) {
        let hit = false;
        let attackTextResult = "";
        let critFooterHTML = "";
        const total = atkRoll.total;
        const isGrenade = itemData?.isGrenade ?? false;

        if (isGrenade) {
            // Grenade-like attack TN based on size
            let tn = 7;
            let sizeFromTable = "Stationary";
            switch (targetSize) {
                case "S": sizeFromTable = "Small"; tn = 13; break;
                case "M": sizeFromTable = "Medium"; tn = 11; break;
                case "L": sizeFromTable = "Large"; tn = 9; break;
            }
            if (total >= tn) {
                hit = true;
                attackTextResult = `<b>Hits a ${sizeFromTable} target!</b>`;
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell/_determineHitResult: Grenade Hit! ${total} >= ${tn}`); }
            } else {
                attackTextResult = `<b>Misses a ${sizeFromTable} target.</b>`;
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell/_determineHitResult: Grenade Miss! ${total} < ${tn}`); }
            }
        } else {
            // Normal attack TN based on AC
            const tn = 20 - targetAc;
            const hitAC = 20 - total; // AC the roll would hit

            if (naturalRoll === 20) {
                hit = true;
                attackTextResult = `<span style='color:#00b34c'><b>Critical Hit!</b></span>`;
                if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell/_determineHitResult: Natural 20 Crit Hit!"); }
                if (game.settings.get(game.system.id, "critHit")) {
                    critFooterHTML = `<div class='critical-hit' data-base-class='${actorBaseClass}' data-actor-id='${actorId}'></div>`;
                }
            } else if (naturalRoll === 1) {
                attackTextResult = `<span style='color:#e90000'><b>Critical Miss!</b></span>`;
                if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell/_determineHitResult: Natural 1 Crit Miss!"); }
                if (game.settings.get(game.system.id, "critMiss")) {
                    critFooterHTML = `<div class='critical-miss' data-base-class='${actorBaseClass}' data-actor-id='${actorId}'></div>`;
                }
            } else if (total >= tn) {
                hit = true;
                attackTextResult = `<b>Hits AC ${hitAC}!</b>`;
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell/_determineHitResult: Hit! ${total} >= ${tn}`); }
            } else {
                attackTextResult = `<b>Miss${hitAC <= 9 ? `, would have hit AC ${hitAC}` : 'es AC 9'}.</b>`;
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell/_determineHitResult: Miss! ${total} < ${tn}`); }
            }
        }

        return { hit, attackTextResult, critFooterHTML };
    }

    /**
     * Prepares damage formula strings if the attack hits.
     * @param {object} itemData - System data of the item.
     * @param {object} ammoMods - Modifiers from ammunition.
     * @param {object} actorData - Roll data context.
     * @returns {object} Object containing primary and secondary damage formulas {primary: {formula, debugFormula}, secondary: {formula, debugFormula}}.
     */
    _prepareDamageFormulas(itemData, ammoMods, actorData) {
        const dmgFormulas = {};
        // Build primary damage formula
        const dmgObj = Hyp3eDice.buildDamageFormula(itemData, ammoMods, actorData);
        dmgFormulas.primary = {
            formula: dmgObj.formula,
            debugFormula: dmgObj.debugFormula
        };
        if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell/_prepareDamageFormulas: Damage formula:", dmgObj.formula); }

        // Build secondary (e.g., 2-handed) damage formula if applicable
        if (itemData.damage2h) {
            dmgFormulas.secondary = {
                formula: dmgObj.formula2h,
                debugFormula: dmgObj.debugFormula2h
            };
            if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell/_prepareDamageFormulas: Damage formula 2H:", dmgObj.formula2h); }
        }
        return dmgFormulas;
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
     * 
     * @param {*} attacker - attacking token
     * @param {*} target - targeted token
     * @returns {Object} sitModObj { sitMod: number, sitModsArr: Array }
     */
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
            // attackerEffects = this._getAllApplicableEffects()
            attackerEffects = this.allApplicableEffects()
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
                // targetEffects = target.actor._getAllApplicableEffects()
                targetEffects = target.actor.allApplicableEffects()
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

    /**
     * Returns a thief skill modifier based on actor attributes.
     * @param {string} skillName - The thief skill being checked (e.g., "open locks").
     * @param {object} attributes - The actor's attributes (dx, in, ws).
     * @returns {{modifier: number, attribute: string|null}} The modifier to apply (0 or +1), and the attribute used.
     */
    _getThiefSkillModifier(skillName, attributes) {
        const skillMap = {
            // DX-based
            "climb": "dx",
            "hide": "dx",
            "manipulate traps": "dx",
            "move silently": "dx",
            "open locks": "dx",
            "pick pockets": "dx",
            // IN-based
            "decipher script": "in",
            "read scrolls": "in",
            // WS-based
            "discern noise": "ws"
        };

        const attrKey = skillMap[skillName.toLowerCase()];
        if (!attrKey) return { modifier: 0, attribute: null }; // not a thief progressive skill

        const score = attributes[attrKey] ?? 0;
        const modifier = score >= 16 ? 1 : 0;

        return { modifier: modifier, attribute: attrKey };
    }

    /**
     * Creates the HTML for the chat card header/label.
     * @param {string|null} itemImg - Path to the item image.
     * @param {string} itemName - Name of the item/action.
     * @returns {string} HTML string for the label.
     */
    _createChatLabel(itemImg, itemName) {
        // Use a default image if itemImg is missing
        const imgSrc = itemImg || "icons/svg/mystery-man.svg";
        return `
            <hr class="plain-hr" />
            <div style="margin: 10px 0;">
                <img src="${imgSrc}" style="border: none; float: left;" width="24px" height="24px">
                <span style="text-align: left; font-size: 12pt; font-weight: bold; margin-left: 6px;">
                    ${itemName}
                </span>
            </div>
            <hr class="plain-hr" />`;
    }
    /** END Helper Functions for item/attack rolls ------*/


    /** ITEM USAGE AND CONSUMPTION ----------------------*/

    /**
     * Processes dialog results, like consuming ammunition and returning magic ammo modifiers.
     * @param {object} rollResponse - The data returned from the dialog.
     * @param {Item|null} item - The item being used.
     * @param {object|null} itemData - The system data for the item.
     * @returns {Promise<{ammoMods: object, ammoUpdated: boolean}>} Object containing ammo modifiers and whether ammo was updated.
     */
    async _consumeAmmoOrItem(rollResponse, item, itemData) {
        let ammoMods = {};
        let ammoUpdated = false;

        // Decrement ammunition if selected
        if (item?.type === "weapon" && rollResponse.ammunition) {
            const ammo = this.items.get(rollResponse.ammunition);
            if (ammo && ammo.system.quantity?.value > 0) {
                ammoMods = this._parseItemMod(ammo.name);
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell/_consumeAmmoOrItem: Using ammo: ${ammo.name}`, ammo.system); }
                try {
                    await this.updateEmbeddedDocuments("Item", [
                        { _id: ammo.id, "system.quantity.value": ammo.system.quantity.value - 1 },
                    ]);
                    ammoUpdated = true;
                } catch (err) {
                    console.error(`rollAttackOrSpell/_consumeAmmoOrItem: Failed to update ammo quantity for ${ammo.name}:`, err);
                }
            } else if (rollResponse.ammunition && CONFIG.HYP3E.debugMessages) {
                console.warn(`rollAttackOrSpell/_consumeAmmoOrItem: Selected ammo ${rollResponse.ammunition} not found or has 0 quantity.`);
            }
        } else if (item?.type === "weapon" && item.system.isConsumable) {
            // If the weapon itself is consumable (like a grenade), decrement its qty
            try {
                await this.updateEmbeddedDocuments("Item", [
                    { _id: item.id, "system.quantity.value": item.system.quantity.value - 1 },
                ]);
            } catch (err) {
                console.error(`rollAttackOrSpell/_consumeAmmoOrItem: Failed to update quantity for ${item.name}:`, err);
            }
        }
        return { ammoMods, ammoUpdated };
    }

    /**
     * Consumes a spell slot if the spell is memorized.
     * @param {Item} spell - The spell being cast.
     */
    async _consumeSpellSlot(spell) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell/_consumeSpellSlot: Consuming memorized spell: ${spell.name}`); }
        try {
            await this.updateEmbeddedDocuments("Item", [
                { _id: spell.id, "system.quantity.value": spell.system.quantity.value - 1 },
            ]);
        } catch (err) {
            console.error(`rollAttackOrSpell/_consumeSpellSlot: Failed to update spell quantity for ${spell.name}:`, err);
        }
    }

    /**
     * Triggers the casting of an item-spell, with the item's CA to override the actor's
     * @param {*} item 
     * @param {*} spellUuid 
     * @returns null
     */
    async useItemSpell(item, spellUuid) {
        // Ensure item has spellcasting data
        const spellcasting = item.system?.spellcasting;
        if (!spellcasting?.hasSpells) {
            ui.notifications.warn(`${item.name} has no spells to cast.`);
            return;
        }

        // Load the spell
        const spell = await fromUuid(spellUuid);
        if (!spell || !(spell instanceof Item)) {
            ui.notifications.error(`Failed to load spell: ${spellUuid}`);
            return;
        }
        if (CONFIG.HYP3E.debugMessages) { console.log(`useItemSpell: casting spell ${spell.name}:`, spell) };

        // Get spell charges to use
        const spellEntry = item.system.spellcasting.spellRefs.find(spell => spell.uuid === spellUuid)
        const spellCharges = spellEntry.charges

        // Check item has enough charges (if applicable) for the spell
        if (spellcasting.charges.value >= 0 && spellcasting.charges.value < spellCharges) {
            ui.notifications.warn(`${item.name} does not have enough charges.`);
            return;
        }

        const dataset = {
            "rollType": "item",
            "rollMode": "publicroll",
            "label": `Cast spell ${spell.name}`,
            "itemId": spellUuid,
            "actorId": this.id,
            "baseClass": this.system.baseClass,
            "tokenId": this?.sheet?.token.id,
            "isItemSpell": true,
            "itemCa": item.system.spellcasting.ca
        }
        if (CONFIG.HYP3E.debugMessages) { console.log("useItemSpell dataset:", dataset) };
        // Cast the spell as if from the actor, but override CA from item
        await this.rollItem(dataset)

        // Deduct charges
        if (spellcasting.charges?.value != null) {
            item.update({ "system.spellcasting.charges.value": spellcasting.charges.value - spellCharges });
        }
    }

    /**
     * Toggle the light source on the actor's token.
     * Light sources are either all on or all off, we don't try to track multiple sources.
     * @param {*} itemId - The ID of the item to toggle light source for.
     * @returns - null
     */
    async toggleLightSource(itemId) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`toggleLightSource: actor ${this.name}:`, this); }
        const token = this?.token ?? this?.sheet?.token;
        if (!token) {
            if (CONFIG.HYP3E.debugMessages) { console.log(`toggleLightSource: no token found for actor ${this.name}.`); }
            return;
        }
        const item = this.items.get(itemId);
        if (!item) {
            if (CONFIG.HYP3E.debugMessages) { console.log(`toggleLightSource: item ${itemId} not found for actor ${this.name}.`); }
            return;
        }

        // Check if the token already has a light source
        const hasLight = token.light?.dim || token.light?.bright;
        if (hasLight) {
            // Remove the light source active effect from actor
            // const activeEffects = this.effects.filter(e => e.origin === item.uuid && e.name.startsWith("Light Source:"));
            const activeEffects = this.effects.filter(e => e.name.startsWith("Light Source:"));
            if (activeEffects.length > 0) {
                await activeEffects[0].delete();
                if (CONFIG.HYP3E.debugMessages) { console.log(`toggleLightSource: Light source active effect removed from actor ${this.name}.`); }
            } else {
                if (CONFIG.HYP3E.debugMessages) { console.log(`toggleLightSource: No active effect found for light source on actor ${this.name}.`); }
                // Remove light source from token, if necessary (e.g., if it was applied directly)
                await token.update({
                    "light": null
                });
            }
            ui.notifications.info(`Light source removed from ${token.name}.`);
            if (CONFIG.HYP3E.debugMessages) { console.log(`toggleLightSource: Light source removed from token ${token.name}.`); }
        } else {
            // Apply light source properties
            const lightProps = foundry.utils.deepClone(item.system.light);
            // Resolve duration roll formula to number
            if (lightProps.duration) {
                const durationRoll = new Roll(lightProps.duration, this.getRollData());
                await durationRoll.evaluate({ evaluateSync: true });
                lightProps.duration = durationRoll.total;
            } else {
                lightProps.duration = null; // Default to null if no duration specified
            }
            if (CONFIG.HYP3E.debugMessages) { console.log("Light source properties:", lightProps) }
            if (Object.keys(lightProps).length > 0) {
                ui.notifications.info(`Light source applied to ${token.name}.`);

                const lightEffect = new ActiveEffect({
                    name: `Light Source: ${item.name}`,
                    img: "icons/svg/light.svg",
                    origin: item.uuid,
                    disabled: false,
                    duration: { rounds: lightProps.duration || undefined },
                    flags: {
                        hyp3e: {
                            lightProps: lightProps
                        }
                    }
                });
                await this.createEmbeddedDocuments("ActiveEffect", [lightEffect]);
            }
        }
    }

    /**
     * Apply a light source to the actor's token.
     * @param {*} dim - The radius of the dim light effect.
     * @param {*} bright - The radius of the bright light effect.
     * @param {*} angle - The angle of the light cone, in degrees.
     * @param {*} lightData - (Optional) Additional light data to apply, such as color or intensity.
     */
    // async applyLightToSelf(dim, bright, angle, lightData = {}) {
    //     const token = this?.token ?? this?.sheet?.token;
    //     if (!token) {
    //         if (CONFIG.HYP3E.debugMessages) { console.log(`applyLightToSelf: no token found for actor ${this.name}.`); }
    //         return;
    //     }

        // Prepare the light data
        // const lightSource = {
        //     dim,
        //     bright,
        //     angle,
        //     color: lightData.color || "#ffffff", // Default to white if no color provided
        //     alpha: lightData.alpha || 0.5, // Default alpha
        //     animation: lightData.animation || { type: "none" } // Default animation
        // };
        // if (CONFIG.HYP3E.debugMessages) { console.log(`applyLightToSelf: Applying light source to token ${token.name}:`, lightSource); }
        // // Update the token with the light source
        // try {
        //     await token.update({
        //         "light": lightSource,
        //         "vision": true // Ensure the token can see
        //     });
        //     ui.notifications.info(`Light source applied to ${token.name}.`);
        //     if (CONFIG.HYP3E.debugMessages) { console.log(`applyLightToSelf: Light source applied to token ${token.name}.`); }
        // } catch (err) {
        //     console.error(`applyLightToSelf: Failed to apply light source to token ${token.name}:`, err);
        //     ui.notifications.error(`Failed to apply light source: ${err.message}`);
        // }
    // }

    /**
     * Handle active effects that might expire, or events that occur, with a new turn.
     * @param {*} turn - The current game-world turn number.
     */
    async advanceExplorationTurn(turn) {
        // Process active effects
        for (const effect of this.effects) {
            if (!effect.isTemporary || effect.disabled) continue; // Skip non-temporary or disabled effects
            if (CONFIG.HYP3E.debugMessages) { console.log(`advanceExplorationTurn: Processing effect ${effect.name} for actor ${this.name}...`, effect) }
            // Check if the effect has a remaining turns flag
            const remainingTurns = effect.getFlag("hyp3e", "remainingTurns");
            // An active effect "turn" is only a round, but a Hyperborea "turn" is 10 minutes or 60 rounds
            if (typeof remainingTurns === "number") {
                const newRemaining = remainingTurns - 1;
                if (newRemaining <= 0) {
                    effect.delete();
                    const msg = `The effect <b>${effect.name}</b> on ${this.name} has expired.`;
                    ui.notifications.info(msg);
                    sendSimpleChat(this, "", msg);
                } else {
                    effect.setFlag("hyp3e", "remainingTurns", newRemaining);
                }
                // Update temporary effects if not expired yet
                this.processTemporaryEffects();
            }
        }
        // Update temporary items & delete if expired
        this.processTemporaryItems(60); // 60 rounds = 10 minutes = 1 Hyperborea turn
    }

    /**
     * Handle active effects that might expire, or events that occur, by retreating one turn.
     * @param {*} turn - The current game-world turn number.
     */
    async retreatExplorationTurn(turn) {
        // Process active effects
        for (const effect of this.effects) {
            if (!effect.isTemporary || effect.disabled) continue; // Skip non-temporary or disabled effects
            if (CONFIG.HYP3E.debugMessages) { console.log(`retreatExplorationTurn: Processing effect ${effect.name} for actor ${this.name}...`, effect) }
            // Check if the effect has a remaining turns flag
            const remainingTurns = effect.getFlag("hyp3e", "remainingTurns");
            // An active effect "turn" is only a round, but a Hyperborea "turn" is 10 minutes or 60 rounds
            if (typeof remainingTurns === "number") {
                const newRemaining = remainingTurns + 1;
                effect.setFlag("hyp3e", "remainingTurns", newRemaining);
            }
        }
        // Update temporary items & delete if expired
        this.processTemporaryItems(-60); // 60 rounds = 10 minutes = 1 Hyperborea turn
    }

    /** SPECIALIZED SKILL/TASK RESOLUTION ---------------*/

    // Build the chat message for assassination
    _resolveAssassination(target, rollTotal, rollData) {
        /*
        Assassination
        =============
        The assassin's chance to kill a target outright is based on the difference between the roll 
        and the target's AC. The table below shows the results of the roll, and the number of levels 
        of success (or failure) that result from it.

        Logic:
        - If the original attack roll was a natural 19 or 20, the target must make a death save or die.
        - If the attack roll hit but was not a natural 19 or 20, we roll on the Assassination table.
        - The table uses an unmodified d20 roll, with a success if we roll the target number or lower.
        - A natural 17 or higher is an automatic fail, as 16 is the highest target number in the table.
        - The assassin's damage multiplier is based on his class level, and should be included in the 
        chat message.
        - We should be able to grab the previous damage roll and apply the multiplier automatically...
        need to test this. But it acts like a critical hit, so the code should be similar.
        */
        let assassinationHtml = ''
        let results = []
        console.log("Assassination roll data: ", rollData)
        console.log("Assassination target: ", target)
        const assassinLevel = parseInt(rollData.details.level.value)
        const baseSuccess = assassinLevel + 4
        const targetName = target.actor.name
        const targetLevel = parseInt(target.actor.type == "npc" ? target.actor.system?.hd.split("d")[0] : target.actor.system?.details.level.value)
        const targetDifficultyMod = Math.floor(targetLevel/2)
        const targetIsAssassin = target.actor.type == "character" && target.actor.system?.details.class == "Assassin"
        const assassinTargetMod = targetIsAssassin && targetLevel > assassinLevel ? (targetLevel - assassinLevel) : 0

        // Was this a complete fail?
        if (rollTotal > 16) {
            return `<p>Assassination attempt vs. ${targetName} failed...</p>`
        }

        // From here on it's mostly some level of success
        if (rollTotal <= baseSuccess - targetDifficultyMod - assassinTargetMod) {
            results.push(`<p>Assassination attempt vs. ${targetName} <b>succeeded</b>!</p>`)
            results.push(`<ul><li>The target must make a <i>death</i> saving throw or die.</li>`)
            results.push(`<ul><li>However, if the original d20 attack roll was a natural 19 or 20, then no saving throw is allowed.</li></ul>`)
            let backstabMult = ``
            if (assassinLevel >= 9) {
                backstabMult = `<b>×4</b>`
            } else if (assassinLevel >= 5) {
                backstabMult = `<b>×3</b>`
            } else {
                backstabMult = `<b>×2</b>`
            }
            results.push(`<li>If the target makes its <i>death</i> save, it still takes <b>backstab</b> damage. For a level ${assassinLevel} assassin, the backstab multipler is ${backstabMult}.</li>`)
            results.push(`<li>Other damage modifiers (strength, sorcery, etc.) are added after the dice are totaled.</li></ul>`)
            results.push(`<div class='save-button' style='padding-top: 5px' data-save='death'></div>`)
        } else {
            return `<p>Assassination attempt vs. ${targetName} failed...</p>`
        }
        assassinationHtml = results.join("")
        return assassinationHtml
    }

    // Build the chat message for turning undead
    _resolveTurnUndead(rollTotal, rollData) {
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
            return '<p>No undead were turned...</p>';
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
        turnUndeadHtml = `<p>Roll [[/r ${rollAffected}]] for the total number of undead affected. Starting from the weakest (lowest Type)...</p><ul>`
        for (let i = results.length-1; i >=0; i--) {
            turnUndeadHtml += results[i]
        }
        turnUndeadHtml += `</ul>`

        if (CONFIG.HYP3E.debugMessages) { console.log("Turn Undead: ", turnUndeadHtml) }
        return turnUndeadHtml;
    }

    /** LOOKUP TABLES AND FUNCTIONS ---------------------*/

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

}