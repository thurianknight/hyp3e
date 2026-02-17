/**
 * Hyp3e Chat Message Handlers
 * Handle chat message buttons for saving throws and effects.
 * David Sherman 2021-2024
 * @module chat/handlers/utility-handlers
 */
import { HYP3E } from "../../helpers/config.mjs"
import { Hyp3eLogger } from "../../helpers/logger.mjs";
import {applyEffectToSelectedTokenActors, enableTransferrableEffectToItemOwner, disableTransferrableEffectOnItemOwner} from "../../helpers/effects.mjs";

/**
 * 
 * @param {*} html - The chat message HTML
 * @returns {Boolean} - True if button was added, false if not
 */
export async function handleSaveButtons(html) {
    // Saving throw button
    let saveBtnElement = html.find(".save-button");
    if (saveBtnElement.length === 0) return false;

    saveBtnElement.each((_i, b) => {
        let saveType = $(b).data('save');
        let saveButton = $(
            `<button class="chat-btn-full-width" title="Click to roll save to selected token(s)."><i class="fas fa-dice-d20"></i>Save: ${saveType}</button>`
        );
        saveBtnElement.append(saveButton);

        // Handle button clicks
        saveBtnElement.on("click", (ev) => {
            ev.stopPropagation();
            rollSaveButton(saveType);
        });
    });

    return true;
}

/**
 * Handles "Apply Effect" button click in chat log.
 * @param {*} html - The chat message HTML
 * @returns {Boolean} - True if button was added, false if not
 */
export async function handleEffectButtons(html) {
  // Apply/Enable/Disable Effect buttons
  let effectBtnElement = html.find(".apply-effects-button");
  if (effectBtnElement.length === 0) return false;

  effectBtnElement.each(async (_i, b) => {
    let itemId = $(b).data('itemId');
    let itemUuid = $(b).data('itemUuid');
    let actorId = $(b).data('actorId');
    // Get the actor
    let actor = game.actors.get(actorId);
    if (!actor) {
      const msg = `Apply Effects Button: Actor ${actorId} not found!`;
      Hyp3eLogger.error("handleEffectButtons", msg)
      ui.notifications.error(msg);
      return;
    }
    Hyp3eLogger.info("handleEffectButtons", `Apply Effects Button actor: `, actor);
    // Get the actor's item or global item
    let item = actor.items.get(itemId) ?? await fromUuid(itemUuid);
    if (!item) {
      const msg = `Apply Effects Button: Item ${itemId} not found!`;
      Hyp3eLogger.error("handleEffectButtons", msg)
      ui.notifications?.error(`${msg} See console log for details.`);
      const moreInfo = `
        Item ${itemId} not found: Likely issue is that the item is owned by a token, but not the base actor.
        This is most common with NPCs and monsters, if the GM drags an item or creates a new item directly in the token sheet.
      `;
      Hyp3eLogger.info("handleEffectButtons", moreInfo);
      return;
    } else if (!item.system.identified) {
      Hyp3eLogger.info("handleEffectButtons", `Item ${item.name} has not been identified, so we will not display any buttons.`);
      return;
    }

    // The logic we need here will do the following:
    // Check to see if the item applies effect(s) to the actor (the actor is targeted).
    //    - The actor is usually targeted for item-based passive effects: those that are 
    //      either always-on, or can be enabled & disabled.
    //    - Spells and charge-based items usually do NOT target the actor, because they 
    //      only apply temporary effects, and only upon casting or charge expenditure.
    //  If the actor is targeted, check to see if the effect is already applied & enabled.
    //    - If disabled, create a button to enable the effect on the actor.
    //    - If enabled, create a button to disable the effect on the actor.
    //  If the actor is not targeted, create a button to apply the effect to the selected token(s).

    // Loop through the effects and create a separate button for each one
    item.effects.forEach(effect => {
      // Check if the actor is targeted by the item/effect
      if (effect.transfer) {
        if (!effect.disabled) {
          // The effect is enabled, so create a button to disable it
          let effectDisableButton = $(
            `<button class="chat-btn-full-width" title="Click to disable ${effect.name} on ${actor.name}."><i class="fas fa-user-slash"></i>Disable ${effect.name}</button>`
          );
          effectBtnElement.append(effectDisableButton);
          // Handle button clicks
          effectDisableButton.on("click", (ev) => {
            ev.stopPropagation();
            disableTransferrableEffectOnItemOwner(item, effect.id, actorId);
          });
        } else {
          // Effect is disabled, so create a button to enable it
          let effectEnableButton = $(
            `<button class="chat-btn-full-width" title="Click to enable ${effect.name} on ${actor.name}."><i class="fas fa-user-check"></i>Enable ${effect.name}</button>`
          );
          effectBtnElement.append(effectEnableButton);
          // Handle button clicks
          effectEnableButton.on("click", (ev) => {
            ev.stopPropagation();
            enableTransferrableEffectToItemOwner(item, effect.id, actorId);
          });
        }
      } else {
        // The actor is not targeted, so create a button to apply the effect to selected token(s)
        let effectApplyButton = $(
          `<button class="chat-btn-full-width" title="Click to apply ${effect.name} to selected tokens."><i class="fas fa-hand-paper"></i>Apply ${effect.name}</button>`
        );
        effectBtnElement.append(effectApplyButton);
        // Handle button clicks
        effectApplyButton.on("click", (ev) => {
          ev.stopPropagation();
          applyEffectToSelectedTokenActors(item.uuid, effect.id, actorId);
        });
      }
    });
  });

  return true;
}

/**********************************************************
 * Dice Rolling Functions
 **********************************************************/

// Roll a saving throw for the selected token(s) and display in chat
async function rollSaveButton(saveType) {
    if (saveType == "") return; // Skip empty save
    const tokens = canvas?.tokens?.controlled;

    if (!tokens || tokens.length == 0) {
        ui.notifications?.error("Roll Save: Please select at least one token.");
        return;
    }

    for (const t of tokens) {
        const actor = t.actor;
        let saveTarget = actor.system.saves[saveType].value;
        const dataset = {
            label: "Save vs. " + saveType,
            roll: "1d20",
            // rollMode: "publicroll",
            rollTarget: saveTarget
        };
        await actor.rollSave(dataset);
    }
}