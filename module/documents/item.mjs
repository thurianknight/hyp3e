// import { HYP3E } from "./helpers/config.mjs";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class Hyp3eItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();

    // Get the Item's data
    const itemData = this;
    const actorData = this.actor ? this.actor : {};
    const data = itemData;
    
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
   getRollData() {
    // If present, return the actor's roll data.
    if ( !this.actor ) return null;
    const rollData = this.actor.getRollData();
    // Grab the item's system data as well.
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
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

    // If there's no roll data, send a chat message.
    if (!this.system.attack) {
      // Vanilla label
      label = `<h3>${item.name} [${item.type}]</h3>`
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? ''
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data from the item
      const rollData = this.getRollData();
      console.log("Item roll data:", rollData)
      // Declare vars
      let naturalRoll = 0
      let dieType
      let rollFormula
      let rollTotal
      let dmgFormula
      let dmgTotal
      let damageRoll = ''
      
      // This is an attack roll
      label = `Attack with ${item.name}...`
      rollFormula = `${rollData.item.attack} + ${rollData.item.sitMod}`

      console.log("Roll formula:", rollFormula)
      // Invoke the roll
      const roll = new Roll(rollFormula, rollData);
      // Resolve the roll
      let result = await roll.roll({async: true});
      console.log("Roll result: ", roll)
      // Get the resulting values from the roll object
      naturalRoll = roll.dice[0].total
      dieType = "d" + roll.dice[0].faces
      rollTotal = roll.total

      // Determine success or failure if we have a target number
      if (rollData.item.target != '' && rollData.item.target != 'undefined') {
        // Attacks will never trigger here, until we get targeting functionality added
        if(roll.total >= rollData.item.target) {
          console.log(roll.total + " is greater than or equal to " + rollData.item.target + "!")
          if (naturalRoll == 20) {
            label += "<span style='color:#2ECC71'><b>critically hits!</b></span>"
          } else {
            label += "<b>hits!</b>"
          }
        } else {
          console.log(roll.total + " is less than " + rollData.item.target + "!")
          if (naturalRoll == 1) {
            label += "<span style='color:#E90000'><i>critically misses!</i></span>"
          } else {
            label += "<i>misses.</i>"
          }
        }
      } else {
        // No target number supplied, as is common with attacks
        console.log(roll.total)
        console.log(roll.total + " hits AC 19 - " + roll.total + " = " + eval(19 - roll.total))
        if (naturalRoll == 20) {
          label += "<span style='color:#2ECC71'>critically hits <b>AC " + eval(19 - roll.total) + "!</b></span>"
        } else if (naturalRoll == 1) {
          label += "<span style='color:#E90000'><i>critically misses!</i></span>"
        } else {
          label += "hits <b>AC " + eval(19 - roll.total) + ".</b>"
        }
      }

      // Since this is an attack, we roll damage automatically and include it in the chat message
      if (rollData.item.damage) {
        if (rollData.item.melee) {
          dmgFormula = `${rollData.item.damage} + ${rollData.item.dmgMod} + ${rollData.str.dmgMod}`
        } else if (rollData.item.missile) {
          dmgFormula = `${rollData.item.damage} + ${rollData.item.dmgMod}`
        } else {
          dmgFormula = `${rollData.item.damage}`
        }
        console.log("Damage formula:", dmgFormula)

        // Invoke the roll
        const roll = new Roll(rollFormula, rollData);
        // Resolve the roll
        let result = await roll.roll({async: true});
        console.log("Damage result: ", roll)
        // Get the resulting values from the roll object
        dmgTotal = roll.total
        if (naturalRoll != 1) {
          damageRoll = `
          <div class="dice-roll">
            <div class="dice-result">
              <h4 class="dice-formula"><span class="dice-damage">${dmgTotal} HP damage to target</span></h4>
            </div>
          </div>
          `  
        }
      }

      // Render the chat message template
      let msgContent = ``
      let templateData = {
        formula: roll.formula,
        naturalRoll: naturalRoll,
        dieType: dieType,
        rollTotal: rollTotal
      };
      // const template = `${HYP3E.systemRoot}/templates/chat/roll-attack.hbs`
      // let rendered = await renderTemplate(template, templateData)
      // msgContent += rendered;
      msgContent = `
      <div class="message-content">
        <div class="dice-roll">
          <div class="dice-result">
            <div class="dice-formula">${roll.formula}</div>
            <div class="dice-tooltip">
              <section class="tooltip-part">
                <div class="dice">
                  <header class="part-header flexrow">
                    <span class="part-formula">${dieType}</span>                
                    <span class="part-total">${naturalRoll}</span>
                  </header>
                  <ol class="dice-rolls">
                    <li class="roll die ${dieType}">${naturalRoll}</li>
                  </ol>
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
      // Output roll result to a chat message
      let chatMsg = await roll.toMessage({
        speaker: speaker,
        flavor: label
      },{
        rollMode: rollData.item.rollMode,
        create: false
      })
      // chatMsg.content += "<p>This is a test.</p>"
      chatMsg.content = msgContent
      console.log("Chat test:", chatMsg)
      ChatMessage.create(chatMsg)
      return roll
    }
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

    // If there's no roll data, send a chat message.
    if (!this.system.check && !this.system.formula) {
      // Vanilla label
      label = `<h3>${item.name} [${item.type}]</h3>`
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? ''
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data from the item
      const rollData = this.getRollData();
      console.log("Item roll data:", rollData)
      // Declare vars
      let rollFormula
      
      // Prioritize checks > formula
      if (rollData.item.check) {
        label = `${item.name} check...`
        rollFormula = `${rollData.item.check} + ${rollData.item.sitMod}`
      } else {
        label = `${item.name} roll...`
        rollFormula = `${rollData.item.formula} + ${rollData.item.sitMod}`
      }
      console.log("Roll formula:", rollFormula)
      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollFormula, rollData);
      // Resolve the roll
      let result = await roll.roll({async: true});
      console.log("Roll result: ", roll)

      // Determine success or failure if we have a target number
      if (rollData.item.target != '' && rollData.item.target != 'undefined') {
        // Item checks are roll-under for success
        if(roll.total <= rollData.item.target) {
          console.log(roll.total + " is less than or equal to " + rollData.item.target + "!")
          label += "<b>Success</b>!"
        } else {
          console.log(roll.total + " is greater than " + rollData.item.target + "!")
          label += "<i>Fail</i>."
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
}
