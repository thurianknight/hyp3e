// module/data/item/weapon.mjs
import Hyp3eItemBase from "./base.mjs";

export default class Hyp3eWeapon extends Hyp3eItemBase {
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

    // Rollable template
    schema.formula = new fields.StringField({ initial: "" });
    schema.atkRoll = new fields.BooleanField({ initial: false });
    schema.tn = new fields.StringField({ initial: "" });
    schema.save = new fields.StringField({ initial: "" });
    schema.damage = new fields.StringField({ initial: "" });
    schema.damage2h = new fields.StringField({ initial: "" });
    schema.dmgType = new fields.StringField({ initial: "basic" });
    schema.altDmg = new fields.ObjectField({ initial: {} });
    schema.duration = new fields.StringField({ initial: "" });
    schema.affected = new fields.StringField({ initial: "" });

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

    // Weapon template
    schema.type = new fields.StringField({ initial: "melee" });
    schema.melee = new fields.BooleanField({ initial: true });
    schema.missile = new fields.BooleanField({ initial: false });
    schema.baseWeapon = new fields.StringField({ initial: "" });
    schema.wc = new fields.NumberField({ initial: 0 });
    schema.hands = new fields.NumberField({ initial: 1 });
    schema.range = new fields.SchemaField({ 
      short: new fields.NumberField({ initial: 0 }),
      medium: new fields.NumberField({ initial: 0 }),
      long: new fields.NumberField({ initial: 0 })
    });
    schema.rof = new fields.StringField({ initial: "1/1" });
    schema.atkMod = new fields.NumberField({ initial: 0 });
    schema.dmgMod = new fields.NumberField({ initial: 0 });
    schema.wpnMaster = new fields.BooleanField({ initial: false });
    schema.wpnGrandmaster = new fields.BooleanField({ initial: false });
    schema.isGrenade = new fields.BooleanField({ initial: false });
    schema.isAreaEffect = new fields.BooleanField({ initial: false });
    schema.usesAmmo = new fields.BooleanField({ initial: false });
    schema.annotations = new fields.ArrayField(new fields.StringField(), { initial: [] });

    return schema;
  }
}