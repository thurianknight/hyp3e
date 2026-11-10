import HYP3E from "../helpers/config.mjs";
import { Hyp3eLogger } from "../helpers/logger.mjs";
import { HYP3ECombat } from "./combat.mjs";
import { Hyp3eDialog } from "../helpers/dialog.mjs";
import { SOCKET_NAME, SOCKET_EVENTS } from "../helpers/constants.mjs";

export const colorGroups = HYP3E.colors;
export const actionGroups = {
  "melee": "HYP3E.actions.melee",
  "missile": "HYP3E.actions.missile",
  "magic": "HYP3E.actions.magic",
  "movement": "HYP3E.actions.movement",
  "other": "HYP3E.actions.other",
}

/**
 * An extension of Foundry's Combat class that implements side-based initiative.
 */
export class HYP3EGroupCombat extends HYP3ECombat {
  // ===========================================================================
  // STATIC MEMBERS
  // ===========================================================================

  static get GROUPS () {
    return {
        ...colorGroups,
        ...actionGroups,
    };
  }

  // ===========================================================================
  // INITIATIVE MANAGEMENT
  // ===========================================================================

  async #rollAbsolutelyEveryone() {
    await this.rollInitiative();
  }

  /** @override */
  async rollInitiative(options = {}) {
    Hyp3eLogger.info("HYP3EGroupCombat rollInitiative", `Arguments passed to method:`, { options });
    const {
      combatantIds = null,    // An array of combatant ID strings
      group,                  // A string representing a single group name
      formula,
      updateTurn = false,
      messageOptions = {}
    } = options;

    // If one or more combatant IDs was provided, get the applicable groups, otherwise get all groups
    let groupsToRollFor = [];
    if (combatantIds !== null && combatantIds.length > 0) {
      Hyp3eLogger.info("HYP3EGroupCombat rollInitiative", `Combatant IDs for group initiative:`, combatantIds);
      groupsToRollFor = this.getCombatantGroupsFromList(combatantIds);
    } else if (group !== undefined) {
      // This is used when anyone clicks the roll button for a color-group in the combat tracker
      groupsToRollFor = [group];
    } else {
      // This is used when the GM clicks "Roll All" at the very top of the combat tracker
      groupsToRollFor = this.availableGroups;
    }
    Hyp3eLogger.info("HYP3EGroupCombat rollInitiative", `Groups to roll for:`, groupsToRollFor);

    // Take the groupsToRollFor array and append a roll object to each group
    const rollPerGroup = groupsToRollFor.reduce((prev, curr) => ({
      ...prev,
      [curr]: new Roll(HYP3ECombat.FORMULA)
    }), {});

    Hyp3eLogger.info("HYP3EGroupCombat rollInitiative", `Initiative roll per group:`, rollPerGroup);

    const results = await this.#prepareGroupInitiativeDice(rollPerGroup);
    Hyp3eLogger.info("HYP3EGroupCombat rollInitiative", `Initiative results per group:`, results);

    // Update each group's initiative scores
    for (const initGroup of groupsToRollFor) {
      const groupCombatants = this.combatants.filter(c => c.initGroup === initGroup);
      if (!groupCombatants.length) return;

      // Authorization: player must own at least one combatant in the group
      const ownsAny = groupCombatants.some(c => c.isOwner);
      if (!game.user.isGM && !ownsAny) {
        ui.notifications.warn(`You do not control any combatant in ${initGroup} group.`);
        return;
      }

      const newInitScore = results[initGroup].initiative;
      Hyp3eLogger.info("HYP3EGroupCombat rollInitiative", `Setting ${initGroup} group initiative to ${newInitScore}...`);
      if (game.user.isGM) {
        Hyp3eLogger.info("HYP3EGroupCombat rollInitiative", `User is GM, setting initiative directly...`);
        // GM can write directly
        await this.setGroupInitiativeScore(initGroup, newInitScore);
      } else {
        if (!game.users.activeGM) {
          Hyp3eLogger.warn("HYP3EGroupCombat rollInitiative", `No active GM available to apply group initiative.`);
          ui.notifications.error("No active GM available to apply group initiative.");
          return;
        }
        // Players must send a socket request to the GM to update the initiative
        Hyp3eLogger.info("HYP3EGroupCombat rollInitiative", `Sending socket request to GM to set ${initGroup} group initiative to ${newInitScore}...`, { Socket: SOCKET_NAME, Event: SOCKET_EVENTS.APPLY_GROUP_INITIATIVE });
        game.socket.emit(SOCKET_NAME, {
          type: SOCKET_EVENTS.APPLY_GROUP_INITIATIVE,
          combatId: this.id,
          updates: { groupId: initGroup, initiative: newInitScore },
          rollerUserId: game.user.id,
          flavor: game.i18n.format("HYP3E.combat.rollInitiative", { initGroup })
        });
      }
    }

    await this.#rollInitiativeUIFeedback(results);
    await this.activateCombatant(0);

    return this;
  }

  // Given a list of combatant IDs, return the list of unique group names for those combatants
  getCombatantGroupsFromList(combatantIds) {
    let combatants = []
    combatantIds.forEach(c => {
      combatants.push(this.combatants.find(combatant => combatant.id === c))
    })
    // Map combatant IDs to groups, and remove duplicate groups at the same time
    return [...new Set(
      combatants.map(c => c.initGroup)
    )]
  }

  async #prepareGroupInitiativeDice(rollPerGroup) {
    // Hyp3eLogger.info("HYP3EGroupCombat #prepareGroupInitiativeDice", `Roll per group:`, rollPerGroup);
    const pool = foundry.dice.terms.PoolTerm.fromRolls(Object.values(rollPerGroup));
    const evaluatedRolls = await Roll.fromTerms([pool]).roll()
    const rollValues = evaluatedRolls.dice.map(d => d.total);
    const rollGroups = Object.keys(rollPerGroup)

    return rollGroups.reduce((prev, curr, i) => ({
      ...prev,
      [curr]: {
        initiative: rollValues[i],
        roll: evaluatedRolls.dice[i]
      }
    }), {});
  }

  async #rollInitiativeUIFeedback(initGroups = []) {
    const content = [
      Object.keys(initGroups).map(
        (k) => this.#constructInitiativeOutputForGroup(k, initGroups[k].roll)
      ).join("\n")
    ];
    const chatData = content.map(c => {
      return {
        speaker: {alias: game.i18n.localize("HYP3E.combat.initiative")},
        sound: CONFIG.sounds.dice,
        content: c
      };
    });
    ChatMessage.implementation.createDocuments(chatData);
  }

  #constructInitiativeOutputForGroup(initGroup, roll) {
    return `
      <p>${game.i18n.format("HYP3E.combat.rollInitiative", { initGroup })}</p>
      <div class="dice-roll" data-action="expandRoll">
        <div class="dice-result">
        <div class="dice-formula">${roll.formula}</div>
          <div class="dice-tooltip">
            <div class="wrapper">
              <section class="tooltip-part">
                <div class="dice">
                  <header class="part-header flexrow">
                    <span class="part-formula">${roll.formula}</span>
                    <span class="part-total">${roll.total}</span>
                  </header>
                  <ol class="dice-rolls">
                  ${roll.results.map(r => `
                    <li class="roll">${r.result}</li>
                  `).join("\n")}
                  </ol>
                </div>
              </section>
            </div>
          </div>
        <div class="dice-total">${roll.total}</div>
        </div>
      </div>
    `;
  }

  /**
   * Set/update the initiative score for a named group. Updates all combatants in the group.
   * @param {*} initGroup - Named group to receive new initiative
   * @param {*} newInitScore - New initiative number to set
   * @returns 
   */
  async setGroupInitiativeScore(initGroup, newInitScore) {
    if (isNaN(newInitScore)) {
      Hyp3eLogger.warn("HYP3EGroupCombat setGroupInitiativeScore", `Invalid initiative score provided:`, newInitScore);
      throw new Error(game.i18n.format("HYP3E.errors.invalidNumber", { value: newInitScore }));
    }
    const initScore = Number(newInitScore);
    Hyp3eLogger.info("HYP3EGroupCombat setGroupInitiativeScore", `Setting initiative score for group ${initGroup} to ${initScore}...`);

    // Create a mutable array of combatants in the group to update
    const combatantsToUpdate = this.combatants.filter(c => c.initGroup === initGroup);
    for (const c of combatantsToUpdate) {
      // c.initRoll = initScore;
      // Movement partially overrides the other combat actions for initiative order
      const actionMods = c.getActionModifiers();
      // c.meleeInit = actionMods.meleeInit;
      // c.missileInit = actionMods.missileInit;
      // c.magicInit = actionMods.magicInit;
      // c.moveInit = actionMods.moveInit;
      // c.otherInit = actionMods.otherInit;
      // c.delayedInit = actionMods.delayedInit;

      const rollTerms = `${initScore} + ${actionMods.meleeInit} + ${actionMods.missileInit} + ${actionMods.magicInit} + ${actionMods.moveInit} + ${actionMods.otherInit} + ${actionMods.delayedInit}`
      Hyp3eLogger.info("HYP3EGroupCombat setGroupInitiativeScore", `${c.name} initiative roll terms (roll + melee + missile + magic + move + other + delayed): ${rollTerms}`);

      // Add the actor's temporary initiative modifier, if one exists
      const tempInitMod = c.getTempInitMod();
      // c.tempInitMod = tempInitMod;

      // Get initiative penalties based on status effects like blind or deaf
      const slowingMods = c.getSlowingModifiers();
      // c.statusInit = slowingMods.slowingMod;
      c.isSlowed = slowingMods.isSlowed;

      // If defeated, add this initiative penalty to force actor to the end of the round
      const defeatedMod = c.getDefeatedModifier();
      // c.defeatedInit = defeatedMod;

      // const initiative = Math.round((initScore 
      c.initiative = Math.round((initScore 
                                + (c.actor?.system?.attributes?.dex?.value/1000)
                                  + tempInitMod
                                  + actionMods.meleeInit
                                  + actionMods.missileInit
                                  + actionMods.magicInit
                                  + actionMods.moveInit
                                  + actionMods.otherInit
                                  + actionMods.delayedInit
                                  + slowingMods.slowingMod
                                  + defeatedMod)
                                * 1000) / 1000;
      Hyp3eLogger.info("HYP3EGroupCombat setGroupInitiativeScore", `Updating combatant ${c.name} (${c.id}) to initiative ${c.initiative}...`, c);
    }

    // Update the combatant documents in the group with the new initiative values
    const updates = combatantsToUpdate.map(
      (c) => ({ _id: c.id, 
        initRoll: initScore,
        "flags.hyp3e.initRoll": initScore,
        initiative: c.initiative,
        // meleeInit: c.meleeInit,
        // missileInit: c.missileInit,
        // magicInit: c.magicInit,
        // moveInit: c.moveInit,
        // otherInit: c.otherInit,
        // delayedInit: c.delayedInit,
        // tempInitMod: c.tempInitMod,
        // statusInit: c.statusInit,
        isSlowed: c.isSlowed,
        // defeatedInit: c.defeatedInit,
      })
    )
    return await this.updateEmbeddedDocuments("Combatant", updates);
  }

  // ===========================================================================
  // GROUP GETTERS
  //
  // Get groups as:
  // - a list of strings
  // - a list of strings with combatants attached
  // - a map of groups to their initiative results
  // ===========================================================================

  get availableGroups() {
    return [...new Set(
      this.combatants.map(c => c.initGroup)
    )]
  }

  get combatantsByGroup() {
    return this.availableGroups.reduce((prev, curr) => ({
      ...prev,
      [curr]: this.combatants.filter(c => c.initGroup === curr)
    }), {});
  }

  get groupInitiativeScores() {
    const initiativeMap = new Map()

    for (const [initGroup, combatants] of Object.entries(this.combatantsByGroup)) {
      for (const c of combatants) {
        const initRoll = c.getFlag("hyp3e", "initRoll") ?? null;
        if (initRoll === null) continue;

        const current = initiativeMap.get(initGroup) ?? null;
        if (initRoll > current) {
          initiativeMap.set(initGroup, initRoll);
        }
      }
    }
    if (initiativeMap.size > 0) {
      Hyp3eLogger.info("HYP3EGroupCombat get groupInitiativeScores", `Group initiative scores:`, initiativeMap);
    }
    return initiativeMap;
  }
}