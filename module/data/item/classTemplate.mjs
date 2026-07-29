// module/data/item/classTemplate.mjs
import Hyp3eItemBase from "./base.mjs";
import { Hyp3eLogger } from "../../helpers/logger.mjs";

export default class Hyp3eClassTemplate extends Hyp3eItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    let schema = super.defineSchema();

    // The class name is in the actual root name property of the item, so we don't 
    //  need to store it in the schema

    // Class template fields
    // schema.className = new fields.StringField({ initial: "" });
    schema.baseClass = new fields.StringField({ initial: "" });
    schema.hitDie = new fields.StringField({ initial: "" });
    schema.attrReqs = new fields.SchemaField({
      str: new fields.NumberField({ nullable: true, initial: null }),
      dex: new fields.NumberField({ nullable: true, initial: null }),
      con: new fields.NumberField({ nullable: true, initial: null }),
      int: new fields.NumberField({ nullable: true, initial: null }),
      wis: new fields.NumberField({ nullable: true, initial: null }),
      cha: new fields.NumberField({ nullable: true, initial: null })
    });
    schema.xpBonusReq = new fields.SchemaField({
      str: new fields.NumberField({ nullable: true, initial: null }),
      dex: new fields.NumberField({ nullable: true, initial: null }),
      con: new fields.NumberField({ nullable: true, initial: null }),
      int: new fields.NumberField({ nullable: true, initial: null }),
      wis: new fields.NumberField({ nullable: true, initial: null }),
      cha: new fields.NumberField({ nullable: true, initial: null })
    });
    schema.featBonus = new fields.SchemaField({
      str: new fields.NumberField({ nullable: true, initial: null }),
      dex: new fields.NumberField({ nullable: true, initial: null }),
      con: new fields.NumberField({ nullable: true, initial: null }),
    });

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
      favoredWeapons: new fields.ArrayField(new fields.StringField({ initial: "" }), { initial: [] }),
      exceptions: new fields.ArrayField(new fields.StringField({ initial: "" }), { initial: [] }),
    });

    schema.spellcaster = new fields.BooleanField({ initial: true });
    schema.spellLists = new fields.ArrayField(new fields.StringField({ initial: "" }), { initial: [] });

    schema.levelAdvancement = new fields.SchemaField({
      1: new fields.SchemaField({
        xp: new fields.NumberField({ nullable: false, initial: 0 }), 
        hpRoll: new fields.StringField({ initial: "" }),
        fa: new fields.NumberField({ nullable: false, initial: 0 }),
        ca: new fields.NumberField({ nullable: true, initial: null }),
        ta: new fields.NumberField({ nullable: true, initial: null }),
      }),
      2: new fields.SchemaField({
        xp: new fields.NumberField({ nullable: false, initial: 0 }), 
        hpRoll: new fields.StringField({ initial: "" }),
        fa: new fields.NumberField({ nullable: false, initial: 0 }),
        ca: new fields.NumberField({ nullable: true, initial: null }),
        ta: new fields.NumberField({ nullable: true, initial: null }),
      }),
      3: new fields.SchemaField({
        xp: new fields.NumberField({ nullable: false, initial: 0 }), 
        hpRoll: new fields.StringField({ initial: "" }),
        fa: new fields.NumberField({ nullable: false, initial: 0 }),
        ca: new fields.NumberField({ nullable: true, initial: null }),
        ta: new fields.NumberField({ nullable: true, initial: null }),
      }),
      4: new fields.SchemaField({
        xp: new fields.NumberField({ nullable: false, initial: 0 }), 
        hpRoll: new fields.StringField({ initial: "" }),
        fa: new fields.NumberField({ nullable: false, initial: 0 }),
        ca: new fields.NumberField({ nullable: true, initial: null }),
        ta: new fields.NumberField({ nullable: true, initial: null }),
      }),
      5: new fields.SchemaField({
        xp: new fields.NumberField({ nullable: false, initial: 0 }), 
        hpRoll: new fields.StringField({ initial: "" }),
        fa: new fields.NumberField({ nullable: false, initial: 0 }),
        ca: new fields.NumberField({ nullable: true, initial: null }),
        ta: new fields.NumberField({ nullable: true, initial: null }),
      }),
      6: new fields.SchemaField({
        xp: new fields.NumberField({ nullable: false, initial: 0 }), 
        hpRoll: new fields.StringField({ initial: "" }),
        fa: new fields.NumberField({ nullable: false, initial: 0 }),
        ca: new fields.NumberField({ nullable: true, initial: null }),
        ta: new fields.NumberField({ nullable: true, initial: null }),
      }),
      7: new fields.SchemaField({
        xp: new fields.NumberField({ nullable: false, initial: 0 }), 
        hpRoll: new fields.StringField({ initial: "" }),
        fa: new fields.NumberField({ nullable: false, initial: 0 }),
        ca: new fields.NumberField({ nullable: true, initial: null }),
        ta: new fields.NumberField({ nullable: true, initial: null }),
      }),
      8: new fields.SchemaField({
        xp: new fields.NumberField({ nullable: false, initial: 0 }), 
        hpRoll: new fields.StringField({ initial: "" }),
        fa: new fields.NumberField({ nullable: false, initial: 0 }),
        ca: new fields.NumberField({ nullable: true, initial: null }),
        ta: new fields.NumberField({ nullable: true, initial: null }),
      }),
      9: new fields.SchemaField({
        xp: new fields.NumberField({ nullable: false, initial: 0 }), 
        hpRoll: new fields.StringField({ initial: "" }),
        fa: new fields.NumberField({ nullable: false, initial: 0 }),
        ca: new fields.NumberField({ nullable: true, initial: null }),
        ta: new fields.NumberField({ nullable: true, initial: null }),
      }),
      10: new fields.SchemaField({
        xp: new fields.NumberField({ nullable: false, initial: 0 }), 
        hpRoll: new fields.StringField({ initial: "" }),
        fa: new fields.NumberField({ nullable: false, initial: 0 }),
        ca: new fields.NumberField({ nullable: true, initial: null }),
        ta: new fields.NumberField({ nullable: true, initial: null }),
      }),
      11: new fields.SchemaField({
        xp: new fields.NumberField({ nullable: false, initial: 0 }), 
        hpRoll: new fields.StringField({ initial: "" }),
        fa: new fields.NumberField({ nullable: false, initial: 0 }),
        ca: new fields.NumberField({ nullable: true, initial: null }),
        ta: new fields.NumberField({ nullable: true, initial: null }),
      }),
      12: new fields.SchemaField({
        xp: new fields.NumberField({ nullable: false, initial: 0 }), 
        hpRoll: new fields.StringField({ initial: "" }),
        fa: new fields.NumberField({ nullable: false, initial: 0 }),
        ca: new fields.NumberField({ nullable: true, initial: null }),
        ta: new fields.NumberField({ nullable: true, initial: null }),
      }),
    });

    schema.abilities = new fields.ArrayField(new fields.SchemaField({ 
      name: new fields.StringField({ initial: "" }) 
    }), { initial: [] });

    schema.startingPack = new fields.SchemaField({
      gold: new fields.StringField({ initial: "1d4+1" }),
      armour: new fields.ArrayField(new fields.SchemaField({
        name: new fields.StringField({ initial: "" }),
        quantity: new fields.NumberField({ nullable: false, initial: 1 }),
      }), { initial: [] }),
      weapons: new fields.ArrayField(new fields.SchemaField({
        name: new fields.StringField({ initial: "" }),
        quantity: new fields.NumberField({ nullable: false, initial: 1 }),
      }), { initial: [] }),
      "equipment - general": new fields.ArrayField(new fields.SchemaField({
        name: new fields.StringField({ initial: "" }),
        quantity: new fields.NumberField({ nullable: false, initial: 1 }),
      }), { initial: [] }),
      "equipment - provisions": new fields.ArrayField(new fields.SchemaField({
        name: new fields.StringField({ initial: "" }),
        quantity: new fields.NumberField({ nullable: false, initial: 1 }),
      }), { initial: [] }),
      "equipment - religious": new fields.ArrayField(new fields.SchemaField({
        name: new fields.StringField({ initial: "" }),
        quantity: new fields.NumberField({ nullable: false, initial: 1 }),
      }), { initial: [] }),
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