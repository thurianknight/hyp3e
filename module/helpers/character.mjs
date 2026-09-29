import { Hyp3eActor } from "../documents/actor.mjs";
import { getClassTemplate, getClassTemplateNames } from "./folders-and-compendia.mjs"
import { HYP3E } from "./config.mjs"
import {Hyp3eDialog} from "./dialog.mjs";
import { Hyp3eLogger } from "./logger.mjs";

/**
 * Hyp3eCharacterClass class
 * 
 * This class contains all the attribute and class methods for a Hyperborea character.
 * It is used to manage the character's attributes, skills, and other data.
 */
export class Hyp3eCharacterClass {

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

  /**
   * Determine whether an attribute is too low for the character's class, and return true/false.
   * @param {*} actorData - The actor system data to check
   * @param {*} attr - The attribute to check (e.g., "str", "dex", etc.)
   * @returns 
   */
  static isAttributeLow(actorData, attr) {
    // Hyp3eLogger.info("Hyp3eCharacterClass isAttributeLow", `Checking ${attr} attribute for ${actorData.details.class}...`)
    return actorData.attributes[attr]?.curr < actorData.attributes[attr]?.min ?? false;
  }

  /**
   * Calculate attribute modifiers for the actor based on their class.
   * @param {string} data - The actor's system data object
   * @return {object} - The attribute data object 
   */
  static calcAttrMods(data) {
    // Clone attributes so we can safely work with the modifiers
    const attributes = foundry.utils.deepClone(data.attributes);

    // Temp variable
    let getsBonusSpell = false

    for (let [k, v] of Object.entries(attributes)) {
      switch (k) {
        case "str":
          attributes.str.atkMod = this._valueFromTable(this.strAtkMod, attributes.str.curr)
          attributes.str.dmgMod = this._valueFromTable(this.strDmgMod, attributes.str.curr)
          attributes.str.test = this._valueFromTable(this.testOfAttr, attributes.str.curr)
          attributes.str.feat = this._valueFromTable(this.featOfAttr, attributes.str.curr)
          // Add any class feat bonus to the feat of strength
          attributes.str.feat += attributes.str?.classFeatBonus ?? 0;
          break;

        case "dex":
          attributes.dex.atkMod = this._valueFromTable(this.dexAtkMod, attributes.dex.curr)
          attributes.dex.defMod = this._valueFromTable(this.dexDefMod, attributes.dex.curr)
          attributes.dex.test = this._valueFromTable(this.testOfAttr, attributes.dex.curr)
          attributes.dex.feat = this._valueFromTable(this.featOfAttr, attributes.dex.curr)
          // Add any class feat bonus to the feat of dexterity
          attributes.dex.feat += attributes.dex?.classFeatBonus ?? 0;
          break;

        case "con":
          attributes.con.hpMod = this._valueFromTable(this.conHpMod, attributes.con.curr)
          attributes.con.poisRadMod = this._valueFromTable(this.conPoisonMod, attributes.con.curr)
          attributes.con.traumaSurvive = this._valueFromTable(this.conTraumaSurvive, attributes.con.curr)
          attributes.con.test = this._valueFromTable(this.testOfAttr, attributes.con.curr)
          attributes.con.feat = this._valueFromTable(this.featOfAttr, attributes.con.curr)
          // Add any class feat bonus to the feat of constitution
          attributes.con.feat += attributes.con?.classFeatBonus ?? 0;
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
   * Apply a class template to an actor, setting the appropriate attributes, abilities, and starting equipment.
   * @param {*} actor 
   * @param {*} classTemplate 
   */
  static async applyClassTemplate(actor, classTemplate) {
    Hyp3eLogger.info("Hyp3eCharacterClass applyClassTemplate", `Applying class template to ${actor.name}:`, classTemplate);
    // Set the class & baseClass in the actor's details
    await actor.update({ 
      "system.details.class": classTemplate.name, 
      "system.baseClass": classTemplate.system.baseClass
    });

    // Clone the actor's system data to hold data for batch update
    let actorData = foundry.utils.deepClone(actor.system);

    // Roll the attributes for the actor and ensure they meet class requirements
    const attributes = await this.rollAttributesForClass(actor, classTemplate);
    if (!attributes) {
      Hyp3eLogger.error("Hyp3eCharacterClass applyClassTemplate", `Attributes roll failed.`);
      return false;
    }
    Hyp3eLogger.info("Hyp3eCharacterClass applyClassTemplate", `Attributes:`, attributes);

    // Set the attributes + minimums in the actor
    for (let [k, v] of Object.entries(attributes)) {
      actorData.attributes[k].value = v;
      actorData.attributes[k].min = (classTemplate.system?.attrReqs[k] ?? 3);
    };
    // Add class-based feat of attribute bonuses to the physical attributes
    actorData.attributes.str.classFeatBonus = classTemplate.system.featBonus?.str ?? 0;
    actorData.attributes.dex.classFeatBonus = classTemplate.system.featBonus?.dex ?? 0;
    actorData.attributes.con.classFeatBonus = classTemplate.system.featBonus?.con ?? 0;

    // Update actor attributes so we can calculate the attribute modifiers
    Hyp3eLogger.info("Hyp3eCharacterClass applyClassTemplate", `Updating actor attributes...`, actorData.attributes); 
    await actor.update({ "system.attributes": actorData.attributes });

    // Build the prime attributes string
    const primeAttrs = Object.entries(classTemplate.system.xpBonusReq)
      .filter(([, value]) => value !== null)
      .map(([key]) => game.i18n.localize(CONFIG.HYP3E.attributeAbbreviations[key]))
      .join(", ");
    // Do the attributes allow for a 10% XP bonus?
    let xpBonus = 0;
    for (let [k, v] of Object.entries(classTemplate.system.xpBonusReq)) {
      if (v != null) {
        if (actorData.attributes[k].value >= v) {
          // If all of the attributes are above the requirement, then XP bonus is true
          xpBonus = 10;
        } else {
          // If any of the attributes are below the requirement, then no XP bonus
          xpBonus = 0;
          break;
        }
      }
    }

    // Legacy formatted string for favoured weapons & exceptions
    const legacyProficiencies = classTemplate.system.weaponProficiencies.favoredWeapons.join("; ") + (classTemplate.system.weaponProficiencies.exceptions.length > 0 ? `; except ${classTemplate.system.weaponProficiencies.exceptions.join("; ")}` : "");

    // New structured array for favoured weapons & exceptions
    const weaponProficiencies = [];
    for (const weapon of classTemplate.system.weaponProficiencies.favoredWeapons) {
      weaponProficiencies.push({ weapon: weapon, level: 1, mastery: 0, exception: false });
    }
    for (const weapon of classTemplate.system.weaponProficiencies.exceptions) {
      weaponProficiencies.push({ weapon: weapon, level: 1, mastery: 0, exception: true });
    }

    // Now we update all the data fields are don't need to be rolled, but are set by the class template
    await actor.update({
      system: {
        hd: classTemplate.system.levelAdvancement["1"].hpRoll,
        atkRate: classTemplate.system.atkRate,
        fa: classTemplate.system.levelAdvancement["1"].fa,
        fightingAbility: {
          value: classTemplate.system.levelAdvancement["1"].fa
        },
        ca: classTemplate.system.levelAdvancement["1"].ca,
        castingAbility: {
          value: classTemplate.system.levelAdvancement["1"].ca
        },
        ta: classTemplate.system.levelAdvancement["1"].ta,
        turningAbility: {
          value: classTemplate.system.levelAdvancement["1"].ta
        },
        saves: {
          base: {
            value: classTemplate.system.saves.base,
            curr: classTemplate.system.saves.base
          },
          death: {
            value: classTemplate.system.saves.death,
            curr: classTemplate.system.saves.death
          },
          device: {
            value: classTemplate.system.saves.device,
            curr: classTemplate.system.saves.device
          },
          transformation: {
            value: classTemplate.system.saves.transformation,
            curr: classTemplate.system.saves.transformation
          },
          avoidance: {
            value: classTemplate.system.saves.avoidance,
            curr: classTemplate.system.saves.avoidance
          },
          sorcery: {
            value: classTemplate.system.saves.sorcery,
            curr: classTemplate.system.saves.sorcery
          }
        },
        spellcaster: classTemplate.system.spellcaster,
        spellList: classTemplate.system.spellLists && classTemplate.system.spellLists.length > 0 ? classTemplate.system.spellLists[0] : "",
        spellList2: classTemplate.system.spellLists && classTemplate.system.spellLists.length > 1 ? classTemplate.system.spellLists[1] : "",
        unskilled: classTemplate.system.unskilled,
        proficiencies: {
          class: legacyProficiencies,
        },
        weaponProficiencies: weaponProficiencies,
        details: {
          xp: {
            toNextLvl: classTemplate.system.levelAdvancement["2"].xp,
            primeAttr: primeAttrs,
            bonus: xpBonus
          }
        }
      }
    });

    // Delete actorData and re-clone it so we can continue updating more properties
    actorData = null;
    actorData = foundry.utils.deepClone(actor.system);
    Hyp3eLogger.info("Hyp3eCharacterClass applyClassTemplate", `Actor data after update:`, actorData);

    // Time to make one more roll, for starting HP
    const roll = new Roll(`${classTemplate.system.levelAdvancement["1"].hpRoll} + ${actorData.attributes.con.hpMod}`);
    await roll.evaluate({ evaluateSync: true });
    Hyp3eLogger.info("Hyp3eCharacterClass applyClassTemplate", `HP roll result:`, roll);
    if (roll == undefined || roll.total == undefined) {
      Hyp3eLogger.error("Hyp3eCharacterClass applyClassTemplate", `HP roll failed to evaluate properly.`);
      return false;
    }
    await actor.update({
      system: {
        hp: {
          value: roll.total,
          max: roll.total
        }
      }
    });

    // Roll starting gold & update the actor's money
    const rollFormula = classTemplate.system.startingPack.gold;
    const gpRoll = new Roll(rollFormula);
    await gpRoll.roll();
    Hyp3eLogger.info("Hyp3eCharacterClass applyClassTemplate", `Rolled ${gpRoll.total} gold for ${classTemplate.name} using formula ${rollFormula}.`);
    const gold = gpRoll.total;
    // Last update before we start adding child documents
    await actor.update({ "system.money.gp.value": gold });


    // Check to see if the Items directory has the class abilities/features that we need.
    // Alternatively, we can also check for compendia with class abilities.
    const abilities = await this.getClassAbilities({
      actor: actor,
      classTemplate: classTemplate,
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
      classTemplate: classTemplate,
      itemType: "armor",
      folderNames: ["armor", "armour", "armor & shields", "armour & shields"],
      packKey: "armour"
    });
    if (armorItems && armorItems.length > 0) {
      // Add the armor to the actor's inventory
      await actor.createEmbeddedDocuments("Item", armorItems);
    }

    // Next we do weapons...
    const weaponItems = await this.getDefaultItemsForClass({
      actor: actor,
      classTemplate: classTemplate,
      itemType: "weapon",
      folderNames: ["weapons", "melee", "missile"],
      packKey: "weapons"
    });
    if (weaponItems && weaponItems.length > 0) {
      // Add the weapons to the actor's inventory
      await actor.createEmbeddedDocuments("Item", weaponItems);
    }

    // Next we do all the equipment items...
    const generalItems = await this.getDefaultItemsForClass({
      actor: actor,
      classTemplate: classTemplate,
      itemType: "item",
      folderNames: ["equipment - general", "equipment - provisions", "equipment - religious", "gear", "equipment", "items", "weapons", "ammunition"],
      packKey: "equipment - general"
    });
    if (generalItems && generalItems.length > 0) {
      // Add the items to the actor's inventory
      await actor.createEmbeddedDocuments("Item", generalItems);
    }
    const provisionItems = await this.getDefaultItemsForClass({
      actor: actor,
      classTemplate: classTemplate,
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
      classTemplate: classTemplate,
      itemType: "item",
      folderNames: ["equipment - religious", "equipment - general", "gear", "equipment", "items"],
      packKey: "equipment - religious"
    });
    if (religiousItems && religiousItems.length > 0) {
      // Add the items to the actor's inventory
      await actor.createEmbeddedDocuments("Item", religiousItems);
    }

    // Create a Journal report of the character's starting stats, abilities, and equipment
    const journalReport = await this.createCharacterReport(actor, classTemplate);
    if (!journalReport) {
      Hyp3eLogger.error("Hyp3eCharacterClass applyClassTemplate", `Failed to create character report for ${actor.name}.`);
      return false;
    }

    // All good? Disable the quick-create button so it can't be used
    actor.setFlag(game.system.id, "disableQuickCreate", true)
    return true;
  }

  /**
   * Roll attributes for a character of the given class
   * @param {string} actor - The actor object to create the character for
   * @param {object} classTemplate - The class template object to use for rolling attributes
   * @returns {Object} - Returns an object with the rolled attributes
   */
  static async rollAttributesForClass(actor, classTemplate = null) {
    const charClass = actor.system.details.class;
    Hyp3eLogger.info("Hyp3eCharacterClass rollAttributesForClass", `Class to roll:`, charClass);
    // Get the class template
    const classData = classTemplate.system;
    if (!classData) {
      Hyp3eLogger.error("Hyp3eCharacterClass rollAttributesForClass", `Class data not found for class ${charClass}!`);
      return null;
    }
    Hyp3eLogger.info("Hyp3eCharacterClass rollAttributesForClass", `Creating character of class ${charClass}, starting with class data:`, classData);

    // Roll attributes down the line, retry until we get a set that meets the class requirements
    Hyp3eLogger.info("Hyp3eCharacterClass rollAttributesForClass", `Rolling attributes for class ${charClass}`);
    const rollFormula = game.settings.get(game.system.id, "quickCreateChars")
    let metReqs = false;
    let attributes = {};
    while (!metReqs) {
      attributes = await this._rollAttributes(actor, classData);
      if (rollFormula == "4d6dl") {   // Method III: Arrange/optimize rolls for class prime reqs
        attributes = this._optimizeAttributesForClass(classData, attributes);
      }
      metReqs = await this._checkAttrRequirements(classData, attributes);
      if (metReqs) {
        Hyp3eLogger.info("Hyp3eCharacterClass rollAttributesForClass", `Character meets class requirements for ${charClass}, attributes rolled:`, attributes);
      } else {
        Hyp3eLogger.info("Hyp3eCharacterClass rollAttributesForClass", `Character does not meet class requirements for ${charClass}, rolling again...`)
      }
    }
    // If we reach here, we have a set of attributes that meets the class requirements
    return attributes;
  }

  /**
   * 
   * @param {*} actor - The actor object to roll attributes for
   * @param {*} classData - The dataset containing class template data
   * @returns {Object} - Returns an object with the rolled attributes
   */
  static async _rollAttributes(actor, classData) {
    const rollFormula = game.settings.get(game.system.id, "quickCreateChars")
    Hyp3eLogger.info("Hyp3eCharacterClass _rollAttributes", `Rolling attributes using formula ${rollFormula}...`);
    // Just roll and return the attributes
    let attributes = {};
    if (rollFormula === "4d6dl,3d6") {
      // Special case: Roll 4d6 drop lowest for prime attributes; 3d6 for non-primes
      const primeAttrs = Object.keys(classData.attrReqs).filter( key => classData.attrReqs[key] !== null && classData.attrReqs[key] !== undefined);
      for (const attr of Object.keys(actor.system.attributes)) {
        let roll;
        if (primeAttrs.includes(attr)) {
          roll = new Roll("4d6dl1");
        } else {
          roll = new Roll("3d6");
        }
        await roll.roll();
        attributes[attr] = roll.total;
      }
      Hyp3eLogger.info("Hyp3eCharacterClass _rollAttributes", `Rolled attributes with Method VI:`, attributes);
      return attributes;
    }
    // Standard case: Roll same formula for all attributes
    for (const attr of Object.keys(actor.system.attributes)) {
      // Roll specified formula for each attribute
      let roll = new Roll(rollFormula);
      await roll.roll();
      attributes[attr] = roll.total;
    }
    Hyp3eLogger.info("Hyp3eCharacterClass _rollAttributes", `Rolled attributes:`, attributes);
    return attributes;
  }

  static _optimizeAttributesForClass(classData, attributes) {
    // const classData = this.classData[charClass] || CONFIG.HYP3E.customClassData[charClass];
    if (!classData) {
      Hyp3eLogger.error("Hyp3eCharacterClass _optimizeAttributesForClass", `Class data not found for class ${classData.realName}!`);
      return attributes;
    }
    Hyp3eLogger.info("Hyp3eCharacterClass _optimizeAttributesForClass", `Optimizing attributes for ${classData.realName} with rolls:`, attributes);
    Hyp3eLogger.info("Hyp3eCharacterClass _optimizeAttributesForClass", `${classData.realName} attribute requirements:`, classData.attrReqs);

    // Clone to avoid mutation
    const optimizedAttributes = {};

    // Rolled values in original order
    const attributeOrder = ["str", "dex", "con", "int", "wis", "cha"];
    const rolledValues = Object.values(attributes);
    Hyp3eLogger.info("Hyp3eCharacterClass _optimizeAttributesForClass", `Rolled attribute values in order:`, rolledValues);

    // Sort prime attributes by required minimum, descending
    const primeReqsSorted = Object.entries(classData.attrReqs)
      .filter(([, value]) => value !== null)
      .sort(([, a], [, b]) => b - a)
      .map(([key]) => key);

    Hyp3eLogger.info("Hyp3eCharacterClass _optimizeAttributesForClass", `${classData.realName} prime attributes:`, primeReqsSorted);

    // Take top N values for prime attributes
    const topValues = [...rolledValues]
      .sort((a, b) => b - a)
      .slice(0, Object.keys(primeReqsSorted).length);

    // Assign top values to primes
    primeReqsSorted.forEach((attr, i) => {
      optimizedAttributes[attr] = topValues[i];
    });

    // Remove used values by value, not index
    let remainingValues = [...rolledValues];
    topValues.forEach(val => {
      Hyp3eLogger.info("Hyp3eCharacterClass _optimizeAttributesForClass", `Removing value ${val}...`);
      const idx = remainingValues.indexOf(val);
      if (idx !== -1) remainingValues.splice(idx, 1);
    });
    Hyp3eLogger.info("Hyp3eCharacterClass _optimizeAttributesForClass", `${classData.realName} remaining attribute values after removing primes:`, remainingValues);

    // Assign remaining values to non-primes, in original roll order
    const nonPrimes = attributeOrder.filter(a => !primeReqsSorted.includes(a));
    nonPrimes.forEach((attr, i) => {
      optimizedAttributes[attr] = remainingValues[i];
    });
    Hyp3eLogger.info("Hyp3eCharacterClass _optimizeAttributesForClass", `${classData.realName} assigned attributes:`, optimizedAttributes);
    return optimizedAttributes;
  }

  /**
   * Determine whether all six rolled attributes meet whatever the class requirements are.
   * @param {*} classData - The system object from the class template
   * @param {*} attributes - The object set of rolled attributes
   * @returns {Boolean} - True if meets requirements, False if not
   */
  static async _checkAttrRequirements(classData, attributes) {
    // const classData = this.classData[charClass] || CONFIG.HYP3E.customClassData[charClass];
    if (!classData) {
      Hyp3eLogger.error("Hyp3eCharacterClass _checkAttrRequirements", `Class data not found for class ${classData.realName}!`);
      return false;
    }
    Hyp3eLogger.info("Hyp3eCharacterClass _checkAttrRequirements", `Checking attribute list:`, attributes);

    // Check if the character meets all attribute requirements
    for (const [attr, minValue] of Object.entries(classData.attrReqs)) {
      Hyp3eLogger.info("Hyp3eCharacterClass _checkAttrRequirements", `Checking ${attr} requirement for class ${classData.realName}: Required: ${minValue}, Rolled: ${attributes[attr]}`);
      if (attributes[attr] < minValue) {
        Hyp3eLogger.info("Hyp3eCharacterClass _checkAttrRequirements", `Character does not meet ${attr} requirement for class ${classData.realName}. Required: ${minValue}, Rolled: ${attributes[attr]}`);
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
  static async getClassAbilities({ actor, classTemplate, itemType, folderNames, abilitiesKey }) {
    const charClass = actor.system.details.class;
    const classData = classTemplate.system; // || this.classData[charClass] || CONFIG.HYP3E.customClassData[charClass];

    if (!classData) {
      Hyp3eLogger.error("Hyp3eCharacterClass getClassAbilities", `Class data not found for class ${charClass}!`);
      return [];
    }

    const abilities = classData?.[abilitiesKey];
    if (!Array.isArray(abilities) || abilities.length === 0) {
      Hyp3eLogger.info("Hyp3eCharacterClass getClassAbilities", `No starting ${itemType}(s) of type ${abilitiesKey} defined for class ${charClass}.`);
      return [];
    }

    Hyp3eLogger.info("Hyp3eCharacterClass getClassAbilities", `Getting ${itemType}s for ${charClass}:`, abilities);

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
    Hyp3eLogger.info("Hyp3eCharacterClass getClassAbilities", `Compendium list for ${itemType}:`, compendiaList.map(p => p.metadata.label));

    const results = [];

    for (const entry of abilities) {
      const abilityName = entry.name.toLowerCase();
      let newItem;

      // Search in the world Items directory for any items matching the ability name
      const matches = game.items.filter(i => i.name.toLowerCase() === abilityName);
      for (let item of matches) {
        Hyp3eLogger.info("Hyp3eCharacterClass getClassAbilities", `Possible match for ${abilityName}:`, item);
        const folder = item.folder;
        if (!folder) continue;

        const folderName = folder.name.toLowerCase();
        const parent = folder.folder;
        const parentName = parent?.name?.toLowerCase() ?? "";
        Hyp3eLogger.info("Hyp3eCharacterClass getClassAbilities", `Ability folder: ${folderName}, parent folder: ${parentName}`);
      
        // Verify parent folder and item folder match search parameters
        if (folderNames.includes(parentName) && folderName === charClass.toLowerCase()) {
          newItem = item.toObject();
          Hyp3eLogger.info("Hyp3eCharacterClass getClassAbilities", `Found ${itemType} in folder ${folder}:`, newItem);
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
            if (!entry.folder) continue;  // Doc not in a folder, skip

            // Resolve compendium folder holding this item/doc
            const folder = pack.folders.get(entry.folder);
            if (!folder) continue;

            const folderName = folder.name.toLowerCase();
            if (folderName === charClass.toLowerCase()) {
              const doc = await pack.getDocument(entry._id);
              newItem = doc.toObject();
              Hyp3eLogger.info("Hyp3eCharacterClass getClassAbilities", `Found ${itemType} in compendium ${pack.metadata.label}, folder ${folder.name}:`, newItem);
            }
            if (newItem) break;
          }
          if (newItem) break;
        }
      }

      // Fallback item
      if (!newItem) {
        Hyp3eLogger.info("Hyp3eCharacterClass getClassAbilities", `Item ${entry.name} not found. Creating fallback.`);
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
  static async getDefaultItemsForClass({ actor, classTemplate, itemType, folderNames, packKey }) {
    const charClass = actor.system.details.class;
    const classData = classTemplate.system; // || this.classData[charClass] || CONFIG.HYP3E.customClassData[charClass];

    if (!classData) {
      Hyp3eLogger.error("Hyp3eCharacterClass getDefaultItemsForClass", `Class data not found for class ${charClass}!`);
      return [];
    }

    const startingItems = classData.startingPack?.[packKey];
    if (!Array.isArray(startingItems) || startingItems.length === 0) {
      Hyp3eLogger.info("Hyp3eCharacterClass getDefaultItemsForClass", `No starting ${itemType}(s) of type ${packKey} defined for class ${charClass}.`);
      return [];
    }

    Hyp3eLogger.info("Hyp3eCharacterClass getDefaultItemsForClass", `Getting default ${itemType} for ${charClass}:`, startingItems);

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
    Hyp3eLogger.info("Hyp3eCharacterClass getDefaultItemsForClass", `Compendium list for ${itemType}:`, compendiaList.map(p => p.metadata.label));

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
          newItem.system.quantity = { value: quantity, max: quantity, bundle: newItem.system.quantity?.bundle ?? 0 };
          Hyp3eLogger.info("Hyp3eCharacterClass getDefaultItemsForClass", `Found ${itemType} in folder ${folder}:`, newItem);
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
            newItem.system.quantity = { value: quantity, max: quantity, bundle: newItem.system.quantity?.bundle ?? 0 };
            Hyp3eLogger.info("Hyp3eCharacterClass getDefaultItemsForClass", `Found ${itemType} in compendium ${pack.metadata.label}:`, newItem);
            break;
          }
        }
      }

      // Fallback item
      if (!newItem) {
        // Shields are their own item type, but arrive here as "armor"
        if (itemType === "armor" && entry.name.toLowerCase().includes("shield")) {
          itemType = "shield";
        }
        // The container item type is no longer valid
        if (itemType === "container") {
          itemType = "item";
        }
        // Set default image for new items based on type
        const TYPE_IMAGES = {
          armor: `${HYP3E.assetsPath}/breastplate_wht.svg`,
          feature: "icons/svg/target.svg",
          item: "icons/svg/item-bag.svg",
          shield: "icons/svg/shield.svg",
          spell: "icons/svg/book.svg",
          weapon: "icons/svg/combat.svg",
          classTemplate: "icons/svg/mystery-man.svg",
          effectTemplate: "icons/svg/aura.svg",
          container: "icons/svg/item-bag.svg"
        };
        const img = TYPE_IMAGES[itemType] || "icons/svg/item-bag.svg";

        Hyp3eLogger.info("Hyp3eCharacterClass getDefaultItemsForClass", `Item ${entry.name} not found. Creating fallback.`);
        newItem = {
          name: entry.name,
          type: itemType,
          img: img,
          system: {
            quantity: {
              value: quantity,
              max: quantity,
              bundle: 0
            }
          }
        };
      }

      results.push(newItem);
    }

    return results;
  }

  /**
   * Check the character's XP and level-up if possible
   * @param {*} dataset
   */
  static async levelUp(dataset) {
    const actor = game.actors.get(dataset.actorId)
    if (!actor) {
      Hyp3eLogger.error("Hyp3eCharacterClass levelUp", `Actor not found for id ${dataset.actorId}`);
      return false;
    }
    // Log the dataset before the dialog renders
    Hyp3eLogger.info("Hyp3eCharacterClass levelUp", `${actor.name} dataset: `, dataset);

    // Get the class & level data
    // let thisClass = this.classData[actor.system.details.class] || CONFIG.HYP3E.customClassData[actor.system.details.class];
    const classTemplate = await getClassTemplate(actor.system.details.class);
    Hyp3eLogger.info("Hyp3eCharacterClass levelUp", `Class template:`, classTemplate);
    const thisClass = classTemplate.system;

    // Get current level, defaulting to 1 if not set
    const currLevel = actor.system.details.level.value ? parseInt(actor.system.details.level.value) : 1

    // Is the character already level 12? Then exit...
    if (currLevel >= 12) {
      ui.notifications.warn("Characters cannot be auto-leveled beyond 12.");
      return false;
    }

    // Display the confirmation dialog, and exit if the user cancels this action
    try {
      const rollResponse = await Hyp3eDialog.ShowLevelUpDialog(dataset)
    } catch(err) {
      Hyp3eLogger.info("Hyp3eCharacterClass levelUp", `Dialog canceled.`, err);
      return false;
    }

    // Initialize character data
    const data = foundry.utils.deepClone(actor.system)

    const nextLevel = currLevel + 1
    const requiredXp = thisClass.levelAdvancement[nextLevel].xp
    const nextLevelXp = (nextLevel <= 11) ? thisClass.levelAdvancement[nextLevel+1].xp : thisClass.levelAdvancement[12].xp

    // Do we have enough XP to level up?
    const currentXp = parseInt((data.details.xp.value).replace(/,|\./g, ""))
    if (currentXp < requiredXp) {
      ui.notifications.warn(`Not enough XP to level up! ${currentXp} < ${requiredXp}`)
      Hyp3eLogger.info("Hyp3eCharacterClass levelUp", `Not enough XP to level up! ${currentXp} < ${requiredXp}`)
      return false
    }

    // Yes, we can level up
    Hyp3eLogger.info("Hyp3eCharacterClass levelUp", `Leveling up ${actor.name} to level ${nextLevel}...`)
    // Update the actor's level and next-level XP
    data.details.level.value = nextLevel
    data.details.xp.toNextLvl = nextLevelXp
    // Increase current & max hit points
    let hpIncrease = 0
    const hpRoll = thisClass.levelAdvancement[nextLevel].hpRoll
    const roll = new Roll(`${hpRoll} + ${data.attributes.con.hpMod}`);
    await roll.roll();
    Hyp3eLogger.info("Hyp3eCharacterClass levelUp", `HP roll result:`, roll);
    if (roll != undefined && roll.total != undefined) {
      hpIncrease = roll.total;
      data.hp.value = parseInt(data.hp.value) + hpIncrease
      data.hp.max = parseInt(data.hp.max) + hpIncrease
    } else {
      Hyp3eLogger.error("Hyp3eCharacterClass levelUp", `HP roll failed!`)
    }
    // Update fighting ability, casting ability, and turning ability
    data.fightingAbility.value = thisClass.levelAdvancement[nextLevel].fa
    if (thisClass.levelAdvancement[nextLevel].ca) { data.castingAbility.value = thisClass.levelAdvancement[nextLevel].ca }
    if (thisClass.levelAdvancement[nextLevel].ta) { data.turningAbility.value = thisClass.levelAdvancement[nextLevel].ta }

    // Update saving throws, if needed
    const currentSave = this._valueFromTable(this.savingThrows, currLevel)
    const newSave = this._valueFromTable(this.savingThrows, nextLevel)
    if (newSave < currentSave) {
      // It's as easy as subtracting 1 from each save...
      data.saves.base.value -= 1
      data.saves.death.value -= 1
      data.saves.device.value -= 1
      data.saves.transformation.value -= 1
      data.saves.avoidance.value -= 1
      data.saves.sorcery.value -= 1
    }

    // Use the modified data clone to create a clean update object for the character
    const updateData = {
      system: {
        hd: data.hd,
        hp: {
          value: data.hp.value,
          max: data.hp.max,
        },
        fightingAbility: { value: data.fightingAbility.value },
        castingAbility: { value: data.castingAbility.value },
        turningAbility: { value: data.turningAbility.value },
        saves: {
          base: {
            value: data.saves.base.value
          },
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
      Hyp3eLogger.info("Hyp3eCharacterClass levelUp", `Updated level data:`, updateData);
      if (actor.validate(updateData)) {
        Hyp3eLogger.info("Hyp3eCharacterClass levelUp", `Validation OK, executing update...`);
        // Update the main actor data
        await actor.update(updateData)
        // Log the actor data after updating
        Hyp3eLogger.info("Hyp3eCharacterClass levelUp", `Actor after update:`, actor);
        // Recalculate attack rates for a fighter's weapons if the setting is enabled
        if (CONFIG.HYP3E.autoCalcAttackRates) {
          if (actor.system?.baseClass === "fighter") {
            for (const weapon of actor.items.filter(i => i.type === "weapon")) {
              await weapon.calcAndUpdateAttackRate();
            }
          }
        }
      }
    } catch(err) {
      Hyp3eLogger.error("Hyp3eCharacterClass levelUp", `Actor update error:`, err)
    }

    // Setup a chat message to show the level-up values
    const label = `<div><b>Level Up!</b></div>`
    let content = `<ul>`
    content += `<li>New Level: ${nextLevel}</li>`
    content += `<li>XP: ${currentXp} / ${nextLevelXp}</li>`
    content += `<li>Hit Point Increase: ${hpIncrease} (${data.hp.value} HP / ${data.hp.max} max)</li>`
    content += `<li>Fighting Ability: ${data.fightingAbility.value}</li>`
    if (data.castingAbility.value) { content += `<li>Casting Ability: ${data.castingAbility.value}</li>` }
    if (data.turningAbility.value) { content += `<li>Turning Ability: ${data.turningAbility.value}</li>` }
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
   * Write the character data to a new Journal Entry, and display a confirmation chat message
   * @param {*} actor 
   * @param {*} classTemplate 
   * @returns 
   */
  static async createCharacterReport(actor, classTemplate) {
    if (!actor) {
      Hyp3eLogger.error("Hyp3eCharacterClass createCharacterReport", `Actor not supplied!`);
      return false;
    }
    // Log the dataset before the dialog renders
    Hyp3eLogger.info("Hyp3eCharacterClass createCharacterReport", `${actor.name}: `, actor);

    // Initialize some vars
    const actorData = foundry.utils.deepClone(actor.system);
    const thisClass = classTemplate.system;

    // Combine spell lists into a single string for display
    let spellLists = actorData.spellList;
    if (actorData.spellList2 && actorData.spellList2 != "") {
      spellLists += `, ${actorData.spellList2}`;
    }

    // Combine the favoured weapons and exceptions into simple name-only arrays
    const favouredWeapons = actorData.weaponProficiencies
      .filter(w => !w.exception)
      .map(w => w.weapon);
    const exceptions = actorData.weaponProficiencies
      .filter(w => w.exception)
      .map(w => w.weapon);
    const favouredWeaponsString = favouredWeapons.join("; ") + (exceptions.length > 0 ? "; Except " + exceptions.join("; ") : "")

    // Setup journal report content
    let journalContent = `
          <h2>Character ${actor.name} (${actorData.details.class})</h2>
          <ul>
            <li>Hit Die: ${actorData.hd}</li>
            <li>Hit Points: ${actorData.hp.value}</li>
            <li>Fighting Ability: ${actorData.fa}</li>
            <li>Casting Ability: ${actorData.ca}</li>
            <li>Spellcaster: ${actorData.spellcaster}</li>
            <li>Spell List(s): ${spellLists}</li>
            <li>Turning Ability: ${actorData.ta}</li>
            <li>Unskilled Weapon Penalty: ${actorData.unskilled}</li>
            <li>Favoured Weapons: ${favouredWeaponsString}</li>
            <li>Saving Throws vs:</li>
            <ul>
              <li>Death: ${actorData.saves.death.value}</li>
              <li>Device: ${actorData.saves.device.value}</li>
              <li>Transformation: ${actorData.saves.transformation.value}</li>
              <li>Avoidance: ${actorData.saves.avoidance.value}</li>
              <li>Sorcery: ${actorData.saves.sorcery.value}</li>
            </ul>
            <li>Strength (ST): ${actorData.attributes.str.value}</li>
            <ul>
              <li>Melee Attack Mod: ${actorData.attributes.str.atkMod}</li>
              <li>Damage Mod: ${actorData.attributes.str.dmgMod}</li>
              <li>Test of ST: ${actorData.attributes.str.test}</li>
              <li>Feat of ST: ${actorData.attributes.str.feat}</li>
            </ul>
            <li>Dexterity (DX): ${actorData.attributes.dex.value}</li><ul>
              <li>Missile Attack Mod: ${actorData.attributes.dex.atkMod}</li>
              <li>Defence Mod: ${actorData.attributes.dex.defMod}</li>
              <li>Test of DX: ${actorData.attributes.dex.test}</li>
              <li>Feat of DX: ${actorData.attributes.dex.feat}</li>
            </ul>
            <li>Constitution (CN): ${actorData.attributes.con.value}</li>
            <ul>
              <li>Hit Point Mod: ${actorData.attributes.con.hpMod}</li>
              <li>Poison/Radiation Mod: ${actorData.attributes.con.poisRadMod}</li>
              <li>Trauma Survive %: ${actorData.attributes.con.traumaSurvive}</li>
              <li>Test of CN: ${actorData.attributes.con.test}</li>
              <li>Feat of CN: ${actorData.attributes.con.feat}</li>
            </ul>
            <li>Intelligence (IN): ${actorData.attributes.int.value}</li>
            <ul>
              <li>Languages: ${actorData.attributes.int.languages}</li>
              <li>Level 1 Bonus Spell: ${actorData.attributes.int.bonusSpells.lvl1}</li>
              <li>Level 2 Bonus Spell: ${actorData.attributes.int.bonusSpells.lvl2}</li>
              <li>Level 3 Bonus Spell: ${actorData.attributes.int.bonusSpells.lvl3}</li>
              <li>Level 4 Bonus Spell: ${actorData.attributes.int.bonusSpells.lvl4}</li>
              <li>% Chance to Learn Spell: ${actorData.attributes.int.learnSpell}</li>
            </ul>
            <li>Wisdom (WS): ${actorData.attributes.wis.value}</li>
            <ul>
              <li>Will Mod: ${actorData.attributes.wis.willMod}</li>
              <li>Level 1 Bonus Spell: ${actorData.attributes.wis.bonusSpells.lvl1}</li>
              <li>Level 2 Bonus Spell: ${actorData.attributes.wis.bonusSpells.lvl2}</li>
              <li>Level 3 Bonus Spell: ${actorData.attributes.wis.bonusSpells.lvl3}</li>
              <li>Level 4 Bonus Spell: ${actorData.attributes.wis.bonusSpells.lvl4}</li>
              <li>% Chance to Learn Spell: ${actorData.attributes.wis.learnSpell}</li>
            </ul>
            <li>Charisma (CH): ${actorData.attributes.cha.value}</li>
            <ul>
              <li>Reaction Mod: ${actorData.attributes.cha.reaction}</li>
              <li>Max Henchmen: ${actorData.attributes.cha.maxHenchmen}</li>
              <li>Turn Undead Mod: ${actorData.attributes.cha.turnUndead}</li>
            </ul>
            <li>Prime Attribute(s): ${actorData.details.xp.primeAttr}</li>
            <li>XP Bonus: ${actorData.details.xp.bonus}</li>
            <li>XP to Next Level: ${actorData.details.xp.toNextLvl}</li>
          </ul>`

    // Find or create a JournalEntry for character reports
    let je = game.journal.getName("Character Reports");
    if (!je) {
      const data = {
        name: `Character Reports`,
        ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED }
      };
      je = await JournalEntry.create(data);
    }
    // Create a new JournalEntryPage for the character report
    const [page] = await je.createEmbeddedDocuments("JournalEntryPage", [
      {
        name: actor.name,
        type: "text",
        text: {
          content: journalContent,
        },
        sort: 0
      }
    ]);

    // Pop open the JournalEntry to show the new page
    je.sheet.render(true, { pageId: page.id });

    // Send a chat message to the user
    const chatMsg = `<p>Character <b>${actor.name}</b> (${actorData.details.class}) generated! See the Journal for details.</p>`
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: chatMsg
    });
    return true;
  }
}