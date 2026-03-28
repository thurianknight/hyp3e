// module/data/actor/character.mjs
import Hyp3eActorBase from "./base.mjs";

export default class Hyp3eCharacter extends Hyp3eActorBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    // Spellcaster template
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

    // Character template
    schema.attributes = new fields.SchemaField({
      str: new fields.SchemaField({
        value: new fields.NumberField({ integer: true, initial: 10 }),
        atkMod: new fields.NumberField({ integer: true, initial: 0 }),
        dmgMod: new fields.NumberField({ integer: true, initial: 0 }),
        test: new fields.NumberField({ integer: true, initial: 0 }),
        feat: new fields.NumberField({ integer: true, initial: 0 })
      }),
      dex: new fields.SchemaField({
        value: new fields.NumberField({ integer: true, initial: 10 }),
        atkMod: new fields.NumberField({ integer: true, initial: 0 }),
        defMod: new fields.NumberField({ integer: true, initial: 0 }),
        test: new fields.NumberField({ integer: true, initial: 0 }),
        feat: new fields.NumberField({ integer: true, initial: 0 })
      }),
      con: new fields.SchemaField({
        value: new fields.NumberField({ integer: true, initial: 10 }),
        hpMod: new fields.NumberField({ integer: true, initial: 0 }),
        poisRadMod: new fields.NumberField({ integer: true, initial: 0 }),
        traumaSurvive: new fields.NumberField({ integer: true, initial: 0 }),
        test: new fields.NumberField({ integer: true, initial: 0 }),
        feat: new fields.NumberField({ integer: true, initial: 0 })
      }),
      int: new fields.SchemaField({
        value: new fields.NumberField({ integer: true, initial: 10 }),
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
        reaction: new fields.NumberField({ integer: true, initial: 0 }),
        maxHenchmen: new fields.NumberField({ integer: true, initial: 0 }),
        turnUndead: new fields.NumberField({ integer: true, initial: 0 })
      })
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

    schema.money = new fields.SchemaField({
      cp: new fields.SchemaField({ value: new fields.StringField({ initial: "0" }) }),
      sp: new fields.SchemaField({ value: new fields.StringField({ initial: "0" }) }),
      ep: new fields.SchemaField({ value: new fields.StringField({ initial: "0" }) }),
      gp: new fields.SchemaField({ value: new fields.StringField({ initial: "0" }) }),
      pp: new fields.SchemaField({ value: new fields.StringField({ initial: "0" }) })
    });

    schema.treasure = new fields.StringField({ blank: true });

    return schema;
  }
}