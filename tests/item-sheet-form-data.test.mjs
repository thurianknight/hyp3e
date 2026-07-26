import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const itemSheetUrl = new URL("../module/sheets/item-sheet-v2.mjs", import.meta.url);

test("item form processing preserves submitted false and empty-string values", async () => {
  const source = await readFile(itemSheetUrl, "utf8");
  const submittedFields = [
    "system.identified",
    "system.realDescription",
    "system.aliasDescription"
  ];

  for (const field of submittedFields) {
    const assignment = new RegExp(
      `getProperty\\(formDataObj, "${field.replace(".", "\\.")}"\\)\\s*\\?\\?`
    );
    assert.match(source, assignment, `${field} must use a nullish fallback`);
  }
});
