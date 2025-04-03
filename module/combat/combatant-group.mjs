import { HYP3ECombatant } from "./combatant.mjs";

export class HYP3EGroupCombatant extends HYP3ECombatant {
    get initGroup() {
        return this.groupRaw;
    }

    get groupRaw() {
        const assignedGroup = this.getFlag(game.system.id, "initGroup");
        // if (CONFIG.HYP3E.debugMessages) { console.log("Combatant assigned group: ", this, assignedGroup) }
        if (assignedGroup)
            return assignedGroup;

        // if (CONFIG.HYP3E.debugMessages) { console.log("Canvas tokens: ", canvas.tokens) }
        if (canvas.tokens) {
            const token = canvas.tokens.get(this.token.id);
            // if (CONFIG.HYP3E.debugMessages) { console.log("Combatant token: ", token) }
            const disposition = token.document.disposition;
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
        // if (CONFIG.HYP3E.debugMessages) { console.log("Setting group for combatant", this, value) }
        this.setFlag(game.system.id, 'initGroup', value || 'black');
    }
}
