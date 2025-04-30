/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
import HYP3E from "./config.mjs"

export const preloadHandlebarsTemplates = async function() {
    // Register Handlebars partials
    const partialPaths = [
        // Actor partials
        `${HYP3E.templatePath}/actor/parts/actor-abilities.hbs`,
        `${HYP3E.templatePath}/actor/parts/actor-attributes.hbs`,
        `${HYP3E.templatePath}/actor/parts/actor-combat.hbs`,
        `${HYP3E.templatePath}/actor/parts/actor-items.hbs`,
        `${HYP3E.templatePath}/actor/parts/actor-spells.hbs`,
        `${HYP3E.templatePath}/actor/parts/actor-effects.hbs`,
        `${HYP3E.templatePath}/actor/parts/actor-description.hbs`,
        `${HYP3E.templatePath}/actor/parts/npc-all-items.hbs`,
        `${HYP3E.templatePath}/actor/parts/npc-abilities.hbs`,

        // Item partials
        `${HYP3E.templatePath}/item/parts/item-effects.hbs`,

        // Combat Tab
        `${HYP3E.templatePath}/sidebar/combat-tracker-combatant-ind-v12.hbs`,
        `${HYP3E.templatePath}/sidebar/combat-tracker-combatant-group-v12.hbs`,
        `${HYP3E.templatePath}/sidebar/combat-tracker-combatant-ind-v13.hbs`,
        `${HYP3E.templatePath}/sidebar/combat-tracker-combatant-group-v13.hbs`,
    ];

    // Load and register partials
    await Promise.all(partialPaths.map(async (path) => {
        const name = path.split("/").pop().replace(".hbs", "");
        const source = await fetch(path).then(r => r.text());
        Handlebars.registerPartial(name, source);
    }));

    // Preload Handlebars templates
    return loadTemplates([
        // Dialog templates
        `${HYP3E.templatePath}/dialog/roll-dialog.hbs`,

        // Chat templates
        `${HYP3E.templatePath}/chat/apply-damage.hbs`,
        `${HYP3E.templatePath}/chat/attack-roll.hbs`,
        `${HYP3E.templatePath}/chat/crit-roll.hbs`,
        `${HYP3E.templatePath}/chat/damage-roll.hbs`,
        `${HYP3E.templatePath}/chat/show-item.hbs`,

        // Combat Tab
        `${HYP3E.templatePath}/sidebar/combat-tracker-v12.hbs`,
        `${HYP3E.templatePath}/sidebar/combat-tracker-v13.hbs`,
        `${HYP3E.templatePath}/sidebar/combat-header-v13.hbs`,
        `${HYP3E.templatePath}/sidebar/combat-footer-v13.hbs`,
    ]);
};
