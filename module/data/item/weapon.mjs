// module/data/item/weapon.mjs
import Hyp3eItemBase from "./base.mjs";
import { physicalTemplate } from "../templates/physical.mjs";
import { equippableTemplate } from "../templates/equippable.mjs";
import { rollableTemplate } from "../templates/rollable.mjs";
import { canHaveSpellsTemplate } from "../templates/canHaveSpells.mjs";
import { Hyp3eLogger } from "../../helpers/logger.mjs";

export default class Hyp3eWeapon extends Hyp3eItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    let schema = super.defineSchema();

    // Merge shared data templates
    schema = this.mergeSchema(schema, physicalTemplate);
    schema = this.mergeSchema(schema, equippableTemplate);
    schema = this.mergeSchema(schema, rollableTemplate);
    schema = this.mergeSchema(schema, canHaveSpellsTemplate);

    // Weapon-specific fields
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

  /** 
   * Cleanup any missing or invalid data, and set up any derived values that AEs might modify.
   */
  prepareData() {
    super.prepareData?.();

    // Skip processing if this item is in a compendium
    if (this.pack) return;

    // Fix missing or invalid damage type
    if (!this.dmgType || this.dmgType.trim() === "") {
      Hyp3eLogger.warn("Hyp3eWeapon prepareData", `No damage type set on ${this.parent.name}. Setting to Basic...`)
      this.dmgType = "basic"
    }

    // Apply attack formula logic if needed
    if (this.formula.trim() == "") {
      this.parent.applyAttackFormula();
    }

    // Ammo usage flag
    if (this.type === "missile" && (typeof this.usesAmmo === "undefined")) {
      if (/(bow|sling|gun)/i.test(this.parent.name)) {
        this.usesAmmo = true;
      }
    }

  }
}