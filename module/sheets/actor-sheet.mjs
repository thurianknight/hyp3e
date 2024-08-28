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

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

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
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {

    // Handle attribute scores
    for (let [k, v] of Object.entries(context.system.attributes)) {
      v.label = game.i18n.localize(CONFIG.HYP3E.attributeAbbreviations[k]) ?? k;
      if (CONFIG.HYP3E.debugMessages) { console.log("Attributes:", k, v, v.label) }
    }

    // Handle exploration skills
    for (let [k, v] of Object.entries(context.system.explorationSkills)) {
      v.label = game.i18n.localize(CONFIG.HYP3E.explorationSkills[k]) ?? k;
      if (CONFIG.HYP3E.debugMessages) { console.log("Exploration Skills:", k, v, v.label) }
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
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
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
        encumbrance += i.system.weight
      }

      // Append to containers.
      if (i.type === 'container') {
        i.contents = this.getContents(i._id, context)
        containers.push(i);
      }
      // Append to gear.
      if (i.type === 'item' && i.system.containerId == '') {
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
    html.find('.item-show').click(ev => {
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
      this._updateBonusSpells(spellLvl)
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
   * Handle addding and removing bonus spells
   * @param {String} spellLvl The bonus spell level to be updated
   * @private
   */
  async _updateBonusSpells(spellLvl) {
    let result
    switch (spellLvl) {
      case "intLvl1":
        result = await this.actor.update({
          system: {
            attributes: {
              int: {
                bonusSpells: {
                  lvl1: !this.actor.system.attributes.int.bonusSpells.lvl1,
                }
              }
            }
          }
        })
        break
      case "intLvl2":
        result = await this.actor.update({
          system: {
            attributes: {
              int: {
                bonusSpells: {
                  lvl2: !this.actor.system.attributes.int.bonusSpells.lvl2,
                }
              }
            }
          }
        })
        break
      case "intLvl3":
        result = await this.actor.update({
          system: {
            attributes: {
              int: {
                bonusSpells: {
                  lvl3: !this.actor.system.attributes.int.bonusSpells.lvl3,
                }
              }
            }
          }
        })
        break
        case "intLvl4":
          result = await this.actor.update({
            system: {
              attributes: {
                int: {
                  bonusSpells: {
                    lvl4: !this.actor.system.attributes.int.bonusSpells.lvl4,
                  }
                }
              }
            }
          })
          break
        case "wisLvl1":
        result = await this.actor.update({
          system: {
            attributes: {
              wis: {
                bonusSpells: {
                  lvl1: !this.actor.system.attributes.wis.bonusSpells.lvl1,
                }
              }
            }
          }
        })
        break
      case "wisLvl2":
        result = await this.actor.update({
          system: {
            attributes: {
              wis: {
                bonusSpells: {
                  lvl2: !this.actor.system.attributes.wis.bonusSpells.lvl2,
                }
              }
            }
          }
        })
        break
      case "wisLvl3":
        result = await this.actor.update({
          system: {
            attributes: {
              wis: {
                bonusSpells: {
                  lvl3: !this.actor.system.attributes.wis.bonusSpells.lvl3,
                }
              }
            }
          }
        })
        break
        case "wisLvl4":
          result = await this.actor.update({
            system: {
              attributes: {
                wis: {
                  bonusSpells: {
                    lvl4: !this.actor.system.attributes.wis.bonusSpells.lvl4,
                  }
                }
              }
            }
          })
          break
      }
      this.render(true)
      if (CONFIG.HYP3E.debugMessages) { console.log("Actor after update:", result) }
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
    // Remove the type from the dataset since it's in the itemData.type prop.
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
    
    if (CONFIG.HYP3E.debugMessages) { console.log("Item clicked:", item) }
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
    if ( (target?.type === "container") ) {
      // One container cannot hold another container
      if (source.type == 'container') { 
        if (CONFIG.HYP3E.debugMessages) { console.log(`Cannot move container (${source.name}) into another container (${target.name})!`) }
        return 
      }

      // Update the container info on the item
      this.actor.updateEmbeddedDocuments("Item", [
        { _id: source.id, "system.containerId": target.id, "system.location": target.name },
      ]);
      return;
    }
    // Dragging an item out of a container resets its containerId and location to blank
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
    let label = ""

    // Log the element
    if (CONFIG.HYP3E.debugMessages) { console.log("Clicked element: ", element) }
    // Log the element dataset
    if (CONFIG.HYP3E.debugMessages) { console.log("Element dataset: ", dataset) }
    // Log the actor
    if (CONFIG.HYP3E.debugMessages) { console.log("Current Actor:", this.actor) }

    // How many different roll types do we have?
    //  Test of Attribute: d6 roll-under target
    //    Formula & TN built into character sheet, GM may adjust TN by setting a sit mod
    //  Feat of Attribute: d100 roll-under target
    //    Formula & TN built into character sheet, GM may adjust
    //  Exploration skill check: d6 roll-under target
    //    Formula & TN built into character sheet, GM may adjust
    //  Hit dice: dX and sum total
    //    Formula built into character sheet, no TN needed
    //  Saving throws: d20 roll-over target
    //    Formula & TN built into character sheet, GM may adjust

    //  Class ability checks, esp. thief skills: varies, but usually d6 or d12 roll-under target
    //    Formula & TN can be built into ability => item sheet of type "feature"
    //  Turning undead (subset of class abilities): d12 roll-under target
    //    Formula can be built into turning ability => item sheet of type "feature"
    //  Attack rolls: d20 roll-over target
    //    Formula can be built into weapon => item sheet of type "weapon"
    //  Damage rolls: dX and sum total
    //    Formula can be built into weapon => item sheet of type "weapon"
    //  Spell duration, number affected, etc.: varies
    //    Formulas can be built into spell => item sheet of type "spell"
    try {
      // What is our roll type?
      if (CONFIG.HYP3E.debugMessages) { console.log("Roll Type:", dataset.rollType) }
      let rollFormula
      let rollResponse

      switch (dataset.rollType) {
        case "item":
          const itemId = element.closest('.item').dataset.itemId
          const item = this.actor.items.get(itemId)
          let itemName = ""
          if (item.system.friendlyName != "") {
            itemName = item.system.friendlyName
          } else {
            itemName = item.name
          }
          if (CONFIG.HYP3E.debugMessages) { console.log(`Rolling Item ${itemName}:`, item) }
          // dataset.details = `${item.system.description}`
          // The default for weapons & spells is an attack
          if (item.type == "weapon") {
            let mastery = "Attack"
            if (item.system.wpnGrandmaster) {
              mastery = "Grandmaster attack"
            } else if (item.system.wpnMaster) {
              mastery = "Master attack"
            }
            dataset.label = `${mastery} with ${itemName}...`
            dataset.roll = item.system.formula
            // dataset.enableRoll = true
            rollResponse = await Hyp3eDice.ShowAttackRollDialog(dataset);
          } else if (item.type == "spell") {
            dataset.label = `Cast spell ${itemName}...`
            if (item.system.formula > "") {
              dataset.roll = item.system.formula
              // dataset.enableRoll = true
            } else {
              dataset.details = `No attack roll required to cast ${itemName}.`
              // dataset.enableRoll = false
            }
            rollResponse = await Hyp3eDice.ShowSpellcastingDialog(dataset);
          } else {  // ==> Neither a weapon nor a spell
            // The default for other item types is a check
            dataset.label = `${itemName} check...`
            dataset.roll = item.system.formula
            // dataset.enableRoll = true
            rollResponse = await Hyp3eDice.ShowBasicRollDialog(dataset);
          }
          // Log the dialog response
          if (CONFIG.HYP3E.debugMessages) { console.log("Dialog response:", rollResponse) }
          // Add situational modifier from the dice dialog
          item.system.sitMod = rollResponse.sitMod;
          // Add roll mode from the dice dialog
          item.system.rollMode = rollResponse.rollMode;
          if (item) {
            return item.roll()
          }
          break
  
        case "check":
          if (CONFIG.HYP3E.debugMessages) { console.log("Rolling check...") }
          label = `${dataset.label}...`
          // dataset.enableRoll = true
          // Log the dataset before the dialog renders
          if (CONFIG.HYP3E.debugMessages) { console.log("Dataset:", dataset) }
          rollResponse = await Hyp3eDice.ShowBasicRollDialog(dataset);
          // Add situational modifier from the dice dialog
          if (CONFIG.HYP3E.flipRollUnderMods) {
            rollFormula = `${dataset.roll} - ${rollResponse.sitMod}`
          } else {
            rollFormula = `${dataset.roll} + ${rollResponse.sitMod}`;
          }
          
          break;

        case "attack":
          if (CONFIG.HYP3E.debugMessages) { console.log("Rolling attack...") }
          label = `${dataset.label}`
          // dataset.enableRoll = true
          // Log the dataset before the dialog renders
          if (CONFIG.HYP3E.debugMessages) { console.log("Dataset:", dataset) }
          rollResponse = await Hyp3eDice.ShowAttackRollDialog(dataset);
          // Add situational modifier from the dice dialog
          rollFormula = `${dataset.roll} + ${rollResponse.sitMod}`;
          break;

        case "save":
          if (CONFIG.HYP3E.debugMessages) { console.log("Rolling save...") }
          label = `${dataset.label}...`
          // dataset.enableRoll = true
          if (this.actor.type == "character") {
            // Get the character's saving throw modifiers
            // console.log("Avoidance mod:", this.actor.system.attributes.dex.defMod*-1);
            dataset.avoidMod = this.actor.system.attributes.dex.defMod;
            // console.log("Poison mod:", this.actor.system.attributes.con.poisRadMod);
            dataset.poisonMod = this.actor.system.attributes.con.poisRadMod;
            // console.log("Will mod:", this.actor.system.attributes.wis.willMod);
            dataset.willMod = this.actor.system.attributes.wis.willMod;
            // Log the dataset before the dialog renders
            if (CONFIG.HYP3E.debugMessages) { console.log("Dataset:", dataset) }
            rollResponse = await Hyp3eDice.ShowSaveRollDialog(dataset);
            // console.log("Dialog response:", rollResponse);
            // Get saving throw modifer if one was selected
            let saveMod = 0;
            if (rollResponse.avoidMod) {
              saveMod = rollResponse.avoidMod;
              label = `${dataset.label} with Avoidance modifier...`
            }
            if (rollResponse.poisonMod) {
              saveMod = rollResponse.poisonMod;
              label = `${dataset.label} with Poison/Radiation modifier...`
            }
            if (rollResponse.willMod) {
              saveMod = rollResponse.willMod;
              label = `${dataset.label} with Willpower modifier...`
            }
            // Add save mod and situational modifier from the dice dialog
            rollFormula = `${dataset.roll} + ${saveMod} + ${rollResponse.sitMod}`;
          } else {
            // NPC/monster save, no mods
            // Log the dataset before the dialog renders
            if (CONFIG.HYP3E.debugMessages) { console.log("Dataset:", dataset) }
            rollResponse = await Hyp3eDice.ShowBasicRollDialog(dataset);
            // Add situational modifier from the dice dialog
            rollFormula = `${dataset.roll} + ${rollResponse.sitMod}`;
          }
          break;

        case "basic":
          if (CONFIG.HYP3E.debugMessages) { console.log("Rolling basic...") }
          label = `${dataset.label}...`
          // dataset.enableRoll = true
          // Log the dataset before the dialog renders
          if (CONFIG.HYP3E.debugMessages) { console.log("Dataset:", dataset) }
          rollResponse = await Hyp3eDice.ShowBasicRollDialog(dataset);
          // Add situational modifier from the dice dialog
          rollFormula = `${dataset.roll} + ${rollResponse.sitMod}`;
          break;

        case "setAttr":
          // Take the attribute scores and lookup/calculate all modifiers
          // console.log("Set attribute modifiers...")
          new Dialog({
            title: "Confirm set/reset attribute modifiers",
            content: "Set attribute modifiers? This will replace any values already in place!",
            buttons: {
              confirm: {
                label: "Confirm",
                icon: `<i class="fas fa-check"></i>`,
                callback: () => {
                  // Set/reset all attribute modifiers
                  this.actor.SetAttributeMods()
                  this.render(true)
                  ui.notifications.info("Attribute modifiers set!")
                }
              },
              cancel: {
                label: "Cancel",
                icon: `<i class="fas fa-times"></i>`,
                callback: () => {ui.notifications.info("Set attribute modifiers - canceled!")}
              }
            }
          }).render(true);
          break;

        default:
          // This should never happen, pretty sure all rolls have a roll-type
          console.log("Rolling default, this should never happen...");
          label = `${dataset.label}...`
          // dataset.enableRoll = true
          // Log the dataset before the dialog renders
          console.log("Dataset:", dataset);
          rollResponse = await Hyp3eDice.ShowBasicRollDialog(dataset);
          // Add situational modifier from the dice dialog
          rollFormula = `${dataset.roll} + ${rollResponse.sitMod}`;

      }
      
      // Handle non-item rolls that supply the formula directly
      if (dataset.rollType != "item" && dataset.rollType != "setAttr") {
        // Roll the dice!
        let roll = new Roll(rollFormula, this.actor.getRollData())
        // Resolve the roll
        let result = await roll.roll()
        if (CONFIG.HYP3E.debugMessages) { console.log("Roll result: ", result) }

        // Determine success or failure if we have a target number
        if (dataset.rollTarget != '' && dataset.rollTarget != undefined) {
          // Attribute, skill and other checks are roll-under for success
          if (dataset.rollType == "check" || dataset.rollType == "basic") {
            if(roll.total <= dataset.rollTarget) {
              if (CONFIG.HYP3E.debugMessages) { console.log(roll.total + " is less than or equal to " + dataset.rollTarget + "!") }
              label += "<br /><b>Success!</b>"
            } else {
              if (CONFIG.HYP3E.debugMessages) { console.log(roll.total + " is greater than " + dataset.rollTarget + "!") }
              label += "<br /><b>Fail.</b>"
            }
          // Saves are roll-over for success
          } else if (dataset.rollType == "save") {
            if(roll.total >= dataset.rollTarget) {
              if (CONFIG.HYP3E.debugMessages) { console.log(roll.total + " is greater than or equal to " + dataset.rollTarget + "!") }
              label += "<br /><b>Success!</b>"
            } else {
              if (CONFIG.HYP3E.debugMessages) { console.log(roll.total + " is less than " + dataset.rollTarget + "!") }
              label += "<br /><b>Fail.</b>"
            }
          // Attacks trigger here if there is a target token selected
          // } else if (dataset.rollType == "attack") {
          //   let naturalRoll = roll.dice[0].total
          //   if(roll.total >= dataset.rollTarget) {
          //     console.log(roll.total + " is greater than or equal to " + dataset.rollTarget + "!")
          //     if (naturalRoll == 20) {
          //       label += "<br /><span style='color:#2ECC71'><b>Critically Hits!</b></span>"
          //     } else {
          //       label += "<br /><b>Hits!</b>"
          //     }
          //   } else {
          //     console.log(roll.total + " is less than " + dataset.rollTarget + "!")
          //     if (naturalRoll == 1) {
          //       label += "<br /><span style='color:#E90000'><b>Critically Misses!</b></span>"
          //     } else {
          //       label += "<br /><bb>Miss.</b>"
          //     }
          //   }
          } else {
            // Target number was supplied but the roll type is invalid or unspecified!
            console.log(`Error in roll setup! dataset.rollTarget is ${dataset.rollTarget}, but dataset.rollType is ${dataset.rollType}`)
            ui.notifications.info(`Error in roll setup! dataset.rollTarget is ${dataset.rollTarget}, but dataset.rollType is ${dataset.rollType}`)
            return
          }
        } else {
          // The character sheet has an attack roll, but do we have a target token?
          if (dataset.rollType == "attack") {
            // Get roll results
            let naturalRoll = roll.dice[0].total
            let targetAc = 9
            let targetName = ""

            // Has the user targeted a token? If so, get it's AC and name
            let userTargets = Array.from(game.user.targets)
            if (CONFIG.HYP3E.debugMessages) { console.log("Target Actor Data:", userTargets) }
            if (userTargets.length > 0) {
              let primaryTargetData = userTargets[0].actor
              targetAc = primaryTargetData.system.ac.value
              targetName = primaryTargetData.name
            }
            
            // Setup chat card label based on whether we have a target
            if (targetName != "") {
              label += ` vs. ${targetName}...`
            } else {
              label += "..."
            }

            // Determine hit or miss based on target AC
            let hit = false
            let tn = 20 - targetAc
            if (CONFIG.HYP3E.debugMessages) { console.log(`Attack roll ${roll.total} hits AC [20 - ${roll.total} => ] ${eval(20 - roll.total)}`) }
            if (naturalRoll == 20) {
              if (CONFIG.HYP3E.debugMessages) { console.log("Natural 20 always crit hits!") }
              label += `<br /><span style='color:#00b34c'><b>Critical Hit!</b></span>`
              hit = true
            } else if (naturalRoll == 1) {
              if (CONFIG.HYP3E.debugMessages) { console.log("Natural 1 always crit misses!") }
              label += "<br /><span style='color:#e90000'><b>Critical Miss!</b></span>"
            } else if (roll.total >= tn) {
              if (CONFIG.HYP3E.debugMessages) { console.log(`Hit! Attack roll ${roll.total} is greater than or equal to [20 - ${targetAc} => ] ${tn}.`) }
              if (targetName != "") {
                label += `<br /><b>Hit!</b>`
              } else {
                label += `<br /><b>Hits AC ${eval(20 - roll.total)}.</b>`
              }
              hit = true
            } else {
              if (CONFIG.HYP3E.debugMessages) { console.log(`Miss! Attack roll ${roll.total} is less than [20 - ${targetAc} => ] ${tn}.`) }
              if (targetName != "") {
                label += `<br /><b>Miss.</b>`
              } else {
                label += `<br /><b>Misses AC 9.</b>`
              }
            }
          }
        }

        // Prettify label
        label = "<h3>" + label + "</h3>"
        // Output roll result to a chat message
        roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label
        },{
          rollMode: rollResponse.rollMode
        });
        return roll;
      }
    } catch(err) {
      // Log the error
      console.log(err)
    }
  }

}
