import { Hyp3eLogger } from "../helpers/logger.mjs";
import { HYP3E } from "../helpers/config.mjs"

const {
    HandlebarsApplicationMixin,
    ApplicationV2
} = foundry.applications.api;

export class HYP3EConditionEditor extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "hyp3e-condition-editor",
    tag: 'form',
    classes: ["hyp3e", "condition-editor"],
    window: {
      title: "Effect Conditions",
      icon: "fas fa-gears",
    },
    position: {
      width: 600,
      height: "auto",
    },
    actions: {
      addTest: HYP3EConditionEditor.#addTest,
      delTest: HYP3EConditionEditor.#delTest,
    },
    form: {
      handler: HYP3EConditionEditor.onSubmit
    },
  }

  static PARTS = {
    form: {
      template: `${HYP3E.templatePath}/apps/condition-editor.hbs`,
      scrollable: [""],
    }
  }

  constructor(options = {}) {
    super(options);
    this.effect = options.effect;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options)
    context.effect = this.effect;
    const cond = this.effect.getFlag("hyp3e", "condition") || {
      mode: "all",
      tests: []
    };
    context.condition = cond;
    context.tests = cond.tests;
    Hyp3eLogger.info("HYP3EConditionEditor _prepareContext", `Application context:`, context);
    return context;
  }

  static async #addTest(event, target) {
    Hyp3eLogger.info("HYP3EConditionEditor #addTest", `Adding new conditional test to effect:`, this.effect);
    const cond = this.effect.getFlag("hyp3e", "condition") || { mode: "all", tests: [] };
    const tests = cond.tests;
    tests.push({ key: "", op: "==", value: "" });
    await this.effect.setFlag("hyp3e", "condition", { mode: cond.mode, tests: tests });
    this.render();
  }
  
  static #delTest(event, target) {
    Hyp3eLogger.info("HYP3EConditionEditor #delTest", `Deleting conditional test ${target.dataset.idx} from effect:`, this.effect);
    const idx = Number(target.dataset.idx);
    const cond = this.effect.getFlag("hyp3e", "condition") || { mode: "all", tests: [] };
    cond.tests.splice(idx, 1);
    this.render();
  }

  static async onSubmit(event, form, formData) {
    const app = this; // Application instance
    Hyp3eLogger.info("HYP3EConditionEditor onSubmit", `Submitting condition editor form data:`, formData);

    const condition = {
      mode: formData.object["mode"],
      tests: []
    };

    // Collect tests by index
    const testCount = form.querySelectorAll(".test-row").length;
    for (let i = 0; i < testCount; i++) {
      condition.tests.push({
        key: formData.object[`key-${i}`],
        op: formData.object[`op-${i}`],
        value: formData.object[`value-${i}`]
      });
    }

    // await app.effect.update({"flags.hyp3e.condition": condition});
    await this.effect.setFlag("hyp3e", "condition", condition);
    const msg = `Updated conditions for effect: ${app.effect.name}`;
    ui.notifications.info(msg);
    Hyp3eLogger.info("HYP3EConditionEditor onSubmit", msg, condition);
  }
}
