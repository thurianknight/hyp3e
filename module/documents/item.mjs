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
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    let label = `<h3>[${item.type}] ${item.name}</h3>`;

    // If there's no roll data, send a chat message.
    if (!this.system.attack && !this.system.check && !this.system.formula) {
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
      // Prioritize attack rolls > checks > formula
      let rollFormula
      if (rollData.item.attack) {
        rollFormula = `${rollData.item.attack} + ${rollData.item.sitMod}`
      } else if (rollData.item.check) {
        rollFormula = `${rollData.item.check} + ${rollData.item.sitMod}`
      } else {
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
        if (rollData.item.check) {
          if(roll.total <= rollData.item.target) {
            console.log(roll.total + " is less than or equal to " + rollData.item.target + "!")
            label += "<b>Success</b>!"
          } else {
            console.log(roll.total + " is greater than " + rollData.item.target + "!")
            label += "<i>Fail</i>."
          }
        // Attack rolls are roll-over for success
        //  Unless the code is changed to handle targeting an AC, the 'attack' logic will never trigger here
        } else if (rollData.item.attack) {
          if(roll.total >= rollData.item.target) {
            console.log(roll.total + " is greater than or equal to " + rollData.item.target + "!")
            label += "<b>Hits</b>!"
          } else {
            console.log(roll.total + " is less than " + rollData.item.target + "!")
            label += "<i>Misses</i>."
          }  
        }
      } else {
        // No target number supplied, as is common with attacks
        if (rollData.item.attack) {
          console.log(roll.total)
          console.log(roll.total + " hits AC 19 - " + roll.total + " = " + eval(19 - roll.total))
          let naturalRoll = roll.dice[0].total
          if (naturalRoll == 1) {
            label += "<span style='color:#E90000'>hits <b>AC " + eval(19 - roll.total) + "</b>!</span>"
          } else if (naturalRoll == 20) {
            label += "<span style='color:#2ECC71'>hits <b>AC " + eval(19 - roll.total) + "</b>!</span>"
          } else {
            label += "hits <b>AC " + eval(19 - roll.total) + "</b>!"
          }
        }
      }

      // Output roll result to a chat message
      roll.toMessage({
        speaker: speaker,
        flavor: label
      },{
        rollMode: rollData.item.rollMode
      });
      return roll;
    }
  }
}
