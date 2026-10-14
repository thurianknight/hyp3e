/** The effect schema checkpoint is independent of the system release and core generation. */
export const EFFECT_MIGRATION_VERSION = 1;

/** Plan only an unambiguous legacy duration conversion, without reading prepared shims. */
export function getEffectMigrationUpdate(source, generation) {
  const duration = source.duration;
  if (generation < 14 || !duration) return {};
  // Core v14 already migrates duration data. Never reinterpret its modern result,
  // including permanent effects (value: null), zero values, or custom expiry events.
  if (Object.hasOwn(duration, "value") || Object.hasOwn(duration, "units")) return {};
  for (const units of ["seconds", "turns", "rounds"]) {
    const value = Object.getOwnPropertyDescriptor(duration, units)?.value;
    if (!Number.isInteger(value) || value < 0) continue;
    const updates = { "duration.value": value, "duration.units": units };
    if (!Object.hasOwn(duration, "expiry")) updates["duration.expiry"] = "turnStart";
    return updates;
  }
  return {};
}

const coreGeneration = () => Number(game.release?.generation ?? game.version.split(".")[0]);

async function migrateEffects(parent, generation, assertAuthority) {
  const counts = { inspected: 0, updated: 0 };
  if (generation < 14) return counts;
  for (const effect of parent.effects ?? []) {
    counts.inspected++;
    const updates = getEffectMigrationUpdate(effect.toObject(), generation);
    if (!Object.keys(updates).length) continue;
    assertAuthority();
    try {
      // Suppress duration hooks that reset remainingRounds or modify token lighting.
      await effect.update(updates, { render: false, noHook: true });
      counts.updated++;
    } catch (cause) {
      throw new Error(`Effect migration failed for ${effect.uuid}: ${cause.message}`, { cause });
    }
  }
  return counts;
}

export async function migrateItemEffects(item, generation = coreGeneration(), assertAuthority = () => {}) {
  return migrateEffects(item, generation, assertAuthority);
}

export async function migrateActorEffects(actors = game.actors.contents, generation = coreGeneration(), assertAuthority = () => {}) {
  const counts = { inspected: 0, updated: 0 };
  for (const actor of actors) {
    const migrated = await migrateEffects(actor, generation, assertAuthority);
    counts.inspected += migrated.inspected;
    counts.updated += migrated.updated;
  }
  return counts;
}

/** Include directory documents, unlinked token Actors, and explicitly opted-in packs. */
export async function migrateWorldEffects(world, assertAuthority = () => {}) {
  const generation = Number(world.release?.generation ?? world.version.split(".")[0]);
  const counts = { inspected: 0, updated: 0 };
  if (generation < 14) return counts;
  const add = migrated => {
    counts.inspected += migrated.inspected;
    counts.updated += migrated.updated;
  };
  const migrateActor = async actor => {
    add(await migrateActorEffects([actor], generation, assertAuthority));
    for (const item of actor.items ?? []) add(await migrateItemEffects(item, generation, assertAuthority));
  };
  const actors = new Map(world.actors.contents.map(actor => [actor.uuid, actor]));
  for (const scene of world.scenes) {
    for (const token of scene.tokens) {
      if (!token.actorLink && token.actor) actors.set(token.actor.uuid, token.actor);
    }
  }
  for (const actor of actors.values()) await migrateActor(actor);
  for (const item of world.items.contents) add(await migrateItemEffects(item, generation, assertAuthority));
  if (!world.settings.get(world.system.id, "migrateCompendia")) return counts;
  for (const pack of world.packs) {
    if (!pack.collection.startsWith("hyp3e-compendium")) continue;
    if (!["Actor", "Item"].includes(pack.documentName)) continue;
    assertAuthority();
    const wasLocked = pack.locked;
    try {
      await pack.configure({ locked: false });
      for (const document of await pack.getDocuments()) {
        if (pack.documentName === "Actor") await migrateActor(document);
        else add(await migrateItemEffects(document, generation, assertAuthority));
      }
    } finally {
      await pack.configure({ locked: wasLocked });
    }
  }
  return counts;
}

/** Run once from ready on the active GM; leave failed passes eligible for retry. */
export async function runMigrations(world, migrateWorld) {
  const isAuthority = () => world.user?.isGM && world.users.activeGM?.id === world.user.id;
  if (!isAuthority()) return { status: "skipped" };
  const assertAuthority = () => {
    if (!isAuthority()) throw new Error("Migration authority changed; retry from the active GM.");
  };
  const namespace = world.system.id;
  const versionKey = `migration-${world.system.version}-ran`;
  const rerun = world.settings.get(namespace, "reRunMigration");
  const needsWorld = rerun || !world.settings.get(namespace, versionKey);
  const generation = Number(world.release?.generation ?? world.version.split(".")[0]);
  const needsEffects = generation >= 14 && (needsWorld
    || world.settings.get(namespace, "effectMigrationVersion") < EFFECT_MIGRATION_VERSION);
  if (!needsWorld && !needsEffects) return { status: "skipped" };

  // Invalidate previous completion before an explicitly requested rerun can fail.
  if (needsWorld) await world.settings.set(namespace, versionKey, false);
  if (needsEffects) await world.settings.set(namespace, "effectMigrationVersion", 0);
  assertAuthority();
  if (needsWorld) await migrateWorld();
  const effects = needsEffects ? await migrateWorldEffects(world, assertAuthority) : { inspected: 0, updated: 0 };
  assertAuthority();
  if (needsEffects) await world.settings.set(namespace, "effectMigrationVersion", EFFECT_MIGRATION_VERSION);
  if (needsWorld) await world.settings.set(namespace, versionKey, true);
  await world.settings.set(namespace, "reRunMigration", false);
  return { status: "complete", effects };
}
