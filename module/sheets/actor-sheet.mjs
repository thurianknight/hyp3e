import { Hyp3eCharacter } from "../helpers/character.mjs";
import { Hyp3eLogger } from "../helpers/logger.mjs";
import HYP3EActorSetLanguages from "../apps/character-set-languages.mjs";
import {enableItemEffectsOnActor, disableItemEffectsOnActor, onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";

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

  static LANGUAGES_APP = new HYP3EActorSetLanguages();
  
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
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations
    const actorData = this.actor.toObject(false);
    Hyp3eLogger.info("getData", `Actor data for sheet:`, actorData);

    // Add the actor's data to context.data for easier access, as well as flags
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

    // Enable/disable character quick-create button
    if (game.settings.get(game.system.id, "quickCreateChars") != "" && !this.actor.getFlag(game.system.id, "disableQuickCreate")) {
        context.enableQuickCreate = true;
    } else {
        context.enableQuickCreate = false;
    };

    // Prepare active effects
    Hyp3eLogger.info("getData", `Actor applied effects: `, this.actor.appliedEffects);
    Hyp3eLogger.info("getData", `Actor applicable effects: `, this.actor.allApplicableEffects());

    if (!foundry.utils.isNewerVersion(game.version, "13")) {
        // For Foundry v12...
        context.effects = prepareActiveEffectCategories(this.actor.allApplicableEffects());
    } else if (foundry.utils.isNewerVersion(game.version, "13")) {
        // For Foundry v13...
        context.effects = prepareActiveEffectCategories(this.actor.allApplicableEffects());
    }

    // Enrich the description field for TinyMCE editors.
    context.enrichedBiography = await TextEditor.enrichHTML(
        context.system.biography,
        { 
            rollData: context.rollData, 
            async: true 
        }
    );

    // Log the complete actor sheet data
    Hyp3eLogger.info("getData", `Actor sheet data complete:`, context);

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
            const actorData = context.system
            // Have we selected a class yet?
            if (context.system.details.class) {
                // Flag attributes that are too low for the character class
                switch (k) {
                    case "str":
                        if (Hyp3eCharacter.isAttributeLow(actorData, k)) {
                            Hyp3eLogger.warn("_prepareCharacterData", `ST is too low for ${context.system.details.class}!`)
                            context.warnStr = true
                        }
                        break
                    case "dex":
                        if (Hyp3eCharacter.isAttributeLow(actorData, k)) {
                            Hyp3eLogger.warn("_prepareCharacterData", `DX is too low for ${context.system.details.class}!`)
                            context.warnDex = true
                        }
                        break
                    case "con":
                        if (Hyp3eCharacter.isAttributeLow(actorData, k)) {
                            Hyp3eLogger.warn("_prepareCharacterData", `CN is too low for ${context.system.details.class}!`)
                            context.warnCon = true
                        }
                        break
                    case "int":
                        if (Hyp3eCharacter.isAttributeLow(actorData, k)) {
                            Hyp3eLogger.warn("_prepareCharacterData", `IN is too low for ${context.system.details.class}!`)
                            context.warnInt = true
                        }
                        break
                    case "wis":
                        if (Hyp3eCharacter.isAttributeLow(actorData, k)) {
                            Hyp3eLogger.warn("_prepareCharacterData", `WS is too low for ${context.system.details.class}!`)
                            context.warnWis = true
                        }
                        break
                    case "cha":
                        if (Hyp3eCharacter.isAttributeLow(actorData, k)) {
                            Hyp3eLogger.warn("_prepareCharacterData", `CH is too low for ${context.system.details.class}!`)
                            context.warnCha = true
                        }
                        break
                    default:
                        break
                }
            }
            // If the attribute is NOT at its default 10, set disableQuickCreate to true
            if (v.value != 10 && !this.actor.getFlag(game.system.id, "disableQuickCreate")) {
                this.actor.setFlag(game.system.id, "disableQuickCreate", true)
                Hyp3eLogger.info("_prepareCharacterData", `Attribute ${k} is not at default 10, disabling quick-create!`);
            }
        }

        // Handle movement types
        for (let [k, v] of Object.entries(context.system.movement)) {
            if (k == "tempMvMod") continue;
            v.label = game.i18n.localize(CONFIG.HYP3E.movement[k]) ?? k;
        }

        // Handle money types
        for (let [k, v] of Object.entries(context.system.money)) {
            v.label = game.i18n.localize(CONFIG.HYP3E.money[k]) ?? k;
        }

        // Global system settings
        context.enableAttrChecks = CONFIG.HYP3E.enableAttrChecks
        context.characterClasses = CONFIG.HYP3E.characterClasses
        context.races = CONFIG.HYP3E.races
        context.languages = CONFIG.HYP3E.languages

        // System-defined roll modes
        context.rollModes = CONFIG.Dice.rollModes

        // We can set these two constants even if they aren't used (when encumbrance is disabled)
        const encumberedWt = this.actor.system.attributes.str.value * game.settings.get(game.system.id, "encumbered")
        const heavilyEncumberedWt = this.actor.system.attributes.str.value * game.settings.get(game.system.id, "heavilyEncumbered")
        if (game.settings.get(game.system.id, "enableEncumbrance")) {
            if (context.encumbrance > heavilyEncumberedWt) {
                Hyp3eLogger.info("_prepareCharacterData", `${this.actor.name} is Heavily Encumbered!`);
                this.actor.setFlag(game.system.id, "isHeavilyEncumbered", true)
                this.actor.setFlag(game.system.id, "isEncumbered", false)
                context.isHeavilyEncumbered = true
                context.isEncumbered = false
            } else if (context.encumbrance > encumberedWt) {
                Hyp3eLogger.info("_prepareCharacterData", `${this.actor.name} is Encumbered!`);
                this.actor.setFlag(game.system.id, "isEncumbered", true)
                this.actor.setFlag(game.system.id, "isHeavilyEncumbered", false)
                context.isEncumbered = true
                context.isHeavilyEncumbered = false
            } else {
                Hyp3eLogger.info("_prepareCharacterData", `${this.actor.name} is not Encumbered. :-)`);
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
        // Load Phenotypes
        context.phenotypes = CONFIG.HYP3E.phenotypes
    
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

        // Encumbrance is a running sum of all weight carried
        let encumbrance = 0
        // allTheGold is a running sum of all item gp values
        let allTheGold = 0.0

        // Iterate through items, adding encumbrance and allocating to tab-groups
        for (let i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;
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
                        encumbrance += i.system.carriedWt
                    } else if (i.type === 'weapon' || i.type === 'armor') {
                        i.system.carriedWt = (i.system.weight * i.system.quantity.value)
                        i.system.carriedWt = Math.round(i.system.carriedWt * 10)/10
                        encumbrance += i.system.carriedWt
                    } else {
                        i.system.carriedWt = 0
                    }
                // } else { // Assume quantity of 1
                //     i.system.carriedWt = i.system.weight
                //     encumbrance += i.system.weight
                }
            }
            // Calculate the gp value of the item, taking qty x cost. If qty is empty, assume 1.
            //  If cost is empty, assume 0.
            if (i.system.cost) {
                const baseGpVal = Hyp3eCharacter.parseGpValue(i.system.cost)
                if (baseGpVal) {
                    i.system.value = Math.round((baseGpVal * (i.system.quantity.value ? i.system.quantity.value : 1))*100)/100
                    allTheGold += i.system.value
                } else {
                    i.system.value = null
                }
            } else {
                i.system.value = 0
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
            if (i.type === 'armor' || i.type === 'shield') {
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
        allTheGold = Math.round(allTheGold * 100)/100
        // Now convert allTheGold to a string and add " gp" to the end
        allTheGold = allTheGold.toLocaleString("en-US", {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2,
                                                }) + " gp";

        // Assign and return
        context.encumbrance = encumbrance;
        context.allTheGold = allTheGold;
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

    // Enrich all .item-description fields
    // Wrap async logic in an IIFE
    (async () => {
        const descriptions = html.find(".item-description");
        for (const el of descriptions) {
            const raw = el.innerHTML;
            // Skip if no inline roll expressions are present
            if (!/\[\[\/(r|gmr|pr)/i.test(raw)) continue;

            const enriched = await TextEditor.enrichHTML(raw, {
                async: true,
                secrets: false,
                rollData: this.actor.getRollData(),
            });
            el.innerHTML = enriched;
        }
    })();

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Set character languages
    html.find('.languages-button[data-control="set-languages"]').click((ev) => {
        Hyp3eActorSheet.LANGUAGES_APP.render(true, { actorUuid: this.actor.uuid, focus: true });
    });

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
      // Delete the item (active effects are deleted automatically at the same time)
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Toggle equip/unequip or carry/drop item
    html.find(".item-equip").click(async (event) => {
        const li = $(event.currentTarget).closest(".item-entry")
        const item = this.actor.items.get(li.data("itemId"))
        // Do the equip/unequip
        await item.update({
            system: {
                equipped: !item.system.equipped,
            },
        })
        // Disable or enable any active effects coming from the item
        if (!item.system.equipped) {
            // Disable effects
            disableItemEffectsOnActor(item, this.actor.id)
        } else {
            // Enable effects
            enableItemEffectsOnActor(item, this.actor.id)
        }
        // Send a chat message that the item was equipped/unequipped or carried/dropped
        const itemName = item.system.friendlyName ? item.system.friendlyName : item.name
        let equipText = ""
        let containerText = ""
        if (item.type === "armor" || item.type === "shield" || item.type === "weapon") {
            equipText = item.system.equipped ? "equipped" : "unequipped"
        } else if (item.type === "item" || item.type === "container") {
            equipText = item.system.equipped ? "is carrying" : "dropped"
            // If this is a container, carry or drop the contents too
            if (item.system.isContainer || item.type === "container") {
                this._carryOrDropContainer(item)
                containerText = " and its contents"
            }
        }
        const message = `${this.actor.name} ${equipText} <strong>${itemName}</strong>${containerText}.`
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

    // Light sources toggle
    html.find(".item-toggle-light").on("click", async ev => {
        const itemId = ev.currentTarget.closest(".item")?.dataset?.itemId;
        const item = this.actor.items.get(itemId);
        // Toggle the light source
        if (item.system.isLightSource) {
            // Toggle the light source on/off
            await this.actor.toggleLightSource(itemId);
            // Update the UI
            this.render(true);
        } else {
            const msg = `${item.name} is not a valid light source!`;
            Hyp3eLogger.warn("item-toggle-light click", msg);
            ui.notifications.warn(msg);
        }
    });

    // Items that have their own spells or features to use
    html.find(".item-cast-spell").on("click", async ev => {
        const itemId = ev.currentTarget.closest(".item")?.dataset?.itemId;
        const item = this.actor.items.get(itemId);
        const itemName = item.system.friendlyName ? item.system.friendlyName : item.name

        // Are we enforcing the weapon equippage rule for PCs?
        if (CONFIG.HYP3E.forceWeaponEquip && this.actor.type === "character") {
            // Check if the item is equipped
            if (!item.system.equipped) {
                ui.notifications.warn(`${itemName} is not equipped!`)
                return
            }
        }

        // Select spell (if multiple)
        const spellRefs = item.system?.spellcasting?.spellRefs ?? [];
        if (spellRefs.length === 1) {
            this.actor.useItemSpell(item, spellRefs[0].uuid);
        } else {
            // Prompt to select which spell
            const options = await Promise.all(spellRefs.map(async ref => {
                const doc = await fromUuid(ref.uuid);
                const charges = ref.charges;
                const label = doc?.name ?? ref;
                return `<option value="${ref.uuid}">${label}</option>`;
            }));
            const optionsHtml = options.join("");

            new Dialog({
                title: "Choose Spell or Feature",
                content: `<form><div class="form-group">
                            <label>Spell</label>
                            <select id="spell-choice">${optionsHtml}</select>
                            </div></form>`,
                buttons: {
                    cast: {
                        label: "Cast",
                        callback: html => {
                            const spellUuid = html.find("#spell-choice").val();
                            this.actor.useItemSpell(item, spellUuid);
                        }
                    },
                    cancel: { label: "Cancel" }
                }
            }).render(true);
        }
    });

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
    Hyp3eLogger.info("_updateBonusSpell", `Actor after update:`, this.actor.system);
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
    // Use actor's system data to pass to item._displayItemInChat()
    const actorData = this.actor.getRollData()
    // Use the item's display function to do it
    item._displayItemInChat(actorData)
  }

    /**
     * Handle dropping items on the actor sheet
     * @param {*} event - Item drop event
     * @param {*} data - Item data
     * @returns null
     */
    async _onDropItem(event, data) {
        const item = await Item.implementation.fromDropData(data);
        if (!item) return;

        // If this is a normal item, fall back to the default behavior
        if (item.type !== "effectTemplate") {
            return super._onDropItem(event, data);
        }

        // If this is an effect template, copy its ActiveEffects
        const effects = item.effects.contents.map(e => e.toObject());
        if (!effects.length) {
            Hyp3eLogger.warn("_onDropItem", `No ActiveEffects found on effect template: ${item.name}`);
            return;
        }

        // Duplicate onto this actor
        await this.actor.createEmbeddedDocuments("ActiveEffect", effects);

        const msg = `Applied ${effects.length} effect(s) from template "${item.name}" to ${this.actor.name}.`;
        Hyp3eLogger.info("_onDropItem", msg)
        ui.notifications.info(msg);

        return;
    }

    /**
     * Handle sorting of items in inventory lists
     * @param {*} event - Item sort event
     * @param {*} itemData - Item data
     * @returns null
     */
    _onSortItem(event, itemData) {
        // Get the drag source and drop target
        const items = this.actor.items;
        const source = items.get(itemData._id);

        const dropTarget = event.target.closest("[data-item-id]");
        if ( !dropTarget ) return;

        const target = items.get(dropTarget.dataset.itemId);

        // Don't sort on yourself
        if ( source.id === target.id ) return;

        // Dragging an item into a container sets its containerId and location to the container
        if ( (target?.type === "container" || target?.system.isContainer) ) {
            // One container cannot hold another container
            if (source.type === 'container' || source.system.isContainer) { 
                ui.notifications.info(`Cannot move container (${source.name}) into another container (${target.name})!`)
                return;
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
    // const dataset = element.dataset
    const dataset = { ...event.currentTarget.dataset };

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
  
        case "quick-create":
            if (!this.actor.system.details.class) {
                ui.notifications.warn("Please select a character class!");
                return;
            }
            // Quickly roll up a character of the selected class
            let createOk = await Hyp3eCharacter.quickCreateCharacter(dataset);
            if (createOk) {
                ui.notifications.info("Character created!")
                this.render()
            } else {
                ui.notifications.error("Character creation failed. Please check the console for errors.")
            }
            break;

        case "setAttr":
            // Take the attribute scores and class, and lookup/calculate modifiers
            let setAttrOk = await Hyp3eCharacter.setAttributeMods(dataset, false)
            if (setAttrOk) {
                this.render()
                this.actor.setFlag(game.system.id, "disableQuickCreate", true)
            }
            break;

        case "levelUp":
            // Check current XP, and level up if possible
            let levelUpOk = await Hyp3eCharacter.levelUp(dataset)
            if (levelUpOk) {
                this.render()
            }
            break

        default:
            // This should never happen, all rolls should have a roll-type
            const msg = `No Roll Type provided, this should never happen...`;
            Hyp3eLogger.warn("_onRoll", msg);
            ui.notifications.info(msg);
      }
      
    } catch(err) {
        // Log the error
        Hyp3eLogger.error("_onRoll", `Error:`, err)
    }
  }

}
