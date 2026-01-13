import HYP3E from "../helpers/config.mjs";
import { Hyp3eLogger } from "../helpers/logger.mjs";
import { HYP3ECustomClassList } from "./class-list.mjs";

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
        classes: ["hyp3e-config"],
        window: {
            title: "Hyperborea Configuration",
            icon: "fa-solid fa-cogs",
            resizable: true,
        },
        position: {
            width: 700,
            height: "auto",
        }
    };
    /** Path to the Handlebars template */
    static PARTS = {
        content: {
            template: `${HYP3E.templatePath}/apps/hyp3e-config-app.hbs`
        }
    };

    /**
     * Gather current settings into template context
     */
    async _prepareContext(_options) {
        const settings = {
            // UI Options
            chatFontSize: game.settings.get(game.system.id, "chatFontSize"),
            calendarVerbose: game.settings.get(game.system.id, "calendarVerbose"),
            enableTurnTracker: game.settings.get(game.system.id, "enableTurnTracker"),
            showWeaponOverlay: game.settings.get(game.system.id, "showWeaponOverlay"),
            resizeTokens: game.settings.get(game.system.id, "resizeTokens"),
            // Rules Options - General
            autoCalcThiefTn: game.settings.get(game.system.id, "autoCalcThiefTn"),
            autoCalcAc: game.settings.get(game.system.id, "autoCalcAc"),
            enforceWeaponEquipRules: game.settings.get(game.system.id, "enforceWeaponEquipRules"),
            flipRollUnderMods: game.settings.get(game.system.id, "flipRollUnderMods"),
            enableEncumbrance: game.settings.get(game.system.id, "enableEncumbrance"),
            encumbered: game.settings.get(game.system.id, "encumbered"),
            heavilyEncumbered: game.settings.get(game.system.id, "heavilyEncumbered"),
            // Rules Options - Combat
            // isGroupInitiative: game.settings.get(game.system.id, "isGroupInitiative"),
            initiativeType: game.settings.get(game.system.id, "initiativeType"),
            rerollInitiative: game.settings.get(game.system.id, "rerollInitiative"),
            resolveDeathAtRoundEnd: game.settings.get(game.system.id, "resolveDeathAtRoundEnd"),
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
            autoCalcAttrMods: game.settings.get(game.system.id, "autoCalcAttrMods"),
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
        };
        // Add values for select lists
        const initiativeTypeOpts = [
            { value: "group", label: "Group-based initiative" },
            { value: "phased", label: "Phased initiative" },
            { value: "individual", label: "Individual initiative" }
        ];
        const rerollInitiativeOpts = [
            { value: "keep", label: "Keep same for each round" },
            { value: "reset", label: "Reset to blank each round" },
            { value: "reroll", label: "Reroll each round" }
        ];
        const attrCheckOpts = [
            { value: "", label: "Disabled" },
            { value: "3d6", label: "3d6 roll-under" }
        ];
        const quickCreateCharMethods = [
            { value: "", label: "Disabled" },
            { value: "3d6", label: "Method I: 3d6 in order" },
            { value: "4d6dl", label: "Method III: 4d6 drop lowest, optimize for prime attributes" },
            { value: "{3d6,3d6,3d6}kh", label: "Method IV: 3d6 three times and pick best" },
            { value: "2d6+6", label: "Method V: 2d6+6 in order" },
            { value: "4d6dl,3d6", label: "Method VI: 4d6 drop low for prime attributes, 3d6 for others" },
        ];
        const logLevels = [
            { value: "0", label: "Verbose (Info, Warnings, Errors)" },
            { value: "1", label: "Warnings & Errors" },
            { value: "2", label: "Errors Only" }
        ];
        Hyp3eLogger.info("_prepareContext", `Loaded configuration settings:`, settings);
        return { settings, initiativeTypeOpts, rerollInitiativeOpts, attrCheckOpts, quickCreateCharMethods, logLevels };
    }

    /**
     * @inheritdoc
     */
    async _onRender(context, options) {
        await super._onRender(context, options);
        const html = this.element;

        // Tabs
        this._tabs = new foundry.applications.ux.Tabs({
            navSelector: ".tabs",
            contentSelector: ".content",
            initial: "ui"
        });
        this._tabs.bind(html);

        // Form submit button
        html.querySelector(".save-btn")?.addEventListener("click", () => this._handleSave());

        // Custom class app launcher
        html.querySelector("button[data-action='open-class-manager']")
            ?.addEventListener("click", ev => {
                ev.preventDefault();
                new HYP3ECustomClassList().render(true);
            }
        );
    }

    /**
     * Handles saving app data
     */
    async _handleSave() {
        const html = this.element;
        const data = this.collectFormData(html);
        Hyp3eLogger.info("_handleSave", `Collected app data`, data);

        let updated = false;
        let requiresReload = false;

        for (let [key, value] of Object.entries(data)) {
            if (game.settings.settings.has(`hyp3e.${key}`)) {
                // Current value in settings
                const setting = game.settings.settings.get(`hyp3e.${key}`);
                const current = game.settings.get("hyp3e", key);

                // Only update if different
                if (current !== value) {
                    Hyp3eLogger.info("_handleSave", `${key} changed from ${current} to ${value}.`);
                    try {
                        await game.settings.set("hyp3e", key, value);
                        updated = true;
                        if (setting.requiresReload) requiresReload = true;
                    } catch (err) {
                        const msg = `Config options update error.`;
                        Hyp3eLogger.error("_handleSave", msg, err)
                        ui.notifications.error(`${msg} Check your browser console log for details.`)
                        return false;
                    }
                }
            }
        }
        if (requiresReload) {
            new Dialog({
                title: "Reload Required",
                content: `<p>Some settings changes require a reload to take effect. Reload now?</p>`,
                buttons: {
                    yes: {
                        icon: "<i class='fas fa-check'></i>",
                        label: "Reload",
                        callback: () => window.location.reload()
                    },
                    no: {
                        icon: "<i class='fas fa-times'></i>",
                        label: "Later"
                    }
                },
                default: "yes"
            }).render(true);
        } else if (updated) {
            ui.notifications.info("Hyperborea Configuration Settings saved.");
            this.close();
        }

        return false;
    }

    /**
     * Read all input values from a container element.
     * Returns a plain object keyed by `name`.
     */
    collectFormData(container) {
        const data = {};

        container.querySelectorAll("input, range-picker, select, textarea").forEach(el => {
            const elementName = el.name || el.getAttribute("name");
            if (!elementName) {
                Hyp3eLogger.warn("collectFormData", `Unnamed ${el.tagName} with value ${el.value} in data, cannot process.`);
                return;
            }

            switch (el.type) {
                case "checkbox":
                    data[elementName] = el.checked;
                    break;
                case "radio":
                    if (el.checked) data[elementName] = el.value;
                    break;
                default:
                    data[elementName] = el.value;
            }
        });

        return data;
    }
}
