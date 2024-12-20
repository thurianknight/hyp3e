import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import {Hyp3eDice} from "../dice.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class Hyp3eActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hyp3e", "sheet", "actor"],
      width: 800,
      height: 700,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "abilities" }]
    });
  }

  /** @override */
  get template() {
    const path = `${CONFIG.HYP3E.templatePath}/actor`;
    // Use the following return statement to get a unique actor sheet by type, 
    // like `actor-character-sheet.hbs`.
    return `${path}/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    if (CONFIG.HYP3E.debugMessages) { console.log("Getting actor sheet data...") }

    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();
    if (CONFIG.HYP3E.debugMessages) { console.log("Actor Sheet Context:", context) }

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);
    if (CONFIG.HYP3E.debugMessages) { console.log("Actor Data:", actorData) }

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;
    
    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }
    
    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
      this._prepareNpcData(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    // Log the actor's data
    if (CONFIG.HYP3E.debugMessages) { console.log("Actor sheet data complete:", context) }

    return context;
  }

  /**
   * Organize and classify Data for Character sheets.
   *
   * @param {Object} context The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {

    // Handle attribute scores
    for (let [k, v] of Object.entries(context.system.attributes)) {
      v.label = game.i18n.localize(CONFIG.HYP3E.attributeAbbreviations[k]) ?? k;
      if (CONFIG.HYP3E.debugMessages) { console.log("Attributes:", k, v, v.label) }
    }

    // Handle movement types
    for (let [k, v] of Object.entries(context.system.movement)) {
      v.label = game.i18n.localize(CONFIG.HYP3E.movement[k]) ?? k;
      if (CONFIG.HYP3E.debugMessages) { console.log("Movement Types:", k, v, v.label) }
    }

    // Handle money types
    for (let [k, v] of Object.entries(context.system.money)) {
      v.label = game.i18n.localize(CONFIG.HYP3E.money[k]) ?? k;
      if (CONFIG.HYP3E.debugMessages) { console.log("Money Types:", k, v, v.label) }
    }

    // The following are global system settings
    context.enableAttrChecks = CONFIG.HYP3E.enableAttrChecks
    if (CONFIG.HYP3E.debugMessages) { console.log("Enable attribute checks:", context.enableAttrChecks) }

    context.characterClasses = CONFIG.HYP3E.characterClasses
    if (CONFIG.HYP3E.debugMessages) { console.log("Actor sheet class list:", context.characterClasses) }

    context.races = CONFIG.HYP3E.races
    if (CONFIG.HYP3E.debugMessages) { console.log("Actor sheet races list:", context.races) }

    context.languages = CONFIG.HYP3E.languages
    if (CONFIG.HYP3E.debugMessages) { console.log("Actor sheet languages:", context.languages) }

    // System-defined roll modes
    context.rollModes = CONFIG.Dice.rollModes
    if (CONFIG.HYP3E.debugMessages) { console.log("Dice-roll modes:", context.rollModes) }

  }

    /**
   * Organize and classify Data for NPC sheets.
   *
   * @param {Object} context The actor to prepare.
   *
   * @return {undefined}
   */
    _prepareNpcData(context) {
        
        // Load creature sizes
        context.creatureSizes = CONFIG.HYP3E.creatureSizes
        if (CONFIG.HYP3E.debugMessages) { console.log("Actor sheet sizes:", context.creatureSizes) }
    
    }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} context The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize item types.
    const containers = [];
    const gear = [];
    const features = [];
    const weapons = [];
    const armor = [];
    const spells = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: []
    };

    let encumbrance = 0
    // Iterate through items, allocating to tab-groups
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Calculate total weight carried by character
      if (CONFIG.HYP3E.debugMessages) { console.log("Item carried:", i) }
      if (i.system.weight) {
        if (i.system.quantity.value) {
          i.system.carriedWt = (i.system.weight * i.system.quantity.value)
          i.system.carriedWt = Math.round(i.system.carriedWt * 10)/10
          encumbrance += (i.system.weight * i.system.quantity.value)
        } else {
          i.system.carriedWt = i.system.weight
          encumbrance += i.system.weight
        }
      }

      // Append to containers.
      if (i.type === 'container' || (i.type === 'item' && i.system.isContainer)) {
        // Get contained items and add to their container
        i.contents = this.getContents(i._id, context)
        containers.push(i);
        // Migrate 'container' type to 'item' & set isContainer flag
        if (i.type === 'container') {
          i.type = 'item'
          i.system.isContainer = true
          // Update the embedded item document
          this.actor.updateEmbeddedDocuments("Item", [
            { _id: i._id, "type": 'item', "system.isContainer": true },
          ])
        }
      }
      // Append to gear that isn't in a container.
      if (i.type === 'item' && i.system.containerId == '' && !i.system.isContainer) {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === 'feature') {
        features.push(i);
      }
      // Append to weapons.
      if (i.type === 'weapon') {
        weapons.push(i);
      }
      // Append to armor.
      if (i.type === 'armor') {
        armor.push(i);
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          spells[i.system.spellLevel].push(i);
        }
      }
    }
    encumbrance = Math.round(encumbrance * 10)/10
    if (CONFIG.HYP3E.debugMessages) { console.log(`Total weight carried: ${encumbrance} pounds`) }

    // Assign and return
    context.encumbrance = encumbrance;
    context.gear = gear;
    context.containers = containers;
    context.features = features;
    context.weapons = weapons;
    context.armor = armor;
    context.spells = spells;
  }

  getContents(id, context) {	
		return context.items.filter(
			({system: {containerId}}) => id === containerId
		);
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-show').click(event => {
      this._displayItemInChat(event);
    });
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    html.find(".item-drop").click((event) => {
      this._toggleItemSummary(event);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Toggle bonus spells true/false
    html.find(".bonus-spell").click(async (event) => {
      const spellLvl = $(event.currentTarget).data("spellLvl")
      this._updateBonusSpell(spellLvl)
    });

    // Decrement or increment consumable item qty
    html.find('.item-qty-sub').click(ev => {
      this._decrementItemQty(ev);
    });
    html.find('.item-qty-add').click(ev => {
      this._incrementItemQty(ev);
    });

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Toggle equip/unequip
    html.find(".item-equip").click(async (event) => {
      const li = $(event.currentTarget).closest(".item-entry")
      const item = this.actor.items.get(li.data("itemId"))
      if (CONFIG.HYP3E.debugMessages) { console.log("Actor item-equip toggle:", item) }
      await item.update({
        system: {
          equipped: !item.system.equipped,
        },
      })
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle adding and removing bonus spells
   * @param {String} spellLvl The bonus spell level to be updated
   * @private
   */
  async _updateBonusSpell(spellLvl) {
    let result
    switch (spellLvl) {
      case "intLvl1":
        await this.actor.updateBonusSpell(spellLvl, !this.actor.system.attributes.int.bonusSpells.lvl1)
        break
      case "intLvl2":
        await this.actor.updateBonusSpell(spellLvl, !this.actor.system.attributes.int.bonusSpells.lvl2)
        break
      case "intLvl3":
        await this.actor.updateBonusSpell(spellLvl, !this.actor.system.attributes.int.bonusSpells.lvl3)
        break
      case "intLvl4":
        await this.actor.updateBonusSpell(spellLvl, !this.actor.system.attributes.int.bonusSpells.lvl4)
        break
      case "wisLvl1":
        await this.actor.updateBonusSpell(spellLvl, !this.actor.system.attributes.wis.bonusSpells.lvl1)
        break
      case "wisLvl2":
        await this.actor.updateBonusSpell(spellLvl, !this.actor.system.attributes.wis.bonusSpells.lvl2)
        break
      case "wisLvl3":
        await this.actor.updateBonusSpell(spellLvl, !this.actor.system.attributes.wis.bonusSpells.lvl3)
        break
      case "wisLvl4":
        await this.actor.updateBonusSpell(spellLvl, !this.actor.system.attributes.wis.bonusSpells.lvl4)
        break
    }
    this.render(true)
    if (CONFIG.HYP3E.debugMessages) { console.log("Actor after sheet update:", this.actor.system) }
  }

  /**
   * Handle decrementing a consumable item's qty
   * @param {Event} event The originating click event
   * @private
   */
  async _decrementItemQty(event) {
    const li = $(event.currentTarget).closest(".item-entry")
    const item = this.actor.items.get(li.data("itemId"))
    if (item.system.quantity.value > 0) {
      if (CONFIG.HYP3E.debugMessages) { console.log("Decrement item:", item) }
      // Update the embedded item document
      this.actor.updateEmbeddedDocuments("Item", [
        { _id: item.id, "system.quantity.value": item.system.quantity.value-1 },
      ]);
    }
  }

  /**
   * Handle incrementing a consumable item's qty
   * @param {Event} event The originating click event
   * @private
   */
  async _incrementItemQty(event) {
    const li = $(event.currentTarget).closest(".item-entry")
    const item = this.actor.items.get(li.data("itemId"))
    if (item.system.quantity.value < item.system.quantity.max) {
      if (CONFIG.HYP3E.debugMessages) { console.log("Increment item:", item) }
      // Update the embedded item document
      this.actor.updateEmbeddedDocuments("Item", [
        { _id: item.id, "system.quantity.value": item.system.quantity.value+1 },
      ]);
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data
    };
    // Remove the type from the dataset since it's in the itemData.type property
    delete itemData.system["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  /**
   * Handle toggling an Item description in the character sheet.
   * @param {Event} event   The originating click event
   * @private
   */
  _toggleItemSummary(event) {
    event.preventDefault()
    const itemSummary = event.currentTarget
      .closest(".item-entry.item")
      .querySelector(".item-summary");
    if (itemSummary.style.display === "") {
      itemSummary.style.display = "block"
    } else {
      itemSummary.style.display = ""
    }
  }

  /**
   * Handle displaying an Item description in the chat.
   * @param {Event} event   The originating click event
   * @private
   */
  async _displayItemInChat(event) {
    const li = $(event.currentTarget).closest(".item-entry")
    const item = this.actor.items.get(li.data("itemId"))
    const actor = this.actor
    const actorData = actor.system
    // const speaker = ChatMessage.getSpeaker()

    // Use the item's display function to do it
    item._displayItemInChat()

    // // The system uses the term 'feature' under the covers, but Hyperborea uses 'ability'
    // let typeLabel = ""
    // if (item.type == 'feature') {
    //   typeLabel = 'Ability'
    // } else {
    //   typeLabel = (item.type).capitalize()
    // }
    // // Replace names like "Bow, composite, long" with something that looks nicer
    // let itemName = ""
    // if (item.system.friendlyName != "") {
    //   itemName = item.system.friendlyName
    // } else {
    //   itemName = item.name
    // }

    // // Chat message header text
    // const label = `<h3>${typeLabel}: ${itemName}</h3>`
    
    // if (CONFIG.HYP3E.debugMessages) { console.log("Item clicked:", item) }
    // let content = item.system.description

    // // Setup clickable buttons for item properties if they have a roll macro,
    // //  otherwise just display the value.

    // // Features/Abilities
    // if (item.type == 'feature') {
    //   if (item.system.formula && item.system.tn) {
    //     // Display the ability check roll with target number
    //     content += `<p>Ability Check: ${item.system.formula} equal or under ${item.system.tn}</p>`
    //   }
    // }

    // // Weapons
    // if (item.type == 'weapon') {
    //   if (item.system.rof) {
    //     // Display missile rate of fire or melee attack rate
    //     content += `<p>Atk Rate: ${item.system.rof}</p>`
    //   }
    //   if (item.system.type == 'missile') {
    //     // For a missile weapon we display the range increments
    //     content += `<p>Range: ${item.system.range.short} / ${item.system.range.medium} / ${item.system.range.long}</p>`
    //   } else {
    //     // For melee weapons we display the weapon class
    //     content += `<p>Wpn Class: ${item.system.wc}</p>`
    //   }
    //   if (item.system.damage) {
    //     if (Roll.validate(item.system.damage)) {
    //         // Resolve damage string & variables to a rollable formula
    //         const roll = new Roll(item.system.damage, actorData)
    //         if (CONFIG.HYP3E.debugMessages) { console.log("Weapon damage roll: ", roll) }
    //         content += `<div class='dmg-roll-button' data-formula='${roll.formula}'></div>`;
    //     } else {
    //         content += `<p>Damage: ${item.system.damage}</p>`
    //     }
    //   }
    // }

    // // Spells
    // if (item.type == 'spell') {
    //   if (item.system.range) {
    //     // Display the range
    //     content += `<p>Range: ${item.system.range}</p>`
    //   }
    //   if (item.system.duration) {
    //     if ((item.system.duration).match(/.*d[1-9].*/)) {
    //       // Add a duration roll macro
    //       content += `<p>Duration: [[/r ${item.system.duration}]]</p>`
    //     } else {
    //       // If duration is not variable, simply display the value
    //       content += `<p>Duration: ${item.system.duration}</p>`
    //     }
    //   }
    //   if (item.system.affected) {
    //     if ((item.system.affected).match(/.*d[1-9].*/)) {
    //       // Add a number affected roll macro
    //       content += `<p># Affected: [[/r ${item.system.affected}</p>`
    //     } else {
    //       content += `<p># Affected: ${item.system.affected}</p>`
    //     }
    //   }
    //   if (item.system.save) {
    //     content += `<p> Save: ${item.system.save}</p>`
    //   }
    //   if (item.system.damage) {
    //     if (Roll.validate(item.system.damage)) {
    //         // Resolve damage string & variables to a rollable formula
    //         const roll = new Roll(item.system.damage, actorData)
    //         if (CONFIG.HYP3E.debugMessages) { console.log("Spell damage roll: ", roll) }
    //         content += `<div class='dmg-roll-button' data-formula='${roll.formula}'></div>`;
    //     } else {
    //         content += `<p>Damage: ${item.system.damage}</p>`
    //     }
    //   }      
    // }

    // // Item
    // if (item.type == 'item') {
    //   if (item.system.formula && item.system.tn) {
    //     // Display the item check roll with target number
    //     content += `<p>Item Check: ${item.system.formula} equal or under ${item.system.tn}</p>`
    //   }
    // }

    // // Now we can display the chat message
    // ChatMessage.create({
    //   speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    //   flavor: label,
    //   content: content ?? ''
    // })
  }

  _onSortItem(event, itemData) {
    if (CONFIG.HYP3E.debugMessages) { console.log("Sort Item Event:", event) }
    if (CONFIG.HYP3E.debugMessages) { console.log("Sort Item Data:", itemData) }

    // Get the drag source and drop target
    const items = this.actor.items;
    const source = items.get(itemData._id);
    if (CONFIG.HYP3E.debugMessages) { console.log("Sort Item Source:", source) }

    const dropTarget = event.target.closest("[data-item-id]");
    if ( !dropTarget ) return;
    if (CONFIG.HYP3E.debugMessages) { console.log("Drop Target:", dropTarget) }

    const target = items.get(dropTarget.dataset.itemId);
    if (CONFIG.HYP3E.debugMessages) { console.log("Sort Item Target:", target) }

    // Don't sort on yourself
    if ( source.id === target.id ) return;

    // if (!target) throw new Error("Couldn't drop near " + event.target);
    // const targetData = target?.system;

    // Dragging an item into a container sets its containerId and location to the container
    if ( (target?.type === "container" || target?.system.isContainer) ) {
      // One container cannot hold another container
      if (source.type === 'container' || source.system.isContainer) { 
        if (CONFIG.HYP3E.debugMessages) { console.log(`Cannot move container (${source.name}) into another container (${target.name})!`) }
        return 
      }

      // Update the container info on the item
      this.actor.updateEmbeddedDocuments("Item", [
        { _id: source.id, "system.containerId": target.id, "system.location": target.name },
      ]);
      return;
    }
    // Dragging an item out over a non-container resets its containerId and location to blank
    if (source?.system.containerId !== "") {
      this.actor.updateEmbeddedDocuments("Item", [
        { _id: source.id, "system.containerId": "", "system.location": "" },
      ]);
    }
    // Now call the Foundry core _onSortItem event so we don't break anything
    super._onSortItem(event, itemData);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    event.preventDefault()
    const element = event.currentTarget
    const dataset = element.dataset

    // Log the element
    if (CONFIG.HYP3E.debugMessages) { console.log("Clicked element: ", element) }
    // Log the element dataset
    if (CONFIG.HYP3E.debugMessages) { console.log("Element dataset: ", dataset) }
    // Log the actor
    if (CONFIG.HYP3E.debugMessages) { console.log("Current Actor:", this.actor) }

    // How many different roll types do we have?
    //  Test of Attribute: d6 roll-under target
    //    Formula & TN built into character sheet, GM may adjust via situational mod
    //  Feat of Attribute: d100 roll-under target
    //    Formula & TN built into character sheet, GM may adjust via situational mod
    //  Task Resolution check: d6 roll-under target
    //    Formula & TN built into character sheet, GM may adjust via situational mod
    //  IN and WS concentration checks (optional): 3d6 roll-under target
    //    Formula & TN built into character sheet, GM may adjust via situational mod
    //  Reaction check: 2d6 + CH Reaction mod, and compare to reaction table
    //    Formula built into character sheet, GM may adjust via situational mod
    //  Hit dice: dX + CN HP mod, and display the total
    //    Formula built into character sheet, no TN needed
    //  Saving throws: d20 roll-over target
    //    Formula & TN built into character sheet, GM may adjust
    //  Item-based rolls:
    //    Class ability checks, esp. thief skills: varies, but usually d6 or d12 roll-under target
    //      Formula & TN can be built into ability => item sheet of type "feature"
    //    Turning undead (subset of class abilities): d12 roll-under target
    //      Formula can be built into turning ability => item sheet of type "feature"
    //    Attack rolls: d20 roll-over target
    //      Formula can be built into weapon => item sheet of type "weapon"
    //    Damage rolls: dX and sum total
    //      Formula can be built into weapon => item sheet of type "weapon"
    //    Spell duration, number affected, etc.: varies
    //      Formulas can be built into spell => item sheet of type "spell"

    try {
      // What is our roll type?
      if (CONFIG.HYP3E.debugMessages) { console.log("Roll Type:", dataset.rollType) }

      dataset.itemId = ""
      dataset.baseClass = this.actor.system.baseClass

      switch (dataset.rollType) {
        case "item":
          const itemId = element.closest('.item').dataset.itemId
          // Set item ID in roll dataset
          dataset.itemId = itemId
          this.actor.rollItem(dataset)
          break
  
        case "check":
          this.actor.rollCheck(dataset)
          break

        case "attack":
          this.actor.rollAttackOrSpell(dataset)
          break

        case "save":
          this.actor.rollSave(dataset)
          break

        case "basic":
          this.actor.rollBasic(dataset)
          break

        case "reaction":
          this.actor.rollReaction(dataset)
          break
  
        case "setAttr":
          // Take the attribute scores and class, and lookup/calculate modifiers
          let returnOk = await this.actor.SetAttributeMods(dataset)
          if (returnOk) {
            this.render()
          }
          break

        default:
          // This should never happen, all rolls should have a roll-type
          ui.notifications.info("No Roll Type provided, this should never happen...")
          console.log("No Roll Type provided, this should never happen...");

      }
      
    } catch(err) {
      // Log the error
      console.log("_onRoll Error: ", err)
    }
  }

}
