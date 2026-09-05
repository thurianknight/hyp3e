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

    const app = new this(actor);
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
    return super.close(options);
  }


  // ===========================================================================
  // RENDER SETUP
  // ===========================================================================

  async _prepareContext(_options) {
    Hyp3eLogger.info("HYP3EActorCombatOptions _prepareContext", `Context options: `, _options);

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

    // const id = target.dataset.optionId;
    const actor = this.actor;
    if (!actor) {
      const msg = `No actor found to apply combat option ${target.dataset.optionId}!`;
      Hyp3eLogger.warn("HYP3EActorCombatOptions toggleOption", msg);
      ui.notifications.warn(msg);
      return;
    }

    // Toggle this option on/off for the actor
    const combatOptions = actor.system?.combatOptions ?? [];
    const optionId = target.dataset.optionId;

    // The filter function will remove any entries that match the clicked item, thus toggling it off
    const newList = combatOptions.includes(optionId)
      ? combatOptions.filter(id => id !== optionId)  // was present, so remove it
      : [...combatOptions, optionId];                // was missing, so add it

    // Log the results and update the actor
    Hyp3eLogger.info("HYP3EActorCombatOptions toggleOption", `Combat Options on ${actor.name}: `, newList);
    await actor.update({ "system.combatOptions": newList });

    this.render(true, { actor: this.actor, focus: true })
  }
}