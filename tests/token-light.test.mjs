import test from "node:test";
import assert from "node:assert/strict";

globalThis.Actor = class {};
globalThis.Item = class {};
globalThis.ActiveEffect = class { constructor(data) { Object.assign(this, data); } };
globalThis.foundry = {
  applications: { api: { ApplicationV2: class {}, HandlebarsApplicationMixin: cls => cls } },
  utils: { deepClone: structuredClone }
};
globalThis.game = { settings: { get: () => 99 }, i18n: { localize: key => key }, user: { id: "owner" }, users: {} };
globalThis.CONFIG = { HYP3E: {} };
globalThis.ui = { notifications: { info() {}, warn() {} } };
const hooks = new Map();
globalThis.Hooks = { on: (name, fn) => hooks.set(name, fn) };
const { Hyp3eActor } = await import("../module/documents/actor.mjs");
const { setupEffectHandlers } = await import("../module/helpers/effects.mjs");
await setupEffectHandlers();

function fixture() {
  const props = { dim: 20, bright: 10 };
  const item = { id: "torch", uuid: "Actor.hero.Item.torch", name: "Torch", system: { light: props } };
  const actor = Object.assign(new Hyp3eActor(), {
    id: "hero", uuid: "Actor.hero", isOwner: true, getRollData: () => ({}), items: new Map([[item.id, item]]), effects: []
  });
  function token(id, owner) {
    const flags = new Map();
    const doc = {
      id, uuid: "Scene.scene.Token." + id, documentName: "Token", actor: owner, actorId: owner.id,
      light: { dim: 0, bright: 0, angle: 145 }, getFlag: (_, key) => flags.get(key),
      async update(changes) {
        if ("light" in changes) this.light = structuredClone(changes.light);
        for (const key of Object.keys(changes["flags.hyp3e"] ?? {})) flags.delete(key.replace(/^-=/, ""));
        for (const [path, value] of Object.entries(changes)) {
          if (path.startsWith("flags.hyp3e.")) flags.set(path.split(".").at(-1), value);
        }
      },
      async setFlag(_, key, value) { flags.set(key, structuredClone(value)); },
      async unsetFlag(_, key) { flags.delete(key); }
    };
    return { actor: owner, document: doc };
  }
  const synthetic = Object.assign(Object.create(actor), { uuid: "Scene.scene.Token.C.Actor.hero", effects: [] });
  const a = token("A", actor), b = token("B", actor), c = token("C", synthetic);
  synthetic.token = c.document;
  globalThis.canvas = { tokens: { controlled: [b], placeables: [a, b, c] } };
  const docs = [a.document, b.document, c.document];
  globalThis.fromUuid = async uuid => docs.find(t => t.uuid === uuid) ?? null;
  actor.getActiveTokens = () => [a.document, b.document];
  actor.getDependentTokens = ({ linked }) => linked ? docs.filter(t => t.actor === actor) : docs;
  actor.createEmbeddedDocuments = async function (_, [data]) {
    const effect = Object.assign(data, {
      id: "e" + this.effects.length, parent: this, changes: [], getFlag: (_, key) => data.flags.hyp3e[key],
      async delete() {
        this.parent.effects.splice(this.parent.effects.indexOf(this), 1);
        await hooks.get("deleteActiveEffect")(this, {}, "owner");
      }
    });
    this.effects.push(effect);
    await hooks.get("createActiveEffect")(effect, {}, "owner");
    return [effect];
  };
  return { actor, synthetic, a, b, c, docs, brightness: () => docs.map(doc => doc.light?.bright ?? 0) };
}

test("two linked tokens can carry and put out separate lights", async () => {
  const f = fixture();
  await f.actor.toggleLightSource("torch");
  assert.deepEqual(f.brightness(), [0, 10, 0]);
  canvas.tokens.controlled = [f.a];
  await f.actor.toggleLightSource("torch");
  assert.deepEqual(f.brightness(), [10, 10, 0]);
  await f.actor.toggleLightSource("torch");
  assert.deepEqual(f.brightness(), [0, 10, 0]);
  assert.equal(f.a.document.light.angle, 145);
});

test("an unlinked actor's own token takes precedence over another selected token", async () => {
  const f = fixture();
  await f.synthetic.toggleLightSource("torch");
  assert.deepEqual(f.brightness(), [0, 0, 10]);
});

test("disabling, enabling and deleting a light use its original token after a scene change", async () => {
  const f = fixture();
  await f.actor.toggleLightSource("torch");
  const [effect] = f.actor.effects;
  canvas.tokens = { controlled: [], placeables: [] };
  await hooks.get("updateActiveEffect")(effect, { disabled: true }, {}, "owner");
  assert.deepEqual(f.brightness(), [0, 0, 0]);
  await hooks.get("updateActiveEffect")(effect, { disabled: false }, {}, "owner");
  assert.deepEqual(f.brightness(), [0, 10, 0]);
  await effect.delete();
  assert.deepEqual(f.brightness(), [0, 0, 0]);
});

test("ambiguous actor-sheet requests leave every token alone", async () => {
  const f = fixture();
  canvas.tokens.controlled = [];
  await f.actor.toggleLightSource("torch");
  assert.equal(f.actor.effects.length, 0);
  assert.deepEqual(f.brightness(), [0, 0, 0]);
});

test("a deleted token cannot redirect a light to a sibling token", async () => {
  const f = fixture();
  await f.actor.toggleLightSource("torch");
  f.docs.splice(1, 1);
  canvas.tokens.placeables = [f.a, f.c];
  await hooks.get("updateActiveEffect")(f.actor.effects[0], { disabled: false }, {}, "owner");
  assert.deepEqual(f.brightness(), [0, 0]);
});

test("a sidebar actor with one linked token can use its light without a selection", async () => {
  const f = fixture();
  canvas.tokens.controlled = [];
  f.actor.getActiveTokens = () => [f.b.document];
  await f.actor.toggleLightSource("torch");
  assert.deepEqual(f.brightness(), [0, 10, 0]);
});

test("only the active GM writes token lighting when a player uses a light", async () => {
  const f = fixture();
  game.users.activeGM = { id: "gm" };
  try {
    await f.actor.toggleLightSource("torch");
    assert.deepEqual(f.brightness(), [0, 0, 0]);
    game.user.id = "gm";
    await hooks.get("createActiveEffect")(f.actor.effects[0], {}, "owner");
    assert.deepEqual(f.brightness(), [0, 10, 0]);
  } finally {
    game.user.id = "owner";
    delete game.users.activeGM;
  }
});

test("legacy light cleanup restores affected tokens and preserves a newer light", async () => {
  const f = fixture();
  const [old] = await f.actor.createEmbeddedDocuments("ActiveEffect", [{
    name: "Old torch", flags: { hyp3e: { lightProps: { dim: 20, bright: 10 } } }
  }]);
  assert.deepEqual(f.brightness(), [0, 0, 0]);
  for (const token of [f.a.document, f.c.document]) {
    await token.setFlag("hyp3e", "originalLight", token.light);
    await token.update({ light: { dim: 20, bright: 10 } });
  }
  await f.actor.toggleLightSource("torch");
  await old.delete();
  assert.deepEqual(f.brightness(), [0, 10, 0]);
  assert.equal(f.c.document.light.angle, 145);
  assert.ok(f.b.document.getFlag("hyp3e", "originalLight"));
});
