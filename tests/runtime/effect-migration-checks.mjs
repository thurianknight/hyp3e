// Execute with page.evaluate in a disposable Foundry world, after game.ready.
export async function exerciseEffectMigrations({ generation }) {
  const migration = await import("/systems/hyp3e/module/helpers/effect-migrations.mjs");
  const checks = [];
  const check = (ok, name, details) => checks.push({ name, ok: Boolean(ok), details });
  const serialize = parent => parent.effects.map(effect => {
    const source = effect.toObject();
    return { id: source._id, duration: source.duration, start: source.start,
      flags: source.flags, disabled: source.disabled, origin: source.origin,
      changes: source.system?.changes ?? source.changes };
  }).sort((a, b) => a.id.localeCompare(b.id));
  const durations = generation >= 14
    ? [{ value: null, units: "seconds", expiry: null }, { value: 2, units: "minutes", expiry: "turnEnd" },
      { value: 0, units: "rounds", expiry: "turnStart" }, { value: 3, units: "turns", expiry: "turnEnd" },
      { seconds: 60 }, { rounds: 5 }]
    : [{ seconds: null, rounds: null, turns: null }, { seconds: 120 }, { rounds: 0 }, { turns: 3 },
      { seconds: 60 }, { rounds: 5 }];
  const effectSources = durations.map((duration, i) => ({ name: `Migration fixture ${i}`, disabled: true,
    duration, flags: { hyp3e: { remainingRounds: i === 0 ? null : i - 1, migrationFixture: i } },
    ...(generation >= 14 ? { type: "base", system: { changes: [] } } : { changes: [] }) }));
  const player = game.users.find(user => user.name === "Packaging Player");
  const actor = await CONFIG.Actor.documentClass.create({ name: "Migration Actor", type: "npc", effects: effectSources,
    ownership: { [player.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER } }, { noHook: true });
  const worldItem = await CONFIG.Item.documentClass.create({ name: "Migration Item", type: "feature", effects: effectSources }, { noHook: true });
  const [embedded] = await actor.createEmbeddedDocuments("Item", [{ name: "Migration Embedded Item", type: "feature",
    effects: effectSources }], { noHook: true });
  const scene = await CONFIG.Scene.documentClass.create({ name: "Migration offscreen Scene", active: false }, { noHook: true });
  const tokenData = await actor.getTokenDocument({ actorLink: false });
  const [token] = await scene.createEmbeddedDocuments("Token", [tokenData.toObject()], { noHook: true });
  await token.actor.effects.contents[0].update({ "flags.hyp3e.tokenFixture": true }, { noHook: true });
  const parents = [actor, worldItem, embedded, token.actor, ...token.actor.items];
  const snapshots = parents.map(parent => ({ uuid: parent.uuid, effects: serialize(parent) }));
  const migrated = await migration.migrateWorldEffects(game);
  check(generation < 14 || migrated.inspected >= 30, "migration scans real directory and offscreen token effects", migrated);
  for (const snapshot of snapshots) {
    check(JSON.stringify(serialize(await fromUuid(snapshot.uuid))) === JSON.stringify(snapshot.effects),
      "effect data and IDs unchanged after migration", { uuid: snapshot.uuid });
  }
  check((await migration.migrateWorldEffects(game)).updated === 0, "repeat effect pass performs no updates");
  check(!actor.effects.contents[0].getFlag("hyp3e", "tokenFixture"), "synthetic effect flag does not reach base Actor");

  // Exercise the real ready-path orchestration and persisted completion settings.
  const { migrateWorld } = await import("/systems/hyp3e/module/hyp3e.mjs");
  await game.settings.set("hyp3e", "reRunMigration", true);
  const completed = await migration.runMigrations(game, migrateWorld);
  check(completed.status === "complete", "awaited world migration completes", completed);
  check(game.settings.get("hyp3e", `migration-${game.system.version}-ran`) === true, "world completion checkpoint persisted");
  check(game.settings.get("hyp3e", "effectMigrationVersion") === (generation >= 14 ? 1 : 0), "effect checkpoint respects core generation");
  for (const snapshot of snapshots) {
    check(JSON.stringify(serialize(await fromUuid(snapshot.uuid))) === JSON.stringify(snapshot.effects),
      "full migration preserves effect data", { uuid: snapshot.uuid });
  }
  await game.settings.set("hyp3e", "reRunMigration", true);
  let rejected = false;
  try { await migration.runMigrations(game, async () => { throw new Error("Injected migration failure"); }); }
  catch (error) { rejected = error.message === "Injected migration failure"; }
  check(rejected && !game.settings.get("hyp3e", `migration-${game.system.version}-ran`)
    && game.settings.get("hyp3e", "reRunMigration"), "failed migration remains retryable");
  await migration.runMigrations(game, migrateWorld);
  check(!game.settings.get("hyp3e", "reRunMigration"), "successful retry clears rerun request");

  // Use a real world compendium through the existing opted-in module-pack interface.
  const pack = await foundry.documents.collections.CompendiumCollection.createCompendium({ name: "migration-fixtures", label: "Migration fixtures", type: "Item" });
  const packed = await pack.importDocument(worldItem);
  const packedSnapshot = serialize(packed);
  await pack.configure({ locked: true });
  const view = { release: game.release, system: game.system, actors: game.actors, items: game.items,
    scenes: game.scenes, settings: game.settings, packs: [{
      collection: "hyp3e-compendium.migration-fixtures", documentName: "Item",
      get locked() { return pack.locked; }, configure: options => pack.configure(options),
      getDocuments: () => pack.getDocuments(),
    }] };
  await game.settings.set("hyp3e", "migrateCompendia", true);
  try {
    await migration.migrateWorldEffects(view);
    check(pack.locked && JSON.stringify(serialize(await pack.getDocument(packed.id))) === JSON.stringify(packedSnapshot),
      "real compendium preserves effects and lock");
    if (generation >= 14) {
      view.packs[0].getDocuments = async () => { throw new Error("Injected compendium read failure"); };
      let failed = false;
      try { await migration.migrateWorldEffects(view); } catch { failed = true; }
      check(failed && pack.locked, "failed compendium pass restores real lock");
    }
  } finally { await game.settings.set("hyp3e", "migrateCompendia", false); }
  const secondGM = await foundry.documents.User.create({ name: "Migration Second GM", role: CONST.USER_ROLES.GAMEMASTER });
  return { checks, snapshots, actorId: actor.id, secondGM: secondGM.id,
    packed: { uuid: packed.uuid, effects: packedSnapshot } };
}

export async function verifyEffectReload(fixture) {
  const checks = [];
  for (const snapshot of [...fixture.snapshots, fixture.packed]) {
    const parent = await fromUuid(snapshot.uuid);
    const effects = parent.effects.map(effect => {
      const source = effect.toObject();
      return { id: source._id, duration: source.duration, start: source.start,
        flags: source.flags, disabled: source.disabled, origin: source.origin,
        changes: source.system?.changes ?? source.changes };
    }).sort((a, b) => a.id.localeCompare(b.id));
    checks.push({ name: "effect data and IDs survive reload", ok: JSON.stringify(effects) === JSON.stringify(snapshot.effects),
      details: { uuid: snapshot.uuid } });
  }
  return checks;
}

// Run after copying the stopped v13 test world into an isolated v14 data path.
export async function verifyEffectUpgrade(fixture) {
  const checks = [];
  const check = (ok, name, details) => checks.push({ name, ok: Boolean(ok), details });
  check(game.settings.get("hyp3e", "effectMigrationVersion") === 1, "v14 upgrade records independent effect checkpoint");
  check(game.settings.get("hyp3e", `migration-${game.system.version}-ran`), "v13 world completion remains set");
  for (const snapshot of [...fixture.snapshots, fixture.packed]) {
    const parent = await fromUuid(snapshot.uuid);
    check(parent?.effects.size === snapshot.effects.length, "upgrade retains effect count", snapshot.uuid);
    for (const before of snapshot.effects) {
      const after = parent?.effects.get(before.id)?.toObject();
      const units = ["seconds", "turns", "rounds"].find(unit => typeof before.duration[unit] === "number");
      const expectedValue = units ? before.duration[units] : null;
      check(after && after.duration.value === expectedValue
        && (!units || after.duration.units === units)
        && after.duration.expiry === (units ? "turnStart" : null),
      "upgrade preserves duration meaning including permanent and zero", { uuid: snapshot.uuid, id: before.id });
      check(after && JSON.stringify(after.flags) === JSON.stringify(before.flags)
        && after.disabled === before.disabled && after.origin === before.origin
        && JSON.stringify(after.system.changes) === JSON.stringify(before.changes),
      "upgrade preserves effect identity, flags and changes", { uuid: snapshot.uuid, id: before.id });
    }
  }
  const { runMigrations } = await import("/systems/hyp3e/module/helpers/effect-migrations.mjs");
  const repeated = await runMigrations(game, () => { throw new Error("Upgrade repeated base migration"); });
  check(repeated.status === "skipped", "completed upgrade skips repeated migration");
  return checks;
}
