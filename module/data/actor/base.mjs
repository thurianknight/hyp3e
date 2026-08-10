// module/data/actor/base.mjs
import { Hyp3eDataModel } from "../_utils.mjs";   // see utils below
import { isPureNumber, isPureString, convertToInt } from "../../dice/dice.mjs";
import { Hyp3eLogger } from "../../helpers/logger.mjs";

export default class Hyp3eActorBase extends Hyp3eDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      hd: new fields.StringField({ required: true, blank: true, initial: "" }),

      hp: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        min:   new fields.NumberField({ required: true, integer: true, initial: 0 }),
        max:   new fields.NumberField({ required: true, integer: true, initial: 0 }),
        tempHp: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        percentage: new fields.NumberField({ required: true, initial: 100 })
      }),

      ac: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, initial: 9 }),
        dr:    new fields.NumberField({ required: true, integer: true, initial: 0 }),
        tempAcMod: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        tempDrMod: new fields.NumberField({ required: true, integer: true, initial: 0 })
      }),

      atkRate: new fields.StringField({ required: true, blank: true, initial: "1/1" }),
      fa: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      fightingAbility: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, initial: 0 })
      }),

      tempAtkMod: new fields.NumberField({ nullable: true, required: true, integer: true, initial: 0 }),
      tempDmgMod: new fields.NumberField({ nullable: true, required: true, integer: true, initial: 0 }),
      tempInitiativeMod: new fields.NumberField({ nullable: true, required: true, integer: true, initial: 0 }),

      ca: new fields.NumberField({ nullable: true, initial: null }),
      castingAbility: new fields.SchemaField({
        value: new fields.NumberField({ nullable: true, initial: null })
      }),

      ta: new fields.NumberField({ nullable: true, initial: null }),
      turningAbility: new fields.SchemaField({
        value: new fields.NumberField({ nullable: true, initial: null })
      }),

      saves: new fields.SchemaField({
        base:         new fields.SchemaField({ 
          value: new fields.NumberField({ nullable: true, integer: true, initial:0 }), 
          curr: new fields.NumberField({ nullable: true, integer: true, initial: 0 })
        }),
        death:        new fields.SchemaField({ 
          value: new fields.NumberField({ integer: true, initial:0 }), 
          curr: new fields.NumberField({ integer: true, initial: 0 })
        }),
        device:       new fields.SchemaField({ 
          value: new fields.NumberField({ integer: true, initial:0 }), 
          curr: new fields.NumberField({ integer: true, initial: 0 })
        }),
        transformation: new fields.SchemaField({ 
          value: new fields.NumberField({ integer: true, initial:0 }), 
          curr: new fields.NumberField({ integer: true, initial: 0 })
        }),
        avoidance:    new fields.SchemaField({ 
          value: new fields.NumberField({ integer: true, initial:0 }), 
          curr: new fields.NumberField({ integer: true, initial: 0 })
        }),
        sorcery:      new fields.SchemaField({ 
          value: new fields.NumberField({ integer: true, initial:0 }), 
          curr: new fields.NumberField({ integer: true, initial: 0 })
        })
      }),
      resistancesVulnerabilities: new fields.StringField({ required: true, blank: true, initial: "" }),

      movement: new fields.SchemaField({
        base:        new fields.SchemaField({ value: new fields.NumberField({ integer: true, initial:40 }) }),
        exploration: new fields.SchemaField({ value: new fields.NumberField({ integer: true, initial:120 }) }),
        travel:      new fields.SchemaField({ value: new fields.NumberField({ integer: true, initial:24 }) }),
        tempMvMod:   new fields.NumberField({ nullable: true, required: true, integer: true, initial: 0 })
      }),

      otherMv: new fields.SchemaField({
        value: new fields.StringField({ required: true, blank: true, initial: "" })
      }),

      alignment: new fields.StringField({ required: true, blank: true, initial: "" }),
      biography: new fields.StringField({ required: true, blank: true, initial: "" }),
      knownLanguages: new fields.StringField({ required: true, blank: true, initial: "" }),
      identified: new fields.BooleanField({ initial: true }),
      tokenAlias: new fields.StringField({ required: true, blank: true, initial: "" }),

      resistances: new fields.ObjectField({ initial: {} }),           // flexible object
      tempModifiers: new fields.ArrayField(new fields.ObjectField(), { initial: [] }),

      baseClass: new fields.StringField({ required: true, blank: true, initial: "" }),
      combatOptions: new fields.ArrayField(new fields.StringField(), { initial: [] }),   // array of combat option IDs
      _hyp3eEffectConditionState: new fields.ObjectField({ initial: {} })   // { [effectUuid]: "active" | "inactive" }
    };
  }

  /** 
   * Runs BEFORE Active Effects are applied.
   * Used for calculating base "curr" values that AEs can then modify.
   */
  prepareBaseData() {
    super.prepareBaseData?.();

    if (this.attributes) {
      const attributes = this.attributes;   // 'this' here is the system data model
      // Add .curr to each attribute
      for (const [k, attr] of Object.entries(attributes)) {
        // If no effect touched curr, derive it from base value
        attr.curr = attr.value;
      }  
    }

    // Fix temporary modifier properties that might be undefined, null, or non-numeric.
    //  ActiveEffects will be applied later.
    this.hp.tempHp = convertToInt(this.hp?.tempHp);
    this.ac.tempAcMod = convertToInt(this.ac?.tempAcMod);
    this.ac.tempDrMod = convertToInt(this.ac?.tempDrMod);
    this.movement.tempMvMod = convertToInt(this.movement?.tempMvMod);
    this.tempAtkMod = convertToInt(this?.tempAtkMod);
    this.tempDmgMod = convertToInt(this?.tempDmgMod);

    // Reset base/current FA, CA, TA
    this.fa = this?.fightingAbility.value ? this.fightingAbility.value : (this.fa ?? 0);
    this.ca = (this?.castingAbility.value || this?.castingAbility.value === null) ? this.castingAbility.value : (this.ca ?? null);
    this.ta = (this?.turningAbility.value || this?.turningAbility.value === null) ? this.turningAbility.value : (this.ta ?? null);

    // Reset base/current saving throws
    const saves = this.saves;
    for (const save of Object.values(saves)) {
      save.curr = save.value ?? 0;
    }

    Hyp3eLogger.info("Hyp3eActorBase prepareBaseData", `Base data prepared for actor ${this.parent.name}:`, this);
  }

  /** 
   * Runs AFTER Active Effects.
   * Use this for final totals, clamping, or anything that depends on post-AE values.
   */
  prepareDerivedData() {
    super.prepareDerivedData?.();

    // Clamp HP percentage values
    this.hp.percentage = Math.clamp((this.hp.value * 100) / this.hp.max, 0, 100);

    Hyp3eLogger.info("Hyp3eActorBase prepareDerivedData", `Derived data prepared for actor ${this.parent.name}:`, this);
  }

  /**
   * Apply temporary AC, DR, and MV modifiers to the actor's system data.
   * Centralized helper used by both character and NPC preparation functions.
   */
  _applyTempModifiers() {
    const tempAcMod = parseInt(this.ac?.tempAcMod) || 0;
    const tempDrMod = parseInt(this.ac?.tempDrMod) || 0;
    const tempMvMod = parseInt(this.movement?.tempMvMod) || 0;

    if (tempAcMod) {
      Hyp3eLogger.info("Hyp3eActorBase _applyTempModifiers", `Applying temp AC mod: ${tempAcMod}`);
      this.ac.value = Math.clamp(this.ac.value - tempAcMod, -9, 9);
    }

    if (tempDrMod) {
      Hyp3eLogger.info("Hyp3eActorBase _applyTempModifiers", `Applying temp DR mod: ${tempDrMod}`);
      this.ac.dr += tempDrMod;
    }

    if (tempMvMod) {
      Hyp3eLogger.info("Hyp3eActorBase _applyTempModifiers", `Applying temp MV mod: ${tempMvMod}`);
      this.movement.base.value += tempMvMod;
    }
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
    if (enableCoinWeight && this?.money) {
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
    const strength = this?.attributes?.str?.curr ?? 10;
    // Calc constants for encumbrance thresholds
    const encumberedWt = strength * encumbered
    const heavilyEncumberedWt = strength * heavilyEncumbered
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
}