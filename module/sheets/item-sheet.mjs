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

    // Use a safe clone of the item data for further operations.
    const itemData = context.item;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;

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
      for (let [k, v] of Object.entries(context.item.system.types)) {
        console.log(v, game.i18n.localize(CONFIG.HYP3E.weaponTypes[v]))
        // v.label = game.i18n.localize(CONFIG.HYP3E.weaponTypes[v]) ?? v;
      }
    }
    // Handle armor types
    if (context.item.type == 'armor') {
      for (let [k, v] of Object.entries(context.item.system.types)) {
        console.log("Armor Types:", v, game.i18n.localize(CONFIG.HYP3E.armorTypes[v]))
        // v.label = game.i18n.localize(CONFIG.HYP3E.armorTypes[v]) ?? v;
      }
    }

    // Handle saving throws for spells
    if (context.item.type == 'spell') {
      for (let [k, v] of Object.entries(context.item.system.saves)) {
        console.log(v, game.i18n.localize(CONFIG.HYP3E.saves[v]))
        // v.label = game.i18n.localize(CONFIG.HYP3E.saves[v]) ?? v;
      }
    }
    
  }
  
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.

    // Clicking these links toggles a weapon between melee & missile
    html.find("a.melee-toggle").click(() => {
      this.object.update({ 'system.type.melee': !this.object.system.type.melee });
    });
    html.find("a.missile-toggle").click(() => {
      this.object.update({ 'system.type.missile': !this.object.system.type.missile })
    });

  }
}
