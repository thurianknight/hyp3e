export class HYP3ECombatant extends Combatant {
    // These are added to the initiative roll + DX of an actor, to position them in order high to low
    static INITIATIVE_MOD_MELEE = 0.80
    static INITIATIVE_MOD_MISSILE = 0.60
    static INITIATIVE_MOD_MAGIC = 0.40
    static INITIATIVE_MOD_MOVEMENT = 0.20
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
                }
                break;
            case "isMissile":
                if (value === true) {
                    // Set these to false
                    this.setFlag(game.system.id, 'isMelee', !value)
                    this.setFlag(game.system.id, 'isMagic', !value)
                }
                break;
            case "isMagic":
                if (value === true) {
                    // Set these to false
                    this.setFlag(game.system.id, 'isMelee', !value)
                    this.setFlag(game.system.id, 'isMissile', !value)
                }
                break;
            case "isMovement":
                // isMovement can stack with the other combat actions
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
        // if (CONFIG.HYP3E.debugMessages) { console.log("Actor roll data for initiative: ", rollData) }

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

        // Log the complete initiative roll formula
        // if (CONFIG.HYP3E.debugMessages) { console.log(`${name} initiative roll terms: `, rollTerms) }

        // Finally, roll initiative and return the result
        const result = new Roll(rollTerms, rollData);
        // if (CONFIG.HYP3E.debugMessages) { console.log("Individual initiative roll:", result) }
        // this.initRoll = result.dice[0].total
        return result
    }

    getActionModifiers() {
        // Movement partially overrides the other combat actions for initiative order
        this.moveInit = this.getFlag(game.system.id, "isMovement") ? HYP3ECombatant.INITIATIVE_MOD_MOVEMENT : 0;
        if (this.moveInit == 0) {
            this.meleeInit = this.getFlag(game.system.id, "isMelee") ? HYP3ECombatant.INITIATIVE_MOD_MELEE : 0;
            this.missileInit = this.getFlag(game.system.id, "isMissile") ? HYP3ECombatant.INITIATIVE_MOD_MISSILE : 0;
            this.magicInit = this.getFlag(game.system.id, "isMagic") ? HYP3ECombatant.INITIATIVE_MOD_MAGIC : 0;
        } else {
            this.meleeInit = (this.getFlag(game.system.id, "isMelee") ? HYP3ECombatant.INITIATIVE_MOD_MELEE : 0)/10;
            this.missileInit = (this.getFlag(game.system.id, "isMissile") ? HYP3ECombatant.INITIATIVE_MOD_MISSILE : 0)/10;
            this.magicInit = (this.getFlag(game.system.id, "isMagic") ? HYP3ECombatant.INITIATIVE_MOD_MAGIC : 0)/10;
            // If move is combined with another action, reduce its modifier value to 1/10
            if (this.meleeInit > 0 || this.missileInit > 0 || this.magicInit > 0) {
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
            // if (CONFIG.HYP3E.debugMessages) { console.log(`Actor ${this.actor.name} has effect: `, e) }
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
        // if (CONFIG.HYP3E.debugMessages) { console.log(`setInitRoll: ${this.actor.name}: `, this) }
        this.initRoll = Math.floor(this.initiative);
        // if (CONFIG.HYP3E.debugMessages) { console.log(`setInitRoll: ${this.actor.name} base init roll: `, this.initRoll) }
        return this.initRoll;
    }

    async updateStatus() {
        if (CONFIG.HYP3E.debugMessages) { console.log(`updateStatus Combatant: `, this) }
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
        // const unconscious_status = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.Unconscious);
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
    }

    async applyDamage(damageType, damageRoll, applyDr=true) {
        // Roll damage formula and log the result
        if (CONFIG.HYP3E.debugMessages) { console.log(`applyDamage Combatant: `, this) }
        if (CONFIG.HYP3E.debugMessages) { console.log(`applyDamage: ${damageRoll} ${damageType}`) }
        const roll = await new Roll(damageRoll).roll();
        // if (CONFIG.HYP3E.debugMessages) { console.log(`applyDamage roll: ${damageRoll}`, roll) }
        const damage = roll.total;
        if (CONFIG.HYP3E.debugMessages) { console.log(`applyDamage total: ${damage}`) }

        // Apply the damage to the combatant
        await this.actor.applyHealthChange(damage, applyDr)

        // Send a chat message that damage is being applied
        const message = `${this.actor.name} takes ${damage} ${damageType} damage!`;
        const chatData = {
            author: game.user_id,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: message
        };
        ChatMessage.create(chatData, {});    

        // Check if the actor is unconscious or defeated
        let isDefeated = false;
        let isUnconscious = false;
        if (this.actor.system.hp.value <= 0) {
            if (this.actor.type == "character") {
                if (newHealth == 0) {
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
        }
        await this.update({ defeated: isDefeated, unconscious: isUnconscious });
        const defeated_status = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.DEFEATED);
        // const unconscious_status = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.Unconscious);
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
    }

}
