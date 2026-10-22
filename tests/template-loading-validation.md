# Template-loading regression checks

## Contract

Foundry does not await asynchronous `init` hooks. Preloading is an optimization;
an Actor sheet, Item sheet, or combat tracker must await its own named partials
before rendering. A pending partial delays that render. A rejected load reports
the transport error, never registers an error response as template content, and
can be retried by rendering again. An Actor partial must not block an Item sheet,
or vice versa. Successful loads and concurrent requests use Foundry's cache.

The implementation uses the named-map form of `loadTemplates` and the documented
ApplicationV2 `_preRender` lifecycle. The short aliases in the existing templates
remain unchanged. Startup preload failures are caught and logged; applications
retry through the same loader. No socket or hook monkey-patching is shipped in
the system. The instrumentation described below is exclusively test code.

API references, checked against installed 13.351 and 14.369 core sources:
[v13 loadTemplates](https://foundryvtt.com/api/v13/functions/foundry.applications.handlebars.loadTemplates.html),
[v14 loadTemplates](https://foundryvtt.com/api/v14/functions/foundry.applications.handlebars.loadTemplates.html),
and [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html).

## Unit tests

Run `npm run test:templates` with Node 22 or newer. These dependency-free tests
cover named registration, preload ordering, family isolation, pending/rejected
loads, retries, and every active partial reference in Actor/Item/sidebar templates.
The four tests failed against the original loader before implementation.

## Real Foundry regression probe

Use disposable user-data roots and worlds, with the exact release ZIP extracted
to `Data/systems/hyp3e`. Do not enable the probe in a real campaign. Foundry,
licenses, browser binaries, and local test-world data are not distributed here.

1. Create an empty world, an owning player, one Actor of each of the five system
   subtypes, and one Item of each of the eight subtypes. Give the player ownership
   of these fixtures. Create an active scene-independent Combat with character and
   NPC combatants. Leave all other modules disabled.
2. Copy `tests/runtime/templates/` to `Data/modules/hyp3e-template-probe/` and
   enable it. Serve through a local HTTP/WebSocket test proxy. When serving
   `probe.mjs`, prefix it with
   `globalThis.hyp3eTemplateProbeConfiguration = {client: "Chromium", mode: "normal"};`
   (use `FLC` for the actual native client). This supplies synchronous configuration
   before Foundry's initialization; do not await configuration inside an init hook.
3. Accept JSON POSTs at `/__probe/result`, retain the report, and respond with
   `{ "url": null }` or the next test URL. A `null` response leaves the client on
   the completed page. Browser harnesses may also read `hyp3eTemplateProbe` after
   it becomes available. Optional `probe-mode` and `probe-client` URL parameters
   select a targeted rerun.
4. With a fresh page for each scenario, run `normal`, `normal-reload`,
   `actor-delay`, `actor-failure`, `item-delay`, `item-failure`, `combat-delay`, and
   `combat-failure`. Repeat as GM and owning player in Chromium and the actual FLC
   executable on both core generations. Assert `report.passed` and every check;
   retain errors, versions, user agents, screenshots, and the package SHA-256.

The probe temporarily instruments the real Socket.IO `template` acknowledgment
before init dispatch. Delays hold the server response; failures supply a server
error acknowledgment. Core still owns caching, compilation, registration, and
rendering. Startup Actor/Item failures must be caught without unhandled
rejections. A repeated sheet render must recover without a manual preload.
Combat tests drain the sidebar's initial render before evicting a cached partial
and faulting its next load. Deleting a partial during an already-running render
would invalidate the test by removing a dependency after its loading gate passed.

Normal scenarios open and rerender all 13 document sheets and exercise individual
and group combat rows. Delayed scenarios verify the render remains pending,
another sheet family still opens, only one request is used, and rendering
completes after release. Failure scenarios verify rejection, absence of a cached
partial, and recovery on the next render. All scenarios check for unhandled
promise rejections. Stop test servers and confirm their ports close afterward.

## Recorded acceptance — 2026-10-19

Base: latest upstream `dev` fetched at the start of this work,
`58dad834ea295436e5d8cc39a180246eb488860f` (4.6.0).
Release ZIP SHA-256:
`204a77e8d81f8dd88e56410a939fd4c4ea2d0504c2499f62c2340f5a98f78be0`.
All 361 packaged files match the release allowlist and source bytes. Tests and
fixtures are excluded. Static installed files were also verified in both cores.

| Client | Core | Roles | Scenarios | Assertions |
| --- | --- | --- | --- | --- |
| Chromium 153.0.8010.12 | 13.351 | GM + owning player | 16/16 pass | 210/210 pass |
| Chromium 153.0.8010.12 | 14.369 | GM + owning player | 16/16 pass | 210/210 pass |
| FLC 8.0.0, Windows WebView2 | 13.351 | GM + owning player | 16/16 pass | 210/210 pass |
| FLC 8.0.0, Windows WebView2 | 14.369 | GM + owning player | 16/16 pass | 210/210 pass |

The native FLC executable was extracted from the official 8.0.0 Windows MSI and
used a fresh WebView profile. Its user agent reports Chromium/Edge 155.0.0.0.
The final matrix has zero unhandled rejections and zero unexpected Chromium
console/page errors. Injected failure scenarios log the expected caught preload
error. Normal loads, reloads, all five Actor and eight Item types, both combat
layouts, delayed loads, failed loads, and reopening after failure pass. A separate
native FLC Actors-directory double-click also reopened the character sheet.
This covers the Windows client; macOS/Linux engines were not tested.

`npm run test:templates`: 4/4 pass under Node 22.23.2 and 24.15.0.
Packaging suite: 8/8 pass. All six changed runtime/test JavaScript modules pass
syntax checks. The complete existing JavaScript suite is 8/9: its context-menu
source test searches for a removed upstream comment and also fails on the
unchanged upstream baseline. The v13 equipment-journal compendium also retains
its existing newer-core metadata migration warning. Neither unrelated issue is
hidden by these template-specific acceptance results.
