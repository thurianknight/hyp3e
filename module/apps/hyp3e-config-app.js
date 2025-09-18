import HYP3E from "../helpers/config.mjs";
import { Hyp3eLogger } from "../helpers/logger.mjs";

const {
    HandlebarsApplicationMixin,
    ApplicationV2
} = foundry.applications.api;

export class Hyp3eConfigApp extends HandlebarsApplicationMixin(ApplicationV2) {
    // ===========================================================================
    // APPLICATION SETUP
    // ===========================================================================
    static DEFAULT_OPTIONS = {
        id: "hyp3e-config",
        classes: ["hyp3e-config", "scrollable"],
        window: {
            title: "Hyperborea Configuration",
            icon: "fa-gear",
            resizable: true,
        },
        position: {
            width: 700,
            height: "auto",
        },
        form: {
            handler: Hyp3eConfigApp.onSubmit,
            submitOnChange: false,
            submitOnClose: false,
            closeOnSubmit: true,
        },
    };

    /**
     * Gather current settings into template context
     */
    async _prepareContext(_options) {
        return {
            settings: {
                // UI Options
                calendarVerbose: game.settings.get(game.system.id, "calendarVerbose"),
                enableTurnTracker: game.settings.get(game.system.id, "enableTurnTracker"),
                showWeaponOverlay: game.settings.get(game.system.id, "showWeaponOverlay"),
                resizeTokens: game.settings.get(game.system.id, "resizeTokens"),
                // Rules Options - General
                autoCalcAc: game.settings.get(game.system.id, "autoCalcAc"),
                enforceWeaponEquipRules: game.settings.get(game.system.id, "enforceWeaponEquipRules"),
                flipRollUnderMods: game.settings.get(game.system.id, "flipRollUnderMods"),
                enableEncumbrance: game.settings.get(game.system.id, "enableEncumbrance"),
                encumbered: game.settings.get(game.system.id, "encumbered"),
                heavilyEncumbered: game.settings.get(game.system.id, "heavilyEncumbered"),
                // Rules Options - Combat
                isGroupInitiative: game.settings.get(game.system.id, "isGroupInitiative"),
                rerollInitiative: game.settings.get(game.system.id, "rerollInitiative"),
                limitMovement: game.settings.get(game.system.id, "limitMovement"),
                forceRangeLimit: game.settings.get(game.system.id, "forceRangeLimit"),
                forceWeaponEquip: game.settings.get(game.system.id, "forceWeaponEquip"),
                forceSpellMemorize: game.settings.get(game.system.id, "forceSpellMemorize"),
                enableCombatSitModDetection: game.settings.get(game.system.id, "enableCombatSitModDetection"),
                enableAttrChecks: game.settings.get(game.system.id, "enableAttrChecks"),
                critHit: game.settings.get(game.system.id, "critHit"),
                critMiss: game.settings.get(game.system.id, "critMiss"),
                addlDamageTypes: game.settings.get(game.system.id, "addlDamageTypes"),
                // Character & NPC Options
                quickCreateChars: game.settings.get(game.system.id, "quickCreateChars"),
                customCompendia: game.settings.get(game.system.id, "customCompendia"),
                openClassEditor: game.settings.get(game.system.id, "openClassEditor"),
                races: game.settings.get(game.system.id, "races"),
                languages: game.settings.get(game.system.id, "languages"),
                characterClasses: game.settings.get(game.system.id, "characterClasses"),
                phenotypes: game.settings.get(game.system.id, "phenotypes"),
                // Technical Options
                logLevel: game.settings.get(game.system.id, "logLevel"),
                reRunMigration: game.settings.get(game.system.id, "reRunMigration"),
                migrateCompendia: game.settings.get(game.system.id, "migrateCompendia"),
            }
        };
    }
    /** Path to the Handlebars template */
    static PARTS = {
        content: {
            template: `${HYP3E.templatePath}/apps/hyp3e-config-app.hbs`
        }
    };

    /**
     * Save settings when the form is submitted
     */
    static async onSubmit(event, form, formData) {
        Hyp3eLogger.info("onSubmit", `Form submitted`, formData);
        for (let [k, v] of Object.entries(formData.object)) {
            if (game.settings.settings.has(`hyp3e.${k}`)) {
                await game.settings.set("hyp3e", k, v);
            }
        }
    }

    /**
     * Activate listeners (e.g. buttons, tabs)
     */
    async _onRender(context, options) {
        // Tabs
        // this._tabs = new foundry.applications.api.TabsV2({
        this._tabs = new foundry.applications.ux.Tabs({
            navSelector: ".tabs",
            contentSelector: ".content",
            initial: "ui"
        });
        // this._tabs.bind(this.element[0]);
        this._tabs.bind(this.element);

        // Example button listener
        this.element.querySelector("button[data-action='rerun-migration']")
            ?.addEventListener("click", ev => {
                ev.preventDefault();
                ui.notifications.info("Re-running world migration…");
                // call your migration function here
            });
    }

}
