/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
import HYP3E from "./config.mjs"

export const loadHandlebarsPartials = function(type) {
    // Register Handlebars partials
    const partialPaths = [
        // Actor V2 partials - main sheets
        `${HYP3E.templatePath}/actor/actor-character-header-v2.hbs`,
        `${HYP3E.templatePath}/actor/actor-npc-header-v2.hbs`,
        `${HYP3E.templatePath}/actor/actor-merchant-header-v2.hbs`,
        `${HYP3E.templatePath}/actor/actor-treasure-header-v2.hbs`,
        `${HYP3E.templatePath}/actor/actor-itemToken-header-v2.hbs`,
        // Actor V2 partials - tabs
        `${HYP3E.templatePath}/actor/parts/tab-character-abilities.hbs`,
        `${HYP3E.templatePath}/actor/parts/section-character-attributes.hbs`,
        `${HYP3E.templatePath}/actor/parts/tab-npc-abilities.hbs`,
        `${HYP3E.templatePath}/actor/parts/tab-character-description.hbs`,
        `${HYP3E.templatePath}/actor/parts/tab-npc-description.hbs`,
        `${HYP3E.templatePath}/actor/parts/section-npc-items.hbs`,
        `${HYP3E.templatePath}/actor/parts/tab-placeholder.hbs`,
        `${HYP3E.templatePath}/actor/parts/tab-itemToken-abilities.hbs`,
        `${HYP3E.templatePath}/actor/parts/tab-itemToken-description.hbs`,
        `${HYP3E.templatePath}/actor/parts/section-itemToken-item.hbs`,

        // Item V2 partials - headers
        `${HYP3E.templatePath}/item/parts/physical-header.hbs`,
        `${HYP3E.templatePath}/item/parts/spell-header.hbs`,
        `${HYP3E.templatePath}/item/parts/weapon-header.hbs`,
        `${HYP3E.templatePath}/item/parts/class-template-header.hbs`,
        // Item V2 partials - sidebars
        `${HYP3E.templatePath}/item/parts/sidebar-armor.hbs`,
        `${HYP3E.templatePath}/item/parts/sidebar-feature.hbs`,
        `${HYP3E.templatePath}/item/parts/sidebar-item.hbs`,
        `${HYP3E.templatePath}/item/parts/sidebar-shield.hbs`,
        `${HYP3E.templatePath}/item/parts/sidebar-spell.hbs`,
        `${HYP3E.templatePath}/item/parts/sidebar-weapon.hbs`,
        // Item V2 partials - attributes
        `${HYP3E.templatePath}/item/parts/class-template-attributes.hbs`,
        `${HYP3E.templatePath}/item/parts/effect-attributes.hbs`,
        `${HYP3E.templatePath}/item/parts/feature-attributes.hbs`,
        `${HYP3E.templatePath}/item/parts/item-attributes.hbs`,
        `${HYP3E.templatePath}/item/parts/physical-attributes.hbs`,
        `${HYP3E.templatePath}/item/parts/spell-attributes.hbs`,
        `${HYP3E.templatePath}/item/parts/weapon-attributes.hbs`,

        // Combat Tab
        `${HYP3E.templatePath}/sidebar/combat-tracker-combatant-ind-v13.hbs`,
        `${HYP3E.templatePath}/sidebar/combat-tracker-combatant-group-v13.hbs`,
    ];

    // Foundry caches compiled partials and retries failed loads. Keep the short
    // aliases used by our templates, and only block renders on their own family.
    const paths = type ? partialPaths.filter(path => path.startsWith(`${HYP3E.templatePath}/${type}/`)) : partialPaths;
    return foundry.applications.handlebars.loadTemplates(Object.fromEntries(paths.map(path => {
        const name = path.split("/").pop().replace(".hbs", "");
        return [name, path];
    })));
};

export const preloadHandlebarsTemplates = async function() {
    await loadHandlebarsPartials();

    // Preload Handlebars templates
    return foundry.applications.handlebars.loadTemplates([
        // Dialog templates
        `${HYP3E.templatePath}/dialog/roll-dialog.hbs`,

        // Chat templates
        `${HYP3E.templatePath}/chat/apply-damage.hbs`,
        `${HYP3E.templatePath}/chat/attack-roll.hbs`,
        `${HYP3E.templatePath}/chat/crit-roll.hbs`,
        `${HYP3E.templatePath}/chat/damage-roll.hbs`,
        `${HYP3E.templatePath}/chat/show-item.hbs`,

        // Combat Tab
        `${HYP3E.templatePath}/sidebar/combat-tracker-v13.hbs`,
        `${HYP3E.templatePath}/sidebar/combat-header-v13.hbs`,
        `${HYP3E.templatePath}/sidebar/combat-footer-v13.hbs`,
    ]);
};
