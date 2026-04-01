// module/data/actor/npc.mjs
import Hyp3eActorBase from "./base.mjs";
import { Hyp3eLogger } from "../../helpers/logger.mjs";

export default class Hyp3eNpc extends Hyp3eActorBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    let schema = super.defineSchema();

    // NPC fields
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

  /** 
   * Runs BEFORE Active Effects are applied.
   * Used for calculating base "curr" values that AEs can then modify.
   */
  prepareBaseData() {
    super.prepareBaseData?.();

    // If NPC/Monster is not set, default to monster
    if (!this?.npcType) {
      this.npcType = "monster";
    }
    // NPCs and monsters don't get the -10 hp benefit that PCs do
    if (this.npcType === "monster") {
      this.hp.min = 0
    } else if (this.npcType === "npc") {
      this.hp.min = -3
    }

    this.baseClass = "npc";

    Hyp3eLogger.info("Hyp3eNpc prepareBaseData", `Base data prepared for npc ${this.parent.name}:`, this);
  }

  /** 
   * Runs AFTER Active Effects.
   * Use this for final totals, clamping, or anything that depends on post-AE values.
   */
  prepareDerivedData() {
    super.prepareDerivedData?.();

    Hyp3eLogger.info("Hyp3eNpc prepareDerivedData", `Derived data prepared for npc ${this.parent.name}:`, this);
  }
}