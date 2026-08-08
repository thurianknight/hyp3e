/**
 * Hyp3e Chat Message Handlers
 * Handle chat message buttons for damage rolls and applying damage/healing.
 * David Sherman 2021-2024
 * @module chat/handlers/damage-handlers
 */
import { HYP3E } from "../../helpers/config.mjs"
import { Hyp3eLogger } from "../../helpers/logger.mjs";

/**
 * Resolve the actor that originated a damage roll.
 * Prefer the token actor so unlinked token actors use their effective ownership.
 * @param {string} actorId - ID of the actor making the attack
 * @param {string} tokenId - ID of the actor's token
 * @returns {Actor|null}
 */
export function resolveDamageRollActor(actorId, tokenId) {
  const tokenActor = tokenId ? canvas?.tokens?.get(tokenId)?.actor : null;
  return tokenActor ?? game.actors?.get(actorId) ?? null;
}

/**
 * Determine whether the current user may roll damage for an actor.
 * @param {string} actorId - ID of the actor making the attack
 * @param {string} tokenId - ID of the actor's token
 * @returns {boolean}
 */
export function canCurrentUserRollDamage(actorId, tokenId) {
  const actor = resolveDamageRollActor(actorId, tokenId);
  return Boolean(actor && (game.user?.isGM || actor.isOwner));
}

/**
 * Insert 1-Hand damage roll button into chat messages and hook up it's event handler.
 * @param {*} html - The chat message HTML
 * @returns {Boolean} - True if buttons were added, false if not
 */
export async function handleDamageRollButtons(html) {
  const html$ = $(html);
  let dmgRollElement = html$.find(".dmg-roll-button");
  if (dmgRollElement.length === 0) return false;

  dmgRollElement.each((_i, b) => {
    const baseDmgFormula = $(b).data('baseDamage');
    const dmgFormula = $(b).data('formula');
    const debugDmgRollFormula = $(b).data('debugFormula');
    const damageType = $(b).data('damageType');
    // const damageGroups = JSON.parse($(b).data('damageGroups'));
    const damageGroups = $(b).data('damageGroups');
    const sourceType = $(b).data('sourceType');
    const itemId = $(b).data('itemId');
    const itemUuid = $(b).data('itemUuid');
    const actorId = $(b).data('actorId');
    const tokenId = $(b).data('tokenId');
    const buttonText = damageType.toLowerCase().includes("heal") ? "Roll Healing" : "Roll Damage"

    if (!canCurrentUserRollDamage(actorId, tokenId)) return;

    let dmgButton = $(
      `<button class="chat-btn-full-width" title="Roll damage"><i class="fas fa-dice"></i>${buttonText}</button>`
    );
    dmgRollElement.append(dmgButton);

    dmgRollElement.on("click", (ev) => {
      ev.stopPropagation();
      rollDmgButton(dmgFormula, debugDmgRollFormula, baseDmgFormula, damageType, actorId, itemId, itemUuid, tokenId, sourceType, damageGroups);
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
  const html$ = $(html);
  let dmgRoll2hElement = html$.find(".dmg-roll-button2h");
  if (dmgRoll2hElement.length === 0) return false;

  dmgRoll2hElement.each((_i, b) => {
    const baseDmgFormula = $(b).data('baseDamage');
    const dmgFormula = $(b).data('formula');
    const debugDmgRollFormula = $(b).data('debugFormula');
    const damageType = $(b).data('damageType');
    // const damageGroups = JSON.parse($(b).data('damageGroups'));
    const damageGroups = $(b).data('damageGroups');
    const sourceType = $(b).data('sourceType');
    const itemId = $(b).data('itemId');
    const itemUuid = $(b).data('itemUuid');
    const actorId = $(b).data('actorId');
    const tokenId = $(b).data('tokenId');

    if (!canCurrentUserRollDamage(actorId, tokenId)) return;

    let dmgButton2h = $(
      `<button class="chat-btn-full-width" title="Roll 2H damage"><i class="fas fa-dice"></i>2-Hand Damage</button>`
    );
    dmgRoll2hElement.append(dmgButton2h);

    dmgRoll2hElement.on("click", (ev) => {
      ev.stopPropagation();
      rollDmgButton(dmgFormula, debugDmgRollFormula, baseDmgFormula, damageType, actorId, itemId, itemUuid, tokenId, sourceType, damageGroups);
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
  const html$ = $(html);
  let dmgBtnsElement = html$.find(".damage-button");
  if (dmgBtnsElement.length === 0) return false;

  dmgBtnsElement.each((_i, b) => {
    const total = Number($(b).data('total'));
    // const naturalRoll = Number($(b).data('natural'));
    const damageType = $(b).data('damageType');
    const applyDr = $(b).data('applyDr');
    let dieFormula = $(b).data('roll');
    let sourceType = $(b).data('sourceType');

    const fullDamageButton = $(
      `<button class="dice-total-fullDamage-btn chat-button-small" title="Apply ${total} damage to selected token(s)"><i class="fas fa-user-minus"></i></button>`
    );
    const halfDamageButton = $(
      `<button class="dice-total-halfDamage-btn chat-button-small" title="Apply half damage to selected token(s)"><i class="fas fa-user-shield"></i></button>`
    );
    const fullHealingButton = $(
      `<button class="dice-total-fullHealing-btn chat-button-small" title="Apply ${total} healing to selected token(s)"><i class="fas fa-user-plus"></i></button>`
    );
    const fullDamageModifiedButton = $(
      `<button class="dice-total-fullDamageMod-btn chat-button-small" title="Apply ${total} damage with modifier prompt to selected token(s)"><i class="fas fa-user-edit"></i></button>`
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
          callback: (html$) => {
            const form = html$[0].querySelector("form");
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
  const html$ = $(html);
  const total = _msg.rolls?.[0]?.total ?? _msg.roll?.total;
  if (total === undefined) return; // not a dice roll

  const btnContainer = $(`<div class="roll-chat-buttons flexrow"></div>`);
  const dmgBtn = $(
    `<button class="dice-total-fullDamage-btn chat-button-small" title="Apply ${total} damage to selected token(s)"><i class="fas fa-user-minus"></i></button>`
  );
  const healBtn = $(
    `<button class="dice-total-fullHealing-btn chat-button-small" title="Apply ${total} healing to selected token(s)"><i class="fas fa-user-plus"></i></button>`
  );

  btnContainer.append(dmgBtn, healBtn);
  html$.append(btnContainer);

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
export async function rollDmgButton(formula, debugDmgRollFormula, baseDmgFormula, damageType, actorId, itemId, itemUuid, tokenId, sourceType, damageGroups, titleOverride = null) {
  // Fix invalid formulae if possible
  if (formula == "" || formula == null || formula == "0") {
    formula = "0d0"
  } else if (/^\d+$/.test(formula)) {
    formula = `${formula}d1`
  }

  const actor = resolveDamageRollActor(actorId, tokenId);
  if (!actor) {
    const msg = `Actor ${actorId} not found!`;
    Hyp3eLogger.error("rollDmgButton", msg);
    ui.notifications?.error(msg);
    return;
  }

  if (!game.user?.isGM && !actor.isOwner) {
    const msg = `Only a GM or an owner of ${actor.name} can roll this damage.`;
    Hyp3eLogger.warn("rollDmgButton", msg);
    ui.notifications?.warn(msg);
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

  Hyp3eLogger.info("rollDmgButton", `Damage types: `, damageGroups);

  // Calculate damage-type totals from the roll, respecting +/- operators
  const fullTerms = dmgRoll.terms;  // Keep ALL terms, including OperatorTerm
  Hyp3eLogger.info("rollDmgButton", `Full roll terms: `, fullTerms.map(t => ({
    class: t.constructor.name,
    total: t.total,
    operator: t instanceof foundry.dice.terms.OperatorTerm ? t.operator : null
  })));

  const typeDamages = damageGroups.map(group => {
    // Slice the consecutive terms belonging to this damage group.
    // (The original termStart and termCount were calculated based on non-operator terms,
    //  so we need to adjust the slice to include the operators that belong to them)

    // Because operators sit BETWEEN value terms, the full slice needs to start at the
    //  first value term of the group, and include up to (and including) the last value term,
    //  plus any trailing operator only if it's part of the next group — but since groups are
    //  additive, we usually want value terms + their preceding operator (except first group).

    let nonOpCount = 0;
    let startIdx = -1;
    let endIdx = -1;  // inclusive
  
    for (let i = 0; i < fullTerms.length; i++) {
      if (!(fullTerms[i] instanceof foundry.dice.terms.OperatorTerm)) {
        if (nonOpCount === group.termStart) {
          startIdx = i;
        }
        if (nonOpCount === group.termStart + group.termCount - 1) {
          endIdx = i;
          break;  // No need to continue once we have the last value term
        }
        nonOpCount++;
      }
    }
  
    if (startIdx === -1 || endIdx === -1) {
      Hyp3eLogger.warn("rollDmgButton", `Could not map group to term indices`, group);
      return { type: group.dmgType, total: 0, icon: `<img src="${group.icon}" />`, label: group.label || group.dmgType };
    }
    Hyp3eLogger.info("rollDmgButton", `Start/end indexes: `, { start: startIdx, end: endIdx });

    // Now include the operator BEFORE the first value term (if any), but only if it's not the very first term
    //  (The very first group has no preceding operator — it's implicitly positive)
    let groupTerms = fullTerms.slice(startIdx, endIdx + 1);
  
    if (startIdx > 0) {
      // Include the operator immediately before the first value term of this group
      const prevTerm = fullTerms[startIdx - 1];
      if (prevTerm instanceof foundry.dice.terms.OperatorTerm) {
        groupTerms = [prevTerm, ...groupTerms];
      }
    }
    Hyp3eLogger.info("rollDmgButton", `Group terms for ${group.dmgType}: `, groupTerms);

    let groupTotal = 0;
    let currentSign = 1;  // starts positive (first term has no preceding operator)
    
    for (const term of groupTerms) {
      if (term instanceof foundry.dice.terms.OperatorTerm) {
        currentSign = term.operator === "+" ? 1 : -1;
      } else {
        // Apply current sign to this value term's total
        groupTotal += currentSign * (term.total ?? 0);
        // Reset sign to +1 after applying (next operator will override)
        currentSign = 1;
      }
    }
    Hyp3eLogger.info("rollDmgButton", `Group total: `, groupTotal);

    return {
      type: group.dmgType,
      total: groupTotal,
      icon: `<img src="${group.icon}" />`,
      label: group.label || group.dmgType
    };
  })  //.filter(d => d.total !== 0);  // or > 0 or >=0 depending on your preference
  Hyp3eLogger.info("rollDmgButton", `Damage types: `, typeDamages);

  let naturalDmgRoll = 0
  if (dmgRoll.dice[0]?.total) {
    naturalDmgRoll = dmgRoll.dice[0]?.total
  } else {
    naturalDmgRoll = dmgRoll.total
  }

  const damageText = damageType.toLowerCase().includes("heal") ? "Healing" : "Damage"
  const title = titleOverride ?? `Rolling ${damageText}...`
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
    description: item.system.description,
    typeDamages: typeDamages
  };

  const template = `${HYP3E.templatePath}/chat/damage-roll.hbs`;
  const html = await foundry.applications.handlebars.renderTemplate(template, templateData);

  // Send to chat
  dmgRoll.toMessage({
    author: game.user_id,
    speaker: ChatMessage.getSpeaker({ alias: actor.displayName }),
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
  const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
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
  const html = await foundry.applications.handlebars.renderTemplate(template, templateData);

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
