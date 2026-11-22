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
    altDmg: new fields.ObjectField({ initial: {}, nullable: true }),
    // addlDmg replaces altDmg
    addlDmg: new fields.ArrayField(
      new fields.SchemaField({
        type: new fields.StringField({ required: true, initial: "" }),
        formula: new fields.StringField({ required: true, initial: "" })
      })
    ),
    conditionalMods: new fields.ArrayField(
      new fields.SchemaField({
        attack: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        damage: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        condition: new fields.SchemaField({
          source: new fields.StringField({ required: true, initial: "target" }),  // "target" or "wielder"
          systemPath: new fields.StringField({ required: true, initial: "" }),
          operator: new fields.StringField({ required: true, initial: "==", choices: { "==": "equal to", "!=": "not equal to", "incl": "includes", "in": "is one of" } }),
          value: new fields.StringField({ required: true, initial: "" })
        })
      })
    ),
    // duration: new fields.StringField({ initial: "" }),
    affected: new fields.StringField({ initial: "" })
  };
}