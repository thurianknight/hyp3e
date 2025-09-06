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

export async function overlayEquippedWeaponAndShield(token, tokenState) {
    // Remove old overlays
    if (token.weaponOverlay) {
        token.weaponOverlay.destroy({ children: true });
        token.weaponOverlay = null;
    }

    const actor = token.actor;
    if (!actor) return;
    // if (CONFIG.HYP3E.debugMessages) { console.log("overlayEquippedWeaponAndShield: Processing token:", token) }

    // Get equipped weapons/shields
    const equippedWeapons = actor.items.filter(i =>
        i.type === "weapon" && i.system.equipped
    ).slice(0, 2); // up to two items
    const equippedShields = actor.items.filter(i =>
        i.type === "armor" && i.system.type === "shield" && i.system.equipped
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
    // Finally, flip the order of items so that the first item will appear on top
    equippedWeapons.reverse();
    // if (CONFIG.HYP3E.debugMessages) { console.log("overlayEquippedWeaponAndShield: Equipped gear: ", equippedWeapons) }

    // Create overlay container
    const container = new PIXI.Container();
    token.weaponOverlay = container;
    token.mesh.addChild(container);
    container.zIndex = 9999;
    token.mesh.sortChildren();
    // Default grid/token size seems to be 64, but the math works out to 128 px
    const DEFAULT_TOKEN_SIZE = canvas.grid.size * 2;

    // Load and add sprites
    for (let [idx, item] of equippedWeapons.entries()) {
        try {
            const texture = await loadTexture(item.img);  // works with svg/webp/png/jpg
            const sprite = new PIXI.Sprite(texture);

            const size = Math.max(token.w / 2, 80); // Max 80 px or about 1/3 token width
            sprite.width = sprite.height = size;

            sprite.x = (idx * (size * 0.4)) - DEFAULT_TOKEN_SIZE;  // horizontal offset 40%
            sprite.y = token.h - size - (idx * (size * 0.2)) + (DEFAULT_TOKEN_SIZE - token.h);

            sprite.alpha = 1.0;
            sprite.visible = true;

            container.addChild(sprite);
        } catch (err) {
            console.error("overlayEquippedWeaponAndShield: Error loading texture for item", item.name, item.img, err);
        }
    }
    if (CONFIG.HYP3E.debugMessages) { console.log(`overlayEquippedWeaponAndShield: Weapon overlay added for ${token.name}:`, token, equippedWeapons.map(i => i.name)); }
}