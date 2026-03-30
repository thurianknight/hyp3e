// module/data/actor/merchant.mjs
import Hyp3eActorBase from "./base.mjs";
import { moneyTemplate } from "../templates/money.mjs";

export default class Hyp3eMerchant extends Hyp3eActorBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    let schema = super.defineSchema();

    // Money template
    schema = this.mergeSchema(schema, moneyTemplate);

    // Merchant-specific fields
    schema.buyMultiplier = new fields.NumberField({ initial: 0.5 });
    schema.sellMultiplier = new fields.NumberField({ initial: 1.0 });
    schema.ignoreQty = new fields.BooleanField({ initial: true });

    return schema;
  }
}