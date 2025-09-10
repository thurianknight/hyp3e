import { HYP3E } from "../helpers/config.mjs";
import { Hyp3eLogger } from "../helpers/logger.mjs";

const {
    HandlebarsApplicationMixin,
    ApplicationV2
} = foundry.applications.api;

export default class HYP3EItemSetDmgTypes extends HandlebarsApplicationMixin(ApplicationV2) {
    // _highlighted;
    constructor(itemUuid, options={}) {
        super(options);
        this.itemUuid = itemUuid;
    }

    // ===========================================================================
    // APPLICATION SETUP
    // ===========================================================================
    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        id: "item-set-dmg-types",
        classes: ["item-set-dmg-types", "scrollable"],
        tag: "form",
        window: {
            title: "HYP3E.headers.damageTypes",
            icon: "fa-book",
            contentClasses: ["standard-form"]
        },
        actions: {
            saveChanges: HYP3EItemSetDmgTypes.saveChanges
        },
        form: {
            handler: HYP3EItemSetDmgTypes.#onSubmit,
            submitOnChange: false,
            closeOnSubmit: true
        },
        position: {
            width: 400,
            height: "auto"
        }
    }

    get title() {
        return `${game.i18n.localize(this.options.window.title)}`;
    }

    static PARTS = {
        main: {
            template: `${HYP3E.templatePath}/apps/item-set-dmg-types.hbs`
        },
        footer: {
            template: "templates/generic/form-footer.hbs",
        },
    }


    // ===========================================================================
    // RENDER SETUP
    // ===========================================================================

    async _prepareContext(_options) {
        Hyp3eLogger.info("_prepareContext", `Context options: `, _options);

        const item = await fromUuid(_options.itemUuid)
        if (!item) {
            const msg = `No item found for itemUuid ${target.dataset.itemUuid}!`;
            Hyp3eLogger.warn("_prepareContext", msg)
            ui.notifications.warn(msg)
            return
        }
        this.item = item

        const damageTypes = CONFIG.HYP3E.damageTypes

        // Setup our return context
        const context = {
            itemUuid: _options.itemUuid,
            item: item,
            damageTypes: damageTypes,
            buttons: [
                { type: "submit", icon: "fa-solid fa-save", label: "SETTINGS.Save" }
            ]
        }

        // Get the item's base damage type -- there should be exactly one!
        const dmgType = item.system?.dmgType || "basic";
        const damage = item.system.damage
        context[`dmgType`] = dmgType;
        context[`damage`] = damage;

        // Get the item's alt damage types -- there should be no more than three!
        const altDmg = item.system.altDmg || {};
        const altDmgEntries = Object.entries(altDmg);
        // Unpack up to 3 alt damage pairs into flat fields
        for (let i = 0; i < 3; i++) {
            const n = i + 1;
            if (i < altDmgEntries.length) {
                const [type, value] = altDmgEntries[i];
                context[`damageType${n}`] = type;
                context[`altDmg${n}`] = value;
            } else {
                context[`damageType${n}`] = "";
                context[`altDmg${n}`] = "";
            }
        }

        Hyp3eLogger.info("_prepareContext", `Return context: `, context);
        return context;
    }

    _onRender(context, options) {
        Hyp3eLogger.info("_onRender", `Render context: `, context);
        Hyp3eLogger.info("_onRender", `Render options: `, options);
        super._onRender(context, options);
    }


    // ===========================================================================
    // UPDATING
    // ===========================================================================

    static async #onSubmit(event, form, formData) {
        Hyp3eLogger.info("#onSubmit", `Submit event:`, event);
        Hyp3eLogger.info("#onSubmit", `Submit form data:`, formData);

        const formDataObj = foundry.utils.expandObject(formData.object);
        const itemUuid = this.itemUuid

        if (!this.item) {
            const msg = `No item found for itemUuid ${itemUuid}!`;
            Hyp3eLogger.warn("#onSubmit", msg)
            ui.notifications.warn(msg);
            return
        }
        Hyp3eLogger.info("#onSubmit", `Item:`, this.item);

        const dmgType = formDataObj[`dmgType`]?.trim();

        // Clean up formData so Foundry doesn’t auto-set these fields elsewhere
        delete formDataObj[`dmgType`];
        delete formDataObj[`damage`];

        // Delete the existing altDmg, then recreate it from the form data
        await this.item.update({ "system.altDmg": null });

        const altDmg = {};

        for (let i = 1; i <= 3; i++) {
            const type = formDataObj[`damageType${i}`]?.trim();
            const value = formDataObj[`altDmg${i}`]?.trim();

            // Skip blank or incomplete pairs
            if (type && value) {
                altDmg[type] = value;
            }

            // Clean up formData so Foundry doesn’t auto-set these fields elsewhere
            delete formDataObj[`damageType${i}`];
            delete formDataObj[`altDmg${i}`];
        }

        // Log the results and update the item
        Hyp3eLogger.info("#onSubmit", `Alternate Damage Types:`, altDmg);
        try {
            await this.item.update({ "system.dmgType": dmgType, "system.altDmg": altDmg })
        } catch(err) {
            Hyp3eLogger.error("#onSubmit", `Item damage types update error!`, err);
        }
    }
}