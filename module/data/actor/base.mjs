// module/data/actor/base.mjs
import { Hyp3eDataModel } from "../_utils.mjs";   // see utils below

export default class Hyp3eActorBase extends Hyp3eDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      hd: new fields.StringField({ required: true, blank: true, initial: "" }),
      
      hp: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        min:   new fields.NumberField({ required: true, integer: true, initial: 0 }),
        max:   new fields.NumberField({ required: true, integer: true, initial: 0 }),
        tempHp: new fields.NumberField({ required: true, integer: true, initial: 0 })
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
      tempModifiers: new fields.ArrayField(new fields.ObjectField(), { initial: [] })
    };
  }

  /** 
   * Runs BEFORE Active Effects are applied.
   * Used for calculating base "curr" values that AEs can then modify.
   */
  prepareBaseData() {
    super.prepareBaseData?.();

    const attributes = this.attributes;   // 'this' here is the system data model

    // Example: add .curr to each attribute (adjust the formula to match your old prepareCharacterData logic)
    for (const [k, attr] of Object.entries(attributes)) {
      // If no effect touched curr, derive it from base value
      attr.curr = attr.value;
    }

    // Base/current FA, CA, TA
    this.fa = this?.fightingAbility.value ? this.fightingAbility.value : (this.fa ?? 0);
    this.ca = (this?.castingAbility.value || this?.castingAbility.value === null) ? this.castingAbility.value : (this.ca ?? null);
    this.ta = (this?.turningAbility.value || this?.turningAbility.value === null) ? this.turningAbility.value : (this.ta ?? null);

    // Base/current saving throws
    const saves = this.saves;
    for (const save of Object.values(saves)) {
      save.curr = save.value ?? 0;
    }
  }

  /** 
   * Runs AFTER Active Effects.
   * Use this for final totals, clamping, or anything that depends on post-AE values.
   */
  prepareDerivedData() {
    super.prepareDerivedData?.();

    // Example: clamp HP after any AE modifications to max
    // if (this.hp?.value != null && this.hp?.max != null) {
    //   this.hp.value = Math.min(this.hp.value, this.hp.max);
    // }

  }
}