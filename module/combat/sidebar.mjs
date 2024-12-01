import HYP3E from "../helpers/config.mjs";
import { HYP3EGroupCombat } from "./combat-group.mjs";
import HYP3ECombatGroupSelector from "./combat-set-groups.mjs";
import { HYP3ECombatant } from "./combatant.mjs";

export class HYP3ECombatTab extends CombatTracker {
    // ===========================================================================
    // APPLICATION SETUP
    // ===========================================================================

    /** @inheritdoc */
    static get defaultOptions() {
        console.log(`Loading template ${HYP3E.templatePath}/sidebar/combat-tracker.hbs...`)
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: `${HYP3E.templatePath}/sidebar/combat-tracker.hbs`,
        });
    }

    static GROUP_CONFIG_APP = new HYP3ECombatGroupSelector();


    // ===========================================================================
    // RENDERING
    // ===========================================================================

    async getData(options) {
        const context = await super.getData(options);
        const isGroupInitiative = CONFIG.HYP3E.isGroupInitiative;

        // @ts-expect-error - We don't have type data for the combat tracker turn object
        const turns = context.turns.map((turn) => {
            const combatant = game.combat.combatants.get(turn.id);
            // turn.isSlowed = turn.initiative === `${HYP3ECombatant.INITIATIVE_VALUE_SLOWED}`
            // turn.isCasting = !!combatant.getFlag(game.system.id, "prepareSpell");
            // turn.isRetreating = !!combatant.getFlag(game.system.id, "moveInCombat");
            turn.isMelee = !!combatant.getFlag(game.system.id, "isMelee")
            turn.isMissile = !!combatant.getFlag(game.system.id, "isMissile")
            turn.isMagic = !!combatant.getFlag(game.system.id, "isMagic")
            turn.isMovement = !!combatant.getFlag(game.system.id, "isMovement")
            turn.isOwnedByUser = !!combatant.actor.isOwner;
            turn.group = combatant.group;
            // if (CONFIG.HYP3E.debugMessages) { console.log(`Combatant Turn: `, turn) }
            return turn;
        });

        const groups = turns.reduce((arr, turn) => {
            const idx = arr.findIndex(r => r.group === turn.group);

            if (idx !== -1) {
                arr[idx].turns.push(turn);
                return arr;
            }

            // if (CONFIG.HYP3E.debugMessages) { console.log("Group Initiative Scores: ", game.combat.groupInitiativeScores) }
            const initiative = game.combat.groupInitiativeScores.get(turn.group) ? game.combat.groupInitiativeScores.get(turn.group) : null

            return [...arr, {
                group: turn.group,
                label: HYP3EGroupCombat.GROUPS[turn.group],
                initiative: initiative,
                turns: [turn]
            }];
        }, []);
        
        return foundry.utils.mergeObject(context, {
            turns,
            groups,
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

        html.find('.combat-button[data-control="set-groups"]').click((ev) => {
            HYP3ECombatTab.GROUP_CONFIG_APP.render(true, { focus: true });
        });
    }

    async #toggleFlag(combatant, flag) {
        // Get the flag's current value so we know what to flip it to
        const isActive = !!combatant.getFlag(game.system.id, flag);
        // These combat actions require special logic
        const combatActions = ['isMelee', 'isMissile', 'isMagic', 'isMovement']
        if (CONFIG.HYP3E.debugMessages) { console.log(`Toggling combatant flag ${flag} to ${!isActive}...`) }
        if (combatActions.some(f => f == flag)) {
            // Combat actions can be mutually exclusive, so we need to toggle multiple flags here
            await combatant.setCombatAction(flag, !isActive)            
        } else {
            // Non-combat actions are toggled normally
            await combatant.setFlag(game.system.id, flag, !isActive);
        }
        if (CONFIG.HYP3E.debugMessages) { console.log(`Combatant Toggle Flag: ${flag}`, combatant) }
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