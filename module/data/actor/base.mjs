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

      tempAtkMod: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      tempDmgMod: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      tempInitiativeMod: new fields.NumberField({ required: true, integer: true, initial: 0 }),

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
          value: new fields.NumberField({ integer: true, initial:0 }), 
          curr: new fields.NumberField({ integer: true, initial: 0 })
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

      movement: new fields.SchemaField({
        base:        new fields.SchemaField({ value: new fields.NumberField({ integer: true, initial:40 }) }),
        exploration: new fields.SchemaField({ value: new fields.NumberField({ integer: true, initial:120 }) }),
        travel:      new fields.SchemaField({ value: new fields.NumberField({ integer: true, initial:24 }) }),
        tempMvMod:   new fields.NumberField({ required: true, integer: true, initial: 0 })
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

      baseClass: new fields.StringField({ required: true, blank: true, initial: "" })
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
}