import HYP3E from "../helpers/config.mjs";
import { HYP3EGroupCombat } from "./combat-group.mjs";
import HYP3ECombatGroupSelector from "./combat-set-groups.mjs";
import { HYP3ECombatant } from "./combatant.mjs";

export class HYP3ECombatTab extends CombatTracker {
    // ===========================================================================
    // APPLICATION SETUP
    // ===========================================================================

    // Foundry v12 code
    /** @inheritdoc */
    static get defaultOptions() {
        if (super.defaultOptions) {
            // if (CONFIG.HYP3E.debugMessages) { console.log(`Loading template ${HYP3E.templatePath}/sidebar/combat-tracker-v12.hbs...`) }
            // if (CONFIG.HYP3E.debugMessages) { console.log(`HYP3ECombatTab defaultOptions: `, super.defaultOptions) }
            // Merge the default options with the custom template path
            return foundry.utils.mergeObject(super.defaultOptions, {
                template: `${HYP3E.templatePath}/sidebar/combat-tracker-v12.hbs`,
            });    
        }
    }

    // Foundry v13 code
    /*
    // Merge parent CombatTracker default options + custom options
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS,{
        actions: {
            melee: HYP3ECombatTab._onCombatantControl,
            missile: HYP3ECombatTab._onCombatantControl,
            magic: HYP3ECombatTab._onCombatantControl,
            movement: HYP3ECombatTab._onCombatantControl,
        }
    })
    // Load the new combat-tracker template
    static PARTS = {
        header: {
            template: `${HYP3E.templatePath}/sidebar/combat-header.hbs`
        },
        tracker: {
            template: `${HYP3E.templatePath}/sidebar/combat-tracker.hbs`
        },
        footer: {
            template: `${HYP3E.templatePath}/sidebar/combat-footer.hbs`
        }
    }
    */

    static GROUP_CONFIG_APP = new HYP3ECombatGroupSelector();


    // ===========================================================================
    // RENDERING
    // ===========================================================================

    // Foundry v12 code
    async getData(options) {
        const context = await super.getData(options);
        // Log the context object
        // if (CONFIG.HYP3E.debugMessages) { console.log("Sidebar getData: Combat Tab Context: ", context) }
        
        const isGroupInitiative = CONFIG.HYP3E.isGroupInitiative;

        // @ts-expect-error - We don't have type data for the combat tracker turn object
        const turns = context.turns.map((turn) => {
            const combatant = game.combat.combatants.get(turn.id);
            // if (CONFIG.HYP3E.debugMessages) { console.log(`Turn ${turn.name} Combatant: `, combatant) }
            turn.isMelee = !!combatant.getFlag(game.system.id, "isMelee")
            turn.isMissile = !!combatant.getFlag(game.system.id, "isMissile")
            turn.isMagic = !!combatant.getFlag(game.system.id, "isMagic")
            turn.isMovement = !!combatant.getFlag(game.system.id, "isMovement")
            turn.isSlowed = !!combatant.isSlowed;
            turn.debugMessages = CONFIG.HYP3E.debugMessages;
            turn.isOwnedByUser = !!combatant.actor.isOwner;
            turn.group = combatant.group;
            // if (!isGroupInitiative) turn.initRoll = Math.floor(combatant.initiative)
            turn.initRoll = Math.floor(combatant.initiative)
            // if (CONFIG.HYP3E.debugMessages) { console.log(`Sidebar getData: Combatant Turn: `, turn) }
            return turn;
        });

        const groups = turns.reduce((arr, turn) => {
            const idx = arr.findIndex(r => r.group === turn.group);

            if (idx !== -1) {
                arr[idx].turns.push(turn);
                return arr;
            }

            // if (CONFIG.HYP3E.debugMessages) { console.log(`Sidebar getData: Group Initiative object: `, game.combat.groupInitiativeScores) }
            const initiative = game.combat.groupInitiativeScores?.get(turn.group) ? game.combat.groupInitiativeScores.get(turn.group) : null
            // if (CONFIG.HYP3E.debugMessages) { console.log(`Sidebar getData: Group ${turn.group} Initiative: `, initiative) }

            return [...arr, {
                group: turn.group,
                label: HYP3EGroupCombat.GROUPS[turn.group],
                initiative: initiative,
                turns: [turn]
            }];
        }, []);
        // if (CONFIG.HYP3E.debugMessages) { console.log("Sidebar getData: Grouped Combat Turns: ", groups) }
        
        return foundry.utils.mergeObject(context, {
            turns,
            groups,
            isGroupInitiative
        })
    }

    // Foundry v13 code
    /*
    async _prepareCombatContext(context, options) {
        // Log incoming parameters
        console.log("Combat Context: ", context, options)
        
        // Prepare the combat context
        await super._prepareCombatContext(context, options);
        // Add group initiative flag
        const isGroupInitiative = CONFIG.HYP3E.isGroupInitiative;
        this.isGroupInitiative = isGroupInitiative;
        context.isGroupInitiative = isGroupInitiative;
    }
    
    async _prepareTrackerContext(context, options) {
        // Log incoming parmeters
        console.log("Combat Tracker Context: ", context, options)
        // Log the combat object
        console.log("Combat Tracker Combat: ", this.viewed)

        // Prepare the combat tracker context
        await super._prepareTrackerContext(context, options);

        if (context.turns && context.turns.length > 0) {
            const groups = context.turns.reduce((arr, turn) => {
                const idx = arr.findIndex(r => r.group === turn.group);

                if (idx !== -1) {
                    arr[idx].turns.push(turn);
                    return arr;
                }

                if (CONFIG.HYP3E.debugMessages) { console.log("Group Initiative Scores: ", game.combat.groupInitiativeScores) }
                const initiative = game.combat.groupInitiativeScores?.get(turn.group) ? game.combat.groupInitiativeScores.get(turn.group) : null

                return [...arr, {
                    group: turn.group,
                    label: HYP3EGroupCombat.GROUPS[turn.group],
                    initiative: initiative,
                    turns: [turn]
                }];
            }, []);

            // Log the initiative groups
            if (CONFIG.HYP3E.debugMessages) { console.log("Initiative Groups: ", groups) }
            context.groups = groups;
        }

    }

    async _prepareTurnContext(combat, combatant, index) {
        // Log incoming parameters
        console.log("Combat Tab Combatant: ", combatant)
        // Log the combat object
        console.log("Combat Tab Combat: ", combat)
        // Prepare the combatant context
        const turn = await super._prepareTurnContext(combat, combatant, index);
        // Log the turn context
        // if (CONFIG.HYP3E.debugMessages) { console.log("Combat Turn: ", turn) }

        // Add group initiative flag
        const isGroupInitiative = CONFIG.HYP3E.isGroupInitiative;
        turn.isGroupInitiative = isGroupInitiative;

        // Add all of our custom flags to the combatant context
        turn.isMelee = !!combatant.getFlag(game.system.id, "isMelee")
        turn.isMissile = !!combatant.getFlag(game.system.id, "isMissile")
        turn.isMagic = !!combatant.getFlag(game.system.id, "isMagic")
        turn.isMovement = !!combatant.getFlag(game.system.id, "isMovement")
        turn.isSlowed = !!combatant.isSlowed;
        turn.debugMessages = CONFIG.HYP3E.debugMessages;
        turn.isOwnedByUser = !!combatant.actor.isOwner;
        turn.group = combatant.group;
        if (!isGroupInitiative) turn.initRoll = Math.floor(combatant.initiative)

        if (CONFIG.HYP3E.debugMessages) { console.log(`Turn Context: `, turn) }
        return turn;

    }
    */

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
            HYP3ECombatTab.GROUP_CONFIG_APP.render(true, { focus: true });
        });
    }

    async #toggleFlag(combatant, flag) {
        // Get the flag's current value so we know what to flip it to
        const isActive = !!combatant.getFlag(game.system.id, flag);
        // These combat actions require special logic
        const combatActions = ['isMelee', 'isMissile', 'isMagic', 'isMovement']
        // if (CONFIG.HYP3E.debugMessages) { console.log(`Toggling combatant flag ${flag} to ${!isActive}...`) }
        if (combatActions.some(f => f == flag)) {
            // Combat actions can be mutually exclusive, so we may need to toggle multiple flags
            await combatant.setCombatAction(flag, !isActive)            
        } else {
            // Non-combat actions are toggled normally
            await combatant.setFlag(game.system.id, flag, !isActive);
        }
        // if (CONFIG.HYP3E.debugMessages) { console.log(`Combatant Toggle Flag: ${flag}`, combatant) }
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
        // if (CONFIG.HYP3E.debugMessages) { console.log(`Combatant Control Button: `, btn) }
        const li = btn.closest(".combatant");
        // if (CONFIG.HYP3E.debugMessages) { console.log(`Combatant item: `, li) }
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
    // if (CONFIG.HYP3E.debugMessages) { console.log(`Combatant Context Options: `, options) }
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