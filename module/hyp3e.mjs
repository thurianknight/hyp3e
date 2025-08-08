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
import { parseAndResolveChangeValue, setupEffectHandlers } from "./helpers/effects.mjs";
import { getAvailableTokenNumber } from "./helpers/tokens.mjs";
import { HYP3ECustomClassList } from "./apps/class-list.mjs";
import { Hyp3eCharacter } from "./helpers/character.mjs";
import { migrateActorData, migrateItemData, fixTokenSize } from "./helpers/data-migrations.mjs"
import { ExplorationTimer } from "./helpers/exploration-timer.mjs";
import { HYP3EExplorationTimerApp } from "./apps/exploration-timer-app.mjs";

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

    console.log("Game info:", game)
    console.log("System info:", game.system)
    const currentVersion = game.system.version
    console.log(`System version ${currentVersion}`)

    // Disable legacy effect transferral
    CONFIG.ActiveEffect.legacyTransferral = false;

    // Register system settings
    game.settings.register(game.system.id, `migration-${currentVersion}-ran`, {
        name: "Migration Ran",
        scope: "world",
        config: false,
        type: Boolean,
        default: false,
    });

    // Register a world setting to store the current exploration turn
    game.settings.register("hyp3e", "explorationTurn", {
        name: "Exploration Turn",
        scope: "world",          // Saved in the world, not per-client
        config: false,           // Hidden from settings UI
        type: Number,
        default: 0
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

    // Enable quick-create characters by selecting a roll method
    game.settings.register(game.system.id, "quickCreateChars", {
        name: game.i18n.localize("HYP3E.settings.quickCreateChars"),
        hint: game.i18n.localize("HYP3E.settings.quickCreateCharsHint"),
        default: "3d6",
        scope: "world",
        type: String,
        choices: {
            "": "Disabled",
            "3d6": "Method I: 3d6",
            "4d6dl": "Method III: 4d6 drop lowest",
            "2d6+6": "Method V: 2d6+6"
        },
        config: true,
        requiresReload: true,
    });

    // Custom compendium names to search for arms & equipment when creating characters
    game.settings.register(game.system.id, "customCompendia", {
        name: game.i18n.localize("HYP3E.settings.customCompendia"),
        hint: game.i18n.localize("HYP3E.settings.customCompendiaHint"),
        default: "",
        scope: "world",
        type: String,
        config: true,
        requiresReload: true,
    });

    // Register a world setting to store custom class data
    game.settings.register(game.system.id, "customClassData", {
        name: "Custom Classes",
        scope: "world",
        config: false,
        type: Object,
        default: {},
    });

    game.settings.register("hyp3e", "openClassEditor", {
        name: "Manage Custom Classes",
        hint: "Open the class editor interface to create or modify custom classes.",
        scope: "world",
        config: true,
        type: String, // Doesn't matter since we're intercepting the render
        default: "",
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

    // Resize tokens for small & large NPCs
    game.settings.register(game.system.id, "resizeTokens", {
        name: game.i18n.localize("HYP3E.settings.resizeTokens"),
        hint: game.i18n.localize("HYP3E.settings.resizeTokensHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: true,
        requiresReload: false,
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

    // Get the Foundry version for conditional options
    console.log("Foundry version:", game.version)
    const majorVersion = Number(game.version?.split(".")[0] ?? game.data.version.split(".")[0]);

    if (majorVersion >= 13) {
        // Limit token movement to actor MV base
        game.settings.register(game.system.id, "limitMovement", {
            name: game.i18n.localize("HYP3E.settings.limitMovement"),
            hint: game.i18n.localize("HYP3E.settings.limitMovementHint"),
            default: false,
            scope: "world",
            type: Boolean,
            config: true,
            requiresReload: true,
        });
    }

    // Force range limitations on weapon & spell attacks
    game.settings.register(game.system.id, "forceRangeLimit", {
        name: game.i18n.localize("HYP3E.settings.forceRangeLimit"),
        hint: game.i18n.localize("HYP3E.settings.forceRangeLimitHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: true,
        requiresReload: true,
    });
    // Force weapon equippage to use
    game.settings.register(game.system.id, "forceWeaponEquip", {
        name: game.i18n.localize("HYP3E.settings.forceWeaponEquip"),
        hint: game.i18n.localize("HYP3E.settings.forceWeaponEquipHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: true,
        requiresReload: true,
    });
    // Force spell memorization to cast
    game.settings.register(game.system.id, "forceSpellMemorize", {
        name: game.i18n.localize("HYP3E.settings.forceSpellMemorize"),
        hint: game.i18n.localize("HYP3E.settings.forceSpellMemorizeHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: true,
        requiresReload: true,
    });

    // Enable combat situational modifier detection
    game.settings.register(game.system.id, "enableCombatSitModDetection", {
        name: game.i18n.localize("HYP3E.settings.enableCombatSitModDetection"),
        hint: game.i18n.localize("HYP3E.settings.enableCombatSitModDetectionHint"),
        default: false,
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

    // Enable encumbrance calculations applied to characters
    game.settings.register(game.system.id, "enableEncumbrance", {
        name: game.i18n.localize("HYP3E.settings.enableEncumbrance"),
        hint: game.i18n.localize("HYP3E.settings.enableEncumbranceHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: true,
        requiresReload: true,
    });
    // GM-defined strength multiplier for encumbered status
    game.settings.register(game.system.id, "encumbered", {
        name: game.i18n.localize("HYP3E.settings.encumberedLabel"),
        hint: game.i18n.localize("HYP3E.settings.encumbranceLabelHint"),
        default: "10",
        scope: "world",
        type: Number,
        config: true,
        requiresReload: true,
    });
    // GM-defined strength multiplier for heavily encumbered status
    game.settings.register(game.system.id, "heavilyEncumbered", {
        name: game.i18n.localize("HYP3E.settings.heavilyEncumberedLabel"),
        hint: game.i18n.localize("HYP3E.settings.encumbranceLabelHint"),
        default: "15",
        scope: "world",
        type: Number,
        config: true,
        requiresReload: true,
    });

    // Damage types & resistances
    game.settings.register(game.system.id, "addlDamageTypes", {
        name: game.i18n.localize("HYP3E.settings.damageTypes"),
        hint: game.i18n.localize("HYP3E.settings.damageTypesHint"),
        default: "",
        scope: "world",
        type: String,
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

    // Creature Phenotypes 
    game.settings.register(game.system.id, "phenotypes", {
        name: game.i18n.localize("HYP3E.settings.phenotypes"),
        hint: game.i18n.localize("HYP3E.settings.phenotypesHint"),
        default: "Animal, Automaton, Dæmon, Elemental, Giant-kind, Humanoid, Insect, Lycanthrope, Otherworldly, Plant, Reptile, Undead",
        scope: "world",
        type: String,
        config: true,
        requiresReload: true,
    });

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

    // Migrate compendia data, if desired (default false)
    game.settings.register(game.system.id, "migrateCompendia", {
        name: game.i18n.localize("HYP3E.settings.migrateCompendia"),
        hint: game.i18n.localize("HYP3E.settings.migrateCompendiaHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: true,
        requiresReload: true,
    });

    // Add custom statusEffects
    const hasted = {
        id: "hasted",
        name: "HYP3E.statusEffects.hasted",
        img: `${HYP3E.assetsPath}/run.svg`,
        isActive: false
    }
    CONFIG.statusEffects.push(hasted)
    const slowed = {
        id: "slowed",
        name: "HYP3E.statusEffects.slowed",
        img: `${HYP3E.assetsPath}/snail.svg`,
        isActive: false
    }
    CONFIG.statusEffects.push(slowed)

    // Add custom constants for configuration.
    CONFIG.HYP3E = HYP3E;


    // Define custom Document classes
    CONFIG.Actor.documentClass = Hyp3eActor;
    CONFIG.Item.documentClass = Hyp3eItem;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("hyp3e", Hyp3eActorSheet, { makeDefault: true });
    console.log("Registered Hyp3eActorSheet")
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("hyp3e", Hyp3eItemSheet, { makeDefault: true });
    console.log("Registered Hyp3eItemSheet")


    // Get initiative mode: group vs. individual
    const isGroupInitiative = game.settings.get(game.system.id, "isGroupInitiative");

    // Load combat classes
    const { HYP3ECombat } = await import( "./combat/combat.mjs");
    const { HYP3ECombatant } = await import( "./combat/combatant.mjs");
    const { HYP3EGroupCombat } = await import( "./combat/combat-group.mjs" );
    const { HYP3EGroupCombatant } = await import( "./combat/combatant-group.mjs");
    // Initiative roll is the same d6, regardless of group/individual
    CONFIG.Combat.initiative = { decimals: 3, formula: HYP3ECombat.FORMULA }
    console.log("CONFIG.Combat.initiative:", CONFIG.Combat.initiative)
    // Set the Combat and Combatant document classes based on initiative mode
    if (isGroupInitiative) {
        console.log("Using group-based initiative.")
        CONFIG.Combat.documentClass = HYP3EGroupCombat;
        CONFIG.Combatant.documentClass = HYP3EGroupCombatant;
    } else {
        console.log("Using individual initiative.")
        CONFIG.Combat.documentClass = HYP3ECombat;
        CONFIG.Combatant.documentClass = HYP3ECombatant;
    }

    if (majorVersion >= 13) {
        // Load v13-specific Combat Tracker class
        const { HYP3ECombatTracker } = await import( "./combat/combat-tracker-v13.mjs");
        CONFIG.ui.combat = HYP3ECombatTracker;
    } else {
        // Load v12-specific Combat Tracker class
        const { HYP3ECombatTracker } = await import( "./combat/combat-tracker-v12.mjs");
        CONFIG.ui.combat = HYP3ECombatTracker;
    }

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

Handlebars.registerHelper('isMin', function(val) {
    return val == 1 ? "min" : ""
});

Handlebars.registerHelper('isMax', function(val, maxVal) {
    return val == maxVal ? "max" : ""
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

Handlebars.registerHelper("capitalizeWords", function (str) {
  if (typeof str !== "string") return "";
  return str.replace(/\b\w/g, c => c.toUpperCase());
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

    // Get Foundry major version #
    const majorVersion = Number(game.version?.split(".")[0] ?? game.data.version.split(".")[0]);
    // Get Hyperborea system version
    const currentVersion = game.system.version

    // Register effects handlers
    await setupEffectHandlers();

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

    // Limit token movement to actor MV base
    if (majorVersion >= 13) {
        const limitMovement = game.settings.get(game.system.id, "limitMovement");
        CONFIG.HYP3E.limitMovement = limitMovement;
        if (CONFIG.HYP3E.debugMessages) { console.log("CONFIG Limit token movement to actor MV base:", CONFIG.HYP3E.limitMovement) }
    }

    // Force range limitations on weapon & spell attacks
    const forceRangeLimit = game.settings.get(game.system.id, "forceRangeLimit");
    CONFIG.HYP3E.forceRangeLimit = forceRangeLimit;
    if (CONFIG.HYP3E.debugMessages) { console.log("CONFIG Force range limitations on weapon & spell attacks:", CONFIG.HYP3E.forceRangeLimit) }

    // Force weapon equippage to use
    const forceWeaponEquip = game.settings.get(game.system.id, "forceWeaponEquip");
    CONFIG.HYP3E.forceWeaponEquip = forceWeaponEquip;
    if (CONFIG.HYP3E.debugMessages) { console.log("CONFIG Force item equippage to use:", CONFIG.HYP3E.forceWeaponEquip) }

    // Force spell memorization to cast
    const forceSpellMemorize = game.settings.get(game.system.id, "forceSpellMemorize");
    CONFIG.HYP3E.forceSpellMemorize = forceSpellMemorize;
    if (CONFIG.HYP3E.debugMessages) { console.log("CONFIG Force spell memorization to cast:", CONFIG.HYP3E.forceSpellMemorize) }

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
        // if (CONFIG.HYP3E.debugMessages) { console.log("CONFIG Classes:", CONFIG.HYP3E.characterClasses) }
    }
    // Load custom classes
    CONFIG.HYP3E.customClassData = game.settings.get(game.system.id, "customClassData");
    // For testing only...
    if (!CONFIG.HYP3E.customClassData || CONFIG.HYP3E.customClassData == {}) {
        console.log("No custom class data found, creating Chronomancer test data.");
        const magician = Hyp3eCharacter.classData["Magician"]
        const chronomancer = {}
        chronomancer["Chronomancer"] = foundry.utils.duplicate(magician)
        CONFIG.HYP3E.customClassData = game.settings.set(game.system.id, "customClassData", chronomancer);
        CONFIG.HYP3E.customClassData = chronomancer;
    }
    if (CONFIG.HYP3E.debugMessages) { console.log("CONFIG Custom Classes:", CONFIG.HYP3E.customClassData) }
    // End testing
    for (const [className, classData] of Object.entries(CONFIG.HYP3E.customClassData)) {
        // Append the class name to characterClasses
        CONFIG.HYP3E.characterClasses[className] = className;
    }
    if (CONFIG.HYP3E.debugMessages) { console.log("CONFIG Classes:", CONFIG.HYP3E.characterClasses) }

    // Load Phenotypes list
    const phenotypes = game.settings.get(game.system.id, "phenotypes");
    if (phenotypes != "") {
        CONFIG.HYP3E.phenotypes = {}
        const phenotypesArray = phenotypes.split(",");
        phenotypesArray.forEach((l, i) => (CONFIG.HYP3E.phenotypes[l.trim()] = l.trim()));
        if (CONFIG.HYP3E.debugMessages) { console.log("CONFIG Phenotypes:", CONFIG.HYP3E.phenotypes) }
    }

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

    // Load weapon annotations
    if (CONFIG.HYP3E.weaponAnnotations) { 
        for (let [k, v] of Object.entries(CONFIG.HYP3E.weaponAnnotations)) {
            CONFIG.HYP3E.weaponAnnotations[k] = game.i18n.localize(CONFIG.HYP3E.weaponAnnotations[k])
        }
        console.log("CONFIG Weapon Annotations:", CONFIG.HYP3E.weaponAnnotations)
    }

    // Load damage types
    if (CONFIG.HYP3E.damageTypes) { 
        for (let [k, v] of Object.entries(CONFIG.HYP3E.damageTypes)) {
            CONFIG.HYP3E.damageTypes[k] = game.i18n.localize(CONFIG.HYP3E.damageTypes[k])
        }
        console.log("CONFIG Damage Types:", CONFIG.HYP3E.damageTypes)
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
        console.log("CONFIG Armor Types:", CONFIG.HYP3E.armorTypes)
    }

    // If we need to do a system migration, do it after the other settings are loaded
    if (game.user.isGM) {
        // No need to migrate if system version is x.x.x or higher
        // const NEEDS_MIGRATION_TO_VERSION = "1.18.0"
        // const needsMigration = !currentVersion || foundry.utils.isNewerVersion(NEEDS_MIGRATION_TO_VERSION, currentVersion)
        // if (needsMigration) {
            const migrationHasRun = game.settings.get(game.system.id, `migration-${currentVersion}-ran`);
            // const migrationHasRun = false
            if (!migrationHasRun) {
                console.log("Running one-time migration...");

                // Do the world migration
                await migrateWorld();

                // Set the flag so it doesn't run again
                await game.settings.set(game.system.id, `migration-${currentVersion}-ran`, true);
                console.log("Migration complete.");
            }
        // }
    }

    // Log the start of the exploration timer
    console.log(`Current exploration turn is ${ExplorationTimer.getTurn()}`);
    // Example macro or control
    game.hyp3e = game.hyp3e || {};
    game.hyp3e.advanceTurn = () => ExplorationTimer.advanceTurn();
    game.hyp3e.resetTurn = () => ExplorationTimer.reset();
    game.hyp3e.getTurn = () => ExplorationTimer.getTurn();
    // const explorationTimer = new HYP3EExplorationTimerApp();
    game.hyp3e.explorationTimer = new HYP3EExplorationTimerApp();
    game.hyp3e.explorationTimer.render(true);

    // Pre-load processing
    if (game.user.isGM) {
        // If the token resize option is set, do that now, while the game is loading
        if (game.settings.get(game.system.id, "resizeTokens")) {
            resizeTokenPrototypes()
        }
    }

});

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

/**
 * Before a token can complete its movement during a turn, ensure it has not overstepped 
 *  its MV speed. Give a warning and possibly cancel the movement if option is configured.
 *  The "preMoveToken" event is only available in v13+, this won't work in Foundry v12.
 */
Hooks.on("preMoveToken", (token, movement, operation) => {
    if (CONFIG.HYP3E.debugMessages) { console.log("preMoveToken Token:", token); }
    // We only enforce this rule in combat
    if (!token.inCombat) return;

    const actor = token.actor;
    if (!actor) return;
    if (CONFIG.HYP3E.debugMessages) { console.log("preMoveToken Actor:", actor); }
    const speed = actor.system.movement?.base.value ?? 40;
    if (CONFIG.HYP3E.debugMessages) { console.log("preMoveToken Movement:", movement); }
    // Calculate current move, including completed and pending waypoints
    const totalDistance = movement.history.distance + movement.passed.distance + movement.pending.distance;
    if (CONFIG.HYP3E.debugMessages) { console.log("preMoveToken: Total distance:", totalDistance); }
    if (totalDistance > speed) {
        ui.notifications.warn(`${actor.name} can only move ${speed} ft per round!`);
        if (CONFIG.HYP3E.limitMovement) {
            return false; // Prevent the movement
        }
    }
});

/**
 * Insert damage, save, and effect buttons into chats
 */
Hooks.on("renderChatMessage", addChatMessageButtons);

/**
 * Capture the token creation event to run some extra processes on it
 */
Hooks.on("createToken", (token, options, userId) => {
    // Exit if not a GM
    if (!game.user.isGM) return;

    // Replace the actual name with the alias, if it exists
    console.log(`createToken: Token creation:`, token)
    console.log(`createToken: Tokens on canvas at creation time:`, canvas.tokens)
    if (token.actor.system.tokenAlias != "") {
        let tokenAlias = token.actor.system.tokenAlias
        if (token.appendNumber || token.actor.prototypeToken.appendNumber) {
            // Get all existing tokens that match tokenAlias
            const matchingTokens = canvas.tokens.placeables.filter(t => t.name.indexOf(tokenAlias) === 0) ?? null;
            console.log(`createToken: Tokens that match ${tokenAlias}: `, matchingTokens)
            // Send the list of tokens to this function and get the next available number back
            const i = getAvailableTokenNumber(matchingTokens)
            tokenAlias = `${tokenAlias} (${i})`
            // const tokenNum = token.name.match(/\(\d{1,2}\)$/);
            // tokenAlias = `${tokenAlias} ${tokenNum[0]}`
        }
        if (token.prependAdjective || token.actor.prototypeToken.prependAdjective) {
            // Get whatever adjective was prepended to the name and keep it
            const adjective = token.name.split(" ")[0];
            tokenAlias = `${adjective} ${tokenAlias}`
        }
        console.log(`createToken: Updating token name from ${token.name} to ${tokenAlias}...`)
        try {
            token.update({"name": tokenAlias})
        } catch (err) {
            console.error(`Failed to update token name for ${token.name}:`, err);
            ui.notifications.error(`Failed to update token name for ${token.name}. Check the console for details.`);
        }
    }
    // Roll HD for NPCs & monsters
    if (token.actor?.type == "npc" && token.actor.system.rollHD) {
        try {
            token.actor.rollHD()
        } catch (err) {
            console.error(`Failed to roll HD for NPC ${token.actor.name}:`, err);
            ui.notifications.error(`Failed to roll HD for NPC ${token.actor.name}. Check the console for details.`);
        }
    }
});

/**
 * Custom hook for handling exploration turns.
 */
Hooks.on("explorationTurnAdvanced", (turn) => {
    console.log(`Exploration turn ${turn} triggered`);
    for (const token of canvas.tokens.placeables) {
        const actor = token.actor;
        if (!actor) continue;

        actor.handleExplorationTurn(turn);

        // Optional: process equipped items
        for (const item of actor.items) {
            if (!item) continue;
            item.handleExplorationTurn(turn);
        }
    }
});

/* -------------------------------------------- */
/*  Migrate system/world functions              */
/* -------------------------------------------- */
async function migrateWorld() {
    console.log(`Migrating world ${game.system.version}...`)

    // Migrate Actor directory
    console.log(`Updating data for actors in the directory...`)
    for (let actor of game.actors.contents) {
        // Migrate actor data
        const origActor = foundry.utils.deepClone(actor)
        const actorUpdates = migrateActorData(origActor)
        if (actorUpdates && actorUpdates != {}) await actor.update(actorUpdates)
        // Migrate the actor's items
        if (actor.items) {
            for (let item of actor.items) {
                const origItem = foundry.utils.deepClone(item);
                const itemUpdates = migrateItemData(origItem);
                if (itemUpdates && itemUpdates != {}) await item.update(itemUpdates);
            }
        }
    }

    // Skip out early
    // return true;

    // Migrate Items directory
    console.log(`Updating data for items in the directory...`)
    for (let item of game.items.contents) {
        const origItem = foundry.utils.deepClone(item);
        const itemUpdates = migrateItemData(origItem);
        if (itemUpdates && itemUpdates != {}) await item.update(itemUpdates);
    }

    // We only migrate the Hyperborea compendium if the GM requests it.
    // We don't want to migrate compendia every time the game is loaded, as it may take a long time.
    // Also, there may be some risk of data loss in personal or third-party compendia.
    if (!game.settings.get(game.system.id, "migrateCompendia")) {
        return true;
    }

    // Migrate compendia, one document at a time (time-consuming!)
    for (let pack of game.packs) {

        const packType = pack.metadata.type

        console.log(`Compendium pack ${pack.metadata.label}:`, pack)
        const documentName = pack.documentName;

        // Get the compendium's locked property, then unlock it
        const wasLocked = pack.locked
        await pack.configure({ locked: false })

        // Begin by requesting server-side data model migration, and get the pack docs
        console.log(`Migrating compendium pack ${pack.metadata.label}...`)
        await pack.migrate()
        const documents = await pack.getDocuments()

        // Iterate over compendium entries and apply migration functions
        for (let doc of documents) {
            try {
                switch(packType) {
                case "Actor":
                    // Migrate actor data
                    const origActor = foundry.utils.deepClone(doc)
                    const actorUpdates = migrateActorData(origActor)
                    if (actorUpdates && actorUpdates != {}) await doc.update(actorUpdates)
                    // Migrate the actor's items
                    if (doc.items) {
                        for (let item of doc.items) {
                            const origItem = foundry.utils.deepClone(item);
                            const itemUpdates = migrateItemData(origItem);
                            if (itemUpdates && itemUpdates != {}) await item.update(itemUpdates);
                        }
                    }
                    break

                case "Item":
                    // Do for all items regardless of type
                    const origItem = foundry.utils.deepClone(doc);
                    const itemUpdates = migrateItemData(origItem);
                    if (itemUpdates && itemUpdates != {}) await doc.update(itemUpdates);
                    break

                default:
                    break
                }
            } catch (err) {
                const errMsg = `Failed Hyp3e system migration for document ${doc.name} in pack ${pack.collection}: ${err.message}`;
                console.error(errMsg);
            }
        }

        // Re-lock the compendium if it was locked before
        await pack.configure({ locked: wasLocked })
        console.log(`Migrated all ${documentName} documents from Compendium ${pack.collection}`);

    }
    return true;
}

async function resizeTokenPrototypes() {
    // Update the actor directory first
    for (let actor of game.actors.contents) {
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
    // Did the user miss the hotbar slot?
    if ( slot === null ) return;

    // Is this a script/macro being added to the macro bar?
    if (data.type == "Macro") {
        // Get the macro & code from the drop data
        const macro = await Macro.fromDropData(data);
        console.log(`Macro:`, macro);
        console.log(`Adding macro ${macro.name} to hotbar slot ${slot}`);
        game.user.assignHotbarMacro(macro, slot);
        return false;
    }

    // Is this is a valid owned item?
    if (data.type !== "Item") {
        console.log(`Cannot create macro: ${data.type} is not an item`)
        console.log(`Macro Data:`, data)
        return;
    }
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