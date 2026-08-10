// module/data/actor/treasure.mjs
import Hyp3eActorBase from "./base.mjs";
import { moneyTemplate } from "../templates/money.mjs";

export default class Hyp3eTreasure extends Hyp3eActorBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    let schema = super.defineSchema();
  
    // Money template
    schema = this.mergeSchema(schema, moneyTemplate);

    return schema;
  }

  /** 
   * Runs BEFORE Active Effects are applied.
   * Used for calculating base values that AEs can use or modify.
   */
  prepareBaseData() {
    super.prepareBaseData?.();
  }

  /** 
   * Runs AFTER Active Effects.
   * Use this for final totals, clamping, or anything that depends on post-AE values.
   */
  prepareDerivedData() {
    super.prepareDerivedData?.();

    // Calculate weight carried & encumbrance
    this.weightCarried = this._calcWeightCarried();
  }
}