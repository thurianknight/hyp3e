import HYP3E from "../helpers/config.mjs";
import { Hyp3eLogger } from "../helpers/logger.mjs";

const {
    HandlebarsApplicationMixin,
    ApplicationV2
} = foundry.applications.api;

export default class HYP3ECharacterSetLanguages extends HandlebarsApplicationMixin(ApplicationV2) {
    // _highlighted;
    constructor(actorUuid, options={}) {
        super(options);
        this.actorUuid = actorUuid;
    }

    // ===========================================================================
    // APPLICATION SETUP
    // ===========================================================================
    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        id: "character-set-languages",
        classes: ["hyp3e", "character-set-languages"],
        tag: "form",
        window: {
            title: "HYP3E.details.languages",
            icon: "fa-book",
            contentClasses: ["standard-form"]
        },
        actions: {
            toggleLanguage: HYP3ECharacterSetLanguages.toggleLanguage
        },
        form: {
            handler: undefined,
            submitOnChange: true,
            closeOnSubmit: false
        },
        position: {
            width: 300,
            height: "auto"
        }
    }

    get title() {
        return `${game.i18n.localize(this.options.window.title)}`;
    }

    static PARTS = {
        main: {
            template: `${HYP3E.templatePath}/apps/character-languages.hbs`
        }
    }


    // ===========================================================================
    // RENDER SETUP
    // ===========================================================================

    async _prepareContext(_options) {
        Hyp3eLogger.info("_prepareContext", `Character Languages context options: `, _options);

        const actor = await fromUuid(_options.actorUuid)
        if (!actor) {
            const msg = `No actor found for actorUuid ${target.dataset.actorUuid}!`;
            Hyp3eLogger.warn("_prepareContext", msg)
            ui.notifications.warn(msg)
            return
        }
        let languages = CONFIG.HYP3E.languages

        return {
            // Return the actor and languages
            actorUuid: _options.actorUuid,
            actor: actor,
            languages: languages
        }
    }

    _onRender(context, options) {
        // Hyp3eLogger.info("_onRender", `Character Languages render context: `, context);
        // Hyp3eLogger.info("_onRender", `Character Languages render options: `, options);
        super._onRender(context, options);
    }


    // ===========================================================================
    // UPDATING
    // ===========================================================================

    static async toggleLanguage(event, target) {
        Hyp3eLogger.info("toggleLanguage", `Toggle Language Target:`, target);
        Hyp3eLogger.info("toggleLanguage", `Toggle Language Actor ID:`, target.dataset.actorUuid);

        const actor = await fromUuid(target.dataset.actorUuid)
        if (!actor) {
            const msg = `No actor found for actorUuid ${target.dataset.actorUuid}!`
            Hyp3eLogger.warn("toggleLanguage", msg);
            ui.notifications.warn(msg)
            return
        }

        // Check to see if the language is already in the list, return true or false
        function checkLanguage(language) {
            return language != target.dataset.control
        }

        // Toggle this language on/off for the actor
        let newList = []
        let languages
        if (actor.system?.knownLanguages) {
            languages = actor.system.knownLanguages.split(",").map(l => l.trim())
        } else {
            languages = []
        }

        // The filter function will delete any entries that match the clicked item, thus toggling it off
        newList = languages.filter(checkLanguage)
        if (newList.length == languages.length) {
            // Nothing was deleted, so we will add this to the list, thus toggling it on
            languages.push(target.dataset.control)
        } else {
            // If something was deleted before, replace languages with newList
            languages = newList
        }

        // Sort the languages, putting "Common" first if it exists, then alphabetically
        languages.sort((a, b) => {
            if (a === "Common" && b !== "Common") return -1;  // a goes first
            if (b === "Common" && a !== "Common") return 1;   // b goes first
            return a.localeCompare(b);                        // otherwise alphabetical
        });
        // Log the results and update the actor
        Hyp3eLogger.info("toggleLanguage", `${actor.name} known languages:`, languages);
        await actor.update({system: {knownLanguages: languages.join(", ")}})

        this.render(true, { actorUuid: target.dataset.actorUuid, focus: true })
    }
}