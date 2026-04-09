// module/data/actor/character.mjs
import Hyp3eActorBase from "./base.mjs";
import { Hyp3eCharacterClass } from "../../helpers/character.mjs";
import { moneyTemplate } from "../templates/money.mjs";
import { Hyp3eDice, isPureNumber, isPureString, convertToInt, containsDice, containsMathOrVariables } from "../../dice/dice.mjs";
import { Hyp3eLogger } from "../../helpers/logger.mjs";

export default class Hyp3eCharacter extends Hyp3eActorBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    let schema = super.defineSchema();

    // Character fields
    schema.attributes = new fields.SchemaField({
      str: new fields.SchemaField({
        value: new fields.NumberField({ integer: true, initial: 10 }),
        curr: new fields.NumberField({ integer: true, initial: 10 }),
        atkMod: new fields.NumberField({ integer: true, initial: 0 }),
        dmgMod: new fields.NumberField({ integer: true, initial: 0 }),
        test: new fields.NumberField({ integer: true, initial: 0 }),
        feat: new fields.NumberField({ integer: true, initial: 0 })
      }),
      dex: new fields.SchemaField({
        value: new fields.NumberField({ integer: true, initial: 10 }),
        curr: new fields.NumberField({ integer: true, initial: 10 }),
        atkMod: new fields.NumberField({ integer: true, initial: 0 }),
        defMod: new fields.NumberField({ integer: true, initial: 0 }),
        test: new fields.NumberField({ integer: true, initial: 0 }),
        feat: new fields.NumberField({ integer: true, initial: 0 })
      }),
      con: new fields.SchemaField({
        value: new fields.NumberField({ integer: true, initial: 10 }),
        curr: new fields.NumberField({ integer: true, initial: 10 }),
        hpMod: new fields.NumberField({ integer: true, initial: 0 }),
        poisRadMod: new fields.NumberField({ integer: true, initial: 0 }),
        traumaSurvive: new fields.NumberField({ integer: true, initial: 0 }),
        test: new fields.NumberField({ integer: true, initial: 0 }),
        feat: new fields.NumberField({ integer: true, initial: 0 })
      }),
      int: new fields.SchemaField({
        value: new fields.NumberField({ integer: true, initial: 10 }),
        curr: new fields.NumberField({ integer: true, initial: 10 }),
        languages: new fields.NumberField({ integer: true, initial: 0 }),
        bonusSpells: new fields.SchemaField({
          lvl1: new fields.BooleanField({ initial: false }),
          lvl2: new fields.BooleanField({ initial: false }),
          lvl3: new fields.BooleanField({ initial: false }),
          lvl4: new fields.BooleanField({ initial: false })
        }),
        learnSpell: new fields.NumberField({ integer: true, initial: 0 })
      }),
      wis: new fields.SchemaField({
        value: new fields.NumberField({ integer: true, initial: 10 }),
        curr: new fields.NumberField({ integer: true, initial: 10 }),
        willMod: new fields.NumberField({ integer: true, initial: 0 }),
        bonusSpells: new fields.SchemaField({
          lvl1: new fields.BooleanField({ initial: false }),
          lvl2: new fields.BooleanField({ initial: false }),
          lvl3: new fields.BooleanField({ initial: false }),
          lvl4: new fields.BooleanField({ initial: false })
        }),
        learnSpell: new fields.NumberField({ integer: true, initial: 0 })
      }),
      cha: new fields.SchemaField({
        value: new fields.NumberField({ integer: true, initial: 10 }),
        curr: new fields.NumberField({ integer: true, initial: 10 }),
        reaction: new fields.NumberField({ integer: true, initial: 0 }),
        maxHenchmen: new fields.NumberField({ integer: true, initial: 0 }),
        turnUndead: new fields.NumberField({ integer: true, initial: 0 })
      })
    });

    schema.spellcaster = new fields.BooleanField({ initial: true });
    schema.spellList = new fields.StringField({ blank: true, initial: "" });
    schema.spells = new fields.SchemaField({
      l1: new fields.StringField({ blank: true }),
      l2: new fields.StringField({ blank: true }),
      l3: new fields.StringField({ blank: true }),
      l4: new fields.StringField({ blank: true }),
      l5: new fields.StringField({ blank: true }),
      l6: new fields.StringField({ blank: true })
    });
    schema.spellList2 = new fields.StringField({ blank: true, initial: "" });
    schema.spells2 = new fields.SchemaField({
      l1: new fields.StringField({ blank: true }),
      l2: new fields.StringField({ blank: true }),
      l3: new fields.StringField({ blank: true }),
      l4: new fields.StringField({ blank: true }),
      l5: new fields.StringField({ blank: true }),
      l6: new fields.StringField({ blank: true })
    });

    schema.details = new fields.SchemaField({
      notes: new fields.StringField({ blank: true }),
      class: new fields.StringField({ blank: true }),
      level: new fields.SchemaField({ value: new fields.NumberField({ integer: true, initial: 1 }) }),
      xp: new fields.SchemaField({
        value: new fields.StringField({ initial: "0" }),
        toNextLvl: new fields.StringField({ initial: "0" }),
        bonus: new fields.NumberField({ integer: true, initial: 0 }),
        primeAttr: new fields.StringField({ blank: true })
      }),
      race: new fields.StringField({ blank: true }),
      gender: new fields.StringField({ blank: true }),
      age: new fields.StringField({ blank: true }),
      homeland: new fields.StringField({ blank: true }),
      religion: new fields.StringField({ blank: true }),
      height: new fields.StringField({ blank: true }),
      weight: new fields.StringField({ blank: true }),
      hair: new fields.StringField({ blank: true }),
      eyes: new fields.StringField({ blank: true }),
      complexion: new fields.StringField({ blank: true }),
      physicalFeatures: new fields.StringField({ blank: true })
    });

    schema.unskilled = new fields.NumberField({ initial: 0 });

    schema.proficiencies = new fields.SchemaField({
      class: new fields.StringField({ blank: true }),
      lvl4: new fields.StringField({ blank: true }),
      lvl8: new fields.StringField({ blank: true }),
      lvl12: new fields.StringField({ blank: true })
    });

    // Money template
    schema = this.mergeSchema(schema, moneyTemplate);

    schema.treasure = new fields.StringField({ blank: true });

    schema.weightCarried = new fields.NumberField({ integer: true, initial: 0 });
    schema.wornArmorType = new fields.StringField({ blank: true, initial: "" });
    schema.encumberedState = new fields.StringField({ blank: true, initial: "unencumbered" });

    schema.taskResolution = new fields.SchemaField({
      simple: new fields.SchemaField({
        name: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.simple.name") }),
        hint: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.simple.hint") }),
        tn: new fields.NumberField({ integer: true, initial: 5 })
      }),
      moderate: new fields.SchemaField({
        name: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.moderate.name") }),
        hint: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.moderate.hint") }),
        tn: new fields.NumberField({ integer: true, initial: 4 })
      }),
      "challenging": new fields.SchemaField({
        name: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.challenging.name") }),
        hint: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.challenging.hint") }),
        tn: new fields.NumberField({ integer: true, initial: 3 })
      }),
      "difficult": new fields.SchemaField({
        name: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.difficult.name") }),
        hint: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.difficult.hint") }),
        tn: new fields.NumberField({ integer: true, initial: 2 })
      }),
      "veryDifficult": new fields.SchemaField({
        name: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.veryDifficult.name") }),
        hint: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.veryDifficult.hint") }),
        tn: new fields.NumberField({ integer: true, initial: 1 })
      })
    });

    return schema;
  }

  /** 
   * Runs BEFORE Active Effects are applied.
   * Used for calculating base "curr" values that AEs can then modify.
   */
  prepareBaseData() {
    super.prepareBaseData?.();

    // PCs can drop to -10 hp before they die
    this.hp.min = -10;
    this.weightCarried = 0;

    Hyp3eLogger.info("Hyp3eCharacter prepareBaseData", `Base data prepared for character ${this.parent.name}:`, this);
  }

  /** 
   * Runs AFTER Active Effects.
   * Use this for final totals, clamping, or anything that depends on post-AE values.
   */
  prepareDerivedData() {
    super.prepareDerivedData?.();

    // Get character base class, used for crit hit & crit miss tables
    const customClassData = this.getSetting("customClassData");
    this.baseClass = Hyp3eCharacterClass.classData[this.details.class]?.baseClass ?? customClassData[this.details.class]?.baseClass ?? "npc";

    // Auto-calculate attribute modifiers if configuration is enabled
    const autoCalcAttrMods = this.getSetting("autoCalcAttrMods");
    if (autoCalcAttrMods) {
      const attributeData = this._calcAttrMods();
      if (attributeData) {
        this.attributes = attributeData;
      }
    }

    // Apply active effects that modify attributes, if any exist. This is 
    //  necessary because some attribute modifiers depend on other attribute 
    //  values (e.g. a spell that gives you +1 to all modifiers, which then 
    //  affects your attack and damage mods).
    if (this.attributes) {
      let attributes = this.attributes;
      attributes = this._applyActiveEffectsToAttributes(attributes);
      this.attributes = attributes;
    }

    // Calculate weight carried & encumbrance
    this.weightCarried = this._calcWeightCarried();

    // What weight-class of armor (if any) is worn?
    const items = this._getEquippedProtectionItems();
    let armorType = "unarmored";
    for (const item of items) {
      const sys = item.system ?? {};
      if (item.type === "armor" && sys.type !== "shield") {
        armorType = sys.type || "unarmored";
        break; // We assume only one armor will be worn, so break after the first match
      }
    }
    this.wornArmorType = armorType;

    // Get encumbered status
    this.encumberedState = this._getEncumberedStatus();

    // Auto-calculate AC, DR, MV if configuration is enabled
    const autoCalcAc = this.getSetting("autoCalcAc");
    if (autoCalcAc) {
      const { ac, dr, mv } = this._getCharacterAcAndMv();
      this.ac.value = ac;
      this.ac.dr = dr;
      this.movement.base.value = mv;
    }

    // Apply temp AC, DR, and MV modifiers regardless of autoCalc setting
    this._applyTempModifiers();

    Hyp3eLogger.info("Hyp3eCharacter prepareDerivedData", `Derived data prepared for character ${this.parent.name}:`, this);
  }

  /**
   * Automatically calculate and populate character attribute modifiers
   * @returns {object} - JSON object of attributes and modifiers
   */
  _calcAttrMods() {
    if (!this.attributes) return;

    // Use a clone of the actor's system data to avoid mutating it directly
    const systemData = foundry.utils.deepClone(this);
    const attributeData = Hyp3eCharacterClass.calcAttrMods(systemData);

    Hyp3eLogger.info("Hyp3eCharacter _calcAttrMods", `Calculated attribute data for ${this.parent.name}:`, attributeData);
    return attributeData;
  }

  /**
   * Apply active effects that modify attributes, if any exist.
   * @returns {*} attributes with active effects applied to them
   * 
   * Note: This function is necessary to apply changes from active effects that 
   *  depend on other attribute values (e.g. a spell that gives you +1 to all 
   *  modifiers, which then affects your attack and damage mods).
   * We have to do this in a separate function after _calcAttrMods because we 
   *  need the base modifiers to calculate the dependent modifiers correctly.
   */
  _applyActiveEffectsToAttributes() {
    const actor = this.parent;
    if (!actor) return this.attributes;

    const attributeData = foundry.utils.deepClone(this.attributes);

    // Attribute modifiers that could receive an active effect
    const allowedKeys = [
      "system.attributes.str.atkMod", 
      "system.attributes.str.dmgMod", 
      "system.attributes.str.test", 
      "system.attributes.str.feat", 
      "system.attributes.dex.atkMod", 
      "system.attributes.dex.defMod", 
      "system.attributes.dex.test", 
      "system.attributes.dex.feat", 
      "system.attributes.con.hpMod", 
      "system.attributes.con.poisRadMod", 
      "system.attributes.con.traumaSurvive", 
      "system.attributes.con.test", 
      "system.attributes.con.feat", 
      "system.attributes.int.languages", 
      "system.attributes.int.bonusSpells.lvl1", 
      "system.attributes.int.bonusSpells.lvl2", 
      "system.attributes.int.bonusSpells.lvl3", 
      "system.attributes.int.bonusSpells.lvl4", 
      "system.attributes.int.learnSpell", 
      "system.attributes.wis.willMod", 
      "system.attributes.wis.bonusSpells.lvl1", 
      "system.attributes.wis.bonusSpells.lvl2", 
      "system.attributes.wis.bonusSpells.lvl3", 
      "system.attributes.wis.bonusSpells.lvl4", 
      "system.attributes.wis.learnSpell", 
      "system.attributes.cha.reaction", 
      "system.attributes.cha.maxHenchmen", 
      "system.attributes.cha.turnUndead", 
    ];

    const changes = [];
    for ( const effect of actor.allApplicableEffects() ) {
      // Skip if disabled or not active
      if ( effect.disabled || !effect.active ) continue;

      // Validate effect condition is met before applying changes
      const conditionPasses = actor._effectApplies(effect);
      // Store temporary effect condition state in actor (used by actor-sheet)
      this._hyp3eEffectConditionState = this._hyp3eEffectConditionState || {};
      this._hyp3eEffectConditionState[effect.uuid] = conditionPasses ? "active" : "inactive";

      if (!conditionPasses) {
        Hyp3eLogger.info("Hyp3eCharacter _applyActiveEffectsToAttributes", `Skipping effect "${effect.name}" on ${this.parent.name} — condition not met:`, effect.flags.hyp3e?.condition);
        continue;
      }

      // Only include changes to allowed keys
      const filtered = effect.changes
        .filter(change => allowedKeys.includes(change.key))
        .map(change => {
          const c = foundry.utils.deepClone(change);
          c.effect = effect;
          c.priority = c.priority ?? (c.mode * 10);
          return c;
        });
      changes.push(...filtered);
    }

    // Do we have any changes to apply?
    if ( changes.length > 0 ) {
      // Use a clone of the actor's system data to avoid mutating it directly
      const systemData = foundry.utils.deepClone(this);
  
      // Organize effects by their priority (though it probably doesn't matter)
      changes.sort((a, b) => a.priority - b.priority);

      // Update attributeData object with ActiveEffect changes
      for (const change of changes) {
        // Parse the change.value string and resolve it into a number if possible
        let resolvedChange = null;
        if (isPureNumber(change.value)) {
          resolvedChange = Number(change.value) || 0;
        } else if (isPureString(change.value)) {
          resolvedChange = change.value;
        } else if (containsDice(change.value)) {
          // Dice rolls require async processing, which we can't do during _prepareData
          Hyp3eLogger.info("Hyp3eCharacter _applyActiveEffectsToAttributes", `Change "${change.value}" contains a dice roll formula, which is not allowed for attribute modifiers. Skipping...`);
          continue;
        } else if (containsMathOrVariables(change.value)) {
          // No dice rolls, we can do it synchronously
          resolvedChange = Hyp3eDice.resolveFormulaWithMath(change.value, systemData);
        }

        Hyp3eLogger.info("Hyp3eCharacter _applyActiveEffectsToAttributes", `Applying ${change.effect.name} to ${this.parent.name}'s ${change.key}:`, { resolvedChange, change });

        let path = change.key; // e.g. "system.attributes.str.atkMod"
        path = path.replace(/^system\.attributes\./, "");
        let attrModValue = foundry.utils.getProperty(attributeData, path);
        // Convert strings to numbers if necessary, but leave booleans alone
        if (isPureNumber(attrModValue)) attrModValue = Number(attrModValue);
        // Apply change based on mode
        switch (change.mode) {
          case CONST.ACTIVE_EFFECT_MODES.ADD: attrModValue += resolvedChange; break;
          case CONST.ACTIVE_EFFECT_MODES.MULTIPLY: attrModValue *= resolvedChange; break;
          case CONST.ACTIVE_EFFECT_MODES.OVERRIDE: attrModValue = resolvedChange; break;
          // Pretty sure we don't need the other effect modes
        }
        foundry.utils.setProperty(attributeData, path, attrModValue);
      }
    }

    Hyp3eLogger.info("Hyp3eCharacter _applyActiveEffectsToAttributes", `Updated attribute data with active effects for ${this.parent.name}:`, attributeData);
    return attributeData;
  }

  /**
   * Calculate the total weight carried by the character. Only used with characters.
   * @returns {number} Total weight carried, rounded to one decimal place
   */
  _calcWeightCarried() {
    const enableCoinWeight = this.getSetting("enableCoinWeight");
    if (!this.parent?.items && !enableCoinWeight) return 0;

    let carriedWt = this.parent.items.reduce((total, item) => {
      // Start with carried/equipped items. We ignore weight of non-equipped 
      //  items since they are assumed to have been removed or dropped.
      // For weapons & armor, the equipped status is ignored and the item weight 
      //  is always added to encumbrance.
      const normalGear = ['item', 'container']; // 'container' has been deprecated but may still exist
      const combatGear = ['weapon', 'armor', 'shield'];
      let weight = 0;
      if (item.system.weight > 0 && item.system.quantity.value > 0) {
        // Is this a normal item, and is it carried?
        if (normalGear.includes(item.type) && item.system.equipped) {
          if (item.system.quantity.bundle && item.system.quantity.bundle > 1) {
            // For bundled items, we calculate weight based on number of bundles
            weight = (item.system.weight * (item.system.quantity.value / item.system.quantity.bundle))
          } else {
            // Normal unbundled item
            weight = (item.system.weight * item.system.quantity.value)
          }
        } else if (combatGear.includes(item.type)) {
          if (item.system.quantity.bundle && item.system.quantity.bundle > 1) {
            // For bundled items, we calculate weight based on number of bundles
            weight = (item.system.weight * (item.system.quantity.value / item.system.quantity.bundle))
          } else {
            weight = (item.system.weight * item.system.quantity.value)
          }
        }
      }
      return total + weight;
    }, 0);

    // If enabled, add coin weight (100 coins = 1 lb)
    if (enableCoinWeight) {
      for (const [coinType, coinData] of Object.entries(this.money)) {
        if (coinData.value) {
          let val = convertToInt(coinData.value);
          if (!isNaN(val) && val > 0) {
            carriedWt += val / 100;
          }
        }
      }
    }

    // Round to one decimal place
    carriedWt = Math.round(carriedWt * 10)/10;

    // Log the calculated weight
    Hyp3eLogger.info("Hyp3eCharacter _calcWeightCarried", `${this.parent.name} is carrying ${carriedWt} pounds.`);

    // Return the final carried weight
    return carriedWt;
  }

  /**
   * Determine the charactor's encumbrance status based on weight carried and strength.
   * @returns {string} - "unencumbered", "encumbered", or "heavilyEncumbered"
   */
  _getEncumberedStatus() {
    const enableEncumbrance = this.getSetting("enableEncumbrance");
    const encumbered = this.getSetting("encumbered");
    const heavilyEncumbered = this.getSetting("heavilyEncumbered");
    // Calc constants for encumbrance thresholds
    const encumberedWt = this.attributes.str.curr * encumbered
    const heavilyEncumberedWt = this.attributes.str.curr * heavilyEncumbered
    if (enableEncumbrance) {
      if (this.weightCarried > heavilyEncumberedWt) {
        return "heavilyEncumbered";
      } else if (this.weightCarried > encumberedWt) {
        return "encumbered";
      } else {
        return "unencumbered";
      }
    }
    return "unencumbered";
  }

  /**
   * Gather equipped protection items (armor, shields).
   * @returns {Array} Array of equipped protection items
   */
  _getEquippedProtectionItems() {
    const items = [];
    for (const [type, collection] of Object.entries(this.parent.itemTypes)) {
      if (type === "armor" || type === "shield") {
        for (const obj of Object.values(collection)) {
          if (obj.system?.equipped) items.push(obj);
        }
      }
    }
    return items;
  }

  /**
   * Calculate the character's AC, DR, and MV based on equipped armor, shields, etc.
   * @returns {Object} Object containing key/value pairs for ac, dr, and mv
   */
  _getCharacterAcAndMv() {
    let ac = 9;
    let mv = 40;
    let dr = 0;
    let shieldMod = 0;

    const items = this._getEquippedProtectionItems();
    Hyp3eLogger.info("Hyp3eCharacter _getCharacterAcAndMv", `${this.parent.name} has equipped protection items:`, items);

    for (const item of items) {
      const sys = item.system ?? {};

      if (this._isHandShield(item)) {
        // Shield = stacking AC mod
        shieldMod += sys.ac || 0;
      } else if (this._isPassiveAc(item)) {
        // Passive protection items (rings, cloaks, etc) stack too
        shieldMod += sys.ac || 0;
      } else {
        // Armor (or passive AC) = pick the best
        //  It shouldn't even be possible to equip multiple armors, but just in case...
        if (sys.ac < ac) {
          ac = sys.ac;
          dr = sys.dr || dr;
        }
        // Movement
        if (sys.mv !== mv) {
          mv = sys.mv ?? mv;
        }
      }
    }

    // Encumbrance
    const enableEncumbrance = this.getSetting("enableEncumbrance");
    if (enableEncumbrance) {
      if (this.encumberedState === "encumbered") {
        ac += 1; mv -= 10;
      } else if (this.encumberedState === "heavilyEncumbered") {
        ac += 2; mv -= 20;
      }
    }

    // Dex and shields
    ac -= (this.attributes.dex.defMod || 0) + shieldMod;

    // Active effects can add their changes after this point...
    const allowedKeys = [
      "system.ac.value",
      "system.ac.dr",
      "system.movement.base.value"
    ];
    // Use these to update AC, DR, MV from effects
    let finalAc = ac;
    let finalDr = dr;
    let finalMv = mv;

    const changes = [];
    for ( const effect of this.parent.allApplicableEffects() ) {
      // Skip if disabled or not active
      if ( effect.disabled || !effect.active ) continue;

      // Validate effect condition is met before applying changes
      const conditionPasses = this.parent._effectApplies(effect);
      // Store temporary effect condition state in actor (used by actor-sheet)
      this._hyp3eEffectConditionState = this._hyp3eEffectConditionState || {};
      this._hyp3eEffectConditionState[effect.uuid] = conditionPasses ? "active" : "inactive";

      if (!conditionPasses) {
        Hyp3eLogger.info("Hyp3eCharacter _getCharacterAcAndMv", `Skipping effect "${effect.name}" on ${this.parent.name} — condition not met:`, effect.flags.hyp3e?.condition);
        continue;
      }

      // Only include changes to allowed keys
      const filtered = effect.changes
        .filter(change => allowedKeys.includes(change.key))
        .map(change => {
          const c = foundry.utils.deepClone(change);
          c.effect = effect;
          c.priority = c.priority ?? (c.mode * 10);
          return c;
        });
      changes.push(...filtered);
    }
    // Do we have any changes to apply?
    if ( changes.length > 0 ) {
      // Organize effects by their priority (though it probably doesn't matter)
      changes.sort((a, b) => a.priority - b.priority);

      // Use a clone of the actor's system data to avoid mutating it directly
      const systemData = foundry.utils.deepClone(this);
  
      // Accumulate ActiveEffect changes
      for (const change of changes) {
        // Parse the change.value string and resolve it into a number if possible
        let resolvedChange = 0;
        if (isPureNumber(change.value)) {
          resolvedChange = Number(change.value) || 0;
        } else if (containsDice(change.value)) {
          // Dice rolls require async processing, which we can't do during _prepareData
          Hyp3eLogger.warn("Hyp3eCharacter _getCharacterAcAndMv", `Change "${change.value}" contains a dice roll formula, which is not allowed for AC, DR, and MV effects. Skipping...`);
          continue;
        } else if (containsMathOrVariables(change.value)) {
          // No dice rolls, we can do it synchronously
          resolvedChange = Hyp3eDice.resolveFormulaWithMath(change.value, systemData);
        }
        switch (change.key) {
          case "system.ac.value":
            Hyp3eLogger.info("Hyp3eCharacter _getCharacterAcAndMv", `Applying ${change.effect.name} ${resolvedChange} to ${this.name}'s AC:`, change);
            // Apply change based on mode
            switch (change.mode) {
              case CONST.ACTIVE_EFFECT_MODES.ADD: finalAc += resolvedChange; break;
              case CONST.ACTIVE_EFFECT_MODES.MULTIPLY: finalAc *= resolvedChange; break;
              case CONST.ACTIVE_EFFECT_MODES.OVERRIDE: finalAc = resolvedChange; break;
              // Pretty sure we don't need the other effect modes
            }  
            break;
          case "system.ac.dr":
            Hyp3eLogger.info("Hyp3eCharacter _getCharacterAcAndMv", `Applying ${change.effect.name} ${resolvedChange} to ${this.name}'s DR:`, change);
            // Apply change based on mode
            switch (change.mode) {
              case CONST.ACTIVE_EFFECT_MODES.ADD: finalDr += resolvedChange; break;
              case CONST.ACTIVE_EFFECT_MODES.MULTIPLY: finalDr *= resolvedChange; break;
              case CONST.ACTIVE_EFFECT_MODES.OVERRIDE: finalDr = resolvedChange; break;
              // Pretty sure we don't need the other effect modes
            }
            break;
          case "system.movement.base.value":
            Hyp3eLogger.info("Hyp3eCharacter _getCharacterAcAndMv", `Applying ${change.effect.name} ${resolvedChange} to ${this.name}'s MV:`, change);
            // Apply change based on mode
            switch (change.mode) {
              case CONST.ACTIVE_EFFECT_MODES.ADD: finalMv += resolvedChange; break;
              case CONST.ACTIVE_EFFECT_MODES.MULTIPLY: finalMv *= resolvedChange; break;
              case CONST.ACTIVE_EFFECT_MODES.OVERRIDE: finalMv = resolvedChange; break;
              // Pretty sure we don't need the other effect modes
            }  
            break;
          default:
            break;
        }
      }
    }
    // Hyp3eLogger.info("Hyp3eCharacter _getCharacterAcAndMv", `Final calculated AC, DR, MV for ${this.name}:`, { ac: finalAc, dr: finalDr, mv: finalMv });
    // Return the final results
    return {
      ac: Math.clamp(finalAc, -9, 9),
      dr: finalDr,
      mv: finalMv
    };
  }

  /**
   * Return true if the item should be treated as a hand-using shield.
   */
  _isHandShield(item) {
    return (
      (item.type === "shield" && item.system.type !== "passive") ||
      (item.type === "armor" && item.system.type === "shield")
    );
  }

  /**
   * Return true if the item is a passive AC item (ring, cloak, etc).
   */
  _isPassiveAc(item) {
    return (item.type === "shield" && item.system.type === "passive");
  }
}