import { Hyp3eLogger } from "../helpers/logger.mjs";

/**
 * @file System-level modifications to the way combat works
 */
/**
 * An extension of Foundry's Combat class that implements initiative for indivitual combatants.
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
        Hyp3eLogger.info("startCombat", `Combat Started:`, this);
        return this;
    }

    async endCombat() {
        // For each combatant, delete any temporary effects that were previously disabled
        for (const combatant of this.combatants) {
            combatant.actor.effects.forEach(effect => {
                if (effect.disabled && effect.isTemporary) {
                    Hyp3eLogger.info("endCombat", `Deleting effect ${effect.name} from ${combatant.name}:`, effect);
                    return effect.delete();
                }
            });
        }
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
        await super._onEndTurn(combatant, context);
        // Log the combatant whose turn is ending
        Hyp3eLogger.info("_onEndTurn", `End-Turn Combatant:`, combatant)

        if (foundry.utils.isNewerVersion(game.version, "13")) {
            // Clear the movement history to prevent any movement restrictions on its next turn
            combatant.clearMovementHistory();
        }

        // Cycle through temporary effects and items, update combatant status
        const actor = combatant.actor;
        if (actor) {
            await combatant.actor.processTemporaryEffects();
            await combatant.actor.processTemporaryItems(1);
            await combatant.updateStatus();
        } else {
            Hyp3eLogger.warn("_onEndTurn", `Combatant has no actor, cannot process temporary effects!`);
        }
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
                "flags.hyp3e.isOther": null,
                initRoll: null,
                initiative: null,
                meleeInit: null,
                missileInit: null,
                magicInit: null,
                moveInit: null,
                otherInit: null,
                statusInit: null,
                defeatedInit: null
            })
        )
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
        await this.updateEmbeddedDocuments("Combatant", turnUpdates);

        // Reset group initiatives, if needed
        const initiativeMap = this.groupInitiativeScores
        for (const initGroup in this.combatantsByGroup) {
            initiativeMap.set(initGroup, null)
        }
        await this.update({initiativeMap})

        // Try again with the main reset
        await super.resetAll()
    }
}