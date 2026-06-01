/**
 * Hyp3e Chat Message Handlers
 * Handle chat message buttons for critical hit and miss rolls.
 * David Sherman 2021-2024
 * @module chat/handlers/crit-handlers
 */
import { HYP3E } from "../../helpers/config.mjs"
import { Hyp3eLogger } from "../../helpers/logger.mjs";
import { applyHealthChange, rollDmgButton } from "./damage-handlers.mjs";

/**
 * 
 * @param {*} html - The chat message HTML
 * @returns {Boolean} - True if button was added, false if not
 */
export async function handleCritDamageButton(html) {
  // Apply critical damage button
  const html$ = $(html);
  let critDmgElement = html$.find(".crit-damage-button");
  if (critDmgElement.length === 0) return false;

  critDmgElement.each((_i, b) => {
    const total = Number($(b).data('total'));
    const damageType = $(b).data('damageType');
    const applyDr = $(b).data('applyDr');
    // let dieFormula =$(b).data('roll');
    const critDamageButton = $(
      `<button class="dice-total-critDamage-btn chat-button-crit" title="Apply ${total} damage to selected token(s)">Apply Damage <i class="fas fa-user-minus"></i></button>`
    );
    critDmgElement.append(critDamageButton);
    // Handle button clicks
    critDamageButton.on("click", (ev) => {
      ev.stopPropagation();
      applyHealthChange(total, damageType, applyDr);
    });
  });

  return true;
}

/**
 * 
 * @param {*} html - The chat message HTML
 * @returns {Boolean} - True if button was added, false if not
 */
export async function handleCritMissOrHitButtons(html) {
  // "longer" button style for crit miss/hit
  const html$ = $(html);
  const long_button = (critType, charType, icon) => `<button class="chat-btn-full-width" title="Roll critical ${critType} for ${baseClassLabel}-class"><i class="fas ${icon}"></i>${charType}</button>`;

  // Crit misses & hits are mutually exclusive so we can handle them both here
  let critMissElement = html$.find(".critical-miss");
  let critHitElement = html$.find(".critical-hit");
  if (critMissElement.length === 0 && critHitElement.length === 0) return false;

  let baseClass = "";
  let baseClassLabel = "";

  if (critMissElement.length > 0) {
    critMissElement.each((_i, b) => {
      baseClass = $(b).data('baseClass');
      if (baseClass != "npc") {
        baseClassLabel = baseClass.charAt(0).toUpperCase()+baseClass.substring(1)
      } else {
        baseClassLabel = "NPC"
      }
      let actorId = $(b).data('actorId');

      // Read weapon damage data embedded by actor.mjs (present when item has a valid damage formula)
      const formula = $(b).data('formula');
      const dmgData = formula ? {
        formula:    formula,
        debugFormula: $(b).data('debugFormula'),
        baseDamage:   $(b).data('baseDamage'),
        damageType:   $(b).data('damageType'),
        itemId:       $(b).data('itemId'),
        itemUuid:     $(b).data('itemUuid'),
        actorId:      actorId,
        tokenId:      $(b).data('tokenId'),
        sourceType:   $(b).data('sourceType'),
        damageGroups: $(b).data('damageGroups'),
      } : null;

      const icon = "fa-user-slash";
      const critMissButton = $(long_button('miss',`Roll Critical Miss`, icon));
      critMissElement.append(critMissButton);

      // Handle button clicks
      critMissButton.on("click", (ev) => {
        ev.stopPropagation();
        rollCritMiss(baseClass, actorId, dmgData);
      });
    });
  }

  if (critHitElement.length > 0) {
    critHitElement.each((_i, b) => {
      baseClass = $(b).data('baseClass');
      if (baseClass != "npc") {
        baseClassLabel = baseClass.charAt(0).toUpperCase()+baseClass.substring(1)
      } else {
        baseClassLabel = "NPC"
      }
      let actorId = $(b).data('actorId');
      const icon = "fa-user";

      // Check if the message also has a damage roll button to combine with
      const dmgEl = html$.find(".dmg-roll-button");
      if (dmgEl.length > 0) {
        const dmg2hEl = html$.find(".dmg-roll-button2h");
        const dmgData = {
          formula:      dmgEl.data('formula'),
          debugFormula: dmgEl.data('debugFormula'),
          baseDamage:   dmgEl.data('baseDamage'),
          damageType:   dmgEl.data('damageType'),
          itemId:       dmgEl.data('itemId'),
          itemUuid:     dmgEl.data('itemUuid'),
          actorId:      dmgEl.data('actorId'),
          tokenId:      dmgEl.data('tokenId'),
          sourceType:   dmgEl.data('sourceType'),
          damageGroups: dmgEl.data('damageGroups'),
        };

        // Hide separate damage button(s) — the combined button covers them
        dmgEl.hide();
        if (dmg2hEl.length > 0) dmg2hEl.hide();

        const critDmgButton = $(long_button('hit', `Roll Critical Damage`, icon));
        critHitElement.append(critDmgButton);
        critDmgButton.on("click", (ev) => {
          ev.stopPropagation();
          rollCritHitWithDamage(baseClass, dmgData.actorId, dmgData.formula, dmgData.debugFormula,
            dmgData.baseDamage, dmgData.damageType, dmgData.itemId, dmgData.itemUuid,
            dmgData.tokenId, dmgData.sourceType, dmgData.damageGroups);
        });

        if (dmg2hEl.length > 0) {
          const dmgData2h = {
            formula:    dmg2hEl.data('formula'),
            debugFormula: dmg2hEl.data('debugFormula'),
            baseDamage:   dmg2hEl.data('baseDamage'),
            damageType:   dmg2hEl.data('damageType'),
            itemId:     dmg2hEl.data('itemId'),
            itemUuid:   dmg2hEl.data('itemUuid'),
            actorId:    dmg2hEl.data('actorId'),
            tokenId:    dmg2hEl.data('tokenId'),
            sourceType:   dmg2hEl.data('sourceType'),
            damageGroups: dmg2hEl.data('damageGroups'),
          };
          const crit2hDmgButton = $(long_button('hit', `Roll Critical 2H Damage`, icon));
          critHitElement.append(crit2hDmgButton);
          crit2hDmgButton.on("click", (ev) => {
            ev.stopPropagation();
            rollCritHitWithDamage(baseClass, dmgData2h.actorId, dmgData2h.formula, dmgData2h.debugFormula,
              dmgData2h.baseDamage, dmgData2h.damageType, dmgData2h.itemId, dmgData2h.itemUuid,
              dmgData2h.tokenId, dmgData2h.sourceType, dmgData2h.damageGroups);
          });
        }
      } else {
        // No damage button present (e.g. crit-miss hitAllyCrit case) — show text result only
        const critHitButton = $(long_button('hit', `Roll Critical Damage`, icon));
        critHitElement.append(critHitButton);
        critHitButton.on("click", (ev) => {
          ev.stopPropagation();
          rollCritHit(baseClass, actorId);
        });
      }
    });
  }

  return true;
}

/**********************************************************
 * Dice Rolling Functions
 **********************************************************/

async function rollCritHit(charType, actorId) {
  let content = "";
  const dmg = game.i18n.localize("HYP3E.headers.damage");
  let roll = await new Roll("1d6").roll();
  if (charType === "fighter") {
    if (roll.total <= 2) {
      content = `<div class="dice-damage">+2 ${dmg}</div>`;
    } else if (roll.total <= 4) {
      content = `<div class="dice-damage">x2 Dice ${dmg}</div>`;
    } else if (roll.total <= 6) {
      content = `<div class="dice-damage">x3 Dice ${dmg}</div>`;
    }  else {
      content = "Critical Hit -- Error in getting result";
    }
  } else if (charType === "magician") {
    if (roll.total <= 2) {
      content = `<div class="dice-damage">+1 ${dmg}</div>`;
    } else if (roll.total <= 4) {
      content = `<div class="dice-damage">+2 ${dmg}</div>`;
    } else if (roll.total <= 6) {
      content = `<div class="dice-damage">x2 Dice ${dmg}</div>`;
    }  else {
      content = "Critical Hit -- Error in getting result";
    }
  } else {
    // cleric/thief/npc-monster
    if (roll.total <= 1) {
      content = `<div class="dice-damage">+1 ${dmg}</div>`;
    } else if (roll.total <= 3) {
      content = `<div class="dice-damage">+2 ${dmg}</div>`;
    } else if (roll.total <= 5) {
      content = `<div class="dice-damage">x2 Dice ${dmg}</div>`;
    }  else if (roll.total <= 6) {
      content = `<div class="dice-damage">x3 Dice ${dmg}</div>`;
    }  else {
      content = "Critical Hit -- Error in getting result";
    }
  }
  const templateData = {
    // title: game.i18n.localize(`HYP3E.attack.critHit.${charType}`),
    title: "",
    content: content,
    diceRoll: await roll.render()
  };
  const template = `${HYP3E.templatePath}/chat/crit-roll.hbs`;
  const html = await renderTemplate(template, templateData);

  const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
  if (!actor) {
    Hyp3eLogger.warn("rollCritHit", `Roll Crit Hit: Actor ${actorId} not found!`)
  }

  const flavor = `<div class="dice-damage">` + game.i18n.localize(`HYP3E.attack.critHit.${charType}`) + `</div>`
  // Send to chat
  roll.toMessage({
    author: game.user_id,
    speaker: ChatMessage.getSpeaker({ alias: actor.displayName }),
    roll: roll,
    flavor: flavor,
    content: html
  })
}

async function rollCritMiss(charType, actorId, dmgData = null) {
  let content = "";
  let hitCrit = false;
  let hitAllyOrSelf = false;
  let roll = await new Roll("1d12").roll();
  if (roll.total <= 2) {
    content = game.i18n.localize("HYP3E.attack.critMiss.badMiss");
  } else if (charType === "fighter") {
    if (roll.total <= 6) {
      content = game.i18n.localize("HYP3E.attack.critMiss.badMiss");
    } else if (roll.total <= 8) {
      const [feet, direction] = await getFeetAndDirectionCritMiss();
      content = game.i18n.format(
        "HYP3E.attack.critMiss.dropWeapon",
        { feet: feet, direction: direction }
      );
    } else if (roll.total <= 9) {
      content = game.i18n.localize("HYP3E.attack.critMiss.stumble");
    } else if (roll.total <= 10) {
      content = game.i18n.localize("HYP3E.attack.critMiss.tripFall");
    } else if (roll.total <= 11) {
      hitAllyOrSelf = true;
      if (await getCritMissHitCrit(charType)) {
        content = game.i18n.localize("HYP3E.attack.critMiss.hitAllyCrit");
        hitCrit = true;
      } else {
        content = game.i18n.localize("HYP3E.attack.critMiss.hitAlly");
      }
    } else if (roll.total == 12) {
      hitAllyOrSelf = true;
      if (await getCritMissHitCrit(charType)) {
        content = game.i18n.localize("HYP3E.attack.critMiss.hitSelfCrit");
        hitCrit = true;
      } else {
        content = game.i18n.localize("HYP3E.attack.critMiss.hitSelf");
      }
    }  else {
      content = "Critical Miss -- Error in getting result";
    }
  } else if (charType === "magician") {
    if (roll.total <= 2) {
      content = game.i18n.localize("HYP3E.attack.critMiss.badMiss");
    } else if (roll.total <= 4) {
      const [feet, direction] = await getFeetAndDirectionCritMiss();
      content = game.i18n.format(
        "HYP3E.attack.critMiss.dropWeapon",
        { feet: feet, direction: direction }
      );
    } else if (roll.total <= 6) {
      content = game.i18n.localize("HYP3E.attack.critMiss.stumble");
    } else if (roll.total <= 8) {
      content = game.i18n.localize("HYP3E.attack.critMiss.tripFall");
    } else if (roll.total <= 10) {
      hitAllyOrSelf = true;
      if (await getCritMissHitCrit(charType)) {
        content = game.i18n.localize("HYP3E.attack.critMiss.hitAllyCrit");
        hitCrit = true;
      } else {
        content = game.i18n.localize("HYP3E.attack.critMiss.hitAlly");
      }
    } else if (roll.total <= 12) {
      hitAllyOrSelf = true;
      if (await getCritMissHitCrit(charType)) {
        content = game.i18n.localize("HYP3E.attack.critMiss.hitSelfCrit");
        hitCrit = true;
      } else {
        content = game.i18n.localize("HYP3E.attack.critMiss.hitSelf");
      }
    }  else {
      content = "Critical Miss -- Error in getting result";
    }
  } else {
    // cleric/thief/npc-monster
    if (roll.total <= 4) {
      content = game.i18n.localize("HYP3E.attack.critMiss.badMiss");
    } else if (roll.total <= 6) {
      const [feet, direction] = await getFeetAndDirectionCritMiss();
      content = game.i18n.format(
        "HYP3E.attack.critMiss.dropWeapon",
        { feet: feet, direction: direction }
      );
    } else if (roll.total <= 8) {
      content = game.i18n.localize("HYP3E.attack.critMiss.stumble");
    } else if (roll.total <= 10) {
      content = game.i18n.localize("HYP3E.attack.critMiss.tripFall");
    } else if (roll.total <= 11) {
      hitAllyOrSelf = true;
      if (await getCritMissHitCrit(charType)) {
        content = game.i18n.localize("HYP3E.attack.critMiss.hitAllyCrit");
        hitCrit = true;
      } else {
        content = game.i18n.localize("HYP3E.attack.critMiss.hitAlly");
      }
    } else if (roll.total <= 12) {
      hitAllyOrSelf = true;
      if (await getCritMissHitCrit(charType)) {
        content = game.i18n.localize("HYP3E.attack.critMiss.hitSelfCrit");
        hitCrit = true;
      } else {
        content = game.i18n.localize("HYP3E.attack.critMiss.hitSelf");
      }
    }  else {
      content = "Critical Miss -- Error in getting result";
    }
  }

  content = `<div class="dice-damage">` + content + `</div>`
  if (hitAllyOrSelf && dmgData) {
    // Inject a damage roll button so the player can roll damage for the accidental hit.
    // For hitAllyCrit/hitSelfCrit, the .critical-hit div below will cause the chat handler
    // to replace this with a combined "Roll Critical Hit Damage" button automatically.
    content += `<div class='dmg-roll-button' style='padding-top: 5px'` +
      ` data-item-id='${dmgData.itemId}'` +
      ` data-item-uuid='${dmgData.itemUuid}'` +
      ` data-actor-id='${dmgData.actorId}'` +
      ` data-token-id='${dmgData.tokenId}'` +
      ` data-base-damage='${dmgData.baseDamage}'` +
      ` data-damage-type='${dmgData.damageType}'` +
      ` data-formula='${dmgData.formula}'` +
      ` data-debug-formula='${dmgData.debugFormula}'` +
      ` data-damage-groups='${JSON.stringify(dmgData.damageGroups)}'` +
      ` data-source-type='${dmgData.sourceType}'></div>`;
  }
  if (hitCrit) {
    content += `<div class='critical-hit' data-base-class='${charType}' data-actor-id='${actorId}'></div>`;
  }
  const templateData = {
    // title: game.i18n.localize(`HYP3E.attack.critMiss.${charType}`),
    title: "",
    content: content,
    diceRoll: await roll.render()
  };
  const template = `${HYP3E.templatePath}/chat/crit-roll.hbs`;
  const html = await renderTemplate(template, templateData);

  const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
  if (!actor) {
    Hyp3eLogger.warn("rollCritMiss", `Roll Crit Miss: Actor ${actorId} not found!`)
  }

  // const flavor = `<div class="dice-damage">` + game.i18n.localize(`HYP3E.attack.critMiss.${charType}`) + `</div>`
  const flavor = game.i18n.localize(`HYP3E.attack.critMiss.${charType}`)
  // Send to chat
  roll.toMessage({
    author: game.user_id,
    speaker: ChatMessage.getSpeaker({ alias: actor.displayName }),
    roll: roll,
    flavor: flavor,
    content: html
  })
}

/**
 * Roll 1d6 to determine the critical hit multiplier for a given class, then roll
 * and send damage with that multiplier applied — combining the two separate steps
 * into a single button click.
 */
async function rollCritHitWithDamage(charType, actorId, formula, debugDmgRollFormula, baseDmgFormula, damageType, itemId, itemUuid, tokenId, sourceType, damageGroups) {
  const dmg = game.i18n.localize("HYP3E.headers.damage");
  let roll = await new Roll("1d6").roll();
  let critLabel, formulaAppend;

  if (charType === "fighter") {
    if (roll.total <= 2) {
      critLabel = `+2 ${dmg}`;
      formulaAppend = "2";
    } else if (roll.total <= 4) {
      critLabel = `×2 Dice ${dmg}`;
      formulaAppend = `${baseDmgFormula}`;
    } else {
      critLabel = `×3 Dice ${dmg}`;
      formulaAppend = `${baseDmgFormula} + ${baseDmgFormula}`;
    }
  } else if (charType === "magician") {
    if (roll.total <= 2) {
      critLabel = `+1 ${dmg}`;
      formulaAppend = "1";
    } else if (roll.total <= 4) {
      critLabel = `+2 ${dmg}`;
      formulaAppend = "2";
    } else {
      critLabel = `×2 Dice ${dmg}`;
      formulaAppend = `${baseDmgFormula}`;
    }
  } else {
    // cleric / thief / npc-monster
    if (roll.total <= 1) {
      critLabel = `+1 ${dmg}`;
      formulaAppend = "1";
    } else if (roll.total <= 3) {
      critLabel = `+2 ${dmg}`;
      formulaAppend = "2";
    } else if (roll.total <= 5) {
      critLabel = `×2 Dice ${dmg}`;
      formulaAppend = `${baseDmgFormula}`;
    } else {
      critLabel = `×3 Dice ${dmg}`;
      formulaAppend = `${baseDmgFormula} + ${baseDmgFormula}`;
    }
  }
  // Hyp3eLogger.info("rollCritHitWithDamage", `Rolling critical hit damage. Base formula: ${formula}, formula to append: ${formulaAppend}, damageGroups: ${JSON.stringify(damageGroups)}`);

  const baseClassLabel = charType === "npc" ? "NPC" : charType.charAt(0).toUpperCase() + charType.substring(1);
  const title = `${baseClassLabel} Critical Hit: ${critLabel}`;
  // Insert the crit damage dice into the formula and adjust damageGroups accordingly (if present)
  const { adjFormula, adjDamageGroups } = insertCritDamageDice(formula, formulaAppend, damageGroups);
  // const adjustedFormula = formula + formulaAppend;

  // Update debugDmgRollFormula html to reflect the new formula with crit damage included, for use in the roll tooltip
  const debugDmgRollFormulaWithCrit = debugDmgRollFormula ? debugDmgRollFormula.replace(baseDmgFormula, `(${baseDmgFormula} + ${formulaAppend})`) : null;

  // Hyp3eLogger.info("rollCritHitWithDamage", `Debug damage html: ${debugDmgRollFormulaWithCrit}`);
  Hyp3eLogger.info("rollCritHitWithDamage", `Rolling critical hit damage with adjusted formula. Base formula: ${formula}, formula to append: ${formulaAppend}, adjusted formula: ${adjFormula}, original damageGroups: ${JSON.stringify(damageGroups)}, adjusted damageGroups: ${JSON.stringify(adjDamageGroups)}`);
  await rollDmgButton(
    adjFormula, debugDmgRollFormulaWithCrit, baseDmgFormula, damageType,
    actorId, itemId, itemUuid, tokenId, sourceType,
    adjDamageGroups,
    title
  );
}

/**********************************************************
 * Critical Hit / Miss Supporting Functions
 **********************************************************/

/**
 * Take the formulaAppend and insert it into the formula immediately after the 
 *  base damage dice. Then return the updated formula and damageGroups.
 * @param {*} formula 
 * @param {*} formulaAppend 
 * @returns {Object} - An object containing the updated formula and damageGroups
 */
function insertCritDamageDice(formula, formulaAppend, damageGroups) {
  if (!formula || !formulaAppend) return formula || "";

  // Hyp3eLogger.info("insertCritDamageDice", `Inserting crit damage dice into formula. Base formula: ${formula}, formula to append: ${formulaAppend}, damageGroups: ${JSON.stringify(damageGroups)}`);

  // Get the number of dice in the formulaAppend string, split on "+"
  const numDice = formulaAppend.split("+").length;
  
  // Update the damageGroups array objects to reflect the additional dice being added by the crit
  let adjDamageGroups = null;
  if (damageGroups) {
    // Copy the damageGroups array to avoid mutating the original
    adjDamageGroups = damageGroups.map(group => ({ ...group }));
    for (let i = 0; i < adjDamageGroups.length; i++) {
      // Each element is an object, so we update just the property we care about
      if (i == 0) {
        // For the first element, update termCount
        adjDamageGroups[i]["termCount"] += numDice;
      } else {
        // For subsequent elements, update termStart to reflect its new position in the formula
        adjDamageGroups[i]["termStart"] += numDice;
      }
    }
  }

  // Split the base formula on pluses or minuses, and retain the signs
  const parts = formula.split(/([+-])/);

  // Insert formulaAppend after the base damage dice (which is the first part)
  parts[0] = `${parts[0]} + ${formulaAppend}`;
  const adjFormula = parts.join("");
  // Hyp3eLogger.info("insertCritDamageDice", `Result → Formula: ${adjFormula}, damageGroups: ${JSON.stringify(adjDamageGroups)}`);

  return { adjFormula: adjFormula, adjDamageGroups: adjDamageGroups };
}

/**
 * Roll to determine how many feet the weapon is tossed and in which direction, 
 *  for certain critical miss results.
 * @returns {Array} - An array of two elements: [number of feet, direction]
 */
async function getFeetAndDirectionCritMiss() {
  let feetRoll = await new Roll("1d6+4").roll();
  let feet = feetRoll.total;
  let directionRoll = await new Roll("1d6").roll();
  let direction = "forward";
  if (directionRoll.total == 4){
    direction = "left";
  } else if (directionRoll.total == 5) {
    direction = "right";
  } else if (directionRoll.total == 6) {
    direction = "backward";
  }
  return [feet, direction];
}

async function getCritMissHitCrit(charType) {
  let roll = await new Roll("1d8").roll();
  if (charType === "fighter" && roll.total == 1) {
    return true;
  } else if (charType === "magician" && roll.total <= 3) {
    return true;
  } else if ((charType === "cleric" || charType === "thief" || charType === "npc") && roll.total <= 2) {
    return true;
  }
  return false;
}
