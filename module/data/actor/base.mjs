// module/data/actor/base.mjs
import { SystemDataModel } from "../_utils.mjs";   // see utils below

export default class Hyp3eActorBase extends SystemDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      hd: new fields.StringField({ required: true, blank: true, initial: "" }),
      
      hp: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        min:   new fields.NumberField({ required: true, integer: true, initial: -10 }),
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
        base:         new fields.SchemaField({ value: new fields.NumberField({initial:0}) }),
        death:        new fields.SchemaField({ value: new fields.NumberField({initial:0}) }),
        device:       new fields.SchemaField({ value: new fields.NumberField({initial:0}) }),
        transformation: new fields.SchemaField({ value: new fields.NumberField({initial:0}) }),
        avoidance:    new fields.SchemaField({ value: new fields.NumberField({initial:0}) }),
        sorcery:      new fields.SchemaField({ value: new fields.NumberField({initial:0}) })
      }),

      movement: new fields.SchemaField({
        base:        new fields.SchemaField({ value: new fields.NumberField({initial:40}) }),
        exploration: new fields.SchemaField({ value: new fields.NumberField({initial:120}) }),
        travel:      new fields.SchemaField({ value: new fields.NumberField({initial:24}) }),
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
}