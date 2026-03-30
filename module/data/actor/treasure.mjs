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
}