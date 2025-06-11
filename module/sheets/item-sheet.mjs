import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import HYP3EItemSetAnnotations from "../helpers/item-set-annotations.mjs";
import HYP3EItemSetDmgTypes from "../helpers/item-set-dmg-types.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class Hyp3eItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hyp3e", "sheet", "item"],
      width: 520,
      height: 500,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  static ITEM_ANNOTATIONS_APP = new HYP3EItemSetAnnotations();
  static ITEM_SET_DMG_TYPES_APP = new HYP3EItemSetDmgTypes();

  /** @override */
  get template() {
    const path = `${CONFIG.HYP3E.templatePath}/item`;
    // Use the following return statement to get a unique item sheet by type, 
    // like `item-weapon-sheet.hbs`.
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve base data structure.
    const context = super.getData();
    context.isGM = game.user.isGM

    // context.editable = this.isEditable

    // Use a safe clone of the item data for further operations.
    const itemData = context.item;

    // Retrieve the actor's roll data for TinyMCE editors.
    context.rollData = {};
    const actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData()
    }

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.item.effects);

    // Add the item's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;

    // Log item context data
    if (CONFIG.HYP3E.debugMessages) { console.log("Item Context Data:", context) }

    // Enrich the description field for TinyMCE editors.
    context.enrichedDescription = await TextEditor.enrichHTML(
        context.system.description,
        { 
            rollData: context.rollData, 
            async: true 
        }
    );
    context.enrichedRealDescription = await TextEditor.enrichHTML(
        context.system.realDescription,
        { 
            rollData: context.rollData, 
            async: true 
        }
    );
    // console.log("Roll Data in ItemSheet:", context.rollData);
    // console.log("Enriched HTML:", context.enrichedDescription);

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
        context.weaponTypes = CONFIG.HYP3E.weaponTypes
        // if (CONFIG.HYP3E.debugMessages) { console.log("Item weapon types:", context.weaponTypes) }
    }

    // Handle armor types
    if (context.item.type == 'armor') {
      context.armorTypes = CONFIG.HYP3E.armorTypes
    //   if (CONFIG.HYP3E.debugMessages) { console.log("Item armor types:", context.armorTypes) }
      context.system.isShield = context.system.type == "shield" ? true : false
    //   if (CONFIG.HYP3E.debugMessages) { console.log(`Shield: ${context.system.isShield}`) }
    }

    // Handle weapon annotations
    if (context.item.type == 'weapon') {
        context.weaponAnnotations = CONFIG.HYP3E.weaponAnnotations
        if (CONFIG.HYP3E.debugMessages) { console.log("Item weapon annotations:", context.weaponAnnotations) }
        // Refresh the annotations list for the item sheet
        context.annotList = []
        try {
            context.system.annotations.forEach(annot => {
                context.annotList.push(context.weaponAnnotations[annot])
            })
        } catch (err) {
            console.log("Error loading weapon annotations:", err)
        }
    }

    // Handle weapon & spell alternate damage types
    if (context.item.type == 'weapon' || context.item.type == 'spell') {
        context.damageTypes = CONFIG.HYP3E.damageTypes
        if (CONFIG.HYP3E.debugMessages) { console.log("Item alt dmg types:", context.damageTypes) }
    }

    // Handle blind roll true/false for any item types
    context.blindRollOpts = CONFIG.HYP3E.blindRollOpts
    // if (CONFIG.HYP3E.debugMessages) { console.log("Item blind roll options:", context.blindRollOpts) }

    // Handle system roll modes
    context.rollModes = CONFIG.Dice.rollModes
    // if (CONFIG.HYP3E.debugMessages) { console.log("Item roll modes:", context.rollModes) }

    // Handle saving throws for any item types
    context.saveThrows = CONFIG.HYP3E.saves
    // if (CONFIG.HYP3E.debugMessages) { console.log("Item saves:", context.saveThrows) }

  }

  async _updateObject(event, formData) {
    // Only applies to weapons, armor, and physical items.
    if (!["weapon", "armor", "item"].includes(this.object.type)) {
        // If the item is not a weapon, armor, or physical item, we don't need to update the name and description.
        return super._updateObject(event, formData);
    }

    if (CONFIG.HYP3E.debugMessages) {
        // Log current identified state
        console.log("Form data identified:", foundry.utils.getProperty(formData, "system.identified"))
        console.log("Object data identified:", this.object.system.identified)
    }
    // const isIdentified = foundry.utils.getProperty(formData, "system.identified");
    const isIdentified = this.object.system.identified;

    // Apply name and description based on identification state.
    if (isIdentified) {
        const realName = foundry.utils.getProperty(formData, "system.realName") || this.object.system.realName;
        const realDesc = foundry.utils.getProperty(formData, "system.realDescription") || this.object.system.realDescription;

        formData["name"] = realName;
        formData["system.description"] = realDesc;
    } else {
        let aliasName = foundry.utils.getProperty(formData, "system.itemAlias") || this.object.system.itemAlias;
        const aliasDesc = foundry.utils.getProperty(formData, "system.aliasDescription") || this.object.system.aliasDescription;

        // Ensure aliasName is not empty or just whitespace
        if (!aliasName || aliasName.trim() === "") {
            aliasName = "Unidentified Item";
            formData["system.itemAlias"] = aliasName;
        }

        formData["name"] = aliasName?.trim();
        formData["system.description"] = aliasDesc;
    }

    return super._updateObject(event, formData);
  }


  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // If the sheet is not editable, do nothing.
    if (!this.isEditable) return;

    // Everything below here is only needed if the sheet is editable

    // Roll handlers, click handlers, etc. would go here.

    // Rollable elements
    html.find('.rollable').click(this._onRoll.bind(this));

    // Handle item name/realName changes, only if the item is identified
    html.find('.item-name').change(async (event) => {
        const name = event.target.value.trim();
        if (this.item.system.identified) {
            // if (CONFIG.HYP3E.debugMessages) { console.log(`Item name changed to: ${name}`) }
            if (name !== this.item.name) {
                await this.item.update({ name: name });
                // if (CONFIG.HYP3E.debugMessages) { console.log(`Item name updated to: ${name}`) }
            }
        }
    });
    // Handle item name/itemAlias changes, only if the item is not identified
    html.find('.item-alias').change(async (event) => {
        const alias = event.target.value.trim();
        if (!this.item.system.identified) {
            // if (CONFIG.HYP3E.debugMessages) { console.log(`Item alias changed to: ${alias}`) }
            if (alias !== this.item.name) {
                await this.item.update({ name: alias });
                // if (CONFIG.HYP3E.debugMessages) { console.log(`Item alias updated to: ${alias}`) }
            }
        }
    });

    // Handle item status identified / not identified
    html.find(".identified").click(async (event) => {
        const identified = event.target.checked
        // if (CONFIG.HYP3E.debugMessages) { console.log(`Checkbox system.identified clicked! New 'checked' value: ${identified}.`) }
        this._toggleIdentified(identified)
    });

    // Toggle weapon attack type melee/missile
    html.find(".weapon-type").click(async (event) => {
      const attackType = $(event.currentTarget).data("attackType")
      if (CONFIG.HYP3E.debugMessages) { console.log("Attack Type click: ", attackType) }
      this._updateAtkType(attackType)
    });

    // Set weapon base damage
    html.find('.item-button[data-control="set-dmg-types"]').click((ev) => {
        Hyp3eItemSheet.ITEM_SET_DMG_TYPES_APP.render(true, { itemUuid: this.item.uuid, focus: true });
    });

    // Toggle weapon mastery & grand-mastery true/false
    html.find(".weapon-mastery").click(async (event) => {
      const mastery = $(event.currentTarget).data("mastery")
      if (CONFIG.HYP3E.debugMessages) { console.log("Weapon Mastery click: ", mastery) }
      this._updateWpnMastery(mastery)
    });

    // Set item annotations
    html.find('.item-button[data-control="set-annotations"]').click((ev) => {
        Hyp3eItemSheet.ITEM_ANNOTATIONS_APP.render(true, { itemUuid: this.item.uuid, focus: true });
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.item));

    // console.log("Rendered HTML in sheet:", this.element.find(".editor-content").html());

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
    const formula = element.dataset.formula;
    const flavor = element.dataset.tooltip;
  
    // Log the element
    console.log("Clicked element: ", element)
    // Log the element dataset
    console.log("Element dataset: ", dataset)

    // Perform the roll
    const roll = new Roll(formula);
    roll.toMessage({
        flavor: flavor,
        speaker: ChatMessage.getSpeaker({ actor: this.item.actor })
    });

  }

  /**
   * Handle toggling an item as 'identified' or 'unidentified'
   * @param {*} identified 
   */
  async _toggleIdentified(identified) {
    const item = this.item
    if (identified) {
        // If identified, set item.name to system.realName and item.system.description to item.system.realDescription
        const name = item.system?.realName > "" ? item.system.realName : item.name
        const updates = { name: name, "system.description": item.system.realDescription }
        await item.update(updates)
    } else {
        // If not identified, set item.name to system.itemAlias and item.system.description to item.system.aliasDescription
        const name = item.system?.itemAlias > "" ? item.system.itemAlias : item.name
        const updates = { name: name, "system.description": item.system.aliasDescription }
        await item.update(updates)
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
