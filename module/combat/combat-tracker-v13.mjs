import HYP3E from "../helpers/config.mjs";
import { HYP3EGroupCombat } from "./combat-group.mjs";
import HYP3ECombatGroupSelector from "./combat-set-groups.mjs";

export class HYP3ECombatTracker extends CombatTracker {
    // ===========================================================================
    // APPLICATION SETUP
    // ===========================================================================

    // Merge parent CombatTracker default options + custom options
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS,{
        actions: {
            melee: HYP3ECombatTracker._onCombatantControl,
            missile: HYP3ECombatTracker._onCombatantControl,
            magic: HYP3ECombatTracker._onCombatantControl,
            movement: HYP3ECombatTracker._onCombatantControl,
        }
    })
    // Load the new combat-tracker templates
    static PARTS = {
        header: {
            template: `${HYP3E.templatePath}/sidebar/combat-header-v13.hbs`
        },
        tracker: {
            template: `${HYP3E.templatePath}/sidebar/combat-tracker-v13.hbs`
        },
        footer: {
            template: `${HYP3E.templatePath}/sidebar/combat-footer-v13.hbs`
        }
    }

    static GROUP_CONFIG_APP = new HYP3ECombatGroupSelector();


    // ===========================================================================
    // RENDERING
    // ===========================================================================

    async _prepareCombatContext(context, options) {
        // Log incoming parameters
        console.log("_prepareCombatContext: incoming Context: ", context, options)
        // Prepare the combat context
        await super._prepareCombatContext(context, options);
        // Add group initiative flag
        const isGroupInitiative = CONFIG.HYP3E.isGroupInitiative;
        this.isGroupInitiative = isGroupInitiative;
        context.isGroupInitiative = isGroupInitiative;
    }

    async _prepareTrackerContext(context, options) {
        // Log incoming parmeters
        console.log("_prepareTrackerContext: Context: ", context, options)
        // Log the combat object
        console.log("_prepareTrackerContext: Combat: ", this.viewed)
        // Prepare the combat tracker context
        await super._prepareTrackerContext(context, options);

        // Only needed for group initiative
        if (CONFIG.HYP3E.isGroupInitiative) {
            if (context.turns && context.turns.length > 0) {
                const initGroups = context.turns.reduce((arr, turn) => {
                    const idx = arr.findIndex(r => r.initGroup === turn.initGroup);

                    if (idx !== -1) {
                        arr[idx].turns.push(turn);
                        return arr;
                    }

                    if (CONFIG.HYP3E.debugMessages) { console.log("_prepareTrackerContext: Group Init Scores: ", game.combat.groupInitiativeScores) }
                    const initiative = game.combat.groupInitiativeScores?.get(turn.initGroup) ? game.combat.groupInitiativeScores.get(turn.initGroup) : null

                    return [...arr, {
                        initGroup: turn.initGroup,
                        label: HYP3EGroupCombat.GROUPS[turn.initGroup],
                        initiative: initiative,
                        turns: [turn]
                    }];
                }, []);

                // Log the initiative groups
                if (CONFIG.HYP3E.debugMessages) { console.log("_prepareTrackerContext: Init Groups: ", initGroups) }
                context.initGroups = initGroups;
            }    
        }

    }

    async _prepareTurnContext(combat, combatant, index) {
        // Log incoming parameters
        console.log("_prepareTurnContext: Combatant: ", combatant)
        // Log the combat object
        console.log("_prepareTurnContext: Combat: ", combat)
        // Prepare the combatant context
        const turn = await super._prepareTurnContext(combat, combatant, index);
        // Log the turn context
        // if (CONFIG.HYP3E.debugMessages) { console.log("_prepareTurnContext: Turn: ", turn) }

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

        // Only needed for group initiative
        if (isGroupInitiative) turn.initGroup = combatant.initGroup;
        // Otherwise...
        if (!isGroupInitiative) turn.initRoll = Math.floor(combatant.initiative)

        if (CONFIG.HYP3E.debugMessages) { console.log(`_prepareTurnContext: Turn: `, turn) }
        return turn;

    }


    // ===========================================================================
    // UI EVENTS
    // ===========================================================================

    // activateListeners(html) {
    _onRender(context, options) {
        const html = $(this.element);
        super._onRender(context, options);
        // super.activateListeners(html);

        // Reroll group initiative
        html.find('.combat-control[data-action="reroll"]').click((ev) => {      
            game.combat.rollInitiative();
        });

        // Roll for group that the player's combatant is in
        html.find('.combat-control[data-action="rollGroup"]').click((ev) => {
            const combatant = game.combat.combatants.find(c => c.actor.isOwner);
            if (combatant) {
                game.combat.rollInitiative([combatant.id]);
            }
        });

        // Set initiative groups
        html.find('.combat-control[data-action="set-groups"]').click((ev) => {
            HYP3ECombatTracker.GROUP_CONFIG_APP.render(true, { focus: true });
        });
    }

    // Toggle combat action flags on and off
    async _toggleFlag(combatant, flag) {
        // Get the flag's current value so we know what to flip it to
        const isActive = !!combatant.getFlag(game.system.id, flag);
        // These combat actions require special logic
        const combatActions = ['isMelee', 'isMissile', 'isMagic', 'isMovement']
        if (CONFIG.HYP3E.debugMessages) { console.log(`_toggleFlag: Toggling flag ${flag} to ${!isActive}...`) }
        if (combatActions.some(f => f == flag)) {
            // Combat actions can be mutually exclusive, so we may need to toggle multiple flags
            await combatant.setCombatAction(flag, !isActive)            
        } else {
            // Non-combat actions are toggled normally
            await combatant.setFlag(game.system.id, flag, !isActive);
        }
        if (CONFIG.HYP3E.debugMessages) { console.log(`_toggleFlag: Combatant Flag: ${flag}`, combatant) }
    }

    /**
     * Handle performing some action for an individual combatant.
     * @this {HYP3ECombatTracker}
     * @param {...any} args
     */
    static _onCombatantControl(event, target) {
        // event.preventDefault();
        // event.stopPropagation();
        // Log event and target
        if (CONFIG.HYP3E.debugMessages) { console.log(`_onCombatantControl: Event: `, event) }
        if (CONFIG.HYP3E.debugMessages) { console.log(`_onCombatantControl: Target: `, target) }

        // Get the combatant from the target
        const { combatantId } = target.closest("[data-combatant-id]")?.dataset ?? {};
        const combatant = this.viewed?.combatants.get(combatantId);
        // Log the combatant & action
        if (CONFIG.HYP3E.debugMessages) { console.log(`_onCombatantControl: Combatant: `, combatant) }
        if (CONFIG.HYP3E.debugMessages) { console.log(`_onCombatantControl: Action: `, target.dataset.action) }
        // If no combatant, exit
        if ( !combatant ) return;
        // If user is not the owner, exit
        if ( !combatant.actor.isOwner ) {
            return;
        }

        // Handle the combatant control
        switch ( target.dataset.action ) {
            case "melee":
                return this._toggleFlag(combatant, "isMelee");
            case "missile":
                return this._toggleFlag(combatant, "isMissile");
            case "magic":
                return this._toggleFlag(combatant, "isMagic");
            case "movement":
                return this._toggleFlag(combatant, "isMovement");
            // Fall back to the superclass's button events
            default:
                return super._onCombatantControl(event, target);
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
                    const combatantId = li.dataset.combatantId
                    const turnToActivate = this.viewed.turns.findIndex(t => t.id === combatantId);
                    this.viewed.activateCombatant(turnToActivate);
                }
            },
            ...options
        ];
    }
}