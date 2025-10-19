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
        position: { width: 500, height: "auto" },
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

        Hooks.on("controlToken", (token, controlled) => {
            const selectedTokens = canvas.tokens.controlled;
            for (const [uuid, app] of this.instances ?? []) {
                const stillSelected = selectedTokens.some(t => t.actor?.uuid === uuid);
                if (!stillSelected) app.close();
            }
        });
    }

    static openForActor(actor) {
        // Ensure global hook exists
        this.initialize();

        // Keep one instance per actor
        const existing = this.instances?.get(actor.uuid);
        if (existing) return existing.render(true);

        const app = new this(actor);
        this.instances ??= new Map();
        this.instances.set(actor.uuid, app);
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
        Hyp3eLogger.info("_onControlToken", `Currently controlled tokens:`, selectedTokens)
        // If our actor's token is not among the currently selected tokens, close the app
        const ourTokenStillSelected = selectedTokens.some(t => t.actor?.uuid === this.actor.uuid);
        if (!ourTokenStillSelected) {
            this.close();
        }
    }

    /** Clean up hook when app closes */
    async close(options = {}) {
        this.constructor.instances?.delete(this.actor.uuid);
        return super.close(options);
    }

    async _prepareContext(options) {
        Hyp3eLogger.info("_prepareContext", `Actor:`, this.actor);
        const dex = this.actor.system.attributes.dex.value ?? 0;

        const weapons = this.actor.items.filter(i => i.type === "weapon");
        const shields = this.actor.items.filter(i => i.type === "shield");

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

        return { mainHand, offHand };
    }

    static async #equipItem(event, target) {
        Hyp3eLogger.info("#equipItem", `Incoming parameters:`, {event, target});
        const itemId = target.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (!item) return;

        const currentlyEquipped = item.system.equipped;
        await item.update({ "system.equipped": !currentlyEquipped });
        // Pause to let items update, then re-render the app
        setTimeout(() => this.render(false), 250);
    }
}
