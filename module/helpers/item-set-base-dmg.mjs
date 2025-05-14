import HYP3E from "./config.mjs";
import { Hyp3eItem } from "../documents/item.mjs";

const {
    HandlebarsApplicationMixin,
    ApplicationV2
} = foundry.applications.api;

export default class HYP3EItemSetBaseDmg extends HandlebarsApplicationMixin(ApplicationV2) {
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
        id: "item-set-base-dmg",
        classes: ["item-set-base-dmg", "scrollable"],
        tag: "form",
        window: {
            title: "HYP3E.headers.damageType",
            icon: "fa-book",
            contentClasses: ["standard-form"]
        },
        actions: {
            saveChanges: HYP3EItemSetBaseDmg.saveChanges
        },
        form: {
            handler: HYP3EItemSetBaseDmg.#onSubmit,
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
            template: `${HYP3E.templatePath}/apps/item-base-dmg.hbs`
        },
        footer: {
            template: "templates/generic/form-footer.hbs",
        },
    }


    // ===========================================================================
    // RENDER SETUP
    // ===========================================================================

    async _prepareContext(_options) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`_prepareContext: options: `, _options) }

        const item = await fromUuid(_options.itemUuid)
        if (!item) {
            ui.notifications.warn(`No item found for itemUuid ${target.dataset.itemUuid}!`)
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

        if (CONFIG.HYP3E.debugMessages) { console.log(`_prepareContext: return context: `, context) }
        return context;
    }

    _onRender(context, options) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`_prepareContext: render context: `, context) }
        if (CONFIG.HYP3E.debugMessages) { console.log(`_prepareContext: render options: `, options) }
        super._onRender(context, options);
    }


    // ===========================================================================
    // UPDATING
    // ===========================================================================

    static async #onSubmit(event, form, formData) {
        if (CONFIG.HYP3E.debugMessages) {
            console.log(`onSubmit event:`, event)
            console.log(`onSubmit form data:`, formData)
        }
        const formDataObj = foundry.utils.expandObject(formData.object);
        const itemUuid = this.itemUuid

        if (!this.item) {
            ui.notifications.warn(`No item found for itemUuid ${itemUuid}!`)
            return
        }
        if (CONFIG.HYP3E.debugMessages) { console.log(`onSubmit: item:`, this.item) }

        const dmgType = formDataObj[`dmgType`]?.trim();

        // Skip blank or incomplete value, do not update
        if (!dmgType || dmgType == "") {
            return false;
        }

        // Optional: clean up formData so Foundry doesn’t auto-set these fields elsewhere
        delete formDataObj[`dmgType`];
        delete formDataObj[`damage`];

        // Log the results and update the item
        if (CONFIG.HYP3E.debugMessages) { console.log(`onSubmit:`, dmgType) }
        try {
            await this.item.update({ "system.dmgType": dmgType })
        } catch(err) {
            console.error(`Item update error!`, err)
        }
    }
}