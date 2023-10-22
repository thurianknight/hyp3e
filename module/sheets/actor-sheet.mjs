import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
// import * as Dice from "../dice.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class Hyp3eActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["hyp3e", "sheet", "actor"],
      // template: "systems/hyp3e/templates/actor/actor-sheet.hbs",
      width: 800,
      height: 650,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "abilities" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/hyp3e/templates/actor";
    // Use the following return statement to get a unique actor sheet by type, 
    // like `actor-chracter-sheet.hbs`.
    return `${path}/actor-${this.actor.type}-sheet.hbs`;
    // return `systems/hyp3e/templates/actor/actor-${this.actor.type}-sheet.hbs`;
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
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Log the element
    console.log("Dialog element: ", element)
    // Log the element dataset
    console.log("Dialog dataset: ", dataset)

    const dialogHtml = `
      <div class='flexrow form-group'>
        <label class='resource-label'>Formula: </label>
        <input type='text' name='data-roll' value=${dataset.roll} disabled />
      </div>
      <div class='flexrow form-group'>
        <label class='resource-label'>Situational Modifier: </label>
        <input type='text' name='data-mod' value="" />
      </div>
      <div class='flexrow form-group'>
        <label class='resource-label'>Roll Mode: </label>
        <input type='text' name='rollMode' value=${dataset.rollMode} />
      </div>
    `

      const rollDialog = new Dialog({
      title: `${dataset.label}`,
      content: dialogHtml,
      buttons: {
       roll: {
        icon: '<i class="fas fa-dice-d20"></i>',
        label: "Roll",
        callback: (html) => {console.log("Rolling " + dataset.roll + " ..."); ui.notifications.info("Rolling " + dataset.roll + " ...")}
       },
       cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: (html) => {console.log("Roll canceled!"); ui.notifications.info("Roll canceled!")}
       }
      },
      default: "roll",
      render: html => console.log("Register interactivity in the rendered dialog"),
      close: html => console.log("Dialog closed")
     });
     rollDialog.render(true);

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `Rolling ${dataset.label}...` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

}
