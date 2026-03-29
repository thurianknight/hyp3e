// module/data/templates/rollable.mjs

/**
 * Reusable Rollable template (used by weapon, spell, etc.)
 */
export function rollableTemplate() {
  const fields = foundry.data.fields;

  return {
    formula: new fields.StringField({ initial: "" }),
    atkRoll: new fields.BooleanField({ initial: false }),
    tn: new fields.StringField({ initial: "" }),
    save: new fields.StringField({ initial: "" }),
    damage: new fields.StringField({ initial: "" }),
    damage2h: new fields.StringField({ initial: "" }),
    dmgType: new fields.StringField({ initial: "basic" }),
    altDmg: new fields.ObjectField({ initial: {} }),
    duration: new fields.StringField({ initial: "" }),
    affected: new fields.StringField({ initial: "" })
  };
}