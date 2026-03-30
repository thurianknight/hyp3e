// module/data/templates/money.mjs

/**
 * Reusable Money template (used by treasure, etc.)
 */
export function moneyTemplate() {
  const fields = foundry.data.fields;

  return {
    money: new fields.SchemaField({
      cp: new fields.SchemaField({ value: new fields.StringField({ initial: "0" }) }),
      sp: new fields.SchemaField({ value: new fields.StringField({ initial: "0" }) }),
      ep: new fields.SchemaField({ value: new fields.StringField({ initial: "0" }) }),
      gp: new fields.SchemaField({ value: new fields.StringField({ initial: "0" }) }),
      pp: new fields.SchemaField({ value: new fields.StringField({ initial: "0" }) })
    })
  };
}