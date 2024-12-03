/**
 * @file System-level modifications to the way combat works
 */

/**
 * An extension of Foundry's Combat class that implements initiative for indivitual combatants.
 *
 * @todo Use a single chat card for rolling group initiative
 */
export class HYP3ECombat extends Combat {
    static FORMULA = "1d6";

    get #rerollBehavior() {
        return game.settings.get(game.system.id, "rerollInitiative");
    }
    
    // ===========================================================================
    // INITIATIVE MANAGEMENT
    // ===========================================================================
  
    async #rollAbsolutelyEveryone() {
        await this.rollInitiative(this.combatants.map(c => c.id), { formula: (this.constructor).FORMULA });
    }
    
  
    // ===========================================================================
    // COMBAT LIFECYCLE MANAGEMENT
    // ===========================================================================
  
    async startCombat() {
        await super.startCombat();
        if (this.#rerollBehavior !== "reset")
            await this.#rollAbsolutelyEveryone();
        return this;
    }
    
    async _onEndRound() {
        switch(this.#rerollBehavior) {
            case "reset":
                this.resetAll();
                break;
            case "reroll":
                this.#rollAbsolutelyEveryone();
                break;
            case "keep":
            default:
                break;
        }
        // @ts-expect-error - This method exists, but the types package doesn't have it
        await super._onEndRound();
        await this.activateCombatant(0)
    }
    
    async activateCombatant(turn) {
        if (game.user.isGM) {
            await game.combat.update({ turn });
        }
    }

    async resetAll() {
        // Start with the main reset
        // await super.resetAll()

        // Reset combat actions on all actors
        const updates = this.combatants.map(
            (c) => ({ _id: c.id, 
                "flags.hyp3e.isMelee": null,
                "flags.hyp3e.isMissile": null,
                "flags.hyp3e.isMagic": null,
                "flags.hyp3e.isMovement": null,
                initRoll: null,
                initiative: null,
                meleeInit: null,
                missileInit: null,
                magicInit: null,
                moveInit: null
        })
        )
        if (CONFIG.HYP3E.debugMessages) { console.log("Reset Combatants: ", updates) }
        await this.updateEmbeddedDocuments("Combatant", updates);

        // Reset turn init rolls in combat
        this.turns.forEach(t => {
            t.initRoll = null
        })
        const turnUpdates = this.turns.map(
            (t) => ({ _id: t.id, 
                        initRoll: null
            })
        )
        if (CONFIG.HYP3E.debugMessages) { console.log("Reset Turns: ", turnUpdates) }
        await this.updateEmbeddedDocuments("Combatant", turnUpdates);

        // Reset group initiatives
        const initiativeMap = this.groupInitiativeScores
        for (const group in this.combatantsByGroup) {
            initiativeMap.set(group, null)
        }
        if (CONFIG.HYP3E.debugMessages) { console.log("Reset Initiative Map: ", initiativeMap) }
        await this.update({initiativeMap})

        // Try again with the main reset
        await super.resetAll()

        if (CONFIG.HYP3E.debugMessages) { console.log("Reset Combat: ", this) }
    }

}
  