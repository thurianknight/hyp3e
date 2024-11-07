import {Hyp3eDice} from "../dice.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class Hyp3eActor extends Actor {

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as attribute modifiers rather than attribute scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.hyp3e || {};
    systemData.hp.percentage = Math.clamp((systemData.hp.value * 100) / systemData.hp.max, 0, 100);
    if (CONFIG.HYP3E.debugMessages) { console.log(`Preparing actor ${actorData.name} derived data...`) }
  
    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;

    // Loop through attribute scores, and add their modifiers to our sheet output.
    for (let [key, attribute] of Object.entries(systemData.attributes)) {
      // Example of how to calculate the modifier using d20 rules.
      //attribute.mod = Math.floor((attribute.value - 10) / 2);
      // NOTHING TO DO HERE...
    }

    // Calculated fields go here

    // Add task resolution
    systemData.taskResolution = {}
    for (let [key, value] of Object.entries(CONFIG.HYP3E.taskResolution)) {
      systemData.taskResolution[key] = value
      systemData.taskResolution[key].name = game.i18n.localize(CONFIG.HYP3E.taskResolution[key].name)
      systemData.taskResolution[key].hint = game.i18n.localize(CONFIG.HYP3E.taskResolution[key].hint)
    }
    
    // Auto-calculate AC if configuration is enabled
    if (CONFIG.HYP3E.autoCalcAc) {
      // systemData.unarmoredAc = 9 - systemData.attributes.dex.defMod
      // if (CONFIG.HYP3E.debugMessages) { console.log("Unarmored AC: ", systemData.unarmoredAc) }

      // Calculate current AC & DR based on equipped armor, shield, and DX defense mod
      // Start by resetting base AC and DR
      systemData.ac.value = 9 - systemData.attributes.dex.defMod
      systemData.ac.dr = 0
      let tempAC = 9
      let shieldMod = 0
      let tempDR = 0
      // Loop through all inventory item types to find armor
      for (let itmType of Object.entries(actorData.itemTypes)) {
        if (itmType[0] == "armor") {
          // Armor as an item type can include armor, shields, and some protective magic items
          for (let [key, obj] of Object.entries(itmType[1])) {
            if (CONFIG.HYP3E.debugMessages) { console.log("Armor data: ", obj) }
            // Only count an item if it is equipped... but also note that only 1 suit of armor and
            //   1 shield will ever be counted -- no stacking of items.
            // The logic here should use the best AC if multiple armor types are equipped, as in 
            //   the case where someone is wearing both armor and a ring of protection.
            // HOWEVER, this logic is partially broken. Need to map out all possibilities for magical
            //   protection items, what stacks & when, then we can fix this logic.
            if (obj.system.equipped) {
              // DR can be updated by armor or shield (not in core rules, but...)
              if (obj.system.dr > tempDR) {
                // Only update DR if this equipped item is superior to the current DR
                tempDR = obj.system.dr
              }
              if (obj.system.type != "shield") {
                // Armor AC overrides the unarmored AC of 9 (DX mod subtracted later)
                if (obj.system.ac < tempAC) {
                  // Only update AC if this equipped item is superior to the current AC
                  tempAC = obj.system.ac
                }
                if (CONFIG.HYP3E.debugMessages) { 
                  console.log("Armor equipped: ", obj.name, ", Temp AC: ", tempAC, ", Temp DR: ", tempDR)
                }
              } else {
                // Shield AC is a modifier subtracted from base AC.
                // We allow shield modifiers to stack because many protective magic items give an AC bonus
                //  similar to shields, and they should stack.
                shieldMod += obj.system.ac
                if (CONFIG.HYP3E.debugMessages) {
                  console.log("Shield equipped: ", obj.name, ", Shield Mod: ", shieldMod)
                }
              }
            } else {
              if (CONFIG.HYP3E.debugMessages) { console.log("Armor not equipped: ", obj.name) }
            }
          }
        }
      }
      // Now calculate & set the final values
      systemData.ac.value = tempAC - systemData.attributes.dex.defMod - shieldMod
      systemData.ac.dr = tempDR
    }
    if (CONFIG.HYP3E.debugMessages) { console.log("Equipped AC: ", systemData.ac.value) }

  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here
    const systemData = actorData.system
    // NPCs and monsters don't get the -10 hp benefit that PCs do
    systemData.hp.min = 0

  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the attribute scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.attributes) {
      for (let [k, v] of Object.entries(data.attributes)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }
    // Add character's level to top level of data
    if (data.details.level) {
      data.lvl = data.details.level.value ?? 0;
    }

  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Anything to load?
    
  }

  /**
   * Handle rolls from the actor sheet
   */
  async rollBasic(dataset) {
    if (CONFIG.HYP3E.debugMessages) { console.log(`Rolling ${dataset.label}...`) }

    let rollResponse
    let label = `${dataset.label}...`

    // Log the dataset before the dialog renders
    if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} dataset: `, dataset) }
    try {
      rollResponse = await Hyp3eDice.ShowBasicRollDialog(dataset)
    } catch(err) {
      return
    }

    // Add situational modifier from the dice dialog
    const rollFormula = `${dataset.roll} + ${rollResponse.sitMod}`
    
    // Roll the dice!
    let roll = new Roll(rollFormula, this.getRollData())
    // Resolve the roll
    let result = await roll.roll()
    if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} roll result: `, result) }

    // Output roll result to a chat message
    this.sendRollToChat(roll, label, "", rollResponse.rollMode)
    
    return roll

  }

  async rollReaction(dataset) {
    if (CONFIG.HYP3E.debugMessages) { console.log(`Rolling ${dataset.label}...`) }

    let rollResponse
    let label = `${dataset.label}...`

    // Log the dataset before the dialog renders
    if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} dataset: `, dataset) }
    try {
      rollResponse = await Hyp3eDice.ShowBasicRollDialog(dataset)
    } catch(err) {
      return
    }

    // Add situational modifier from the dice dialog
    const rollFormula = `${dataset.roll} + ${rollResponse.sitMod}`
    
    // Roll the dice!
    let roll = new Roll(rollFormula, this.getRollData())
    // Resolve the roll
    let result = await roll.roll()
    if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} roll result: `, result) }
    // The roll shouldn't go below zero, even if modifiers would make it so
    let rollTotal = roll.total
    if (rollTotal < 0) { rollTotal = 0 }

    let reaction = this._valueFromTable(this.reactionTable, rollTotal)
    if (CONFIG.HYP3E.debugMessages) { console.log(reaction) }
    label += `<br /><b>${reaction}</b>`

    // Output roll result to a chat message
    this.sendRollToChat(roll, label, "", rollResponse.rollMode)
    
    return roll

  }

  async rollCheck(dataset) {
    if (CONFIG.HYP3E.debugMessages) { console.log(`Rolling ${dataset.label}...`) }

    // Is this an item or ability check?
    const item = this.items.get(dataset.itemId) ?? null

    // Determine whether we have a valid target number or formula
    if (dataset.rollTarget == '' || dataset.rollTarget == undefined || dataset.rollTarget <= 0) {
      console.log("Missing or invalid target number, cannot confirm success of check!")
      ui.notifications.info("Missing or invalid target number, cannot confirm success of check!")
      return
    }

    // Retrieve roll data from the actor
    const rollData = this.getRollData();
    if (CONFIG.HYP3E.debugMessages) { console.log("Actor roll data:", rollData) }
    
    // Declare vars
    let itemName = ""
    let rollFormula = ""
    let rollResponse
    let label = `${dataset.label}...`
    // Get the item's friendly name if it has one
    if (item) {
      if (item.system.friendlyName != "") {
        itemName = item.system.friendlyName
      } else {
        itemName = item.name
      }    
    }
    // This is needed for Turn Undead results
    let description = ""
  
    // Resolve target formula to a number, if necessary
    const targetRoll = new Roll(dataset.rollTarget, rollData)
    await targetRoll.roll()
    if (CONFIG.HYP3E.debugMessages) {
      console.log(`Check target formula: ${dataset.rollTarget} evaluates to ${targetRoll.formula} = ${targetRoll.total}`)
      console.log("Target formula eval: ", targetRoll)
    }
    // Override rollTarget, even if it has the same value
    dataset.rollTarget = targetRoll.total
    label += ` (target ${targetRoll.total})`

    // Log the dataset before the dialog renders
    if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} dataset: `, dataset) }
    try {
      rollResponse = await Hyp3eDice.ShowBasicRollDialog(dataset)
    } catch(err) {
      return
    }

    // Add/subtract situational modifier from the dice dialog
    if (CONFIG.HYP3E.flipRollUnderMods) {
      rollFormula = `${dataset.roll} - ${rollResponse.sitMod}`
    } else {
      rollFormula = `${dataset.roll} + ${rollResponse.sitMod}`
    }

    // Roll the dice!
    let roll = new Roll(rollFormula, rollData)
    // Resolve the roll
    let result = await roll.roll()
    if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} roll result: `, result) }

    // We use simple word parsing in the ability name to determine if this is a cleric turning undead
    let turnUndead = false
    let itemNameLower = itemName.toLowerCase()
    if (itemNameLower.indexOf("turn") >= 0 && itemNameLower.indexOf("undead") >= 0) {
      turnUndead = true
      // If we are turning undead, that resolution is executed separately...
    }
    
    // Determine success or failure on a simple check, not turning undead
    if (!turnUndead) {
      if (roll.total <= dataset.rollTarget) {
        if (CONFIG.HYP3E.debugMessages) { console.log(roll.total + " is less than or equal to " + dataset.rollTarget + "!") }
        label += "<br /><b>Success!</b>"
  
      } else {
        if (CONFIG.HYP3E.debugMessages) { console.log(roll.total + " is greater than " + dataset.rollTarget + "!") }
        label += "<br /><b>Fail.</b>"
      }
    } else {
      // Resolve the results of the attempted turning undead
      description = this.resolveTurnUndead(roll.total, rollData)
    }

    // Construct a custom chat card for the check
    const customChat = this.renderCustomChat(roll, "", description, "")
    // if (CONFIG.HYP3E.debugMessages) { console.log("Attack chat: ", attackChat) }

    // Output roll result to a chat message
    this.sendRollToChat(roll, label, customChat, rollResponse.rollMode)
    
    return roll

  }

  async rollAttackOrSpell(dataset) {
    if (CONFIG.HYP3E.debugMessages) { console.log(`Rolling ${dataset.label}...`) }

    // Is this an item (weapon or spell) attack?
    const item = this.items.get(dataset.itemId) ?? null

    // Retrieve roll data from the actor
    const rollData = this.getRollData();
    if (CONFIG.HYP3E.debugMessages) { console.log("Actor roll data:", rollData) }

    // Declare vars
    let atkRollParts = []
    let rollFormula = ""
    let rollResponse
    let naturalRoll = 0
    let dmgFormula = ""
    let dmgRollParts = []
    let damageChat = ""
    let dmgRoll
    let targetAc = 9
    let targetName = ""
    let masteryMod = 0
    let debugAtkRollFormula = ""
    let debugDmgRollFormula = ""

    let itemName = ""
    let label = `${dataset.label}`

    // Log the dataset and item (if any) before proceeding
    if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} dataset: `, dataset) }
    if (CONFIG.HYP3E.debugMessages) { console.log("Item:", item) }
    
    if (item) {
      // Get the item's friendly name if it has one
      if (item.system.friendlyName != "") {
        itemName = item.system.friendlyName
      } else {
        itemName = item.name
      }
    }

    // Show the roll dialog (type and item-dependent)
    if (!item) {
      try {
        rollResponse = await Hyp3eDice.ShowAttackRollDialog(dataset)
      } catch(err) {
        return
      }
    } else if (item && item.type == "weapon") {
      try {
        rollResponse = await Hyp3eDice.ShowAttackRollDialog(dataset)
      } catch(err) {
        return
      }
    } else if (item && item.type == "spell") {
      try {
        rollResponse = await Hyp3eDice.ShowSpellcastingDialog(dataset)
      } catch(err) {
        return
      }
      // Decrement the number memorized
      if (item.type == "spell" && item.system.quantity.value > 0) {
        if (CONFIG.HYP3E.debugMessages) { console.log(`Cast memorized spell: ${item.name}`) }
        // Update the item object
        await item.update({
          system: {
            quantity: {
              value: item.system.quantity.value--,  
            }
          }
        })
        // Update the embedded item document
        this.updateEmbeddedDocuments("Item", [
          { _id: item.id, "system.quantity.value": item.system.quantity.value-- },
        ])
      }
    }
    
    // Log the roll-dialog response
    if (CONFIG.HYP3E.debugMessages) { console.log("Dialog response:", rollResponse) }
    // Add situational modifier and roll mode from the dialog
    dataset.sitMod = rollResponse.sitMod
    dataset.rollMode = rollResponse.rollMode

    // Item-specific calculations
    if (item) {
      // If there's no item roll formula (typically a spell), send a chat message and exit
      if (!item.system.formula) {
        item._displayItemInChat()
        return null
      }
      
      // Check if the weapon attack has Master or Grandmaster flags set
      if (item.system.wpnGrandmaster) {
        masteryMod = 2
      } else if (item.system.wpnMaster) {
        masteryMod = 1
      }
    }

    // Initialize our attack roll parts array with the base roll
    atkRollParts.push(dataset.roll)
    // Add weapon mastery, if needed
    if (masteryMod == 0) {
      if (CONFIG.HYP3E.debugMessages) { debugAtkRollFormula = `Attack Formula: ${dataset.roll} + sitMod` }
    } else {
      if (CONFIG.HYP3E.debugMessages) { debugAtkRollFormula = `Attack Formula: ${dataset.roll} + masteryMod + sitMod` }
      atkRollParts.push(masteryMod)  
    }
    // Add situational modifier from the dice dialog
    atkRollParts.push(dataset.sitMod)

    // Construct our attack roll formula
    rollFormula = atkRollParts.join(" + ")
    if (item) {
      // Replace '@item.atkMod' with the actual value
      rollFormula = rollFormula.replace("@item.atkMod", item.system.atkMod)
    }

    if (CONFIG.HYP3E.debugMessages) {
      console.log("Attack roll parts:", atkRollParts)
      console.log("Attack formula:", rollFormula)
    }

    // Roll the dice!
    let atkRoll = new Roll(rollFormula, this.getRollData())
    if (CONFIG.HYP3E.debugMessages) { console.log("Attack roll: ", atkRoll) }
    // Resolve the roll
    let result = await atkRoll.roll()
    if (CONFIG.HYP3E.debugMessages) { console.log("Roll result: ", result) }
    // Get roll result
    naturalRoll = atkRoll.dice[0].total

    // Has the user targeted a token? If so, get it's AC and name
    const userTargets = Array.from(game.user.targets)
    if (CONFIG.HYP3E.debugMessages) { console.log("Target Actor Data:", userTargets) }
    if (userTargets.length > 0) {
      let primaryTargetData = userTargets[0].actor
      targetAc = primaryTargetData.system.ac.value
      targetName = primaryTargetData.name
    }
    
    // Update chat card label based on whether we have a target
    if (targetName != "") {
      label += ` vs. ${targetName}...`
    } else {
      label += `...`
    }

    // Footer used for adding crit buttons (if enabled)
    let critFooterHTML = "";

    // Determine hit or miss based on target AC
    let hit = false
    let tn = 20 - targetAc
    if (CONFIG.HYP3E.debugMessages) { console.log(`Attack roll ${atkRoll.total} hits AC [20 - ${atkRoll.total} => ] ${eval(20 - atkRoll.total)}`) }
    if (naturalRoll == 20) {
      if (CONFIG.HYP3E.debugMessages) { console.log("Natural 20 always crit hits!") }
      label += `<br /><span style='color:#00b34c'><b>Critical Hit!</b></span>`
      hit = true
      if (game.settings.get(game.system.id, "critHit") && item) {
        critFooterHTML += "<div class='critical-hit'><h4>Critical Hit:</h4></div>";
      }
    } else if (naturalRoll == 1) {
      if (CONFIG.HYP3E.debugMessages) { console.log("Natural 1 always crit misses!") }
      label += "<br /><span style='color:#e90000'><b>Critical Miss!</b></span>"

      if (game.settings.get(game.system.id, "critMiss") && item) {
        critFooterHTML += "<div class='critical-miss'><h4>Xathoqqua’s Woe:</h4></div>";
      }
    } else if (atkRoll.total >= tn) {
      if (CONFIG.HYP3E.debugMessages) { console.log(`Hit! Attack roll ${atkRoll.total} is greater than or equal to [20 - ${targetAc} => ] ${tn}.`) }
      label += `<br /><b>Hits AC ${eval(20 - atkRoll.total)}!</b>`
      hit = true
    } else {
      if (CONFIG.HYP3E.debugMessages) { console.log(`Miss! Attack roll ${atkRoll.total} is less than [20 - ${targetAc} => ] ${tn}.`) }
      if (eval(20 - atkRoll.total) <= 9) {
        label += `<br /><b>Miss, would have hit AC ${eval(20 - atkRoll.total)}.</b>`
      } else {
        label += `<br /><b>Misses AC 9.</b>`
      }
    }

    // If the item attack hit, we roll damage automatically and include it in the chat message
    if (hit && item) {
      if (Roll.validate(item.system.damage)) {
        // All items start with the base damage formula
        dmgRollParts.push(item.system.damage)
        if (item.system.melee) {
          if (this.type == "character") {
            // Characters apply their ST Damage Mod to all melee damage
            dmgRollParts.push(rollData.str.dmgMod)
            // Apply the item damage mod
            dmgRollParts.push(item.system.dmgMod)
            if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${item.system.damage} + @str.dmgMod + @item.dmgMod` }
          } else {
            // NPCs and monsters don't have a ST damage modifier, but might have an item damage mod
            dmgRollParts.push(item.system.dmgMod)
            if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${item.system.damage} + @item.dmgMod` }
          }
        } else if (item.system.missile) {
          // Apply the item damage mod
          dmgRollParts.push(item.system.dmgMod)
          if (masteryMod == 0) {
            if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${item.system.damage} + @item.dmgMod` }  
          } else {
            dmgRollParts.push(masteryMod)
            if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${item.system.damage} + @item.dmgMod + masteryMod` }  
          }
        } else {
          // This should only happen with spells
          if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${item.system.damage}` }
        }
        // Add Weapon Mastery mod if applicable
        if (masteryMod != 0) {
          dmgRollParts.push(masteryMod)
          if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula += ` + masteryMod` }
        }
        // Construct the damage roll formula from parts
        dmgFormula = dmgRollParts.join(" + ")
        if (CONFIG.HYP3E.debugMessages) {
          console.log("Damage roll parts:", dmgRollParts)
          console.log("Damage formula:", dmgFormula)
        }
  
        // Invoke the damage roll
        dmgRoll = new Roll(dmgFormula, rollData);
        // Resolve the roll
        let result = await dmgRoll.roll();
        if (CONFIG.HYP3E.debugMessages) { console.log("Damage result: ", dmgRoll) }

        // Get the dice roll value of damage for x2/x3 modifier button
        let dmgRollNatural =  dmgRoll.dice[0].total;
        let dmgBaseRoll = item.system.damage;
        // Render a damage chat snippet that will be added to the attack chat
        damageChat = this.renderDamageChat(dmgRoll, debugDmgRollFormula, dmgRollNatural, dmgBaseRoll, item)
        // if (CONFIG.HYP3E.debugMessages) { console.log("Damage chat: ", damageChat) }

      }
    }

    // Construct a custom chat card for the attack & damage
    const attackChat = this.renderCustomChat(atkRoll, debugAtkRollFormula, "", damageChat, critFooterHTML);
    // if (CONFIG.HYP3E.debugMessages) { console.log("Attack chat: ", attackChat) }

    // Output roll result to a chat message
    this.sendRollToChat(atkRoll, label, attackChat, rollResponse.rollMode)

    return atkRoll

  }

  async rollSave(dataset) {
    if (CONFIG.HYP3E.debugMessages) { console.log(`Rolling ${dataset.label}...`) }

    let saveRollParts = []
    let rollFormula = ""
    let rollResponse
    let label = `${dataset.label}...`

    if (this.type == "character") {
      // Get the character's saving throw modifiers
      dataset.avoidMod = this.system.attributes.dex.defMod
      dataset.poisonMod = this.system.attributes.con.poisRadMod
      dataset.willMod = this.system.attributes.wis.willMod

      // Log the dataset before the dialog renders
      if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} dataset: `, dataset) }
      try {
        rollResponse = await Hyp3eDice.ShowSaveRollDialog(dataset)
      } catch(err) {
        return
      }

      // Default basic save with only sit mod from dice dialog
      saveRollParts.push(dataset.roll)

      // Get saving throw modifer if one was selected
      if (rollResponse.avoidMod) {
        saveRollParts.push(rollResponse.avoidMod)
        label = `${dataset.label} with Avoidance modifier...`
      }
      if (rollResponse.poisonMod) {
        saveRollParts.push(rollResponse.poisonMod)
        label = `${dataset.label} with Poison/Radiation modifier...`
      }
      if (rollResponse.willMod) {
        saveRollParts.push(rollResponse.willMod)
        label = `${dataset.label} with Willpower modifier...`
      }
    } else {
      // NPC/monster save, no attribute-based mods
      // Log the dataset before the dialog renders
      if (CONFIG.HYP3E.debugMessages) { console.log(`${dataset.label} dataset: `, dataset) }
      try {
        rollResponse = await Hyp3eDice.ShowBasicRollDialog(dataset);
        // Default basic save with only sit mod from dice dialog
        saveRollParts.push(dataset.roll)
      } catch(err) {
        return
      }

    }

    // Add situational modifier from the dice dialog
    saveRollParts.push(rollResponse.sitMod)

    // Construct our save roll formula
    rollFormula = saveRollParts.join(" + ")
    if (CONFIG.HYP3E.debugMessages) {
      console.log("Save roll parts:", saveRollParts)
      console.log("Save formula:", rollFormula)
    }

    // Roll the dice!
    let roll = new Roll(rollFormula, this.getRollData())
    // Resolve the roll
    let result = await roll.roll()
    if (CONFIG.HYP3E.debugMessages) { console.log("Roll result: ", result) }
    // Determine success or failure
    if (roll.total >= dataset.rollTarget) {
      if (CONFIG.HYP3E.debugMessages) { console.log(roll.total + " is greater than or equal to " + dataset.rollTarget + "!") }
      label += "<br /><b>Success!</b>"
    } else {
      if (CONFIG.HYP3E.debugMessages) { console.log(roll.total + " is less than " + dataset.rollTarget + "!") }
      label += "<br /><b>Fail.</b>"
    }

    // Output roll result to a chat message
    this.sendRollToChat(roll, label, "", rollResponse.rollMode)

    return roll

  }

  // Build the chat message for turning undead
  resolveTurnUndead(rollTotal, rollData) {
    /*
    Turning Undead
    ==============
    Cross-reference the cleric (or sub-class) TA and die roll against the Turn Undead table to determine possible 
    results, and output those to the chat.
    We can just use the actor's TA and dynamically calculate the results row from the Turn Undead table, since the 
    minimum value for success is always a target number of 10, affecting undead at Type [TA - 1].
    
    Logic:
    - If TA is 1, it is possible to completely fail.
    - If TA is 2 or higher, we have the chance for an automatic turn of undead.
    - As long as we have some kind of success, we always roll 2d6 for the number of undead affected (except if 
    TA >= 7, see below).
    - If TA >= 2, then it is possible that some undead will be turned automatically without even requiring a roll.
    - If TA >= 4, it is possible that lower-Type undead may be Destroyed.
    - If TA >= 7, it is possible that some lower-Type undead may be Utterly Destroyed. All this does is change the 
    number affected from 2d6 to 1d6+6, thus increasing the average roll.

    Example: a cleric with TA of 5 can turn undead up to Type 3 automatically, turn undead of 
    type 4 with a target number of 10, type 5 with a target number of 7, type 6 with a target 
    number of 4, and finally type 7 with a target number of 1.
    Knowing that all TA numbers calculate the same way, we know that:
    - A target number of 10 will turn undead of Type [cleric TA - 1].
    - A target number of 7 will turn undead of Type [cleric TA].
    - A TN of 4 affects undead of Type [cleric TA + 1].
    - And a TN of 1 affects undead of Type [cleric TA + 2].
    And with all of this information, we can also calculate the Types of undead that may be 
      Turned automatically (undead Type == [cleric TA] - 2), or Destroyed (undead Type == 
      [cleric TA] - 4), or Ultimately Destroyed (undead Type == [cleric TA] - 7).
    */
    let description = ''
    let orLess = ''
    let results = []
    let rollAffected = '2d6'
  
    // Was this a complete fail?
    if (rollData.ta <= 1 && rollTotal > 10) {
      return 'No undead were turned...'
    }

    // From here on it's all some level of success
    if (rollTotal <= 1) {
      if ((rollData.ta+2) > 0) { orLess = 'or less ' }
      results.push(`<li>Undead of Type ${rollData.ta+2} ${orLess}are <b>turned</b>.</li>`)
    } else if (rollTotal <= 4) {
      if ((rollData.ta+1) > 0) { orLess = 'or less ' }
      results.push(`<li>Undead of Type ${rollData.ta+1} ${orLess}are <b>turned</b>.</li>`)
    } else if (rollTotal <= 7) {
      if ((rollData.ta) > 0) { orLess = 'or less ' }
      results.push(`<li>Undead of Type ${rollData.ta} ${orLess}are <b>turned</b>.</li>`)
    } else if (rollTotal <= 10) {
      if ((rollData.ta-1) > 0) { orLess = 'or less ' }
      results.push(`<li>Undead of Type ${rollData.ta-1} ${orLess}are <b>turned</b>.</li>`)
    } else {
      // Even a roll of 11 or 12 is still successful against weaker undead
      if ((rollData.ta-2) > 0) { orLess = 'or less ' }
      results.push(`<li>Undead of Type ${rollData.ta-2} ${orLess}are <b>turned</b>.</li>`)
    }
    // Reset orLess
    orLess = ''
    // At TA 4+, the cleric can actually destroy undead
    if (rollData.ta >= 4) {
      if ((rollData.ta-4) > 0) { orLess = 'or less ' }
      results.push(`<li>Undead of Type ${rollData.ta-4} ${orLess}are <b>destroyed</b>.</li>`)
    }
    // At TA 7+, the cleric is so powerful that his number affected is greatly improved
    if (rollData.ta >= 7) {
      rollAffected = '1d6+6'
    }

    // Now we can setup our description output from the results
    description = `Roll [[/r ${rollAffected}]] for the total number of undead affected. Starting from the weakest (lowest Type)...<ul>`
    for (let i = results.length-1; i >=0; i--) {
      description += results[i]
    }
    description += `</ul>`

    return description
  }

  // Send roll results to the chat window
  sendRollToChat(roll, label, content, rollMode) {
    // Prettify label
    label = "<h3>" + label + "</h3>"
    // Send to chat
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: label,
      content: content
    },{
      rollMode: rollMode
    })
  }
  
  // Render custom html for attacks and turning undead
  renderCustomChat(roll, debugRollFormula, description, damageChat, footerHTML = "") {
    // Render the full attack-roll chat card, with damage if any
    let customChat = `
    <div class="message-content">
      ${description}
      <div class="dice-roll">
        <div class="dice-result">
          <div class="dice-formula">${roll.formula}</div>
          <div class="dice-tooltip">
            <section class="tooltip-part">
              ${debugRollFormula}
              <div class="dice">`
      // Add dice-roll summaries to the chat card
      roll.dice.forEach(dice => {
        customChat += `
                <header class="part-header flexrow">
                  <span class="part-formula">${roll.dice[0].expression}</span>
                  <span>
                    <ol class="dice-rolls">`
      dice.values.forEach(val => {
        if (val == 1) {
          customChat += `<li class="roll die d${dice.faces} min">${val}</li>`
        } else if (val == dice.faces) {
          customChat += `<li class="roll die d${dice.faces} max">${val}</li>`
        } else {
          customChat += `<li class="roll die d${dice.faces}">${val}</li>`
        }
      })  
      customChat += `
                    </ol>
                  </span>
                  <span class="part-total">${roll.dice[0].total}</span>
                </header>`
      })
      // Finish the chat card
      customChat += `
              </div>
            </section>
          </div>
          <h4 class="dice-total">${roll.total}</h4>
        </div>
      </div>
      ${damageChat}
      ${footerHTML}
    </div>
    `
    return customChat    
  }

  // Render custom html for damage rolls, which is added to the attack chat
  renderDamageChat(dmgRoll, debugDmgRollFormula, naturalDmgRoll, dmgBaseRoll, sourceItem = null) {
    // Render the damage-roll chat html
    let damageChat = ""

    if (dmgRoll) {
      damageChat = `
        <h4 class="dice-damage">Rolling damage...</h4>
        <div class="dice-roll">
          <div class="dice-result">
            <div class="dice-formula">${dmgRoll.formula}</div>
            <div class="dice-tooltip">
              <section class="tooltip-part">
                ${debugDmgRollFormula}
                <div class="dice">`
      // Add dice-roll summaries to the chat card
      dmgRoll.dice.forEach(dice => {
        damageChat += `
                <header class="part-header flexrow">
                  <span class="part-formula">${dice.number}d${dice.faces}</span>
                  <span><ol class="dice-rolls">`
      dice.values.forEach(val => {
        if (val == 1) {
          damageChat += `<li class="roll die d${dice.faces} min">${val}</li>`
        } else if (val == dice.faces) {
          damageChat += `<li class="roll die d${dice.faces} max">${val}</li>`
        } else {
          damageChat += `<li class="roll die d${dice.faces}">${val}</li>`
        }
      })  
      damageChat += `
                    </ol>
                  </span>
                  <span class="part-total">${dice.total}</span>
                </header>`
      })
      // Finish the damage-roll chat card
      damageChat += `
                </div>
              </section>
            </div>
            <h4 class="dice-formula"><span class="dice-damage">${dmgRoll.total} HP damage!</span>
            <span class="damage-button" data-total="${dmgRoll.total}"
              data-natural="${naturalDmgRoll}" data-roll="${dmgBaseRoll}" data-source-type="${sourceItem.type}"></span></h4>
          </div>                
        </div>
        <!--
        <button type="button" data-action="apply-damage" title="[Click] Apply full damage to selected tokens.
          [Shift-Click] Adjust value before applying.">
          <i class="fa-solid fa-heart-broken fa-fw"></i>
          <span class="label">Apply Damage</span>
        </button>
        -->
      `
    }
    return damageChat
  }


  /**
   * Str attack mods, from -2 to +2.
   * 
   * Applied to:
   * - `str.atkMod`
   */
  strAtkMod = {
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
  strDmgMod = {
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
  dexAtkMod = {
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
  dexDefMod = {
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
  conHpMod = {
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
  conPoisonMod = {
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
  conTraumaSurvive = {
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
  testOfAttr = {
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
  featOfAttr = {
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
  intLanguages = {
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
  bonusSpell1 = {
    0: false,
    3: false,
    13: true,
  };
  bonusSpell2 = {
    0: false,
    3: false,
    15: true,
  };
  bonusSpell3 = {
    0: false,
    3: false,
    17: true,
  };
  bonusSpell4 = {
    0: false,
    3: false,
    18: true,
  };
  /**
   * Magician or Cleric chance to learn new spell.
   * Applied to:
   * - `int.learnSpell` and `wis.learnSpell`
   **/
  learnSpell = {
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
  wisWillMod = {
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
  chaReactionMod = {
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
  chaRetainers = {
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
  chaTurnUndead = {
    0: -1,
    3: -1,
    7: 0,
    15: 1,
  };

  /**
   * Reaction lookup table
   */
  reactionTable = {
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
   * Class-specific data
   * Classes:
   *   Assassin, Barbarian, Bard, Berserker, Cataphract, Cleric, Cryomancer, Druid, Fighter, 
   *   Huntsman, Illusionist, Legerdemainist, Magician, Monk, Necromancer, Paladin, Priest, 
   *   Purloiner, Pyromancer, Ranger, Runegraver, Scout, Shaman, Thief, Warlock, Witch
   */
  classData = {
    "Assassin": {
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
    },
    "Barbarian": {
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
    },
    "Bard": {
      "hitDie": "1d8",
      "fa": 1,
      "ca": 1,
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
    },
    "Berserker": {
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
    },
    "Cataphract": {
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
    },
    "Cleric": {
      "fa": 1,
      "ca": 1,
      "ta": 1,
      "unskilled": -2,
      "hitDie": "1d8",
      "attrReqs": {
        "wis": 9,
      },
      "xpBonusReq": {
        "wis": 16,
      },
    },
    "Cryomancer": {
      "hitDie": "1d4",
      "fa": 0,
      "ca": 1,
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
    },
    "Druid": {
      "hitDie": "1d8",
      "fa": 1,
      "ca": 1,
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
    },
    "Fighter": {
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
    },
    "Huntsman": {
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
    },
    "Illusionist": {
      "hitDie": "1d4",
      "fa": 0,
      "ca": 1,
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
    },
    "Legerdemainist": {
      "hitDie": "1d6",
      "fa": 1,
      "ca": 1,
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
    },
    "Magician": {
      "hitDie": "1d4",
      "fa": 0,
      "ca": 1,
      "ta": null,
      "unskilled": -4,
      "attrReqs": {
        "int": 9,
      },
      "xpBonusReq": {
        "int": 16,
      },
    },
    "Monk": {
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
    },
    "Necromancer": {
      "hitDie": "1d4",
      "fa": 0,
      "ca": 1,
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
    },
    "Paladin": {
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
    },
    "Priest": {
      "hitDie": "1d4",
      "fa": 0,
      "ca": 1,
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
    },
    "Purloiner": {
      "hitDie": "1d6",
      "fa": 1,
      "ca": 1,
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
    },
    "Pyromancer": {
      "hitDie": "1d4",
      "fa": 0,
      "ca": 1,
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
    },
    "Ranger": {
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
    },
    "Runegraver": {
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
    },
    "Scout": {
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
    },
    "Shaman": {
      "hitDie": "1d6",
      "fa": 0,
      "ca": 1,
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
    },
    "Thief": {
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
    },
    "Warlock": {
      "hitDie": "1d8",
      "fa": 1,
      "ca": 1,
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
    },
    "Witch": {
      "hitDie": "1d4",
      "fa": 0,
      "ca": 1,
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
    },
}

  _valueFromTable(table, val) {
    let output;
    for (let i = 0; i <= val; i++) {
      if (table[i] != undefined) {
        output = table[i];
      }
    }
    return output;
  }

  _stringFromTable(table, val) {
    let output = ""
    output = table[val]
    return output
  }

  /**
   * Handle adding and removing a bonus spell
   * @param {String} spellLvl The bonus spell level to be updated
   * @param {Bool} val The true or false value to be assigned
   */
  async updateBonusSpell(spellLvl, val) {
    switch (spellLvl) {
      case "intLvl1":
        await this.update({
          system: {
            attributes: {
              int: {
                bonusSpells: {
                  lvl1: val,
                }
              }
            }
          }
        })
        break
      case "intLvl2":
        await this.update({
          system: {
            attributes: {
              int: {
                bonusSpells: {
                  lvl2: val,
                }
              }
            }
          }
        })
        break
      case "intLvl3":
        await this.update({
          system: {
            attributes: {
              int: {
                bonusSpells: {
                  lvl3: val,
                }
              }
            }
          }
        })
        break
      case "intLvl4":
        await this.update({
          system: {
            attributes: {
              int: {
                bonusSpells: {
                  lvl4: val,
                }
              }
            }
          }
        })
        break
      case "wisLvl1":
        await this.update({
          system: {
            attributes: {
              wis: {
                bonusSpells: {
                  lvl1: val,
                }
              }
            }
          }
        })
        break
      case "wisLvl2":
        await this.update({
          system: {
            attributes: {
              wis: {
                bonusSpells: {
                  lvl2: val,
                }
              }
            }
          }
        })
        break
      case "wisLvl3":
        await this.update({
          system: {
            attributes: {
              wis: {
                bonusSpells: {
                  lvl3: val,
                }
              }
            }
          }
        })
        break
      case "wisLvl4":
        await this.update({
          system: {
            attributes: {
              wis: {
                bonusSpells: {
                  lvl4: val,
                }
              }
            }
          }
        })
        break
      }
      // this.render(true)
      if (CONFIG.HYP3E.debugMessages) { console.log("Bonus spell update:", this.system) }
  }

  /**
   * Set or reset all attribute modifiers
   */
  async SetAttributeMods(dataset) {
    console.log("Setting attribute modifiers...")

    // Log the dataset before the dialog renders
    if (CONFIG.HYP3E.debugMessages) { console.log(`${this.name} dataset: `, dataset) }
    
    // Display the confirmation dialog, and exit if the user cancels this action
    try {
      let rollResponse = await Hyp3eDice.ShowSetModifiersDialog(dataset)
    } catch(err) {
      console.log(`SetAttributeMods dialog error ${err}`)
      return false
    }

    // Initialize some vars
    let data = foundry.utils.deepClone(this.system)
    let thisClass = {}
    let xpBonusPossible = null
    let getsBonusSpell = false
    
    // Setup chat message variables
    let label = `<h3>Values for character updated...</h3>`
    let content = `<ul>`

    // Here we modify the cloned data object of the actor...
    if (CONFIG.HYP3E.debugMessages) { console.log("Actor system data:", data) }
    if (data.details.class) {
      // Override label if character class selected
      label = `<h3>Values for ${data.details.class} updated...</h3>`
      if (CONFIG.HYP3E.debugMessages) { console.log(`Setting ${data.details.class} hit die...`) }
      thisClass = this.classData[data.details.class]
      if (CONFIG.HYP3E.debugMessages) { console.log(`Class Data for ${data.details.class}: `, thisClass) }
      data.hd = thisClass.hitDie
      content += `<li>Hit Die: ${thisClass.hitDie}</li>`
      data.fa = thisClass.fa
      content += `<li>Fighting Ability: ${thisClass.fa}</li>`
      data.ca = thisClass.ca
      content += `<li>Casting Ability: ${thisClass.ca}</li>`
      data.ta = thisClass.ta
      content += `<li>Turning Ability: ${thisClass.ta}</li>`
      data.unskilled = thisClass.unskilled
      content += `<li>Unskilled Weapon Penalty: ${thisClass.unskilled}</li>`
      data.details.xp.primeAttr = ""
    }
    if (data.attributes) {
      for (let [k, v] of Object.entries(data.attributes)) {
        switch (k) {
          case "str":
            if (CONFIG.HYP3E.debugMessages) { console.log(`Setting ${k} modifiers...`) }
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
              if (thisClass.xpBonusReq.str) {
                if (CONFIG.HYP3E.debugMessages) { console.log(`Checking XP bonus on high ST...`) }
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
              if (CONFIG.HYP3E.debugMessages) { console.log(`Checking for Extraordinary Feat of ST...`) }
              if (thisClass.featBonus && thisClass.featBonus.str) {
                data.attributes.str.feat += thisClass.featBonus.str
                content += `<li>Extraordinary Feat of ST override: ${data.attributes.str.feat}</li>`
              }
            }
            content += `</ul>`
            break

          case "dex":
            if (CONFIG.HYP3E.debugMessages) { console.log(`Setting ${k} modifiers...`) }
            content += `<li>DX Mods:</li><ul>`
            data.attributes.dex.atkMod = this._valueFromTable(this.dexAtkMod, data.attributes.dex.value)
            content += `<li>Missile Attack Mod: ${data.attributes.dex.atkMod}</li>`
            data.attributes.dex.defMod = this._valueFromTable(this.dexDefMod, data.attributes.dex.value)
            content += `<li>Defence Mod: ${data.attributes.dex.defMod}</li>`
            data.attributes.dex.test = this._valueFromTable(this.testOfAttr, data.attributes.dex.value)
            content += `<li>Test of DX: ${data.attributes.dex.test}</li>`
            data.attributes.dex.feat = this._valueFromTable(this.featOfAttr, data.attributes.dex.value)
            content += `<li>Feat of DX: ${data.attributes.dex.feat}</li>`
            if (data.details.class && thisClass.xpBonusReq.dex) {
              if (CONFIG.HYP3E.debugMessages) { console.log(`Checking XP bonus on high DX...`) }
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
              if (CONFIG.HYP3E.debugMessages) { console.log(`Checking for Extraordinary Feat of DX...`) }
              if (thisClass.featBonus && thisClass.featBonus.dex) {
                data.attributes.dex.feat += thisClass.featBonus.dex
                content += `<li>Extraordinary Feat of DX override: ${data.attributes.dex.feat}</li>`
              }
            }
            content += `</ul>`
            break

          case "con":
            if (CONFIG.HYP3E.debugMessages) { console.log(`Setting ${k} modifiers...`) }
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
            if (data.details.class && thisClass.xpBonusReq.con) {
              if (CONFIG.HYP3E.debugMessages) { console.log(`Checking XP bonus on high CN...`) }
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
              if (CONFIG.HYP3E.debugMessages) { console.log(`Checking for Extraordinary Feat of CN...`) }
              if (thisClass.featBonus && thisClass.featBonus.con) {
                data.attributes.con.feat += thisClass.featBonus.con
                content += `<li>Extraordinary Feat of CN override: ${data.attributes.con.feat}</li>`
              }
            }
            content += `</ul>`
            break

          case "int":
            if (CONFIG.HYP3E.debugMessages) { console.log(`Setting ${k} modifiers...`) }
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

            if (data.details.class && thisClass.xpBonusReq.int) {
              if (CONFIG.HYP3E.debugMessages) { console.log(`Checking XP bonus on high IN...`) }

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
            content += `</ul>`
            break

          case "wis":
            if (CONFIG.HYP3E.debugMessages) { console.log(`Setting ${k} modifiers...`) }
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

            if (data.details.class && thisClass.xpBonusReq.wis) {
              if (CONFIG.HYP3E.debugMessages) { console.log(`Checking XP bonus on high WS...`) }

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
            content += `</ul>`
            break

          case "cha":
            if (CONFIG.HYP3E.debugMessages) { console.log(`Setting ${k} modifiers...`) }
            content += `<li>CH Mods:</li><ul>`
            data.attributes.cha.reaction = this._valueFromTable(this.chaReactionMod, data.attributes.cha.value)
            content += `<li>Reaction Mod: ${data.attributes.cha.reaction}</li>`
            data.attributes.cha.maxHenchmen = this._valueFromTable(this.chaRetainers, data.attributes.cha.value)
            content += `<li>Max Henchmen: ${data.attributes.cha.maxHenchmen}</li>`
            data.attributes.cha.turnUndead = this._valueFromTable(this.chaTurnUndead, data.attributes.cha.value)
            content += `<li>Turn Undead Mod: ${data.attributes.cha.turnUndead}</li>`
            if (data.details.class && thisClass.xpBonusReq.cha) {
              if (CONFIG.HYP3E.debugMessages) { console.log(`Checking XP bonus on high CH...`) }
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
            content += `</ul>`
            break
        }
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
          ta: data.ta,
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
        if (CONFIG.HYP3E.debugMessages) { console.log('Updated attribute modifier data:', updateData) }
        if(this.validate(updateData)) {
          if (CONFIG.HYP3E.debugMessages) { console.log('Validation OK, executing update...') }
          // Update the main actor data
          await this.update(updateData)
          // Log the actor data after updating
          if (CONFIG.HYP3E.debugMessages) { console.log('Actor after update:', this.system) }
        }
      } catch(err) {
        console.log(`Actor update error: ${err}`)
      }

      // Now we can display the chat message
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: label,
        content: content ?? ''
      })
    }
    return true
  }

}