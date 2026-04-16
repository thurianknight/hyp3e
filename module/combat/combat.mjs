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
    // This will cycle through all combatants for active effects
    await this._refreshAndCleanupEffects("combatEnd", this);

    // Cleanup the combat object
    await super.endCombat();
  }

  async _onStartRound(context) {
    // Reset the deferDefeat flag - is this needed?
    if (game.settings.get(game.system.id, "resolveDeathAtRoundEnd")) {
      await this.setFlag("hyp3e", "deferDefeat", true);
    }
    // Cycle through all combatants and process individually, if needed
    for (const combatant of this.combatants) {
      // Placeholder, nothing here for now
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

  async _onStartTurn(combatant, context) {
    await super._onStartTurn(combatant, context);
    // Log the combatant whose turn is starting
    // Hyp3eLogger.info("HYP3ECombat _onStartTurn", `Start-turn data for ${combatant.name}:`, combatant)
  }

  async _onEndTurn(combatant, context) {
    await super._onEndTurn(combatant, context);
    // Log the combatant whose turn is ending
    Hyp3eLogger.info("HYP3ECombat _onEndTurn", `End-turn data for ${combatant.name}:`, combatant)

    if (foundry.utils.isNewerVersion(game.version, "13")) {
      // Clear the movement history to prevent any movement restrictions on its next turn
      combatant.clearMovementHistory();
    }

    if (!combatant?.actor) {
      Hyp3eLogger.warn("HYP3ECombat _onEndTurn", `Combatant has no actor, cannot process temporary effects!`);
      return;
    }

    // Do we need to apply unconscious or dead statuses right away?
    const resolveDeathAtRoundEnd = game.settings.get(game.system.id, "resolveDeathAtRoundEnd");

    // Process temporary effects and items, update combatant status
    const actor = combatant.actor;

    // Process persistent damage and other temporary effects
    Hyp3eLogger.info("HYP3ECombat _onEndTurn", `Processing ${actor.displayName} temporary effects...`);
    await actor.processTemporaryEffects();

    // Update duration and expiration on effects, delete if expired
    await this._refreshAndCleanupEffects("turnEnd", this, actor);

    // Update duration and expiration on temporary items
    Hyp3eLogger.info("HYP3ECombat _onEndTurn", `Processing ${actor.displayName} temporary items...`);
    await actor.processTemporaryItems(1);

    // Update actor health statuses if mode is "immediate" and not "at round end"
    if (!resolveDeathAtRoundEnd) {
      await combatant.updateStatus();
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
        "flags.hyp3e.isDelayed": null,
        "flags.hyp3e.initRoll": null,
        initRoll: null,
        initiative: null,
        meleeInit: null,
        missileInit: null,
        magicInit: null,
        moveInit: null,
        otherInit: null,
        delayedInit: null,
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

  /**
   * Private helper – keeps your four methods clean and DRY
   */
  async _refreshAndCleanupEffects(event, combat = null, specificActor = null) {
    Hyp3eLogger.info("HYP3ECombat _refreshAndCleanupEffects", `Refresh and cleanup effects on actor(s) ${specificActor ? specificActor.name : "(all)"}, for event ${event}.`);
    const context = { combat };
    const actors = specificActor ? new Set([specificActor]) : undefined;

    if (actors) context.actors = actors;

    // Only Foundry v14+ has the effect registry
    if (ActiveEffect?.registry) {
      // Safety net add and refresh registry
      if (specificActor) {
        await ActiveEffect.registry.addFromParent(specificActor);
      }    
      await ActiveEffect.registry.refresh(event, context);
    }

    // Cleanup – only on the relevant actor(s)
    if (specificActor) {
      Hyp3eLogger.info("HYP3ECombat _refreshAndCleanupEffects", `${specificActor.name} effects:`, specificActor.effects);
      if (event == "turnEnd") {
        // The timer method also handles expiration and deletion
        await specificActor.advanceTempEffectsTimer();
      }
    } else {
      // Clean all actors if combat is ending
      if (event == "combatEnd") {
        for (const c of combat?.combatants || []) {
          if (c.actor) {
            // The timer method also handles expiration and deletion
            await c.actor.advanceTempEffectsTimer();
          }
        }
      }
    }
  }
}