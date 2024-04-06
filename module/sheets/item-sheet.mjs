/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class Hyp3eItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["hyp3e", "sheet", "item"],
      width: 520,
      height: 500,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = `${CONFIG.HYP3E.templatePath}/item`;
    // Use the following return statement to get a unique item sheet by type, 
    // like `item-weapon-sheet.hbs`.
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();
    context.isGM = game.user.isGM
    // console.log("Item Context:", context)

    // Use a safe clone of the item data for further operations.
    const itemData = context.item;

    // Retrieve the actor's roll data for TinyMCE editors.
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    // console.log("Item Actor:", actor)
    if (actor) {
      context.rollData = actor.getRollData()
      // context.rollData.isGM = game.user.isGM
    }

    // Add the item's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;

    // Log full context data
    // console.log("Context Data:", context)

    // Prepare item data.
    this._prepareItemData(context);
    
    return context;
  }

  /**
   * Organize and classify data for Item sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItemData(context) {

    // Handle weapon types
    if (context.item.type == 'weapon') {
      // for (let [k, v] of Object.entries(context.item.system.types)) {
      //   console.log(v, game.i18n.localize(CONFIG.HYP3E.weaponTypes[v]))
      //   // v.label = game.i18n.localize(CONFIG.HYP3E.weaponTypes[v]) ?? v;
      // }
    }
    // Handle armor types
    if (context.item.type == 'armor') {
      // for (let [k, v] of Object.entries(context.item.system.types)) {
      //   console.log("Armor Types:", v, game.i18n.localize(CONFIG.HYP3E.armorTypes[v]))
      //   // v.label = game.i18n.localize(CONFIG.HYP3E.armorTypes[v]) ?? v;
      // }
    }

    // Handle saving throws for spells
    if (context.item.type == 'spell') {
      // for (let [k, v] of Object.entries(context.item.system.saves)) {
      //   console.log(v, game.i18n.localize(CONFIG.HYP3E.saves[v]))
      //   // v.label = game.i18n.localize(CONFIG.HYP3E.saves[v]) ?? v;
      // }
    }
    
  }
  
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.

    // Rollable elements
    html.find('.rollable').click(this._onRoll.bind(this));

    // Toggle weapon attack type melee/missile
    html.find(".weapon-type").click(async (event) => {
      const attackType = $(event.currentTarget).data("attackType")
      if (CONFIG.HYP3E.debugMessages) { console.log("Attack Type click: ", attackType) }
      this._updateAtkType(attackType)
    });
    
    // Toggle weapon mastery & grand-mastery true/false
    html.find(".weapon-mastery").click(async (event) => {
      const mastery = $(event.currentTarget).data("mastery")
      if (CONFIG.HYP3E.debugMessages) { console.log("Weapon Mastery click: ", mastery) }
      this._updateWpnMastery(mastery)
    });
    
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
  
    // Log the element
    console.log("Clicked element: ", element)
    // Log the element dataset
    console.log("Element dataset: ", dataset)

    // Now do some useful stuff!
    try {
      // THIS IS ON HOLD FOR NOW. The plan is to use macros in the Description field if desired, 
      //  but also to include these macros as buttons in the Chat window when the display function 
      //  is triggered. Then the user can click whatever bottons are available for Damage, Checks, etc.

      // let item = this.object ?? null;
      // if (item) {
      //   console.log(item)
      //   item.roll()
      // }
    } catch(err) {
      // Log the error
      console.log(err)
    }

  }

  /**
   * Handle weapon attack type, melee vs. missile
   * @param {String} atkType The type of attack
   * @private
   */
  async _updateAtkType(atkType) {
    let result
    switch (atkType) {
      case "melee":
        result = await this.item.update({
          system: {
            melee: !this.item.system.melee,
            type: "melee"
          }
        })
        break
      case "missile":
        result = await this.item.update({
          system: {
            missile: !this.item.system.missile,
            type: "missile"
          }
        })
        break
    }
    if (CONFIG.HYP3E.debugMessages) { console.log("Weapon after update:", result) }
  }  

  /**
   * Handle weapon mastery and grand-mastery
   * @param {String} mastery The mastery level to be updated
   * @private
   */
  async _updateWpnMastery(mastery) {
    let result
    let isMaster = this.item.system.wpnMaster
    let isGrandmaster = this.item.system.wpnGrandmaster
    if (CONFIG.HYP3E.debugMessages) {
      console.log(`Weapon Mastery: ${isMaster}`)
      console.log(`Weapon Grandmastery: ${isGrandmaster}`)
    }
    // Enabling a mastery level should disable the other one. However, disabling a mastery
    //  level does not need to enable the other one -- they can both be false.
    switch (mastery) {
      case "master":
        if (isGrandmaster && !isMaster) {
          // Disable the Grandmastery flag
          if (CONFIG.HYP3E.debugMessages) { console.log(`Enabling Master and disabling Grandmaster.`) }
          result = await this.item.update({
            system: {
              wpnMaster: !isMaster,
              wpnGrandmaster: false,
            }
          })  
        } else {
          // Only update Mastery flag
          if (CONFIG.HYP3E.debugMessages) { console.log(`Flipping Master to ${!isMaster}.`) }
          result = await this.item.update({
            system: {
              wpnMaster: !isMaster,
            }
          })
        }
        break
      case "grandMaster":
        if (!isGrandmaster && isMaster) {
          // Disable the Mastery flag
          if (CONFIG.HYP3E.debugMessages) { console.log(`Enabling Grandmaster and disabling Master.`) }
          result = await this.item.update({
            system: {
              wpnMaster: false,
              wpnGrandmaster: !isGrandmaster,
            }
          })
        } else {
          // Only update Grandmastery flag
          if (CONFIG.HYP3E.debugMessages) { console.log(`Flipping Grandmaster to ${!isGrandmaster}.`) }
          result = await this.item.update({
            system: {
              wpnGrandmaster: !isGrandmaster,
            }
          })
        }
        break
    }
    if (CONFIG.HYP3E.debugMessages) { console.log("Weapon after update:", result) }
  }  

}
