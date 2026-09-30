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

  static CANONICAL = [
    "Axe, Battle", "Axe, Great", "Axe, Hand",
    "Bardiche", "Bill", "Cæstuses", "Chain Whip",
    "Club, Light", "Club, War",
    "Dagger", "Dagger, Silver",
    "Falcata", "Fauchard",
    "Flail, Footman's", "Flail, Horseman's",
    "Garrotte", "Glaive", "Halberd",
    "Hammer, Great", "Hammer, Horseman's", "Hammer, War",
    "Javelin", "Lance", "Lasso",
    "Mace, Footman's", "Mace, Great", "Mace, Horseman's",
    "Monk's Empty Hand Attack", "Morning Star",
    "Pick, Horseman's", "Pick, War",
    "Pike", "Poleaxe", "Quarterstaff",
    "Scimitar, Great", "Scimitar, Long", "Scimitar, Short", "Scimitar, Two-handed",
    "Sickle",
    "Spear, Great", "Spear, Long", "Spear, Short",
    "Staff, Spiked",
    "Sword, Bastard", "Sword, Broad", "Sword, Great", "Sword, Long", "Sword, Short", "Sword, Two-handed",
    "Tonfa", "Trident, Hand", "Trident, Long", "Whip",
    "Blowgun", "Bola", "Boomerang",
    "Bow, Long", "Bow, Long, Composite", "Bow, Short", "Bow, Short, Composite",
    "Crossbow, Heavy", "Crossbow, Light", "Crossbow, Repeating",
    "Dart",
    "Holy Water/Oil (thrown)", "Hooked Throwing Knife",
    "Needle, Blowgun", "Net, Fighting",
    "Oil, Incendiary (thrown)", "Sling"
  ];

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
      hasWeaponExceptions: this._hasExceptions(actor.system.weaponProficiencies)
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

    // Refresh the display
    this.render(true, { actorUuid: target.dataset.actorUuid, focus: true })
  }

  /**
   * Update the selected weapon proficiency on any change to the app/form.
   * @param {*} event 
   * @param {*} target 
   * @returns 
   */
  static async _updateWeapon(event, target) {
    const actor = await fromUuid(event.target.dataset.actorUuid);
    const index = event.target.dataset.index;
    const fieldName = event.target.dataset.fieldName;
    if (!actor) {
      const msg = `No character found for Uuid ${target.dataset.actorUuid}!`;
      Hyp3eLogger.warn("HYP3ECharacterWeaponProficiencies _addWeapon", msg);
      ui.notifications.warn(msg);
      return;
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
        if (event.target.value == "*Any" && weaponProficiencies.some(wp => wp.weapon == "*Any")) {
          ui.notifications.warn("You cannot select *Any more than once.")
          weaponName = "";
        } else if (this._isException(event.target.value, weaponProficiencies)) {
          ui.notifications.warn(`${event.target.value} is forbidden to this character/class.`)
          weaponName = "";
        } else if (weaponProficiencies.some(wp => wp.weapon == event.target.value && wp.weapon !== "*Any" && wp.weapon !== "")) {
          // Only allow multiple instances of a weapon if the actor's baseClass is "fighter"
          if (actor.system.baseClass !== "fighter") {
            ui.notifications.warn(`${actor.name} is already proficient with this weapon.`);
            weaponName = "";
            break;
          }
          // Character is a fighter or sub-class
          const isGrandmaster = this._isGrandmaster(actor);
          const proficiency = this._getProficiencyLevel(actor, event.target.value);
          // Use isGrandmaster and proficiency to determine whether this weapon 
          //  is going to add a second grandmastery, which is not allowed.
          if (isGrandmaster && proficiency >= 1) {
            ui.notifications.warn(`${actor.name} already has one grandmastery, cannot add this one.`);
            weaponName = "";
            break;
          }
          weaponName = event.target.value;
        } else {
          weaponName = event.target.value;
        }
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

    // Re-calc weapon proficiency/mastery
    mastery = this._calcMastery(weaponName, weaponProficiencies);

    // Update the selected proficiency data
    weaponProficiencies[index] = {
      weapon: weaponName,
      level: level,
      mastery: mastery,
      exception: exception
    }

    const sortedProfs = [...weaponProficiencies].sort((a, b) => 
      a.level - b.level || a.weapon.localeCompare(b.weapon)
    );

    // Log the results and update the character
    Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _updateWeapon", `${actor.name} favored weapons updated:`, sortedProfs);
    await actor.update({"system.weaponProficiencies": sortedProfs});

    // Re-calc weapon masteries
    await this._updateActorMasteries(actor)

    // Refresh the display
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
    const removedWeapon = weaponProficiencies[index];
    weaponProficiencies.splice(index, 1);
    // Log the results and update the character
    Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _removeWeapon", `${actor.name} favored weapons updated:`, weaponProficiencies);
    await actor.update({"system.weaponProficiencies": weaponProficiencies});

    // Re-calc weapon masteries
    await this._removeWeaponMastery(actor, removedWeapon)

    // Refresh the display
    this.render(true, { actorUuid: target.dataset.actorUuid, focus: true })
  }

  /** DATA CHECKS AND CALCULATIONS --------------------------------*/

  /**
   * Is this actor already a grandmaster of a weapon?
   * @param {*} actor 
   * @returns 
   */
  _isGrandmaster(actor) {
    return actor.system.weaponProficiencies.some(wp => wp.mastery === 2);
  }

  _getProficiencyLevel(actor, weaponName) {
    // This is used with fighters who have *Any weapon proficiency, but we may 
    //  need to know if they have mastery or grandmastery
    const proficiency = actor.system.weaponProficiencies.find(wp => 
      this._isMatch(weaponName, wp.weapon)
    );
    return proficiency?.level || 0;   // Default 0 is basic proficiency
  }

  /**
   * Determine whether the actor's weaponProficiencies list has at least one exception
   * @param {*} weaponProficiencies - the actor's full weaponProficiencies object
   * @returns {Boolean} - whether or not there is an exception found
   */
  _hasExceptions(weaponProficiencies) {
    return weaponProficiencies.some(wp => wp.exception);
  }

  /**
   * Determine whether the specified weapon is already set as an exception
   * @param {*} weaponName - the weapon name to be checked
   * @param {*} weaponProficiencies - the actor's full weaponProficiencies object
   * @returns {Boolean} - whether or not this weapon is already an exception
   */
  _isException(weaponName, weaponProficiencies) {
    for (const w of weaponProficiencies) {
      if (w.exception && w.weapon === weaponName) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculate the mastery level of a weapon based on *Any + 1 or 2 additional 
   *    proficiencies, or 2 or 3 total proficiencies of the weapon.
   * @param {*} weaponName - the weapon name to be checked
   * @param {*} weaponProficiencies - the actor's full weaponProficiencies object
   * @returns {Number} mastery - 0, 1, or 2
   */
  _calcMastery(weaponName, weaponProficiencies) {
    let mastery = 0;
    for (const w of weaponProficiencies) {
      if (!w.exception && weaponName !== "*Any" && weaponName !== "") {
        if (w.weapon == weaponName || w.weapon == "*Any") mastery ++;
      }
    }
    return Math.max(mastery - 1, 0);
  }

  /**
   * Update all weapon masteries for a fighter based on its selected proficiencies
   * @param {*} actor 
   */
  async _updateActorMasteries(actor) {
    // Skip if this isn't a fighter or sub-class
    if (actor.system?.baseClass !== "fighter") return;

    // Calculate weapon proficiencies/masteries at the actor level
    const weaponProficiencies = foundry.utils.deepClone(actor.system.weaponProficiencies);
    for (const wp of weaponProficiencies) {
      if (wp.weapon !== "*Any" && !wp.exception) {
        wp.mastery = this._calcMastery(wp.weapon, weaponProficiencies);
      } else {
        wp.mastery = 0;
      }
    }
    // Batch the update to the actor's weaponProficiencies
    Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _updateActorMasteries", `${actor.name} weapon proficiencies updated:`, weaponProficiencies);
    await actor.update({ "system.weaponProficiencies": weaponProficiencies });

    // Now we need to update the actor's owned weapons and update their mastery flags based on the new proficiencies
    for (const weapon of actor.items.filter(i => i.type === "weapon")) {
      const matchingProficiency = weaponProficiencies.find(wp => 
        this._isMatch(weapon.system?.baseWeapon, wp.weapon) ||
        this._isMatch(weapon.name, wp.weapon) ||
        this._isMatch(weapon.system?.friendlyName, wp.weapon)
      );
      if (matchingProficiency) {
        await this._updateActorWeapons(actor, matchingProficiency);
      } else {
        // If no matching proficiency is found, reset mastery flags
        const updates = {
          "system.wpnMaster": false,
          "system.wpnGrandmaster": false
        }
        // Update the attack rate if autoCalcAttackRates is enabled
        if (CONFIG.HYP3E.autoCalcAttackRates) {
          const rof = this._calcAttackRate(actor, weapon, updates);
          updates["system.rof"] = rof;
        }
        Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _updateActorMasteries", `Updates to ${weapon.name}:`, updates);
        await weapon.update( updates );
      }
    }
  }

  /**
   * Remove mastery from an actor's owned weapons if they match the proficiency that was removed
   * @param {*} actor 
   * @param {*} removedWeapon 
   */
  async _removeWeaponMastery(actor, removedWeapon) {
    // Skip if this isn't a fighter or sub-class
    if (actor.system?.baseClass !== "fighter") return;

    // Find all owned weapons that match the removed weapon proficiency
    const matchingWeapons = actor.items.filter(i => 
      i.type === "weapon" && (
        this._isMatch(i.system?.baseWeapon, removedWeapon.weapon) ||
        this._isMatch(i.name, removedWeapon.weapon) ||
        this._isMatch(i.system?.friendlyName, removedWeapon.weapon)
      )
    );

    for (const weapon of matchingWeapons) {
      Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _removeWeaponMastery", `Removing ${weapon.name} mastery...`);
      const updates = {
        "system.wpnMaster": false,
        "system.wpnGrandmaster": false
      }
      // Update the attack rate if autoCalcAttackRates is enabled
      if (CONFIG.HYP3E.autoCalcAttackRates) {
        const rof = this._calcAttackRate(actor, weapon, updates);
        updates["system.rof"] = rof;
      }
      Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _removeWeaponMastery", `Updates to ${weapon.name}:`, updates);
      await weapon.update( updates );
    }
  }

  /**
   * Update mastery flags on a fighter's owned weapons, based on the fighters's proficiency
   * @param {*} actor 
   * @param {*} weaponProficiency 
   */
  async _updateActorWeapons(actor, weaponProficiency) {
    // Skip if this isn't a fighter or sub-class
    if (actor.system?.baseClass !== "fighter") return;

    // Find all owned weapons that match the updated weapon proficiency
    const matchingWeapons = actor.items.filter(i => 
      i.type === "weapon" && (
        this._isMatch(i.system?.baseWeapon, weaponProficiency.weapon) ||
        this._isMatch(i.name, weaponProficiency.weapon) ||
        this._isMatch(i.system?.friendlyName, weaponProficiency.weapon)
      )
    );
    let wpnMaster = false;
    let wpnGrandmaster = false;
    for (const weapon of matchingWeapons) {
      Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _updateActorWeapons", `Setting ${weapon.name} mastery to ${weaponProficiency.mastery}...`);
      switch (weaponProficiency.mastery) {
        case 0:
          wpnMaster = false;
          wpnGrandmaster = false;
          break;
        case 1:
          wpnMaster = true;
          wpnGrandmaster = false;
          break;
        case 2:
          wpnMaster = false;
          wpnGrandmaster = true;
          break;
        default:
          wpnMaster = false;
          wpnGrandmaster = false;
          break;
      }
      const updates = {
        "system.wpnMaster": wpnMaster,
        "system.wpnGrandmaster": wpnGrandmaster
      }
      // Update the attack rate if autoCalcAttackRates is enabled
      if (CONFIG.HYP3E.autoCalcAttackRates) {
        const rof = this._calcAttackRate(actor, weapon, updates);
        updates["system.rof"] = rof;
      }
      Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _updateActorWeapons", `Updates to ${weapon.name}:`, updates);
      await weapon.update( updates );
    }
  }

  /**
   * Get the actor's class, level, and mastery, and determine the attack rate for this weapon.
   * @param {*} actor 
   * @param {*} weapon 
   * @returns 
   */
  _calcAttackRate(actor, weapon, updates) {
    // Skip if this isn't a fighter or sub-class
    if (actor.system?.baseClass !== "fighter") return;
    Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _calcAttackRate", `Calculating attack rate for ${weapon.name} (owned by ${actor.name})...`, { actor: actor, item: weapon });

    const baseWeapon = weapon.system.baseWeapon?.toLowerCase() || weapon.name?.toLowerCase();
    let rateKey = 0; // Default attack rate key

    // Is the fighter level 7 or higher?
    if (actor.system.details.level.value >= 7) {
      rateKey += 1;
    }

    // Do the weapon updates have Master or Grandmaster flags set?
    const actorMastery = actor.system?.weaponProficiencies?.find(w => w.weapon == weapon.system.baseWeapon)?.mastery ?? 0;
    if (updates["system.wpnMaster"] || updates["system.wpnGrandmaster"]) {
      rateKey += 1;
    // } else if (actorMastery > 0) {
    //   rateKey += 1;
    }
    Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _calcAttackRate", `Final rate key for ${weapon.name}: ${rateKey}`);

    // Now lookup the weapon and determine the attack rate based on the type
    const weaponType = weapon.system.melee? "Melee" : (weapon.system.missile ? "Missile" : "Melee");
    const lookupTable = `fighter${weaponType}AttackRates`;

    const weaponRates = this[lookupTable][baseWeapon] 
           ?? this[lookupTable].default;

    const rateTier = weaponRates[rateKey];   // key is 0, 1, or 2; returns a tier value between 0 and 5
    const weaponRoF = this.ratesOfFire[rateTier] || "1/1"; // Default to 1/1 if not found
    Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _calcAttackRate", `Final attack rate for ${weapon.name}: ${weaponRoF} (tier ${rateTier})`);

    return weaponRoF;
  }

  /** WEAPON NAME PARSING -----------------------------------------*/

  /**
   * Normalize a weapon name for fuzzy comparison.
   * Returns both a space-separated sorted token string and a fully compacted version.
   */
  _normalizeWeaponName(name) {
    if (!name || typeof name !== "string") return { sorted: "", compact: "" };
  
    const cleaned = name
      .toLowerCase()
      .replace(/æ/g, "ae")                     // Cæstuses → caestuses
      .replace(/œ/g, "oe")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip remaining diacritics
      .replace(/[^a-z0-9\s]/g, " ")           // keep only letters, digits, spaces
      .replace(/\s+/g, " ")
      .trim();
  
    const tokens = cleaned.split(" ").filter(Boolean).sort();
    Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _normalizeWeaponName", `${name} normalized to tokens:`, tokens);
    return {
      sorted: tokens.join(" "),
      compact: tokens.join("")                 // "long sword" → "longsword"
    };
  }

  /**
   * Fuzzy match a weapon name against a single canonical name.
   * @param {string} weaponName
   * @param {string} canonicalName
   * @returns {boolean}
   */
  _isMatch(weaponName, canonicalName) {
    const input = this._normalizeWeaponName(weaponName);
    const target = this._normalizeWeaponName(canonicalName);
    if (!input.compact || !target.compact) return false;

    // Primary: compact form (handles "longsword" ↔ "Sword, Long")
    Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _isMatch", `Does ${input.compact} match ${target.compact}?`);
    if (input.compact === target.compact) return true;
  
    // Secondary: sorted tokens (handles remaining order/spacing differences)
    Hyp3eLogger.info("HYP3ECharacterWeaponProficiencies _isMatch", `Does ${input.sorted} match ${target.sorted}?`);
    return input.sorted === target.sorted;
  }


  /** LOOKUP TABLES AND FUNCTIONS ---------------------------------*/
  
  /**
   * Rates of fire table
   */
  ratesOfFire = {
    0: "1/2",
    1: "1/1",
    2: "3/2",
    3: "2/1",
    4: "5/2",
    5: "3/1"
  }

  fighterMeleeAttackRates = {
    "default": {
      0: 1,   // Basic proficiency, levels 1-6
      1: 2,   // Basic proficiency, levels 7-12; OR Mastery, levels 1-6
      2: 3    // Mastery, levels 7-12
    }
  }

  fighterMissileAttackRates = {
    "default": {
      0: 1,
      1: 2,
      2: 3
    },
    "bow, long": {
      0: 2,
      1: 3,
      2: 4
    },
    "bow, long, composite": {
      0: 2,
      1: 3,
      2: 4
    },
    "bow, short": {
      0: 2,
      1: 3,
      2: 4
    },
    "bow, short, composite": {
      0: 2,
      1: 3,
      2: 4
    },
    "crossbow, heavy": {
      0: 0,
      1: 0,
      2: 1
    },
    "crossbow, light": {
      0: 1,
      1: 1,
      2: 2
    },
    "crossbow, repeating": {
      0: 5,
      1: 5,
      2: 5
    },
    "dagger": {
      0: 2,
      1: 3,
      2: 4
    },
    "dart": {
      0: 3,
      1: 4,
      2: 5
    },
    "lasso": {
      0: 0,
      1: 0,
      2: 1
    },
    "net, fighting": {
      0: 0,
      1: 0,
      2: 1
    },
    "stone": {
      0: 3,
      1: 4,
      2: 5
    }
  }

}