import HYP3E from "./config.mjs";
import { Hyp3eItem } from "../documents/item.mjs";

const {
    HandlebarsApplicationMixin,
    ApplicationV2
} = foundry.applications.api;

export default class HYP3EItemSetAltDmg extends HandlebarsApplicationMixin(ApplicationV2) {
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
        id: "item-set-alt-dmg",
        classes: ["item-set-alt-dmg", "scrollable"],
        tag: "form",
        window: {
            title: "HYP3E.dataLabel.altDmg",
            icon: "fa-book",
            contentClasses: ["standard-form"]
        },
        actions: {
            saveChanges: HYP3EItemSetAltDmg.saveChanges
        },
        form: {
            handler: HYP3EItemSetAltDmg.#onSubmit,
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
            template: `${HYP3E.templatePath}/apps/item-alt-dmg.hbs`
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
        // const item = await fromUuid(this.itemUuid)

        if (!this.item) {
            ui.notifications.warn(`No item found for itemUuid ${itemUuid}!`)
            return
        }
        // Delete the existing altDmg, then recreate from the form data
        await this.item.update({ "system.altDmg": null });
        if (CONFIG.HYP3E.debugMessages) { console.log(`onSubmit: item:`, this.item) }
        const altDmg = {};

        for (let i = 1; i <= 3; i++) {
            const type = formDataObj[`damageType${i}`]?.trim();
            const value = formDataObj[`altDmg${i}`]?.trim();

            // Skip blank or incomplete pairs
            if (type && value) {
                altDmg[type] = value;
            }

            // Optional: clean up formData so Foundry doesn’t auto-set these fields elsewhere
            delete formDataObj[`damageType${i}`];
            delete formDataObj[`altDmg${i}`];
        }

        // Log the results and update the item
        if (CONFIG.HYP3E.debugMessages) { console.log(`onSubmit:`, altDmg) }
        try {
            await this.item.update({ "system.altDmg": altDmg })
        } catch(err) {
            console.error(`Item update error!`, err)
        }
    }
}