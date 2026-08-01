import { Hyp3eConfigApp } from "../apps/hyp3e-config-app.js";

export function registerHyp3eConfigurations() {
    // Foundry & Hyperborea version info needed later
    const majorVersion = Number(game.version?.split(".")[0] ?? game.data.version.split(".")[0]);
    const currentVersion = game.system.version;
    console.log(`[registerHyp3eConfigurations] Hyperborea system version ${currentVersion}`);

    // Used to handle diffs between Foundry v12 and v13
    let showConfigOptions = true;

    // Add a launcher button in System Settings, and disable default options menu
    if (majorVersion >= 13) {
        showConfigOptions = false;
        game.settings.registerMenu(game.system.id, "configMenu", {
            name: "Hyperborea Configuration",
            label: "Configure Hyperborea",
            hint: "Open the Hyperborea configuration manager.",
            icon: "fas fa-cogs",
            type: Hyp3eConfigApp,
            restricted: true
        });
    }
    console.log(`[registerHyp3eConfigurations] Display config options: ${showConfigOptions}`)

    /********************************************
     * Stored World Data
     ********************************************/

    // Save the current version's data migration, so it won't run again
    game.settings.register(game.system.id, `migration-${currentVersion}-ran`, {
        name: "Migration Ran",
        scope: "world",
        config: false,  // Always hidden from UI
        type: Boolean,
        default: false,
    });

    // Store the current Hyperborean date
    game.settings.register(game.system.id, "calendarDate", {
        name: "Calendar Date",
        scope: "world",
        config: false,  // Always hidden from UI
        type: Object,
        default: {}
    });

    // Store the current time
    game.settings.register(game.system.id, "currentTime", {
      name: "Current Time",
      scope: "world",
      config: false,  // Always hidden from UI
      type: String,
      default: "",
    });

    // Store the current exploration turn
    game.settings.register(game.system.id, "explorationTurn", {
        name: "Exploration Turn",
        scope: "world",
        config: false,  // Always hidden from UI
        type: Number,
        default: 0
    });

    // Store the turn-counter starting time
    game.settings.register(game.system.id, "turnStartTime", {
        name: "Turn Start Time",
        scope: "world",
        config: false,  // Always hidden from UI
        type: String,
        default: "8:00"
    });

    // Store turn-advance actions
    game.settings.register(game.system.id, "turnAdvanceActions", {
        name: "Turn-Advance Actions",
        scope: "world",
        config: false, // Managed via the Turn Tracker Actions app
        type: Array,
        default: []
    });

    // Store Turn Tracker display mode (embedded vs. floating)
    game.settings.register(game.system.id, "turnTrackerMode", {
      name: "Turn Tracker Display Mode",
      hint: "Whether the Time Tracker is embedded in the chat bar or is a window/form.",
      scope: "client", // Per-user, local storage
      config: false,
      type: String,
      default: "embedded",
      choices: ["embedded", "floating"]
    });

    // Store Turn Tracker floating position
    game.settings.register("hyp3e", "turnTrackerPos", {
      name: "Turn Tracker Floating Position",
      hint: "(X, Y) coordinates of the upper left corner of the floating TurnTracker window.",
      scope: "client",
      config: false,
      type: Object,
      default: { top: 100, left: 300, width: 290, height: 160 }
    });

    /********************************************
     * UI Options
     ********************************************/

    // Relative chat font size
    game.settings.register(game.system.id, "chatFontSize", {
        name: game.i18n.localize("HYP3E.settings.chatFontSize"),
        hint: game.i18n.localize("HYP3E.settings.chatFontSizeHint"),
        scope: "world",
        config: false, // Hidden in Foundry v12, but available via the config app in v13
        type: Number,
        default: 0
    });

    // Display Hyperborean date format: short or verbose
    game.settings.register(game.system.id, "calendarVerbose", {
        name: game.i18n.localize("HYP3E.settings.calendarVerbose"),
        hint: game.i18n.localize("HYP3E.settings.calendarVerboseHint"),
        scope: "world",
        config: showConfigOptions,
        type: Boolean,
        default: true
    });

    // Whether to display all moon phases on the calendar (NOT USED CURRENTLY)
    game.settings.register(game.system.id, "showAllMoonPhases", {
        name: "Show All Moon Phases",
        hint: "If enabled, the calendar grid shows phases on every day. If disabled, only today's phases are shown.",
        scope: "world",
        config: false,  // Always hidden from UI
        type: Boolean,
        default: true
    });

    // Enable the Turn Tracker app
    game.settings.register(game.system.id, "enableTurnTracker", {
        name: game.i18n.localize("HYP3E.settings.enableTurnTracker"),
        hint: game.i18n.localize("HYP3E.settings.enableTurnTrackerHint"),
        scope: "world",
        config: showConfigOptions,
        type: Boolean,
        default: true,
        requiresReload: true
    });

    // Display current date in the Turn Tracker app
    game.settings.register(game.system.id, "showDateInTurnTracker", {
        name: game.i18n.localize("HYP3E.settings.showDateInTurnTracker"),
        hint: game.i18n.localize("HYP3E.settings.showDateInTurnTrackerHint"),
        scope: "world",
        config: showConfigOptions,
        type: Boolean,
        default: true,
        requiresReload: true
    });

    // Show equipped weapons & shields on tokens
    game.settings.register(game.system.id, "showWeaponOverlay", {
        name: game.i18n.localize("HYP3E.settings.showWeaponOverlay"),
        hint: game.i18n.localize("HYP3E.settings.showWeaponOverlayHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.showWeaponOverlay = value;
        }
    });

    // Resize tokens for small & large NPCs
    game.settings.register(game.system.id, "resizeTokens", {
        name: game.i18n.localize("HYP3E.settings.resizeTokens"),
        hint: game.i18n.localize("HYP3E.settings.resizeTokensHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: true,
    });

    /********************************************
     * General Rules Options
     ********************************************/

    // Automatic Thief ability target calculation
    game.settings.register(game.system.id, "autoCalcThiefTn", {
        name: game.i18n.localize("HYP3E.settings.autoCalcThiefTn"),
        hint: game.i18n.localize("HYP3E.settings.autoCalcThiefTnHint"),
        default: true,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.autoCalcThiefTn = value;
        }
    });

    // Automatic Armor Class calculation
    game.settings.register(game.system.id, "autoCalcAc", {
        name: game.i18n.localize("HYP3E.settings.autoCalcAc"),
        hint: game.i18n.localize("HYP3E.settings.autoCalcAcHint"),
        default: true,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.autoCalcAc = value;
        }
    });

    // Enforce weapon equippage rules
    game.settings.register(game.system.id, "enforceWeaponEquipRules", {
        name: game.i18n.localize("HYP3E.settings.enforceWeaponEquipRules"),
        hint: game.i18n.localize("HYP3E.settings.enforceWeaponEquipRulesHint"),
        default: true,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.enforceWeaponEquipRules = value;
        }
    });

    // Require fuel for light sources
    game.settings.register(game.system.id, "requireLightSourceFuel", {
      name: game.i18n.localize("HYP3E.settings.requireLightSourceFuel"),
      hint: game.i18n.localize("HYP3E.settings.requireLightSourceFuelHint"),
      default: false,
      scope: "world",
      type: Boolean,
      config: showConfigOptions,
      requiresReload: false,
      onChange: value => {
          CONFIG.HYP3E.requireLightSourceFuel = value;
      }
    });

    // Reverse situational modifiers on roll-under checks
    game.settings.register(game.system.id, "flipRollUnderMods", {
        name: game.i18n.localize("HYP3E.settings.flipRollUnderMods"),
        hint: game.i18n.localize("HYP3E.settings.flipRollUnderModsHint"),
        default: true,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.flipRollUnderMods = value;
        }
    });

    // Enable encumbrance calculations applied to characters
    game.settings.register(game.system.id, "enableEncumbrance", {
        name: game.i18n.localize("HYP3E.settings.enableEncumbrance"),
        hint: game.i18n.localize("HYP3E.settings.enableEncumbranceHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.enableEncumbrance = value;
        }
    });
    // Enable coin weight (100 coins = 1 lb)
    game.settings.register(game.system.id, "enableCoinWeight", {
        name: game.i18n.localize("HYP3E.settings.enableCoinWeight"),
        hint: game.i18n.localize("HYP3E.settings.enableCoinWeightHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.enableCoinWeight = value;
        }
    });
    // GM-defined strength multiplier for encumbered status
    game.settings.register(game.system.id, "encumbered", {
        name: game.i18n.localize("HYP3E.settings.encumberedLabel"),
        hint: game.i18n.localize("HYP3E.settings.encumbranceLabelHint"),
        default: 10,
        scope: "world",
        type: Number,
        config: showConfigOptions,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.encumbered = value;
        }
    });
    // GM-defined strength multiplier for heavily encumbered status
    game.settings.register(game.system.id, "heavilyEncumbered", {
        name: game.i18n.localize("HYP3E.settings.heavilyEncumberedLabel"),
        hint: game.i18n.localize("HYP3E.settings.encumbranceLabelHint"),
        default: 15,
        scope: "world",
        type: Number,
        config: showConfigOptions,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.heavilyEncumbered = value;
        }
    });

    /********************************************
     * Combat Rules Options
     ********************************************/

    // Enable/disable group-based initiative
    // game.settings.register(game.system.id, "isGroupInitiative", {
    //     name: game.i18n.localize("HYP3E.settings.isGroupInitiative"),
    //     hint: game.i18n.localize("HYP3E.settings.isGroupInitiativeHint"),
    //     default: true,
    //     scope: "world",
    //     type: Boolean,
    //     config: showConfigOptions,
    //     requiresReload: true,
    // });

    // Select initiative type: group, phased, or individual
    game.settings.register(game.system.id, "initiativeType", {
        name: game.i18n.localize("HYP3E.settings.initiativeType"),
        hint: game.i18n.localize("HYP3E.settings.initiativeTypeHint"),
        default: "group",
        scope: "world",
        type: String,
        choices: {
            group: "HYP3E.settings.initiativeGroup",
            phased: "HYP3E.settings.initiativePhased",
            individual: "HYP3E.settings.initiativeIndividual",
        },
        config: showConfigOptions,
        requiresReload: true,
    });

    // Re-roll Initiative action
    game.settings.register(game.system.id, "resetInitiative", {
        name: game.i18n.localize("HYP3E.settings.resetInitiative"),
        hint: game.i18n.localize("HYP3E.settings.resetInitiativeHint"),
        default: "reset",
        scope: "world",
        type: String,
        config: showConfigOptions,
        requiresReload: true,
        choices: {
            keep: "HYP3E.settings.initiativeKeep",
            reset: "HYP3E.settings.initiativeReset"
        },
    });

    // No one falls unconscious or dead until the round ends
    game.settings.register(game.system.id, "resolveDeathAtRoundEnd", {
      name: game.i18n.localize("HYP3E.settings.resolveDeathAtRoundEnd"),
      hint: game.i18n.localize("HYP3E.settings.resolveDeathAtRoundEndHint"),
      default: false,
      scope: "world",
      type: Boolean,
      config: showConfigOptions,
      requiresReload: false,
      onChange: value => {
        CONFIG.HYP3E.resolveDeathAtRoundEnd = value;
      }
    });

    if (majorVersion >= 13) {
        // Limit token movement to actor MV base
        game.settings.register(game.system.id, "limitMovement", {
            name: game.i18n.localize("HYP3E.settings.limitMovement"),
            hint: game.i18n.localize("HYP3E.settings.limitMovementHint"),
            default: false,
            scope: "world",
            type: Boolean,
            config: showConfigOptions,
            requiresReload: false,
            onChange: value => {
                CONFIG.HYP3E.limitMovement = value;
            }
        });
    }

    // Force range limitations on weapon & spell attacks
    game.settings.register(game.system.id, "forceRangeLimit", {
        name: game.i18n.localize("HYP3E.settings.forceRangeLimit"),
        hint: game.i18n.localize("HYP3E.settings.forceRangeLimitHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.forceRangeLimit = value;
        }
    });

    // Force weapon equippage to use
    game.settings.register(game.system.id, "forceWeaponEquip", {
        name: game.i18n.localize("HYP3E.settings.forceWeaponEquip"),
        hint: game.i18n.localize("HYP3E.settings.forceWeaponEquipHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.forceWeaponEquip = value;
        }
    });

    // Force spell memorization to cast
    game.settings.register(game.system.id, "forceSpellMemorize", {
        name: game.i18n.localize("HYP3E.settings.forceSpellMemorize"),
        hint: game.i18n.localize("HYP3E.settings.forceSpellMemorizeHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.forceSpellMemorize = value;
        }
    });

    // Enable combat situational modifier detection
    game.settings.register(game.system.id, "enableCombatSitModDetection", {
        name: game.i18n.localize("HYP3E.settings.enableCombatSitModDetection"),
        hint: game.i18n.localize("HYP3E.settings.enableCombatSitModDetectionHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.enableCombatSitModDetection = value;
        }
    });

    // Enable advanced combat options declaration
    game.settings.register(game.system.id, "enableAdvancedCombatOptions", {
        name: game.i18n.localize("HYP3E.settings.enableAdvancedCombatOptions"),
        hint: game.i18n.localize("HYP3E.settings.enableAdvancedCombatOptionsHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: false,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.enableAdvancedCombatOptions = value;
        }
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
        config: showConfigOptions,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.enableAttrChecks = value;
        }
    });

    // Critical hit
    game.settings.register(game.system.id, "critHit", {
        name: game.i18n.localize("HYP3E.settings.critHits"),
        hint: game.i18n.localize("HYP3E.settings.critHitsHint"),
        default: true,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.critHit = value;
        }
    });
    
    // Critical Miss
    game.settings.register(game.system.id, "critMiss", {
        name: game.i18n.localize("HYP3E.settings.critMiss"),
        hint: game.i18n.localize("HYP3E.settings.critMissHint"),
        default: true,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: false,
        onChange: value => {
            CONFIG.HYP3E.critMiss = value;
        }
    });

    // Damage types & resistances
    game.settings.register(game.system.id, "addlDamageTypes", {
        name: game.i18n.localize("HYP3E.settings.damageTypes"),
        hint: game.i18n.localize("HYP3E.settings.damageTypesHint"),
        default: "",
        scope: "world",
        type: String,
        config: showConfigOptions,
        requiresReload: true,
    });

    /********************************************
     * Character & NPC Options
     ********************************************/

    // Enable quick-create characters by selecting a roll method
    game.settings.register(game.system.id, "quickCreateChars", {
        name: game.i18n.localize("HYP3E.settings.quickCreateChars"),
        hint: game.i18n.localize("HYP3E.settings.quickCreateCharsHint"),
        default: "3d6",
        scope: "world",
        type: String,
        choices: {
            "": "Disabled",
            "3d6": "Method I: 3d6 in order",
            "4d6dl": "Method III: 4d6 drop lowest, optimize for prime attributes",
            "{3d6,3d6,3d6}kh": "Method IV: 3d6 three times and pick best",
            "2d6+6": "Method V: 2d6+6 in order",
            "4d6dl,3d6": "Method VI: 4d6 drop low for prime attributes, 3d6 for others"
        },
        config: showConfigOptions,
        requiresReload: true,
    });

    // Automatic attribute modifier calculation
    game.settings.register(game.system.id, "autoCalcAttrMods", {
        name: game.i18n.localize("HYP3E.settings.autoCalcAttrMods"),
        hint: game.i18n.localize("HYP3E.settings.autoCalcAttrModsHint"),
        default: true,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: true,
    });

    // Custom compendium names to search for arms & equipment when creating characters
    game.settings.register(game.system.id, "customCompendia", {
        name: game.i18n.localize("HYP3E.settings.customCompendia"),
        hint: game.i18n.localize("HYP3E.settings.customCompendiaHint"),
        default: "",
        scope: "world",
        type: String,
        config: showConfigOptions,
        requiresReload: true,
    });

    // Human races
    game.settings.register(game.system.id, "races", {
        name: game.i18n.localize("HYP3E.settings.races"),
        hint: game.i18n.localize("HYP3E.settings.racesHint"),
        default: "Common (Mixed), Amazon, Atlantean, Esquimaux, Hyperborean, Ixian, Kelt, Kimmerian, Kimmeri-Kelt, Pict, Pict (Half-Blood), Viking, Anglo-Saxon, Carolingian Frank, Carthaginian, Esquimaux-Ixian, Greek, Lapp, Lemurian, Moor, Mu, Oon, Roman, Tlingit, Yakut",
        scope: "world",
        type: String,
        config: showConfigOptions,
        requiresReload: true,
    });

    // Languages
    game.settings.register(game.system.id, "languages", {
        name: game.i18n.localize("HYP3E.settings.languages"),
        hint: game.i18n.localize("HYP3E.settings.languagesHint"),
        default: "Common, Berber, Esquimaux (Coastal), Esquimaux (Tundra), Esquimaux-Ixian (pidgin), Hellenic (Amazon), Hellenic (Atlantean), Hellenic (Greek), Hellenic (Hyperborean), Hellenic (Kimmerian), Keltic (Goidelic), Keltic (Pictish), Latin, Lemurian, Muat, Old Norse (Anglo-Saxon), Old Norse (Viking), Oonat, Thracian (Ixian), Thracian (Kimmerian), Tlingit, Uralic (Lapp), Uralic (Yakut)",
        scope: "world",
        type: String,
        config: showConfigOptions,
        requiresReload: true,
    });

    // Classes
    game.settings.register(game.system.id, "characterClasses", {
        name: game.i18n.localize("HYP3E.settings.characterClasses"),
        hint: game.i18n.localize("HYP3E.settings.characterClassesHint"),
        default: "Assassin, Barbarian, Bard, Berserker, Cataphract, Cleric, Cryomancer, Druid, Fighter, Huntsman, Illusionist, Legerdemainist, Magician, Monk, Necromancer, Paladin, Priest, Purloiner, Pyromancer, Ranger, Runegraver, Scout, Shaman, Thief, Warlock, Witch",
        scope: "world",
        type: String,
        config: showConfigOptions,
        requiresReload: true,
    });

    // Creature Phenotypes 
    game.settings.register(game.system.id, "phenotypes", {
        name: game.i18n.localize("HYP3E.settings.phenotypes"),
        hint: game.i18n.localize("HYP3E.settings.phenotypesHint"),
        default: "Animal, Automaton, Dæmon, Elemental, Giant-kind, Humanoid, Insect, Lycanthrope, Otherworldly, Plant, Reptile, Undead",
        scope: "world",
        type: String,
        config: showConfigOptions,
        requiresReload: true,
    });

    // Weapons list for fovoured weapons / proficiencies
    game.settings.register(game.system.id, "weapons", {
      name: game.i18n.localize("HYP3E.settings.weapons"),
      hint: game.i18n.localize("HYP3E.settings.weaponsHint"),
      default: "Axe, Battle; Axe, Great; Axe, Hand; Blowgun; Bola; Boomerang; Bow, Long; Bow, Long, Composite; Bow, Short; Bow, Short, Composite; Cæstuses; Chain Whip; Club, Light; Club, War; Crossbow, Heavy; Crossbow, Light; Crossbow, Repeating; Dagger; Dart; Falcata; Flail, Footman's; Flail, Horseman's; Halberd; Hammer, Great; Hammer, Horseman's; Hammer, War; Hooked Throwing Knife; Javelin; Lance; Lasso; Mace, Footman's; Mace, Great; Mace, Horseman's; Morning Star; Net, Fighting; Pick, Horseman's; Pick, War; Pike; Quarterstaff; Scimitar, Long; Scimitar, Short; Scimitar, Two-handed; Sickle; Sling; Spear, Great; Spear, Long; Spear, Short; Staff, Spiked; Sword, Bastard; Sword, Broad; Sword, Long; Sword, Short; Sword, Two-handed; Tonfa; Trident, Hand; Trident, Long; Whip",
      scope: "world",
      type: String,
      config: showConfigOptions,
      requiresReload: true,
    });

    // Store custom class data
    game.settings.register(game.system.id, "customClassData", {
        name: "Custom Classes",
        scope: "world",
        config: false,  // Always hidden from config UI
        type: Object,
        default: {},
    });

    // Insert button to launch custom class app (Foundry v12 only)
    game.settings.register("hyp3e", "openClassEditor", {
        name: game.i18n.localize("HYP3E.settings.openClassEditor"),
        hint: game.i18n.localize("HYP3E.settings.openClassEditorHint"),
        scope: "world",
        config: showConfigOptions,
        type: String, // Doesn't matter since we're intercepting the render
        default: "",
    });

    /********************************************
     * Technical Options
     ********************************************/

    game.settings.register(game.system.id, "logLevel", {
        name: game.i18n.localize("HYP3E.settings.logLevel"),
        hint: game.i18n.localize("HYP3E.settings.logLevelHint"),
        scope: "world",
        type: String,
        choices: {
            "0": "Verbose (Info, Warnings, Errors)",
            "1": "Warnings & Errors",
            "2": "Errors Only"
        },
        default: "1",
        config: showConfigOptions,
        requiresReload: true
    });

    // Game/world setup is complete
    game.settings.register(game.system.id, "setupComplete", {
        name: game.i18n.localize("HYP3E.settings.setupComplete"),
        hint: game.i18n.localize("HYP3E.settings.setupComplete"),
        default: false,
        scope: "world",
        type: Boolean,
        config: false,  // Always hidden from UI
        requiresReload: false,
    });

    // Re-run game/world setup on next launch
    game.settings.register(game.system.id, "reRunSetup", {
        name: game.i18n.localize("HYP3E.settings.reRunSetup"),
        hint: game.i18n.localize("HYP3E.settings.reRunSetupHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: true,
    });

    // Re-run world migration on next launch
    game.settings.register(game.system.id, "reRunMigration", {
        name: game.i18n.localize("HYP3E.settings.reRunMigration"),
        hint: game.i18n.localize("HYP3E.settings.reRunMigrationHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: true,
    });

    // Migrate compendia data, if desired (default false)
    game.settings.register(game.system.id, "migrateCompendia", {
        name: game.i18n.localize("HYP3E.settings.migrateCompendia"),
        hint: game.i18n.localize("HYP3E.settings.migrateCompendiaHint"),
        default: false,
        scope: "world",
        type: Boolean,
        config: showConfigOptions,
        requiresReload: true,
    });
}