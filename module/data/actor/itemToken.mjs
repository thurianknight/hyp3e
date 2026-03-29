// module/data/actor/itemToken.mjs
import Hyp3eActorBase from "./base.mjs";

export default class Hyp3eItemToken extends Hyp3eActorBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
  
    // Item Token fields
    schema.attributes = new fields.SchemaField({
      dex: new fields.SchemaField({
        value: new fields.NumberField({ initial: 10 }),
        curr: new fields.NumberField({ initial: 10 }),
      })
    });
    schema.size = new fields.StringField({ blank: true });
    schema.linkedItemUuid = new fields.StringField({ blank: true, initial: "" });

    return schema;
  }
}