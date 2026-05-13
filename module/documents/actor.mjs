import { Hyp3eCharacterClass } from "../helpers/character.mjs";
import { Hyp3eDice, isPureNumber, isPureString, containsDice, containsMathOrVariables, convertToInt } from "../dice/dice.mjs";
import { Hyp3eDialog } from "../helpers/dialog.mjs";
import { Hyp3eLogger } from "../helpers/logger.mjs";
import { logEffectRegistry, checkAndResolveDuration } from "../helpers/effects.mjs";
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
    super.prepareBaseData();

    const systemData = this.system;

    if (this.type === 'character') {
      // Log the prepared data
      // const sysData = foundry.utils.deepClone(this.system);
      // Hyp3eLogger.info("Hyp3eActor prepareBaseData", `${this.displayName} base data:`, this);
    }

  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   */
  async prepareDerivedData() {
    super.prepareDerivedData();

    const systemData = this.system;
    const flags = this.flags.hyp3e || {};
    // systemData.hp.percentage = Math.clamp((systemData.hp.value * 100) / systemData.hp.max, 0, 100);

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
    // Hyp3eLogger.info("Hyp3eActor prepareDerivedData", `tempModifiers[]:`, systemData.tempModifiers);
    systemData.tempModifiers.forEach((mod, id) => {
      // Hyp3eLogger.info("Hyp3eActor prepareDerivedData", `tempModifiers[${id}]:`, mod);
      // const obj = JSON.parse(mod)
      // EXAMPLE: obj = JSON.parse('{"templateField": "system.ac.value", "source": "isEncumbered", "modifier": 1}')
      // Hyp3eLogger.info("Hyp3eActor prepareDerivedData", `tempModifiers[${id}]:`, obj);
    })

    // Initialize ephemeral effect condition state object
    systemData._hyp3eEffectConditionState = systemData._hyp3eEffectConditionState || {};

    // Separate methods for each Actor type (character vs. npc) to keep things organized
    this._prepareCharacterData();
    this._prepareNpcData();

    // Hyp3eLogger.info("Hyp3eActor prepareDerivedData", `${this.name} Save after derive:`, this.system.saves.avoidance.value);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData() {
    if (this.type !== 'character') return;

    // Make modifications to base data here
    // const systemData = this.system;

    // Calculated fields go here...

    // // Add actor type & base class, used for crit hit & crit miss tables
    // const customClassData = game.settings.get(game.system.id, "customClassData");
    // try {
    //   systemData.baseClass = Hyp3eCharacterClass.classData[systemData.details.class]?.baseClass ?? customClassData[systemData.details.class]?.baseClass;
    // } catch (err) {
    //   // No match found (happens with custom classes), use "npc"
    //   systemData.baseClass = "npc"
    // }

    // Auto-calculate attribute modifiers if configuration is enabled
    // if (game.settings.get(game.system.id, "autoCalcAttrMods")) {
    //   const attributeData = this._calcAttrMods(this.id, systemData);
    //   if (attributeData) {
    //     systemData.attributes = attributeData;
    //   }
    // }

    // Calculate weight carried & encumbrance
    // systemData.weightCarried = this._calcWeightCarried();

    // What weight-class of armor (if any) is worn?
    // const items = this._getEquippedProtectionItems();
    // let armorType = "unarmored";
    // for (const item of items) {
    //   const sys = item.system ?? {};
    //   if (item.type === "armor" && sys.type !== "shield") {
    //     armorType = sys.type || "unarmored";
    //     break; // We assume only one armor will be worn, so break after the first match
    //   }
    // }
    // systemData.wornArmorType = armorType;

    // Get encumbered status
    // systemData.encumberedState = this._getEncumberedStatus(systemData);

    // Auto-calculate AC, DR, MV if configuration is enabled
    // if (game.settings.get(game.system.id, "autoCalcAc")) {
    //   this.updateCharacterAcAndMv(systemData)
    // }

    // Apply temp AC, DR, and MV modifiers
    // this._applyTempModifiers(systemData);

    // Log the prepared data
    // const sysData = foundry.utils.deepClone(systemData);
    // Hyp3eLogger.info("Hyp3eActor _prepareCharacterData", `${this.name} system data:`, sysData);
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData() {
    if (this.type !== 'npc') return;

    // Make modifications to data here
    // const systemData = this.system

    // Calculated fields go here...

    // Apply temp AC, DR, and MV modifiers
    // this._applyTempModifiers(systemData);

    // Add actor base class, used for crit hit & crit miss tables
    // systemData.baseClass = "npc"
  }

  /**
   * @override
   * Set token defaults when actor is created
   */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    Hyp3eLogger.info("Hyp3eActor _preCreate", `Starting data:`, data)

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
    if (data.type === "merchant") {
      this.updateSource({
        "prototypeToken.actorLink": true,
        "img": "icons/svg/coins.svg"
      });
    }
    if (data.type === "treasure") {
      this.updateSource({
        "prototypeToken.actorLink": true,
        "img": "icons/svg/chest.svg"
      });
    }
    if (data.type === "itemToken") {
      this.updateSource({
        "img": "icons/svg/item-bag.svg"
      });
    }
  }

  /**
   * @override
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    let data = super.getRollData();
    data.actorId = this.id
    // data.actorType = this.type;
    data.actorName = this.name;

    // Prepare character/npc roll data.
    data = this._getCharacterRollData(data);
    // data = this._getNpcRollData(data);  // POSSIBLE FUTURE USE
    // Hyp3eLogger.info("Hyp3eActor getRollData", `${this.name} data:`, data);
    return data;
  }

  /**
   * @override
   * Override actor update() method.
   */
  // async update(data, options={}) {
  //   console.group(`[Hyp3eActor update] Actor ${this.name}`);
  //   Hyp3eLogger.info("Hyp3eActor update", `Updating ${this.name} with data:`, data);
  //   Hyp3eLogger.info("Hyp3eActor update", `Update options:`, options);
  //   Hyp3eLogger.info("Hyp3eActor update", `Current _source:`, this._source);
  //   const result = await super.update(data, options);
  //   Hyp3eLogger.info("Hyp3eActor update", `After update data:`, this.system);
  //   Hyp3eLogger.info("Hyp3eActor update", `After update _source:`, this._source);
  //   console.groupEnd();

  //   return result;
  // }

  /**
   * @override
   * Overrides the core system applyActiveEffects method on the actor.
   * Capture change values that include roll formulas or data paths, and resolve them
   *  to a final number that can be applied to the actor's overrides.
   */
  applyActiveEffects(phase = null) {
    const majorVersion = Number(game.version?.split(".")[0] ?? game.data.version.split(".")[0]);
    if (majorVersion >= 14) {
      return this.applyActiveEffectsV14(phase);
    }

    const overrides = {};
    this.statuses.clear();

    // HYP3E CUSTOMIZATION: Simple sanity check to see if we have any applicable effects.
    const allApplicableEffects = Array.from(this.allApplicableEffects());
    if (allApplicableEffects.length === 0) return;
    Hyp3eLogger.info("Hyp3eActor applyActiveEffects", `${this.name} before apply:`, { Actor: this, Effects: allApplicableEffects });

    // HYP3E CUSTOMIZATION: For items that apply effects with variables, we resolve 
    //  those variables on the item effect rather than the actor
    this.updateItemEffects()
    // Back to standard Foundry code...

    // Organize non-disabled effects by their application priority
    const changes = [];
    for ( const effect of this.allApplicableEffects() ) {
      // Skip if disabled or not active
      if ( effect.disabled || !effect.active ) continue;

      // HYP3E CUSTOMIZATION: We validate effect conditions at the point of application 
      //  rather than filtering them out in allApplicableEffects() because we want 
      //  them to still be included in the actor data for use in things like the 
      //  character sheet, even if their conditions aren't currently met.
      const conditionPasses = this._effectApplies(effect);
      // Store temporary effect condition state in actor (used by actor sheet)
      this.system._hyp3eEffectConditionState = this.system._hyp3eEffectConditionState || {};
      this.system._hyp3eEffectConditionState[effect.uuid] = conditionPasses ? "active" : "inactive";

      if (conditionPasses === false) {
        Hyp3eLogger.info("Hyp3eActor applyActiveEffects", `Skipping effect "${effect.name}" on ${this.name} — condition not met:`, effect.flags.hyp3e?.condition);
        continue;
      }
      // Back to standard Foundry code...

      // Foundry v13 vs. v14 changes how effect changes are stored
      const effectChanges = effect?.changes || effect?.system.changes || [];
      changes.push(...effectChanges.map(change => {
        const c = foundry.utils.deepClone(change);
        c.effect = effect;
        c.priority = c.priority ?? (c.mode * 10);
        return c;
      }));
      // If the effect includes any status icons, add it/them to the actor
      // for ( const statusId of effect.statuses ) this.statuses.add(statusId);
    }
    if ( changes.length === 0 ) return;

    changes.sort((a, b) => a.priority - b.priority);
    Hyp3eLogger.info("Hyp3eActor applyActiveEffects", `Prioritized changes to ${this.name}:`, changes);

    // Apply active/enabled changes
    let changeCount = 0;
    for ( const change of changes ) {
      if ( !change.key ) continue;    // This should never happen

      // HYP3E CUSTOMIZATION: Explicitly skip changes to AC, DR, and MV, if autoCalcAc is true
      if (game.settings.get(game.system.id, "autoCalcAc")) {
        if (["system.ac.value", "system.ac.dr", "system.movement.base.value"].includes(change.key)) {
          Hyp3eLogger.info("Hyp3eActor applyActiveEffects", `Skipping AC/DR/MV change:`, change);
          continue;
        }
      }
      // Now we can apply updates to the actor based on the change data. 
      //  We use the change.effect property to access the full effect data, which is necessary 
      //  for resolving variables in the change.value string.
      const changes = change.effect.apply(this, change);
      Object.assign(overrides, changes);
      changeCount++;
    }
    Hyp3eLogger.info("Hyp3eActor applyActiveEffects", `${changeCount} of ${changes.length} changes applied to ${this.name}:`, changes);
    // Expand the set of final overrides
    Hyp3eLogger.info("Hyp3eActor applyActiveEffects", `${this.name} effect overrides:`, overrides);
    this.overrides = foundry.utils.expandObject(overrides);

    Hyp3eLogger.info("Hyp3eActor applyActiveEffects", `${this.name} after apply:`, this);
  }

  /**
   * Apply any transformations to the Actor data which are caused by ActiveEffects.
   * @param {string} phase The application phase under which changes are to be applied.
   */
  applyActiveEffectsV14(phase) {
    const ActiveEffect = foundry.documents.ActiveEffect.implementation;
    if ( typeof phase !== "string" ) {
      phase = this._completedActiveEffectPhases.has("initial") ? "final" : "initial";
      const message = 'Actor#applyActiveEffects must be called with a string phase identifier, with "initial"'
        + " as the first phase.";
      foundry.utils.logCompatibilityWarning(message, {since: 14, until: 16, once: true});
    }
    else if ( !(phase in ActiveEffect.CHANGE_PHASES) ) {
      const error = new Error(`"${phase}" is not a registered ActiveEffect application phase.`);
      Hooks.onError("Actor#applyActiveEffects", error, {log: "error"});
    }
    if ( this._completedActiveEffectPhases.has(phase) ) {
      const error = new Error(`ActiveEffect application phase "${phase}" has already completed and cannot be run again`
        + " in this Actor's data-preparation cycle.");
      Hooks.onError("Actor#applyActiveEffects", error, {log: "error"});
      return;
    }
    this._completedActiveEffectPhases.add(phase);

    // Organize non-disabled effects by their application priority
    /** @type {ActiveEffectChangeData[]} */
    const changes = [];
    /** @type {ActiveEffectChangeData[]} */
    const tokenChanges = [];
    for ( const effect of this.allApplicableEffects() ) {
      if ( !effect.active ) continue;

      // HYP3E CUSTOMIZATION: We validate effect conditions at the point of application 
      //  rather than filtering them out in allApplicableEffects() because we want 
      //  them to still be included in the actor data for use in things like the 
      //  character sheet, even if their conditions aren't currently met.
      const conditionPasses = this._effectApplies(effect);
      // Store temporary effect condition state in actor (used by actor sheet)
      this.system._hyp3eEffectConditionState = this.system._hyp3eEffectConditionState || {};
      this.system._hyp3eEffectConditionState[effect.uuid] = conditionPasses ? "active" : "inactive";

      if (conditionPasses === false) {
        Hyp3eLogger.info("Hyp3eActor applyActiveEffects", `Skipping effect "${effect.name}" on ${this.name} — condition not met:`, effect.flags.hyp3e?.condition);
        continue;
      }
      // Back to standard Foundry v14 code...

      for ( const change of effect.system.changes ) {
        if ( (change.key === "") || (change.phase !== phase) ) continue;

        // // HYP3E CUSTOMIZATION: Explicitly skip changes to AC, DR, and MV, if autoCalcAc is true
        // if (game.settings.get(game.system.id, "autoCalcAc")) {
        //   if (["system.ac.value", "system.ac.dr", "system.movement.base.value"].includes(change.key)) {
        //     Hyp3eLogger.info("Hyp3eActor applyActiveEffects", `Skipping AC/DR/MV change:`, change);
        //     continue;
        //   }
        // }
        // Back to standard Foundry v14 code...
  
        const copy = foundry.utils.deepClone(change);
        copy.effect = effect;
        if ( copy.key?.startsWith("token.") ) { // Keep Token changes separate for later application
          copy.key = copy.key.slice(6);
          tokenChanges.push(copy);
        }
        else changes.push(copy);
      }
      if ( phase === "initial" ) {
        for ( const statusId of effect.statuses ) this.statuses.add(statusId);
      }
    }
    changes.sort((a, b) => a.priority - b.priority);
    ActiveEffect._shimChanges(changes);
    this.tokenActiveEffectChanges[phase] = tokenChanges;

    // Apply all changes
    const overrides = {};
    const replacementData = this.getRollData();
    for ( const change of changes ) {
      const result = ActiveEffect.applyChange(this, change, {replacementData});
      if ( foundry.utils.isPlainObject(result) ) Object.assign(overrides, result);
    }

    // Expand the set of final overrides
    foundry.utils.mergeObject(this.overrides, foundry.utils.expandObject(overrides));
  }

  /** ACTOR DATA HELPERS ------------------------------*/

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return data;

    // Copy the attribute scores to the top level, so that rolls can use
    //   formulas like `@str.atkMod`.
    if (data.attributes) {
      for (let [k, v] of Object.entries(data.attributes)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }
    // Add movement to top level of data
    if (data.movement) {
      data.mv = data.movement.base.value ?? 0;
    }
    // Add character's class to top level of data
    if (data.details.class) {
      data.class = data.details.class ?? "npc";
    }
    // Add character's level to top level of data
    if (data.details.level) {
      data.lvl = data.details.level.value ?? 0;
    }
    return data;
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return data;
    // Anything to load?
    return data;
  }

  /**
   * Apply temporary AC, DR, and MV modifiers to the actor's system data.
   * Centralized helper used by both character and NPC preparation functions.
   * @param {Object} systemData
   */
  // _applyTempModifiers(systemData) {
  //   const tempAcMod = parseInt(systemData.ac?.tempAcMod) || 0;
  //   const tempDrMod = parseInt(systemData.ac?.tempDrMod) || 0;
  //   const tempMvMod = parseInt(systemData.movement?.tempMvMod) || 0;

  //   if (tempAcMod) {
  //     Hyp3eLogger.info("Hyp3eActor _applyTempModifiers", `Applying temp AC mod: ${tempAcMod}`);
  //     systemData.ac.value = Math.clamp(systemData.ac.value - tempAcMod, -9, 9);
  //   }

  //   if (tempDrMod) {
  //     Hyp3eLogger.info("Hyp3eActor _applyTempModifiers", `Applying temp DR mod: ${tempDrMod}`);
  //     systemData.ac.dr += tempDrMod;
  //   }

  //   if (tempMvMod) {
  //     Hyp3eLogger.info("Hyp3eActor _applyTempModifiers", `Applying temp MV mod: ${tempMvMod}`);
  //     systemData.movement.base.value += tempMvMod;
  //   }
  // }

  /**
   * Automatically calculate and populate character attribute modifiers
   * @param {string} actorId - this actor's ID, used for lookup
   * @param {object} - this actor's system data
   * @returns {object} - JSON object of attributes and modifiers
   */
  // _calcAttrMods(actorId, systemData) {
  //   if (!actorId) return;
  //   // Calculate the entire attributes object
  //   const attributeData = Hyp3eCharacterClass.calcAttrMods(systemData);
  //   // Hyp3eLogger.info("Hyp3eActor _calcAttrMods", `Initial attribute data for ${this.name}:`, attributeData);

  //   // Starting here, we apply active effects that update the modifiers...
  //   const allowedKeys = [
  //     "system.attributes.str.atkMod", 
  //     "system.attributes.str.dmgMod", 
  //     "system.attributes.str.test", 
  //     "system.attributes.str.feat", 
  //     "system.attributes.dex.atkMod", 
  //     "system.attributes.dex.defMod", 
  //     "system.attributes.dex.test", 
  //     "system.attributes.dex.feat", 
  //     "system.attributes.con.hpMod", 
  //     "system.attributes.con.poisRadMod", 
  //     "system.attributes.con.traumaSurvive", 
  //     "system.attributes.con.test", 
  //     "system.attributes.con.feat", 
  //     "system.attributes.int.languages", 
  //     "system.attributes.int.bonusSpells.lvl1", 
  //     "system.attributes.int.bonusSpells.lvl2", 
  //     "system.attributes.int.bonusSpells.lvl3", 
  //     "system.attributes.int.bonusSpells.lvl4", 
  //     "system.attributes.int.learnSpell", 
  //     "system.attributes.wis.willMod", 
  //     "system.attributes.wis.bonusSpells.lvl1", 
  //     "system.attributes.wis.bonusSpells.lvl2", 
  //     "system.attributes.wis.bonusSpells.lvl3", 
  //     "system.attributes.wis.bonusSpells.lvl4", 
  //     "system.attributes.wis.learnSpell", 
  //     "system.attributes.cha.reaction", 
  //     "system.attributes.cha.maxHenchmen", 
  //     "system.attributes.cha.turnUndead", 
  //   ];

  //   const changes = [];
  //   for ( const effect of this.allApplicableEffects() ) {
  //     // Skip if disabled or not active
  //     if ( effect.disabled || !effect.active ) continue;

  //     // Validate effect condition is met before applying changes
  //     const conditionPasses = this._effectApplies(effect);
  //     // Store temporary effect condition state in actor (used by actor-sheet)
  //     systemData._hyp3eEffectConditionState = systemData._hyp3eEffectConditionState || {};
  //     systemData._hyp3eEffectConditionState[effect.uuid] = conditionPasses ? "active" : "inactive";

  //     if (!conditionPasses) {
  //       Hyp3eLogger.info("Hyp3eActor _calcAttrMods", `Skipping effect "${effect.name}" on ${this.name} — condition not met:`, effect.flags.hyp3e?.condition);
  //       continue;
  //     }

  //     // Only include changes to allowed keys
  //     const filtered = effect.changes
  //       .filter(change => allowedKeys.includes(change.key))
  //       .map(change => {
  //         const c = foundry.utils.deepClone(change);
  //         c.effect = effect;
  //         c.priority = c.priority ?? (c.mode * 10);
  //         return c;
  //       });
  //     changes.push(...filtered);
  //   }

  //   // Do we have any changes to apply?
  //   if ( changes.length > 0 ) {
  //     // Organize effects by their priority (though it probably doesn't matter)
  //     changes.sort((a, b) => a.priority - b.priority);

  //     // Update attributeData object with ActiveEffect changes
  //     for (const change of changes) {
  //       // Parse the change.value string and resolve it into a number if possible
  //       let resolvedChange = null;
  //       if (isPureNumber(change.value)) {
  //         resolvedChange = Number(change.value) || 0;
  //       } else if (isPureString(change.value)) {
  //         resolvedChange = change.value;
  //       } else if (containsDice(change.value)) {
  //         // Dice rolls require async processing, which we can't do during _prepareData
  //         Hyp3eLogger.warn("Hyp3eActor _calcAttrMods", `Change "${change.value}" contains a dice roll formula, which is not allowed for attribute modifiers. Skipping...`);
  //         continue;
  //       } else if (containsMathOrVariables(change.value)) {
  //         // No dice rolls, we can do it synchronously
  //         resolvedChange = Hyp3eDice.resolveFormulaWithMath(change.value, systemData);
  //       }

  //       Hyp3eLogger.info("Hyp3eActor _calcAttrMods", `Applying ${change.effect.name} to ${this.name}'s ${change.key}:`, { resolvedChange, change });

  //       let path = change.key; // e.g. "system.attributes.str.atkMod"
  //       path = path.replace(/^system\.attributes\./, "");
  //       let attrModValue = foundry.utils.getProperty(attributeData, path);
  //       // Convert strings to numbers if necessary, but leave booleans alone
  //       if (isPureNumber(attrModValue)) attrModValue = Number(attrModValue);
  //       // Apply change based on mode
  //       switch (change.mode) {
  //         case CONST.ACTIVE_EFFECT_MODES.ADD: attrModValue += resolvedChange; break;
  //         case CONST.ACTIVE_EFFECT_MODES.MULTIPLY: attrModValue *= resolvedChange; break;
  //         case CONST.ACTIVE_EFFECT_MODES.OVERRIDE: attrModValue = resolvedChange; break;
  //         // Pretty sure we don't need the other effect modes
  //       }
  //       foundry.utils.setProperty(attributeData, path, attrModValue);
  //     }
  //   }
  //   Hyp3eLogger.info("Hyp3eActor _calcAttrMods", `Calculated attribute data for ${this.name}:`, attributeData);
  //   return attributeData;
  // }

  /**
   * Calculate the total weight carried by the actor. Only used with characters.
   * @returns {number} Total weight carried, rounded to one decimal place
   */
  // _calcWeightCarried() {
  //   let carriedWt = 0;
  //   // Start with carried/equipped items. We ignore weight of non-equipped items since they are not being carried.
  //   for (let item of this.items) {
  //     // Calculate total weight carried by the character. For weapons & armor, the equipped
  //     //  status is ignored and the item weight is always added to encumbrance.
  //     //  For non-weapon items, the equipped status is used to determine if the item
  //     //  is carried or not.
  //     const normalGear = ['item', 'container'];
  //     const combatGear = ['weapon', 'armor', 'shield'];
  //     if (item.system.weight && item.system.quantity.value) {
  //       // Is this a normal item, and is it carried?
  //       if (normalGear.includes(item.type) && item.system.equipped) {
  //         if (item.system.quantity.bundle && item.system.quantity.bundle > 1) {
  //           // For bundled items, we calculate weight based on number of bundles
  //           carriedWt += (item.system.weight * (item.system.quantity.value / item.system.quantity.bundle))
  //         } else {
  //           // Normal unbundled item
  //           carriedWt += (item.system.weight * item.system.quantity.value)
  //         }
  //       } else if (combatGear.includes(item.type)) {
  //         if (item.system.quantity.bundle && item.system.quantity.bundle > 1) {
  //           // For bundled items, we calculate weight based on number of bundles
  //           carriedWt += (item.system.weight * (item.system.quantity.value / item.system.quantity.bundle))
  //         } else {
  //             carriedWt += (item.system.weight * item.system.quantity.value)
  //         }
  //       }
  //     }
  //   }

  //   // If enabled, add coin weight (100 coins = 1 lb)
  //   if (CONFIG.HYP3E.enableCoinWeight) {
  //     for (const [coinType, coinData] of Object.entries(this.system.money)) {
  //       if (coinData.value) {
  //         let val = convertToInt(coinData.value);
  //         if (!isNaN(val) && val > 0) {
  //           carriedWt += val / 100;
  //         }
  //       }
  //     }
  //   }

  //   // Round to one decimal place
  //   carriedWt = Math.round(carriedWt * 10)/10;

  //   // Log the calculated weight
  //   Hyp3eLogger.info("Hyp3eActor _calcWeightCarried", `${this.name} is carrying ${carriedWt} pounds.`);

  //   // Return the final carried weight
  //   return carriedWt;
  // }

  /**
   * Determine the actor's encumbrance status based on weight carried and strength.
   * @param {*} systemData - The actor system data object
   * @returns {string} - "unencumbered", "encumbered", or "heavilyEncumbered"
   */
  // _getEncumberedStatus(systemData) {
  //   // Calc constants for encumbrance thresholds
  //   const encumberedWt = this.system.attributes.str.curr * CONFIG.HYP3E.encumbered
  //   const heavilyEncumberedWt = this.system.attributes.str.curr * CONFIG.HYP3E.heavilyEncumbered
  //   if (CONFIG.HYP3E.enableEncumbrance) {
  //     // this.encumbrance is currently calculated by the ActorSheet, though I would
  //     //  like to move that to the Actor data preparation phase eventually.
  //     if (systemData.weightCarried > heavilyEncumberedWt) {
  //       return "heavilyEncumbered";
  //     } else if (systemData.weightCarried > encumberedWt) {
  //       return "encumbered";
  //     } else {
  //       return "unencumbered";
  //     }
  //   }
  //   return "unencumbered";
  // }

  /**
   * Mutate the character's AC, DR, and MV in the actor's system data
   * @param {*} systemData - The actor system data object
   */
  // updateCharacterAcAndMv(systemData) {
  //     Hyp3eLogger.info("Hyp3eActor updateCharacterAcAndMv", `Calculating AC, DR, and MV for actor ${this.name}...`);
  //     const { ac, dr, mv } = this._calculateAcDrMv(systemData);
  //     systemData.ac.value = ac;
  //     systemData.ac.dr = dr;
  //     systemData.movement.base.value = mv;
  // }

  /**
   * Calculate the character's AC, DR, and MV based on equipped armor, shields, etc.
   * @param {*} systemData - The actor system data object
   * @returns 
   */
  // _calculateAcDrMv(systemData) {
  //   let ac = 9;
  //   let mv = 40;
  //   let dr = 0;
  //   let shieldMod = 0;

  //   const items = this._getEquippedProtectionItems();
  //   // Hyp3eLogger.info("Hyp3eActor _calculateAcDrMv", `${this.name} has equipped protection items:`, items);

  //   for (const item of items) {
  //     const sys = item.system ?? {};

  //     if (this._isHandShield(item)) {
  //       // Shield = stacking AC mod
  //       shieldMod += sys.ac || 0;
  //     } else if (this._isPassiveAc(item)) {
  //       // Passive protection items (rings, cloaks, etc) stack too
  //       shieldMod += sys.ac || 0;
  //     } else {
  //       // Armor (or passive AC) = pick the best
  //       //  It shouldn't even be possible to equip multiple armors, but just in case...
  //       if (sys.ac < ac) {
  //         ac = sys.ac;
  //         dr = sys.dr || dr;
  //       }
  //       // Movement
  //       if (sys.mv !== mv) {
  //         mv = sys.mv ?? mv;
  //       }
  //     }
  //   }

  //   // Encumbrance
  //   if (CONFIG.HYP3E.enableEncumbrance) {
  //     if (systemData.encumberedState === "encumbered") {
  //       ac += 1; mv -= 10;
  //     } else if (systemData.encumberedState === "heavilyEncumbered") {
  //       ac += 2; mv -= 20;
  //     }
  //   }

  //   // Dex and shields
  //   ac -= (systemData.attributes.dex.defMod || 0) + shieldMod;

  //   // Active effects can add their changes after this point...
  //   const allowedKeys = [
  //     "system.ac.value",
  //     "system.ac.dr",
  //     "system.movement.base.value"
  //   ];
  //   // Use these to update AC, DR, MV from effects
  //   let finalAc = ac;
  //   let finalDr = dr;
  //   let finalMv = mv;

  //   const changes = [];
  //   for ( const effect of this.allApplicableEffects() ) {
  //     // Skip if disabled or not active
  //     if ( effect.disabled || !effect.active ) continue;

  //     // Validate effect condition is met before applying changes
  //     const conditionPasses = this._effectApplies(effect);
  //     // Store temporary effect condition state in actor (used by actor-sheet)
  //     systemData._hyp3eEffectConditionState = systemData._hyp3eEffectConditionState || {};
  //     systemData._hyp3eEffectConditionState[effect.uuid] = conditionPasses ? "active" : "inactive";

  //     if (!conditionPasses) {
  //       Hyp3eLogger.info("Hyp3eActor _calculateAcDrMv", `Skipping effect "${effect.name}" on ${this.name} — condition not met:`, effect.flags.hyp3e?.condition);
  //       continue;
  //     }

  //     // Only include changes to allowed keys
  //     const filtered = effect.changes
  //       .filter(change => allowedKeys.includes(change.key))
  //       .map(change => {
  //         const c = foundry.utils.deepClone(change);
  //         c.effect = effect;
  //         c.priority = c.priority ?? (c.mode * 10);
  //         return c;
  //       });
  //     changes.push(...filtered);
  //   }
  //   // Do we have any changes to apply?
  //   if ( changes.length > 0 ) {
  //     // Organize effects by their priority (though it probably doesn't matter)
  //     changes.sort((a, b) => a.priority - b.priority);

  //     // Accumulate ActiveEffect changes
  //     for (const change of changes) {
  //       // Parse the change.value string and resolve it into a number if possible
  //       let resolvedChange = 0;
  //       if (isPureNumber(change.value)) {
  //         resolvedChange = Number(change.value) || 0;
  //       } else if (containsDice(change.value)) {
  //         // Dice rolls require async processing, which we can't do during _prepareData
  //         Hyp3eLogger.warn("Hyp3eActor _calculateAcDrMv", `Change "${change.value}" contains a dice roll formula, which is not allowed for AC, DR, and MV effects. Skipping...`);
  //         continue;
  //       } else if (containsMathOrVariables(change.value)) {
  //         // No dice rolls, we can do it synchronously
  //         resolvedChange = Hyp3eDice.resolveFormulaWithMath(change.value, systemData);
  //       }
  //       switch (change.key) {
  //         case "system.ac.value":
  //           Hyp3eLogger.info("Hyp3eActor _calculateAcDrMv", `Applying ${change.effect.name} ${resolvedChange} to ${this.name}'s AC:`, change);
  //           // Apply change based on mode
  //           switch (change.mode) {
  //             case CONST.ACTIVE_EFFECT_MODES.ADD: finalAc += resolvedChange; break;
  //             case CONST.ACTIVE_EFFECT_MODES.MULTIPLY: finalAc *= resolvedChange; break;
  //             case CONST.ACTIVE_EFFECT_MODES.OVERRIDE: finalAc = resolvedChange; break;
  //             // Pretty sure we don't need the other effect modes
  //           }  
  //           break;
  //         case "system.ac.dr":
  //           Hyp3eLogger.info("Hyp3eActor _calculateAcDrMv", `Applying ${change.effect.name} ${resolvedChange} to ${this.name}'s DR:`, change);
  //           // Apply change based on mode
  //           switch (change.mode) {
  //             case CONST.ACTIVE_EFFECT_MODES.ADD: finalDr += resolvedChange; break;
  //             case CONST.ACTIVE_EFFECT_MODES.MULTIPLY: finalDr *= resolvedChange; break;
  //             case CONST.ACTIVE_EFFECT_MODES.OVERRIDE: finalDr = resolvedChange; break;
  //             // Pretty sure we don't need the other effect modes
  //           }
  //           break;
  //         case "system.movement.base.value":
  //           Hyp3eLogger.info("Hyp3eActor _calculateAcDrMv", `Applying ${change.effect.name} ${resolvedChange} to ${this.name}'s MV:`, change);
  //           // Apply change based on mode
  //           switch (change.mode) {
  //             case CONST.ACTIVE_EFFECT_MODES.ADD: finalMv += resolvedChange; break;
  //             case CONST.ACTIVE_EFFECT_MODES.MULTIPLY: finalMv *= resolvedChange; break;
  //             case CONST.ACTIVE_EFFECT_MODES.OVERRIDE: finalMv = resolvedChange; break;
  //             // Pretty sure we don't need the other effect modes
  //           }  
  //           break;
  //         default:
  //           break;
  //       }
  //     }
  //   }
  //   // Hyp3eLogger.info("Hyp3eActor _calculateAcDrMv", `Final calculated AC, DR, MV for ${this.name}:`, { ac: finalAc, dr: finalDr, mv: finalMv });
  //   // Return the final results
  //   return {
  //     ac: Math.clamp(finalAc, -9, 9),
  //     dr: finalDr,
  //     mv: finalMv
  //   };
  // }

  /**
   * Gather equipped protection items (armor, shields).
   * @returns {Array} Array of equipped armor and shield items
   */
  // _getEquippedProtectionItems() {
  //   const items = [];
  //   for (const [type, collection] of Object.entries(this.itemTypes)) {
  //     if (type === "armor" || type === "shield") {
  //       for (const obj of Object.values(collection)) {
  //         if (obj.system?.equipped) items.push(obj);
  //       }
  //     }
  //   }
  //   return items;
  // }

  /**
   * Return true if the item should be treated as a hand-using shield.
   */
  // _isHandShield(item) {
  //   return (
  //     (item.type === "shield" && item.system.type !== "passive") ||
  //     (item.type === "armor" && item.system.type === "shield")
  //   );
  // }

  /**
   * Return true if the item is a passive AC item (ring, cloak, etc).
   */
  // _isPassiveAc(item) {
  //   return (item.type === "shield" && item.system.type === "passive");
  // }

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
      Hyp3eLogger.info("Hyp3eActor updateBonusSpell", `Update: ${key}, ${val}`);
  }

  // Get the names of effects applied to the actor, and return an array
  _getEffectNames() {
      let effects
      if (!foundry.utils.isNewerVersion(game.version, "13")) {
          // For Foundry v12...
          effects = this.effects
      } else if (foundry.utils.isNewerVersion(game.version, "13")) {
          // For Foundry v13...
          effects = this.allApplicableEffects()
      }
      return this.effects.map(e => e.name);
  }

  /**
   * Enforce weapon equip rules:
   * - Only one weapon and shield equipped by default.
   * - Dual wielding (but no shield) allowed if dex >= 13 and both melee weapons are wc <= 2.
   * @param {Item} newlyEquipped - the weapon being equipped
   */
  async enforceWeaponEquipRules(newlyEquipped) {
      // Note: these arrow functions return a value to the caller
      const _isShield = i => 
          (i.type === "shield" && i.system.type !== "passive") || (i.type === "armor" && i.system.type === "shield");
      const isMelee = w => w.system.melee;
      const isMissile = w => w.system.missile;
      const isLight = w => (w.system.wc ?? 99) <= 2;
      const isTwoHanded = w =>
          (w.system.hands ?? 1) === 2 ||
          (Array.isArray(w.system.annotations) &&
              w.system.annotations.some(a => a.toLowerCase().includes("true2hand")));

      if (newlyEquipped.type !== "weapon" && !_isShield(newlyEquipped)) return;
      Hyp3eLogger.info("Hyp3eActor enforceWeaponEquipRules", `Newly equipped:`, newlyEquipped);

      // All other currently equipped weapons
      const equippedWeapons = this._getEquippedWeapons(newlyEquipped.id);
      Hyp3eLogger.info("Hyp3eActor enforceWeaponEquipRules", `Currently equipped weapons:`, equippedWeapons);

      // All other currently equipped shields
      const equippedShields = this._getEquippedShields(newlyEquipped.id);
      Hyp3eLogger.info("Hyp3eActor enforceWeaponEquipRules", `Currently equipped shield:`, equippedShields);

      // Handle weapons first
      if (newlyEquipped.type === "weapon") {
          let dualWielding = false;
          const dex = this.system.attributes?.dex?.value ?? 0;
          // Check dual-wield condition (exactly one other weapon equipped)
          if (equippedWeapons.length === 1 && isMelee(newlyEquipped) && isLight(newlyEquipped)) {
              const other = equippedWeapons[0];
              Hyp3eLogger.info("Hyp3eActor enforceWeaponEquipRules", `Other equipped weapon:`, other);
              dualWielding =
                  dex >= 13 &&
                  isMelee(newlyEquipped) && isMelee(other) &&
                  isLight(newlyEquipped) && isLight(other);

              Hyp3eLogger.info("Hyp3eActor enforceWeaponEquipRules", `Dual wielding?`, dualWielding);
              if (dualWielding) {
                  // If dual wielding, we must unequip any shields
                  if (equippedShields.length > 0) {
                      const unequipUpdates = equippedShields.map(s => ({
                          _id: s.id,
                          "system.equipped": false
                      }));
                      Hyp3eLogger.info("Hyp3eActor enforceWeaponEquipRules", `Unequipping shields:`, unequipUpdates);
                      await this.updateEmbeddedDocuments("Item", unequipUpdates);
                  }
              }
          }
          // Default case, unequip all other weapons
          if (!dualWielding && equippedWeapons.length > 0) {
              const unequipUpdates = equippedWeapons.map(w => ({
                  _id: w.id,
                  "system.equipped": false
              }));
              Hyp3eLogger.info("Hyp3eActor enforceWeaponEquipRules", `Unequipping other weapons:`, unequipUpdates);
              await this.updateEmbeddedDocuments("Item", unequipUpdates);
          }
          // If a 2-handed weapon is being equipped, unequip all hand-shields
          if (isTwoHanded(newlyEquipped)) {
              // Unequip all hand-shields
              if (equippedShields.length > 0) {
                  const unequipUpdates = equippedShields.map(s => ({
                      _id: s.id,
                      "system.equipped": false
                  }));
                  Hyp3eLogger.info("Hyp3eActor enforceWeaponEquipRules", `Unequipping shields:`, unequipUpdates);
                  await this.updateEmbeddedDocuments("Item", unequipUpdates);
              }
          }
      }

      // Now handle shields
      if (_isShield(newlyEquipped)) {
          // Only one hand-shield allowed
          if (equippedShields.length > 0) {
              const unequipUpdates = equippedShields.map(s => ({
                  _id: s.id,
                  "system.equipped": false
              }));
              Hyp3eLogger.info("Hyp3eActor enforceWeaponEquipRules", `Unequipping shields:`, unequipUpdates);
              await this.updateEmbeddedDocuments("Item", unequipUpdates);
          }
          // Unequip any two-handed weapons
          const twoHanders = this.items.filter(i =>
              i.type === "weapon" &&
              i.system.equipped &&
              i.system.hands === 2
          );
          // If dual wielding, must unequip both weapons since we don't know which one to keep
          if (equippedWeapons.length === 2) {
              twoHanders.push(...equippedWeapons);
          }
          if (twoHanders.length > 0) {
              const unequipUpdates = twoHanders.map(s => ({
                  _id: s.id,
                  "system.equipped": false
              }));
              Hyp3eLogger.info("Hyp3eActor enforceWeaponEquipRules", `Unequipping two-handers:`, unequipUpdates);
              await this.updateEmbeddedDocuments("Item", unequipUpdates);
          }
      }
  }

  _getEquippedWeapons(excludeId) {
      return this.items.filter(i =>
          i.id !== excludeId &&
          i.type === "weapon" &&
          i.system.equipped
      );
  }

  _getEquippedShields(excludeId) {
      return this.items.filter(i =>
          i.id !== excludeId &&
          (i.type === "shield" || (i.type === "armor" && i.system.type === "shield")) &&
          i.system.equipped &&
          i.system.type !== "passive"
      );
  }

  /**
   * Enforce single armor equippage.
   * @param {Item} newArmor - The armor item being equipped.
   */
  async enforceSingleArmor(newArmor) {
      if (newArmor.type !== "armor") return;
      if (newArmor.system.type === "shield") return; // Legacy shields are handled with weapons
      Hyp3eLogger.info("Hyp3eActor enforceSingleArmor", `Newly equipped armor:`, newArmor);

      // Find other equipped armor items
      const equippedArmors = this.items.filter(i =>
          i.id !== newArmor.id &&
          i.type === "armor" &&
          i.system.equipped &&
          i.system.type !== "shield"
      );

      // Unequip them
      for (const armor of equippedArmors) {
          await armor.update({ "system.equipped": false });
          Hyp3eLogger.info("Hyp3eActor enforceSingleArmor", `Unequipping armor:`, armor);
      }
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
              Hyp3eLogger.info("Hyp3eActor addTempModifier", `Cannot add temp modifier, it already exists! templateField ${templateField}, source ${source}.`);
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
              Hyp3eLogger.info("Hyp3eActor deleteTempModifier", `Found temp modifier, deleting. templateField ${templateField}, source ${source}.`);
              this.system.tempModifiers.splice(id, 1)
          }
      })
  }

  /** ACTIVE EFFECTS HELPERS --------------------------*/

  /**
   * Determine whether an ActiveEffect should apply to this Actor
   *  based on conditional rules stored in flags.hyp3e.condition.
   * @param {ActiveEffect} effect
   * @returns {boolean}
   */
  _effectApplies(effect) {
    const condition = effect.flags.hyp3e?.condition;
    // No condition, always apply
    if (!condition) return true;
    // No tests configured (invalid or missing data), always apply
    const tests = condition.tests;
    if (!Array.isArray(tests) || tests.length === 0) return true;

    const actor = this;
    const rollData = actor.getRollData();
    // Hyp3eLogger.info("Hyp3eActor _effectApplies", `${actor.name} effect ${effect.name} condition:`, condition);

    // Internal function to evaluate a single test
    const evalTest = (test) => {
      if (!test || !test.key || !test.op) return false;

      // Get the left-hand value from actor
      const left = foundry.utils.getProperty(actor, test.key);

      // Resolve the right-hand value from the effect test
      let right = test.value;

      // If right is a formula containing Math or @variables, resolve it to a number
      if (containsMathOrVariables(right)) {
        right = Hyp3eDice.resolveFormulaWithMath(right, rollData)
      }
      // If right looks like an array literal, parse it
      if (typeof right === "string") {
        const trimmed = right.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          try {
            right = JSON.parse(trimmed);
          } catch (err) {
            Hyp3eLogger.warn("Hyp3eActor _effectApplies", "Conditional effect: invalid array literal:", { right, err });
            // Allow the effect if we can't evaluate the array
            return true;
          }
        }
      }
      // Hyp3eLogger.info("Hyp3eActor _effectApplies", `Testing conditional effect "${effect.name}" on ${actor.name}: ${left} ${test.op} ${right}`);

      // Apply condition operators
      switch (test.op) {
        case "==":  return left == right;
        case "!=":  return left != right;

        case "<":   return Number(left) <  Number(right);
        case "<=":  return Number(left) <= Number(right);
        case ">":   return Number(left) >  Number(right);
        case ">=":  return Number(left) >= Number(right);

        case "in":  return Array.isArray(right) && right.includes(left);
        case "!in": return Array.isArray(right) && !right.includes(left);

        default:
          Hyp3eLogger.warn("Hyp3eActor _effectApplies", `Unknown operator '${test.op}' in conditional effect.`);
          return false;
      }
    };

    // Evaluate all tests through the above function
    const results = tests.map(evalTest);
    Hyp3eLogger.info("Hyp3eActor _effectApplies", `Condition test results (on ${actor.name}):`, results);

    // Combine results based on mode
    switch (condition.mode) {
      case "any":  return results.some(r => r);
      case "none": return results.every(r => !r);
      default:  // Default is "all"
        return results.every(r => r);
    }
  }

  /**
   * Resolve item effects and changes that include data paths or roll formulas.
   * Then update the item's effect/change with a number, so it becomes "permanent".
   */
  async updateItemEffects() {
    const actorData = this.getRollData();

    for ( const item of this.items ) {
      // Exit if the effect is on an unequipped physical item
      if ( !item.system.equipped && item.type !== "feature" && item.type !== "spell" ) continue;

      for ( const effect of item.effects ) {
        if ( !effect.transfer ) continue;

        // Flag to track whether anything needs to be updated
        let didUpdate = false;
        const updates = {};

        // Check to see if we have a rollable duration formula, and resolve it if so
        const { updatedDuration, updated } = await checkAndResolveDuration(effect, actorData);
        if (updated) {
          didUpdate = true;
          updates.duration = updatedDuration;
          Hyp3eLogger.info("Hyp3eActor updateItemEffects", `"${effect.name}" resolved duration:`, updatedDuration);
        }

        // Foundry v13 vs. v14 changes how effect changes are stored
        const effectChanges = effect?.changes || effect?.system.changes || [];
        // Store all changes for a batch update at the end
        let updatedChanges = [...effectChanges];  // Start with a shallow copy
        Hyp3eLogger.info("Hyp3eActor updateItemEffects", `Checking effect ${effect.name} for changes to resolve...`, effectChanges);
        for (let i = 0; i < updatedChanges.length; i++) {
          const change = updatedChanges[i];
          Hyp3eLogger.info("Hyp3eActor updateItemEffects", `"${effect.name}" change key "${change.key}" has value ${change.value}, type: ${typeof change.value}`, change);
          let resolvedChange = null;
          if (!isNaN(change.value)) {
            resolvedChange = Number(change.value);
            Hyp3eLogger.info("Hyp3eActor updateItemEffects", `"${effect.name}" value: ${resolvedChange} is a real number, no resolution needed.`);
          } else if (isPureNumber(change.value)) {
            resolvedChange = Number(change.value);
            Hyp3eLogger.info("Hyp3eActor updateItemEffects", `"${effect.name}" value: ${resolvedChange} is a numeric string, resolved to a number.`);
          } else if (isPureString(change.value)) {
            resolvedChange = change.value;
            Hyp3eLogger.info("Hyp3eActor updateItemEffects", `"${effect.name}" value: ${resolvedChange} is simple text, no resolution needed.`);
          } else if (containsDice(change.value)) {
            // Parse the change.value string/formula and resolve it to a number if possible
            resolvedChange = await Hyp3eDice.resolveFormulaWithMathAsync(change.value, actorData)
            Hyp3eLogger.info("Hyp3eActor updateItemEffects", `"${effect.name}" value: ${change.value} contains dice, resolved to ${resolvedChange}.`);
          } else if (containsMathOrVariables(change.value)) {
            resolvedChange = Hyp3eDice.resolveFormulaWithMath(change.value, actorData);  
            Hyp3eLogger.info("Hyp3eActor updateItemEffects", `"${effect.name}" value: ${change.value} contains math or variables, resolved to ${resolvedChange}.`);
          }
          if (updatedChanges[i].value !== resolvedChange) {
            updatedChanges[i] = {
              ...change,
              value: resolvedChange
            };
            didUpdate = true;
            updates.changes = updatedChanges;
            Hyp3eLogger.info("Hyp3eActor updateItemEffects", `"${effect.name}" resolved change:`, updatedChanges[i]);
          }
        }
        // Batch out the updates to the effect
        if (didUpdate) {
          Hyp3eLogger.info("Hyp3eActor updateItemEffects", `All updates on actor ${this.name} for effect ${effect.name}:`, { updates });
          await effect.update(updates);
        }
      }
    }
  }

  /**
   * Process temporary effects on the actor, primarily persistent damage.
   *  Disable any expired effects. This only works on effects that are directly 
   *  applied to the actor, not effects coming from an item or ability.
   */
  async processTemporaryEffects(roundCount = null) {
    let totalDamage = 0;
    let damageType = ""
    let rawDamageRoll = ""
    let damageMessages = [];
    // Hyp3eLogger.info("Hyp3eActor processTemporaryEffects", `Processing temporary ActiveEffects on ${this.name}...`);
    // Collect updates to disable expired effects
    const expiredEffects = [];
    for (const effect of this.allApplicableEffects()) {
      const remainingRounds = effect.getFlag("hyp3e", "remainingRounds");
      if (!roundCount) {
        roundCount = 1;
      } else {
        roundCount = roundCount < remainingRounds ? roundCount : Math.max(remainingRounds, 1);
      }
      // Hyp3eLogger.info("Hyp3eActor processTemporaryEffects", `${this.name} has ${effect.name} with remaining time ${effect.duration.remaining} rounds/turns:`, effect);
      if (effect.isTemporary && !effect.disabled) {
        // if (effect.duration.remaining != null && effect.duration.remaining <= 0) {
        if ((effect.duration.remaining && effect.duration.remaining <= 0) 
            || (remainingRounds && remainingRounds <= 0)) {
          // Effect expired, add to expiredEffects for removal
          Hyp3eLogger.info("Hyp3eActor processTemporaryEffects", `${effect.name} on ${this.name} is expired and will be removed or disabled.`);
          expiredEffects.push(effect);
        }

        // Foundry v13 vs. v14 changes how effect changes are stored
        const effectChanges = effect?.changes || effect?.system.changes || [];
        const persistentDamage = effectChanges.find(c => c.key === "system.tempPersistentDamage");
        if (persistentDamage) {
          // Hyp3eLogger.info("Hyp3eActor processTemporaryEffects", `${effect.name} persistent damage:`, persistentDamage);

          // Does the value string include a comma separating damage type and formula?
          if (persistentDamage.value.includes(",")) {
            [damageType, rawDamageRoll] = persistentDamage.value.split(",");
          } else {
            damageType = "basic"; // Default damage type
            rawDamageRoll = persistentDamage.value;
          }
          const damageRollFormula = rawDamageRoll.replace(";", "").trim();

          // Run as many times as requested/allowed
          for (let i = 0; i < roundCount; i++) {
            // Hyp3eLogger.info("Hyp3eActor processTemporaryEffects", `Rolling ${damageRollFormula} ${damageType} damage...`);
            const roll = new Roll(damageRollFormula);
            await roll.evaluate({ evaluateSync: true });
            Hyp3eLogger.info("Hyp3eActor processTemporaryEffects", `Rolling ${effect.name} persistent ${damageType} damage... ${roll.total} HP.`, roll);
            totalDamage += roll.total;  
          }
          damageMessages.push(`${this.displayName} takes ${totalDamage} ${damageType} damage!`);
        }
      }
    }

    // Apply total damage once
    if (totalDamage > 0) {
      await this.applyHealthChange(totalDamage, damageType, false);
      Hyp3eLogger.info("Hyp3eActor processTemporaryEffects", `${this.name} took ${totalDamage} total damage!`);
      // Post all the damage messages together
      const persistentDamageMsg = `Applying persistent damage effects...<ul><li>${damageMessages.join("</li><li>")}</li></ul>`;
      sendSimpleChat(this, "", persistentDamageMsg)
    }

    const majorVersion = Number(game.version?.split(".")[0] ?? game.data.version.split(".")[0]);
    if (majorVersion <= 13) {
      // Disable expired effects for Foundry v13 or earlier
      if (expiredEffects.length > 0) {
        const updates = expiredEffects.map(e => ({
          _id: e.id,
          disabled: true,
        }));
        await this.updateEmbeddedDocuments("ActiveEffect", updates);
      }
    } else {
      // The ActiveEffect registry in v14 handles effect expiration for us
    }
  }

  /**
   * Update the value of an effect's change
   * @param {*} key // Effect change-key to find
   * @param {*} updateValue // Value to subtract from the effect's change
   * @returns {Number}  // The remainder after subtraction
   */
  async updateEffectValue(key, updateValue, minVal = 0, maxVal = 100) {
    // Find the effect specified by key
    const effect = this.effects.find(e => e.changes.some(c => c.key === key));
    // const allEffects = this.allApplicableEffects();
    // const effect = allEffects.find(e => e.changes.some(c => c.key === key));
    if (!effect) {
      Hyp3eLogger.info("Hyp3eActor updateEffectValue", `No effect found with key "${key}"`);
      return updateValue; // No effect found, return same value (no change)
    }

    // Foundry v13 vs. v14 changes how effect changes are stored
    const effectChanges = effect?.changes || effect?.system.changes || [];
    // Store all changes for a single batch update at the end
    let updatedChanges = [...effectChanges];  // Start with a shallow copy
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
   * Decrement the remainingRounds flag on temporary ActiveEffects. If remainingRounds
   *  goes to zero or negative, delete the effect.
   */
  async advanceTempEffectsTimer(roundCount = null) {
    // Is this Foundry v14?
    if (ActiveEffect?.registry) {
      // Update the AE registry and return early, since it handles expiration and deletion
      Hyp3eLogger.info("Hyp3eActor advanceTempEffectsTimer", `Refreshing effect registry for ${this.name}...`);
      await ActiveEffect.registry.addFromParent(this);
      await ActiveEffect.registry.refresh("roundEnd", { actors: new Set([this]) });
      return;
    }

    // We consider the custom flag to be authoritative when outside of combat
    const updates = [];
    const expired = [];
    for (const effect of this.allApplicableEffects()) {
      if (!effect.isTemporary) continue;

      let currentRemaining = 0;
      let newRemaining = 0;
      let remainingRounds = effect.getFlag("hyp3e", "remainingRounds");
      if (remainingRounds) {
        // Decrement remainingRounds and update or delete
        if (roundCount) {
          remainingRounds -= roundCount;
        } else {
          remainingRounds--;
        }

        if (remainingRounds <= 0 || effect.duration?.remaining <= 0 || effect.duration?.expired) {
          Hyp3eLogger.info("Hyp3eActor advanceTempEffectsTimer", `Effect ${effect.name} has expired and will be deleted from ${this.name}.`, effect);
          updates.push({
            _id: effect.id,
            "flags.hyp3e.remainingRounds": remainingRounds,
            "flags.hyp3e.expired": true,
          });
          expired.push(effect);
        } else {
          Hyp3eLogger.info("Hyp3eActor advanceTempEffectsTimer", `Setting ${effect.name} remaining rounds on ${this.name} to ${remainingRounds}`);
          updates.push({
            _id: effect.id,
            "flags.hyp3e.remainingRounds": remainingRounds,
          });
        }
      }
    }
    // Run updates first, then deletes, so any effects will be expired before being removed
    if (updates.length) {
      await this.updateEmbeddedDocuments("ActiveEffect", updates, { diff: false, render: false });
    }
    if (expired.length) {
      // We only need to do this for v13 and prior, since AE registry handles it for us in v14
      if (!ActiveEffect.registry) {
        Hyp3eLogger.info("Hyp3eActor advanceTempEffectsTimer", `Deleting ${expired.length} expired effect(s) on ${this.name}`);
        await this.deleteEmbeddedDocuments("ActiveEffect", expired.map(e => e.id));
      }
    }
  }

  /**
   * Delete all temporary ActiveEffects that are currently marked as expired.
   *
   * @param {object} [options={}]             Additional options passed to deleteEmbeddedDocuments
   * @returns {Promise<ActiveEffect[]>}       The deleted effects (if any)
   */
  async deleteExpiredEffects(options = {}) {
    if (!this.isOwner) return []; // safety — only owner can delete
    Hyp3eLogger.info("Hyp3eActor deleteExpiredEffects", `Checking for expired effects on actor ${this.name}.`, this.effects);

    let expired = [];
    if (ActiveEffect?.registry) {
      // The AE registry should have already marked effects as expired, so we filter on that
      expired = this.effects.filter(effect => 
        effect.isTemporary && 
        effect.duration?.expired === true
      );
    } else {
      // For Foundry v13 and earlier, we have to check manually
      expired = this.effects.filter(effect => 
        effect.isTemporary && effect.disabled &&
        (isNaN(effect.duration.remaining) || effect.duration.remaining <= 0)
      );
    }

    if (expired.length === 0) return [];
    Hyp3eLogger.info("Hyp3eActor deleteExpiredEffects", `Deleting expired effects on actor ${this.name}.`, expired);

    // Post all the expirations together in one chat
    const effectNames = expired.map(effect => effect.name)
    const expiredEffectsMsg = `Effects have expired on ${this.displayName}...
                                <ul><li>
                                  ${effectNames.join("</li><li>")}
                                </li></ul>`;
    sendSimpleChat(this, "", expiredEffectsMsg)

    const deleted = await this.deleteEmbeddedDocuments(
      "ActiveEffect", 
      expired.map(e => e.id),
      options
    );

    if (deleted?.length) {
      Hyp3eLogger.info("Hyp3eActor deleteExpiredEffects", `Deleted ${deleted.length} expired effect(s) on ${this.name}`);
    }
    // Update the AE registry again, in case any of the deleted effects were being tracked there
    await ActiveEffect.registry.refresh("roundEnd", { actors: new Set([this]) });

    return deleted;
  }

  /** TEMPORARY ITEMS HELPERS --------------------------*/

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
      Hyp3eLogger.info("Hyp3eActor createTempItem", `Creating ${itemData.name} with data:`, itemData)
      // Finally, create the item!
      return await Item.create(itemData, {parent: this});
  }

  /**
   * Process temporary items on the actor, deleting any that are expired.
   */
  async processTemporaryItems(rounds = 1) {
    Hyp3eLogger.info("Hyp3eActor processTemporaryItems", `Processing temp items on ${this.name}...`);
    // Filter items with numeric duration > 0
    const tempItems = this.items.filter(item => {
      // Convert to a number if possible
      const dur = item.getNumericDuration(item.system?.duration);
      return dur !== null && dur > 0 &&
        item.type !== "spell" &&
        item.type !== "feature";
    });

    // Log items to be updated
    const namesToReduce = tempItems.map(item => item.name);
    if (namesToReduce.length > 0) {
      Hyp3eLogger.info("Hyp3eActor processTemporaryItems", `Updating duration for ${namesToReduce.join(", ")}...`)
    }

    // Update duration on temporary items
    const updates = [];
    for (const item of tempItems) {
      const dur = Number(item.system?.duration);
      // Duration must be a positive number
      if (dur > 0) {
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
      // Convert to a number if possible
      const dur = item.getNumericDuration(item.system?.duration);
      return dur !== null && dur <= 0 &&
        item.type !== "spell" &&
        item.type !== "feature";
    });

    if (expiredItems.length == 0) return;

    // Log items to delete
    const namesToDelete = expiredItems.map(item => item.name);
    if (namesToDelete.length > 0) {
      Hyp3eLogger.info("Hyp3eActor processTemporaryItems", `Deleting ${namesToDelete.join(", ")}...`)
      // Post all the item expiration messages together
      const chatContent = `<p>Conjured item has expired...</p><ul><li>${namesToDelete.join("</li><li>")}</li></ul>`;
      sendSimpleChat(this, "", chatContent)
    }

    // Delete all expired items
    const idsToDelete = expiredItems.map(item => item.id);
    await this.deleteEmbeddedDocuments("Item", idsToDelete);
  }

  getNumericDuration(raw) {
    if (raw === "" || raw === null || raw === undefined) return null;
  
    // Convert to number
    const dur = Number(raw);
  
    // Reject anything non-numeric (e.g. "fast", "@level", NaN)
    if (Number.isNaN(dur)) return null;
  
    return dur;
  }

  /** DAMAGE/HEALING APPLICATION ----------------------*/

  /**
   * Apply a hit point change (damage or healing) to the actor, optionally considering Damage Reduction (DR).
   * Handles HP clamping, DR application, and prevents updates if no actual change occurs.
   * @param {number} amount - The amount of HP change. Positive values represent damage, negative values represent healing.
   * @param {string} [damageType="basic"] - The type of damage being applied (for logging/chat purposes).
   * @param {boolean} [applyDr=true] - If true (default), apply the actor's Damage Reduction (system.ac.dr) against positive (damage) amounts.
   * @returns {Promise<void|Error>} Returns nothing on success or early exit, or the Error object if the actor update fails.
   */
  async applyHealthChange(amount, damageType = "basic", applyDr = true) {
      const actorName = this.name ?? 'Unknown Actor'; // Use actor's name for logging

      // Input Validation
      if (typeof amount !== "number" || isNaN(amount)) {
          const errorMsg = `Invalid health change amount: '${amount}'. Must be a valid number.`;
          Hyp3eLogger.info("Hyp3eActor applyHealthChange", `Error for ${actorName}: ${errorMsg}`);
          ui.notifications?.error(errorMsg);
          return; // Exit early for invalid input
      }

      Hyp3eLogger.info("Hyp3eActor applyHealthChange", `Processing ${amount} HP change for ${actorName}. Damage type: ${damageType}. Apply DR: ${applyDr}`);

      // Get current state
      const currentHp = this.system.hp?.value ?? 0;
      let tempHp = this.system.hp?.tempHp ?? 0; // Temporary HP, if any
      let newHp = 0; // New HP after applying the change

      // Define the actor's point of death, different for characters vs. monsters
      let deadHp = this.system.hp?.min || 0;
      let unconsciousHp = null;
      let dyingHp = null;
      // Characters and classed NPCs (including henchmen) should all be rolled as characters
      if (this.type === "character") {
        unconsciousHp = 0;
        dyingHp = -4;
        // deadHp = -10; We already know this is set
      } else {
        // 0-level NPCs can drop to -3 hp, monsters die at 0 hp
        if (this.system?.npcType === "monster") {
          // deadHp = 0; We already know this is set
        } else if (this.system?.npcType === "npc") {
          unconsciousHp = 0;
          // deadHp = -3; We already know this is set
        }
      }

      const maxHp = this.system.hp?.max ?? 999; // Hyperborea has fairly low numbers, so 999 is generous

      // Are we applying damage or healing?
      const isDamage = amount > 0;
      const isHealing = amount < 0;

      // Check Early Exit Conditions
      // Condition: Trying to damage an already incapacitated/dead actor
      if (isDamage && currentHp <= deadHp) {
          Hyp3eLogger.info("Hyp3eActor applyHealthChange", `${actorName} is already dead (HP <= ${deadHp}). No damage applied.`);
          // We might want to trigger "overkill" effects or messages here...
          return;
      }
      // Condition: Change amount is zero
      if (amount === 0) {
          Hyp3eLogger.info("Hyp3eActor applyHealthChange", `Health change for ${actorName} is zero. No changes needed.`);
          return;
      }

      // Calculate Net Change (Applying DR if applicable)
      let netChange = amount; // This is the raw amount before DR/clamping affects the *final* HP

      // Apply Damage Reduction only if it's damage and the flag is set
      if (isDamage && applyDr) {
          const drValue = this.system.ac?.dr ?? 0; // Safely access DR, defaulting to 0
          if (drValue > 0) {
              const damageAfterDr = Math.max(0, amount - drValue); // Ensure damage doesn't become negative healing due to DR
              Hyp3eLogger.info("Hyp3eActor applyHealthChange", `Applying DR ${drValue} to ${amount} damage for ${actorName}. Resulting damage: ${damageAfterDr}`);

              // Condition: DR absorbed all the damage
              if (damageAfterDr === 0 && amount > 0) { // Check amount > 0 to ensure it was actual damage initially
                  Hyp3eLogger.info("Hyp3eActor applyHealthChange", `DR absorbed all damage for ${actorName}.`);
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
              const allEffects = this.allApplicableEffects();
              const tempHpEffect = allEffects.find(e => e.changes.some(c => c.key === "system.hp.tempHp"));
              if (tempHpEffect) {
                  Hyp3eLogger.info("Hyp3eActor applyHealthChange", `ActiveEffect applying temp HP: ${tempHpEffect.name}.`);
                  // Find the effect that is applying temp HP, and update it
                  netChange = await this.updateEffectValue("system.hp.tempHp", netChange, 0, 100);
              } else {
                  Hyp3eLogger.info("Hyp3eActor applyHealthChange", `Temp HP was applied manually.`);
                  // No effect found, just subtract from tempHp directly
                  const originalTempHp = tempHp;
                  tempHp = Math.max(0, tempHp - netChange);
                  netChange = Math.max(0, netChange - originalTempHp);
                  // Directly update the actor's tempHp value
                  await this.update({ "system.hp.tempHp": tempHp });
              }
              // Lock netChange to zero if it came back negative
              netChange = netChange < 0 ? 0 : netChange;
              Hyp3eLogger.info("Hyp3eActor applyHealthChange", `Net change after temp HP: ${netChange}.`);
          }
          // Now apply the remaining damage (if any) to current HP.
          //  Prevent the new HP from going below the allowed minimum.
          newHp = Math.max(deadHp, currentHp - netChange);
      } else if (isHealing) {
          // Healing: Only add to real HP, not temp HP
          newHp = currentHp - netChange;
      }

      // Clamp the calculated HP between the actor's min (dead) and max HP values
      newHp = Math.max(deadHp, Math.min(newHp, maxHp));
      Hyp3eLogger.info("Hyp3eActor applyHealthChange", `New HP for ${actorName}: ${newHp}.`);

      // Check whether update is necessary...
      // Avoid updating the actor if the clamped HP is the same as the current HP
      // (e.g., healing when already at max HP, or taking 0 damage after DR)
      if (newHp === currentHp) {
        Hyp3eLogger.info("Hyp3eActor applyHealthChange", `No actual HP change needed for ${actorName} after clamping/DR (Current: ${currentHp}, Calculated New: ${newHp}).`);
        return; // No update needed
      }

      const actualChangeAmount = Math.abs(currentHp - newHp); // How much HP *really* changed
      const changeType = (newHp < currentHp) ? "damage" : "healing";
      Hyp3eLogger.info("Hyp3eActor applyHealthChange", `Updating ${actorName} HP. Old: ${currentHp}, New: ${newHp} (${actualChangeAmount} ${changeType}). Actor:`, this);

      // Perform Actor Update
      try {
        // Perform the asynchronous update on the actor document
        await this.update({ "system.hp.value": newHp });
        // Apply actor/token statuses if not in combat (otherwise combat handles the same)
        if (!this.inCombat) {
          if (newHp <= deadHp) {
            Hyp3eLogger.info("Hyp3eActor applyHealthChange", `Applying "dead" status to ${actorName}...`);
            await this.setHealthStatus("dead");
          } else if (dyingHp !== null && newHp <= dyingHp) {
            Hyp3eLogger.info("Hyp3eActor applyHealthChange", `Applying "bleeding" status to ${actorName}...`);
            await this.setHealthStatus("bleeding");
          } else if (newHp <= unconsciousHp) {
            Hyp3eLogger.info("Hyp3eActor applyHealthChange", `Applying "unconscious" status to ${actorName}...`);
            await this.setHealthStatus("unconscious");
          } else {
            Hyp3eLogger.info("Hyp3eActor applyHealthChange", `Removing "dead/bleeding/unconscious" statuses from ${actorName}...`);
            await this.setHealthStatus("conscious");
          }
        }

        // Optional: Add hook calls after successful update if other modules/systems need to react
        Hooks.callAll("actorHealthChanged", this, currentHp, newHp, netChange, isDamage, isHealing);

      } catch (err) {
        // Log the error and notify the user if the update fails
        Hyp3eLogger.info("Hyp3eActor applyHealthChange", `Failed to update HP for ${actorName}:`, err);
        ui.notifications?.error(`Failed to update HP for ${actorName}. See console log for details.`);
        return err; // Return the error object
      }

      // Implicitly return undefined on successful update or handled early exit
  }

  /**
   * After a health change, determine whether unconscious or dead statuses should be 
   *  applied or removed.
   * @param {String} statusId - The token status ID that should be applied.
   * @returns {null}
   */
  async setHealthStatus(statusId) {
    try {
      switch (statusId) {
        case "conscious":
          // Leave "prone" status in place if it exists
          this.removeStatus("unconscious");
          this.removeStatus("bleeding");
          this.removeStatus("dead");
          break;

        case "unconscious":
          this.applyStatus("prone");
          this.applyStatus("unconscious");
          this.removeStatus("bleeding");
          this.removeStatus("dead");
          break;

        case "bleeding":
          this.applyStatus("prone");
          this.applyStatus("unconscious");
          this.applyStatus("bleeding");
          this.removeStatus("dead");
          break;

        case "dead":
          this.applyStatus("prone");
          this.removeStatus("unconscious");
          this.removeStatus("bleeding");
          this.applyStatus("dead");
          break;

        default:
          // Remove all statuses... this will probably never happen
          this.removeStatus("prone");
          this.removeStatus("unconscious");
          this.removeStatus("bleeding");
          this.removeStatus("dead");
      }
    } catch (err) {
      Hyp3eLogger.info("Hyp3eActor setHealthStatus", `Error setting status ${statusId}:`, err);
    }
  }

  /**
   * Programmatically apply a token status effect to this actor.
   * @param {*} statusId - The named status to apply, e.g. "prone", "unconscious", etc.
   * @param {*} label - Optional name of the effect that will appear on the actor sheet
   * @returns {Promise<ActiveEffect[]|undefined>}
   */
  async applyStatus(statusId) {
    // Do not apply if this status already exists
    if (this.effects.some(e => e.statuses?.has(statusId))) return;

    // Warn & exit if an invalid statusId was given
    if (!CONFIG.statusEffects.some(s => s.id === statusId)) {
      Hyp3eLogger.warn("Hyp3eActor applyStatus", `Unknown statusId: ${statusId}`);
      return;
    }

    // Apply status effect to actor & token
    Hyp3eLogger.info("Hyp3eActor applyStatus", `Applying status ${statusId} to ${this.name}...`);
    await this.toggleStatusEffect(statusId, {
      overlay: true,
      active: true
    });

    // Bleeding is a special case...
    if (statusId === "bleeding") {
      // Change modes were changed in Foundry v14, so we need to check the version to know how to apply them
      const majorVersion = Number(game.version?.split(".")[0] ?? game.data.version.split(".")[0]);

      // Find the bleeding effect and update it with persistent damage
      const effect = this.effects.find(e => e.statuses?.has(statusId));
      if (effect) {
        if (majorVersion <= 13) {
          await effect.update({ 
            changes: [{
              key: "system.tempPersistentDamage",
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              value: "bleeding,1;"
            }]
          });
        } else {
          await effect.update({ 
            system: {
              changes: [{
                key: "system.tempPersistentDamage",
                type: "add",
                value: "bleeding,1;"
              }]
            }
          });
        }
      }
    }
  }

  /**
   * Programmatically remove/delete a status effect from this actor.
   * @param {*} statusId - The named status to delete
   * @returns {null}
   */
  async removeStatus(statusId) {
    // Verify the status exists on this actor
    const effect = this.effects.find(e =>
      e.statuses?.has(statusId)
    );
    // Delete, do not disable
    if (effect) await effect.delete();    
  }

  /**
   * Use a consumable inventory item, decrementing its qty by 1
   * @param {*} itemId
   */
  async useItem(itemId) {
      const item = this.items?.get(itemId);
      if (!item) {
          ui.notifications?.error(`Use Item: Item ${itemId} not found! See console log for details.`);
          const msg = `
              Item ${itemId} not found!
              Likely issue is that the item is owned by a token, but not the base actor.
              This is most common with NPCs and monsters, if the GM drags an item or creates a new item directly in the token sheet.
          `
          Hyp3eLogger.info("Hyp3eActor useItem", msg);
          return;
      }
      Hyp3eLogger.info("Hyp3eActor useItem", `Using item:`, item);
      const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name
      let message = `<p>${this.displayName} used ${itemName}.</p>`
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
          Hyp3eLogger.info("Hyp3eActor rollMacro", `Macro actor: `, this)
          Hyp3eLogger.info("Hyp3eActor rollMacro", `Macro item: `, item)
          Hyp3eLogger.info("Hyp3eActor rollMacro", `Rolling macro for ${item.type} ${item.name}:`, item) 

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
      Hyp3eLogger.info("Hyp3eActor rollBasic", `Rolling ${dataset.label}...`);

      let rollResponse
      // let label = `${dataset.label}...`
      let label = this._createChatLabel(this.img, `Rolling ${dataset.label}... `)
      dataset.rollButtonLabel = "Roll"

      // Log the dataset before the dialog renders
      Hyp3eLogger.info("Hyp3eActor rollBasic", `${dataset.label} dataset:`, dataset);
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
      Hyp3eLogger.info("Hyp3eActor rollBasic", `${dataset.label} roll result:`, result);

      // Output roll result to a chat message
      sendRollToChat(roll, this, label, "", rollResponse.rollMode)
      
      return roll
  }

  /**
   * Execute a reaction roll directly from the actor sheet
   * @param {*} dataset 
   */
  async rollReaction(dataset) {
      Hyp3eLogger.info("Hyp3eActor rollReaction", `Rolling ${dataset.label}...`);

      let rollResponse
      // let label = `${dataset.label}...`
      let label = this._createChatLabel(this.img, `Rolling ${dataset.label}... `)
      dataset.rollButtonLabel = "Roll Reaction"

      // Log the dataset before the dialog renders
      Hyp3eLogger.info("Hyp3eActor rollReaction", `${dataset.label} dataset:`, dataset);
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
      Hyp3eLogger.info("Hyp3eActor rollReaction", `${dataset.label} roll result:`, result);
      // The roll shouldn't go below zero, even if modifiers would make it so
      let rollTotal = roll.total
      if (rollTotal < 0) { rollTotal = 0 }

      let reaction = this._valueFromTable(this.reactionTable, rollTotal)
      Hyp3eLogger.info("Hyp3eActor rollReaction", `Reaction:`, reaction);
      // label += `<b>${reaction}</b>`
      label += reaction

      // Output roll result to a chat message
      sendRollToChat(roll, this, label, "", rollResponse.rollMode)
      
      return roll
  }

  /**
   * Execute a saving throw
   * @param {*} dataset 
   */
  async rollSave(dataset) {
      Hyp3eLogger.info("Hyp3eActor rollSave", `Rolling ${dataset.label}...`);

      let saveRollParts = [];
      let rollFormula = "";
      let rollResponse;
      // let label = "";
      // let label = `${dataset.label}...`;
      let label = this._createChatLabel(this.img, `Rolling Save`);

      if (this.type === "character") {
          // Get the character's saving throw modifiers
          dataset.avoidMod = this.system.attributes.dex.defMod
          dataset.poisonMod = this.system.attributes.con.poisRadMod
          dataset.willMod = this.system.attributes.wis.willMod

          // Log the dataset before the dialog renders
          Hyp3eLogger.info("Hyp3eActor rollSave", `${dataset.label} dataset:`, dataset);
          try {
              rollResponse = await Hyp3eDialog.ShowSaveRollDialog(dataset)
          } catch(err) {
              return
          }

          // Default basic save with only sit mod from dice dialog
          saveRollParts.push(dataset.roll)

          // Get saving throw modifer if one was selected
          if ("avoidMod" in rollResponse) {
              saveRollParts.push(rollResponse.avoidMod);
              label += `${dataset.label} with Avoidance modifier...`;
          } else if ("poisonMod" in rollResponse) {
              saveRollParts.push(rollResponse.poisonMod);
              label += `${dataset.label} with Poison/Radiation modifier...`;
          } else if ("willMod" in rollResponse) {
              saveRollParts.push(rollResponse.willMod);
              label += `${dataset.label} with Willpower modifier...`;
          } else {
              label += `${dataset.label}... `;
          }
      } else {
          // NPC/monster save, no attribute-based mods
          dataset.rollButtonLabel = "Roll Save"
          label += `${dataset.label}... `;
          // Log the dataset before the dialog renders
          Hyp3eLogger.info("Hyp3eActor rollSave", `${dataset.label} dataset:`, dataset);
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
      Hyp3eLogger.info("Hyp3eActor rollSave", `Save roll parts:`, saveRollParts)
      Hyp3eLogger.info("Hyp3eActor rollSave", `Save formula:`, rollFormula)

      // Roll the dice!
      const { roll, total, success } = await Hyp3eDice.rollFormulaAndEvaluateSuccess(rollFormula, this.getRollData(), dataset.rollTarget, "ge");
      label += success ? "<b>Success!</b>" : "<b>Fail.</b>";

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
          Hyp3eLogger.info("Hyp3eActor rollHD", `No HD value to roll!`);
          return;
      }
      Hyp3eLogger.info("Hyp3eActor rollHD", `Rolling HD ${this.system.hd}...`);
      const roll = new Roll(this.system.hd);
      await roll.roll();
      if (roll != undefined && roll.total != undefined) {
          const newHealth = roll.total;
          await this.update({ system: { hp: { value: newHealth, max: newHealth } } });
      } else {
          Hyp3eLogger.warn("rollHD", `Roll failed, no total value!`);
      }
  }

  /**
   * Heal a PC by rolling its hit die + CN mod (NOT CURRENTLY USED)
   * @param {*} dataset 
   */
  async rollHP() {
      if (this.type !== 'character') return;
      if (!this.system.hd){
          Hyp3eLogger.error("rollHP", `No HD value in ${this.name} to roll!`);
          return;
      }
      Hyp3eLogger.info("Hyp3eActor rollHP", `Rolling hit points ${this.system.hd} + ${this.system.attributes.con.hpMod}...`);
      const roll = new Roll(`${this.system.hd} + ${this.system.attributes.con.hpMod}`);
      await roll.roll();
      Hyp3eLogger.info("Hyp3eActor rollHP", `Roll result:`, roll);
      if (roll != undefined && roll.total != undefined) {
          const hpIncrease = roll.total;
          const newHealth = parseInt(this.system.hp.value) + hpIncrease;
          const newMax = parseInt(this.system.hp.max) + hpIncrease;
          // Log the update
          Hyp3eLogger.info("Hyp3eActor rollHP", `Updated HP: ${newHealth}, Max HP: ${newMax}`);
          await this.update({
              system: { hp: { value: newHealth, max: newMax } }
          });
      } else {
          Hyp3eLogger.warn("rollHP", `Roll failed, no total value!`);
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
      const actorData = this.getRollData()
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
      // Are we enforcing the spell memorization rule for PCs?
      if (item.type === "spell" && CONFIG.HYP3E.forceSpellMemorize && this.type === "character" && !dataset.isItemSpell) {
        // Check if the spell is memorized
        if (!this._checkItemPreconditions(item, { checkMemorized: true })) return;
      }

      // Gather dataset properties from the item and actor
      dataset = await this._prepareRollDataset(dataset.itemId, dataset);
      if (!dataset) return;
      // Set the roll button label based on item type
      switch (item.type) {
          case "item":
              dataset.rollButtonLabel = "Use Item"
              break
          case "feature":
              dataset.rollButtonLabel = "Use Ability"
              break
          case "spell":
              dataset.rollButtonLabel = "Cast Spell"
              break
          default:
              dataset.rollButtonLabel = "Use"
              break
      }
      Hyp3eLogger.info("Hyp3eActor rollItem", `${dataset.label}:`, item);
      if (item.type === "weapon") {
          // Attack with the weapon
          this.rollAttackOrSpell(dataset)
      } else if (item.type === "spell") {
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
                  actorData.img = this.img
                  item._displayItemInChat(actorData)
              }
              return
          }

          // No item check, so we will popup a basic dialog to confirm use
          if (item.effects.size > 0) {
              const effectList = Array.from(item.effects).map(e => e.name).join(", ");
              dataset.details = `Using ${itemName} applies the following: ${effectList}.`
              dataset.noRoll = true
          }
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
          actorData.img = this.img
          item._displayItemInChat(actorData)
      }
  }

  /** ITEM, ATTACK & SPELL ROLL SUB-FUNCTIONS ---------*/

  /**
   * Execute a check roll directly from the actor sheet
   * @param {*} dataset 
   */
  async rollCheck(dataset) {
      Hyp3eLogger.info("Hyp3eActor rollCheck", `Rolling ${dataset.label}...`);

      // Declare vars
      const itemId = dataset.itemId ?? null
      const tokenId = dataset.tokenId ?? null
      let itemName = ""
      let label = ""
      let checkHeader = dataset.label
      let rollFormula = ""
      const targetComparison = dataset.comparison ?? "le"
      let rollResponse

      // Did we get a token ID?
      if (tokenId) {
          // Get the token from the canvas
          const token = canvas.tokens.get(tokenId)
          Hyp3eLogger.info("Hyp3eActor rollCheck", `Token (ID ${tokenId}):`, token);
          if (token) {
              // Get the token's actor
              const tokenActor = token.actor
              Hyp3eLogger.info("Hyp3eActor rollCheck", `Token actor:`, tokenActor);
          }
      }

      // Retrieve roll data from the actor
      const rollData = this.getRollData();

      // Is this an item or ability check?
      const item = this.items.get(itemId) ?? null
      if (item) {
          itemName = item.system.friendlyName != "" ? item.system.friendlyName : item.name
          label = this._createChatLabel(this.img, itemName)
          // Set the roll button label based on item type
          switch (item.type) {
              case "item":
                  dataset.rollButtonLabel = "Use Item"
                  break
              case "feature":
                  dataset.rollButtonLabel = "Use Ability"
                  break
              case "spell":
                  dataset.rollButtonLabel = "Cast Spell"
                  break
              default:
                  dataset.rollButtonLabel = "Use"
                  break
          }
      } else {
          label = this._createChatLabel(this.img, `Rolling ${dataset.label}`)
          dataset.rollButtonLabel = "Roll"
      }

      // Use itemNameLower for ability name comparisons below...
      const itemNameLower = itemName.toLowerCase()
      // Initialize these for later
      dataset.sitMod = 0;
      dataset.sitModList = "";

      // Check the ability name to determine if this is a thief ability
      const abilityList = ["climb", "decipher script", "discern noise", "hide", "manipulate traps", "move silently", "open locks", "pick pockets", "read scrolls"];
      const thiefAbility = (abilityList.includes(itemNameLower))
      // Are we auto-calculating Thief ability target numbers?
      if (CONFIG.HYP3E.autoCalcThiefTn) {
          if (thiefAbility) {
            // If wearing heavy armor, prevent certain thief skills
            const skillsPreventedByHeavyArmor = ["climb", "hide", "move silently"];
            const armorType = this.system.wornArmorType;
            if (armorType === "heavy" && skillsPreventedByHeavyArmor.includes(itemNameLower)) {
                const msg = `${this.displayName} cannot attempt to ${itemNameLower} while wearing heavy armor.`;
                Hyp3eLogger.warn("Hyp3eActor rollCheck", msg);
                ui.notifications.warn(msg);
                return false;
            }

            // Calculate & override the roll target in the dataset
              const target = this._resolveThiefAbilityTn(itemNameLower);
              if (target === null) {
                  const msg = `At level ${this.system.details.level.value}, ${this.name} has no chance of success to ${itemNameLower}.`;
                  Hyp3eLogger.warn("Hyp3eActor rollCheck", msg);
                  ui.notifications.warn(msg);
                  return false;
              }
              dataset.rollTarget = target;
          }
      }
      // Even without automatic target calculation, we can still do the sit mods
      if (thiefAbility) {
          // Check to see if we need to add an attribute modifier for thief skills
          const actorAttributes = { 
              dx: this.system.attributes.dex.value, 
              in: this.system.attributes.int.value, 
              ws: this.system.attributes.wis.value
          };
          const sitModObj = this._getThiefSkillModifier(itemNameLower, actorAttributes)
          for (const [sitModKey, sitModData] of Object.entries(sitModObj)) {
            if (sitModData.modifier === 0) continue;
            dataset.sitMod = Number(dataset.sitMod) + Number(sitModData.modifier);
            // Separate multiple situational mods with commas
            if (dataset.sitModList !== "") {
                dataset.sitModList += ", "
            }
            // Customize how the modifier is displayed
            let sitModText = ""
            if (sitModData.modifier >= 0) {
                sitModText = `(+${sitModData.modifier})`
            } else if (sitModData.modifier === -99) {
                sitModText = `makes this skill impossible to use!`
            } else {
                sitModText = `(${sitModData.modifier})`
            }
            dataset.sitModList += `${sitModData.attribute} ${sitModText}`
          }
      }

      // This footer is used for Turn Undead & Assassinate results
      let checkFooter = ""
      // Use simple word parsing in the ability name to determine if this is a cleric turning undead
      const turnUndead = itemNameLower.includes("turn") && itemNameLower.includes("undead");
      // Same idea here, but for a necromancer commanding undead
      const commandUndead = itemNameLower.includes("command") && itemNameLower.includes("undead");
      if (turnUndead || commandUndead) {
          // Ensure we have a valid Turning Ability
          if (!this.system.ta || this.system.ta === 0) {
              const msg = `${this.name} must have a Turning Ability of 1 or greater!`;
              Hyp3eLogger.warn("rollCheck", msg);
              ui.notifications.warn(msg);
              return false;
          }
          // Special case: if the user forgot to include @cha.turnUndead in the formula,
          //  we will add it here, so the roll will be correct
          if (dataset.roll.indexOf("@cha.turnUndead") < 0) {
              dataset.roll = `${dataset.roll} - @cha.turnUndead`;
          }
          // Clerics turn undead on a sliding scale from 10+ (lowest level) down to 1 (highest),
          //  but there is no actual target number since it is a range of success.
          dataset.rollTarget = this.system.ta == 1 ? 10 : 13;
      }

      // Use simple word parsing in the ability name to determine if this is an assassin plying her trade
      const assassinate = itemNameLower.includes("assassinat"); // Allow "assassinate" or "assassination"
      const userTargets = Array.from(game.user.targets);
      let targetToken = null;
      if (assassinate) {
          // Ensure we have a targeted token
          targetToken = userTargets.length > 0 ? userTargets[0] : null;
          if (!targetToken) {
              const msg = `${this.name} must have a target token selected to assassinate!`;
              Hyp3eLogger.warn("rollCheck", msg);
              ui.notifications.warn(msg);
              return false;
          }
          // Calculate the target number, overriding its incoming value if any
          dataset.rollTarget = this._resolveAssassinationTn(targetToken);
      }

      // If the Target number has variables like a roll formula, resolve it to a number
      if (isNaN(dataset.rollTarget)) {
          const targetRoll = new Roll(dataset.rollTarget, rollData)
          await targetRoll.roll()
          Hyp3eLogger.info("Hyp3eActor rollCheck", `Check target formula: ${dataset.rollTarget} evaluates to ${targetRoll.formula} = ${targetRoll.total}`)
          Hyp3eLogger.info("Hyp3eActor rollCheck", `Target formula eval:`, targetRoll)
          // Override rollTarget, even if it has the same value
          dataset.rollTarget = targetRoll.total
      }

      // Determine whether we have a valid target number or formula
      if (dataset.rollTarget === '' || dataset.rollTarget == null) {
          const msg = `Missing or invalid target number, cannot confirm success of check!`
          Hyp3eLogger.warn("rollCheck", msg)
          ui.notifications.warn(msg)
          return false
      }

      // We should now have a valid target number
      checkHeader += ` (target ${dataset.rollTarget})... `

      // Log the dataset before the dialog renders
      Hyp3eLogger.info("Hyp3eActor rollCheck", `${dataset.label} dataset:`, dataset);
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
      const { roll, total, success } = await Hyp3eDice.rollFormulaAndEvaluateSuccess(rollFormula, rollData, dataset.rollTarget, targetComparison);

      // Depending on the type of roll, we add text to the final chat message
      if (turnUndead || commandUndead) {
          const turnOrCommand = turnUndead ? "turn" : "command"
          // Use the "success" flag to describe the results of the attempted turning/commanding undead
          checkFooter = this._resolveTurnUndead(roll.total, rollData.ta, turnOrCommand)
      } else if (assassinate) {
          // Use the "success" flag to describe the results of the attempted assassination
          checkFooter = this._resolveAssassination(targetToken, success)
      } else {
          // Default option: simple Success/Fail message for a standard check
          checkHeader += success ? "<b>Success!</b>" : "<b>Fail.</b>";
      }
      // Hit must be false so we don't display any damage buttons
      roll.hit = false

      // Construct a custom chat card for the check
      await renderCustomChat(roll, item, {}, this, tokenId, label, "", checkHeader, checkFooter, rollResponse.rollMode)

      return true
  }

  /**
   * Main orchestrator for executing an attack roll or casting a spell.
   * @param {object} dataset - Initial data for the roll (label, itemId, tokenId, etc.).
   */
  async rollAttackOrSpell(dataset) {
      Hyp3eLogger.info("Hyp3eActor rollAttackOrSpell", `Rolling ${dataset.label}...`, dataset);

      // Gather Initial Information
      const { attacker, attackerPos } = await this._getAttackerDetails(dataset);
      const { item, itemData, itemName, attackTextBase } = await this._getItemDetails(dataset.itemId);
      const actorData = this.getRollData();
      // const actorData = foundry.utils.deepClone(this.system); // Clone this to avoid unintended side effects

      // If item lookup fails, exit with a warning
      if (!item) {
          const msg = `No item found for ID ${dataset.itemId}.`;
          Hyp3eLogger.warn("rollAttackOrSpell", msg);
          ui.notifications.warn(msg);
          return null;
      }
      dataset.itemName = itemName || "";

      // Gather Target Information & Calculate Distance/Range
      const { target, targetData, gridDistance } = this._getTargetDetails(attacker);
      dataset.rangeUoM = canvas.scene?.grid.units || "ft";
      dataset.gridDistance = gridDistance;
      dataset.targetName = targetData.name;
      dataset.targetAc = targetData.ac;
      dataset.targetSize = targetData.size;

      // Warn if attack or spell requires a target, but no tokens were selected
      if (item && (item.type === "weapon" || (item.type === "spell" && itemData.atkRoll)) && !target) {
          ui.notifications.warn(`No target selected for ${item.name}!`);
      }

      // Prepare Data for Dialog (Range, Ammo, Initial Mods)
      const { rangeText, ranges, rangeGroup, chosenRange, rangeMessages, isOutOfRange } = this._prepareRangeData(itemData, gridDistance);
      rangeMessages.forEach(msg => ui.notifications.warn(msg)); // Show range warnings immediately
      if (isOutOfRange && CONFIG.HYP3E.forceRangeLimit) {
          Hyp3eLogger.info("Hyp3eActor rollAttackOrSpell", `Target out of range, or too close, and forceRangeLimit enabled. Aborting.`);
          return null; // Abort if out of range and setting is enabled
      }

      const carriedAmmo = this._getCarriedAmmo();
      const selectedAmmo = itemData.usesAmmo ? item.getFlag("hyp3e", "usedAmmoId") : null;

      dataset.sitMod = 0;
      dataset.sitModList = "";
      const sitModObj = this._getCombatantSitMods(attacker, target, !!itemData?.missile);
      dataset.sitMod = parseInt(sitModObj?.sitModSum || 0);
      dataset.sitModList = sitModObj?.sitModList || "";

      // Combine item/roll specific data for the dialog
      const dialogData = {
          ...dataset, // Include initial dataset
          showAmmo: itemData?.usesAmmo ?? false,
          showRanges: !!itemData?.missile,
          carriedAmmo: carriedAmmo,
          selectedAmmo: selectedAmmo,
          rangeGroup: rangeGroup,
          ranges: ranges,
          chosenRange: chosenRange,
          showSpellRange: item?.type === "spell" && itemData?.atkRoll,
          spellRange: itemData?.range, // Use descriptive range text for spells
          rangeText: rangeText,
          isGrenade: itemData?.isGrenade ?? false, // Pass grenade status
          itemName: itemName // Ensure item name is in dialog data
      };

      // Show Dialog and Get User Input
      let rollResponse;
      try {
          rollResponse = await this._showRollDialog(dialogData, item?.type);
          if (!rollResponse) { // Handle dialog cancellation
              Hyp3eLogger.info("Hyp3eActor rollAttackOrSpell", `Dialog canceled by user.`);
              return null;
          }
      } catch (err) {
          Hyp3eLogger.info("Hyp3eActor rollAttackOrSpell", `Error displaying dialog:`, err);
          return null;
      }

      /**
       *  
       * If we have reached this point, the attack has been made or the spell cast.
       * Time to determine the results!
       * 
       * **/

      if (item?.type === "spell") {

        // Temporarily override the actor's CA if spell was cast from an item
        if (dataset.isItemSpell) {
          actorData.castingAbility.value = dataset.itemCa
          actorData.ca = dataset.itemCa
        }

        // Handle spell memorization/slot consumption if applicable
        if (!dataset.isItemSpell && itemData?.quantity?.value > 0) {
          await this._consumeSpellSlot(item);
        }

        // Handle Runegraver spellcasting hit point bleed if applicable
        if (this.system?.details?.class.toLowerCase() === "runegraver" && item.name.toLowerCase().includes("rune")) {
          await this.applyHealthChange(parseInt(item.system.spellLevel), "basic", false);
        }

        // Save the source caster's (or item's) UUID and casting ability in the effect flags
        for (const effect of item.effects.contents) {
            const data = effect.toObject();

            data.flags ??= {};
            data.flags.hyp3e ??= {};
            data.flags.hyp3e.source ??= {};
            data.flags.hyp3e.source.srcItemUuid = dataset.isItemSpell ? item.uuid : null;
            data.flags.hyp3e.source.srcActorUuid = this.uuid;
            data.flags.hyp3e.source.appliedBy = this.name;
            // data.flags.hyp3e.sourceActorUuid = this.uuid;

            // Optionally store spell-level data, too
            data.flags.hyp3e.spellUuid = item.uuid;
            data.flags.hyp3e.spellLevel = item.system.spellLevel ?? null;

            // Update the temporary copy before rendering to chat
            effect.updateSource(data);
        }
      }

      // If there's no item roll formula (typically a spell), send a chat message and exit
      if (!itemData.formula) {
          actorData.img = this.img
          item._displayItemInChat(actorData);
          return null;
      }
      // Use ammo or consumable item, and return ammo atk/dmg mods if applicable
      const { ammoMods, ammoUpdated } = await this._consumeAmmoOrItem(rollResponse, item, itemData);
      if (ammoUpdated) {
          // If ammo was used, save its id in the item flags
          const ammo = this.items.get(rollResponse.ammunition);
          await item.setFlag("hyp3e", "usedAmmoId", ammo.id);
          // this.sheet.render(false);
      }

      // Update dataset with final situational mods and roll mode from dialog
      dataset.sitMod = rollResponse.sitMod;
      dataset.rollMode = rollResponse.rollMode;
      // Only for missile weapons
      if (item.type === "weapon" && itemData.missile) {
          // Calculate range mod based on range to target
          dataset.rangeMod = this._getRangeModifier(rollResponse.rangeGroup);
      }

      // Build Roll Formula
      const { formula: rollFormula, debugFormula: debugAtkRollFormula } = Hyp3eDice.buildAttackFormula(dataset, itemData, ammoMods, actorData);
      Hyp3eLogger.info("Hyp3eActor rollAttackOrSpell", `Final attack formula:`, rollFormula);

      // Execute the Roll
      const { atkRoll, naturalRoll } = await this._executeRoll(rollFormula, actorData);
      if (!atkRoll) {
        Hyp3eLogger.error("rollAttackOrSpell", `Roll execution failed.`);
        return null;
      }

      // Determine Hit/Miss Result
      const { hit, attackTextResult, critFooter } = this._determineHitResult(
        atkRoll,
        naturalRoll,
        itemData,
        dataset.targetAc,
        dataset.targetSize
      );
      atkRoll.hit = hit; // Attach hit status to the roll object

      // Prepare Damage Formula (if hit, or on crit miss so damage data is available for hitAlly/hitSelf outcomes)
      let damageFormulas = {};
      const isCritMiss = naturalRoll === 1 && CONFIG.HYP3E.critMiss;
      if ((hit || isCritMiss) && item && Roll.validate(itemData.damage)) {
          damageFormulas = this._prepareDamageFormulas(itemData, ammoMods, actorData);
      }

      // Embed damage data in the crit-miss footer so the crit miss handler can offer damage rolls
      let resolvedCritFooter = critFooter;
      if (isCritMiss && damageFormulas.primary) {
          const df = damageFormulas.primary;
          resolvedCritFooter = `<div class='critical-miss'` +
              ` data-base-class='${this.system.baseClass}'` +
              ` data-actor-id='${this.id}'` +
              ` data-formula='${df.formula}'` +
              ` data-debug-formula='${df.debugFormula}'` +
              ` data-base-damage='${itemData.damage}'` +
              ` data-damage-type='${itemData.dmgType}'` +
              ` data-item-id='${item.id}'` +
              ` data-item-uuid='${item.uuid}'` +
              ` data-token-id='${attacker?.id ?? ""}'` +
              ` data-source-type='${item.type}'` +
              ` data-damage-groups='${JSON.stringify(df.damageGroups)}'></div>`;
      }

      // Render chat message
      const chatLabel = this._createChatLabel(this.img, itemName);
      const attackHeader = `${attackTextBase}${dataset.targetName ? ` vs. ${dataset.targetName}` : ''}... ${attackTextResult}`;

      Hyp3eLogger.info("Hyp3eActor rollAttackOrSpell", `Chat data:`, {chatLabel, attackHeader, resolvedCritFooter});
      await renderCustomChat(atkRoll, item, damageFormulas, this, attacker?.id, chatLabel, debugAtkRollFormula, attackHeader, resolvedCritFooter, rollResponse.rollMode);

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

      // Some spells do not require memorization, so we check the isConsumable flag
      if (item.system.isConsumable && checkMemorized && (item.system?.quantity?.value ?? 0) <= 0) {
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
      // const actorData = this.getRollData();

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
      // dataset.actorData = actorData;

      Hyp3eLogger.info("Hyp3eActor _prepareRollDataset", `Prepared dataset:`, dataset);

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
      Hyp3eLogger.info("Hyp3eActor _getAttackerDetails", `Attacker:`, attacker);
      // Hyp3eLogger.info("Hyp3eActor _getAttackerDetails", `Attacker ${attacker.name} position:`, attackerPos);

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
      // Hyp3eLogger.info("Hyp3eActor _getItemDetails", `Item ${itemId}:`, item);
      Hyp3eLogger.info("Hyp3eActor _getItemDetails", `Item Data:`, itemData);

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
          targetData.name = target.name ? target.name : target.actor.displayName;
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

          Hyp3eLogger.info("Hyp3eActor _getTargetDetails", `Target:`, target);
          Hyp3eLogger.info("Hyp3eActor _getTargetDetails", `Target Data:`, targetData);
          Hyp3eLogger.info("Hyp3eActor _getTargetDetails", `Distance:`, gridDistance);
      } else {
          Hyp3eLogger.info("Hyp3eActor getTargetDetails", `No target selected or attacker missing.`);
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
          Hyp3eLogger.info("Hyp3eActor _parseSpellRange", `Spell range: ${rangeStr} = ${value} feet`);
          // Fudge short ranges to allow for diagonal or large targets
          if (value < 7) return 7; // E.g. Base 5ft -> 7 allows diagonal or large target
          return Math.round(value);
      }
      Hyp3eLogger.info("Hyp3eActor _parseSpellRange", `Spell range ${rangeStr} could not be determined!`);
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
              Hyp3eLogger.info("Hyp3eActor _prepareRangeData", msg);
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
              // For certain missile attacks, prevent attacks to an adjacent square:
              //  Physical weapons only, not spells (filtered by the itemData.missile check above)
              //  - Not grenades, not area effect attacks
              //  - Not weapons conjured by spells (e.g. Exploding Skull, Magic Ice Dart)
              if (!itemData.isGrenade && !itemData.isAreaEffect && (!itemData?.duration || !Number.isFinite(Number(itemData.duration)))) {
                  const msg = `Target is in melee range, cannot use this missile weapon so close! (${gridDistance} ${canvas.scene.grid.units})`;
                  Hyp3eLogger.info("Hyp3eActor _prepareRangeData", msg);
                  rangeMessages.push(msg);
                  isOutOfRange = true;
              }
          } else if (gridDistance <= itemData.range.short) {
              chosenRange = "short";
          } else if (gridDistance <= itemData.range.medium) {
              chosenRange = "medium";
          } else if (gridDistance <= itemData.range.long) {
              chosenRange = "long";
          } else {
              chosenRange = "long"; // Set to Long even if out of range
              const msg = `Target is out of missile range! (${gridDistance} ${canvas.scene.grid.units} > ${itemData.range.long} ${canvas.scene.grid.units})`;
              Hyp3eLogger.info("Hyp3eActor _prepareRangeData", msg);
              rangeMessages.push(msg);
              isOutOfRange = true;
          }
      }

      // Spell Attack Roll Check
      if (itemData.itemType === "spell" && itemData.range) {
          const spellRange = this._parseSpellRange(itemData.range);
          if (gridDistance > spellRange) {
              const msg = `Target is out of spell range! (${gridDistance} ${canvas.scene.grid.units} > ${spellRange} ${canvas.scene.grid.units})`;
              Hyp3eLogger.info("Hyp3eActor _prepareRangeData", msg);
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
      Hyp3eLogger.info("Hyp3eActor _getCarriedAmmo", `Carried ammo:`, carriedAmmo);
      return carriedAmmo;
  }

  /**
   * Shows the appropriate roll dialog.
   * @param {object} dataset - Data for the dialog template.
   * @param {string|null} itemType - Type of the item ('weapon', 'spell', null).
   * @returns {Promise<object|null>} The dialog response object, or null if cancelled.
   */
  async _showRollDialog(dataset, itemType) {
      try {
          let rollResponse;
          if (itemType === "weapon") {
              rollResponse = await Hyp3eDialog.ShowAttackRollDialog(dataset);
          } else if (itemType === "spell") {
              rollResponse = await Hyp3eDialog.ShowSpellcastingDialog(dataset);
          } else {
              // Fallback for non-item rolls if needed, potentially reusing ShowAttackRollDialog
              rollResponse = await Hyp3eDialog.ShowAttackRollDialog(dataset);
          }
          Hyp3eLogger.info("Hyp3eActor _showRollDialog", `Dialog response:`, rollResponse);
          return rollResponse;
      } catch (err) {
          // Catch dialog cancellation (often returns null or throws specific error)
          Hyp3eLogger.info("Hyp3eActor _showRollDialog", `Dialog closed or error:`, err);
          return null;
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

          // Hyp3eLogger.info("Hyp3eActor _executeRoll", `Attack Roll:`, atkRoll);
          // Hyp3eLogger.info("Hyp3eActor _executeRoll", `Roll Result:`, atkRoll.total);
          // Hyp3eLogger.info("Hyp3eActor _executeRoll", `Natural d20 Roll:`, naturalRoll);
          return { atkRoll, naturalRoll };
      } catch (err) {
          Hyp3eLogger.error("_executeRoll", `Error rolling formula:`, rollFormula, err);
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
   * @returns {{hit: boolean, attackTextResult: string, critFooter: string}}
   */
  _determineHitResult(atkRoll, naturalRoll, itemData, targetAc, targetSize) {
      let hit = false;
      let attackTextResult = "";
      let critFooter = "";
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
              Hyp3eLogger.info("Hyp3eActor _determineHitResult", `Grenade Hit! ${total} >= ${tn}`);
          } else {
              attackTextResult = `<b>Misses a ${sizeFromTable} target.</b>`;
              Hyp3eLogger.info("Hyp3eActor _determineHitResult", `Grenade Miss! ${total} < ${tn}`);
          }
      } else {
          // Normal attack TN based on AC
          const tn = 20 - targetAc;
          const hitAC = 20 - total; // AC the roll would hit

          if (naturalRoll === 20) {
              hit = true;
              attackTextResult = `<span style='color:#00b34c'><b>Critical Hit!</b></span>`;
              Hyp3eLogger.info("Hyp3eActor _determineHitResult", `Natural 20 Crit Hit!`);
              if (CONFIG.HYP3E.critHit) {
                  critFooter = `<div class='critical-hit' data-base-class='${this.system.baseClass}' data-actor-id='${this.id}'></div>`;
              }
          } else if (naturalRoll === 1) {
              attackTextResult = `<span style='color:#e90000'><b>Critical Miss!</b></span>`;
              Hyp3eLogger.info("Hyp3eActor _determineHitResult", `Natural 1 Crit Miss!`);
              if (CONFIG.HYP3E.critMiss) {
                  critFooter = `<div class='critical-miss' data-base-class='${this.system.baseClass}' data-actor-id='${this.id}'></div>`;
              }
          } else if (total >= tn) {
              hit = true;
              attackTextResult = `<b>Hits AC ${hitAC}!</b>`;
              Hyp3eLogger.info("Hyp3eActor _determineHitResult", `Hit! ${total} >= ${tn}`);
          } else {
              attackTextResult = `<b>Miss${hitAC <= 9 ? `, would have hit AC ${hitAC}` : 'es AC 9'}.</b>`;
              Hyp3eLogger.info("Hyp3eActor _determineHitResult", `Miss! ${total} < ${tn}`);
          }
      }

      return { hit, attackTextResult, critFooter };
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
          debugFormula: dmgObj.debugFormula,
          damageGroups: dmgObj.damageGroups
      };
      dmgFormulas.dmgIcons = dmgObj.dmgIcons;
      Hyp3eLogger.info("Hyp3eActor _prepareDamageFormulas", `Damage formula: ${dmgObj.formula}`);

      // Build secondary (e.g., 2-handed) damage formula if applicable
      if (itemData.damage2h) {
          dmgFormulas.secondary = {
              formula: dmgObj.formula2h,
              debugFormula: dmgObj.debugFormula2h,
              damageGroups: dmgObj.damageGroups2h
          };
          Hyp3eLogger.info("Hyp3eActor _prepareDamageFormulas", `Damage formula 2H: ${dmgObj.formula2h}`);
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
      Hyp3eLogger.info("Hyp3eActor _parseItemMod", `Item mod regex: ${mod}`);
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
      Hyp3eLogger.info("Hyp3eActor _parseItemMod", `Item mod data:`, itemData);
      return itemData
  }

  /**
   * Examine the attacking and defending tokens, the active effects on them as well as 
   *  status effects, and create a list of situational modifiers and sum total for the 
   *  attack roll.
   * @param {*} attacker - attacking token, if it exists (not theater of the mind)
   * @param {*} target - targeted token, if it exists (not theater of the mind)
   * @param {boolean} isMissile - whether this is a missile attack, vs. melee/spell
   * @returns {Object} sitModObj { sitModSum: number, sitModsArr: Array }
   */
  _getCombatantSitMods(attacker, target, isMissile=false) {
    Hyp3eLogger.info("Hyp3eActor _getCombatantSitMods", `Getting situational modifiers for attacker ${this.name}...`);

    // Our return object & properties
    let sitModObj = {};
    let sitModSum = 0;
    let sitModsArr = [];

    // Is the attacker dual wielding? If so, penalties apply based on weapon class.
    if (!isMissile) {
      const weapons = this.items.filter(i => i.type === "weapon" && i.system.equipped);
      if (weapons.length >= 2) {
        const mainHand = weapons[0];
        const offHand = weapons[1];
        const mainHandWC = mainHand.system.wc ?? 1;
        const offHandWC = offHand.system.wc ?? 1;
        const dualWieldPenalty = -1 * (mainHandWC + offHandWC);
        sitModSum += dualWieldPenalty;
        sitModsArr.push(`Dual Wielding (${dualWieldPenalty})`);
        Hyp3eLogger.info("Hyp3eActor _getCombatantSitMods", `Dual wielding penalty applied: ${dualWieldPenalty}`);
      }
    }

    let attackerEffects;
    if (!foundry.utils.isNewerVersion(game.version, "13")) {
      // For Foundry v12...
      Hyp3eLogger.error("Hyp3eActor _getCombatantSitMods", `Foundry version not supported: ${game.version}`);
      attackerEffects = this.effects
    } else if (foundry.utils.isNewerVersion(game.version, "13")) {
      // For Foundry v13...
      attackerEffects = this.allApplicableEffects()
    }
    Hyp3eLogger.info("Hyp3eActor _getCombatantSitMods", `${this.name} (attacking) has effects:`, attackerEffects);
    // const effects = this._getEffectNames()

    // Hopefully we have a target!
    let targetEffects
    if (target) {
      if (!foundry.utils.isNewerVersion(game.version, "13")) {
        // For Foundry v12...
        Hyp3eLogger.error("Hyp3eActor _getCombatantSitMods", `Foundry version not supported: ${game.version}`);
        targetEffects = target.actor.effects
      } else if (foundry.utils.isNewerVersion(game.version, "13")) {
        // For Foundry v13...
        targetEffects = target.actor.allApplicableEffects()
      }
      Hyp3eLogger.info("Hyp3eActor _getCombatantSitMods", `${target.name} (defending) has effects:`, targetEffects);
      // targetEffects = targetActor._getEffectNames()
    }

    // Start gathering situational modifiers
    attackerEffects.forEach(effect => {
      if (!effect.disabled) {
        Hyp3eLogger.info("Hyp3eActor _getCombatantSitMods", `${this.name} effect statuses:`, effect.statuses);
        // Does the effect apply a tempAtkMod?
        const tempAtkMod = effect.changes.find(c => c.key === "system.tempAtkMod")
        if (tempAtkMod) {
          Hyp3eLogger.info("Hyp3eActor _getCombatantSitMods", `${this.name} has tempAtkMod: ${tempAtkMod.value}`);
          // Add the tempAtkMod to the sitMod
          sitModSum += parseInt(tempAtkMod.value)
          const changeString = parseInt(tempAtkMod.value) > 0 ? `+${tempAtkMod.value}` : `${tempAtkMod.value}`
          sitModsArr.push(`${effect.name} (${changeString})`)
        }
        // Status effects that may not apply any changes...
        //      The assumption here is that if an effect has at least one change 
        //      being applied, it is probably modifying the attacker's roll. So we don't
        //      want to "double-dip" that modifier by applying it again here.
        //      But if the status was just applied from the token right-click menu,
        //      then there won't be any changes, and we should handle it here.
        if (CONFIG.HYP3E.enableCombatSitModDetection) {
          if (!tempAtkMod) {
            // Effect names can be arbitrary, what we care about is the token status/condition
            if (effect.statuses.has("blind")) {
              sitModSum += -4
              sitModsArr.push("Blind (-4)")
            }
            if (effect.statuses.has("invisible")) {
              sitModSum += 4
              sitModsArr.push("Invisible (+4)")
            }
            if (effect.statuses.has("flankAttack")) {
              sitModSum += 1
              sitModsArr.push("Flanking (+1)")
            }
            if (effect.statuses.has("rearAttack")) {
              sitModSum += 2
              sitModsArr.push("Rear Attack (+2)")
            }
          }
        }
      }
    });
    // Hopefully we have a target!
    if (target) {
      if (CONFIG.HYP3E.enableCombatSitModDetection) {
        // Is the target casting a spell while dodging a melee attack?
        if (target?.combatant?.isMagic && !isMissile) {
          sitModSum += 2
          sitModsArr.push("Defender Casting Spell (+2)")
        }
        // Don't bother with elevation if we don't have an attacker token
        if (attacker) {
          Hyp3eLogger.info("Hyp3eActor _getCombatantSitMods", `${target.name} elevation (${target?.document.elevation}) vs. Attacker elevation (${attacker?.document.elevation})...`);
          // Attacker on higher ground (token height vs. target token height)
          if (attacker?.document.elevation > target.document.elevation) {
            sitModSum += 1
            sitModsArr.push("Higher Ground (+1)")
          }
          // Defender is on higher ground
          if (attacker?.document.elevation < target.document.elevation) {
            sitModSum += -1
            sitModsArr.push("Defender on Higher Ground (-1)")
          }
        }
      }
      // Effect names can be arbitrary, what we care about is the token status/condition
      targetEffects.forEach(effect => {
        if (!effect.disabled) {
          Hyp3eLogger.info("Hyp3eActor _getCombatantSitMods", `${target.name} effect statuses:`, effect.statuses);
          // Status effects that may not apply any changes...
          //      The assumption here is that if an effect has at least one change 
          //      being applied, it is probably modifying the target's AC. So we don't
          //      want to "double-dip" that modifier by applying it again here.
          //      But if the status was just applied from the token right-click menu,
          //      then there won't be any changes, and we should handle it here.
          if (!effect.changes.find(c => c.key == "system.ac.tempAcMod")) {
            if (CONFIG.HYP3E.enableCombatSitModDetection) {
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
              // Concealment only affects missile attacks
              if (isMissile) {
                if (effect.statuses.has("coverPartial")) {
                  sitModSum += -2
                  sitModsArr.push("Defender Partially Concealed (-2)")
                }
                if (effect.statuses.has("coverFull")) {
                  sitModSum += -5
                  sitModsArr.push("Defender Mostly Concealed (-5)")
                }
              }
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
    Hyp3eLogger.info("Hyp3eActor _getCombatantSitMods", `${this.name} has accumulated situational modifiers:`, sitModsArr.join(", "));
    // Finalize the modifiers & return
    sitModObj = {
      sitModSum: sitModSum,
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
      const skillsAffectedByArmor = ["climb", "hide", "move silently"];

      const skillMods = {};
      // Validate whether this is even a Thief skill listed in skillMap
      const attrKey = skillMap[skillName.toLowerCase()];
      if (!attrKey) return { skillMods: { modifier: 0, attribute: null } }; // not a thief progressive skill

      // Check attribute score for a bonus
      const score = attributes[attrKey] ?? 0;
      const modifier = score >= 16 ? 1 : 0;
      skillMods["attribute"] = { modifier: modifier, attribute: attrKey.toUpperCase() };

      // Check for armor penalties
      if (skillsAffectedByArmor.includes(skillName.toLowerCase())) {
          const wornArmor = this.system.wornArmorType;
          if (wornArmor === "medium") {
              Hyp3eLogger.info("Hyp3eActor _getThiefSkillModifier", `Thief skill ${skillName} penalized by ${wornArmor} armor.`);
              skillMods["armor"] = { modifier: -4, attribute: `Medium armour` };
          } else if (wornArmor === "heavy") {
              Hyp3eLogger.info("Hyp3eActor _getThiefSkillModifier", `Thief skill ${skillName} prevented by ${wornArmor} armor.`);
              skillMods["armor"] = { modifier: -99, attribute: `Heavy armour` };
          }
      }
      Hyp3eLogger.info("Hyp3eActor _getThiefSkillModifier", `${skillName} skill modifiers:`, skillMods);
      return skillMods;
      // return { modifier: modifier, attribute: attrKey };
  }

  /**
   * Creates the HTML for the chat card header/label.
   * @param {string|null} itemImg - Path to the item image.
   * @param {string} itemName - Name of the item/action.
   * @returns {string} HTML string for the label.
   */
  _createChatLabel(chatImg, itemName) {
      // Use a default image if itemImg is missing
      const imgSrc = chatImg || "icons/svg/mystery-man.svg";
      return `
          <hr class="plain-hr" />
          <div class="chat-label">
              <img src="${imgSrc}">
              <span>
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
              Hyp3eLogger.info("Hyp3eActor _consumeAmmoOrItem", `Using ammo: ${ammo.name}`, ammo.system);
              try {
                  await this.updateEmbeddedDocuments("Item", [
                      { _id: ammo.id, "system.quantity.value": ammo.system.quantity.value - 1 },
                  ]);
                  ammoUpdated = true;
              } catch (err) {
                  Hyp3eLogger.error("_consumeAmmoOrItem", `Failed to update ammo quantity for ${ammo.name}:`, err);
              }
          } else if (rollResponse.ammunition) {
              Hyp3eLogger.warn("_consumeAmmoOrItem", `Selected ammo ${rollResponse.ammunition} not found or has 0 quantity.`);
          }
      } else if (item?.type === "weapon" && item.system.isConsumable) {
          // If the weapon itself is consumable (like a grenade), decrement its qty
          try {
              await this.updateEmbeddedDocuments("Item", [
                  { _id: item.id, "system.quantity.value": item.system.quantity.value - 1 },
              ]);
          } catch (err) {
              Hyp3eLogger.error("_consumeAmmoOrItem", `Failed to update quantity for ${item.name}:`, err);
          }
      }
      return { ammoMods, ammoUpdated };
  }

  /**
   * Consumes a spell slot if the spell is memorized.
   * @param {Item} spell - The spell being cast.
   */
  async _consumeSpellSlot(spell) {
      Hyp3eLogger.info("Hyp3eActor _consumeSpellSlot", `Consuming memorized spell: ${spell.name}`);
      try {
          await this.updateEmbeddedDocuments("Item", [
              { _id: spell.id, "system.quantity.value": spell.system.quantity.value - 1 },
          ]);
      } catch (err) {
          Hyp3eLogger.error("_consumeSpellSlot", `Failed to update spell quantity for ${spell.name}:`, err);
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
      Hyp3eLogger.info("Hyp3eActor useItemSpell", `Casting spell ${spell.name}:`, spell);;

      // Get spell charges to use
      const spellEntry = item.system.spellcasting.spellRefs.find(spell => spell.uuid === spellUuid)
      const spellCharges = spellEntry.charges

      // Check item has enough charges (if applicable) for the spell
      if (spellcasting.charges.value >= 0 && spellcasting.charges.value < spellCharges) {
          ui.notifications.warn(`${item.name} does not have enough charges.`);
          return;
      }

      // Get the actor's token
      const token = this.getAssociatedToken();

      const dataset = {
          "rollType": "item",
          "label": `Cast spell ${spell.name}`,
          "itemId": spellUuid,
          "actorId": this.id,
          "baseClass": this.system.baseClass,
          "tokenId": token.id,
          "isItemSpell": true,
          "itemCa": item.system.spellcasting.ca
      }
      Hyp3eLogger.info("Hyp3eActor useItemSpell", `Spell dataset:`, dataset);
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
    // Hyp3eLogger.info("Hyp3eActor toggleLightSource", `Actor ${this.name}:`, this);
    // const token = this?.token ?? this?.sheet?.token;
    const token = this.getAssociatedToken();
    if (!token) {
      Hyp3eLogger.warn("toggleLightSource", `No token found for actor ${this.name}.`);
      return;
    }
    const item = this.items.get(itemId);
    if (!item) {
      Hyp3eLogger.warn("toggleLightSource", `item ${itemId} not found for actor ${this.name}.`);
      return;
    }

    // If the token already has a light source, toggle it off and exit
    const hasLight = token.light?.dim || token.light?.bright;
    if (hasLight) {
      // Remove any current light source active effect from actor
      // const activeEffects = this.effects.filter(e => e.origin === item.uuid && e.name.startsWith("Light Source:"));
      const activeEffects = this.effects.filter(e => e.name.startsWith("Light Source:"));
      if (activeEffects.length > 0) {
        await activeEffects[0].delete();
        Hyp3eLogger.info("Hyp3eActor toggleLightSource", `Light source active effect removed from actor ${this.name}.`);
      } else {
        Hyp3eLogger.info("Hyp3eActor toggleLightSource", `No active effect found for light source on actor ${this.name}.`);
        // Remove light source from token, if necessary (e.g., if it was applied directly)
        await token.update({
          "light": null
        });
      }
      ui.notifications.info(`Light source removed from ${token.name}.`);
      Hyp3eLogger.info("Hyp3eActor toggleLightSource", `Light source removed from token ${token.name}.`);
      return;
    }

    // Do we require a check for inventory?
    if (CONFIG.HYP3E.requireLightSourceFuel) {
      Hyp3eLogger.info("Hyp3eActor toggleLightSource", `Checking for light source and/or fuel...`);
      // Normalize the name to an array of lower-case single words
      const lightName = (item.name.toLowerCase().trim()).split(/[\s,]+/);
      // Assume standard names for light sources: candle, lamp, lantern, torch
      const sources = ["candle", "lamp", "lantern", "torch"];
      // Does the light source name appear in the list of standard names?
      const baseName = lightName.filter(item => sources.includes(item));
      if (baseName.length > 0) {
        const base = baseName[0];
        let fuelId = "";
        switch (base) {
          case "candle":
            fuelId = this._hasFuel("candle");
            break;
          case "lamp":
            fuelId = this._hasFuel("oil");
            break;
          case "lantern":
            fuelId = this._hasFuel("oil");
            break;
          case "torch":
            fuelId = this._hasFuel("torch");
            break;
        }
        if (!fuelId) {
          const msg = (base == "candle" || base == "torch") 
            ? `${this.name} does not have a ${base} in inventory!`
            : `${this.name} does not have oil for the ${base}!`;
          ui.notifications.warn(msg);
          Hyp3eLogger.info("Hyp3eActor toggleLightSource", msg);
          return;
        }
        // Use the fuel
        this.useItem(fuelId);
      }
    }

    // Apply light source properties
    const v14orLater = ActiveEffect?.registry ? true : false;
    const lightProps = foundry.utils.deepClone(item.system.light);
    // Resolve duration roll formula to number
    if (lightProps.duration) {
      const durationRoll = new Roll(lightProps.duration, this.getRollData());
      await durationRoll.evaluate({ evaluateSync: true });
      lightProps.duration = durationRoll.total;
    } else {
      lightProps.duration = null; // Default to null if no duration specified
    }
    Hyp3eLogger.info("Hyp3eActor toggleLightSource", `Light source properties:`, lightProps);
    if (Object.keys(lightProps).length > 0) {
      // const duration = v14orLater 
      //   ? { units: "rounds", value: lightProps.duration || undefined, expiry: "turnEnd" } 
      //   : { rounds: lightProps.duration || undefined };
      const duration = {};
      if (v14orLater) {
        duration.units = "rounds";
        if (lightProps.duration) {
          duration.value = lightProps.duration;
          duration.expiry = "turnEnd";
        } else {
          duration.value = null;
          duration.expiry = null;
        }
      } else {
        duration.rounds = lightProps.duration;
      }
      const lightEffect = new ActiveEffect({
        name: `Light Source: ${item.name}`,
        img: "icons/svg/light.svg",
        origin: item.uuid,
        disabled: false,
        duration: duration,
        flags: {
          hyp3e: {
            lightProps: lightProps
          }
        }
      });
      await this.createEmbeddedDocuments("ActiveEffect", [lightEffect]);
      ui.notifications.info(`Light source applied to ${token.name}.`);
    }
  }

  /**
   * 
   * @param {String} fuel - Name of the fuel to find
   * @returns {String|null} itemId of the fuel if found, else null if not or qty == 0
   */
  _hasFuel(fuel) {
    if (!fuel) return null;
    fuel = fuel.toLowerCase();  // Sanity check

    const item = this.items.find(item => {
      const name = item.name?.toLowerCase() ?? "";
      const qty = item.system?.quantity?.value;

      // Tokenize to avoid false positives (e.g., "boiled")
      const tokens = name.split(/[\s,]+/);

      // Must include the fuel term
      if (!tokens.includes(fuel)) return false;

      // Special rule: exclude incendiary oil
      if (fuel === "oil" && name.includes("incendiary")) return false;

      return true;
    });
    return (item && item.system?.quantity?.value > 0) ? item._id : null;
  }

  /**
   * Determine whether this container has any items inside
   */
  _itemContainsStuff(itemId) {
    Hyp3eLogger.info("Hyp3eActor _itemContainsStuff", `Item id ${itemId} contains items:`, this.items.filter(i => i.system.containerId === itemId));
    const containsItems = this.items.some(i => i.system.containerId == itemId);
    return containsItems;
  }

  async advanceTime(rounds) {
    // Process only active effects directly applied to the actor
    for (const effect of this.effects) {
      if (!effect.isTemporary || effect.disabled) continue; // Skip non-temporary or disabled effects
      Hyp3eLogger.info("Hyp3eActor advanceTime", `Processing effect ${effect.name} for actor ${this.name}...`, effect);

      // Simulate the passage of rounds
      await this.processTemporaryEffects(rounds);
      // Advance the temp effects round-timer and delete if expired
      await this.advanceTempEffectsTimer(rounds);
    }

    // Process this actor's owned items - not currently used, but we may want to add 
    //  item-specific time-based effects/events in the future
    // for (const item of this.items) {
    //   await item.advanceTime(rounds);
    // }

    // Update temporary item durations & delete if expired
    await this.processTemporaryItems(rounds);
  }

  /**
   * Handle active effects that might expire, or events that occur, with a new turn.
   * @param {*} turn - The current game-world turn number.
   */
  async advanceExplorationTurn(turn) {
    // Process active effects and temporary items with the passage of one turn (60 rounds)
    this.advanceTime(60);
  }

  async retreatTime(rounds) {
    // Foundry v14 introduced big changes to Active Effects, so we need to check the 
    //  version to determine how to process them
    const v14orLater = ActiveEffect?.registry ? true : false;

    // Process only active effects directly applied to the actor
    for (const effect of this.effects) {
      if (!effect.isTemporary || effect.disabled) continue; // Skip non-temporary or disabled effects
      Hyp3eLogger.info("Hyp3eActor retreatExplorationTurn", `Processing effect ${effect.name} for actor ${this.name}...`, effect);

      // Reverse the remainingRounds flag by the specified rounds, but not exceeding the original value
      let remainingRounds = effect.getFlag("hyp3e", "remainingRounds");
      if (remainingRounds) {
        let maxDuration = null;
        if (v14orLater && effect.duration.units === "rounds") {
          maxDuration = effect.duration.value ?? null;
        } else if (!v14orLater && (effect.duration?.type === "rounds" || effect.duration?.type === "turns")) {
          maxDuration = effect.duration.rounds ?? effect.duration.turns ?? null;
        }
        const newRounds = Math.min(remainingRounds + rounds, maxDuration);
        await effect.setFlag("hyp3e", "remainingRounds", newRounds);
      }
    }

    // Update temporary item durations & restore if necessary
    await this.processTemporaryItems(-rounds);
  }

  /**
   * Handle active effects that might expire, or events that occur, by retreating one turn.
   * @param {*} turn - The current game-world turn number.
   */
  async retreatExplorationTurn(turn) {
    // Attempt to reverse the passage of time by 60 rounds, updating time remaining on temporary 
    //  active effects and items. This is a best effort, since we can't truly reverse time, but 
    //  it should help mitigate some of the issues with time passage in exploration mode.
    this.retreatTime(60);
  }

  /** SPECIALIZED SKILL/TASK RESOLUTION ---------------*/

  /**
   * Resolve a progressive thief ability check.
   * @param {*} abilityName - The name of the thief ability.
   * @returns {Number} - The target number required for success.
   */
  _resolveThiefAbilityTn(abilityName) {
      // Just in case the ability name was not sent in lower case already
      abilityName = abilityName.toLowerCase()
      const thiefLevel = this.system.details.level.value;
      const thiefAbilities = {
          "climb": [8, 8, 9, 9, 10, 10],
          "decipher script": [0, 1, 2, 3, 4, 5],
          "discern noise": [4, 5, 6, 7, 8, 9],
          "hide": [5, 6, 7, 8, 9, 10],
          "manipulate traps": [3, 4, 5, 6, 7, 8],
          "move silently": [5, 6, 7, 8, 9, 10],
          "open locks": [3, 4, 5, 6, 7, 8],
          "pick pockets": [4, 5, 6, 7, 8, 9],
          "read scrolls": [null, null, 0, 3, 4, 5]
      };
      const abilityData = thiefAbilities[abilityName];
      const levelIndex = Math.ceil(thiefLevel / 2) - 1;
      return abilityData[levelIndex];
  }

  /**
   * Resolve the target number needed to make an assassination against a selected target.
   * @param {*} target - The target token, from which we derive the actor's level or hit dice.
   * @returns {Number} - The target number required for success.
   */
  _resolveAssassinationTn(target) {
      /*
      Assassination
      =============
      The assassin's chance to kill a target outright is shown in the Player's Manual, 
      Table 56: Assassination. It is based on the level/hit die difference
      between the assassin and his target [baseSuccess - targetDifficultyMod], and a 
      negative modifier if the target is also an assassin of a higher level than his 
      attacker [assassinTargetMod].
      */
      const assassinLevel = parseInt(this.system.details.level.value)
      const baseSuccess = assassinLevel + 4
      const targetLevel = parseInt(target.actor.type == "npc" ? target.actor.system?.hd.split("d")[0] : target.actor.system?.details.level.value)
      const targetDifficultyMod = Math.floor(targetLevel/2)
      const targetIsAssassin = target.actor.type == "character" && target.actor.system?.details.class == "Assassin"
      const assassinTargetMod = targetIsAssassin && targetLevel > assassinLevel ? (targetLevel - assassinLevel) : 0
      return (baseSuccess - targetDifficultyMod - assassinTargetMod);
  }

  // Build the chat message for assassination
  _resolveAssassination(target, success) {
      /*
      Assassination
      =============
      Logic for Assassination damage:
      - The assassin's damage multiplier is based on his class level, and should be included in the 
      chat message.
      - We should be able to grab the previous damage roll and apply the multiplier automatically...
      need to test this. But it acts like a critical hit, so the code should be similar.
      */
      let assassinationHtml = ''
      let results = []
      const assassinLevel = parseInt(this.system.details.level.value)
      const targetName = target.actor.displayName

      // From here on, success or failure is based on multiple factors
      if (success) {
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
  _resolveTurnUndead(rollTotal, turnAbility, turnOrCommand) {
      /*
      Turning Undead
      ==============
      Cross-reference the cleric (or sub-class) TA and die roll against the Turn Undead table to determine possible 
      results, and output those to the chat.
      We can just use the actor's TA and dynamically calculate the results row from the Turn Undead table, since the 
      minimum value for success is always a target number of 10, affecting undead at Type [TA - 1].

      Logic:
      - If TA is 1, it is possible to completely fail on a result of 11+.
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
      if (turnAbility <= 1 && rollTotal > 10) {
          return `<p>No undead were affected...</p>`;
      }

      // From here on it's all some level of success
      if (rollTotal <= 1) {
          if ((turnAbility+2) > 0) { orLess = 'or less ' }
          results.push(`<li>Undead of Type ${turnAbility+2} ${orLess}are <b>${turnOrCommand}ed</b>.</li>`)
      } else if (rollTotal <= 4) {
          if ((turnAbility+1) > 0) { orLess = 'or less ' }
          results.push(`<li>Undead of Type ${turnAbility+1} ${orLess}are <b>${turnOrCommand}ed</b>.</li>`)
      } else if (rollTotal <= 7) {
          if ((turnAbility) > 0) { orLess = 'or less ' }
          results.push(`<li>Undead of Type ${turnAbility} ${orLess}are <b>${turnOrCommand}ed</b>.</li>`)
      } else if (rollTotal <= 10) {
          if ((turnAbility-1) > 0) { orLess = 'or less ' }
          results.push(`<li>Undead of Type ${turnAbility-1} ${orLess}are <b>${turnOrCommand}ed</b>.</li>`)
      } else {
          // Even a roll of 11 or 12 is still successful against weaker undead
          if ((turnAbility-2) > 0) { orLess = 'or less ' }
          results.push(`<li>Undead of Type ${turnAbility-2} ${orLess}are <b>${turnOrCommand}ed</b>.</li>`)
      }
      // Reset orLess
      orLess = ''
      // At TA 4+, the cleric can actually destroy undead
      if (turnAbility >= 4 && turnOrCommand == 'turn') {
          if ((turnAbility-4) > 0) { orLess = 'or less ' }
          results.push(`<li>Undead of Type ${turnAbility-4} ${orLess}are <b>destroyed</b>.</li>`)
      }
      // At TA 7+, the cleric is so powerful that his number affected is greatly improved
      if (turnAbility >= 7) {
          rollAffected = '1d6+6'
      }

      // Now we can setup our description output from the results
      if (turnOrCommand == 'turn') {
          turnUndeadHtml = `<p>Roll [[/r ${rollAffected}]] for the total number of undead affected. Starting from the weakest (lowest Type)...</p><ul>`
      } else {
          turnUndeadHtml = `<p>The total hit dice value of undead affected is ${this.system.ta * 2} HD (2 HD per TA level). Starting from the weakest (lowest Type)...</p><ul>`
      }
      for (let i = results.length-1; i >=0; i--) {
          turnUndeadHtml += results[i]
      }
      turnUndeadHtml += `</ul>`

      Hyp3eLogger.info("Hyp3eActor _resolveTurnUndead", `Turn Undead:`, turnUndeadHtml);
      return turnUndeadHtml;
  }


  /** ACTOR TOKEN HELPERS ------------------------------*/

  /**
   * Get a token document associated with an actor.
   * - If the actor is synthetic (from a token), returns its .token
   * - Otherwise, tries to find a token on the active canvas for this actor
   * @returns {TokenDocument|null}
   */
  getAssociatedToken() {
      // Synthetic actor (opened from a token)
      if (this.token) return this.token;

      // Base actor (opened from sidebar): search canvas
      const token = canvas.tokens?.placeables.find(t => t.actor?.id === this.id);
      return token ? token.document : null;
  }

  /**
   * Get details about the actor's token linkage.
   * @returns {Object} info
   */
  getActorTokenInfo() {
      const tokenDoc = this.token; // Only present if synthetic
      const isSynthetic = !!tokenDoc;
      const isLinked = isSynthetic ? tokenDoc.actorLink : false;
      const baseActor = isSynthetic ? tokenDoc.actor : this;

      return {
          actor: this,     // the actual actor (synthetic or base)
          baseActor,       // always resolves to the sidebar actor
          token: tokenDoc, // null if base actor, TokenDocument if synthetic
          isSynthetic,     // true if this is a token-created actor
          isLinked,        // true if token is linked to its base actor
      };
  }

  /**
   * Get the token's display name, the actor's tokenAlias if it exists, otherwise the actor name.
   * @returns {string}
   */
  get displayName() {
    const tokenInfo = this.getActorTokenInfo();
    if (tokenInfo.token) {
      return tokenInfo.token.name || tokenInfo.baseActor.system?.tokenAlias || tokenInfo.baseActor.name;
    }
    return this.system?.tokenAlias || this.name;
  }

  /**
   * Check if this actor is in the current active combat.
   * Works for both base actors and synthetic (token) actors.
   * @returns {boolean}
   */
  isInCombat() {
    return !!this.getCombatant();
  }

  /**
   * Get the Combatant for this actor in the current active combat.
   * Returns null if the actor is not part of combat.
   * @returns {Combatant|null}
   */
  getCombatant() {
    const combat = game.combat;
    if (!combat) return null;

    // Synthetic actor (unlinked or opened from a token)
    if (this.token) {
      return combat.combatants.find(c => c.tokenId === this.token.id) ?? null;
    }

    // Base actor (from sidebar)
    return combat.combatants.find(c => c.actorId === this.id) ?? null;
  }


  /** LOOKUP TABLES AND FUNCTIONS ---------------------*/

  /**
   * Reaction lookup table
   */
  reactionTable = {
    0: "<b>Violent</b>: Immediate attack",
    2: "<b>Violent</b>: Immediate attack",
    3: "<b>Hostile</b>: Antagonistic; attack likely",
    4: "<b>Unfriendly</b>: Negative inclination",
    6: "<b>Neutral</b>: Disinterested or uncertain (reroll once)",
    9: "<b>Friendly</b>: Considers ideas/proposals",
    11: "<b>Agreeable</b>: Willing and helpful",
    12: "<b>Affable</b>: Extremely accomodating"
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