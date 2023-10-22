/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class Hyp3eActor extends Actor {

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as attribute modifiers rather than attribute scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.hyp3e || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;

    // Loop through attribute scores, and add their modifiers to our sheet output.
    for (let [key, attribute] of Object.entries(systemData.attributes)) {
      // Example of how to calculate the modifier using d20 rules.
      //attribute.mod = Math.floor((attribute.value - 10) / 2);
      // NOTHING TO DO HERE...
      // console.log(key, attribute)
    }

    // Calculated fields can go here, I think...?
    systemData.unarmoredAc = 9 + systemData.attributes.dex.defMod
    console.log("Unarmored AC: ", systemData.unarmoredAc)

    // Calculate current AC & DR based on equipped armor, shield, and DX defense mod
    // Start by resetting base AC and DR
    systemData.ac.value = 9 + systemData.attributes.dex.defMod
    systemData.ac.dr = 0
    // Loop through all inventory item types to find armor
    for (let itmType of Object.entries(actorData.itemTypes)) {
      if(itmType[0] == "armor") {
        // Armor can include both armor and shields
        for (let [key, obj] of Object.entries(itmType[1])) {
          // Only count if it is equipped
          if(obj.system.equipped) {
            // DR can be updated by armor or shield (not in core rules, but...)
            systemData.ac.dr = systemData.ac.dr + obj.system.dr
            if(obj.system.type != "shield") {
              // Armor AC is a base number that overrides the unarmored AC of 9 + DX mod
              systemData.ac.value = obj.system.ac + systemData.attributes.dex.defMod
            } else {
              // Shield AC is a modifier subtracted from current AC
              systemData.ac.value = systemData.ac.value - obj.system.ac
            }
          }
        }
      }
    }
    console.log("Equipped AC: ", systemData.ac.value)

  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    // systemData.xp = (systemData.cr * systemData.cr) * 100;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the attribute scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.attributes) {
      for (let [k, v] of Object.entries(data.attributes)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }
    // Add level, fighting ability (FA), and casting ability (CA) -- or fall back to 0.
    if (data.details.level) {
      data.lvl = data.details.level.value ?? 0;
    }
    if (data.fa) {
      data.bab = data.fa.value ?? 0;
    }
    if (data.ca) {
      data.bcb = data.ca.value ?? 0;
    }

  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }

}