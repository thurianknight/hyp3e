// systems/hyp3e/module/apps/class-list.mjs
import { HYP3E } from "../helpers/config.mjs"
import { Hyp3eLogger } from "../helpers/logger.mjs";
import { HYP3EClassEditor } from "./class-editor.mjs";

export class HYP3ECustomClassList extends Application {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "hyp3e-class-list",
            title: "Custom Class List",
            template: `${HYP3E.templatePath}/apps/class-list.hbs`,
            width: 400,
            height: "auto",
        });
    }

    getData() {
        const classData = game.settings.get(game.system.id, "customClassData") || {};
        Hyp3eLogger.info("getData", "Custom class data", classData);
        return { classes: classData };
    }

    activateListeners(htmlData) {
        super.activateListeners(htmlData);
        const html = $(htmlData); // Wrap in jQuery

        html.find(".edit-class").on("click", ev => {
            const className = ev.currentTarget.dataset.class;
            const classData = game.settings.get(game.system.id, "customClassData")[className];
            Hyp3eLogger.info("edit-class onClick", `Editing class: ${className}`, classData);
            // Open the class editor with the existing class data
            new HYP3EClassEditor(className, classData).render(true);
            this.close();
        });

        html.find(".new-class").on("click", () => {
            // Open the class editor with no class data
            new HYP3EClassEditor(null, {}).render(true);
            this.close();
        });

        html.find(".delete-class").on("click", async ev => {
            const className = ev.currentTarget.dataset.class;
            const confirmed = confirm(`Are you sure you want to delete the class "${className}"?`);
            if (!confirmed) return;

            const allClasses = duplicate(game.settings.get(game.system.id, "customClassData"));
            delete allClasses[className];
            await game.settings.set(game.system.id, "customClassData", allClasses);

            // Re-render the list app to update the UI
            this.render(true);
        });

    }
}
