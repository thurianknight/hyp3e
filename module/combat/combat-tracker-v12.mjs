import HYP3E from "../helpers/config.mjs";
import { Hyp3eLogger } from "../helpers/logger.mjs";
import { HYP3EGroupCombat } from "./combat-group.mjs";
import HYP3ECombatGroupSelector from "./combat-set-groups.mjs";

export class HYP3ECombatTracker extends CombatTracker {
    // ===========================================================================
    // APPLICATION SETUP
    // ===========================================================================

    /** @inheritdoc */
    static get defaultOptions() {
        if (super.defaultOptions) {
            // Merge the default options with the custom template path
            return foundry.utils.mergeObject(super.defaultOptions, {
                template: `${HYP3E.templatePath}/sidebar/combat-tracker-v12.hbs`,
            });    
        }
    }

    static GROUP_CONFIG_APP = new HYP3ECombatGroupSelector();

    // ===========================================================================
    // RENDERING
    // ===========================================================================

    // Foundry v12 code
    async getData(options) {
        const context = await super.getData(options);
        const isGroupInitiative = CONFIG.HYP3E.isGroupInitiative;

        // @ts-expect-error - We don't have type data for the combat tracker turn object
        const turns = context.turns.map((turn) => {
            const combatant = game.combat.combatants.get(turn.id);
            turn.isMelee = !!combatant.getFlag(game.system.id, "isMelee")
            turn.isMissile = !!combatant.getFlag(game.system.id, "isMissile")
            turn.isMagic = !!combatant.getFlag(game.system.id, "isMagic")
            turn.isMovement = !!combatant.getFlag(game.system.id, "isMovement")
            turn.isSlowed = !!combatant.isSlowed;
            turn.logLevel = CONFIG.HYP3E.logLevel;
            turn.isOwnedByUser = !!combatant.actor.isOwner;
            turn.initGroup = combatant.initGroup;
            turn.initRoll = Math.floor(combatant.initiative)
            return turn;
        });

        const initGroups = turns.reduce((arr, turn) => {
            const idx = arr.findIndex(r => r.initGroup === turn.initGroup);

            if (idx !== -1) {
                arr[idx].turns.push(turn);
                return arr;
            }

            Hyp3eLogger.info("getData", `Group init scores:`, game.combat.groupInitiativeScores);

            const initiative = game.combat.groupInitiativeScores?.get(turn.initGroup) ? game.combat.groupInitiativeScores.get(turn.initGroup) : null

            return [...arr, {
                initGroup: turn.initGroup,
                label: HYP3EGroupCombat.GROUPS[turn.initGroup],
                initiative: initiative,
                turns: [turn]
            }];
        }, []);

        Hyp3eLogger.info("getData", `Grouped Combat Turns:`, initGroups);
        
        return foundry.utils.mergeObject(context, {
            turns,
            initGroups,
            isGroupInitiative
        })
    }

    // ===========================================================================
    // UI EVENTS
    // ===========================================================================

    activateListeners(html) {
        super.activateListeners(html);
        const trackerHeader = html.find("#combat > header");

        // Reroll group initiative
        html.find('.combat-button[data-control="reroll"]').click((ev) => {      
            game.combat.rollInitiative();
        });

        // Roll for group that the player's combatant is in
        html.find('.combat-button[data-control="rollGroup"]').click((ev) => {
            const combatant = game.combat.combatants.find(c => c.actor.isOwner);
            if (combatant) {
                game.combat.rollInitiative([combatant.id]);
            }
        });

        // Set combat groups
        html.find('.combat-button[data-control="set-groups"]').click((ev) => {
            HYP3ECombatTracker.GROUP_CONFIG_APP.render(true, { focus: true });
        });
    }

    async #toggleFlag(combatant, flag) {
        // Get the flag's current value so we know what to flip it to
        const isActive = !!combatant.getFlag(game.system.id, flag);
        // These combat actions require special logic
        const combatActions = ['isMelee', 'isMissile', 'isMagic', 'isMovement']
        if (combatActions.some(f => f == flag)) {
            // Combat actions can be mutually exclusive, so we may need to toggle multiple flags
            await combatant.setCombatAction(flag, !isActive)            
        } else {
            // Non-combat actions are toggled normally
            await combatant.setFlag(game.system.id, flag, !isActive);
        }
    }

    /**
     * Handle a Combatant control toggle
     * @private
     * @param {Event} event   The originating mousedown event
     */
    async _onCombatantControl(event) {
        event.preventDefault();
        event.stopPropagation();
        const btn = event.currentTarget;
        const li = btn.closest(".combatant");
        const combat = this.viewed;
        const c = combat.combatants.get(li.dataset.combatantId);

        switch ( btn.dataset.control ) {
            case "melee":
                return this.#toggleFlag(c, "isMelee");
            case "missile":
                return this.#toggleFlag(c, "isMissile");
            case "magic":
                return this.#toggleFlag(c, "isMagic");
            case "movement":
                return this.#toggleFlag(c, "isMovement");
            // Fall back to the superclass's button events
            default:
                return super._onCombatantControl(event);
        }
    }

    // ===========================================================================
    // ADDITIONS TO THE COMBATANT CONTEXT MENU
    // ===========================================================================

    _getEntryContextOptions() {
        const options = super._getEntryContextOptions();
        return [
            {
                name: game.i18n.localize("HYP3E.combat.setCombatantAsActive"),
                icon: '<i class="fas fa-star-of-life"></i>',
                callback: (li) => {
                    const combatantId = li.data('combatant-id')
                    const turnToActivate = this.viewed.turns.findIndex(t => t.id === combatantId);
                    this.viewed.activateCombatant(turnToActivate);
                }
            },
            ...options
        ];
    }
}