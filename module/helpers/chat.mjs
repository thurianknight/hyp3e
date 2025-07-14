import { HYP3E } from "./config.mjs"
import {applyEffect, enableEffect, disableEffect} from "./effects.mjs";

// hook listener for adding buttons to damage roll
// done here instead of inline to add listeners in js
export const addChatMessageButtons = async function(_msg, html, _data) {

    // Damage-roll button
    let dmgRoll = html.find(".dmg-roll-button");
    if (dmgRoll.length > 0) {
        dmgRoll.each((_i, b) => {
            if (CONFIG.HYP3E.debugMessages) { console.log(`Damage html: `, b) }
            const baseDmgFormula = $(b).data('baseDamage');
            const dmgFormula = $(b).data('formula');
            const debugDmgRollFormula = $(b).data('debugFormula');
            const sourceType = $(b).data('sourceType');
            const itemId = $(b).data('itemId');
            const itemUuid = $(b).data('itemUuid');
            const actorId = $(b).data('actorId');
            const tokenId = $(b).data('tokenId');
            let dmgButton = $(
                `<button class="chat-btn-full-width" title="Click to roll damage."><i class="fas fa-dice"></i>Damage: ${dmgFormula}</button>`
            );
            dmgRoll.append(dmgButton);

            // Handle button clicks
            dmgRoll.on("click", (ev) => {
                ev.stopPropagation();
                rollDmgButton(dmgFormula, debugDmgRollFormula, baseDmgFormula, actorId, itemId, itemUuid, tokenId, sourceType);
            });
        });
    }
    // Damage-roll button for 2-hand damage
    let dmgRoll2h = html.find(".dmg-roll-button2h");
    if (dmgRoll2h.length > 0) {
        dmgRoll2h.each((_i, b) => {
            if (CONFIG.HYP3E.debugMessages) { console.log(`2-hand damage html: `, b) }
            const baseDmgFormula = $(b).data('baseDamage');
            const dmgFormula = $(b).data('formula');
            const debugDmgRollFormula = $(b).data('debugFormula');
            const applyDr = $(b).data('applyDr');
            const sourceType = $(b).data('sourceType');
            const itemId = $(b).data('itemId');
            const itemUuid = $(b).data('itemUuid');
            const actorId = $(b).data('actorId');
            const tokenId = $(b).data('tokenId');
            let dmgButton = $(
                `<button class="chat-btn-full-width" title="Click to roll damage."><i class="fas fa-dice"></i>2H Damage: ${dmgFormula}</button>`
            );
            dmgRoll2h.append(dmgButton);

            // Handle button clicks
            dmgRoll2h.on("click", (ev) => {
                ev.stopPropagation();
                rollDmgButton(dmgFormula, debugDmgRollFormula, baseDmgFormula, actorId, itemId, itemUuid, tokenId, sourceType);
            });
        });
    }

    // Four damage-applying buttons
    let dmg = html.find(".damage-button");
    let baseClass = ""
    let baseClassLabel = ""

    if (dmg.length > 0) {
        dmg.each((_i, b) => {
            let total = Number($(b).data('total'));
            let naturalRoll = Number($(b).data('natural'));
            const applyDr = $(b).data('applyDr');
            let dieFormula = $(b).data('roll');
            let sourceType = $(b).data('sourceType');

            const fullDamageButton = $(
                `<button class="dice-total-fullDamage-btn chat-button-small" title="Click to apply full damage to selected token(s)."><i class="fas fa-user-minus"></i></button>`
            );
            const halfDamageButton = $(
                `<button class="dice-total-halfDamage-btn chat-button-small" title="Click to apply half damage to selected token(s)."><i class="fas fa-user-shield"></i></button>`
            );
            const fullHealingButton = $(
                `<button class="dice-total-fullHealing-btn chat-button-small" title="Click to apply full healing to selected token(s)."><i class="fas fa-user-plus"></i></button>`
            );        
            const fullDamageModifiedButton = $(
                `<button class="dice-total-fullDamageMod-btn chat-button-small" title="Click to apply full damage with modifier prompt to selected token(s)."><i class="fas fa-user-edit"></i></button>`
            );
            dmg.append(fullDamageButton);
            dmg.append(halfDamageButton);
            dmg.append(fullHealingButton);
            dmg.append(fullDamageModifiedButton);

            // Handle button clicks
            fullDamageButton.on("click", (ev) => {
                ev.stopPropagation();
                applyHealthDrop(total, applyDr);
            });

            halfDamageButton.on("click", (ev) => {
                ev.stopPropagation();
                applyHealthDrop(Math.floor(total*0.5), applyDr);
            });

            fullHealingButton.on("click", (ev) => {
                ev.stopPropagation();
                applyHealthDrop(total*-1, false);
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
                                    rollCriticalDamage(total + nModifier, "", applyDr);
                                } else {
                                    ui.notifications?.error(modifier + " is not a number");
                                }
                            }
                        }
                    }
                };
                if (sourceType === "weapon") {
                    if (CONFIG.HYP3E.debugMessages) { console.log("Adding ×2/×3/×4 buttons for weapon") }
                    buttons["two"] = {
                        icon: "<i class='fas fa-check'></i>",
                        label: `×2 Dice Dmg (roll only)`,
                        callback: () => rollCriticalDamage(total, dieFormula, applyDr)
                    };
                    buttons["three"] = {
                        icon: "<i class='fas fa-check'></i>",
                        label: `×3 Dice Dmg (roll only)`,
                        callback: () => rollCriticalDamage(total, `${dieFormula}+${dieFormula}`, applyDr)
                    };
                    buttons["four"] = {
                        icon: "<i class='fas fa-check'></i>",
                        label: `×4 Dice Dmg (roll only)`,
                        callback: () => rollCriticalDamage(total, `${dieFormula}+${dieFormula}+${dieFormula}`, applyDr)
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
    }

    // Apply critical damage button
    let critDmg = html.find(".crit-damage-button");
    if (critDmg.length > 0) {
        critDmg.each((_i, b) => {
            const total = Number($(b).data('total'));
            const applyDr = $(b).data('applyDr');
            // let dieFormula =$(b).data('roll');
            const critDamageButton = $(
                `<button class="dice-total-critDamage-btn chat-button-crit" title="Click to apply damage to selected token(s).">Apply Damage <i class="fas fa-user"></i></button>`
            );
            critDmg.append(critDamageButton);
            // Handle button clicks
            critDamageButton.on("click", (ev) => {
                ev.stopPropagation();
                applyHealthDrop(total, applyDr);
            });
        });
    }

    // "longer" button style for crit miss/hit
    const long_button = (critType, charType, icon) => `<button class="chat-btn-full-width" title="Click to roll critical ${critType} to selected token(s)."><i class="fas ${icon}"></i>${charType}</button>`;

    let critMiss = html.find(".critical-miss");
    if (critMiss.length > 0) {
        critMiss.each((_i, b) => {
            baseClass = $(b).data('baseClass');
            if (baseClass != "npc") {
                baseClassLabel = baseClass.charAt(0).toUpperCase()+baseClass.substring(1)
            } else {
                baseClassLabel = "NPC"
            }
            let actorId = $(b).data('actorId');
            const icon = "fa-user-slash";
            const critMissButton = $(long_button('miss',`Roll Critical Miss for ${baseClassLabel}-class`, icon));
            critMiss.append(critMissButton);

            // Handle button clicks
            critMissButton.on("click", (ev) => {
                ev.stopPropagation();
                rollCritMiss(baseClass, actorId);
            });
        });
    }

    let critHit = html.find(".critical-hit");
    if (critHit.length > 0) {
        critHit.each((_i, b) => {
            baseClass = $(b).data('baseClass');
            if (baseClass != "npc") {
                baseClassLabel = baseClass.charAt(0).toUpperCase()+baseClass.substring(1)
            } else {
                baseClassLabel = "NPC"
            }
            let actorId = $(b).data('actorId');
            const icon = "fa-user";
            const critHitButton = $(long_button('hit',`Roll Critical Hit for ${baseClassLabel}-class`, icon));
            critHit.append(critHitButton);

            // Handle button clicks
            critHitButton.on("click", (ev) => {
                ev.stopPropagation();
                rollCritHit(baseClass, actorId);
            });
        });
    }

    // Saving throw button
    let save = html.find(".save-button");
    if (save.length > 0) {
        save.each((_i, b) => {
            if (CONFIG.HYP3E.debugMessages) { console.log(`Save html: `, b) }
            let saveType = $(b).data('save');
            let saveButton = $(
                `<button class="chat-btn-full-width" title="Click to roll save to selected token(s)."><i class="fas fa-dice-d20"></i>Save: ${saveType}</button>`
            );
            save.append(saveButton);

            // Handle button clicks
            save.on("click", (ev) => {
                ev.stopPropagation();
                rollSaveButton(saveType);
            });
        });
    }

    // Apply/Enable/Disable Effect buttons
    let effectApply = html.find(".apply-effects-button");
    if (effectApply.length > 0) {
        effectApply.each(async (_i, b) => {
            if (CONFIG.HYP3E.debugMessages) { console.log(`Apply Effects html: `, b) }
            let itemId = $(b).data('itemId');
            let itemUuid = $(b).data('itemUuid');
            let actorId = $(b).data('actorId');
            // Get the actor
            let actor = game.actors.get(actorId);
            if (!actor) {
                ui.notifications?.error(`Apply Effects Button: Actor ${actorId} not found!`);
                if (CONFIG.HYP3E.debugMessages) { console.log(`Apply Effects Button: Actor ${actorId} not found!`) }
                return;
            }
            if (CONFIG.HYP3E.debugMessages) { console.log(`Apply Effects Button actor: `, actor) }
            // Get the actor's item or global item
            let item = actor.items.get(itemId) ?? await fromUuid(itemUuid);
            if (!item) {
                ui.notifications?.error(`Apply Effects Button: Item ${itemId} not found! See console log for details.`);
                if (CONFIG.HYP3E.debugMessages) {
                    console.log(`Apply Effects Button: Item ${itemId} not found!`)
                    console.log(`Apply Effects Button: Likely issue is that the item is owned by a token, but not the base actor.`)
                    console.log(`Apply Effects Button: This is most common with NPCs and monsters, if the GM drags an item or creates a new item directly in the token sheet.`)
                }
                return;
            } else if (!item.system.identified) {
                if (CONFIG.HYP3E.debugMessages) { console.log(`Item ${item.name} has not been identified, so we will not display any buttons.`) }
                return;
            }
            if (CONFIG.HYP3E.debugMessages) { console.log(`Apply Effects Button item: `, item) }

            // Is the owner/actor targeted by this effect?
            let actorTargeted = false

            // The logic we need here will do the following:
            // Check to see if the item applies effect(s) to the actor (the actor is targeted).
            //      - The actor is usually targeted for item-based passive effects, those that are 
            //      either always-on, or can be enabled & disabled.
            //      - Spells and charge-based items usually do NOT target the actor, because they 
            //      only apply temporary effects, and only upon casting or charge expenditure.
            //  If the actor is targeted, check to see if the effect is already applied & enabled.
            //      - If disabled, create a button to enable the effect on the actor.
            //      - If enabled, create a button to disable the effect on the actor.
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
                        effectApply.append(effectDisableButton);
                        // Handle button clicks
                        effectDisableButton.on("click", (ev) => {
                            ev.stopPropagation();
                            disableEffect(item, effect.id, actorId);
                        });
                    } else {
                        // Effect is disabled, so create a button to enable it
                        let effectEnableButton = $(
                            `<button class="chat-btn-full-width" title="Click to enable ${effect.name} on ${actor.name}."><i class="fas fa-user-check"></i>Enable ${effect.name}</button>`
                        );
                        effectApply.append(effectEnableButton);
                        // Handle button clicks
                        effectEnableButton.on("click", (ev) => {
                            ev.stopPropagation();
                            enableEffect(item, effect.id, actorId);
                        });
                    }
                } else {
                    // The actor is not targeted, so create a button to apply the effect to selected token(s)
                    let effectApplyButton = $(
                        `<button class="chat-btn-full-width" title="Click to apply ${effect.name} to selected tokens."><i class="fas fa-hand-paper"></i>Apply ${effect.name}</button>`
                    );
                    effectApply.append(effectApplyButton);
                    // Handle button clicks
                    effectApplyButton.on("click", (ev) => {
                        ev.stopPropagation();
                        applyEffect(item, effect.id, actorId);
                    });
                }
            });
        });
    }
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

// Roll damage button and display in chat
async function rollDmgButton(formula, debugDmgRollFormula, baseDmgFormula, actorId, itemId, itemUuid, tokenId, sourceType) {
    // if (formula == "") { return } // Exit on empty formula
    // Fix invalid formulae if possible
    if (formula == "" || formula == null || formula == "0") {
        formula = "0d0"
    } else if (/^\d+$/.test(formula)) {
        formula = `${formula}d1`
    }

    let actor = {}

    // Log the attacking token, if available
    const token = canvas?.tokens.get(tokenId);
    if (CONFIG.HYP3E.debugMessages) { console.log(`rollDmgButton: Token (ID ${tokenId}): `, token) }
    if (token) {
        // Get the token's actor
        actor = token.actor;
    } else {
        // Get the game actor
        actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
    }
    if (!actor) {
        ui.notifications?.error(`Roll Damage: Actor ${actorId} not found!`)
        return
    }
    if (CONFIG.HYP3E.debugMessages) { console.log(`rollDmgButton: Actor: `, actor) }

    const item = actor.items.get(itemId) ?? await fromUuid(itemUuid)
    if (!item) {
        ui.notifications?.error(`Roll Damage: Item ${itemId} not found!`);
        return;
    }

    // Is this attack type reduced by DR? Answer YES if:
    //  - The attack is a weapon (melee or missile), AND it is not a grenade-like or area-effect attack
    // Answer NO if:
    //  - The attack is a spell, grenade-like attack, or area-effect attack
    const applyDr = (item.type == "weapon" && !item.system?.isGrenade && !item.system?.isAreaEffect) ? true : false

    if (CONFIG.HYP3E.debugMessages) { console.log(`Damage roll formula: ${formula}`) }
    // Invoke the damage roll
    let dmgRoll = new Roll(formula);
    if (CONFIG.HYP3E.debugMessages) { console.log(`Damage roll object: `, dmgRoll) }
    // Resolve the roll
    await dmgRoll.evaluate({ evaluateSync: true });

    let naturalDmgRoll = 0
    if (dmgRoll.dice[0]?.total) {
        naturalDmgRoll = dmgRoll.dice[0]?.total
    } else {
        naturalDmgRoll = dmgRoll.total
    }

    const title = "Rolling Damage..."
    const templateData = {
        title: title,
        dmgRoll: dmgRoll,
        debugDmgRollFormula: debugDmgRollFormula,
        naturalDmgRoll: naturalDmgRoll,
        dmgBaseRoll: baseDmgFormula,
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
            rollMode: "publicroll",
            rollTarget: saveTarget
        };
        await actor.rollSave(dataset);
    }
}

// Decrement item inventory when used
async function useItem(itemId, actorId) {
    const actor = game.actors.get(actorId)
    actor.useItem(itemId);
}

// Roll additional critical-hit damage and display, with a button to apply
async function rollCriticalDamage(total, extraRoll, applyDr) {
    if (extraRoll != "") {
        const roll = await new Roll(extraRoll).roll();
        if (total => 0) {
            total += roll.total;
        } else {
            total -= roll.total;
        }
        // For showing the roll
        extraRoll = await roll.render();
        if (CONFIG.HYP3E.debugMessages) { console.log("rollCriticalDamage: Extra roll result: ", extraRoll) }
    }
    const body = `
        <div class="dice-roll">
            <div class="dice-formula flexrow">
                <span class="dice-damage">${total} HP damage!</span>
                <span class="crit-damage-button flexrow" data-apply-dr="${applyDr}" data-total="${total}"></span>
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

// Apply a health drop (positive number is damage) to one or more tokens.
async function applyHealthDrop(total, applyDr=true) {
    if (total == 0) return; // Skip changes of 0

    // Get selected tokens
    const tokens = canvas?.tokens?.controlled;
    if (!tokens || tokens.length == 0) {
        ui.notifications?.error("Apply Damage: Please select at least one token.");
        return;
    }

    const names = [];

    for (const t of tokens) {
        const actor = t.actor;
        if (!actor) {
            ui.notifications?.error(`Apply Damage: Actor ${t.name} not found!`);
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
        await actor.applyHealthChange(total, applyDr)

        // Show the health change by the token
        // Taken from Mana
        //https://gitlab.com/mkahvi/fvtt-micro-modules/-/blob/master/pf1-floating-health/floating-health.mjs#L182-194
        const fillColor = damage_mod < 0 ? "0x00FF00" : "0xFF0000";
        showValueChange(t, fillColor, damage_mod);

        // Update token status
        await t.combatant?.updateStatus();
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
        title: game.i18n.localize(`HYP3E.attack.critHit.${charType}`),
        content: content,
        diceRoll: await roll.render()
    };
    const template = `${HYP3E.templatePath}/chat/crit-roll.hbs`;
    const html = await renderTemplate(template, templateData);

    const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
    if (!actor) {
        console.log(`Roll Crit Hit: Actor ${actorId} not found!`)
    }

    // Send to chat
    roll.toMessage({
        author: game.user_id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        roll: roll,
        content: html
    })

}

async function rollCritMiss(charType, actorId) {
    let content = "";
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
            if (await getCritMissHitCrit(charType)) {
                content = game.i18n.localize("HYP3E.attack.critMiss.hitAllyCrit");
            } else {
                content = game.i18n.localize("HYP3E.attack.critMiss.hitAlly");
            }            
        } else if (roll.total == 12) {
            if (await getCritMissHitCrit(charType)) {
                content = game.i18n.localize("HYP3E.attack.critMiss.hitSelfCrit");
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
            if (await getCritMissHitCrit(charType)) {
                content = game.i18n.localize("HYP3E.attack.critMiss.hitAllyCrit");
            } else {
                content = game.i18n.localize("HYP3E.attack.critMiss.hitAlly");
            }            
        } else if (roll.total <= 12) {
            if (await getCritMissHitCrit(charType)) {
                content = game.i18n.localize("HYP3E.attack.critMiss.hitSelfCrit");
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
            if (getCritMissHitCrit(charType)) {
                content = game.i18n.localize("HYP3E.attack.critMiss.hitAllyCrit");
            } else {
                content = game.i18n.localize("HYP3E.attack.critMiss.hitAlly");
            }            
        } else if (roll.total <= 12) {
            if (getCritMissHitCrit(charType)) {
                content = game.i18n.localize("HYP3E.attack.critMiss.hitSelfCrit");
            } else {
                content = game.i18n.localize("HYP3E.attack.critMiss.hitSelf");
            }
        }  else {
            content = "Critical Miss -- Error in getting result";
        }
    }

    const templateData = {
        title: game.i18n.localize(`HYP3E.attack.critMiss.${charType}`),
        content: content,
        diceRoll: await roll.render()
    };
    const template = `${HYP3E.templatePath}/chat/crit-roll.hbs`;
    const html = await renderTemplate(template, templateData);

    const actor = game.actors.get(actorId) ? game.actors.get(actorId) : null
    if (!actor) {
        console.log(`Roll Crit Hit: Actor ${actorId} not found!`)
    }

    // Send to chat
    roll.toMessage({
        author: game.user_id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        roll: roll,
        content: html
    })
    
}