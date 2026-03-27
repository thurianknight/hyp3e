// module/data/item/armor.mjs
import Hyp3eItemBase from "./base.mjs";

export default class Hyp3eArmor extends Hyp3eItemBase {
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
    schema.isLightSource = new fields.BooleanField({ initial: null });
    schema.light = new fields.ObjectField({ initial: {} });
    schema.location = new fields.StringField({ initial: "" });
    schema.weight = new fields.NumberField({ initial: 0 });
    schema.cost = new fields.NumberField({ initial: 0 });
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
      spellRefs: new fields.ArrayField({ initial: [] })
    });

    // Armor template
    schema.type = new fields.StringField({ initial: "unarmored" });
    schema.ac = new fields.NumberField({ initial: 9 });
    schema.dr = new fields.NumberField({ initial: 0 });
    schema.mv = new fields.NumberField({ initial: 40 });
    schema.resistances = new fields.ObjectField({ initial: {} });

    return schema;
  }
}