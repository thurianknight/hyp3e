import { Hyp3eLogger } from "./logger.mjs";
import { HYP3E } from "./config.mjs";
import { sendSimpleChat } from "../chat/chat.mjs";
import { Hyp3eDice, isPureNumber, isPureString, containsDice, containsMathOrVariables } from "../dice/dice.mjs";
import { HYP3EConditionEditor } from "../apps/condition-editor.mjs";

/**
 * Manage Active Effect instances through the Actor/Item Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
 export function onManageActiveEffect(event, owner) {
    event.preventDefault();
    const a = event.currentTarget;
    const li = a.closest("li");
    const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
    switch ( a.dataset.action ) {
        case "createEffect":
            a.dataset.effectType = a.dataset.effectType || "passive";  // Default to "passive" if no type provided
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
            Hyp3eLogger.warn("ActiveEffect onManageActiveEffect", `Unknown action:`, a.dataset.action);
    }
}

/**
 * Manage Active Effect instances through the Actor/Item SheetV2 via effect control buttons.
 * @param {MouseEvent} target     The selected/clicked effect control
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
export function onManageActiveEffectV2(target, owner) {
    const effectId = $(target).closest(".item-entry").data("effectId")
    const effect = effectId ? owner.effects.get(effectId) : null;
    switch ( target.dataset.action ) {
        case "createEffect":
            target.dataset.effectType = target.dataset.effectType || "passive";  // Default to "passive" if no type provided
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
            Hyp3eLogger.error("ActiveEffect onManageActiveEffectV2", `Unknown action:`, target.dataset.action);
    }
}

function _createEffect(owner, dataset) {
    Hyp3eLogger.info("ActiveEffect _createEffect", `Creating new effect on ${owner.name} with dataset:`, dataset);
    const effectData = {
        name: "New Effect",
        label: "New Effect",
        img: "icons/svg/aura.svg",
        origin: owner.uuid,
        sourceName: owner.name,
        duration: {},
        disabled: dataset.effectType === "inactive"
    }
    // Foundry v14 changed the way embedded documents are created, so we have to check 
    //  the version and use the appropriate method
    const majorVersion = Number(game.version?.split(".")[0] ?? game.data.version.split(".")[0]);
    if (majorVersion <= 13) {
      effectData.duration = {
        rounds: dataset.effectType === "temporary" ? 1 : undefined,
        expiryEvent: dataset.effectType === "temporary" ? "turnEnd" : undefined
      };
    } else {  // Foundry v14 and later
      effectData.duration = {
        units: "rounds",
        value: dataset.effectType === "temporary" ? 1 : undefined,
        expiry: dataset.effectType === "temporary" ? "turnEnd" : undefined
      };
    }
    return owner.createEmbeddedDocuments("ActiveEffect", [effectData]);
}

function _toggleEffect(effect, owner) {
    let updates = {}
    if (effect.disabled) {
        Hyp3eLogger.info("ActiveEffect _toggleEffect", `Enabling Effect:`, effect);
        updates = {disabled: !effect.disabled};
        // Aside from simply toggling the disabled flag, we also want to track the 
        //  start of the effect if the actor is in combat. And if not in combat, 
        //  we want to clear the startRound and startTurn values since they are not valid.
        if (owner.inCombat) {
            const combatant = game.combat.turns.find(c => c.actor.id === owner.id);
            // Hyp3eLogger.info("ActiveEffect _toggleEffect", `In Combat:`, combatant);
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
        Hyp3eLogger.info("ActiveEffect _toggleEffect", `Disabling Effect:`, effect);
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

export function pushCustomStatusEffects() {
  // Build list of custom status effects and add to the CONFIG.statusEffects array
  const hasted = {
    id: "hasted",
    name: "HYP3E.statusEffects.hasted",
    img: `${HYP3E.assetsPath}/run.svg`,
    isActive: false
  }
  CONFIG.statusEffects.push(hasted)

  const slowed = {
    id: "slowed",
    name: "HYP3E.statusEffects.slowed",
    img: `${HYP3E.assetsPath}/snail.svg`,
    isActive: false
  }
  CONFIG.statusEffects.push(slowed)

  const flankAttack = {
    id: "flankAttack",
    name: "HYP3E.statusEffects.flankAttack",
    img: `${HYP3E.assetsPath}/backup.svg`,
    isActive: false
  }
  CONFIG.statusEffects.push(flankAttack)

  const rearAttack = {
    id: "rearAttack",
    name: "HYP3E.statusEffects.rearAttack",
    img: `${HYP3E.assetsPath}/backstab.svg`,
    isActive: false
  }
  CONFIG.statusEffects.push(rearAttack)

  const coverPartial = {
    id: "coverPartial",
    name: "HYP3E.statusEffects.coverPartial",
    img: `${HYP3E.assetsPath}/cover-fence.svg`,
    isActive: false
  }
  CONFIG.statusEffects.push(coverPartial)
  
  const coverFull = {
    id: "coverFull",
    name: "HYP3E.statusEffects.coverFull",
    img: `${HYP3E.assetsPath}/cover-wall.svg`,
    isActive: false
  }
  CONFIG.statusEffects.push(coverFull)

}


/**********************************************************
 * Effect Hook Handlers
 **********************************************************/

export async function setupEffectHandlers() {
  /**
   * Capture ActiveEffectConfig and insert new config fields
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

      // Determine Foundry version, v13 or earlier, or v14 or later, and insert 
      //  the field in the appropriate location on the sheet
      const majorVersion = Number(game.version?.split(".")[0] ?? game.data.version.split(".")[0]);
      if (majorVersion <= 13) {
        // Insert just after the duration rounds input
        html$.find('input[name="duration.rounds"]').closest(".form-group").after(field);
      } else {
        // Insert just after the duration value input
        html$.find('input[name="duration.value"]').closest(".form-group").after(field);
      }

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
        // Hyp3eLogger.info("ActiveEffect renderActiveEffectConfig", `Opening Condition Editor for effect:`, effect);
        new HYP3EConditionEditor({ effect }).render(true);
      });
  });

  /**
   * 
   */
  Hooks.on("preCreateActiveEffect", (effect, data) => {
    Hyp3eLogger.info("ActiveEffect preCreateActiveEffect", `Pre-create event fired for ${effect.name}:`, { Effect: effect, Data: data });
    if (game.release?.generation < 14) return;
    // Set Foundry v14 defaults
    if (data.duration?.units === "rounds" || data.duration?.units === "turns") {  // Rounds are preferred
      if (!data.duration.expiry) {
        // Hyperborea standard: expire at the end of the actor's turn/sequence in the round
        data.duration.expiry = "turnEnd";
      }
    }
  });

  /**
   * Handle the creation of an active effect on an actor. This ONLY applies to effects
   * applied directly to the actor, not effects coming from an equipped item.
   */
  Hooks.on("createActiveEffect", async (effect, options, userId) => {
    const initialEffect = {...effect};
    Hyp3eLogger.info("ActiveEffect createActiveEffect", `Create event fired for ${effect.name}:`, initialEffect);

    // Only process if we're the one who owns this actor
    const actor = effect.parent;
    if (!actor?.isOwner) return;

    const v14orLater = !!ActiveEffect?.registry;
    Hyp3eLogger.info("ActiveEffect createActiveEffect", `Foundry v14 or later: ${v14orLater}`);

    /**
     * The rest of this assumes the effect is being created/cloned from an item: e.g. a 
     *  spell effect, a weapon or item that applies an effect, etc. Basically there is a 
     *  pre-configured effect, potentially having variables in it, that is being cloned to 
     *  (created on) a recipient actor.
     * 
     * Note that this is NOT the same as when an item applies an effect to its owner. In 
     *  such cases, the effect is not actually created on the actor, and this hook does 
     *  not fire at all.
     */

    // Get data stored in the effect's flags, if it exists
    const source = effect.getFlag("hyp3e", "source");
    Hyp3eLogger.info("ActiveEffect createActiveEffect", `Effect source:`, source);
    const srcActorUuid = source?.srcActorUuid ?? "";
    const sourceActor = srcActorUuid ? await fromUuid(srcActorUuid) : effect.parent;
    Hyp3eLogger.info("ActiveEffect createActiveEffect", `Actor (if any) applying the effect:`, sourceActor);
    const actorData = sourceActor.getRollData?.() ?? {};

    // Flag to track whether anything needs to be updated
    let didUpdate = false;
    const updates = {};

    // Check to see if we have a rollable Duration formula, and resolve it if so
    const { updatedDuration, updated } = await checkAndResolveDuration(effect, actorData);
    if (updated) {
      didUpdate = true;
      updates.duration = updatedDuration;
      Hyp3eLogger.info("ActiveEffect createActiveEffect", `"${effect.name}" resolved duration:`, updatedDuration);
    }

    // Foundry v13 vs. v14 changes how effect changes are stored
    const effectChanges = effect?.changes || effect?.system.changes || [];
    // Store all changes for a batch update at the end
    let updatedChanges = [...effectChanges];  // Start with a shallow copy

    for (let i = 0; i < updatedChanges.length; i++) {
      const change = updatedChanges[i];
      Hyp3eLogger.info("ActiveEffect createActiveEffect", `Effect "${effect.name}" change key "${change.key}" has value ${change.value}, type: ${typeof change.value}`, change);
      // Ignore if the key is system.tempPersistentDamage, since that is a special case we 
      //  handle separately in the Actor document
      if (change.key === "system.tempPersistentDamage") {
        Hyp3eLogger.info("ActiveEffect createActiveEffect", `Effect "${effect.name}" applies persistent damage, so we will skip resolving any formulas.`);
        continue;
      }
      // Parse the change.value string and resolve any variables or math
      let resolvedChange = null;
      if (!isNaN(change.value)) {
        resolvedChange = Number(change.value);
        Hyp3eLogger.info("ActiveEffect createActiveEffect", `"${effect.name}" value: ${resolvedChange} is a real number, no resolution needed.`);
      } else if (isPureNumber(change.value)) {
        resolvedChange = Number(change.value);
        Hyp3eLogger.info("ActiveEffect createActiveEffect", `"${effect.name}" value: ${resolvedChange} is a numeric string, no resolution needed.`);
      } else if (isPureString(change.value)) {
        resolvedChange = change.value;
        Hyp3eLogger.info("ActiveEffect createActiveEffect", `"${effect.name}" value: ${resolvedChange} is simple text, no resolution needed.`);
      } else if (containsDice(change.value)) {
        // Dice rolls in the formula require async processing
        resolvedChange = await Hyp3eDice.resolveFormulaWithMathAsync(change.value, actorData)
        Hyp3eLogger.info("ActiveEffect createActiveEffect", `"${effect.name}" value: ${change.value} contains dice, resolved to ${resolvedChange}.`);
      } else if (containsMathOrVariables(change.value)) {
        // No dice rolls, we can do it synchronous
        resolvedChange = Hyp3eDice.resolveFormulaWithMath(change.value, actorData);
        Hyp3eLogger.info("ActiveEffect createActiveEffect", `"${effect.name}" value: ${change.value} contains math or variables, resolved to ${resolvedChange}.`);
      }
      if (updatedChanges[i].value !== resolvedChange) {
        updatedChanges[i] = {
          ...change,
          value: resolvedChange
        };
        didUpdate = true;
        updates.changes = updatedChanges;
        Hyp3eLogger.info("ActiveEffect createActiveEffect", `"${effect.name}" resolved change:`, updatedChanges[i]);
      }
    }

    // Batch out the updates to the effect
    if (didUpdate) {
      Hyp3eLogger.info("ActiveEffect createActiveEffect", `Effect ${effect.name} updated Duration and/or Changes:`, updates);
      await effect.update(updates);
    }

    // Automatically set the remaining rounds for a temporary active effect with a duration 
    //  in rounds. This is used for outside-combat duration tracking and expiration.
    if (effect.isTemporary) {
      let durationRounds = null;
      if (v14orLater) {
        if (effect.duration?.units === "rounds") {
          durationRounds = effect.duration.value ?? null;
        } else if (effect.duration?.seconds > 0) {
          durationRounds = Math.floor(effect.duration.seconds / 10);
        }
      } else { // v13 or earlier
        if (effect.duration?.type === "rounds" || effect.duration?.type === "turns") {
          durationRounds = effect.duration.rounds ?? effect.duration.turns ?? null;
        } else if (!v14orLater && (effect.duration?.type === "seconds")) {
          durationRounds = Math.floor(effect.duration.seconds / 10);
        }
      }
      await effect.setFlag("hyp3e", "remainingRounds", durationRounds);
      Hyp3eLogger.info("ActiveEffect createActiveEffect", `Setting remainingRounds to ${durationRounds} for ${effect.name}`);
    }

    /**
    // Automatically set the remaining turns for active effects with a duration in rounds.
    //  This is useful for effects that are generally applied outside of combat and last for 
    //  multiple turns (much longer than a typical combat spell/effect).
    if (!effect.getFlag("hyp3e", "remainingTurns")) {
      let durationTurns = null;
      const majorVersion = Number(game.version?.split(".")[0] ?? game.data.version.split(".")[0]);
      if (majorVersion <= 13) {
        // Convert rounds to turns (6 rounds = 1 minute, 10 minutes = 1 turn)
        const durationRounds = effect.duration.rounds ?? effect.duration.turns ?? null;
        durationTurns = durationRounds !== null 
          ? Math.floor(durationRounds / 60) 
          : null;
      } else {
        // v14 introduced "seconds", and changed "rounds" to "value" with a "unit"
        if (effect.duration.unit === "rounds" || effect.duration.unit === "turns") {
          // Handle the same as v13, just with the new "value" property instead of "rounds"
          const durationRounds = effect.duration.value ?? null;
          durationTurns = durationRounds !== null 
            ? Math.floor(durationRounds / 60) 
            : null;
        } else if (effect.duration.seconds) {
          // If the duration is in seconds, convert to turns (3600 seconds = 1 turn)
          durationTurns = Math.floor(effect.duration.seconds / 600);
        }
      }
      await effect.setFlag("hyp3e", "remainingTurns", durationTurns);
      Hyp3eLogger.info("ActiveEffect createActiveEffect", `Setting remainingTurns to ${durationTurns} for ${effect.name}`);
    }
    */

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
    Hyp3eLogger.info("ActiveEffect createActiveEffect", `Effect ${effect.name} created on ${actor.name}:`, effect);

    // Send a chat message that the effect was applied
    sendEffectChatMessage(effect)
  });

  /**
   * Handle the update of an active effect on an actor.
   */
  Hooks.on("updateActiveEffect", async(effect, change, options, userId) => {
    // Foundry v14+, or earlier?
    const v14orLater = !!ActiveEffect?.registry;

    // If duration is being updated, update the remainingRounds flag as well
    if (effect.isTemporary && !effect.duration.expired && "duration" in change) {
      let durationRounds = null;
      const duration = effect.duration;
      if (duration?.units === "rounds") {
        durationRounds = duration.value ?? null;
      } else if (duration?.seconds > 0) {
        durationRounds = Math.floor(duration.seconds / 10);
      }
      if (durationRounds !== null) {
        await effect.setFlag("hyp3e", "remainingRounds", durationRounds);
      }
    } else if (effect.isTemporary && effect.duration.expired && "duration" in change) {
      await effect.setFlag("hyp3e", "remainingRounds", 0);
    }

    // Check if "disabled" is in the light source effect updates, and toggle light accordingly
    Hyp3eLogger.info("ActiveEffect updateActiveEffect", `ActiveEffect ${effect.name} and changes:`, { Effect: effect, Change: change });
    if ("disabled" in change) {
      const wasDisabled = change.disabled;
      if (wasDisabled === true) {
        Hyp3eLogger.info("ActiveEffect updateActiveEffect", `Disabling ${effect.name} on ${effect.parent?.name}:`, effect);
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
              Hyp3eLogger.info("ActiveEffect updateActiveEffect", `Restored original light for token ${token.name}`);
            } else {
              await token.document.update({ light: null });
            }
          }
        }
      } else if (wasDisabled === false) {
        Hyp3eLogger.info("ActiveEffect updateActiveEffect", `Enabling ${effect.name} on ${effect.parent?.name}:`, effect);
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
   * Handle the deletion of an active effect on an actor. Currently all this does is
   *  remove light source effects from an actor's token.
   */
  Hooks.on("deleteActiveEffect", async (effect, options, userId) => {
    const actor = effect.parent;
    if (!actor) return;
    Hyp3eLogger.info("ActiveEffect deleteActiveEffect", `Deleting ${effect.name} from ${effect.parent?.name}:`, { Effect: effect, Options: options });

    // Send chat message if expired, vs. log-only if manually deleted
    const remainingRounds = effect.getFlag("hyp3e", "remainingRounds");
    if (effect.duration?.expired || effect.duration?.remaining <= 0 || remainingRounds <= 0) {
      const msg = `<i>${effect.name}</i> expired on ${actor.name}.`;
      // sendSimpleChat(actor, "", msg);
      Hyp3eLogger.info("ActiveEffect deleteActiveEffect", msg, effect);
    } else {
      Hyp3eLogger.info("ActiveEffect deleteActiveEffect", `${effect.name} manually removed from ${actor.name}.`, effect);
    }

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

        Hyp3eLogger.info("ActiveEffect deleteActiveEffect", `Restored original light for token ${token.name}`);
      }
    }
  });
}

/**********************************************************
 * Parsing, Variable Resolution, and Utility Functions
 **********************************************************/

/**
 * Resolve a custom duration formula to a final number for rounds and turns.
 * @param {*} effect - The ActiveEffect
 * @param {*} actorData - The effect's source actor, not the actor receiving the effect
 * @returns 
 */
export async function checkAndResolveDuration(effect, actorData) {
  let updatedDuration = { ...effect.duration };
  let updated = false;

  // Do we even have a duration formula? Exit here if not...
  const formula = effect.getFlag("hyp3e", "durationFormula");
  if (!formula) return { updatedDuration, updated };

  Hyp3eLogger.info("ActiveEffect checkAndResolveDuration", `Resolving duration formula "${formula}" of effect "${effect.name}", applying to ${actorData.actorName}...`, actorData);
  // Only actors can apply effects, items leave it
  // if (!(effect.parent instanceof Actor)) return { updatedDuration, updated };

  let resolvedDuration = 0;
  if (isPureNumber(formula)) {
    resolvedDuration = Number(formula);
  } else if (containsDice(formula)) {
    // Parse the formula string/formula and resolve it to a number if possible
    resolvedDuration = await Hyp3eDice.resolveFormulaWithMathAsync(formula, actorData)
  } else if (containsMathOrVariables(formula)) {
    resolvedDuration = Hyp3eDice.resolveFormulaWithMath(formula, actorData);  
  }

  if (resolvedDuration === null) {
    Hyp3eLogger.error("ActiveEffect checkAndResolveDuration", `Could not resolve duration formula "${formula}", returning original value...`);
    return { updatedDuration, updated };
  }

  // Round the duration down, to a minimum of 1
  const rounds = Math.max(1, Math.floor(resolvedDuration));

  if (game.release?.generation < 14) {
    updatedDuration = { rounds: rounds };
  } else {
    updatedDuration = { value: rounds, units: "rounds", expiry: "turnEnd" };
  }
  updated = true;

  Hyp3eLogger.info("ActiveEffect checkAndResolveDuration", `Resolved duration of effect "${effect.name}" to ${rounds} rounds, applying to ${actorData.actorName}.`);

  return { updatedDuration, updated };
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
    color: lightProps.color || null, // Default to null if no color provided
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

  Hyp3eLogger.info("ActiveEffect applyTokenLight", `Applied light source to token ${token.name}`);
}

/**
 * Send a standardized chat message whenever an ActiveEffect is applied.
 * @param {ActiveEffect} effect - The effect that was just created.
 */
export async function sendEffectChatMessage(effect) {
  const messageParts = [];
  // Who is affected
  const target = effect.parent; // usually an Actor
  // If target is an item, get its actor/owner
  if (target?.documentName === "Item") {
    target = target.actor;
  }
  let targetName = "";
  if (target?.documentName === "Actor") {
    const token = target.getAssociatedToken();
    targetName = target.displayName ?? "Unknown Target";  // token.name ?? target.name ?? "Unknown Target";
  } else {
    Hyp3eLogger.info("ActiveEffect sendEffectChatMessage", `Effect parent is not an Actor or Item, cannot send chat message:`, effect);
    return;
  }

  // Effect details
  const effectName = effect.name ?? "Unknown Effect";

  // Source metadata from flag
  const sourceData = effect.getFlag("hyp3e", "source") || {};
  const sourceName = sourceData.appliedBy ?? effect.sourceName ?? "Unknown Source";

  // Start with the effect name
  messageParts.push(`<i>${effectName}</i>`);

  // Does this effect have a Duration?
  if (!effect.disabled) {
    if (effect.duration?.label && effect.duration?.label !== "None") {
      messageParts.push(`(${effect.duration.label})`);
    }
  }

  // Is the effect being added/enabled, or disabled/removed?
  messageParts.push(effect.disabled ? "removed from" : "applied to");

  // Target name
  messageParts.push(`${targetName}`);

  // If it's being added or applied, add source name
  if (sourceName != targetName && sourceName !== "None") messageParts.push(`by ${sourceName}`);

  // Build consistently styled content
  const content = `
    ${messageParts.join(" ")}.
  `;

  // Dispatch the chat message
  sendSimpleChat(target, "", content);
}

// Write the current ActiveEffect registry to the console in a readable format
export async function logEffectRegistry() {
  if (!ActiveEffect?.registry) {
    Hyp3eLogger.info("ActiveEffect logEffectRegistry", `ActiveEffect.registry not available (v13 or earlier)!`);
    return;
  }

  const effects = Array.from(ActiveEffect.registry);
  console.group("HYP3E ActiveEffect logEffectRegistry", `ActiveEffect Registry: ${effects.length} effects`);
  effects.forEach((effect, i) => {
    Hyp3eLogger.info("ActiveEffect logEffectRegistry", `#${i+1}`, effect);
  });
  console.groupEnd();
}

/**********************************************************
 * Effect Apply/Enable/Disable Functions
 **********************************************************/

/**
 * Apply specified effect from an item or spell to the selected token(s)/actor(s). This is 
 *  called from the chat bar, when an item description displays one or more Apply Effect
 *  buttons in order to apply them to one or more selected tokens/actors. Typically used
 *  with spells and magic items that apply effects to one or more targets.
 * @param {string} itemId    - ID of the item that has the effect
 * @param {string} effectId  - ID of the item effect to apply
 * @param {string} actorId   - ID of the actor that owns the item
 * @param {boolean} disabled - Whether to disable the effect when applying it
 */
export async function applyEffectToSelectedTokenActors(itemUuid, effectId, actorId, disabled = false) {
  // Get selected (targeted) tokens to receive effect
  const tokens = canvas?.tokens?.controlled;
  if (!tokens || tokens.length == 0) {
    Hyp3eLogger.error("ActiveEffect applyEffectToSelectedTokenActors", `No tokens selected, cannot apply effect.`);
    ui.notifications?.error("Apply Effect: Please select at least one token.");
    return;
  }
  // Get the source actor
  const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
  if (!actor) {
    Hyp3eLogger.error("ActiveEffect applyEffectToSelectedTokenActors", `Source actor ${actorId} not found, cannot apply effect.`);
    ui.notifications?.error(`Apply Effect: Source actor ${actorId} not found!`);
    return;
  }
  const actorData = actor.getRollData();

  // Get the source item owned by the actor -- could be any valid item type: spell, item, weapon, etc.
  const item = await fromUuid(itemUuid)
  // const item = actor.items.get(itemId);
  if (!item) {
    Hyp3eLogger.error("ActiveEffect applyEffectToSelectedTokenActors", `Source item ${itemUuid} not found, cannot apply effect.`);
    ui.notifications?.error(`Apply Effect: Source item ${itemId} not found!`);
    return;
  }
  const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;

  // Get the item effect to be applied
  const effect = item.effects.find(e => e.id === effectId);
  if (!effect) {
    const msg = `Effect ${effectId} from ${item.type} ${itemName} not found`
    Hyp3eLogger.error("ActiveEffect applyEffectToSelectedTokenActors", `${msg}, cannot apply.`)
    ui.notifications?.error(`Apply Effect: ${msg}!`);
    return;
  }

  // Clone the effect, then work from that clone
  const effectData = new Object({...effect});
  effectData.origin = item.uuid;
  if (disabled) effectData.disabled = true;
  Hyp3eLogger.info("ActiveEffect applyEffectToSelectedTokenActors", `Cloned Effect:`, effectData);

  // Is the duration a formula that needs to be resolved? If so, resolve it before 
  //  applying the effect to the target actors
  const { updatedDuration, updated } = await checkAndResolveDuration(effect, actorData);
  if (updated) {
    effectData.duration = updatedDuration;
    Hyp3eLogger.info("ActiveEffect applyEffectToSelectedTokenActors", `Resolved effect duration:`, updatedDuration);
  }

  // Special check for persistent damage effects, and resolve variables if needed
  // const effectChanges = effectData.changes || effectData.system?.changes || [];
  // const persistentDamage = effectChanges.find(c => c.key === "system.tempPersistentDamage");
  // let damageType, damageRoll
  // if (persistentDamage) {
  //   Hyp3eLogger.info("ActiveEffect applyEffectToSelectedTokenActors", `${effectData.name} causes persistent damage:`, persistentDamage);
  //   damageType = persistentDamage.value.split(",")[0];
  //   damageRoll = persistentDamage.value.split(",")[1];
  //   damageRoll = damageRoll.replace(";", "");
  //   // Check if the damage roll is a valid formula
  //   if (!Roll.validate(damageRoll, actorData)) {
  //     const msg = `Invalid persistent damage roll formula "${damageRoll}", cannot apply.`;
  //     Hyp3eLogger.error("ActiveEffect applyEffectToSelectedTokenActors", msg);
  //     ui.notifications?.error(`Apply Effect: ${msg}`);
  //     return;
  //   }
  //   // Resolve variables in the damage roll formula
  //   const roll = new Roll(damageRoll, actorData);
  //   await roll.evaluate();
  //   // Save the resolved roll formula for later use
  //   damageRoll = roll.formula;
  // }

  // Apply the effect to selected tokens/actors
  for (const t of tokens) {
    Hyp3eLogger.info("ActiveEffect applyEffectToSelectedTokenActors", `Target Token:`, t);
    const result = await t.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    const childEffect = result[0];
    Hyp3eLogger.info("ActiveEffect applyEffectToSelectedTokenActors", `Created effect on token actor ${t.actor.name}:`, childEffect)

    // Set flag to store metadata about the effect source & target actor
    await childEffect.setFlag("hyp3e", "source", {
      srcItemUuid: item.uuid,
      srcActorUuid: actor.uuid,
      appliedBy: actor.name
    });

    // This last section would be great if we could capture a hook for the effect like _onCreate()
    //  or similar, and modify the incoming damage to the actor right there. The below code has to 
    //  update the actor after the effect was already applied, which is not efficient.
    // Now we get the newly-created effect, and modify the persistent damage roll if needed
    // if (persistentDamage) {
    //   Hyp3eLogger.info("ActiveEffect applyEffectToSelectedTokenActors", `New Effect:`, childEffect);
    //   if (childEffect) {
    //     // If the effect has a persistent damage value, we need to update the effect with that value
    //     const newPersistentDamage = childEffect.changes.find(c => c.key === "system.tempPersistentDamage");
    //     if (newPersistentDamage) {
    //       newPersistentDamage.value = `${damageType},${damageRoll}`;
    //       Hyp3eLogger.info("ActiveEffect applyEffectToSelectedTokenActors", `${effectData.name} new persistent damage:`, newPersistentDamage);
    //       childEffect.update({ changes: [newPersistentDamage] });
    //     }
    //   }
    // }
  }
}

/**
 * Enable specified effect from the item, onto its actor. This is called from the chat
 *  bar, when an item description is displayed with one or more Enable Effect buttons,
 *  one button for each effect.
 * @param {itemId} string      The item that causes the effect
 * @param {effectId} string    The effect ID to enable
 * @param {actorId} string     The actor that owns the item and will receive/enable the effect
 */
export async function enableTransferrableEffectToItemOwner(item, effectId, actorId) {
  // Get the actor
  const actor = game.actors.get(actorId) || null;
  if (!actor) {
    const msg = `Actor ${actorId} not found, cannot enable effect ${effectId}.`;
    Hyp3eLogger.error("ActiveEffect enableTransferrableEffectToItemOwner", msg);
    ui.notifications.error(`Enable Effect: ${msg}`);
    return;
  }
  const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;

  // Get the item effect to be enabled
  const effect = item.effects.find(e => e.id === effectId);
  if (!effect) {
    const msg = `Effect ${effectId} not found on item ${item.name}!`;
    Hyp3eLogger.error("ActiveEffect enableTransferrableEffectToItemOwner", msg);
    ui.notifications.error(`Enable Effect: ${msg}`);
    return;
  }
  // Set flag to store metadata about the effect source & target actor
  await effect.setFlag("hyp3e", "source", {
    srcItemUuid: item.uuid,
    srcActorUuid: actor.uuid,
    appliedBy: itemName
  });

  Hyp3eLogger.info("ActiveEffect enableTransferrableEffectToItemOwner", `Effect to enable:`, effect);

  // Enable the item effect and update its remaining duration. The duration is primarily 
  //  used by light sources with a time limit, but might be disabled/enabled multiple times.
  await effect.update({ 
                disabled: false, 
                "duration.remaining": Math.max(effect.duration.rounds, effect.duration.turns),
              });

  // Send a chat message that the effect was enabled
  sendEffectChatMessage(effect)
}

/**
 * Enable all effects from the item, on the actor. Occurs when an item is equipped.
 *  This is intended for passive effects that are always-on, not temporary or time-limited.
 * @param {itemId} string      The item that causes the effects to enable
 * @param {actorId} string     The actor that owns the item and will receive/enable the effects
 */
export async function enableAllTransferrableItemEffectsToItemOwner(item, actorId) {
  // Get a list of item effects that are applied to the actor
  const transferEffects = item.effects.filter(e => e.transfer && e.duration.rounds === null && e.duration.turns === null);
  if (transferEffects.length === 0) {
    Hyp3eLogger.info("ActiveEffect enableAllTransferrableItemEffectsToItemOwner", `Item ${item.name} has no transferrable effects to apply.`);
    return;
  }
  Hyp3eLogger.info("ActiveEffect enableAllTransferrableItemEffectsToItemOwner", `Transferrable effect(s) to enable:`, transferEffects);
  // Get the actor
  const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
  if (!actor) {
    const msg = `Actor ${actorId} not found!`;
    Hyp3eLogger.error("ActiveEffect enableAllTransferrableItemEffectsToItemOwner", msg);
    ui.notifications?.error(`Enable All Item Effects: ${msg}`);
    return
  }
  const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;

  // Initialize the chat string
  let chatMsg = []
  chatMsg.push(`<p><strong>${itemName}:</strong></p><ul>`)

  // Enable the transferrable effects on the actor
  transferEffects.forEach(async effect => {
    Hyp3eLogger.info("ActiveEffect enableAllTransferrableItemEffectsToItemOwner", `Effect to enable:`, effect);
    chatMsg.push(`<li><i>${effect.name}</i> enabled on ${actor.displayName}.</li>`)
    // Update the item effect
    await effect.update({ disabled: false });
    // Set flag to store metadata about the effect source & target actor
    await effect.setFlag("hyp3e", "source", {
      srcItemUuid: item.uuid,
      srcActorUuid: actor.uuid,
      appliedBy: itemName
    });
  })
  chatMsg.push(`</ul>`)

  // Send a chat message that the effects were enabled
  const chatData = {
    author: game.user_id,
    speaker: ChatMessage.getSpeaker({ alias: actor.displayName }),
    content: chatMsg.join("")
  };
  ChatMessage.create(chatData, {});
}

/**
 * Disable specified effect from the item, onto its actor. This is called from the chat
 *  bar, when an item description is displayed with one or more Disable Effect buttons,
 *  one button for each effect.
 * @param {itemId} string      The item that causes the effect
 * @param {effectId} string    The effect ID to disable
 * @param {actorId} string     The actor that owns the item and will disable the effect
 */
export async function disableTransferrableEffectOnItemOwner(item, effectId, actorId) {
  // Get the actor
  const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
  if (!actor) {
    const msg = `Actor ${actorId} not found!`;
    Hyp3eLogger.error("ActiveEffect disableTransferrableEffectOnItemOwner", msg);
    ui.notifications?.error(`Disable Effect: ${msg}`);
    return
  }
  const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;

  // Get the item effect to be disabled
  const effect = item.effects.find(e => e.id === effectId);
  if (!effect) {
    const msg = `Effect ${effectId} not found!`;
    Hyp3eLogger.error("ActiveEffect disableTransferrableEffectOnItemOwner", msg);
    ui.notifications?.error(`Disable Effect: ${msg}`);
    return;
  }
  // Set flag to store metadata about the effect source & target actor
  await effect.setFlag("hyp3e", "source", {
    srcItemUuid: item.uuid,
    srcActorUuid: actor.uuid,
    appliedBy: itemName
  });

  Hyp3eLogger.info("ActiveEffect disableTransferrableEffectOnItemOwner", `Effect to disable:`, effect);
  // Update the item effect to disable it
  await effect.update({ disabled: true });

  // Send a chat message that the effect was disabled
  sendEffectChatMessage(effect)
}

/**
 * Disable all transferrable effects from an item, on its owner. Occurs when an item is unequipped.
 *  This is intended for passive effects that are always-on, not temporary or time-limited.
 * @param {itemId} string      The item that causes the effects to disable
 * @param {actorId} string     The actor that owns the item and will disable the effects
 */
export async function disableAllTransferrableItemEffectsOnItemOwner(item, actorId) {
  // Get a list of item effects that are applied to the actor
  const transferEffects = item.effects.filter(e => e.transfer);
  if (transferEffects.length === 0) {
    Hyp3eLogger.info("ActiveEffect disableAllTransferrableItemEffectsOnItemOwner", `Item ${item.name} has no transferrable effects to disable.`);
    return;
  }
  Hyp3eLogger.info("ActiveEffect disableAllTransferrableItemEffectsOnItemOwner", `Transferrable effect(s) to disable:`, transferEffects);
  // Get the actor
  const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
  if (!actor) {
    const msg = `Actor ${actorId} not found!`;
    Hyp3eLogger.error("ActiveEffect disableAllTransferrableItemEffectsOnItemOwner", msg);
    ui.notifications?.error(`Disable All Item Effects: ${msg}`);
    return
  }
  const itemName = item.system?.friendlyName ? item.system.friendlyName : item.name;

  // Initialize the chat array
  let chatMsg = []
  chatMsg.push(`<p><strong>${itemName}:</strong></p><ul>`)

  transferEffects.forEach(async effect => {
    Hyp3eLogger.info("ActiveEffect disableAllTransferrableItemEffectsOnItemOwner", `Effect to disable:`, effect);
    chatMsg.push(`<li><i>${effect.name}</i> disabled on ${actor.displayName}.</li>`)
    // Update the item effect
    await effect.update({ disabled: true });

    // Set flag to store metadata about the effect source & target actor
    await effect.setFlag("hyp3e", "source", {
      srcItemUuid: item.uuid,
      srcActorUuid: actor.uuid,
      appliedBy: itemName
    });
  })
  chatMsg.push(`</ul>`)

  // Send a chat message that the effects were disabled
  const chatData = {
    author: game.user_id,
    speaker: ChatMessage.getSpeaker({ alias: actor.displayName }),
    content: chatMsg.join("")
  };
  ChatMessage.create(chatData, {});
}