import { Hyp3eLogger } from "../helpers/logger.mjs";

export class HYP3ECombatant extends Combatant {
    // All mods are added to the initiative roll + DX of an actor, to position them in order high to low
    // Group initiative mods
    static GROUP_INIT_MOD_MELEE = 0.80
    static GROUP_INIT_MOD_MISSILE = 0.60
    static GROUP_INIT_MOD_MAGIC = 0.40
    static GROUP_INIT_MOD_MOVEMENT = 0.20
    static GROUP_INIT_MOD_OTHER = 0

    // Phased initiative mods
    static PHASED_INIT_MOD_MELEE = 80
    static PHASED_INIT_MOD_MISSILE = 60
    static PHASED_INIT_MOD_MAGIC = 40
    static PHASED_INIT_MOD_MOVEMENT = 20
    static PHASED_INIT_MOD_OTHER = 0

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

    // A combatant is defeated if their HP go to zero or negative
    get isDefeated() {
        if (this.defeated)
            return true;

        return !this.defeated && (this.actor.system.hp.value <= 0)
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
        Hyp3eLogger.info("getInitiativeRoll", `Actor roll data for individual initiative:`, rollData);

        // Movement partially overrides the other combat actions for initiative order
        this.getActionModifiers();
        // Add the action values to rollTerms
        rollTerms += `+ ${this.moveInit + this.meleeInit + this.missileInit + this.magicInit}`
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
        this.moveInit = this.getFlag(game.system.id, "isMovement") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_MOVEMENT`] : 0;

        if (this.moveInit == 0) {
            // this.meleeInit = this.getFlag(game.system.id, "isMelee") ? HYP3ECombatant.GROUP_INIT_MOD_MELEE : 0;
            this.meleeInit = this.getFlag(game.system.id, "isMelee") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_MELEE`] : 0;
            // this.missileInit = this.getFlag(game.system.id, "isMissile") ? HYP3ECombatant.GROUP_INIT_MOD_MISSILE : 0;
            this.missileInit = this.getFlag(game.system.id, "isMissile") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_MISSILE`] : 0;
            // this.magicInit = this.getFlag(game.system.id, "isMagic") ? HYP3ECombatant.GROUP_INIT_MOD_MAGIC : 0;
            this.magicInit = this.getFlag(game.system.id, "isMagic") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_MAGIC`] : 0;
            // this.otherInit = this.getFlag(game.system.id, "isOther") ? HYP3ECombatant.GROUP_INIT_MOD_OTHER : 0;
            this.otherInit = this.getFlag(game.system.id, "isOther") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_OTHER`] : 0;
        } else {
            // this.meleeInit = (this.getFlag(game.system.id, "isMelee") ? HYP3ECombatant.GROUP_INIT_MOD_MELEE : 0)/10;
            this.meleeInit = (this.getFlag(game.system.id, "isMelee") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_MELEE`] : 0)/10;
            // this.missileInit = (this.getFlag(game.system.id, "isMissile") ? HYP3ECombatant.GROUP_INIT_MOD_MISSILE : 0)/10;
            this.missileInit = (this.getFlag(game.system.id, "isMissile") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_MISSILE`] : 0)/10;
            // this.magicInit = (this.getFlag(game.system.id, "isMagic") ? HYP3ECombatant.GROUP_INIT_MOD_MAGIC : 0)/10;
            this.magicInit = (this.getFlag(game.system.id, "isMagic") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_MAGIC`] : 0)/10;
            // this.otherInit = (this.getFlag(game.system.id, "isOther") ? HYP3ECombatant.GROUP_INIT_MOD_OTHER : 0)/10;
            this.otherInit = (this.getFlag(game.system.id, "isOther") ? HYP3ECombatant[`${PREFIX}_INIT_MOD_OTHER`] : 0)/10;
            // If move is combined with another action, reduce its modifier value to 1/10
            if (this.meleeInit > 0 || this.missileInit > 0 || this.magicInit > 0 || this.otherInit > 0) {
                this.moveInit = this.moveInit/10;
            }
        }
    }

    getTempInitMod() {
        // If the actor has a temporary init mod set, apply it here
        this.tempInitMod = this.actor?.system?.tempInitiativeMod ? this.actor?.system?.tempInitiativeMod : 0
    }

    getDefeatedModifier() {
        // If defeated, add this initiative penalty to force actor to the end of the round
        this.defeatedInit = this.isDefeated ? HYP3ECombatant.INITIATIVE_MOD_DEFEATED : 0;
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
        this.initRoll = Math.floor(this.initiative);
        return this.initRoll;
    }

    async updateStatus() {
        // Check if the actor is unconscious or defeated
        let isDefeated = false;
        let isUnconscious = false;
        if (this.actor.system.hp.value <= 0) {
            if (this.actor.type == "character") {
                if (this.actor.system.hp.value == 0) {
                    isDefeated = true;
                    isUnconscious = false;
                } else {
                    isDefeated = true;
                    isUnconscious = true;
                }
            } else if (this.actor.type == "npc") {
                isDefeated = true;
                isUnconscious = false;
            }
        } else {
            // Actor is alive & conscious
            isDefeated = false;
            isUnconscious = false;
        }
        await this.update({ defeated: isDefeated, unconscious: isUnconscious });
        const defeated_status = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.DEFEATED);
        if (isDefeated) {
            let effect = this.actor && defeated_status ? defeated_status : CONFIG.controlIcons.defeated;
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
        }
        Hyp3eLogger.info("updateStatus", `Combatant unconscious/defeated status updated:`, this);
    }
}
