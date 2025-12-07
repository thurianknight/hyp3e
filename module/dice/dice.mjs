import { Hyp3eLogger } from "../helpers/logger.mjs"

export class Hyp3eDice {
  /**
   * Construct attack roll from relevant parts, return roll formula
   * @param {Object} rollData 
   * @param {Object} itemData
   * @param {Object} actorData
   */
  static buildAttackFormula(rollData, itemData, ammoData = null, actorData = null) {
    let atkRollParts = []
    let masteryMod = 0
    let debugAtkRollParts = []
    let debugAtkRollFormula = ""

    // Check if the weapon attack has Master or Grandmaster flags set
    if (itemData.wpnGrandmaster) {
        masteryMod = 2
    } else if (itemData.wpnMaster) {
        masteryMod = 1
    }

    // All items start with their basic attack formula.
    //   For weapons, this includes the item attack mod, FA, and ST or DX mod.
    //     There may also be an item mod for magic ammunition.
    //   For spells with attack rolls, it might include FA, and ST or DX mods.
    //   For grenade-like items, it only includes the DX mod.
    let tmpAtkRollParts = rollData.roll.split("+")
    atkRollParts = tmpAtkRollParts.map(str => str.trim())
    Hyp3eLogger.info("buildAttackFormula", "Base attack roll parts:", atkRollParts);

    // If the formula includes a fixed number like +1, integrate that into the base roll.
    //   This is a bit of a hack, but it works.
    if (atkRollParts.length > 1) {
        // Regex to match +1, -1, +2, -2, etc.
        const reNum = /[\+|\-]*\s*\d/
        // Loop through the array and find a match if it exists
        atkRollParts.forEach((part, index) => {
            // Skip the first element, that should always be "1d20"
            if (index == 0) { return }
            if (part.match(reNum)) {
                Hyp3eLogger.info("buildAttackFormula", "Found a fixed number in the formula: ", part);
                // If we find a match, remove it from the array
                atkRollParts.splice(index, 1)
                // Add it to the first element in the array
                let baseRoll = atkRollParts[0]
                atkRollParts[0] = `${baseRoll} + ${part}`
            }
        })
    }
    // Start setting up the debug attack roll table & array
    debugAtkRollFormula = "<b>Attack formula elements:</b><table class='chat-table'>"
    debugAtkRollParts = [...atkRollParts]
    // Take the first element in the debug array and wrap it in the table html
    debugAtkRollParts[0] = `<tr><td>${debugAtkRollParts[0]}</td><td>${atkRollParts[0]}</td></tr>`
    Hyp3eLogger.info("buildAttackFormula", "Debug attack roll parts:", debugAtkRollParts);

    // Strip '@item.atkMod' out since we add it automatically anyway...
    //   Ideally this won't ever happen, but some items might have it in their formula.
    if (atkRollParts.includes("@item.atkMod")) {
        Hyp3eLogger.info("buildAttackFormula", `${rollData.itemName} still has @itemData.atkMod in its formula!`);
        atkRollParts = atkRollParts.filter(part => (part != "@item.atkMod"))
        debugAtkRollParts = debugAtkRollParts.filter(part => (part != "@item.atkMod"))
    }

    // Apply the item attack mod if needed
    if (itemData.atkMod && parseInt(itemData.atkMod) != 0) {
        if (atkRollParts.length > 1) {
            atkRollParts.splice(1, 0, itemData.atkMod)
            debugAtkRollParts.splice(1, 0, `<tr><td>Item Atk Mod</td><td>${itemData.atkMod}</td></tr>`)
        } else {
            atkRollParts.push(itemData.atkMod)
            debugAtkRollParts.push(`<tr><td>Item Atk Mod</td><td>${itemData.atkMod}</td></tr>`)
        }
    }

    // Apply the ammunition attack mod if needed
    if (ammoData?.atkMod) {
        if (atkRollParts.length > 1) {
            atkRollParts.splice(2, 0, ammoData.atkMod)
            debugAtkRollParts.splice(2, 0, `<tr><td>Ammo Atk Mod</td><td>${ammoData.atkMod}</td></tr>`)
        } else {
            atkRollParts.push(ammoData.atkMod)
            debugAtkRollParts.push(`<tr><td>Ammo Atk Mod</td><td>${ammoData.atkMod}</td></tr>`)
        }
    }

    // For weapons, the formulas are pretty standard.
    if (itemData.itemType == "weapon") {
        // Remove Fighting Ability, we will re-add it later if this isn't a grenade
        atkRollParts = atkRollParts.filter(part => (part != "@fa"))
        debugAtkRollParts = debugAtkRollParts.filter(part => (part != "@fa"))

        // Grenade-like items only use the character's DX attack mod
        if (itemData.isGrenade) {
            if (actorData?.actorType == "character") {
                // if @dex.atkMod exists, remove it first
                atkRollParts = atkRollParts.filter(part => (part != "@dex.atkMod"))
                debugAtkRollParts = debugAtkRollParts.filter(part => (part != "@dex.atkMod"))
                // By removing and re-adding, we ensure the parts are in the order we want
                atkRollParts.push(actorData.dex.atkMod)
                debugAtkRollParts.push(`<tr><td>DX Atk Mod</td><td>${actorData.dex.atkMod}</td></tr>`)
            }
        } else {
            // Most weapons fall into this section...

            // Add Fighting Ability, even if it's zero
            atkRollParts.push(actorData.fa)
            debugAtkRollParts.push(`<tr><td>Fighting Ability</td><td>${actorData.fa}</td></tr>`)

            // Characters add ST or DX mods based on what the formula already has in it.
            //   We do this because some people may have custom formulas that don't 
            //   use ST or DX mods, or use them in non-standard ways.
            //   For example, they might have a Rapier that uses dex.atkMod instead 
            //   of str.atkMod.
            if (atkRollParts.includes("@str.atkMod")) {
                // Remove @str.atkMod first
                atkRollParts = atkRollParts.filter(part => (part != "@str.atkMod"))
                debugAtkRollParts = debugAtkRollParts.filter(part => (part != "@str.atkMod"))
                // By removing and re-adding, we ensure the parts are in the order we want
                if (actorData?.actorType == "character") {
                    atkRollParts.push(actorData.str.atkMod)
                    debugAtkRollParts.push(`<tr><td>ST Atk Mod</td><td>${actorData.str.atkMod}</td></tr>`)
                }
            }
            if (atkRollParts.includes("@dex.atkMod")) {
                // Remove @dex.atkMod first
                atkRollParts = atkRollParts.filter(part => (part != "@dex.atkMod"))
                debugAtkRollParts = debugAtkRollParts.filter(part => (part != "@dex.atkMod"))
                // By removing and re-adding, we ensure the parts are in the order we want
                if (actorData?.actorType == "character") {
                    atkRollParts.push(actorData.dex.atkMod)
                    debugAtkRollParts.push(`<tr><td>DX Atk Mod</td><td>${actorData.dex.atkMod}</td></tr>`)
                }
            }
        }

    } else if (itemData.itemType == "spell") {
        // Spell attack formulas are so bespoke, we need to handle each variable separately
        if (atkRollParts.includes("@ca")) {
            atkRollParts[atkRollParts.indexOf("@ca")] = actorData.ca
            debugAtkRollParts[debugAtkRollParts.indexOf("@ca")] = `<tr><td>Casting Ability</td><td>${actorData.ca}</td></tr>`
        }
        if (atkRollParts.includes("@fa")) {
            atkRollParts[atkRollParts.indexOf("@fa")] = actorData.fa
            debugAtkRollParts[debugAtkRollParts.indexOf("@fa")] = `<tr><td>Fighting Ability</td><td>${actorData.fa}</td></tr>`
        }
        if (atkRollParts.includes("@str.atkMod")) {
            atkRollParts[atkRollParts.indexOf("@str.atkMod")] = actorData.str?.atkMod ? actorData.str?.atkMod : 0
            debugAtkRollParts[debugAtkRollParts.indexOf("@str.atkMod")] = actorData.str?.atkMod ? `<tr><td>ST Atk Mod</td><td>${actorData.str.atkMod}</td></tr>` : `<tr><td>ST Atk Mod</td><td>0</td></tr>`
        }
        if (atkRollParts.includes("@dex.atkMod")) {
            atkRollParts[atkRollParts.indexOf("@dex.atkMod")] = actorData.dex?.atkMod ? actorData.dex?.atkMod : 0
            debugAtkRollParts[debugAtkRollParts.indexOf("@dex.atkMod")] = actorData.dex?.atkMod ? `<tr><td>DX Atk Mod</td><td>${actorData.dex.atkMod}</td></tr>` : `<tr><td>DX Atk Mod</td><td>0</td></tr>`
        }
    }

    // Add Weapon Mastery mod if applicable
    if (masteryMod > 0) {
        // Is the actor using a bow or crossbow, and is the target at point-blank range?
        let pointBlank = ""
        if (rollData.itemName.toLowerCase().includes("crossbow")) {
            if (rollData.gridDistance >= 6 && rollData.gridDistance <= 50) {
                masteryMod += 1
                pointBlank = " + point blank"
            }
        } else if (rollData.itemName.toLowerCase().includes("bow")) {
            if (rollData.gridDistance >= 6 && rollData.gridDistance <= 30) {
                masteryMod += 1
                pointBlank = " + point blank"
            }
        }
        // Apply the weapon mastery/grandmastery mod
        atkRollParts.push(masteryMod)
        debugAtkRollParts.push(`<tr><td>Mastery Mod${pointBlank}</td><td>${masteryMod}</td></tr>`)
    }

    // Add situational modifier from the roll dialog
    if (rollData?.sitMod && parseInt(rollData.sitMod) != 0) {
        atkRollParts.push(rollData.sitMod)
        debugAtkRollParts.push(`<tr><td>Sit Mod</td><td>${rollData.sitMod}</td></tr>`)
    }

    // Add range modifier from the roll dialog, if needed
    if (rollData?.rangeMod) {
        atkRollParts.push(rollData.rangeMod)
        debugAtkRollParts.push(`<tr><td>Range Mod</td><td>${rollData.rangeMod}</td></tr>`)
    }

    // Log the attack roll parts & the constructed formula
    Hyp3eLogger.info("buildAttackFormula", "Attack roll parts:", atkRollParts);
    Hyp3eLogger.info("buildAttackFormula", "Debug attack roll parts:", debugAtkRollParts);
    debugAtkRollFormula += debugAtkRollParts.join("") + "</table>"

    // Construct the attack roll formula from parts, and return an object with the formula and debug formula
    const atkRollFormula = atkRollParts.join(" + ")
    const atkObj = {
        formula: atkRollFormula,
        debugFormula: debugAtkRollFormula
    }
    return atkObj
  }

  /**
   * Construct damage roll from relevant parts, return roll formula
   * @param {Object} itemData
   * @param {Object} ammoData
   * @param {Object} actorData
   */
  static buildDamageFormula(itemData, ammoData = null, actorData = null) {
    let dmgRollParts = []
    let debugDmgRollParts = []
    Hyp3eLogger.info("buildDamageFormula", `Item damage type: ${itemData?.dmgType}`);
    Hyp3eLogger.info("buildDamageFormula", `Actor data:`, actorData);

    const baseDmgType = itemData?.dmgType ? CONFIG.HYP3E.damageTypes[itemData.dmgType] : "Basic"
    const altDmgTypes =  Object.keys(itemData?.altDmg).length ? itemData?.altDmg : {};
    Hyp3eLogger.info("buildDamageFormula", `Alternate damage types:`, altDmgTypes);
    // I may regret this, but I'm going to assume we will never have more than 2 damage fields 
    //  and hard-code it into this function.
    let dmgRoll2Parts = []
    let debugDmgRoll2Parts = []

    // All items start with the base damage formula
    dmgRollParts.push(itemData.damage)

    // Add the debug message header and first table row
    debugDmgRollParts.push(`<b>Damage formula elements:</b><table class="chat-table">`)
    debugDmgRollParts.push(`<tr><td>${baseDmgType} Dmg</td><td>${itemData.damage}</td></tr>`)

    // Do we have 2-handed damage?
    if (itemData.damage2h) {
        dmgRoll2Parts.push(itemData.damage2h)
        debugDmgRoll2Parts.push(`<b>Damage formula elements:</b><table class="chat-table">`)
        debugDmgRoll2Parts.push(`<tr><td>${baseDmgType} Dmg</td><td>${itemData.damage2h}</td></tr>`)
    }

    // Reformat the item damage string for commonly-used variables
    // ST Dmg Mod
    const strDmgModRegex = /\+\s*@str.dmgMod/g
    if (debugDmgRollParts[1].match(strDmgModRegex) > "") {
        if (actorData?.actorType == "character") {
            dmgRollParts[0] = dmgRollParts[0].replace(strDmgModRegex, `+ ${actorData.str.dmgMod}`)
            debugDmgRollParts[1] = debugDmgRollParts[1].replace(strDmgModRegex, "")
            debugDmgRollParts.push(`<tr><td>ST Dmg Mod</td><td>${actorData.str.dmgMod}</td></tr>`)
        } else {
            // NPCs/monsters don't have a ST attribute, so blank out that variable
            dmgRollParts[0] = dmgRollParts[0].replace(strDmgModRegex, "")
            debugDmgRollParts[1] = debugDmgRollParts[1].replace(strDmgModRegex, "")
            debugDmgRollParts.push(`<tr><td>ST Dmg Mod</td><td>0</td></tr>`)
        }
    }
    if (itemData.damage2h) {
        if (debugDmgRoll2Parts[1].match(strDmgModRegex) > "") {
            if (actorData?.actorType == "character") {
                dmgRoll2Parts[0] = dmgRoll2Parts[0].replace(strDmgModRegex, `+ ${actorData.str.dmgMod}`)
                debugDmgRoll2Parts[1] = debugDmgRoll2Parts[1].replace(strDmgModRegex, "")
                debugDmgRoll2Parts.push(`<tr><td>ST Dmg Mod</td><td>${actorData.str.dmgMod}</td></tr>`)
            } else {
                // NPCs/monsters don't have a ST attribute, so blank out that variable
                dmgRollParts[0] = dmgRollParts[0].replace(strDmgModRegex, "")
                debugDmgRollParts[1] = debugDmgRollParts[1].replace(strDmgModRegex, "")
                debugDmgRollParts.push(`<tr><td>ST Dmg Mod</td><td>0</td></tr>`)
            }
        }
    }
    // Casting Ability
    const caRegex = /\+\s*@ca/g
    if (debugDmgRollParts[1].match(caRegex) > "") {
        // This is where we override the actor's CA if the spell is being cast from an item

        // Temp fix if CA is null
        if (actorData.ca == null) actorData.ca = 0
        dmgRollParts[0] = dmgRollParts[0].replace(caRegex, `+ ${actorData.ca}`)
        debugDmgRollParts[1] = debugDmgRollParts[1].replace(caRegex, "")
        debugDmgRollParts.push(`<tr><td>Casting Ability</td><td>${actorData.ca}</td></tr>`)
    }
    if (itemData.damage2h) {
        if (debugDmgRoll2Parts[1].match(caRegex) > "") {
            dmgRoll2Parts[0] = dmgRoll2Parts[0].replace(caRegex, `+ ${actorData.ca}`)
            debugDmgRoll2Parts[1] = debugDmgRoll2Parts[1].replace(caRegex, "")
            debugDmgRoll2Parts.push(`<tr><td>Casting Ability</td><td>${actorData.ca}</td></tr>`)
        }
    }

    // Apply the item damage mod if needed
    if (itemData?.dmgMod && parseInt(itemData.dmgMod) != 0) {
        dmgRollParts.push(itemData.dmgMod)
        debugDmgRollParts.push(`<tr><td>Item Dmg Mod</td><td>${itemData.dmgMod}</td></tr>`)
        if (itemData.damage2h) {
            dmgRoll2Parts.push(itemData.dmgMod)
            debugDmgRoll2Parts.push(`<tr><td>Item Dmg Mod</td><td>${itemData.dmgMod}</td></tr>`)
        }
    }

    // Apply the ammunition damage mod if needed
    if (ammoData?.dmgMod && parseInt(ammoData.dmgMod) != 0) {
        dmgRollParts.push(ammoData.dmgMod)
        debugDmgRollParts.push(`<tr><td>Ammo Dmg Mod</td><td>${ammoData.dmgMod}</td></tr>`)
        if (itemData.damage2h) {
            dmgRoll2Parts.push(ammoData.dmgMod)
            debugDmgRoll2Parts.push(`<tr><td>Ammo Dmg Mod</td><td>${ammoData.dmgMod}</td></tr>`)
        }
    }

    // Apply the character's (not npc's) ST damage mod if the item is a melee weapon
    if (itemData.melee) {
        if (actorData?.actorType == "character") {
            dmgRollParts.push(actorData.str.dmgMod)
            debugDmgRollParts.push(`<tr><td>ST Dmg Mod</td><td>${actorData.str.dmgMod}</td></tr>`)
            if (itemData.damage2h) {
                dmgRoll2Parts.push(actorData.str.dmgMod)
                debugDmgRoll2Parts.push(`<tr><td>ST Dmg Mod</td><td>${actorData.str.dmgMod}</td></tr>`)
            }
        } else {
            // NPCs/monsters don't have a ST attribute, so nothing to do here except 
            //  note it in a comment. :-)
        }
    }
    // Apply the character's ST damage mod if the item has the "strDmgAdj" annotation (missile weapons)
    if (itemData.missile && Array.isArray(itemData.annotations) && 
      (itemData.annotations?.includes("hurled") || itemData.annotations?.includes("strDmgAdj"))) {
        const baseFormula = itemData.damage || "";
        const hasStrVar = baseFormula.includes("@str.dmgMod");

        if (!hasStrVar) {
            if (actorData?.actorType === "character") {
                dmgRollParts.push(actorData.str.dmgMod);
                debugDmgRollParts.push(`<tr><td>ST Dmg Mod (annotation)</td><td>${actorData.str.dmgMod}</td></tr>`);
                if (itemData.damage2h) {
                    dmgRoll2Parts.push(actorData.str.dmgMod);
                    debugDmgRoll2Parts.push(`<tr><td>ST Dmg Mod (annotation)</td><td>${actorData.str.dmgMod}</td></tr>`);
                }
            } else {
                // NPCs/monsters don't have a ST attribute, so nothing to do here except 
                //  note it in a comment. :-)
            }
        }
    }

    // Check if the weapon attack has Master or Grandmaster flags set
    let masteryMod = 0
    if (itemData.wpnGrandmaster) {
        masteryMod = 2
    } else if (itemData.wpnMaster) {
        masteryMod = 1
    }        
    // Add Weapon Mastery mod, if applicable
    if (masteryMod > 0) {
        dmgRollParts.push(masteryMod)
        debugDmgRollParts.push(`<tr><td>Mastery Mod</td><td>${masteryMod}</td></tr>`)
        if (itemData.damage2h) {
            dmgRoll2Parts.push(masteryMod)
            debugDmgRoll2Parts.push(`<tr><td>Mastery Mod</td><td>${masteryMod}</td></tr>`)
        }
    }

    // Does the actor have a temporary damage mod applied?
    if (actorData?.tempDmgMod && parseInt(actorData.tempDmgMod) != 0) {
        dmgRollParts.push(actorData.tempDmgMod)
        debugDmgRollParts.push(`<tr><td>Effect Mod</td><td>${actorData.tempDmgMod}</td></tr>`)
        if (itemData.damage2h) {
            dmgRoll2Parts.push(actorData.tempDmgMod)
            debugDmgRoll2Parts.push(`<tr><td>Effect Mod</td><td>${actorData.tempDmgMod}</td></tr>`)
        }
    }

    // Do we have any alternate damage types?
    if (Object.keys(altDmgTypes).length > 0) {
        for (let [k, v] of Object.entries(altDmgTypes)) {
            dmgRollParts.push(v)
            const dmgType = `${CONFIG.HYP3E.damageTypes[k]} Dmg`
            debugDmgRollParts.push(`<tr><td>${dmgType}</td><td>${v}</td></tr>`)
            if (itemData.damage2h) {
                dmgRoll2Parts.push(v)
                debugDmgRoll2Parts.push(`<tr><td>${dmgType}</td><td>${v}</td></tr>`)
            }
        }
    }

    // Finish the debug damage roll table
    debugDmgRollParts.push(`</table>`)
    if (itemData.damage2h) { debugDmgRoll2Parts.push(`</table>`) }

    // Log the damage roll parts & the constructed formula
    Hyp3eLogger.info("buildDamageFormula", "Damage roll parts:", dmgRollParts);
    Hyp3eLogger.info("buildDamageFormula", "Debug damage parts:", debugDmgRollParts);
    Hyp3eLogger.info("buildDamageFormula", "Damage 2H roll parts:", dmgRoll2Parts);
    Hyp3eLogger.info("buildDamageFormula", "Debug damage 2H parts:", debugDmgRoll2Parts);

    // Construct the damage roll formula from parts, and return an object with the formula and debug formula
    const dmgObj = {
        formula: dmgRollParts.join(" + "),
        debugFormula: debugDmgRollParts.join(""),
        formula2h: dmgRoll2Parts.join(" + "),
        debugFormula2h: debugDmgRoll2Parts.join("")
    }
    return dmgObj
  }

  /**
   * Roll a formula, resolve it using provided roll data, and check if it succeeds.
   * @param {string} formula - The roll formula string (e.g., "1d20 + @str.atkMod").
   * @param {object} rollData - Actor or item roll data context.
   * @param {number} target - The target number to compare against.
   * @param {string} [comparison="le"] - Comparison type: "le" (≤) or "ge" (≥).
   * @returns {Promise<object>} An object containing: roll, total, success (boolean).
   */
  static async rollFormulaAndEvaluateSuccess(formula, rollData, target, comparison = "ge") {
    if (!formula || typeof parseInt(target) !== "number") {
        const msg = `Missing formula or target number.`;
        Hyp3eLogger.error("rollFormulaAndEvaluateSuccess", `${msg} Incoming formula & target:`, {formula, target});
        ui.notifications.error(msg);
        return { roll: null, total: null, success: false };
    }

    let roll = new Roll(formula, rollData);
    try {
        await roll.roll();
    } catch (error) {
        const msg = `Error evaluating roll formula.`;
        Hyp3eLogger.error("rollFormulaAndEvaluateSuccess", msg, error);
        ui.notifications.error(msg);
        return { roll: null, total: null, success: false };
    }

    const total = roll.total;

    const success = (comparison === "ge")
        ? total >= target   // if comparison is "ge"
        : total <= target;  // otherwise (le or default)

    Hyp3eLogger.info("rollFormulaAndEvaluateSuccess", `${roll.formula} = ${total} vs. ${comparison} ${target}: ${success ? "Success" : "Failure"}`);

    return { roll, total, success };
  }

  /**
   * Resolves a formula with dice asynchronously, allowing @variables and Math functions.
   *  Example: "1d6 + Math.ceil(@con/4)"
   *   - @variable.path lookups
   *   - Dice expressions (e.g. 2d8+3)
   *   - Math expressions (Math.ceil, Math.floor, etc.)
   * Note: This is only needed when supporting Math.* functions. The Foundry Roll.evaluate() method 
   *  can handle any standard roll formula like "1d20 + @str.atkMod".
   * @param {string} formula - Formula string to be resolved
   * @param {object} rollData - Actor system data for @variable resolution
   * @returns {number|null}
   */
  // static async resolveFormulaWithDice(formula, rollData = {}) {
  //   if (!formula || typeof formula !== "string") return null;

  //   // Find & replace rollData @variables
  //   let expanded = formula.replace(/@([A-Za-z0-9.]+)/g, (_, key) => {
  //     return foundry.utils.getProperty(rollData, key) ?? 0;
  //   });

  //   // Find & replace dice expressions with rolled totals
  //   const diceRegex = /\b(\d*d\d+(?:[+-]\d+)*)\b/g;
  //   const matches = [...expanded.matchAll(diceRegex)];
  //   for (const match of matches) {
  //     try {
  //       const roll = new Roll(match[1], dataSource).evaluateSync();
  //       expanded = expanded.replace(match[0], roll.total);
  //     } catch (err) {
  //       Hyp3eLogger.warn("Hyp3eDice resolveFormulaWithDice", `Invalid dice expression "${match[1]}"`, err);
  //     }
  //   }

  //   // Evaluate any remaining math functions
  //   try {
  //     // eslint-disable-next-line no-new-func
  //     const fn = new Function("Math", `return (${expanded});`);
  //     const result = fn(Math);
  //     // Final sanity check to ensure we return a number
  //     return (typeof result === "number" && !Number.isNaN(result)) ? result : null;
  //   } catch {
  //     return null;
  //   }
  // }

  /**
   * Resolves a formula synchronously, allowing @variables and Math functions, but NO dice rolls.
   *  Example: "-1 * Math.ceil(@con/4)"
   *   - @variable.path lookups
   *   - Math expressions (Math.ceil, Math.floor, etc.)
   * Note: This is only needed when supporting Math.* functions. The Foundry Roll.evaluateSync() 
   *  method can handle any standard formula (even without dice) like "@str.atkMod + 2".
   * @param {string} formula - Formula string to be resolved
   * @param {object} rollData - Actor system data for @variable resolution
   * @returns {number|null}
   */
  // static resolveFormulaNoDice(formula, rollData = {}) {
  //   if (!formula || typeof formula !== "string") return null;

  //   // Reject dice up front — synchronous mode cannot handle them
  //   if (/\d*d\d+/.test(formula)) return null;

  //   // Find & replace rollData @variables
  //   let expanded = formula.replace(/@([A-Za-z0-9.]+)/g, (_, key) => {
  //     return foundry.utils.getProperty(rollData, key) ?? 0;
  //   });

  //   // Evaluate any remaining math functions
  //   try {
  //     // eslint-disable-next-line no-new-func
  //     const fn = new Function("Math", `return (${expanded});`);
  //     const result = fn(Math);
  //     // Final sanity check to ensure we return a number
  //     return (typeof result === "number" && !Number.isNaN(result)) ? result : null;
  //   } catch {
  //     return null;
  //   }
  // }

  /**
   * Resolve a formula that may include Math.* functions. NO DICE ROLLS (cannot be async).
   * @rollData references are resolved by Roll/evaluateSync.
   *
   * @param {string} formula
   * @param {object} rollData  // actor or item data for @refs
   * @returns {number}
   */
  static resolveFormulaWithMath(formula, rollData = {}) {
    if (typeof formula !== "string") return Number(formula) || 0;
  
    let expr = formula;

    // Regex to match Math.fn(...) including nested parentheses
    const mathPattern = /Math\.(\w+)\s*\(([^()]*|\((?:[^()]*|\([^()]*\))*\))*\)/g;

    /**
     * Replace Math.* calls iteratively until nothing is left to replace.
     *  This allows nested Math.* calls (though I expect that will be very rare).
     */
    let match;
    while ((match = mathPattern.exec(expr)) !== null) {
      const fullMatch = match[0];
      const fnName = match[1];
      const inner = match[2];

      // Split the arguments inside Math.fn(a, b, c)
      const args = Hyp3eDice.splitArgs(inner).map(arg => {
        const r = new Roll(arg, rollData).evaluateSync();
        return r.total;
      });

      if (typeof Math[fnName] !== "function") {
        Hyp3eLogger.warn("Hyp3eDice resolveFormulaWithMath", `Unsupported Math function: Math.${fnName}`);
        expr = expr.replace(fullMatch, "0");
        continue;
      }

      const value = Math[fnName](...args);
      expr = expr.replace(fullMatch, value);
      mathPattern.lastIndex = 0; // reset search due to modified string
    }

    // After Math.* processing, let Roll handle @variables and anything else
    try {
      return new Roll(expr, rollData).evaluateSync().total;
    } catch (err) {
      const msg = `Error evaluating roll formula.`;
      Hyp3eLogger.error("Hyp3eDice resolveFormulaWithMath", msg, err);
      ui.notifications.error(msg);
      return 0;
    }
  }

  /**
   * Split an arg list "a, b, c+d" into ["a", "b", "c+d"]
   *  but without breaking parentheses. Very lightweight.
   */
  static splitArgs(argString) {
    const args = [];
    let depth = 0;
    let current = "";

    for (let char of argString) {
      if (char === "," && depth === 0) {
        args.push(current.trim());
        current = "";
        continue;
      }
      if (char === "(") depth++;
      if (char === ")") depth--;
      current += char;
    }
    if (current.trim() !== "") args.push(current.trim());
    return args;
  }

  /**
   * Resolve a formula that may include Math.* functions.
   *  Dice rolls and @rollData references are resolved by Roll/evaluateSync.
   *  Safe for use OUTSIDE _prepareData().
   *
   * @param {string} formula
   * @param {object} rollData  // actor or item data for @refs
   * @returns {number}
   */
  static async resolveFormulaWithMathAsync(formula, data = {}) {
    if (!formula || typeof formula !== "string") return null;

    // Clone the string for safe manipulation
    let expanded = formula;

    // Replace @variables with data values
    expanded = expanded.replace(/@([\w.]+)/g, (match, path) => {
      const value = getProperty(data, path);
      return value != null ? value : 0;
    });

    // Find & replace dice expressions with rolled totals
    const diceRegex = /\b(\d*d\d+(?:[+-]\d+)*)\b/g;
    const matches = [...expanded.matchAll(diceRegex)];
    for (const match of matches) {
      try {
        const roll = new Roll(match[1], data)
        await roll.evaluate();
        expanded = expanded.replace(match[0], roll.total);
      } catch (err) {
        Hyp3eLogger.warn("Hyp3eDice resolveFormulaWithMathAsync", `Invalid dice expression "${match[1]}"`, err);
        // We still pass through to math evaluation attempt, below
      }
    }

    // Finally, we can attempt to evaluate math functions
    try {
      const fn = new Function("Math", `return (${expanded});`);
      const result = fn(Math);
      return Number.isFinite(result) ? result : null;
    } catch (err) {
      console.warn("Hyp3eDice resolveFormulaWithMathAsync: evaluation error", err);
      return null;
    }
  }

}

/**
 * Matches "23", "-5", "3.14", etc.
 * @param {string} str - the string to test
 * @returns {boolean}
 */
export function isPureNumber(str) {
  return typeof str === "string" && /^-?\d+(\.\d+)?$/.test(str.trim());
}

/**
 * Rejects any string that contains the following:
 *  - Pure numbers like "10", "-3.2"
 *  - Dice expressions like "1d3", "2d6"
 *  - Actor variables like @str.atkMod or @lvl
 *  - Simple math operators like +, -, *, /, or %
 *  - JavaScript Math.* function calls
 * @param {string} str - the string to test
 * @returns {boolean}
 */
export function isPureString(str) {
  if (typeof str !== "string") return false;

  const s = str.trim();
  if (!s.length) return true; // If this happens, we capture it as an empty string

  // Reject pure numbers like "10", "-3.2"
  if (/^-?\d+(\.\d+)?$/.test(s)) return false;

  // Reject anything containing dice expressions
  if (/\d+d\d+/.test(s)) return false;

  // Reject @variables like @str.atkMod or @lvl
  if (/@[a-zA-Z_][\w.]*/.test(s)) return false;

  // Reject simple math operators
  if (/[+*%/\-]/.test(s)) return false;

  // Reject Math.* function calls
  if (/Math\.[a-zA-Z_]\w*\s*\(/.test(s)) return false;

  // If it passed all checks, it's a "pure string"
  return true;
}

// Matches dice notation: 1d6, d8, 2D10, (1d4 + 1d6), etc.
export function containsDice(str) {
  return /(^|[^a-zA-Z])\d*d\d+/i.test(str);
}

// Matches simple math, Math.* functions, or @variables but *no dice*.
export function containsMathOrVariables(str) {
  if (typeof str !== "string") return false;

  // Detect @variables
  if (/@[a-zA-Z_][\w.]*/.test(str)) return true;

  // Detect Math.* function calls, e.g. Math.ceil(x)
  if (/Math\.[a-zA-Z_]\w*\s*\(/.test(str)) return true;

  // Detect math operators or parentheses
  if (/[()+*/\-]/.test(str)) return true;

  // Detect digits (e.g. "1 + 2", "100", "2x"
  if (/\d/.test(str)) return true;

  return false;
}
