import { Hyp3eLogger } from "../helpers/logger.mjs";

export class HYP3ECombatant extends Combatant {
  // All mods are added to the initiative roll + DX of an actor, to position them in order high to low
  // Group initiative mods
  static GROUP_INIT_MOD_MELEE = 0.80
  static GROUP_INIT_MOD_MISSILE = 0.60
  static GROUP_INIT_MOD_MAGIC = 0.40
  static GROUP_INIT_MOD_MOVEMENT = 0.20
  static GROUP_INIT_MOD_OTHER = 0.025
  static GROUP_INIT_MOD_MOVE_OTHER = 0.001

  // Phased initiative mods
  static PHASED_INIT_MOD_MELEE = 80
  static PHASED_INIT_MOD_MISSILE = 60
  static PHASED_INIT_MOD_MAGIC = 40
  static PHASED_INIT_MOD_MOVEMENT = 20
  static PHASED_INIT_MOD_OTHER = 2.5
  static PHASED_INIT_MOD_MOVE_OTHER = 0.1

  // Status-based initiative mods
  static INITIATIVE_MOD_DEAF = -2;
  static INITIATIVE_MOD_BLIND = -95;
  static INITIATIVE_MOD_SLOWED = 0;
  static INITIATIVE_MOD_DEFEATED = -99;

  // ===========================================================================
  // BOOLEAN FLAGS
  // ===========================================================================

  get isMelee() {
    return this.getFlag(game.system.id, "isMelee");
  }

  get isMissile() {
    return this.getFlag(game.system.id, "isMissile");
  }

  get isMagic() {
    return this.getFlag(game.system.id, "isMagic");
  }

  get isMovement() {
    return this.getFlag(game.system.id, "isMovement");
  }

  get isOther() {
    return this.getFlag(game.system.id, "isOther");
  }

  // A combatant is defeated if their HP go at or below their minimum (0 for monsters, -10 for PCs)
  get isDefeated() {
    // Define the combatant's point of death, different for characters vs. monsters
    let deadHp = this.actor?.system?.hp?.min || 0;
    let unconsciousHp = null;
    let dyingHp = null;
    // Characters and classed NPCs (including henchmen) should all be rolled as characters
    if (this.actor.type === "character") {
      unconsciousHp = 0;
      dyingHp = -4;
      deadHp = -10;
    }

    const resolveDeathAtRoundEnd = game.settings.get(game.system.id, "resolveDeathAtRoundEnd");
    if (!resolveDeathAtRoundEnd) {
      // Default Foundry behavior, defeat is resolved immediately
      return this.defeated || (this.actor?.system.hp.value <= deadHp) || !!this.actor?.statuses.has(CONFIG.specialStatusEffects.DEFEATED);
    }

    // Defer defeated status until round-end
    if (this.combat?.flags?.hyp3e?.deferDefeat) {
      Hyp3eLogger.info("HYP3ECombatant isDefeated", `${this.name} defeat is deferred for now, returning ${!!this.defeated}...`);
      return !!this.defeated;
    }

    // Round has ended (or not in combat), revert to default behavior
    const defeatedStatus = this.defeated || (this.actor?.system.hp.value <= deadHp) || !!this.actor?.statuses.has(CONFIG.specialStatusEffects.DEFEATED);
    Hyp3eLogger.info("HYP3ECombatant isDefeated", `${this.name} defeat is no longer deferred, returning status of ${defeatedStatus}...`);
    return defeatedStatus;
  }

  // A combatant is unconscious if their HP go at or below 0, but is still above their minimum
  //  of -3 (for hirelings) or -10 (for PCs & NPCs) for death
  get isUnconscious() {
    // Monsters die at 0 HP, no passage through unconsciousness or dying
    if (this.actor.type !== "character") return false;

    // Define the combatant's points of unconsciousness, dying, and death.
    //  Characters and classed NPCs (including henchmen) should all be rolled as characters.
    let deadHp = this.actor?.system?.hp?.min || -10;
    let dyingHp = -4;
    let unconsciousHp = 0;

    const resolveDeathAtRoundEnd = game.settings.get(game.system.id, "resolveDeathAtRoundEnd");
    if (!resolveDeathAtRoundEnd) {
      // Default Foundry behavior, unconsciousness is resolved immediately
      return this.unconscious || (this.actor?.system.hp.value <= unconsciousHp) || !!this.actor?.statuses.has(CONFIG.statusEffects.unconscious);
    }

    // Defer unconscious status until round-end
    if (this.combat?.flags?.hyp3e?.deferDefeat) {
      Hyp3eLogger.info("HYP3ECombatant isUnconscious", `${this.name} unconscious is deferred for now, returning ${!!this.unconscious}...`);
      // return false;
      return !!this.unconscious;
    }

    // Round has ended (or not in combat), revert to default behavior
    const unconsciousStatus = this.unconscious || (this.actor?.system.hp.value <= unconsciousHp) || !!this.actor?.statuses.has(CONFIG.statusEffects.unconscious);
    Hyp3eLogger.info("HYP3ECombatant isUnconscious", `${this.name} unconscious is no longer deferred, returning status of ${unconsciousStatus}...`);
    return unconsciousStatus;
  }

  // The isDying status is combined with isUnconscious. A PC combatant is dying if their
  //  HP goes at or below -4, but still above -10 for death. In this state, the PC loses
  //  1 HP per round until stabilized, or they die at -10 HP.
  get isDying() {
    // Monsters die at 0 HP, no passage through unconsciousness or dying
    if (this.actor.type !== "character") return false;

    // Define the combatant's points of unconsciousness, dying, and death.
    //  Characters and classed NPCs (including henchmen) should all be rolled as characters.
    let deadHp = this.actor?.system?.hp?.min || -10;
    let dyingHp = -4;
    let unconsciousHp = 0;

    const resolveDeathAtRoundEnd = game.settings.get(game.system.id, "resolveDeathAtRoundEnd");
    if (!resolveDeathAtRoundEnd) {
      // Default Foundry behavior, dying is resolved immediately
      return this.dying || (this.actor?.system.hp.value <= dyingHp);
    }

    // Defer dying status until round-end
    if (this.combat?.flags?.hyp3e?.deferDefeat) {
      Hyp3eLogger.info("HYP3ECombatant isDying", `${this.name} dying is deferred for now, returning ${!!this.dying}...`);
      // return false;
      return !!this.dying;
    }

    // Round has ended (or not in combat), revert to default behavior
    const dyingStatus = this.dying || (this.actor?.system.hp.value <= dyingHp);
    Hyp3eLogger.info("HYP3ECombatant isDying", `${this.name} dying is no longer deferred, returning status of ${dyingStatus}...`);
    return dyingStatus;
  }

  // ===========================================================================
  // UPDATE COMBAT ACTION FLAGS
  // ===========================================================================
  setCombatAction(flag, value) {
    // Always set the specified flag
    this.setFlag(game.system.id, flag, value)
    // Most combat actions are mutually exclusive, when setting one to true
    switch (flag) {
      case "isMelee":
        if (value === true) {
          // Set these to false
          this.setFlag(game.system.id, 'isMissile', !value)
          this.setFlag(game.system.id, 'isMagic', !value)
          this.setFlag(game.system.id, 'isOther', !value)
        }
        break;
      case "isMissile":
        if (value === true) {
          // Set these to false
          this.setFlag(game.system.id, 'isMelee', !value)
          this.setFlag(game.system.id, 'isMagic', !value)
          this.setFlag(game.system.id, 'isOther', !value)
        }
        break;
      case "isMagic":
        if (value === true) {
          // Set these to false
          this.setFlag(game.system.id, 'isMelee', !value)
          this.setFlag(game.system.id, 'isMissile', !value)
          this.setFlag(game.system.id, 'isOther', !value)
        }
        break;
      case "isMovement":
        // isMovement can stack with the other combat actions
        break;
      case "isOther":
        if (value === true) {
          // Set these to false
          this.setFlag(game.system.id, 'isMelee', !value)
          this.setFlag(game.system.id, 'isMissile', !value)
          this.setFlag(game.system.id, 'isMagic', !value)
        }
        break;
      default:
        // This should never happen
        break;
    }
  }


  // ===========================================================================
  // INITIATIVE MANAGEMENT
  // ===========================================================================

  getInitiativeRoll(formula) {
    let rollTerms = formula || CONFIG.Combat.initiative.formula;

    // Get the actor's roll data now, so we can use the DX value
    const rollData = this.actor?.getRollData() || {};
    const name = this.actor?.name || ""
    Hyp3eLogger.info("HYP3ECombatant getInitiativeRoll", `Actor roll data for individual initiative:`, rollData);

    // Movement partially overrides the other combat actions for initiative order
    this.getActionModifiers();
    // Add the action values to rollTerms
    rollTerms += `+ ${this.meleeInit + this.missileInit + this.magicInit + this.moveInit + this.otherInit}`
    Hyp3eLogger.info("HYP3ECombatant getInitiativeRoll", `${this.name} initiative roll terms (roll + melee + missile + magic + move + other): ${rollTerms}`);
    // Add the actor's DX value
    rollTerms += `+ ${(rollData.attributes?.dex?.value/1000)}`

    // Add the actor's temporary initiative modifier, if one exists
    this.getTempInitMod();
    rollTerms += `+ ${this.tempInitMod}`;

    // If deaf or blind, add these initiative penalties
    this.getSlowingModifiers();
    rollTerms += `+ ${this.statusInit}`;

    // If defeated, add this initiative penalty to force actor to the bottom of the list
    this.getDefeatedModifier();
    rollTerms += `+ ${this.defeatedInit}`;

    // Finally, roll initiative and return the result
    const result = new Roll(rollTerms, rollData);
    return result
  }

  getActionModifiers() {
    const PREFIX = CONFIG.HYP3E.initiativeType === "phased" ? "PHASED" : "GROUP"
    // Movement partially overrides the other combat actions for initiative order
    // this.moveInit = this.getFlag(game.system.id, "isMovement") ? HYP3ECombatant.GROUP_INIT_MOD_MOVEMENT : 0;
    this.moveInit = this.getFlag(game.system.id, "isMovement") ? parseInt(HYP3ECombatant[`${PREFIX}_INIT_MOD_MOVEMENT`]) : 0;
    // Action without movement
    if (this.moveInit == 0) {
      this.meleeInit = this.getFlag(game.system.id, "isMelee") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_MELEE`] : 0;
      this.missileInit = this.getFlag(game.system.id, "isMissile") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_MISSILE`] : 0;
      this.magicInit = this.getFlag(game.system.id, "isMagic") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_MAGIC`] : 0;
      this.otherInit = this.getFlag(game.system.id, "isOther") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_OTHER`] : 0;
    } else {
      // Movement declared, possibly with another action
      this.meleeInit = (this.getFlag(game.system.id, "isMelee") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_MELEE`] : 0)/10;
      this.missileInit = (this.getFlag(game.system.id, "isMissile") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_MISSILE`] : 0)/10;
      this.magicInit = (this.getFlag(game.system.id, "isMagic") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_MAGIC`] : 0)/10;
      // We treat Move + Other specially to ensure it falls in the correct order
      this.otherInit = this.getFlag(game.system.id, "isOther") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_MOVE_OTHER`] : 0;
      // If move is combined with another action, reduce its modifier value to 1/10
      if (this.meleeInit > 0 || this.missileInit > 0 || this.magicInit > 0 || this.otherInit > 0) {
        this.moveInit = this.moveInit/10;
      }
    }
    // Log all initiative modifiers for this combatant
    const initMods = {};
    initMods['meleeInit'] = this.meleeInit;
    initMods['missileInit'] = this.missileInit;
    initMods['magicInit'] = this.magicInit;
    initMods['moveInit'] = this.moveInit;
    initMods['otherInit'] = this.otherInit;
    Hyp3eLogger.info("HYP3ECombatant getActionModifiers", `${this.name} declared-action Initiative mods:`, initMods);
  }

  getTempInitMod() {
    // If the actor has a temporary init mod set, apply it here
    this.tempInitMod = this.actor?.system?.tempInitiativeMod ? this.actor?.system?.tempInitiativeMod : 0
  }

  getDefeatedModifier() {
    // If defeated or unconscious, add this initiative penalty to force actor to the end of the round
    this.defeatedInit = this.isDefeated || this?.isDying || this?.isUnconscious ? HYP3ECombatant.INITIATIVE_MOD_DEFEATED : 0;
  }

  getSlowingModifiers() {
    // If deaf or blind, add these initiative penalties
    this.statusInit = 0;
    this.isSlowed = false;
    for ( let e of this.actor.effects) {
      if (e.name == "Slowed" && !e.disabled) {
        this.statusInit += HYP3ECombatant.INITIATIVE_MOD_SLOWED;
        this.isSlowed = true;
      }
      if (e.name == "Deaf" && !e.disabled) {
        this.statusInit += HYP3ECombatant.INITIATIVE_MOD_DEAF;
        this.isSlowed = true;
      }
      if (e.name == "Blind" && !e.disabled) {
        this.statusInit += HYP3ECombatant.INITIATIVE_MOD_BLIND;
        this.isSlowed = true;
      }
    }
  }

  setInitRoll() {
    // Set the combatant's initiative roll value
    if (CONFIG.HYP3E.initiativeType === "group") {
      // Slice off the decimal places for group initiative, leaving the original d6 roll
      this.initRoll = Math.floor(this.initiative);
    } else if (CONFIG.HYP3E.initiativeType === "phased") {
      // Drop the tens-place digit as well as the decimal places
      this.initRoll = Math.floor(this.initiative) % 10;
    }
    return this.initRoll;
  }

  async updateStatus() {
    // Check if the actor is unconscious or defeated
    let isDefeated = this.isDefeated;
    let isDying = isDefeated ? !isDefeated : this.isDying;
    let isUnconscious = isDefeated ? !isDefeated : this.isUnconscious;
    Hyp3eLogger.info("HYP3ECombatant updateStatus", `${this.name} calculated statuses:`, { isDefeated, isDying, isUnconscious });
    // let isDefeated = false;
    // let isUnconscious = false;
    // if (this.actor.system.hp.value <= 0) {
    //     if (this.actor.type == "character") {
    //         if (this.actor.system.hp.value == 0) {
    //             isDefeated = true;
    //             isUnconscious = false;
    //         } else {
    //             isDefeated = true;
    //             isUnconscious = true;
    //         }
    //     } else if (this.actor.type == "npc") {
    //         isDefeated = true;
    //         isUnconscious = false;
    //     }
    // } else {
    //     // Actor is alive & conscious
    //     isDefeated = false;
    //     isUnconscious = false;
    // }
    await this.update({ defeated: isDefeated, isDying: isDying, isUnconscious: isUnconscious });
    // Hyp3eLogger.info("HYP3ECombatant updateStatus", `${this.name} defeated/dying/unconscious status updated:`, this);
    let effect;
    if (isDefeated) {
      const defeated_status = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.DEFEATED);
      effect = this.actor && defeated_status ? defeated_status : CONFIG.controlIcons.defeated;
      Hyp3eLogger.info("HYP3ECombatant updateStatus", `Combatant ${this.name} has defeated effect:`, effect);
      if (effect) {
        if (this.token.object) {
          await this.token.object.toggleEffect(effect, {
            overlay: true,
            active: isDefeated,
          });
        } else {
          await this.token.toggleEffect(effect, {
            overlay: true,
            active: isDefeated,
          });
        }
        // Add dead status to the combatant actor
        await this.actor.setHealthStatus("dead");
    }
    } else {  // isDying and isUnconscious are exclusive of isDefeated but not of each other
      if (isDying) {
        const dying_status = CONFIG.statusEffects.find(e => e.id === "bleeding");
        effect = this.actor && dying_status ? dying_status : null;
        Hyp3eLogger.info("HYP3ECombatant updateStatus", `Combatant ${this.name} has dying effect:`, effect);
        if (effect) {
          if (this.token.object) {
            await this.token.object.toggleEffect(effect, {
              overlay: true,
              active: isDying,
            });
          } else {
            await this.token.toggleEffect(effect, {
              overlay: true,
              active: isDying,
            });
          }
          // Add bleeding persistent damage to the combatant actor
          await this.actor.setHealthStatus("bleeding");
        }
      } else
      if (isUnconscious) {
        const unconscious_status = CONFIG.statusEffects.find(e => e.id === "unconscious");
        effect = this.actor && unconscious_status ? unconscious_status : null;
        Hyp3eLogger.info("HYP3ECombatant updateStatus", `Combatant ${this.name} has unconscious effect:`, effect);
        if (effect) {
          if (this.token.object) {
            await this.token.object.toggleEffect(effect, {
              overlay: true,
              active: isUnconscious,
            });
          } else {
            await this.token.toggleEffect(effect, {
              overlay: true,
              active: isUnconscious,
            });
          }
          // Add unconscious status to the combatant actor
          await this.actor.setHealthStatus("unconscious");
        }
      }
    }
    Hyp3eLogger.info("HYP3ECombatant updateStatus", `Combatant ${this.name} unconscious/dying/defeated status and token updated:`, this);
  }
}
