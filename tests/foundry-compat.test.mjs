import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  getMergeObjectDeletionOptions,
  getRollMessageOptions,
  getRollModeChoices
} from "../module/helpers/foundry-compat.mjs";

const actorSheetUrl = new URL(
  "../module/sheets/actor-sheet-v2.mjs",
  import.meta.url
);

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

test("mergeObject deletion processing uses the option supported by each generation", () => {
  assert.deepEqual(
    getMergeObjectDeletionOptions(13),
    { performDeletions: true }
  );
  assert.deepEqual(
    getMergeObjectDeletionOptions(14),
    { applyOperators: true }
  );
});

test("actor item context menus use the entry API supported by each generation", async () => {
  const source = await readFile(actorSheetUrl, "utf8");
  const menuStart = source.indexOf("// Right-click context menu on item entries");
  const menuEnd = source.indexOf("// Log render completion", menuStart);
  const contextMenu = source.slice(menuStart, menuEnd);

  assert.match(contextMenu, /Number\(game\.version\.split\("\."\)\[0\]\) >= 14/);
  assert.match(contextMenu, /label: splitStackLabel, visible: canSplitStack, onClick: splitStack/);
  assert.match(contextMenu, /name: splitStackLabel, condition: canSplitStack, callback: splitStack/);
  assert.match(contextMenu, /\{ jQuery: false \}/);
  assert.doesNotMatch(contextMenu, /\$\(target\)/);
});
