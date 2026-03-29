// module/data/templates/physical.mjs

/**
 * Reusable Physical template (used by armor, shield, weapon, item, etc.)
 */
export function physicalTemplate() {
  const fields = foundry.data.fields;

  return {
    quantity: new fields.SchemaField({
      value: new fields.NumberField({ required: true, integer: true, initial: 1 }),
      max:   new fields.NumberField({ required: true, integer: true, initial: 1 }),
      bundle: new fields.NumberField({ required: true, integer: true, initial: 1 })
    }),

    isConsumable: new fields.BooleanField({ initial: false }),
    isLightSource: new fields.BooleanField({ initial: false }),
    light: new fields.ObjectField({ initial: {} }),

    location: new fields.StringField({ required: true, blank: true, initial: "" }),
    weight: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    cost: new fields.StringField({ required: true, blank: true, initial: "0" }),
    xp: new fields.StringField({ required: true, blank: true, initial: "" }),

    containerId: new fields.StringField({ required: true, blank: true, initial: "" })
  };
}