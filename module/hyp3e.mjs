// Import document classes.
import { Hyp3eActor } from "./documents/actor.mjs";
import { Hyp3eItem } from "./documents/item.mjs";
// Import sheet classes.
import { Hyp3eActorSheet } from "./sheets/actor-sheet.mjs";
import { Hyp3eItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { HYP3E } from "./helpers/config.mjs";
import { addChatMessageButtons } from "./helpers/chat.mjs";
// Import Combat classes
import { HYP3EGroupCombat } from "./combat/combat-group.mjs";
import { HYP3EGroupCombatant } from "./combat/combatant-group.mjs";
import { HYP3ECombat } from "./combat/combat.mjs";
import { HYP3ECombatant } from "./combat/combatant.mjs";
import { HYP3ECombatTab } from "./combat/sidebar.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.hyp3e = {
    Hyp3eActor,
    Hyp3eItem,
    rollItemMacro
  };

  // Register system settings
  // Debug logging & messages
  game.settings.register(game.system.id, "debugMessages", {
    name: game.i18n.localize("HYP3E.settings.debugMessages"),
    hint: game.i18n.localize("HYP3E.settings.debugMessagesHint"),
    default: false,
    scope: "world",
    type: Boolean,
    config: true,
    requiresReload: true,
  });

  // Automatic Armor Class calculation
  game.settings.register(game.system.id, "autoCalcAc", {
    name: game.i18n.localize("HYP3E.settings.autoCalcAc"),
    hint: game.i18n.localize("HYP3E.settings.autoCalcAcHint"),
    default: true,
    scope: "world",
    type: Boolean,
    config: true,
    requiresReload: true,
  });

  // Enable basic attribute checks
  game.settings.register(game.system.id, "enableAttrChecks", {
    name: game.i18n.localize("HYP3E.settings.enableAttrChecks"),
    hint: game.i18n.localize("HYP3E.settings.enableAttrChecksHint"),
    default: "",
    scope: "world",
    type: String,
    choices: {
      "": "Disabled",
      "3d6": "3d6 roll-under"
    },
    config: true,
    requiresReload: true,
  });

  // Reverse situational modifiers on roll-under checks
  game.settings.register(game.system.id, "flipRollUnderMods", {
    name: game.i18n.localize("HYP3E.settings.flipRollUnderMods"),
    hint: game.i18n.localize("HYP3E.settings.flipRollUnderModsHint"),
    default: true,
    scope: "world",
    type: Boolean,
    config: true,
    requiresReload: true,
  });

  // Enable/disable group-based initiative
  game.settings.register(game.system.id, "isGroupInitiative", {
    name: game.i18n.localize("HYP3E.settings.isGroupInitiative"),
    hint: game.i18n.localize("HYP3E.settings.isGroupInitiativeHint"),
    default: true,
    scope: "world",
    type: Boolean,
    config: true,
    requiresReload: true,
  });

  // Re-roll Initiative action
  game.settings.register(game.system.id, "rerollInitiative", {
    name: game.i18n.localize("HYP3E.settings.rerollInitiative"),
    hint: game.i18n.localize("HYP3E.settings.rerollInitiativeHint"),
    default: "reset",
    scope: "world",
    type: String,
    config: true,
    choices: {
      keep: "HYP3E.settings.initiativeKeep",
      reset: "HYP3E.settings.initiativeReset",
      reroll: "HYP3E.settings.initiativeReroll",
    },
  });

  // Critical hit 
  game.settings.register(game.system.id, "critHit", {
    name: game.i18n.localize("HYP3E.settings.critHits"),
    hint: game.i18n.localize("HYP3E.settings.critHitsHint"),
    default: true,
    scope: "world",
    type: Boolean,
    config: true,
    requiresReload: true,
  });
  
  // Critical Miss 
  game.settings.register(game.system.id, "critMiss", {
    name: game.i18n.localize("HYP3E.settings.critMiss"),
    hint: game.i18n.localize("HYP3E.settings.critMissHint"),
    default: true,
    scope: "world",
    type: Boolean,
    config: true,
    requiresReload: true,
  });

  // Human races
  game.settings.register(game.system.id, "races", {
    name: game.i18n.localize("HYP3E.settings.races"),
    hint: game.i18n.localize("HYP3E.settings.racesHint"),
    default: "Common (Mixed), Amazon, Atlantean, Esquimaux, Hyperborean, Ixian, Kelt, Kimmerian, Kimmeri-Kelt, Pict, Pict (Half-Blood), Viking, Anglo-Saxon, Carolingian Frank, Carthaginian, Esquimaux-Ixian, Greek, Lapp, Lemurian, Moor, Mu, Oon, Roman, Tlingit, Yakut",
    scope: "world",
    type: String,
    config: true,
    requiresReload: true,
  });

  // Languages
  game.settings.register(game.system.id, "languages", {
    name: game.i18n.localize("HYP3E.settings.languages"),
    hint: game.i18n.localize("HYP3E.settings.languagesHint"),
    default: "Common, Berber, Esquimaux (Coastal), Esquimaux (Tundra), Esquimaux-Ixian (pidgin), Hellenic (Amazon), Hellenic (Atlantean), Hellenic (Greek), Hellenic (Hyperborean), Hellenic (Kimmerian), Keltic (Goidelic), Keltic (Pictish), Latin, Lemurian, Muat, Old Norse (Anglo-Saxon), Old Norse (Viking), Oonat, Thracian (Ixian), Thracian (Kimmerian), Tlingit, Uralic (Lapp), Uralic (Yakut)",
    scope: "world",
    type: String,
    config: true,
    requiresReload: true,
  });
  
  // Classes
  game.settings.register(game.system.id, "characterClasses", {
    name: game.i18n.localize("HYP3E.settings.characterClasses"),
    hint: game.i18n.localize("HYP3E.settings.characterClassesHint"),
    default: "Assassin, Barbarian, Bard, Berserker, Cataphract, Cleric, Cryomancer, Druid, Fighter, Huntsman, Illusionist, Legerdemainist, Magician, Monk, Necromancer, Paladin, Priest, Purloiner, Pyromancer, Ranger, Runegraver, Scout, Shaman, Thief, Warlock, Witch",
    scope: "world",
    type: String,
    config: true,
    requiresReload: true,
  });
    
  // If we ever need migration scripts, use this version number for comparison
  console.log("System info:", game.system)

  // Add custom constants for configuration.
  CONFIG.HYP3E = HYP3E;

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    //   CONFIG.Combat.initiative = {
    //     // formula: "1d20 + @attributes.dex.mod",
    //     // decimals: 2
    //     formula: "1d6 + @dex.value",
    //     decimals: 0
    //   };
    const isGroupInitiative = game.settings.get(game.system.id, "isGroupInitiative");
    if (isGroupInitiative) { 
        CONFIG.Combat.documentClass = HYP3EGroupCombat;
        CONFIG.Combatant.documentClass = HYP3EGroupCombatant;
        CONFIG.Combat.initiative = { decimals: 3, formula: HYP3EGroupCombat.FORMULA }
    } else {
        CONFIG.Combat.documentClass = HYP3ECombat;
        CONFIG.Combatant.documentClass = HYP3ECombatant;
        CONFIG.Combat.initiative = { decimals: 3, formula: HYP3ECombat.FORMULA }
    }
    CONFIG.ui.combat = HYP3ECombatTab;

  // Define custom Document classes
  CONFIG.Actor.documentClass = Hyp3eActor;
  CONFIG.Item.documentClass = Hyp3eItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("hyp3e", Hyp3eActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("hyp3e", Hyp3eItemSheet, { makeDefault: true });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
  
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function() {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

Handlebars.registerHelper('toLowerCase', function(str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('add', function(num1, num2) {
  return num1 + num2
});

Handlebars.registerHelper('subtract', function(num1, num2) {
  return num1 - num2
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    createItemMacro(data, slot);
    return false;
  });

  /**
   * Load system settings
   */
  const debugMessages = game.settings.get(game.system.id, "debugMessages");
  CONFIG.HYP3E.debugMessages = debugMessages;

  // Automatically calculate AC
  const autoCalcAc = game.settings.get(game.system.id, "autoCalcAc");
  CONFIG.HYP3E.autoCalcAc = autoCalcAc;
  if (CONFIG.HYP3E.debugMessages) { console.log("CONFIG Auto-calculate AC:", CONFIG.HYP3E.autoCalcAc) }

  // Enable basic attribute checks
  const enableAttrChecks = game.settings.get(game.system.id, "enableAttrChecks");
  CONFIG.HYP3E.enableAttrChecks = enableAttrChecks;
  if (CONFIG.HYP3E.debugMessages) { console.log("CONFIG Enable basic attribute checks:", CONFIG.HYP3E.enableAttrChecks) }

  // Reverse situational modifiers on roll-under checks
  const flipRollUnderMods = game.settings.get(game.system.id, "flipRollUnderMods");
  CONFIG.HYP3E.flipRollUnderMods = flipRollUnderMods;
  if (CONFIG.HYP3E.debugMessages) { console.log("CONFIG Reverse situational modifiers on roll-under checks:", CONFIG.HYP3E.flipRollUnderMods) }

  // Enable/disable group-based initiative
  const isGroupInitiative = game.settings.get(game.system.id, "isGroupInitiative");
  CONFIG.HYP3E.isGroupInitiative = isGroupInitiative;
  if (CONFIG.HYP3E.debugMessages) { console.log("CONFIG Use group-based initiative:", CONFIG.HYP3E.isGroupInitiative) }

  // Set crit configs
  //const critHits = game.settings.get(game.system.id, "critHits");

  // Load races list
  const races = game.settings.get(game.system.id, "races");
  if (races != "") {
    CONFIG.HYP3E.races = {}
    const racesArray = races.split(",");
    racesArray.forEach((l, i) => (CONFIG.HYP3E.races[l.trim()] = l.trim()));
    if (CONFIG.HYP3E.debugMessages) { console.log("CONFIG Races:", CONFIG.HYP3E.races) }
  }

  // Load language list
  const languages = game.settings.get(game.system.id, "languages");
  if (languages != "") {
    CONFIG.HYP3E.languages = {}
    const langArray = languages.split(",");
    langArray.forEach((l, i) => (CONFIG.HYP3E.languages[l.trim()] = l.trim()));
    if (CONFIG.HYP3E.debugMessages) { console.log("CONFIG Languages:", CONFIG.HYP3E.languages) }
  }

  // Load class list
  const characterClasses = game.settings.get(game.system.id, "characterClasses");
  if (characterClasses != "") {
    CONFIG.HYP3E.characterClasses = {}
    const classArray = characterClasses.split(",");
    classArray.forEach((l, i) => (CONFIG.HYP3E.characterClasses[l.trim()] = l.trim()));
    if (CONFIG.HYP3E.debugMessages) { console.log("CONFIG Classes:", CONFIG.HYP3E.characterClasses) }
  }

  // Load blind roll options
//   if (CONFIG.HYP3E.blindRollOpts) {
//     for (let [k, v] of Object.entries(CONFIG.HYP3E.blindRollOpts)) {
//       CONFIG.HYP3E.blindRollOpts[k] = game.i18n.localize(CONFIG.HYP3E.blindRollOpts[k])
//     }
//     // console.log("CONFIG Blind Roll options:", CONFIG.HYP3E.blindRollOpts)
//   }
  
  // Load saving throws
  if (CONFIG.HYP3E.saves) {
    for (let [k, v] of Object.entries(CONFIG.HYP3E.saves)) {
      CONFIG.HYP3E.saves[k] = game.i18n.localize(CONFIG.HYP3E.saves[k])
    }
    console.log("CONFIG Saves:", CONFIG.HYP3E.saves)
  }

  // Load creature sizes
  if (CONFIG.HYP3E.creatureSizes) {
    for (let [k, v] of Object.entries(CONFIG.HYP3E.creatureSizes)) {
        CONFIG.HYP3E.creatureSizes[k] = game.i18n.localize(CONFIG.HYP3E.creatureSizes[k])
    }
    console.log("CONFIG Creature Sizes:", CONFIG.HYP3E.creatureSizes)
  }

  // Load weapon types
  if (CONFIG.HYP3E.weaponTypes) { 
    for (let [k, v] of Object.entries(CONFIG.HYP3E.weaponTypes)) {
      CONFIG.HYP3E.weaponTypes[k] = game.i18n.localize(CONFIG.HYP3E.weaponTypes[k])
    }
    console.log("CONFIG Weapon Types:", CONFIG.HYP3E.weaponTypes)
  }
  
  // Load armor types
  if (CONFIG.HYP3E.armorTypes) { 
    for (let [k, v] of Object.entries(CONFIG.HYP3E.armorTypes)) {
      CONFIG.HYP3E.armorTypes[k] = game.i18n.localize(CONFIG.HYP3E.armorTypes[k])
    }
    console.log("CONFIG Armor Types:", CONFIG.HYP3E.armorTypes)
  }

  // If we need to do a system migration,  do it after the other settings are loaded
  if (game.user.isGM) {
    const currentVersion = game.system.version
    console.log(`System version ${currentVersion}`)
    // No need to migrate if system version is x.x.x or higher
    const NEEDS_MIGRATION_TO_VERSION = "1.0.8"
    const needsMigration = !currentVersion || foundry.utils.isNewerVersion(NEEDS_MIGRATION_TO_VERSION, currentVersion)
    if (needsMigration) {
      migrateWorld()
    }
  }

  // Report on compendium data
  if (game.user.isGM) {
    // if (foundry.utils.isNewerVersion("0.9.38", game.system.version)) {
    //   reportBestiary()
    // }
    if (foundry.utils.isNewerVersion("1.0.4", game.system.version)) {
        reportItems()
    }
  }

});

// Insert special damage buttons into attack & damage chats
Hooks.on("renderChatMessage", addChatMessageButtons);

Hooks.on("createToken", (document, options, userId) => {
  if (document.actor?.type == "npc" && document.actor.system.rollHD) {
    document.actor.rollHD()
  }
});

/* -------------------------------------------- */
/*  Migrate system/world functions              */
/* -------------------------------------------- */
async function migrateWorld() {
    console.log(`Migrating world ${game.system.version}...`)

    // Migrate Actor directory
    for (let actor of game.actors.contents) {
        if (actor.type == "npc") {
            if (actor.system.attributes.dex.value != actor.system.dx) {
                // Migrate NPC dx to attributes.dex.value
                console.log(`Migrating actor ${actor.name}...`)
                const dex = {
                    system: {
                        attributes: {
                            dex: {
                                value: actor.system.dx
                            }
                        }
                    }
                }
                console.log(`DX value: ${actor.system.dx}, update object: `, dex)
                // await actor.update(dex)
            }
        }

        // Migrate the actor document's items if any exist
        // if (actor.items) {
        //   for (let item of actor.items) {
        //      do stuff
        //   }
        // }
    }

    // Migrate Actor compendia, one document at a time (time-consuming!)
    for (let pack of game.packs) {

        const packType = pack.metadata.type
        // Skip anything that's not an Item compendium pack
        // if (packType != "Item") {
        //   continue
        // }

        // Skip anything that's not an Actor compendium pack
        if (packType != "Actor") {
            continue
        }
        
        console.log(`Compendium pack ${pack.metadata.label}:`, pack)
        const documentName = pack.documentName;

        // Get the compendium's locked property, then unlock it
        const wasLocked = pack.locked
        await pack.configure({ locked: false })

        // Begin by requesting server-side data model migration and get the migrated content
        console.log(`Migrating compendium pack ${pack.metadata.label}...`)
        await pack.migrate()
        const documents = await pack.getDocuments()

        // Iterate over compendium entries and apply migration functions
        for (let doc of documents) {
            try {
                switch(packType) {
                case "Actor":
                    // Migrate NPC dx to attributes.dex.value
                    if (doc.type == "npc") {
                        if (doc.system.attributes.dex.value != doc.system.dx) {
                            // Migrate NPC dx to attributes.dex.value
                            console.log(`Migrating actor ${doc.name}...`)
                            const dex = {
                                system: {
                                    attributes: {
                                        dex: {
                                            value: doc.system.dx
                                        }
                                    }
                                }
                            }
                            console.log(`DX value: ${doc.system.dx}, update object: `, dex)
                            // await doc.update(dex)
                        }
                    }
                
                    // Migrate the actor document's items if any exist
                    // if (doc.items) {
                    //   for (let item of doc.items) {
                    //      do stuff
                    //   }
                    // }
                    break
        
                case "Item":
                    console.log("Compendium item document:", doc)
                    // Migrate items of type 'container' to type 'item', and set isContainer flag
                    if (doc.type === 'container') {
                        // Update the container/item document
                        console.log(`Updating container/item ${doc.name}...`)
                        doc.type = "item"
                        doc.system.isContainer = true
                        await doc.update()
                    }
                    break
        
                default:
                    break
                }
            } catch (err) {
                errMsg = `Failed Hyp3e system migration for document ${doc.name} in pack ${pack.collection}: ${err.message}`;
                console.error(errMsg);
            }
        }

        // Re-lock the compendium if it was locked before
        await pack.configure({ locked: wasLocked })
        console.log(`Migrated all ${documentName} documents from Compendium ${pack.collection}`);

    }
}

function updateEmpty(doc) {
    console.log(doc.name)
    const update = {system: {}}
    update.system = {rollMode: "", blindRoll: null}
    return update;
}

function filterEmpty(doc) {
    return doc.type === "feature" && (doc.system.formula === "undefined" || doc.system.formula === undefined || doc.system.formula === "")
}

function updatePublic(doc) {
    console.log(doc.name)
    const update = {system: {}}
    update.system = {rollMode: "publicroll"}
    return update;
}
function filterPublic(doc) {
    return doc.type === "feature" && (doc.system.blindRoll === "false" || doc.system.blindRoll === false)
}

function updateBlind(doc) {
    console.log(doc.name)
    const update = {system: {}}
    update.system = {rollMode: "blindroll"}
    return update;
}
function filterBlind(doc) {
    return doc.type === "feature" && (doc.system.blindRoll === "true" || doc.system.blindRoll === true)
}

async function reportBestiary() {
  // Generate a report on bestiary data
  // Loop through all compendia to find the bestiary
  for (let pack of game.packs) {

    // Skip anything that's not an Actor compendium pack
    if (pack.metadata.type != "Actor") {
      continue
    }

    // We only need to do the Bestiary compendium for this specific migration
    if (pack.metadata.label !== "Bestiary") {
      continue
    }
    
    // OK, we have the bestiary compendium... generate the report

    // Iterate over compendium entries and report
    const documents = await pack.getDocuments()
    for (let doc of documents) {
      if (doc.name != doc.prototypeToken.name) {
        console.log(`Compendium Bestiary error: ${doc.name} is not the same as token ${doc.prototypeToken.name}!`)
      }
    }
  }
}

async function reportItems() {
    // Generate a report on item data in the compendium.
    // Report on all items with blank weight and zero weight.

    for (let pack of game.packs) {
        // Skip anything that's not an Item compendium pack
        if (pack.metadata.type != "Item") {
            continue
        }

        // Skip anything that is not a physical item compendium
        if (pack.metadata.label == "Armor" || pack.metadata.label == "Weapons" || pack.metadata.label == "Equipment - General" || pack.metadata.label == "Equipment - Provisions" || pack.metadata.label == "Equipment - Religious") {
            // Iterate over compendium entries and report
            const documents = await pack.getDocuments()
            for (let doc of documents) {
                if (!doc.system.weight || doc.system.weight == "") {
                    console.log(`Compendium weight: ${doc.name} has weight ${doc.system.weight}!`)
                }
            }
        }
    }
}

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== "Item") return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn("You can only create macro buttons for owned Items");
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.hyp3e.rollItemMacro("${data.uuid}","${item.actor.id}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "hyp3e.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid, actorId=null) {
    // wsAI: looks like actor could be retrieved from itemUuid, not sure cons/risks of that approach.
    if (actorId == null){
        return ui.notifications.warn(`Could not find actor for item ${itemUuid}. You may need to delete and recreate this macro.`);
        // // wsAI old way. should likely be removed if rollItemMacro is always created with actorId
        // // Reconstruct the drop data so that we can load the item.
        // const dropData = {
        //     type: 'Item',
        //     uuid: itemUuid
        // };
        // // Load the item from the uuid.
        // Item.fromDropData(dropData).then(item => {
        //     // Determine if the item loaded and if it's an owned item.
        //     if (!item || !item.parent) {
        //         const itemName = item?.name ?? itemUuid;
        //         return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
        //     }
        //     // Trigger the item roll
        //     item.roll();
        // });
    } else {
        // wsAI note above, might be better to get actor from the Item object.
        const actor = game.actors.get(actorId);
        // wsAI: some of the helper logic in the actor.rollMacro function could be moved here and the wrapper removed. 

        // Ensure rollMacro is a function on the actor 
        if (typeof actor.rollMacro === 'function') {
            actor.rollMacro(itemUuid);
        } else {
            ui.notifications.error("Actor does not have a roll function");
        }
    }

}