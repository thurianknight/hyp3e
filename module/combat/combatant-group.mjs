import { Hyp3eLogger } from "../helpers/logger.mjs";
import { HYP3ECombatant } from "./combatant.mjs";

export class HYP3EGroupCombatant extends HYP3ECombatant {
    get initGroup() {
        return this.groupRaw;
    }

    get groupRaw() {
        const assignedGroup = this.getFlag(game.system.id, "initGroup");
        if (assignedGroup) {
            // if (CONFIG.HYP3E.debugMessages) { console.log(`get groupRaw: Combatant ${this.name} assigned initGroup: `, this, assignedGroup) }
            return assignedGroup;
        }

        // if (CONFIG.HYP3E.debugMessages) { console.log("get groupRaw: Canvas tokens: ", canvas.tokens) }
        if (canvas.tokens) {
            const token = canvas.tokens.get(this.token?.id);
            // if (CONFIG.HYP3E.debugMessages) { console.log(`get groupRaw: Combatant ${this.name} disposition: `, token.document.disposition) }
            const disposition = token?.document.disposition;
            switch (disposition) {
                case -1:
                    // Token disposition is Hostile
                    return "red";
                case 0:
                    // Token disposition is Neutral
                    return "blue";
                case 1:
                    // Token disposition is Friendly
                    return "green";
            }
        }

        return 'white';
    }

    set initGroup(value) {
        this.setFlag(game.system.id, 'group', value || 'black');
        // this.setFlag(game.system.id, 'initGroup', value);
        if (CONFIG.HYP3E.debugMessages) { console.log(`set initGroup: this HYP3EGroupCombatant: `, this) }
        if (CONFIG.HYP3E.debugMessages) { console.log(`set initGroup: Setting initGroup for combatant ${this.name}: `, this, value) }
    }
}
