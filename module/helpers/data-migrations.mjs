import { Hyp3eLogger } from "./logger.mjs";

/**
 * Migrate Actor data to new formats, properties, etc.
 * @param {*} actor - Actor document to process for data migrations
 * @returns {Object} - JSON of update data
 */
export function migrateActorData(actor) {
    Hyp3eLogger.info("migrateActorData", `Original ${actor.name} to migrate:`, actor)
    // let newActor = {...actor};
    let updates = {};
    // Add new default values
    if (!("identified" in actor.system)) {
        updates = { ...updates, "system.identified": true };
    }
    if (!("tokenAlias" in actor.system)) {
        updates = { ...updates, "system.tokenAlias": "" };
    }
    // Migrate, fix, or delete old data
    if (!("tempHp" in actor.system.hp) || typeof actor.system.hp.tempHp === "object") {
        Hyp3eLogger.info("migrateActorData", `Fixing temp HP for ${actor.name}...`);
        updates = { ...updates, "system.hp.tempHp": 0 };
    }
    // If tempAcMod is an object, convert it to zero
    if (!("tempAtkMod" in actor.system) || typeof actor.system?.tempAtkMod === "object") {
        Hyp3eLogger.info("migrateActorData", `Fixing temp attack mod for ${actor.name}...`);
        updates = { ...updates, "system.tempAtkMod": 0 };
    }
    // If tempDmgMod is an object, convert it to zero
    if (!("tempDmgMod" in actor.system) || typeof actor.system?.tempDmgMod === "object") {
        Hyp3eLogger.info("migrateActorData", `Fixing temp damage mod for ${actor.name}...`);
        updates = { ...updates, "system.tempDmgMod": 0 };
    }
    // If tempAcMod is an object, convert it to zero
    if (!("tempAcMod" in actor.system.ac) || typeof actor.system.ac?.tempAcMod === "object") {
        Hyp3eLogger.info("migrateActorData", `Fixing temp AC mod for ${actor.name}...`);
        updates = { ...updates, "system.ac.tempAcMod": 0 };
    }
    // If tempDrMod is an object, convert it to zero
    if (!("tempDrMod" in actor.system.ac) || typeof actor.system.ac?.tempDrMod === "object") {
        Hyp3eLogger.info("migrateActorData", `Fixing temp DR mod for ${actor.name}...`);
        updates = { ...updates, "system.ac.tempDrMod": 0 };
    }
    // Only migrate tempMvMod if we haven't already fixed this
    if (!("tempMvMod" in actor.system.movement) && "tempMvMod" in actor.system) {
        Hyp3eLogger.info("migrateActorData", `Fixing temp MV mod for ${actor.name}...`);
        // Migrate tempMvMod from system.* to system.movement.* in the actor template
        let tempMvUpdate = {}
        if (actor.system?.tempMvMod && !("tempMvMod" in actor.system.movement)) {
            // Reassign tempMvMod to the new property and delete the original
            tempMvUpdate = {
                "system.movement.tempMvMod": actor.system.tempMvMod,
                "system.-=tempMvMod": null
            };
        } else if (actor.system?.tempMvMod && actor.system.movement?.tempMvMod) {
            // Both exist? Only delete the original
            tempMvUpdate = { "system.-=tempMvMod": null };
        } else {
            // Only assign the new property
            tempMvUpdate = { "system.movement.tempMvMod": 0 };
        }
        updates = { ...updates, tempMvUpdate };
    }

    // PCs only
    if (actor.type === "character") {
        // Add new default values

        // Migrate, fix, or delete old data
        if ("explorationSkills" in actor.system) {
            updates = { ...updates, "system.-=explorationSkills": null };
        }
        // Alignment is under system instead of system.details
        if (!actor.system.alignment && actor.system.details.alignment) {
            Hyp3eLogger.info("migrateActorData", `Fixing alignment for ${actor.name}...`);
            const fixAlignment = { "system.alignment": actor.system.details.alignment }
            updates = { ...updates, fixAlignment };
        }

    }

    // NPCs only
    if (actor.type === "npc") {
        // Add new default values

        // Migrate, fix, or delete old data

    }

    Hyp3eLogger.info("migrateActorData", `Updated data for ${actor.name}:`, updates)
    return updates;
}

/**
 * Migrate Item data to new formats, properties, etc.
 * @param {*} item - Item document to process for data migrations
 * @returns {Object} - JSON of update data
 */
export function migrateItemData(item) {
    Hyp3eLogger.info("migrateItemData", `Original ${item.name} to migrate:`, item)
    // let newItem = {...item};
    let updates = {};

    // Is the item a known light source?
    const lightSourceUpdates = (lightSourceProps) => ({
        "system.isLightSource": true,
        "system.light.dim": lightSourceProps.radius,
        "system.light.bright": Math.floor(lightSourceProps.radius / 2),
        "system.light.angle": lightSourceProps.angle || 360,
    });

    // All items, regardless of type
    if (!("identified" in item.system)) {
        Hyp3eLogger.info("migrateActorData", `Fixing "identified" flag for ${item.name}...`);
        updates = { ...updates, "system.identified": true };
    }
    if (!("tokenAlias" in item.system)) {
        Hyp3eLogger.info("migrateActorData", `Fixing token alias for ${item.name}...`);
        updates = { ...updates, "system.tokenAlias": "" };
    }
    if (!("realName" in item.system) || item.system.realName == "") {
        Hyp3eLogger.info("migrateActorData", `Fixing real name for ${item.name}...`);
        updates = { ...updates, "system.realName": item.name };
    }
    if (!("realDescription" in item.system) || item.system.realDescription == "") {
        Hyp3eLogger.info("migrateActorData", `Fixing real description for ${item.name}...`);
        updates = { ...updates, "system.realDescription": item.system.description };
    }

    // Armor only
    if (item.type === "armor") {
        // Convert legacy shield to new type
        const shieldUpdate = migrateShield(item);
        if (shieldUpdate) {
            Hyp3eLogger.info("migrateActorData", `Migrating ${item.name} from armor to shield...`);
            updates = { ...updates, ...shieldUpdate };
        }
        // On actual armor, replace default shield icon with new breastplate icon
        if (item.system.type !== "shield") {
            Hyp3eLogger.info("migrateActorData", `Fixing armor icon for ${item.name}...`);
            const defaultIcon = "icons/svg/shield.svg"
            const newIcon = "systems/hyp3e/assets/breastplate_wht.svg"
            if (item.img === defaultIcon) {
                updates = { ...updates, "img": newIcon };
            }
        }
    }

    // Features only
    if (item.type === "feature") {

    }

    // General items only
    if (item.type === "item") {
        // Add the new light source properties if they do not exist yet
        if (item.system.isLightSource === undefined || item.system.isLightSource === null) {
            Hyp3eLogger.info("migrateActorData", `Fixing light source properties for ${item.name}...`);
            const lightSourceProps = item._getLightSourceProperties();
            if (lightSourceProps) {
                const lightProps = lightSourceUpdates(lightSourceProps);
                updates = { ...updates, ...lightProps };
            } else {
                // If the item not a known light source, set it to false
                updates = { ...updates, "system.isLightSource": false };
            }
        }
    }

    // Spells only
    if (item.type === "spell") {

    }

    // Weapons only
    if (item.type === "weapon") {
        const friendlyName = fixFriendlyName(item);
        if (friendlyName) {
            updates = { ...updates, "system.friendlyName": friendlyName };
        }
        const handsUpdate = migrateWeaponHands(item);
        if (handsUpdate) {
            Hyp3eLogger.info("migrateItemData", `Updated weapon hands for ${item.name}:`, handsUpdate)
            updates = { ...updates, ...handsUpdate };
        }
    }

    Hyp3eLogger.info("migrateItemData", `Updated data for ${item.name}:`, updates)
    return updates;
}

/**
 * Migrate shield item data to new format
 * @param {*} item - Item document to process for data migration
 * @returns {Object|null} - JSON of update data
 */
export function migrateShield(item) {
    if (!(item.type === "armor" && item.system.type === "shield")) return null;

    let shieldType = "small"; // default
    const name = item.name.toLowerCase();

    if (["tower", "door", "large"].some(s => name.includes(s))) 
        shieldType = "large";

    if (["ring", "cloak", "boots", "helm", "scarab", "amulet"].some(s => name.includes(s))) 
        shieldType = "passive";

    const systemData = foundry.utils.duplicate(item.system);
    const update = {
        type: "shield",
        system: { ...systemData, type: shieldType }
    }
    return update;
}

/**
 * Determine if a weapon is one-handed or two-handed
 * Returns an update object if a change is needed, otherwise null
 * @param {*} item - Item document to process for data migration
 * @returns {Object|null} - JSON of update data or null if no change needed
 */
export function migrateWeaponHands(item) {
    if (item.type !== "weapon") return null;

    let hands = 1; // default
    const name = item.name.toLowerCase();

    if (["two-handed", "2h", "great", "halberd", "pike", "staff", "bow", "sling", "gun"].some(w => name.includes(w)) ||
        (Array.isArray(item.system.annotations) &&
            item.system.annotations.some(a => a.toLowerCase().includes("true2hand")))
    ) { hands = 2; }

    // Only return an update if the hands property differs
    if (item.system.hands !== hands) {
        return { "system.hands": hands };
    }

    return null;
}

/**
 * 
 * @param {*} actor - The Actor whose token prototype will be modified
 * @returns {Object} - JSON of update data
 */
export function fixTokenSize(actor) {
    // If actor size is Medium, convert prototype token size to 1
    if (actor.system.size == "M") {
        Hyp3eLogger.info("fixTokenSize", `Fixing token size for ${actor.name}...`)
        const update = {prototypeToken: {width: 1, height: 1, texture: {scaleX: 1, scaleY: 1}}}
        return update
    }
    // If actor size is Large, convert prototype token size to 2
    if (actor.system.size == "L") {
        Hyp3eLogger.info("fixTokenSize", `Fixing token size for ${actor.name}...`)
        const update = {prototypeToken: {width: 2, height: 2, texture: {scaleX: 1, scaleY: 1}}}
        return update
    }
    // If actor size is Huge, convert prototype token size to 3
    if (actor.system.size == "H") {
        Hyp3eLogger.info("fixTokenSize", `Fixing token size for ${actor.name}...`)
        const update = {prototypeToken: {width: 3, height: 3, texture: {scaleX: 1, scaleY: 1}}}
        return update
    }
    // If actor size is Small, convert prototype token scale to 0.5
    if (actor.system.size == "S") {
        Hyp3eLogger.info("fixTokenSize", `Fixing token size for ${actor.name}...`)
        const update = {prototypeToken: {width: 1, height: 1, texture: {scaleX: 0.5, scaleY: 0.5}}}
        return update
    }
    return null
}

/**
 * Remove 1H or 2H from weapon names
 * @param {*} item - Item whose friendly name will be fixed
 * @returns {Object} - JSON of update data
 */
export function fixFriendlyName(item) {
    const friendlyName = item.system.friendlyName;
    // Use a regex to replace (1h) or (2h) with null
    const output = friendlyName.replace(/\s?\((1h|2h)\)/g, "");
    return output;
}
