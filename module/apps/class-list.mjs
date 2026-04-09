// systems/hyp3e/module/apps/class-list.mjs
import { HYP3E } from "../helpers/config.mjs"
import { Hyp3eLogger } from "../helpers/logger.mjs";
import { HYP3EClassEditor } from "./class-editor.mjs";

const { 
    ApplicationV2, 
    HandlebarsApplicationMixin 
} = foundry.applications.api

export class HYP3ECustomClassList extends HandlebarsApplicationMixin(ApplicationV2) {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        id: "hyp3e-class-list",
        tag: 'section',
        window: {
            title: "Custom Class List",
            icon: "fa-solid fa-book",
        },
        position: {
            width: 400,
            height: "auto",
        },
        actions: {
            newClass: HYP3ECustomClassList.#newClass,
            editClass: HYP3ECustomClassList.#editClass,
            deleteClass: HYP3ECustomClassList.#deleteClass
        }
    }
    /** @inheritDoc */
    static PARTS = {
        form: {
            template: `${HYP3E.templatePath}/apps/class-list.hbs`,
        }
    }

    // getData() {
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        const classData = game.settings.get(game.system.id, "customClassData") || {};
        Hyp3eLogger.info("_prepareContext", "Custom class data", classData);
        context.classes = classData;
        return context;
    }

    // activateListeners(htmlData) {
    //     super.activateListeners(htmlData);
    //     const html = $(htmlData); // Wrap in jQuery

        // html.find(".edit-class").on("click", ev => {
        //     const className = ev.currentTarget.dataset.class;
        //     const classData = game.settings.get(game.system.id, "customClassData")[className];
        //     Hyp3eLogger.info("edit-class onClick", `Editing class: ${className}`, classData);
        //     // Open the class editor with the existing class data
        //     new HYP3EClassEditor(className, classData).render(true);
        //     this.close();
        // });

        // html.find(".new-class").on("click", () => {
        //     // Open the class editor with no class data
        //     new HYP3EClassEditor(null, {}).render(true);
        //     this.close();
        // });

        // html.find(".delete-class").on("click", async ev => {
        //     const className = ev.currentTarget.dataset.class;
        //     const confirmed = confirm(`Are you sure you want to delete the class "${className}"?`);
        //     if (!confirmed) return;

        //     const allClasses = duplicate(game.settings.get(game.system.id, "customClassData"));
        //     delete allClasses[className];
        //     await game.settings.set(game.system.id, "customClassData", allClasses);

        //     // Re-render the list app to update the UI
        //     this.render(true);
        // });
    // }

    static #newClass(event, target) {
        // Open the class editor with no class data
        new HYP3EClassEditor(null, {}).render(true);
        this.close();
    }

    static #editClass(event, target) {
        const className = target.dataset.class;
        const classData = game.settings.get(game.system.id, "customClassData")[className];
        Hyp3eLogger.info("editClass", `Editing class: ${className}`, classData);
        // Open the class editor with the existing class data
        new HYP3EClassEditor(className, classData).render(true);
        this.close();
    }

    static async #deleteClass(event, target) {
        const className = target.dataset.class;
        const confirmed = confirm(`Are you sure you want to delete the class "${className}"?`);
        if (!confirmed) return;

        const allClasses = foundry.utils.duplicate(game.settings.get(game.system.id, "customClassData"));
        delete allClasses[className];
        await game.settings.set(game.system.id, "customClassData", allClasses);

        // Re-render the list app to update the UI
        this.render(true);
    }
}