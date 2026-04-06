// module/data/item/item.mjs
import Hyp3eItemBase from "./base.mjs";
import { physicalTemplate } from "../templates/physical.mjs";
import { equippableTemplate } from "../templates/equippable.mjs";
import { rollableTemplate } from "../templates/rollable.mjs";
import { canHaveSpellsTemplate } from "../templates/canHaveSpells.mjs";

export default class Hyp3eItem extends Hyp3eItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    let schema = super.defineSchema();
    
    // Merge shared data templates
    schema = this.mergeSchema(schema, physicalTemplate);
    schema = this.mergeSchema(schema, equippableTemplate);
    schema = this.mergeSchema(schema, rollableTemplate);
    schema = this.mergeSchema(schema, canHaveSpellsTemplate);

    // Item-specific fields
    schema.isContainer = new fields.BooleanField({ initial: false });
    schema.itemIds = new fields.ArrayField(new fields.StringField(), { initial: [] });
    schema.isAmmunition = new fields.BooleanField({ initial: false });

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