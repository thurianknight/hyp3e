import { HYP3E } from "../helpers/config.mjs"
import { Hyp3eCharacter } from "../helpers/character.mjs";
import { parseGpValue, 
            buyFromMerchant,
            sellToMerchant,
            transferFromTreasure } from "../helpers/money.mjs";
import { Hyp3eLogger } from "../helpers/logger.mjs";
import { enableAllTransferrableItemEffectsToItemOwner, 
            disableAllTransferrableItemEffectsOnItemOwner, 
            onManageActiveEffectV2, 
            prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { sendSimpleChat } from "../chat/chat.mjs"
import HYP3EActorSetLanguages from "../apps/character-set-languages.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api
const { ActorSheetV2 } = foundry.applications.sheets

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheetV2}
 */
export class Hyp3eActorSheetV2 extends HandlebarsApplicationMixin(ActorSheetV2) {

    static LANGUAGES_APP = new HYP3EActorSetLanguages();

    // ===========================================================================
    // ITEM SHEET SETUP
    // ===========================================================================

    get title() {
        const typeLabel = game.i18n.localize(`TYPES.actor.${this.actor.type}`);
        return `${typeLabel}: ${this.actor.name}`;
    }

    static get themes() {
        // Set Foundry's system Light and Dark themes
        const globalThemes = {
            light: "Light",
            dark: "Dark",
        };

        const customThemes = {
            warlord: "Warlord",
            cryomancer: "Cryomancer",
            necromancer: "Necromancer",
            pyromancer: "Pyromancer",
            beastmaster: "Beastmaster",
            shadowmaster: "Shadowmaster",
        };

        // Merge and log for verification
        const allThemes = { ...globalThemes, ...customThemes };
        Hyp3eLogger.info("HYP3EActorSheetV2 get themes", "Available themes:", allThemes);
        return allThemes;
    }

    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ["hyp3e", "actor"],
        position: {
            width: 810,
            height: 700,
        },
        form: {
            submitOnChange: true
        },
        window: {
            icon: "fas fa-book",
            resizable: true,
        },
        actions: {
            // These actions are shared on multiple tabs
            rollThis: Hyp3eActorSheetV2._onRoll,
            sortAz: Hyp3eActorSheetV2._sortItemsAz,
            createItem: Hyp3eActorSheetV2._onItemCreate,
            dropItemDescription: Hyp3eActorSheetV2._toggleItemSummary,
            toggleItemEquip: Hyp3eActorSheetV2._toggleItemEquip,
            displayItem: Hyp3eActorSheetV2._displayItemInChat,
            editItem: Hyp3eActorSheetV2._editItem,
            deleteItem: Hyp3eActorSheetV2._deleteItem,
            // Actions on the sheet header
            editImage: Hyp3eActorSheetV2._onEditImage,
            setNpcType: Hyp3eActorSheetV2._setNpcType,
            quickCreate: Hyp3eActorSheetV2._onQuickCreate,
            levelUp: Hyp3eActorSheetV2._onLevelUp,
            setLanguages: Hyp3eActorSheetV2._openLanguagesApp,
            // Actions on the Abilities tab
            setAttributeMods: Hyp3eActorSheetV2._onSetAttributeMods,
            updateBonusSpell: Hyp3eActorSheetV2._updateBonusSpell,
            // Actions on the Combat tab
            itemToggleLight: Hyp3eActorSheetV2._itemToggleLight,
            itemCastSpell: Hyp3eActorSheetV2._itemCastSpell,
            itemQtySub: Hyp3eActorSheetV2._decrementItemQty,
            itemQtyAdd: Hyp3eActorSheetV2._incrementItemQty,
            // Actions on the Effects tab
            createEffect: Hyp3eActorSheetV2._onManageActiveEffect,
            editEffect: Hyp3eActorSheetV2._onManageActiveEffect,
            deleteEffect: Hyp3eActorSheetV2._onManageActiveEffect,
            toggleEffect: Hyp3eActorSheetV2._onManageActiveEffect,
        },
    }

    // static TABS = {
    //     primary: {
    //         tabs: [
    //             { id: 'abilities' },
    //             { id: 'description' },
    //             { id: 'effects' }
    //         ],
    //         labelPrefix: 'HYP3E.tabs',
    //         initial: 'abilities'
    //     }
    // }
    // Start with an empty tabs array, and during _getTabsConfig we customize for each actor type
    static TABS = {
        primary: {
            tabs: [],
            labelPrefix: 'HYP3E.tabs',
            initial: 'abilities'
        }
    }

    static PARTS = {
        header: {
            template: `${HYP3E.templatePath}/actor/actor-main-sheet-v2.hbs`,
        },
        tabs: {
            // Foundry-provided generic template
            template: 'templates/generic/tab-navigation.hbs',
        },
        abilities: {
            template: `${HYP3E.templatePath}/actor/parts/tab-actor-abilities.hbs`,
            scrollable: ["", ".tab"],
        },
        // Combat, Spells, and Items are only used by Characters. We use conditional rendering
        //  in the handlebars templates, so these three will not appear on the NPC sheet.
        combat: {
            template: `${HYP3E.templatePath}/actor/parts/tab-character-combat.hbs`,
            scrollable: ["", ".tab"],
        },
        spells: {
            template: `${HYP3E.templatePath}/actor/parts/tab-character-spells.hbs`,
            scrollable: ["", ".tab"],
        },
        items: {
            template: `${HYP3E.templatePath}/actor/parts/tab-character-items.hbs`,
            scrollable: ["", ".tab"],
        },
        // All PCs and NPCs gets Description, same as Abilities, above.
        description: {
            template: `${HYP3E.templatePath}/actor/parts/tab-actor-description.hbs`,
            scrollable: ["", ".tab"],
        },
        // We load Effects last so that any active effects from items are already applied
        effects: {
          template: `${HYP3E.templatePath}/actor/parts/tab-actor-effects.hbs`,
          scrollable: ["", ".tab"],
        },
        // Merchants get equipment and fighting gear, and none of the prior tabs
        equipment: {
            template: `${HYP3E.templatePath}/actor/parts/tab-merchant-equipment.hbs`,
            scrollable: ["", ".tab"],
        },
        fightingGear: {
            template: `${HYP3E.templatePath}/actor/parts/tab-merchant-fighting-gear.hbs`,
            scrollable: ["", ".tab"],
        },
        // Treasure hoards get one combined list of all items
        treasureAll: {
            template: `${HYP3E.templatePath}/actor/parts/tab-treasure-all-items.hbs`,
            scrollable: ["", ".tab"],
        },
        // Item tokens get NPC-styled abilities and description tabs
        itemTokenAbilities: {
            template: `${HYP3E.templatePath}/actor/parts/tab-itemToken-abilities.hbs`,
            scrollable: ["", ".tab"],
        },
        // itemTokenDescription: {
        //     template: `${HYP3E.templatePath}/actor/parts/tab-itemToken-description.hbs`,
        //     scrollable: ["", ".tab"],
        // },
    }

    // ===========================================================================
    // OVERRIDES
    // ===========================================================================
  
    /** @override */
    get document() {
        return this.options.document  // Document comes from options
    }

    /** @override */
    async _prepareContext(options) {
      const document = this.document;
      const { documentName, type=CONST.BASE_DOCUMENT_TYPE } = document;
      const {
          sheetClasses, defaultClasses, defaultClass
      } = foundry.applications.apps.DocumentSheetConfig.getSheetClassesForSubType(documentName, type);
      const sheetClass = document.flags.core?.sheetClass ?? "";
      const config = CONFIG[documentName].sheetClasses[type] ?? {};
      const themes = game.settings.get("core", "sheetThemes");
      const currentClass = sheetClass || defaultClass;
      Hyp3eLogger.info("HYP3EActorSheetV2 _prepareContext", `Document data:`, { document, sheetClass, config, themes, currentClass });

      // Retrieve base data structure
      const context = await super._prepareContext(options);
      context.actor = this.actor;
      context.isGM = game.user.isGM
      context.autoCalcAttrMods = CONFIG.HYP3E.autoCalcAttrMods;

      // Use a safe clone of the actor data for further operations
      const actorData = this.actor.toObject(false);
      Hyp3eLogger.info("HYP3EActorSheetV2 _prepareContext", `Actor data for sheet:`, actorData);

      // Add the actor's system data and flags to context root for easier access
      context.system = actorData.system;
      context.flags = actorData.flags;

      // Add the actor's items to sheet context, for ease of access
      context.items = this.actor.items.map(i => ({
          id: i.id,
          ...i.toObject(),
      }));

      // Prepare character data and items
      if (actorData.type == 'character') {
          await this._prepareItems(context);
          this._prepareCharacterData(context);
      }
      
      // Prepare NPC data and items
      if (actorData.type == 'npc') {
          await this._prepareItems(context);
          this._prepareNpcData(context);
      }

      // Prepare merchant data and items
      if (actorData.type == 'merchant') {
          await this._prepareItems(context);
          this._prepareMerchantData(context);
      }

      // Prepare treasure data and items
      if (actorData.type == 'treasure') {
          await this._prepareItems(context);
          this._prepareTreasureData(context);
      }

      // Prepare itemToken data
      if (actorData.type == 'itemToken') {
        await this._prepareItems(context);
        await this._prepareItemTokenData(context);
      }

      // Add roll data for TinyMCE editors.
      context.rollData = this.actor.getRollData();

      // Enable/disable character quick-create button
      if (game.settings.get(game.system.id, "quickCreateChars") != "" && !this.actor.getFlag(game.system.id, "disableQuickCreate")) {
          context.enableQuickCreate = true;
      } else {
          context.enableQuickCreate = false;
      };

      // Prepare active effects
      context.effects = prepareActiveEffectCategories(this.actor.allApplicableEffects());

      // Log the complete actor sheet data
      Hyp3eLogger.info("HYP3EActorSheetV2 _prepareContext", `Actor sheet data complete:`, context);

      return context;
    }

    /** @override */
    async _preparePartContext(partId, context) {
        context = await super._preparePartContext(partId, context);
        Hyp3eLogger.info("HYP3EActorSheetV2 _preparePartContext", `Part context for "${partId}":`, context);

        if (partId === "header" || partId === "tabs") {
            // Header and tabs parts do not need special tab handling
            return context;
        }
        if (!context.tabs) {
            Hyp3eLogger.info("HYP3EActorSheetV2 _preparePartContext", `No tabs data found in context!`);
            return context;
        }
        if (!context.tabs[partId]) {
            Hyp3eLogger.info("HYP3EActorSheetV2 _preparePartContext", `No tab data found for part "${partId}".`);
            return context;
        }

        // Remove parts that aren't for the NPC actor type
        // if (this.actor.type === "npc" && ["combat","spells","items"].includes(partId)) {
        //     return null; // returning null skips rendering this part
        // }

        // Remove parts that aren't for the Merchant actor type
        // if (this.actor.type === "merchant" && ["abilities","combat","spells","items","description","effects"].includes(partId)) {
        //     return null; // returning null skips rendering this part
        // }

        // Reset the default tab for Merchants
        if (this.actor.type === "merchant" && !Object.keys(context.tabs).find(key => context.tabs[key].active)) {
            context.tabs["equipment"].active = true;
            context.tabs["equipment"].cssClass = "active";
        }

        // Remove parts that aren't for the Treasure actor type
        // if (this.actor.type === "treasure" && ["abilities","combat","spells","items","description","effects"].includes(partId)) {
        //     return null; // returning null skips rendering this part
        // }

        // Reset the default tab for Treasure
        if (this.actor.type === "treasure" && !Object.keys(context.tabs).find(key => context.tabs[key].active)) {
            context.tabs["treasureAll"].active = true;
            context.tabs["treasureAll"].cssClass = "active";
        }

        // Reset the default tab for Item Tokens
        if (this.actor.type === "itemToken" && !Object.keys(context.tabs).find(key => context.tabs[key].active)) {
            context.tabs["itemTokenAbilities"].active = true;
            context.tabs["itemTokenAbilities"].cssClass = "active";
        }

        // Process tabs
        if (context.tabs[partId].active) {
            context.tab = context.tabs[partId];
        }

        // Enrich text editor fields as needed
        switch (partId) {
            case 'abilities':
                break;
            case 'combat':
                break;
            case 'spells':
                break;
            case 'items':
              if (this.document.type === "character") {
                // Enrich content for display
                context.enrichedTreasure = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
                    this.document.system.treasure,
                    {
                        secrets: this.document.isOwner,
                        relativeTo: this.document
                    }
                )
              }
              break;
            case 'description':
              if (this.document.type === "character" || this.document.type === "npc") {
                // Enrich content for display
                context.enrichedBiography = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
                  this.document.system.biography,
                  {
                    secrets: this.document.isOwner,
                    relativeTo: this.document
                  }
                )
              }
              break;
            case 'effects':
              break;
            case "equipment":
              break;
            case "fightingGear":
              break;
            case "treasureAll":
              break;
            case "itemTokenAbilities":
              if (this.document.type === "itemToken") {
                // Enrich content for display
                context.enrichedBiography = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
                  this.document.system.biography,
                  {
                    secrets: this.document.isOwner,
                    relativeTo: this.document
                  }
                )
              }
              break;
            // case "itemTokenDescription":
            //   if (this.document.type === "itemToken") {
            //     // Enrich content for display
            //     context.enrichedBiography = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            //       this.document.system.biography,
            //       {
            //         secrets: this.document.isOwner,
            //         relativeTo: this.document
            //       }
            //     )
            //   }
            //   break;
            default:
        }
        return context;
    }

    /** @override */
    _getTabsConfig(group) {
      const tabs = foundry.utils.deepClone(super._getTabsConfig(group))

      // Common PC & NPC tabs
      if (this.document.type === "character" || this.document.type === "npc") {
        tabs.tabs.push({ id: 'abilities', group: group });
        tabs.tabs.push({ id: 'description', group: group });
        tabs.tabs.push({ id: 'effects', group: group });
      }

      // Insert PC-specific tabs
      if (this.document.type === "character") {
        tabs.tabs.splice(1, 0, { id: 'combat', group: group });
        tabs.tabs.splice(2, 0, { id: 'spells', group: group });
        tabs.tabs.splice(3, 0, { id: 'items', group: group });
      }

      // Merchant tabs
      if (this.document.type === "merchant") {
        tabs.tabs.push({ id: 'equipment', group: group });
        tabs.tabs.push({ id: 'fightingGear', group: group });
      }

      // Treasure tab
      if (this.document.type === "treasure") {
        tabs.tabs.push({ id: 'treasureAll', group: group });
      }

      // Item Token tabs
      if (this.document.type === "itemToken") {
        tabs.tabs.push({ id: 'itemTokenAbilities', group: group });
        // tabs.tabs.push({ id: 'itemTokenDescription', group: group });
        tabs.tabs.push({ id: 'effects', group: group });
      }

      Hyp3eLogger.info("HYP3EActorSheetV2 _getTabsConfig", `Tabs config for ${this.actor.name}:`, tabs);
      return tabs
    }

  /**
   * Organize and classify Data for Character sheets.
   * @param {Object} context The actor to prepare.
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
              Hyp3eLogger.info("HYP3EActorSheetV2 _prepareCharacterData", `ST is too low for ${context.system.details.class}!`)
              context.warnStr = true
            }
            break
          case "dex":
            if (Hyp3eCharacter.isAttributeLow(actorData, k)) {
              Hyp3eLogger.info("HYP3EActorSheetV2 _prepareCharacterData", `DX is too low for ${context.system.details.class}!`)
              context.warnDex = true
            }
            break
          case "con":
            if (Hyp3eCharacter.isAttributeLow(actorData, k)) {
              Hyp3eLogger.info("HYP3EActorSheetV2 _prepareCharacterData", `CN is too low for ${context.system.details.class}!`)
              context.warnCon = true
            }
            break
          case "int":
            if (Hyp3eCharacter.isAttributeLow(actorData, k)) {
              Hyp3eLogger.info("HYP3EActorSheetV2 _prepareCharacterData", `IN is too low for ${context.system.details.class}!`)
              context.warnInt = true
            }
            break
          case "wis":
            if (Hyp3eCharacter.isAttributeLow(actorData, k)) {
              Hyp3eLogger.info("HYP3EActorSheetV2 _prepareCharacterData", `WS is too low for ${context.system.details.class}!`)
              context.warnWis = true
            }
            break
          case "cha":
            if (Hyp3eCharacter.isAttributeLow(actorData, k)) {
              Hyp3eLogger.info("HYP3EActorSheetV2 _prepareCharacterData", `CH is too low for ${context.system.details.class}!`)
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
          // Hyp3eLogger.info("HYP3EActorSheetV2 _prepareCharacterData", `Attribute ${k} is not at default 10, disabling quick-create!`);
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

    // Set encumbrance flags for the sheet
    if (CONFIG.HYP3E.enableEncumbrance) {
      if (this.actor.system.encumberedState === "heavilyEncumbered") {
        context.isHeavilyEncumbered = true
        context.isEncumbered = false
      } else if (this.actor.system.encumberedState === "encumbered") {
        context.isEncumbered = true
        context.isHeavilyEncumbered = false
      } else {
        context.isEncumbered = false
        context.isHeavilyEncumbered = false
      }
    }
  }

    /**
     * Organize and classify Data for NPC sheets.
     * @param {Object} context The actor to prepare.
     * @return {undefined}
     */
    _prepareNpcData(context) {
        // Load creature sizes
        context.creatureSizes = CONFIG.HYP3E.creatureSizes
        // Load Phenotypes
        context.phenotypes = CONFIG.HYP3E.phenotypes
    }

    /**
     * Organize and classify Data for NPC sheets.
     * @param {Object} context The actor to prepare.
     * @return {undefined}
     */
    _prepareMerchantData(context) {
      // Handle money types
      for (let [k, v] of Object.entries(context.system.money)) {
        v.label = game.i18n.localize(CONFIG.HYP3E.money[k]) ?? k;
      }
    }

    /**
     * Organize and classify Data for NPC sheets.
     * @param {Object} context The actor to prepare.
     * @return {undefined}
     */
    _prepareTreasureData(context) {
      // Handle money types
      for (let [k, v] of Object.entries(context.system.money)) {
        v.label = game.i18n.localize(CONFIG.HYP3E.money[k]) ?? k;
      }
    }

    /**
     * Organize and classify Data for Item Token sheets.
     * @param {Object} context The actor to prepare.
     * @return {undefined}
     */
    _prepareItemTokenData(context) {
      // No special data preparation needed for item tokens at this time
    }

    /**
     * Organize and classify Items for Character sheets.
     * @param {Object} context The actor sheet context to prepare.
     * @return {undefined}
     */
    async _prepareItems(context) {
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
        for (let i of this.actor.items) {
            i.img = i.img || DEFAULT_TOKEN;

            // Enrich all item Description fields
            if (i.system?.description) {
                i.system.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(i.system.description, {
                    async: true,
                    rollData: this.actor.getRollData(),
                    rolls: true,          // enable [[roll]] links
                    documents: true,
                });
            }

            // Calculate total weight carried by character. For weapons & armor, the equipped
            //  status is ignored and the item weight is always added to encumbrance.
            //  For non-weapon items, the equipped status is used to determine if the item
            //  is carried or not.
            if (i.system.weight) {
                if (i.system.quantity.value) {
                    // Is this a normal item, and is it carried?
                    if ((i.type === 'item' || i.type === 'container') && i.system.equipped) {
                        if (i.system.quantity.bundle && i.system.quantity.bundle > 1) {
                            // For bundled items, we calculate weight based on number of bundles
                            i.system.carriedWt = (i.system.weight * (i.system.quantity.value / i.system.quantity.bundle))
                        } else {
                            // Normal unbundled item
                            i.system.carriedWt = (i.system.weight * i.system.quantity.value)
                        }
                        i.system.carriedWt = Math.round(i.system.carriedWt * 10)/10    
                        // encumbrance += i.system.carriedWt
                    } else if (i.type === 'weapon' || i.type === 'armor' || i.type === 'shield') {
                        if (i.system.quantity.bundle && i.system.quantity.bundle > 1) {
                            // For bundled items, we calculate weight based on number of bundles
                            i.system.carriedWt = (i.system.weight * (i.system.quantity.value / i.system.quantity.bundle))
                        } else {
                            i.system.carriedWt = (i.system.weight * i.system.quantity.value)
                        }
                        i.system.carriedWt = Math.round(i.system.carriedWt * 10)/10    
                        // encumbrance += i.system.carriedWt
                    } else {
                        i.system.carriedWt = 0
                    }
                }
            }
            // Calculate the gp value of the item, taking qty x cost. If qty is empty, assume 1.
            //  If cost is empty, assume 0.
            if (i.system.cost) {
                const baseGpVal = parseGpValue(i.system.cost)
                if (baseGpVal) {
                    // For merchants, show item selling price (unit or bundle)
                    i.system.unitPrice = Math.round(baseGpVal * (this.actor.system.sellMultiplier ?? 1) * 100) / 100;
                    // Normal characters show total value of item qty
                    if (i.system.quantity.bundle && i.system.quantity.bundle > 1) {
                        // Calculate value based on number of bundles
                        i.system.value = Math.round((baseGpVal * (i.system.quantity.value ? (i.system.quantity.value / i.system.quantity.bundle) : 1))*100)/100    
                    } else {
                        // Calculate value based on total qty
                        i.system.value = Math.round((baseGpVal * (i.system.quantity.value ? i.system.quantity.value : 1))*100)/100    
                    }
                    allTheGold += i.system.value
                } else {
                    i.system.unitPrice = null
                    i.system.value = null
                }
            } else {
                i.system.unitPrice = 0
                i.system.value = 0
            }

            // Append to containers.
            if (i.type === 'container' || (i.type === 'item' && i.system.isContainer)) {
                // Get contained items and add to their container
                i.contents = this.getContents(i.id)
                Hyp3eLogger.info("HYP3EActorSheetV2 _prepareItems", `${i.name} contents:`, i.contents)
                i.contents.sort((a,b) => (a.sort||0) - (b.sort||0));
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
        // encumbrance = Math.round(encumbrance * 10)/10
        encumbrance = this.actor.system.weightCarried
        allTheGold = Math.round(allTheGold * 100)/100
        // Now convert allTheGold to a string and add " gp" to the end
        allTheGold = allTheGold.toLocaleString("en-US", {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2,
                                                }) + " gp";

        // Sort our arrays in item sort order
        gear.sort((a,b) => (a.sort||0) - (b.sort||0));
        containers.sort((a,b) => (a.sort||0) - (b.sort||0));
        features.sort((a,b) => (a.sort||0) - (b.sort||0));
        weapons.sort((a,b) => (a.sort||0) - (b.sort||0));
        armor.sort((a,b) => (a.sort||0) - (b.sort||0));
        for (let i=1; i<=6; i++) {
            spells[i].sort((a,b) => (a.sort||0) - (b.sort||0));
        }

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

    /**
     * Get the items within a container item
     * @param {*} id 
     * @param {*} context 
     * @returns 
     */
    getContents(id) {
        return this.actor.items.filter(
            ({system: {containerId}}) => id === containerId
        );
    }

    /** @override */
    async _onRender(context, options) {
        await super._onRender(context, options);

        // If the sheet is not editable, exit early
        if (!this.isEditable) return;

        // Flag ActiveEffects as inactive, if applicable
        const $html = this.element;
        for (const effect of this.actor.allApplicableEffects()) {
          const state = this.actor.system?._hyp3eEffectConditionState?.[effect.uuid];
          if (state === "inactive") {
            const li = $html.querySelector(`li[data-effect-id="${effect.id}"]`);
            if (li) {
              li.classList.add("inactive");
            }
          }
        }

        // Log render completion
        Hyp3eLogger.info("HYP3EActorSheetV2 _onRender", `Actor Sheet rendered.`, { context, options, sheet: this });
    }

    // ===========================================================================
    // EVENT HANDLERS
    // ===========================================================================

    /**
     * Allow the user to change the actor's image by clicking on it
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
     * Switches the NPC type between monster and npc (possibly more, tbd)
     * @param {*} event 
     * @param {*} target 
     */
    static async _setNpcType(event, target) {
      const value = target.dataset.value;
      const newValue = value == "monster" ? "npc" : "monster";
      await this.actor.update({ "system.npcType": newValue });
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
    static async _updateBonusSpell(event, target) {
        Hyp3eLogger.info("HYP3EActorSheetV2 _updateBonusSpell", `Bonus spell clicked:`, target);
        const spellLvl = target.dataset.spellLvl;
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
        Hyp3eLogger.info("HYP3EActorSheetV2 _updateBonusSpell", `Actor after update:`, this.actor.system);
    }

    /**
     * Handle toggling a light source item on/off
     * @param {*} event 
     * @param {*} target 
     */
    static async _itemToggleLight(event, target) {
        event.preventDefault()
        Hyp3eLogger.info("HYP3EActorSheetV2 _itemToggleLight", `Toggling item light...`, { event, target });
        const itemId = $(target).closest(".item-entry").data("itemId")
        const item = this.actor.items.get(itemId)
        // Toggle the light source
        if (item.system.isLightSource) {
            // Toggle the light source on/off
            await this.actor.toggleLightSource(itemId);
            // Update the UI
            this.render(true);
        } else {
            const msg = `${item.name} is not a valid light source!`;
            Hyp3eLogger.warn("_itemToggleLight", msg);
            ui.notifications.warn(msg);
        }
    }

    /**
     * Handle casting a spell or using a feature from an item
     * @param {*} event 
     * @param {*} target 
     * @returns 
     */
    static async _itemCastSpell(event, target) {
        event.preventDefault();
        Hyp3eLogger.info("HYP3EActorSheetV2 _itemCastSpell", `Casting item spell...`, { event, target });

        const itemId = $(target).closest(".item-entry").data("itemId")
        const item = this.actor.items.get(itemId)
        const itemName = item.system.friendlyName ? item.system.friendlyName : item.name;

        // Are we enforcing the weapon equippage rule for PCs?
        if (CONFIG.HYP3E.forceWeaponEquip && this.actor.type === "character") {
            // Check if the item is equipped
            if (!item.system.equipped) {
                ui.notifications.warn(`${itemName} is not equipped!`);
                return;
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
    }

    /**
     * Handle decrementing a consumable item's qty
     * @param {Event} event The originating click event
     * @private
     */
    static async _decrementItemQty(event, target) {
        event.preventDefault()
        Hyp3eLogger.info("HYP3EActorSheetV2 _decrementItemQty", `Decrementing item qty...`, { event, target });
        const itemId = $(target).closest(".item-entry").data("itemId")
        const item = this.actor.items.get(itemId)
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
    static async _incrementItemQty(event, target) {
        event.preventDefault()
        Hyp3eLogger.info("HYP3EActorSheetV2 _incrementItemQty", `Incrementing item qty...`, { event, target });
        const itemId = $(target).closest(".item-entry").data("itemId")
        const item = this.actor.items.get(itemId)
        if (item.system.quantity.value < item.system.quantity.max) {
            // Update the embedded item document
            this.actor.updateEmbeddedDocuments("Item", [
                { _id: item.id, "system.quantity.value": item.system.quantity.value+1 },
            ]);
        }
    }

    static async _sortItemsAz(event, target) {
        event.preventDefault()
        const itemType = target.dataset.itemType;
        if (!itemType) {
          Hyp3eLogger.warn("No data-item-type specified on sort button");
          return;
        }
        const actor = this.document; // In V2 sheets, this is the Actor document
        if (!actor?.items) return;

        Hyp3eLogger.info("HYP3EActorSheetV2 _sortItemsAz", `Sorting ${itemType} A-Z...`, { event, target });

        // Get only items of the requested type
        const itemsOfType = actor.items.filter(i => i.type === itemType);

        if (!itemsOfType.length) {
          const msg = `No items of type ${itemType} found on ${actor.name}`;
          Hyp3eLogger.warn("HYP3EActorSheetV2 _sortItemsAz", msg);
          ui.notifications.info(msg);
          return;
        }

        let sortedItems;
        if (itemType === "feature") {
          // Special sort: Level (null first, then 1,2,3...), then name A-Z
          sortedItems = [...itemsOfType].sort((a, b) => {
            // Get level values – treat missing/null/undefined as -1 (so they sort first)
            const levelA = a.system?.level ?? -1;
            const levelB = b.system?.level ?? -1;
      
            // Compare levels first
            if (levelA !== levelB) {
              return levelA - levelB;  // ascending: -1 (nulls), then 1, 2, 3...
            }
      
            // Same level → sort by name alphabetically
            return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
          });
        } else {
          // Default: just alphabetical by name for all other types
          // Sort alphabetically (case-insensitive, locale-aware)
          sortedItems = [...itemsOfType].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
          );
        }

        // Prepare minimal updates (only _id and sort)
        const updates = sortedItems.map((item, index) => ({
          _id: item.id,
          sort: index * 100000,   // Large gaps = safe for manual drag & drop later
        }));

        try {
          await actor.updateEmbeddedDocuments("Item", updates);
          // Optional: force a refresh if needed (usually not necessary in V2)
          // this.render(false);
          ui.notifications.info(`Sorted ${sortedItems.length} ${itemType} items A-Z.`);
        } catch (err) {
          Hyp3eLogger.error("Failed to sort items", err);
          ui.notifications.error("Failed to sort items - see console for details.");
        }
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event - The originating click event
     * @param {HTMLElement} target - The originating click target
     * @private
     */
    static async _onItemCreate(event, target) {
        event.preventDefault();
        Hyp3eLogger.info("HYP3EActorSheetV2 _onItemCreate", `Creating new item...`, { event, target });
        // Get the type of item to create
        const type = target.dataset.type;
        // Grab any data associated with this control
        const data = duplicate(target.dataset);
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
     * @param {Event} event - The originating click event
     * @param {HTMLElement} target - The originating click target
     * @private
     */
    static _toggleItemSummary(event, target) {
        event.preventDefault()
        Hyp3eLogger.info("HYP3EActorSheetV2 _toggleItemSummary", `Toggling item summary...`, { event, target });
        const summary = target.closest(".item-entry.item").querySelector(".item-summary");
        summary.style.display = summary.style.display === "block" ? "" : "block";
    }

    static async _toggleItemEquip(event, target) {
        event.preventDefault()
        Hyp3eLogger.info("HYP3EActorSheetV2 _toggleItemEquip", `Toggling equipped status of item...`, { event, target });
        const itemId = $(target).closest(".item-entry").data("itemId")
        const item = this.actor.items.get(itemId)
        // Do the equip/unequip
        await item.update({
            system: {
                equipped: !item.system.equipped,
            },
        })
        // Disable or enable any active effects coming from the item
        if (!item.system.equipped) {
            // Disable effects
            disableAllTransferrableItemEffectsOnItemOwner(item, this.actor.id)
        } else {
            // Enable effects
            enableAllTransferrableItemEffectsToItemOwner(item, this.actor.id)
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
        sendSimpleChat(this.actor, "", message);
    }

    /**
     * Handle displaying an Item description in the chat.
     * @param {Event} event - The originating click event
     * @param {HTMLElement} target - The originating click target
     * @private
     */
    static async _displayItemInChat(event, target) {
        event.preventDefault()
        Hyp3eLogger.info("HYP3EActorSheetV2 _displayItemInChat", `Displaying item in chat...`, { event, target });
        const itemId = $(target).closest(".item-entry").data("itemId")
        const item = this.actor.items.get(itemId)
        // Use actor's system data to pass to item._displayItemInChat()
        const actorData = this.actor.getRollData()
        // Use the item's display function to do it
        item._displayItemInChat(actorData)
    }

    /**
     * Handle editing the selected Item by opening its ItemSheet.
     * @param {Event} event - The originating click event
     * @param {HTMLElement} target - The originating click target
     * @private
     */
    static async _editItem(event, target) {
        event.preventDefault()
        Hyp3eLogger.info("HYP3EActorSheetV2 _editItem", `Editing item...`, { event, target });
        const itemId = $(target).closest(".item-entry").data("itemId")
        const item = this.actor.items.get(itemId)
        item.sheet.render(true)
    }

    /**
     * Handle deleting the selected Item from the Actor.
     * @param {Event} event - The originating click event
     * @param {HTMLElement} target - The originating click target
     * @private
     */
    static async _deleteItem(event, target) {
        event.preventDefault()
        Hyp3eLogger.info("HYP3EActorSheetV2 _deleteItem", `Deleting item...`, { event, target });
        const itemId = $(target).closest(".item-entry").data("itemId")
        const item = this.actor.items.get(itemId)
        // Delete the item (active effects are deleted automatically at the same time)
        item.delete()
        // li.slideUp(200, () => this.render(false))
        if (this.actor.type === "itemToken") {
          // Unlink the item
          this.actor.system.linkedItemUuid = "";
          await this.actor.update();
        }
    }

    /**
     * Handle the Quick-Create button to quickly roll up a new character.
     * @param {*} event 
     * @param {*} target 
     * @returns 
     */
    static async _onQuickCreate(event, target) {
        event.preventDefault();
        const dataset = target.dataset;

        if (!this.actor.system.details.class) {
            ui.notifications.warn("Please select a character class!");
            return;
        }
        // Quickly roll up a character of the selected class
        dataset.actorId = this.actor.id
        dataset.baseClass = this.actor.system.baseClass
        // Log the dataset
        Hyp3eLogger.info("HYP3EActorSheetV2 _onLevelUp", `Level up dataset:`, dataset);
        let createOk = await Hyp3eCharacter.quickCreateCharacter(dataset);
        if (createOk) {
            ui.notifications.info("Character created!")
            this.render()
        } else {
            ui.notifications.error("Character creation failed. Please check the console for errors.")
        }
    }

    /**
     * Handle the Level-Up button to automatically level-up a character.
     * @param {*} event 
     * @param {*} target 
     */
    static async _onLevelUp(event, target) {
        event.preventDefault();
        const dataset = target.dataset;

        dataset.actorId = this.actor.id
        dataset.baseClass = this.actor.system.baseClass
        // Log the dataset
        Hyp3eLogger.info("HYP3EActorSheetV2 _onLevelUp", `Level up dataset:`, dataset);
        // Check current XP, and level up if possible
        let levelUpOk = await Hyp3eCharacter.levelUp(dataset)
        if (levelUpOk) {
            this.render()
        }
    }

    // Open the Languages app
    static _openLanguagesApp() {
        Hyp3eActorSheetV2.LANGUAGES_APP.render(true, { actorUuid: this.actor.uuid, focus: true });
    }

    /**
     * Handle the Set Attribute Mods button to fill the attribute modifiers and some additional data.
     * @param {*} event 
     * @param {*} target 
     */
    static async _onSetAttributeMods(event, target) {
        event.preventDefault();
        const dataset = target.dataset;
        dataset.actorId = this.actor.id
        dataset.baseClass = this.actor.system.baseClass

        Hyp3eLogger.info("HYP3EActorSheetV2 _onSetAttributeMods", `Set attribute mods dataset:`, dataset);

        // Take the attribute scores and class, and lookup/calculate modifiers
        const setAttrOk = await Hyp3eCharacter.setAttributeMods(dataset, false)
            .then(setAttrOk => {
                if (setAttrOk) {
                    this.render()
                    this.actor.setFlag(game.system.id, "disableQuickCreate", true)
                }
            })
            .catch(err => {
                // Log the error
                Hyp3eLogger.error("_onSetAttributeMods", `Error:`, err)
            })
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event - The originating click event
     * @param {*} target - The HTML element (as a DOM object) that was clicked
     * @private
     */
    static async _onRoll(event, target) {
        event.preventDefault()
        // const element = event.currentTarget
        // const dataset = { ...event.currentTarget.dataset };
        const dataset = target.dataset;
        Hyp3eLogger.info("HYP3EActorSheetV2 _onRoll", `Roll dataset:`, dataset);

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
            dataset.actorId = this.actor.id
            dataset.baseClass = this.actor.system.baseClass
            dataset.tokenId = this.token?.id ? this.token?.id : null

            switch (dataset.rollType) {
                case "item":
                    if (!dataset.itemId || dataset.itemId === "") {
                        dataset.itemId = $(target).closest(".item-entry").data("itemId")
                    }
                    this.actor.rollItem(dataset)
                    break

                case "check":
                    this.actor.rollCheck(dataset)
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
        // Hyp3eLogger.info("HYP3EActorSheetV2 _onManageActiveEffect", `Managing active effect...`, { event, target, action });
        await onManageActiveEffectV2(target, this.actor);

        // Re-render the sheet to reflect changes
        this.render();
    }

    // ===========================================================================
    // DRAG AND DROP HANDLERS
    // ===========================================================================

    async _onDropItem(event, item) {
      // Hyp3eLogger.info("HYP3EActorSheetV2 _onDropItem", `Item dropped event:`, { event, item })

      // Handle merchant -> character drag
      const sourceActor = item?.parent;
      if (sourceActor?.type === "merchant" && this.actor.type !== "merchant") {
          // Perform the merchant transaction and exit early
          await buyFromMerchant(this.actor, sourceActor, item);
          return; // Prevent super._onDropItem()
      }
      // Handle character -> merchant drag
      if (["character","npc"].includes(sourceActor?.type) && this.actor.type === "merchant") {
          // If selling a container, it must be empty
          if (item._isContainer() && item.contents.length > 0) {
              const msg = `Container ${item.name} is not empty! Remove all items from it first, before selling it.`;
              Hyp3eLogger.warn("_onDropItem", msg);
              ui.notifications.warn(msg);
              return; // Prevent super._onDropItem()
          }
          // Perform the sale to merchant and exit early
          await sellToMerchant(this.actor, sourceActor, item);
          return; // Prevent super._onDropItem()
      }

      // Handle treasure -> character drag
      if (sourceActor?.type === "treasure" && this.actor.type !== "treasure") {
          // Perform the treasure acquisition and exit early
          await transferFromTreasure(this.actor, sourceActor, item);
          return; // Prevent super._onDropItem()
      }
      // Handle character -> treasure drag
      if (["character","npc"].includes(sourceActor?.type) && this.actor.type === "treasure") {
        const msg = `Why would you want to put items INTO a treasure trove? That makes no sense!`;
        Hyp3eLogger.warn("_onDropItem", msg);
        ui.notifications.warn(msg);
        return; // Prevent super._onDropItem()
      }

      // Handle any item dragged to an ItemToken
      if (this.actor.type === "itemToken") {
        if (this.actor.system?.linkedItemUuid && this.actor.system.linkedItemUuid !== "") {
          const msg = `This Item Token is already linked to an item.`;
          Hyp3eLogger.warn("_onDropItem", msg);
          ui.notifications.warn(msg);
          return; // Prevent super._onDropItem()
        }
        // Clone important properties from item to actor
        const updates = {
          "name": item.system?.friendlyName || item.name,
          "img": item.img,
          "system.linkedItemUuid": item.uuid,
          "system.biography": item.system.description,
          "system.fa": item?.parent?.system.fa || 0,
          "system.ca": item?.parent?.system.ca || null,
          "system.ta": item?.parent?.system.ta || null,
          "system.hp.value": 1,
          "system.hp.max": 1,
          "system.attributes.dex.value": item?.parent?.system.attributes.dex.value || 10,
          "prototypeToken.name": item.system?.friendlyName || item.name,
          "prototypeToken.texture.src": item.img,
          "prototypeToken.light.angle": item.system?.light.angle || 360,
          "prototypeToken.light.dim": item.system?.light.dim || null,
          "prototypeToken.light.bright": item.system?.light.bright || null,
          "prototypeToken.light.color": item.system?.light.color || null,
        };
        await this.actor.update(updates);
        const msg = `Item Token linked to item ${item.name}.`;
        Hyp3eLogger.info("_onDropItem", msg);
        ui.notifications.info(msg);
        return super._onDropItem(event, item) // Copy the item to the itemToken actor
      }

      // If an effectTemplate was dropped, add the effect to the actor
      if (item.type === "effectTemplate") {
        const droppedEffectNames = item.effects.map(e => e.name);
        const existing = this.actor.effects.find(e => droppedEffectNames.includes(e.name));
        if (existing) { 
          // Prevent duplicate inserts
          const msg = `Effect ${existing.name} is already linked to ${this.actor.name}.`;
          ui.notifications.warn(msg);
          Hyp3eLogger.warn("_onDropItem", msg);
          return; 
        }

        // Copy the effectTemplate's ActiveEffects to this actor
        const effects = item.effects.contents.map(e => {
          let effectData = e.toObject();
          effectData.origin = this.actor.uuid;
          effectData.sourceName = this.actor.name;
          return effectData;
        });

        if (!effects.length) {
          const msg = `No ActiveEffects found on template: ${item.name}`;
          Hyp3eLogger.warn("_onDropItem", msg);
          ui.notifications.warn(msg);
          return;
        }

        // Duplicate template effects onto this actor
        await this.actor.createEmbeddedDocuments("ActiveEffect", effects);

        const msg = `Applied ${effects.length} effect(s) from template "${item.name}" to ${this.actor.name}.`;
        Hyp3eLogger.info("_onDropItem", msg);
        ui.notifications.info(msg);
        return;
      }

      // Otherwise let normal copy-item behavior proceed
      return super._onDropItem(event, item)
    }

    _onSortItem(event, item) {
        // Hyp3eLogger.info("HYP3EActorSheetV2 _onSortItem", `Item sort event:`, { event, item })

        const target = event.target.closest("[data-item-id]");
        const dragged = this.actor.items.get(item.id);
        const targetItem = target ? this.actor.items.get(target.dataset.itemId) : null;

        // Special case 0: container item dragged over another container -> sort them
        if (dragged.system.isContainer && targetItem?.system.isContainer) {
            return super._onSortItem(event, item)
        }

        // Special case 1: item dragged over a container -> assign containerId
        //  But we only do this for characters & npcs, not merchants
        if (targetItem && (targetItem.system.isContainer || targetItem.type === "container")) {
            if (this.actor.type !== "merchant" && this.actor.type !== "treasure") {
                return dragged.update({ 
                                        "system.location": targetItem.name,
                                        "system.containerId": targetItem.id
                                    });
            } else {
                const msg = `Merchant or treasure inventory must be stand-alone, not in containers.`;
                Hyp3eLogger.warn("_onSortItem", msg);
                ui.notifications.warn(msg);
                return;
            }
        }

        // Special case 2: contained item dragged onto a non-contained item -> clear containerId
        if (dragged.system.containerId !== "" && targetItem && targetItem.system.containerId === "") {
            return dragged.update({ 
                                    "system.location": "",
                                    "system.containerId": ""
                                });
        }

        // Special case 3: contained item dropped into empty space -> clear containerId
        if (dragged.system.containerId && !targetItem) {
            return dragged.update({ 
                                    "system.location": "",
                                    "system.containerId": ""
                                });
        }

        // Default: fall back to built-in sorting
        return super._onSortItem(event, item)
    }

    _onDragOver(event) {
        // Hyp3eLogger.info("HYP3EActorSheetV2 _onDragOver", `Drag-over event:`, event)
        super._onDragOver(event)

        const li = event.target.closest("[data-item-id]");
        if (!li) return;

        const item = this.actor.items.get(li.dataset.itemId);

        // Remove existing highlights
        this.element.querySelectorAll(".drag-target").forEach(el => el.classList.remove("drag-target"));

        // Highlight only valid containers
        if (item?.system.isContainer || item?.type === "container") {
            li.classList.add("drag-target");
        }
    }

    _onDrop(event) {
        // Hyp3eLogger.info("HYP3EActorSheetV2 _onDrop", `Drop event:`, event)
        super._onDrop(event)
        this.element.querySelectorAll(".drag-target").forEach(el => el.classList.remove("drag-target"));
    }
}
