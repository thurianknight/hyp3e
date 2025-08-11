/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
 export function onManageActiveEffect(event, owner) {
    event.preventDefault();
    if (CONFIG.HYP3E.debugMessages) { console.log("onManageActiveEffect: Owner of Effect: ", owner) }
    const a = event.currentTarget;
    const li = a.closest("li");
    const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
    if (CONFIG.HYP3E.debugMessages) { console.log("onManageActiveEffect: Effect: ", effect) }
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
            if (!effect) {
                ui.notifications.info("Could not edit effect. Most likely, this is because the effect is coming from an item the actor owns.");
                return;
            }
            return effect.sheet.render(true);
        case "delete":
            if (!effect) {
                ui.notifications.info("Could not delete effect. Most likely, this is because the effect is coming from an item the actor owns.");
                return;
            }
            return effect.delete();
        case "toggle":
            if (!effect) {
                ui.notifications.info("Could not toggle effect. Most likely, this is because the effect is coming from an item the actor owns.");
                return;
            }
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
        if ( e.disabled ) categories.inactive.effects.push(e);
        else if ( e.isTemporary ) categories.temporary.effects.push(e);
        else categories.passive.effects.push(e);
    }
    return categories;
}

export async function setupEffectHandlers() {
    /**
     * Handle the creation of an active effect on an actor.
     */
    Hooks.on("createActiveEffect", async (effect, options, userId) => {
        // Only process if we're the one who owns this actor
        const actor = effect.parent;
        if (!actor?.isOwner) return;
        if (CONFIG.HYP3E.debugMessages) { console.log("createActiveEffect: Create event fired", effect) }

        // Store all changes for a single batch update at the end
        let updatedChanges = [...effect.changes];  // Start with a shallow copy
        let didUpdate = false;

        for (let i = 0; i < updatedChanges.length; i++) {
            const change = updatedChanges[i];
            // Parse the change.value string and resolve it into a number if possible
            const resolvedChange = await parseAndResolveChangeValue(change.value, actor)
            if (updatedChanges[i].value !== resolvedChange) {
                updatedChanges[i] = {
                    ...change,
                    value: resolvedChange
                };
                didUpdate = true;
            }
        }
        // Batch out the updates to the effect
        if (didUpdate) {
            if (CONFIG.HYP3E.debugMessages) { console.log("createActiveEffect: Updated Changes: ", updatedChanges) }
            await effect.update({
                changes: updatedChanges
            });
        }

        // Automatically set the remaining turns for active effects with a duration in rounds.
        //  This is useful for effects that are generally applied outside of combat and last for 
        //  multiple turns (much longer than a typical combat spell/effect).
        if (!effect.getFlag("hyp3e", "remainingTurns")) {
            // if (!effect.duration.rounds) return; // Only auto-set for effects with a rounds duration
            // Convert rounds to turns (6 rounds = 1 minute, 10 minutes = 1 turn)
            const durationTurns = Math.floor(effect.duration.rounds / 60) ?? undefined;
            if (durationTurns < 1) {
                console.log(`createActiveEffect: Effect ${effect.label} has <60 rounds and will expire at the next turn.`);
            } else if (isNaN(durationTurns)) {
                console.log(`createActiveEffect: Effect ${effect.label} has no duration limit and will not expire.`);
            }
            await effect.setFlag("hyp3e", "remainingTurns", durationTurns);
            console.log(`createActiveEffect: Auto-set remainingTurns to ${durationTurns} for ${effect.name}`);
        }

        // Does the effect include light source properties?
        const lightProps = effect.getFlag("hyp3e", "lightProps");
        if (lightProps) {
            // Find all placed tokens for this actor (usually just one) in the current scene
            for (const token of canvas.tokens.placeables) {
                if (token.actor?.id !== actor.id) continue;
                // Apply the light source to the token
                applyTokenLight(token, lightProps);
            }
        }
        // Theoretically we can continue processing here, for other types of effects...
    });

    /**
     * Handle the application of an active effect to an actor.
     */
    Hooks.on("applyActiveEffect", async(actor, change, current, delta, changes) => {
        // if (CONFIG.HYP3E.debugMessages) {
            // console.log("applyActiveEffect: Actor receiving effect:", actor);
            // console.log("applyActiveEffect: Change:", change);
            // console.log("applyActiveEffect: Other params:", current, delta, changes);
        // }
    });

    Hooks.on("updateActiveEffect", async(effect, change, options, userId) => {
        if ("disabled" in change) {
            const wasDisabled = change.disabled;
            if (wasDisabled === true) {
                console.log("Effect was just disabled:", effect);
                // Does the effect include light source properties?
                const lightProps = effect.getFlag("hyp3e", "lightProps");
                if (lightProps) {
                    // Find all placed tokens for this actor (usually just one) in the current scene
                    for (const token of canvas.tokens.placeables) {
                        if (token.actor?.id !== effect.parent.id) continue;

                        // Restore original light properties from the flag
                        const originalLight = token.document.getFlag("hyp3e", "originalLight");
                        if (originalLight) {
                            await token.document.update({ light: originalLight });
                            await token.document.unsetFlag("hyp3e", "originalLight");
                            console.log(`updateActiveEffect: Restored original light for token ${token.name}`);
                        } else {
                            await token.document.update({ light: null });
                            console.warn(`updateActiveEffect: Removed light source from token ${token.name}`);
                        }
                    }
                }
            } else if (wasDisabled === false) {
                console.log("Effect was just enabled:", effect);
                // Does the effect include light source properties?
                const lightProps = effect.getFlag("hyp3e", "lightProps");
                if (lightProps) {
                    // Find all placed tokens for this actor (usually just one) in the current scene
                    for (const token of canvas.tokens.placeables) {
                        if (token.actor?.id !== effect.parent.id) continue;
                        // Apply the light source to the token
                        await applyTokenLight(token, lightProps);
                    }
                }
            }
        }
    });

    /**
     * Handle the deletion of an active effect on an actor.
     */
    Hooks.on("deleteActiveEffect", async (effect, options, userId) => {
        const actor = effect.parent;
        if (!actor) return;

        // When an active effect is deleted, check whether it had modified the token's light.
        //  If so, restore the original light settings from the flag.
        const lightProps = effect.getFlag("hyp3e", "lightProps");
        if (lightProps) {
            for (const token of canvas.tokens.placeables) {
                if (token.actor?.id !== actor.id) continue;

                const originalLight = token.document.getFlag("hyp3e", "originalLight");
                if (!originalLight) continue;

                await token.document.update({ light: originalLight });
                await token.document.unsetFlag("hyp3e", "originalLight");

                console.log(`deleteActiveEffect: Restored original light for token ${token.name}`);
            }
        }
    });
}

/**
 * Split the changeValue string into parts, based on math symbols, then check each 
 *  part to see if it's a roll formula or a data path. Then we can reassemble the 
 *  string with the resolved values, and do the math on it.
 * @param {*} changeValue 
 * @param {*} actor 
 * @returns 
 */
export async function parseAndResolveChangeValue(changeValue, actor) {
    if (CONFIG.HYP3E.debugMessages) { console.log("parseAndResolveChangeValue: Change String: ", changeValue) }
    if (!changeValue) return
    // Split the string into parts & resolve each part
    const parts = changeValue.split(/(\+|\-|\*|\/)/).map(part => part.trim());
    const resolvedParts = await Promise.all(parts.map(async part => {
        // Check if the part is a roll formula
        if (Roll.validate(part)) {
            if (CONFIG.HYP3E.debugMessages) { console.log("parseAndResolveChangeValue: Roll Detected: ", part) }
            const roll = new Roll(part, actor?.getRollData?.());
            await roll.evaluate({ evaluateSync: true });
            if (CONFIG.HYP3E.debugMessages) { console.log("parseAndResolveChangeValue: Roll Total: ", roll.total) }
            return roll.total;
        }
        // Check if the part is a data path
        else if (part.startsWith("system.")) {
            if (CONFIG.HYP3E.debugMessages) { console.log("parseAndResolveChangeValue: Data Path: ", part) }
            const value = getProperty(actor, part);
            if (CONFIG.HYP3E.debugMessages) { console.log("parseAndResolveChangeValue: Data Value: ", value) }
            return value !== undefined ? value : part;
        }
        // If it's neither, return the original part
        return part;
    }));
    // Reassemble the resolved parts into a string of additions
    const resolvedString = resolvedParts.join("");
    if (CONFIG.HYP3E.debugMessages) { console.log("parseAndResolveChangeValue: Resolved String: ", resolvedString) }
    let result = null;
    try {
        // Evaluate the resolved string as a math expression
        result = eval(resolvedString)
    } catch (e) {
        // If the string can't be evaluated, log it and return the original changeValue
        console.info(`parseAndResolveChangeValue: Cannot evaluate change value "${resolvedString}" to a number:`, e);
        return changeValue;
    }
    if (CONFIG.HYP3E.debugMessages) { console.log("parseAndResolveChangeValue: Result: ", result) }
    // Is the result a real number?
    if (isNaN(result)) {
        ui.notifications?.error(`Effect change value "${changeValue}" resolved to "${resolvedString}". Could not solve for a final number.`);
        return changeValue;
    } else {
        // If the result is a decimal, round it down to the nearest integer
        return Math.floor(result);
    }
}

/**
 * Handle applying a light source to a token document.
 * @param {*} token - The token document to receive the light source
 * @param {*} lightProps - An object containing the light properties to apply
 */
export async function applyTokenLight(token, lightProps) {
    if (CONFIG.HYP3E.debugMessages) { console.log("applyTokenLight: Token: ", token) }
    if (CONFIG.HYP3E.debugMessages) { console.log("applyTokenLight: Light Properties: ", lightProps) }

    // Prepare the light data
    const lightSource = {
        dim: lightProps.dim,
        bright: lightProps.bright,
        angle: lightProps.angle || 360, // Default to 360 degrees if no angle provided
        color: lightProps.color || "#ffffff", // Default to white if no color provided
        alpha: lightProps.alpha || 0.5, // Default alpha if none provided
        animation: lightProps.animation || { type: "none" } // Default animation if none provided
    };

    // Store original light properties as a flag, in case you want to restore later
    const currentLight = token.document.light;
    await token.document.setFlag("hyp3e", "originalLight", currentLight);

    // Update light on the placed token
    await token.document.update({
        "light": lightSource,
        "vision": true // Ensure the token can see
    });

    console.log(`applyTokenLight: Applied light source to token ${token.name}`);
}

/**
 * Apply specified effect from an item to the selected tokens
 * @param {itemId} string      The item that has the effect
 * @param {effectId} string    The effect ID to apply
 * @param {actorId} string     The actor that owns the item
 * @param {disabled} boolean   Whether to disable the effect when applying it
 */
export async function applyEffect(item, effectId, actorId, disabled = false) {
    // Get selected tokens
    const tokens = canvas?.tokens?.controlled;
    if (!tokens || tokens.length == 0) {
        ui.notifications?.error("Apply Effect: Please select at least one token.");
        return;
    }
    // Get the source actor
    const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
    if (!actor) {
        ui.notifications?.error(`Apply Effect: Actor ${actorId} not found!`)
        return
    }
    const actorData = actor.getRollData();
    // const item = actor.items.get(itemId);
    // if (!item) {
    //     ui.notifications?.error(`Apply Effect: Item ${itemId} not found!`);
    //     return;
    // }
    if (CONFIG.HYP3E.debugMessages) { console.log("applyEffect: Item: ", item) }
    const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;
    // Get the item effect to be applied
    const effect = item.effects.find(e => e.id === effectId);
    if (!effect) {
        ui.notifications?.error(`Apply Effect: Effect ${effectId} not found!`);
        return;
    }

    // Clone the effect, then work from that clone
    const effectData = new Object({...effect});
    effectData.origin = item.uuid;
    if (disabled) effectData.disabled = true;
    if (CONFIG.HYP3E.debugMessages) { console.log("applyEffect: Cloned Effect:", effectData) }

    // Check persistent damage effects for a valid roll formula, and resolve variables if needed
    const persistentDamage = effectData.changes.find(c => c.key === "system.tempPersistentDamage");
    let damageType, damageRoll
    if (persistentDamage) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`applyEffect: ${effectData.name}`, persistentDamage) }
        damageType = persistentDamage.value.split(",")[0];
        damageRoll = persistentDamage.value.split(",")[1];
        damageRoll = damageRoll.replace(";", "");
        // Check if the damage roll is a valid formula
        if (!Roll.validate(damageRoll, actorData)) {
            ui.notifications?.error(`Apply Effect: Invalid damage roll formula: ${damageRoll}`);
            return;
        }
        // Resolve variables in the damage roll formula
        const roll = new Roll(damageRoll, actor.getRollData());
        if (CONFIG.HYP3E.debugMessages) { console.log(`applyEffect: ${effectData.name} Roll: `, roll) }
        roll.evaluate({ evaluateSync: true });
        // Save the resolved roll formula for later use
        damageRoll = roll.formula;
    }

    // Initialize the chat string
    let chatMsg = ""

    // Apply the effect to selected tokens/actors
    for (const t of tokens) {
        if (CONFIG.HYP3E.debugMessages) { console.log("applyEffect: Target Token: ", t) }
        const result = await t.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
        if (CONFIG.HYP3E.debugMessages) { console.log("applyEffect: result: ", result) }
        const childEffect = result[0];
        console.log("applyEffect: Created Effect: ", childEffect)
        if (CONFIG.HYP3E.debugMessages) { console.log("applyEffect: Target Actor: ", t.actor) }
        chatMsg += `<p>${actor.name} applied <i>${effectData.name}</i> to ${t.name}.</p>`
        // Now we get the newly-created effect, and modify the persistent damage roll if needed
        if (persistentDamage) {
            if (CONFIG.HYP3E.debugMessages) { console.log("applyEffect: New Effect: ", childEffect) }
            if (childEffect) {
                // If the effect has a persistent damage value, we need to update the effect with that value
                const newPersistentDamage = childEffect.changes.find(c => c.key === "system.tempPersistentDamage");
                if (newPersistentDamage) {
                    newPersistentDamage.value = `${damageType},${damageRoll}`;
                    if (CONFIG.HYP3E.debugMessages) { console.log(`applyEffect: ${effectData.name} New Persistent Damage: `, newPersistentDamage) }
                    childEffect.update({ changes: [newPersistentDamage] });
                }
            }
        }
    }
    // Send a chat message that the effect was applied
    const chatData = {
        author: game.user_id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        content: chatMsg
    };
    ChatMessage.create(chatData, {});

}

/**
 * Apply all effects from an item to the selected tokens
 * @param {itemId} string      The item that has the effects to apply
 * @param {actorId} string     The actor that owns the item
 * @param {disabled} boolean   Whether to disable the effects when applying them
 */
export async function applyAllEffects(item, actorId, disabled = false) {
    // Get selected tokens
    const tokens = canvas?.tokens?.controlled;
    if (!tokens || tokens.length == 0) {
        ui.notifications?.error("Apply Effects: Please select at least one token.");
        return;
    }
    // Get the actor
    const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
    if (!actor) {
        ui.notifications?.error(`Apply Effects: Actor ${actorId} not found!`)
        return
    }
    // const item = actor.items.get(itemId);
    // if (!item) {
    //     ui.notifications?.error(`Apply Effects: Item ${itemId} not found!`);
    //     return;
    // }
    if (CONFIG.HYP3E.debugMessages) { console.log("applyAllEffects: Item: ", item) }
    const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;

    // Check if the item has any effects to enable
    if (item.effects.contents.length === 0) {
        console.log(`applyAllEffects: Item ${itemName} has no effects to apply.`);
        return;
    }

    // Initialize the chat string
    let chatMsg = ""

    // Apply the effects to selected tokens/actors
    for (const t of tokens) {
        if (CONFIG.HYP3E.debugMessages) { console.log("applyAllEffects: Token: ", t) }
        if (CONFIG.HYP3E.debugMessages) { console.log("applyAllEffects: Token Actor: ", t.actor) }
        item.effects.forEach(effect => {
            // const effectData = foundry.utils.deepClone(effect);
            const effectData = {...effect};
            effectData.origin = item.uuid;
            if (disabled) effectData.disabled = true;
            if (CONFIG.HYP3E.debugMessages) { console.log("applyAllEffects: Cloned Effect:", effectData) }
            chatMsg += `<p>${actor.name} applied <i>${effectData.name}</i> to ${t.name}.</p>`
            // t.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
        });
    }
    // Send a chat message that the item was used
    const chatData = {
        author: game.user_id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        content: chatMsg
    };
    ChatMessage.create(chatData, {});
}

/**
 * Enable specified effect from the item, on the actor
 * @param {itemId} string      The item that has the effect
 * @param {effectId} string    The effect ID to enable
 * @param {actorId} string     The actor that owns the item and will receive/enable the effect
 */
export async function enableEffect(item, effectId, actorId) {
    // Get the actor
    const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
    if (!actor) {
        ui.notifications?.error(`Enable Effect: Actor ${actorId} not found!`)
        return
    }
    // const item = actor.items.get(itemId);
    // if (!item) {
    //     ui.notifications?.error(`Enable Effect: Item ${itemId} not found!`);
    //     return;
    // }
    if (CONFIG.HYP3E.debugMessages) { console.log("enableEffect: Item: ", item) }
    const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;
    // Get the item effect to be enabled
    const effect = item.effects.find(e => e.id === effectId);
    if (!effect) {
        ui.notifications?.error(`Enable Effect: Effect ${effectId} not found!`);
        return;
    }

    // Initialize the chat string
    let chatMsg = ""

    // Enable the effect on the actor
    if (CONFIG.HYP3E.debugMessages) { console.log(`enableEffect: Effect to enable: `, effect) }
    // Update the item effect
    effect.update({ disabled: false });
    if (!foundry.utils.isNewerVersion(game.version, "13")) {
        // For Foundry v12 only...
        // We updated the effect on the source item. Now, find the matching effect on 
        //  the actor, so we can toggle that as well.
        const actorEffect = actor.effects.find(e => e.parent.id === actor.id && e.name === effect.name);
        if (actorEffect) {
            // actorEffect.update({ disabled: false });
        } else {
            // If the effect can't be found, we apply the effect to the actor instead.
            // applyEffect(item, effectId, actorId, false);
        }
    }
    chatMsg += `<p><i>${effect.name}</i> enabled on ${actor.name}.</p>`

    // Send a chat message that the effect was enabled
    const chatData = {
        author: game.user_id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        content: chatMsg
    };
    ChatMessage.create(chatData, {});

}

/**
 * Enable all effects from the item, on the actor
 * @param {itemId} string      The item that has the effects to enable
 * @param {actorId} string     The actor that owns the item and will receive/enable the effects
 */
export async function enableAllEffects(item, actorId, transferOnly = false) {
    // Get the actor
    const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
    if (!actor) {
        ui.notifications?.error(`Enable All Effects: Actor ${actorId} not found!`)
        return
    }
    // const item = actor.items.get(itemId);
    // if (!item) {
    //     ui.notifications?.error(`Enable All Effects: Item ${itemId} not found!`);
    //     return;
    // }
    if (CONFIG.HYP3E.debugMessages) { console.log("enableAllEffects: Item: ", item) }
    const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;

    // Check if the item has any effects to enable
    if (item.effects.contents.length === 0) {
        console.log(`enableAllEffects: Item ${itemName} has no effects to enable.`);
        return;
    }

    // Initialize the chat string
    let chatMsg = ""

    // Enable the effects on the actor
    item.effects.forEach(effect => {
        if (!transferOnly || transferOnly && effect.transfer) {
            if (CONFIG.HYP3E.debugMessages) { console.log(`enableAllEffects: Effect to enable: `, effect) }
            // Update the item effect
            effect.update({ disabled: false });
            if (!foundry.utils.isNewerVersion(game.version, "13")) {
                // For Foundry v12 only...
                // We updated the effect on the source item. Now, find the matching effect on 
                //  the actor, so we can toggle that as well.
                const actorEffect = actor.effects.find(e => e.parent.id === actor.id && e.name === effect.name);
                if (actorEffect) {
                    // actorEffect.update({ disabled: false });
                } else {
                    // If the effect can't be found, we apply the effect to the actor instead.
                    // applyAllEffects(item, actorId, false);
                }
            }
            chatMsg += `<p><i>${effect.name}</i> enabled on ${actor.name}.</p>`
        }
    })
    // Send a chat message that the effects were enabled
    const chatData = {
        author: game.user_id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        content: chatMsg
    };
    ChatMessage.create(chatData, {});

}

/**
 * Disable specified effect from the item, on the actor
 * @param {itemId} string      The item that has the effect
 * @param {effectId} string    The effect ID to disable
 * @param {actorId} string     The actor that owns the item and will disable the effect
 */
export async function disableEffect(item, effectId, actorId) {
    // Get the actor
    const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
    if (!actor) {
        ui.notifications?.error(`Disable Effect: Actor ${actorId} not found!`)
        return
    }
    // const item = actor.items.get(itemId);
    // if (!item) {
    //     ui.notifications?.error(`Disable Effect: Item ${itemId} not found!`);
    //     return;
    // }
    if (CONFIG.HYP3E.debugMessages) { console.log("disableEffect: Item: ", item) }
    const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;
    // Get the item effect to be disabled
    const effect = item.effects.find(e => e.id === effectId);
    if (!effect) {
        ui.notifications?.error(`Disable Effect: Effect ${effectId} not found!`);
        return;
    }

    // Initialize the chat string
    let chatMsg = ""

    if (CONFIG.HYP3E.debugMessages) { console.log(`disableEffect: Effect to disable: `, effect) }
    // Update the item effect
    effect.update({ disabled: true });
    if (!foundry.utils.isNewerVersion(game.version, "13")) {
        // For Foundry v12 only...
        // We updated the effect on the source item. Now, find the matching effect on 
        //  the actor, so we can toggle that as well.
        const actorEffect = actor.effects.find(e => e.parent.id === actor.id && e.name === effect.name);
        if (actorEffect) {
            // actorEffect.update({ disabled: true });
        } else {
            // If the effect can't be found, we apply the effect to the actor instead.
            // applyEffect(item, effectId, actorId, true);
        }
    }
    chatMsg += `<p><i>${effect.name}</i> disabled on ${actor.name}.</p>`
    // Send a chat message that the effect was disabled
    const chatData = {
        author: game.user_id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        content: chatMsg
    };
    ChatMessage.create(chatData, {});

}

/**
 * Disable all effects from the item, on the actor
 * @param {itemId} string      The item that has the effects to disable
 * @param {actorId} string     The actor that owns the item and will disable the effects
 */
export async function disableAllEffects(item, actorId, transferOnly = false) {
    let chatMsg = ""

    // Get the actor & item
    const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
    if (!actor) {
        ui.notifications?.error(`Disable All Effects: Actor ${actorId} not found!`)
        return
    }
    // const item = actor.items.get(itemId);
    // if (!item) {
    //     ui.notifications?.error(`Disable All Effects: Item ${itemId} not found!`);
    //     return;
    // }
    if (CONFIG.HYP3E.debugMessages) { console.log("disableAllEffects: Item: ", item) }
    const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;

    // Check if the item has any effects to disable
    if (item.effects.contents.length === 0) {
        console.log(`disableAllEffects: Item ${itemName} has no effects to disable.`);
        return;
    }

    item.effects.forEach(effect => {
        if (!transferOnly || transferOnly && effect.transfer) {
            if (CONFIG.HYP3E.debugMessages) { console.log(`disableAllEffects: Effect to disable: `, effect) }
            // Update the item effect
            effect.update({ disabled: true });
            if (!foundry.utils.isNewerVersion(game.version, "13")) {
                // For Foundry v12 only...
                // We updated the effect on the source item. Now, find the matching effect on 
                //  the actor, so we can toggle that as well.
                const actorEffect = actor.effects.find(e => e.parent.id === actor.id && e.name === effect.name);
                if (actorEffect) {
                    // actorEffect.update({ disabled: true });
                } else {
                    // If the effect can't be found, we apply the effect to the actor instead.
                    // applyAllEffects(item, actorId, true);
                }
            }
            chatMsg += `<p><i>${effect.name}</i> disabled on ${actor.name}.</p>`
        }
    })
    // Send a chat message that the effects were disabled
    const chatData = {
        author: game.user_id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        content: chatMsg
    };
    ChatMessage.create(chatData, {});

}
