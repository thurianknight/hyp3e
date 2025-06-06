// systems/hyp3e/module/apps/class-list.mjs
import { HYP3E } from "../helpers/config.mjs"
import { HYP3EClassEditor } from "./class-editor.mjs";

export class HYP3ECustomClassList extends Application {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "hyp3e-class-list",
            title: "Custom Class List",
            template: `${HYP3E.templatePath}/apps/class-list.hbs`,
            width: 400,
            height: "auto",
        });
    }

    getData() {
        const classData = game.settings.get(game.system.id, "customClassData") || {};
        console.log("getData called", classData);
        return { classes: classData };
    }

    activateListeners(htmlData) {
        super.activateListeners(htmlData);
        console.log("activateListeners called.");
        const html = $(htmlData); // Wrap in jQuery

        // console.log("Found edit buttons:", html.find(".edit-class").length);
        // console.log("Found new button:", html.find(".new-class").length);
        // console.log("Found delete buttons:", html.find(".delete-class").length);

        html.find(".edit-class").on("click", ev => {
            const className = ev.currentTarget.dataset.class;
            const classData = game.settings.get(game.system.id, "customClassData")[className];
            console.log(`Editing class: ${className}`, classData);
            // Open the class editor with the existing class data
            new HYP3EClassEditor(className, classData).render(true);
        });

        html.find(".new-class").on("click", () => {
            console.log("Creating new class");
            // Open the class editor with no class data
            new HYP3EClassEditor(null, {}).render(true);
        });

        html.find(".delete-class").on("click", ev => {
            const className = ev.currentTarget.dataset.class;
            const confirmed = confirm(`Are you sure you want to delete the class "${className}"?`);
            if (!confirmed) return;

            const allClasses = duplicate(game.settings.get(game.system.id, "customClassData"));
            delete allClasses[className];
            game.settings.set(game.system.id, "customClassData", allClasses);

            // Re-render the list app to update the UI
            this.render(true);
        });

    }
}
