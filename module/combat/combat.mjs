import { Hyp3eLogger } from "../helpers/logger.mjs";

/**
 * @file System-level modifications to the way combat works
 */
/**
 * An extension of Foundry's Combat class that implements initiative for indivitual combatants.
 */
export class HYP3ECombat extends Combat {
  static FORMULA = "1d6";

  get #initiativePersistence() {
      return game.settings.get(game.system.id, "resetInitiative");
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
    if (this.#initiativePersistence !== "reset") {
      await this.#rollAbsolutelyEveryone();
    }

    // Set the deferDefeat flag
    if (game.settings.get(game.system.id, "resolveDeathAtRoundEnd")) {
      await this.setFlag("hyp3e", "deferDefeat", true);
    }

    // Log the combat object
    Hyp3eLogger.info("HYP3ECombat startCombat", `Combat Started:`, this);
    return this;
  }

  async endCombat() {
    // For each combatant, delete any temporary effects that were previously disabled
    for (const combatant of this.combatants) {
      combatant?.actor?.effects.forEach(effect => {
        if (effect.disabled && effect.isTemporary) {
          Hyp3eLogger.info("HYP3ECombat endCombat", `Deleting effect ${effect.name} from ${combatant.name}:`, effect);
          return effect.delete();
        }
      });
    }
    // Cleanup the combat object
    await super.endCombat();
  }

  async _onStartRound(context) {
    // Reset the deferDefeat flag
    if (game.settings.get(game.system.id, "resolveDeathAtRoundEnd")) {
      await this.setFlag("hyp3e", "deferDefeat", true);
    }
    await super._onStartRound(context);
  }

  async _onEndRound(context) {
    Hyp3eLogger.info("HYP3ECombat _onEndRound", `End-round data:`, this)
    // Do we need to apply unconscious or dead statuses?
    const resolveDeathAtRoundEnd = game.settings.get(game.system.id, "resolveDeathAtRoundEnd");
    if (resolveDeathAtRoundEnd) {
      await this.unsetFlag("hyp3e", "deferDefeat");
      // Cycle through all combatants and update status
      for (const combatant of this.combatants) {
        await combatant.updateStatus();
      }
    }

    // Reset/keep initiative
    switch(this.#initiativePersistence) {
      case "reset":
        this.resetAll();
        break;
      case "reroll":
        // this.#rollAbsolutelyEveryone();
        // Revert to 'reset' since we have removed the reroll option from config
        this.resetAll();
        break;
      case "keep":
        // Do nothing
        break;
      default:
        break;
    }
    // As of Foundry v13, super._onEndRound() actually does nothing, it's just a placeholder
    await super._onEndRound(context);
    await this.activateCombatant(0)
  }

  async _onEndTurn(combatant, context) {
    await super._onEndTurn(combatant, context);
    // Log the combatant whose turn is ending
    Hyp3eLogger.info("HYP3ECombat _onEndTurn", `End-turn data for ${combatant.name}:`, combatant)

    if (foundry.utils.isNewerVersion(game.version, "13")) {
      // Clear the movement history to prevent any movement restrictions on its next turn
      combatant.clearMovementHistory();
    }

    // Do we need to apply unconscious or dead statuses right away?
    const resolveDeathAtRoundEnd = game.settings.get(game.system.id, "resolveDeathAtRoundEnd");

    // Cycle through temporary effects and items, update combatant status
    const actor = combatant.actor;
    if (actor) {
      Hyp3eLogger.info("HYP3ECombat _onEndTurn", `Processing ${actor.displayName} temporary items...`);
        await actor.processTemporaryEffects();
        await actor.processTemporaryItems(1);
        if (!resolveDeathAtRoundEnd) {
          await combatant.updateStatus();
        }
    } else {
      Hyp3eLogger.warn("HYP3ECombat _onEndTurn", `Combatant has no actor, cannot process temporary effects!`);
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
        "flags.hyp3e.initRoll": null,
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
      (t) => ({ 
        _id: t.id, 
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