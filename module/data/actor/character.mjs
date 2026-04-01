// module/data/actor/character.mjs
import Hyp3eActorBase from "./base.mjs";
import { moneyTemplate } from "../templates/money.mjs";
import { Hyp3eLogger } from "../../helpers/logger.mjs";

export default class Hyp3eCharacter extends Hyp3eActorBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    let schema = super.defineSchema();

    // Character fields
    schema.attributes = new fields.SchemaField({
      str: new fields.SchemaField({
        value: new fields.NumberField({ integer: true, initial: 10 }),
        curr: new fields.NumberField({ integer: true, initial: 10 }),
        atkMod: new fields.NumberField({ integer: true, initial: 0 }),
        dmgMod: new fields.NumberField({ integer: true, initial: 0 }),
        test: new fields.NumberField({ integer: true, initial: 0 }),
        feat: new fields.NumberField({ integer: true, initial: 0 })
      }),
      dex: new fields.SchemaField({
        value: new fields.NumberField({ integer: true, initial: 10 }),
        curr: new fields.NumberField({ integer: true, initial: 10 }),
        atkMod: new fields.NumberField({ integer: true, initial: 0 }),
        defMod: new fields.NumberField({ integer: true, initial: 0 }),
        test: new fields.NumberField({ integer: true, initial: 0 }),
        feat: new fields.NumberField({ integer: true, initial: 0 })
      }),
      con: new fields.SchemaField({
        value: new fields.NumberField({ integer: true, initial: 10 }),
        curr: new fields.NumberField({ integer: true, initial: 10 }),
        hpMod: new fields.NumberField({ integer: true, initial: 0 }),
        poisRadMod: new fields.NumberField({ integer: true, initial: 0 }),
        traumaSurvive: new fields.NumberField({ integer: true, initial: 0 }),
        test: new fields.NumberField({ integer: true, initial: 0 }),
        feat: new fields.NumberField({ integer: true, initial: 0 })
      }),
      int: new fields.SchemaField({
        value: new fields.NumberField({ integer: true, initial: 10 }),
        curr: new fields.NumberField({ integer: true, initial: 10 }),
        languages: new fields.NumberField({ integer: true, initial: 0 }),
        bonusSpells: new fields.SchemaField({
          lvl1: new fields.BooleanField({ initial: false }),
          lvl2: new fields.BooleanField({ initial: false }),
          lvl3: new fields.BooleanField({ initial: false }),
          lvl4: new fields.BooleanField({ initial: false })
        }),
        learnSpell: new fields.NumberField({ integer: true, initial: 0 })
      }),
      wis: new fields.SchemaField({
        value: new fields.NumberField({ integer: true, initial: 10 }),
        curr: new fields.NumberField({ integer: true, initial: 10 }),
        willMod: new fields.NumberField({ integer: true, initial: 0 }),
        bonusSpells: new fields.SchemaField({
          lvl1: new fields.BooleanField({ initial: false }),
          lvl2: new fields.BooleanField({ initial: false }),
          lvl3: new fields.BooleanField({ initial: false }),
          lvl4: new fields.BooleanField({ initial: false })
        }),
        learnSpell: new fields.NumberField({ integer: true, initial: 0 })
      }),
      cha: new fields.SchemaField({
        value: new fields.NumberField({ integer: true, initial: 10 }),
        curr: new fields.NumberField({ integer: true, initial: 10 }),
        reaction: new fields.NumberField({ integer: true, initial: 0 }),
        maxHenchmen: new fields.NumberField({ integer: true, initial: 0 }),
        turnUndead: new fields.NumberField({ integer: true, initial: 0 })
      })
    });

    schema.spellList = new fields.StringField({ blank: true, initial: "" });
    schema.spells = new fields.SchemaField({
      l1: new fields.StringField({ blank: true }),
      l2: new fields.StringField({ blank: true }),
      l3: new fields.StringField({ blank: true }),
      l4: new fields.StringField({ blank: true }),
      l5: new fields.StringField({ blank: true }),
      l6: new fields.StringField({ blank: true })
    });
    schema.spellList2 = new fields.StringField({ blank: true, initial: "" });
    schema.spells2 = new fields.SchemaField({
      l1: new fields.StringField({ blank: true }),
      l2: new fields.StringField({ blank: true }),
      l3: new fields.StringField({ blank: true }),
      l4: new fields.StringField({ blank: true }),
      l5: new fields.StringField({ blank: true }),
      l6: new fields.StringField({ blank: true })
    });

    schema.details = new fields.SchemaField({
      notes: new fields.StringField({ blank: true }),
      class: new fields.StringField({ blank: true }),
      level: new fields.SchemaField({ value: new fields.NumberField({ integer: true, initial: 1 }) }),
      xp: new fields.SchemaField({
        value: new fields.StringField({ initial: "0" }),
        toNextLvl: new fields.StringField({ initial: "0" }),
        bonus: new fields.NumberField({ integer: true, initial: 0 }),
        primeAttr: new fields.StringField({ blank: true })
      }),
      race: new fields.StringField({ blank: true }),
      gender: new fields.StringField({ blank: true }),
      age: new fields.StringField({ blank: true }),
      homeland: new fields.StringField({ blank: true }),
      religion: new fields.StringField({ blank: true }),
      height: new fields.StringField({ blank: true }),
      weight: new fields.StringField({ blank: true }),
      hair: new fields.StringField({ blank: true }),
      eyes: new fields.StringField({ blank: true }),
      complexion: new fields.StringField({ blank: true }),
      physicalFeatures: new fields.StringField({ blank: true })
    });

    schema.unskilled = new fields.NumberField({ initial: 0 });

    schema.proficiencies = new fields.SchemaField({
      class: new fields.StringField({ blank: true }),
      lvl4: new fields.StringField({ blank: true }),
      lvl8: new fields.StringField({ blank: true }),
      lvl12: new fields.StringField({ blank: true })
    });

    // Money template
    schema = this.mergeSchema(schema, moneyTemplate);

    schema.treasure = new fields.StringField({ blank: true });

    schema.weightCarried = new fields.NumberField({ integer: true, initial: 0 });
    schema.wornArmorType = new fields.StringField({ blank: true, initial: "" });
    schema.encumberedState = new fields.StringField({ blank: true, initial: "unencumbered" });

    schema.taskResolution = new fields.SchemaField({
      simple: new fields.SchemaField({
        name: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.simple.name") }),
        hint: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.simple.hint") }),
        tn: new fields.NumberField({ integer: true, initial: 5 })
      }),
      moderate: new fields.SchemaField({
        name: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.moderate.name") }),
        hint: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.moderate.hint") }),
        tn: new fields.NumberField({ integer: true, initial: 4 })
      }),
      "challenging": new fields.SchemaField({
        name: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.challenging.name") }),
        hint: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.challenging.hint") }),
        tn: new fields.NumberField({ integer: true, initial: 3 })
      }),
      "difficult": new fields.SchemaField({
        name: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.difficult.name") }),
        hint: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.difficult.hint") }),
        tn: new fields.NumberField({ integer: true, initial: 2 })
      }),
      "veryDifficult": new fields.SchemaField({
        name: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.veryDifficult.name") }),
        hint: new fields.StringField({ initial: game.i18n.localize("HYP3E.taskResolution.veryDifficult.hint") }),
        tn: new fields.NumberField({ integer: true, initial: 1 })
      })
    });

    return schema;
  }

  /** 
   * Runs BEFORE Active Effects are applied.
   * Used for calculating base "curr" values that AEs can then modify.
   */
  prepareBaseData() {
    super.prepareBaseData?.();

    // PCs can drop to -10 hp before they die
    this.hp.min = -10;
    this.weightCarried = 0; // will be calculated in prepareDerivedData

    Hyp3eLogger.info("Hyp3eCharacter prepareBaseData", `Base data prepared for character ${this.parent.name}:`, this);
  }

  /** 
   * Runs AFTER Active Effects.
   * Use this for final totals, clamping, or anything that depends on post-AE values.
   */
  prepareDerivedData() {
    super.prepareDerivedData?.();

    // Calculate weight carried & encumbrance
    this.weightCarried = this._calcWeightCarried();

    // What weight-class of armor (if any) is worn?
    const items = this._getEquippedProtectionItems();
    let armorType = "unarmored";
    for (const item of items) {
      const sys = item.system ?? {};
      if (item.type === "armor" && sys.type !== "shield") {
        armorType = sys.type || "unarmored";
        break; // We assume only one armor will be worn, so break after the first match
      }
    }
    this.wornArmorType = armorType;

    Hyp3eLogger.info("Hyp3eCharacter prepareDerivedData", `Derived data prepared for character ${this.parent.name}:`, this);
  }

  /**
   * Calculate the total weight carried by the character. Only used with characters.
   * @returns {number} Total weight carried, rounded to one decimal place
   */
  _calcWeightCarried() {
    const enableCoinWeight = game.settings.get(game.system.id, "enableCoinWeight");
    if (!this.parent?.items && !enableCoinWeight) return 0;
    let carriedWt = this.parent.items.reduce((total, item) => {
      // Start with carried/equipped items. We ignore weight of non-equipped 
      //  items since they are assumed to have been removed or dropped.
      // For weapons & armor, the equipped status is ignored and the item weight 
      //  is always added to encumbrance.
      const normalGear = ['item', 'container']; // 'container' has been deprecated but may still exist
      const combatGear = ['weapon', 'armor', 'shield'];
      let weight = 0;
      if (item.system.weight > 0 && item.system.quantity.value > 0) {
        // Is this a normal item, and is it carried?
        if (normalGear.includes(item.type) && item.system.equipped) {
          if (item.system.quantity.bundle && item.system.quantity.bundle > 1) {
            // For bundled items, we calculate weight based on number of bundles
            weight = (item.system.weight * (item.system.quantity.value / item.system.quantity.bundle))
          } else {
            // Normal unbundled item
            weight = (item.system.weight * item.system.quantity.value)
          }
        } else if (combatGear.includes(item.type)) {
          if (item.system.quantity.bundle && item.system.quantity.bundle > 1) {
            // For bundled items, we calculate weight based on number of bundles
            weight = (item.system.weight * (item.system.quantity.value / item.system.quantity.bundle))
          } else {
            weight = (item.system.weight * item.system.quantity.value)
          }
        }
      }
      return total + weight;
    }, 0);

    // If enabled, add coin weight (100 coins = 1 lb)
    if (enableCoinWeight) {
      for (const [coinType, coinData] of Object.entries(this.money)) {
        if (coinData.value) {
          // let val = coinData.value;
          if (!isNaN(coinData.value) && coinData.value > 0) {
            carriedWt += coinData.value / 100;
          }
        }
      }
    }

    // Round to one decimal place
    carriedWt = Math.round(carriedWt * 10)/10;

    // Log the calculated weight
    Hyp3eLogger.info("Hyp3eCharacter _calcWeightCarried", `${this.parent.name} is carrying ${carriedWt} pounds.`);

    // Return the final carried weight
    return carriedWt;
  }

  /**
   * Gather equipped protection items (armor, shields).
   * @returns {Array} Array of equipped protection items
   */
  _getEquippedProtectionItems() {
    const items = [];
    for (const [type, collection] of Object.entries(this.parent.itemTypes)) {
      if (type === "armor" || type === "shield") {
        for (const obj of Object.values(collection)) {
          if (obj.system?.equipped) items.push(obj);
        }
      }
    }
    return items;
  }  
}