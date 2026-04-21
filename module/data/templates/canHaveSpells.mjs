// module/data/templates/canHaveSpells.mjs

/**
 * Reusable CanHaveSpells template (used by armor, shield, weapon, item, etc.)
 */
export function canHaveSpellsTemplate() {
  const fields = foundry.data.fields;

  return {
    spellcasting: new fields.SchemaField({ 
      hasSpells: new fields.BooleanField({ initial: false }),
      hideCharges: new fields.BooleanField({ initial: false }),
      ca: new fields.NumberField({ nullable: true, initial: null }),
      charges: new fields.SchemaField({
        value: new fields.NumberField({ nullable: true, initial: null }),
        max: new fields.NumberField({ nullable: true, initial: null })
      }),
      spellRefs: new fields.ArrayField(new fields.SchemaField({
        uuid: new fields.StringField({ blank: true, initial: "" }),
        charges: new fields.NumberField({ nullable: true, initial: null })
      }))
    })
  };
}