/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class Hyp3eItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */

  // Override the base Item _preCreate function
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    // Replace default image for various item types
    switch(data.type) {
      case "spell":
        data.img = `icons/svg/book.svg`
        break
      case "feature":
        data.img = `icons/svg/target.svg`
        break
      case "armor":
        data.img = `icons/svg/shield.svg`
        break
      case "weapon":
        data.img = `icons/svg/combat.svg`
        break
      case "item":
        data.img = `icons/svg/item-bag.svg`
        break
      case "container":
        data.img = `icons/svg/item-bag.svg`
        break
      default:
        data.img = `icons/svg/item-bag.svg`
    }
    if (CONFIG.HYP3E.debugMessages) { console.log("Pre-created item data", data) }
    return this.updateSource(data)
  }

  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();

    // Get the Item's data
    const itemData = this;
    // const actorData = this.actor ? this.actor : {};
    // const data = itemData;
    // console.log("Item data:", itemData)

    // Handle weapon attack roll formula
    if (itemData.type == "weapon") {
      // For all weapons, atkRoll is obviously true
      itemData.system.atkRoll = true
      // Set melee & missile flags and attack formulas
      if (itemData.system.type == "melee") {
        itemData.system.melee = true
        itemData.system.missile = false
        // Set attack formula if it doesn't already exist, else leave it alone
        if (!itemData.system.formula || itemData.system.formula == '') {
          itemData.system.formula = '1d20 + @fa + @str.atkMod + @item.atkMod'
        }
      } else if (itemData.system.type == "missile") {
        itemData.system.melee = false
        itemData.system.missile = true
        // Set attack formula if it doesn't already exist, else leave it alone
        if (!itemData.system.formula || itemData.system.formula == '') {
          itemData.system.formula = '1d20 + @fa + @dex.atkMod + @item.atkMod'
        }
      } else {
        // This should never happen, unless an item is imported with missing data
        console.log("ITEM ERROR: Weapon has neither melee nor missile property set! Setting to melee...")
        itemData.system.type = "melee"
        itemData.system.melee = true
        itemData.system.missile = false
        // Set attack formula if it doesn't already exist, else leave it alone
        if (itemData.system.formula == '') {
          itemData.system.formula = '1d20 + @fa + @str.atkMod + @item.atkMod'
        }
      }

    } else { // ==> Anything NOT a weapon...
      // For non-weapons, is the Attack Roll checkbox selected?
      if (itemData.system.atkRoll) {
        // Set attack formula if it doesn't already exist, else leave it alone
        if (itemData.system.formula == '') {
          itemData.system.formula = '1d20 + @fa'
        }
      } else {
        // Handle item check roll formula
        if (itemData.system.formula == '' && itemData.system.check != '') {
          itemData.system.formula = itemData.system.check
        }
      }
    }
    // Log the item data
    //console.log("Item Data:", itemData)

  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, return the actor's roll data.
    if ( !this.actor ) return null
  
    const rollData = this.actor.getRollData();
    // Grab the item's system data as well.
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
  }

  /**
   * Handle item rolls
   */
  // async roll() {
  //   const item = this;
  //   // An item roll is either an attack or a check of some kind
  //   // Weapons & spells default to attack, other items default to a check
  //   if (item.type == 'weapon' || item.type == 'spell') {
  //     this.rollAttack()
  //   } else {
  //     this.rollCheck()
  //   }
  // }

  /**
   * Handle item attack rolls.
   */
  // async rollAttack() {
  //   const item = this;

  //   // Initialize chat data.
  //   const speaker = ChatMessage.getSpeaker({ actor: this.actor })
  //   // const rollMode = game.settings.get('core', 'rollMode')
  //   // console.log(`System roll mode: ${rollMode}`)
  //   let label = ""
  //   let itemName = ""
  //   if (item.system.friendlyName != "") {
  //     itemName = item.system.friendlyName
  //   } else {
  //     itemName = item.name
  //   }

  //   // If this is a spell, decrement the number memorized
  //   if (item.type == "spell" && item.system.quantity.value > 0) {
  //     if (CONFIG.HYP3E.debugMessages) { console.log("Cast memorized spell:", item) }
  //     // Update the item object
  //     await item.update({
  //       system: {
  //         quantity: {
  //           value: item.system.quantity.value--,  
  //         }
  //       }
  //     })
  //     // Update the embedded item document
  //     this.actor.updateEmbeddedDocuments("Item", [
  //       { _id: item.id, "system.quantity.value": item.system.quantity.value-- },
  //     ]);
  //   }

  //   if (!this.system.formula) {
  //   // If there's no roll formula, send a chat message
  //     this._displayItemInChat()
  //     // label = `<h3>${itemName} [${item.type}]</h3>`
  //     // ChatMessage.create({
  //     //   speaker: speaker,
  //     //   rollMode: rollMode,
  //     //   flavor: label,
  //     //   content: item.system.description ?? ''
  //     // });
  //     return null
  //   }

  //   // Create an attack roll and send a chat message from it

  //   // Retrieve roll data from the item
  //   const rollData = this.getRollData();
  //   if (CONFIG.HYP3E.debugMessages) { console.log("Attack/spell roll data:", rollData) }
  //   // Declare vars
  //   let rollFormula = ""
  //   let naturalRoll = 0
  //   let dieType = ""
  //   let rollTotal = 0
  //   let dmgFormula = ""
  //   let damageRoll = ""
  //   let dmgRoll
  //   let targetAc = 9
  //   let targetName = ""
  //   let mastery = "Attack"
  //   let masterMod = "0"
  //   let debugAtkRollFormula = ""
  //   let debugDmgRollFormula = ""

  //   // Has the user targeted a token? If so, get it's AC and name
  //   let userTargets = Array.from(game.user.targets)
  //   if (CONFIG.HYP3E.debugMessages) { console.log("Selected Tokens:", canvas.tokens.controlled) }
  //   if (CONFIG.HYP3E.debugMessages) { console.log("Game User Data:", game.user) }
  //   if (CONFIG.HYP3E.debugMessages) { console.log("Target Actor Data:", userTargets) }
  //   if (userTargets.length > 0) {
  //     let primaryTargetData = userTargets[0].actor
  //     targetAc = primaryTargetData.system.ac.value
  //     targetName = primaryTargetData.name
  //   }

  //   // Check if the item has Master or Grandmaster flags set
  //   if (item.system.wpnGrandmaster) {
  //     mastery = "Grandmaster attack"
  //     masterMod = "2"
  //   } else if (item.system.wpnMaster) {
  //     mastery = "Master attack"
  //     masterMod = "1"
  //   }

  //   // Setup chat card label based on whether we have a target
  //   if (targetName != "") {
  //     label = `${mastery} with ${itemName} vs. ${targetName}...`
  //   } else {
  //     label = `${mastery} with ${itemName}...`
  //   }

  //   if (masterMod == "0") {
  //     if (CONFIG.HYP3E.debugMessages) { debugAtkRollFormula = `Attack Formula: ${rollData.item.formula} + sitMod` }
  //     rollFormula = `${rollData.item.formula} + ${rollData.item.sitMod}`  
  //   } else {
  //     if (CONFIG.HYP3E.debugMessages) { debugAtkRollFormula = `Attack Formula: ${rollData.item.formula} + masteryMod + sitMod` }
  //     rollFormula = `${rollData.item.formula} + ${masterMod} + ${rollData.item.sitMod}`  
  //   }

  //   if (CONFIG.HYP3E.debugMessages) { console.log("Roll formula:", rollFormula) }
  //   // Invoke the attack roll
  //   const atkRoll = new Roll(rollFormula, rollData);
  //   // Resolve the roll
  //   let result = await atkRoll.roll();
  //   if (CONFIG.HYP3E.debugMessages) { console.log("Roll result: ", result) }

  //   // Get the resulting values from the attack roll
  //   naturalRoll = atkRoll.dice[0].total
  //   dieType = "d20"
  //   rollTotal = atkRoll.total

  //   // Determine hit or miss based on target AC
  //   let hit = false
  //   let tn = 20 - targetAc
  //   if (CONFIG.HYP3E.debugMessages) { console.log(`Attack roll ${atkRoll.total} hits AC [20 - ${atkRoll.total} => ] ${eval(20 - atkRoll.total)}`) }
  //   if (naturalRoll == 20) {
  //     if (CONFIG.HYP3E.debugMessages) { console.log("Natural 20 always crit hits!") }
  //     label += `<br /><span style='color:#00b34c'><b>Critical Hit!</b></span>`
  //     hit = true
  //   } else if (naturalRoll == 1) {
  //     if (CONFIG.HYP3E.debugMessages) { console.log("Natural 1 always crit misses!") }
  //     label += "<br /><span style='color:#e90000'><b>Critical Miss!</b></span>"
  //   } else if (atkRoll.total >= tn) {
  //     if (CONFIG.HYP3E.debugMessages) { console.log(`Hit! Attack roll ${atkRoll.total} is greater than or equal to [20 - ${targetAc} => ] ${tn}.`) }
  //     label += `<br /><b>Hits AC ${eval(20 - atkRoll.total)}!</b>`
  //     hit = true
  //   } else {
  //     if (CONFIG.HYP3E.debugMessages) { console.log(`Miss! Attack roll ${atkRoll.total} is less than [20 - ${targetAc} => ] ${tn}.`) }
  //     if (eval(20 - atkRoll.total) <= 9) {
  //       label += `<br /><b>Miss, would have hit AC ${eval(20 - atkRoll.total)}.</b>`
  //     } else {
  //       label += `<br /><b>Misses AC 9.</b>`
  //     }
  //   }

  //   // If the attack hit, we roll damage automatically and include it in the chat message
  //   if (hit && rollData.item.damage) {
  //     if (Roll.validate(rollData.item.damage)) {
  //       if (rollData.item.melee) {
  //         if (masterMod == "0") {
  //           dmgFormula = `${rollData.item.damage} + @str.dmgMod + @item.dmgMod`
  //           if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${rollData.item.damage} + @str.dmgMod + @item.dmgMod` }
  //         } else {
  //           dmgFormula = `${rollData.item.damage} + @str.dmgMod + @item.dmgMod + ${masterMod}`
  //           if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${rollData.item.damage} + @str.dmgMod + @item.dmgMod + masteryMod` }
  //         }
  //       } else if (rollData.item.missile) {
  //         if (masterMod == "0") {
  //           dmgFormula = `${rollData.item.damage} + @item.dmgMod`
  //           if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${rollData.item.damage} + @item.dmgMod` }  
  //         } else {
  //           dmgFormula = `${rollData.item.damage} + @item.dmgMod + ${masterMod}`
  //           if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${rollData.item.damage} + @item.dmgMod + masteryMod` }  
  //         }
  //       } else {
  //         // This should only happen with spells
  //         dmgFormula = `${rollData.item.damage}`
  //         if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${rollData.item.damage}` }
  //       }
  //       if (CONFIG.HYP3E.debugMessages) { console.log("Damage formula:", dmgFormula) }
  
  //       // Invoke the damage roll
  //       dmgRoll = new Roll(dmgFormula, rollData);
  //       // Resolve the roll
  //       let result = await dmgRoll.roll();
  //       if (CONFIG.HYP3E.debugMessages) { console.log("Damage result: ", dmgRoll) }

  //       // Render the damage-roll chat card
  //       if (dmgRoll) {
  //         damageRoll = `
  //           <h4 class="dice-damage">Rolling damage...</h4>
  //           <div class="dice-roll">
  //             <div class="dice-result">
  //               <div class="dice-formula">${dmgRoll.formula}</div>
  //               <div class="dice-tooltip">
  //                 ${debugDmgRollFormula}
  //                 <section class="tooltip-part">
  //                   <div class="dice">`
  //         // Add dice-roll summaries to the chat card
  //         dmgRoll.dice.forEach(dice => {
  //         damageRoll += `
  //                   <header class="part-header flexrow">
  //                     <span class="part-formula">${dice.number}d${dice.faces}</span>
  //                     <span><ol class="dice-rolls">`
  //         dice.values.forEach(val => {
  //           if (val == 1) {
  //             damageRoll += `<li class="roll die d${dice.faces} min">${val}</li>`
  //           } else if (val == dice.faces) {
  //             damageRoll += `<li class="roll die d${dice.faces} max">${val}</li>`
  //           } else {
  //             damageRoll += `<li class="roll die d${dice.faces}">${val}</li>`
  //           }
  //         })  
  //         damageRoll += `
  //                       </ol></span>
  //                     <span class="part-total">${dice.total}</span>
  //                   </header>`
  //         })
  //         // Finish the damage-roll chat card
  //         damageRoll += `
  //                   </div>
  //                 </section>
  //               </div>
  //               <h4 class="dice-formula"><span class="dice-damage">${dmgRoll.total} HP damage!</span></h4>
  //             </div>                
  //           </div>
  //           <!--
  //           <button type="button" data-action="apply-damage" title="[Click] Apply full damage to selected tokens.
  //             [Shift-Click] Adjust value before applying.">
  //             <i class="fa-solid fa-heart-broken fa-fw"></i>
  //             <span class="label">Apply Damage</span>
  //           </button>
  //           -->
  //           `
  //       }
  //     } else {
  //       dmgFormula = `${rollData.item.damage}`
  //       if (CONFIG.HYP3E.debugMessages) {
  //         console.log(`Damage formula ${dmgFormula} is not a valid roll formula!`)
  //         debugDmgRollFormula = `Damage Formula: <b>${dmgFormula}</b> is not a valid roll formula!`
  //         damageRoll = `
  //           <h4 class="dice-damage">Rolling damage...</h4>
  //           <div class="dice-roll">
  //             <div class="dice-result">
  //               <div class="dice-formula">${rollData.item.damage}</div>
  //               <div class="dice-tooltip">
  //                 ${debugDmgRollFormula}
  //               </div>
  //             </div>
  //           </div>
  //           `
  //       }
  //     }
  //  }

  //   // Render the full attack-roll chat card, with damage if any
  //   let msgContent = ``
  //   msgContent = `
  //   <div class="message-content">
  //     <div class="dice-roll">
  //       <div class="dice-result">
  //         <div class="dice-formula">${atkRoll.formula}</div>
  //         <div class="dice-tooltip">
  //           <section class="tooltip-part">
  //             ${debugAtkRollFormula}
  //             <div class="dice">
  //               <header class="part-header flexrow">
  //                 <span class="part-formula">${dieType}</span>
  //                 <span>
  //                   <ol class="dice-rolls">
  //                     <li class="roll die ${dieType}">${naturalRoll}</li>
  //                   </ol>
  //                 </span>
  //                 <span class="part-total">${naturalRoll}</span>
  //               </header>
  //             </div>
  //           </section>
  //         </div>
  //         <h4 class="dice-total">${rollTotal}</h4>
  //       </div>
  //     </div>
  //     ${damageRoll}
  //   </div>
  //   `
    
  //   // Prettify label
  //   label = "<h3>" + label + "</h3>"

  //   // Output attack roll result to a chat message
  //   let chatMsg = await atkRoll.toMessage({
  //     speaker: speaker,
  //     flavor: label,
  //     content: msgContent
  //   },{
  //     rollMode: rollData.item.rollMode
  //   })
  //   if (CONFIG.HYP3E.debugMessages) { console.log("Chat html:", chatMsg) }
  //   return atkRoll

  // }

  /**
   * Handle item check rolls.
   */
  async rollCheck() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor })
    // const rollMode = game.settings.get('core', 'rollMode')
    // console.log(`System roll mode: ${rollMode}`)
    let label = ""
    let content = item.system.description
    let itemName = ""
    if (item.system.friendlyName != "") {
      itemName = item.system.friendlyName
    } else {
      itemName = item.name
    }

    // If there's no roll formula, send a chat message.
    if (!this.system.formula) {
      // Vanilla label
      label = `<h3>${itemName} [${item.type}]</h3>`
      ChatMessage.create({
        speaker: speaker,
        rollMode: 'publicroll',
        flavor: label,
        content: content ?? ''
      });
      return null
    }

    // Create a roll and send a chat message from it.
    // Retrieve roll data from the item
    const rollData = this.getRollData();
    if (CONFIG.HYP3E.debugMessages) { console.log("Item roll data:", rollData) }
    // Declare vars
    let rollFormula
    let naturalRoll = 0
    let dieType = ""
    let rollTotal = 0
    let debugCheckRollFormula = ""
    let debugCheckTn = ""
    let results = []
    let description = ""

    // Setup roll formula
    label = `${itemName} roll...`
    if (CONFIG.HYP3E.flipRollUnderMods) {
      if (CONFIG.HYP3E.debugMessages) { debugCheckRollFormula = `Check Formula: ${rollData.item.formula} - sitMod` }
      rollFormula = `${rollData.item.formula} - ${rollData.item.sitMod}`
    } else {
      if (CONFIG.HYP3E.debugMessages) { debugCheckRollFormula = `Check Formula: ${rollData.item.formula} + sitMod` }
      rollFormula = `${rollData.item.formula} + ${rollData.item.sitMod}`
    }

    if (CONFIG.HYP3E.debugMessages) { console.log("Check formula:", rollFormula) }
    // Invoke the roll and submit it to chat.
    const roll = new Roll(rollFormula, rollData);
    // Resolve the roll
    await roll.roll();
    if (CONFIG.HYP3E.debugMessages) { console.log("Roll result: ", roll) }

    // Get the resulting values from the attack roll
    naturalRoll = roll.dice[0].total
    dieType = "d12"
    rollTotal = roll.total

    // Determine whether we have a valid target number or formula
    if (rollData.item.tn != '' && rollData.item.tn != 'undefined') {
      // Resolve target formula to a number, if necessary
      let targetRoll = new Roll(rollData.item.tn, rollData)
      await targetRoll.roll()
      if (CONFIG.HYP3E.debugMessages) {
        debugCheckTn = `Check target formula: ${rollData.item.tn} evaluates to ${targetRoll.formula} = ${targetRoll.total}`
        console.log(debugCheckTn)
        console.log("Target formula eval: ", targetRoll)
      }

      // Determine success or failure of the roll
      let targetNum = targetRoll.total
      label += ` (target ${targetNum})`
      // Item checks are roll-under for success
      if(roll.total <= targetNum) {
        if (CONFIG.HYP3E.debugMessages) { console.log(roll.total + " is less than or equal to " + targetNum + "!") }
        label += "<br /><b>Success!</b>"

        /*
        We use simple word parsing in the ability name to determine if this is a cleric turning undead.

        Cross-reference the cleric (or sub-class) TA and die roll against the Turn Undead table...
        To determine possible results... and output those to the chat?
        It may be possible to just use the actor's TA and dynamically calculate the results row 
          from the table, since the minimum value for success is always a target number of 10, 
          affecting undead at Type [TA - 1].

        Example: a cleric with TA of 5 can turn undead up to Type 4 with a target number of 10.
        From there, we know that:

        A target number of 7 will turn undead at their Type == cleric's TA.
        A TN of 4 affects undead at Type == cleric [TA + 1].
        And a TN of 1 affects undead at Type == cleric [TA + 2].
        And with all of this information, we can also calculate the Types of undead that may be 
          Turned automatically (undead Type == [cleric TA] - 2), or Destroyed (undead Type == 
          [cleric TA] - 4), or Ultimately Destroyed (undead Type == [cleric TA] - 7).
        */

        let itemNameLower = itemName.toLowerCase()
        if (itemNameLower.indexOf("turn") >= 0 && itemNameLower.indexOf("undead") >= 0) {
          if (roll.total <= 1) {
            results.push(`<li>[[/r 2d6]] Undead of Type ${rollData.ta+2} or less are <b>turned</b>.</li>`)
          } else if (roll.total <= 4) {
            results.push(`<li>[[/r 2d6]] Undead of Type ${rollData.ta+1} or less are <b>turned</b>.</li>`)
          } else if (roll.total <= 7) {
            results.push(`<li>[[/r 2d6]] Undead of Type ${rollData.ta} or less are <b>turned</b>.</li>`)
          } else { // => roll.total is between 8 and 10, since a success was already determined
            results.push(`<li>[[/r 2d6]] Undead of Type ${rollData.ta-1} or less are <b>turned</b>.</li>`)
          }
          if (rollData.ta >= 4) {
            results.push(`<li>[[/r 2d6]] Undead of Type ${rollData.ta-4} or less are <b>destroyed</b>.</li>`)
          }
          if (rollData.ta >= 7) {
            results.push(`<li>[[/r 1d6+6]] Undead of Type ${rollData.ta-7} or less are <b>utterly destroyed</b>.</li>`)
          }
          // Now setup our description output from the results
          description = `<ul>`
          for (let i = results.length-1; i >=0; i--) {
            description += results[i]
          }
          description += `</ul>`
          
        }

      } else {
        if (CONFIG.HYP3E.debugMessages) { console.log(roll.total + " is greater than " + targetNum + "!") }
        label += "<br /><b>Fail.</b>"
      }
    } else {
      // No target number supplied
      if (CONFIG.HYP3E.debugMessages) { console.log("No target number for " + roll.total) }
    }

    // Render the full attack-roll chat card, with damage if any
    let msgContent = ``
    msgContent = `
    <div class="message-content">
      ${description}
      <div class="dice-roll">
        <div class="dice-result">
          <div class="dice-formula">${roll.formula}</div>
          <div class="dice-tooltip">
            <section class="tooltip-part">
              ${debugCheckRollFormula}
              <div class="dice">
                <header class="part-header flexrow">
                  <span class="part-formula">${dieType}</span>
                  <span>
                    <ol class="dice-rolls">
                      <li class="roll die ${dieType}">${naturalRoll}</li>
                    </ol>
                  </span>
                  <span class="part-total">${naturalRoll}</span>
                </header>
              </div>
            </section>
          </div>
          <h4 class="dice-total">${rollTotal}</h4>
        </div>
      </div>
    </div>
    `

    // Prettify label
    label = "<h3>" + label + "</h3>"

    // Output roll result to a chat message
    let chatMsg = await roll.toMessage({
      speaker: speaker,
      flavor: label,
      content: msgContent
    },{
      rollMode: rollData.item.rollMode
    })
    if (CONFIG.HYP3E.debugMessages) { console.log("Chat html:", chatMsg) }
    return roll

  }

  /**
   * Handle displaying an Item description in the chat.
   * @private
   */
  async _displayItemInChat() {
    const item = this
    // const speaker = ChatMessage.getSpeaker()
    
    // The system uses the term 'feature' under the covers, but Hyperborea uses 'ability'
    let typeLabel = ""
    if (item.type == 'feature') {
      typeLabel = 'Ability'
    } else {
      typeLabel = (item.type).capitalize()
    }
    // Replace names like "Bow, composite, long" with something that looks nicer
    let itemName = ""
    if (item.system.friendlyName != "") {
      itemName = item.system.friendlyName
    } else {
      itemName = item.name
    }

    // Chat message header text
    const label = `<h3>${typeLabel}: ${itemName}</h3>`
    
    // console.log("Item clicked:", item)
    let content = item.system.description

    // Setup clickable buttons for item properties if they have a roll macro,
    //  otherwise just display the value.

    // Features/Abilities
    if (item.type == 'feature') {
      if (item.system.formula && item.system.tn) {
        // Display the ability check roll with target number
        content += `<p>Ability Check: ${item.system.formula} equal or under ${item.system.tn}</p>`
      }
    }

    // Weapons
    if (item.type == 'weapon') {
      if (item.system.rof) {
        // Display missile rate of fire or melee attack rate
        content += `<p>Atk Rate: ${item.system.rof}</p>`
      }
      if (item.system.type == 'missile') {
        // For a missile weapon we display the range increments
        content += `<p>Range: ${item.system.range.short} / ${item.system.range.medium} / ${item.system.range.long}</p>`
      } else {
        // For melee weapons we display the weapon class
        content += `<p>Wpn Class: ${item.system.wc}</p>`
      }
      if (item.system.damage) {
        if (Roll.validate(item.system.damage)) {
          content += `<p>Damage: [[/r ${item.system.damage}]]</p>`
        } else {
          content += `<p>Damage: ${item.system.damage}</p>`
        }
        // if ((item.system.damage).match(/.*d[1-9].*/)) {
        //   // Add a damage roll macro
        //   content += `<p>Damage: [[/r ${item.system.damage}]]</p>`
        // } else {
        //   // If damage is not variable, simply display the value
        //   content += `<p>Damage: ${item.system.damage}</p>`
        // }
      }
    }

    // Spells
    if (item.type == 'spell') {
      if (item.system.range) {
        // Display the range
        content += `<p>Range: ${item.system.range}</p>`
      }
      if (item.system.duration) {
        if ((item.system.duration).match(/.*d[1-9].*/)) {
          // Add a duration roll macro
          content += `<p>Duration: [[/r ${item.system.duration}]]</p>`
        } else {
          // If duration is not variable, simply display the value
          content += `<p>Duration: ${item.system.duration}</p>`
        }
      }
      if (item.system.affected) {
        if ((item.system.affected).match(/.*d[1-9].*/)) {
          // Add a number affected roll macro
          content += `<p># Affected: [[/r ${item.system.affected}</p>`
        } else {
          content += `<p># Affected: ${item.system.affected}</p>`
        }
      }
      if (item.system.save) {
        content += `<p> Save: ${item.system.save}</p>`
      }
      if (item.system.damage) {
        if (Roll.validate(item.system.damage)) {
          content += `<p>Damage: [[/r ${item.system.damage}]]</p>`
        } else {
          content += `<p>Damage: ${item.system.damage}</p>`
        }
        // if ((item.system.damage).match(/.*d[1-9].*/)) {
        //   // Add a damage roll macro
        //   content += `<p>Damage: [[/r ${item.system.damage}]]</p>`
        // } else {
        //   // If damage is not variable, simply display the value
        //   content += `<p>Damage: ${item.system.damage}</p>`
        // }
      }      
    }

    // Item
    if (item.type == 'item') {
      if (item.system.formula && item.system.tn) {
        // Display the item check roll with target number
        content += `<p>Item Check: ${item.system.formula} equal or under ${item.system.tn}</p>`
      }
    }

    // Now we can display the chat message
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: label,
      content: content ?? ''
    })
  }
}
