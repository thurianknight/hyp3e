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
  CONFIG.Combat.initiative = {
    // formula: "1d20 + @attributes.dex.mod",
    // decimals: 2
    formula: "1d6",
    decimals: 0
  };

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
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));

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
  if (CONFIG.HYP3E.blindRollOpts) {
    for (let [k, v] of Object.entries(CONFIG.HYP3E.blindRollOpts)) {
      CONFIG.HYP3E.blindRollOpts[k] = game.i18n.localize(CONFIG.HYP3E.blindRollOpts[k])
    }
    // console.log("CONFIG Blind Roll options:", CONFIG.HYP3E.blindRollOpts)
  }
  
  // Load saving throws
  if (CONFIG.HYP3E.saves) {
    for (let [k, v] of Object.entries(CONFIG.HYP3E.saves)) {
      CONFIG.HYP3E.saves[k] = game.i18n.localize(CONFIG.HYP3E.saves[k])
    }
    console.log("CONFIG Saves:", CONFIG.HYP3E.saves)
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
    const NEEDS_MIGRATION_TO_VERSION = "1.0.4"
    const needsMigration = !currentVersion || foundry.utils.isNewerVersion(NEEDS_MIGRATION_TO_VERSION, currentVersion)
    if (needsMigration) {
      migrateWorld()
    }
  }

  // Report on compendium data
  if (game.user.isGM) {
    if (foundry.utils.isNewerVersion("0.9.38", game.system.version)) {
      reportBestiary()
    }
  }

});

Hooks.on("renderChatMessage", addChatMessageButtons);

/* -------------------------------------------- */
/*  Migrate system/world functions              */
/* -------------------------------------------- */
async function migrateWorld() {
  console.log(`Migrating world ${game.system.version}...`)

  // Migrate Actor directory
  for (let actor of game.actors.contents) {
    // Update the actor

    // Migrate the actor document's items if any exist
    // if (actor.items) {
    //   for (let item of actor.items) {
        // Update the embedded item document
        // if ( item.type === "feature" && (item.system.formula == null || item.system.formula == undefined || item.system.formula == "undefined" || item.system.formula == "") ) {
        // console.log(`Migrating item ${item.name}...`, item)
        // actor.updateEmbeddedDocuments("Item", [
        //     { _id: item.id, "system.blindRoll": null, "system.rollMode": "" },
        //   ])
        // } else if ( item.type === "feature" && (item.system.blindRoll === "false" || item.system.blindRoll === false) ) {
        //   console.log(`Migrating item ${item.name}...`, item)
        //   actor.updateEmbeddedDocuments("Item", [
        //     { _id: item.id, "system.rollMode": "publicroll" },
        //   ])
        // } else if ( item.type === "feature" && (item.system.blindRoll === "true" || item.system.blindRoll === true) ) {
        //   console.log(`Migrating item ${item.name}...`, item)
        //   actor.updateEmbeddedDocuments("Item", [
        //     { _id: item.id, "system.rollMode": "blindroll" },
        //   ])
        // }
    //   }
    // }
  }

  // Update the Class Abilities & Features compendium for blindRoll and rollMode fields
  // const collection = game.packs.get("hyperborea-3e-compendium.class-abilities-and-features")
  // console.log("Compendium collection: ", collection)
  // // Get the compendium's locked property, then unlock it
  // const wasLocked = collection.locked
  // await collection.configure({ locked: false })
  // // Batch update items based on applied filters
  // await collection.updateAll(updateEmpty, filterEmpty)
  // await collection.updateAll(updatePublic, filterPublic)
  // await collection.updateAll(updateBlind, filterBlind)
  // // Re-lock the compendium if it was locked before
  // await collection.configure({ locked: wasLocked })
  // console.log(`Migrated all documents from Compendium ${collection.collection}`);

  // Migrate Actor compendia, one document at a time (time-consuming!)
  for (let pack of game.packs) {

    const packType = pack.metadata.type
    // Skip anything that's not an Actor compendium pack
    if (packType != "Item") {
      continue
    }

    console.log(`Compendium pack ${pack.metadata.label}:`, pack)
    const documentName = pack.documentName;

    // We only need to do the General Equipment compendium for this specific migration
    if (pack.metadata.label !== "Equipment - General") {
      continue
    }

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
            // Migrate the actor document's items if any exist
            // if (doc.items) {
            //   for (let item of doc.items) {
            //     // Update the embedded item document
            //     if ( item.type === "feature" && (item.system.formula == null || item.system.formula == undefined || item.system.formula == "undefined" || item.system.formula == "") ) {
            //       console.log(`Migrating item ${item.name}...`, item)
            //       doc.updateEmbeddedDocuments("Item", [
            //         { _id: item.id, "system.blindRoll": null, "system.rollMode": "" },
            //       ])
            //     } else if ( item.type === "feature" && (item.system.blindRoll === "false" || item.system.blindRoll === false) ) {
            //       console.log(`Migrating item ${item.name}...`, item)
            //       doc.updateEmbeddedDocuments("Item", [
            //         { _id: item.id, "system.rollMode": "publicroll" },
            //       ])
            //     } else if ( item.type === "feature" && (item.system.blindRoll === "true" || item.system.blindRoll === true) ) {
            //       console.log(`Migrating item ${item.name}...`, item)
            //       doc.updateEmbeddedDocuments("Item", [
            //         { _id: item.id, "system.rollMode": "blindroll" },
            //       ])
            //     }
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
        err.message = `Failed Hyp3e system migration for document ${doc.name} in pack ${pack.collection}: ${err.message}`;
        console.error(err);
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
  const command = `game.hyp3e.rollItemMacro("${data.uuid}");`;
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
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then(item => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
    }

    // Trigger the item roll
    item.roll();
  });
}