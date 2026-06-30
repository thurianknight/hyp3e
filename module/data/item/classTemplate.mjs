// module/data/item/classTemplate.mjs
import Hyp3eItemBase from "./base.mjs";
import { Hyp3eLogger } from "../../helpers/logger.mjs";

export default class Hyp3eClassTemplate extends Hyp3eItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    let schema = super.defineSchema();

    // Class template fields
    schema.class = new fields.StringField({ initial: "" });
    schema.baseClass = new fields.StringField({ initial: "" });
    schema.hitDie = new fields.StringField({ initial: "" });
    schema.attrReqs = new fields.SchemaField({});
    schema.xpBonusReq = new fields.SchemaField({});
    schema.featBonus = new fields.SchemaField({});
    schema.saves = new fields.SchemaField({
      base: new fields.NumberField({ nullable: true, initial: 16 }),
      death: new fields.NumberField({ nullable: true, initial: 16 }),
      device: new fields.NumberField({ nullable: true, initial: 16 }),
      transformation: new fields.NumberField({ nullable: true, initial: 16 }),
      avoidance: new fields.NumberField({ nullable: true, initial: 16 }),
      sorcery: new fields.NumberField({ nullable: true, initial: 16 }),
    });
    schema.unskilled = new fields.NumberField({ nullable: true, initial: 0 });
    schema.weaponProficiencies = new fields.SchemaField({
      favoredWeapons: new fields.ArrayField(new fields.SchemaField({}), { initial: [] }),
      exceptions: new fields.ArrayField(new fields.SchemaField({}), { initial: [] }),
    });
    schema.levelAdvancement = new fields.SchemaField({
      1: new fields.SchemaField({
        xp: new fields.NumberField({ nullable: false, initial: 0 }), 
        hpRoll: new fields.StringField({ initial: "" }),
        fa: new fields.NumberField({ nullable: true, initial: 0 }),
        ca: new fields.NumberField({ nullable: true, initial: null }),
        ta: new fields.NumberField({ nullable: true, initial: null }),
      }),
    });
    schema.abilities = new fields.ArrayField(new fields.StringField(), { initial: [] });
    schema.startingPack = new fields.SchemaField({
      gold: new fields.StringField({ initial: "1d4+1" }),
      armour: new fields.ArrayField(new fields.SchemaField({}), { initial: [] }),
      weapons: new fields.ArrayField(new fields.SchemaField({}), { initial: [] }),
      "equipment - general": new fields.ArrayField(new fields.SchemaField({}), { initial: [] }),
      "equipment - provisions": new fields.ArrayField(new fields.SchemaField({}), { initial: [] }),
      "equipment - religious": new fields.ArrayField(new fields.SchemaField({}), { initial: [] }),
    });

    return schema;
  }

  /** 
   * Cleanup any missing or invalid data, and set up any derived values that AEs might modify.
   */
  prepareBaseData() {
    super.prepareBaseData?.();

    // Skip processing if this item is in a compendium
    if (this.parent.pack) return;

  }
}