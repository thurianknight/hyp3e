import { HYP3E } from "../helpers/config.mjs"
import { Hyp3eLogger } from "../helpers/logger.mjs";

const { 
  ApplicationV2, 
  HandlebarsApplicationMixin 
} = foundry.applications.api

export class HYP3EQuickEquipApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["hyp3e", "quick-equip-app"],
    window: {
      title: "Quick-Equip Combat Gear",
      icon: "fas fa-swords"
    },
    position: { width: 400, height: "auto" },
    popOut: true,
    anchor: null,
    actions: {
      equipItem: HYP3EQuickEquipApp.#equipItem
    }
  };

  static PARTS = {
    main: {
      template: `${HYP3E.templatePath}/apps/quick-equip-app.hbs`
    }
  };

  static initialize() {
    // Only register once
    if (this._hookRegistered) return;
    this._hookRegistered = true;

    // Hooks.on("controlToken", (token, controlled) => {
    //   const selectedTokens = canvas.tokens.controlled;
    //   for (const [uuid, app] of this.instances ?? []) {
    //     const stillSelected = selectedTokens.some(t => t.actor?.uuid === uuid);
    //     if (!stillSelected) app.close();
    //   }
    // });
  }

  static openForActor(actor) {
    // Ensure global hook exists
    this.initialize();
    // Hyp3eLogger.info("HYP3EQuickEquipApp openForActor", `Opening Quick-Equip app for actor ${actor.name}`, this)

    // Keep one instance per actor
    // const existing = this.instances?.get(actor.uuid);
    // if (existing) return existing.render(true);

    const app = new this(actor);
    // this.instances ??= new Map();
    // this.instances.set(actor.uuid, app);
    app.render(true);

    return app;
  }

  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    this._onControlToken = this._onControlToken.bind(this);
  }

  /** Called whenever any token is controlled or released */
  _onControlToken(token, controlled) {
    // If our actor’s token is no longer controlled, or if a different token is now controlled
    const selectedTokens = canvas.tokens.controlled; // currently selected tokens
    // If our actor's token is not among the currently selected tokens, close the app
    const ourTokenStillSelected = selectedTokens.some(t => t.actor?.uuid === this.actor.uuid);
    if (!ourTokenStillSelected) {
      // Hyp3eLogger.info("HYP3EQuickEquipApp _onControlToken", `${this.actor.name} token is no longer selected, closing Quick-Equip app:`, selectedTokens)
      this.close();
    }
  }

  /** Clean up hook when app closes */
  async close(options = {}) {
    // this.constructor.instances?.delete(this.actor.uuid);
    return super.close(options);
  }

  async _prepareContext(options) {
    const dex = this.actor.system.attributes.dex.value ?? 0;
    const enableAdvancedCombatOptions = game.settings.get(game.system.id, "enableAdvancedCombatOptions");

    const weapons = this.actor.items.filter(i => i.type === "weapon");
    const shields = this.actor.items.filter(i => i.type === "shield" && i.system.type !== "passive" || (i.type === "armor" && i.system.type === "shield"));
    const advancedOptionsAll = Object.keys(CONFIG.HYP3E.advancedCombatOptions);
    const mid = Math.ceil(advancedOptionsAll.length / 2);
    const advancedOptions1 = {};
    const advancedOptions2 = {};
    advancedOptionsAll.forEach((key, index) => {
      if (index < mid) {
        advancedOptions1[key] = CONFIG.HYP3E.advancedCombatOptions[key];
      } else {
        advancedOptions2[key] = CONFIG.HYP3E.advancedCombatOptions[key];
      }
    });

    // Main hand: All weapons regardless of type
    const mainHand = weapons.map(w => ({
      id: w.id,
      name: w.name,
      img: w.img,
      equipped: w.system.equipped,
      wc: w.system.wc
    }));

    // Off-hand: shields + two-handed weapons
    const offHand = [
      ...shields.map(s => ({
        id: s.id,
        name: s.name,
        img: s.img,
        equipped: s.system.equipped,
        wc: null
      })),
      ...weapons.filter(w => w.system.hands === 2).map(w => ({
        id: w.id,
        name: w.name,
        img: w.img,
        equipped: w.system.equipped,
        wc: w.system.wc
      }))
    ];

    return { mainHand, offHand, enableAdvancedCombatOptions, advancedOptions1, advancedOptions2 };
  }

  async render(...args) {
    await super.render(...args);

    // Wait until the app is in the DOM
    if (!this.rendered) return;

    if (this.element) {
      const el = $(this.element);
      el.find(".window-header").hide();
    }

    // Get the token for this actor
    const token = this.actor.getActiveTokens()[0];
    if (!token) {
      Hyp3eLogger.warn("HYP3EQuickEquipApp render", `Could not get token for actor ${this.actor.name}!`)
      return;
    }

    // Token center in world coordinates
    const tokenCenter = token.center;

    // Convert to screen coordinates
    const screen = canvas.stage.worldTransform.apply(tokenCenter);

    // App size (fallback if height not yet calculated)
    // const appWidth = this.position.width ?? 500;
    const appWidth = this.element.getBoundingClientRect().width || 500;
    const appHeight = this.element.getBoundingClientRect().height || 300;

    // Position app left of token, vertically centered
    const left = screen.x - appWidth - 50;
    const top = screen.y - appHeight / 2;

    // Apply position
    this.setPosition({ left, top });
  }

  static async #equipItem(event, target) {
    const itemId = target.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) {
      Hyp3eLogger.warn("HYP3EQuickEquipApp #equipItem", `Could not get item with ID ${itemId}! Target supplied:`, target);
      return;
    }

    const currentlyEquipped = item.system.equipped;
    await item.update({ "system.equipped": !currentlyEquipped });
    // Pause to let items update, then re-render the app
    setTimeout(() => this.render(false), 250);
  }
}
