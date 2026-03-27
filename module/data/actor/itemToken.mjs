// module/data/actor/itemToken.mjs
import Hyp3eActorBase from "./base.mjs";

export default class Hyp3eItemToken extends Hyp3eActorBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
  
    // Item Token template
    schema.linkedItemUuid = new fields.StringField({ blank: true, initial: "" });

    return schema;
  }
}