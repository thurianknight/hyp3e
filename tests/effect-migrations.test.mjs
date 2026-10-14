import assert from "node:assert/strict";
import test from "node:test";
import { getEffectMigrationUpdate, migrateItemEffects, migrateActorEffects,
  migrateWorldEffects, runMigrations } from "../module/helpers/effect-migrations.mjs";

function effect(duration, { temporary = true, flags = {} } = {}) {
  const stored = { duration: structuredClone(duration), flags: structuredClone(flags) };
  return {
    uuid: "Item.fixture.ActiveEffect.fixture", name: "Fixture", isTemporary: temporary,
    duration: structuredClone(duration), flags: stored.flags, writes: [],
    toObject() { return structuredClone(stored); },
    async update(changes) {
      this.writes.push(structuredClone(changes));
      for (const [key, value] of Object.entries(changes)) {
        const parts = key.split(".");
        let target = stored;
        for (const part of parts.slice(0, -1)) target = target[part] ??= {};
        target[parts.at(-1)] = value;
      }
      this.duration = structuredClone(stored.duration);
    },
    async setFlag(scope, key, value) { await this.update({ [`flags.${scope}.${key}`]: value }); },
  };
}
const item = (...effects) => ({ name: "Fixture item", effects: new Set(effects) });

test("migration does not copy a temporary duration onto a permanent effect", async () => {
  for (const permanentFirst of [false, true]) {
    const temporary = effect({ rounds: 5, remaining: 5 });
    const permanent = effect({}, { temporary: false });
    const effects = permanentFirst ? [permanent, temporary] : [temporary, permanent];
    await migrateItemEffects(item(...effects), 14);
    assert.equal(permanent.writes.length, 0);
  }
});

test("modern duration, expiry and remaining-round flags are preserved", async () => {
  for (const units of ["seconds", "minutes", "hours", "rounds", "turns"]) {
    const modern = effect({ value: 2, units, expiry: "turnStart", remaining: 1 }, {
      flags: { hyp3e: { remainingRounds: 0 } },
    });
    await migrateItemEffects(item(modern), 14);
    assert.deepEqual(modern.writes, [], units);
  }
});

test("failed effect writes reject migration instead of reporting success", async () => {
  const broken = effect({ rounds: 5 });
  broken.update = async () => { throw new Error("write rejected"); };
  await assert.rejects(migrateItemEffects(item(broken), 14), /write rejected/);
});

test("legacy durations follow core precedence and preserve zero and explicit expiry", () => {
  assert.deepEqual(getEffectMigrationUpdate({ duration: { rounds: 7, turns: 2, seconds: 30 } }, 14), {
    "duration.value": 30, "duration.units": "seconds", "duration.expiry": "turnStart",
  });
  assert.deepEqual(getEffectMigrationUpdate({ duration: { seconds: null, rounds: 7, turns: 0, expiry: "turnEnd" } }, 14), {
    "duration.value": 0, "duration.units": "turns",
  });
  assert.deepEqual(getEffectMigrationUpdate({ duration: { rounds: 0 } }, 14), {
    "duration.value": 0, "duration.units": "rounds", "duration.expiry": "turnStart",
  });
});

test("v13, permanent, malformed and partially modern sources are not reinterpreted", () => {
  for (const duration of [{}, { rounds: null }, { rounds: -1 }, { rounds: NaN }, { rounds: "5" },
    { value: null, rounds: 5 }, { units: "minutes", rounds: 5 }]) {
    assert.deepEqual(getEffectMigrationUpdate({ duration }, 14), {});
  }
  assert.deepEqual(getEffectMigrationUpdate({ duration: { rounds: 5 } }, 13), {});
  assert.deepEqual(getEffectMigrationUpdate({}, 14), {});
});

test("compatibility getters are not accessed and source objects are not mutated", () => {
  const duration = Object.freeze({ value: 2, units: "minutes", expiry: "turnEnd",
    get rounds() { throw new Error("deprecated getter accessed"); } });
  assert.deepEqual(getEffectMigrationUpdate(Object.freeze({ duration }), 14), {});
  const legacy = Object.freeze({ duration: Object.freeze({ rounds: 5 }) });
  getEffectMigrationUpdate(legacy, 14);
  assert.deepEqual(legacy, { duration: { rounds: 5 } });
});

test("each effect has independent updates and a second pass performs no writes", async () => {
  const first = effect({ rounds: 5 }, { flags: { hyp3e: { remainingRounds: 2 } } });
  const update = first.update;
  first.update = async function(changes, options) {
    assert.deepEqual(options, { render: false, noHook: true });
    await update.call(this, changes);
  };
  const second = effect({ seconds: 60 });
  const parent = item(first, second);
  assert.deepEqual(await migrateItemEffects(parent, 14), { inspected: 2, updated: 2 });
  assert.equal(first.toObject().duration.value, 5);
  assert.equal(second.toObject().duration.value, 60);
  assert.equal(first.toObject().flags.hyp3e.remainingRounds, 2);
  assert.ok(first.writes.every(write => !("duration.remaining" in write)));
  assert.deepEqual(await migrateItemEffects(parent, 14), { inspected: 2, updated: 0 });
});

test("Actor and Item effects use the same conversion and v13 performs no writes", async () => {
  const legacy = effect({ rounds: 5 });
  assert.deepEqual(await migrateActorEffects([item(legacy)], 13), { inspected: 0, updated: 0 });
  assert.equal(legacy.writes.length, 0);
  assert.deepEqual(await migrateActorEffects([item(legacy)], 14), { inspected: 1, updated: 1 });
});

function worldFixture(generation = 14) {
  const values = new Map([['migration-4.5.0-ran', false], ['effectMigrationVersion', 0],
    ['reRunMigration', false], ['migrateCompendia', false]]);
  const settings = {
    writes: [], get(namespace, key) { return values.get(key); },
    async set(namespace, key, value) { values.set(key, value); this.writes.push({ key, value }); },
  };
  return { release: { generation }, system: { id: "hyp3e", version: "4.5.0" }, settings,
    user: { id: "gm", isGM: true }, users: { activeGM: { id: "gm" } },
    actors: { contents: [] }, items: { contents: [] }, scenes: [], packs: [] };
}
const setting = (world, key) => world.settings.get("hyp3e", key);
const set = (world, key, value) => world.settings.set("hyp3e", key, value);

test("world pass includes embedded items and unlinked Actors outside the active Scene", async () => {
  const world = worldFixture();
  const effects = Array.from({ length: 5 }, () => effect({ rounds: 5 }));
  const base = { ...item(effects[0]), uuid: "Actor.base", items: [item(effects[1])] };
  const synthetic = { ...item(effects[2]), uuid: "Scene.offscreen.Token.token.Actor.base", items: [item(effects[3])] };
  world.actors.contents = [base];
  world.items.contents = [item(effects[4])];
  world.scenes = [{ tokens: [{ actorLink: true, actor: base }, { actorLink: false, actor: synthetic }] }];
  assert.deepEqual(await migrateWorldEffects(world), { inspected: 5, updated: 5 });
  assert.deepEqual(effects.map(e => e.writes.length), [1, 1, 1, 1, 1]);
});

test("only the active GM starts migrations", async () => {
  for (const user of [{ id: "player", isGM: false }, { id: "second-gm", isGM: true }]) {
    const world = worldFixture(); world.user = user;
    assert.deepEqual(await runMigrations(world, () => assert.fail("must not run")), { status: "skipped" });
    assert.deepEqual(world.settings.writes, []);
  }
});

test("completion waits for writes and retries a failed effect without resetting successful effects", async () => {
  const world = worldFixture();
  let releaseWrite;
  const gate = new Promise(resolve => { releaseWrite = resolve; });
  const pending = effect({ rounds: 5 });
  const originalUpdate = pending.update;
  pending.update = async function(changes) { await gate; await originalUpdate.call(this, changes); };
  world.items.contents = [item(pending)];
  const migration = runMigrations(world, async () => {});
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(setting(world, "migration-4.5.0-ran"), false);
  assert.equal(setting(world, "effectMigrationVersion"), 0);
  releaseWrite();
  assert.equal((await migration).status, "complete");
  assert.equal(setting(world, "migration-4.5.0-ran"), true);
  assert.equal(setting(world, "effectMigrationVersion"), 1);

  const broken = effect({ rounds: 9 });
  const update = broken.update;
  broken.update = async () => { throw new Error("write rejected"); };
  world.items.contents.push(item(broken));
  await set(world, "reRunMigration", true);
  await assert.rejects(runMigrations(world, async () => {}), /write rejected/);
  assert.equal(setting(world, "migration-4.5.0-ran"), false);
  assert.equal(setting(world, "effectMigrationVersion"), 0);
  assert.equal(setting(world, "reRunMigration"), true);
  broken.update = update;
  await runMigrations(world, async () => {});
  assert.equal(pending.writes.length, 1);
  assert.equal(broken.writes.length, 1);
});

test("v13 completion does not skip the effect pass after a v14 upgrade", async () => {
  const world = worldFixture(13);
  let dataPasses = 0;
  const migrate = async () => { dataPasses++; };
  await runMigrations(world, migrate);
  assert.equal(setting(world, "effectMigrationVersion"), 0);
  world.release.generation = 14;
  const legacy = effect({ rounds: 5 }); world.items.contents = [item(legacy)];
  await runMigrations(world, migrate);
  assert.equal(dataPasses, 1, "effect checkpoint must not rerun unrelated data migrations");
  assert.equal(legacy.writes.length, 1);
  assert.equal((await runMigrations(world, migrate)).status, "skipped");
});

test("a failed base migration or an authority change cannot record completion", async () => {
  const world = worldFixture();
  await assert.rejects(runMigrations(world, async () => { throw new Error("base failure"); }), /base failure/);
  assert.equal(setting(world, "migration-4.5.0-ran"), false);
  assert.equal(setting(world, "effectMigrationVersion"), 0);
  await assert.rejects(runMigrations(world, async () => { world.users.activeGM.id = "other"; }), /authority changed/);
  assert.equal(setting(world, "migration-4.5.0-ran"), false);
});

test("opted-in Actor and Item packs migrate effects and restore locks on success or failure", async () => {
  for (const documentName of ["Actor", "Item"]) {
    for (const initiallyLocked of [true, false]) {
      const world = worldFixture();
      const legacy = effect({ rounds: 5 });
      const pack = { collection: "hyp3e-compendium.fixture", documentName, locked: initiallyLocked,
        async configure({ locked }) { this.locked = locked; },
        async getDocuments() { return [{ ...item(legacy), items: [item(effect({ turns: 2 }))] }]; } };
      world.packs = [pack];
      await migrateWorldEffects(world);
      assert.equal(legacy.writes.length, 0, "packs require explicit opt-in");
      await set(world, "migrateCompendia", true);
      await migrateWorldEffects(world);
      assert.equal(legacy.writes.length, 1);
      assert.equal(pack.locked, initiallyLocked);
      pack.getDocuments = async () => { throw new Error("pack unavailable"); };
      await assert.rejects(runMigrations(world, async () => {}), /pack unavailable/);
      assert.equal(pack.locked, initiallyLocked);
      assert.equal(setting(world, "migration-4.5.0-ran"), false);
    }
  }
});

test("partial compendium failure restores the lock and retries only unfinished conversions", async () => {
  const world = worldFixture();
  await set(world, "migrateCompendia", true);
  const migrated = effect({ rounds: 5 });
  const failed = effect({ turns: 2 });
  const update = failed.update;
  failed.update = async () => { throw new Error("pack effect rejected"); };
  const pack = { collection: "hyp3e-compendium.fixture", documentName: "Item", locked: true,
    async configure({ locked }) { this.locked = locked; },
    async getDocuments() { return [item(migrated), item(failed)]; } };
  world.packs = [pack];
  await assert.rejects(runMigrations(world, async () => {}), /pack effect rejected/);
  assert.equal(pack.locked, true);
  assert.equal(setting(world, "effectMigrationVersion"), 0);
  assert.equal(setting(world, "migration-4.5.0-ran"), false);
  failed.update = update;
  await runMigrations(world, async () => {});
  assert.equal(pack.locked, true);
  assert.equal(migrated.writes.length, 1);
  assert.equal(failed.writes.length, 1);
});

test("losing active-GM authority stops subsequent effect writes and completion", async () => {
  const world = worldFixture();
  const first = effect({ rounds: 5 });
  const second = effect({ rounds: 7 });
  const update = first.update;
  first.update = async function(changes) {
    await update.call(this, changes);
    world.users.activeGM = null;
  };
  world.items.contents = [item(first, second)];
  await assert.rejects(runMigrations(world, async () => {}), /authority changed/);
  assert.equal(first.writes.length, 1);
  assert.equal(second.writes.length, 0);
  assert.equal(setting(world, "effectMigrationVersion"), 0);
  assert.equal(setting(world, "migration-4.5.0-ran"), false);
});
