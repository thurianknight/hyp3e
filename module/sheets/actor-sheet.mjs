import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import {Hyp3eDice} from "../dice.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class Hyp3eActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["hyp3e", "sheet", "actor"],
      width: 800,
      height: 650,
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
      console.log("Attributes:", k, v, v.label)
    }

    // Handle exploration skills
    for (let [k, v] of Object.entries(context.system.explorationSkills)) {
      v.label = game.i18n.localize(CONFIG.HYP3E.explorationSkills[k]) ?? k;
      console.log("Exploration Skills:", k, v, v.label)
    }

    // Handle movement types
    for (let [k, v] of Object.entries(context.system.movement)) {
      v.label = game.i18n.localize(CONFIG.HYP3E.movement[k]) ?? k;
      console.log("Movement Types:", k, v, v.label)
    }

    // Character classes and languages are global system settings
    context.characterClasses = CONFIG.HYP3E.characterClasses
    console.log("Actor sheet class list:", context.characterClasses)
    context.languages = CONFIG.HYP3E.languages
    console.log("Actor sheet languages:", context.languages)

    // System-defined roll modes
    context.rollModes = CONFIG.Dice.rollModes
    console.log("Dice-roll modes:", context.rollModes)

  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
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

    // Iterate through items, allocating to tab-groups
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === 'item' || i.type === 'container') {
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

    // Assign and return
    context.gear = gear;
    context.features = features;
    context.weapons = weapons;
    context.armor = armor;
    context.spells = spells;
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

    html.find(".item-name").click((event) => {
      this._toggleItemSummary(event);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
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
    event.preventDefault();
    const itemSummary = event.currentTarget
      .closest(".item-entry.item")
      .querySelector(".item-summary");
    if (itemSummary.style.display === "") {
      itemSummary.style.display = "block";
    } else {
      itemSummary.style.display = "";
    }
  }

  /**
   * Handle displaying an Item description in the chat.
   * @param {Event} event   The originating click event
   * @private
   */
  async _displayItemInChat(event) {
    const li = $(event.currentTarget).closest(".item-entry");
    const item = this.actor.items.get(li.data("itemId"));
    const speaker = ChatMessage.getSpeaker();
    const label = `<h3>[${item.type}] ${item.name}</h3>`;
    ChatMessage.create({
      speaker: speaker,
      flavor: label,
      content: item.system.description ?? ''
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

    try {
      // Handle item rolls
      if (dataset.rollType) {
        if (dataset.rollType == 'item') {
          const itemId = element.closest('.item').dataset.itemId;
          const item = this.actor.items.get(itemId);
          dataset.roll = item.system.formula
          console.log("Item:", item)
          const rollResponse = await Hyp3eDice.ExecRollDialog(dataset)
          console.log("Dialog response:", rollResponse)
          // Add situational modifier from the dice dialog
          item.system.sitMod = rollResponse.sitMod
          // Add roll mode from the dice dialog
          item.system.rollMode = rollResponse.rollMode
          if (item) return item.roll();
        }
      }

      // Handle rolls that supply the formula directly
      if (dataset.roll) {
        console.log("Non-item roll")
        if (dataset.rollType == "save") {
          if (this.actor.type == "character") {
            // Get the character's saving throw modifiers
            console.log("Avoidance mod:", this.actor.system.attributes.dex.defMod*-1)
            dataset.avoidMod = this.actor.system.attributes.dex.defMod*-1
            console.log("Poison mod:", this.actor.system.attributes.con.poisRadMod)
            dataset.poisonMod = this.actor.system.attributes.con.poisRadMod
            console.log("Will mod:", this.actor.system.attributes.wis.willMod)
            dataset.willMod = this.actor.system.attributes.wis.willMod
          }
        }
        // Log the dataset before the dialog renders
        console.log("Dataset:", dataset)
        const rollResponse = await Hyp3eDice.ExecRollDialog(dataset)
        // Log the dialog response
        console.log("Dialog response:", rollResponse)
        // Add saving throw modifer, if applicable
        let saveMod = 0
        if (rollResponse.avoidMod) {
          saveMod = rollResponse.avoidMod
        }
        if (rollResponse.poisonMod) {
          saveMod = rollResponse.poisonMod
        }
        if (rollResponse.willMod) {
          saveMod = rollResponse.willMod
        }
        // Add situational modifier from the dice dialog
        let rollFormula = `${dataset.roll} + ${saveMod} + ${rollResponse.sitMod}`
        console.log("Roll formula: ", rollFormula)
        let label = dataset.label ? `Rolling ${dataset.label}...` : '';
        let roll = new Roll(rollFormula, this.actor.getRollData());
        roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label
        },{
          rollMode: rollResponse.rollMode
        });
        return roll;
      }

    } catch {
      // Do nothing
    }
  }
}
