// module/data/item/armor.mjs
import Hyp3eItemBase from "./base.mjs";
import { physicalTemplate } from "../templates/physical.mjs";
import { equippableTemplate } from "../templates/equippable.mjs";
import { canHaveSpellsTemplate } from "../templates/canHaveSpells.mjs";

export default class Hyp3eArmor extends Hyp3eItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    let schema = super.defineSchema();

    // Merge shared data templates
    schema = this.mergeSchema(schema, physicalTemplate);
    schema = this.mergeSchema(schema, equippableTemplate);
    schema = this.mergeSchema(schema, canHaveSpellsTemplate);

    // Armor-specific fields
    schema.type = new fields.StringField({ initial: "unarmored" });
    schema.ac = new fields.NumberField({ initial: 9 });
    schema.dr = new fields.NumberField({ initial: 0 });
    schema.mv = new fields.NumberField({ initial: 40 });
    schema.resistances = new fields.ObjectField({ initial: {} });

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