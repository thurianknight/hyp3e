// module/data/item/spell.mjs
import Hyp3eItemBase from "./base.mjs";
import { rollableTemplate } from "../templates/rollable.mjs";
import { Hyp3eLogger } from "../../helpers/logger.mjs";

export default class Hyp3eSpell extends Hyp3eItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    let schema = super.defineSchema();

    // Merge shared data templates
    schema = this.mergeSchema(schema, rollableTemplate);

    // Spell-specific fields
    // schema.memorized = new fields.NumberField({ initial: 0 });
    schema.quantity = new fields.SchemaField({
      value: new fields.NumberField({ initial: 0 }),
      max: new fields.NumberField({ initial: 9 })
    });
    schema.spellLevel = new fields.NumberField({ initial: 1 });
    schema.range = new fields.StringField({ initial: "" });
    schema.classList = new fields.StringField({ initial: "" });
    schema.isConsumable = new fields.BooleanField({ initial: true });

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