import { Hyp3eCharacter } from "../helpers/character.mjs";
import { Hyp3eDice } from "../helpers/dice.mjs";
import { Hyp3eDialog } from "../helpers/dialog.mjs";
import { HYP3E } from "../helpers/config.mjs"
import { parseAndResolveChangeValue, setupEffectHandlers } from "../helpers/effects.mjs";

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
        // Testing how deepClone() works...
        // console.log(`CLONE_TEST: Actor ${this.name}:`, this)
        // const actorClone = foundry.utils.deepClone(this)
        // console.log(`CLONE_TEST: Clone of ${this.name}:`, actorClone)
    }

    /** @override */
    async prepareBaseData() {
        // Data modifications in this step occur before processing embedded
        // documents or derived data.
        const actorData = this;
        const systemData = actorData.system;

        // for (const effect of this.allApplicableEffects()) {
        //     for (const change of effect.changes) {
        //         if (CONFIG.HYP3E.debugMessages) { console.log(`Processing change ${change.key} of effect ${effect.name}...`) }
        //         let value = change.value;
        //         const newValue = await parseAndResolveChangeValue(value, this)
        //         if (newValue != value) {
        //             if (CONFIG.HYP3E.debugMessages) { console.log(`Change ${value} will be replaced with ${newValue}.`) }
        //             value = newValue
        //         } else {
        //             if (CONFIG.HYP3E.debugMessages) { console.log(`No change required for ${value}.`) }
        //         }
        //         // Update the change on the actor
        //         await foundry.utils.setProperty(this, change.key, value);
        //         if (CONFIG.HYP3E.debugMessages) { console.log(`Updated actor:`, this) }
        //     }
        // }

        // Auto-calculate AC, DR, MV if configuration is enabled -- for characters only
        // if (actorData.type == 'character') {
        //     if (CONFIG.HYP3E.autoCalcAc) {
        //         const acMvObj = this.getCharacterAcAndMv(actorData, systemData)
        //         systemData.ac.value = acMvObj["ac"]
        //         systemData.ac.dr = acMvObj["dr"]
        //         systemData.movement.base.value = acMvObj["mv"]
        //     }
        // }

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
            systemData.baseClass = Hyp3eCharacter.classData[systemData.details.class].baseClass || CONFIG.HYP3E.customClassData[charClass].baseClass;
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

        // Auto-calculate AC, DR, MV if configuration is enabled
        if (CONFIG.HYP3E.autoCalcAc) {
            const acMvObj = this.getCharacterAcAndMv(actorData, systemData)
            systemData.ac.value = acMvObj["ac"]
            systemData.ac.dr = acMvObj["dr"]
            systemData.movement.base.value = acMvObj["mv"]
        }
        // Apply temp AC, DR, and MV modifiers here
        if (parseInt(systemData.ac.tempAcMod)) {
            console.log(`Updated tempAcMod: ${systemData.ac.tempAcMod}`)
            systemData.ac.value -= parseInt(systemData.ac.tempAcMod)
        }
        if (parseInt(systemData.ac.tempDrMod)) {
            console.log(`Updated tempDrMod: ${systemData.ac.tempDrMod}`)
            systemData.ac.dr += parseInt(systemData.ac.tempDrMod)
        }
        if (parseInt(systemData.movement.tempMvMod)) {
            console.log(`Updated tempMvMod: ${systemData.movement.tempMvMod}`)
            systemData.movement.base.value += parseInt(systemData.movement.tempMvMod)
        }

        // Log the prepared data
        // if (CONFIG.HYP3E.debugMessages) { 
            console.log("Prepared Character Data: ", systemData) 
        // }

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
     * Quickly create a character actor from a basic dataset.
     * @param {Object} dataset - The dataset from the actor sheet.
     * @return {boolean} Success or failure of the character creation.
     */
    async quickCreateCharacter(dataset) {
        if (CONFIG.HYP3E.debugMessages) { console.log("quickCreateCharacter: dataset:", dataset) };
        const attributes = await Hyp3eCharacter.rollAttributesForClass(this, dataset);
        if (CONFIG.HYP3E.debugMessages) { console.log("quickCreateCharacter: Attributes:", attributes) };
        if (attributes) {
            // Set the attributes in the actor
            for (let [k, v] of Object.entries(attributes)) {
                await this.update({ system: { attributes: { [k]: { value: v } } } })
                this.system.attributes[k].value = v
            }
            const setAttrOk = await Hyp3eCharacter.setAttributeMods(dataset, true)
            if (!setAttrOk) return false; // If setting attribute mods failed, exit early

            const roll = new Roll(`${this.system.hd} + ${this.system.attributes.con.hpMod}`);
            await roll.evaluate({ evaluateSync: true });
            if (CONFIG.HYP3E.debugMessages) { console.log("quickCreateCharacter: HP roll result: ", roll) }
            if (roll != undefined && roll.total != undefined) {
                await this.update({
                    system: {
                        hp: {
                            value: roll.total,
                            max: roll.total
                        }
                    }
                });
                // Set the HP values in the actor
                this.system.hp.value = roll.total;
                this.system.hp.max = roll.total;
            } else {
                console.error("quickCreateCharacter: HP roll failed to evaluate properly.");
                return false;
            }
        } else {
            console.error("quickCreateCharacter: Attributes roll failed.");
            return false;
        }
        // Now we check to see if the Items directory has the folders & items we need.
        // Alternatively, we can also check for compendia with the items we need.
        // Start with armor...
        // const armorItems = await Hyp3eCharacter.getDefaultArmorForClass(this);
        const armorItems = await Hyp3eCharacter.getDefaultItemsForClass({
            actor: this,
            itemType: "armor",
            folderNames: ["armor", "armour"],
            packKey: "armour"
        });
        if (armorItems && armorItems.length > 0) {
            // Add the armor to the actor's inventory
            await this.createEmbeddedDocuments("Item", armorItems);
        }

        // Next we do weapons...
        // const weaponItems = await Hyp3eCharacter.getDefaultWeaponsForClass(this);
        const weaponItems = await Hyp3eCharacter.getDefaultItemsForClass({
            actor: this,
            itemType: "weapon",
            folderNames: ["weapons"],
            packKey: "weapons"
        });
        if (weaponItems && weaponItems.length > 0) {
            // Add the weapons to the actor's inventory
            await this.createEmbeddedDocuments("Item", weaponItems);
        }

        // Next we do all the equipment items...
        // const items = await Hyp3eCharacter.getDefaultItemsForClass(this);
        const generalItems = await Hyp3eCharacter.getDefaultItemsForClass({
            actor: this,
            itemType: "item",
            folderNames: ["equipment - general", "equipment - provisions", "equipment - religious", "gear", "equipment", "items"],
            packKey: "equipment - general"
        });
        if (generalItems && generalItems.length > 0) {
            // Add the items to the actor's inventory
            await this.createEmbeddedDocuments("Item", generalItems);
        }
        const provisionItems = await Hyp3eCharacter.getDefaultItemsForClass({
            actor: this,
            itemType: "item",
            folderNames: ["equipment - provisions", "equipment - general", "gear", "equipment", "items"],
            packKey: "equipment - provisions"
        });
        if (provisionItems && provisionItems.length > 0) {
            // Add the items to the actor's inventory
            await this.createEmbeddedDocuments("Item", provisionItems);
        }
        const religiousItems = await Hyp3eCharacter.getDefaultItemsForClass({
            actor: this,
            itemType: "item",
            folderNames: ["equipment - religious", "equipment - general", "gear", "equipment", "items"],
            packKey: "equipment - religious"
        });
        if (religiousItems && religiousItems.length > 0) {
            // Add the items to the actor's inventory
            await this.createEmbeddedDocuments("Item", religiousItems);
        }

        // Get starting gold
        const gold = await Hyp3eCharacter.getStartingGoldForClass(this);
        if (gold && gold > 0) {
            // Add the gold to the actor's inventory
            await this.update({"system.money.gp.value": gold});
            this.system.money.gp.value = gold;
        }

        // All good? Disable the quick-create button so it can't be used again.
        this.setFlag(game.system.id, "disableQuickCreate", true)
        return true;
    }

    /**
     * @override
     * Overrides the core system applyActiveEffects method on the actor.
     * Capture change values that include roll formulas or data paths, and resolve them
     * to a final number that can be applied to the actor.
     */
    async applyActiveEffects() {
        this.updateItemEffectChanges()
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
        // Apply temporary modifiers (typically from effects) to AC and DR
        // if (parseInt(systemData.ac.tempAcMod)) {
        //     if (CONFIG.HYP3E.debugMessages) { console.log(`Temp AC mod: ${systemData.ac.tempAcMod}`) }
        //     tempAC -= parseInt(systemData.ac.tempAcMod)
        // }
        // if (parseInt(systemData.ac.tempDrMod)) {
        //     if (CONFIG.HYP3E.debugMessages) { console.log(`Temp DR mod: ${systemData.ac.tempDrMod}`) }
        //     tempDR += parseInt(systemData.ac.tempDrMod)
        // }
        // // Apply temporary modifier (typically from effects) to encounter-mode MV
        // if (parseInt(systemData.movement.tempMvMod)) {
        //     if (CONFIG.HYP3E.debugMessages) { console.log(`Temp MV mod: ${systemData.movement.tempMvMod}`) }
        //     tempMV += parseInt(systemData.movement.tempMvMod)
        // }
        // Now calculate & set the final values...
        tempAC = tempAC - systemData.attributes.dex.defMod - shieldMod
        // AC can't be worse (higher) than 9, nor better than -9
        tempAC = Math.max(-9, Math.min(9, tempAC));
        return {
            "ac": tempAC,
            "dr": tempDR,
            "mv": tempMV
        }
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
     * Resolve item effect changes that include data paths or roll formulas.
     * Then update the item's effect/change with a number, so it becomes "permanent".
     */
    async updateItemEffectChanges() {
        for ( const item of this.items ) {
            if ( !item.system.equipped ) continue;
            for ( const effect of item.effects ) {
                if ( !effect.transfer ) continue;
                // Store all changes for a single batch update at the end
                let updatedChanges = [...effect.changes];  // Start with a shallow copy
                if (CONFIG.HYP3E.debugMessages) { console.log(`updateItemEffectChanges: Checking effect ${effect.name} for changes to resolve...`, updatedChanges) }
                let didUpdate = false;
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
                    if (CONFIG.HYP3E.debugMessages) { console.log(`updateItemEffectChanges: Effect ${effect.name} has updated Changes: `, updatedChanges) }
                    await effect.update({
                        changes: updatedChanges
                    });
                }
            }
        }
    }

    /**
     * Apply a health change (damage or healing) to the actor, optionally considering Damage Reduction (DR).
     * Handles HP clamping, DR application, and prevents updates if no actual change occurs.
     *
     * @param {number} amount - The amount of health change. Positive values represent damage, negative values represent healing.
     * @param {boolean} [applyDr=true] - If true (default), apply the actor's Damage Reduction (system.ac.dr) against positive (damage) amounts.
     * @returns {Promise<void|Error>} Returns nothing on success or early exit, or the Error object if the actor update fails.
     */
    async applyHealthChange(amount, applyDr = true) {
        const actorName = this.name ?? 'Unknown Actor'; // Use actor's name for logging

        // Input Validation
        if (typeof amount !== "number" || isNaN(amount)) {
            const errorMsg = `Invalid health change amount: '${amount}'. Must be a valid number.`;
            console.error(`applyHealthChange Error for ${actorName}: ${errorMsg}`);
            ui.notifications?.error(errorMsg);
            return; // Exit early for invalid input
        }

        if (CONFIG.HYP3E.debugMessages) {
            console.log(`applyHealthChange: Processing ${amount} HP change for ${actorName}. Apply DR: ${applyDr}`);
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
            // You might want to trigger "overkill" effects or messages here if applicable
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
                    // e.g., ChatMessage.create({content: `${this.name}'s armor absorbs the blow!`});
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
                // Find the effect that is applying temp HP, and update it
                netChange = await this.updateEffectValue("system.hp.tempHp", netChange, 0, 100);
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
            // Hooks.callAll("actorHealthChanged", this, currentHp, newHp, netChange, isDamage, isHealing);

        } catch (err) {
            // Log the error and notify the user if the update fails
            console.error(`applyHealthChange: Failed to update HP for ${actorName}:`, err);
            ui.notifications?.error(`Failed to update HP for ${actorName}. See console log for details.`);
            return err; // Return the error object
        }

        // Implicitly return undefined on successful update or handled early exit
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
            await this.applyHealthChange(totalDamage, false);

            // Post all the damage messages together
            const chatContent = `Applying persistent damage effects...<ul><li>${damageMessages.join("</li><li>")}</li></ul>`;
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
        const { item, itemData, itemName, attackTextBase } = await this._getItemDetails(dataset.itemId);
        // const item = this.items.get(dataset.itemId)
        dataset.roll = item.system.formula
        // let itemName = item.system.friendlyName != "" ? item.system.friendlyName : item.name

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
            dataset.isGrenade = item.system.isGrenade
            dataset.isAreaEffect = item.system.isAreaEffect
            dataset.label = `${attackTextBase} with ${itemName}`;
            if (item.system.isAreaEffect) {
                dataset.details = `No attack roll required to use ${itemName}.`
                dataset.noRoll = true
            }
            this.rollAttackOrSpell(dataset)
        } else if (item.type == "spell") {
            // Are we enforcing the spell memorization rule for PCs?
            if (!dataset.isItemSpell && CONFIG.HYP3E.forceSpellMemorize && this.type == "character") {
                // Check if the spell is memorized
                if (item.system.quantity.value <= 0) {
                    ui.notifications.warn(`${itemName} is not memorized!`)
                    return
                }
            }
            // The default for spells is to cast
            dataset.label = `${attackTextBase} ${itemName}`
            if (item.system.formula == "" || item.system.formula == undefined) {
                dataset.details = `No attack roll required to cast ${itemName}.`
                dataset.noRoll = true
            }
            // Log the dataset
            console.log(`Spellcasting dataset:`, dataset)
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
                        item._displayItemInChat(this)
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
                        item._displayItemInChat(this)
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

        // Determine success or failure on a simple check, not turning undead or assassinating
        if (!turnUndead && !assassinate) {
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
        } else if (turnUndead) {
            // Resolve the results of the attempted turning undead
            htmlContent = this.resolveTurnUndead(roll.total, rollData)
            success = true
        } else if (assassinate) {
            // Resolve the results of the attempted assassination
            htmlContent = this.resolveAssassination(targetToken, roll.total, rollData)
            success = true
        }
        // Hit must be false so we don't display any damage buttons
        roll.hit = false

        // Construct a custom chat card for the check
        await this.renderCustomChat(roll, item, tokenId, label, "", checkText, htmlContent, rollResponse.rollMode)

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
            item._displayItemInChat(this)
        } catch(err) {
            return
        }
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
        const actorData = this._getActorRollData();

        if (!item && !dataset.formula) { // If there's no item and no predefined formula (e.g., basic attack removed)
            console.warn("rollAttackOrSpell: No item or formula provided for the roll.");
            ui.notifications.warn("Cannot perform action: No item or formula specified.");
            return null;
        }
        dataset.itemName = itemName || "";

        // Early exit if item requires a roll but has no formula (data setup errors)
        if (item && !itemData.formula && (item.type === "weapon" || (item.type === "spell" && itemData.atkRoll))) {
            if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Item has no roll formula, displaying description instead."); }
            item._displayItemInChat(this);
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
            if (CONFIG.HYP3E.debugMessages) { console.log("rollAttackOrSpell: Target out of range and forceRangeLimit enabled. Aborting."); }
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
        // Handle Spell Slot Consumption (if applicable)
        if (!dataset.isItemSpell && item?.type === "spell" && itemData?.quantity?.value > 0) {
            await this._consumeSpellSlot(item);
        }
        // If there's no item roll formula (typically a spell), send a chat message and exit
        if (!itemData.formula) {
            item._displayItemInChat(this);
            return null;
        }

        // Process Dialog Response (Ammo, Mods)
        const { ammoMods, ammoUpdated } = await this._processDialogResponse(rollResponse, item, itemData);
        if (ammoUpdated) {
            // If ammo was used, refresh the actor sheet or relevant UI if needed
            // this.sheet.render(false); // Example
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

        // Render Chat Message
        const chatLabel = this._createChatLabel(item?.img, itemName);
        const finalAttackText = `${attackTextBase}${dataset.targetName ? ` vs. ${dataset.targetName}` : ''}... ${attackTextResult}`;

        await this.renderCustomChat(atkRoll, item, attacker?.id, chatLabel, debugAtkRollFormula, finalAttackText, critFooterHTML, rollResponse.rollMode); // Assuming this exists

        // Return Roll Result
        return atkRoll;
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
        const itemData = item ? { ...item.system, itemType: item.type } : null; // Include item type
        if (CONFIG.HYP3E.debugMessages) {
            console.log("rollAttackOrSpell/_getItemDetails: Item:", item);
            console.log("rollAttackOrSpell/_getItemDetails: Item Data:", itemData);
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
     * Retrieves actor roll data.
     * @returns {object} Actor's roll data.
     */
    _getActorRollData() {
        const actorData = this.getRollData(); // Assuming this method exists on the actor
        if (actorData) {
            actorData.actorType = this.type;
        }
        if (CONFIG.HYP3E.debugMessages) {
            console.log("rollAttackOrSpell/_getActorRollData: Actor roll data:", actorData);
        }
        return actorData;
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
            rangeGroup = "rangeGroup"; // Identifier for the dialog field
            ranges = {
                short: `Short (${itemData.range.short})`,
                medium: `Med (${itemData.range.medium})`,
                long: `Long (${itemData.range.long})`
            };
            if (gridDistance <= itemData.range.short) {
                chosenRange = "short";
            } else if (gridDistance <= itemData.range.medium) {
                chosenRange = "medium";
            } else if (gridDistance <= itemData.range.long) {
                chosenRange = "long";
            } else {
                chosenRange = "long"; // Default to long even if out
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
     * Processes dialog results, like consuming ammunition.
     * @param {object} rollResponse - The data returned from the dialog.
     * @param {Item|null} item - The item being used.
     * @param {object|null} itemData - The system data for the item.
     * @returns {Promise<{ammoMods: object, ammoUpdated: boolean}>} Object containing ammo modifiers and whether ammo was updated.
     */
    async _processDialogResponse(rollResponse, item, itemData) {
        let ammoMods = {};
        let ammoUpdated = false;

        // Decrement ammunition if selected
        // if (item?.type === "weapon" && itemData?.usesAmmo && rollResponse.ammunition) { // Check usesAmmo flag too?
        if (item?.type === "weapon" && rollResponse.ammunition) {
            const ammo = this.items.get(rollResponse.ammunition);
            if (ammo && ammo.system.quantity?.value > 0) {
                ammoMods = this._parseItemMod(ammo.name); // Assuming this helper exists
                if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell/_processDialogResponse: Using ammo: ${ammo.name}`, ammo.system); }
                try {
                    await this.updateEmbeddedDocuments("Item", [
                        { _id: ammo.id, "system.quantity.value": ammo.system.quantity.value - 1 },
                    ]);
                    ammoUpdated = true;
                } catch (err) {
                    console.error(`rollAttackOrSpell/_processDialogResponse: Failed to update ammo quantity for ${ammo.name}:`, err);
                }
            } else if (rollResponse.ammunition && CONFIG.HYP3E.debugMessages) {
                console.warn(`rollAttackOrSpell/_processDialogResponse: Selected ammo ${rollResponse.ammunition} not found or has 0 quantity.`);
            }
        }
        return { ammoMods, ammoUpdated };
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
     * Consumes a spell slot if the spell is memorized.
     * @param {Item} spellItem - The spell item being cast.
     */
    async _consumeSpellSlot(spellItem) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`rollAttackOrSpell/_consumeSpellSlot: Consuming memorized spell: ${spellItem.name}`); }
        try {
            await this.updateEmbeddedDocuments("Item", [
                { _id: spellItem.id, "system.quantity.value": spellItem.system.quantity.value - 1 },
            ]);
            // Optionally refresh sheet: this.sheet.render(false);
        } catch (err) {
            console.error(`rollAttackOrSpell/_consumeSpellSlot: Failed to update spell quantity for ${spellItem.name}:`, err);
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
    // END Helper Functions for attack rolls & spellcasting


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

    async useItemSpell(item, spellUuid) {
        // Ensure item has spellcasting data
        const spellcasting = item.system?.spellcasting;
        if (!spellcasting?.hasSpells) {
            ui.notifications.warn(`${item.name} has no spells to cast.`);
            return;
        }

        // Check item charges
        if (spellcasting.charges?.value === 0) {
            ui.notifications.warn(`${item.name} is out of charges.`);
            return;
        }

        // Load the spell
        const spell = await fromUuid(spellUuid);
        if (!spell || !(spell instanceof Item)) {
            ui.notifications.error(`Failed to load spell: ${spellUuid}`);
            return;
        }
        if (CONFIG.HYP3E.debugMessages) { console.log("useItemSpell spell:", spell) };

        // Get spell charges to use
        const spellEntry = item.system.spellcasting.spellRefs.find(spell => spell.uuid === spellUuid)
        const spellCharges = spellEntry.charges

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

    // Build the chat message for assassination
    resolveAssassination(target, rollTotal, rollData) {
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
            return '<p>No undead were turned...</p>'
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

    // Return an array of applicable effects
    // _getAllApplicableEffects() {
    //     let effects = []
    //     // Get all effects from the actor
    //     for ( const effect of this.effects ) {
    //         effects.push(effect);
    //     }
    //     for ( const item of this.items ) {
    //         for ( const effect of item.effects ) {
    //             if ( effect.transfer ) effects.push(effect);
    //         }
    //     }
    //     return effects;
    // }

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
        let effectsArray = []
        effects.forEach(effect => {
            // Log the effect
            if (CONFIG.HYP3E.debugMessages) { console.log(`Actor ${this.name}, effect ${effect.name}:`, effect) }
            effectsArray.push(effect.name)
        })
        return effectsArray
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
        const attrReqs = Hyp3eCharacter.classData[this.system.details.class]?.attrReqs || CONFIG.HYP3E.customClassData[this.system.details.class];
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
        const attr = spellLvl.substring(0,3) // Get the attribute name (int or wis)
        const spellLevel = spellLvl.substring(3).toLowerCase() // Get the spell level (Lvl1, Lvl2, etc.)
        const key = `system.attributes.${attr}.bonusSpells.${spellLevel}`;
        await this.update({ [key]: val });
        // this.render(true)
        if (CONFIG.HYP3E.debugMessages) { console.log("updateBonusSpell update:", key, val) }
    }

}