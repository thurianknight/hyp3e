import { HYP3E } from "../helpers/config.mjs"
import { Hyp3eLogger } from "../helpers/logger.mjs";
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
  // Hyp3eLogger.info("sendSimpleChat", `${actor.displayName} sent message with flavor "${label}" and content "${content}".`)
  const speaker = actor.displayName;
  ChatMessage.create({
    author: game.user.id,
    speaker: ChatMessage.getSpeaker({ alias: speaker }),
    flavor: label,
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
  // Hyp3eLogger.info("sendRollToChat", `${actor.displayName} sent message with flavor "${label}" and content "${content}".`)
  const speaker = actor.displayName;
  // Send to chat
  roll.toMessage({
    author: game.user_id,
    speaker: ChatMessage.getSpeaker({ alias: speaker }),
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
export async function renderCustomChat(roll, item, dmgObj, actor, tokenId, label, debugRollFormula, headerHTML, footerHTML, rollMode) {
  const speaker = actor.displayName;  
  // Load & render the chat template
    const templateData = {
      roll: roll,
      headerHTML: headerHTML,
      debugRollFormula: debugRollFormula,
      item: item,
      dmgObj: dmgObj,
      actorId: actor.id,
      tokenId: tokenId,
      footerHTML: footerHTML,
    };
    const template = `${HYP3E.templatePath}/chat/attack-roll.hbs`;
    let customChat = await renderTemplate(template, templateData);

    // Send to chat
    roll.toMessage({
      author: game.user_id,
      speaker: ChatMessage.getSpeaker({ alias: speaker }),
      flavor: label,
      content: customChat
    },{
      rollMode: rollMode
    })
}

/**********************************************************
 * Chat Font Settings
 **********************************************************/
export function applyChatFontSizeSetting() {
  const CHAT_FONT_SCALE = {
    "-2": 0.8,  // shrink more
    "-1": 0.9,  // shrink a little
    "0": 1.0,  // default
    "1": 1.1,  // bump up a little
    "2": 1.25  // bump up more
  };
  const adj = game.settings.get("hyp3e", "chatFontSize") ?? 0;
  const scale = CHAT_FONT_SCALE[adj] ?? 1.0;

  document.documentElement.style.setProperty("--hyp3e-chat-scale", scale);
  console.log("[applyChatFontSizeSetting] scale set globally:", scale);
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
    Hyp3eLogger.info("addChatMessageButtons", "Flavored chat message:", _msg.flavor);
    // addGenericDmgHealBtns = false;
  }

  if (!addGenericDmgHealBtns) return;
  await handleGenericDamageHealButtons(_msg, html);
}


/**
 * Hook listener for truncating long content in chat messages... fires on renderChatMessage event.
 * @param {*} _msg 
 * @param {*} html 
 * @param {*} _data 
 * @returns 
 */
export const truncateLongContent = async function(_msg, html, _data) {
  // Only apply to your system's description messages; check flags or content
  const html$ = $(html);
  if (!_msg.flags?.hyp3e?.isItemDescription && !html$.hasClass('hyp3e-chat-card')) return;

  const toggleBtn = html$.find('.toggle-description');
  if (!toggleBtn.length) return;

  toggleBtn.click(async (event) => {
    event.preventDefault();
    const btn = $(event.currentTarget);
    const description = html$.find('.description');
    
    description.toggleClass('truncated');
    
    if (description.hasClass('truncated')) {
      btn.text('▼ Expand Description');
      btn.attr('data-action', 'expand');
    } else {
      btn.text('▲ Hide Description');
      btn.attr('data-action', 'hide');
      // Optional: Scroll to top of description for better UX
      description[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }    
  });
}