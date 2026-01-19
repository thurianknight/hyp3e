/**
 * Hyp3e Chat Message Handlers
 * Handle chat message buttons for damage rolls and applying damage/healing.
 * David Sherman 2021-2024
 * @module chat/handlers/damage-handlers
 */
import { HYP3E } from "../../helpers/config.mjs"
import { Hyp3eLogger } from "../../helpers/logger.mjs";

/**
 * Insert 1-Hand damage roll button into chat messages and hook up it's event handler.
 * @param {*} html - The chat message HTML
 * @returns {Boolean} - True if buttons were added, false if not
 */
export async function handleDamageRollButtons(html) {
  let dmgRollElement = html.find(".dmg-roll-button");
  if (dmgRollElement.length === 0) return false;

  dmgRollElement.each((_i, b) => {
    const baseDmgFormula = $(b).data('baseDamage');
    const dmgFormula = $(b).data('formula');
    const debugDmgRollFormula = $(b).data('debugFormula');
    const damageType = $(b).data('damageType');
    const sourceType = $(b).data('sourceType');
    const itemId = $(b).data('itemId');
    const itemUuid = $(b).data('itemUuid');
    const actorId = $(b).data('actorId');
    const tokenId = $(b).data('tokenId');
    const buttonText = damageType.toLowerCase().includes("heal") ? "Healing" : "Damage"

    let dmgButton = $(
      `<button class="chat-btn-full-width" title="Click to roll damage."><i class="fas fa-dice"></i>${buttonText}: ${dmgFormula}</button>`
    );
    dmgRollElement.append(dmgButton);

    dmgRollElement.on("click", (ev) => {
      ev.stopPropagation();
      rollDmgButton(dmgFormula, debugDmgRollFormula, baseDmgFormula, damageType, actorId, itemId, itemUuid, tokenId, sourceType);
    });
  });

  return true;
}

/**
 * Insert 2-Hand damage roll button into chat messages and hook up it's event handler.
 * @param {*} html - The chat message HTML
 * @returns {Boolean} - True if buttons were added, false if not
 */
export async function handleDamageRoll2hButtons(html) {
  let dmgRoll2hElement = html.find(".dmg-roll-button2h");
  if (dmgRoll2hElement.length === 0) return false;

  dmgRoll2hElement.each((_i, b) => {
    const baseDmgFormula = $(b).data('baseDamage');
    const dmgFormula = $(b).data('formula');
    const debugDmgRollFormula = $(b).data('debugFormula');
    const damageType = $(b).data('damageType');
    const sourceType = $(b).data('sourceType');
    const itemId = $(b).data('itemId');
    const itemUuid = $(b).data('itemUuid');
    const actorId = $(b).data('actorId');
    const tokenId = $(b).data('tokenId');

    let dmgButton2h = $(
      `<button class="chat-btn-full-width" title="Click to roll damage."><i class="fas fa-dice"></i>2H Damage: ${dmgFormula}</button>`
    );
    dmgRoll2hElement.append(dmgButton2h);

    dmgRoll2hElement.on("click", (ev) => {
      ev.stopPropagation();
      rollDmgButton(dmgFormula, debugDmgRollFormula, baseDmgFormula, damageType, actorId, itemId, itemUuid, tokenId, sourceType);
    });
  });

  return true;
}

/**
 * Insert four damage/healing buttons into chat messages and hook up their event handlers.
 * @param {*} html - The chat message HTML
 * @returns {Boolean} - True if buttons were added, false if not
 */
export async function handleApplyDamageButtons(html) {
  // Four damage-applying buttons in a row: full dmg, half dmg, full heal, full dmg w/ modifier prompt
  let dmgBtnsElement = html.find(".damage-button");
  if (dmgBtnsElement.length === 0) return false;

  dmgBtnsElement.each((_i, b) => {
    const total = Number($(b).data('total'));
    // const naturalRoll = Number($(b).data('natural'));
    const damageType = $(b).data('damageType');
    const applyDr = $(b).data('applyDr');
    let dieFormula = $(b).data('roll');
    let sourceType = $(b).data('sourceType');

    const fullDamageButton = $(
      `<button class="dice-total-fullDamage-btn chat-button-small" title="Click to apply ${total} damage to selected token(s)."><i class="fas fa-user-minus"></i></button>`
    );
    const halfDamageButton = $(
      `<button class="dice-total-halfDamage-btn chat-button-small" title="Click to apply half damage to selected token(s)."><i class="fas fa-user-shield"></i></button>`
    );
    const fullHealingButton = $(
      `<button class="dice-total-fullHealing-btn chat-button-small" title="Click to apply ${total} healing to selected token(s)."><i class="fas fa-user-plus"></i></button>`
    );
    const fullDamageModifiedButton = $(
      `<button class="dice-total-fullDamageMod-btn chat-button-small" title="Click to apply ${total} damage with modifier prompt to selected token(s)."><i class="fas fa-user-edit"></i></button>`
    );
    dmgBtnsElement.append(fullDamageButton);
    dmgBtnsElement.append(halfDamageButton);
    dmgBtnsElement.append(fullHealingButton);
    dmgBtnsElement.append(fullDamageModifiedButton);

    // Handle button clicks
    fullDamageButton.on("click", (ev) => {
      ev.stopPropagation();
      applyHealthChange(total, damageType, applyDr);
    });

    halfDamageButton.on("click", (ev) => {
      ev.stopPropagation();
      applyHealthChange(Math.floor(total*0.5), damageType, applyDr);
    });

    fullHealingButton.on("click", (ev) => {
      ev.stopPropagation();
      applyHealthChange(total*-1, damageType, false);
    });

    fullDamageModifiedButton.on("click", (ev) => {
      ev.stopPropagation();
      let buttons = {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: `Apply Modifier Above`,
          callback: (html) => {
            const form = html[0].querySelector("form");
            const modifier = ((
              form.querySelector('[name="inputField"]')
            ))?.value;
            if (modifier && modifier != "") {
              const nModifier = Number(modifier);
              if (nModifier) {
                rollCriticalDamage(total + nModifier, "", damageType, applyDr);
              } else {
                ui.notifications?.error(modifier + " is not a number");
              }
            }
          }
        }
      };
      if (sourceType === "weapon") {
        buttons["two"] = {
          icon: "<i class='fas fa-check'></i>",
          label: `×2 Dice Dmg (roll only)`,
          callback: () => rollCriticalDamage(total, dieFormula, damageType, applyDr)
        };
        buttons["three"] = {
          icon: "<i class='fas fa-check'></i>",
          label: `×3 Dice Dmg (roll only)`,
          callback: () => rollCriticalDamage(total, `${dieFormula}+${dieFormula}`, damageType, applyDr)
        };
        buttons["four"] = {
          icon: "<i class='fas fa-check'></i>",
          label: `×4 Dice Dmg (roll only)`,
          callback: () => rollCriticalDamage(total, `${dieFormula}+${dieFormula}+${dieFormula}`, damageType, applyDr)
        };
      }
      new Dialog({
        title: "Apply Modifier to Damage",
        content: `
          <form>
          <div class="form-group">
            <label>Modifier to damage (${total}) </label>
            <input type='text' name='inputField'></input>
          </div>
          </form>`,
        buttons,
        default: "yes",
      }).render(true);
    });
  });

  return true;
}

/**
 * 
 * @param {*} html - The chat message HTML
 * @returns {Boolean} - True if button was added, false if not
 */
export async function handleGenericDamageHealButtons(_msg, html) {
  // Catch any generic dice roll sent to chat
  const total = _msg.rolls?.[0]?.total ?? _msg.roll?.total;
  if (total === undefined) return; // not a dice roll

  const btnContainer = $(`<div class="roll-chat-buttons flexrow"></div>`);
  const dmgBtn = $(
    `<button class="dice-total-fullDamage-btn chat-button-small" title="Click to apply ${total} damage to selected token(s)."><i class="fas fa-user-minus"></i></button>`
  );
  const healBtn = $(
    `<button class="dice-total-fullHealing-btn chat-button-small" title="Click to apply ${total} healing to selected token(s)."><i class="fas fa-user-plus"></i></button>`
  );

  btnContainer.append(dmgBtn, healBtn);
  html.append(btnContainer);

  dmgBtn.on("click", () => applyHealthChange(total, "basic", true));
  healBtn.on("click", () => applyHealthChange(total * -1, "", false)); // Healing is negative, and ignores DR
}

/**********************************************************
 * Dice Rolling Functions
 **********************************************************/

/**
 * Roll normal or 2-hand damage button and display results in chat.
 * @param {*} formula - Damage roll formula including all calculated modifiers
 * @param {*} debugDmgRollFormula - Friendly text-string of damage formula with mods
 * @param {*} baseDmgFormula - Damage roll formula from the item, no additional mods
 * @param {*} damageType - Base damage type specified by the weapon or spell
 * @param {*} actorId - ID of the actor making the attack
 * @param {*} itemId - ID of the weapon or spell
 * @param {*} itemUuid - UUID of the weapon or spell
 * @param {*} tokenId - ID of the target token
 * @param {*} sourceType - Item type, either "weapon" or "spell"
 * @returns null
 */
async function rollDmgButton(formula, debugDmgRollFormula, baseDmgFormula, damageType, actorId, itemId, itemUuid, tokenId, sourceType) {
  // Fix invalid formulae if possible
  if (formula == "" || formula == null || formula == "0") {
    formula = "0d0"
  } else if (/^\d+$/.test(formula)) {
    formula = `${formula}d1`
  }

  let actor = {}

  // Log the attacking token, if available
  const token = canvas?.tokens.get(tokenId);
  Hyp3eLogger.info("rollDmgButton", `Token (ID ${tokenId}): `, token);
  if (token) {
    // Get the token's actor
    actor = token.actor;
  } else {
    // Get the game actor
    actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
  }
  if (!actor) {
    const msg = `Actor ${actorId} not found!`;
    Hyp3eLogger.error("rollDmgButton", msg);
    ui.notifications?.error(msg);
    return;
  }
  Hyp3eLogger.info("rollDmgButton", `Actor: `, actor);
  const actorData = actor.getRollData();

  const item = actor.items.get(itemId) ?? await fromUuid(itemUuid)
  if (!item) {
    const msg = `Item ${itemId} not found!`;
    Hyp3eLogger.error("rollDmgButton", msg);
    ui.notifications?.error(msg);
    return;
  }

  // Determine whether to apply DR based on item & damage type
  let applyDr = getApplyDr(item)

  Hyp3eLogger.info("rollDmgButton", `Damage roll formula: ${formula}`);
  // Invoke the damage roll
  let dmgRoll = new Roll(formula, actorData);
  Hyp3eLogger.info("rollDmgButton", `Damage roll object: `, dmgRoll);
  // Resolve the roll
  await dmgRoll.evaluate({ evaluateSync: true });

  let naturalDmgRoll = 0
  if (dmgRoll.dice[0]?.total) {
    naturalDmgRoll = dmgRoll.dice[0]?.total
  } else {
    naturalDmgRoll = dmgRoll.total
  }

  const damageText = damageType.toLowerCase().includes("heal") ? "Healing" : "Damage"
  const title = `Rolling ${damageText}...`
  const templateData = {
    title: title,
    dmgRoll: dmgRoll,
    debugDmgRollFormula: debugDmgRollFormula,
    naturalDmgRoll: naturalDmgRoll,
    dmgBaseRoll: baseDmgFormula,
    damageType: damageType,
    itemId: itemId,
    itemUuid: itemUuid,
    actorId: actorId,
    sourceType: item.type,
    applyDr: applyDr,
    save: item.system.save,
    hasEffects: item.effects.size > 0 ? true : false,
    description: item.system.description
  };

  const template = `${HYP3E.templatePath}/chat/damage-roll.hbs`;
  const html = await renderTemplate(template, templateData);

  // Send to chat
  dmgRoll.toMessage({
    author: game.user_id,
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: html
  })
}

/**
 * Roll additional critical-hit damage and display, with a button to apply.
 * @param {*} total - The original damage roll total
 * @param {*} extraRoll - Extra dice to be rolled for the crit
 * @param {*} damageType - Damage type specified by the weapon or spell
 * @param {*} applyDr - Whether to apply DR to the damage
 */
async function rollCriticalDamage(total, extraRoll, damageType, applyDr) {
  if (extraRoll != "") {
    const roll = await new Roll(extraRoll).roll();
    if (total => 0) {
      total += roll.total;
    } else {
      total -= roll.total;
    }
    // For showing the roll
    extraRoll = await roll.render();
    Hyp3eLogger.info("rollCriticalDamage", "Extra roll result: ", extraRoll);
  }
  const body = `
    <div class="dice-roll">
      <div class="dice-formula flexrow">
        <span class="dice-damage">${total} HP damage!</span>
        <span class="crit-damage-button" data-apply-dr="${applyDr}" data-damage-type="${damageType}" data-total="${total}"></span>
      </div>
    </div>`

  if (extraRoll != "") {
    extraRoll = `<p>Extra damage roll: ${extraRoll}</p>`;
  }

  // Log normal + critical damage as a chat message
  // const title = `Total damage ${total} HP!`
  const title = ``
  const templateData = {
    extraRoll: extraRoll,
    title: title,
    body: body
    // image: image
  };

  const template = `${HYP3E.templatePath}/chat/apply-damage.hbs`;
  const html = await renderTemplate(template, templateData);
  const chatData = {
    author: game.user_id,
    content: html
  };
  ChatMessage.create(chatData, {});

}

/**********************************************************
 * DR and Damage Application Functions
 **********************************************************/

/**
 * Determine whether to apply DR based on the attack & damage type.
 * @param {*} item - An item object with properties including type, dmgType, etc.
 * @returns {Boolean}
 */
export function getApplyDr(item) {
  let applyDr = false;

  if (item.system.dmgType === "basic" || item.system.dmgType === "") {
    // If the damage type is "basic" or blank, we determine DR by item/attack type
    applyDr = (item.type === "weapon" && !item.system?.isGrenade && !item.system?.isAreaEffect) ? true : false
  } else {
    // If the damage type has been specified, then we use that to determine DR
    if (["bludgeoning", "piercing", "slashing"].includes(item.system.dmgType)) {
      applyDr = true;
    } else {
      applyDr = false;
    }
  }
  return applyDr;
}

/**
 * Apply a health change (positive number is damage, negative is healing) to selected token(s).
 * @param {Number} total - Damage/healing to apply
 * @param {Boolean} applyDr - Whether to apply DR or not
 * @returns 
 */
export async function applyHealthChange(total, damageType = "basic", applyDr = true) {
  if (total === 0) return; // Skip changes of 0

  // Get selected tokens
  const tokens = canvas?.tokens?.controlled;
  if (!tokens || tokens.length === 0) {
    ui.notifications?.error("Apply Health Change: Please select at least one token.");
    return;
  }

  const names = [];

  for (const t of tokens) {
    const actor = t.actor;
    if (!actor) {
      ui.notifications?.error(`Apply Health Change: Actor ${t.name} not found!`);
      continue;
    }

    // Consider DR for the chat msg
    let damage_mod = total;
    // If applying damage check dr
    if (applyDr && total > 0 && actor.system.ac.dr > 0) {
      damage_mod = Math.max(0, total - actor.system.ac.dr);
      names.push(`${t.name} (dr ${actor.system.ac.dr} applied)`)
    } else {
      names.push(t.name);
    }
    // Did DR soak up all the damage?
    if (damage_mod == 0) continue;

    // Apply the change to the actor
    await actor.applyHealthChange(total, damageType, applyDr)

    // Show the health change by the token
    // Taken from Mana
    //https://gitlab.com/mkahvi/fvtt-micro-modules/-/blob/master/pf1-floating-health/floating-health.mjs#L182-194
    const fillColor = damage_mod < 0 ? "0x00FF00" : "0xFF0000";
    showValueChange(t, fillColor, damage_mod);

    // Do we need to apply unconscious or dead statuses right away?
    const resolveDeathAtRoundEnd = game.settings.get(game.system.id, "resolveDeathAtRoundEnd");
    if (!resolveDeathAtRoundEnd) {
      // Update token status now
      await t.combatant?.updateStatus();
    }
  }

  let body = "";
  body += `<ul><li>${names.join("</li><li>")}</li></ul>`;

  // Log health hit as a chat message
  const title = total > 0
    ? `Applied ${total} damage to...`
    : `Applied ${total*-1} healing to...`;
  const templateData = {
    extraRoll: "",
    title: title,
    body: body,
  };

  const template = `${HYP3E.templatePath}/chat/apply-damage.hbs`;
  const html = await renderTemplate(template, templateData);

  const chatData = {
    author: game.user_id,
    content: html
  };
  ChatMessage.create(chatData, {});
}

// Show a change in value by a token
export async function showValueChange(t, fillColor, total) {
  const floaterData = {
    anchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
    direction:
    total > 0
      ? CONST.TEXT_ANCHOR_POINTS.BOTTOM
      : CONST.TEXT_ANCHOR_POINTS.TOP,
    // duration: 2000,
    fontSize: 32,
    fill: fillColor,
    stroke: 0x000000,
    strokeThickness: 4,
    jitter: 0.3,
  };

  canvas?.interface?.createScrollingText(
    t.center,
    `${total * -1}`,
    floaterData
  );
}
