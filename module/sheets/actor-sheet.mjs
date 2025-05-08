import { Hyp3eCharacter } from "../helpers/character.mjs";
import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";

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
  async getData() {
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
    // if (CONFIG.HYP3E.debugMessages) { console.log(`Preparing active effects...`) }
    // if (CONFIG.HYP3E.debugMessages) { console.log(`Actor effects: `, this.actor.effects) }
    if (CONFIG.HYP3E.debugMessages) { console.log(`Actor applied effects: `, this.actor.appliedEffects) }
    // if (CONFIG.HYP3E.debugMessages) { console.log(`Actor applicable effects: `, this.actor.allApplicableEffects) }
    if (CONFIG.HYP3E.debugMessages) { console.log(`Actor applicable effects: `, this.actor._getAllApplicableEffects()) }
    if (!foundry.utils.isNewerVersion(game.version, "13")) {
        // For Foundry v12...
        context.effects = prepareActiveEffectCategories(this.actor.effects);
    } else if (foundry.utils.isNewerVersion(game.version, "13")) {
        // For Foundry v13...
        context.effects = prepareActiveEffectCategories(this.actor._getAllApplicableEffects());
    }

    // Enrich the description field for TinyMCE editors.
    context.enrichedBiography = await TextEditor.enrichHTML(
        context.system.biography,
        { 
            rollData: context.rollData, 
            async: true 
        }
    );
    // console.log("Roll Data in ItemSheet:", context.rollData);
    // console.log("Enriched HTML:", context.enrichedDescription);

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
            // if (CONFIG.HYP3E.debugMessages) { console.log("Attributes:", k, v, v.label) }
            // Have we selected a class yet?
            if (context.system.details.class) {
                // Flag attributes that are too low for the character class
                switch (k) {
                    case "str":
                        if (this.actor.isAttributeLow(k)) {
                            // ui.notifications.warn(`ST is too low for ${context.system.details.class}!`)
                            context.warnStr = true
                        }
                        break
                    case "dex":
                        if (this.actor.isAttributeLow(k)) {
                            // ui.notifications.warn(`DX is too low for ${context.system.details.class}!`)
                            context.warnDex = true
                        }
                        break
                    case "con":
                        if (this.actor.isAttributeLow(k)) {
                            // ui.notifications.warn(`CN is too low for ${context.system.details.class}!`)
                            context.warnCon = true
                        }
                        break
                    case "int":
                        if (this.actor.isAttributeLow(k)) {
                            // ui.notifications.warn(`IN is too low for ${context.system.details.class}!`)
                            context.warnInt = true
                        }
                        break
                    case "wis":
                        if (this.actor.isAttributeLow(k)) {
                            // ui.notifications.warn(`WS is too low for ${context.system.details.class}!`)
                            context.warnWis = true
                        }
                        break
                    case "cha":
                        if (this.actor.isAttributeLow(k)) {
                            // ui.notifications.warn(`CH is too low for ${context.system.details.class}!`)
                            context.warnCha = true
                        }
                        break
                    default:
                        break
                }
            }
        }

        // Handle movement types
        for (let [k, v] of Object.entries(context.system.movement)) {
            v.label = game.i18n.localize(CONFIG.HYP3E.movement[k]) ?? k;
            // if (CONFIG.HYP3E.debugMessages) { console.log("Movement Types:", k, v, v.label) }
        }

        // Handle money types
        for (let [k, v] of Object.entries(context.system.money)) {
            v.label = game.i18n.localize(CONFIG.HYP3E.money[k]) ?? k;
            // if (CONFIG.HYP3E.debugMessages) { console.log("Money Types:", k, v, v.label) }
        }

        // The following are global system settings
        context.enableAttrChecks = CONFIG.HYP3E.enableAttrChecks
        // if (CONFIG.HYP3E.debugMessages) { console.log("Enable attribute checks:", context.enableAttrChecks) }

        context.characterClasses = CONFIG.HYP3E.characterClasses
        // if (CONFIG.HYP3E.debugMessages) { console.log("Actor sheet class list:", context.characterClasses) }

        context.races = CONFIG.HYP3E.races
        // if (CONFIG.HYP3E.debugMessages) { console.log("Actor sheet races list:", context.races) }

        context.languages = CONFIG.HYP3E.languages
        // if (CONFIG.HYP3E.debugMessages) { console.log("Actor sheet languages:", context.languages) }

        // System-defined roll modes
        context.rollModes = CONFIG.Dice.rollModes
        // if (CONFIG.HYP3E.debugMessages) { console.log("Dice-roll modes:", context.rollModes) }

        // We can set these two constants even if they aren't used (when encumbrance is disabled)
        const encumberedWt = this.actor.system.attributes.str.value * game.settings.get(game.system.id, "encumbered")
        const heavilyEncumberedWt = this.actor.system.attributes.str.value * game.settings.get(game.system.id, "heavilyEncumbered")
        if (game.settings.get(game.system.id, "enableEncumbrance")) {
            if (CONFIG.HYP3E.debugMessages) { console.log(`Checking encumbrance vs Strength...`) }
            if (context.encumbrance > heavilyEncumberedWt) {
                if (CONFIG.HYP3E.debugMessages) { console.log(`${this.actor.name} is Heavily Encumbered!`) }
                this.actor.setFlag(game.system.id, "isHeavilyEncumbered", true)
                this.actor.setFlag(game.system.id, "isEncumbered", false)
                context.isHeavilyEncumbered = true
                context.isEncumbered = false
            } else if (context.encumbrance > encumberedWt) {
                if (CONFIG.HYP3E.debugMessages) { console.log(`${this.actor.name} is Encumbered!`) }
                this.actor.setFlag(game.system.id, "isEncumbered", true)
                this.actor.setFlag(game.system.id, "isHeavilyEncumbered", false)
                context.isEncumbered = true
                context.isHeavilyEncumbered = false
            } else {
                if (CONFIG.HYP3E.debugMessages) { console.log(`${this.actor.name} is not Encumbered. :-)`) }
                this.actor.setFlag(game.system.id, "isEncumbered", false)
                this.actor.setFlag(game.system.id, "isHeavilyEncumbered", false)
                context.isEncumbered = false
                context.isHeavilyEncumbered = false
            }
        }

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
        // if (CONFIG.HYP3E.debugMessages) { console.log("Actor sheet sizes:", context.creatureSizes) }
    
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
        // Iterate through items, adding encumbrance and allocating to tab-groups
        for (let i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;
            // if (CONFIG.HYP3E.debugMessages) { console.log("Item carried:", i) }
            // Calculate total weight carried by character. For weapons & armor, the equipped
            //  status is ignored and the item weight is always added to encumbrance.
            //  For non-weapon items, the equipped status is used to determine if the item
            //  is carried or not.
            if (i.system.weight) {
                if (i.system.quantity.value) {
                    // Is this a normal item, and is it carried?
                    if ((i.type === 'item' || i.type === 'container') && i.system.equipped) {
                        i.system.carriedWt = (i.system.weight * i.system.quantity.value)
                        i.system.carriedWt = Math.round(i.system.carriedWt * 10)/10
                        // encumbrance += (i.system.weight * i.system.quantity.value)
                        encumbrance += i.system.carriedWt
                    } else if (i.type === 'weapon' || i.type === 'armor') {
                        i.system.carriedWt = (i.system.weight * i.system.quantity.value)
                        i.system.carriedWt = Math.round(i.system.carriedWt * 10)/10
                        // encumbrance += (i.system.weight * i.system.quantity.value)
                        encumbrance += i.system.carriedWt
                    } else {
                        i.system.carriedWt = 0
                    }
                // } else { // Assume quantity of 1
                //     i.system.carriedWt = i.system.weight
                //     encumbrance += i.system.weight
                }
            }

            // Something to do with item effects? I don't remember if this is needed.
            // if (CONFIG.HYP3E.debugMessages) {
            //     if (i.effects.length > 0) {
            //         // console.log("Item effects:", i.effects)
            //         i.effects.forEach(eff => {
            //             // console.log("Effect transfer:", eff.transfer)
            //             if (eff.transfer) {
            //                 // console.log(`Item ${i.name}:`, i)
            //                 // console.log("Effect to transfer:", eff)
            //                 // this.actor.effects.push(eff)
            //             }
            //         })
            //     }
            // }

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
                if (i.system.spellLevel != undefined && i.system.spellLevel >= 1 && i.system.spellLevel <= 6) {
                    spells[i.system.spellLevel].push(i);
                } else if (i.system.spellLevel != undefined && i.system.spellLevel < 1) {
                    spells[1].push(i);
                } else if (i.system.spellLevel != undefined && i.system.spellLevel > 6) {
                    spells[6].push(i);
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

    // Toggle equip/unequip or carry/drop item
    html.find(".item-equip").click(async (event) => {
        const li = $(event.currentTarget).closest(".item-entry")
        const item = this.actor.items.get(li.data("itemId"))
        if (CONFIG.HYP3E.debugMessages) { console.log("Actor item-equip toggle:", item) }
        await item.update({
            system: {
                equipped: !item.system.equipped,
            },
        })
        // Send a chat message that the item was equipped/unequipped or carried/dropped
        const itemName = item.system.friendlyName ? item.system.friendlyName : item.name
        let equipText = ""
        let containerText = ""
        if (item.type === "armor" || item.type === "weapon") {
            equipText = item.system.equipped ? "equipped" : "unequipped"
        } else if (item.type === "item" || item.type === "container") {
            equipText = item.system.equipped ? "is carrying" : "dropped"
            // If this is a container, carry or drop the contents too
            if (item.system.isContainer || item.type === "container") {
                this._carryOrDropContainer(item)
                containerText = " and its contents"
            }
        }
        const message = `${this.actor.name} ${equipText} ${itemName}${containerText}.`
        const chatData = {
            author: game.user_id,
            content: message
        };
        ChatMessage.create(chatData, {});
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
   * Handle settings equipped state of items in a container
   * @param {*} itemId 
   */
  _carryOrDropContainer(container) {
    // Has the container been carried or dropped?
    const carrying = container.system.equipped
    // Find all items in the container
    const items = this.actor.items.filter(i => i.system.containerId === container.id)
    if (CONFIG.HYP3E.debugMessages) { console.log("Items in container:", items) }
    // Batch the updates to the actor
    this.actor.updateEmbeddedDocuments("Item", items.map(item => ({
        _id: item.id,
        "system.equipped": carrying,
    })))
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
    // Use the item's display function to do it
    item._displayItemInChat()
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
        ui.notifications.info(`Cannot move container (${source.name}) into another container (${target.name})!`)
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
    if (CONFIG.HYP3E.debugMessages) { console.log("_onRoll: Clicked element: ", element) }
    // Log the element dataset
    if (CONFIG.HYP3E.debugMessages) { console.log("_onRoll: Element dataset: ", dataset) }
    // Log the sheet data
    if (CONFIG.HYP3E.debugMessages) { console.log("_onRoll: Current Actor-Sheet Data:", this) }
    // Log the actor
    if (CONFIG.HYP3E.debugMessages) { console.log("_onRoll: Current Actor:", this.actor) }
    // Log the token
    if (CONFIG.HYP3E.debugMessages) { console.log("_onRoll: Current Token:", this.token) }

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
    //    Casting spells: may be attack roll or simply cast the spell
    //      Formula can be built into spell => item sheet of type "spell"
    //    Damage rolls: dX and sum total
    //      Formula can be built into weapon => item sheet of type "weapon"
    //    Spell duration, number affected, etc.: varies
    //      Formulas can be built into spell => item sheet of type "spell"
    //    Using items: applying an item effect to the actor
    //      No formula needed, but item effect can be built into item => item sheet of type "item"

    try {
      // What is our roll type?
      if (CONFIG.HYP3E.debugMessages) { console.log("_onRoll: Roll Type:", dataset.rollType) }

      dataset.itemId = ""
      dataset.actorId = this.actor.id
      dataset.baseClass = this.actor.system.baseClass
      dataset.tokenId = this.token?.id ? this.token?.id : null

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
          let setAttrOk = await Hyp3eCharacter.setAttributeMods(dataset)
          if (setAttrOk) {
            this.render()
          }
          break

        case "levelUp":
            // Check current XP, and level up if possible
            let levelUpOk = await Hyp3eCharacter.levelUp(dataset)
            if (levelUpOk) {
              this.render()
            }
            break

        default:
          // This should never happen, all rolls should have a roll-type
          ui.notifications.info("No Roll Type provided, this should never happen...")
          console.log("_onRoll: No Roll Type provided, this should never happen...");

      }
      
    } catch(err) {
      // Log the error
      console.log("_onRoll: Error: ", err)
    }
  }

}
