// module/data/item/effectTemplate.mjs
import Hyp3eItemBase from "./base.mjs";

export default class Hyp3eEffectTemplate extends Hyp3eItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    // Effect template
    /** Nothing to do here! An Effect Template only extends Item Base */

    return schema;
  }
}