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
      // console.log("Attributes:", k, v, v.label)
    }

    // Handle exploration skills
    for (let [k, v] of Object.entries(context.system.explorationSkills)) {
      v.label = game.i18n.localize(CONFIG.HYP3E.explorationSkills[k]) ?? k;
      // console.log("Exploration Skills:", k, v, v.label)
    }

    // Handle movement types
    for (let [k, v] of Object.entries(context.system.movement)) {
      v.label = game.i18n.localize(CONFIG.HYP3E.movement[k]) ?? k;
      // console.log("Movement Types:", k, v, v.label)
    }

    // Character classes and languages are global system settings
    context.characterClasses = CONFIG.HYP3E.characterClasses
    // console.log("Actor sheet class list:", context.characterClasses)
    context.languages = CONFIG.HYP3E.languages
    // console.log("Actor sheet languages:", context.languages)

    // System-defined roll modes
    context.rollModes = CONFIG.Dice.rollModes
    // console.log("Dice-roll modes:", context.rollModes)

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

    html.find(".item-drop").click((event) => {
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

    // Toggle equip/unequip
    html.find(".item-equip").click(async (event) => {
      const li = $(event.currentTarget).closest(".item-entry")
      const item = this.actor.items.get(li.data("itemId"))
      await item.update({
        data: {
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
    const speaker = ChatMessage.getSpeaker()
    const label = `<h3>${item.name} [${item.type}]</h3>`
    console.log("Item clicked:", item)
    let content = item.system.description
    // Setup clickable buttons for item rolls, if they are populated
    if (item.system.damage) {
      if ((item.system.damage).match(/.*d[1-9].*/)) {
        // Add a damage roll macro
        content += "<p>Damage: [[/r " + item.system.damage + "]]</p>"
      }
    }
    if (item.system.duration) {
      if ((item.system.duration).match(/.*d[1-9].*/)) {
        // Add a duration roll macro
        content += "<p>Duration: [[/r " + item.system.duration + "]]</p>"
      }
    }
    if (item.system.affected) {
      if ((item.system.affected).match(/.*d[1-9].*/)) {
        // Add a number affected roll macro
        content += "<p># Affected: [[/r " + item.system.affected + "]]</p>"
      }
    }
    ChatMessage.create({
      speaker: speaker,
      flavor: label,
      content: content ?? ''
    })
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
    console.log("Clicked element: ", element)
    // Log the element dataset
    console.log("Element dataset: ", dataset)
    // Log the actor
    console.log("Current Actor:", this.actor)

    // How many different roll types do we have?
    //  Tests of an Attribute: d6 roll-under target
    //    Formula & TN built into character sheet
    //  Feats of an Attribute: d100 roll-under target
    //    Formula & TN built into character sheet
    //  Exploration skill checks: d6 roll-under target
    //    Formula built into character sheet, GM sets TN
    //  Hit dice: dX and sum total
    //    Formula built into character sheet, no TN needed
    //  Saving throws: d20 roll-over target
    //    Formula & TN built into character sheet

    //  Class ability checks, esp. thief skills: varies, but usually d6 or d12 roll-under target
    //    Formula can be built into ability => item sheet of type "feature"
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
      console.log("Roll Type:", dataset.rollType)
      let rollFormula
      let rollResponse

      switch (dataset.rollType) {
        case "item":
          const itemId = element.closest('.item').dataset.itemId
          const item = this.actor.items.get(itemId)
          console.log(`Rolling Item ${item.name}:`, item)
          // The default for weapons & spells is an attack
          if (item.type == "weapon" || item.type == "spell") {
            if (item.system.formula != '') {
              // Does the item have an overriding attack formula?
              dataset.roll = item.system.formula
            } else {
              // These errors should never happen, unless someone manually deleted the formula
              if (item.system.melee) {
                console.log("ITEM ERROR: Weapon has no attack formula! Setting to melee default...")
                item.system.formula = '1d20 + @fa + @str.atkMod + @item.atkMod'
                dataset.roll = '1d20 + @fa + @str.atkMod + @item.atkMod'
              } else if (item.system.missile) {
                console.log("ITEM ERROR: Weapon has no attack formula! Setting to missile default...")
                item.system.formula = '1d20 + @fa + @dex.atkMod + @item.atkMod'
                dataset.roll = '1d20 + @fa + @dex.atkMod + @item.atkMod'
              } else if (item.type == "spell") {
                console.log("ITEM ERROR: Spell has no attack formula! Setting to spell default...")
                item.system.formula = '1d20 + @fa'
                dataset.roll = '1d20 + @fa'
              }
            }
            label = `Attack with ${item.name}...`
            rollResponse = await Hyp3eDice.ShowBasicRollDialog(dataset);
            // Log the dialog response
            // console.log("Dialog response:", rollResponse);
            // Add situational modifier from the dice dialog
            item.system.sitMod = rollResponse.sitMod;
            // Add roll mode from the dice dialog
            item.system.rollMode = rollResponse.rollMode;
            if (item) {
              return item.rollAttack()
            }

          } else {
            // The default for features & items is a check
            dataset.roll = item.system.formula;
            label = `${item.name} check...`
            rollResponse = await Hyp3eDice.ShowBasicRollDialog(dataset);
            // Log the dialog response
            // console.log("Dialog response:", rollResponse);
            // Add situational modifier from the dice dialog
            item.system.sitMod = rollResponse.sitMod;
            // Add roll mode from the dice dialog
            item.system.rollMode = rollResponse.rollMode;
            if (item) {
              return item.rollCheck()
            }
  
          }
          break;
  
        case "check":
          // console.log("Rolling check...");
          label = `${dataset.label}...`
          // Log the dataset before the dialog renders
          // console.log("Dataset:", dataset);
          rollResponse = await Hyp3eDice.ShowBasicRollDialog(dataset);
          // Add situational modifier from the dice dialog
          rollFormula = `${dataset.roll} + ${rollResponse.sitMod}`;
          break;

        case "attack":
          // console.log("Rolling attack...");
          label = `${dataset.label}...`
          // Log the dataset before the dialog renders
          // console.log("Dataset:", dataset);
          rollResponse = await Hyp3eDice.ShowBasicRollDialog(dataset);
          // Add situational modifier from the dice dialog
          rollFormula = `${dataset.roll} + ${rollResponse.sitMod}`;
          break;

        case "save":
          // console.log("Rolling save...");
          label = `${dataset.label}...`
          if (this.actor.type == "character") {
            // Get the character's saving throw modifiers
            // console.log("Avoidance mod:", this.actor.system.attributes.dex.defMod*-1);
            dataset.avoidMod = this.actor.system.attributes.dex.defMod*-1;
            // console.log("Poison mod:", this.actor.system.attributes.con.poisRadMod);
            dataset.poisonMod = this.actor.system.attributes.con.poisRadMod;
            // console.log("Will mod:", this.actor.system.attributes.wis.willMod);
            dataset.willMod = this.actor.system.attributes.wis.willMod;
            // Log the dataset before the dialog renders
            // console.log("Dataset:", dataset);
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
            // console.log("Dataset:", dataset);
            rollResponse = await Hyp3eDice.ShowBasicRollDialog(dataset);
            // Add situational modifier from the dice dialog
            rollFormula = `${dataset.roll} + ${rollResponse.sitMod}`;
          }
          break;

        case "basic":
          // console.log("Rolling basic...");
          label = `${dataset.label}...`
          // Log the dataset before the dialog renders
          // console.log("Dataset:", dataset);
          rollResponse = await Hyp3eDice.ShowBasicRollDialog(dataset);
          // Add situational modifier from the dice dialog
          rollFormula = `${dataset.roll} + ${rollResponse.sitMod}`;
          break;

        default:
          // This should never happen, pretty sure all rolls have a roll-type
          console.log("Rolling default, this should never happen...");
          label = `${dataset.label}...`
          // Log the dataset before the dialog renders
          // console.log("Dataset:", dataset);
          rollResponse = await Hyp3eDice.ShowBasicRollDialog(dataset);
          // Add situational modifier from the dice dialog
          rollFormula = `${dataset.roll} + ${rollResponse.sitMod}`;

      }
      
      // Handle non-item rolls that supply the formula directly
      if (dataset.rollType != "item") {
        // Log the dialog response
        // console.log("Dialog response:", rollResponse)
        // console.log("Roll formula: ", rollFormula)
        let roll = new Roll(rollFormula, this.actor.getRollData())
        // Resolve the roll
        let result = await roll.evaluate()
        // console.log("Roll result: ", roll)

        // Determine success or failure if we have a target number
        if (dataset.rollTarget != '' && dataset.rollTarget != undefined) {
          // Attribute, skill and other checks are roll-under for success
          if (dataset.rollType == "check" || dataset.rollType == "basic") {
            if(roll.total <= dataset.rollTarget) {
              console.log(roll.total + " is less than or equal to " + dataset.rollTarget + "!")
              label += "<b>Success</b>!"
            } else {
              console.log(roll.total + " is greater than " + dataset.rollTarget + "!")
              label += "<i>Fail</i>."
            }
          // Saves are roll-over for success
          } else if (dataset.rollType == "save") {
            if(roll.total >= dataset.rollTarget) {
              console.log(roll.total + " is greater than or equal to " + dataset.rollTarget + "!")
              label += "<b>Success</b>!"
            } else {
              console.log(roll.total + " is less than " + dataset.rollTarget + "!")
              label += "<i>Fail</i>."
            }
          // Attacks will never trigger here, until we get targeting functionality added
          } else if (dataset.rollType == "attack") {
            let naturalRoll = roll.dice[0].total
            if(roll.total >= dataset.rollTarget) {
              console.log(roll.total + " is greater than or equal to " + dataset.rollTarget + "!")
              if (naturalRoll == 20) {
                label += "<span style='color:#2ECC71'><b>critically hits!</b></span>"
              } else {
                label += "<b>hits!</b>"
              }
            } else {
              console.log(roll.total + " is less than " + dataset.rollTarget + "!")
              if (naturalRoll == 1) {
                label += "<span style='color:#E90000'><i>critically misses!</i></span>"
              } else {
                label += "<i>misses.</i>"
              }
            }
          }
        } else {
          // No target number supplied, as is common with attacks
          if (dataset.rollType == "attack") {
            console.log(roll.total + " hits AC 19 - " + roll.total + " = " + eval(19 - roll.total))
            let naturalRoll = roll.dice[0].total
            console.log("Natural die roll:", naturalRoll)
            if (naturalRoll == 20) {
              label += "<span style='color:#2ECC71'>critically hits <b>AC " + eval(19 - roll.total) + "!</b></span>"
            } else if (naturalRoll == 1) {
              label += "<span style='color:#E90000'><i>critically misses!</i></span>"
            } else {
              label += "hits <b>AC " + eval(19 - roll.total) + ".</b>"
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
