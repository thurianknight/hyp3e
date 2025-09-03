/**
 * Hyp3e Chat Message Handlers
 * Handle chat message buttons for critical hit and miss rolls.
 * David Sherman 2021-2024
 * @module chat/handlers/crit-handlers
 */
import { HYP3E } from "../../helpers/config.mjs"
import { applyHealthChange } from "./damage-handlers.mjs";

/**
 * 
 * @param {*} html - The chat message HTML
 * @returns {Boolean} - True if button was added, false if not
 */
export async function handleCritDamageButton(html) {
    // Apply critical damage button
    let critDmgElement = html.find(".crit-damage-button");
    if (critDmgElement.length === 0) return false;

    critDmgElement.each((_i, b) => {
        const total = Number($(b).data('total'));
        const damageType = $(b).data('damageType');
        const applyDr = $(b).data('applyDr');
        // let dieFormula =$(b).data('roll');
        const critDamageButton = $(
            `<button class="dice-total-critDamage-btn chat-button-crit" title="Click to apply ${total} damage to selected token(s).">Apply Damage <i class="fas fa-user-minus"></i></button>`
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
    const long_button = (critType, charType, icon) => `<button class="chat-btn-full-width" title="Click to roll critical ${critType} to selected token(s)."><i class="fas ${icon}"></i>${charType}</button>`;

    // Crit misses & hits are mutually exclusive so we can handle them both here
    let critMissElement = html.find(".critical-miss");
    let critHitElement = html.find(".critical-hit");
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
            const icon = "fa-user-slash";
            const critMissButton = $(long_button('miss',`Roll Critical Miss for ${baseClassLabel}-class`, icon));
            critMissElement.append(critMissButton);

            // Handle button clicks
            critMissButton.on("click", (ev) => {
                ev.stopPropagation();
                rollCritMiss(baseClass, actorId);
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
            const critHitButton = $(long_button('hit',`Roll Critical Hit for ${baseClassLabel}-class`, icon));
            critHitElement.append(critHitButton);

            // Handle button clicks
            critHitButton.on("click", (ev) => {
                ev.stopPropagation();
                rollCritHit(baseClass, actorId);
            });
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
            content = `<div class="dice-damage medium">+2 ${dmg}</div>`;
        } else if (roll.total <= 4) {
            content = `<div class="dice-damage medium">x2 Dice ${dmg}</div>`;
        } else if (roll.total <= 6) {
            content = `<div class="dice-damage medium">x3 Dice ${dmg}</div>`;
        }  else {
            content = "Critical Hit -- Error in getting result";
        }
    } else if (charType === "magician") {
        if (roll.total <= 2) {
            content = `<div class="dice-damage medium">+1 ${dmg}</div>`;
        } else if (roll.total <= 4) {
            content = `<div class="dice-damage medium">+2 ${dmg}</div>`;
        } else if (roll.total <= 6) {
            content = `<div class="dice-damage medium">x2 Dice ${dmg}</div>`;
        }  else {
            content = "Critical Hit -- Error in getting result";
        }
    } else {
        // cleric/thief/npc-monster
        if (roll.total <= 1) {
            content = `<div class="dice-damage medium">+1 ${dmg}</div>`;
        } else if (roll.total <= 3) {
            content = `<div class="dice-damage medium">+2 ${dmg}</div>`;
        } else if (roll.total <= 5) {
            content = `<div class="dice-damage medium">x2 Dice ${dmg}</div>`;
        }  else if (roll.total <= 6) {
            content = `<div class="dice-damage medium">x3 Dice ${dmg}</div>`;
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
        console.log(`Roll Crit Hit: Actor ${actorId} not found!`)
    }

    const flavor = `<div class="dice-damage medium">` + game.i18n.localize(`HYP3E.attack.critHit.${charType}`) + `</div>`
    // Send to chat
    roll.toMessage({
        author: game.user_id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        roll: roll,
        flavor: flavor,
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

    content = `<div class="dice-damage medium">` + content + `</div>`
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
        console.log(`Roll Crit Hit: Actor ${actorId} not found!`)
    }

    const flavor = `<div class="dice-damage medium">` + game.i18n.localize(`HYP3E.attack.critMiss.${charType}`) + `</div>`
    // Send to chat
    roll.toMessage({
        author: game.user_id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        roll: roll,
        flavor: flavor,
        content: html
    })
}

/**********************************************************
 * Critical Hit / Miss Supporting Functions
 **********************************************************/

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
