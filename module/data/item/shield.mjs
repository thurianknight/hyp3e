// module/data/item/shield.mjs
import Hyp3eItemBase from "./base.mjs";

export default class Hyp3eShield extends Hyp3eItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    // Physical template
    schema.quantity = new fields.SchemaField({
      value: new fields.NumberField({ initial: 1 }),
      max: new fields.NumberField({ initial: 1 }),
      bundle: new fields.NumberField({ initial: 1 })
    });
    schema.isConsumable = new fields.BooleanField({ initial: false });
    schema.isLightSource = new fields.BooleanField({ initial: false });
    schema.light = new fields.ObjectField({ initial: {} });
    schema.location = new fields.StringField({ initial: "" });
    schema.weight = new fields.NumberField({ initial: 0 });
    schema.cost = new fields.StringField({ initial: "0" });
    schema.xp = new fields.StringField({ initial: "" });
    schema.containerId = new fields.StringField({ initial: "" });

    // Equippable template
    schema.equipped = new fields.BooleanField({ initial: false });

    // canHaveSpells template
    schema.spellcasting = new fields.SchemaField({ 
      hasSpells: new fields.BooleanField({ initial: false }),
      hideCharges: new fields.BooleanField({ initial: false }),
      ca: new fields.NumberField({ nullable: true, initial: null }),
      charges: new fields.SchemaField({
        value: new fields.NumberField({ nullable: true, initial: null }),
        max: new fields.NumberField({ nullable: true, initial: null })
      }),
      spellRefs: new fields.ArrayField(new fields.StringField(), { initial: [] })
    });

    // Shield template
    schema.type = new fields.StringField({ initial: "small" });
    schema.ac = new fields.NumberField({ initial: 1 });
    schema.dr = new fields.NumberField({ nullable: true, initial: null });

    return schema;
  }
}