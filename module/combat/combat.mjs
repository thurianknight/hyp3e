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
        // Log the combat object
        // if (CONFIG.HYP3E.debugMessages) { console.log("startCombat: Combat Started: ", this) }
        return this;
    }
    
    async endCombat() {
        // For each combatant, disable any temporary effects
        // for (const combatant of this.combatants) {
        //     combatant.actor.effects.forEach(effect => {
        //         if (effect.isTemporary) {
        //             // if (CONFIG.HYP3E.debugMessages) { console.log(`endCombat: Temporary Effect to delete: ${effect.name}`, effect) }
        //             return effect.delete();
        //         }
        //     });
        // }
        // Cleanup the combat object
        await super.endCombat();
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

    async _onEndTurn(combatant, context) {
        // Log the context object
        // if (CONFIG.HYP3E.debugMessages) { console.log("End-Turn Context: ", context) }
        await super._onEndTurn(combatant, context);

        // Log the combatant
        if (CONFIG.HYP3E.debugMessages) { console.log("End-Turn Combatant: ", combatant) }

        // Cycle through active effects
        combatant.actor.effects.forEach(effect => {
            if (effect.isTemporary && !effect.disabled) {
                // if (CONFIG.HYP3E.debugMessages) { console.log(`End-Turn Temporary Effect: ${effect.name}`, effect) }
                // Apply any persistent damage effects
                const persistentDamage = effect.changes.find(c => c.key === "system.tempPersistentDamage");
                if (persistentDamage) {
                    if (CONFIG.HYP3E.debugMessages) { console.log(`End-Turn Persistent Damage Effect: ${effect.name}`, persistentDamage) }
                    const damageType = persistentDamage.value.split(",")[0];
                    const damageRoll = persistentDamage.value.split(",")[1];
                    combatant.applyDamage(damageType, damageRoll);
                }
                // Disable any temporary effects that have expired
                if (effect.duration.remaining != null && effect.duration.remaining <= 0) {
                    const updates = {
                        disabled: true,
                        duration: {
                            startRound: null,
                            startTurn: null
                        }
                    };
                    return effect.update(updates);
                }
            // } else if (effect.isTemporary && effect.disabled) {
            //     // if (CONFIG.HYP3E.debugMessages) { console.log(`End-Turn Temporary Effect to Delete: ${effect.name}`, effect) }
            //     if (effect.duration.remaining != null && effect.duration.remaining <= 0) {
            //         return effect.delete();
            //     }
            }
        });
    }

    async activateCombatant(turn) {
        if (game.user.isGM) {
            await game.combat.update({ turn });
        }
    }

    async resetAll() {
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
                moveInit: null,
                statusInit: null,
                defeatedInit: null
            })
        )
        // if (CONFIG.HYP3E.debugMessages) { console.log("resetAll: Combatants Updates: ", updates) }
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
        // if (CONFIG.HYP3E.debugMessages) { console.log("resetAll: Turns Updates: ", turnUpdates) }
        await this.updateEmbeddedDocuments("Combatant", turnUpdates);

        // Reset group initiatives, if needed
        const initiativeMap = this.groupInitiativeScores
        for (const initGroup in this.combatantsByGroup) {
            initiativeMap.set(initGroup, null)
        }
        // if (CONFIG.HYP3E.debugMessages) { console.log("resetAll: Initiative Map Updates: ", initiativeMap) }
        await this.update({initiativeMap})

        // Try again with the main reset
        await super.resetAll()

        // if (CONFIG.HYP3E.debugMessages) { console.log("resetAll: Combat: ", this) }
    }

}
