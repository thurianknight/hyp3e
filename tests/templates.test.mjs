import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import * as templates from "../module/helpers/templates.mjs";

function mockLoader(t, loadTemplates) {
  t.mock.method(globalThis, "fetch", () => assert.fail("Partials must use Foundry's template loader"));
  globalThis.foundry = { applications: { handlebars: { loadTemplates } } };
  t.after(() => delete globalThis.foundry);
}

test("preloading registers named partials before preloading full templates", async t => {
  const calls = [];
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  mockLoader(t, paths => {
    calls.push(paths);
    return calls.length === 1 ? pending : Promise.resolve([]);
  });
  const loading = templates.preloadHandlebarsTemplates();
  assert.equal(calls.length, 1);
  assert.equal(calls[0]["actor-character-header-v2"],
    "systems/hyp3e/templates/actor/actor-character-header-v2.hbs");
  release([]);
  await loading;
  assert.equal(calls.length, 2);
  assert.ok(calls[1].includes("systems/hyp3e/templates/chat/attack-roll.hbs"));
});

test("each application loads only its own partial family", async t => {
  const calls = [];
  mockLoader(t, paths => { calls.push(paths); return Promise.resolve([]); });
  for (const family of ["actor", "item", "sidebar"]) {
    await templates.loadHandlebarsPartials(family);
    const paths = Object.values(calls.at(-1));
    assert.ok(paths.length > 0);
    assert.ok(paths.every(path => path.startsWith(`systems/hyp3e/templates/${family}/`)));
  }
});

test("pending loads are awaited and failed loads can be retried", async t => {
  let rejectLoad;
  const failure = new Error("Template transport unavailable");
  let attempts = 0;
  mockLoader(t, () => ++attempts === 1
    ? new Promise((resolve, reject) => { rejectLoad = reject; })
    : Promise.resolve(["compiled template"]));
  let settled = false;
  const first = templates.loadHandlebarsPartials("actor");
  const rejected = assert.rejects(first, failure).then(() => { settled = true; });
  await Promise.resolve();
  assert.equal(settled, false);
  rejectLoad(failure);
  await rejected;
  assert.deepEqual(await templates.loadHandlebarsPartials("actor"), ["compiled template"]);
  assert.equal(attempts, 2);
});

test("every active named partial reference has an existing template in its family", async t => {
  let aliases;
  mockLoader(t, paths => { aliases = paths; return Promise.resolve([]); });
  await templates.loadHandlebarsPartials();
  assert.equal(new Set(Object.values(aliases)).size, Object.keys(aliases).length);
  for (const [alias, path] of Object.entries(aliases)) {
    assert.equal(alias, path.split("/").at(-1).replace(/\.hbs$/, ""));
    assert.ok((await readFile(new URL(`../${path.replace("systems/hyp3e/", "")}`, import.meta.url), "utf8")).length);
  }
  for (const family of ["actor", "item", "sidebar"]) {
    const directory = new URL(`../templates/${family}/`, import.meta.url);
    for (const file of await readdir(directory, { recursive: true })) {
      if (!file.endsWith(".hbs")) continue;
      const source = (await readFile(new URL(file.replaceAll("\\", "/"), directory), "utf8"))
        .replace(/\{\{!--[\s\S]*?--\}\}/g, "");
      for (const [, alias] of source.matchAll(/\{\{>\s*["']([^"']+)["']/g)) {
        assert.ok(aliases[alias]?.startsWith(`systems/hyp3e/templates/${family}/`), `${family}/${file}: ${alias}`);
      }
    }
  }
});
