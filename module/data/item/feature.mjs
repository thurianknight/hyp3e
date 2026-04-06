// module/data/item/feature.mjs
import Hyp3eItemBase from "./base.mjs";
import { rollableTemplate } from "../templates/rollable.mjs";

export default class Hyp3eFeature extends Hyp3eItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    let schema = super.defineSchema();

    // Merge shared data templates
    schema = this.mergeSchema(schema, rollableTemplate);

    // Feature-specific fields
    schema.class = new fields.StringField({ initial: "" });
    schema.level = new fields.StringField({ initial: "" });
    schema.rollMode = new fields.StringField({ initial: "publicroll" });

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