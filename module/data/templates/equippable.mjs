// module/data/templates/equippable.mjs

/**
 * Reusable Equippable template (used by armor, shield, weapon, item, etc.)
 */
export function equippableTemplate() {
  const fields = foundry.data.fields;

  return {
    equipped: new fields.BooleanField({ initial: false })
  };
}