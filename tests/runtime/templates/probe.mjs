// Test-only transport instrumentation. Never enable this in a real world.
// The local harness prefixes this module with configuration and records results.
const configuration = {...globalThis.hyp3eTemplateProbeConfiguration};
// Optional explicit reruns by the local browser harness.
const parameters = new URLSearchParams(location.search);
if (parameters.has("probe-mode")) configuration.mode = parameters.get("probe-mode");
if (parameters.has("probe-client")) configuration.client = parameters.get("probe-client");
const {mode} = configuration;
const family = mode.split("-")[0];
const aliases = {
  actor: ["actor-character-header-v2", "actor/actor-character-header-v2.hbs"],
  item: ["weapon-header", "item/parts/weapon-header.hbs"],
  combat: ["combat-tracker-combatant-ind-v13", "sidebar/combat-tracker-combatant-ind-v13.hbs"]
};
const [alias, relativePath] = aliases[family] ?? [];
const templatePath = relativePath ? `systems/hyp3e/templates/${relativePath}` : null;
let armed = family !== "combat";
let requests = 0;
const held = [], errors = [], preloadErrors = [];
window.addEventListener("unhandledrejection", event => errors.push(String(event.reason?.stack ?? event.reason)));
const originalError = console.error;
console.error = function(...args) {
  if (String(args[0]).includes("hyp3e | Failed to preload templates")) preloadErrors.push(String(args[1]));
  return originalError.apply(this, args);
};
// Intercept the real Socket.IO template acknowledgment, preserving core's cache,
// compilation, named registration, error handling and application lifecycle.
let socket, originalEmit;
const originalCallAll = Hooks.callAll;
Hooks.callAll = function(hook, ...args) {
  // Package modules evaluate before Game connects its socket. Instrument just
  // before init dispatch, then immediately restore the hook dispatcher.
  if (hook === "init") {
    socket = game.socket;
    originalEmit = socket.emit;
    socket.emit = instrumentedEmit;
    Hooks.callAll = originalCallAll;
  }
  return originalCallAll.call(this, hook, ...args);
};
function instrumentedEmit(event, ...args) {
  const [path, callback] = args;
  if (event !== "template" || path !== templatePath || !armed) {
    return originalEmit.call(this, event, ...args);
  }
  requests++;
  return originalEmit.call(this, event, path, response => {
    if (mode.endsWith("delay")) held.push(() => callback(response));
    else callback({error: "Injected template transport failure", path});
  }, ...args.slice(2));
}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const timeout = promise => Promise.race([promise, wait(15000).then(() => { throw Error("Probe timed out"); })]);

Hooks.once("ready", async () => {
  const report = {client: configuration.client, role: game.user.isGM ? "GM" : "Player", mode,
    core: game.version, system: game.system.version, userAgent: navigator.userAgent,
    checks: [], errors, preloadErrors, started: new Date().toISOString()};
  const check = (label, passed, detail) => {
    report.checks.push({label, passed: Boolean(passed), detail});
    if (!passed) throw Error(label);
  };
  const character = game.actors.find(actor => actor.type === "character");
  const weapon = game.items.find(item => item.type === "weapon");
  const showSheet = async document => {
    await timeout(document.sheet.render({force: true}));
    check(`${document.documentName} ${document.type} rendered`,
      document.sheet.rendered && document.sheet.element?.querySelector('input[name="name"]'));
  };
  try {
    if (mode.startsWith("normal")) {
      for (const document of [...game.actors, ...game.items]) {
        await showSheet(document);
        await timeout(document.sheet.render({force: true}));
        check(`${document.documentName} ${document.type} rerendered`, document.sheet.rendered);
        await document.sheet.close();
      }
      const initiativeType = CONFIG.HYP3E.initiativeType;
      try {
        for (const type of ["individual", "group"]) {
          CONFIG.HYP3E.initiativeType = type;
          await timeout(ui.combat.render({force: true}));
          check(`combat ${type} rows rendered`, ui.combat.element?.querySelectorAll("[data-combatant-id]").length >= 2);
        }
      } finally { CONFIG.HYP3E.initiativeType = initiativeType; }
    } else {
      if (family === "combat") {
        // The sidebar renders during game initialization; fault its next render
        // after ready so the probe can exercise and release the pending request.
        // Drain its initial render before evicting a partial from the test cache.
        await timeout(ui.combat.render({force: true}));
        delete Handlebars.partials[alias];
        armed = true;
      }
      check("partial absent before render", !Handlebars.partials[alias]);
      const application = family === "actor" ? character.sheet : family === "item" ? weapon.sheet : ui.combat;
      let settled = false;
      const rendering = application.render({force: true}).then(
        () => ({ok: true}), error => ({ok: false, error: String(error.stack)}));
      rendering.then(() => { settled = true; });
      if (mode.endsWith("delay")) {
        await wait(350);
        check("render waits for pending partial", !settled && held.length === 1, {settled, held: held.length});
        // A sheet from the other family must not be blocked by this partial.
        const independent = family === "item" ? character : weapon;
        await showSheet(independent);
        await independent.sheet.close();
        armed = false;
        for (const release of held.splice(0)) release();
        check("pending render completes after response", (await timeout(rendering)).ok);
        check("one shared request for preload and render", requests === 1, requests);
      } else {
        const failed = await timeout(rendering);
        check("render reports transport failure", !failed.ok && failed.error.includes("Injected template transport failure"), failed);
        check("failed response was not cached as a partial", !Handlebars.partials[alias]);
        armed = false;
        // No manual preload: repeating the normal render must retry automatically.
        await timeout(application.render({force: true}));
        check("reopening retries and renders", application.rendered && Handlebars.partials[alias]);
        if (family !== "combat") check("init preload failure was handled", preloadErrors.length === 1, preloadErrors);
      }
      check("registered partial is compiled", typeof Handlebars.partials[alias] === "function");
      if (family !== "combat") {
        check("recovered sheet has name control", application.element?.querySelector('input[name="name"]'));
        await application.close();
      } else check("recovered combat rows", application.element?.querySelectorAll("[data-combatant-id]").length >= 2);
    }
    await wait(100);
    check("no unhandled promise rejections", errors.length === 0, errors);
  } catch (error) { report.error = String(error.stack); }
  finally {
    armed = false;
    for (const release of held.splice(0)) release();
    socket.emit = originalEmit;
    console.error = originalError;
  }
  report.requests = requests;
  report.finished = new Date().toISOString();
  report.passed = !report.error && report.checks.every(check => check.passed);
  globalThis.hyp3eTemplateProbe = report;
  const next = await fetch("/__probe/result", {method: "POST", headers: {"Content-Type": "application/json"},
    body: JSON.stringify(report)}).then(response => response.json());
  if (next.url) location.href = next.url;
  else if (configuration.client === "FLC") {
    await character.sheet.render({force: true});
    ui.notifications.info("Template regression checks complete. Results saved locally.");
  }
});
