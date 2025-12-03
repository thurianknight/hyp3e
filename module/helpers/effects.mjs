import { Hyp3eLogger } from "./logger.mjs";
import { HYP3EConditionEditor } from "../apps/condition-editor.mjs";

/**
 * Manage Active Effect instances through the Actor/Item Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
 export function onManageActiveEffect(event, owner) {
    event.preventDefault();
    Hyp3eLogger.info("onManageActiveEffect", `Owner of Effect:`, owner);
    const a = event.currentTarget;
    const li = a.closest("li");
    const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
    Hyp3eLogger.info("onManageActiveEffect", `Effect:`, effect);
    switch ( a.dataset.action ) {
        case "createEffect":
            _createEffect(owner, a.dataset);
            break;
        case "editEffect":
            if (!effect) {
                ui.notifications.info("Could not edit effect. Most likely, this is because the effect is coming from an item the actor owns.");
                return;
            }
            return effect.sheet.render(true);
        case "deleteEffect":
            if (!effect) {
                ui.notifications.info("Could not delete effect. Most likely, this is because the effect is coming from an item the actor owns.");
                return;
            }
            return effect.delete();
        case "toggleEffect":
            if (!effect) {
                ui.notifications.info("Could not toggle effect. Most likely, this is because the effect is coming from an item the actor owns.");
                return;
            }
            _toggleEffect(effect, owner);
            break;
        default:
            Hyp3eLogger.warn("onManageActiveEffect", `Unknown action:`, a.dataset.action);
    }
}

/**
 * Manage Active Effect instances through the Actor/Item SheetV2 via effect control buttons.
 * @param {MouseEvent} target     The selected/clicked effect control
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
export function onManageActiveEffectV2(target, owner) {
    Hyp3eLogger.info("onManageActiveEffectV2", `Owner of Effect:`, owner);
    const effectId = $(target).closest(".item-entry").data("effectId")
    const effect = effectId ? owner.effects.get(effectId) : null;
    Hyp3eLogger.info("onManageActiveEffectV2", `Effect:`, effect);
    switch ( target.dataset.action ) {
        case "createEffect":
            _createEffect(owner, target.dataset);
            break;
        case "editEffect":
            if (!effect) {
                ui.notifications.info("Could not edit effect. Most likely, this is because the effect is coming from an item the actor owns.");
                return;
            }
            return effect.sheet.render(true);
        case "deleteEffect":
            if (!effect) {
                ui.notifications.info("Could not delete effect. Most likely, this is because the effect is coming from an item the actor owns.");
                return;
            }
            return effect.delete();
        case "toggleEffect":
            if (!effect) {
                ui.notifications.info("Could not toggle effect. Most likely, this is because the effect is coming from an item the actor owns.");
                return;
            }
            _toggleEffect(effect, owner);
            break;
        default:
            Hyp3eLogger.error("onManageActiveEffectV2", `Unknown action:`, target.dataset.action);
    }
}

function _createEffect(owner, dataset) {
    return owner.createEmbeddedDocuments("ActiveEffect", [{
        name: "New Effect",
        label: "New Effect",
        img: "icons/svg/aura.svg",
        origin: owner.uuid,
        sourceName: owner.name,
        "duration.rounds": dataset.effectType === "temporary" ? 1 : undefined,
        disabled: dataset.effectType === "inactive"
    }]);
}

function _toggleEffect(effect, owner) {
    let updates = {}
    if (effect.disabled) {
        Hyp3eLogger.info("_toggleEffect", `Enabling Effect:`, effect);
        updates = {disabled: !effect.disabled};
        // Aside from simply toggling the disabled flag, we also want to track the 
        //  start of the effect if the actor is in combat. And if not in combat, 
        //  we want to clear the startRound and startTurn values since they are not valid.
        if (owner.inCombat) {
            const combatant = game.combat.turns.find(c => c.actor.id === owner.id);
            Hyp3eLogger.info("_toggleEffect", `In Combat:`, combatant);
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
        Hyp3eLogger.info("_toggleEffect", `Disabling Effect:`, effect);
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

/**********************************************************
 * Effect Hook Handlers
 **********************************************************/

export async function setupEffectHandlers() {
    /**
     * Capture ActiveEffectConfig and insert new items
     */
    Hooks.on("renderActiveEffectConfig", (app, html, data) => {
        const html$ = $(html)
        // v12: ActiveEffectConfig.object
        // v13: ActiveEffectConfig.document
        const effect = app.object ?? app.document;
        const current = effect.getFlag("hyp3e", "durationFormula") ?? "";
        // const current = "";

        // Build the html for Duration Formula
        const field = $(`
            <div class="form-group">
                <label>Duration Formula</label>
                <div class="form-fields">
                    <input type="text" name="flags.hyp3e.durationFormula"
                            value="${current}" placeholder="e.g. 1d6+2" />
                    <p class="notes">Optional roll formula (overrides fixed duration).</p>
                </div>
            </div>
        `);

        // Insert just after the rounds input
        html$.find('input[name="duration.rounds"]').closest(".form-group").after(field);

        // Don't insert the Condition Editor button if one already exists
        if (html$.find("button.hyp3e-condition-edit").length) return;

        // Find a suitable place to inject the Condition Editor button
        const footer = html$.find("footer");
        if (!footer.length) return;

        // Button html
        const btn = $(`<button type="button" class="hyp3e-condition-edit">
                        Conditionally Apply Effect…
                      </button>`);

        // Insert just ahead of the sheet footer
        btn.insertBefore(footer);
      
        btn.click(ev => {
          Hyp3eLogger.info("renderActiveEffectConfig", `Opening Condition Editor for effect:`, effect);
          new HYP3EConditionEditor({ effect }).render(true);
        });
    });

    /**
     * Handle the creation of an active effect on an actor. This ONLY applies to effects
     * applied directly to the actor, not effects coming from an equipped item.
     */
    Hooks.on("createActiveEffect", async (effect, options, userId) => {
        // Only process if we're the one who owns this actor
        const actor = effect.parent;
        if (!actor?.isOwner) return;
        // Only let the GM create the effect
        if (!game.user.isGM) return;
        Hyp3eLogger.info("createActiveEffect", `Create event fired:`, effect);

        // Get data stored in the effect's flags
        const sourceUuid = effect.getFlag("hyp3e", "sourceActorUuid");
        const sourceActor = sourceUuid ? await fromUuid(sourceUuid) : effect.parent;
        const actorData = sourceActor?.system ?? {};
        Hyp3eLogger.info("createActiveEffect", `Actor applying the effect:`, actorData);

        // Flag to track whether anything needs to be updated
        let didUpdate = false;

        // Check to see if we have a rollable Duration formula, and resolve it if so
        const { updatedDuration, updated } = checkAndResolveDuration(effect, actorData);
        Hyp3eLogger.info("createActiveEffect", `Effect "${effect.name}" duration:`, updatedDuration);
        if (updated) didUpdate = true;

        // Store all changes for a batch update at the end
        let updatedChanges = [...effect.changes];  // Start with a shallow copy

        for (let i = 0; i < updatedChanges.length; i++) {
          const change = updatedChanges[i];
          // Store the change value regardless of whether it's a formula or not
          if (!change.flags?.hyp3e?.originalValue) {
            change.flags = change.flags || {};
            change.flags.hyp3e = change.flags.hyp3e || {};
            change.flags.hyp3e.originalValue = change.value;
            didUpdate = true;
          }
          // Parse the change.value string and resolve it into a number if possible
          if (!/^-?\d+(\.\d+)?$/.test(change.value)) {
            const resolvedChange = parseAndResolveChangeValue(change.value, actorData)
            if (updatedChanges[i].value !== resolvedChange) {
              updatedChanges[i] = {
                ...change,
                value: resolvedChange
              };
              didUpdate = true;
            }
          }
        }

        // Batch out the updates to the effect
        if (didUpdate) {
            Hyp3eLogger.info("createActiveEffect", `Duration:`, updatedDuration)
            Hyp3eLogger.info("createActiveEffect", `Changes:`, updatedChanges)
            await effect.update({
                duration: updatedDuration,
                changes: updatedChanges
            });
        }

        // Automatically set the remaining turns for active effects with a duration in rounds.
        //  This is useful for effects that are generally applied outside of combat and last for 
        //  multiple turns (much longer than a typical combat spell/effect).
        if (!effect.getFlag("hyp3e", "remainingTurns")) {
            // Convert rounds to turns (6 rounds = 1 minute, 10 minutes = 1 turn)
            const durationRounds = effect.duration.rounds ?? effect.duration.turns ?? null;
            const durationTurns = Math.floor(durationRounds / 60) ?? null;
            if (durationRounds && durationRounds < 60) {
                Hyp3eLogger.info("createActiveEffect", `Effect ${effect.name} has duration <60 rounds and will expire at the next turn.`);
            } else if (isNaN(durationTurns)) {
                Hyp3eLogger.info("createActiveEffect", `Effect ${effect.name} has no duration limit and will not expire.`);
            }
            await effect.setFlag("hyp3e", "remainingTurns", durationTurns);
            Hyp3eLogger.info("createActiveEffect", `Auto-set remainingTurns to ${durationTurns} for ${effect.name}`);
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
        // Send a chat message that the effect was applied
        sendEffectChatMessage(effect)

    });

    /**
     * Handle the update of an active effect on an actor.
     */
    Hooks.on("updateActiveEffect", async(effect, change, options, userId) => {
        if ("disabled" in change) {
            const wasDisabled = change.disabled;
            if (wasDisabled === true) {
                Hyp3eLogger.info("updateActiveEffect", `Effect ${effect.name} was just disabled:`, effect);
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
                            Hyp3eLogger.info("updateActiveEffect", `Restored original light for token ${token.name}`);
                        } else {
                            await token.document.update({ light: null });
                        }
                    }
                }
            } else if (wasDisabled === false) {
                Hyp3eLogger.info("updateActiveEffect", `Effect ${effect.name} was just enabled:`, effect);
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

                Hyp3eLogger.info("deleteActiveEffect", `Restored original light for token ${token.name}`);
            }
        }
    });
}

/**********************************************************
 * Parsing, Variable Resolution, and Utility Functions
 **********************************************************/

/**
 * Split the changeValue string into parts, based on math symbols, then check each 
 *  part to see if it's a roll formula or a data path. Then we can reassemble the 
 *  string with the resolved values, and do the math on it.
 * @param {*} changeValue 
 * @param {*} actor 
 * @returns 
 */
export function parseAndResolveChangeValue(changeValue, actorData) {
  if (!changeValue) return;

  Hyp3eLogger.info("parseAndResolveChangeValue", `Change string:`, changeValue);

  const result = resolveFormula(changeValue, actorData);

  if (result === null) {
    Hyp3eLogger.info("parseAndResolveChangeValue", `Could not evaluate "${changeValue}". Returning original.`);
    return changeValue;
  }

  Hyp3eLogger.info("parseAndResolveChangeValue", `Parsed result:`, result);

  return Math.floor(result);
}
// export function parseAndResolveChangeValue(changeValue, actor) {
//     Hyp3eLogger.info("parseAndResolveChangeValue", `Change String:`, changeValue);
//     if (!changeValue) return

//     // Split the string into parts & resolve each part
//     const parts = changeValue.split(/(\+|\-|\*|\/|\%|\(|\))/).map(part => part.trim());
//     // const resolvedParts = await Promise.all(parts.map(async part => {
//     const resolvedParts = parts.map(part => {
//       // Check if the part is a roll formula
//         if (Roll.validate(part)) {
//             Hyp3eLogger.info("parseAndResolveChangeValue", `Roll Detected:`, part);
//             const roll = new Roll(part, actor?.getRollData?.());
//             // await roll.evaluate({ evaluateSync: true });
//             roll.evaluateSync();
//             Hyp3eLogger.info("parseAndResolveChangeValue", `Roll Total:`, roll.total);
//             return roll.total;
//         }
//         // Check if the part is a data path
//         else if (part.startsWith("system.")) {
//             Hyp3eLogger.info("parseAndResolveChangeValue", `Data Path:`, part);
//             const value = foundry.utils.getProperty(actor, part);
//             Hyp3eLogger.info("parseAndResolveChangeValue", `Data Value:`, value);
//             return value !== undefined ? value : part;
//         }

//         // If it's neither, return the original part
//         return part;
//     });
//     // Reassemble the resolved parts into a string of additions
//     const resolvedString = resolvedParts.join("");
//     Hyp3eLogger.info("parseAndResolveChangeValue", `Resolved String:`, resolvedString);
//     let result = null;
//     try {
//         // Evaluate the resolved string as a math expression
//         result = eval(resolvedString)
//     } catch (e) {
//         // If the string can't be evaluated, log it and return the original changeValue
//         Hyp3eLogger.info("parseAndResolveChangeValue", `Cannot evaluate change value "${resolvedString}" to a number:`, e);
//         return changeValue;
//     }
//     Hyp3eLogger.info("parseAndResolveChangeValue", `Parsed result:`, result);
//     // Is the result a real number?
//     if (isNaN(result)) {
//         ui.notifications?.error(`Effect change value "${changeValue}" resolved to "${resolvedString}". Could not solve for a final number.`);
//         return changeValue;
//     } else {
//         // If the result is a decimal, round it down to the nearest integer
//         return Math.floor(result);
//     }
// }

/**
 * Resolve a custom duration formula to a final number for rounds and turns.
 * @param {*} effect 
 * @param {*} actorData 
 * @returns 
 */
export function checkAndResolveDuration(effect, actorData) {
  let updatedDuration = { ...effect.duration };
  let updated = false;

  const formula = effect.getFlag("hyp3e", "durationFormula");
  if (!formula) return { updatedDuration, updated };

  Hyp3eLogger.info("checkAndResolveDuration", `Actor applying effect:`, actorData);

  // Only actors can apply rolled durations
  // if (!(effect.parent instanceof Actor)) {
  //   updatedDuration = { rounds: 1, turns: 1 };
  //   updated = true;
  //   return { updatedDuration, updated };
  // }

  const result = resolveFormula(formula, actorData);

  if (result === null) {
    Hyp3eLogger.error("checkAndResolveDuration", `Invalid duration formula "${formula}"`);
    return { updatedDuration, updated };
  }

  const rounds = Math.max(1, Math.floor(result));

  updatedDuration = { rounds, turns: rounds };
  updated = true;

  Hyp3eLogger.info("checkAndResolveDuration", `Effect "${effect.name}" resolved duration "${formula}" to ${rounds} rounds`);

  return { updatedDuration, updated };
}
// export function checkAndResolveDuration(effect, sourceActorData) {
//     // Store duration for update
//     let updatedDuration = {...effect.duration};  // Start with a shallow copy
//     // Flag to track whether anything needs to be updated
//     let updated = false;
//     // Check to see if we have a rollable duration formula, exit here if not
//     const formula = effect.getFlag("hyp3e", "durationFormula");
//     if (!formula) return { updatedDuration, updated };
//     Hyp3eLogger.info("checkAndResolveDuration", `Actor applying the effect:`, sourceActorData);

//     // Resolve the formula to a number
//     if (formula) {
//         try {
//             // Only roll if the parent (target) is an Actor
//             if (!(effect.parent instanceof Actor)) {
//                 updatedDuration = { rounds: 1, turns: 1 };
//                 updated = true;
//                 return { updatedDuration, updated };
//             }

//             // Replace @variables
//             let expanded = formula.replace(/@([A-Za-z0-9.]+)/g, (_, key) => {
//                 return foundry.utils.getProperty(sourceActorData, key) ?? 0;
//             });
//             Hyp3eLogger.info("checkAndResolveDuration", `Effect "${effect.name}" expanded duration formula: "${expanded}".`);

//             // Evaluate any dice expressions
//             const diceRegex = /\b(\d*d\d+(?:[+-]\d+)*)\b/g;
//             const diceMatches = [...expanded.matchAll(diceRegex)];
//             for (const match of diceMatches) {
//                 try {
//                     // Use async evaluation
//                     // const roll = await (new Roll(match[1])).evaluate({ async: true });
//                     const roll = new Roll(match[1]).evaluateSync();
//                     expanded = expanded.replace(match[0], roll.total);
//                 } catch (err) {
//                     Hyp3eLogger.warn("checkAndResolveDuration", `Invalid dice segment "${match[1]}" in formula "${formula}"`, err);
//                 }
//             }
//             Hyp3eLogger.info("checkAndResolveDuration", `Effect "${effect.name}" formula roll resolved: "${expanded}".`);

//             // Evaluate final JS expression (allow Math)
//             let result = 0;
//             try {
//                 // eslint-disable-next-line no-new-func
//                 const func = new Function("Math", `return (${expanded});`);
//                 result = func(Math);
//             } catch (err) {
//                 Hyp3eLogger.error("checkAndResolveDuration", `Error evaluating JS expression in formula "${expanded}"`, err);
//                 result = 1; // fallback to 1 round
//             }
//             const rounds = Math.max(1, Math.floor(result)); // at least 1 round
//             updatedDuration = { rounds, turns: rounds };
//             updated = true;

//             // const roll = await new Roll(formula).evaluate({ evaluateSync: true });
//             // const rounds = roll.total;
//             // updatedDuration = { "rounds": rounds, "turns": rounds };
//             Hyp3eLogger.info("checkAndResolveDuration", `Effect "${effect.name}" resolved duration "${formula}" to ${rounds} rounds`);
//         } catch (err) {
//             Hyp3eLogger.error("checkAndResolveDuration", `Invalid duration formula: ${formula}`, err);
//         }
//     }
//     Hyp3eLogger.info("checkAndResolveDuration", `Return data:`, { updatedDuration, updated });
//     return { updatedDuration, updated };
// }

/**
 * Resolve a formula string like "1d6 + @str.atkMod" into a number.
 * Supports:
 *   - @data.path lookups
 *   - Dice expressions (e.g. 2d8+3)
 *   - Math expressions (Math.ceil, Math.floor, etc.)
 *
 * @param {string} formula
 * @param {object} dataSource  // usually actor or actor.getRollData()
 * @returns {number|null}
 */
export function resolveFormula(formula, dataSource = {}) {
  if (!formula || typeof formula !== "string") return null;

  try {
    // Replace dataSource @variables
    let expanded = formula.replace(/@([A-Za-z0-9.]+)/g, (_, key) => {
      return foundry.utils.getProperty(dataSource, key) ?? 0;
    });

    // Replace all dice expressions with rolled totals
    const diceRegex = /\b(\d*d\d+(?:[+-]\d+)*)\b/g;
    const matches = [...expanded.matchAll(diceRegex)];

    for (const match of matches) {
      try {
        const roll = new Roll(match[1], dataSource).evaluateSync();
        expanded = expanded.replace(match[0], roll.total);
      } catch (err) {
        Hyp3eLogger.warn("resolveFormula", `Invalid dice expression "${match[1]}"`, err);
      }
    }

    // Evaluate final numeric expression
    let result = null;
    try {
      // eslint-disable-next-line no-new-func
      const func = new Function("Math", `return (${expanded});`);
      result = func(Math);
    } catch (err) {
      // If we fail here, it's probably because the change value is a simple string of text
      Hyp3eLogger.info("resolveFormula", `Error evaluating formula "${expanded}"`, err);
      return null;
    }

    if (typeof result !== "number" || isNaN(result)) return null;

    return result;

  } catch (err) {
    Hyp3eLogger.error("resolveFormula", `Unhandled error in resolveFormula("${formula}")`, err);
    return null;
  }
}

/**
 * Handle applying a light source to a token document.
 * @param {*} token - The token document to receive the light source
 * @param {*} lightProps - An object containing the light properties to apply
 */
export async function applyTokenLight(token, lightProps) {
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

    Hyp3eLogger.info("applyTokenLight", `Applied light source to token ${token.name}`);
}

/**
 * Send a standardized chat message whenever an ActiveEffect is applied.
 * @param {ActiveEffect} effect - The effect that was just created.
 */
async function sendEffectChatMessage(effect) {
    const messageParts = [];
    // Who is affected
    let target = effect.parent; // usually an Actor
    // If target is an item, get its actor
    if (target?.documentName === "Item") {
        Hyp3eLogger.info("sendEffectChatMessage", `Effect target is an Item, getting its Actor...`);
        target = target.actor;
    }
    const targetName = target?.name ?? "Unknown Target";

    // Effect details
    const effectName = effect.name ?? "Unknown Effect";

    // Source metadata from flag
    const sourceData = effect.getFlag("hyp3e", "source") || {};
    const sourceName = sourceData.appliedBy ?? effect.sourceName ?? "Unknown Source";
    Hyp3eLogger.info("sendEffectChatMessage", `Effect being applied:`, effect);

    // Start with the effect name
    messageParts.push(`<i>${effectName}</i>`);

    // Does this effect have a Duration?
    if (!effect.disabled) {
        if (effect.duration && (effect.duration.rounds || effect.duration.turns)) {
            if (effect.duration.rounds) {
                messageParts.push(`(${effect.duration.rounds} rounds)`);
            } else if (effect.duration.turns) {
                messageParts.push(`(${effect.duration.turns} rounds)`);
            }
        }
    }

    // Is the effect being added/enabled, or disabled/removed?
    messageParts.push(effect.disabled ? "removed from" : "applied to");

    // Target name
    messageParts.push(`<strong>${targetName}</strong>`);

    // If it's being added or applied, add source name
    if (sourceName != targetName && sourceName !== "None") messageParts.push(`by ${sourceName}`);

    // Build consistently styled content
    // const content = `
    //     <p><strong>${effect.sourceName}:</strong></p>
    //     <ul><li>${messageParts.join(" ")}.</li></ul>
    // `;
    const content = `
        <ul><li>${messageParts.join(" ")}.</li></ul>
    `;
    Hyp3eLogger.info("sendEffectChatMessage", `Chat Content:`, content);

    // Dispatch the chat message
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: target }),
        content,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
}

/**********************************************************
 * Effect Apply/Remove Functions
 **********************************************************/

/**
 * Apply specified effect from an item or spell to the selected tokens
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
  Hyp3eLogger.info("applyEffect", `Source item:`, item);
  const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;
  // Get the item effect to be applied
  const effect = item.effects.find(e => e.id === effectId);
  if (!effect) {
    const msg = `Apply Effect: Effect ${effectId} on item ${itemName} not found!`
    Hyp3eLogger.error("applyEffect", msg)
    ui.notifications?.error(msg);
    return;
  }

  // Clone the effect, then work from that clone
  const effectData = new Object({...effect});
  effectData.origin = item.uuid;
  if (disabled) effectData.disabled = true;
  Hyp3eLogger.info("applyEffect", `Cloned Effect:`, effectData);

  // Check persistent damage effects for a valid roll formula, and resolve variables if needed
  const persistentDamage = effectData.changes.find(c => c.key === "system.tempPersistentDamage");
  let damageType, damageRoll
  if (persistentDamage) {
    Hyp3eLogger.info("applyEffect", `${effectData.name} causes persistent damage:`, persistentDamage);
    damageType = persistentDamage.value.split(",")[0];
    damageRoll = persistentDamage.value.split(",")[1];
    damageRoll = damageRoll.replace(";", "");
    // Check if the damage roll is a valid formula
    if (!Roll.validate(damageRoll, actorData)) {
      const msg = `Apply Effect: Invalid damage roll formula: ${damageRoll}`;
      Hyp3eLogger.error("applyEffect", msg);
      ui.notifications?.error(msg);
      return;
    }
    // Resolve variables in the damage roll formula
    const roll = new Roll(damageRoll, actor.getRollData());
    Hyp3eLogger.info("applyEffect", `${effectData.name} Roll: `, roll);
    roll.evaluate({ evaluateSync: true });
    // Save the resolved roll formula for later use
    damageRoll = roll.formula;
  }

  // Apply the effect to selected tokens/actors
  for (const t of tokens) {
    Hyp3eLogger.info("applyEffect", `Target Token:`, t);
    const result = await t.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    const childEffect = result[0];
    Hyp3eLogger.info("applyEffect", `Created effect on token actor ${t.actor.name}:`, childEffect)

    // Set flag to store metadata about the effect source & target actor
    await childEffect.setFlag("hyp3e", "source", {
      srcItemUuid: item.uuid,
      srcActorUuid: actor.uuid,
      appliedBy: actor.name
    });
    // // Send a chat message that the effect was applied
    // sendEffectChatMessage(childEffect)
    // Now we get the newly-created effect, and modify the persistent damage roll if needed
    if (persistentDamage) {
      Hyp3eLogger.info("applyEffect", `New Effect:`, childEffect);
      if (childEffect) {
        // If the effect has a persistent damage value, we need to update the effect with that value
        const newPersistentDamage = childEffect.changes.find(c => c.key === "system.tempPersistentDamage");
        if (newPersistentDamage) {
          newPersistentDamage.value = `${damageType},${damageRoll}`;
          Hyp3eLogger.info("applyEffect", `${effectData.name} new persistent damage:`, newPersistentDamage);
          childEffect.update({ changes: [newPersistentDamage] });
        }
      }
    }
  }
}

/**
 * Apply all effects from an item to the selected tokens
 * @param {itemId} string      The item that has the effects to apply
 * @param {actorId} string     The actor that owns the item
 * @param {disabled} boolean   Whether to disable the effects when applying them
 */
export async function applyAllEffects(item, actorId, disabled = false) {
    ui.notifications?.info("Apply All Effects: This function is currently disabled.");
    // // Get selected tokens
    // const tokens = canvas?.tokens?.controlled;
    // if (!tokens || tokens.length == 0) {
    //     ui.notifications?.error("Apply Effects: Please select at least one token.");
    //     return;
    // }
    // // Get the actor
    // const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
    // if (!actor) {
    //     ui.notifications?.error(`Apply Effects: Actor ${actorId} not found!`)
    //     return
    // }
    // // const item = actor.items.get(itemId);
    // // if (!item) {
    // //     ui.notifications?.error(`Apply Effects: Item ${itemId} not found!`);
    // //     return;
    // // }
    // Hyp3eLogger.info("applyAllEffects", `Item:`, item) }
    // const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;

    // // Check if the item has any effects to enable
    // if (item.effects.contents.length === 0) {
    //     console.log(`applyAllEffects: Item ${itemName} has no effects to apply.`);
    //     return;
    // }

    // // Initialize the chat string
    // let chatMsg = ""

    // // Apply the effects to selected tokens/actors
    // for (const t of tokens) {
    //     Hyp3eLogger.info("applyAllEffects", `Token:`, t) }
    //     Hyp3eLogger.info("applyAllEffects", `Token Actor:`, t.actor) }
    //     item.effects.forEach(effect => async () => {
    //         // const effectData = foundry.utils.deepClone(effect);
    //         const effectData = {...effect};
    //         effectData.origin = item.uuid;
    //         if (disabled) effectData.disabled = true;
    //         Hyp3eLogger.info("applyAllEffects", `Cloned Effect:`, effectData) }
    //         // Set flag to store metadata about the effect source & target actor
    //         await effect.setFlag("hyp3e", "source", {
    //             srcItemUuid: item.uuid,
    //             srcActorUuid: actor.uuid,
    //             appliedBy: actor.name
    //         });
    //         chatMsg += `<p>${actor.name} applied <i>${effectData.name}</i> to ${t.name}.</p>`
    //         // t.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    //     });
    // }
    // // Send a chat message that the item was used
    // const chatData = {
    //     author: game.user_id,
    //     speaker: ChatMessage.getSpeaker({ actor: actor }),
    //     content: chatMsg
    // };
    // ChatMessage.create(chatData, {});
}

/**
 * Enable specified effect from the item, on the actor
 * @param {itemId} string      The item that causes the effect
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
    Hyp3eLogger.info("enableEffect", `Source item:`, item);
    const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;
    // Get the item effect to be enabled
    const effect = item.effects.find(e => e.id === effectId);
    if (!effect) {
        const msg = `Enable Effect: Effect ${effectId} not found!`;
        Hyp3eLogger.error("enableEffect", msg);
        ui.notifications?.error(msg);
        return;
    }
    // Set flag to store metadata about the effect source & target actor
    await effect.setFlag("hyp3e", "source", {
        srcItemUuid: item.uuid,
        srcActorUuid: actor.uuid,
        appliedBy: itemName
    });

    // Enable the effect on the actor
    Hyp3eLogger.info("enableEffect", `Effect to enable:`, effect);
    // Update the item effect
    await effect.update({ disabled: false });
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

    // Send a chat message that the effect was enabled
    sendEffectChatMessage(effect)
}

/**
 * Enable all effects from the item, on the actor
 * @param {itemId} string      The item that causes the effects to enable
 * @param {actorId} string     The actor that owns the item and will receive/enable the effects
 */
export async function enableItemEffectsOnActor(item, actorId) {
    // Get a list of item effects that are applied to the actor
    const transferEffects = item.effects.filter(e => e.transfer && e.duration.rounds === null && e.duration.turns === null);
    if (transferEffects.length === 0) {
        Hyp3eLogger.info("enableItemEffectsOnActor", `Item ${item.name} has no transferrable effects to apply.`);
        return;
    }
    Hyp3eLogger.info("enableItemEffectsOnActor", `Effect(s) to transfer:`, transferEffects);
    // Get the actor
    const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
    if (!actor) {
        const msg = `Enable All Item Effects: Actor ${actorId} not found!`;
        Hyp3eLogger.error("enableItemEffectsOnActor", msg);
        ui.notifications?.error(msg);
        return
    }
    const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;

    // Initialize the chat string
    let chatMsg = []
    chatMsg.push(`<p><strong>${itemName}:</strong></p><ul>`)

    // Enable the transferrable effects on the actor
    transferEffects.forEach(async effect => {
        Hyp3eLogger.info("enableItemEffectsOnActor", `Effect to enable:`, effect);
        chatMsg.push(`<li><i>${effect.name}</i> enabled on ${actor.name}.</li>`)
        // Update the item effect
        await effect.update({ disabled: false });
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
        // Set flag to store metadata about the effect source & target actor
        await effect.setFlag("hyp3e", "source", {
            srcItemUuid: item.uuid,
            srcActorUuid: actor.uuid,
            appliedBy: itemName
        });
    })
    chatMsg.push(`</ul>`)

    // Send a chat message that the effects were enabled
    Hyp3eLogger.info("enableItemEffectsOnActor", `Chat message:`, chatMsg);
    const chatData = {
        author: game.user_id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        content: chatMsg.join("")
    };
    ChatMessage.create(chatData, {});
}

/**
 * Disable specified effect from the item, on the actor
 * @param {itemId} string      The item that causes the effect
 * @param {effectId} string    The effect ID to disable
 * @param {actorId} string     The actor that owns the item and will disable the effect
 */
export async function disableEffect(item, effectId, actorId) {
    // Get the actor
    const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
    if (!actor) {
        const msg = `Disable Effect: Actor ${actorId} not found!`;
        Hyp3eLogger.error("disableEffect", msg);
        ui.notifications?.error(msg);
        return
    }

    Hyp3eLogger.info("disableEffect", `Source item:`, item);
    const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;
    // Get the item effect to be disabled
    const effect = item.effects.find(e => e.id === effectId);
    if (!effect) {
        const msg = `Disable Effect: Effect ${effectId} not found!`;
        Hyp3eLogger.error("disableEffect", msg);
        ui.notifications?.error(msg);
        return;
    }
    // Set flag to store metadata about the effect source & target actor
    await effect.setFlag("hyp3e", "source", {
        srcItemUuid: item.uuid,
        srcActorUuid: actor.uuid,
        appliedBy: itemName
    });

    Hyp3eLogger.info("disableEffect", `Effect to disable:`, effect);
    // Update the item effect
    await effect.update({ disabled: true });
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
    // Send a chat message that the effect was disabled
    sendEffectChatMessage(effect)
}

/**
 * Disable all effects from the item, on the actor
 * @param {itemId} string      The item that causes the effects to disable
 * @param {actorId} string     The actor that owns the item and will disable the effects
 */
export async function disableItemEffectsOnActor(item, actorId) {
    // Get a list of item effects that are applied to the actor
    const transferEffects = item.effects.filter(e => e.transfer);
    if (transferEffects.length === 0) {
        Hyp3eLogger.info("disableItemEffectsOnActor", `Item ${item.name} has no transferrable effects to disable.`);
        return;
    }
    Hyp3eLogger.info("disableItemEffectsOnActor", `Effect(s) to transfer:`, transferEffects);
    // Get the actor & item
    const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
    if (!actor) {
        const msg = `Disable All Item Effects: Actor ${actorId} not found!`;
        Hyp3eLogger.error("disableItemEffectsOnActor", msg);
        ui.notifications?.error(msg);
        return
    }
    const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;

    // Initialize the chat array
    let chatMsg = []
    chatMsg.push(`<p><strong>${itemName}:</strong></p><ul>`)

    // transferEffects.forEach(effect => async () => {
    transferEffects.forEach(async effect => {
        Hyp3eLogger.info("disableItemEffectsOnActor", `Effect to disable:`, effect);
        chatMsg.push(`<li><i>${effect.name}</i> disabled on ${actor.name}.</li>`)
        // Update the item effect
        await effect.update({ disabled: true });
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
        // Set flag to store metadata about the effect source & target actor
        await effect.setFlag("hyp3e", "source", {
            srcItemUuid: item.uuid,
            srcActorUuid: actor.uuid,
            appliedBy: itemName
        });
    })
    chatMsg.push(`</ul>`)

    // Send a chat message that the effects were disabled
    Hyp3eLogger.info("disableItemEffectsOnActor", `Chat message:`, chatMsg);
    const chatData = {
        author: game.user_id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        content: chatMsg.join("")
    };
    ChatMessage.create(chatData, {});
}
