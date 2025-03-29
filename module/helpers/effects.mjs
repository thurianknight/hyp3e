/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
 export function onManageActiveEffect(event, owner) {
    event.preventDefault();
    if (CONFIG.HYP3E.debugMessages) { console.log("Owner of Active Effect: ", owner) }
    const a = event.currentTarget;
    const li = a.closest("li");
    const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
    switch ( a.dataset.action ) {
        case "create":
            return owner.createEmbeddedDocuments("ActiveEffect", [{
                name: "New Effect",
                label: "New Effect",
                img: "icons/svg/aura.svg",
                origin: owner.uuid,
                "duration.rounds": li.dataset.effectType === "temporary" ? 1 : undefined,
                disabled: li.dataset.effectType === "inactive"
            }]);
        case "edit":
            return effect.sheet.render(true);
        case "delete":
            return effect.delete();
        case "toggle":
            let updates = {}
            if (effect.disabled) {
                if (CONFIG.HYP3E.debugMessages) { console.log("Enabling Effect: ", effect) }
                updates = {disabled: !effect.disabled};
                // Aside from simply toggling the disabled flag, we also want to track the 
                //  start of the effect if the actor is in combat. And if not in combat, 
                //  we want to clear the startRound and startTurn values since they are not valid.
                if (owner.inCombat) {
                    const combatant = game.combat.turns.find(c => c.actor.id === owner.id);
                    if (CONFIG.HYP3E.debugMessages) { console.log("In Combat: ", combatant) }
                    updates.duration = {
                        startRound: combatant.combat.current.round,
                        startTurn: combatant.combat.current.turn
                    }
                } else {
                    // If the actor is not in combat, remove the startRound and startTurn values.
                    updates.duration = {
                        startRound: null,
                        startTurn: null
                    }
                }
            } else {
                if (CONFIG.HYP3E.debugMessages) { console.log("Disabling Effect: ", effect) }
                // When disabling an effect, also remove the startRound and startTurn values.
                updates = {
                    disabled: !effect.disabled,
                    duration: {
                        startRound: null,
                        startTurn: null
                    }
                };
            }
            return effect.update(updates);
    }
}

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects) {

    // Define effect header categories
    const categories = {
        temporary: {
            type: "temporary",
            label: "Temporary Effects",
            effects: []
        },
        passive: {
            type: "passive",
            label: "Passive Effects",
            effects: []
        },
        inactive: {
            type: "inactive",
            label: "Inactive Effects",
            effects: []
        }
    };

    // Iterate over active effects, classifying them into categories
    for ( let e of effects ) {
        // e._getSourceName(); // Trigger a lookup for the source name
        if ( e.disabled ) categories.inactive.effects.push(e);
        else if ( e.isTemporary ) categories.temporary.effects.push(e);
        else categories.passive.effects.push(e);
    }
    return categories;
}