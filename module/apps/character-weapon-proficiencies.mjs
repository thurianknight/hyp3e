import HYP3E from "../helpers/config.mjs";
import { Hyp3eLogger } from "../helpers/logger.mjs";

const {
  HandlebarsApplicationMixin,
  ApplicationV2
} = foundry.applications.api;

export default class HYP3ECharacterWeaponProficiencies extends HandlebarsApplicationMixin(ApplicationV2) {
  // _highlighted;
  constructor(actorUuid, options={}) {
    super(options);
    this.actorUuid = actorUuid;
  }

  // ===========================================================================
  // APPLICATION SETUP
  // ===========================================================================
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    id: "character-weapon-proficiencies",
    classes: ["hyp3e", "character-weapon-proficiencies"],
    tag: "form",
    window: {
      title: "HYP3E.classEditor.favoredWeapons",
      icon: "fa-book",
      contentClasses: ["standard-form"]
    },
    actions: {
      addWeapon: HYP3ECharacterWeaponProficiencies._addWeapon,
      removeWeapon: HYP3ECharacterWeaponProficiencies._removeWeapon
    },
    form: {
      handler: HYP3ECharacterWeaponProficiencies._updateWeapon,
      submitOnChange: true,
      closeOnSubmit: false
    },
    position: {
      width: 500,
      height: "auto"
    }
  }

  get title() {
    return `${game.i18n.localize(this.options.window.title)}`;
  }

  static PARTS = {
    main: {
      template: `${HYP3E.templatePath}/apps/character-weapon-proficiencies.hbs`
    }
  }


  // ===========================================================================
  // RENDER SETUP
  // ===========================================================================

  async _prepareContext(_options) {
    const actor = await fromUuid(_options.actorUuid)
    if (!actor) {
      const msg = `No character found for Uuid ${_options.actorUuid}!`;
      Hyp3eLogger.warn("HYP3ECharacterWeaponProficiencies _prepareContext", msg)
      ui.notifications.warn(msg)
      return
    }
    const weapons = Object.fromEntries(
      CONFIG.HYP3E.weapons.map(w => [w, w])
    );
    Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _prepareContext", `${actor.name} favored weapons:`, actor.system.weaponProficiencies)
    return {
      actorUuid: _options.actorUuid,
      actor: actor,
      weapons: weapons,
      hasWeaponExceptions: true
    }
  }

  _onRender(context, options) {
    super._onRender(context, options);
  }


  // ===========================================================================
  // UPDATING
  // ===========================================================================

  /**
   * Add a new blank weapon proficiency.
   * @param {*} event 
   * @param {*} target 
   */
  static async _addWeapon(event, target) {
    const actor = await fromUuid(target.dataset.actorUuid);
    if (!actor) {
      const msg = `No character found for Uuid ${target.dataset.actorUuid}!`
      Hyp3eLogger.warn("HYP3ECharacterWeaponProficiencies _addWeapon", msg);
      ui.notifications.warn(msg)
      return
    }

    // Insert a new, blank weapon in the list
    const weaponProficiencies = [...actor.system.weaponProficiencies] ?? [];
    weaponProficiencies.push({weapon: "", level: actor.system.details.level.value, mastery: 0, exception: false});
    // Log the results and update the character
    Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _addWeapon", `${actor.name} favored weapons updated:`, weaponProficiencies);
    await actor.update({"system.weaponProficiencies": weaponProficiencies});

    this.render(true, { actorUuid: target.dataset.actorUuid, focus: true })
  }

  /**
   * Update the selected weapon proficiency.
   * @param {*} event 
   * @param {*} target 
   * @returns 
   */
  static async _updateWeapon(event, target) {
    const actor = await fromUuid(event.target.dataset.actorUuid);
    const index = event.target.dataset.index;
    const fieldName = event.target.dataset.fieldName;
    if (!actor) {
      const msg = `No character found for Uuid ${target.dataset.actorUuid}!`
      Hyp3eLogger.warn("HYP3ECharacterWeaponProficiencies _addWeapon", msg);
      ui.notifications.warn(msg)
      return
    }

    // Get current proficiency values from the actor
    const weaponProficiencies = [...actor.system.weaponProficiencies];
    let weaponName = weaponProficiencies[index].weapon;
    let level = weaponProficiencies[index]?.level || 1;
    let mastery = weaponProficiencies[index]?.mastery || 0;
    let exception = weaponProficiencies[index]?.exception || false;
    Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _updateWeapon", `Current weapon proficiency values:`, { weaponName, level, exception });

    // What was changed?
    switch (fieldName) {
      case "weapon":
        weaponName = event.target.value;
        break;
      case "level":
        level = event.target.value;
        break;
      case "exception":
        // These are invalid for an exception
        if (weaponName == "*Any" || weaponName == "") {
          this.render(true, { actorUuid: event.target.dataset.actorUuid, focus: true });
          return;
        }
        exception = event.target.checked;
        break;
      default:
        // Do nothing
    }
    // Update the selected proficiency data
    weaponProficiencies[index] = {
      weapon: weaponName,
      level: level,
      mastery: mastery,
      exception: exception
    }

    // Log the results and update the character
    Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _updateWeapon", `${actor.name} favored weapons updated:`, weaponProficiencies);
    await actor.update({"system.weaponProficiencies": weaponProficiencies});

    this.render(true, { actorUuid: event.target.dataset.actorUuid, focus: true })
  }

  /**
   * Remove the selected weapon proficiency.
   * @param {*} event 
   * @param {*} target 
   */
  static async _removeWeapon(event, target) {
    const actor = await fromUuid(target.dataset.actorUuid);
    const index = target.dataset.index
    if (!actor) {
      const msg = `No character found for Uuid ${target.dataset.actorUuid}!`
      Hyp3eLogger.warn("HYP3ECharacterWeaponProficiencies _removeWeapon", msg);
      ui.notifications.warn(msg)
      return
    }

    // Remove the weapon from the list
    const weaponProficiencies = [...actor.system.weaponProficiencies];
    weaponProficiencies.splice(index, 1);
    // Log the results and update the character
    Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _removeWeapon", `${actor.name} favored weapons updated:`, weaponProficiencies);
    await actor.update({"system.weaponProficiencies": weaponProficiencies});

    this.render(true, { actorUuid: target.dataset.actorUuid, focus: true })
  }

  static async toggleWeapon(event, target) {
    const actor = await fromUuid(target.dataset.actorUuid);
    if (!actor) {
      const msg = `No character found for Uuid ${target.dataset.actorUuid}!`;
      Hyp3eLogger.warn("HYP3ECharacterWeaponProficiencies toggleWeapon", msg);
      ui.notifications.warn(msg);
      return;
    }

    // Check to see if the weapon is already in the list, return true or false
    function checkWeapon(weapon) {
      return weapon != target.dataset.control;
    }

    // Toggle this weapon on/off for the character
    let newList = [];
    let weapons;
    if (actor.system?.weaponProficiencies) {
      weapons = [...actor.system.weaponProficiencies];
    } else {
      weapons = [];
    }

    // The filter function will delete any entries that match the clicked item, thus toggling it off
    newList = weapons.filter(checkWeapon);
    if (newList.length == weapons.length) {
      // Nothing was deleted, so we will add this to the list, thus toggling it on
      weapons.push(target.dataset.control);
    } else {
      // If something was deleted before, replace weapons with newList
      weapons = newList;
    }

    // Sort the weapons alphabetically
    weapons.sort((a, b) => {
      return a.localeCompare(b);
    });
    // Log the results and update the character
    Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies toggleWeapon", `${actor.name} favored weapons:`, weapons);
    await actor.update({ "system.weaponProficiencies.favoredWeapons": weapons });

    this.render(true, { actorUuid: target.dataset.actorUuid, focus: true })
  }
}