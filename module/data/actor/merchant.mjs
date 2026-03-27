// module/data/actor/merchant.mjs
import Hyp3eActorBase from "./base.mjs";

export default class Hyp3eMerchant extends Hyp3eActorBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    // Merchant template
    schema.money = new fields.SchemaField({
      cp: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }) }),
      sp: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }) }),
      ep: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }) }),
      gp: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }) }),
      pp: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }) })
    });
    schema.buyMultiplier = new fields.NumberField({ initial: 0.5 });
    schema.sellMultiplier = new fields.NumberField({ initial: 1.0 });
    schema.ignoreQty = new fields.BooleanField({ initial: true });

    return schema;
  }
}