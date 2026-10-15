# Release packaging validation — 2026-10-14

Baseline: hyp3e 4.5.0 at `3439d5f971e36e8537bbf604b35aee27811dcd2d`.
This change affects packaging and documentation; runtime code, schemas,
migrations, manifest version, and compatibility declarations are unchanged.

## Regression checks

`npm run test:packaging` passes **8/8 tests** with Python 3.14:

- Stale `template.json` and arbitrary files in the previous staging directory
  cannot enter the ZIP; unlisted source files are also excluded.
- Deleted and renamed source files cannot survive a rebuild.
- Missing required inputs and corrupted staged bytes preserve the previous ZIP.
- Incorrect package identity, output inside the source tree, and linked inputs
  are rejected. The Windows run exercised a directory junction.
- The build-only CLI succeeds without publishing dependencies, credentials, or
  a Git repository. Importing the builder does not execute Git commands.

Before implementing the fix, an isolated execution of the original packaging
block reproduced both `template.json` and `obsolete.txt` surviving in its ZIP.
The original script also failed the import-without-publishing-dependencies gate.

All 69 runtime JavaScript files passed `node --check`; source JSON parsed.
The built ZIP contains **351 files**, all byte-identical to their allowlisted
sources, with `system.json` at its root and no `template.json`, tests, or Git
metadata. A repeat build produced the same archive hash on this host:

`657348ec8f47997cf3c43b7da476c92a99e9d8a84df187b913ed43512fcc0b0b`

## Foundry runtime comparison

The exact ZIP was extracted into a fresh disposable data directory for each
run. Controls used the same ZIP plus the legacy type-list-only `template.json`.
Playwright 1.63.0 exercised separate GM and player browser contexts. Each run
stopped its server and verified the test port was free afterward.

| Core | Node | Package | Checks | Template warning in Setup |
| --- | --- | --- | --- | --- |
| 13.351 | 22.23.2 | Candidate | 57/57 | Absent |
| 13.351 | 22.23.2 | Control with legacy file | 57/57 | Absent; v13 does not emit this warning |
| 14.369 | 24.15.0 | Candidate | 57/57 | Absent |
| 14.369 | 24.15.0 | Control with legacy file | 57/57 | Present |

All **228 checks** passed. Coverage included:

- Setup discovery and the actual system-warning registry before world launch.
  The in-world compatibility registry only includes module warnings and is not
  sufficient to verify this system warning.
- Model registration, creation, updates, rendering, and reload for all five
  Actor types and eight Item types, including `classTemplate`.
- Both compendia: 26 class Items and three equipment Journals with 12 pages.
- Embedded inventory and ActiveEffect IDs, synthetic-token Actor identity and
  independent HP, rich-text persistence, player ownership, and a player sheet
  HP edit synchronized to the GM and retained after reload.
- Import and existing migration helpers using a local generated 3.2.3 character
  fixture with 33 Items. Its export has no embedded IDs, so preservation was
  checked from core's initial ID assignment through migration and reload.
  HP, inventory, attributes, currency, and a custom flag were checked. This is
  a representative import test, not certification of every historical world.

Final runs had no browser errors, unhandled page errors, or failed requests.
Allowed browser warnings were limited to software-rendering notices and the
expected template warning in the v14 control. No live worlds were used.
The documented `--noipdiscovery` option avoids an unrelated v14 startup race
while external address discovery is pending during localhost tests.

## Existing limitations outside this change

- The existing JavaScript suite passes 4/5 tests. Its context-menu inspection
  test searches for `// Right-click context menu on item entries`, while the
  unchanged source now says `// Here we add a right-click context menu on item
  entries`. The empty extracted section causes its assertion to fail.
- Both v13 candidate and control emit the same equipment-journal migration
  error for record `lYYLOTNcxklXCRTj`: embedded data from a newer core cannot be
  migrated backward. The pack remains readable with the counts above. This
  packaging change does not repair that upstream content compatibility issue.
- Upstream `dev` advanced to `174052973169ed55152cf1c634f37b9afe460235` during
  validation. Its token/effect changes do not overlap these files. The tested
  artifact retains the specified 4.5.0 baseline; those newer changes were not
  incorporated or claimed as tested.

These results validate the packaging correction on the listed builds. They do
not claim that the entire existing upstream test suite or compatibility matrix
is free of defects. Publishing and live installation were not performed.
