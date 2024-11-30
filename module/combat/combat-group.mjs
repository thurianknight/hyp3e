import HYP3E from "../helpers/config.mjs";
import { HYP3ECombat } from "./combat.mjs";
import { HYP3ECombatant } from "./combatant.mjs";
import { HYP3EGroupCombatant } from "./combatant-group.mjs";

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
    static FORMULA = "1d6";

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

    async rollInitiative() {
        const groupsToRollFor = this.availableGroups;
        const rollPerGroup = groupsToRollFor.reduce((prev, curr) => ({
            ...prev,
            [curr]: new Roll(HYP3EGroupCombat.FORMULA) 
        }), {});
        if (CONFIG.HYP3E.debugMessages) { console.log("Roll Per Group: ", rollPerGroup) }

        const results = await this.#prepareGroupInitiativeDice(rollPerGroup);
        if (CONFIG.HYP3E.debugMessages) { console.log("Group Initiative roll:", results) }
        
        // Add the combat action value to each combatant for initiative calculation
        this.combatants.forEach(c => {
            c.initRoll = results[c.group].initiative
            // Movement overrides the other combat actions for initiative order
            c.moveInit = c.getFlag(game.system.id, "isMovement") ? HYP3ECombatant.INITIATIVE_VALUE_MOVEMENT : 0;
            if (c.moveInit == 0) {
                c.meleeInit = c.getFlag(game.system.id, "isMelee") ? HYP3ECombatant.INITIATIVE_VALUE_MELEE : 0;
                c.missileInit = c.getFlag(game.system.id, "isMissile") ? HYP3ECombatant.INITIATIVE_VALUE_MISSILE : 0;
                c.magicInit = c.getFlag(game.system.id, "isMagic") ? HYP3ECombatant.INITIATIVE_VALUE_MAGIC : 0;
            } else {
                c.meleeInit = 0
                c.missileInit = 0
                c.magicInit = 0
            }
        })

        const updates = this.combatants.map(
            (c) => ({ _id: c.id, initiative: results[c.group].initiative 
                                            + c.actor?.system?.attributes?.dex?.value 
                                            + c.moveInit
                                            + c.meleeInit
                                            + c.missileInit
                                            + c.magicInit
                    })
        )
        if (CONFIG.HYP3E.debugMessages) { console.log("Combatant updates: ", updates) }
        if (CONFIG.HYP3E.debugMessages) { console.log("All Combatants: ", this.combatants) }

        await this.updateEmbeddedDocuments("Combatant", updates);
        await this.#rollInitiativeUIFeedback(results);
        await this.activateCombatant(0);
        if (CONFIG.HYP3E.debugMessages) { console.log("THIS Combat: ", this) }
        if (CONFIG.HYP3E.debugMessages) { console.log("THIS Combat Turns: ", this.turns) }
        return this;
    }

    async #prepareGroupInitiativeDice(rollPerGroup) {
        const pool = foundry.dice.terms.PoolTerm.fromRolls(Object.values(rollPerGroup));
        const evaluatedRolls = await Roll.fromTerms([pool]).roll()
        const rollValues = evaluatedRolls.dice.map(d => d.total);
        // if (CONFIG.HYP3E.debugMessages) { console.log(`Initiative rolls: `, rollValues) }
        return this.availableGroups.reduce((prev, curr, i) => ({
            ...prev,
            [curr]: {
                initiative: rollValues[i],
                roll: evaluatedRolls.dice[i]
            }
        }), {});
    }

    async #rollInitiativeUIFeedback(groups = []) {
        const content = [
            Object.keys(groups).map(
                (k) => this.#constructInitiativeOutputForGroup(k, groups[k].roll)
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

    #constructInitiativeOutputForGroup(group, roll) {
        return `    
            <p>${game.i18n.format("HYP3E.combat.rollInitiative", { group })}
            <div class="dice-roll">   
                <div class="dice-result">
                <div class="dice-formula">${roll.formula}</div>
                    <div class="dice-tooltip">
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
                <h4 class="dice-total">${roll.total}</h4>
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
            this.combatants.map(c => c.group)
        )]
    }

    get combatantsByGroup() {
        return this.availableGroups.reduce((prev, curr) => ({
            ...prev,
            [curr]: this.combatants.filter(c => c.group === curr)
        }), {});
    }

    get groupInitiativeScores() {
        const initiativeMap = new Map()
        for (const group in this.combatantsByGroup) {
            // initiativeMap.set(group, this.combatantsByGroup[group][0].initiative)
            initiativeMap.set(group, this.combatantsByGroup[group][0].initRoll)
        }
        if (CONFIG.HYP3E.debugMessages) { console.log("Get Initiative Map: ", initiativeMap) }
        return initiativeMap;
    }

    async resetAll() {
        // Reset group initiatives
        const initiativeMap = game.combat.groupInitiativeScores
        if (CONFIG.HYP3E.debugMessages) { console.log("Reset Initiative Map: ", initiativeMap) }
        for (const group in this.combatantsByGroup) {
            initiativeMap.set(group, null)
        }
        // Now do the main reset
        await super.resetAll()
    }

}