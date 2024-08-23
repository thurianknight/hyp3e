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

    if (CONFIG.HYP3E.debugMessages) { console.log(`Preparing actor ${actorData.name} derived data...`) }
  
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
    }

    // Calculated fields go here
    if (CONFIG.HYP3E.autoCalcAc) {
      systemData.unarmoredAc = 9 - systemData.attributes.dex.defMod
      if (CONFIG.HYP3E.debugMessages) { console.log("Unarmored AC: ", systemData.unarmoredAc) }

      // Calculate current AC & DR based on equipped armor, shield, and DX defense mod
      // Start by resetting base AC and DR
      systemData.ac.value = 9 - systemData.attributes.dex.defMod
      systemData.ac.dr = 0
      let tempAC = 9
      let shieldMod = 0
      let tempDR = 0
      // Loop through all inventory item types to find armor
      for (let itmType of Object.entries(actorData.itemTypes)) {
        if (itmType[0] == "armor") {
          // Armor as an item type can include armor, shields, and some protective magic items
          for (let [key, obj] of Object.entries(itmType[1])) {
            if (CONFIG.HYP3E.debugMessages) { console.log("Armor data: ", obj) }
            // Only count an item if it is equipped... but also note that only 1 suit of armor and
            //   1 shield will ever be counted -- no stacking of items.
            // The logic here should use the best AC if multiple armor types are equipped, as in 
            //   the case where someone is wearing both armor and a ring of protection.
            // HOWEVER, this logic is partially broken. Need to map out all possibilities for magical
            //   protection items, what stacks & when, then we can fix this logic.
            if (obj.system.equipped) {
              // DR can be updated by armor or shield (not in core rules, but...)
              if (obj.system.dr > tempDR) {
                // Only update DR if this equipped item is superior to the current DR
                tempDR = obj.system.dr
              }
              if (obj.system.type != "shield") {
                // Armor AC overrides the unarmored AC of 9 (DX mod subtracted later)
                if (obj.system.ac < tempAC) {
                  // Only update AC if this equipped item is superior to the current AC
                  tempAC = obj.system.ac
                }
                if (CONFIG.HYP3E.debugMessages) { 
                  console.log("Armor equipped: ", obj.name, ", Temp AC: ", tempAC, ", Temp DR: ", tempDR)
                }
              } else {
                // Shield AC is a modifier subtracted from base AC.
                // We allow shield modifiers to stack because many protective magic items give an AC bonus
                //  similar to shields, and they should stack.
                shieldMod += obj.system.ac
                if (CONFIG.HYP3E.debugMessages) {
                  console.log("Shield equipped: ", obj.name, ", Shield Mod: ", shieldMod)
                }
              }
            } else {
              if (CONFIG.HYP3E.debugMessages) { console.log("Armor not equipped: ", obj.name) }
            }
          }
        }
      }
      // Now calculate & set the final values
      systemData.ac.value = tempAC - systemData.attributes.dex.defMod - shieldMod
      systemData.ac.dr = tempDR
    }
    if (CONFIG.HYP3E.debugMessages) { console.log("Equipped AC: ", systemData.ac.value) }

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
    // Add character's level to top level of data
    if (data.details.level) {
      data.lvl = data.details.level.value ?? 0;
    }

  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Anything to load?
    
  }

  /**
   * Str attack mods, from -2 to +2.
   * 
   * Applied to:
   * - `str.atkMod`
   */
  strAtkMod = {
    0: -2,
    3: -2,
    4: -1,
    7: 0,
    15: 1,
    18: 2,
  };
  /**
   * Str damage mods, from -2 to +3.
   * 
   * Applied to:
   * - `str.dmgMod`
   */
  strDmgMod = {
    0: -2,
    3: -2,
    4: -1,
    9: 0,
    13: 1,
    17: 2,
    18: 3,
  };
  /**
   * Dex attack mods, from -2 to +3.
   * 
   * Applied to:
   * - `dex.atkMod`
   */
  dexAtkMod = {
    0: -2,
    3: -2,
    4: -1,
    9: 0,
    13: 1,
    17: 2,
    18: 3,
  };
  /**
   * Dex defense mods, from -2 to +2.
   * 
   * Applied to:
   * - `dex.defMod`
   */
  dexDefMod = {
    0: -2,
    3: -2,
    4: -1,
    7: 0,
    15: 1,
    18: 2,
  };
  /**
   * Con HP mods, from -1 to +3.
   * 
   * Applied to:
   * - `con.hpMod`
   */
  conHpMod = {
    0: -1,
    3: -1,
    7: 0,
    13: 1,
    17: 2,
    18: 3,
  };
  /**
   * Con poison mods, from -2 to +2.
   * 
   * Applied to:
   * - `con.poisonMod`
   */
  conPoisonMod = {
    0: -2,
    3: -2,
    4: -1,
    7: 0,
    15: 1,
    18: 2,
  };
  /**
   * Con trauma mods, from 0 to 95.
   * 
   * Applied to:
   * - `con.traumaSurvive`
   */
  conTraumaSurvive = {
    0: 0,
    3: 45,
    4: 55,
    7: 65,
    9: 75,
    13: 80,
    15: 85,
    17: 90,
    18: 95,
  };
  /**
   * Modifier table for the Test of Attribute (Str, Dex, Con), from 0 to 5.
   * Applied to:
   * - `str.test`
   * - `dex.test`
   * - `con.test`
   */
  testOfAttr = {
    0: 0,
    3: 1,
    7: 2,
    13: 3,
    17: 4,
    18: 5,
  };
  /**
   * Modifier table for the Feat of Attribute (Str, Dex, Con), from 0 to 32.
   * Applied to:
   * - `str.fs`
   * - `dex.fd`
   * - `con.fc`
   */
  featOfAttr = {
    0: 0,
    3: 0,
    4: 1,
    7: 2,
    9: 4,
    13: 8,
    15: 16,
    17: 24,
    18: 32,
  };
  /**
   * Mapping tables for character's spoken languages.
   * Applied to:
   * - `int.spoken`
   */
  intLanguages = {
    0: 0,
    7: 0,
    13: 1,
    17: 2,
    18: 3,
  };
  /**
   * Magician bonus spells per day.
   * Applied to:
   * - `int.bonusSpell1`
  **/
  bonusSpell1 = {
    0: false,
    3: false,
    13: true,
  };
  bonusSpell2 = {
    0: false,
    3: false,
    15: true,
  };
  bonusSpell3 = {
    0: false,
    3: false,
    17: true,
  };
  bonusSpell4 = {
    0: false,
    3: false,
    18: true,
  };
  /**
   * Magician or Cleric chance to learn new spell.
   * Applied to:
   * - `int.learnSpell` and `wis.learnSpell`
  **/
  learnSpell = {
    0: "",
    3: "",
    9: 50,
    13: 65,
    15: 75,
    17: 85,
    18: 95,
  };
  /**
   * Wis willpower mods, from -2 to +2.
   * 
   * Applied to:
   * - `wis.willMod`
   */
  wisWillMod = {
    0: -2,
    3: -2,
    4: -1,
    7: 0,
    15: 1,
    18: 2,
  };
  /**
 * Cha reaction mod, from -2 to 2.
 * 
 * Applied to:
 * - `cha.reaction`
 */
  chaReactionMod = {
    0: -3,
    3: -3,
    4: -2,
    7: -1,
    9: 0,
    13: 1,
    17: 2,
    18: 3,
  };
  /**
   * Cha number of retainers, from 1 to 12.
   * 
   * Applied to:
   * - `cha.retainers`
   */
  chaRetainers = {
    0: 1,
    3: 1,
    4: 2,
    7: 3,
    9: 4,
    13: 6,
    15: 8,
    17: 10,
    18: 12,
  };

  /**
   * Cha adjustment to turn undead, from -1 to +1.
   * 
   * Applied to:
   * - `cha.turnUndead`
   */
  chaTurnUndead = {
    0: -1,
    3: -1,
    7: 0,
    15: 1,
  };

  _valueFromTable(table, val) {
    let output;
    // console.log("Table:", table, "Value:", val)
    for (let i = 0; i <= val; i++) {
      // console.log("Lookup:", table[i])
      if (table[i] != undefined) {
        output = table[i];
      }
    }
    return output;
  }

  /**
   * Set or reset all attribute modifiers
   */
  async SetAttributeMods() {
    console.log("Setting attribute modifiers...")
    // let data = super.getRollData();
    let data = this.system
    if (CONFIG.HYP3E.debugMessages) { console.log("Actor roll data:", data) }
    if (data.attributes) {
      for (let [k, v] of Object.entries(data.attributes)) {
        // data[k] = foundry.utils.deepClone(v);
        // console.log(`Getting ${k} modifiers...`)
        switch (k) {
          case "str":
            if (CONFIG.HYP3E.debugMessages) { console.log(`Setting ${k} modifiers...`) }
            data.attributes.str.atkMod = this._valueFromTable(this.strAtkMod, data.attributes.str.value)
            data.attributes.str.dmgMod = this._valueFromTable(this.strDmgMod, data.attributes.str.value)
            data.attributes.str.test = this._valueFromTable(this.testOfAttr, data.attributes.str.value)
            data.attributes.str.feat = this._valueFromTable(this.featOfAttr, data.attributes.str.value)
            break

          case "dex":
            if (CONFIG.HYP3E.debugMessages) { console.log(`Setting ${k} modifiers...`) }
            data.attributes.dex.atkMod = this._valueFromTable(this.dexAtkMod, data.attributes.dex.value)
            data.attributes.dex.defMod = this._valueFromTable(this.dexDefMod, data.attributes.dex.value)
            data.attributes.dex.test = this._valueFromTable(this.testOfAttr, data.attributes.dex.value)
            data.attributes.dex.feat = this._valueFromTable(this.featOfAttr, data.attributes.dex.value)
            break

          case "con":
            if (CONFIG.HYP3E.debugMessages) { console.log(`Setting ${k} modifiers...`) }
            data.attributes.con.hpMod = this._valueFromTable(this.conHpMod, data.attributes.con.value)
            data.attributes.con.poisRadMod = this._valueFromTable(this.conPoisonMod, data.attributes.con.value)
            data.attributes.con.traumaSurvive = this._valueFromTable(this.conTraumaSurvive, data.attributes.con.value)
            data.attributes.con.test = this._valueFromTable(this.testOfAttr, data.attributes.con.value)
            data.attributes.con.feat = this._valueFromTable(this.featOfAttr, data.attributes.con.value)
            break

          case "int":
            if (CONFIG.HYP3E.debugMessages) { console.log(`Setting ${k} modifiers...`) }
            data.attributes.int.languages = this._valueFromTable(this.intLanguages, data.attributes.int.value)
            data.attributes.int.bonusSpells.lvl1 = this._valueFromTable(this.bonusSpell1, data.attributes.int.value)
            data.attributes.int.bonusSpells.lvl2 = this._valueFromTable(this.bonusSpell2, data.attributes.int.value)
            data.attributes.int.bonusSpells.lvl3 = this._valueFromTable(this.bonusSpell3, data.attributes.int.value)
            data.attributes.int.bonusSpells.lvl4 = this._valueFromTable(this.bonusSpell4, data.attributes.int.value)
            data.attributes.int.learnSpell = this._valueFromTable(this.learnSpell, data.attributes.int.value)
            break

          case "wis":
            if (CONFIG.HYP3E.debugMessages) { console.log(`Setting ${k} modifiers...`) }
            data.attributes.wis.willMod = this._valueFromTable(this.wisWillMod, data.attributes.wis.value)
            data.attributes.wis.bonusSpells.lvl1 = this._valueFromTable(this.bonusSpell1, data.attributes.wis.value)
            data.attributes.wis.bonusSpells.lvl2 = this._valueFromTable(this.bonusSpell2, data.attributes.wis.value)
            data.attributes.wis.bonusSpells.lvl3 = this._valueFromTable(this.bonusSpell3, data.attributes.wis.value)
            data.attributes.wis.bonusSpells.lvl4 = this._valueFromTable(this.bonusSpell4, data.attributes.wis.value)
            data.attributes.wis.learnSpell = this._valueFromTable(this.learnSpell, data.attributes.wis.value)
            break

          case "cha":
            if (CONFIG.HYP3E.debugMessages) { console.log(`Setting ${k} modifiers...`) }
            data.attributes.cha.reaction = this._valueFromTable(this.chaReactionMod, data.attributes.cha.value)
            data.attributes.cha.maxHenchmen = this._valueFromTable(this.chaRetainers, data.attributes.cha.value)
            data.attributes.cha.turnUndead = this._valueFromTable(this.chaTurnUndead, data.attributes.cha.value)
            break
        }
      }
      // Apply updates to the actor
      if (CONFIG.HYP3E.debugMessages) { console.log('Updated attribute modifier data:', data) }
      await this.update({data})
    }
  }

}