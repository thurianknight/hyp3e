// module/data/actor/npc.mjs
import Hyp3eActorBase from "./base.mjs";

export default class Hyp3eNpc extends Hyp3eActorBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    // NPC template
    schema.attributes = new fields.SchemaField({
      dex: new fields.SchemaField({
        value: new fields.NumberField({ initial: 10 }),
        curr: new fields.NumberField({ initial: 10 }),
      })
    });
    schema.size = new fields.StringField({ blank: true });
    schema.encWild = new fields.StringField({ blank: true });
    schema.encLair = new fields.StringField({ blank: true });
    schema.morale = new fields.NumberField({ nullable: true, initial: null });
    schema.loyalty = new fields.NumberField({ nullable: true, initial: null });
    schema.cost = new fields.StringField({ blank: true, initial: "0" });
    schema.xp = new fields.StringField({ blank: true, initial: "0" });
    schema.treasure = new fields.StringField({ blank: true, initial: "" });
    // schema.dx = new fields.NumberField({ initial: 11 });
    schema.rollHD = new fields.BooleanField({ initial: true });
    schema.phenotype = new fields.StringField({ blank: true, initial: "" });
    schema.npcType = new fields.StringField({ blank: true, initial: "monster" });

    return schema;
  }
}