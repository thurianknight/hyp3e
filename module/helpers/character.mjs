import { Hyp3eActor } from "../documents/actor.mjs";
import {Hyp3eDialog} from "./dialog.mjs";

/**
 * Hyp3eCharacter class
 * 
 * This class contains all the attribute and class data and methods for a Hyperborea character.
 * It is used to manage the character's attributes, skills, and other data.
 */
export class Hyp3eCharacter {

    /**
     * Str attack mods, from -2 to +2.
     * 
     * Applied to:
     * - `str.atkMod`
     */
    static strAtkMod = {
        0: -2,
        3: -2,
        4: -1,
        7: 0,
        15: 1,
        18: 2,
    };
    /**
     * Str damage mods, from -2 to +3.
     * 
     * Applied to:
     * - `str.dmgMod`
     */
    static strDmgMod = {
        0: -2,
        3: -2,
        4: -1,
        9: 0,
        13: 1,
        17: 2,
        18: 3,
    };
    /**
     * Dex attack mods, from -2 to +3.
     * 
     * Applied to:
     * - `dex.atkMod`
     */
    static dexAtkMod = {
        0: -2,
        3: -2,
        4: -1,
        9: 0,
        13: 1,
        17: 2,
        18: 3,
    };
    /**
     * Dex defense mods, from -2 to +2.
     * 
     * Applied to:
     * - `dex.defMod`
     */
    static dexDefMod = {
        0: -2,
        3: -2,
        4: -1,
        7: 0,
        15: 1,
        18: 2,
    };
    /**
     * Con HP mods, from -1 to +3.
     * 
     * Applied to:
     * - `con.hpMod`
     */
    static conHpMod = {
        0: -1,
        3: -1,
        7: 0,
        13: 1,
        17: 2,
        18: 3,
    };
    /**
     * Con poison mods, from -2 to +2.
     * 
     * Applied to:
     * - `con.poisonMod`
     */
    static conPoisonMod = {
        0: -2,
        3: -2,
        4: -1,
        7: 0,
        15: 1,
        18: 2,
    };
    /**
     * Con trauma mods, from 0 to 95.
     * 
     * Applied to:
     * - `con.traumaSurvive`
     */
    static conTraumaSurvive = {
        0: 0,
        3: 45,
        4: 55,
        7: 65,
        9: 75,
        13: 80,
        15: 85,
        17: 90,
        18: 95,
    };
    /**
     * Modifier table for the Test of Attribute (Str, Dex, Con), from 0 to 5.
     * Applied to:
     * - `str.test`
     * - `dex.test`
     * - `con.test`
     */
    static testOfAttr = {
        0: 0,
        3: 1,
        7: 2,
        13: 3,
        17: 4,
        18: 5,
    };
    /**
     * Modifier table for the Feat of Attribute (Str, Dex, Con), from 0 to 32.
     * Applied to:
     * - `str.feat`
     * - `dex.feat`
     * - `con.feat`
     */
    static featOfAttr = {
        0: 0,
        3: 0,
        4: 1,
        7: 2,
        9: 4,
        13: 8,
        15: 16,
        17: 24,
        18: 32,
    };
    /**
     * Mapping tables for character's spoken languages.
     * Applied to:
     * - `int.spoken`
     */
    static intLanguages = {
        0: 0,
        7: 0,
        13: 1,
        17: 2,
        18: 3,
    };
    /**
     * Magician or Cleric bonus spells per day.
     * Applied to:
     * - `int.bonusSpell1` or `wis.bonusSpell1`
     * - `int.bonusSpell2` or `wis.bonusSpell2`
     * - `int.bonusSpell3` or `wis.bonusSpell3`
     * - `int.bonusSpell4` or `wis.bonusSpell4`
     **/
    static bonusSpell1 = {
        0: false,
        3: false,
        13: true,
    };
    static bonusSpell2 = {
        0: false,
        3: false,
        15: true,
    };
    static bonusSpell3 = {
        0: false,
        3: false,
        17: true,
    };
    static bonusSpell4 = {
        0: false,
        3: false,
        18: true,
    };
    /**
     * Magician or Cleric chance to learn new spell.
     * Applied to:
     * - `int.learnSpell` and `wis.learnSpell`
     **/
    static learnSpell = {
        0: "",
        3: "",
        9: 50,
        13: 65,
        15: 75,
        17: 85,
        18: 95,
    };
    /**
     * Wis willpower mods, from -2 to +2.
     * 
     * Applied to:
     * - `wis.willMod`
     */
    static wisWillMod = {
        0: -2,
        3: -2,
        4: -1,
        7: 0,
        15: 1,
        18: 2,
    };
    /**
     * Cha reaction mod, from -2 to 2.
     * 
     * Applied to:
     * - `cha.reaction`
     */
    static chaReactionMod = {
        0: -3,
        3: -3,
        4: -2,
        7: -1,
        9: 0,
        13: 1,
        17: 2,
        18: 3,
    };
    /**
     * Cha number of retainers, from 1 to 12.
     * 
     * Applied to:
     * - `cha.retainers`
     */
    static chaRetainers = {
        0: 1,
        3: 1,
        4: 2,
        7: 3,
        9: 4,
        13: 6,
        15: 8,
        17: 10,
        18: 12,
    };
    /**
     * Cha adjustment to turn undead, from -1 to +1.
     * 
     * Applied to:
     * - `cha.turnUndead`
     */
    static chaTurnUndead = {
        0: -1,
        3: -1,
        7: 0,
        15: 1,
    };

    /**
     * Reaction lookup table
     */
    static reactionTable = {
        0: "Violent: immediate attack",
        2: "Violent: immediate attack",
        3: "Hostile: antagonistic; attack likely",
        4: "Unfriendly: negative inclination",
        6: "Neutral: disinterested or uncertain (reroll once)",
        9: "Friendly: considers ideas/proposals",
        11: "Agreeable: willing and helpful",
        12: "Affable: extremely accomodating"
    }

    /**
     * Saving throw lookup table
     */
    static savingThrows = {
        0: 17,
        1: 16,
        3: 15,
        5: 14,
        7: 13,
        9: 12,
        11: 11,
        13: 10,
        15: 9,
        17: 8
    }

    /**
     * Hurled item results table
     */
    static hurlingResults = {
        0: "Miss!",
        7: "Stationary or unaware target",
        9: "Large (over 8 ft.)",
        11: "Medium (about 4-8 ft.)",
        13: "Small (under 4 ft.)"
    }

    /**
     * Class-specific data
     * Classes:
     *   Assassin, Barbarian, Bard, Berserker, Cataphract, Cleric, Cryomancer, Druid, Fighter, 
     *   Huntsman, Illusionist, Legerdemainist, Magician, Monk, Necromancer, Paladin, Priest, 
     *   Purloiner, Pyromancer, Ranger, Runegraver, Scout, Shaman, Thief, Warlock, Witch
     */
    static classData = {
        "Assassin": {
            "baseClass": "thief",
            "hitDie": "1d6",
            "fa": 1,
            "ca": null,
            "ta": null,
            "unskilled": -2,
            "attrReqs": {
                "str": 9,
                "dex": 9,
                "int": 9,
            },
            "xpBonusReq": {
                "dex": 16,
                "int": 16,
            },
            "featBonus": {
                "dex": 8,
            },
            "saves": {
                "death": 16,
                "device": 14,
                "transformation": 16,
                "avoidance": 14,
                "sorcery": 16
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                },
                2: {
                    "xp": 1750,
                    "fa": 1,
                },
                3: {
                    "xp": 3500,
                    "fa": 2,
                },
                4: {
                    "xp": 7000,
                    "fa": 3,
                },
                5: {
                    "xp": 14000,
                    "fa": 3,
                },
                6: {
                    "xp": 28000,
                    "fa": 4,
                },
                7: {
                    "xp": 56000,
                    "fa": 5,
                },
                8: {
                    "xp": 112000,
                    "fa": 5,
                },
                9: {
                    "xp": 224000,
                    "fa": 6,
                },
                10: {
                    "xp": 336000,
                    "fa": 7,
                },
                11: {
                    "xp": 448000,
                    "fa": 7,
                },
                12: {
                    "xp": 560000,
                    "fa": 8,
                },
            },
        },
        "Barbarian": {
            "baseClass": "fighter",
            "hitDie": "1d12",
            "fa": 1,
            "ca": null,
            "ta": null,
            "unskilled": 0,
            "attrReqs": {
                "str": 13,
                "dex": 13,
                "con": 13,
            },
            "xpBonusReq": {
                "str": 16,
                "dex": 16,
            },
            "featBonus": {
                "str": 8,
                "dex": 8,
            },
            "saves": {
                "death": 14,
                "device": 14,
                "transformation": 14,
                "avoidance": 14,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                },
                2: {
                    "xp": 3000,
                    "fa": 2,
                },
                3: {
                    "xp": 6000,
                    "fa": 3,
                },
                4: {
                    "xp": 12000,
                    "fa": 4,
                },
                5: {
                    "xp": 24000,
                    "fa": 5,
                },
                6: {
                    "xp": 48000,
                    "fa": 6,
                },
                7: {
                    "xp": 96000,
                    "fa": 7,
                },
                8: {
                    "xp": 192000,
                    "fa": 8,
                },
                9: {
                    "xp": 384000,
                    "fa": 9,
                },
                10: {
                    "xp": 576000,
                    "fa": 10,
                },
                11: {
                    "xp": 768000,
                    "fa": 11,
                },
                12: {
                    "xp": 960000,
                    "fa": 12,
                },
            },
        },
        "Bard": {
            "baseClass": "thief",
            "hitDie": "1d8",
            "fa": 1,
            "ca": 1,
            "spellLists": ["Druid", "Illusionist"],
            "ta": null,
            "unskilled": 0,
            "attrReqs": {
                "str": 9,
                "dex": 9,
                "int": 9,
                "wis": 9,
                "cha": 15,
            },
            "xpBonusReq": {
                "dex": 16,
                "cha": 16,
            },
            "featBonus": {
                "dex": 8,
            },
            "saves": {
                "death": 16,
                "device": 14,
                "transformation": 16,
                "avoidance": 14,
                "sorcery": 16
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                    "ca": 1,
                },
                2: {
                    "xp": 2500,
                    "fa": 1,
                    "ca": 2,
                },
                3: {
                    "xp": 5000,
                    "fa": 2,
                    "ca": 3,
                },
                4: {
                    "xp": 10000,
                    "fa": 3,
                    "ca": 4,
                },
                5: {
                    "xp": 20000,
                    "fa": 3,
                    "ca": 5,
                },
                6: {
                    "xp": 40000,
                    "fa": 4,
                    "ca": 6,
                },
                7: {
                    "xp": 80000,
                    "fa": 5,
                    "ca": 7,
                },
                8: {
                    "xp": 160000,
                    "fa": 5,
                    "ca": 8,
                },
                9: {
                    "xp": 320000,
                    "fa": 6,
                    "ca": 9,
                },
                10: {
                    "xp": 480000,
                    "fa": 7,
                    "ca": 10,
                },
                11: {
                    "xp": 640000,
                    "fa": 7,
                    "ca": 11,
                },
                12: {
                    "xp": 800000,
                    "fa": 8,
                    "ca": 12,
                },
            },
        },
        "Berserker": {
            "baseClass": "fighter",
            "hitDie": "1d12",
            "fa": 1,
            "ca": null,
            "ta": null,
            "unskilled": 0,
            "attrReqs": {
                "str": 15,
                "con": 15,
            },
            "xpBonusReq": {
                "str": 16,
                "con": 16,
            },
            "featBonus": {
                "str": 8,
                "con": 8,
            },
            "saves": {
                "death": 14,
                "device": 14,
                "transformation": 14,
                "avoidance": 14,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                },
                2: {
                    "xp": 2500,
                    "fa": 2,
                },
                3: {
                    "xp": 5000,
                    "fa": 3,
                },
                4: {
                    "xp": 10000,
                    "fa": 4,
                },
                5: {
                    "xp": 20000,
                    "fa": 5,
                },
                6: {
                    "xp": 40000,
                    "fa": 6,
                },
                7: {
                    "xp": 80000,
                    "fa": 7,
                },
                8: {
                    "xp": 160000,
                    "fa": 8,
                },
                9: {
                    "xp": 320000,
                    "fa": 9,
                },
                10: {
                    "xp": 480000,
                    "fa": 10,
                },
                11: {
                    "xp": 640000,
                    "fa": 11,
                },
                12: {
                    "xp": 800000,
                    "fa": 12,
                },
            },
        },
        "Cataphract": {
            "baseClass": "fighter",
            "hitDie": "1d10",
            "fa": 1,
            "ca": null,
            "ta": null,
            "unskilled": 0,
            "attrReqs": {
                "str": 9,
                "dex": 9,
                "wis": 9,
                "cha": 9,
            },
            "xpBonusReq": {
                "str": 16,
                "cha": 16,
            },
            "featBonus": {
                "str": 8,
            },
            "saves": {
                "death": 14,
                "device": 16,
                "transformation": 14,
                "avoidance": 16,
                "sorcery": 16
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                },
                2: {
                    "xp": 2250,
                    "fa": 2,
                },
                3: {
                    "xp": 4500,
                    "fa": 3,
                },
                4: {
                    "xp": 9000,
                    "fa": 4,
                },
                5: {
                    "xp": 18000,
                    "fa": 5,
                },
                6: {
                    "xp": 36000,
                    "fa": 6,
                },
                7: {
                    "xp": 72000,
                    "fa": 7,
                },
                8: {
                    "xp": 144000,
                    "fa": 8,
                },
                9: {
                    "xp": 288000,
                    "fa": 9,
                },
                10: {
                    "xp": 432000,
                    "fa": 10,
                },
                11: {
                    "xp": 576000,
                    "fa": 11,
                },
                12: {
                    "xp": 720000,
                    "fa": 12,
                },
            },
        },
        "Cleric": {
            "baseClass": "cleric",
            "fa": 1,
            "ca": 1,
            "spellLists": ["Cleric"],
            "ta": 1,
            "unskilled": -2,
            "hitDie": "1d8",
            "attrReqs": {
                "wis": 9,
            },
            "xpBonusReq": {
                "wis": 16,
            },
            "saves": {
                "death": 14,
                "device": 16,
                "transformation": 16,
                "avoidance": 16,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                    "ca": 1,
                    "ta": 1,
                },
                2: {
                    "xp": 2000,
                    "fa": 1,
                    "ca": 2,
                    "ta": 2,
                },
                3: {
                    "xp": 4000,
                    "fa": 2,
                    "ca": 3,
                    "ta": 3,
                },
                4: {
                    "xp": 8000,
                    "fa": 3,
                    "ca": 4,
                    "ta": 4,
                },
                5: {
                    "xp": 16000,
                    "fa": 3,
                    "ca": 5,
                    "ta": 5,
                },
                6: {
                    "xp": 32000,
                    "fa": 4,
                    "ca": 6,
                    "ta": 6,
                },
                7: {
                    "xp": 64000,
                    "fa": 5,
                    "ca": 7,
                    "ta": 7,
                },
                8: {
                    "xp": 128000,
                    "fa": 5,
                    "ca": 8,
                    "ta": 8,
                },
                9: {
                    "xp": 256000,
                    "fa": 6,
                    "ca": 9,
                    "ta": 9,
                },
                10: {
                    "xp": 384000,
                    "fa": 7,
                    "ca": 10,
                    "ta": 10,
                },
                11: {
                    "xp": 512000,
                    "fa": 7,
                    "ca": 11,
                    "ta": 11,
                },
                12: {
                    "xp": 640000,
                    "fa": 8,
                    "ca": 12,
                    "ta": 12,
                },
            },
        },
        "Cryomancer": {
            "baseClass": "magician",
            "hitDie": "1d4",
            "fa": 0,
            "ca": 1,
            "spellLists": ["Cryomancer"],
            "ta": null,
            "unskilled": -4,
            "attrReqs": {
                "int": 9,
                "wis": 9,
            },
            "xpBonusReq": {
                "int": 16,
                "wis": 16,
            },
            "saves": {
                "death": 16,
                "device": 14,
                "transformation": 16,
                "avoidance": 16,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 0,
                    "ca": 1,
                },
                2: {
                    "xp": 2500,
                    "fa": 0,
                    "ca": 2,
                },
                3: {
                    "xp": 5000,
                    "fa": 1,
                    "ca": 3,
                },
                4: {
                    "xp": 10000,
                    "fa": 1,
                    "ca": 4,
                },
                5: {
                    "xp": 20000,
                    "fa": 2,
                    "ca": 5,
                },
                6: {
                    "xp": 40000,
                    "fa": 2,
                    "ca": 6,
                },
                7: {
                    "xp": 80000,
                    "fa": 3,
                    "ca": 7,
                },
                8: {
                    "xp": 160000,
                    "fa": 3,
                    "ca": 8,
                },
                9: {
                    "xp": 320000,
                    "fa": 4,
                    "ca": 9,
                },
                10: {
                    "xp": 480000,
                    "fa": 4,
                    "ca": 10,
                },
                11: {
                    "xp": 640000,
                    "fa": 5,
                    "ca": 11,
                },
                12: {
                    "xp": 800000,
                    "fa": 5,
                    "ca": 12,
                },
            },
        },
        "Druid": {
            "baseClass": "cleric",
            "hitDie": "1d8",
            "fa": 1,
            "ca": 1,
            "spellLists": ["Druid"],
            "ta": null,
            "unskilled": -2,
            "attrReqs": {
                "wis": 9,
                "cha": 12,
            },
            "xpBonusReq": {
                "wis": 16,
                "cha": 16,
            },
            "saves": {
                "death": 14,
                "device": 16,
                "transformation": 16,
                "avoidance": 16,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                    "ca": 1,
                },
                2: {
                    "xp": 2000,
                    "fa": 1,
                    "ca": 2,
                },
                3: {
                    "xp": 4000,
                    "fa": 2,
                    "ca": 3,
                },
                4: {
                    "xp": 8000,
                    "fa": 3,
                    "ca": 4,
                },
                5: {
                    "xp": 16000,
                    "fa": 3,
                    "ca": 5,
                },
                6: {
                    "xp": 32000,
                    "fa": 4,
                    "ca": 6,
                },
                7: {
                    "xp": 64000,
                    "fa": 5,
                    "ca": 7,
                },
                8: {
                    "xp": 128000,
                    "fa": 5,
                    "ca": 8,
                },
                9: {
                    "xp": 256000,
                    "fa": 6,
                    "ca": 9,
                },
                10: {
                    "xp": 384000,
                    "fa": 7,
                    "ca": 10,
                },
                11: {
                    "xp": 512000,
                    "fa": 7,
                    "ca": 11,
                },
                12: {
                    "xp": 640000,
                    "fa": 8,
                    "ca": 12,
                },
            },
        },
        "Fighter": {
            "baseClass": "fighter",
            "hitDie": "1d10",
            "fa": 1,
            "ca": null,
            "ta": null,
            "unskilled": 0,
            "attrReqs": {
                "str": 9,
            },
            "xpBonusReq": {
                "str": 16,
            },
            "featBonus": {
                "str": 8,
            },
            "saves": {
                "death": 14,
                "device": 16,
                "transformation": 14,
                "avoidance": 16,
                "sorcery": 16
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                },
                2: {
                    "xp": 2000,
                    "fa": 2,
                },
                3: {
                    "xp": 4000,
                    "fa": 3,
                },
                4: {
                    "xp": 8000,
                    "fa": 4,
                },
                5: {
                    "xp": 16000,
                    "fa": 5,
                },
                6: {
                    "xp": 32000,
                    "fa": 6,
                },
                7: {
                    "xp": 64000,
                    "fa": 7,
                },
                8: {
                    "xp": 128000,
                    "fa": 8,
                },
                9: {
                    "xp": 256000,
                    "fa": 9,
                },
                10: {
                    "xp": 384000,
                    "fa": 10,
                },
                11: {
                    "xp": 512000,
                    "fa": 11,
                },
                12: {
                    "xp": 640000,
                    "fa": 12,
                },
            },
        },
        "Huntsman": {
            "baseClass": "fighter",
            "hitDie": "1d10",
            "fa": 1,
            "ca": null,
            "ta": null,
            "unskilled": 0,
            "attrReqs": {
                "str": 9,
                "dex": 9,
                "wis": 9,
                "cha": 12
            },
            "xpBonusReq": {
                "str": 16,
                "wis": 16,
            },
            "featBonus": {
                "str": 8,
            },
            "saves": {
                "death": 14,
                "device": 16,
                "transformation": 14,
                "avoidance": 16,
                "sorcery": 16
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                },
                2: {
                    "xp": 2250,
                    "fa": 2,
                },
                3: {
                    "xp": 4500,
                    "fa": 3,
                },
                4: {
                    "xp": 9000,
                    "fa": 4,
                },
                5: {
                    "xp": 18000,
                    "fa": 5,
                },
                6: {
                    "xp": 36000,
                    "fa": 6,
                },
                7: {
                    "xp": 72000,
                    "fa": 7,
                },
                8: {
                    "xp": 144000,
                    "fa": 8,
                },
                9: {
                    "xp": 288000,
                    "fa": 9,
                },
                10: {
                    "xp": 432000,
                    "fa": 10,
                },
                11: {
                    "xp": 576000,
                    "fa": 11,
                },
                12: {
                    "xp": 720000,
                    "fa": 12,
                },
            },
        },
        "Illusionist": {
            "baseClass": "magician",
            "hitDie": "1d4",
            "fa": 0,
            "ca": 1,
            "spellLists": ["Illusionist"],
            "ta": null,
            "unskilled": -4,
            "attrReqs": {
                "dex": 9,
                "int": 9,
            },
            "xpBonusReq": {
                "dex": 16,
                "int": 16,
            },
            "featBonus": {
                "dex": 8,
            },
            "saves": {
                "death": 16,
                "device": 14,
                "transformation": 16,
                "avoidance": 16,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 0,
                    "ca": 1,
                },
                2: {
                    "xp": 2500,
                    "fa": 0,
                    "ca": 2,
                },
                3: {
                    "xp": 5000,
                    "fa": 1,
                    "ca": 3,
                },
                4: {
                    "xp": 10000,
                    "fa": 1,
                    "ca": 4,
                },
                5: {
                    "xp": 20000,
                    "fa": 2,
                    "ca": 5,
                },
                6: {
                    "xp": 40000,
                    "fa": 2,
                    "ca": 6,
                },
                7: {
                    "xp": 80000,
                    "fa": 3,
                    "ca": 7,
                },
                8: {
                    "xp": 160000,
                    "fa": 3,
                    "ca": 8,
                },
                9: {
                    "xp": 320000,
                    "fa": 4,
                    "ca": 9,
                },
                10: {
                    "xp": 480000,
                    "fa": 4,
                    "ca": 10,
                },
                11: {
                    "xp": 640000,
                    "fa": 5,
                    "ca": 11,
                },
                12: {
                    "xp": 800000,
                    "fa": 5,
                    "ca": 12,
                },
            },
        },
        "Legerdemainist": {
            "baseClass": "thief",
            "hitDie": "1d6",
            "fa": 1,
            "ca": 1,
            "spellLists": ["Magician"],
            "ta": null,
            "unskilled": -2,
            "attrReqs": {
                "dex": 12,
                "int": 12,
            },
            "xpBonusReq": {
                "dex": 16,
                "int": 16,
            },
            "featBonus": {
                "dex": 8,
            },
            "saves": {
                "death": 16,
                "device": 16,
                "transformation": 16,
                "avoidance": 14,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                    "ca": 1,
                },
                2: {
                    "xp": 2750,
                    "fa": 1,
                    "ca": 2,
                },
                3: {
                    "xp": 5500,
                    "fa": 2,
                    "ca": 3,
                },
                4: {
                    "xp": 11000,
                    "fa": 3,
                    "ca": 4,
                },
                5: {
                    "xp": 22000,
                    "fa": 3,
                    "ca": 5,
                },
                6: {
                    "xp": 44000,
                    "fa": 4,
                    "ca": 6,
                },
                7: {
                    "xp": 88000,
                    "fa": 5,
                    "ca": 7,
                },
                8: {
                    "xp": 176000,
                    "fa": 5,
                    "ca": 8,
                },
                9: {
                    "xp": 352000,
                    "fa": 6,
                    "ca": 9,
                },
                10: {
                    "xp": 528000,
                    "fa": 7,
                    "ca": 10,
                },
                11: {
                    "xp": 704000,
                    "fa": 7,
                    "ca": 11,
                },
                12: {
                    "xp": 880000,
                    "fa": 8,
                    "ca": 12,
                },
            },
        },
        "Magician": {
            "baseClass": "magician",
            "hitDie": "1d4",
            "fa": 0,
            "ca": 1,
            "spellLists": ["Magician"],
            "ta": null,
            "unskilled": -4,
            "attrReqs": {
                "int": 9,
            },
            "xpBonusReq": {
                "int": 16,
            },
            "saves": {
                "death": 16,
                "device": 14,
                "transformation": 16,
                "avoidance": 16,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 0,
                    "ca": 1,
                },
                2: {
                    "xp": 2500,
                    "fa": 0,
                    "ca": 2,
                },
                3: {
                    "xp": 5000,
                    "fa": 1,
                    "ca": 3,
                },
                4: {
                    "xp": 10000,
                    "fa": 1,
                    "ca": 4,
                },
                5: {
                    "xp": 20000,
                    "fa": 2,
                    "ca": 5,
                },
                6: {
                    "xp": 40000,
                    "fa": 2,
                    "ca": 6,
                },
                7: {
                    "xp": 80000,
                    "fa": 3,
                    "ca": 7,
                },
                8: {
                    "xp": 160000,
                    "fa": 3,
                    "ca": 8,
                },
                9: {
                    "xp": 320000,
                    "fa": 4,
                    "ca": 9,
                },
                10: {
                    "xp": 480000,
                    "fa": 4,
                    "ca": 10,
                },
                11: {
                    "xp": 640000,
                    "fa": 5,
                    "ca": 11,
                },
                12: {
                    "xp": 800000,
                    "fa": 5,
                    "ca": 12,
                },
            },
        },
        "Monk": {
            "baseClass": "cleric",
            "hitDie": "1d8",
            "fa": 0,
            "ca": null,
            "ta": null,
            "unskilled": -2,
            "attrReqs": {
                "str": 9,
                "dex": 9,
                "wis": 9,
            },
            "xpBonusReq": {
                "dex": 16,
                "wis": 16,
            },
            "featBonus": {
                "dex": 8,
            },
            "saves": {
                "death": 16,
                "device": 16,
                "transformation": 14,
                "avoidance": 14,
                "sorcery": 16
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 0,
                },
                2: {
                    "xp": 2500,
                    "fa": 1,
                },
                3: {
                    "xp": 5000,
                    "fa": 2,
                },
                4: {
                    "xp": 10000,
                    "fa": 3,
                },
                5: {
                    "xp": 20000,
                    "fa": 4,
                },
                6: {
                    "xp": 40000,
                    "fa": 5,
                },
                7: {
                    "xp": 80000,
                    "fa": 6,
                },
                8: {
                    "xp": 160000,
                    "fa": 7,
                },
                9: {
                    "xp": 320000,
                    "fa": 8,
                },
                10: {
                    "xp": 480000,
                    "fa": 9,
                },
                11: {
                    "xp": 640000,
                    "fa": 10,
                },
                12: {
                    "xp": 800000,
                    "fa": 11,
                },
            },
        },
        "Necromancer": {
            "baseClass": "magician",
            "hitDie": "1d4",
            "fa": 0,
            "ca": 1,
            "spellLists": ["Necromancer"],
            "ta": null,
            "unskilled": -4,
            "attrReqs": {
                "int": 9,
                "wis": 9,
            },
            "xpBonusReq": {
                "int": 16,
                "wis": 16,
            },
            "saves": {
                "death": 14,
                "device": 16,
                "transformation": 16,
                "avoidance": 16,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 0,
                    "ca": 1,
                    "ta": null,
                },
                2: {
                    "xp": 2500,
                    "fa": 0,
                    "ca": 2,
                    "ta": null,
                },
                3: {
                    "xp": 5000,
                    "fa": 1,
                    "ca": 3,
                    "ta": 1,
                },
                4: {
                    "xp": 10000,
                    "fa": 1,
                    "ca": 4,
                    "ta": 2,
                },
                5: {
                    "xp": 20000,
                    "fa": 2,
                    "ca": 5,
                    "ta": 3,
                },
                6: {
                    "xp": 40000,
                    "fa": 2,
                    "ca": 6,
                    "ta": 4,
                },
                7: {
                    "xp": 80000,
                    "fa": 3,
                    "ca": 7,
                    "ta": 5,
                },
                8: {
                    "xp": 160000,
                    "fa": 3,
                    "ca": 8,
                    "ta": 6,
                },
                9: {
                    "xp": 320000,
                    "fa": 4,
                    "ca": 9,
                    "ta": 7,
                },
                10: {
                    "xp": 480000,
                    "fa": 4,
                    "ca": 10,
                    "ta": 8,
                },
                11: {
                    "xp": 640000,
                    "fa": 5,
                    "ca": 11,
                    "ta": 9,
                },
                12: {
                    "xp": 800000,
                    "fa": 5,
                    "ca": 12,
                    "ta": 10,
                },
            },
        },
        "Paladin": {
            "baseClass": "fighter",
            "hitDie": "1d10",
            "fa": 1,
            "ca": null,
            "ta": null,
            "unskilled": 0,
            "attrReqs": {
                "str": 9,
                "dex": 9,
                "wis": 9,
                "cha": 15,
            },
            "xpBonusReq": {
                "str": 16,
                "cha": 16,
            },
            "featBonus": {
                "str": 8,
            },
            "saves": {
                "death": 14,
                "device": 14,
                "transformation": 14,
                "avoidance": 14,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                    "ca": null,
                    "ta": null,
                },
                2: {
                    "xp": 2750,
                    "fa": 2,
                    "ca": null,
                    "ta": null,
                },
                3: {
                    "xp": 5500,
                    "fa": 3,
                    "ca": null,
                    "ta": null,
                },
                4: {
                    "xp": 11000,
                    "fa": 4,
                    "ca": null,
                    "ta": null,
                },
                5: {
                    "xp": 22000,
                    "fa": 5,
                    "ca": null,
                    "ta": 1,
                },
                6: {
                    "xp": 44000,
                    "fa": 6,
                    "ca": null,
                    "ta": 2,
                },
                7: {
                    "xp": 88000,
                    "fa": 7,
                    "ca": 1,
                    "ta": 3,
                },
                8: {
                    "xp": 176000,
                    "fa": 8,
                    "ca": 2,
                    "ta": 4,
                },
                9: {
                    "xp": 352000,
                    "fa": 9,
                    "ca": 3,
                    "ta": 5,
                },
                10: {
                    "xp": 528000,
                    "fa": 10,
                    "ca": 4,
                    "ta": 6,
                },
                11: {
                    "xp": 704000,
                    "fa": 11,
                    "ca": 5,
                    "ta": 7,
                },
                12: {
                    "xp": 880000,
                    "fa": 12,
                    "ca": 6,
                    "ta": 8,
                },
            },
        },
        "Priest": {
            "baseClass": "cleric",
            "hitDie": "1d4",
            "fa": 0,
            "ca": 1,
            "spellLists": ["Cleric"],
            "ta": 1,
            "unskilled": -4,
            "attrReqs": {
                "wis": 9,
                "cha": 9,
            },
            "xpBonusReq": {
                "wis": 16,
                "cha": 16,
            },
            "saves": {
                "death": 14,
                "device": 16,
                "transformation": 16,
                "avoidance": 16,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 0,
                    "ca": 1,
                    "ta": 1,
                },
                2: {
                    "xp": 2000,
                    "fa": 0,
                    "ca": 2,
                    "ta": 2,
                },
                3: {
                    "xp": 4000,
                    "fa": 1,
                    "ca": 3,
                    "ta": 3,
                },
                4: {
                    "xp": 8000,
                    "fa": 1,
                    "ca": 4,
                    "ta": 4,
                },
                5: {
                    "xp": 16000,
                    "fa": 2,
                    "ca": 5,
                    "ta": 5,
                },
                6: {
                    "xp": 32000,
                    "fa": 2,
                    "ca": 6,
                    "ta": 6,
                },
                7: {
                    "xp": 64000,
                    "fa": 3,
                    "ca": 7,
                    "ta": 7,
                },
                8: {
                    "xp": 128000,
                    "fa": 3,
                    "ca": 8,
                    "ta": 8,
                },
                9: {
                    "xp": 256000,
                    "fa": 4,
                    "ca": 9,
                    "ta": 9,
                },
                10: {
                    "xp": 384000,
                    "fa": 4,
                    "ca": 10,
                    "ta": 10,
                },
                11: {
                    "xp": 512000,
                    "fa": 5,
                    "ca": 11,
                    "ta": 11,
                },
                12: {
                    "xp": 640000,
                    "fa": 5,
                    "ca": 12,
                    "ta": 12,
                },
            },
        },
        "Purloiner": {
            "baseClass": "thief",
            "hitDie": "1d6",
            "fa": 1,
            "ca": 1,
            "spellLists": ["Cleric"],
            "ta": null,
            "unskilled": -2,
            "attrReqs": {
                "dex": 12,
                "wis": 12,
            },
            "xpBonusReq": {
                "dex": 16,
                "wis": 16,
            },
            "featBonus": {
                "dex": 8,
            },
            "saves": {
                "death": 16,
                "device": 16,
                "transformation": 16,
                "avoidance": 14,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                    "ca": 1,
                    "ta": null,
                },
                2: {
                    "xp": 2500,
                    "fa": 1,
                    "ca": 2,
                    "ta": null,
                },
                3: {
                    "xp": 5000,
                    "fa": 2,
                    "ca": 3,
                    "ta": 1,
                },
                4: {
                    "xp": 10000,
                    "fa": 3,
                    "ca": 4,
                    "ta": 2,
                },
                5: {
                    "xp": 20000,
                    "fa": 3,
                    "ca": 5,
                    "ta": 3,
                },
                6: {
                    "xp": 40000,
                    "fa": 4,
                    "ca": 6,
                    "ta": 4,
                },
                7: {
                    "xp": 80000,
                    "fa": 5,
                    "ca": 7,
                    "ta": 5,
                },
                8: {
                    "xp": 160000,
                    "fa": 5,
                    "ca": 8,
                    "ta": 6,
                },
                9: {
                    "xp": 320000,
                    "fa": 6,
                    "ca": 9,
                    "ta": 7,
                },
                10: {
                    "xp": 480000,
                    "fa": 7,
                    "ca": 10,
                    "ta": 8,
                },
                11: {
                    "xp": 640000,
                    "fa": 7,
                    "ca": 11,
                    "ta": 9,
                },
                12: {
                    "xp": 800000,
                    "fa": 8,
                    "ca": 12,
                    "ta": 10,
                },
            },
        },
        "Pyromancer": {
            "baseClass": "magician",
            "hitDie": "1d4",
            "fa": 0,
            "ca": 1,
            "spellLists": ["Pyromancer"],
            "ta": null,
            "unskilled": -4,
            "attrReqs": {
                "int": 9,
                "wis": 9,
            },
            "xpBonusReq": {
                "int": 16,
                "wis": 16,
            },
            "saves": {
                "death": 16,
                "device": 14,
                "transformation": 16,
                "avoidance": 16,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 0,
                    "ca": 1,
                },
                2: {
                    "xp": 2500,
                    "fa": 0,
                    "ca": 2,
                },
                3: {
                    "xp": 5000,
                    "fa": 1,
                    "ca": 3,
                },
                4: {
                    "xp": 10000,
                    "fa": 1,
                    "ca": 4,
                },
                5: {
                    "xp": 20000,
                    "fa": 2,
                    "ca": 5,
                },
                6: {
                    "xp": 40000,
                    "fa": 2,
                    "ca": 6,
                },
                7: {
                    "xp": 80000,
                    "fa": 3,
                    "ca": 7,
                },
                8: {
                    "xp": 160000,
                    "fa": 3,
                    "ca": 8,
                },
                9: {
                    "xp": 320000,
                    "fa": 4,
                    "ca": 9,
                },
                10: {
                    "xp": 480000,
                    "fa": 4,
                    "ca": 10,
                },
                11: {
                    "xp": 640000,
                    "fa": 5,
                    "ca": 11,
                },
                12: {
                    "xp": 800000,
                    "fa": 5,
                    "ca": 12,
                },
            },
        },
        "Ranger": {
            "baseClass": "fighter",
            "hitDie": "1d10",
            "fa": 1,
            "ca": null,
            "ta": null,
            "unskilled": 0,
            "attrReqs": {
                "str": 9,
                "dex": 9,
                "int": 9,
                "wis": 9,
            },
            "xpBonusReq": {
                "str": 16,
                "wis": 16,
            },
            "featBonus": {
                "str": 8,
            },
            "saves": {
                "death": 14,
                "device": 16,
                "transformation": 14,
                "avoidance": 16,
                "sorcery": 16
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                    "ca": null,
                },
                2: {
                    "xp": 2250,
                    "fa": 2,
                    "ca": null,
                },
                3: {
                    "xp": 4500,
                    "fa": 3,
                    "ca": null,
                },
                4: {
                    "xp": 9000,
                    "fa": 4,
                    "ca": null,
                },
                5: {
                    "xp": 18000,
                    "fa": 5,
                    "ca": null,
                },
                6: {
                    "xp": 36000,
                    "fa": 6,
                    "ca": null,
                },
                7: {
                    "xp": 72000,
                    "fa": 7,
                    "ca": 1,
                },
                8: {
                    "xp": 144000,
                    "fa": 8,
                    "ca": 2,
                },
                9: {
                    "xp": 288000,
                    "fa": 9,
                    "ca": 3,
                },
                10: {
                    "xp": 432000,
                    "fa": 10,
                    "ca": 4,
                },
                11: {
                    "xp": 576000,
                    "fa": 11,
                    "ca": 5,
                },
                12: {
                    "xp": 720000,
                    "fa": 12,
                    "ca": 6,
                },
            },
        },
        "Runegraver": {
            "baseClass": "cleric",
            "hitDie": "1d8",
            "fa": 1,
            "ca": 1,
            "ta": null,
            "unskilled": 0,
            "attrReqs": {
                "str": 9,
                "wis": 12,
            },
            "xpBonusReq": {
                "str": 16,
                "wis": 16,
            },
            "featBonus": {
                "str": 8,
            },
            "saves": {
                "death": 16,
                "device": 16,
                "transformation": 14,
                "avoidance": 16,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                    "ca": 1,
                },
                2: {
                    "xp": 3000,
                    "fa": 2,
                    "ca": 2,
                },
                3: {
                    "xp": 6000,
                    "fa": 3,
                    "ca": 3,
                },
                4: {
                    "xp": 12000,
                    "fa": 4,
                    "ca": 4,
                },
                5: {
                    "xp": 24000,
                    "fa": 5,
                    "ca": 5,
                },
                6: {
                    "xp": 48000,
                    "fa": 6,
                    "ca": 6,
                },
                7: {
                    "xp": 96000,
                    "fa": 7,
                    "ca": 7,
                },
                8: {
                    "xp": 192000,
                    "fa": 8,
                    "ca": 8,
                },
                9: {
                    "xp": 384000,
                    "fa": 9,
                    "ca": 9,
                },
                10: {
                    "xp": 576000,
                    "fa": 10,
                    "ca": 10,
                },
                11: {
                    "xp": 768000,
                    "fa": 11,
                    "ca": 11,
                },
                12: {
                    "xp": 960000,
                    "fa": 12,
                    "ca": 12,
                },
            },
        },
        "Scout": {
            "baseClass": "thief",
            "hitDie": "1d6",
            "fa": 1,
            "ca": null,
            "ta": null,
            "unskilled": -2,
            "attrReqs": {
                "dex": 9,
                "int": 9,
            },
            "xpBonusReq": {
                "dex": 16,
                "int": 16,
            },
            "featBonus": {
                "dex": 8,
            },
            "saves": {
                "death": 16,
                "device": 14,
                "transformation": 16,
                "avoidance": 14,
                "sorcery": 16
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                },
                2: {
                    "xp": 1750,
                    "fa": 1,
                },
                3: {
                    "xp": 3500,
                    "fa": 2,
                },
                4: {
                    "xp": 7000,
                    "fa": 3,
                },
                5: {
                    "xp": 14000,
                    "fa": 3,
                },
                6: {
                    "xp": 28000,
                    "fa": 4,
                },
                7: {
                    "xp": 56000,
                    "fa": 5,
                },
                8: {
                    "xp": 112000,
                    "fa": 5,
                },
                9: {
                    "xp": 224000,
                    "fa": 6,
                },
                10: {
                    "xp": 336000,
                    "fa": 7,
                },
                11: {
                    "xp": 448000,
                    "fa": 7,
                },
                12: {
                    "xp": 560000,
                    "fa": 8,
                },
            },
        },
        "Shaman": {
            "baseClass": "cleric",
            "hitDie": "1d6",
            "fa": 0,
            "ca": 1,
            "spellLists": ["Cleric", "Magician"],
            "ta": null,
            "unskilled": -4,
            "attrReqs": {
                "int": 9,
                "wis": 12
            },
            "xpBonusReq": {
                "int": 16,
                "wis": 16,
            },
            "saves": {
                "death": 14,
                "device": 16,
                "transformation": 16,
                "avoidance": 16,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 0,
                    "ca": 1,
                    "ta": null,
                },
                2: {
                    "xp": 2500,
                    "fa": 0,
                    "ca": 2,
                    "ta": null,
                },
                3: {
                    "xp": 5000,
                    "fa": 1,
                    "ca": 3,
                    "ta": 1,
                },
                4: {
                    "xp": 10000,
                    "fa": 2,
                    "ca": 4,
                    "ta": 2,
                },
                5: {
                    "xp": 20000,
                    "fa": 2,
                    "ca": 5,
                    "ta": 3,
                },
                6: {
                    "xp": 40000,
                    "fa": 3,
                    "ca": 6,
                    "ta": 4,
                },
                7: {
                    "xp": 80000,
                    "fa": 4,
                    "ca": 7,
                    "ta": 5,
                },
                8: {
                    "xp": 160000,
                    "fa": 4,
                    "ca": 8,
                    "ta": 6,
                },
                9: {
                    "xp": 320000,
                    "fa": 5,
                    "ca": 9,
                    "ta": 7,
                },
                10: {
                    "xp": 480000,
                    "fa": 6,
                    "ca": 10,
                    "ta": 8,
                },
                11: {
                    "xp": 640000,
                    "fa": 6,
                    "ca": 11,
                    "ta": 9,
                },
                12: {
                    "xp": 800000,
                    "fa": 7,
                    "ca": 12,
                    "ta": 10,
                },
            },
        },
        "Thief": {
            "baseClass": "thief",
            "hitDie": "1d6",
            "fa": 1,
            "ca": null,
            "ta": null,
            "unskilled": -2,
            "attrReqs": {
                "dex": 9,
            },
            "xpBonusReq": {
                "dex": 16,
            },
            "featBonus": {
                "dex": 8,
            },
            "saves": {
                "death": 16,
                "device": 14,
                "transformation": 16,
                "avoidance": 14,
                "sorcery": 16
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                },
                2: {
                    "xp": 1500,
                    "fa": 1,
                },
                3: {
                    "xp": 3000,
                    "fa": 2,
                },
                4: {
                    "xp": 6000,
                    "fa": 3,
                },
                5: {
                    "xp": 12000,
                    "fa": 3,
                },
                6: {
                    "xp": 24000,
                    "fa": 4,
                },
                7: {
                    "xp": 48000,
                    "fa": 5,
                },
                8: {
                    "xp": 96000,
                    "fa": 5,
                },
                9: {
                    "xp": 192000,
                    "fa": 6,
                },
                10: {
                    "xp": 288000,
                    "fa": 7,
                },
                11: {
                    "xp": 384000,
                    "fa": 7,
                },
                12: {
                    "xp": 480000,
                    "fa": 8,
                },
            },
        },
        "Warlock": {
            "baseClass": "fighter",
            "hitDie": "1d8",
            "fa": 1,
            "ca": 1,
            "spellLists": ["Magician"],
            "ta": null,
            "unskilled": 0,
            "attrReqs": {
                "str": 12,
                "int": 12,
            },
            "xpBonusReq": {
                "str": 16,
                "int": 16,
            },
            "featBonus": {
                "str": 8,
            },
            "saves": {
                "death": 16,
                "device": 16,
                "transformation": 14,
                "avoidance": 16,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 1,
                    "ca": 1,
                },
                2: {
                    "xp": 3000,
                    "fa": 2,
                    "ca": 2,
                },
                3: {
                    "xp": 6000,
                    "fa": 3,
                    "ca": 3,
                },
                4: {
                    "xp": 12000,
                    "fa": 4,
                    "ca": 4,
                },
                5: {
                    "xp": 24000,
                    "fa": 5,
                    "ca": 5,
                },
                6: {
                    "xp": 48000,
                    "fa": 6,
                    "ca": 6,
                },
                7: {
                    "xp": 96000,
                    "fa": 7,
                    "ca": 7,
                },
                8: {
                    "xp": 192000,
                    "fa": 8,
                    "ca": 8,
                },
                9: {
                    "xp": 384000,
                    "fa": 9,
                    "ca": 9,
                },
                10: {
                    "xp": 576000,
                    "fa": 10,
                    "ca": 10,
                },
                11: {
                    "xp": 768000,
                    "fa": 11,
                    "ca": 11,
                },
                12: {
                    "xp": 960000,
                    "fa": 12,
                    "ca": 12,
                },
            },
        },
        "Witch": {
            "baseClass": "magician",
            "hitDie": "1d4",
            "fa": 0,
            "ca": 1,
            "spellLists": ["Witch"],
            "ta": null,
            "unskilled": -4,
            "attrReqs": {
                "int": 9,
                "wis": 9,
                "cha": 12,
            },
            "xpBonusReq": {
                "int": 16,
                "cha": 16,
            },
            "saves": {
                "death": 16,
                "device": 16,
                "transformation": 14,
                "avoidance": 16,
                "sorcery": 14
            },
            "levelAdvancement": {
                1: {
                    "xp": 0,
                    "fa": 0,
                    "ca": 1,
                },
                2: {
                    "xp": 3000,
                    "fa": 0,
                    "ca": 2,
                },
                3: {
                    "xp": 6000,
                    "fa": 1,
                    "ca": 3,
                },
                4: {
                    "xp": 12000,
                    "fa": 1,
                    "ca": 4,
                },
                5: {
                    "xp": 24000,
                    "fa": 2,
                    "ca": 5,
                },
                6: {
                    "xp": 48000,
                    "fa": 2,
                    "ca": 6,
                },
                7: {
                    "xp": 96000,
                    "fa": 3,
                    "ca": 7,
                },
                8: {
                    "xp": 192000,
                    "fa": 3,
                    "ca": 8,
                },
                9: {
                    "xp": 384000,
                    "fa": 4,
                    "ca": 9,
                },
                10: {
                    "xp": 576000,
                    "fa": 4,
                    "ca": 10,
                },
                11: {
                    "xp": 768000,
                    "fa": 5,
                    "ca": 11,
                },
                12: {
                    "xp": 960000,
                    "fa": 5,
                    "ca": 12,
                },
            },
        },
    }

    static _valueFromTable(table, val) {
        let output;
        if (CONFIG.HYP3E.debugMessages) { console.log(`_valueFromTable: ${table}, ${val}`) }
        for (let i = 0; i <= val; i++) {
            if (table[i] != undefined) {
                output = table[i];
            }
        }
        return output;
    }

    static _stringFromTable(table, val) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`_stringFromTable: ${table}, ${val}`) }
        let output = ""
        output = table[val]
        return output
    }

    /**
     * Check the character's XP and level-up if possible
     */
    static async levelUp(dataset) {
        console.log("levelUp: Checking XP for level up...")

        let actor = game.actors.get(dataset.actorId)
        if (!actor) {
            console.error(`levelUp: Actor not found for id ${dataset.actorId}`)
            return false
        }
        // Log the dataset before the dialog renders
        if (CONFIG.HYP3E.debugMessages) { console.log(`levelUp: ${actor.name} dataset: `, dataset) }

        // Display the confirmation dialog, and exit if the user cancels this action
        try {
            let rollResponse = await Hyp3eDialog.ShowLevelUpDialog(dataset)
        } catch(err) {
            console.log(`levelUp: Dialog error ${err}`)
            return false
        }

        // Initialize character data
        let data = foundry.utils.deepClone(actor.system)

        // Get the class & level data we need
        let thisClass = this.classData[data.details.class]
        let currLevel = data.details.level.value ? parseInt(data.details.level.value) : 1
        let nextLevel = currLevel + 1
        let requiredXp = thisClass.levelAdvancement[nextLevel].xp
        let nextLevelXp = thisClass.levelAdvancement[nextLevel+1].xp

        // Do we have enough XP to level up?
        let currentXp = parseInt((data.details.xp.value).replace(/,|\./g, ""))
        if (currentXp < requiredXp) {
            ui.notifications.warn(`Not enough XP to level up! ${currentXp} < ${requiredXp}`)
            console.log(`levelUp: Not enough XP to level up! ${currentXp} < ${requiredXp}`)
            return false
        }

        // Yes, we can level up
        console.log(`levelUp: Leveling up ${actor.name} to level ${nextLevel}...`)
        // Update the actor's level and next-level XP
        data.details.level.value = nextLevel
        data.details.xp.toNextLvl = nextLevelXp
        // Update fighting ability, casting ability, and turning ability
        data.fa = thisClass.levelAdvancement[nextLevel].fa
        if (thisClass.levelAdvancement[nextLevel].ca) { data.ca = thisClass.levelAdvancement[nextLevel].ca }
        if (thisClass.levelAdvancement[nextLevel].ta) { data.ta = thisClass.levelAdvancement[nextLevel].ta }
        
        // Update saving throws, if needed
        let currentSave = this._valueFromTable(this.savingThrows, currLevel)
        let newSave = this._valueFromTable(this.savingThrows, nextLevel)
        if (newSave < currentSave) {
            // data.saves.death.value = this._valueFromTable(this.savingThrows, nextLevel)
            if (parseInt(data.saves.death.value) < newSave) {
                // Calculate the difference & update
                let diff = 1 + (newSave - parseInt(data.saves.death.value))
                data.saves.death.value = newSave - diff
            } else {
                data.saves.death.value = newSave
            }
            // data.saves.device.value = this._valueFromTable(this.savingThrows, nextLevel)
            if (parseInt(data.saves.device.value) < newSave) {
                // Calculate the difference & update
                let diff = 1 + (newSave - parseInt(data.saves.device.value))
                data.saves.device.value = newSave - diff
            } else {
                data.saves.device.value = newSave
            }
            // data.saves.transformation.value = this._valueFromTable(this.savingThrows, nextLevel)
            if (parseInt(data.saves.transformation.value) < newSave) {
                // Calculate the difference & update
                let diff = 1 + (newSave - parseInt(data.saves.transformation.value))
                data.saves.transformation.value = newSave - diff
            } else {
                data.saves.transformation.value = newSave
            }
            // data.saves.avoidance.value = this._valueFromTable(this.savingThrows, nextLevel)
            if (parseInt(data.saves.avoidance.value) < newSave) {
                // Calculate the difference & update
                let diff = 1 + (newSave - parseInt(data.saves.avoidance.value))
                data.saves.avoidance.value = newSave - diff
            } else {
                data.saves.avoidance.value = newSave
            }
            // data.saves.sorcery.value = this._valueFromTable(this.savingThrows, nextLevel)
            if (parseInt(data.saves.sorcery.value) < newSave) {
                // Calculate the difference & update
                let diff = 1 + (newSave - parseInt(data.saves.sorcery.value))
                data.saves.sorcery.value = newSave - diff
            } else {
                data.saves.sorcery.value = newSave
            }
        }

        // Use the modified data clone to create a clean update object for the character
        let updateData = {
            system: {
                hd: data.hd,
                fa: data.fa,
                ca: data.ca,
                ta: data.ta,
                saves: {
                    death: {
                        value: data.saves.death.value
                    },
                    device: {
                        value: data.saves.device.value
                    },
                    transformation: {
                        value: data.saves.transformation.value
                    },
                    avoidance: {
                        value: data.saves.avoidance.value
                    },
                    sorcery: {
                        value: data.saves.sorcery.value
                    }
                },
                details: {
                    level: {
                        value: nextLevel
                    },
                    xp: {
                        toNextLvl: nextLevelXp
                    }
                }
            }
        }

        // Apply updates to the actor
        try {
            if (CONFIG.HYP3E.debugMessages) { console.log('levelUp: Updated level data:', updateData) }
            if(actor.validate(updateData)) {
                if (CONFIG.HYP3E.debugMessages) { console.log('levelUp: Validation OK, executing update...') }
                // Update the main actor data
                await actor.update(updateData)
                // Log the actor data after updating
                if (CONFIG.HYP3E.debugMessages) { console.log('levelUp: Actor after update:', actor.system) }
            }
        } catch(err) {
            console.log(`levelUp: Actor update error: ${err}`)
        }

        // Update the actor with the new data
        await actor.update(updateData)

        // Setup a chat message to show the level-up values
        let label = `<div class='medium-bold'>Level Up!</div>`
        let content = `<ul>`
        content += `<li>New Level: ${nextLevel}</li>`
        content += `<li>XP: ${currentXp} / ${nextLevelXp}</li>`
        content += `<li>Fighting Ability: ${data.fa}</li>`
        if (data.ca) { content += `<li>Casting Ability: ${data.ca}</li>` }
        if (data.ta) { content += `<li>Turning Ability: ${data.ta}</li>` }
        if (newSave < currentSave) {
            content += `<li>Saving Throws vs:</li><ul>`
            content += `<li>Death: ${data.saves.death.value}</li>`
            content += `<li>Device: ${data.saves.device.value}</li>`
            content += `<li>Transformation: ${data.saves.transformation.value}</li>`
            content += `<li>Avoidance: ${data.saves.avoidance.value}</li>`
            content += `<li>Sorcery: ${data.saves.sorcery.value}</li>`
            content += `</ul>`
        } else {
            content += `<li>Saving Throws do not change at this level.</li>`
        }
        content += `</ul>`

        // Send a chat message to the user
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            flavor: label,
            content: content
        });
        return true

    }

    /**
     * Set or reset all attribute modifiers
     */
    static async setAttributeMods(dataset) {
        console.log("setAttributeMods: Setting attribute modifiers...")

        let actor = game.actors.get(dataset.actorId)
        if (!actor) {
            console.error(`setAttributeMods: Actor not found for id ${dataset.actorId}`)
            return false
        }
        // Log the dataset before the dialog renders
        if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: ${actor.name} dataset: `, dataset) }

        // Display the confirmation dialog, and exit if the user cancels this action
        try {
            let rollResponse = await Hyp3eDialog.ShowSetModifiersDialog(dataset)
        } catch(err) {
            console.log(`setAttributeMods: Dialog error ${err}`)
            return false
        }

        // Initialize some vars
        let data = foundry.utils.deepClone(actor.system)
        let thisClass = {}
        let xpBonusPossible = null
        let getsBonusSpell = false

        // Setup chat message variables
        let label = `<div class='medium-bold'>Values for character updated...</div>`
        let content = `<ul>`

        // Here we modify the cloned data object of the actor...
        if (CONFIG.HYP3E.debugMessages) { console.log("setAttributeMods: cloned Actor system data:", data) }
        if (data.details.class) {
            // Override label if character class selected
            label = `<div class='medium-bold'>Values for ${data.details.class} updated...</div>`
            if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Setting ${data.details.class} hit die...`) }
            thisClass = this.classData[data.details.class]
            if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Class Data for ${data.details.class}: `, thisClass) }
            data.hd = thisClass.hitDie
            content += `<li>Hit Die: ${thisClass.hitDie}</li>`
            data.fa = thisClass.fa
            content += `<li>Fighting Ability: ${thisClass.fa}</li>`
            data.ca = thisClass.ca
            content += `<li>Casting Ability: ${thisClass.ca}</li>`
            if (thisClass.spellLists) {
                if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Setting ${data.details.class} spell lists...`) }
                data.spellList = thisClass.spellLists[0]
                data.spellList2 = thisClass.spellLists.length > 1 ? thisClass.spellLists[1] : null
                content += `<li>Spell List(s): ${thisClass.spellLists.join(", ")}</li>`
            }
            data.ta = thisClass.ta
            content += `<li>Turning Ability: ${thisClass.ta}</li>`
            data.unskilled = thisClass.unskilled
            content += `<li>Unskilled Weapon Penalty: ${thisClass.unskilled}</li>`
            data.details.xp.primeAttr = ""
            content += `<li>Saving Throws vs:</li><ul>`
            content += `<li>Death: ${thisClass.saves.death}</li>`
            data.saves.death.value = thisClass.saves.death
            content += `<li>Device: ${thisClass.saves.device}</li>`
            data.saves.device.value = thisClass.saves.device
            content += `<li>Transformation: ${thisClass.saves.transformation}</li>`
            data.saves.transformation.value = thisClass.saves.transformation
            content += `<li>Avoidance: ${thisClass.saves.avoidance}</li>`
            data.saves.avoidance.value = thisClass.saves.avoidance
            content += `<li>Sorcery: ${thisClass.saves.sorcery}</li>`
            data.saves.sorcery.value = thisClass.saves.sorcery
            content += `</ul>`
        }
        if (data.attributes) {
            for (let [k, v] of Object.entries(data.attributes)) {
                switch (k) {
                    case "str":
                        if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Setting ${k} modifiers...`) }
                        content += `<li>ST Mods:</li><ul>`
                        data.attributes.str.atkMod = this._valueFromTable(this.strAtkMod, data.attributes.str.value)
                        content += `<li>Melee Attack Mod: ${data.attributes.str.atkMod}</li>`
                        data.attributes.str.dmgMod = this._valueFromTable(this.strDmgMod, data.attributes.str.value)
                        content += `<li>Damage Mod: ${data.attributes.str.dmgMod}</li>`
                        data.attributes.str.test = this._valueFromTable(this.testOfAttr, data.attributes.str.value)
                        content += `<li>Test of ST: ${data.attributes.str.test}</li>`
                        data.attributes.str.feat = this._valueFromTable(this.featOfAttr, data.attributes.str.value)
                        content += `<li>Feat of ST: ${data.attributes.str.feat}</li>`
                        if (data.details.class) {
                            // Check if ST does not meet attribute pre-req for this class
                            if (thisClass.attrReqs.str) {
                                if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Checking ST requirements for ${data.details.class}...`) }
                                if (data.attributes.str.value < thisClass.attrReqs.str) {
                                    ui.notifications.warn(`ST is too low for ${data.details.class}!`)
                                }
                            }
                            if (thisClass.xpBonusReq.str) {
                                if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Checking XP bonus on high ST...`) }
                                if (data.attributes.str.value >= thisClass.xpBonusReq.str && xpBonusPossible != false) {
                                    xpBonusPossible = true
                                } else {
                                    xpBonusPossible = false
                                }
                                if (data.details.xp.primeAttr == "") {
                                    data.details.xp.primeAttr = "ST"
                                } else {
                                    data.details.xp.primeAttr += ", ST"
                                }
                            }
                            if (thisClass.featBonus && thisClass.featBonus.str) {
                                if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Checking for Extraordinary Feat of ST...`) }
                                data.attributes.str.feat += thisClass.featBonus.str
                                content += `<li>Extraordinary Feat of ST override: ${data.attributes.str.feat}</li>`
                            }
                        }
                        content += `</ul>`
                        break

                    case "dex":
                        if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Setting ${k} modifiers...`) }
                        content += `<li>DX Mods:</li><ul>`
                        data.attributes.dex.atkMod = this._valueFromTable(this.dexAtkMod, data.attributes.dex.value)
                        content += `<li>Missile Attack Mod: ${data.attributes.dex.atkMod}</li>`
                        data.attributes.dex.defMod = this._valueFromTable(this.dexDefMod, data.attributes.dex.value)
                        content += `<li>Defence Mod: ${data.attributes.dex.defMod}</li>`
                        data.attributes.dex.test = this._valueFromTable(this.testOfAttr, data.attributes.dex.value)
                        content += `<li>Test of DX: ${data.attributes.dex.test}</li>`
                        data.attributes.dex.feat = this._valueFromTable(this.featOfAttr, data.attributes.dex.value)
                        content += `<li>Feat of DX: ${data.attributes.dex.feat}</li>`
                        if (data.details.class) {
                            // Check if DX does not meet attribute pre-req for this class
                            if (thisClass.attrReqs.dex) {
                                if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Checking DX requirements for ${data.details.class}...`) }
                                if (data.attributes.dex.value < thisClass.attrReqs.dex) {
                                    ui.notifications.warn(`DX is too low for ${data.details.class}!`)
                                }
                            }
                            if (thisClass.xpBonusReq.dex) {
                                if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Checking XP bonus on high DX...`) }
                                if (data.attributes.dex.value >= thisClass.xpBonusReq.dex && xpBonusPossible != false) {
                                    xpBonusPossible = true
                                } else {
                                    xpBonusPossible = false
                                }
                                if (data.details.xp.primeAttr == "") {
                                    data.details.xp.primeAttr = "DX"
                                } else {
                                    data.details.xp.primeAttr += ", DX"
                                }    
                            }
                            if (thisClass.featBonus && thisClass.featBonus.dex) {
                                if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Checking for Extraordinary Feat of DX...`) }
                                data.attributes.dex.feat += thisClass.featBonus.dex
                                content += `<li>Extraordinary Feat of DX override: ${data.attributes.dex.feat}</li>`
                            }
                        }
                        content += `</ul>`
                        break

                    case "con":
                        if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Setting ${k} modifiers...`) }
                        content += `<li>CN Mods:</li><ul>`
                        data.attributes.con.hpMod = this._valueFromTable(this.conHpMod, data.attributes.con.value)
                        content += `<li>Hit Point Mod: ${data.attributes.con.hpMod}</li>`
                        data.attributes.con.poisRadMod = this._valueFromTable(this.conPoisonMod, data.attributes.con.value)
                        content += `<li>Poison/Radiation Mod: ${data.attributes.con.poisRadMod}</li>`
                        data.attributes.con.traumaSurvive = this._valueFromTable(this.conTraumaSurvive, data.attributes.con.value)
                        content += `<li>Trauma Survive %: ${data.attributes.con.traumaSurvive}</li>`
                        data.attributes.con.test = this._valueFromTable(this.testOfAttr, data.attributes.con.value)
                        content += `<li>Test of CN: ${data.attributes.con.test}</li>`
                        data.attributes.con.feat = this._valueFromTable(this.featOfAttr, data.attributes.con.value)
                        content += `<li>Feat of CN: ${data.attributes.con.feat}</li>`
                        if (data.details.class) {
                            // Check if CN does not meet attribute pre-req for this class
                            if (thisClass.attrReqs.con) {
                                if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Checking CN requirements for ${data.details.class}...`) }
                                if (data.attributes.con.value < thisClass.attrReqs.con) {
                                    ui.notifications.warn(`CN is too low for ${data.details.class}!`)
                                }
                            }
                            if (thisClass.xpBonusReq.con) {
                                if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Checking XP bonus on high CN...`) }
                                if (data.attributes.con.value >= thisClass.xpBonusReq.con && xpBonusPossible != false) {
                                    xpBonusPossible = true
                                } else {
                                    xpBonusPossible = false
                                }
                                if (data.details.xp.primeAttr == "") {
                                    data.details.xp.primeAttr = "CN"
                                } else {
                                    data.details.xp.primeAttr += ", CN"
                                }
                            }
                            if (thisClass.featBonus && thisClass.featBonus.con) {
                                if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Checking for Extraordinary Feat of CN...`) }
                                data.attributes.con.feat += thisClass.featBonus.con
                                content += `<li>Extraordinary Feat of CN override: ${data.attributes.con.feat}</li>`
                            }
                        }
                        content += `</ul>`
                        break

                    case "int":
                        if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Setting ${k} modifiers...`) }
                        content += `<li>IN Mods:</li><ul>`

                        data.attributes.int.languages = this._valueFromTable(this.intLanguages, data.attributes.int.value)
                        content += `<li>Languages: ${data.attributes.int.languages}</li>`

                        getsBonusSpell = this._valueFromTable(this.bonusSpell1, data.attributes.int.value)
                        if (getsBonusSpell) {
                            data.attributes.int.bonusSpells.lvl1 = true
                        }
                        content += `<li>Level 1 Bonus Spell: ${getsBonusSpell}</li>`

                        getsBonusSpell = this._valueFromTable(this.bonusSpell2, data.attributes.int.value)
                        if (getsBonusSpell) {
                            data.attributes.int.bonusSpells.lvl2 = true
                        }
                        content += `<li>Level 2 Bonus Spell: ${getsBonusSpell}</li>`

                        getsBonusSpell = this._valueFromTable(this.bonusSpell3, data.attributes.int.value)
                        if (getsBonusSpell) {
                            data.attributes.int.bonusSpells.lvl3 = true
                        }
                        content += `<li>Level 3 Bonus Spell: ${getsBonusSpell}</li>`

                        getsBonusSpell = this._valueFromTable(this.bonusSpell4, data.attributes.int.value)
                        if (getsBonusSpell) {
                            data.attributes.int.bonusSpells.lvl4 = true
                        }
                        content += `<li>Level 4 Bonus Spell: ${getsBonusSpell}</li>`

                        data.attributes.int.learnSpell = this._valueFromTable(this.learnSpell, data.attributes.int.value)
                        content += `<li>% Chance to Learn Spell: ${data.attributes.int.learnSpell}</li>`

                        if (data.details.class) {
                            // Check if IN does not meet attribute pre-req for this class
                            if (thisClass.attrReqs.int) {
                                if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Checking IN requirements for ${data.details.class}...`) }
                                if (data.attributes.int.value < thisClass.attrReqs.int) {
                                    ui.notifications.warn(`IN is too low for ${data.details.class}!`)
                                }
                            }
                            if (thisClass.xpBonusReq.int) {
                                if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Checking XP bonus on high IN...`) }
                                if (data.attributes.int.value >= thisClass.xpBonusReq.int && xpBonusPossible != false) {
                                    xpBonusPossible = true
                                } else {
                                    xpBonusPossible = false
                                }
                                if (data.details.xp.primeAttr == "") {
                                    data.details.xp.primeAttr = "IN"
                                } else {
                                    data.details.xp.primeAttr += ", IN"
                                }
                            }
                        }
                        content += `</ul>`
                        break

                    case "wis":
                        if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Setting ${k} modifiers...`) }
                        content += `<li>WS Mods:</li><ul>`

                        data.attributes.wis.willMod = this._valueFromTable(this.wisWillMod, data.attributes.wis.value)
                        content += `<li>Will Mod: ${data.attributes.wis.willMod}</li>`

                        getsBonusSpell = this._valueFromTable(this.bonusSpell1, data.attributes.wis.value)
                        if (getsBonusSpell) {
                            data.attributes.wis.bonusSpells.lvl1 = true
                        }
                        content += `<li>Level 1 Bonus Spell: ${getsBonusSpell}</li>`

                        getsBonusSpell = this._valueFromTable(this.bonusSpell2, data.attributes.wis.value)
                        if (getsBonusSpell) {
                            data.attributes.wis.bonusSpells.lvl2 = true
                        }
                        content += `<li>Level 2 Bonus Spell: ${getsBonusSpell}</li>`

                        getsBonusSpell = this._valueFromTable(this.bonusSpell3, data.attributes.wis.value)
                        if (getsBonusSpell) {
                            data.attributes.wis.bonusSpells.lvl3 = true
                        }
                        content += `<li>Level 3 Bonus Spell: ${getsBonusSpell}</li>`

                        getsBonusSpell = this._valueFromTable(this.bonusSpell4, data.attributes.wis.value)
                        if (getsBonusSpell) {
                            data.attributes.wis.bonusSpells.lvl4 = true
                        }
                        content += `<li>Level 4 Bonus Spell: ${getsBonusSpell}</li>`

                        data.attributes.wis.learnSpell = this._valueFromTable(this.learnSpell, data.attributes.wis.value)
                        content += `<li>% Chance to Learn Spell: ${data.attributes.wis.learnSpell}</li>`

                        if (data.details.class) {
                            // Check if WS does not meet attribute pre-req for this class
                            if (thisClass.attrReqs.wis) {
                                if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Checking WS requirements for ${data.details.class}...`) }
                                if (data.attributes.wis.value < thisClass.attrReqs.wis) {
                                    ui.notifications.warn(`WS is too low for ${data.details.class}!`)
                                }
                            }
                            if (thisClass.xpBonusReq.wis) {
                                if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Checking XP bonus on high WS...`) }
                                if (data.attributes.wis.value >= thisClass.xpBonusReq.wis && xpBonusPossible != false) {
                                    xpBonusPossible = true
                                } else {
                                    xpBonusPossible = false
                                }
                                if (data.details.xp.primeAttr == "") {
                                    data.details.xp.primeAttr = "WS"
                                } else {
                                    data.details.xp.primeAttr += ", WS"
                                }
                            }
                        }
                        content += `</ul>`
                        break

                    case "cha":
                        if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Setting ${k} modifiers...`) }
                        content += `<li>CH Mods:</li><ul>`
                        data.attributes.cha.reaction = this._valueFromTable(this.chaReactionMod, data.attributes.cha.value)
                        content += `<li>Reaction Mod: ${data.attributes.cha.reaction}</li>`
                        data.attributes.cha.maxHenchmen = this._valueFromTable(this.chaRetainers, data.attributes.cha.value)
                        content += `<li>Max Henchmen: ${data.attributes.cha.maxHenchmen}</li>`
                        data.attributes.cha.turnUndead = this._valueFromTable(this.chaTurnUndead, data.attributes.cha.value)
                        content += `<li>Turn Undead Mod: ${data.attributes.cha.turnUndead}</li>`
                        if (data.details.class) {
                            // Check if CH does not meet attribute pre-req for this class
                            if (thisClass.attrReqs.cha) {
                                if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Checking CH requirements for ${data.details.class}...`) }
                                if (data.attributes.cha.value < thisClass.attrReqs.cha) {
                                    ui.notifications.warn(`CH is too low for ${data.details.class}!`)
                                }
                            }
                            if (thisClass.xpBonusReq.cha) {
                                if (CONFIG.HYP3E.debugMessages) { console.log(`setAttributeMods: Checking XP bonus on high CH...`) }
                                if (data.attributes.cha.value >= thisClass.xpBonusReq.cha && xpBonusPossible != false) {
                                    xpBonusPossible = true
                                } else {
                                    xpBonusPossible = false
                                }
                                if (data.details.xp.primeAttr == "") {
                                    data.details.xp.primeAttr = "CH"
                                } else {
                                    data.details.xp.primeAttr += ", CH"
                                }
                            }
                        }
                        content += `</ul>`
                        break
                } // End switch
                if (xpBonusPossible) {
                    data.details.xp.bonus = 10
                } else {
                    data.details.xp.bonus = 0
                }
            }
            content += `<li>Prime Attribute(s): ${data.details.xp.primeAttr}</li>`
            content += `<li>XP Bonus: ${data.details.xp.bonus}</li>`
            content += `</ul>`

            // Use the modified data clone to create a clean update object for the character
            let updateData = {
                system: {
                    hd: data.hd,
                    fa: data.fa,
                    ca: data.ca,
                    spellList: data.spellList,
                    spellList2: data.spellList2,
                    ta: data.ta,
                    saves: {
                        death: {
                            value: data.saves.death.value
                        },
                        device: {
                            value: data.saves.device.value
                        },
                        transformation: {
                            value: data.saves.transformation.value
                        },
                        avoidance: {
                            value: data.saves.avoidance.value
                        },
                        sorcery: {
                            value: data.saves.sorcery.value
                        }
                    },
                    details: {
                        xp: {
                            bonus: data.details.xp.bonus,
                            primeAttr: data.details.xp.primeAttr
                        }
                    },
                    unskilled: data.unskilled,
                    attributes: {
                        str: {
                            atkMod: data.attributes.str.atkMod,
                            dmgMod: data.attributes.str.dmgMod,
                            test: data.attributes.str.test,
                            feat: data.attributes.str.feat
                        },
                        dex: {
                            atkMod: data.attributes.dex.atkMod,
                            defMod: data.attributes.dex.defMod,
                            test: data.attributes.dex.test,
                            feat: data.attributes.dex.feat
                        },
                        con: {
                            hpMod: data.attributes.con.hpMod,
                            poisRadMod: data.attributes.con.poisRadMod,
                            traumaSurvive: data.attributes.con.traumaSurvive,
                            test: data.attributes.con.test,
                            feat: data.attributes.con.feat
                        },
                        int: {
                            languages: data.attributes.int.languages,
                            bonusSpells: {
                                lvl1: data.attributes.int.bonusSpells.lvl1,
                                lvl2: data.attributes.int.bonusSpells.lvl2,
                                lvl3: data.attributes.int.bonusSpells.lvl3,
                                lvl4: data.attributes.int.bonusSpells.lvl4
                            },
                            learnSpell: data.attributes.int.learnSpell
                        },
                        wis: {
                            willMod: data.attributes.wis.willMod,
                            bonusSpells: {
                                lvl1: data.attributes.wis.bonusSpells.lvl1,
                                lvl2: data.attributes.wis.bonusSpells.lvl2,
                                lvl3: data.attributes.wis.bonusSpells.lvl3,
                                lvl4: data.attributes.wis.bonusSpells.lvl4
                            },
                            learnSpell: data.attributes.wis.learnSpell
                        },
                        cha: {
                            reaction: data.attributes.cha.reaction,
                            maxHenchmen: data.attributes.cha.maxHenchmen,
                            turnUndead: data.attributes.cha.turnUndead
                        }
                    }
                }
            }

            // Apply updates to the actor
            try {
                if (CONFIG.HYP3E.debugMessages) { console.log('setAttributeMods: Updated attribute modifier data:', updateData) }
                if(actor.validate(updateData)) {
                    if (CONFIG.HYP3E.debugMessages) { console.log('setAttributeMods: Validation OK, executing update...') }
                    // Update the main actor data
                    await actor.update(updateData)
                    // Log the actor data after updating
                    if (CONFIG.HYP3E.debugMessages) { console.log('setAttributeMods: Actor after update:', actor.system) }
                }
            } catch(err) {
                console.log(`setAttributeMods: Actor update error: ${err}`)
            }

            // Now we can display the chat message
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                flavor: label,
                content: content ?? ''
            })
        }
        return true
    }

}