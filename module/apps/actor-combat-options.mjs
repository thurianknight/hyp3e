import HYP3E from "../helpers/config.mjs";
import { Hyp3eLogger } from "../helpers/logger.mjs";
import { Hyp3eActor } from "../documents/actor.mjs";

const {
  HandlebarsApplicationMixin,
  ApplicationV2
} = foundry.applications.api;

export class HYP3EActorCombatOptions extends HandlebarsApplicationMixin(ApplicationV2) {

  // constructor(actorId, options={}) {
  //   super(options);
  //   this.actorId = actorId;
  // }
  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    this._onControlToken = this._onControlToken.bind(this);
  }


  // ===========================================================================
  // APPLICATION SETUP
  // ===========================================================================
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    id: "actor-combat-options",
    classes: ["hyp3e", "actor-combat-options"],
    tag: "form",
    window: {
      title: "HYP3E.dataLabel.combatOptions",
      icon: "fa-swords",
      contentClasses: ["standard-form"]
    },
    actions: {
      toggleOption: HYP3EActorCombatOptions.toggleOption
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
      template: `${HYP3E.templatePath}/apps/actor-combat-options.hbs`
    }
  }

  static initialize() {
    // Only register once
    if (this._hookRegistered) return;
    this._hookRegistered = true;
  }

  static openForActor(actor) {
    // Ensure global hook exists
    this.initialize();
    Hyp3eLogger.info("HYP3EActorCombatOptions openForActor", `Opening Combat Options app for actor ${actor.name}.`)

    // Keep one instance per actor
    const existing = this.instances?.get(actor.uuid);
    if (existing) return existing.render(true);

    const app = new this(actor);
    this.instances ??= new Map();
    this.instances.set(actor.uuid, app);
    app.render(true);

    return app;
  }

  /** Called whenever any token is controlled or released */
  _onControlToken(token, controlled) {
    // If our actor’s token is no longer controlled, or if a different token is now controlled
    const selectedTokens = canvas.tokens.controlled; // currently selected tokens
    // If our actor's token is not among the currently selected tokens, close the app
    const ourTokenStillSelected = selectedTokens.some(t => t.actor?.uuid === this.actor.uuid);
    if (!ourTokenStillSelected) {
      // Hyp3eLogger.info("HYP3EActorCombatOptions _onControlToken", `${this.actor.name} token is no longer selected, closing Combat Options app:`, selectedTokens)
      this.close();
    }
  }

  /** Clean up hook when app closes */
  async close(options = {}) {
    this.constructor.instances?.delete(this.actor.uuid);
    return super.close(options);
  }


  // ===========================================================================
  // RENDER SETUP
  // ===========================================================================

  async _prepareContext(_options) {
    Hyp3eLogger.info("HYP3EActorCombatOptions _prepareContext", `Context options: `, _options);

    // const actor = await fromUuid(_options.actorUuid);
    const actor = this.actor;
    if (!actor) {
      const msg = `No actor provided for Combat Options app!`;
      Hyp3eLogger.warn("HYP3EActorCombatOptions _prepareContext", msg);
      ui.notifications.warn(msg);
      return;
    }
    const actorCombatOptions = actor.system.combatOptions ?? [];
    const combatOptions = CONFIG.HYP3E.combatOptions;

    return {
      // Return the actor and annotations
      actor,
      actorCombatOptions,
      combatOptions
    }
  }

  _onRender(context, options) {
    // Hyp3eLogger.info("_onRender", `Item Annotations render context: `, context);
    // Hyp3eLogger.info("_onRender", `Item Annotations render options: `, options);
    super._onRender(context, options);
  }


  // ===========================================================================
  // UPDATING
  // ===========================================================================

  static async toggleOption(event, target) {
    Hyp3eLogger.info("HYP3EActorCombatOptions toggleOption", `Combat Options Target:`, target);

    const item = await fromUuid(target.dataset.itemUuid)
    if (!item) {
      const msg = `No item found for itemUuid ${target.dataset.itemUuid}!`;
      Hyp3eLogger.warn("HYP3EActorCombatOptions toggleOption", msg);
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
    Hyp3eLogger.info("HYP3EActorCombatOptions toggleOption", `Annotations on ${item.name}: `, annotations);
    await item.update({system: {annotations: annotations}})

    this.render(true, { itemUuid: target.dataset.itemUuid, focus: true })
  }
}