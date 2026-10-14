# Effect migration validation

## Contract

Each effect gets a fresh update plan built from `toObject()` source data. A modern duration (including `value: null` or `value: 0`) is left alone. Only unambiguous legacy numeric seconds, turns, or rounds are converted on v14, in core's precedence order. The conversion never writes prepared `remaining` data or resets `flags.hyp3e.remainingRounds`.

Foundry v14 normally performs this conversion itself before constructing Documents. The system preserves that result instead of overriding units or expiry. An absent legacy expiry follows core's `turnStart` default; an explicit expiry is preserved. Ambiguous or malformed legacy data is not guessed. This change cannot reconstruct effects already corrupted by an earlier migration.

Only `game.users.activeGM` runs shared migrations. Writes are awaited and errors propagate with document identity. Completion remains pending after failure, and a successful retry leaves already-converted effects alone. The independent `effectMigrationVersion` setting lets a world completed on v13 receive the v14 effect pass without rerunning unrelated system migrations. A forced rerun invalidates completion before starting. If authority changes during a pass, the next effect write or completion check aborts; the active GM can reload to retry.

The inventory covers world Actors, their Items, world Items, and unlinked token Actors in all Scenes. Compendia retain the existing explicit opt-in setting and `hyp3e-compendium*` prefix policy. Locks are restored in `finally` on success or failure. Migration does not delete effects or rewrite IDs, changes, origin, disabled state, or unrelated flags.

## Regression tests

```sh
npm run test:migrations
```

This dependency-free Node test suite covers mixed temporary/permanent ordering, modern duration units, zero values, malformed inputs, source immutability, independent updates, idempotence, Actor/Item/synthetic coverage, delayed and rejected writes, partial compendium failures, lock restoration, GM selection and authority loss, checkpoints, and v13-to-v14 upgrade gating. The original three regressions failed against upstream before implementation.

## Real Foundry checks

Use fresh disposable user-data directories, no third-party modules, and an extracted release archive. Never run the fixture functions in a real campaign. Licenses and Foundry software are local prerequisites and are not provided by this repository.

1. Start each supported core with the package at `Data/systems/hyp3e`. Create an empty hyp3e world and a player named `Packaging Player`, then join as the active GM.
2. In a Playwright harness, import `exerciseEffectMigrations` and `verifyEffectReload` from `tests/runtime/effect-migration-checks.mjs`. Once `game.ready` and the ready migration have completed, run `page.evaluate(exerciseEffectMigrations, { generation })`. Assert every returned `checks` entry is true and save the returned fixture object. The function creates 30 effects across directory and synthetic documents, plus six effects in a real world compendium; it exercises the actual world migration, failure/retry, checkpoint and lock behavior.
3. Join `Migration Second GM` in a separate browser context. Set the current release's migration completion setting to false and wait for both clients to see it. Invoke `runMigrations(game, callback)` concurrently on both clients; assert exactly one callback runs and completes. Invoke it as the player and assert `status: "skipped"` without invoking its callback.
4. Reload the GM page and run `page.evaluate(verifyEffectReload, fixture)`. Assert all effect IDs, duration source, flags, changes and other captured state remain equal.
5. Stop the v13 server. Copy its disposable world into a separate v14 user-data directory, install the same package archive, and launch through core's world-upgrade flow. Run `page.evaluate(verifyEffectUpgrade, v13Fixture)` after the effect checkpoint reaches 1, then reload and repeat. This compares 36 retained effects, including offscreen unlinked token effects and a world compendium, with their v13 snapshots.
6. Capture browser/server diagnostics, failed requests, exact core/runtime/package versions, archive SHA-256, and assertion results. Stop the servers and confirm their test ports close.

The real-Document checks use disabled fixtures to isolate migration from gameplay expiration; elapsed-time and combat processing are separate work items. Unit adapters exercise delayed/rejected legacy writes that current v14 core normally resolves before the system sees a Document. Existing data-migration transformations remain in place; the tests do not establish rollback or universal idempotence for every historical system migration.

## Recorded acceptance — 2026-10-14

Base: upstream `dev` at `174052973169ed55152cf1c634f37b9afe460235`, manifest 4.5.0. The packaging PR is independent; an offline allowlist builder from that PR produced the test archive without changing this branch's release tooling.

Archive SHA-256: `caccd68f73497a325180a116a2027b35d6995180def19fbdf861afe5f839c829`.

| Gate | Result |
| --- | --- |
| Migration regression suite, Node 24.15.0 | 16/16 pass |
| Foundry 13.351, Node 22.23.2 | 84/84 runtime assertions pass |
| Foundry 14.369, Node 24.15.0 | 85/85 runtime assertions pass |
| Actual v13-to-v14 copied-world upgrade | 164/164 assertions pass, including reload |
| Playwright | 1.63.0, Chromium with software rendering |

The runtime runs also cover all five Actor and eight Item subtypes, sheet creation/rendering/reload, imported legacy inventory IDs, owning-player edits, compendium loading, and independent synthetic Actor state. No browser exceptions, console errors, effect deprecation warnings, or failed HTTP requests occurred. Software-rendering warnings and one transient WebSocket warning during navigation were recorded.

Two upstream issues remain outside this change: `tests/foundry-compat.test.mjs` searches for a removed comment and fails its context-menu source assertion (the existing suite remains 4/5); the bundled Weapons journal has a child page marked as core 14.365, which causes a v13 compendium migration error. All three bundled journals and their 12 pages still load in the smoke check, but that does not make the v13 compendium migration gate clean. These are not hidden by the passing migration-specific results.

API references checked alongside installed 13.351/14.369 core source: [v13 Users.activeGM](https://foundryvtt.com/api/v13/classes/foundry.documents.collections.Users.html#activegm) and [v14 ActiveEffect](https://foundryvtt.com/api/classes/foundry.documents.ActiveEffect.html). No new private API dependency was introduced.
