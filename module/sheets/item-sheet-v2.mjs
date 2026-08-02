import { HYP3E } from "../helpers/config.mjs"
import { Hyp3eLogger } from "../helpers/logger.mjs";
import {onManageActiveEffectV2, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import HYP3EItemSetAnnotations from "../apps/item-set-annotations.mjs";
import HYP3EItemSetDmgTypes from "../apps/item-set-dmg-types.mjs";
import { findItemsByFolderOrCompendiumName } from "../helpers/folders-and-compendia.mjs"
import HYP3EClassWeaponProficiencies from "../apps/class-weapon-proficiencies.mjs";
import HYP3EClassWeaponExceptions from "../apps/class-weapon-exceptions.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api
const { ItemSheetV2 } = foundry.applications.sheets

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheetV2}
 */
export class Hyp3eItemSheetV2 extends HandlebarsApplicationMixin(ItemSheetV2) {

  static ITEM_ANNOTATIONS_APP = new HYP3EItemSetAnnotations();
  static ITEM_SET_DMG_TYPES_APP = new HYP3EItemSetDmgTypes();
  static WEAPONS_APP = new HYP3EClassWeaponProficiencies();
  static EXCEPTIONS_APP = new HYP3EClassWeaponExceptions();

  // ===========================================================================
  // ITEM SHEET SETUP
  // ===========================================================================

  get title() {
    const typeLabel = game.i18n.localize(`TYPES.item.${this.item.type}`);
    return `${typeLabel}: ${this.item.name}`;
  }

  static DEFAULT_OPTIONS = {
    classes: ["hyp3e", "item"],
    position: {
      width: 600,
      height: 550,
    },
    form: {
      submitOnChange: true
    },
    window: {
      icon: "fas fa-book",
      resizable: true,
    },
    actions: {
      // Item-sheet clickable actions
      editImage: Hyp3eItemSheetV2._onEditImage,
      toggleIdentified: Hyp3eItemSheetV2._toggleIdentified,
      toggleWeaponType: Hyp3eItemSheetV2._toggleWeaponType,
      toggleWeaponHands: Hyp3eItemSheetV2._toggleWeaponHands,
      handleWeaponMastery: Hyp3eItemSheetV2._handleWeaponMastery,
      toggleAtkRoll: Hyp3eItemSheetV2._toggleAtkRoll,
      openItemSheet: Hyp3eItemSheetV2._openItemSheet,
      deleteSpell: Hyp3eItemSheetV2._handleSpellDelete,
      setGrenadeOrAreaEffect: Hyp3eItemSheetV2._onSetGrenadeOrAreaEffect,
      setDmgTypes: Hyp3eItemSheetV2._openDmgTypesApp,
      setAnnotations: Hyp3eItemSheetV2._openAnnotationsApp,
      dropItemDescription: Hyp3eItemSheetV2._toggleItemSummary,
      // ActiveEffect actions
      createEffect: Hyp3eItemSheetV2._onManageActiveEffect,
      editEffect: Hyp3eItemSheetV2._onManageActiveEffect,
      deleteEffect: Hyp3eItemSheetV2._onManageActiveEffect,
      toggleEffect: Hyp3eItemSheetV2._onManageActiveEffect,
      // Class template actions
      toggleSpells: Hyp3eItemSheetV2._toggleSpells,
      setWeapons: Hyp3eItemSheetV2._openWeaponsApp,
      setExceptions: Hyp3eItemSheetV2._openExceptionsApp,
      clearFavoredWeapons: Hyp3eItemSheetV2._clearFavoredWeapons,
      clearExceptions: Hyp3eItemSheetV2._clearExceptions,
      addItem: Hyp3eItemSheetV2._addItem,
      deleteItem: Hyp3eItemSheetV2._deleteItem,
      addFeature: Hyp3eItemSheetV2._addFeature,
      deleteFeature: Hyp3eItemSheetV2._deleteFeature,
    },
  }

  static TABS = {
    primary: {
      tabs: [
        // { id: 'details' },
        // { id: 'attributes' },
        // { id: 'effects' }
      ],
      labelPrefix: 'HYP3E.tabs',
      initial: 'details'
    }
  }

  static PARTS = {
    header: {
      template: `${HYP3E.templatePath}/item/item-header-sheet-v2.hbs`,
    },
    tabs: {
      // Foundry-provided generic template
      template: 'templates/generic/tab-navigation.hbs',
    },
    details: {
      template: `${HYP3E.templatePath}/item/parts/tab-item-details.hbs`,
      scrollable: ["", ".main-content", ".tab-content"],
    },
    attributes: {
      template: `${HYP3E.templatePath}/item/parts/tab-item-attributes.hbs`,
      scrollable: ["", ".main-content"],
    },
    spells: {
      template: `${HYP3E.templatePath}/item/parts/tab-item-spells.hbs`,
      scrollable: ["", ".main-content"],
    },
    effects: {
      template: `${HYP3E.templatePath}/item/parts/tab-item-effects.hbs`,
      scrollable: ["", ".main-content"],
    },
    classAdvancement: {
      template: `${HYP3E.templatePath}/item/parts/tab-class-advancement.hbs`,
      scrollable: ["", ".main-content"],
    },
    classEquipment: {
      template: `${HYP3E.templatePath}/item/parts/tab-class-equipment.hbs`,
      scrollable: ["", ".main-content"],
    }
  }

  // ===========================================================================
  // OVERRIDES
  // ===========================================================================

  /** @override */
  get document() {
    return this.options.document // Document comes from options
  }

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);

    // Class template needs a greater sheet size
    const heights = {
      classTemplate: 700
    };
    const widths = {
      classTemplate: 650
    }

    const type = this.document.type;
    options.position ??= {};
    options.position.width = widths[type] ?? 600;
    options.position.height = heights[type] ?? 550;
  }

  /** @override */
  async _prepareContext(options) {
    // Retrieve base data structure.
    const context = await super._prepareContext(options);
    context.item = this.item
    context.isGM = game.user.isGM
    Hyp3eLogger.info("Hyp3eItemSheetV2 _prepareContext", `Preparing Item Sheet for type "${this.item.type}"...`, { item: this.item, options })

    // For class templates, build baseClass names, spell list names, etc.
    if (this.item.type == "classTemplate") {
      const baseClassNames = ["cleric", "fighter", "magician", "thief"];
      context.baseClasses = Object.fromEntries(baseClassNames.map(n => [n, n.charAt(0).toUpperCase() + n.slice(1)]));

      // const spellcasters = ["Cleric", "Druid", "Magician", "Cryomancer", "Illusionist", "Necromancer", "Pyromancer", "Witch"];
      const spellcasters = CONFIG.HYP3E.spellLists ? Object.values(CONFIG.HYP3E.spellLists) : [];
      context.spellLists = Object.fromEntries(spellcasters.map(n => [n, n]));
      context.spells0 = this.item.system.spellLists[0] ?? "";
      context.spells1 = this.item.system.spellLists[1] ?? "";

      const saves = CONFIG.HYP3E.saves;
      delete saves["base"];
      const savingThrows = {};
      for (const save of Object.keys(saves)) {
        savingThrows[save] = {
          label: game.i18n.localize(`HYP3E.saves.${save}.name`),
          value: this.item.system.saves?.[save] ?? 16,
        };
      }
      context.savingThrows = savingThrows;

      context.favoredWeapons = this.item.system.weaponProficiencies?.favoredWeapons?.join("; ") ?? "";
      context.exceptions = this.item.system.weaponProficiencies?.exceptions?.join("; ") ?? "";

      const abilities = [...this.item.system.abilities] || [""];
      context.abilities = Object.fromEntries(abilities.map(n => [n, n]));

      const armorNames = await findItemsByFolderOrCompendiumName("armor, armour, shield, shields", "armor", "magic, magical");
      const shieldNames = await findItemsByFolderOrCompendiumName("armor, armour, shield, shields", "shield", "magic, magical");
      armorNames.push(...shieldNames);
      context.armorOptions = Object.fromEntries(armorNames.map(n => [n, n]));

      const weaponNames = await findItemsByFolderOrCompendiumName("weapons, melee, missile, ammunition", "weapon", "magic, magical");
      context.weaponOptions = Object.fromEntries(weaponNames.map(n => [n, n]));

      const gearNames = await findItemsByFolderOrCompendiumName("equipment, gear, general, clothing, weapons, ammunition", "item", "religious, religion, provisions, provision, food, supplies, magic, magical");
      context.gearOptions = Object.fromEntries(gearNames.map(n => [n, n]));

      const provisionNames = await findItemsByFolderOrCompendiumName("equipment, provision, provisions, food, supplies", "item", "clothing, gear, general, religious, religion, magic, magical");
      context.provisionOptions = Object.fromEntries(provisionNames.map(n => [n, n]));

      const religiousNames = await findItemsByFolderOrCompendiumName("equipment, religious, religion", "item", "clothing, gear, general, provisions, provision, food, supplies, magic, magical");
      context.religiousOptions = Object.fromEntries(religiousNames.map(n => [n, n]));
    }

    // Retrieve the owner-actor's roll data for TinyMCE editors.
    context.rollData = this.item.actor?.getRollData() ?? {};
    Hyp3eLogger.info("Hyp3eItemSheetV2 _prepareContext", `Roll Data in ItemSheet:`, context.rollData);

    // Prepare item-spell list
    const spellRefs = this.item.system?.spellcasting?.spellRefs ?? [];
    context.spells = (await Promise.all(spellRefs.map(async (ref, i) => ({
      spell: await fromUuid(ref.uuid),
      charges: ref.charges,
      uuid: ref.uuid,
      index: i
    })))).filter(Boolean);

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.item.effects);
    // Add the item's system data and flags to context root for easier access
    context.system = this.item.system;
    context.flags = this.item.flags;

    // Prepare tab and part data
    context.tabs = this._prepareTabs("primary");

    // Log item-sheet context data
    Hyp3eLogger.info("Hyp3eItemSheetV2 _prepareContext", `Item-Sheet Context Data:`, context);
    // Prepare item data & return context
    this._prepareItemData(context);
    return context;
  }

  /**
   * @override
   * Organize and classify data for Item sheets.
   * @param {Object} context - The item to prepare.
   * @return {undefined} - Returns nothing. Modifies context in place.
   */
  _prepareItemData(context) {
    // All item sheets get the same basic data
    context.weaponTypes = CONFIG.HYP3E.weaponTypes;
    context.armorTypes = CONFIG.HYP3E.armorTypes;
    context.shieldTypes = CONFIG.HYP3E.shieldTypes;
    context.weaponAnnotations = CONFIG.HYP3E.weaponAnnotations;
    context.damageTypes = CONFIG.HYP3E.damageTypes;
    context.blindRollOpts = CONFIG.HYP3E.blindRollOpts;
    context.rollModes = CONFIG.Dice.rollModes;
    context.saveThrows = CONFIG.HYP3E.saves;

    // This is mostly an issue with new compendium items
    if (context.item.system.realName?.trim() === "") {
      context.item.system.realName = context.item.name
    } else {
      context.item.name = context.item.system.realName
    }

    // Add isPhysical flag for armor, item, shield, weapon
    context.item.system.isPhysical = ["armor", "item", "shield", "weapon"].includes(context.item.type);

    // Set isShield flag for armor items
    if (context.item.type === 'armor') {
      context.item.system.isShield = context.item.system.type === "shield" ? true : false
    }
    if (context.item.type === 'shield') {
      context.item.system.isShield = true
    }

    // Refresh the annotations list for weapons
    if (context.item.type === 'weapon') {
      context.annotList = []
      try {
        if (Array.isArray(context.item.system?.annotations) && context.item.system?.annotations.length > 0) {
          context.item.system.annotations.forEach(annot => {
            context.annotList.push(context.weaponAnnotations[annot])
          })
        }
      } catch (err) {
        Hyp3eLogger.error("Hyp3eItemSheetV2 _prepareItemData", `Error loading weapon annotations:`, err)
      }
    }
  }

  /** @override */
  async _preparePartContext(partId, context) {
    if (partId === "header" || partId === "tabs") {
      // Header and tabs parts do not need special tab handling
      return context;
    }
    if (!context.tabs || !context.tabs[partId]) {
      Hyp3eLogger.info("Hyp3eItemSheetV2 _preparePartContext", `No tab data found for part "${partId}".`);
      return context;
    }
    // Process tabs
    Hyp3eLogger.info("Hyp3eItemSheetV2 _preparePartContext", `Preparing tab part "${partId}"...`, context);
    if (context.tabs[partId].active) {
      context.tab = context.tabs[partId];
    }

    // Enrich text editor fields as needed
    switch (partId) {
      case 'details':
        // Enrich content for display
        context.realDescriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
          this.document.system.realDescription,
          {
            secrets: this.document.isOwner,
            relativeTo: this.document
          }
        )
        context.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
          this.document.system.description,
          {
            secrets: this.document.isOwner,
            relativeTo: this.document
          }
        )
        break;
      case 'attributes':
        break;
      case 'spells':
        break;
      case 'effects':
        break;
      default:
    }
    return context;
  }

  /** @override */
  _getTabsConfig(group) {
    const tabs = foundry.utils.deepClone(super._getTabsConfig(group))
    const isIdentified = this.document.system?.identified ?? true; // Default to true if not present
    const isGM = game.user.isGM;

    // No matter what, the details tab is always present
    tabs.tabs.push({ id: 'details', group: group });

    // The remaining tabs are only present if the item is identified or user is GM
    if ((isIdentified || isGM) && this.document.type !== "classTemplate") {
      // Insert Attributes tab
      tabs.tabs.push({ id: 'attributes', group: group });

      // Insert Spells tab if item has spellcasting ability
      if (this.document.system?.spellcasting?.hasSpells) {
        tabs.tabs.push({ id: 'spells', group: group })
        // tabs.tabs.splice(tabs.tabs.length - 1, 0, { id: 'spells', group: group });
      }

      // Insert Effects tab at the end of the list
      tabs.tabs.push({ id: 'effects', group: group });
    }

    // Class templates are special!
    if (this.document.type === "classTemplate") {
      tabs.tabs.push({ id: 'attributes', group: group });
      tabs.tabs.push({ id: 'classAdvancement', group: group });
      tabs.tabs.push({ id: 'classEquipment', group: group });
    }

    return tabs
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);

    // If the sheet is not editable, exit early
    if (!this.isEditable) return;

    // Disable mouse wheel and up/down arrows from incrementing or decrementing number input fields
    this.element.querySelectorAll('input[type="number"]').forEach(input => {
      input.addEventListener("wheel", e => {
        if (document.activeElement === input) e.preventDefault();
      }, { passive: false });
  
      input.addEventListener("keydown", e => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
      });
    });

    // Enable drag & drop functionality
    new CONFIG.ux.DragDrop({
      dragSelector: ":is([data-effect-id], [data-spell-id])",
      dropSelector: null,
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this)
      }
    }).bind(this.element);

    // Log render completion
    Hyp3eLogger.info("Hyp3eItemSheetV2 _onRender", `Item Sheet rendered and listeners activated.`, { context, options, sheet: this });
  }

  /** @override */
  _processFormData(event, form, formData) {
    // This is where we can manipulate the formData before it's applied to the item
    Hyp3eLogger.info("Hyp3eItemSheetV2 _processFormData", `Processing form data...`, { event, form, formData });
    Hyp3eLogger.info("Hyp3eItemSheetV2 _processFormData", `this item:`, this.item);

    // const formDataObj = formData.object;
    const formDataObj = foundry.utils.expandObject(formData.object);
    // Not all item types have identification, so default to identified=true
    const isIdentified = foundry.utils.getProperty(formDataObj, "system.identified") ?? this.item.system.identified;
    Hyp3eLogger.info("Hyp3eItemSheetV2 _processFormData", `Is item identified?`, isIdentified);

    // Apply name and description based on identification state.
    if (isIdentified) {
      const realName = foundry.utils.getProperty(formDataObj, "system.realName") || this.item.system.realName;
      const realDesc = foundry.utils.getProperty(formDataObj, "system.realDescription") ?? this.item.system.realDescription;

      formDataObj["name"] = realName;
      formDataObj["system.description"] = realDesc;
    } else {
      let aliasName = foundry.utils.getProperty(formDataObj, "system.itemAlias") || this.item.system.itemAlias;
      const aliasDesc = foundry.utils.getProperty(formDataObj, "system.aliasDescription") ?? this.item.system.aliasDescription;

      // Ensure aliasName is not empty or just whitespace
      if (!aliasName || aliasName.trim() === "") {
        aliasName = "Unidentified Item";
        formDataObj["system.itemAlias"] = aliasName;
      }

      formDataObj["name"] = aliasName.trim();
      formDataObj["system.description"] = aliasDesc;
    }

    // Item-spell references must be converted from a keyed object to an array
    // const data = foundry.utils.expandObject(formData.object);
    const refs = foundry.utils.getProperty(formDataObj, "system.spellcasting.spellRefs");
    if (refs && !Array.isArray(refs)) {
      formDataObj.system.spellcasting.spellRefs = Object.values(refs);
    }

    // Merge updated formDataObj back into formData.object, and log the data
    Hyp3eLogger.info("Hyp3eItemSheetV2 _processFormData", `Updated form data:`, formDataObj);
    foundry.utils.mergeObject(formData.object, formDataObj, {performDeletions: true});
    Hyp3eLogger.info("Hyp3eItemSheetV2 _processFormData", `Merged form data:`, formData);

    return super._processFormData(event, form, formData);
  }

  _prepareSubmitData(event, form, formData, updateData) {
    Hyp3eLogger.info("Hyp3eItemSheetV2 _prepareSubmitData", `Preparing submitted data...`, { formData, updateData });
    return super._prepareSubmitData(event, form, formData, updateData);
  }

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  /**
   * Allow the user to select an item image from the FilePicker
   * @param {*} event 
   * @param {*} target 
   */
  static async _onEditImage(event, target) {
    const field = target.dataset.field || "img"
    const current = foundry.utils.getProperty(this.document, field)

    // const fp = new foundry.applications.apps.FilePicker({
    const fp = new foundry.applications.apps.FilePicker.implementation({
      type: "image",
      current: current,
      callback: (path) => this.document.update({ [field]: path })
    })

    fp.render(true)
  }

  /**
   * Toggle item identified state
   * @param {*} event 
   * @param {*} target 
   */
  static async _toggleIdentified(event, target) {
    Hyp3eLogger.info("Hyp3eItemSheetV2 _toggleIdentified", `Toggling item identified state...`, { event, target });
    const identified = target.checked;
    await this.item.toggleIdentified(identified);
  }

  /**
   * Toggle weapon type (melee/missile)
   * @param {*} event 
   * @param {*} target 
   */
  static async _toggleWeaponType(event, target) {
    Hyp3eLogger.info("Hyp3eItemSheetV2 _toggleWeaponType", `Toggling weapon type...`, { event, target });
    const attackType = target.dataset["attackType"];
    await this.item.updateWeaponType(attackType);
    await this.item.applyAttackFormula();
  }

  /**
   * Toggle number of hands required to wield weapon (1/2)
   * @param {*} event 
   * @param {*} target 
   */
  static async _toggleWeaponHands(event, target) {
    Hyp3eLogger.info("Hyp3eItemSheetV2 _toggleWeaponHands", `Toggling weapon hands...`, { event, target });
    const hands = target.dataset["hands"];
    await this.item.updateWeaponHands(hands);
  }

  /**
   * Handle weapon mastery and grand-mastery toggles
   * @param {*} event 
   * @param {*} target 
   */
  static async _handleWeaponMastery(event, target) {
    Hyp3eLogger.info("Hyp3eItemSheetV2 _handleWeaponMastery", `Updating weapon mastery...`, { event, target });
    const mastery = target.dataset["mastery"];
    await this.item.updateWeaponMastery(mastery);
  }

  /**
   * Handle attack roll checkbox toggle
   * @param {*} event 
   * @param {*} target 
   */
  static async _toggleAtkRoll(event, target) {
    Hyp3eLogger.info("Hyp3eItemSheetV2 _toggleAtkRoll", `Toggling spell attack roll...`, { event, target });
    if (target.checked) {
      // Set a default spell attack roll formula
      const atkRoll = "1d20 + @fa";
      await this.item.update({ "system.formula": atkRoll });
    } else {
      await this.item.update({ "system.formula": "" });
    }
  }

  /**
   * Handle checkbox changes related to isGrenade and isAreaEffect
   * @param {*} event 
   * @param {*} target 
   * @private
   */
  static async _onSetGrenadeOrAreaEffect(event, target) {
    Hyp3eLogger.info("Hyp3eItemSheetV2 _onSetGrenadeOrAreaEffect", `Handling grenade/area-effect checkbox change...`, { event, target });
    // The trick is that we need to get the current state of both checkboxes, not just the one that was clicked
    const html = $(event.currentTarget).closest("form");
    const isGrenade = html.find('input[name="system.isGrenade"]').prop("checked");
    const isAreaEffect = html.find('input[name="system.isAreaEffect"]').prop("checked");
    Hyp3eLogger.info("Hyp3eItemSheetV2 _onSetGrenadeOrAreaEffect", `isGrenade: ${isGrenade}, isAreaEffect: ${isAreaEffect}`);

    // Update the item with both values
    await this.item.updateGrenadeOrAreaEffect(isGrenade, isAreaEffect);
    // Apply attack formula logic
    await this.item.applyAttackFormula();
  }

  // Open the Annotations app
  static _openAnnotationsApp() {
    Hyp3eItemSheetV2.ITEM_ANNOTATIONS_APP.render(true, { itemUuid: this.item.uuid, focus: true })
  }

  // Open the Damage Types app
  static _openDmgTypesApp() {
    Hyp3eItemSheetV2.ITEM_SET_DMG_TYPES_APP.render(true, { itemUuid: this.item.uuid, focus: true })
  }

  /**
   * Active Effect management handler
   * @param {*} event 
   * @param {*} target 
   */
  static async _onManageActiveEffect(event, target) {
    event.preventDefault();
    event.stopPropagation();
    const action = target.dataset["action"];
    // Log the action and then handle it
    Hyp3eLogger.info("Hyp3eItemSheetV2 _onManageActiveEffect", `Managing active effect...`, { event, target, action });
    await onManageActiveEffectV2(target, this.item);

    // Re-render the sheet to reflect changes
    this.render();
  }

  // Spell delete handler
  static async _handleSpellDelete(event, target) {
    const uuid = target.dataset["spellId"]
    await this.item.removeSpell(uuid);
    this.render();
  }

  /**
   * Handle toggling an Item description in the character sheet.
   * @param {Event} event  The originating click event
   * @private
   */
  static _toggleItemSummary(event, target) {
    event.preventDefault()
    Hyp3eLogger.info("Hyp3eItemSheetV2 _toggleItemSummary", `Toggling item summary...`, { event, target });
    const summary = target.closest(".item-entry.item").querySelector(".item-summary");
    summary.style.display = summary.style.display === "block" ? "" : "block";
  }

  /**
   * Handle opening an embedded spell's item sheet.
   * @param {Event} event  The originating click event
   * @private
   */
  static async _openItemSheet(event, target) {
    Hyp3eLogger.info("Hyp3eItemSheetV2 _openItemSheet", `Opening spell sheet...`, { event, target });
    const item = await fromUuid(target.dataset["spellId"]);
    if (item?.sheet) item.sheet.render(true);
  }

  
  // ===========================================================================
  // CLASS TEMPLATE FUNCTIONS
  // ===========================================================================

  /**
   * Toggles the spellcaster flag true/false, which controls whether the Spell Lists section is shown
   * @param {*} event 
   * @param {*} target
   */
  static async _toggleSpells(event, target) {
    const value = target.dataset.value;
    Hyp3eLogger.info("HYP3EItemSheetV2 _toggleSpells", `Toggle spells clicked:`, target);
    await this.item.update({ "system.spellcaster": !this.item.system.spellcaster });
  }

  // Open the Favoured Weapons app
  static _openWeaponsApp() {
    Hyp3eItemSheetV2.WEAPONS_APP.render(true, { classTemplateUuid: this.item.uuid, focus: true });
  }

  // Clear the Favoured Weapons list
  static async _clearFavoredWeapons() {
    Hyp3eLogger.info("Hyp3eItemSheetV2 _clearFavoredWeapons", `Clearing Favoured Weapons list...`, { item: this.item });
    await this.item.update({ "system.weaponProficiencies.favoredWeapons": [] });
  }

  // Open the Exceptions app
  static _openExceptionsApp() {
    Hyp3eItemSheetV2.EXCEPTIONS_APP.render(true, { classTemplateUuid: this.item.uuid, focus: true });
  }

  // Clear the Exceptions list
  static async _clearExceptions() {
    Hyp3eLogger.info("Hyp3eItemSheetV2 _clearExceptions", `Clearing Exceptions list...`, { item: this.item });
    await this.item.update({ "system.weaponProficiencies.exceptions": [] });
  }

  /**
   * Add a blank class feature
   * @param {*} event 
   * @param {*} target 
   * @returns 
   */
  static async _addFeature(event, target) {
    const features = [...this.item.system.abilities];
    features.push("");
    await this.item.update({ "system.abilities": features });
  }
  
  /**
   * Delete a feature from the class features list
   * @param {*} event 
   * @param {*} target 
   */
  static async _deleteFeature(event, target) {
      const index = parseInt(target.dataset.index);
      const features = [...this.item.system.abilities];

      // Log the delete data
      Hyp3eLogger.info("Hyp3eItemSheetV2 deleteFeature", "Deleting feature:", { index });

      if (!isNaN(index)) features.splice(index, 1);
      await this.item.update({ "system.abilities": features });
  }

  /**
   * Add a blank item to the requested items list
   * @param {*} event 
   * @param {*} target 
   */
  static async _addItem(event, target) {
    const packName = target.dataset.pack;
    const pack = [...this.item.system.startingPack[packName]];
    Hyp3eLogger.info("HYP3EItemSheetV2 _addItem", `Adding new item to ${packName}:`, pack);

    // Add the new item to the correct pack
    pack.push({ name: "", quantity: 1 });
    await this.item.update({ [`system.startingPack.${packName}`]: pack });
  }

  /**
   * Delete an item from the requested items list
   * @param {*} event 
   * @param {*} target 
   */
  static async _deleteItem(event, target) {
      const packName = target.dataset.pack;
      const index = parseInt(target.dataset.index);
      const pack = [...this.item.system.startingPack[packName]];

      // Log the delete data
      Hyp3eLogger.info("Hyp3eItemSheetV2 _deleteItem", `Deleting item ${index} from ${packName}:`, pack);

      if (!isNaN(index)) pack.splice(index, 1);
      await this.item.update({ [`system.startingPack.${packName}`]: pack });
  }


  // ===========================================================================
  // DRAG AND DROP HANDLERS
  // ===========================================================================

  /**
   * Helper for drag & drop events, to get the element dataset
   * @param {*} element 
   * @param {*} attribute 
   * @returns 
   */
  static findDataset(element, attribute) {
    while (element && !(attribute in element.dataset)) {
      element = element.parentElement
    }
    return element?.dataset[attribute] || null
  }

  async _onDragStart(event) {
    event.stopPropagation();
    Hyp3eLogger.info("Hyp3eItemSheetV2 _onDragStart", `Drag start event:`, event);
    const index = Hyp3eItemSheetV2.findDataset(event.target, "index");
    const dragData = {
      type: "Item",
      uuid: event.target.dataset["spellId"] ?? event.target.dataset["effectId"] ?? null,
      index: index,
      data: {
        uuid: this.item.uuid,
        type: this.item.type
      }
    };
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    Hyp3eLogger.info("Hyp3eItemSheetV2 _onDragStart", `Started dragging item...`, { event, dragData });
  }

  _onDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    // Optionally, we could add visual feedback for valid drop targets
  }

  async _onDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    // Prevent multiple handling of the same event
    if (event._dropHandled) return;
    event._dropHandled = true;

    // Read dropped data
    const dataTransfer = event.dataTransfer?.getData("text/plain");
    if (!dataTransfer) return;

    let dropData;
    try {
      dropData = JSON.parse(dataTransfer);
      Hyp3eLogger.info("Hyp3eItemSheetV2 _onDrop", `Dropped data:`, dropData);
    } catch {
      return;
    }

    // Verify it's an Item drop
    if (dropData.type !== "Item") return;

    // Lookup the dropped item
    const uuid = dropData.uuid ?? dropData.data?.uuid;
    let droppedItem = null;
    droppedItem = await fromUuid(uuid);
    if (!droppedItem) {
      // This shouldn't happen, but just in case
      Hyp3eLogger.warn("Hyp3eItemSheetV2 _onDrop", `Could not retrieve dropped item with UUID: ${uuid}. Trying effects...`);
      droppedItem = this.item.effects.get(uuid);
    }
    Hyp3eLogger.info("Hyp3eItemSheetV2 _onDrop", `Dropped item:`, droppedItem);
    if (!droppedItem) return;

    // If a spell was dropped, either re-sort the list or add the spell to this item
    if (droppedItem.type === "spell") {
      // Update spell sort order if the drop was an existing spell (has a valid fromIndex)
      const fromIndex = Number(dropData.index);
      const toElement = event.target.closest(".spell-entry");
      const toIndex = Number(toElement?.dataset.index);
      if (Number.isInteger(fromIndex) && Number.isInteger(toIndex) && fromIndex !== toIndex) {
        Hyp3eLogger.info("Hyp3eItemSheetV2 _onDrop", `Handling spell re-ordering...`, { fromIndex, toElement });
        await this.item.reorderSpell(fromIndex, toIndex);
        this.render();
      }
      if (Number.isInteger(fromIndex) && fromIndex >= 0) return;

      // If there is no fromIndex, this is a new drop, so we add the spell to the item
      const spellRefs = foundry.utils.deepClone(this.item.system.spellcasting?.spellRefs ?? []);
      if (spellRefs.some(ref => ref.uuid === uuid)) {
        // Prevent duplicate inserts
        const msg = `Spell ${droppedItem.name} is already linked to this item.`;
        ui.notifications.warn(msg);
        Hyp3eLogger.warn("Hyp3eItemSheetV2 _onDrop", msg);
        return;
      }
      await this.item.addSpell(droppedItem);
    }

    // NOTE: Effects cannot be reordered via drag & drop at this time

    // If an effectTemplate was dropped, add the effect to the item
    if (droppedItem.type === "effectTemplate") {
      const droppedEffectNames = droppedItem.effects.map(e => e.name);
      const existing = this.item.effects.find(e => droppedEffectNames.includes(e.name));
      if (existing) { 
        // Prevent duplicate inserts
        const msg = `Effect ${existing.name} is already linked to this item.`;
        ui.notifications.warn(msg);
        Hyp3eLogger.warn("Hyp3eItemSheetV2 _onDrop", msg);
        return; 
      }

      // Copy the effectTemplate's ActiveEffects to this item
      const effects = droppedItem.effects.contents.map(e => {
        let effectData = e.toObject();
        effectData.origin = this.item.uuid;
        effectData.sourceName = this.item.system?.friendlyName ? this.item.system.friendlyName : this.item.name;
        return effectData;
      });

      if (!effects.length) {
        const msg = `No ActiveEffects found on template: ${droppedItem.name}`;
        Hyp3eLogger.warn("Hyp3eItemSheetV2 _onDrop", msg);
        ui.notifications.warn(msg);
        return;
      }

      // Duplicate template effects onto this item
      await this.item.createEmbeddedDocuments("ActiveEffect", effects);

      const msg = `Applied ${effects.length} effect(s) from template "${droppedItem.name}" to ${this.item.name}.`;
      Hyp3eLogger.info("Hyp3eItemSheetV2 _onDrop", msg);
      ui.notifications.info(msg);
    }

    // Re-render the sheet
    this.render();
  }

}
