import { Hyp3eLogger } from "./logger.mjs";

/**
 * This module contains utility functions for querying and manipulating tokens.
 */

/**
 * Given an array of numbered tokens on the canvas, find the next available number to assign
 * @param {*} matchingTokens 
 * @returns 
 */
export function getAvailableTokenNumber(matchingTokens) {
    // Get a sorted array of numbers being used by the array of tokens
    const numbers = matchingTokens
        .map(t => {
            const match = t.name.match(/\((\d+)\)/);
            return match ? parseInt(match[1], 10) : null;
        })
        .sort((a, b) => a - b);
    // Now, iterate through the numeric array to find either a gap in sequence that we can fill, 
    //  or just the next available integer
    for (let i = 0; i < numbers.length; i++) {
        if (numbers[i] !== i + 1) {
            return i + 1;
        }
    }
    return numbers.length + 1;
}

/**
 * Get a token's actual or synthetic actor
 * @param {*} tokenOrId - The token object or ID to find the actor
 * @returns {Object|null} - Returns an Actor object if possible
 */
export function getTokenActor(tokenOrId) {
  const token = typeof tokenOrId === "string" ? canvas.tokens.get(tokenOrId) : tokenOrId;
  return token?.actor ?? null;
}

/**
 * Check if a token is in the current active combat.
 * @param {Token} token - The placeable Token object
 * @returns {boolean}
 */
export function isTokenInCombat(token) {
    const combat = game.combat;
    if (!combat) return false;

    return combat.combatants.some(c => c.tokenId === token.id);
}

/**
 * Optional: get the Combatant for a token
 * @param {Token} token
 * @returns {Combatant|null}
 */
export function getTokenCombatant(token) {
    const combat = game.combat;
    if (!combat) return null;

    return combat.combatants.find(c => c.tokenId === token.id) ?? null;
}

export async function overlayEquippedWeaponAndShield(token, tokenState) {
    // Remove old overlays
    if (token.weaponOverlay) {
        token.weaponOverlay.destroy({ children: true });
        token.weaponOverlay = null;
    }

    const actor = token.actor;
    if (!actor) return;

    // Only do the overlay if the token is in combat
    if (!isTokenInCombat(token)) return;

    // Get equipped weapons/shields
    const equippedWeapons = actor.items.filter(i =>
        i.type === "weapon" && i.system.equipped
    ).slice(0, 2); // up to two items
    const equippedShields = actor.items.filter(i =>
        (i.type === "shield" || (i.type === "armor" && i.system.type === "shield")) && i.system.equipped
    ).slice(0, 2); // up to two items... crazy, but allowable if no weapons are equipped

    // Neither weapons nor shield equipped, exit early...
    if (!equippedWeapons.length && !equippedShields.length) return;

    // If we have a shield, it takes precedence over a second weapon
    //  This should never happen, but just in case
    if (equippedShields.length) {
        if (equippedWeapons.length === 0) {
            // No weapons, so show the shield
            equippedWeapons.push(equippedShields[0]);
        } else if (equippedWeapons.length === 1) {
            // One weapon, so add the shield as second item
            equippedWeapons.push(equippedShields[0]);
        } else {
            // Two weapons, so replace the second weapon with the shield
            equippedWeapons[1] = equippedShields[0];
        }
    }

    // If we have more than two items now, truncate to two
    if (equippedWeapons.length > 2) {
        equippedWeapons.splice(2);
    }
    // Log the equipped weapon/shield, and token size
    Hyp3eLogger.info("overlayEquippedWeaponAndShield", `Actor ${actor.name} has equipped gear:`, equippedWeapons);
    Hyp3eLogger.info("overlayEquippedWeaponAndShield", `Actor ${actor.name} has token:`, token);

    // Create overlay container
    const container = new PIXI.Container();
    token.weaponOverlay = container;
    token.mesh.addChild(container);
    token.mesh.sortChildren();

    // Compute pixel dimensions of token
    const gridSize = canvas.grid.size;
    Hyp3eLogger.info("overlayEquippedWeaponAndShield", `Scene grid size ${gridSize}.`);
    // const tokenWidth = token.document.width * gridSize * token.scale.x;
    // const tokenHeight = token.document.height * gridSize * token.scale.y;
    // Hyp3eLogger.info("overlayEquippedWeaponAndShield", `Actor ${actor.name} has token size ${tokenWidth} x ${tokenHeight}.`);
    const tokenRenderWidth  = token.mesh.width;
    const tokenRenderHeight = token.mesh.height;
    Hyp3eLogger.info("overlayEquippedWeaponAndShield", `${actor.name} token rendered size ${tokenRenderWidth} x ${tokenRenderHeight}.`);
    const meshScaleX = token.mesh.scale.x;  // usually same for x and y
    const meshScaleY = token.mesh.scale.y;  // usually same for x and y
    Hyp3eLogger.info("overlayEquippedWeaponAndShield", `${actor.name} token mesh scale ${meshScaleX} x ${meshScaleY}.`);

    // Load and add sprites
    for (let [idx, item] of equippedWeapons.entries()) {
        try {
            const texture = await loadTexture(item.img);  // works with svg/webp/png/jpg
            const sprite = new PIXI.Sprite(texture);

            // Compute 1/3 of visible token width for sprite size
            const desiredSize = token.mesh.width / 3;

            // Compensate for internal mesh scaling
            const spriteSize = desiredSize / meshScaleX;

            // Set our sprite size and positioning offset
            sprite.width = sprite.height = spriteSize;
            const offset = 4   // Shift the sprites inward by this amount

            // Position weapon/shield icons
            if (item.type === "weapon") {
                if (idx === 0) {
                    // Primary weapon: bottom-left corner
                    sprite.anchor.set(0, 0); // Anchor to dead center of token
                    sprite.x = (-tokenRenderWidth / meshScaleX) / 2 + offset;
                    sprite.y = (tokenRenderHeight / meshScaleY) / 2 - spriteSize - offset;
                    Hyp3eLogger.info("overlayEquippedWeaponAndShield", `${item.name} sprite #1 (lower left):`, sprite);
                } else {
                    // Secondary weapon: bottom-right corner
                    sprite.anchor.set(0, 0); // Anchor to dead center of token
                    sprite.x = (tokenRenderWidth / meshScaleX) / 2 - spriteSize - offset;
                    sprite.y = (tokenRenderHeight / meshScaleY) / 2 - spriteSize - offset;
                    Hyp3eLogger.info("overlayEquippedWeaponAndShield", `${item.name} sprite #2 (lower right):`, sprite);
                }
            } else if (item.type === "shield" || (item.type === "armor" && item.system.type === "shield")) {
                // Shield: bottom-right corner
                sprite.anchor.set(0, 0); // Anchor to dead center of token
                sprite.x = (tokenRenderWidth / meshScaleX) / 2 - spriteSize - offset;
                sprite.y = (tokenRenderHeight / meshScaleY) / 2 - spriteSize - offset;
                Hyp3eLogger.info("overlayEquippedWeaponAndShield", `${item.name} sprite #2 (lower right):`, sprite);
            }

            sprite.alpha = 1.0;
            sprite.visible = true;

            container.addChild(sprite);
        } catch (err) {
            Hyp3eLogger.error("overlayEquippedWeaponAndShield", `Error loading image ${item.img} for item ${item.name}:`, err);
        }
    }
}