import {Hyp3eDice} from "../dice/dice.mjs";
import { sendSimpleChat } from "../chat/chat.mjs";
import { Hyp3eLogger } from "../helpers/logger.mjs";
import { HYP3E } from "../helpers/config.mjs"

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class Hyp3eItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */

  /** @override */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    Hyp3eLogger.info("Hyp3eItem _preCreate", `Starting data:`, data)

    // Ensure system object exists (very important!)
    data.system = data.system || {};

    const updateData = {};

    // Replace default image for new items, but if an image is defined, leave it be
    const TYPE_IMAGES = {
      armor: `${HYP3E.assetsPath}/breastplate_wht.svg`,
      feature: "icons/svg/target.svg",
      item: "icons/svg/item-bag.svg",
      shield: "icons/svg/shield.svg",
      spell: "icons/svg/book.svg",
      weapon: "icons/svg/combat.svg",
      classTemplate: "icons/svg/mystery-man.svg",
      effectTemplate: "icons/svg/aura.svg",
      container: "icons/svg/item-bag.svg",
    };
    if (!data.img || data.img === "") {
      updateData.img = TYPE_IMAGES[data.type] || "icons/svg/item-bag.svg";
    }

    // Setup the item's realName to be its name
    updateData["system.realName"] = data.name || "New Item";

    // A newly-created item won't have the system attribute yet, but cloned items will
    if (!options.fromCompendium && !options.fromDrop) {
      updateData["system.containerId"] = "";
      updateData["system.location"] = "";
    }

    if (data.type === "item" && !data.system.isLightSource) {
      // Try to match item name to a light source in the lookup table
      const lightSourceProps = Hyp3eItem.getLightSourceProperties(data.name);
      if (lightSourceProps) {
        updateData["system.isLightSource"] = true;
        updateData["system.light.dim"] = lightSourceProps.radius;
        updateData["system.light.bright"] = Math.floor(lightSourceProps.radius/2);
        updateData["system.light.angle"] = lightSourceProps.angle;
        updateData["system.light.color"] = lightSourceProps.color;
        updateData["system.light.alpha"] = lightSourceProps.alpha;
      }
    }

    // If this is a new weapon, add a basic roll formula for melee
    if (data.type === "weapon") {
      if (options.fromCompendium !== true && options.fromDrop !== true && !data?.system?.formula?.trim()) {
        updateData["system.formula"] = "1d20 + @str.atkMod";
      }
    }

    // Apply all changes at once
    if (Object.keys(updateData).length > 0) {
      Hyp3eLogger.info("Hyp3eItem _preCreate", `Update data:`, updateData);
      this.updateSource(updateData);
    }
  }

  /** @override */
  async _onCreate(data, options, user) {
    await super._onCreate(data, options, user);
    // const itemData = this.system;
    Hyp3eLogger.info("Hyp3eItem _onCreate", `Created item:`, this);
  }

  /** @override */
  async _onUpdate(changed, options, user) {
    super._onUpdate(changed, options, user);
    Hyp3eLogger.info("Hyp3eItem _onUpdate", `Changed data:`, changed);
    // Only proceed if this is the active GM (prevents multiple messages from spamming chat)
    if (!game.user?.isGM || game.users.activeGM !== game.user) return;

    // Send a chat message that the item was equipped/unequipped or carried/dropped, 
    //  but only if the equipped status changed
    if (changed.system?.equipped !== undefined) {
      // Only proceed if the item is owned by an actor
      if (!this.actor) return;
      // Also, only proceed if the item is not in a container
      if (this.type === "item" && this.system?.containerId) return;

      const itemName = this.system.friendlyName ? this.system.friendlyName : this.name
      let equipText = ""
      let containerText = ""
      if (this.type === "armor" || this.type === "shield" || this.type === "weapon") {
        equipText = this.system.equipped ? "equipped" : "unequipped"
      } else if (this.type === "item" || this.type === "container") {
        equipText = this.system.equipped ? "is carrying" : "dropped"
        // If this is a container, indicate change to its contents too
        if (this.system.isContainer || this.type === "container") {
          containerText = " and its contents"
        }
      }
      const message = `${this.actor.displayName} ${equipText} <strong>${itemName}</strong>${containerText}.`
      sendSimpleChat(this.actor, "", message);
    }
  }

  /** @override */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
    // Hyp3eLogger.info("Hyp3eItem prepareData", `Item ${this.name}:`, this);

    // Skip processing if this item is in a compendium
    if (this.pack) return;

    // Get the Item's data
    // const itemData = this.system;

  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, return the actor's roll data.
    if ( !this.actor ) return null
  
    const rollData = this.actor.getRollData();
    // Grab the item's system data as well.
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
  }

  /**
   * Toggle the identified state of the item.
   * If identified, set item.name to system.realName and item.system.description to item.system.realDescription.
   * If not identified, set item.name to system.itemAlias and item.system.description to item.system.aliasDescription.
   * @param {Boolean} identified - Whether the item is identified or not.
   * @public
   */
  async toggleIdentified(identified) {
    const item = this
    if (identified) {
      // If identified, set item.name to system.realName and item.system.description to item.system.realDescription
      const name = this.system?.realName > "" ? this.system.realName : this.name;
      const updates = { name: name, "system.description": this.system.realDescription };
      await this.update(updates);
    } else {
      // If not identified, set item.name to system.itemAlias and item.system.description to item.system.aliasDescription
      const name = this.system?.itemAlias > "" ? this.system.itemAlias : this.name;
      const updates = { name: name, "system.description": this.system.aliasDescription };
      await this.update(updates);
    }
  }

  /**
   * Update the weapon type based on the attackType.
   * This method sets the appropriate flags and type for the item based on whether it is a melee 
   *  or missile weapon.
   * @param {String} attackType - The type of attack, either "melee" or "missile".
   * @public
   */
  async updateWeaponType(attackType) {
    const updates = {};
    switch (attackType) {
      case "melee":
        updates["system.melee"] = true;
        updates["system.missile"] = false;
        updates["system.isGrenade"] = false;
        updates["system.isAreaEffect"] = false;
        updates["system.type"] = "melee";
        break;
      case "missile":
        updates["system.melee"] = false;
        updates["system.missile"] = true;
        updates["system.type"] = "missile";
        break;
      default:
        Hyp3eLogger.warn("updateWeaponType", `Invalid weapon type: ${attackType}`);
        return;
    }
    Hyp3eLogger.info("updateWeaponType", `Update data:`, updates);
    await this.update(updates);
  }

  /**
   * Update the weapon hands required to wield the weapon.
   * @param {*} hands - Number of hands required (1 or 2).
   * @returns 
   */
  async updateWeaponHands(hands) {
    const updates = {};
    // Convert hands to integer if it's a string
    if (typeof hands === "string") {
      hands = parseInt(hands);
    }
    switch (hands) {
      case 1:
        updates["system.hands"] = 1;
        break;
      case 2:
        updates["system.hands"] = 2;
        break;
      default:
        Hyp3eLogger.warn("updateWeaponHands", `Invalid hands value: ${hands}`);
        return;
    }
    Hyp3eLogger.info("updateWeaponHands", `Update data:`, updates);
    await this.update(updates);
  }

  async updateGrenadeOrAreaEffect(isGrenade, isAreaEffect) {
    Hyp3eLogger.info("updateGrenadeOrAreaEffect", `Updating grenade/area-effect...`, { isGrenade, isAreaEffect });
    const updates = {};
    if (isGrenade !== undefined) {
      updates["system.isGrenade"] = isGrenade;
      if (isGrenade) {
        updates["system.isAreaEffect"] = false;
        updates["system.melee"] = false;
        updates["system.missile"] = true;
        updates["system.type"] = "missile";
      }
    }
    if (isAreaEffect !== undefined) {
      updates["system.isAreaEffect"] = isAreaEffect;
      if (isAreaEffect) {
        updates["system.isGrenade"] = false;
        updates["system.melee"] = false;
        updates["system.missile"] = true;
        updates["system.type"] = "missile";
      }
    }
    Hyp3eLogger.info("updateGrenadeOrAreaEffect", `Update data:`, updates);
    await this.update(updates);
  }

  /**
   * Apply the attack formula based on the item type and properties.
   * This method sets the formula for attack rolls based on whether the item is a weapon,
   * grenade, area effect, or other item type.
   * @public
   */
  async applyAttackFormula() {
    const itemData = this.system;

    let updateData = {};

    // If this is not a weapon, but has an atkRoll, set the formula to 1d20 + @fa
    if (this.type !== "weapon") {
      if (itemData.atkRoll && !itemData.formula?.trim()) {
        itemData.formula = "1d20 + @fa";
      }
      return;
    }

    // Area effects and grenades override all variables
    if (itemData.isAreaEffect) {
      updateData = {
        melee: false,
        missile: true,
        isGrenade: false,
        formula: "",
        type: "missile"
      }
      return await this.update({ system: updateData });
    }
    if (itemData.isGrenade) {
      updateData = {
        melee: false,
        missile: true,
        isAreaEffect: false,
        formula: "1d20 + @dex.atkMod",
        type: "missile"
      }
      return await this.update({ system: updateData });
    }

    // If this is a weapon, set the attack formula based on type
    if (itemData.type === "melee") {
      updateData = {
        melee: true,
        missile: false,
        isGrenade: false,
        isAreaEffect: false,
        formula: "1d20 + @str.atkMod",
        type: "melee"
      }
      return await this.update({ system: updateData });
    }
    if (itemData.type === "missile") {
      updateData = {
        melee: false,
        missile: true,
        formula: "1d20 + @dex.atkMod",
        type: "missile"
      }
      return await this.update({ system: updateData });
    }
    // Default if invalid weapon type
    Hyp3eLogger.error("applyAttackFormula", `Weapon ${this.name} has invalid type. Defaulting to melee.`);
    updateData = {
      melee: true,
      missile: false,
      isGrenade: false,
      isAreaEffect: false,
      formula: "1d20 + @str.atkMod",
      type: "melee"
    }
    return await this.update({ system: updateData });
  }

  /**
   * Toggle weapon mastery and grand-mastery
   * @param {String} mastery The mastery level to be updated
   * @public
   */
  async updateWeaponMastery(mastery) {
    const isMaster = this.system.wpnMaster;
    const isGrandmaster = this.system.wpnGrandmaster;

    let updateData = {};

    // Enabling a mastery level should disable the other one. However, disabling a mastery
    // level does not need to enable the other one -- they can both be false.
    switch (mastery) {
      case "master":
        updateData = {
          wpnMaster: !isMaster,
          wpnGrandmaster: isGrandmaster && !isMaster ? false : isGrandmaster
        };
        break;
      case "grandMaster":
        updateData = {
          wpnMaster: isMaster && !isGrandmaster ? false : isMaster,
          wpnGrandmaster: !isGrandmaster
        };
        break;
      default:
        Hyp3eLogger.warn("updateWeaponMastery", `Invalid mastery type: ${mastery}`);
        return;
    }

    Hyp3eLogger.info("updateWeaponMastery", `Update data:`, updateData);
  
    return await this.update({ system: updateData });
  }

  /**
   * Add a spell reference to this item's spellcasting list.
   * Prevents duplicates and handles charges initialization.
   * @param {Item} droppedItem - The spell item being added.
   */
  async addSpell(droppedItem) {
    if (!droppedItem || droppedItem.type !== "spell") {
      ui.notifications.warn("Only spells can be added to this item.");
      return;
    }

    const uuid = droppedItem.uuid;
    const spellRefs = foundry.utils.deepClone(this.system.spellcasting?.spellRefs ?? []);
    Hyp3eLogger.info("addSpell", `Current spells on item ${this.name}:`, spellRefs);

    // Check for duplicates
    if (spellRefs.some(ref => ref.uuid === uuid)) {
      ui.notifications.info(`Spell ${droppedItem.name} is already linked to this item.`);
      return;
    }

    spellRefs.push({ uuid: uuid, charges: 1 });
    Hyp3eLogger.info("addSpell", `Adding uuid ${uuid} to spells, new spells list:`, spellRefs);
    await this.update({ "system.spellcasting.spellRefs": spellRefs });
  }

  /**
   * Reorder a spell reference in the item's spellcasting list.
   * @param {number} fromIndex - The current index of the spell.
   * @param {number} toIndex - The new index for the spell.
   */
  async reorderSpell(fromIndex, toIndex) {
    const refs = foundry.utils.deepClone(this.system.spellcasting?.spellRefs ?? []);
    if (!Array.isArray(refs)) return;

    const [moved] = refs.splice(fromIndex, 1);
    refs.splice(toIndex, 0, moved);
    Hyp3eLogger.info("reorderSpell", `Reordered spell from index ${fromIndex} to ${toIndex}`, { refs });
    return this.update({ "system.spellcasting.spellRefs": refs });
  }

  /**
   * Remove a spell reference from the item's spellcasting list.
   * @param {string} uuid - The UUID of the spell to remove.
   */
  async removeSpell(uuid) {
    const spellRefs = foundry.utils.deepClone(this.system.spellcasting?.spellRefs ?? []);
    const updatedRefs = spellRefs.filter(ref => ref.uuid !== uuid);

    return this.update({ "system.spellcasting.spellRefs": updatedRefs });
  }

  // Get the names of effects applied to the item, and return an array
  _getEffectNames() {
    return this.effects.map(e => e.name);
  }

  /**
   * Handle displaying an Item description in the chat.
   * @private
   */
  async _displayItemInChat(actorData) {
    const item = foundry.utils.deepClone(this)
    const itemData = item.system

    // Either use the actor's image if provided, or the item's image if not
    const image = ("img" in actorData) ? actorData.img : item.img;

    // The system uses the term 'feature' under the covers, but Hyperborea uses 'ability'
    const typeLabel = item.type === 'feature' ? 'Ability' : item.type.capitalize();

    // itemName should be prioritized as (1) itemAlias [but only if not identified], 
    // (2) friendlyName, and (3) realName
    const itemName = (!itemData.identified && itemData.itemAlias) ? itemData.itemAlias : (itemData.friendlyName || item.name);

    // Chat message header text
    const label = this._renderItemHeader(typeLabel, itemName, image);

    // let content = itemData.description || "";
    let content = this._renderItemProperties(item, itemData, actorData);

    // Items might have Effects, but only show the button if item is identified
    if (item.effects.size > 0 && itemData.identified) {
      content += `<div class='apply-effects-button' data-item-id='${item.id}' data-item-uuid='${item.uuid}' data-actor-id='${actorData.actorId}'></div>`;
    }
    // Items might have a Saving Throw, but only show the button if item is identified
    if (itemData.save && itemData.save !== "" && itemData.identified) {
      content += `<div class='save-button' data-save='${itemData.save}'></div>`;
    }
    // FInally add the item's description at the end, if it exists
    content += `<div>${itemData.description}</div>` || "";

    // Setup & display the item in chat
    const templateData = { content };

    const template = `${HYP3E.templatePath}/chat/show-item.hbs`;
    const itemChat = await foundry.applications.handlebars.renderTemplate(template, templateData);
    // Log the rendered chat message
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actorData.actorId }),
      flavor: label,
      content: itemChat,
      flags: { hyp3e: { isItemDescription: true } }
    });
  }

  _renderItemHeader(typeLabel, itemName, imgSrc) {
    return `
      <hr class="plain-hr" />
      <div style="margin: 10px 0;">
        <img src="${imgSrc}" style="border: none; float: left;" width="24px" height="24px">
        <span style="text-align: left; font-size: 1.2em; font-weight: bold; margin-left: 6px;">
          ${itemName}
        </span>
      </div>
      <hr class="plain-hr" />`;
  }

  _renderItemProperties(item, itemData, actorData) {
    const parts = [];

    if (item.type === 'feature') parts.push(this._renderFeatureSection(itemData));
    if (item.type === 'weapon') parts.push(this._renderWeaponSection(itemData, item, actorData));
    if (item.type === 'spell') parts.push(this._renderSpellSection(itemData, item, actorData));
    if (item.type === 'item') parts.push(this._renderItemCheckSection(itemData));
    // Currently only weapons have annotations, but keep this generic for future use
    // parts.push(this._renderAnnotations(itemData));

    return parts.join("");
  }

  _renderFeatureSection(itemData) {
    if (itemData.formula && itemData.tn) {
      return `<p>Ability Check: ${itemData.formula} equal or under ${itemData.tn}</p>`;
    }
    return "";
  }

  _renderWeaponSection(itemData, item, actorData) {
    const parts = [];
    // Insert the damage-roll button at the top
    parts.push(this._renderDamageRoll(itemData, item, actorData));

    if (itemData.rof) parts.push(`<p>Atk Rate: ${itemData.rof}</p>`);
    if (itemData.type === 'missile') {
      parts.push(`<p>Range: ${itemData.range.short} / ${itemData.range.medium} / ${itemData.range.long}</p>`);
    } else {
      parts.push(`<p>Wpn Class: ${itemData.wc}</p>`);
    }
    // If the weapon has annotations, render them before the Damage button
    parts.push(this._renderAnnotations(itemData));
    // Add the damage-roll button
    // parts.push(this._renderDamageRoll(itemData, item, actorData));
    return parts.join("");
  }

  _renderSpellSection(itemData, item, actorData) {
    const parts = [];
    // Insert the damage-roll button at the top
    parts.push(this._renderDamageRoll(itemData, item, actorData));

    if (itemData.range) parts.push(`<p>Range: ${itemData.range}</p>`);
    if (itemData.duration) {
      parts.push(itemData.duration.match(/.*d[1-9].*/) && Roll.validate(itemData.duration) ?
        `<p>Duration: [[/r ${itemData.duration}]]</p>` : `<p>Duration: ${itemData.duration}</p>`);
    }
    if (itemData.affected) {
      parts.push(itemData.affected.match(/.*d[1-9].*/) && Roll.validate(itemData.affected) ?
        `<p># Affected: [[/r ${itemData.affected}]]</p>` : `<p># Affected: ${itemData.affected}</p>`);
    }
    // Add the damage-roll button
    // parts.push(this._renderDamageRoll(itemData, item, actorData));
    return parts.join("");
  }

  _renderDamageRoll(itemData, item, actorData) {
    if (!itemData.damage) return "";
    if (!Roll.validate(itemData.damage)) return `<p>Damage: ${itemData.damage || ""}</p>`;

    const dmgObj = Hyp3eDice.buildDamageFormula(itemData, null, actorData);
    Hyp3eLogger.info("Hyp3eItem _renderDamageRoll", `Damage formula object for ${item.name}:`, dmgObj);
    const roll = new Roll(dmgObj.formula, actorData);
    let html = `
        <div class='dmg-roll-button' style='padding-top: 2px' data-item-id='${item.id}' 
        data-item-uuid='${item.uuid}' data-actor-id='${actorData.actorId}' data-token-id='${actorData.tokenId}' 
        data-base-damage='${item.system.damage}' data-damage-type='${itemData.dmgType}' 
        data-formula='${dmgObj.formula}' data-debug-formula='${dmgObj.debugFormula}' 
        data-damage-groups='${JSON.stringify(dmgObj.damageGroups)}' data-source-type='${item.type}'>
      </div>`;
    if (dmgObj.formula2h) {
      html += `<div class='dmg-roll-button2h' style='padding-top: 2px' data-item-id='${item.id}' 
          data-item-uuid='${item.uuid}' data-actor-id='${actorData.actorId}' data-token-id='${actorData.tokenId}' 
          data-base-damage='${item.system.damage2h}' data-damage-type='${item.system.dmgType}' 
          data-formula='${dmgObj.formula2h}' data-debug-formula='${dmgObj.debugFormula2h}' 
          data-damage-groups='${JSON.stringify(dmgObj.damageGroups2h)}' data-source-type='${item.type}'>
        </div>`;
    }

    // return `<hr class='plain-hr' />...
    return html;
  }

  _renderItemCheckSection(itemData) {
    if (itemData.formula && itemData.tn) {
      return `<p>Item Check: ${itemData.formula} equal or under ${itemData.tn}</p>`;
    }
    return "";
  }

  _renderAnnotations(itemData) {
    const parts = [];
    if (itemData.annotations && itemData.annotations.length > 0) {
      const weaponAnnotations = CONFIG.HYP3E.weaponAnnotations;
      parts.push("<hr class='plain-hr' />");
      parts.push("<h4>Annotations:</h4>");
      parts.push("<ul>");
      itemData.annotations.forEach(annotation => {
        parts.push(`<li>${weaponAnnotations[annotation]}</li>`);
      });
      parts.push("</ul>");
    }
    return parts.join("");
  }

  /**
   * Handle active effects that might expire, or events that occur, with a new turn.
   * @param {*} turn - The current game-world turn number.
   */
  async advanceExplorationTurn(turn) {
    if (this.system.duration > 0) {
      // Handle temporary or ephemeral items
      const duration = this.system.duration;
    }
  }

  /**
   * Handle active effects that might expire, or events that occur, with a new turn.
   * @param {*} turn - The current game-world turn number.
   */
  async retreatExplorationTurn(turn) {
    // Handle temporary or ephemeral items
    const duration = this.system.duration;
  }

  getNumericDuration(raw) {
   if (raw === "" || raw === null || raw === undefined) return null;
  
   // Convert to number
   const dur = Number(raw);
  
   // Reject anything non-numeric (e.g. "fast", "@level", NaN)
   if (Number.isNaN(dur)) return null;
  
   return dur;
  }

  /** LOOKUP TABLES AND FUNCTIONS ---------------------*/

  /**
   * Determine whether the item is a container or not
   * @returns {Boolean}
   */
  _isContainer() {
    return this.system?.isContainer || this.type === "container"
  }

  /**
   * Check if this item is a light source based on its name. Return properties if found.
   * @param {*} name - Simple name of the light source, e.g. "Torch", "Lantern, Hooded", etc.
   * @returns 
   */
  static getLightSourceProperties(name) {
    if (!name) return null;

    // Light source lookup table
    const lightSources = {
      "bonfire": { "radius": 60, "angle": 360, "color": null, "alpha": 0.5 },
      "campfire": { "radius": 40, "angle": 360, "color": null, "alpha": 0.5 },
      "candle": { "radius": 5, "angle": 360, "color": null, "alpha": 0.5 },
      "continuous_light_spell": { "radius": 30, "angle": 360, "color": null, "alpha": 0.5 },
      "lamp": { "radius": 30, "angle": 360, "color": null, "alpha": 0.5 },
      "lantern": { "radius": 30, "angle": 360, "color": null, "alpha": 0.5 },
      "lantern_bullseye": { "radius": 60, "angle": 15, "color": null, "alpha": 0.5 },
      "lantern_hooded": { "radius": 30, "angle": 360, "color": null, "alpha": 0.5 },
      "light_spell": { "radius": 15, "angle": 360, "color": null, "alpha": 0.5 },
      "produce_flame_spell": { "radius": 40, "angle": 360, "color": null, "alpha": 0.5 },
      "torch": { "radius": 30, "angle": 360, "color": null, "alpha": 0.5 }
    }

    // Convert the name to lowercase and replace spaces with underscores
    let normalized = name.toLowerCase().replace(/\s+/g, "_");
    // Remove hyphens, commas, and apostrophes
    normalized = normalized.replace(/[-,']/g, "");
    // Check if the normalized name exists in the lightSources table
    let lightSourceProps;
    lightSourceProps = lightSources[normalized];
    if (lightSourceProps) {
      return lightSourceProps;
    } else {
      return null;
    }
  }

  _stringOrObjectFromTable(table, val) {
    const output = table[val]
    return output
  }
}
