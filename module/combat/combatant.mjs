export class HYP3ECombatant extends Combatant {
    // These are added to the initiative roll + DX of an actor, to position them in order high to low
    static INITIATIVE_MOD_MELEE = 0.80
    static INITIATIVE_MOD_MISSILE = 0.60
    static INITIATIVE_MOD_MAGIC = 0.40
    static INITIATIVE_MOD_MOVEMENT = 0.20
    static INITIATIVE_MOD_DEAF = -2;
    static INITIATIVE_MOD_BLIND = -95;
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

    // Pretty sure this is not needed...
    // async getData(options = {}) {
    //     const context = await super.getData(options);
    //     const combatantData = foundry.utils.mergeObject(context, {
    //                             isMelee: this.isMelee,
    //                             isMissile: this.isMissile,
    //                             isMagic: this.isMagic,
    //                             isMovement: this.isMovement,
    //                             initRoll: this.initRoll,
    //     })
    //     // Log the combatantData object
    //     if (CONFIG.HYP3E.debugMessages) { console.log("getData: Combatant Data: ", combatantData) }
    //     return combatantData
    // }

}
