// module/data/actor/treasure.mjs
import Hyp3eActorBase from "./base.mjs";

export default class Hyp3eTreasure extends Hyp3eActorBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
  
    // Treasure template
    schema.money = new fields.SchemaField({
      cp: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }) }),
      sp: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }) }),
      ep: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }) }),
      gp: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }) }),
      pp: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }) })
    });

    return schema;
  }
}