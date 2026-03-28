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
      migrateItemData, 
      fixTokenSize,
      migrateItemEffects } from "./helpers/data-migrations.mjs"
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

// Set this now, to use later
let trackerInitialized = false;

/* -------------------------------------------- */
/*  Init Hook                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.hyp3e = {
    Hyp3eActor,
    Hyp3eItem,
    rollItemMacro
  };

  console.log("Game info:", game);
  console.log("System info:", game.system);
  console.log("Foundry version:", game.version);
  // Get the Foundry version for conditional options
  const majorVersion = Number(game.version?.split(".")[0] ?? game.data.version.split(".")[0]);

  // Disable legacy effect transferral
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register data models for Actors and Items. This replaces the "template.json" system.
  // Actors
  /**
  CONFIG.Actor.dataModels.character = HYP3E_DATA_MODELS.Hyp3eCharacter;
  CONFIG.Actor.dataModels.npc       = HYP3E_DATA_MODELS.Hyp3eNPC;
  CONFIG.Actor.dataModels.merchant  = HYP3E_DATA_MODELS.Hyp3eMerchant;
  CONFIG.Actor.dataModels.treasure  = HYP3E_DATA_MODELS.Hyp3eTreasure;
  CONFIG.Actor.dataModels.itemToken = HYP3E_DATA_MODELS.Hyp3eItemToken;

  // Items
  CONFIG.Item.dataModels.armor        = HYP3E_DATA_MODELS.Hyp3eArmor;
  CONFIG.Item.dataModels.shield       = HYP3E_DATA_MODELS.Hyp3eShield;
  CONFIG.Item.dataModels.weapon       = HYP3E_DATA_MODELS.Hyp3eWeapon;
  CONFIG.Item.dataModels.spell        = HYP3E_DATA_MODELS.Hyp3eSpell;
  CONFIG.Item.dataModels.feature      = HYP3E_DATA_MODELS.Hyp3eFeature;
  CONFIG.Item.dataModels.item         = HYP3E_DATA_MODELS.Hyp3eItem;
  // CONFIG.Item.dataModels.container    = HYP3E_DATA_MODELS.Hyp3eContainer;
  CONFIG.Item.dataModels.effectTemplate = HYP3E_DATA_MODELS.Hyp3eEffectTemplate;

  console.log("Hyperborea | DataModels registered");
  */

  // Register our Hyperborea system configuration options
  registerHyp3eConfigurations();

  // Build a list of custom status effects and add to the CONFIG.statusEffects array
  pushCustomStatusEffects();

  // Add custom constants for configuration
  CONFIG.HYP3E = HYP3E;

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

  if (majorVersion >= 13) {
  // Load v13-specific Combat Tracker class
  const { HYP3ECombatTracker } = await import( "./combat/combat-tracker-v13.mjs");
  CONFIG.ui.combat = HYP3ECombatTracker;
  } else {
  // Load v12-specific Combat Tracker class
  // const { HYP3ECombatTracker } = await import( "./combat/combat-tracker-v12.mjs");
  // CONFIG.ui.combat = HYP3ECombatTracker;
  }

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
  const characterClasses = game.settings.get(game.system.id, "characterClasses");
  if (characterClasses != "") {
    CONFIG.HYP3E.characterClasses = {}
    const classArray = characterClasses.split(",");
    classArray.forEach((l, i) => (CONFIG.HYP3E.characterClasses[l.trim()] = l.trim()));
    Hyp3eLogger.info("Init", "CONFIG Classes:", CONFIG.HYP3E.characterClasses);
  }
  // Load custom classes
  CONFIG.HYP3E.customClassData = game.settings.get(game.system.id, "customClassData");
  Hyp3eLogger.info("Init", "CONFIG Custom Classes:", CONFIG.HYP3E.customClassData);
  for (const [className, classData] of Object.entries(CONFIG.HYP3E.customClassData)) {
    // Append the class name to characterClasses
    CONFIG.HYP3E.characterClasses[className] = className;
  }
  Hyp3eLogger.info("Init", "CONFIG Classes:", CONFIG.HYP3E.characterClasses);

  // Load Phenotypes list
  const phenotypes = game.settings.get(game.system.id, "phenotypes");
  if (phenotypes != "") {
    CONFIG.HYP3E.phenotypes = {}
    const phenotypesArray = phenotypes.split(",");
    phenotypesArray.forEach((l, i) => (CONFIG.HYP3E.phenotypes[l.trim()] = l.trim()));
    Hyp3eLogger.info("Init", "CONFIG Phenotypes:", CONFIG.HYP3E.phenotypes);
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

  // If we need to do a system migration, do it after the other settings are loaded
  if (game.user.isGM) {
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
  game.hyp3e.calendar.getCurrentDate = () => HYP3ECalendar.getCurrentDate();
  game.hyp3e.calendar.setCurrentDate = () => HYP3ECalendar.setCurrentDate();
  game.hyp3e.calendar.advanceDay = () => HYP3ECalendar.advanceDay();
  game.hyp3e.calendar.retreatDay = () => HYP3ECalendar.retreatDay();
  game.hyp3e.calendar.formatDate = () => HYP3ECalendar.formatDate();
  game.hyp3e.calendar.sendDateToChat = () => HYP3ECalendar.sendDateToChat();
  Hyp3eLogger.info("Init", `Hyperborean date is ${game.hyp3e.calendar.formatDate(true)}.`, game.hyp3e.calendar.getCurrentDate());

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
  game.hyp3e.turnTracker.getTime = () => HYP3ETurnTracker.getTime();

  // Initialize the Turn Tracker app
  if (game.settings.get(game.system.id, "enableTurnTracker")) {
    game.hyp3e.turnTrackerApp = game.hyp3e.turnTrackerApp || new HYP3ETurnTrackerAppV2();
    game.hyp3e.openTurnTracker = () => game.hyp3e.turnTrackerApp.render(true);
    game.hyp3e.openTurnTracker();
  }

  // Pre-load processing
  if (game.user.isGM) {
    // If the token resize option is set, do that now, while the game is loading
    if (game.settings.get(game.system.id, "resizeTokens")) {
      resizeTokenPrototypes()
    }
  }

});

/* -------------------------------------------- */
/*  Additional Hooks              */
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
  // "/cal advance reset" will reset the Turn Tracker too (NOT WORKING?)
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
Hooks.on("renderChatMessage", addChatMessageButtons);
Hooks.on("renderChatMessage", truncateLongContent);

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
    await actor.enforceWeaponEquipRules(item);
  }

  // Check config setting for armor
  if (item.type === "armor" && CONFIG.HYP3E.autoCalcAc) {
    await actor.enforceSingleArmor(item);
  }
});

/* -------------------------------------------- */
/*  Date & Time-Keeping functions         */
/* -------------------------------------------- */

// Register Calendar hooks
await setupCalendarHooks();

// Register Turn Tracker hooks
await setupTurnTrackerHooks();

/* -------------------------------------------- */
/*  Migrate system/world functions        */
/* -------------------------------------------- */
async function migrateWorld() {
  Hyp3eLogger.info("migrateWorld", `Migrating world ${game.system.version}...`);

  // Migrate Actor directory
  Hyp3eLogger.info("migrateWorld", `Updating data for ${game.actors.contents.length} actors in the directory...`, game.actors.contents);
  for (const actor of game.actors.contents) {
    // Migrate actor data
    const origActor = foundry.utils.deepClone(actor)
    const actorUpdates = migrateActorData(origActor)
    if (actorUpdates && Object.keys(actorUpdates).length > 0) {
      await actor.update(actorUpdates);
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
        // Migrate item effects required for data changes
        migrateItemEffects(item);
      }
    }
  }

  // Skip out early
  // return true;

  // Migrate Items directory
  Hyp3eLogger.info("migrateWorld", `Updating data for ${game.items.contents.length} items in the directory...`, game.items.contents);
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
    // Migrate item effects required for data changes
    migrateItemEffects(item);
  }

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
        const actorUpdates = migrateActorData(origActor);
        if (actorUpdates && Object.keys(actorUpdates).length > 0) {
          await doc.update(actorUpdates);
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
              // Migrate item effects required for data changes
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
          // Migrate item effects required for data changes
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