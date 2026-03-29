// module/data/item/spell.mjs
import Hyp3eItemBase from "./base.mjs";
import { rollableTemplate } from "../templates/rollable.mjs";

export default class Hyp3eSpell extends Hyp3eItemBase {
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
}