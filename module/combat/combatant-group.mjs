import { Hyp3eLogger } from "../helpers/logger.mjs";
import { HYP3ECombatant } from "./combatant.mjs";

export class HYP3EGroupCombatant extends HYP3ECombatant {
    get initGroup() {
        return this.groupRaw;
    }

    get groupRaw() {
        const assignedGroup = this.getFlag(game.system.id, "initGroup");
        if (assignedGroup) {
            return assignedGroup;
        }

        if (canvas.tokens) {
            const token = canvas.tokens.get(this.token?.id);
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
        Hyp3eLogger.info("initGroup", `Setting initGroup to ${value} for combatant ${this.name}:`, this);
    }
}
