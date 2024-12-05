export class HYP3ECombatant extends Combatant {
    // These are added to the initiative roll + DX of an actor, to position them in order high to low
    static INITIATIVE_VALUE_MELEE = 0.80
    static INITIATIVE_VALUE_MISSILE = 0.60
    static INITIATIVE_VALUE_MAGIC = 0.40
    static INITIATIVE_VALUE_MOVEMENT = 0.20
    static INITIATIVE_VALUE_DEFEATED = -99;
  
    // ===========================================================================
    // BOOLEAN FLAGS
    // ===========================================================================

    get isMelee() {
        return this.getFlag(game.system.id, "isMelee");
    }
    // set isMelee(value) {
    //     this.setFlag(game.system.id, 'isMelee', value)
    // }

    get isMissile() {
        return this.getFlag(game.system.id, "isMissile");
    }
    // set isMissile(value) {
    //     this.setFlag(game.system.id, 'isMissile', value)
    // }

    get isMagic() {
        return this.getFlag(game.system.id, "isMagic");
    }
    // set isMagic(value) {
    //     this.setFlag(game.system.id, 'isMagic', value)
    // }

    get isMovement() {
        return this.getFlag(game.system.id, "isMovement");
    }
    // set isMovement(value) {
    //     this.setFlag(game.system.id, 'isMovement', value)
    // }

    // Any actor is defeated if their HP go to zero or negative
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
        let term = formula || CONFIG.Combat.initiative.formula;
        
        // Get the actor's roll data now, so we can use the DX value
        const rollData = this.actor?.getRollData() || {};
        const name = this.actor?.name || ""
        if (CONFIG.HYP3E.debugMessages) { console.log("Actor roll data for initiative: ", rollData) }

        // Movement partially overrides the other combat actions for initiative order
        this.moveInit = this.getFlag(game.system.id, "isMovement") ? HYP3ECombatant.INITIATIVE_VALUE_MOVEMENT : 0;
        if (this.moveInit == 0) {
            this.meleeInit = this.getFlag(game.system.id, "isMelee") ? HYP3ECombatant.INITIATIVE_VALUE_MELEE : 0;
            this.missileInit = this.getFlag(game.system.id, "isMissile") ? HYP3ECombatant.INITIATIVE_VALUE_MISSILE : 0;
            this.magicInit = this.getFlag(game.system.id, "isMagic") ? HYP3ECombatant.INITIATIVE_VALUE_MAGIC : 0;
        } else {
            this.meleeInit = (this.getFlag(game.system.id, "isMelee") ? HYP3ECombatant.INITIATIVE_VALUE_MELEE : 0)/10;
            this.missileInit = (this.getFlag(game.system.id, "isMissile") ? HYP3ECombatant.INITIATIVE_VALUE_MISSILE : 0)/10;
            this.magicInit = (this.getFlag(game.system.id, "isMagic") ? HYP3ECombatant.INITIATIVE_VALUE_MAGIC : 0)/10;
        }
        // Sum all the action values and add to term
        term += `+ ${this.moveInit + this.meleeInit + this.missileInit + this.magicInit}`
        // Add the actor's DX value
        term += `+ ${(rollData.attributes?.dex?.value/1000)}`

        // If defeated, add this initiative penalty to force actor to the bottom of the list
        if (this.isDefeated) term += `+ ${HYP3ECombatant.INITIATIVE_VALUE_DEFEATED}`;
        if (CONFIG.HYP3E.debugMessages) { console.log(`${name} initiative roll terms: `, term) }
        return new Roll(term, rollData);
    }

    // Pretty sure this is not needed...
    // async getData(options = {}) {
    //     const context = await super.getData(options);
    //     return foundry.utils.mergeObject(context, {
    //         melee: this.isMelee,
    //         missile: this.isMissile,
    //         magic: this.isMagic,
    //         movement: this.isMovement
    //     })
    // }

}
  