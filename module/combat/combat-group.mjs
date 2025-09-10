import HYP3E from "../helpers/config.mjs";
import { Hyp3eLogger } from "../helpers/logger.mjs";
import { HYP3ECombat } from "./combat.mjs";

export const colorGroups = HYP3E.colors;
export const actionGroups = {
    "melee": "HYP3E.actions.melee",
    "missile": "HYP3E.actions.missile",
    "magic": "HYP3E.actions.magic",
    "movement": "HYP3E.actions.movement"
}

/**
 * An extension of Foundry's Combat class that implements side-based initiative.
 *
 * @todo Display the initiative results roll as a chat card
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

    async rollInitiative(combatantIds = null) {
        // const groupsToRollFor = this.availableGroups;
        // If one or more combatant IDs was provided, get any applicable groups, otherwise get all
        let groupsToRollFor
        let combatantsAffected = []
        if (combatantIds !== null && combatantIds.length > 0) {
            if (CONFIG.HYP3E.debugMessages) { console.log("rollInitiative: Combatant IDs: ", combatantIds) }
            groupsToRollFor = this.getCombatantGroupsFromList(combatantIds);
            // combatantsAffected = this.combatants.filter(c => groupsToRollFor.some(group => group === c.group))
        } else {
            groupsToRollFor = this.availableGroups;
            // combatantsAffected = this.combatants;
        }
        combatantsAffected = this.combatants.filter(c => groupsToRollFor.some(group => group === c.initGroup))
        // if (CONFIG.HYP3E.debugMessages) { console.log("rollInitiative: All groups: ", this.availableGroups) }
        // if (CONFIG.HYP3E.debugMessages) { console.log("rollInitiative: Groups to roll for: ", groupsToRollFor) }
        // if (CONFIG.HYP3E.debugMessages) { console.log("rollInitiative: Affected Combatants:", combatantsAffected) }

        // Take the groups array and append a roll object to each group
        const rollPerGroup = groupsToRollFor.reduce((prev, curr) => ({
            ...prev,
            [curr]: new Roll(HYP3ECombat.FORMULA) 
        }), {});
        if (CONFIG.HYP3E.debugMessages) { console.log("rollInitiative: Initiative roll per group: ", rollPerGroup) }

        const results = await this.#prepareGroupInitiativeDice(rollPerGroup);
        // if (CONFIG.HYP3E.debugMessages) { console.log("rollInitiative: Group initiative results:", results) }
        
        // Add the combat action value to each combatant for initiative calculation
        // this.combatants.forEach(c => {
        combatantsAffected.forEach(c => {
            // if (CONFIG.HYP3E.debugMessages) { console.log("rollInitiative: Combatant: ", c) }
            // if (CONFIG.HYP3E.debugMessages) { console.log("rollInitiative: Combat Actor: ", c.actor) }
            c.initRoll = results[c.initGroup].initiative
            // Movement partially overrides the other combat actions for initiative order
            c.getActionModifiers();

            // Add the actor's temporary initiative modifier, if one exists
            c.getTempInitMod();

            // Get initiative penalties based on status effects like blind or deaf
            c.getSlowingModifiers();

            // If defeated, add this initiative penalty to force actor to the end of the round
            c.getDefeatedModifier();
        })

        // Update the combatants with their new initiative values
        // const updates = this.combatants.map(
        const updates = combatantsAffected.map(
            (c) => ({ _id: c.id, 
                initRoll: results[c.initGroup].initiative,
                initiative: Math.round((results[c.initGroup].initiative 
                                        + (c.actor?.system?.attributes?.dex?.value/1000)
                                        + c.tempInitMod
                                        + c.meleeInit
                                        + c.missileInit
                                        + c.magicInit
                                        + c.moveInit
                                        + c.statusInit
                                        + c.defeatedInit) * 1000) / 1000
                })
        )
        // if (CONFIG.HYP3E.debugMessages) { console.log("rollInitiative: Group initiative updates: ", updates) }
        await this.updateEmbeddedDocuments("Combatant", updates);

        // if (CONFIG.HYP3E.debugMessages) { console.log("rollInitiative: Group roll results: ", results) }
        await this.#rollInitiativeUIFeedback(results);
        await this.activateCombatant(0);

        // if (CONFIG.HYP3E.debugMessages) { console.log("rollInitiative: This Group Combat: ", this) }

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
        if (CONFIG.HYP3E.debugMessages) { console.log("prepareGroupInitiativeDice: Group object(s): ", rollPerGroup) }
        const pool = foundry.dice.terms.PoolTerm.fromRolls(Object.values(rollPerGroup));
        const evaluatedRolls = await Roll.fromTerms([pool]).roll()
        const rollValues = evaluatedRolls.dice.map(d => d.total);
        // if (CONFIG.HYP3E.debugMessages) { console.log(`prepareGroupInitiativeDice: roll values: `, rollValues) }

        // if (CONFIG.HYP3E.debugMessages) { console.log(`prepareGroupInitiativeDice: available groups: `, this.availableGroups) }
        // return this.availableGroups.reduce((prev, curr, i) => ({
        // Instead of availableGroups (above), we want just the array of groups to roll...
        const rollGroups = Object.keys(rollPerGroup)
        // if (CONFIG.HYP3E.debugMessages) { console.log(`prepareGroupInitiativeDice: roll groups: `, rollGroups) }
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
            <p class="medium">${game.i18n.format("HYP3E.combat.rollInitiative", { initGroup })}</p>
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
        // Refresh combatant initRoll based on current initiative score
        this.combatants.forEach(c => {
            // if (CONFIG.HYP3E.debugMessages) { console.log(`groupInitiativeScores: Updating combatant ${c.name} initRoll...`) }
            c.setInitRoll()
        })
        const initiativeMap = new Map()
        for (const initGroup in this.combatantsByGroup) {
            // initiativeMap.set(group, this.combatantsByGroup[group][0].initiative)
            // if (CONFIG.HYP3E.debugMessages) { console.log(`groupInitiativeScores: Combatants in group : ${group}`, this.combatantsByGroup[group]) }
            this.combatantsByGroup[initGroup].forEach(c => {
                // Use the highest combatant initiative roll as the group's initiative score
                // if (CONFIG.HYP3E.debugMessages) { console.log(`groupInitiativeScores: Combatant ${c.name} initiative: ${c.initRoll}`) }
                if (c.initRoll > (initiativeMap.get(initGroup) || 0)) {
                    // if (CONFIG.HYP3E.debugMessages) { console.log(`groupInitiativeScores: Updating group ${group} initiative to ${c.initRoll}`) }
                    initiativeMap.set(initGroup, c.initRoll)
                }
            });
        }
        // if (CONFIG.HYP3E.debugMessages) { console.log("groupInitiativeScores: Initiative Map: ", initiativeMap) }
        return initiativeMap;
    }

}