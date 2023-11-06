/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Actor partials.
    "systems/hyp3e/templates/actor/parts/actor-abilities.hbs",
    "systems/hyp3e/templates/actor/parts/actor-attributes.hbs",
    "systems/hyp3e/templates/actor/parts/actor-combat.hbs",
    "systems/hyp3e/templates/actor/parts/actor-items.hbs",
    "systems/hyp3e/templates/actor/parts/actor-spells.hbs",
    "systems/hyp3e/templates/actor/parts/actor-effects.hbs",
    "systems/hyp3e/templates/actor/parts/actor-description.hbs",
    "systems/hyp3e/templates/actor/parts/actor-all-items.hbs",
    "systems/hyp3e/templates/actor/parts/npc-abilities.hbs",
  ]);
};
