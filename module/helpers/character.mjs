import { Hyp3eActor } from "../documents/actor.mjs";
import {Hyp3eDialog} from "./dialog.mjs";
import { Hyp3eLogger } from "./logger.mjs";

/**
 * Hyp3eCharacter class
 * 
 * This class contains all the attribute and class data and methods for a Hyperborea character.
 * It is used to manage the character's attributes, skills, and other data.
 */
export class Hyp3eCharacter {

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
                    "hpRoll": "1d6",
                    "fa": 1,
                },
                2: {
                    "xp": 1750,
                    "hpRoll": "1d6",
                    "fa": 1,
                },
                3: {
                    "xp": 3500,
                    "hpRoll": "1d6",
                    "fa": 2,
                },
                4: {
                    "xp": 7000,
                    "hpRoll": "1d6",
                    "fa": 3,
                },
                5: {
                    "xp": 14000,
                    "hpRoll": "1d6",
                    "fa": 3,
                },
                6: {
                    "xp": 28000,
                    "hpRoll": "1d6",
                    "fa": 4,
                },
                7: {
                    "xp": 56000,
                    "hpRoll": "1d6",
                    "fa": 5,
                },
                8: {
                    "xp": 112000,
                    "hpRoll": "1d6",
                    "fa": 5,
                },
                9: {
                    "xp": 224000,
                    "hpRoll": "1d6",
                    "fa": 6,
                },
                10: {
                    "xp": 336000,
                    "hpRoll": "2",
                    "fa": 7,
                },
                11: {
                    "xp": 448000,
                    "hpRoll": "2",
                    "fa": 7,
                },
                12: {
                    "xp": 560000,
                    "hpRoll": "2",
                    "fa": 8,
                },
            },
            "abilities": [
                { "name": "Agile" },
                { "name": "Assassinate (Backstab)" },
                { "name": "Detect Secret Doors" },
                { "name": "Disguise" },
                { "name": "Extraordinary Dexterity" },
                { "name": "Harvest Venom" },
                { "name": "Poison Resistance" },
                { "name": "Poison Use" },
                { "name": "Poison Manufacture" },
                { "name": "Climb" },
                { "name": "Discern Noise" },
                { "name": "Hide" },
                { "name": "Manipulate Traps" },
                { "name": "Move Silently" },
                { "name": "Open Locks" },
                { "name": "New Weapon Skill" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Leather armour", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Dagger", "quantity": 1 },
                    { "name": "Sword, short", "quantity": 1 },
                    { "name": "Crossbow, light", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Blanket, winter", "quantity": 1 },
                    { "name": "Bolt case", "quantity": 1 },
                    { "name": "Bolts, light (x20)", "quantity": 20 },
                    { "name": "Clothing, disguise", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Rope, hemp", "quantity": 1 },
                    { "name": "Sack, small", "quantity": 1 },
                    { "name": "Thieves' tools", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 3 },
                    { "name": "Water-/wineskin", "quantity": 1 }
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
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
                    "hpRoll": "1d12",
                    "fa": 1,
                },
                2: {
                    "xp": 3000,
                    "hpRoll": "1d12",
                    "fa": 2,
                },
                3: {
                    "xp": 6000,
                    "hpRoll": "1d12",
                    "fa": 3,
                },
                4: {
                    "xp": 12000,
                    "hpRoll": "1d12",
                    "fa": 4,
                },
                5: {
                    "xp": 24000,
                    "hpRoll": "1d12",
                    "fa": 5,
                },
                6: {
                    "xp": 48000,
                    "hpRoll": "1d12",
                    "fa": 6,
                },
                7: {
                    "xp": 96000,
                    "hpRoll": "1d12",
                    "fa": 7,
                },
                8: {
                    "xp": 192000,
                    "hpRoll": "1d12",
                    "fa": 8,
                },
                9: {
                    "xp": 384000,
                    "hpRoll": "1d12",
                    "fa": 9,
                },
                10: {
                    "xp": 576000,
                    "hpRoll": "4",
                    "fa": 10,
                },
                11: {
                    "xp": 768000,
                    "hpRoll": "4",
                    "fa": 11,
                },
                12: {
                    "xp": 960000,
                    "hpRoll": "4",
                    "fa": 12,
                },
            },
            "abilities": [
                { "name": "Agile" },
                { "name": "Alertness" },
                { "name": "Ambusher" },
                { "name": "Climb" },
                { "name": "Draw Poison" },
                { "name": "Extraordinary Dexterity" },
                { "name": "Extraordinary Strength" },
                { "name": "Hardy" },
                { "name": "Horsemanship" },
                { "name": "Leap" },
                { "name": "Move Silently" },
                { "name": "Run" },
                { "name": "Sense Magic" },
                { "name": "Sorcerous Distrust" },
                { "name": "Track" },
                { "name": "Weapon Mastery" },
                { "name": "Wilderness Survival" },
                { "name": "Enlist Henchmen" },
                { "name": "Melee Expert" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Studded armour", "quantity": 1 },
                    { "name": "Shield, small", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Bow, short", "quantity": 1 },
                    { "name": "Dagger", "quantity": 1 },
                    { "name": "Sword, bastard", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Arrows (x12)", "quantity": 12 },
                    { "name": "Arrow quiver", "quantity": 1 },
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Fishing net", "quantity": 1 },
                    { "name": "Horn, hunting", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Sack, large", "quantity": 1 },
                    { "name": "Torch", "quantity": 3 },
                    { "name": "Water-/wineskin", "quantity": 1 }
                ],
                "equipment - provisions": [
                    { "name": "Rations, standard", "quantity": 7 },
                ],
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
                    "hpRoll": "1d8",
                    "fa": 1,
                    "ca": 1,
                },
                2: {
                    "xp": 2500,
                    "hpRoll": "1d8",
                    "fa": 1,
                    "ca": 2,
                },
                3: {
                    "xp": 5000,
                    "hpRoll": "1d8",
                    "fa": 2,
                    "ca": 3,
                },
                4: {
                    "xp": 10000,
                    "hpRoll": "1d8",
                    "fa": 3,
                    "ca": 4,
                },
                5: {
                    "xp": 20000,
                    "hpRoll": "1d8",
                    "fa": 3,
                    "ca": 5,
                },
                6: {
                    "xp": 40000,
                    "hpRoll": "1d8",
                    "fa": 4,
                    "ca": 6,
                },
                7: {
                    "xp": 80000,
                    "hpRoll": "1d8",
                    "fa": 5,
                    "ca": 7,
                },
                8: {
                    "xp": 160000,
                    "hpRoll": "1d8",
                    "fa": 5,
                    "ca": 8,
                },
                9: {
                    "xp": 320000,
                    "hpRoll": "1d8",
                    "fa": 6,
                    "ca": 9,
                },
                10: {
                    "xp": 480000,
                    "hpRoll": "2",
                    "fa": 7,
                    "ca": 10,
                },
                11: {
                    "xp": 640000,
                    "hpRoll": "2",
                    "fa": 7,
                    "ca": 11,
                },
                12: {
                    "xp": 800000,
                    "hpRoll": "2",
                    "fa": 8,
                    "ca": 12,
                },
            },
            "abilities": [
                { "name": "Countersong" },
                { "name": "Extraordinary Dexterity" },
                { "name": "Folklore" },
                { "name": "Inspirit Allies" },
                { "name": "Magic Item Use" },
                { "name": "Mesmerize" },
                { "name": "Read Magic" },
                { "name": "Scroll Use" },
                { "name": "Scroll Writing" },
                { "name": "Sorcery" },
                { "name": "Decipher Script" },
                { "name": "Discern Noise" },
                { "name": "Hide" },
                { "name": "Move Silently" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Studded armour", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Bow, short", "quantity": 1 },
                    { "name": "Dagger", "quantity": 2 },
                    { "name": "Mace, footman's", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Arrows (x12)", "quantity": 12 },
                    { "name": "Arrow quiver", "quantity": 1 },
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Book, spell", "quantity": 1 },
                    { "name": "Chalk", "quantity": 1 },
                    { "name": "Ink and quill", "quantity": 1 },
                    { "name": "Parchment", "quantity": 3 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Rope, hemp", "quantity": 1 },
                    { "name": "Sack, large", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 2 },
                    { "name": "Water-/wineskin", "quantity": 1 },
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
                "equipment - religious": [
                    { "name": "Flute", "quantity": 1 }, 
                ],
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
                    "hpRoll": "1d12",
                    "fa": 1,
                },
                2: {
                    "xp": 2500,
                    "hpRoll": "1d12",
                    "fa": 2,
                },
                3: {
                    "xp": 5000,
                    "hpRoll": "1d12",
                    "fa": 3,
                },
                4: {
                    "xp": 10000,
                    "hpRoll": "1d12",
                    "fa": 4,
                },
                5: {
                    "xp": 20000,
                    "hpRoll": "1d12",
                    "fa": 5,
                },
                6: {
                    "xp": 40000,
                    "hpRoll": "1d12",
                    "fa": 6,
                },
                7: {
                    "xp": 80000,
                    "hpRoll": "1d12",
                    "fa": 7,
                },
                8: {
                    "xp": 160000,
                    "hpRoll": "1d12",
                    "fa": 8,
                },
                9: {
                    "xp": 320000,
                    "hpRoll": "1d12",
                    "fa": 9,
                },
                10: {
                    "xp": 480000,
                    "hpRoll": "4",
                    "fa": 10,
                },
                11: {
                    "xp": 640000,
                    "hpRoll": "4",
                    "fa": 11,
                },
                12: {
                    "xp": 800000,
                    "hpRoll": "4",
                    "fa": 12,
                },
            },
            "abilities": [
                { "name": "Berserk Rage" },
                { "name": "Climb" },
                { "name": "Extraordinary Strength" },
                { "name": "Extraordinary Constitution" },
                { "name": "Hardy" },
                { "name": "Leap" },
                { "name": "Thick Skin" },
                { "name": "Weapon Mastery" },
                { "name": "Bestial Form" },
                { "name": "Enlist Henchmen" },
                { "name": "Melee Expert" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Scale mail", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Axe, battle", "quantity": 1 },
                    { "name": "Axe, hand", "quantity": 2 },
                    { "name": "Sword, broad", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Sack, large", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 3 },
                    { "name": "Water-/wineskin", "quantity": 1 }
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
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
                    "hpRoll": "1d10",
                    "fa": 1,
                },
                2: {
                    "xp": 2250,
                    "hpRoll": "1d10",
                    "fa": 2,
                },
                3: {
                    "xp": 4500,
                    "hpRoll": "1d10",
                    "fa": 3,
                },
                4: {
                    "xp": 9000,
                    "hpRoll": "1d10",
                    "fa": 4,
                },
                5: {
                    "xp": 18000,
                    "hpRoll": "1d10",
                    "fa": 5,
                },
                6: {
                    "xp": 36000,
                    "hpRoll": "1d10",
                    "fa": 6,
                },
                7: {
                    "xp": 72000,
                    "hpRoll": "1d10",
                    "fa": 7,
                },
                8: {
                    "xp": 144000,
                    "hpRoll": "1d10",
                    "fa": 8,
                },
                9: {
                    "xp": 288000,
                    "hpRoll": "1d10",
                    "fa": 9,
                },
                10: {
                    "xp": 432000,
                    "hpRoll": "3",
                    "fa": 10,
                },
                11: {
                    "xp": 576000,
                    "hpRoll": "3",
                    "fa": 11,
                },
                12: {
                    "xp": 720000,
                    "hpRoll": "3",
                    "fa": 12,
                },
            },
            "abilities": [
                { "name": "Extraordinary Strength" },
                { "name": "Honour" },
                { "name": "Horsemanship" },
                { "name": "Mounted Charge" },
                { "name": "Shield Sacrifice" },
                { "name": "Skillful Defender" },
                { "name": "Unbreakable Willpower" },
                { "name": "Weapon Mastery" },
                { "name": "Enlist Henchmen" },
                { "name": "Melee Expert" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Scale mail", "quantity": 1 },
                    { "name": "Shield, small", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Flail, horseman's", "quantity": 1 },
                    { "name": "Sword, long", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Lantern, hooded", "quantity": 1 },
                    { "name": "Oil, lamp", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Sack, large", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Water-/wineskin", "quantity": 1 }
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
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
                    "hpRoll": "1d8",
                    "fa": 1,
                    "ca": 1,
                    "ta": 1,
                },
                2: {
                    "xp": 2000,
                    "hpRoll": "1d8",
                    "fa": 1,
                    "ca": 2,
                    "ta": 2,
                },
                3: {
                    "xp": 4000,
                    "hpRoll": "1d8",
                    "fa": 2,
                    "ca": 3,
                    "ta": 3,
                },
                4: {
                    "xp": 8000,
                    "hpRoll": "1d8",
                    "fa": 3,
                    "ca": 4,
                    "ta": 4,
                },
                5: {
                    "xp": 16000,
                    "hpRoll": "1d8",
                    "fa": 3,
                    "ca": 5,
                    "ta": 5,
                },
                6: {
                    "xp": 32000,
                    "hpRoll": "1d8",
                    "fa": 4,
                    "ca": 6,
                    "ta": 6,
                },
                7: {
                    "xp": 64000,
                    "hpRoll": "1d8",
                    "fa": 5,
                    "ca": 7,
                    "ta": 7,
                },
                8: {
                    "xp": 128000,
                    "hpRoll": "1d8",
                    "fa": 5,
                    "ca": 8,
                    "ta": 8,
                },
                9: {
                    "xp": 256000,
                    "hpRoll": "1d8",
                    "fa": 6,
                    "ca": 9,
                    "ta": 9,
                },
                10: {
                    "xp": 384000,
                    "hpRoll": "2",
                    "fa": 7,
                    "ca": 10,
                    "ta": 10,
                },
                11: {
                    "xp": 512000,
                    "hpRoll": "2",
                    "fa": 7,
                    "ca": 11,
                    "ta": 11,
                },
                12: {
                    "xp": 640000,
                    "hpRoll": "2",
                    "fa": 8,
                    "ca": 12,
                    "ta": 12,
                },
            },
            "abilities": [
                { "name": "Scroll Use" },
                { "name": "Scroll Writing" },
                { "name": "Sorcery" },
                { "name": "Turn Undead" },
                { "name": "New Weapon Skill" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Studded armour", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Dagger", "quantity": 1 },
                    { "name": "Hammer, war", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Sack, small", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 3 },
                    { "name": "Water-/wineskin", "quantity": 1 },
                    { "name": "Writing stick", "quantity": 1 },
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
                "equipment - religious": [
                    { "name": "Holy symbol, silver", "quantity": 1 },
                    { "name": "Holy oil/water", "quantity": 1 },
                ],
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
                    "hpRoll": "1d4",
                    "fa": 0,
                    "ca": 1,
                },
                2: {
                    "xp": 2500,
                    "hpRoll": "1d4",
                    "fa": 0,
                    "ca": 2,
                },
                3: {
                    "xp": 5000,
                    "hpRoll": "1d4",
                    "fa": 1,
                    "ca": 3,
                },
                4: {
                    "xp": 10000,
                    "hpRoll": "1d4",
                    "fa": 1,
                    "ca": 4,
                },
                5: {
                    "xp": 20000,
                    "hpRoll": "1d4",
                    "fa": 2,
                    "ca": 5,
                },
                6: {
                    "xp": 40000,
                    "hpRoll": "1d4",
                    "fa": 2,
                    "ca": 6,
                },
                7: {
                    "xp": 80000,
                    "hpRoll": "1d4",
                    "fa": 3,
                    "ca": 7,
                },
                8: {
                    "xp": 160000,
                    "hpRoll": "1d4",
                    "fa": 3,
                    "ca": 8,
                },
                9: {
                    "xp": 320000,
                    "hpRoll": "1d4",
                    "fa": 4,
                    "ca": 9,
                },
                10: {
                    "xp": 480000,
                    "hpRoll": "1",
                    "fa": 4,
                    "ca": 10,
                },
                11: {
                    "xp": 640000,
                    "hpRoll": "1",
                    "fa": 5,
                    "ca": 11,
                },
                12: {
                    "xp": 800000,
                    "hpRoll": "1",
                    "fa": 5,
                    "ca": 12,
                },
            },
            "abilities": [
                { "name": "Alchemy" },
                { "name": "Fire/Heat Vulnerability" },
                { "name": "Ice/Cold Affinity" },
                { "name": "Icicle" },
                { "name": "Read Magic" },
                { "name": "Scroll Use" },
                { "name": "Scroll Writing" },
                { "name": "Sorcery" },
                { "name": "New Weapon Skill" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Axe, hand", "quantity": 2 },
                    { "name": "Dagger, silver", "quantity": 1 },
                    { "name": "Spear, short", "quantity": 1 },
                    { "name": "Spear, short, thrown", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Blanket, winter", "quantity": 1 },
                    { "name": "Book, spell", "quantity": 1 },
                    { "name": "Candle, beeswax", "quantity": 3 },
                    { "name": "Chalk", "quantity": 1 },
                    { "name": "Crampons", "quantity": 1 },
                    { "name": "Hammer, small", "quantity": 1 },
                    { "name": "Ink and quill", "quantity": 1 },
                    { "name": "Lantern, bullseye", "quantity": 1 },
                    { "name": "Oil, lamp", "quantity": 2 },
                    { "name": "Parchment", "quantity": 3 },
                    { "name": "Pouch, hard leather (large)", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Rope, silk", "quantity": 1 },
                    { "name": "Sack, large", "quantity": 1 },
                    { "name": "Spikes, iron (x4)", "quantity": 12 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Water-/wineskin", "quantity": 1 },
                    { "name": "Writing stick", "quantity": 1 },
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
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
                    "hpRoll": "1d8",
                    "fa": 1,
                    "ca": 1,
                },
                2: {
                    "xp": 2000,
                    "hpRoll": "1d8",
                    "fa": 1,
                    "ca": 2,
                },
                3: {
                    "xp": 4000,
                    "hpRoll": "1d8",
                    "fa": 2,
                    "ca": 3,
                },
                4: {
                    "xp": 8000,
                    "hpRoll": "1d8",
                    "fa": 3,
                    "ca": 4,
                },
                5: {
                    "xp": 16000,
                    "hpRoll": "1d8",
                    "fa": 3,
                    "ca": 5,
                },
                6: {
                    "xp": 32000,
                    "hpRoll": "1d8",
                    "fa": 4,
                    "ca": 6,
                },
                7: {
                    "xp": 64000,
                    "hpRoll": "1d8",
                    "fa": 5,
                    "ca": 7,
                },
                8: {
                    "xp": 128000,
                    "hpRoll": "1d8",
                    "fa": 5,
                    "ca": 8,
                },
                9: {
                    "xp": 256000,
                    "hpRoll": "1d8",
                    "fa": 6,
                    "ca": 9,
                },
                10: {
                    "xp": 384000,
                    "hpRoll": "2",
                    "fa": 7,
                    "ca": 10,
                },
                11: {
                    "xp": 512000,
                    "hpRoll": "2",
                    "fa": 7,
                    "ca": 11,
                },
                12: {
                    "xp": 640000,
                    "hpRoll": "2",
                    "fa": 8,
                    "ca": 12,
                },
            },
            "abilities": [
                { "name": "Druidic Tongue" },
                { "name": "Fire/Heat Affinity" },
                { "name": "Natural Identifications" },
                { "name": "Scroll Use" },
                { "name": "Scroll Writing" },
                { "name": "Sorcery" },
                { "name": "Traverse Overgrowth" },
                { "name": "Charm Immunity" },
                { "name": "Shapechange" },
                { "name": "Druidic Hierarchy" },
                { "name": "Longevity" },
                { "name": "New Weapon Skill" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Studded armour", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Bow, short", "quantity": 1 },
                    { "name": "Dagger", "quantity": 1 },
                    { "name": "Spear, short", "quantity": 1 },
                    { "name": "Spear, short, thrown", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Arrows (x12)", "quantity": 12 },
                    { "name": "Arrow quiver", "quantity": 1 },
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Parchment", "quantity": 3 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Sack, small", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 3 },
                    { "name": "Water-/wineskin", "quantity": 1 },
                    { "name": "Wolfsbane", "quantity": 1 },
                    { "name": "Writing stick", "quantity": 1 },
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
                "equipment - religious": [
                    { "name": "Holy symbol, wooden", "quantity": 1 },
                    { "name": "Paint, body", "quantity": 1 },
                ],
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
                    "hpRoll": "1d10",
                    "fa": 1,
                },
                2: {
                    "xp": 2000,
                    "hpRoll": "1d10",
                    "fa": 2,
                },
                3: {
                    "xp": 4000,
                    "hpRoll": "1d10",
                    "fa": 3,
                },
                4: {
                    "xp": 8000,
                    "hpRoll": "1d10",
                    "fa": 4,
                },
                5: {
                    "xp": 16000,
                    "hpRoll": "1d10",
                    "fa": 5,
                },
                6: {
                    "xp": 32000,
                    "hpRoll": "1d10",
                    "fa": 6,
                },
                7: {
                    "xp": 64000,
                    "hpRoll": "1d10",
                    "fa": 7,
                },
                8: {
                    "xp": 128000,
                    "hpRoll": "1d10",
                    "fa": 8,
                },
                9: {
                    "xp": 256000,
                    "hpRoll": "1d10",
                    "fa": 9,
                },
                10: {
                    "xp": 384000,
                    "hpRoll": "3",
                    "fa": 10,
                },
                11: {
                    "xp": 512000,
                    "hpRoll": "3",
                    "fa": 11,
                },
                12: {
                    "xp": 640000,
                    "hpRoll": "3",
                    "fa": 12,
                },
            },
            "abilities": [
                { "name": "Extraordinary Strength" },
                { "name": "Heroic Fighting" },
                { "name": "Weapon Mastery" },
                { "name": "Grand Mastery" },
                { "name": "Enlist Henchmen" },
                { "name": "Melee Expert" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Studded armour", "quantity": 1 },
                    { "name": "Shield, large", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Bow, short", "quantity": 1 },
                    { "name": "Sword, broad", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Arrows (x12)", "quantity": 12 },
                    { "name": "Arrow quiver", "quantity": 1 },
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Blanket, winter", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Rope, hemp", "quantity": 1 },
                    { "name": "Sack, large", "quantity": 1 },
                    { "name": "Tent, 1-person", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 2 },
                    { "name": "Water-/wineskin", "quantity": 1 }
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
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
                    "hpRoll": "1d10",
                    "fa": 1,
                },
                2: {
                    "xp": 2250,
                    "hpRoll": "1d10",
                    "fa": 2,
                },
                3: {
                    "xp": 4500,
                    "hpRoll": "1d10",
                    "fa": 3,
                },
                4: {
                    "xp": 9000,
                    "hpRoll": "1d10",
                    "fa": 4,
                },
                5: {
                    "xp": 18000,
                    "hpRoll": "1d10",
                    "fa": 5,
                },
                6: {
                    "xp": 36000,
                    "hpRoll": "1d10",
                    "fa": 6,
                },
                7: {
                    "xp": 72000,
                    "hpRoll": "1d10",
                    "fa": 7,
                },
                8: {
                    "xp": 144000,
                    "hpRoll": "1d10",
                    "fa": 8,
                },
                9: {
                    "xp": 288000,
                    "hpRoll": "1d10",
                    "fa": 9,
                },
                10: {
                    "xp": 432000,
                    "hpRoll": "3",
                    "fa": 10,
                },
                11: {
                    "xp": 576000,
                    "hpRoll": "3",
                    "fa": 11,
                },
                12: {
                    "xp": 720000,
                    "hpRoll": "3",
                    "fa": 12,
                },
            },
            "abilities": [
                { "name": "Alertness" },
                { "name": "Ambusher" },
                { "name": "Climb" },
                { "name": "Extraordinary Strength" },
                { "name": "Harvest Venom" },
                { "name": "Hide" },
                { "name": "Move Silently" },
                { "name": "Predator" },
                { "name": "Subdue Animal" },
                { "name": "Track" },
                { "name": "Weapon Mastery" },
                { "name": "Wilderness Survival" },
                { "name": "Wilderness Traps" },
                { "name": "Werewolf Slayer" },
                { "name": "Enlist Henchmen" },
                { "name": "Melee Expert" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Leather armour", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Axe, hand", "quantity": 1 },
                    { "name": "Bow, long", "quantity": 1 },
                    { "name": "Net, fighting", "quantity": 1 },
                    { "name": "Spear, short", "quantity": 1 },
                    { "name": "Spear, short, thrown", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Arrows (x12)", "quantity": 12 },
                    { "name": "Arrow, silver-tipped (x1)", "quantity": 2 },
                    { "name": "Arrow quiver", "quantity": 1 },
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Cord, sinew", "quantity": 1 },
                    { "name": "Horn, hunting", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Torch", "quantity": 2 },
                    { "name": "Water-/wineskin", "quantity": 1 }
                ],
                "equipment - provisions": [
                    { "name": "Rations, standard", "quantity": 7 },
                ],
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
                    "hpRoll": "1d4",
                    "fa": 0,
                    "ca": 1,
                },
                2: {
                    "xp": 2500,
                    "hpRoll": "1d4",
                    "fa": 0,
                    "ca": 2,
                },
                3: {
                    "xp": 5000,
                    "hpRoll": "1d4",
                    "fa": 1,
                    "ca": 3,
                },
                4: {
                    "xp": 10000,
                    "hpRoll": "1d4",
                    "fa": 1,
                    "ca": 4,
                },
                5: {
                    "xp": 20000,
                    "hpRoll": "1d4",
                    "fa": 2,
                    "ca": 5,
                },
                6: {
                    "xp": 40000,
                    "hpRoll": "1d4",
                    "fa": 2,
                    "ca": 6,
                },
                7: {
                    "xp": 80000,
                    "hpRoll": "1d4",
                    "fa": 3,
                    "ca": 7,
                },
                8: {
                    "xp": 160000,
                    "hpRoll": "1d4",
                    "fa": 3,
                    "ca": 8,
                },
                9: {
                    "xp": 320000,
                    "hpRoll": "1d4",
                    "fa": 4,
                    "ca": 9,
                },
                10: {
                    "xp": 480000,
                    "hpRoll": "1",
                    "fa": 4,
                    "ca": 10,
                },
                11: {
                    "xp": 640000,
                    "hpRoll": "1",
                    "fa": 5,
                    "ca": 11,
                },
                12: {
                    "xp": 800000,
                    "hpRoll": "1",
                    "fa": 5,
                    "ca": 12,
                },
            },
            "abilities": [
                { "name": "Alchemy" },
                { "name": "Coloured Globe" },
                { "name": "Extraordinary Dexterity" },
                { "name": "Perceive Illusion" },
                { "name": "Read Magic" },
                { "name": "Scroll Use" },
                { "name": "Scroll Writing" },
                { "name": "Sorcery" },
                { "name": "Vizard" },
                { "name": "New Weapon Skill" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Dagger, silver", "quantity": 1 },
                    { "name": "Quarterstaff", "quantity": 1 },
                    { "name": "Sling", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Book, spell", "quantity": 1 },
                    { "name": "Bullets, sling, lead (x20)", "quantity": 20 },
                    { "name": "Blanket, winter", "quantity": 1 },
                    { "name": "Chalk", "quantity": 1 },
                    { "name": "Ink and quill", "quantity": 1 },
                    { "name": "Lantern, hooded", "quantity": 1 },
                    { "name": "Mirror, silver", "quantity": 1 },
                    { "name": "Oil, lamp", "quantity": 2 },
                    { "name": "Parchment", "quantity": 3 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Rope, silk", "quantity": 1 },
                    { "name": "Sack, small", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Water-/wineskin", "quantity": 1 },
                    { "name": "Writing stick", "quantity": 1 },
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
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
                    "hpRoll": "1d6",
                    "fa": 1,
                    "ca": 1,
                },
                2: {
                    "xp": 2750,
                    "hpRoll": "1d6",
                    "fa": 1,
                    "ca": 2,
                },
                3: {
                    "xp": 5500,
                    "hpRoll": "1d6",
                    "fa": 2,
                    "ca": 3,
                },
                4: {
                    "xp": 11000,
                    "hpRoll": "1d6",
                    "fa": 3,
                    "ca": 4,
                },
                5: {
                    "xp": 22000,
                    "hpRoll": "1d6",
                    "fa": 3,
                    "ca": 5,
                },
                6: {
                    "xp": 44000,
                    "hpRoll": "1d6",
                    "fa": 4,
                    "ca": 6,
                },
                7: {
                    "xp": 88000,
                    "hpRoll": "1d6",
                    "fa": 5,
                    "ca": 7,
                },
                8: {
                    "xp": 176000,
                    "hpRoll": "1d6",
                    "fa": 5,
                    "ca": 8,
                },
                9: {
                    "xp": 352000,
                    "hpRoll": "1d6",
                    "fa": 6,
                    "ca": 9,
                },
                10: {
                    "xp": 528000,
                    "hpRoll": "2",
                    "fa": 7,
                    "ca": 10,
                },
                11: {
                    "xp": 704000,
                    "hpRoll": "2",
                    "fa": 7,
                    "ca": 11,
                },
                12: {
                    "xp": 880000,
                    "hpRoll": "2",
                    "fa": 8,
                    "ca": 12,
                },
            },
            "abilities": [
                { "name": "Agile" },
                { "name": "Backstab" },
                { "name": "Detect Secret Doors" },
                { "name": "Extraordinary Dexterity" },
                { "name": "Magic Item Use" },
                { "name": "Read Magic" },
                { "name": "Scroll Use" },
                { "name": "Scroll Writing" },
                { "name": "Sorcery" },
                { "name": "Thieves' Cant" },
                { "name": "Climb" },
                { "name": "Decipher Script" },
                { "name": "Discern Noise" },
                { "name": "Hide" },
                { "name": "Manipulate Traps" },
                { "name": "Move Silently" },
                { "name": "Open Locks" },
                { "name": "Pick Pockets" },
                { "name": "New Weapon Skill" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Studded armour", "quantity": 1 },
                    { "name": "Shield, small", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Dagger", "quantity": 2 },
                    { "name": "Falcata", "quantity": 1 },
                    { "name": "Sling", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Blanket, winter", "quantity": 1 },
                    { "name": "Book, spell", "quantity": 1 },
                    { "name": "Bullets, sling, lead (x20)", "quantity": 20 },
                    { "name": "Ink and quill", "quantity": 1 },
                    { "name": "Parchment", "quantity": 3 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Rope, hemp", "quantity": 1 },
                    { "name": "Sack, small", "quantity": 1 },
                    { "name": "Thieves' tools", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 2 },
                    { "name": "Water-/wineskin", "quantity": 1 }
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
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
                    "hpRoll": "1d4",
                    "fa": 0,
                    "ca": 1,
                },
                2: {
                    "xp": 2500,
                    "hpRoll": "1d4",
                    "fa": 0,
                    "ca": 2,
                },
                3: {
                    "xp": 5000,
                    "hpRoll": "1d4",
                    "fa": 1,
                    "ca": 3,
                },
                4: {
                    "xp": 10000,
                    "hpRoll": "1d4",
                    "fa": 1,
                    "ca": 4,
                },
                5: {
                    "xp": 20000,
                    "hpRoll": "1d4",
                    "fa": 2,
                    "ca": 5,
                },
                6: {
                    "xp": 40000,
                    "hpRoll": "1d4",
                    "fa": 2,
                    "ca": 6,
                },
                7: {
                    "xp": 80000,
                    "hpRoll": "1d4",
                    "fa": 3,
                    "ca": 7,
                },
                8: {
                    "xp": 160000,
                    "hpRoll": "1d4",
                    "fa": 3,
                    "ca": 8,
                },
                9: {
                    "xp": 320000,
                    "hpRoll": "1d4",
                    "fa": 4,
                    "ca": 9,
                },
                10: {
                    "xp": 480000,
                    "hpRoll": "1",
                    "fa": 4,
                    "ca": 10,
                },
                11: {
                    "xp": 640000,
                    "hpRoll": "1",
                    "fa": 5,
                    "ca": 11,
                },
                12: {
                    "xp": 800000,
                    "hpRoll": "1",
                    "fa": 5,
                    "ca": 12,
                },
            },
            "abilities": [
                { "name": "Alchemy" },
                { "name": "Familiar" },
                { "name": "Read Magic" },
                { "name": "Scroll Use" },
                { "name": "Scroll Writing" },
                { "name": "Sorcery" },
                { "name": "New Weapon Skill" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Dagger, silver", "quantity": 1 },
                    { "name": "Quarterstaff", "quantity": 1 },
                    { "name": "Sling", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Book, spell", "quantity": 1 },
                    { "name": "Blanket, winter", "quantity": 1 },
                    { "name": "Bullets, sling, lead (x20)", "quantity": 20 },
                    { "name": "Chalk", "quantity": 1 },
                    { "name": "Ink and quill", "quantity": 1 },
                    { "name": "Oil, incendiary", "quantity": 1 },
                    { "name": "Parchment", "quantity": 2 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Rope, silk", "quantity": 1 },
                    { "name": "Sack, small", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 3 },
                    { "name": "Water-/wineskin", "quantity": 1 },
                    { "name": "Writing stick", "quantity": 1 },
                ],
                "equipment - provisions": [
                    { "name": "Rations, standard", "quantity": 7 },
                ],
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
                    "hpRoll": "1d8",
                    "fa": 0,
                },
                2: {
                    "xp": 2500,
                    "hpRoll": "1d8",
                    "fa": 1,
                },
                3: {
                    "xp": 5000,
                    "hpRoll": "1d8",
                    "fa": 2,
                },
                4: {
                    "xp": 10000,
                    "hpRoll": "1d8",
                    "fa": 3,
                },
                5: {
                    "xp": 20000,
                    "hpRoll": "1d8",
                    "fa": 4,
                },
                6: {
                    "xp": 40000,
                    "hpRoll": "1d8",
                    "fa": 5,
                },
                7: {
                    "xp": 80000,
                    "hpRoll": "1d8",
                    "fa": 6,
                },
                8: {
                    "xp": 160000,
                    "hpRoll": "1d8",
                    "fa": 7,
                },
                9: {
                    "xp": 320000,
                    "hpRoll": "1d8",
                    "fa": 8,
                },
                10: {
                    "xp": 480000,
                    "hpRoll": "2",
                    "fa": 9,
                },
                11: {
                    "xp": 640000,
                    "hpRoll": "2",
                    "fa": 10,
                },
                12: {
                    "xp": 800000,
                    "hpRoll": "2",
                    "fa": 11,
                },
            },
            "abilities": [
                { "name": "Block Missile" },
                { "name": "Cellular Adjustment" },
                { "name": "Controlled Fall" },
                { "name": "Defensive Ability" },
                { "name": "Detect Secret Doors" },
                { "name": "Empty Hand" },
                { "name": "Extraordinary Dexterity" },
                { "name": "Run" },
                { "name": "Superior Willpower" },
                { "name": "Speak With Nature" },
                { "name": "Simulate Death" },
                { "name": "Climb" },
                { "name": "Discern Noise" },
                { "name": "Hide" },
                { "name": "Move Silently" },
                { "name": "New Weapon Skill" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
                { "name": "Longevity" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [],
                "weapons": [
                    { "name": "Monk's Empty Hand Attack", "quantity": 1 },
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Cæstuses", "quantity": 1 },
                    { "name": "Dagger, silver", "quantity": 1 },
                    { "name": "Halberd", "quantity": 1 },
                    { "name": "Hooked throwing knife", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Blanket, winter", "quantity": 1 },
                    { "name": "Fishing hooks", "quantity": 12 },
                    { "name": "Fishing string", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Rope, silk", "quantity": 1 },
                    { "name": "Sack, small", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 3 },
                    { "name": "Water-/wineskin", "quantity": 1 },
                    { "name": "Writing stick", "quantity": 1 },
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
                "equipment - religious": [
                    { "name": "Incense sticks (x12)", "quantity": 12 },
                ],
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
                    "hpRoll": "1d4",
                    "fa": 0,
                    "ca": 1,
                    "ta": null,
                },
                2: {
                    "xp": 2500,
                    "hpRoll": "1d4",
                    "fa": 0,
                    "ca": 2,
                    "ta": null,
                },
                3: {
                    "xp": 5000,
                    "hpRoll": "1d4",
                    "fa": 1,
                    "ca": 3,
                    "ta": 1,
                },
                4: {
                    "xp": 10000,
                    "hpRoll": "1d4",
                    "fa": 1,
                    "ca": 4,
                    "ta": 2,
                },
                5: {
                    "xp": 20000,
                    "hpRoll": "1d4",
                    "fa": 2,
                    "ca": 5,
                    "ta": 3,
                },
                6: {
                    "xp": 40000,
                    "hpRoll": "1d4",
                    "fa": 2,
                    "ca": 6,
                    "ta": 4,
                },
                7: {
                    "xp": 80000,
                    "hpRoll": "1d4",
                    "fa": 3,
                    "ca": 7,
                    "ta": 5,
                },
                8: {
                    "xp": 160000,
                    "hpRoll": "1d4",
                    "fa": 3,
                    "ca": 8,
                    "ta": 6,
                },
                9: {
                    "xp": 320000,
                    "hpRoll": "1d4",
                    "fa": 4,
                    "ca": 9,
                    "ta": 7,
                },
                10: {
                    "xp": 480000,
                    "hpRoll": "1",
                    "fa": 4,
                    "ca": 10,
                    "ta": 8,
                },
                11: {
                    "xp": 640000,
                    "hpRoll": "1",
                    "fa": 5,
                    "ca": 11,
                    "ta": 9,
                },
                12: {
                    "xp": 800000,
                    "hpRoll": "1",
                    "fa": 5,
                    "ca": 12,
                    "ta": 10,
                },
            },
            "abilities": [
                { "name": "Alchemy" },
                { "name": "Read Magic" },
                { "name": "Scroll Use" },
                { "name": "Scroll Writing" },
                { "name": "Sorcery" },
                { "name": "Command Undead" },
                { "name": "New Weapon Skill" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Sickle", "quantity": 1 },
                    { "name": "Sling", "quantity": 1 },
                    { "name": "Whip", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Blanket, winter", "quantity": 1 },
                    { "name": "Book, spell", "quantity": 1 },
                    { "name": "Bullets, sling, lead (x20)", "quantity": 20 },
                    { "name": "Chalk", "quantity": 1 },
                    { "name": "Ink and quill", "quantity": 1 },
                    { "name": "Lantern, hooded", "quantity": 1 },
                    { "name": "Mirror, steel or copper", "quantity": 1 },
                    { "name": "Oil, incendiary", "quantity": 1 },
                    { "name": "Oil, lamp", "quantity": 2 },
                    { "name": "Parchment", "quantity": 3 },
                    { "name": "Pouch, hard leather (large)", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Rope, silk", "quantity": 1 },
                    { "name": "Sack, small", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Water-/wineskin", "quantity": 1 },
                    { "name": "Writing stick", "quantity": 1 },
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
                "equipment - religious": [
                    { "name": "Holy symbol, wooden", "quantity": 1 },
                ],
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
                    "hpRoll": "1d10",
                    "fa": 1,
                    "ca": null,
                    "ta": null,
                },
                2: {
                    "xp": 2750,
                    "hpRoll": "1d10",
                    "fa": 2,
                    "ca": null,
                    "ta": null,
                },
                3: {
                    "xp": 5500,
                    "hpRoll": "1d10",
                    "fa": 3,
                    "ca": null,
                    "ta": null,
                },
                4: {
                    "xp": 11000,
                    "hpRoll": "1d10",
                    "fa": 4,
                    "ca": null,
                    "ta": null,
                },
                5: {
                    "xp": 22000,
                    "hpRoll": "1d10",
                    "fa": 5,
                    "ca": null,
                    "ta": 1,
                },
                6: {
                    "xp": 44000,
                    "hpRoll": "1d10",
                    "fa": 6,
                    "ca": null,
                    "ta": 2,
                },
                7: {
                    "xp": 88000,
                    "hpRoll": "1d10",
                    "fa": 7,
                    "ca": 1,
                    "ta": 3,
                },
                8: {
                    "xp": 176000,
                    "hpRoll": "1d10",
                    "fa": 8,
                    "ca": 2,
                    "ta": 4,
                },
                9: {
                    "xp": 352000,
                    "hpRoll": "1d10",
                    "fa": 9,
                    "ca": 3,
                    "ta": 5,
                },
                10: {
                    "xp": 528000,
                    "hpRoll": "3",
                    "fa": 10,
                    "ca": 4,
                    "ta": 6,
                },
                11: {
                    "xp": 704000,
                    "hpRoll": "3",
                    "fa": 11,
                    "ca": 5,
                    "ta": 7,
                },
                12: {
                    "xp": 880000,
                    "hpRoll": "3",
                    "fa": 12,
                    "ca": 6,
                    "ta": 8,
                },
            },
            "abilities": [
                { "name": "Divine Protection" },
                { "name": "Extraordinary Strength" },
                { "name": "Healing Hands" },
                { "name": "Honour" },
                { "name": "Horsemanship" },
                { "name": "Sense Evil" },
                { "name": "Valiant Resolve" },
                { "name": "Weapon Mastery" },
                { "name": "Righteous Wrath" },
                { "name": "Sacred Mount" },
                { "name": "Turn Undead" },
                { "name": "Scroll Use" },
                { "name": "Sorcery" },
                { "name": "Enlist Henchmen" },
                { "name": "Melee Expert" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Scale mail", "quantity": 1 },
                    { "name": "Shield, large", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Dagger", "quantity": 1 },
                    { "name": "Mace, footman's", "quantity": 1 },
                    { "name": "Sword, long", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 2 },
                    { "name": "Water-/wineskin", "quantity": 1 }
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
                "equipment - religious": [
                    { "name": "Holy symbol, wooden", "quantity": 1 },
                ],
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
                    "hpRoll": "1d4",
                    "fa": 0,
                    "ca": 1,
                    "ta": 1,
                },
                2: {
                    "xp": 2000,
                    "hpRoll": "1d4",
                    "fa": 0,
                    "ca": 2,
                    "ta": 2,
                },
                3: {
                    "xp": 4000,
                    "hpRoll": "1d4",
                    "fa": 1,
                    "ca": 3,
                    "ta": 3,
                },
                4: {
                    "xp": 8000,
                    "hpRoll": "1d4",
                    "fa": 1,
                    "ca": 4,
                    "ta": 4,
                },
                5: {
                    "xp": 16000,
                    "hpRoll": "1d4",
                    "fa": 2,
                    "ca": 5,
                    "ta": 5,
                },
                6: {
                    "xp": 32000,
                    "hpRoll": "1d4",
                    "fa": 2,
                    "ca": 6,
                    "ta": 6,
                },
                7: {
                    "xp": 64000,
                    "hpRoll": "1d4",
                    "fa": 3,
                    "ca": 7,
                    "ta": 7,
                },
                8: {
                    "xp": 128000,
                    "hpRoll": "1d4",
                    "fa": 3,
                    "ca": 8,
                    "ta": 8,
                },
                9: {
                    "xp": 256000,
                    "hpRoll": "1d4",
                    "fa": 4,
                    "ca": 9,
                    "ta": 9,
                },
                10: {
                    "xp": 384000,
                    "hpRoll": "1",
                    "fa": 4,
                    "ca": 10,
                    "ta": 10,
                },
                11: {
                    "xp": 512000,
                    "hpRoll": "1",
                    "fa": 5,
                    "ca": 11,
                    "ta": 11,
                },
                12: {
                    "xp": 640000,
                    "hpRoll": "1",
                    "fa": 5,
                    "ca": 12,
                    "ta": 12,
                },
            },
            "abilities": [
                { "name": "Scroll Use" },
                { "name": "Scroll Writing" },
                { "name": "Sorcery" },
                { "name": "Turn Undead" },
                { "name": "Daemonwrack" },
                { "name": "Specialized Faith (optional)" },
                { "name": "New Weapon Skill" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Dagger, silver", "quantity": 1 },
                    { "name": "Quarterstaff", "quantity": 1 },
                    { "name": "Whip", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Blanket, winter", "quantity": 1 },
                    { "name": "Clothing, religious", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Sack, small", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 3 },
                    { "name": "Water-/wineskin", "quantity": 1 },
                    { "name": "Writing stick", "quantity": 1 },
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
                "equipment - religious": [
                    { "name": "Holy oil/water", "quantity": 1 },
                    { "name": "Holy symbol, silver", "quantity": 1 },
                    { "name": "Prayer beads, wooden", "quantity": 1 },
                ],
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
                    "hpRoll": "1d6",
                    "fa": 1,
                    "ca": 1,
                    "ta": null,
                },
                2: {
                    "xp": 2500,
                    "hpRoll": "1d6",
                    "fa": 1,
                    "ca": 2,
                    "ta": null,
                },
                3: {
                    "xp": 5000,
                    "hpRoll": "1d6",
                    "fa": 2,
                    "ca": 3,
                    "ta": 1,
                },
                4: {
                    "xp": 10000,
                    "hpRoll": "1d6",
                    "fa": 3,
                    "ca": 4,
                    "ta": 2,
                },
                5: {
                    "xp": 20000,
                    "hpRoll": "1d6",
                    "fa": 3,
                    "ca": 5,
                    "ta": 3,
                },
                6: {
                    "xp": 40000,
                    "hpRoll": "1d6",
                    "fa": 4,
                    "ca": 6,
                    "ta": 4,
                },
                7: {
                    "xp": 80000,
                    "hpRoll": "1d6",
                    "fa": 5,
                    "ca": 7,
                    "ta": 5,
                },
                8: {
                    "xp": 160000,
                    "hpRoll": "1d6",
                    "fa": 5,
                    "ca": 8,
                    "ta": 6,
                },
                9: {
                    "xp": 320000,
                    "hpRoll": "1d6",
                    "fa": 6,
                    "ca": 9,
                    "ta": 7,
                },
                10: {
                    "xp": 480000,
                    "hpRoll": "2",
                    "fa": 7,
                    "ca": 10,
                    "ta": 8,
                },
                11: {
                    "xp": 640000,
                    "hpRoll": "2",
                    "fa": 7,
                    "ca": 11,
                    "ta": 9,
                },
                12: {
                    "xp": 800000,
                    "hpRoll": "2",
                    "fa": 8,
                    "ca": 12,
                    "ta": 10,
                },
            },
            "abilities": [
                { "name": "Agile" },
                { "name": "Backstab" },
                { "name": "Detect Secret Doors" },
                { "name": "Extraordinary Dexterity" },
                { "name": "Magic Item Use" },
                { "name": "Scroll Use" },
                { "name": "Scroll Writing" },
                { "name": "Sorcery" },
                { "name": "Thieves' Cant" },
                { "name": "Turn Undead" },
                { "name": "Climb" },
                { "name": "Decipher Script" },
                { "name": "Discern Noise" },
                { "name": "Hide" },
                { "name": "Manipulate Traps" },
                { "name": "Move Silently" },
                { "name": "Open Locks" },
                { "name": "Pick Pockets" },
                { "name": "New Weapon Skill" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Leather armour", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Dagger", "quantity": 1 },
                    { "name": "Morning star", "quantity": 1 },
                    { "name": "Sling", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Blanket, winter", "quantity": 1 },
                    { "name": "Bullets, sling, lead (x20)", "quantity": 20 },
                    { "name": "Dice, ivory", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Sack, small", "quantity": 1 },
                    { "name": "Thieves' tools", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 2 },
                    { "name": "Water-/wineskin", "quantity": 1 },
                    { "name": "Writing stick", "quantity": 1 },
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
                "equipment - religious": [
                    { "name": "Holy oil/water", "quantity": 1 },
                    { "name": "Holy symbol, wooden", "quantity": 1 },
                ],
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
                    "hpRoll": "1d4",
                    "fa": 0,
                    "ca": 1,
                },
                2: {
                    "xp": 2500,
                    "hpRoll": "1d4",
                    "fa": 0,
                    "ca": 2,
                },
                3: {
                    "xp": 5000,
                    "hpRoll": "1d4",
                    "fa": 1,
                    "ca": 3,
                },
                4: {
                    "xp": 10000,
                    "hpRoll": "1d4",
                    "fa": 1,
                    "ca": 4,
                },
                5: {
                    "xp": 20000,
                    "hpRoll": "1d4",
                    "fa": 2,
                    "ca": 5,
                },
                6: {
                    "xp": 40000,
                    "hpRoll": "1d4",
                    "fa": 2,
                    "ca": 6,
                },
                7: {
                    "xp": 80000,
                    "hpRoll": "1d4",
                    "fa": 3,
                    "ca": 7,
                },
                8: {
                    "xp": 160000,
                    "hpRoll": "1d4",
                    "fa": 3,
                    "ca": 8,
                },
                9: {
                    "xp": 320000,
                    "hpRoll": "1d4",
                    "fa": 4,
                    "ca": 9,
                },
                10: {
                    "xp": 480000,
                    "hpRoll": "1",
                    "fa": 4,
                    "ca": 10,
                },
                11: {
                    "xp": 640000,
                    "hpRoll": "1",
                    "fa": 5,
                    "ca": 11,
                },
                12: {
                    "xp": 800000,
                    "hpRoll": "1",
                    "fa": 5,
                    "ca": 12,
                },
            },
            "abilities": [
                { "name": "Alchemy" },
                { "name": "Candle" },
                { "name": "Fire/Heat Affinity" },
                { "name": "Ice/Cold Vulnerability" },
                { "name": "Read Magic" },
                { "name": "Scroll Use" },
                { "name": "Scroll Writing" },
                { "name": "Sorcery" },
                { "name": "New Weapon Skill" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Dart", "quantity": 4 },
                    { "name": "Quarterstaff", "quantity": 1 },
                    { "name": "Scimitar, long", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Blanket, winter", "quantity": 1 },
                    { "name": "Book, spell", "quantity": 1 },
                    { "name": "Chalk", "quantity": 1 },
                    { "name": "Ink and quill", "quantity": 1 },
                    { "name": "Oil, incendiary", "quantity": 1 },
                    { "name": "Parchment", "quantity": 5 },
                    { "name": "Pouch, hard leather (large)", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Rope, hemp", "quantity": 1 },
                    { "name": "Sack, small", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 3 },
                    { "name": "Water-/wineskin", "quantity": 1 },
                    { "name": "Writing stick", "quantity": 1 },
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
            },
        },
        "Ranger": {
            "baseClass": "fighter",
            "hitDie": "1d10",
            "fa": 1,
            "ca": null,
            "spellLists": ["Druid", "Magician"],
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
                    "hpRoll": "1d10",
                    "fa": 1,
                    "ca": null,
                },
                2: {
                    "xp": 2250,
                    "hpRoll": "1d10",
                    "fa": 2,
                    "ca": null,
                },
                3: {
                    "xp": 4500,
                    "hpRoll": "1d10",
                    "fa": 3,
                    "ca": null,
                },
                4: {
                    "xp": 9000,
                    "hpRoll": "1d10",
                    "fa": 4,
                    "ca": null,
                },
                5: {
                    "xp": 18000,
                    "hpRoll": "1d10",
                    "fa": 5,
                    "ca": null,
                },
                6: {
                    "xp": 36000,
                    "hpRoll": "1d10",
                    "fa": 6,
                    "ca": null,
                },
                7: {
                    "xp": 72000,
                    "hpRoll": "1d10",
                    "fa": 7,
                    "ca": 1,
                },
                8: {
                    "xp": 144000,
                    "hpRoll": "1d10",
                    "fa": 8,
                    "ca": 2,
                },
                9: {
                    "xp": 288000,
                    "hpRoll": "1d10",
                    "fa": 9,
                    "ca": 3,
                },
                10: {
                    "xp": 432000,
                    "hpRoll": "3",
                    "fa": 10,
                    "ca": 4,
                },
                11: {
                    "xp": 576000,
                    "hpRoll": "3",
                    "fa": 11,
                    "ca": 5,
                },
                12: {
                    "xp": 720000,
                    "hpRoll": "3",
                    "fa": 12,
                    "ca": 6,
                },
            },
            "abilities": [
                { "name": "Alertness" },
                { "name": "Ambusher" },
                { "name": "Climb" },
                { "name": "Discern Noise" },
                { "name": "Extraordinary Strength" },
                { "name": "Hide" },
                { "name": "Move Silently" },
                { "name": "Otherworldly Enemies" },
                { "name": "Track" },
                { "name": "Track Concealment" },
                { "name": "Traverse Overgrowth" },
                { "name": "Weapon Mastery" },
                { "name": "Wilderness Survival" },
                { "name": "Scroll Use" },
                { "name": "Sorcery" },
                { "name": "Enlist Henchmen" },
                { "name": "Melee Expert" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Studded armour", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Bow, long", "quantity": 1 },
                    { "name": "Dagger", "quantity": 1 },
                    { "name": "Sword, long", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Arrows (x12)", "quantity": 12 },
                    { "name": "Arrow quiver", "quantity": 1 },
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Blanket, winter", "quantity": 1 },
                    { "name": "Rope, hemp", "quantity": 1 },
                    { "name": "Sack, large", "quantity": 1 },
                    { "name": "Torch", "quantity": 3 },
                    { "name": "Water-/wineskin", "quantity": 1 }
                ],
                "equipment - provisions": [
                    { "name": "Rations, standard", "quantity": 7 },
                ],
            },
        },
        "Runegraver": {
            "baseClass": "cleric",
            "hitDie": "1d8",
            "fa": 1,
            "ca": 1,
            "spellLists": ["Runes"],
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
                    "hpRoll": "1d8",
                    "fa": 1,
                    "ca": 1,
                },
                2: {
                    "xp": 3000,
                    "hpRoll": "1d8",
                    "fa": 2,
                    "ca": 2,
                },
                3: {
                    "xp": 6000,
                    "hpRoll": "1d8",
                    "fa": 3,
                    "ca": 3,
                },
                4: {
                    "xp": 12000,
                    "hpRoll": "1d8",
                    "fa": 4,
                    "ca": 4,
                },
                5: {
                    "xp": 24000,
                    "hpRoll": "1d8",
                    "fa": 5,
                    "ca": 5,
                },
                6: {
                    "xp": 48000,
                    "hpRoll": "1d8",
                    "fa": 6,
                    "ca": 6,
                },
                7: {
                    "xp": 96000,
                    "hpRoll": "1d8",
                    "fa": 7,
                    "ca": 7,
                },
                8: {
                    "xp": 192000,
                    "hpRoll": "1d8",
                    "fa": 8,
                    "ca": 8,
                },
                9: {
                    "xp": 384000,
                    "hpRoll": "1d8",
                    "fa": 9,
                    "ca": 9,
                },
                10: {
                    "xp": 576000,
                    "hpRoll": "2",
                    "fa": 10,
                    "ca": 10,
                },
                11: {
                    "xp": 768000,
                    "hpRoll": "2",
                    "fa": 11,
                    "ca": 11,
                },
                12: {
                    "xp": 960000,
                    "hpRoll": "2",
                    "fa": 12,
                    "ca": 12,
                },
            },
            "abilities": [
                { "name": "Extraordinary Strength" },
                { "name": "Grave Runes" },
                { "name": "Ale Horn" },
                { "name": "Casting of Lots" },
                { "name": "Nithing Pole" },
                { "name": "Berserker Horde" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Studded armour", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Axe, battle", "quantity": 1 },
                    { "name": "Bow, short", "quantity": 1 },
                    { "name": "Dagger", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Arrow quiver", "quantity": 1 },
                    { "name": "Arrow, silver-tipped (x1)", "quantity": 2 },
                    { "name": "Arrows (x12)", "quantity": 12 },
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Chalk", "quantity": 1 },
                    { "name": "Dice, ivory", "quantity": 1 },
                    { "name": "Horn, drinking", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 2 },
                    { "name": "Water-/wineskin", "quantity": 1 },
                    { "name": "Writing stick", "quantity": 1 },
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
                "equipment - religious": [
                    { "name": "Holy symbol, wooden", "quantity": 1 },
                ],
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
                    "hpRoll": "1d6",
                    "fa": 1,
                },
                2: {
                    "xp": 1750,
                    "hpRoll": "1d6",
                    "fa": 1,
                },
                3: {
                    "xp": 3500,
                    "hpRoll": "1d6",
                    "fa": 2,
                },
                4: {
                    "xp": 7000,
                    "hpRoll": "1d6",
                    "fa": 3,
                },
                5: {
                    "xp": 14000,
                    "hpRoll": "1d6",
                    "fa": 3,
                },
                6: {
                    "xp": 28000,
                    "hpRoll": "1d6",
                    "fa": 4,
                },
                7: {
                    "xp": 56000,
                    "hpRoll": "1d6",
                    "fa": 5,
                },
                8: {
                    "xp": 112000,
                    "hpRoll": "1d6",
                    "fa": 5,
                },
                9: {
                    "xp": 224000,
                    "hpRoll": "1d6",
                    "fa": 6,
                },
                10: {
                    "xp": 336000,
                    "hpRoll": "2",
                    "fa": 7,
                },
                11: {
                    "xp": 448000,
                    "hpRoll": "2",
                    "fa": 7,
                },
                12: {
                    "xp": 560000,
                    "hpRoll": "2",
                    "fa": 8,
                },
            },
            "abilities": [
                { "name": "Agile" },
                { "name": "Alertness" },
                { "name": "Backstab" },
                { "name": "Controlled Fall" },
                { "name": "Detect Secret Doors" },
                { "name": "Determine Depth and Grade" },
                { "name": "Disguise" },
                { "name": "Extraordinary Dexterity" },
                { "name": "Run" },
                { "name": "Track" },
                { "name": "Climb" },
                { "name": "Discern Noise" },
                { "name": "Hide" },
                { "name": "Manipulate Traps" },
                { "name": "Move Silently" },
                { "name": "Open Locks" },
                { "name": "New Weapon Skill" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Padded (quilted) armour", "quantity": 1 },
                    { "name": "Shield, small", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Axe, hand", "quantity": 2 },
                    { "name": "Dart", "quantity": 4 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Blanket, winter", "quantity": 1 },
                    { "name": "Chalk", "quantity": 1 },
                    { "name": "Clothing, disguise", "quantity": 1 },
                    { "name": "Grappling hook", "quantity": 1 },
                    { "name": "Grease", "quantity": 1 },
                    { "name": "Marbles (x20)", "quantity": 20 },
                    { "name": "Parchment", "quantity": 1 },
                    { "name": "Pole", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Rope, hemp", "quantity": 1 },
                    { "name": "Sack, small", "quantity": 1 },
                    { "name": "Thieves' tools", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 3 },
                    { "name": "Water-/wineskin", "quantity": 1 },
                    { "name": "Writing stick", "quantity": 1 },
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
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
                    "hpRoll": "1d6",
                    "fa": 0,
                    "ca": 1,
                    "ta": null,
                },
                2: {
                    "xp": 2500,
                    "hpRoll": "1d6",
                    "fa": 0,
                    "ca": 2,
                    "ta": null,
                },
                3: {
                    "xp": 5000,
                    "hpRoll": "1d6",
                    "fa": 1,
                    "ca": 3,
                    "ta": 1,
                },
                4: {
                    "xp": 10000,
                    "hpRoll": "1d6",
                    "fa": 2,
                    "ca": 4,
                    "ta": 2,
                },
                5: {
                    "xp": 20000,
                    "hpRoll": "1d6",
                    "fa": 2,
                    "ca": 5,
                    "ta": 3,
                },
                6: {
                    "xp": 40000,
                    "hpRoll": "1d6",
                    "fa": 3,
                    "ca": 6,
                    "ta": 4,
                },
                7: {
                    "xp": 80000,
                    "hpRoll": "1d6",
                    "fa": 4,
                    "ca": 7,
                    "ta": 5,
                },
                8: {
                    "xp": 160000,
                    "hpRoll": "1d6",
                    "fa": 4,
                    "ca": 8,
                    "ta": 6,
                },
                9: {
                    "xp": 320000,
                    "hpRoll": "1d6",
                    "fa": 5,
                    "ca": 9,
                    "ta": 7,
                },
                10: {
                    "xp": 480000,
                    "hpRoll": "2",
                    "fa": 6,
                    "ca": 10,
                    "ta": 8,
                },
                11: {
                    "xp": 640000,
                    "hpRoll": "2",
                    "fa": 6,
                    "ca": 11,
                    "ta": 9,
                },
                12: {
                    "xp": 800000,
                    "hpRoll": "2",
                    "fa": 7,
                    "ca": 12,
                    "ta": 10,
                },
            },
            "abilities": [
                { "name": "Draw Poison" },
                { "name": "Harvest Venom" },
                { "name": "Magic Item Use" },
                { "name": "Medicine Man" },
                { "name": "Read Magic" },
                { "name": "Scroll Use" },
                { "name": "Scroll Writing" },
                { "name": "Sorcery" },
                { "name": "Totem" },
                { "name": "Turn Undead" },
                { "name": "Longevity" },
                { "name": "New Weapon Skill" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Studded armour", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Club, war", "quantity": 1 },
                    { "name": "Dagger", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Belladonna", "quantity": 1 },
                    { "name": "Book, spell", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Rope, hemp", "quantity": 1 },
                    { "name": "Sack, small", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 3 },
                    { "name": "Water-/wineskin", "quantity": 1 }
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
                "equipment - religious": [
                    { "name": "Censer", "quantity": 1 },
                    { "name": "Holy symbol, wooden", "quantity": 1 },
                    { "name": "Incense sticks (x12)", "quantity": 12 },
                    { "name": "Mask, wooden", "quantity": 1 },
                    { "name": "Rattle", "quantity": 1 },
                ],
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
                    "hpRoll": "1d6",
                    "fa": 1,
                },
                2: {
                    "xp": 1500,
                    "hpRoll": "1d6",
                    "fa": 1,
                },
                3: {
                    "xp": 3000,
                    "hpRoll": "1d6",
                    "fa": 2,
                },
                4: {
                    "xp": 6000,
                    "hpRoll": "1d6",
                    "fa": 3,
                },
                5: {
                    "xp": 12000,
                    "hpRoll": "1d6",
                    "fa": 3,
                },
                6: {
                    "xp": 24000,
                    "hpRoll": "1d6",
                    "fa": 4,
                },
                7: {
                    "xp": 48000,
                    "hpRoll": "1d6",
                    "fa": 5,
                },
                8: {
                    "xp": 96000,
                    "hpRoll": "1d6",
                    "fa": 5,
                },
                9: {
                    "xp": 192000,
                    "hpRoll": "1d6",
                    "fa": 6,
                },
                10: {
                    "xp": 288000,
                    "hpRoll": "2",
                    "fa": 7,
                },
                11: {
                    "xp": 384000,
                    "hpRoll": "2",
                    "fa": 7,
                },
                12: {
                    "xp": 480000,
                    "hpRoll": "2",
                    "fa": 8,
                },
            },
            "abilities": [
                { "name": "Agile" },
                { "name": "Backstab" },
                { "name": "Detect Secret Doors" },
                { "name": "Extraordinary Dexterity" },
                { "name": "Thieves' Cant" },
                { "name": "Climb" },
                { "name": "Decipher Script" },
                { "name": "Discern Noise" },
                { "name": "Hide" },
                { "name": "Manipulate Traps" },
                { "name": "Move Silently" },
                { "name": "Open Locks" },
                { "name": "Pick Pockets" },
                { "name": "Read Scrolls" },
                { "name": "New Weapon Skill" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Leather armour", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Dart", "quantity": 2 },
                    { "name": "Sword, short", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Chalk", "quantity": 1 },
                    { "name": "Dice, ivory", "quantity": 1 },
                    { "name": "Fishing hooks", "quantity": 12 },
                    { "name": "Fishing string", "quantity": 1 },
                    { "name": "Grappling hook", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Rope, silk", "quantity": 1 },
                    { "name": "Sack, large", "quantity": 1 },
                    { "name": "Thieves' tools", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 2 },
                    { "name": "Water-/wineskin", "quantity": 1 },
                    { "name": "Wire, spool", "quantity": 1 },
                    { "name": "Writing stick", "quantity": 1 },
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
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
                    "hpRoll": "1d8",
                    "fa": 1,
                    "ca": 1,
                },
                2: {
                    "xp": 3000,
                    "hpRoll": "1d8",
                    "fa": 2,
                    "ca": 2,
                },
                3: {
                    "xp": 6000,
                    "hpRoll": "1d8",
                    "fa": 3,
                    "ca": 3,
                },
                4: {
                    "xp": 12000,
                    "hpRoll": "1d8",
                    "fa": 4,
                    "ca": 4,
                },
                5: {
                    "xp": 24000,
                    "hpRoll": "1d8",
                    "fa": 5,
                    "ca": 5,
                },
                6: {
                    "xp": 48000,
                    "hpRoll": "1d8",
                    "fa": 6,
                    "ca": 6,
                },
                7: {
                    "xp": 96000,
                    "hpRoll": "1d8",
                    "fa": 7,
                    "ca": 7,
                },
                8: {
                    "xp": 192000,
                    "hpRoll": "1d8",
                    "fa": 8,
                    "ca": 8,
                },
                9: {
                    "xp": 384000,
                    "hpRoll": "1d8",
                    "fa": 9,
                    "ca": 9,
                },
                10: {
                    "xp": 576000,
                    "hpRoll": "2",
                    "fa": 10,
                    "ca": 10,
                },
                11: {
                    "xp": 768000,
                    "hpRoll": "2",
                    "fa": 11,
                    "ca": 11,
                },
                12: {
                    "xp": 960000,
                    "hpRoll": "2",
                    "fa": 12,
                    "ca": 12,
                },
            },
            "abilities": [
                { "name": "Extraordinary Strength" },
                { "name": "Magic Item Use" },
                { "name": "Read Magic" },
                { "name": "Scroll Use" },
                { "name": "Scroll Writing" },
                { "name": "Sorcery" },
                { "name": "Weapon Mastery" },
                { "name": "Enlist Henchmen" },
                { "name": "Melee Expert" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "armour": [
                    { "name": "Scale mail", "quantity": 1 },
                ],
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Axe, battle", "quantity": 1 },
                    { "name": "Crossbow, light", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Bolt case", "quantity": 1 },
                    { "name": "Bolts, light (x20)", "quantity": 20 },
                    { "name": "Book, spell", "quantity": 1 },
                    { "name": "Ink and quill", "quantity": 1 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Rope, hemp", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 2 },
                    { "name": "Water-/wineskin", "quantity": 1 }
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
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
                    "hpRoll": "1d4",
                    "fa": 0,
                    "ca": 1,
                },
                2: {
                    "xp": 3000,
                    "hpRoll": "1d4",
                    "fa": 0,
                    "ca": 2,
                },
                3: {
                    "xp": 6000,
                    "hpRoll": "1d4",
                    "fa": 1,
                    "ca": 3,
                },
                4: {
                    "xp": 12000,
                    "hpRoll": "1d4",
                    "fa": 1,
                    "ca": 4,
                },
                5: {
                    "xp": 24000,
                    "hpRoll": "1d4",
                    "fa": 2,
                    "ca": 5,
                },
                6: {
                    "xp": 48000,
                    "hpRoll": "1d4",
                    "fa": 2,
                    "ca": 6,
                },
                7: {
                    "xp": 96000,
                    "hpRoll": "1d4",
                    "fa": 3,
                    "ca": 7,
                },
                8: {
                    "xp": 192000,
                    "hpRoll": "1d4",
                    "fa": 3,
                    "ca": 8,
                },
                9: {
                    "xp": 384000,
                    "hpRoll": "1d4",
                    "fa": 4,
                    "ca": 9,
                },
                10: {
                    "xp": 576000,
                    "hpRoll": "1",
                    "fa": 4,
                    "ca": 10,
                },
                11: {
                    "xp": 768000,
                    "hpRoll": "1",
                    "fa": 5,
                    "ca": 11,
                },
                12: {
                    "xp": 960000,
                    "hpRoll": "1",
                    "fa": 5,
                    "ca": 12,
                },
            },
            "abilities": [
                { "name": "Alchemy" },
                { "name": "Brew Decoction" },
                { "name": "Familiar" },
                { "name": "Read Magic" },
                { "name": "Scroll Use" },
                { "name": "Scroll Writing" },
                { "name": "Sorcery" },
                { "name": "Dance of Beguilement" },
                { "name": "Effigy" },
                { "name": "Animate Broom" },
                { "name": "New Weapon Skill" },
                { "name": "Enlist Henchmen" },
                { "name": "Lordship" },
            ],
            "startingPack": {
                "gold": "1d4+1",
                "weapons": [
                    { "name": "Unarmed attack", "quantity": 1 },
                    { "name": "Blowgun", "quantity": 1 },
                    { "name": "Dagger, silver", "quantity": 1 },
                ],
                "equipment - general": [
                    { "name": "Backpack", "quantity": 1 },
                    { "name": "Bandages, gauze", "quantity": 1 },
                    { "name": "Blanket, winter", "quantity": 1 },
                    { "name": "Book, spell", "quantity": 1 },
                    { "name": "Candle, beeswax", "quantity": 2 },
                    { "name": "Chalk", "quantity": 1 },
                    { "name": "Ink and quill", "quantity": 1 },
                    { "name": "Needle, blowgun", "quantity": 10 },
                    { "name": "Parchment", "quantity": 2 },
                    { "name": "Pouch, soft leather (small)", "quantity": 1 },
                    { "name": "Rope, hemp", "quantity": 1 },
                    { "name": "Sack, small", "quantity": 1 },
                    { "name": "Tinderbox", "quantity": 1 },
                    { "name": "Torch", "quantity": 3 },
                    { "name": "Water-/wineskin", "quantity": 1 },
                    { "name": "Wolfsbane", "quantity": 1 },
                    { "name": "Writing stick", "quantity": 1 },
                ],
                "equipment - provisions": [
                    { "name": "Rations, iron", "quantity": 7 },
                ],
                "equipment - religious": [
                    { "name": "Censer", "quantity": 1 },
                    { "name": "Incense sticks (x12)", "quantity": 12 },
                    { "name": "Paint, body", "quantity": 1 },
                    { "name": "Rattle", "quantity": 1 },
                ],
            },
        },
    }

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

    static _valueFromTable(table, val) {
        let output;
        for (let i = 0; i <= val; i++) {
            if (table[i] != undefined) {
                output = table[i];
            }
        }
        return output;
    }

    static _stringFromTable(table, val) {
        let output = ""
        output = table[val]
        return output
    }

    static isAttributeLow(actorData, attr) {
        Hyp3eLogger.info("Hyp3eCharacter isAttributeLow", `Checking ${attr} attribute for ${actorData.details.class}...`)
        const attrReqs = this.classData[actorData.details.class]?.attrReqs || CONFIG.HYP3E.customClassData[actorData.details.class];
        if (attrReqs[attr]) {
            if (actorData.attributes[attr].value < attrReqs[attr]) {
                return true
            }    
        }
        return false
    }

    /**
     * @param {string} actorId - The actor ID to lookup.
     * @return {object} - The attribute data object 
     */
    static calcAttrMods(actorId) {
      let actor = game.actors.get(actorId)
      if (!actor) {
        Hyp3eLogger.info("Hyp3eCharacter calcAttrMods", `Actor not found for id ${actorId}`);
        return null;
      }
      // Actor system data for lookups
      const data = actor.system;
      let thisClass = this.classData[data.details.class];
      if (!thisClass) {
        const customClassData = game.settings.get(game.system.id, "customClassData");
        thisClass = customClassData[data.details.class];
      }
      // Clone attributes so we can safely work with the modifiers
      const attributes = foundry.utils.deepClone(actor.system.attributes);

      // Temp variable
      let getsBonusSpell = false

      for (let [k, v] of Object.entries(attributes)) {
        switch (k) {
          case "str":
            attributes.str.atkMod = this._valueFromTable(this.strAtkMod, attributes.str.curr)
            attributes.str.dmgMod = this._valueFromTable(this.strDmgMod, attributes.str.curr)
            attributes.str.test = this._valueFromTable(this.testOfAttr, attributes.str.curr)
            attributes.str.feat = this._valueFromTable(this.featOfAttr, attributes.str.curr)
            if (data.details.class) {
              if (thisClass.featBonus && thisClass.featBonus.str) {
                attributes.str.feat += thisClass.featBonus.str
              }
            }
            break;

            case "dex":
              attributes.dex.atkMod = this._valueFromTable(this.dexAtkMod, attributes.dex.curr)
              attributes.dex.defMod = this._valueFromTable(this.dexDefMod, attributes.dex.curr)
              attributes.dex.test = this._valueFromTable(this.testOfAttr, attributes.dex.curr)
              attributes.dex.feat = this._valueFromTable(this.featOfAttr, attributes.dex.curr)
              if (data.details.class) {
                if (thisClass.featBonus && thisClass.featBonus.dex) {
                  attributes.dex.feat += thisClass.featBonus.dex
                }
              }
              break;

            case "con":
              attributes.con.hpMod = this._valueFromTable(this.conHpMod, attributes.con.curr)
              attributes.con.poisRadMod = this._valueFromTable(this.conPoisonMod, attributes.con.curr)
              attributes.con.traumaSurvive = this._valueFromTable(this.conTraumaSurvive, attributes.con.curr)
              attributes.con.test = this._valueFromTable(this.testOfAttr, attributes.con.curr)
              attributes.con.feat = this._valueFromTable(this.featOfAttr, attributes.con.curr)
              if (data.details.class) {
                if (thisClass.featBonus && thisClass.featBonus.con) {
                  attributes.con.feat += thisClass.featBonus.con
                }
              }
              break;

            case "int":
              attributes.int.languages = this._valueFromTable(this.intLanguages, attributes.int.curr)
              getsBonusSpell = this._valueFromTable(this.bonusSpell1, attributes.int.curr)
              if (getsBonusSpell) {
                attributes.int.bonusSpells.lvl1 = true
              } else {
                attributes.int.bonusSpells.lvl1 = false
              }
              getsBonusSpell = this._valueFromTable(this.bonusSpell2, attributes.int.curr)
              if (getsBonusSpell) {
                attributes.int.bonusSpells.lvl2 = true
              } else {
                attributes.int.bonusSpells.lvl2 = false
              }
              getsBonusSpell = this._valueFromTable(this.bonusSpell3, attributes.int.curr)
              if (getsBonusSpell) {
                attributes.int.bonusSpells.lvl3 = true
              } else {
                attributes.int.bonusSpells.lvl3 = false
              }
              getsBonusSpell = this._valueFromTable(this.bonusSpell4, attributes.int.curr)
              if (getsBonusSpell) {
                attributes.int.bonusSpells.lvl4 = true
              } else {
                attributes.int.bonusSpells.lvl4 = false
              }
              attributes.int.learnSpell = this._valueFromTable(this.learnSpell, attributes.int.curr)
              break;

            case "wis":
              attributes.wis.willMod = this._valueFromTable(this.wisWillMod, attributes.wis.curr)
              getsBonusSpell = this._valueFromTable(this.bonusSpell1, attributes.wis.curr)
              if (getsBonusSpell) {
                attributes.wis.bonusSpells.lvl1 = true
              } else {
                attributes.wis.bonusSpells.lvl1 = false
              }
              getsBonusSpell = this._valueFromTable(this.bonusSpell2, attributes.wis.curr)
              if (getsBonusSpell) {
                attributes.wis.bonusSpells.lvl2 = true
              } else {
                attributes.wis.bonusSpells.lvl2 = false
              }
              getsBonusSpell = this._valueFromTable(this.bonusSpell3, attributes.wis.curr)
              if (getsBonusSpell) {
                attributes.wis.bonusSpells.lvl3 = true
              } else {
                attributes.wis.bonusSpells.lvl3 = false
              }
              getsBonusSpell = this._valueFromTable(this.bonusSpell4, attributes.wis.curr)
              if (getsBonusSpell) {
                attributes.wis.bonusSpells.lvl4 = true
              } else {
                attributes.wis.bonusSpells.lvl4 = false
              }
              attributes.wis.learnSpell = this._valueFromTable(this.learnSpell, attributes.wis.curr)
              break;

            case "cha":
              attributes.cha.reaction = this._valueFromTable(this.chaReactionMod, attributes.cha.curr)
              attributes.cha.maxHenchmen = this._valueFromTable(this.chaRetainers, attributes.cha.curr)
              attributes.cha.turnUndead = this._valueFromTable(this.chaTurnUndead, attributes.cha.curr)
              break;
        } // End switch cases
      } // End of for loop

      return attributes;
    }

    /**
     * Quickly create a character actor from a basic dataset.
     * @param {Object} dataset - The dataset from the actor.
     * @return {boolean} Success or failure of the character creation.
     */
    static async quickCreateCharacter(dataset) {
        Hyp3eLogger.info("Hyp3eCharacter quickCreateCharacter", `Incoming dataset:`, dataset);
        let actor = game.actors.get(dataset.actorId)
        if (!actor) {
            Hyp3eLogger.error("Hyp3eCharacter quickCreateCharacter", `Actor not found for id ${dataset.actorId}`);
            return false;
        }

        const attributes = await this.rollAttributesForClass(actor, dataset);
        Hyp3eLogger.info("Hyp3eCharacter quickCreateCharacter", `Attributes:`, attributes);
        if (attributes) {
            // Set the attributes in the actor
            for (let [k, v] of Object.entries(attributes)) {
                await actor.update({ system: { attributes: { [k]: { value: v } } } })
                actor.system.attributes[k].value = v
            }
            const setAttrOk = await this.setAttributeMods(dataset, true)
            if (!setAttrOk) return false; // If setting attribute mods failed, exit early

            const roll = new Roll(`${actor.system.hd} + ${actor.system.attributes.con.hpMod}`);
            await roll.evaluate({ evaluateSync: true });
            Hyp3eLogger.info("Hyp3eCharacter quickCreateCharacter", `HP roll result:`, roll);
            if (roll != undefined && roll.total != undefined) {
                await actor.update({
                    system: {
                        hp: {
                            value: roll.total,
                            max: roll.total
                        }
                    }
                });
                // Set the HP values in the actor
                actor.system.hp.value = roll.total;
                actor.system.hp.max = roll.total;
            } else {
                Hyp3eLogger.error("Hyp3eCharacter quickCreateCharacter", `HP roll failed to evaluate properly.`);
                return false;
            }
        } else {
            Hyp3eLogger.error("Hyp3eCharacter quickCreateCharacter", `Attributes roll failed.`);
            return false;
        }

        // Check to see if the Items directory has the class abilities/features that we need.
        // Alternatively, we can also check for compendia with class abilities.
        const abilities = await this.getClassAbilities({
            actor: actor,
            itemType: "feature",
            folderNames: ["features", "abilities", "class features", "class abilities", "class abilities & features"],
            abilitiesKey: "abilities"
        });
        if (abilities && abilities.length > 0) {
            // Add the features to the actor's list
            await actor.createEmbeddedDocuments("Item", abilities);
        }

        // Check to see if the Items directory has the folders & items we need.
        // Alternatively, we can also check for compendia with the items we need.
        // Start with armor...
        const armorItems = await this.getDefaultItemsForClass({
            actor: actor,
            itemType: "armor",
            folderNames: ["armor", "armour"],
            packKey: "armour"
        });
        if (armorItems && armorItems.length > 0) {
            // Add the armor to the actor's inventory
            await actor.createEmbeddedDocuments("Item", armorItems);
        }

        // Next we do weapons...
        const weaponItems = await this.getDefaultItemsForClass({
            actor: actor,
            itemType: "weapon",
            folderNames: ["weapons"],
            packKey: "weapons"
        });
        if (weaponItems && weaponItems.length > 0) {
            // Add the weapons to the actor's inventory
            await actor.createEmbeddedDocuments("Item", weaponItems);
        }

        // Next we do all the equipment items...
        const generalItems = await this.getDefaultItemsForClass({
            actor: actor,
            itemType: "item",
            folderNames: ["equipment - general", "equipment - provisions", "equipment - religious", "gear", "equipment", "items", "weapons"],
            packKey: "equipment - general"
        });
        if (generalItems && generalItems.length > 0) {
            // Add the items to the actor's inventory
            await actor.createEmbeddedDocuments("Item", generalItems);
        }
        const provisionItems = await this.getDefaultItemsForClass({
            actor: actor,
            itemType: "item",
            folderNames: ["equipment - provisions", "equipment - general", "gear", "equipment", "items"],
            packKey: "equipment - provisions"
        });
        if (provisionItems && provisionItems.length > 0) {
            // Add the items to the actor's inventory
            await actor.createEmbeddedDocuments("Item", provisionItems);
        }
        const religiousItems = await this.getDefaultItemsForClass({
            actor: actor,
            itemType: "item",
            folderNames: ["equipment - religious", "equipment - general", "gear", "equipment", "items"],
            packKey: "equipment - religious"
        });
        if (religiousItems && religiousItems.length > 0) {
            // Add the items to the actor's inventory
            await actor.createEmbeddedDocuments("Item", religiousItems);
        }

        // Get starting gold
        const gold = await this.getStartingGoldForClass(actor);
        if (gold && gold > 0) {
            // Add the gold to the actor's inventory
            await actor.update({"system.money.gp.value": gold});
            actor.system.money.gp.value = gold;
        }

        // All good? Disable the quick-create button so it can't be used again.
        actor.setFlag(game.system.id, "disableQuickCreate", true)
        return true;
    }

    /**
     * Roll attributes for a character of the given class
     * @param {string} actor - The actor object to create the character for
     * @param {object} dataset - The dataset containing character creation data
     * @returns {Object} - Returns an object with the rolled attributes
     */
    static async rollAttributesForClass(actor, dataset) {
        const charClass = actor.system.details.class;
        Hyp3eLogger.info("Hyp3eCharacter rollAttributesForClass", `Class to roll:`, charClass);
        // Get the class attribute requirements
        let classData = this.classData[charClass] || CONFIG.HYP3E.customClassData[charClass];
        if (!classData) {
            Hyp3eLogger.error("Hyp3eCharacter rollAttributesForClass", `Class data not found for class ${charClass}!`);
            return null;
        }
        Hyp3eLogger.info("Hyp3eCharacter rollAttributesForClass", `Creating character of class ${charClass}, starting with class data:`, classData);

        // Roll attributes down the line, retry until we get a set that meets the class requirements
        Hyp3eLogger.info("Hyp3eCharacter rollAttributesForClass", `Rolling attributes for class ${charClass}`);
        const rollFormula = game.settings.get(game.system.id, "quickCreateChars")
        let metReqs = false;
        let attributes = {};
        while (!metReqs) {
            attributes = await this._rollAttributes(actor);
            if (rollFormula == "4d6dl") {
              attributes = this._optimizeAttributesForClass(charClass, attributes);
            }
            metReqs = await this._checkAttrRequirements(charClass, attributes);
            if (metReqs) {
                Hyp3eLogger.info("Hyp3eCharacter rollAttributesForClass", `Character meets class requirements for ${charClass}, attributes rolled:`, attributes);
            } else {
                Hyp3eLogger.info("Hyp3eCharacter rollAttributesForClass", `Character does not meet class requirements for ${charClass}, rolling again...`)
            }
        }
        // If we reach here, we have a set of attributes that meets the class requirements
        return attributes;
    }

    static async _rollAttributes(actor) {
        const rollFormula = game.settings.get(game.system.id, "quickCreateChars")
        Hyp3eLogger.info("Hyp3eCharacter _rollAttributes", `Rolling attributes using formula ${rollFormula} down the line...`);
        // Just roll and return the attributes
        let attributes = {};
        for (const attr of Object.keys(actor.system.attributes)) {
            // Roll specified formula for each attribute
            let roll = new Roll(rollFormula);
            await roll.roll();
            attributes[attr] = roll.total;
        }
        Hyp3eLogger.info("Hyp3eCharacter _rollAttributes", `Rolled attributes:`, attributes);
        return attributes;
    }

    static _optimizeAttributesForClass(charClass, attributes) {
      const classData = this.classData[charClass] || CONFIG.HYP3E.customClassData[charClass];
      if (!classData) {
          Hyp3eLogger.error("Hyp3eCharacter _optimizeAttributesForClass", `Class data not found for class ${charClass}!`);
          return attributes;
      }
      Hyp3eLogger.info("Hyp3eCharacter _optimizeAttributesForClass", `Optimizing attributes for ${charClass} with rolls:`, attributes);
      Hyp3eLogger.info("Hyp3eCharacter _optimizeAttributesForClass", `${charClass} attribute requirements:`, classData.attrReqs);

      // Clone to avoid mutation
      const optimizedAttributes = {};

      // Rolled values in original order
      const attributeOrder = ["str", "dex", "con", "int", "wis", "cha"];
      const rolledValues = Object.values(attributes);
      Hyp3eLogger.info("Hyp3eCharacter _optimizeAttributesForClass", `Rolled attribute values in order:`, rolledValues);

      const classPrimes = Object.keys(classData.attrReqs);
      // Sort prime attributes by required minimum, descending
      const primeReqsSorted = Object.keys(classData.attrReqs).sort((a, b) => {
        return classData.attrReqs[b] - classData.attrReqs[a];
      });

      Hyp3eLogger.info("Hyp3eCharacter _optimizeAttributesForClass", `${charClass} prime attributes:`, primeReqsSorted);

      // Take top N values for prime attributes
      const topValues = [...rolledValues]
        .sort((a, b) => b - a)
        .slice(0, Object.keys(classData.attrReqs).length);

      // Assign top values to primes
      primeReqsSorted.forEach((attr, i) => {
        optimizedAttributes[attr] = topValues[i];
      });

      // Remove used values by value, not index
      let remainingValues = [...rolledValues];
      Hyp3eLogger.info("Hyp3eCharacter _optimizeAttributesForClass", `Remaining attribute values before removing primes:`, remainingValues);
      topValues.forEach(val => {
        Hyp3eLogger.info("Hyp3eCharacter _optimizeAttributesForClass", `Removing value ${val}...`);
        const idx = remainingValues.indexOf(val);
        if (idx !== -1) remainingValues.splice(idx, 1);
      });
      Hyp3eLogger.info("Hyp3eCharacter _optimizeAttributesForClass", `${charClass} remaining attribute values without primes:`, remainingValues);

      // Assign remaining values to non-primes, in original roll order
      const nonPrimes = attributeOrder.filter(a => !classPrimes.includes(a));
      nonPrimes.forEach((attr, i) => {
        optimizedAttributes[attr] = remainingValues[i];
      });
      Hyp3eLogger.info("Hyp3eCharacter _optimizeAttributesForClass", `${charClass} assigned attributes:`, optimizedAttributes);
      return optimizedAttributes;
    }

    static async _checkAttrRequirements(charClass, attributes) {
        const classData = this.classData[charClass] || CONFIG.HYP3E.customClassData[charClass];
        if (!classData) {
            Hyp3eLogger.error("Hyp3eCharacter _checkAttrRequirements", `Class data not found for class ${charClass}!`);
            return false;
        }
        Hyp3eLogger.info("Hyp3eCharacter _checkAttrRequirements", `Checking attribute list:`, attributes);

        // Check if the character meets the attribute requirements
        for (const [attr, minValue] of Object.entries(classData.attrReqs)) {
            Hyp3eLogger.info("Hyp3eCharacter _checkAttrRequirements", `Checking ${attr} requirement for class ${charClass}: Required: ${minValue}, Rolled: ${attributes[attr]}`);
            if (attributes[attr] < minValue) {
                Hyp3eLogger.info("Hyp3eCharacter _checkAttrRequirements", `Character does not meet ${attr} requirement for class ${charClass}. Required: ${minValue}, Rolled: ${attributes[attr]}`);
                return false;
            }
        }
        return true;
    }

    /**
     * Get the abilities for a class, based on whatever is listed in the class data.
     * @param {Actor} actor - The actor object to get the default items for
     * @param {string} itemType - The type of item to get (e.g., "feature")
     * @param {Array<string>} folderNames - The names of the folders to search for items in
     * @param {string} abilitiesKey - The key for the abilities list in the class data
     * @returns {Promise<Array>} - Returns a promise that resolves to an array of abilities
     */
    static async getClassAbilities({ actor, itemType, folderNames, abilitiesKey }) {
        const charClass = actor.system.details.class;
        const classData = this.classData[charClass] || CONFIG.HYP3E.customClassData[charClass];

        if (!classData) {
            Hyp3eLogger.error("Hyp3eCharacter getClassAbilities", `Class data not found for class ${charClass}!`);
            return [];
        }

        const abilities = classData?.[abilitiesKey];
        if (!Array.isArray(abilities) || abilities.length === 0) {
            Hyp3eLogger.info("Hyp3eCharacter getClassAbilities", `No starting ${itemType}(s) of type ${abilitiesKey} defined for class ${charClass}.`);
            return [];
        }

        Hyp3eLogger.info("Hyp3eCharacter getClassAbilities", `Getting ${itemType}s for ${charClass}:`, abilities);

        // Build compendium list
        let compendiaList = [];
        const builtInCompendia = game.packs.filter(p => 
            folderNames.includes(p.metadata.label.toLowerCase())
        );
        if (builtInCompendia) compendiaList.push(...builtInCompendia);

        const customList = game.settings.get(game.system.id, "customCompendia");
        if (customList) {
            const customNames = customList.split(",").map(s => s.trim().toLowerCase());
            const matchingPacks = game.packs.filter(p =>
                customNames.includes(p.metadata.label.toLowerCase())
            );
            compendiaList.push(...matchingPacks);
        }
        Hyp3eLogger.info("Hyp3eCharacter getClassAbilities", `Compendium list for ${itemType}:`, compendiaList.map(p => p.metadata.label));

        const results = [];

        for (const entry of abilities) {
            const abilityName = entry.name.toLowerCase();
            let newItem;

            // Search in the world Items directory for ann items matching the ability name
            const matches = game.items.filter(i => i.name.toLowerCase() === abilityName);
            for (let item of matches) {
                Hyp3eLogger.info("Hyp3eCharacter getClassAbilities", `Possible match for ${abilityName}:`, item);
                const folder = item.folder;
                if (!folder) continue;

                const folderName = folder.name.toLowerCase();
                const parent = folder.folder;
                const parentName = parent?.name?.toLowerCase() ?? "";
                Hyp3eLogger.info("Hyp3eCharacter getClassAbilities", `Ability folder: ${folderName}, parent folder: ${parentName}`);
            
                // Verify parent folder and item folder match search parameters
                if (folderNames.includes(parentName) && folderName === charClass.toLowerCase()) {
                    newItem = item.toObject();
                    Hyp3eLogger.info("Hyp3eCharacter getClassAbilities", `Found ${itemType} in folder ${folder}:`, newItem);
                    break;
                }
            }

            // Search through previously-discovered compendia if not found in directory
            if (!newItem && compendiaList.length) {
                for (const pack of compendiaList) {
                    await pack.getIndex(); // Ensure index is loaded
                    const matches = pack.index.filter(i => i.name.toLowerCase() === abilityName);
                    // Iterate through matches and take the first exact match in the correct class folder
                    for (const entry of matches) {
                        if (!entry.folder) continue;    // Doc not in a folder, skip

                        // Resolve compendium folder holding this item/doc
                        const folder = pack.folders.get(entry.folder);
                        if (!folder) continue;

                        const folderName = folder.name.toLowerCase();
                        if (folderName === charClass.toLowerCase()) {
                            const doc = await pack.getDocument(entry._id);
                            newItem = doc.toObject();
                            Hyp3eLogger.info("Hyp3eCharacter getClassAbilities", `Found ${itemType} in compendium ${pack.metadata.label}, folder ${folder.name}:`, newItem);
                        }
                        if (newItem) break;
                    }
                    if (newItem) break;
                }
            }

            // Fallback item
            if (!newItem) {
                Hyp3eLogger.info("Hyp3eCharacter getClassAbilities", `Item ${entry.name} not found. Creating fallback.`);
                newItem = {
                    name: entry.name,
                    type: itemType,
                    img: "icons/svg/target.svg",
                    system: {
                        realName: entry.name,
                    }
                };
            }

            results.push(newItem);
        }

        return results;
    }

    /**
     * Get the default items for a class, based on whatever is listed in the class data.
     * @param {Actor} actor - The actor object to get the default items for
     * @param {string} itemType - The type of item to get (e.g., "armor", "weapons")
     * @param {Array<string>} folderNames - The names of the folders to search for items in
     * @param {string} packKey - The key for the starting pack in the class data
     * @returns {Promise<Array>} - Returns a promise that resolves to an array of armor items
     */
    static async getDefaultItemsForClass({ actor, itemType, folderNames, packKey }) {
        const charClass = actor.system.details.class;
        const classData = this.classData[charClass] || CONFIG.HYP3E.customClassData[charClass];

        if (!classData) {
            Hyp3eLogger.error("Hyp3eCharacter getDefaultItemsForClass", `Class data not found for class ${charClass}!`);
            return [];
        }

        const startingItems = classData.startingPack?.[packKey];
        if (!Array.isArray(startingItems) || startingItems.length === 0) {
            Hyp3eLogger.info("Hyp3eCharacter getDefaultItemsForClass", `No starting ${itemType}(s) of type ${packKey} defined for class ${charClass}.`);
            return [];
        }

        Hyp3eLogger.info("Hyp3eCharacter getDefaultItemsForClass", `Getting default ${itemType} for ${charClass}:`, startingItems);

        // Build compendium list
        let compendiaList = [];
        const builtInCompendia = game.packs.filter(p => 
            folderNames.includes(p.metadata.label.toLowerCase())
        );
        if (builtInCompendia) compendiaList.push(...builtInCompendia);

        const customList = game.settings.get(game.system.id, "customCompendia");
        if (customList) {
            const customNames = customList.split(",").map(s => s.trim().toLowerCase());
            const matchingPacks = game.packs.filter(p =>
                customNames.includes(p.metadata.label.toLowerCase())
            );
            compendiaList.push(...matchingPacks);
        }
        Hyp3eLogger.info("Hyp3eCharacter getDefaultItemsForClass", `Compendium list for ${itemType}:`, compendiaList.map(p => p.metadata.label));

        const results = [];

        for (const entry of startingItems) {
            const itemName = entry.name.toLowerCase();
            const quantity = entry.quantity ?? 1;
            let newItem;

            // Search in the world Items directory
            const matches = game.items.filter(i => i.name.toLowerCase() === itemName);
            for (let item of matches) {
                const folder = item.folder?.name?.toLowerCase() ?? "";
                if (folderNames.includes(folder)) {
                    newItem = item.toObject();
                    newItem.system.quantity = { value: quantity, max: quantity, bundle: newItem.system.quantity?.bundle ?? null };
                    Hyp3eLogger.info("Hyp3eCharacter getDefaultItemsForClass", `Found ${itemType} in folder ${folder}:`, newItem);
                    break;
                }
            }

            // Search through previously-discovered compendia if not found in directory
            if (!newItem && compendiaList.length) {
                for (const pack of compendiaList) {
                    await pack.getIndex(); // Ensure index is loaded
                    const compMatch = pack.index.find(i => i.name.toLowerCase() === itemName);
                    if (compMatch) {
                        const doc = await pack.getDocument(compMatch._id);
                        newItem = doc.toObject();
                        newItem.system.quantity = { value: quantity, max: quantity, bundle: newItem.system.quantity?.bundle ?? null };
                        Hyp3eLogger.info("Hyp3eCharacter getDefaultItemsForClass", `Found ${itemType} in compendium ${pack.metadata.label}:`, newItem);
                        break;
                    }
                }
            }

            // Fallback item
            if (!newItem) {
                Hyp3eLogger.info("Hyp3eCharacter getDefaultItemsForClass", `Item ${entry.name} not found. Creating fallback.`);
                newItem = {
                    name: entry.name,
                    type: itemType,
                    img: "icons/svg/item-bag.svg",
                    system: {
                        quantity: {
                            value: quantity,
                            max: quantity,
                            bundle: null
                        }
                    }
                };
            }

            results.push(newItem);
        }

        return results;
    }

    /**
     * Roll starting gold for character and return the number of gp
     * @param {*} actor 
     * @returns {Number} - The number of gp
     */
    static async getStartingGoldForClass(actor) {
        const charClass = actor.system.details.class;
        const classData = this.classData[charClass] || CONFIG.HYP3E.customClassData[charClass];
        if (!classData) {
            Hyp3eLogger.error("Hyp3eCharacter getStartingGoldForClass", `Class data not found for class ${charClass}!`);
            return 0;
        }
        Hyp3eLogger.info("Hyp3eCharacter getStartingGoldForClass", `Getting starting gold for class ${charClass}:`, classData.startingPack.gold);
        // Roll the starting gold using the defined formula
        const rollFormula = classData.startingPack.gold;
        const roll = new Roll(rollFormula);
        await roll.roll();
        Hyp3eLogger.info("Hyp3eCharacter getStartingGoldForClass", `Rolled ${roll.total} gold for class ${charClass}`);
        // Return the rolled gold amount
        return roll.total;
    }

    /**
     * Check the character's XP and level-up if possible
     * @param {*} dataset
     */
    static async levelUp(dataset) {
        let actor = game.actors.get(dataset.actorId)
        if (!actor) {
            Hyp3eLogger.error("Hyp3eCharacter levelUp", `Actor not found for id ${dataset.actorId}`);
            return false;
        }
        // Log the dataset before the dialog renders
        Hyp3eLogger.info("Hyp3eCharacter levelUp", `${actor.name} dataset: `, dataset);

        // Get the class & level data
        let thisClass = this.classData[actor.system.details.class] || CONFIG.HYP3E.customClassData[actor.system.details.class];
        let currLevel = actor.system.details.level.value ? parseInt(actor.system.details.level.value) : 1

        // Is the character already level 12? Then exit...
        if (currLevel >= 12) {
            ui.notifications.warn("Characters cannot be auto-leveled beyond 12.");
            return false;
        }

        // Display the confirmation dialog, and exit if the user cancels this action
        try {
            let rollResponse = await Hyp3eDialog.ShowLevelUpDialog(dataset)
        } catch(err) {
            Hyp3eLogger.info("Hyp3eCharacter levelUp", `Dialog canceled.`, err);
            return false;
        }

        // Initialize character data
        let data = foundry.utils.deepClone(actor.system)

        let nextLevel = currLevel + 1
        let requiredXp = thisClass.levelAdvancement[nextLevel].xp
        let nextLevelXp
        if (nextLevel <= 11) {
            nextLevelXp = thisClass.levelAdvancement[nextLevel+1].xp
        } else {
            // No more "Next Level XP" after level 12
            nextLevelXp = thisClass.levelAdvancement[12].xp
        }

        // Do we have enough XP to level up?
        let currentXp = parseInt((data.details.xp.value).replace(/,|\./g, ""))
        if (currentXp < requiredXp) {
            ui.notifications.warn(`Not enough XP to level up! ${currentXp} < ${requiredXp}`)
            Hyp3eLogger.info("Hyp3eCharacter levelUp", `Not enough XP to level up! ${currentXp} < ${requiredXp}`)
            return false
        }

        // Yes, we can level up
        Hyp3eLogger.info("Hyp3eCharacter levelUp", `Leveling up ${actor.name} to level ${nextLevel}...`)
        // Update the actor's level and next-level XP
        data.details.level.value = nextLevel
        data.details.xp.toNextLvl = nextLevelXp
        // Increase current & max hit points
        let hpIncrease = 0
        const hpRoll = thisClass.levelAdvancement[nextLevel].hpRoll
        const roll = new Roll(`${hpRoll} + ${data.attributes.con.hpMod}`);
        await roll.roll();
        Hyp3eLogger.info("Hyp3eCharacter levelUp", `HP roll result:`, roll);
        if (roll != undefined && roll.total != undefined) {
            hpIncrease = roll.total;
            data.hp.value = parseInt(data.hp.value) + hpIncrease
            data.hp.max = parseInt(data.hp.max) + hpIncrease
        } else {
            Hyp3eLogger.error("Hyp3eCharacter levelUp", `HP roll failed!`)
        }
        // Update fighting ability, casting ability, and turning ability
        data.fa = thisClass.levelAdvancement[nextLevel].fa
        if (thisClass.levelAdvancement[nextLevel].ca) { data.ca = thisClass.levelAdvancement[nextLevel].ca }
        if (thisClass.levelAdvancement[nextLevel].ta) { data.ta = thisClass.levelAdvancement[nextLevel].ta }

        // Update saving throws, if needed
        let currentSave = this._valueFromTable(this.savingThrows, currLevel)
        let newSave = this._valueFromTable(this.savingThrows, nextLevel)
        if (newSave < currentSave) {
            // It's as easy as subtracting 1 from each save...
            data.saves.death.value -= 1
            data.saves.device.value -= 1
            data.saves.transformation.value -= 1
            data.saves.avoidance.value -= 1
            data.saves.sorcery.value -= 1
        }

        // Use the modified data clone to create a clean update object for the character
        let updateData = {
            system: {
                hd: data.hd,
                hp: {
                    value: data.hp.value,
                    max: data.hp.max,
                },
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
            Hyp3eLogger.info("Hyp3eCharacter levelUp", `Updated level data:`, updateData);
            if(actor.validate(updateData)) {
                Hyp3eLogger.info("Hyp3eCharacter levelUp", `Validation OK, executing update...`);
                // Update the main actor data
                await actor.update(updateData)
                // Log the actor data after updating
                Hyp3eLogger.info("Hyp3eCharacter levelUp", `Actor after update:`, actor);
            }
        } catch(err) {
            Hyp3eLogger.error("Hyp3eCharacter levelUp", `Actor update error:`, err)
        }

        // Update the actor with the new data
        await actor.update(updateData)

        // Setup a chat message to show the level-up values
        let label = `<div><b>Level Up!</b></div>`
        let content = `<ul>`
        content += `<li>New Level: ${nextLevel}</li>`
        content += `<li>XP: ${currentXp} / ${nextLevelXp}</li>`
        content += `<li>Hit Point Increase: ${hpIncrease} (${data.hp.value} HP / ${data.hp.max} max)</li>`
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
        return true;

    }

    /**
     * Set or reset all attribute modifiers
     * @param {*} dataset 
     */
    static async setAttributeMods(dataset, skipPrompt = false) {
        let actor = game.actors.get(dataset.actorId)
        if (!actor) {
            Hyp3eLogger.error("Hyp3eCharacter setAttributeMods", `Actor not found for id ${dataset.actorId}`)
            return false
        }
        // Log the dataset before the dialog renders
        Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `${actor.name} dataset: `, dataset);

        if (!skipPrompt) {
            // Display the confirmation dialog, and exit if the user cancels this action
            try {
                let rollResponse = await Hyp3eDialog.ShowSetModifiersDialog(dataset)
            } catch(err) {
                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Roll dialog canceled.`, err)
                return false
            }
        }

        // Initialize some vars
        let data = foundry.utils.deepClone(actor.system)
        let thisClass = {}
        let xpBonusPossible = null
        let getsBonusSpell = false

        // Setup chat message variables
        let label = `<div><b>Values for character updated...</b></div>`
        let content = `<ul>`

        // Here we modify the cloned data object of the actor...
        Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Cloned Actor system data:`, data);
        if (data.details.class) {
            // Override label if character class selected
            label = `<div><b>Values for ${data.details.class} updated...</b></div>`
            Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Setting ${data.details.class} hit die...`);
            thisClass = this.classData[data.details.class] || CONFIG.HYP3E.customClassData[data.details.class];
            Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Class Data for ${data.details.class}:`, thisClass);
            data.hd = thisClass.hitDie
            content += `<li>Hit Die: ${thisClass.hitDie}</li>`
            data.fa = thisClass.fa
            content += `<li>Fighting Ability: ${thisClass.fa}</li>`
            data.ca = thisClass.ca
            content += `<li>Casting Ability: ${thisClass.ca}</li>`
            if (thisClass?.spellLists && thisClass.spellLists.length > 0) {
                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Setting ${data.details.class} spell lists...`);
                data.spellList = thisClass.spellLists[0]
                data.spellList2 = thisClass.spellLists.length > 1 ? thisClass.spellLists[1] : null
                if (data.spellList2 && data.spellList2 != "") {
                    content += `<li>Spell List(s): ${thisClass.spellLists.join(", ")}</li>`
                } else {
                    content += `<li>Spell List(s): ${data.spellList}</li>`
                }
            }
            data.ta = thisClass.ta
            content += `<li>Turning Ability: ${thisClass.ta}</li>`
            data.unskilled = thisClass.unskilled
            content += `<li>Unskilled Weapon Penalty: ${thisClass.unskilled}</li>`
            data.details.xp.value = 0
            data.details.xp.toNextLvl = thisClass.levelAdvancement[2].xp
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
                        Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Setting ${k} modifiers...`);
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
                                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Checking ST requirements for ${data.details.class}...`);
                                if (data.attributes.str.value < thisClass.attrReqs.str) {
                                    ui.notifications.info(`ST is too low for ${data.details.class}!`)
                                }
                            }
                            if (thisClass.xpBonusReq.str) {
                                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Checking XP bonus on high ST...`);
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
                                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Checking for Extraordinary Feat of ST...`);
                                data.attributes.str.feat += thisClass.featBonus.str
                                content += `<li>Extraordinary Feat of ST override: ${data.attributes.str.feat}</li>`
                            }
                        }
                        content += `</ul>`
                        break

                    case "dex":
                        Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Setting ${k} modifiers...`);
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
                                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Checking DX requirements for ${data.details.class}...`);
                                if (data.attributes.dex.value < thisClass.attrReqs.dex) {
                                    ui.notifications.info(`DX is too low for ${data.details.class}!`)
                                }
                            }
                            if (thisClass.xpBonusReq.dex) {
                                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Checking XP bonus on high DX...`);
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
                                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Checking for Extraordinary Feat of DX...`);
                                data.attributes.dex.feat += thisClass.featBonus.dex
                                content += `<li>Extraordinary Feat of DX override: ${data.attributes.dex.feat}</li>`
                            }
                        }
                        content += `</ul>`
                        break

                    case "con":
                        Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Setting ${k} modifiers...`);
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
                                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Checking CN requirements for ${data.details.class}...`);
                                if (data.attributes.con.value < thisClass.attrReqs.con) {
                                    ui.notifications.info(`CN is too low for ${data.details.class}!`)
                                }
                            }
                            if (thisClass.xpBonusReq.con) {
                                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Checking XP bonus on high CN...`);
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
                                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Checking for Extraordinary Feat of CN...`);
                                data.attributes.con.feat += thisClass.featBonus.con
                                content += `<li>Extraordinary Feat of CN override: ${data.attributes.con.feat}</li>`
                            }
                        }
                        content += `</ul>`
                        break

                    case "int":
                        Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Setting ${k} modifiers...`);
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
                                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Checking IN requirements for ${data.details.class}...`);
                                if (data.attributes.int.value < thisClass.attrReqs.int) {
                                    ui.notifications.info(`IN is too low for ${data.details.class}!`)
                                }
                            }
                            if (thisClass.xpBonusReq.int) {
                                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Checking XP bonus on high IN...`);
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
                        Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Setting ${k} modifiers...`);
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
                                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Checking WS requirements for ${data.details.class}...`);
                                if (data.attributes.wis.value < thisClass.attrReqs.wis) {
                                    ui.notifications.info(`WS is too low for ${data.details.class}!`)
                                }
                            }
                            if (thisClass.xpBonusReq.wis) {
                                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Checking XP bonus on high WS...`);
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
                        Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Setting ${k} modifiers...`);
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
                                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Checking CH requirements for ${data.details.class}...`);
                                if (data.attributes.cha.value < thisClass.attrReqs.cha) {
                                    ui.notifications.info(`CH is too low for ${data.details.class}!`)
                                }
                            }
                            if (thisClass.xpBonusReq.cha) {
                                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Checking XP bonus on high CH...`);
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
                            value: 0,
                            toNextLvl: data.details.xp.toNextLvl,
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
                Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Updated attribute modifier data:`, updateData);
                if(actor.validate(updateData)) {
                    Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Validation OK, executing update...`);
                    // Update the main actor data
                    await actor.update(updateData)
                    // Log the actor data after updating
                    Hyp3eLogger.info("Hyp3eCharacter setAttributeMods", `Actor after update:`, actor.system);
                }
            } catch(err) {
                Hyp3eLogger.error("Hyp3eCharacter setAttributeMods", `Actor update error:`, err)
            }

            // Now we can display the chat message
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                flavor: label,
                content: content ?? ''
            })
        }
        return true;
    }
}