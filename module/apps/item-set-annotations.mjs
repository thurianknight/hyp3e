import HYP3E from "../helpers/config.mjs";
import { Hyp3eLogger } from "../helpers/logger.mjs";
import { Hyp3eItem } from "../documents/item.mjs";

const {
    HandlebarsApplicationMixin,
    ApplicationV2
} = foundry.applications.api;

export default class HYP3EItemSetAnnotations extends HandlebarsApplicationMixin(ApplicationV2) {
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
        id: "item-set-annotations",
        classes: ["item-set-annotations", "scrollable"],
        tag: "form",
        window: {
            title: "HYP3E.dataLabel.annotations",
            icon: "fa-book",
            contentClasses: ["standard-form"]
        },
        actions: {
            toggleAnnotation: HYP3EItemSetAnnotations.toggleAnnotation
        },
        form: {
            handler: undefined,
            submitOnChange: true,
            closeOnSubmit: false
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
            template: `${HYP3E.templatePath}/apps/item-annotations.hbs`
        }
    }


    // ===========================================================================
    // RENDER SETUP
    // ===========================================================================

    async _prepareContext(_options) {
        Hyp3eLogger.info("_prepareContext", `Item Annotations context options: `, _options);

        const item = await fromUuid(_options.itemUuid)
        if (!item) {
            const msg = `No item found for itemUuid ${target.dataset.itemUuid}!`;
            Hyp3eLogger.warn("_prepareContext", msg);
            ui.notifications.warn(msg);
            return;
        }
        let annotList = CONFIG.HYP3E.weaponAnnotations

        return {
            // Return the item and annotations
            itemUuid: _options.itemUuid,
            item: item,
            annotList: annotList
        }
    }

    _onRender(context, options) {
        Hyp3eLogger.info("_onRender", `Item Annotations render context: `, context);
        Hyp3eLogger.info("_onRender", `Item Annotations render options: `, options);
        super._onRender(context, options);
    }


    // ===========================================================================
    // UPDATING
    // ===========================================================================

    static async toggleAnnotation(event, target) {
        Hyp3eLogger.info("toggleAnnotation", `Toggle Annotation Target:`, target);
        Hyp3eLogger.info("toggleAnnotation", `Toggle Annotation Item ID:`, target.dataset.itemUuid);

        const item = await fromUuid(target.dataset.itemUuid)
        if (!item) {
            const msg = `No item found for itemUuid ${target.dataset.itemUuid}!`;
            Hyp3eLogger.warn("toggleAnnotation", msg);
            ui.notifications.warn(msg);
            return
        }

        // Check to see if the annotation is already in the list, return true or false
        function checkAnnot(annot) {
            return annot != target.dataset.control
        }

        // Toggle this annotation on/off for the item
        let newList = []
        let annotations
        if (item.system?.annotations) {
            annotations = item.system.annotations
        } else {
            annotations = []
        }
        
        // The filter function will delete any entries that match the clicked item, thus toggling it off
        newList = annotations.filter(checkAnnot)
        if (newList.length == annotations.length) {
            // Nothing was deleted, so we will add this to the list, thus toggling it on
            annotations.push(target.dataset.control)
        } else {
            // If something was deleted before, replace annotations with newList
            annotations = newList
        }
        // Log the results and update the item
        Hyp3eLogger.info("toggleAnnotation", `Annotations on ${item.name}: `, annotations);
        await item.update({system: {annotations: annotations}})

        this.render(true, { itemUuid: target.dataset.itemUuid, focus: true })
    }
}