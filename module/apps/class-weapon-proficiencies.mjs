import HYP3E from "../helpers/config.mjs";
import { Hyp3eLogger } from "../helpers/logger.mjs";

const {
  HandlebarsApplicationMixin,
  ApplicationV2
} = foundry.applications.api;

export default class HYP3EClassWeaponProficiencies extends HandlebarsApplicationMixin(ApplicationV2) {
  // _highlighted;
  constructor(classTemplateUuid, options={}) {
    super(options);
    this.classTemplateUuid = classTemplateUuid;
  }

  // ===========================================================================
  // APPLICATION SETUP
  // ===========================================================================
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    id: "class-weapon-proficiencies",
    classes: ["hyp3e", "class-weapon-proficiencies"],
    tag: "form",
    window: {
      title: "HYP3E.classEditor.favoredWeapons",
      icon: "fa-book",
      contentClasses: ["standard-form"]
    },
    actions: {
      toggleWeapon: HYP3EClassWeaponProficiencies.toggleWeapon
    },
    form: {
      handler: undefined,
      submitOnChange: true,
      closeOnSubmit: false
    },
    position: {
      width: 300,
      height: "auto"
    }
  }

  get title() {
    return `${game.i18n.localize(this.options.window.title)}`;
  }

  static PARTS = {
    main: {
      template: `${HYP3E.templatePath}/apps/class-weapon-proficiencies.hbs`
    }
  }


  // ===========================================================================
  // RENDER SETUP
  // ===========================================================================

  async _prepareContext(_options) {
    const classTemplate = await fromUuid(_options.classTemplateUuid)
    if (!classTemplate) {
      const msg = `No class template found for Uuid ${_options.classTemplateUuid}!`;
      Hyp3eLogger.warn("HYP3EClassWeaponProficiencies _prepareContext", msg)
      ui.notifications.warn(msg)
      return
    }
    let weapons = CONFIG.HYP3E.weapons;

    return {
      // Return the classTemplate and weapons
      classTemplateUuid: _options.classTemplateUuid,
      classTemplate: classTemplate,
      weapons: weapons
    }
  }

  _onRender(context, options) {
      super._onRender(context, options);
  }


  // ===========================================================================
  // UPDATING
  // ===========================================================================

  static async toggleWeapon(event, target) {
      const classTemplate = await fromUuid(target.dataset.classTemplateUuid)
      if (!classTemplate) {
          const msg = `No class template found for Uuid ${target.dataset.classTemplateUuid}!`
          Hyp3eLogger.warn("HYP3EClassWeaponProficiencies toggleWeapon", msg);
          ui.notifications.warn(msg)
          return
      }

      // Check to see if the weapon is already in the list, return true or false
      function checkWeapon(weapon) {
          return weapon != target.dataset.control
      }

      // Toggle this weapon on/off for the class template
      let newList = [];
      let weapons;
      if (classTemplate.system?.weaponProficiencies) {
          weapons = [...classTemplate.system.weaponProficiencies.favoredWeapons];
      } else {
          weapons = []
      }

      // The filter function will delete any entries that match the clicked item, thus toggling it off
      newList = weapons.filter(checkWeapon)
      if (newList.length == weapons.length) {
          // Nothing was deleted, so we will add this to the list, thus toggling it on
          weapons.push(target.dataset.control)
      } else {
          // If something was deleted before, replace weapons with newList
          weapons = newList
      }

      // Sort the weapons alphabetically
      weapons.sort((a, b) => {
          return a.localeCompare(b);
      });
      // Log the results and update the class template
      Hyp3eLogger.info("HYP3EClassWeaponProficiencies toggleWeapon", `${classTemplate.name} favored weapons:`, weapons);
      await classTemplate.update({ "system.weaponProficiencies.favoredWeapons": weapons });

      this.render(true, { classTemplateUuid: target.dataset.classTemplateUuid, focus: true })
  }
}