// module/data/item/feature.mjs
import Hyp3eItemBase from "./base.mjs";
import { rollableTemplate } from "../templates/rollable.mjs";

export default class Hyp3eFeature extends Hyp3eItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    let schema = super.defineSchema();

    // Merge shared data templates
    schema = this.mergeSchema(schema, rollableTemplate);

    // Rollable template
    // schema.formula = new fields.StringField({ initial: "" });
    // schema.atkRoll = new fields.BooleanField({ initial: false });
    // schema.tn = new fields.StringField({ initial: "" });
    // schema.save = new fields.StringField({ initial: "" });
    // schema.damage = new fields.StringField({ initial: "" });
    // schema.damage2h = new fields.StringField({ initial: "" });
    // schema.dmgType = new fields.StringField({ initial: "basic" });
    // schema.altDmg = new fields.ObjectField({ initial: {} });
    // schema.duration = new fields.StringField({ initial: "" });
    // schema.affected = new fields.StringField({ initial: "" });

    // Feature-specific fields
    schema.class = new fields.StringField({ initial: "" });
    schema.level = new fields.StringField({ initial: "" });
    schema.rollMode = new fields.StringField({ initial: "publicroll" });

    return schema;
  }
}
