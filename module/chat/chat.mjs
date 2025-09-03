import { HYP3E } from "../helpers/config.mjs"
import { 
    handleDamageRollButtons, 
    handleDamageRoll2hButtons, 
    handleApplyDamageButtons, 
    handleGenericDamageHealButtons 
} from "./handlers/damage-handlers.mjs";
import { handleCritDamageButton, handleCritMissOrHitButtons } from "./handlers/crit-handlers.mjs";
import { handleSaveButtons, handleEffectButtons } from "./handlers/utility-handlers.mjs";

/**********************************************************
 * Chat Message Functions
 **********************************************************/

/**
 * Send a simple chat message, no dice roll info
 * @param {*} actor - The actor sending the chat
 * @param {*} label - Chat message header
 * @param {*} content - The main HTML of the message
 */
export function sendSimpleChat(actor, label, content) {
    ChatMessage.create({
        author: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this }),
        label: label,
        content: content
    });
}

/**
 * Send roll results to the chat window
 * @param {*} roll - The roll object to display
 * @param {*} actor - The actor doing the action
 * @param {*} label - Chat message header
 * @param {*} content - The main HTML of the message
 * @param {*} rollMode - Chat mode: public, private gm, blind gm, self
 */
export function sendRollToChat(roll, actor, label, content, rollMode) {
    // Prettify label
    label = "<div class='medium'>" + label + "</div>"

    // Send to chat
    roll.toMessage({
        author: game.user_id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        flavor: label,
        content: content
    },{
        rollMode: rollMode
    })
}

/**
 * Render custom html chat message (mostly attacks and turning undead)
 * @param {*} roll - The roll object to display
 * @param {*} item - The item or ability being used
 * @param {*} actor - The actor doing the action
 * @param {*} tokenId - ID of the actor's token
 * @param {*} label - Chat message header
 * @param {*} debugRollFormula - The roll formula with variables resolved
 * @param {*} headerHTML - HTML that is displayed above the dice roll info
 * @param {*} footerHTML - HTML that is displayed below the dice roll info
 * @param {*} rollMode - Chat mode: public, private gm, blind gm, self
 */
export async function renderCustomChat(roll, item, actor, tokenId, label, debugRollFormula, headerHTML, footerHTML, rollMode) {
    // Prettify label
    label = "<div class='medium'>" + label + "</div>"
    headerHTML = "<div class='medium'>" + headerHTML + "</div>"
    footerHTML = "<div class='medium'>" + footerHTML + "</div>"

    const templateData = {
        roll: roll,
        headerHTML: headerHTML,
        debugRollFormula: debugRollFormula,
        item: item,
        actorId: actor.id,
        tokenId: tokenId,
        footerHTML: footerHTML,
    };

    const template = `${HYP3E.templatePath}/chat/attack-roll.hbs`;
    let customChat = await renderTemplate(template, templateData);

    // Send to chat
    roll.toMessage({
        author: game.user_id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        flavor: label,
        content: customChat
    },{
        rollMode: rollMode
    })
}

/**********************************************************
 * Chat Button Insertion Functions
 **********************************************************/

/**
 * Hook listener for adding buttons to chat messages... fires on renderChatMessage event.
 * Done here instead of inline to add listeners in js
 * @param {*} _msg 
 * @param {*} html 
 * @param {*} _data 
 */
export const addChatMessageButtons = async function(_msg, html, _data) {
    // Set this flag
    let addGenericDmgHealBtns = true

    // Handle various button types, each function returns true if it added buttons
    addGenericDmgHealBtns = !(await handleDamageRollButtons(html)) && addGenericDmgHealBtns;
    addGenericDmgHealBtns = !(await handleDamageRoll2hButtons(html)) && addGenericDmgHealBtns;
    addGenericDmgHealBtns = !(await handleApplyDamageButtons(html)) && addGenericDmgHealBtns;
    addGenericDmgHealBtns = !(await handleCritDamageButton(html)) && addGenericDmgHealBtns;
    addGenericDmgHealBtns = !(await handleCritMissOrHitButtons(html)) && addGenericDmgHealBtns;
    addGenericDmgHealBtns = !(await handleSaveButtons(html)) && addGenericDmgHealBtns;
    addGenericDmgHealBtns = !(await handleEffectButtons(html)) && addGenericDmgHealBtns;

    // Skip RollTable results
    if (_msg.flags?.core?.RollTable || _msg.flags?.documentType === "RollTable") {
        addGenericDmgHealBtns = false;
    }
    // Only add damage/heal buttons to "unflavored" dice roll chat messages
    if (_msg.flavor !== "") {
        addGenericDmgHealBtns = false;
    }

    if (!addGenericDmgHealBtns) return;
    await handleGenericDamageHealButtons(_msg, html);
}

// Decrement item inventory when used
// async function useItem(itemId, actorId) {
//     const actor = game.actors.get(actorId)
//     actor.useItem(itemId);
// }
