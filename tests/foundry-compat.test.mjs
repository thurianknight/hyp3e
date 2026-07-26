import assert from "node:assert/strict";
import test from "node:test";

import {
  getRollMessageOptions,
  getRollModeChoices
} from "../module/helpers/foundry-compat.mjs";

test("Foundry v13 uses CONFIG.Dice.rollModes and Roll#toMessage rollMode", () => {
  const rollModes = {
    publicroll: "CHAT.RollPublic",
    gmroll: "CHAT.RollPrivate"
  };
  const config = {
    ChatMessage: {},
    Dice: { rollModes }
  };

  assert.equal(getRollModeChoices(config), rollModes);
  assert.deepEqual(getRollMessageOptions("gmroll", 13), { rollMode: "gmroll" });
});

test("Foundry v14 converts CONFIG.ChatMessage.modes and uses messageMode", () => {
  const config = {
    ChatMessage: {
      modes: {
        public: { label: "CHAT.RollPublic", icon: "fa-users" },
        gm: { label: "CHAT.RollPrivate", icon: "fa-user-shield" }
      }
    },
    Dice: {}
  };

  assert.deepEqual(getRollModeChoices(config), {
    public: "CHAT.RollPublic",
    gm: "CHAT.RollPrivate"
  });
  assert.deepEqual(getRollMessageOptions("gm", 14), { messageMode: "gm" });
});
