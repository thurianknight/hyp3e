import { Hyp3eLogger } from "./logger.mjs";
import { Hyp3eItem } from "../documents/item.mjs";

/**
 * Migrate Actor data to new formats, properties, etc.
 * @param {*} actor - Actor document to process for data migrations
 * @returns {Object} - JSON of update data
 */
export function migrateActorData(actor) {
    // Hyp3eLogger.info("migrateActorData", `Migrating data for ${actor.name}...:`, actor)
    // let newActor = {...actor};
    let updates = {};
    // Add new default values
    if (!("identified" in actor.system)) {
        Hyp3eLogger.info("migrateActorData", `Fixing "identified" flag for ${actor.name}...`);
        updates = { ...updates, "system.identified": true };
    }
    if (!("tokenAlias" in actor.system)) {
        Hyp3eLogger.info("migrateActorData", `Fixing token alias for ${actor.name}...`);
        updates = { ...updates, "system.tokenAlias": "" };
    }

    // Migrate, fix, or delete old data
    // If fightingAbility is missing, assume same issue for casting and turning, 
    //  and migrate all three from old properties
    if (actor.system.fightingAbility === undefined) {
      const stats = ["fa", "ca", "ta"];
      for (const stat of stats) {
        const current = foundry.utils.getProperty(actor, `system.${stat}`);
        let newStat = "";
        if (stat === "fa") newStat = "fightingAbility";
        if (stat === "ca") newStat = "castingAbility";
        if (stat === "ta") newStat = "turningAbility";
        // Transform old number/null to new object
        Hyp3eLogger.info("migrateActorData", `Setting system.${newStat} for ${actor.name}...`);
        let newValue;
        if (typeof current === "object" && current !== null && "value" in current) {
          newValue = current.value || null;
        } else if (typeof current === "number") {
          newValue = current;
        } else if (typeof current === "string") {
          const parsed = parseInt(current);
          newValue = isNaN(parsed) ? null : parsed;
        } else {
          newValue = null;
        }
        updates = { ...updates, [`system.${stat}`]: newValue, [`system.${newStat}`]: { value: newValue } };
      }
    }

    // If tempHp is an object, convert it to zero
    if (!("tempHp" in actor.system.hp) || typeof actor.system.hp.tempHp === "object") {
        Hyp3eLogger.info("migrateActorData", `Fixing temp HP for ${actor.name}...`);
        updates = { ...updates, "system.hp.tempHp": 0 };
    }
    // If tempAtkMod is an object, convert it to zero
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
            Hyp3eLogger.info("migrateActorData", `Removing old explorationSkills from ${actor.name}...`);
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

    if (Object.keys(updates).length > 0) { 
        Hyp3eLogger.info("migrateActorData", `Updated data for ${actor.name}:`, updates);
    }
    return updates;
}

/**
 * Migrate Item data to new formats, properties, etc.
 * @param {*} item - Item document to process for data migrations
 * @returns {Object} - JSON of update data
 */
export function migrateItemData(item) {
    // Hyp3eLogger.info("migrateItemData", `Original ${item.name} to migrate:`, item)
    // let newItem = {...item};
    let updates = {};

    // Is the item a known light source?
    const lightSourceUpdates = (lightSourceProps) => ({
        "system.isLightSource": true,
        "system.light.dim": lightSourceProps.radius,
        "system.light.bright": Math.floor(lightSourceProps.radius / 2),
        "system.light.angle": lightSourceProps.angle || 360,
        "system.light.color": lightSourceProps.color,
        "system.light.alpha": lightSourceProps.alpha
    });

    // Ensure quantities and weight are numbers
    const qtyAndWeightUpdates = (item) => ({
      "system.quantity.value": toNumber(item.system.quantity.value) || 1,
      "system.quantity.max": toNumber(item.system.quantity.max) || 1,
      "system.quantity.bundle": Number(item.system.quantity.bundle) || null,
      "system.weight": toNumber(item.system.weight) || 0
    });

    // All items, regardless of type
    if (item.system.identified === undefined) {
        Hyp3eLogger.info("migrateItemData", `Fixing "identified" flag for ${item.name}...`);
        updates = { ...updates, "system.identified": true };
    }
    if (item.system.itemAlias === undefined) {
        Hyp3eLogger.info("migrateItemData", `Fixing item alias for ${item.name}...`);
        updates = { ...updates, "system.itemAlias": "" };
    }
    if (item.system.realName === undefined || item.system.realName == "") {
        Hyp3eLogger.info("migrateItemData", `Fixing real name for ${item.name}...`);
        updates = { ...updates, "system.realName": item.name };
    }
    if (item.system.realDescription === undefined) {
        Hyp3eLogger.info("migrateItemData", `Fixing real description for ${item.name}...`);
        updates = { ...updates, "system.realDescription": item.system.description };
    }

    // Armor only
    if (item.type === "armor") {
        // Ensure quantities and weight are numbers
        if (isNaN(item.system.quantity.value) || isNaN(item.system.weight)) {
            updates = { ...updates, ...qtyAndWeightUpdates(item) };
        }
        // Convert legacy shield to new type
        const shieldUpdate = migrateShield(item);
        if (shieldUpdate) {
            Hyp3eLogger.info("migrateItemData", `Migrating ${item.name} from armor to shield...`);
            updates = { ...updates, ...shieldUpdate };
        }
        // On actual armor, replace default shield icon with new breastplate icon
        if (item.system.type !== "shield") {
            const defaultIcon = "icons/svg/shield.svg"
            const newIcon = "systems/hyp3e/assets/breastplate_wht.svg"
            if (item.img === defaultIcon) {
                Hyp3eLogger.info("migrateItemData", `Fixing armor icon for ${item.name}...`);
                updates = { ...updates, "img": newIcon };
            }
        }
    }

    // Shield only
    if (item.type === "shield") {
        // Ensure quantities and weight are numbers
        if (isNaN(item.system.quantity.value) || isNaN(item.system.weight)) {
            updates = { ...updates, ...qtyAndWeightUpdates(item) };
        }
    }

    // Features only
    if (item.type === "feature") {

    }

    // General/equipment items only
    if (item.type === "item") {
        // Ensure quantities and weight are numbers
        if (isNaN(item.system.quantity.value) || isNaN(item.system.weight)) {
            updates = { ...updates, ...qtyAndWeightUpdates(item) };
        }
        // Add the new light source properties if they do not exist yet
        if (item.system.isLightSource === undefined || item.system.isLightSource === null) {
            Hyp3eLogger.info("migrateItemData", `Fixing light source properties for ${item.name}...`);
            const lightSourceProps = Hyp3eItem.getLightSourceProperties(item.name);
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
        // Ensure quantities and weight are numbers
        if (isNaN(item.system.quantity.value) || isNaN(item.system.weight)) {
            updates = { ...updates, ...qtyAndWeightUpdates(item) };
        }
        // Set weapon hands property based on name or annotations
        const handsUpdate = migrateWeaponHands(item);
        if (handsUpdate) {
            Hyp3eLogger.info("migrateItemData", `Updated weapon hands for ${item.name}:`, handsUpdate)
            updates = { ...updates, ...handsUpdate };
        }
        // Fix weapon & spell missing or invalid damage type
        if (!item.system.dmgType || item.system.dmgType.trim() === "") {
            Hyp3eLogger.warn("migrateItemData", `No damage type set on ${item.name}. Setting to Basic...`)
            updates = { ...updates, "system.dmgType": "basic" };
        }
    }

    if (Object.keys(updates).length > 0) { 
        Hyp3eLogger.info("migrateItemData", `Updated data for ${item.name}:`, updates);
    }
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

export async function migrateItemEffects(item) {
  // Transform old saves from .value to .curr
  const saveKeys = [
    "system.saves.death.value",
    "system.saves.device.value",
    "system.saves.transformation.value",
    "system.saves.avoidance.value",
    "system.saves.sorcery.value"
  ];

  // This is returned to the caller if any changes were made
  const updates = [];

  if (item.effects.size === 0) return null;

  const effectUpdates = [];
  for (const effect of item.effects) {
    // Migrate v13 duration format to v14
    const majorVersion = Number(game.version?.split(".")[0] ?? game.data.version.split(".")[0]);
    if (majorVersion >= 14) {
      Hyp3eLogger.info("migrateItemEffects", `Migrating effect ${effect.name}:`, effect);
      const duration = effect.duration || {};
      const flags = effect.flags;
      let remainingRounds = null;
      if (effect.isTemporary) {
        if (duration.rounds || duration.turns) {
          duration.units = "rounds";
          duration.value = duration.rounds || duration.turns || 0;
          duration.expiry = "turnEnd";
          remainingRounds = duration.rounds || duration.turns || 0;
        } else {
          // Some effects may be partially migrated by the v14 upgrade, so we override them here
          if (duration.units == "turns") duration.units = "rounds";
          if (duration.expiry == "turnStart") duration.expiry = "turnEnd";
          remainingRounds = duration.value || 0;
        }
        await effect.setFlag("hyp3e", "remainingRounds", remainingRounds);
        effectUpdates.push({
          _id: effect.id,
          duration: duration,
          flags: flags
        });
      }
    }
  
  
    const effectChanges = effect?.changes || effect?.system.changes || [];
    const newChanges = effectChanges.map(change => {
      if (saveKeys.includes(change.key)) {
        // Replace .value with .curr
        const newKey = change.key.replace(/\.value$/, ".curr");
        if (newKey !== change.key) {
          return { ...change, key: newKey };
        }
      } else if (["system.fa.curr", "system.ca.curr", "system.ta.curr"].includes(change.key)) {
        // Replace .curr with nothing
        const newKey = change.key.replace(/\.curr$/, "");
        if (newKey !== change.key) {
          return { ...change, key: newKey };
        }
      }
      return change;
    });
    // Only queue update if something actually changed
    if (!foundry.utils.objectsEqual(newChanges, effectChanges)) {
      effectUpdates.push({
        _id: effect.id,
        changes: newChanges
      });
    }
  }

  if (effectUpdates.length > 0) {
    Hyp3eLogger.info("migrateItemEffects", `Migrating active effects configuration for ${item.name}:`, effectUpdates)
    updates.push({
      itemId: item.id,
      name: item.name,
      updatedEffects: effectUpdates.length
    });
    await item.updateEmbeddedDocuments("ActiveEffect", effectUpdates);
  }
  return updates;
}

/**
 * Take any valid number or numeric string and return a pure number
 * @param {*} value 
 * @returns {Number}
 */
export function toNumber(value) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // Remove commas, currency symbols, and trim spaces
    value = value.replace(/[^0-9.\-]/g, "");
  }
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}