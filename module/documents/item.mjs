/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class Hyp3eItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */

  // This is not working correctly... yet
  async _preCreate(data, options, user) {
    // await super._preCreate(data, options, user);
    console.log("Creating item data", data)
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
    await super._preCreate(data, options, user);
    // return this.update({ img:"foo" })
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
  async roll() {
    const item = this;
    // An item roll is either an attack or a check of some kind
    // Weapons & spells default to attack, other items default to a check
    if (item.type == 'weapon' || item.type == 'spell') {
      this.rollAttack()
    } else {
      this.rollCheck()
    }
  }

  /**
   * Handle item attack rolls.
   */
  async rollAttack() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor })
    const rollMode = game.settings.get('core', 'rollMode')
    let label = ""
    let itemName = ""
    if (item.system.friendlyName != "") {
      itemName = item.system.friendlyName
    } else {
      itemName = item.name
    }

    if (!this.system.formula) {
    // If there's no roll formula, send a chat message (this should never happen)
      label = `<h3>${itemName} [${item.type}]</h3>`
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? ''
      });
      return null
    }

    // Create an attack roll and send a chat message from it

    // Retrieve roll data from the item
    const rollData = this.getRollData();
    console.log("Item roll data:", rollData)
    // Declare vars
    let naturalRoll = 0
    let dieType = ""
    let rollFormula = ""
    let rollTotal = 0
    let dmgFormula = ""
    let damageRoll = ""
    let targetAc = 9
    let targetName = ""

    // Has the user targeted a token? If so, get it's AC and name
    let userTargets = Array.from(game.user.targets)
    console.log("Target Actor Data:", userTargets)
    if (userTargets.length > 0) {
      let primaryTargetData = userTargets[0].actor
      targetAc = primaryTargetData.system.ac.value
      targetName = primaryTargetData.name
    }

    // Setup chat card label based on whether we have a target
    if (targetName != "") {
      label = `Attack with ${itemName} vs. ${targetName}...`
    } else {
      label = `Attack with ${itemName}...`
    }

    rollFormula = `${rollData.item.formula} + ${rollData.item.sitMod}`

    console.log("Roll formula:", rollFormula)
    // Invoke the attack roll
    const atkRoll = new Roll(rollFormula, rollData);
    // Resolve the roll
    let result = await atkRoll.roll({async: true});
    console.log("Roll result: ", result)

    // Get the resulting values from the attack roll
    naturalRoll = atkRoll.dice[0].total
    dieType = "d20"
    rollTotal = atkRoll.total

    // Determine hit or miss based on target AC
    let hit = false
    let tn = 20 - targetAc
    console.log(`Attack roll ${atkRoll.total} hits AC [20 - ${atkRoll.total} => ] ${eval(20 - atkRoll.total)}`)
    if (naturalRoll == 20) {
      console.log("Natural 20 always crit hits!")
      label += `<br /><span style='color:#2ECC71'><b>critical hit!</b></span>`
      hit = true
    } else if (naturalRoll == 1) {
      console.log("Natural 1 always crit misses!")
      label += "<br /><span style='color:#E90000'><i>critical miss!</i></span>"
    } else if (atkRoll.total >= tn) {
      console.log(`Hit! Attack roll ${atkRoll.total} is greater than or equal to [20 - ${targetAc} => ] ${tn}.`)
      if (targetName != "") {
        label += `<br /><b>hit!</b>`
      } else {
        label += `<br />hits <b>AC ${eval(20 - atkRoll.total)}</b>`
      }
      hit = true
    } else {
      console.log(`Miss! Attack roll ${atkRoll.total} is less than [20 - ${targetAc} => ] ${tn}.`)
      if (targetName != "") {
        label += `<br /><i>miss.</i>`
      } else {
        label += `<br /><i>misses AC 9.</i>`
      }
    }

    // If the attack hit, we roll damage automatically and include it in the chat message
    if (hit && rollData.item.damage) {
      if (rollData.item.melee) {
        dmgFormula = `${rollData.item.damage} + @str.dmgMod + @item.dmgMod`
      } else if (rollData.item.missile) {
        dmgFormula = `${rollData.item.damage} + @item.dmgMod`
      } else {
        dmgFormula = `${rollData.item.damage}`
      }
      console.log("Damage formula:", dmgFormula)

      // Invoke the damage roll
      const dmgRoll = new Roll(dmgFormula, rollData);
      // Resolve the roll
      let result = await dmgRoll.roll({async: true});
      console.log("Damage result: ", dmgRoll)

      // Render the damage-roll chat card
      damageRoll = `
        <h4 class="dice-damage">Rolling damage...</h4>
        <div class="dice-roll">
          <div class="dice-result">
            <div class="dice-formula">${dmgRoll.formula}</div>
            <div class="dice-tooltip">
              <section class="tooltip-part">
                <div class="dice">`
      // Add dice-roll summaries to the chat card
      dmgRoll.dice.forEach(dice => {
        damageRoll += `
                  <header class="part-header flexrow">
                    <span class="part-formula">${dice.number}d${dice.faces}</span>
                    <span><ol class="dice-rolls">`
        dice.values.forEach(val => {
          if (val == 1) {
            damageRoll += `<li class="roll die d${dice.faces} min">${val}</li>`
          } else if (val == dice.faces) {
            damageRoll += `<li class="roll die d${dice.faces} max">${val}</li>`
          } else {
            damageRoll += `<li class="roll die d${dice.faces}">${val}</li>`
          }
        })  
        damageRoll += `
                      </ol></span>
                    <span class="part-total">${dice.total}</span>
                  </header>`
      })
      // Finish the damage-roll chat card
      damageRoll += `
                  <!-- </ol> -->
                </div>
              </section>
            </div>
            <h4 class="dice-formula"><span class="dice-damage">${dmgRoll.total} HP damage!</span></h4>
          </div>
        </div>
        `
    }

    // Render the full attack-roll chat card, with damage if any
    let msgContent = ``
    msgContent = `
    <div class="message-content">
      <div class="dice-roll">
        <div class="dice-result">
          <div class="dice-formula">${atkRoll.formula}</div>
          <div class="dice-tooltip">
            <section class="tooltip-part">
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
      ${damageRoll}
    </div>
    `
    
    // Prettify label
    label = "<h3>" + label + "</h3>"

    // Output attack roll result to a chat message
    let chatMsg = await atkRoll.toMessage({
      speaker: speaker,
      flavor: label
    },{
      rollMode: rollData.item.rollMode,
      create: false
    })

    chatMsg.content = msgContent
    // console.log("Chat test:", chatMsg)
    ChatMessage.create(chatMsg)
    return atkRoll

  }

  /**
   * Handle item check rolls.
   */
  async rollCheck() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor })
    const rollMode = game.settings.get('core', 'rollMode')
    let label = ""
    let itemName = ""
    if (item.system.friendlyName != "") {
      itemName = item.system.friendlyName
    } else {
      itemName = item.name
    }

    // If there's no roll formula, send a chat message.
    if (!this.system.formula && !this.system.formula) {
      // Vanilla label
      label = `<h3>${itemName} [${item.type}]</h3>`
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? ''
      });
      return null
    }

    // Create a roll and send a chat message from it.
    // Retrieve roll data from the item
    const rollData = this.getRollData();
    console.log("Item roll data:", rollData)
    // Declare vars
    let rollFormula
    
    // Setup roll formula
    label = `${itemName} roll...`
    rollFormula = `${rollData.item.formula} + ${rollData.item.sitMod}`

    console.log("Roll formula:", rollFormula)
    // Invoke the roll and submit it to chat.
    const roll = new Roll(rollFormula, rollData);
    // Resolve the roll
    let result = await roll.roll({async: true});
    console.log("Roll result: ", roll)

    // Determine success or failure if we have a target number
    if (rollData.item.tn != '' && rollData.item.tn != 'undefined') {
      // Item checks are roll-under for success
      if(roll.total <= rollData.item.tn) {
        console.log(roll.total + " is less than or equal to " + rollData.item.tn + "!")
        label += "<br /><b>Success</b>!"
      } else {
        console.log(roll.total + " is greater than " + rollData.item.tn + "!")
        label += "<br /><i>Fail</i>."
      }
    } else {
      // No target number supplied
      console.log("No target number for " + roll.total)
    }

    // Output roll result to a chat message
    let chatMsg = await roll.toMessage({
      speaker: speaker,
      flavor: label
    },{
      rollMode: rollData.item.rollMode
    })
    console.log(chatMsg)
    return roll
  }
}
