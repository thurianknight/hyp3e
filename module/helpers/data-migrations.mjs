import { Hyp3eItem } from "../documents/item.mjs";
import { getClassTemplate } from "./folders-and-compendia.mjs"
import { Hyp3eLogger } from "./logger.mjs";

/**
 * Migrate Actor data to new formats, properties, etc.
 * @param {*} actor - Actor document to process for data migrations
 * @returns {Object} - JSON of update data
 */
export async function migrateActorData(actor, classTemplate = null) {
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

    // Ensure that physical-attribute class feat bonuses are valid
    if (classTemplate) {
      for (const [key, value] of Object.entries(classTemplate.system.featBonus || {})) {
        if (value !== null && value !== undefined && !isNaN(value)) {
          updates = { ...updates, [`system.attributes.${key}.classFeatBonus`]: value };
        }
      }
    }

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
        // Get the base class template info
        const classTemplate = await getClassTemplate(actor.system.details.class);

        // Add new default values

        // Set the attribute minimums in the actor
        const attributes = foundry.utils.deepClone(actor.system.attributes);
        for (let [k, v] of Object.entries(attributes)) {
          attributes[k].min = (classTemplate?.system?.attrReqs[k] ?? 3);
        };
        Hyp3eLogger.info("migrateActorData", `${actor.name} attribute minumums updated:`, attributes);
        updates = { ...updates, "system.attributes": attributes };

        // Migrate, fix, or delete old data

        // Migrate legacy weapon proficiencies, if it hasn't already been done
        if (actor.system.proficiencies.class !== "" && actor.system.weaponProficiencies.length == 0) {
          const newProficiencies = migrateProficiencies(actor, classTemplate);
          updates = { ...updates, "system.weaponProficiencies": newProficiencies };
          // Write a Proficiency Migration report for the actor
          await createProficiencyMigrationReport(actor, newProficiencies)
        }

        // Delete old explorationSkills
        if ("explorationSkills" in actor.system) {
            Hyp3eLogger.info("migrateActorData", `Removing old explorationSkills from ${actor.name}...`);
            updates = { ...updates, "system.-=explorationSkills": null };
        }
        // Alignment is under system instead of system.details
        //    (Only characters have a details property, but monsters also need alignment)
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
        // Ensure baseWeapon is populated
        if (!item.system.baseWeapon) {
          const match = findCanonicalWeapon(item.name);
          if (match) {
            updates = { ...updates, "system.baseWeapon": match };
          } else {
            Hyp3eLogger.info("migrateItemData", `No canonical match found for ${item.name}`);
          }
        }
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

export async function migrateActorEffects() {
  const majorVersion = Number(game.version?.split(".")[0] ?? game.data.version.split(".")[0]);
  if (majorVersion < 14) return;

  // Migrate v13 effects to v14
  let migratedCount = 0;
  let errorCount = 0;

  for (const actor of game.actors.contents) {
    Hyp3eLogger.info("migrateActorEffects", `Migrating effects on actor ${actor.name}`, actor.effects);

    for (const effect of actor.effects) {
      if (!effect.isTemporary) continue;
      Hyp3eLogger.info("migrateActorEffects", `Migrating effect ${effect.name}:`, effect);

      const updates = {};
      const duration = effect.duration || {};
      let remainingRounds = null;

      // Fix common migration breakage
      if (duration?.rounds || duration?.turns) {
        updates["duration.units"] = "rounds";
        updates["duration.expiry"] = "turnEnd";
        updates["duration.value"] = duration.rounds || duration.turns || 10;
        remainingRounds = duration.rounds || duration.turns || 10;
      } else {
        // Some effects may be partially migrated by the v14 upgrade, so we override them here
        if (!duration.units || duration.units == "turns") 
          updates["duration.units"] = "rounds";
        if (!duration.expiry || duration.expiry == "turnStart") 
          updates["duration.expiry"] = "turnEnd";
        remainingRounds = duration.value || 10;
      }
      if (duration.remaining === Infinity || duration.remaining == null || isNaN(duration.remaining)) {
        updates["duration.remaining"] = duration?.rounds || duration?.turns || duration?.value || 0;
      }

      if (Object.keys(updates).length > 0) {
        try {
          await effect.update(updates, { 
            diff: false, 
            render: false,
            noHook: true          // skip some hooks that can cause issues
          });
          await effect.setFlag("hyp3e", "remainingRounds", remainingRounds);
          migratedCount++;
          Hyp3eLogger.info("migrateActorEffects", `Migrated effect "${effect.name}" on ${actor.name}`);
        } catch (err) {
          errorCount++;
          Hyp3eLogger.info("migrateActorEffects", `Failed to migrate effect "${effect.name}" on ${actor.name}`, err);
          // Optional: delete the truly broken effect
          // await effect.delete();
        }
      }
    }
  }

  if (migratedCount > 0 || errorCount > 0) {
    Hyp3eLogger.info("migrateActorEffects", `v14 Actor-Effect Migration complete: ${migratedCount} fixed, ${errorCount} errors`);
  } else {
    Hyp3eLogger.info("migrateActorEffects", `v14 Actor-Effect Migration — nothing needed`);
  }
}

export async function migrateItemEffects(item) {
  if (item.effects.size === 0) return null;
  Hyp3eLogger.info("migrateItemEffects", `Migrating effects on item ${item.name}`, item.effects);

  // Migrate v13 effects to v14
  const updates = []; // Returned to the caller
  let migratedCount = 0;
  let errorCount = 0;

  const effectUpdates = {};
  for (const effect of item.effects) {
    // Migrate v13 duration format to v14
    let remainingRounds = null;
    const majorVersion = Number(game.version?.split(".")[0] ?? game.data.version.split(".")[0]);
    if (majorVersion >= 14) {
      const duration = effect.duration || {};
      const flags = effect.flags;
      if (effect.isTemporary) {
        if (duration?.rounds || duration?.turns) {
          Hyp3eLogger.info("migrateItemEffects", `Migrating effect ${effect.name} from v13:`, effect);
          effectUpdates["duration.units"] = "rounds";
          effectUpdates["duration.expiry"] = "turnEnd";
          effectUpdates["duration.value"] = duration.rounds || duration.turns || 10;
          remainingRounds = duration.rounds || duration.turns || 10;
        } else {
          // Some effects may be partially migrated by the v14 upgrade, so we override them here
          Hyp3eLogger.info("migrateItemEffects", `Fixing effect ${effect.name} in v14:`, effect);
          // if (!duration.units || duration.units == "turns") 
            effectUpdates["duration.units"] = "rounds";
          // if (!duration.expiry || duration.expiry == "turnStart") 
            effectUpdates["duration.expiry"] = "turnEnd";
          remainingRounds = duration.value || 10;
        }
        if (duration.remaining === Infinity || duration.remaining == null || isNaN(duration.remaining)) {
          effectUpdates["duration.remaining"] = duration?.rounds || duration?.turns || duration?.value || 0;
        }
      }
    }

    // Only queue update if something actually changed
    if (Object.keys(effectUpdates).length > 0) {
      try {
        await effect.update(effectUpdates, { 
          diff: false, 
          render: false,
          noHook: true          // skip some hooks that can cause issues
        });
        await effect.setFlag("hyp3e", "remainingRounds", remainingRounds);
        migratedCount++;
        Hyp3eLogger.info("migrateItemEffects", `Migrated effect "${effect.name}" on ${item.name}`);
      } catch (err) {
        errorCount++;
        Hyp3eLogger.info("migrateItemEffects", `Failed to migrate effect "${effect.name}" on ${item.name}`, err);
        // Optional: delete the truly broken effect
        // await effect.delete();
      }
    }
  }
  if (migratedCount > 0 || errorCount > 0) {
    Hyp3eLogger.info("migrateItemEffects", `v14 Item-Effect Migration complete: ${migratedCount} fixed, ${errorCount} errors`);
  } else {
    Hyp3eLogger.info("migrateItemEffects", `v14 Item-Effect Migration — nothing needed`);
  }
  if (migratedCount > 0) {
    updates.push({
      itemId: item.id,
      name: item.name,
      updatedEffects: migratedCount
    });
    // await item.updateEmbeddedDocuments("ActiveEffect", effectUpdates);
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

/**
 * Migrate custom class data to new classTemplate (Item document) format
 */
export async function migrateCustomClasses() {
  const classData = game.settings.get(game.system.id, "customClassData") || {};
  // Do we even have any classes to migrate?
  if (Object.keys(classData).length === 0) {
    Hyp3eLogger.info("migrateCustomClasses", "No custom classes found to migrate.");
    return;
  }
  // Clone the custom class data so we can delete migrated classes from it
  const allCustomClasses = foundry.utils.duplicate(game.settings.get(game.system.id, "customClassData"));

  // Check for Class Templates folder in world Items directory, create if needed
  let classTemplatesFolder = game.folders.find(f => f.name === "Class Templates" && f.type === "Item");
  if (!classTemplatesFolder) {
    classTemplatesFolder = await Folder.create({ name: "Class Templates", type: "Item", parent: null });
    Hyp3eLogger.info("setupSystem", "Created Class Templates folder in world Items directory.", classTemplatesFolder);
  }

  Hyp3eLogger.info("migrateCustomClasses", `Migrating ${Object.keys(classData).length} custom classes...`);
  const migratedClasses = {};
  for (const [className, classInfo] of Object.entries(classData)) {
    Hyp3eLogger.info("migrateCustomClasses", `Migrating class "${className}"...`, classInfo);

    // Reformat the class abilities into the new Item document structure
    let abilities = [];
    Hyp3eLogger.info("migrateCustomClasses", `Building abilities array for class "${className}"...`, classInfo.abilities);
    for (const [index, data] of Object.entries(classInfo.abilities || [])) {
      abilities.push({ "name": data["name"] });
    }

    // Reformat the armor, weapons, and all equipment types into the new Item document structure
    let armor = [];
    Hyp3eLogger.info("migrateCustomClasses", `Building armour array for class "${className}"...`, classInfo.startingPack?.armour);
    for (const [index, data] of Object.entries(classInfo.startingPack?.armour || [])) {
      armor.push({ "name": data["name"], "quantity": data["quantity"] });
    }
    let weapons = [];
    Hyp3eLogger.info("migrateCustomClasses", `Building weapons array for class "${className}"...`, classInfo.startingPack?.weapons);
    for (const [index, data] of Object.entries(classInfo.startingPack?.weapons || [])) {
      weapons.push({ "name": data["name"], "quantity": data["quantity"] });
    }
    let generalEquipment = [];
    Hyp3eLogger.info("migrateCustomClasses", `Building general equipment array for class "${className}"...`, classInfo.startingPack?.["equipment - general"]);
    for (const [index, data] of Object.entries(classInfo.startingPack?.["equipment - general"] || [])) {
      generalEquipment.push({ "name": data["name"], "quantity": data["quantity"] });
    }
    let provisions = [];
    Hyp3eLogger.info("migrateCustomClasses", `Building provisions array for class "${className}"...`, classInfo.startingPack?.["equipment - provisions"]);
    for (const [index, data] of Object.entries(classInfo.startingPack?.["equipment - provisions"] || [])) {
      provisions.push({ "name": data["name"], "quantity": data["quantity"] });
    }
    let religiousItems = [];
    Hyp3eLogger.info("migrateCustomClasses", `Building religious items array for class "${className}"...`, classInfo.startingPack?.["equipment - religious"]);
    for (const [index, data] of Object.entries(classInfo.startingPack?.["equipment - religious"] || [])) {
      religiousItems.push({ "name": data["name"], "quantity": data["quantity"] });
    }

    // Put it all together into a new systemData object
    const systemData = {
      "friendlyName": "",
      "description": "",
      "identified": true,
      "realName": className,
      "realDescription": "",
      "itemAlias": "",
      "aliasDescription": "",
      "baseClass": classInfo.baseClass || "",
      "hitDie": classInfo.hitDie || "",
      "attrReqs": {
        "con": classInfo.attrReqs?.con || null,
        "int": classInfo.attrReqs?.int || null,
        "str": classInfo.attrReqs?.str || null,
        "dex": classInfo.attrReqs?.dex || null,
        "wis": classInfo.attrReqs?.wis || null,
        "cha": classInfo.attrReqs?.cha || null
      },
      "xpBonusReq": {
        "con": classInfo.xpBonusReq?.con || null,
        "int": classInfo.xpBonusReq?.int || null,
        "str": classInfo.xpBonusReq?.str || null,
        "dex": classInfo.xpBonusReq?.dex || null,
        "wis": classInfo.xpBonusReq?.wis || null,
        "cha": classInfo.xpBonusReq?.cha || null
      },
      "featBonus": {
        "con": classInfo.featBonus?.con || null,
        "str": classInfo.featBonus?.str || null,
        "dex": classInfo.featBonus?.dex || null
      },
      "saves": {
        "base": classInfo.saves?.base || null,
        "death": classInfo.saves?.death || 16,
        "device": classInfo.saves?.device || 14,
        "transformation": classInfo.saves?.transformation || 16,
        "avoidance": classInfo.saves?.avoidance || 16,
        "sorcery": classInfo.saves?.sorcery || 14
      },
      // These few things don't exist in the original cust class data
      "unskilled": null,
      "weaponProficiencies": {
        "favoredWeapons": [],
        "exceptions": []
      },
      "levelAdvancement": {
        "1": {
          "xp": classInfo.levelAdvancement?.["1"]?.xp || 0,
          "hpRoll": classInfo.levelAdvancement?.["1"]?.hpRoll || "",
          "fa": classInfo.levelAdvancement?.["1"]?.fa || 0,
          "ca": classInfo.levelAdvancement?.["1"]?.ca || null,
          "ta": classInfo.levelAdvancement?.["1"]?.ta || null
        },
        "2": {
          "xp": classInfo.levelAdvancement?.["2"]?.xp || 0,
          "hpRoll": classInfo.levelAdvancement?.["2"]?.hpRoll || "",
          "fa": classInfo.levelAdvancement?.["2"]?.fa || 0,
          "ca": classInfo.levelAdvancement?.["2"]?.ca || null,
          "ta": classInfo.levelAdvancement?.["2"]?.ta || null
        },
        "3": {
          "xp": classInfo.levelAdvancement?.["3"]?.xp || 0,
          "hpRoll": classInfo.levelAdvancement?.["3"]?.hpRoll || "",
          "fa": classInfo.levelAdvancement?.["3"]?.fa || 0,
          "ca": classInfo.levelAdvancement?.["3"]?.ca || null,
          "ta": classInfo.levelAdvancement?.["3"]?.ta || null
        },
        "4": {
          "xp": classInfo.levelAdvancement?.["4"]?.xp || 0,
          "hpRoll": classInfo.levelAdvancement?.["4"]?.hpRoll || "",
          "fa": classInfo.levelAdvancement?.["4"]?.fa || 0,
          "ca": classInfo.levelAdvancement?.["4"]?.ca || null,
          "ta": classInfo.levelAdvancement?.["4"]?.ta || null
        },
        "5": {
          "xp": classInfo.levelAdvancement?.["5"]?.xp || 0,
          "hpRoll": classInfo.levelAdvancement?.["5"]?.hpRoll || "",
          "fa": classInfo.levelAdvancement?.["5"]?.fa || 0,
          "ca": classInfo.levelAdvancement?.["5"]?.ca || null,
          "ta": classInfo.levelAdvancement?.["5"]?.ta || null
        },
        "6": {
          "xp": classInfo.levelAdvancement?.["6"]?.xp || 0,
          "hpRoll": classInfo.levelAdvancement?.["6"]?.hpRoll || "",
          "fa": classInfo.levelAdvancement?.["6"]?.fa || 0,
          "ca": classInfo.levelAdvancement?.["6"]?.ca || null,
          "ta": classInfo.levelAdvancement?.["6"]?.ta || null
        },
        "7": {
          "xp": classInfo.levelAdvancement?.["7"]?.xp || 0,
          "hpRoll": classInfo.levelAdvancement?.["7"]?.hpRoll || "",
          "fa": classInfo.levelAdvancement?.["7"]?.fa || 0,
          "ca": classInfo.levelAdvancement?.["7"]?.ca || null,
          "ta": classInfo.levelAdvancement?.["7"]?.ta || null
        },
        "8": {
          "xp": classInfo.levelAdvancement?.["8"]?.xp || 0,
          "hpRoll": classInfo.levelAdvancement?.["8"]?.hpRoll || "",
          "fa": classInfo.levelAdvancement?.["8"]?.fa || 0,
          "ca": classInfo.levelAdvancement?.["8"]?.ca || null,
          "ta": classInfo.levelAdvancement?.["8"]?.ta || null
        },
        "9": {
          "xp": classInfo.levelAdvancement?.["9"]?.xp || 0,
          "hpRoll": classInfo.levelAdvancement?.["9"]?.hpRoll || "",
          "fa": classInfo.levelAdvancement?.["9"]?.fa || 0,
          "ca": classInfo.levelAdvancement?.["9"]?.ca || null,
          "ta": classInfo.levelAdvancement?.["9"]?.ta || null
        },
        "10": {
          "xp": classInfo.levelAdvancement?.["10"]?.xp || 0,
          "hpRoll": classInfo.levelAdvancement?.["10"]?.hpRoll || "",
          "fa": classInfo.levelAdvancement?.["10"]?.fa || 0,
          "ca": classInfo.levelAdvancement?.["10"]?.ca || null,
          "ta": classInfo.levelAdvancement?.["10"]?.ta || null
        },
        "11": {
          "xp": classInfo.levelAdvancement?.["11"]?.xp || 0,
          "hpRoll": classInfo.levelAdvancement?.["11"]?.hpRoll || "",
          "fa": classInfo.levelAdvancement?.["11"]?.fa || 0,
          "ca": classInfo.levelAdvancement?.["11"]?.ca || null,
          "ta": classInfo.levelAdvancement?.["11"]?.ta || null
        },
        "12": {
          "xp": classInfo.levelAdvancement?.["12"]?.xp || 0,
          "hpRoll": classInfo.levelAdvancement?.["12"]?.hpRoll || "",
          "fa": classInfo.levelAdvancement?.["12"]?.fa || 0,
          "ca": classInfo.levelAdvancement?.["12"]?.ca || null,
          "ta": classInfo.levelAdvancement?.["12"]?.ta || null
        }
      },
      "abilities": abilities,
      "startingPack": {
        "gold": classInfo.startingPack?.gold || "1d4+1",
        "armour": armor,
        "weapons": weapons,
        "equipment - general": generalEquipment,
        "equipment - provisions": provisions,
        "equipment - religious": religiousItems,
      },
      "spellLists": [
        classInfo.spellLists["0"] || "",
        classInfo.spellLists["1"] || ""
      ],
      "spellcaster": classInfo?.spellLists["0"].trim() !== "" ? true : false
    }

    try {
      // Create a new Item document for the class
      const classItemData = {
        name: className,
        type: "classTemplate",
        system: systemData,
        folder: classTemplatesFolder.id
      };
      const classItem = await Item.implementation.create(classItemData, {
        renderSheet: false
      });
      migratedClasses[className] = classItem.id;
      Hyp3eLogger.info("migrateCustomClasses", `Migrated class "${className}" to Item ID ${classItem.id}`);

      // Delete the old class data from the cloned data
      delete allCustomClasses[className];
    } catch (err) {
      Hyp3eLogger.error("migrateCustomClasses", `Failed to migrate class "${className}":`, err);
    }
  }

  // Now we do the batch delete of all custom classes
  // await game.settings.set(game.system.id, "customClassData", allCustomClasses);
  Hyp3eLogger.info("migrateCustomClasses", `Deleted all migrated class data. ${Object.keys(migratedClasses).length} migrated, ${Object.keys(allCustomClasses).length} remain.`);
}

/******************************************************************************
 * 
 * The following methods are all about migrating the Favoured Weapons list/string 
 * into favoured[] and exceptions[] arrays.
 * 
 ******************************************************************************/

export function migrateProficiencies(actor, classTemplate) {
  const proficiencies = foundry.utils.deepClone(actor.system.proficiencies);
  // Get the starting favoured weapons & exceptions lists for the character class
  let weaponProficiencies = [];
  const weaponsList = classTemplate?.system.weaponProficiencies.favoredWeapons ?? [];
  Hyp3eLogger.info("migrateProficiencies", `${actor.name} parsed Level 1 favored weapons:`, weaponsList);
  if (weaponsList.length > 0) {
    weaponProficiencies = weaponsList.map((item, index) => ({
      weapon: item,
      level: 1,
      mastery: 0,
      exception: false
    }));
  }

  let weaponExceptions = [];
  const exceptionsList = classTemplate?.system.weaponProficiencies.exceptions ?? [];
  Hyp3eLogger.info("migrateProficiencies", `${actor.name} parsed weapon exceptions:`, exceptionsList);
  if (exceptionsList.length > 0) {
    weaponExceptions = exceptionsList.map((item, index) => ({
      weapon: item,
      level: 1,
      mastery: 0,
      exception: true
    }));
    weaponProficiencies = [...weaponProficiencies, ...weaponExceptions];
  }

  // Parse the lvl4 field for an additional weapon proficiency at that level
  let { favoured, exceptions } = parseWeaponList(proficiencies.lvl4);
  Hyp3eLogger.info("migrateProficiencies", `${actor.name} parsed level 4 weapon:`, favoured);
  if (favoured.length > 0 && favoured[0].trim() !== "") {
    weaponProficiencies.push({
      weapon: favoured[0],
      level: 4,
      mastery: 0,
      exception: false
    })
  }
  ({ favoured, exceptions } = "");

  // Parse the lvl8 field for an additional weapon proficiency at that level
  ({ favoured, exceptions } = parseWeaponList(proficiencies.lvl8));
  Hyp3eLogger.info("migrateProficiencies", `${actor.name} parsed level 8 weapon:`, favoured);
  if (favoured.length > 0 && favoured[0].trim() !== "") {
    weaponProficiencies.push({
      weapon: favoured[0],
      level: 8,
      mastery: 0,
      exception: false
    })
  }
  ({ favoured, exceptions } = "");

  // Parse the lvl12 field for an additional weapon proficiency at that level
  ({ favoured, exceptions } = parseWeaponList(proficiencies.lvl12));
  Hyp3eLogger.info("migrateProficiencies", `${actor.name} parsed level 12 weapon:`, favoured);
  if (favoured.length > 0 && favoured[0].trim() !== "") {
    weaponProficiencies.push({
      weapon: favoured[0],
      level: 12,
      mastery: 0,
      exception: false
    })
  }

  // Sort the weaponProficiencies array by level, then weapon (name)
  const sorted = [...weaponProficiencies].sort((a, b) => 
    a.level - b.level || a.weapon.localeCompare(b.weapon)
  );

  Hyp3eLogger.info("migrateProficiencies", `${actor.name} weapon proficiencies:`, sorted);
  return sorted;
}

/**
 * Parse a free-text weapon list into normalised favoured + exception arrays.
 * @param {string} raw
 * @returns {{ favoured: string[], exceptions: string[] }}
 */
export function parseWeaponList(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    return { favoured: [], exceptions: [] };
  }

  // Ensure the lookup table exists
  _ensureLookup();

  let text = raw.trim();

  // Special "any / all"
  if (/^\s*\*?any\*?\s*$/i.test(text) || /^\s*\*?all\*?\s*$/i.test(text)) {
    return { favoured: ["*Any"], exceptions: [] };
  }

  // Split on "except"
  const exceptRe = /^(.*?)\s*\*?except\*?\s*(.*)$/is;
  const m = text.match(exceptRe);
  let favouredStr = text;
  let exceptStr = "";

  if (m) {
    favouredStr = m[1].trim();
    exceptStr   = m[2].trim();
  }

  return {
    favoured:   _parseSide(favouredStr),
    exceptions: _parseSide(exceptStr)
  };
}

/**
 * Calculate the mastery level of a weapon based on *Any + 1 or 2 additional 
 *    proficiencies, or 2 or 3 total proficiencies of the weapon.
 * @param {String} weaponName - the weapon name to be checked
 * @param {Object} weaponProficiencies - the actor's full weaponProficiencies object
 * @returns {Number} mastery - 0, 1, or 2
 */
export function calcMastery(weaponName, weaponProficiencies) {
  let mastery = 0;
  for (const w of weaponProficiencies) {
    if (!w.exception && weaponName !== "*Any" && weaponName !== "") {
      if (w.weapon == weaponName || w.weapon == "*Any") mastery ++;
    }
  }
  return Math.max(mastery - 1, 0);
}

/**
 * Calculate mastery-level for an actor's full set of weapon proficiencies
 * @param {*} actor 
 * @returns {Object} weaponProficiencies - the updated object data
 */
export function updateWeaponMasteries(actor) {
  const weaponProficiencies = foundry.utils.deepClone(actor.system.weaponProficiencies);
  for (const w of weaponProficiencies) {
    if (w.weapon !== "*Any" && !w.exception) {
      w.mastery = calcMastery(w.weapon, weaponProficiencies);
    } else {
      w.mastery = 0;
    }
  }
  return weaponProficiencies;
}

/**
 * Find the best matching canonical weapon name.
 * @param {string} name - Any variant of a weapon name
 * @returns {string|null} The matching canonical name, or null if none found
 */
function findCanonicalWeapon(name) {
  // Ensure the lookup table exists
  _ensureLookup();

  const input = normalizeWeaponName(name);
  if (!input.compact) return null;
  Hyp3eLogger.info("findCanonicalWeapon", `${name} normalized to ${input.compact} and ${input.sorted}`);
  
  // Prefer exact compact match (handles "longsword" vs "Sword, Long")
  // let match = CANONICAL.find(c => c.compact === input.compact);
  let match = LOOKUP.get(input.compact);
  Hyp3eLogger.info("findCanonicalWeapon", `Matching on ${input.compact}...:`, (match ? true : false));
  // if (match) return match.original;
  if (match) return match;

  // Fallback to sorted-token match (handles remaining order/spacing cases)
  // match = CANONICAL.find(c => c.sorted === input.sorted);
  match = LOOKUP.get(input.sorted);
  Hyp3eLogger.info("findCanonicalWeapon", `Matching on ${input.sorted}...:`, (match ? true : false));
  return match ? match : null;
}

/**
 * Normalize a weapon name for comparison.
 * Returns both a space-separated sorted token string and a fully compacted version.
 */
function normalizeWeaponName(name) {
  if (!name || typeof name !== "string") return { sorted: "", compact: "" };

  const cleaned = name
    .toLowerCase()
    .replace(/æ/g, "ae")                        // Cæstuses → caestuses
    .replace(/[+\-]\s*\d+/g, "")                // Remove +1, -2, etc. from magic weapons
    .replace(/\b(cursed|silver|thrown)\b/g, "") // Remove "cursed", "silver", "thrown"
    .replace(/['’ʻʼ]/g, "")                     // All common apostrophe variants, just in case
    .replace(/[^a-z\s]/g, " ")                  // Keep only letters and spaces
    .replace(/\s+/g, " ")                       // Collapse multiple spaces in a row, to one
    .trim();

  const tokens = cleaned.split(" ").filter(Boolean).sort();
  return {
    sorted: tokens.join(" "),
    compact: tokens.join("")                 // "long sword" → "longsword"
  };
}

// ---------------------------------------------------------------------------
// Internal state & helpers
// ---------------------------------------------------------------------------

const CANONICAL = [
  "Axe, Battle", "Axe, Great", "Axe, Hand",
  "Bardiche", "Bill", "Cæstuses", "Chain Whip",
  "Club, Light", "Club, War",
  "Dagger", "Dagger, Silver",
  "Falcata", "Fauchard",
  "Flail, Footman's", "Flail, Horseman's",
  "Garrotte", "Glaive", "Halberd",
  "Hammer, Great", "Hammer, Horseman's", "Hammer, War",
  "Javelin", "Lance", "Lasso",
  "Mace, Footman's", "Mace, Great", "Mace, Horseman's",
  "Monk's Empty Hand Attack", "Morning Star",
  "Pick, Horseman's", "Pick, War",
  "Pike", "Poleaxe", "Quarterstaff",
  "Scimitar, Long", "Scimitar, Short", "Scimitar, Two-handed",
  "Sickle",
  "Spear, Great", "Spear, Long", "Spear, Short",
  "Staff, Spiked",
  "Sword, Bastard", "Sword, Broad", "Sword, Long", "Sword, Short", "Sword, Two-handed",
  "Tonfa", "Trident, Hand", "Trident, Long", "Whip",
  "Blowgun", "Bola", "Boomerang",
  "Bow, Long", "Bow, Long, Composite", "Bow, Short", "Bow, Short, Composite",
  "Crossbow, Heavy", "Crossbow, Light", "Crossbow, Repeating",
  "Dart",
  "Holy Water/Oil (thrown)", "Hooked Throwing Knife",
  "Needle, Blowgun", "Net, Fighting",
  "Oil, Incendiary (thrown)", "Sling"
];

const EXTRA_ALIASES = {
  // Wildcards
  "any":                  "*Any",
  "any weapon":           "*Any",
  "any weapons":          "*Any",
  "all":                  "*Any",
  "all weapon":           "*Any",
  "all weapons":          "*Any",
  // Swords
  "longsword":            "Sword, Long",
  "long sword":           "Sword, Long",
  "shortsword":           "Sword, Short",
  "short sword":          "Sword, Short",
  "greatsword":           "Sword, Two-handed",
  "great sword":          "Sword, Two-handed",
  "sword great":          "Sword, Two-handed",
  "bastard sword":        "Sword, Bastard",
  "two handed sword":     "Sword, Two-handed",
  "two-handed sword":     "Sword, Two-handed",
  "2h sword":             "Sword, Two-handed",
  "scimitar great":       "Scimitar, Two-handed",
  "great scimitar":       "Scimitar, Two-handed",
  "2h scimitar":          "Scimitar, Two-handed",
  // Axes / hammers / etc.
  "hand axe":             "Axe, Hand",
  "battle axe":           "Axe, Battle",
  "great axe":            "Axe, Great",
  "war hammer":           "Hammer, War",
  "warhammer":            "Hammer, War",
  "morningstar":          "Morning Star",
  "quarter staff":        "Quarterstaff",
  "spiked staff":         "Staff, Spiked",
  "caestuses":            "Cæstuses",
  "cestuses":             "Cæstuses",
  // Bows
  "longbow":              "Bow, Long",
  "shortbow":             "Bow, Short",
  "composite longbow":    "Bow, Long, Composite",
  "composite shortbow":   "Bow, Short, Composite",
  "long composite bow":   "Bow, Long, Composite",
  "short composite bow":  "Bow, Short, Composite",
  // Crossbows
  "lightcrossbow":        "Crossbow, Light",
  "heavycrossbow":        "Crossbow, Heavy",
  "repeatingcrossbow":    "Crossbow, Repeating"
};

/** @type {Map<string, string> | null} */
let LOOKUP = null;

function _ensureLookup() {
  if (LOOKUP) return;

  LOOKUP = new Map();

  for (const name of CANONICAL) {
    LOOKUP.set(_makeKey(name), name);
  }

  for (const [alias, canon] of Object.entries(EXTRA_ALIASES)) {
    LOOKUP.set(_makeKey(alias), canon);
  }
}

function _parseSide(str) {
  if (!str) return [];

  str = _expandParentheticals(str);

  str = str
    .replace(/master(y|ed|ing|s)?/gi, "")
    .replace(/[;:\/|&\n\r-]+|\s+and\s+/gi, ",")
    .replace(/\s*,\s*/g, ",")
    .replace(/,+/g, ",")
    .replace(/^,|,$/g, "")
    .trim();

  if (!str) return [];

  const tokens = str.split(",").map(t => t.trim()).filter(Boolean);
  const result = [];
  let i = 0;

  while (i < tokens.length) {
    let matched = false;
    const maxLen = Math.min(5, tokens.length - i);

    for (let len = maxLen; len >= 1; len--) {
      const candidate = tokens.slice(i, i + len).join(" ");
      const canon = LOOKUP.get(_makeKey(candidate));
      if (canon) {
        result.push(canon);
        i += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      result.push(_titleCase(tokens[i]));
      i += 1;
    }
  }

  return [...new Set(result)].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

function _expandParentheticals(str) {
  let prev;
  do {
    prev = str;
    str = str.replace(
      /([a-zA-ZæÆ'’]+(?:\s+[a-zA-ZæÆ'’]+)*)\s*[\(\[]\s*([^\)\]]+?)\s*[\)\]]/gi,
      (_, base, mods) => {
        const modList = mods
          .split(/[,;\/|&]+|\s+and\s+/i)
          .map(m => m.trim())
          .filter(Boolean);
        return modList.map(mod => `${base.trim()} ${mod}`).join(", ");
      }
    );
  } while (str !== prev);
  return str;
}

function _makeKey(s) {
  return s
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

function _titleCase(s) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Write the character data to a new Journal Entry, and display a confirmation chat message
 * @param {*} actor 
 * @param {*} classTemplate 
 * @returns 
 */
async function createProficiencyMigrationReport(actor, weaponProficiencies) {
  if (!actor) {
    Hyp3eLogger.error("Hyp3eCharacterClass createProficiencyMigrationReport", `Actor not supplied!`);
    return false;
  }
  // Log the dataset before the dialog renders
  Hyp3eLogger.info("Hyp3eCharacterClass createProficiencyMigrationReport", `${actor.name}: `, actor);

  // Initialize some vars
  const origProficiencies = foundry.utils.deepClone(actor.system.proficiencies);

  // Build html for migrated weapon proficiencies
  let favouredWeapons = "";
  let exceptions = "";
  for (const weapon of weaponProficiencies) {
    if (weapon && weapon.weapon !== "undefined") {
      if (!weapon.exception) {
        favouredWeapons += `<li>${weapon.weapon} - Lvl ${weapon.level}</li>`
      } else {
        exceptions += `<li>${weapon.weapon} - Lvl ${weapon.level}</li>`
      }
    }
  }

  // Setup journal report content
  let journalContent = `
        <h2>${actor.name}</h2>
        <h3>Original Favoured Weapons and Later Proficiencies</h3>
        <ul>
          <li>Favoured Weapons: ${origProficiencies.class}</li>
          <li>Level 4 Weapon: ${(origProficiencies?.lvl4 ?? "")}</li>
          <li>Level 8 Weapon: ${(origProficiencies?.lvl8 ?? "")}</li>
          <li>Level 12 Weapon: ${(origProficiencies?.lvl12 ?? "")}</li>
        </ul>
        <h3>Migrated Weapon Proficiencies</h3>
        <h4>Favoured Weapons</h4>
        <ul>
        ${favouredWeapons}
        </ul>
      `;
  if (exceptions !== "") {
      journalContent += `
        <h4>Weapon Exceptions (Forbidden to Class)</h4>
        <ul>
        ${exceptions}
        </ul>
      `;
  }

  // Find or create a JournalEntry for character reports
  let je = await game.journal.getName("Character Reports");
  if (!je) {
    const data = {
      name: `Character Reports`,
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED }
    };
    je = await JournalEntry.create(data);
  }
  // Create a new JournalEntryPage for the weapon proficiencies report
  const [page] = await je.createEmbeddedDocuments("JournalEntryPage", [
    {
      name: `${actor.name} Data Migration`,
      type: "text",
      text: {
        content: journalContent,
      },
      sort: 0
    }
  ]);

  // Pop open the JournalEntry to show the new page
  je.sheet.render(true, { pageId: page.id });

  return true;
}