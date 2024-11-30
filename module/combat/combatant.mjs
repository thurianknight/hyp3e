export class HYP3ECombatant extends Combatant {
    // These are added to the initiative roll + DX of an actor, to position them in order high to low
    static INITIATIVE_VALUE_MELEE = 120
    static INITIATIVE_VALUE_MISSILE = 90
    static INITIATIVE_VALUE_MAGIC = 60
    static INITIATIVE_VALUE_MOVEMENT = 30
    // static INITIATIVE_VALUE_SLOWED = -499;
    static INITIATIVE_VALUE_DEFEATED = -999;
  
    // ===========================================================================
    // BOOLEAN FLAGS
    // ===========================================================================

    // get isCasting() {
    //     return this.getFlag(game.system.id, "prepareSpell");
    // }
    // set isCasting(value) {
    //     this.setFlag(game.system.id, 'prepareSpell', value)
    // }
    // get isSlow() {
    //   return this.actor.system.isSlow;
    // }

    get isMelee() {
        // return this.actor.system.isMelee;
        return this.getFlag(game.system.id, "isMelee");
    }
    set isMelee(value) {
        this.setFlag(game.system.id, 'isMelee', value)
        // this.setFlag(game.system.id, 'isMissile', !value)
        // this.setFlag(game.system.id, 'isMagic', !value)
    }

    get isMissile() {
        // return this.actor.system.isMissile;
        return this.getFlag(game.system.id, "isMissile");
    }
    set isMissile(value) {
        this.setFlag(game.system.id, 'isMissile', value)
        // this.setFlag(game.system.id, 'isMelee', !value)
        // this.setFlag(game.system.id, 'isMagic', !value)
    }

    get isMagic() {
        // return this.actor.system.isMagic;
        return this.getFlag(game.system.id, "isMagic");
    }
    set isMagic(value) {
        this.setFlag(game.system.id, 'isMagic', value)
        // this.setFlag(game.system.id, 'isMelee', !value)
        // this.setFlag(game.system.id, 'isMissile', !value)
    }

    get isMovement() {
        // return this.actor.system.isMovement;
        return this.getFlag(game.system.id, "isMovement");
    }
    set isMovement(value) {
        this.setFlag(game.system.id, 'isMovement', value)
    }

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
        // Most combat actions are mutually exclusive, but only when setting one to true
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
        // @todo : Add DX value to initiative roll formula

        // Movement overrides Melee, Missile, or Magic values for initiative
        if (this.isMovement) {
            term += ` + ${HYP3ECombatant.INITIATIVE_VALUE_MOVEMENT}`;
        } else {
            // These are mutually exclusive to each other
            if (this.isMelee) term += ` + ${HYP3ECombatant.INITIATIVE_VALUE_MELEE}`;
            if (this.isMissile) term += ` + ${HYP3ECombatant.INITIATIVE_VALUE_MISSILE}`;
            if (this.isMagic) term += ` + ${HYP3ECombatant.INITIATIVE_VALUE_MAGIC}`;    
        }
        // if (this.isSlow) term = `${HYP3ECombatant.INITIATIVE_VALUE_SLOWED}`;
        // If defeated, initiative is set to this static value
        if (this.isDefeated) term += `${HYP3ECombatant.INITIATIVE_VALUE_DEFEATED}`;
        const rollData = this.actor?.getRollData() || {};
        return new Roll(term, rollData);
    }

    async getData(options = {}) {
        const context = await super.getData(options);
        return foundry.utils.mergeObject(context, {
            melee: this.isMelee,
            missile: this.isMissile,
            magic: this.isMagic,
            movement: this.isMovement
        })
    }

}
  