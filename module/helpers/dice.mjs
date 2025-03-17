import { HYP3E } from "./config.mjs"

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
        if (CONFIG.HYP3E.debugMessages) { console.log("Base attack roll parts:", atkRollParts) }

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
                    if (CONFIG.HYP3E.debugMessages) { console.log("Found a fixed number in the formula: ", part) }
                    // If we find a match, remove it from the array
                    atkRollParts.splice(index, 1)
                    // Add it to the first element in the array
                    let baseRoll = atkRollParts[0]
                    atkRollParts[0] = `${baseRoll} + ${part}`
                }
            })
            // Start setting up the debug attack roll table & array
            debugAtkRollFormula = "<b>Attack formula elements:</b><table>"
            debugAtkRollParts = [...atkRollParts]
            // Take the first element in the debug array and wrap it in the table html
            debugAtkRollParts[0] = `<tr><td>${debugAtkRollParts[0]}</td><td>${atkRollParts[0]}</td></tr>`
            if (CONFIG.HYP3E.debugMessages) { console.log("Debug attack roll parts:", debugAtkRollParts) }
        }

        // Strip '@item.atkMod' out since we add it automatically anyway...
        //   Ideally this won't ever happen, but some items might have it in their formula.
        if (atkRollParts.includes("@item.atkMod")) {
            if (CONFIG.HYP3E.debugMessages) { console.log(`DEBUG: ${rollData.itemName} still has @itemData.atkMod in its formula!`) }
            atkRollParts = atkRollParts.filter(part => (part != "@item.atkMod"))
            debugAtkRollParts = debugAtkRollParts.filter(part => (part != "@item.atkMod"))
        }

        // Apply the item attack mod if needed
        if (itemData.atkMod) {
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
                if (actorData?.actorType == "character") {
                    if (atkRollParts.includes("@str.atkMod")) {
                        // Remove @str.atkMod first
                        atkRollParts = atkRollParts.filter(part => (part != "@str.atkMod"))
                        debugAtkRollParts = debugAtkRollParts.filter(part => (part != "@str.atkMod"))
                        // By removing and re-adding, we ensure the parts are in the order we want
                        atkRollParts.push(actorData.str.atkMod)
                        debugAtkRollParts.push(`<tr><td>ST Atk Mod</td><td>${actorData.str.atkMod}</td></tr>`)
                    }
                    if (atkRollParts.includes("@dex.atkMod")) {
                        // Remove @dex.atkMod first
                        atkRollParts = atkRollParts.filter(part => (part != "@dex.atkMod"))
                        debugAtkRollParts = debugAtkRollParts.filter(part => (part != "@dex.atkMod"))
                        // By removing and re-adding, we ensure the parts are in the order we want
                        atkRollParts.push(actorData.dex.atkMod)
                        debugAtkRollParts.push(`<tr><td>DX Atk Mod</td><td>${actorData.dex.atkMod}</td></tr>`)
                    }
                }
            }

        } else if (itemData.itemType == "spell") {
            // Spell attack formulas are so bespoke, we need to handle each variable separately
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
            atkRollParts.push(masteryMod)
            debugAtkRollParts.push(`<tr><td>Mastery Mod</td><td>${masteryMod}</td></tr>`)
        }

        // Add situational modifier from the roll dialog
        if (rollData?.sitMod != 0) {
            atkRollParts.push(rollData.sitMod)
            debugAtkRollParts.push(`<tr><td>Sit Mod</td><td>${rollData.sitMod}</td></tr>`)
        }

        // Add range modifier from the roll dialog, if needed
        if (rollData?.rangeMod <= 0) {
            atkRollParts.push(rollData.rangeMod)
            debugAtkRollParts.push(`<tr><td>Range Mod</td><td>${rollData.rangeMod}</td></tr>`)
        }

        // Log the attack roll parts & the constructed formula
        if (CONFIG.HYP3E.debugMessages) { 
            console.log("Attack roll parts:", atkRollParts)
            console.log("Debug attack roll parts:", debugAtkRollParts)
        }
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
     * @param {Object} actorData
     */
    static buildDamageFormula(itemData, ammoData = null, actorData = null) {
        let dmgRollParts = []
        let masteryMod = 0
        let debugDmgRollFormula = ""

        // Check if the weapon attack has Master or Grandmaster flags set
        if (itemData.wpnGrandmaster) {
            masteryMod = 2
        } else if (itemData.wpnMaster) {
            masteryMod = 1
        }

        // All items start with the base damage formula
        dmgRollParts.push(itemData.damage)
        // Add the debug message header and first table row
        debugDmgRollFormula = "<b>Damage formula elements:</b><table>"
        debugDmgRollFormula += `<tr><td>Base Roll</td><td>${itemData.damage}</td></tr>`

        // Reformat the debug damage string for commonly-used variables
        // ST Dmg Mod
        const stdmRegex = /\+\s*@str.dmgMod/g
        if (debugDmgRollFormula.match(stdmRegex) > "") {
            debugDmgRollFormula = debugDmgRollFormula.replace(stdmRegex, "")
            debugDmgRollFormula += `<tr><td>ST Dmg Mod</td><td>${actorData.str.dmgMod}</td></tr>`
        }
        // Casting Ability
        const caRegex = /\+\s*@ca/g
        if (debugDmgRollFormula.match(caRegex) > "") {
            debugDmgRollFormula = debugDmgRollFormula.replace(caRegex, "")
            debugDmgRollFormula += `<tr><td>Casting Ability</td><td>${actorData.ca}</td></tr>`
        }

        // Apply the item damage mod if needed
        if (itemData.dmgMod) {
            dmgRollParts.push(itemData.dmgMod)
            debugDmgRollFormula += `<tr><td>Item Dmg Mod</td><td>${itemData.dmgMod}</td></tr>`
        }

        // Apply the ammunition damage mod if needed
        if (ammoData?.dmgMod) {
            dmgRollParts.push(ammoData.dmgMod)
            debugDmgRollFormula += `<tr><td>Ammo Dmg Mod</td><td>${ammoData.dmgMod}</td></tr>`
        }

        // Apply the actor's ST damage mod if the item is a melee weapon
        if (itemData.melee) {
            if (actorData?.actorType == "character") {
                dmgRollParts.push(actorData.str.dmgMod)
                debugDmgRollFormula += `<tr><td>ST Dmg Mod</td><td>${actorData.str.dmgMod}</td></tr>`
            } else {
                // NPCs/monsters don't have a ST attribute, so nothing to do here except 
                //  note it in a comment. :-)
            }
        }

        // Add Weapon Mastery mod if applicable
        if (masteryMod > 0) {
            dmgRollParts.push(masteryMod)
            debugDmgRollFormula += `<tr><td>Mastery Mod</td><td>${masteryMod}</td></tr>`
        }

        // Finish the debug damage roll table
        debugDmgRollFormula += "</table>"

        // Log the damage roll parts & the constructed formula
        if (CONFIG.HYP3E.debugMessages) { 
            console.log("Damage roll parts:", dmgRollParts)
            console.log(debugDmgRollFormula)
        }

        // Construct the damage roll formula from parts, and return an object with the formula and debug formula
        const dmgRollFormula = dmgRollParts.join(" + ")
        const dmgObj = {
            formula: dmgRollFormula,
            debugFormula: debugDmgRollFormula
        }
        return dmgObj
    }
}
