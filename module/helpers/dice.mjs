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
        if (CONFIG.HYP3E.debugMessages) { 
            console.log("Base attack roll parts:", atkRollParts)
            debugAtkRollParts = [...atkRollParts]
            console.log("Debug attack roll parts:", debugAtkRollParts)
        }

        // Strip '@item.atkMod' out since we add it automatically anyway...
        //   Ideally this won't ever happen, but some items might have it in their formula.
        if (atkRollParts.includes("@item.atkMod")) {
            console.log(`DEBUG: ${rollData.itemName} still has @itemData.atkMod in its formula!`)
            atkRollParts = atkRollParts.filter(part => (part != "@item.atkMod"))
            if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts = debugAtkRollParts.filter(part => (part != "@item.atkMod")) }
        }

        // Apply the item attack mod if needed
        if (itemData.atkMod) {
            // atkRollParts.push(itemData.atkMod)
            if (atkRollParts.length > 1) {
                atkRollParts.splice(1, 0, itemData.atkMod)
                if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts.splice(1, 0, 'itemAtkMod') }
            } else {
                atkRollParts.push(itemData.atkMod)
                if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts.push('itemAtkMod') }
            }
        }

        // Apply the item attack mod for magic ammunition if needed
        if (ammoData?.atkMod) {
            // atkRollParts.push(ammoData.atkMod)
            if (atkRollParts.length > 1) {
                atkRollParts.splice(2, 0, ammoData.atkMod)
                if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts.splice(2, 0, 'ammoAtkMod') }
            } else {
                atkRollParts.push(ammoData.atkMod)
                if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts.push('ammoAtkMod') }
            }
        }

        // For weapons, the formulas are pretty standard.
        if (itemData.itemType == "weapon") {
            // Remove Fighting Ability, we will re-add it later if this isn't a grenade
            atkRollParts = atkRollParts.filter(part => (part != "@fa"))
            if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts = debugAtkRollParts.filter(part => (part != "@fa")) }

            // Grenade-like items only use the character's DX attack mod
            if (itemData.isGrenade) {
                if (actorData?.actorType == "character") {
                    // if @dex.atkMod exists, remove it first
                    atkRollParts = atkRollParts.filter(part => (part != "@dex.atkMod"))
                    if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts = debugAtkRollParts.filter(part => (part != "@dex.atkMod")) }
                    // By removing and re-adding, we ensure the parts are in the order we want
                    atkRollParts.push(actorData.dex.atkMod)
                    if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts.push('dex.atkMod') }
                }
            } else {
                // Most weapons fall into this section...

                // Add Fighting Ability, even if it's zero
                atkRollParts.push(actorData.fa)
                if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts.push('fa') }

                // Characters add ST or DX mods based on what the formula already has in it.
                //   We do this because some people may have custom formulas that don't 
                //   use ST or DX mods, or use them in non-standard ways.
                //   For example, they might have a Rapier that uses dex.atkMod instead 
                //   of str.atkMod.
                if (actorData?.actorType == "character") {
                    if (atkRollParts.includes("@str.atkMod")) {
                        // Remove @str.atkMod first
                        atkRollParts = atkRollParts.filter(part => (part != "@str.atkMod"))
                        if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts = debugAtkRollParts.filter(part => (part != "@str.atkMod")) }
                        // By removing and re-adding, we ensure the parts are in the order we want
                        atkRollParts.push(actorData.str.atkMod)
                        if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts.push('@str.atkMod') }
                    }
                    if (atkRollParts.includes("@dex.atkMod")) {
                        // Remove @dex.atkMod first
                        atkRollParts = atkRollParts.filter(part => (part != "@dex.atkMod"))
                        if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts = debugAtkRollParts.filter(part => (part != "@dex.atkMod")) }
                        // By removing and re-adding, we ensure the parts are in the order we want
                        atkRollParts.push(actorData.dex.atkMod)
                        if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts.push('@dex.atkMod') }
                    }
                }
            }

        } else if (itemData.itemType == "spell") {
            // Spell attack formulas are so bespoke, we need to handle each variable separately
            if (atkRollParts.includes("@fa")) {
                atkRollParts[atkRollParts.indexOf("@fa")] = actorData.fa
                // if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts[debugAtkRollParts.indexOf("@fa")] = 'fa' }
            }
            if (atkRollParts.includes("@str.atkMod")) {
                atkRollParts[atkRollParts.indexOf("@str.atkMod")] = actorData.str.atkMod
                // if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts[debugAtkRollParts.indexOf("@str.atkMod")] = 'str.atkMod' }
            }
            if (atkRollParts.includes("@dex.atkMod")) {
                atkRollParts[atkRollParts.indexOf("@dex.atkMod")] = actorData.dex.atkMod
                // if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts[debugAtkRollParts.indexOf("@dex.atkMod")] = 'dex.atkMod' }
            }
        }

        // Add Weapon Mastery mod if applicable
        if (masteryMod > 0) {
            atkRollParts.push(masteryMod)
            if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts.push('masteryMod') }
        }

        // Add situational modifier from the roll dialog
        if (rollData?.sitMod != 0) {
            atkRollParts.push(rollData.sitMod)
            if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts.push('sitMod') }
        }

        // Add range modifier from the roll dialog, if needed
        if (rollData?.rangeMod <= 0) {
            if (CONFIG.HYP3E.debugMessages) { console.log("Range mod:", rollData?.rangeMod) }
            atkRollParts.push(rollData.rangeMod)
            if (CONFIG.HYP3E.debugMessages) { debugAtkRollParts.push('rangeMod') }    
        }

        // Log the attack roll parts & the constructed formula
        if (CONFIG.HYP3E.debugMessages) { 
            console.log("Attack roll parts:", atkRollParts)
            console.log("Debug attack roll parts:", debugAtkRollParts)
            debugAtkRollFormula = debugAtkRollParts.join(" + ")
        }

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
        if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${itemData.damage}` }

        // Apply the item damage mod if needed
        if (itemData.dmgMod) {
            dmgRollParts.push(itemData.dmgMod)
            if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula += ` + itemDmgMod` }
        }

        // Apply the item damage mod for magic ammunition if needed
        if (ammoData?.dmgMod) {
            dmgRollParts.push(ammoData.dmgMod)
            if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula += ` + ammoDmgMod` }
        }

        if (itemData.melee) {
            if (actorData?.actorType == "character") {
                // Apply the item damage mod first
                // dmgRollParts.push(itemData.dmgMod)
                // Characters apply their ST Damage Mod to all melee damage
                dmgRollParts.push(actorData.str.dmgMod)
                // if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${itemData.damage} + itemDmgMod + @str.dmgMod` }
                if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula += ` + @str.dmgMod` }
            } else {
                // NPCs/monsters don't have a ST attribute, so it's just the item damage mod
                // dmgRollParts.push(itemData.dmgMod)
                // if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${itemData.damage} + itemDmgMod` }
            }
        } else if (itemData.missile) {
            // Apply the item damage mod
            // dmgRollParts.push(itemData.dmgMod)
            // if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${itemData.damage} + itemDmgMod` }
        } else {
            // This should only happen with spells
            // if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${itemData.damage}` }
        }

        // Add Weapon Mastery mod if applicable
        if (masteryMod > 0) {
            dmgRollParts.push(masteryMod)
            if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula += ` + masteryMod` }
        }

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
