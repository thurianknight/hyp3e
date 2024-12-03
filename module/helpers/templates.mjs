/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
import HYP3E from "./config.mjs"

export const preloadHandlebarsTemplates = async function() {
    return loadTemplates([

        // Actor partials.
        `${HYP3E.templatePath}/actor/parts/actor-abilities.hbs`,
        `${HYP3E.templatePath}/actor/parts/actor-attributes.hbs`,
        `${HYP3E.templatePath}/actor/parts/actor-combat.hbs`,
        `${HYP3E.templatePath}/actor/parts/actor-items.hbs`,
        `${HYP3E.templatePath}/actor/parts/actor-spells.hbs`,
        `${HYP3E.templatePath}/actor/parts/actor-effects.hbs`,
        `${HYP3E.templatePath}/actor/parts/actor-description.hbs`,
        `${HYP3E.templatePath}/actor/parts/npc-all-items.hbs`,
        `${HYP3E.templatePath}/actor/parts/npc-abilities.hbs`,

        // chat templates
        `${HYP3E.templatePath}/chat/apply-damage.hbs`,
        `${HYP3E.templatePath}/chat/crit-roll.hbs`,
        `${HYP3E.templatePath}/chat/roll-attack.hbs`,

        // Combat Tab
        `${HYP3E.templatePath}/sidebar/combat-tracker.hbs`,
        `${HYP3E.templatePath}/sidebar/combat-tracker-combatant-individual.hbs`,
        `${HYP3E.templatePath}/sidebar/combat-tracker-combatant-group.hbs`,
        `${HYP3E.templatePath}/apps/combat-set-groups.hbs`,
        `${HYP3E.templatePath}/apps/combat-set-groups.hbs`,

    ]);
};
