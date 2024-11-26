import { HYP3E } from "./config.mjs"

// hook listener for adding buttons to damage roll
// done here instead of inline to add listeners in js
export const addChatMessageButtons = async function(_msg, html, _data) {

    // Damage-roll button
    let dmgRoll = html.find(".dmg-roll-button");
    if (dmgRoll.length > 0) {
        dmgRoll.each((_i, b) => {
            console.log(`Damage html: `, b)
            const dmgFormula = $(b).data('formula');
            const sourceType = $(b).data('sourceType');
            const actorId = "15oRtA40Umri4k3L"
            let dmgButton = $(
                `<button class=""><i class="fas fa-dice" title="Click to roll damage."></i>Damage: ${dmgFormula}</button>`
            );
            dmgRoll.append(dmgButton);

            // Handle button clicks
            dmgRoll.on("click", (ev) => {
                ev.stopPropagation();
                rollDmgButton(dmgFormula, actorId, sourceType);
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
            let dieFormula =$(b).data('roll');
            let sourceType = $(b).data('sourceType');

            const fullDamageButton = $(
                `<button class="dice-total-fullDamage-btn chat-button-small"><i class="fas fa-user-minus" title="Click to apply full damage to selected token(s)."></i></button>`
            );
            const halfDamageButton = $(
                `<button class="dice-total-halfDamage-btn chat-button-small"><i class="fas fa-user-shield" title="Click to apply half damage to selected token(s)."></i></button>`
            );
            const fullHealingButton = $(
                `<button class="dice-total-fullHealing-btn chat-button-small"><i class="fas fa-user-plus" title="Click to apply full healing to selected token(s)."></i></button>`
            );        
            const fullDamageModifiedButton = $(
                `<button class="dice-total-fullDamageMod-btn chat-button-small"><i class="fas fa-user-edit" title="Click to apply full damage with modifier prompt to selected token(s)."></i></button>`
            );
            dmg.append(fullDamageButton);
            dmg.append(halfDamageButton);
            dmg.append(fullHealingButton);
            dmg.append(fullDamageModifiedButton);

            // Handle button clicks
            fullDamageButton.on("click", (ev) => {
                ev.stopPropagation();
                applyHealthDrop(total);
            });

            halfDamageButton.on("click", (ev) => {
                ev.stopPropagation();
                applyHealthDrop(Math.floor(total*0.5));
            });

            fullHealingButton.on("click", (ev) => {
                ev.stopPropagation();
                applyHealthDrop(total*-1);
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
                              applyHealthDrop(total + nModifier);
                            } else {
                              ui.notifications?.error(modifier + " is not a number");
                            }
                          }
                        }
                      }
                };
                if (sourceType === "weapon") {
                    if (CONFIG.HYP3E.debugMessages) { console.log("Adding 2x/3x button for weapon") }
                    buttons["two"] = {
                        icon: "<i class='fas fa-check'></i>",
                        label: `2x Dice Dmg (roll only)`,
                        callback: () => applyHealthDrop(total, dieFormula)
                    };
                    buttons["three"] = {
                        icon: "<i class='fas fa-check'></i>",
                        label: `3x Dice Dmg (roll only)`,
                        callback: () => applyHealthDrop(total, `${dieFormula}+${dieFormula}`)
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

    // "longer" button style for crit miss/hit
    const long_button = (critType, charType, icon) => `<button class=""><i class="fas ${icon}" title="Click to roll critical ${critType} to selected token(s)."></i>${charType}</button>`;

    let critMiss = html.find(".critical-miss");
    if (critMiss.length > 0) {
        critMiss.each((_i, b) => {
            baseClass = $(b).data('baseClass');
            if (baseClass != "npc") {
                baseClassLabel = baseClass.charAt(0).toUpperCase()+baseClass.substring(1)
            } else {
                baseClassLabel = "NPC"
            }
            const icon = "fa-user-slash";

            // const critMissButtonFighter = $(long_button('miss','Fighter', icon));
            // const critMissButtonMage = $(long_button('miss','Magician', icon));
            // const critMissButtonOther = $(long_button('miss','Cleric/Thief/Monster', icon));
            const critMissButton = $(long_button('miss',`Roll Critical Miss for ${baseClassLabel}-class`, icon));

            // critMiss.append(critMissButtonFighter);
            // critMiss.append(critMissButtonMage);
            // critMiss.append(critMissButtonOther);
            critMiss.append(critMissButton);

            // critMissButtonFighter.on("click", (ev) => {
            //     ev.stopPropagation();
            //     rollCritMiss("fighter");
            // });
            // critMissButtonMage.on("click", (ev) => {
            //     ev.stopPropagation();
            //     rollCritMiss("magician");
            // });
            // critMissButtonOther.on("click", (ev) => {
            //     ev.stopPropagation();
            //     rollCritMiss("other");
            // });
            critMissButton.on("click", (ev) => {
                ev.stopPropagation();
                rollCritMiss(baseClass);
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
            const icon = "fa-user";

            // const critHitButtonFighter = $(long_button('hit','Fighter', icon));
            // const critHitButtonMage = $(long_button('hit','Magician', icon));
            // const critHitButtonOther = $(long_button('hit','Cleric/Thief/Monster', icon));
            const critHitButton = $(long_button('hit',`Roll Critical Hit for ${baseClassLabel}-class`, icon));

            // critHit.append(critHitButtonFighter);
            // critHit.append(critHitButtonMage);
            // critHit.append(critHitButtonOther);
            critHit.append(critHitButton);

            // critHitButtonFighter.on("click", (ev) => {
            //     ev.stopPropagation();
            //     rollCritHit("fighter");
            // });
            // critHitButtonMage.on("click", (ev) => {
            //     ev.stopPropagation();
            //     rollCritHit("magician");
            // });
            // critHitButtonOther.on("click", (ev) => {
            //     ev.stopPropagation();
            //     rollCritHit("other");
            // });
            critHitButton.on("click", (ev) => {
                ev.stopPropagation();
                rollCritHit(baseClass);
            });
        });
    }

    // Saving throw button
    let save = html.find(".save-button");
    if (save.length > 0) {
        save.each((_i, b) => {
            let saveType = $(b).data('save');
            let saveButton = $(
                `<button class=""><i class="fas fa-dice-d20" title="Click to roll save to selected token(s)."></i>Save: ${saveType}</button>`
            );
            save.append(saveButton);

            // Handle button clicks
            save.on("click", (ev) => {
                ev.stopPropagation();
                rollSaveButton(saveType);
            });
        });
    }
}

// Show a change in value by a token
export async function showValueChange(t, fillColor,total) {
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

async function rollDmgButton(formula, actorId, sourceType) {
    if (formula == "") { return } // Exit on empty formula

    if (CONFIG.HYP3E.debugMessages) { console.log(`Damage roll formula: ${formula}`) }
    // Invoke the damage roll
    let dmgRoll = new Roll(formula);
    if (CONFIG.HYP3E.debugMessages) { console.log(`Damage roll object: `, dmgRoll) }
    // Resolve the roll
    await dmgRoll.roll()

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
        debugDmgRollFormula: formula,
        naturalDmgRoll: naturalDmgRoll,
        dmgBaseRoll: formula,
        sourceType: sourceType
    };

    const template = `${HYP3E.systemRoot}/templates/chat/damage-roll.hbs`;
    const html = await renderTemplate(template, templateData);

    // const chatData = {
    //     user: game.user_id,
    //     speaker: ChatMessage.getSpeaker({ actor: actorId }),
    //     content: html
    // };
    // ChatMessage.create(chatData, {});

    // Send to chat
    dmgRoll.toMessage({
        user: game.user_id,
        speaker: ChatMessage.getSpeaker({ actor: actorId }),
        content: html
    })

}

async function rollSaveButton(saveType) {
    if (saveType == "") return; // Skip empty save
    const tokens = canvas?.tokens?.controlled;

    if (!tokens || tokens.length == 0) {
        ui.notifications?.error("Please select at least one token");
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

// Apply a health drop (positive number is damage) to one or more tokens.
async function applyHealthDrop(total, extraRoll = "") {
    if (extraRoll != "") {
        const roll = await new Roll(extraRoll).roll();
        if (total => 0) {
            total += roll.total;
        } else {
            total -= roll.total;
        }
        // For showing the roll
        extraRoll = await roll.render();
        console.log("Extra roll result: ", extraRoll)
    }

    if (total == 0) return; // Skip changes of 0
    const tokens = canvas?.tokens?.controlled;

    if (!tokens || tokens.length == 0) {
        ui.notifications?.error("Please select at least one token");
        return;
    }

    const names = [];
    
    for (const t of tokens) {
        const actor = t.actor;
        let isDefeated = false;
        let isUnconscious = false;
        //Update Health
        const oldHealth = actor.system.hp.value;
        // consider dr
        let damage_mod = total;
        // If applying damage check dr
        if (total > 0 && actor.system.ac.dr > 0) {
            damage_mod = Math.max(0, total - actor.system.ac.dr);
            names.push(`${t.name} (dr ${actor.system.ac.dr} applied)`)
        } else {
            names.push(t.name);
        }
        
        if (damage_mod == 0) continue;

        // find updated health
        let newHealth = oldHealth - damage_mod;
        if (newHealth <  actor.system.hp.min) {
            newHealth = actor.system.hp.min;
        } else if (newHealth > actor.system.hp.max) {
            newHealth = actor.system.hp.max;
        }
        await actor.update({ "system.hp.value": newHealth });

        // Show the health change by the token
        // Taken from Mana
        //https://gitlab.com/mkahvi/fvtt-micro-modules/-/blob/master/pf1-floating-health/floating-health.mjs#L182-194
        const fillColor = damage_mod < 0 ? "0x00FF00" : "0xFF0000";
        showValueChange(t, fillColor, damage_mod);

        // Change token status 
        if (newHealth <= 0) {
            if (actor.type == "character") {
                if (newHealth <= 10) {
                    isDefeated = true;
                    isUnconscious = false;
                } else {
                    //TODO (wsAI) split defeated and isUnconscious
                    isDefeated = true;
                    isUnconscious = true;
                }
            } else if (actor.type == "npc") {
                isDefeated = true;
                isUnconscious = false;
            }
        } else if (oldHealth <= 0) {
        // token was at <=0 and now is not
            isDefeated = false;
            isUnconscious = false;
        } else {
        // we can return no status to update
            continue;
        }
        await t.combatant?.update({ defeated: isDefeated, unconscious: isUnconscious });
        const defeated_status = CONFIG.statusEffects.find(
            (e) => e.id === CONFIG.specialStatusEffects.DEFEATED
        );
        const unconscious_status = CONFIG.statusEffects.find(
            (e) => e.id === CONFIG.specialStatusEffects.UNconscious
        );
        if (!defeated_status && !isUnconscious) continue;
        let effect = actor && defeated_status ? defeated_status : CONFIG.controlIcons.defeated;
        if (t.object) {
            await t.object.toggleEffect(effect, {
                overlay: true,
                active: isDefeated,
            });
        } else {
            await t.toggleEffect(effect, {
                overlay: true,
                active: isDefeated,
            });
        }
        // TODO(wsAI) figure out how to show effect properly
        // effect = actor && defeated_status ? defeated_status : CONFIG.controlIcons.unconscious;
        // if (t.object) {
        //     await t.object.toggleEffect(effect, {
        //         overlay: true,
        //         active: isUnconscious,
        //     });
        // } else {
        //     await t.toggleEffect(effect, {
        //         overlay: true,
        //         active: isUnconscious,
        //     });
        // }
    }
    let body = "";
    if (extraRoll != "") {
        extraRoll = `<p>Extra damage roll: ${extraRoll}</p>`;
    }
    body += `<ul><li>${names
        // .map((t) => t.name)
        .join("</li><li>")}</li></ul>`;


    // Log health hit as a chat message
    const title = total > 0
        ? `Applied ${total} damage to...`
        : `Applied ${total*-1} healing to...`;
    const templateData = {
        extraRoll: extraRoll,
        title: title,
        body: body,
        // image: image
    };

    const template = `${HYP3E.systemRoot}/templates/chat/apply-damage.hbs`;
    const html = await renderTemplate(template, templateData);

    const chatData = {
        user: game.user_id,
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

async function rollCritHit(charType) {
    let content = "";
    const dmg = game.i18n.localize("HYP3E.headers.damage");
    let roll = await new Roll("1d6").roll();
    if (charType === "fighter") {
        if (roll.total <= 2) {
            content = `<h4 class="dice-damage">+2 ${dmg}</h4>`;
        } else if (roll.total <= 4) {
            content = `<h4 class="dice-damage">x2 Dice ${dmg}</h4>`;
        } else if (roll.total <= 6) {
            content = `<h4 class="dice-damage">x3 Dice ${dmg}</h4>`;
        }  else {
            content = "Critical Hit -- Error in getting result";
        }
    } else if (charType === "magician") {
        if (roll.total <= 2) {
            content = `<h4 class="dice-damage">+1 ${dmg}</h4>`;
        } else if (roll.total <= 4) {
            content = `<h4 class="dice-damage">+2 ${dmg}</h4>`;
        } else if (roll.total <= 6) {
            content = `<h4 class="dice-damage">x2 Dice ${dmg}</h4>`;
        }  else {
            content = "Critical Hit -- Error in getting result";
        }
    } else {
        // cleric/thief/npc-monster
        if (roll.total <= 1) {
            content = `<h4 class="dice-damage">+1 ${dmg}</h4>`;
        } else if (roll.total <= 3) {
            content = `<h4 class="dice-damage">+2 ${dmg}</h4>`;
        } else if (roll.total <= 5) {
            content = `<h4 class="dice-damage">x2 Dice ${dmg}</h4>`;
        }  else if (roll.total <= 6) {
            content = `<h4 class="dice-damage">x3 Dice ${dmg}</h4>`;
        }  else {
            content = "Critical Hit -- Error in getting result";
        }
    }
    const templateData = {
        title: game.i18n.localize(`HYP3E.attack.critHit.${charType}`),
        content: content,
        diceRoll: await roll.render()
    };

    const template = `${HYP3E.systemRoot}/templates/chat/crit-roll.hbs`;
    const html = await renderTemplate(template, templateData);

    // const chatData = {
    //     speaker: ChatMessage.getSpeaker(),
    //     roll: JSON.stringify(roll),
    //     content: html,
    //     type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    // };
    // getDocumentClass("ChatMessage").create(chatData);

    // Send to chat
    roll.toMessage({
        user: game.user_id,
        speaker: ChatMessage.getSpeaker(),
        roll: roll,
        content: html
    })
    
}

async function rollCritMiss(charType) {
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

    const template = `${HYP3E.systemRoot}/templates/chat/crit-roll.hbs`;
    const html = await renderTemplate(template, templateData);

    // const chatData = {
    //     speaker: ChatMessage.getSpeaker(),
    //     roll: JSON.stringify(roll),
    //     content: html,
    //     type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    // };
    // getDocumentClass("ChatMessage").create(chatData);

    // Send to chat
    roll.toMessage({
        user: game.user_id,
        speaker: ChatMessage.getSpeaker(),
        roll: roll,
        content: html
    })
    
}