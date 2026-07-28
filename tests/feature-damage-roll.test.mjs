import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const itemDocumentUrl = new URL("../module/documents/item.mjs", import.meta.url);
const npcItemsTemplateUrl = new URL(
  "../templates/actor/parts/section-npc-items.hbs",
  import.meta.url
);

test("Features with damage render a damage roll in chat", async () => {
  const source = await readFile(itemDocumentUrl, "utf8");
  const featureMethodStart = source.indexOf("\n  _renderFeatureSection(");
  const featureMethodEnd = source.indexOf("\n  _renderWeaponSection(", featureMethodStart);
  const featureMethod = source.slice(featureMethodStart, featureMethodEnd);

  assert.match(
    source,
    /_renderFeatureSection\(itemData,\s*item,\s*actorData\)/,
    "Feature rendering must receive the item and actor roll data"
  );
  assert.match(
    featureMethod,
    /this\._renderDamageRoll\(itemData,\s*item,\s*actorData\)/,
    "Feature chat content must include the shared damage-roll control"
  );
});

test("NPC Feature rows identify damaging Features with a damage action", async () => {
  const template = await readFile(npcItemsTemplateUrl, "utf8");
  const featuresStart = template.indexOf("{{#each features");
  const featuresEnd = template.indexOf("</ol>", featuresStart);
  const featuresSection = template.slice(featuresStart, featuresEnd);

  assert.match(featuresSection, /{{#if item\.system\.damage}}/);
  assert.match(
    featuresSection,
    /data-action="displayItem"[\s\S]*?HYP3E\.item\.rollDamage[\s\S]*?fa-droplet/
  );
});
