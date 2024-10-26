import { HYP3E } from "./config.mjs"

// hook listener for adding buttons to damage roll
// done here instead of inline to add listeners in js
export const addChatMessageButtons = async function(_msg, html, _data) {
    let dmg = html.find(".damage-button");
    if (dmg.length > 0) {
        dmg.each((_i, b) => {
            let total = Number($(b).data('total'));
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
                new Dialog({
                  title: "Apply Modifier to Damage",
                  content: `
                      <form>
                        <div class="form-group">
                          <label>Modifier to damage (${total}) </label>
                          <input type='text' name='inputField'></input>
                        </div>
                      </form>`,
                  buttons: {
                    yes: {
                      icon: "<i class='fas fa-check'></i>",
                      label: `Apply`,
                    },
                  },
                  default: "yes",
                  close: (html) => {
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
                  },
                }).render(true);
              });

        });
    }

    let critMiss = html.find(".critical-miss");
    if (critMiss.length > 0) {
        critMiss.each((_i, b) => {
            const critMissFighterButton = $(
                `<button class=""><i class="fas fa-user-slash" title="Click to roll critical miss to selected token(s)."></i>Fighter</button>`
            );
            const critMissButtonMage = $(
                `<button class=""><i class="fas fa-user-slash" title="Click to roll critical miss to selected token(s)."></i>Mage</button>`
            );
            const critMissButtonOther = $(
                `<button class=""><i class="fas fa-user-slash" title="Click to roll critical miss to selected token(s)."></i>Cleric/Thief/Monster</button>`
            );
            critMiss.append(critMissFighterButton);
            critMiss.append(critMissButtonMage);
            critMiss.append(critMissButtonOther);

            critMissFighterButton.on("click", (ev) => {
                ev.stopPropagation();
                rollCritMiss("fighter");
            });
            critMissButtonMage.on("click", (ev) => {
                ev.stopPropagation();
                rollCritMiss("mage");
            });
            critMissButtonOther.on("click", (ev) => {
                ev.stopPropagation();
                rollCritMiss("other");
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
  
// Apply a health drop (positive number is damage) to one or more tokens.
async function applyHealthDrop(total) {
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
        const newHealth = oldHealth - damage_mod;
        if (newHealth <  actor.system.hp.min) {
            newHealth = actor.system.hp.min;
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
    // Log health hit as a chat message
    const title = total > 0
        ? `Applied ${total} damage`
        : `Applied ${total*-1} healing`;
    const templateData = {
        title: title,
        body: `<ul><li>${names
            // .map((t) => t.name)
            .join("</li><li>")}</li></ul>`,
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
    let directionRoll = await new Roll("1d6").roll();
    let direction = "forward";
    if (directionRoll.total == 4){
        direction = "left";
    } else if (directionRoll.total == 5) {
        direction = "right";
    } else if (directionRoll.total == 6) {
        direction = "backward";
    }
    return (feetRoll.total, direction);
}

async function getCritMissHitCrit(charType) {
    let roll = await new Roll("1d8").roll();
    if (charType === "fighter" && roll.total == 1) {
        return true;
    } else if (charType === "mage" && roll.total <= 3) {
        return true;
    } else if (charType === "other" && roll.total <= 2) {
        return true;
    }
    return false;
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
            let feet, direction = getFeetAndDirectionCritMiss();
            content = game.i18n.localize(
                "HYP3E.attack.critMiss.droppedWeapon", 
                { feet: feet, direction: direction }
            );
        } else if (roll.total <= 9) {
            content = game.i18n.localize("HYP3E.attack.critMiss.stumble");
        } else if (roll.total <= 10) {
            content = game.i18n.localize("HYP3E.attack.critMiss.tripFall");
        } else if (roll.total <= 11) {
            if (getCritMissHitCrit(charType)) {
                content = game.i18n.localize("HYP3E.attack.critMiss.hitAllyCrit");
            } else {
                content = game.i18n.localize("HYP3E.attack.critMiss.hitAlly");
            }            
        } else if (roll.total == 12) {
            if (getCritMissHitCrit(charType)) {
                content = game.i18n.localize("HYP3E.attack.critMiss.hitSelfCrit");
            } else {
                content = game.i18n.localize("HYP3E.attack.critMiss.hitSelf");
            }
        }  else {
            content = "Critical Miss -- Error in getting result";
        }
    } else if (charType === "mage") {
        if (roll.total <= 2) {
            content = game.i18n.localize("HYP3E.attack.critMiss.badMiss");
        } else if (roll.total <= 4) {
            let feet, direction = getFeetAndDirectionCritMiss();
            content = game.i18n.localize(
                "HYP3E.attack.critMiss.droppedWeapon", 
                { feet: feet, direction: direction }
            );
        } else if (roll.total <= 6) {
            content = game.i18n.localize("HYP3E.attack.critMiss.stumble");
        } else if (roll.total <= 8) {
            content = game.i18n.localize("HYP3E.attack.critMiss.tripFall");
        } else if (roll.total <= 10) {
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
    } else {
        // cleric/thief/monster
        if (roll.total <= 4) {
            content = game.i18n.localize("HYP3E.attack.critMiss.badMiss");
        } else if (roll.total <= 6) {
            let feet, direction = getFeetAndDirectionCritMiss();
            content = game.i18n.localize(
                "HYP3E.attack.critMiss.droppedWeapon", 
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
    let _msg = await roll.toMessage({
        speaker: ChatMessage.getSpeaker(),
        flavor: `Critical Miss Roll for ${charType}`,
        content: content
    });
}