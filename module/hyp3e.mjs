// Import document classes.
import { Hyp3eActor } from "./documents/actor.mjs";
import { Hyp3eItem } from "./documents/item.mjs";
// Import sheet classes.
import { Hyp3eActorSheet } from "./sheets/actor-sheet.mjs";
import { Hyp3eItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { HYP3E } from "./helpers/config.mjs";

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
  // Languages
  game.settings.register(game.system.id, "languages", {
    name: game.i18n.localize("HYP3E.settings.languages"),
    hint: game.i18n.localize("HYP3E.settings.languagesHint"),
    default: "Common, Berber, Esquimaux (Coastal), Esquimaux (Tundra), Esquimaux-Ixian (pidgin), Hellenic (Amazon), Hellenic (Atlantean), Hellenic (Greek), Hellenic (Hyperborean), Hellenic (Kimmerian), Keltic (Goidelic), Keltic (Pictish), Latin, Lemurian, Muat, Old Norse (Anglo-Saxon), Old Norse (Viking), Oonat, Thracian (Ixian), Thracian (Kimmerian), Tlingit, Uralic (Lapp), Uralic (Yakut)",
    scope: "world",
    type: String,
    config: true,
  });
  // Classes
  game.settings.register(game.system.id, "characterClasses", {
    name: game.i18n.localize("HYP3E.settings.characterClasses"),
    hint: game.i18n.localize("HYP3E.settings.characterClassesHint"),
    default: "Cleric, Fighter, Magician, Thief, Druid, Monk, Priest, Runegraver, Shaman, Barbarian, Berserker, Cataphract, Huntsman, Paladin, Ranger, Warlock, Cryomancer, Illusionist, Necromancer, Pyromancer, Witch, Assassin, Bard, Legerdemainist, Purloiner, Scout",
    scope: "world",
    type: String,
    config: true,
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
  const languages = game.settings.get(game.system.id, "languages");
  if (languages != "") {
    const langArray = languages.split(",");
    langArray.forEach((l, i) => (langArray[i] = l.trim()));
    CONFIG.HYP3E.languages = langArray;
    // console.log("CONFIG Languages:", CONFIG.HYP3E.languages)
  }
  const characterClasses = game.settings.get(game.system.id, "characterClasses");
  if (characterClasses != "") {
    const classArray = characterClasses.split(",");
    classArray.forEach((l, i) => (classArray[i] = l.trim()));
    CONFIG.HYP3E.characterClasses = classArray;
    // console.log("CONFIG Classes:", CONFIG.HYP3E.characterClasses)
  }

  // If we need to do a system migration,  do it after the other settings are loaded
  if (game.user.isGM) {
    const currentVersion = game.system.version
    console.log(`System version ${currentVersion}`)
    // No need to migrate if system version is x.x.x or higher
    const NEEDS_MIGRATION_TO_VERSION = "0.9.5"
    const needsMigration = !currentVersion || isNewerVersion(NEEDS_MIGRATION_TO_VERSION, currentVersion)
    if (needsMigration) {
      migrateWorld()
    }
  }

});

/* -------------------------------------------- */
/*  Migrate system/world functions              */
/* -------------------------------------------- */
async function migrateWorld() {
  console.log(`Migrating world ${game.system.version}...`)

  // Migrate Actor directory
  for (let actor of game.actors.contents) {
    const updateData = migrateActorData(actor)
    if (!foundry.utils.isEmpty(updateData)) {
      // Update the actor
      console.log("Migrated actor:", updateData)
      await actor.update(updateData)
    }

    // Next we migrate the actor's items
    if (actor.items) {
      let updateItem = {}
      for (let item of actor.items) {
        console.log(`Migrating item ${item.name}...`)
        updateItem = migrateActorItem(item)
        if (!foundry.utils.isEmpty(updateItem)) {
          console.log("Updated item:", updateItem)
          await item.update(updateItem)
        }
      }
    }
  }

  // Migrate Actor compendia
  for (let pack of game.packs) {
    console.log(`Compendium pack ${pack.metadata.label}:`, pack)

    const packType = pack.metadata.type
    // Skip anything that's not an Actor compendium pack
    if (packType != "Actor") {
      continue
    }

    // Get the compendium's locked property, then unlock it
    const wasLocked = pack.locked
    await pack.configure({ locked: false })

    console.log(`Migrating compendium pack ${pack.metadata.label}...`)
    await pack.migrate()

    const documents = await pack.getDocuments()
    for (let doc of documents) {
      console.log("Compendium document:", doc)
      let updateData = {}

      switch(packType) {
        case "Actor":
          updateData = migrateActorData(document)
          break
        default:
          break
      }
      if (!foundry.utils.isEmpty(updateData)) {
        console.log("Updated document:", updateData)
        await doc.update(updateData)
      }
      // Next we migrate the actor document's items
      if (doc.items) {
        let updateItem = {}
        for (let item of doc.items) {
          console.log(`Migrating item ${item.name}...`)
          updateItem = migrateActorItem(item)
          if (!foundry.utils.isEmpty(updateItem)) {
            console.log("Updated item:", updateItem)
            await item.update(updateItem)
          }
        }
      }

    }
    // Re-lock the compendium if it was locked before
    await pack.configure({ locked: wasLocked })

  }

}

async function migrateActorData(actor) {
  let updateData = {}

  // Update characters
  if (actor.type == "character") {
    console.log(`Migrating character ${actor.name}...`)
    // Nothing to do yet
  }

  // Update monsters & NPCs
  if (actor.type == "npc") {
    console.log(`Migrating monster/npc ${actor.name}...`)
    // Nothing to do yet
  }
  
  // Return the updated actor data
  return updateData
}

function migrateActorItem(item) {
  let updateData = {}

  if (item.type == "weapon" && (!item.system.formula || item.system.formula == "" || item.system.formula == "1d20 + @fa")) {
    console.log("Updating weapon attack formula...")
    updateData["system.formula"] = "1d20 + @fa + @str.atkMod + @item.atkMod"
  }

  return updateData
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