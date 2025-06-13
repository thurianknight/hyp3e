/**
 * Migrate Actor data to new formats, properties, etc.
 * @param {*} actor - Actor document to process for data migrations
 * @returns {Object} - JSON of update data
 */
export function migrateActorData(actor) {
    console.log(`migrateActorData: Original ${actor.name} to migrate:`, actor)
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
    if (!("tempHp" in actor.system.hp) || typeof actor.system.hp.tempHp == "object") {
        console.log(`Fixing temp HP for ${actor.name}...`);
        updates = { ...updates, "system.hp.tempHp": 0 };
    }
    // If tempAcMod is an object, convert it to zero
    if (!("tempAtkMod" in actor.system) || typeof actor.system?.tempAtkMod == "object") {
        console.log(`Fixing temp attack mod for ${actor.name}...`);
        updates = { ...updates, "system.tempAtkMod": 0 };
    }
    // If tempDmgMod is an object, convert it to zero
    if (!("tempDmgMod" in actor.system) || typeof actor.system?.tempDmgMod == "object") {
        console.log(`Fixing temp damage mod for ${actor.name}...`);
        updates = { ...updates, "system.tempDmgMod": 0 };
    }
    // If tempAcMod is an object, convert it to zero
    if (!("tempAcMod" in actor.system.ac) || typeof actor.system.ac?.tempAcMod == "object") {
        console.log(`Fixing temp AC mod for ${actor.name}...`);
        updates = { ...updates, "system.ac.tempAcMod": 0 };
    }
    // If tempDrMod is an object, convert it to zero
    if (!("tempDrMod" in actor.system.ac) || typeof actor.system.ac?.tempDrMod == "object") {
        console.log(`Fixing temp DR mod for ${actor.name}...`);
        updates = { ...updates, "system.ac.tempDrMod": 0 };
    }
    // Only migrate tempMvMod if we haven't already fixed this
    if (!("tempMvMod" in actor.system.movement) && "tempMvMod" in actor.system) {
        console.log(`fixTempMvMod: Fixing ${actor.name}...`);
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

    }

    // NPCs only
    if (actor.type === "npc") {
        // Add new default values

        // Migrate, fix, or delete old data

    }

    console.log(`migrateActorData: Updated data for ${actor.name}:`, updates)
    return updates;
}

/**
 * Migrate Item data to new formats, properties, etc.
 * @param {*} item - Item document to process for data migrations
 * @returns {Object} - JSON of update data
 */
export function migrateItemData(item) {
    console.log(`migrateItemData: Original ${item.name} to migrate:`, item)
    // let newItem = {...item};
    let updates = {};
    // All item types
    if (!("identified" in item.system)) {
        updates = { ...updates, "system.identified": true };
    }
    if (!("tokenAlias" in item.system)) {
        updates = { ...updates, "system.tokenAlias": "" };
    }
    if (!("realName" in item.system) || item.system.realName == "") {
        updates = { ...updates, "system.realName": item.name };
    }
    if (!("realDescription" in item.system) || item.system.realDescription == "") {
        updates = { ...updates, "system.realDescription": item.system.description };
    }

    // Armor only
    if (item.type === "armor") {
        updates = { ...updates, "system.equipped": true };
    }
    // Features only
    if (item.type === "feature") {

    }
    // General items only
    if (item.type === "item") {
        updates = { ...updates, "system.equipped": true };
    }
    // Spells only
    if (item.type === "spell") {

    }
    // Weapons only
    if (item.type === "weapon") {
        updates = { ...updates, "system.equipped": false };
        let friendlyName = fixFriendlyName(item);
        if (friendlyName) {
            updates = { ...updates, "system.friendlyName": friendlyName };
        }
    }

    console.log(`migrateItemData: Updated data for ${item.name}:`, updates)
    return updates;
}

/**
 * 
 * @param {*} actor - The Actor whose token prototype will be modified
 * @returns {Object} - JSON of update data
 */
export function fixTokenSize(actor) {
    // If actor size is Medium, convert prototype token size to 1
    if (actor.system.size == "M") {
        console.log(`Fixing token size for ${actor.name}...`)
        const update = {prototypeToken: {width: 1, height: 1, texture: {scaleX: 1, scaleY: 1}}}
        return update
    }
    // If actor size is Large, convert prototype token size to 2
    if (actor.system.size == "L") {
        console.log(`Fixing token size for ${actor.name}...`)
        const update = {prototypeToken: {width: 2, height: 2, texture: {scaleX: 1, scaleY: 1}}}
        return update
    }
    // If actor size is Huge, convert prototype token size to 3
    if (actor.system.size == "H") {
        console.log(`Fixing token size for ${actor.name}...`)
        const update = {prototypeToken: {width: 3, height: 3, texture: {scaleX: 1, scaleY: 1}}}
        return update
    }
    // If actor size is Small, convert prototype token scale to 0.5
    if (actor.system.size == "S") {
        console.log(`Fixing token size for ${actor.name}...`)
        const update = {prototypeToken: {width: 1, height: 1, texture: {scaleX: 0.5, scaleY: 0.5}}}
        return update
    }
    return null
}

/**
 * 
 * @param {*} item - Item whose friendly name will be fixed
 * @returns {Object} - JSON of update data
 */
export function fixFriendlyName(item) {
    const friendlyName = item.system.friendlyName;
    // Use a regex to replace (1h) or (2h) with null
    const output = friendlyName.replace(/\s?\((1h|2h)\)/g, "");
    return output;
}
