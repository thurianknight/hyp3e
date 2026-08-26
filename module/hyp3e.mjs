// Import datamodels
import * as HYP3E_DATA_MODELS from "./data/_module.mjs";
// Import document classes
import { Hyp3eActor } from "./documents/actor.mjs";
import { Hyp3eItem } from "./documents/item.mjs";
// Import sheet classes
import { Hyp3eActorSheetV2 } from "./sheets/actor-sheet-v2.mjs";
import { Hyp3eItemSheetV2 } from "./sheets/item-sheet-v2.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { HYP3E } from "./helpers/config.mjs";
import { addChatMessageButtons, truncateLongContent } from "./chat/chat.mjs";
import { setupEffectHandlers, pushCustomStatusEffects } from "./helpers/effects.mjs";
import { getAvailableTokenNumber, 
      isTokenInCombat, 
      getTokenActor, 
      getTokenCombatant, 
      overlayEquippedWeaponAndShield } from "./helpers/tokens.mjs";
import { HYP3ECustomClassList } from "./apps/class-list.mjs";
import { migrateActorData, 
      updateWeaponMasteries,
      migrateItemData, 
      fixTokenSize,
      migrateActorEffects,
      migrateItemEffects,
      migrateCustomClasses } from "./helpers/data-migrations.mjs"
import { HYP3ETurnTracker, 
      setupTurnTrackerHooks } from "./helpers/turn-tracker.mjs";
import { HYP3ETurnTrackerAppV2 } from "./apps/turn-tracker-app-v2.mjs";
import { HYP3ECalendar, 
      setupCalendarHooks } from "./helpers/calendar.mjs";
import { HYP3ECalendarApp } from "./apps/calendar-app.mjs";
import { HYP3EQuickEquipApp } from "./apps/quick-equip-app.mjs";
import { Hyp3eLogger } from "./helpers/logger.mjs";
import { registerHyp3eConfigurations } from "./helpers/register-config.mjs";
import { applyChatFontSizeSetting } from "./chat/chat.mjs";
import { getClassTemplate, getClassTemplateNames, findItemsByFolderOrCompendiumName, getJournalPageList } from "./helpers/folders-and-compendia.mjs"

// Set this now, to use later
let trackerInitialized = false;

/* -------------------------------------------- */
/*  Init Hook                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {
  // Log game and system information
  console.log("Game info:", game);
  console.log("System info:", game.system);
  console.log("Foundry version:", game.version);
  // Get the Foundry version for conditional options
  const majorVersion = Number(game.version?.split(".")[0] ?? game.data.version.split(".")[0]);

  // Add custom constants for configuration
  CONFIG.HYP3E = HYP3E;

  // Disable legacy effect transferral
  if (CONFIG.ActiveEffect?.legacyTransferral) {
    CONFIG.ActiveEffect.legacyTransferral = false;
  }

  // CONFIG.debug.time = true; // Enable timing debug logs
  CONFIG.time = foundry.utils.mergeObject(CONFIG.time, {
    // How many seconds in a "combat round"
    roundTime: 10,  // 10 seconds per round
    "worldCalendarConfig.name": "Hyperborean Calendar",
    "worldCalendarConfig.description": "The calendar used in the world of Hyperborea, consisting of 13 months of 28 days each, with no leap years.",
    "worldCalendarConfig.days.daysPerYear": 364, // 364 days in a year (13 months of 28 days)
    "worldCalendarConfig.days.values": [
      CONFIG.HYP3E.calendar.days.sun,
      CONFIG.HYP3E.calendar.days.earth,
      CONFIG.HYP3E.calendar.days.sea,
      CONFIG.HYP3E.calendar.days.moon,
      CONFIG.HYP3E.calendar.days.star,
      CONFIG.HYP3E.calendar.days.sky,
      CONFIG.HYP3E.calendar.days.saturn
    ],
    "worldCalendarConfig.months.values": [
      CONFIG.HYP3E.calendar.months.I,
      CONFIG.HYP3E.calendar.months.II,
      CONFIG.HYP3E.calendar.months.III,
      CONFIG.HYP3E.calendar.months.IV,
      CONFIG.HYP3E.calendar.months.V,
      CONFIG.HYP3E.calendar.months.VI,
      CONFIG.HYP3E.calendar.months.VII,
      CONFIG.HYP3E.calendar.months.VIII,
      CONFIG.HYP3E.calendar.months.IX,
      CONFIG.HYP3E.calendar.months.X,
      CONFIG.HYP3E.calendar.months.XI,
      CONFIG.HYP3E.calendar.months.XII,
      CONFIG.HYP3E.calendar.months.XIII
    ],
    "worldCalendarConfig.years.leapYear": { leapInterval: 0, leapStart: 0 }, // No leap years
    "worldCalendarConfig.years.yearZero": 1, // Year 1 is the first year of the calendar
    "worldCalendarConfig.seasons": {}, // Seasons are years-long, not relevant to timekeeping
  });
  console.log("CONFIG.time:", CONFIG.time);

  // Temporary Effects should be deleted when they expire
  CONFIG.ActiveEffect.expiryAction = "delete";

  // Register our Hyperborea system configuration options
  registerHyp3eConfigurations();

  // Build a list of custom status effects and add to the CONFIG.statusEffects array
  pushCustomStatusEffects();

  // Register data models for Actors and Items. This replaces the "template.json" system.
  // Actors
  CONFIG.Actor.dataModels.character     = HYP3E_DATA_MODELS.Hyp3eCharacter;
  CONFIG.Actor.dataModels.npc           = HYP3E_DATA_MODELS.Hyp3eNPC;
  CONFIG.Actor.dataModels.merchant      = HYP3E_DATA_MODELS.Hyp3eMerchant;
  CONFIG.Actor.dataModels.treasure      = HYP3E_DATA_MODELS.Hyp3eTreasure;
  CONFIG.Actor.dataModels.itemToken     = HYP3E_DATA_MODELS.Hyp3eItemToken;

  // Items
  CONFIG.Item.dataModels.armor          = HYP3E_DATA_MODELS.Hyp3eArmor;
  CONFIG.Item.dataModels.shield         = HYP3E_DATA_MODELS.Hyp3eShield;
  CONFIG.Item.dataModels.weapon         = HYP3E_DATA_MODELS.Hyp3eWeapon;
  CONFIG.Item.dataModels.spell          = HYP3E_DATA_MODELS.Hyp3eSpell;
  CONFIG.Item.dataModels.feature        = HYP3E_DATA_MODELS.Hyp3eFeature;
  CONFIG.Item.dataModels.item           = HYP3E_DATA_MODELS.Hyp3eItem;
  CONFIG.Item.dataModels.classTemplate  = HYP3E_DATA_MODELS.Hyp3eClassTemplate;
  CONFIG.Item.dataModels.effectTemplate = HYP3E_DATA_MODELS.Hyp3eEffectTemplate;

  console.log("Hyperborea | DataModels registered - template.json no longer used.");

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.hyp3e = {
    Hyp3eActor,
    Hyp3eItem,
    rollItemMacro
  };

  // Set chat font size from Hyp3e config
  applyChatFontSizeSetting();

  // Define custom Document classes
  CONFIG.Actor.documentClass = Hyp3eActor;
  CONFIG.Item.documentClass = Hyp3eItem;

  // Register sheet application classes
  foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
  foundry.documents.collections.Actors.registerSheet("hyp3e", Hyp3eActorSheetV2, { 
    makeDefault: true,
    defaultTheme: "default",
    themes: Hyp3eActorSheetV2.themes
  });
  // Hyp3eLogger.info("Init", "Registered Hyp3eActorSheetV2");
  foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  foundry.documents.collections.Items.registerSheet("hyp3e", Hyp3eItemSheetV2, { makeDefault: true });
  // Hyp3eLogger.info("Init", "Registered Hyp3eItemSheetV2");


  // Get initiative mode: group vs. individual
  const initiativeType = game.settings.get(game.system.id, "initiativeType");

  // Load combat classes
  const { HYP3ECombat } = await import( "./combat/combat.mjs");
  const { HYP3ECombatant } = await import( "./combat/combatant.mjs");
  const { HYP3EGroupCombat } = await import( "./combat/combat-group.mjs" );
  const { HYP3EGroupCombatant } = await import( "./combat/combatant-group.mjs");
  // Initiative roll is the same d6, regardless of group/individual
  CONFIG.Combat.initiative = { decimals: 3, formula: HYP3ECombat.FORMULA }
  // Set the Combat and Combatant document classes based on initiative mode
  // if (isGroupInitiative) {
  switch (initiativeType) {
  case "group":
    Hyp3eLogger.info("Init", "Group-based combat initiative:", CONFIG.Combat.initiative);
    CONFIG.Combat.documentClass = HYP3EGroupCombat;
    CONFIG.Combatant.documentClass = HYP3EGroupCombatant;
    break;
  case "phased":
    Hyp3eLogger.info("Init", "Phased combat initiative:", CONFIG.Combat.initiative);
    CONFIG.Combat.documentClass = HYP3EGroupCombat;
    CONFIG.Combatant.documentClass = HYP3EGroupCombatant;
    break;
  case "individual":
    Hyp3eLogger.info("Init", "Individual combat initiative:", CONFIG.Combat.initiative);
    CONFIG.Combat.documentClass = HYP3ECombat;
    CONFIG.Combatant.documentClass = HYP3ECombatant;
    break;
  }

  // Load v13+ compatible Combat Tracker class
  const { HYP3ECombatTracker } = await import( "./combat/combat-tracker-v13.mjs");
  CONFIG.ui.combat = HYP3ECombatTracker;

  /* -------------------------------------------- */
  /*  Handlebars Helpers              */
  /* -------------------------------------------- */

  // Normalize anything to a number: handles numbers, strings, and comma/space-separated strings
  const normalizeNumber = val => {
    if (val == null) return 0;
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      val = val.replace(/[\s,\u00A0\u202F]+/g, ""); // strip spaces, commas, NBSPs
      const num = Number(val);
      if (!isNaN(num)) return num;
    }
    return 0;
  };

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper("formatNumber", function(value) {
    if (isNaN(value)) return value;
    return Number(value).toLocaleString();
  });

  Handlebars.registerHelper("gteNum", function (a, b) {
    const numA = normalizeNumber(a);
    const numB = normalizeNumber(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) return false;
    return numA >= numB;
  });

  Handlebars.registerHelper("gtNum", function (a, b) {
    const numA = normalizeNumber(a);
    const numB = normalizeNumber(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) return false;
    return numA > numB;
  });

  Handlebars.registerHelper("lteNum", function (a, b) {
    const numA = normalizeNumber(a);
    const numB = normalizeNumber(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) return false;
    return numA <= numB;
  });

  Handlebars.registerHelper("ltNum", function (a, b) {
    const numA = normalizeNumber(a);
    const numB = normalizeNumber(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) return false;
    return numA < numB;
  });

  Handlebars.registerHelper('add', function(num1, num2) {
    return num1 + num2
  });

  Handlebars.registerHelper('subtract', function(num1, num2) {
    return num1 - num2
  });

  Handlebars.registerHelper('isMin', function(val) {
    return val == 1 ? "min" : ""
  });

  Handlebars.registerHelper('isMax', function(val, maxVal) {
    return val == maxVal ? "max" : ""
  });

  Handlebars.registerHelper("capitalizeWords", function (str) {
    if (typeof str !== "string") return "";
    return str.replace(/\b\w/g, c => c.toUpperCase());
  });

  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('isLongContent', function(content) {
    return content?.length > 100; // Tune this threshold
  });

  Handlebars.registerHelper('ifInList', function(str, arr, options) {
    console.log("ifInList helper called with str:", str, "arr:", arr);
    if (arr.includes(str)) {
      return options.fn(this)
    }
    return options.inverse(this);
  });

  Handlebars.registerHelper('lookup', function(obj, key) {
    return obj?.[key];
  });

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });

  // Register a safe JSON helper for Handlebars templates
  Handlebars.registerHelper("json", function(context) {
    return new Handlebars.SafeString(JSON.stringify(context));
  });

  // Preload Handlebars templates
  return await preloadHandlebarsTemplates();

});

/* -------------------------------------------- */
/*  Ready Hook                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    // We only override Item drops
    if (data.type !== "Item") {
      return; // allow core Foundry behavior
    }
    // Handle this Item drop
    createItemMacro(data, slot);
    return false;
  });

  // Get Foundry major version #
  const majorVersion = Number(game.version?.split(".")[0] ?? game.data.version.split(".")[0]);
  // Get Hyperborea system version
  const currentVersion = game.system.version

  // Register effects handlers
  await setupEffectHandlers();

  /**
   * Load system settings
   */
  const logLevel = game.settings.get(game.system.id, "logLevel");
  CONFIG.HYP3E.logLevel = logLevel;

  // Automatic attribute modifier calculation
  const autoCalcAttrMods = game.settings.get(game.system.id, "autoCalcAttrMods");
  CONFIG.HYP3E.autoCalcAttrMods = autoCalcAttrMods;
  Hyp3eLogger.info("Init", "CONFIG Automatic attribute modifier calculation:", CONFIG.HYP3E.autoCalcAttrMods);

  // Automatic Thief ability target calculation
  const autoCalcThiefTn = game.settings.get(game.system.id, "autoCalcThiefTn");
  CONFIG.HYP3E.autoCalcThiefTn = autoCalcThiefTn;
  Hyp3eLogger.info("Init", "CONFIG Automatic Thief ability target calculation:", CONFIG.HYP3E.autoCalcThiefTn);

  // Automatically calculate AC
  const autoCalcAc = game.settings.get(game.system.id, "autoCalcAc");
  CONFIG.HYP3E.autoCalcAc = autoCalcAc;
  Hyp3eLogger.info("Init", "CONFIG Auto-calculate AC:", CONFIG.HYP3E.autoCalcAc);

  // Enforce weapon equippage rules
  const enforceWeaponEquipRules = game.settings.get(game.system.id, "enforceWeaponEquipRules");
  CONFIG.HYP3E.enforceWeaponEquipRules = enforceWeaponEquipRules;
  Hyp3eLogger.info("Init", "CONFIG Enforce weapon equippage rules:", CONFIG.HYP3E.enforceWeaponEquipRules);

  // Show weapon/shield overlay
  const showWeaponOverlay = game.settings.get(game.system.id, "showWeaponOverlay");
  CONFIG.HYP3E.showWeaponOverlay = showWeaponOverlay;
  Hyp3eLogger.info("Init", "CONFIG Show weapon/shield token overlay:", CONFIG.HYP3E.showWeaponOverlay);

  // Enable basic attribute checks
  const enableAttrChecks = game.settings.get(game.system.id, "enableAttrChecks");
  CONFIG.HYP3E.enableAttrChecks = enableAttrChecks;
  Hyp3eLogger.info("Init", "CONFIG Enable basic attribute checks:", CONFIG.HYP3E.enableAttrChecks);

  // Reverse situational modifiers on roll-under checks
  const flipRollUnderMods = game.settings.get(game.system.id, "flipRollUnderMods");
  CONFIG.HYP3E.flipRollUnderMods = flipRollUnderMods;
  Hyp3eLogger.info("Init", "CONFIG Reverse situational modifiers on roll-under checks:", CONFIG.HYP3E.flipRollUnderMods);

  // Enable encumbrance calculations applied to characters
  const enableEncumbrance = game.settings.get(game.system.id, "enableEncumbrance");
  CONFIG.HYP3E.enableEncumbrance = enableEncumbrance;
  Hyp3eLogger.info("Init", "CONFIG Enable encumbrance calculations applied to characters:", CONFIG.HYP3E.enableEncumbrance);
  
  // Enable coin weight (100 coins = 1 lb)
  const enableCoinWeight = game.settings.get(game.system.id, "enableCoinWeight");
  CONFIG.HYP3E.enableCoinWeight = enableCoinWeight;
  Hyp3eLogger.info("Init", "CONFIG Enable coin weight:", CONFIG.HYP3E.enableCoinWeight);

  // GM-defined strength multiplier for encumbered status
  const encumbered = game.settings.get(game.system.id, "encumbered");
  CONFIG.HYP3E.encumbered = encumbered;
  Hyp3eLogger.info("Init", "CONFIG Strength multiplier for encumbered status:", CONFIG.HYP3E.encumbered);

  // GM-defined strength multiplier for heavily encumbered status
  const heavilyEncumbered = game.settings.get(game.system.id, "heavilyEncumbered");
  CONFIG.HYP3E.heavilyEncumbered = heavilyEncumbered;
  Hyp3eLogger.info("Init", "CONFIG Strength multiplier for heavily encumbered status:", CONFIG.HYP3E.heavilyEncumbered);

  // Require fuel for light sources
  const requireLightSourceFuel = game.settings.get(game.system.id, "requireLightSourceFuel");
  CONFIG.HYP3E.requireLightSourceFuel = requireLightSourceFuel;
  Hyp3eLogger.info("Init", "CONFIG Require fuel for light sources:", CONFIG.HYP3E.requireLightSourceFuel);

  // Initiative type: group, phased, or individual
  const initiativeType = game.settings.get(game.system.id, "initiativeType");
  CONFIG.HYP3E.initiativeType = initiativeType;
  Hyp3eLogger.info("Init", "CONFIG combat initiative type:", CONFIG.HYP3E.initiativeType);

  // Apply death when the round ends
  const resolveDeathAtRoundEnd = game.settings.get(game.system.id, "resolveDeathAtRoundEnd");
  CONFIG.HYP3E.resolveDeathAtRoundEnd = resolveDeathAtRoundEnd;
  Hyp3eLogger.info("Init", "CONFIG only apply unconscious/death when round ends:", CONFIG.HYP3E.resolveDeathAtRoundEnd);

  // Limit token movement to actor MV base
  if (majorVersion >= 13) {
    const limitMovement = game.settings.get(game.system.id, "limitMovement");
    CONFIG.HYP3E.limitMovement = limitMovement;
    Hyp3eLogger.info("Init", "CONFIG Limit token movement to actor MV base:", CONFIG.HYP3E.limitMovement);
  }

  // Force range limitations on weapon & spell attacks
  const forceRangeLimit = game.settings.get(game.system.id, "forceRangeLimit");
  CONFIG.HYP3E.forceRangeLimit = forceRangeLimit;
  Hyp3eLogger.info("Init", "CONFIG Force range limitations on weapon & spell attacks:", CONFIG.HYP3E.forceRangeLimit);

  // Force weapon equippage to use
  const forceWeaponEquip = game.settings.get(game.system.id, "forceWeaponEquip");
  CONFIG.HYP3E.forceWeaponEquip = forceWeaponEquip;
  Hyp3eLogger.info("Init", "CONFIG Force item equippage to use:", CONFIG.HYP3E.forceWeaponEquip);

  // Force spell memorization to cast
  const forceSpellMemorize = game.settings.get(game.system.id, "forceSpellMemorize");
  CONFIG.HYP3E.forceSpellMemorize = forceSpellMemorize;
  Hyp3eLogger.info("Init", "CONFIG Force spell memorization to cast:", CONFIG.HYP3E.forceSpellMemorize);

  // Enable combat situational modifier detection
  const enableCombatSitModDetection = game.settings.get(game.system.id, "enableCombatSitModDetection");
  CONFIG.HYP3E.enableCombatSitModDetection = enableCombatSitModDetection;
  Hyp3eLogger.info("Init", "CONFIG Enable combat situational modifier detection:", CONFIG.HYP3E.enableCombatSitModDetection);

  // Enable advanced combat options declaration
  const enableAdvancedCombatOptions = game.settings.get(game.system.id, "enableAdvancedCombatOptions");
  CONFIG.HYP3E.enableAdvancedCombatOptions = enableAdvancedCombatOptions;
  Hyp3eLogger.info("Init", "CONFIG Enable advanced combat options declaration:", CONFIG.HYP3E.enableAdvancedCombatOptions);

  // Enable critical hit rolls
  const critHit = game.settings.get(game.system.id, "critHit");
  CONFIG.HYP3E.critHit = critHit;
  Hyp3eLogger.info("Init", "CONFIG Enable critical hit rolls:", CONFIG.HYP3E.critHit);

  // Enable critical miss rolls
  const critMiss = game.settings.get(game.system.id, "critMiss");
  CONFIG.HYP3E.critMiss = critMiss;
  Hyp3eLogger.info("Init", "CONFIG Enable critical miss rolls:", CONFIG.HYP3E.critMiss);

  // Load races list
  const races = game.settings.get(game.system.id, "races");
  if (races != "") {
    CONFIG.HYP3E.races = {}
    const racesArray = races.split(",");
    racesArray.forEach((l, i) => (CONFIG.HYP3E.races[l.trim()] = l.trim()));
    Hyp3eLogger.info("Init", "CONFIG Races:", CONFIG.HYP3E.races);
  }

  // Load language list
  const languages = game.settings.get(game.system.id, "languages");
  if (languages != "") {
    CONFIG.HYP3E.languages = {}
    const langArray = languages.split(",");
    langArray.forEach((l, i) => (CONFIG.HYP3E.languages[l.trim()] = l.trim()));
    Hyp3eLogger.info("Init", "CONFIG Languages:", CONFIG.HYP3E.languages);
  }

  // Load class list
  CONFIG.HYP3E.characterClasses = {}
  const characterClasses = await getClassTemplateNames(); // Returns an array of class template names from world and compendia
  if (characterClasses.length > 0) {
    characterClasses.forEach((l, i) => (CONFIG.HYP3E.characterClasses[l.trim()] = l.trim()));
    Hyp3eLogger.info("Init", "CONFIG Classes:", CONFIG.HYP3E.characterClasses);
  }

  // Load Phenotypes list
  const phenotypes = game.settings.get(game.system.id, "phenotypes");
  if (phenotypes != "") {
    CONFIG.HYP3E.phenotypes = {}
    const phenotypesArray = phenotypes.split(",");
    phenotypesArray.forEach((l, i) => (CONFIG.HYP3E.phenotypes[l.trim()] = l.trim()));
    Hyp3eLogger.info("Init", "CONFIG Phenotypes:", CONFIG.HYP3E.phenotypes);
  }

  // Load Spell Lists list
  const spellLists = game.settings.get(game.system.id, "spellLists");
  if (spellLists != "") {
    CONFIG.HYP3E.spellLists = {}
    const spellListsArray = spellLists.split(",");
    spellListsArray.forEach((l, i) => (CONFIG.HYP3E.spellLists[l.trim()] = l.trim()));
    Hyp3eLogger.info("Init", "CONFIG Spell Lists:", CONFIG.HYP3E.spellLists);
  }

  // Load Weapons list
  const weaponsList = game.settings.get(game.system.id, "weapons");
  if (weaponsList != "") {
    CONFIG.HYP3E.weapons = [];
    const weaponsArray = weaponsList.split(";");
    weaponsArray.forEach((l, i) => CONFIG.HYP3E.weapons.push(l.trim()));
    Hyp3eLogger.info("Init", "CONFIG Weapons:", CONFIG.HYP3E.weapons);
  }

  // Load saving throws
  if (CONFIG.HYP3E.saves) {
    delete CONFIG.HYP3E.saves["base"];
    for (let [k, v] of Object.entries(CONFIG.HYP3E.saves)) {
      CONFIG.HYP3E.saves[k] = game.i18n.localize(CONFIG.HYP3E.saves[k])
    }
    Hyp3eLogger.info("Init", "CONFIG Saves:", CONFIG.HYP3E.saves);
  }

  // Load creature sizes
  if (CONFIG.HYP3E.creatureSizes) {
    for (let [k, v] of Object.entries(CONFIG.HYP3E.creatureSizes)) {
      CONFIG.HYP3E.creatureSizes[k] = game.i18n.localize(CONFIG.HYP3E.creatureSizes[k])
    }
    Hyp3eLogger.info("Init", "CONFIG Creature Sizes:", CONFIG.HYP3E.creatureSizes);
  }

  // Load weapon types
  if (CONFIG.HYP3E.weaponTypes) { 
    for (let [k, v] of Object.entries(CONFIG.HYP3E.weaponTypes)) {
      CONFIG.HYP3E.weaponTypes[k] = game.i18n.localize(CONFIG.HYP3E.weaponTypes[k])
    }
    Hyp3eLogger.info("Init", "CONFIG Weapon Types:", CONFIG.HYP3E.weaponTypes);
  }

  // Load weapon annotations
  if (CONFIG.HYP3E.weaponAnnotations) { 
    for (let [k, v] of Object.entries(CONFIG.HYP3E.weaponAnnotations)) {
      CONFIG.HYP3E.weaponAnnotations[k] = game.i18n.localize(CONFIG.HYP3E.weaponAnnotations[k])
    }
    Hyp3eLogger.info("Init", "CONFIG Weapon Annotations:", CONFIG.HYP3E.weaponAnnotations);
  }

  // Load damage types
  if (CONFIG.HYP3E.damageTypes) { 
    for (let [k, v] of Object.entries(CONFIG.HYP3E.damageTypes)) {
      CONFIG.HYP3E.damageTypes[k] = game.i18n.localize(CONFIG.HYP3E.damageTypes[k])
    }
    Hyp3eLogger.info("Init", "CONFIG Damage Types:", CONFIG.HYP3E.damageTypes);
    // Append additional damage types
    const addlDamageTypes = (game.settings.get(game.system.id, "addlDamageTypes")).trim();
    if (addlDamageTypes != "") {
      const addlDamageTypesArray = addlDamageTypes.split(",");
      addlDamageTypesArray.forEach((l, i) => (CONFIG.HYP3E.damageTypes[l.trim()] = l.trim()));
    }
  }

  // Load armor types
  if (CONFIG.HYP3E.armorTypes) { 
    for (let [k, v] of Object.entries(CONFIG.HYP3E.armorTypes)) {
      CONFIG.HYP3E.armorTypes[k] = game.i18n.localize(CONFIG.HYP3E.armorTypes[k])
    }
    Hyp3eLogger.info("Init", "CONFIG Armor Types:", CONFIG.HYP3E.armorTypes);
  }

  // Load item lists from the Hyp3e Core compendium and other compendia
  const armorNames = await getJournalPageList("Equipment Lists", "Armour", "Armour");
  Hyp3eLogger.info("Init", `Retrieved armor names from Core Journal:`, armorNames);
  const compendiumArmor = await findItemsByFolderOrCompendiumName("armor, armour, shield, shields", "armor", "magic, magical");
  Hyp3eLogger.info("Init", `Retrieved compendium armor names:`, compendiumArmor);
  const allArmor = [...new Set([...armorNames, ...compendiumArmor])].sort();
  Hyp3eLogger.info("Init", `Core Journal and compendia armor list compiled:`, allArmor);
  CONFIG.HYP3E.armorList = allArmor;

  const shieldNames = await getJournalPageList("Equipment Lists", "Armour", "Shields");
  Hyp3eLogger.info("Init", `Retrieved shield names from Core Journal:`, shieldNames);
  const compendiumShields = await findItemsByFolderOrCompendiumName("armor, armour, shield, shields", "shield", "magic, magical");
  Hyp3eLogger.info("Init", `Retrieved compendium shield names:`, compendiumShields);
  const allShields = [...new Set([...shieldNames, ...compendiumShields])].sort();
  Hyp3eLogger.info("Init", `Core Journal and compendia shield list compiled:`, allShields);
  CONFIG.HYP3E.shieldList = allShields;

  const weaponMeleeNames = await getJournalPageList("Equipment Lists", "Weapons", "Melee");
  Hyp3eLogger.info("Init", `Retrieved melee weapons from Core Journal:`, weaponMeleeNames);
  const weaponMissileNames = await getJournalPageList("Equipment Lists", "Weapons", "Missile");
  Hyp3eLogger.info("Init", `Retrieved missile weapons from Core Journal:`, weaponMissileNames);
  const compendiumWeapons = await findItemsByFolderOrCompendiumName("weapons, melee, missile, ammunition", "weapon", "magic, magical");
  const allWeapons = [...new Set([...weaponMeleeNames, ...weaponMissileNames, ...compendiumWeapons])].sort();
  Hyp3eLogger.info("Init", `Core Journal and compendia weapons list compiled:`, allWeapons);
  CONFIG.HYP3E.weaponsList = allWeapons;

  const clothingNames = await getJournalPageList("Equipment Lists", "Equipment", "Clothing");
  Hyp3eLogger.info("Init", `Retrieved clothing from Core Journal:`, clothingNames);
  const ammunitionNames = await getJournalPageList("Equipment Lists", "Weapons", "Ammunition");
  Hyp3eLogger.info("Init", `Retrieved ammunition from Core Journal:`, ammunitionNames);
  const gearNames = await getJournalPageList("Equipment Lists", "Equipment", "General");
  Hyp3eLogger.info("Init", `Retrieved equipment/gear from Core Journal:`, gearNames);
  const compendiumGear = await findItemsByFolderOrCompendiumName("equipment, gear, general, clothing, weapons, ammunition", "item", "religious, religion, provisions, provision, food, supplies, magic, magical");
  const allGear = [...new Set([...clothingNames, ...ammunitionNames, ...gearNames, ...compendiumGear])].sort();
  Hyp3eLogger.info("Init", `Core Journal and compendia equipment list compiled:`, allGear);
  CONFIG.HYP3E.gearList = allGear;

  const provisionNames = await getJournalPageList("Equipment Lists", "Equipment", "Provisions");
  Hyp3eLogger.info("Init", `Retrieved provisions from Core Journal:`, provisionNames);
  const compendiumProvisions = await findItemsByFolderOrCompendiumName("equipment, provision, provisions, food, supplies", "item", "clothing, gear, general, religious, religion, magic, magical");
  const allProvisions = [...new Set([...provisionNames, ...compendiumProvisions])].sort();
  Hyp3eLogger.info("Init", `Core Journal and compendia provisions list compiled:`, allProvisions);
  CONFIG.HYP3E.provisionsList = allProvisions;

  const religiousNames = await getJournalPageList("Equipment Lists", "Equipment", "Religious");
  Hyp3eLogger.info("Init", `Retrieved religious items from Journal:`, religiousNames);
  const compendiumReligious = await findItemsByFolderOrCompendiumName("equipment, religious, religion", "item", "clothing, gear, general, provisions, provision, food, supplies, magic, magical");
  const allReligious = [...new Set([...religiousNames, ...compendiumReligious])].sort();
  Hyp3eLogger.info("Init", `Core Journal and compendia religious items list compiled:`, allReligious);
  CONFIG.HYP3E.religiousList = allReligious;

  // If we need to do a system setup or migration, do it after the other settings are loaded
  if (game.user.isGM) {
    // Initial game setup for new worlds or missing data
    const setupComplete = game.settings.get(game.system.id, `setupComplete`);
    const rerunSetup = game.settings.get(game.system.id, `reRunSetup`);
    if (!setupComplete || rerunSetup) {
      Hyp3eLogger.info("Init", "Running one-time system setup...");
      await setupSystem();
      await game.settings.set(game.system.id, `setupComplete`, true);
      await game.settings.set(game.system.id, `reRunSetup`, false);
      Hyp3eLogger.info("Init", "System setup complete.");
    } else {
      Hyp3eLogger.info("Init", "System setup has been run before, no need to do it again.");
    }

    // Data migration for version updates and patches
    const reRunMigration = game.settings.get(game.system.id, `reRunMigration`);
    const migrationHasRun = game.settings.get(game.system.id, `migration-${currentVersion}-ran`);
    // const migrationHasRun = false  // FOR DEBUGGING, TO FORCE A RE-RUN
    if (!migrationHasRun || reRunMigration) {
      Hyp3eLogger.info("Init", "Running one-time migration...");

      // Do the world migration
      await migrateWorld();

      // Set the flags so it doesn't run again
      await game.settings.set(game.system.id, `migration-${currentVersion}-ran`, true);
      await game.settings.set(game.system.id, `reRunMigration`, false);
      Hyp3eLogger.info("Init", "Migration complete.");
    } else {
      Hyp3eLogger.info("Init", "Migration has been run before, no need to do it again.");
    }
  }

  // Setup a game.hyp3e property to contain our calendar and turn tracker
  game.hyp3e = game.hyp3e || {};

  // Initialize the calendar app
  try {
    game.hyp3e.calendar = new HYP3ECalendarApp();
    game.hyp3e.openCalendar = () => game.hyp3e.calendar.render(true);
  } catch (err) {
    Hyp3eLogger.error("Init", `Error initializing calendar app.`, err.message)
  }
  // Import the calendar class methods
  game.hyp3e.calendar.calculateSecondsSinceEpoch = (year, month, day, hour, minute) => HYP3ECalendar._calculateSecondsSinceEpoch(year, month, day, hour, minute);
  game.hyp3e.calendar.calculateDateFromSeconds = (seconds) => HYP3ECalendar._calculateDateFromSeconds(seconds);
  game.hyp3e.calendar.calculateTimeFromSeconds = (seconds) => HYP3ECalendar._calculateTimeFromSeconds(seconds);
  game.hyp3e.calendar.getCurrentDate = () => HYP3ECalendar.getCurrentDate();
  game.hyp3e.calendar.getCurrentTime = () => HYP3ECalendar.getCurrentTime();
  game.hyp3e.calendar.setCurrentDate = ({year, month, day}) => HYP3ECalendar.setCurrentDate({year, month, day});
  game.hyp3e.calendar.advanceDay = (resetTurns) => HYP3ECalendar.advanceDay(resetTurns);
  game.hyp3e.calendar.retreatDay = (resetTurns) => HYP3ECalendar.retreatDay(resetTurns);
  game.hyp3e.calendar.advanceHour = () => HYP3ECalendar.advanceHour();
  game.hyp3e.calendar.retreatHour = () => HYP3ECalendar.retreatHour();
  game.hyp3e.calendar.advanceMinute = () => HYP3ECalendar.advanceMinute();
  game.hyp3e.calendar.retreatMinute = () => HYP3ECalendar.retreatMinute();
  game.hyp3e.calendar.formatDate = ({year, month, day}, verbose) => HYP3ECalendar.formatDate({year, month, day}, verbose);
  game.hyp3e.calendar.formatTime = ({hour, minute}) => HYP3ECalendar.formatTime({hour, minute});
  game.hyp3e.calendar.getMoonPhase = (year, monthNum, day, moonName) => HYP3ECalendar.getMoonPhase(year, monthNum, day, moonName);
  game.hyp3e.calendar.getCycleYear = (year) => HYP3ECalendar.getCycleYear(year);
  game.hyp3e.calendar.getSeason = (year, month) => HYP3ECalendar.getSeason(year, month);
  game.hyp3e.calendar.sendDateToChat = () => HYP3ECalendar.sendDateToChat();
  game.hyp3e.calendar.phobosIcons = HYP3ECalendar.phobosIcons;
  game.hyp3e.calendar.seleneIcons = HYP3ECalendar.seleneIcons;
  Hyp3eLogger.info("Init", `Hyperborean date is ${game.hyp3e.calendar.formatDate(game.hyp3e.calendar.getCurrentDate(), true)}.`, game.hyp3e.calendar.getCurrentDate());

  // Initialize the turn tracker
  game.hyp3e.turnTracker = game.hyp3e.turnTracker || new HYP3ETurnTracker();
  HYP3ETurnTracker.initSync();

  // Log the start of the turn tracker
  Hyp3eLogger.info("Init", `Current exploration turn is ${HYP3ETurnTracker.getTurn()}`);
  // Import the turn tracker class methods
  game.hyp3e.turnTracker.advanceTurn = () => HYP3ETurnTracker.advanceTurn();
  game.hyp3e.turnTracker.retreatTurn = () => HYP3ETurnTracker.retreatTurn();
  game.hyp3e.turnTracker.resetTurn = () => HYP3ETurnTracker.reset();
  game.hyp3e.turnTracker.getTurn = () => HYP3ETurnTracker.getTurn();
  game.hyp3e.turnTracker.turnStartTime = () => HYP3ETurnTracker.getTurnStartTime();
  game.hyp3e.turnTracker.getCurrentDaylightHours = () => HYP3ETurnTracker.getCurrentDaylightHours();
  game.hyp3e.turnTracker.formatDaylightAsHHMM = (decimalHours) => HYP3ETurnTracker.formatDaylightAsHHMM(decimalHours);
  game.hyp3e.turnTracker.getDaylightFraction = () => HYP3ETurnTracker.getDaylightFraction();

  // Initialize the Turn Tracker app
  if (game.settings.get(game.system.id, "enableTurnTracker")) {
    game.hyp3e.turnTrackerApp = game.hyp3e.turnTrackerApp || new HYP3ETurnTrackerAppV2();
    game.hyp3e.openTurnTracker = () => game.hyp3e.turnTrackerApp.render(true);
    game.hyp3e.openTurnTracker();
  }

  // Log the old calendar and time settings for debugging
  Hyp3eLogger.info("Init", `Old calendar settings:`, {
    calendar: game.settings.get(game.system.id, "calendarDate"),
    time: game.settings.get(game.system.id, "currentTime")
  });

  // Migrate old calendar and time settings if they exist, then clear them out
  let oldCalendar = game.settings.get(game.system.id, "calendarDate");
  let oldTime = game.settings.get(game.system.id, "currentTime");
  try {
    if (oldCalendar.year || oldTime) {
      const {year, month, day} = oldCalendar ? oldCalendar : {year: 1, month: 1, day: 1};
      const [hour, minute] = oldTime ? oldTime.split(":").map(s => parseInt(s)) : [0, 0];
      const secondsSinceEpoch = HYP3ECalendar._calculateSecondsSinceEpoch(year, month, day, hour, minute);
      await game.time.advance(secondsSinceEpoch - game.time.worldTime);
      // Clear out old settings
      await game.settings.set(game.system.id, "calendarDate", {});
      await game.settings.set(game.system.id, "currentTime", "");
      Hyp3eLogger.info("Init", `Migrated old calendar and time settings to new system.`, {
        year, month, day, hour, minute, secondsSinceEpoch
      });
    }
  } catch (err) {
    Hyp3eLogger.info("Init", `Error migrating old calendar and time settings:`, err.message);
    Hyp3eLogger.info("Init", `Could not migrate old calendar and time.`, { calendar: oldCalendar, time: oldTime });
  }

  // Log world time & date
  Hyp3eLogger.info("Init", `Current world time is ${game.time.worldTime} seconds since epoch.`, game.time);

  // Pre-load processing
  if (game.user.isGM) {
    // If the token resize option is set, do that now, while the game is loading
    if (game.settings.get(game.system.id, "resizeTokens")) {
      resizeTokenPrototypes()
    }
  }

});

/* -------------------------------------------- */
/*  Additional Hooks                            */
/* -------------------------------------------- */

/**
 * When config settings are changed, respond if needed.
 */
Hooks.on("updateSetting", (setting) => {
  if (setting.key === "hyp3e.chatFontSize") {
    // Immediately apply new font size to chat
    applyChatFontSizeSetting();
  }
});

/**
 * Render the Settings Config app for our Hyperborea system options.
 * This is only available to GMs.
 */
Hooks.on("renderSettingsConfig", (app, htmlElement, data) => {
  const html = $(htmlElement); // Wrap in jQuery

  // GM's custom compendia list
  const input = html.find('input[name="hyp3e.customCompendia"]');
  if (input.length) {
    input.attr("placeholder", "e.g., My Armor, My Equipment, My Weapons");
  }

  // Custom class editor button
  const settingRow = html.find(`.form-group:has([name="hyp3e.openClassEditor"])`);
  if (settingRow.length) {
    const button = $(`
      <button type="button" style="margin-left: 1em; min-width: 200px; padding: 4px 8px;">
        <i class="fas fa-edit"></i> Open Class Editor
      </button>`
    );
    button.on("click", () => {
      new HYP3ECustomClassList().render(true);
    });
    settingRow.find("input").replaceWith(button);
  }
});

Hooks.on("renderTokenHUD", (hud, html, data) => {
  Hyp3eLogger.info("renderTokenHUD", `Incoming parameters for token HUD:`, {hud, html, data})
  const token = hud.object; // Token object
  const actor = getTokenActor(token);
  // Convert html to jquery
  let $html = $(html)
  // Prevent duplicates
  if ($html.find(".hyp3e-equip-btn").length) return;

  // Create the new button
  const btn = $(`
    <button type="button" class="control-icon hyp3e-equip-btn" data-tooltip="Quick-Equip">
      <i class="fa-solid fa-swords"></i>
    </button>
  `);

  // Add to the left side of the HUD
  $html.find(".col.left").append(btn);

  // Click handler
  btn.on("click", async (event) => {
    event.preventDefault();
    // Open the quick-equip app
    HYP3EQuickEquipApp.openForActor(actor);
  });
});

/**
 * When a token is refreshed (moved, updated, etc), overlay icons for equipped weapons
 */
Hooks.on("refreshToken", async (token, tokenState) => {
  // Check config setting
  if (!CONFIG.HYP3E.showWeaponOverlay) {
    if (token.weaponOverlay) {
      token.weaponOverlay.destroy({ children: true });
      token.weaponOverlay = null;
    }
    return;
  }

  // Overlay equipped weapon and shield icons on the token
  await overlayEquippedWeaponAndShield(token, tokenState)
});

/**
 * Before a token can complete its movement during a turn, ensure it has not overstepped 
 *  its MV speed. Give a warning and possibly cancel the movement if option is configured.
 *  The "preMoveToken" event is only available in v13+, this won't work in Foundry v12.
 */
Hooks.on("preMoveToken", (token, movement, operation) => {
  // We only enforce this rule in combat
  if (!isTokenInCombat(token)) return;

  const actor = getTokenActor(token);
  if (!actor) {
    Hyp3eLogger.warn("preMoveToken", `Token actor not found!`, token)
    return;
  }
  // Hyp3eLogger.info("preMoveToken", `Moving token ${token.name}: `, token);
  const combatant = getTokenCombatant(token);
  if (!combatant) {
    Hyp3eLogger.warn("preMoveToken", `Token combatant not found!`, token)
    return;
  }

  const baseMove = actor.system.movement?.base.value ?? 40;
  // "isDelayed" is a declared action that allows a combatant to take their turn later in the round, 
  //  but it also doubles their allowed movement for a "charge".
  const maxMove = combatant.isDelayed ? baseMove * 2 : baseMove;

  // Calculate current move, including completed and pending waypoints
  const totalDistance = movement.history.distance + movement.passed.distance + movement.pending.distance;
  Hyp3eLogger.info("preMoveToken", `${actor.name} total distance: `, totalDistance);
  if (totalDistance > maxMove) {
    const msg = `This move exceeds ${actor.displayName}'s speed of ${maxMove} feet per round!`;
    Hyp3eLogger.warn("preMoveToken", msg)
    ui.notifications.warn(msg);
    if (CONFIG.HYP3E.limitMovement) {
      return false; // Prevent the movement
    }
  }
});

Hooks.on("deleteCombat", async (combat) => {
  if (!ActiveEffect?.registry) return;   // v13 safety

  Hyp3eLogger.info("deleteCombat", `Combat ended — refreshing effect durations for non-combat tracking`);

  // Re-prepare and re-register all relevant actors
  const actorsToRefresh = new Set();

  // All actors in the current scene
  for (const token of canvas.tokens?.placeables ?? []) {
    if (token.actor && token.actor.isOwner) {
      actorsToRefresh.add(token.actor);
    }
  }

  for (const actor of actorsToRefresh) {
    // Re-register all effects
    await ActiveEffect.registry.addFromParent(actor);
  }
});

/**
 * Capture chat commands for the Turn Tracker and Calendar apps
 */
Hooks.on("chatMessage", (chatLog, message, chatData) => {
  const parts = message.split(" ");
  if (!["/cal", "/turn"].includes(parts[0])) return;

  // Open the Turn Tracker app
  if (parts[0] === "/turn" && parts.length === 1) {
    game.hyp3e.openTurnTracker();
    return false;
  }

  // Anyone can open the calendar (read-only for players), or send the date to chat
  if (parts[0] === "/cal" && parts.length === 1) {
    game.hyp3e.openCalendar();
    return false;
  }
  if (parts[0] === "/cal" && parts[1] === "chat") {
    game.hyp3e.calendar.sendDateToChat();
    return false;
  }
  // Only GMs can advance the day
  if (parts[1] === "advance" && game.user.isGM) {
    // "/cal advance reset" will reset the Turn Tracker too
    const reset = parts.includes("reset");
    game.hyp3e.calendar.advanceDay(reset);
    setTimeout(() => {
      game.hyp3e.calendar.sendDateToChat();
    }, 500);
    return false;
  }

  // Invalid commands by non-GMs will be ignored, but GMs get an error message
  if (game.user.isGM) {
    ui.notifications.warn(`Unknown command: ${message}`);
  }
  return false;
});

/**
 * Insert damage, save, and effect buttons into chats
 */
Hooks.on("renderChatMessageHTML", addChatMessageButtons);
Hooks.on("renderChatMessageHTML", truncateLongContent);

/**
 * Capture the token creation event to run some extra processes on it
 */
Hooks.on("createToken", (token, options, userId) => {
  // Exit if not a GM
  if (!game.user.isGM) return;

  // Replace the actual name with the alias, if it exists
  Hyp3eLogger.info("createToken", `Token creation:`, token);
  Hyp3eLogger.info("createToken", `Tokens on canvas at creation time:`, canvas.tokens);
  if (token.actor.system.tokenAlias != "") {
    let tokenAlias = token.actor.system.tokenAlias
    if (token.appendNumber || token.actor.prototypeToken.appendNumber) {
      // Get all existing tokens that match tokenAlias
      const matchingTokens = canvas.tokens.placeables.filter(t => t.name.indexOf(tokenAlias) === 0) ?? null;
      Hyp3eLogger.info("createToken", `Tokens that match ${tokenAlias}: `, matchingTokens);
      // Send the list of tokens to this function and get the next available number back
      const i = getAvailableTokenNumber(matchingTokens)
      tokenAlias = `${tokenAlias} (${i})`
    }
    if (token.prependAdjective || token.actor.prototypeToken.prependAdjective) {
      // Get whatever adjective was prepended to the name and keep it
      const adjective = token.name.split(" ")[0];
      tokenAlias = `${adjective} ${tokenAlias}`
    }
    Hyp3eLogger.info("createToken", `Updating token name from ${token.name} to ${tokenAlias}...`);
    try {
      token.update({"name": tokenAlias})
    } catch (err) {
      Hyp3eLogger.error("createToken", `Failed to update token name for ${token.name}.`, err);
      ui.notifications.error(`Failed to update token name for ${token.name}. Check the console for details.`);
    }
  }
  // Roll HD for NPCs & monsters
  if (token.actor?.type == "npc" && token.actor.system.rollHD) {
    try {
      token.actor.rollHD()
    } catch (err) {
      Hyp3eLogger.error("createToken", `Failed to roll HD for NPC ${token.actor.name}.`, err);
      ui.notifications.error(`Failed to roll HD for NPC ${token.actor.displayName}. Check the console for details.`);
    }
  }
});

/**
 * Capture the preUpdateItem event to run some custom processing
 */
Hooks.on("preUpdateItem", async (item, update) => {
  if (item.type !== "armor" && item.type !== "shield" && item.type !== "weapon") return;
  if (foundry.utils.getProperty(update, "system.equipped") !== true) return;

  const actor = item.actor;
  if (!actor) return;

  // When a armor or weapons are equipped, ensure that any others are unequipped

  // Check config setting for weapons & shields
  if (CONFIG.HYP3E.enforceWeaponEquipRules) {
    Hyp3eLogger.info("preUpdateItem", `Enforcing weapon equippage rules for ${item.name}...`, {item, actor});
    await actor.enforceWeaponEquipRules(item);
  }

  // Check config setting for armor
  if (item.type === "armor" && CONFIG.HYP3E.autoCalcAc) {
    await actor.enforceSingleArmor(item);
  }
});


/* -------------------------------------------- */
/*  Date & Time-Keeping hooks                   */
/* -------------------------------------------- */

// Register Calendar hooks
await setupCalendarHooks();

// Register Turn Tracker hooks
await setupTurnTrackerHooks();


/* -------------------------------------------- */
/*  Setup system/world functions                */
/* -------------------------------------------- */
async function setupSystem() {
  Hyp3eLogger.info("setupSystem", "Running system setup...");

  // Folder definition for core compendia
  const folderDefs = [
    {
      name: "Hyp3e Core Data",
      type: "Compendium",
      sorting: "a",
      packs: [
        "hyp3e-character-classes",
        "hyp3e-equipment-lists"
      ],
    }
  ];

  // Create folder for core compendia, if it doesn't exist
  await createCompendiumFolders(folderDefs);

  // Check for Class Templates folder in world Items directory, create if needed
  // const classTemplatesFolder = game.folders.find(f => f.name === "Class Templates" && f.type === "Item");
  // if (!classTemplatesFolder) {
  //   Hyp3eLogger.info("setupSystem", "Creating Class Templates folder in world Items directory...");
  //   await Folder.create({ name: "Class Templates", type: "Item", parent: null });
  // }

}

/**
 * Recursively create compendium folder for the core Hyp3e data.
 * This is idempotent — it won't duplicate if they already exist.
 * @param {Array} folderDefs - Array of folder definitions, each with name, type, sorting, color, packs, and subfolders
 * @param {string|null} parentId - The ID of the parent folder, or null for top-level
 */
async function createCompendiumFolders(folderDefs, parentId = null) {
  const systemId = "hyp3e";
  for (const def of folderDefs) {
    // Check if a folder with this name already exists at this level
    let folder = game.folders.find(f => 
      f.name === def.name && 
      f.type === "Compendium"
    );

    if (!folder) {
      console.log(`Creating compendium folder: ${def.name} ${parentId ? `(parent folder: ${parentId})` : '(top-level)'}`);
      folder = await Folder.create({
        name: def.name,
        type: "Compendium",
        sorting: def.sorting || "a",
        color: def.color || null,
        parent: parentId,
        folder: parentId
      });

      // Small pause to let the collection update
      await new Promise(r => setTimeout(r, 50));
      folder = game.folders.get(folder.id); // Re-fetch fresh reference
    }
    console.log(`Found folder: ${folder.name} (id: ${folder.id}):`, folder);

    // Assign packs to this folder (if any)
    if (def.packs?.length) {
      for (const packName of def.packs) {
        const pack = game.packs.get(`${systemId}.${packName}`);
        if (pack && pack.folder !== folder?.id) {
          await pack.configure({ folder: folder.id });
          console.log(`Assigned Hyp3e pack ${packName} to folder ${def.name}`, pack);
        } else {
          console.warn(`Hyp3e pack ${packName} not found for folder ${def.name}`);
        }
      }
    }

    // Recurse into subfolders
    if (def.folders?.length) {
      await ensureCompendiumFolders(def.folders, folder.id);
    }
  }
}

/* -------------------------------------------- */
/*  Migrate system/world functions              */
/* -------------------------------------------- */
async function migrateWorld() {
  Hyp3eLogger.info("migrateWorld", `Migrating world ${game.system.version}...`);

  // Migrate Actor directory
  Hyp3eLogger.info("migrateWorld", `Migrating data for ${game.actors.contents.length} actors in the directory...`);
  for (const actor of game.actors.contents) {
    // Migrate actor data
    const classTemplate = await getClassTemplate(actor.system?.details?.class) ?? null;
    const origActor = foundry.utils.deepClone(actor);
    const actorUpdates = await migrateActorData(origActor, classTemplate);
    if (actorUpdates && Object.keys(actorUpdates).length > 0) {
      await actor.update(actorUpdates);
      // For PCs only, re-calc weapon masteries after the primary update
      if (actor.type === "character") {
        const weaponProficiencies = updateWeaponMasteries(actor);
        await actor.update({ "system.weaponProficiencies": weaponProficiencies });
      }
    }
    // Migrate the actor's items
    if (actor.items) {
      for (const item of actor.items) {
        const origItem = foundry.utils.deepClone(item);
        const itemUpdates = migrateItemData(origItem);
        if (itemUpdates && Object.keys(itemUpdates).length > 0) {
          if (origItem.type === "armor" && origItem.system.type === "shield") {
            // Legacy shields need non-recursive update to force item type change
            await item.update(itemUpdates, { recursive: false });
          } else {
            await item.update(itemUpdates);
          }
        }
        // Migrate item effects required for v14 data changes
        migrateItemEffects(item);
      }
    }
  }

  // Migrate all actor effects required for v14 data changes
  await migrateActorEffects();

  // Skip out early
  // return true;

  // Migrate Items directory
  Hyp3eLogger.info("migrateWorld", `Migrating data for ${game.items.contents.length} items in the directory...`);
  for (const item of game.items.contents) {
    const origItem = foundry.utils.deepClone(item);
    const itemUpdates = migrateItemData(origItem);
    if (itemUpdates && Object.keys(itemUpdates).length > 0) {
      if (origItem.type === "armor" && origItem.system.type === "shield") {
        // Legacy shields need non-recursive update to force item type change
        await item.update(itemUpdates, { recursive: false });
      } else {
        await item.update(itemUpdates);
      }
    }
    // Migrate item effects required for v14 data changes
    migrateItemEffects(item);
  }

  // Migrate custom classes, if any exist
  await migrateCustomClasses();

  // We only migrate the Hyperborea compendium if the GM requests it.
  // We don't want to migrate compendia every time the game is loaded, as it may take a long time.
  // Also, there may be some risk of data loss in personal or third-party compendia.
  if (!game.settings.get(game.system.id, "migrateCompendia")) {
    return true;
  }

  // Migrate compendia, one document at a time (time-consuming!)
  for (const pack of game.packs) {
    if (!pack.collection.startsWith("hyp3e-compendium")) continue;

    const packType = pack.metadata.type

    Hyp3eLogger.info("migrateWorld", `Compendium pack ${pack.metadata.label}:`, pack);
    const documentName = pack.documentName;

    // Get the compendium's locked property, then unlock it
    const wasLocked = pack.locked
    await pack.configure({ locked: false })

    // Begin by requesting server-side data model migration, and get the pack docs
    Hyp3eLogger.info("migrateWorld", `Migrating compendium pack ${pack.metadata.label}...`);
    await pack.migrate()
    const documents = await pack.getDocuments()

    // Iterate over compendium entries and apply migration functions
    for (const doc of documents) {
    try {
      switch(packType) {
      case "Actor":
        // Migrate actor data
        const origActor = foundry.utils.deepClone(doc);
        const actorUpdates = await migrateActorData(origActor);
        if (actorUpdates && Object.keys(actorUpdates).length > 0) {
          await doc.update(actorUpdates);
        }
        // For PCs only, re-calc weapon masteries after the primary update
        if (doc.type === "character") {
          const weaponProficiencies = updateWeaponMasteries(doc);
          await doc.update({ "system.weaponProficiencies": weaponProficiencies });
        }
        // Migrate the actor's items
        if (doc.items) {
        for (const item of doc.items) {
          const origItem = foundry.utils.deepClone(item);
          const itemUpdates = migrateItemData(origItem);
              if (itemUpdates && Object.keys(itemUpdates).length > 0) {
                if (origItem.type === "armor" && origItem.system.type === "shield") {
                  // Legacy shields need non-recursive update to force item type change
                  await item.update(itemUpdates, { recursive: false });
                } else {
                  await item.update(itemUpdates);
                }
              }
              // Migrate item effects required for v14 data changes
              migrateItemEffects(item);
            }
          }
          break

        case "Item":
          // Do for all items regardless of type
          const origItem = foundry.utils.deepClone(doc);
          const itemUpdates = migrateItemData(origItem);
          if (itemUpdates && Object.keys(itemUpdates).length > 0) {
            if (origItem.type === "armor" && origItem.system.type === "shield") {
              // Legacy shields need non-recursive update to force item type change
              await doc.update(itemUpdates, { recursive: false });
            } else {
              await doc.update(itemUpdates);
            }
          }
          // Migrate item effects required for v14 data changes
          migrateItemEffects(doc);      
          break;

        default:
          break;
        }
      } catch (err) {
        const errMsg = `Failed Hyp3e system migration for document ${doc.name} in pack ${pack.collection}.`;
        Hyp3eLogger.error("migrateWorld", errMsg, err);
      }
    }

    // Re-lock the compendium if it was locked before
    await pack.configure({ locked: wasLocked })
    Hyp3eLogger.info("migrateWorld", `Migrated all ${documentName} documents from Compendium ${pack.collection}`);

  }
  return true;
}

async function resizeTokenPrototypes() {
  // Update the actor directory first
  for (const actor of game.actors.contents) {
    // Migrate NPC data
    if (actor.type == "npc") {
      const tokenSize = fixTokenSize(actor)
      if (tokenSize) {
        await actor.update(tokenSize)
      }
    }
  }
}

/* -------------------------------------------- */
/*  Hotbar Macros                 */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data   The dropped data
 * @param {number} slot   The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // Did the user miss the hotbar slot?
  if ( slot === null ) return;

  Hyp3eLogger.info("createItemMacro", `Hotbar drop data:`, data);
  if (data.type !== "Item") {
    // This should never happen
    return;
  }

  // Is this is a valid owned item?
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    const msg = "You can only create macro buttons for owned Items!"
    Hyp3eLogger.warn("createItemMacro", msg);
    ui.notifications.warn(msg);
    return;
  }
  // If we have an actor-owner, retrieve the item based on its uuid
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid
  const command = `game.hyp3e.rollItemMacro("${data.uuid}","${item.actor.id}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    Hyp3eLogger.info("createItemMacro", `Item macro not found, will create...`);
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "hyp3e.itemMacro": true }
    });
  }
  Hyp3eLogger.info("createItemMacro", `Item macro:`, macro);
  game.user.assignHotbarMacro(macro, slot);
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid, actorId=null) {
  // wsAI: looks like actor could be retrieved from itemUuid, not sure cons/risks of that approach.
  if (actorId == null){
    const msg = `Could not find actor for item ${itemUuid}. You may need to delete and recreate this macro.`;
    Hyp3eLogger.warn("rollItemMacro", msg);
    return ui.notifications.warn(msg);
  } else {
    // wsAI note above, might be better to get actor from the Item object.
    const actor = game.actors.get(actorId);
    // wsAI: some of the helper logic in the actor.rollMacro function could be moved here and the wrapper removed. 

    // Ensure rollMacro is a function on the actor 
    if (typeof actor.rollMacro === 'function') {
      actor.rollMacro(itemUuid);
    } else {
      const msg = "Actor does not have a roll function";
      Hyp3eLogger.error("rollItemMacro", msg);
      ui.notifications.error(msg);
    }
  }
}