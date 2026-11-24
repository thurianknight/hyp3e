import { HYP3E } from "../helpers/config.mjs";
import { Hyp3eLogger } from "../helpers/logger.mjs";

const { 
  HandlebarsApplicationMixin,
  ApplicationV2
} = foundry.applications.api;

export default class HYP3EItemSetConditionalMods extends HandlebarsApplicationMixin(ApplicationV2) {

  // ===========================================================================
  // APPLICATION SETUP
  // ===========================================================================

  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    id: "item-set-conditional-mods",
    classes: ["hyp3e", "item-set-conditional-mods"],
    tag: "form",
    window: {
      title: "HYP3E.conditionalMods.title",
      icon: "fas fa-cogs",
      contentClasses: ["standard-form"]
    },
    position: { 
      width: 620, 
      height: "auto" 
    },
    form: {
      handler: HYP3EItemSetConditionalMods.#onSubmit,
      submitOnChange: false,
      closeOnSubmit: true
    },
    actions: {
      addMod: HYP3EItemSetConditionalMods.#onAddMod,
      deleteMod: HYP3EItemSetConditionalMods.#onDeleteMod
    }
  };

  static PARTS = {
    main: {
      template: `${HYP3E.templatePath}/apps/item-set-conditional-mods.hbs`
    }
  };

  constructor(item, options = {}) {
    super(options);
    this.item = item;
  }


  // ===========================================================================
  // RENDER SETUP
  // ===========================================================================

  async _prepareContext(options) {
    Hyp3eLogger.info("HYP3EItemSetConditionalMods _prepareContext", `Context options: `, options);

    // const item = await fromUuid(options.itemUuid)
    const item = options.item ?? this.item;
    if (!item) {
      const msg = `No item found in context!`;
      Hyp3eLogger.warn("HYP3EItemSetConditionalMods _prepareContext", msg)
      ui.notifications.warn(msg)
      return
    }
    this.item = item
    Hyp3eLogger.info("HYP3EItemSetConditionalMods _prepareContext", `Item: `, this.item);

    const mods = foundry.utils.deepClone(this.item.system.conditionalMods ?? []);
    return {
      itemUuid: options.itemUuid,
      item: this.item,
      mods,
      // helpers for the template
      operators: {
        "==": "equal to",
        "!=": "not equal to",
        "incl": "includes",
        "in": "is one of"
      },
      sources: {
        target: "Target",
        wielder: "Wielder"
      }
    };
  }


  // ===========================================================================
  // UPDATING
  // ===========================================================================

  static async #onSubmit(event, form, formData) {
    const app = this; // ApplicationV2 binds `this` to the instance
    const expanded = foundry.utils.expandObject(formData.object);
    const mods = Object.values(expanded.mods ?? {});

    await app.item.update({ "system.conditionalMods": mods });
  }

  static async #onAddMod(event, target) {
    Hyp3eLogger.info("HYP3EItemSetConditionalMods #onAddMod", `Adding a new conditional mod...`, target);

    const app = this;
    const mods = foundry.utils.deepClone(app.item.system.conditionalMods ?? []);
    mods.push({
      attack: 0,
      damage: 0,
      dmgFormula: "",
      dmgFormula2h: "",
      condition: {
        source: "target",
        systemPath: "",
        operator: "==",
        value: ""
      }
    });
    await app.item.update({ "system.conditionalMods": mods });
    // Force re-render with the temporary data
    // app._mods = mods;          // temporary store
    app.render(true);
  }

  static async #onDeleteMod(event, target) {
    const index = Number(target.dataset.index);
    const app = this;
    const mods = foundry.utils.deepClone(app.item.system.conditionalMods ?? []);
    mods.splice(index, 1);
    await app.item.update({ "system.conditionalMods": mods });
    // app._mods = mods;
    app.render();
  }
}