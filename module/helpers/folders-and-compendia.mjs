import { Hyp3eLogger } from "./logger.mjs";

/**
 * Find item names from folders or compendia based on inclusion and exclusion name fragments.
 * @param {string} includeFragments - Comma-separated name fragments to include (e.g., "equipment").
 * @param {string} itemTypeFilter - Value to match item.type (e.g., "item", "weapon").
 * @param {string} [excludeFragments=""] - Comma-separated name fragments to exclude (e.g., "religious").
 * @returns {Promise<string[]>} Array of matching item names.
 */
export async function findItemsByFolderOrCompendiumName(includeFragments, itemTypeFilter, excludeFragments = "") {
  const includes = includeFragments
    .split(",")
    .map(f => f.trim().toLowerCase())
    .filter(f => f.length > 0);

  const excludes = excludeFragments
    .split(",")
    .map(f => f.trim().toLowerCase())
    .filter(f => f.length > 0);

  const shouldInclude = name =>
    includes.some(frag => name.toLowerCase().includes(frag));

  const shouldExclude = name =>
    excludes.some(frag => name.toLowerCase().includes(frag));

  // const matchedItems = [];
  const matchedItems = new Set(); // Avoid duplicates automatically

  // Match folders
  for (const folder of game.folders) {
    if (folder.type !== "Item") continue;

    const folderName = folder.name;
    if (!shouldInclude(folderName) || shouldExclude(folderName)) continue;

    for (const item of folder.contents) {
      if (item.type === itemTypeFilter) {
        // matchedItems.push(item.name);
        matchedItems.add(item.name);
      }
    }
  }

  // Match compendia
  for (const pack of game.packs) {
    if (pack.documentName !== "Item") continue;

    const label = pack.metadata.label;
    if (!shouldInclude(label) || shouldExclude(label)) continue;

    const index = await pack.getIndex({ fields: ["name", "type", "folder"] });
    Hyp3eLogger.info("findItemsByFolderOrCompendiumName", `Searching pack ${pack.collection} (${index.size} entries):`, index);

    // Build Folder ID to Name map for current compendium to avoid repeated lookups
    const folderNameMap = await buildCompendiumFolderMap(pack);
    Hyp3eLogger.info("findItemsByFolderOrCompendiumName", `Folder/Name map for ${pack.collection}:`, folderNameMap);

    for (const entry of index) {
      // Check item type
      if (entry.type !== itemTypeFilter) continue;

      // Check whether the folder name also matches the include/exclude criteria
      if (entry.folder) {
        const folderName = folderNameMap.get(entry.folder);
        if (folderName) {
          if (!shouldInclude(folderName) || shouldExclude(folderName)) continue;
        }
      }

      // All checks passed, include the item
      matchedItems.add(entry.name);
    }
  }

  // Sort alphabetically & return the results
  // matchedItems.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  // return matchedItems;
  return Array.from(matchedItems).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

/**
 * Build a Map of folderIds and itemNames from a compendium
 * @param {CompendiumCollection} pack - The compendium pack to build the map from.
 * @returns {Promise<Map<string, string>>} Map of folderId to folderName.
 */
export async function buildCompendiumFolderMap(pack) {
  const folderMap = new Map();

  // Preferred method: get actual Folder documents
  const allDocs = await pack.getDocuments();
  Hyp3eLogger.info("buildCompendiumFolderMap", `Found ${allDocs.length} documents in pack ${pack.collection}:`, allDocs);
  for (const f of allDocs.filter(d => d.folder !== null)) {
    folderMap.set(f.folder.id, f.folder.name);
  }

  // Fallback if no folders found via getDocuments
  if (folderMap.size === 0) {
    const index = await pack.getIndex({ fields: ["name", "type"] });
    for (const entry of index) {
      if (entry.type === "Folder") {
        folderMap.set(entry._id, entry.name);
      }
    }
  }

  return folderMap;
}

/**
 * Build a collection of all available class templates from both the world and compendia.
 * @returns {Promise<Array>} Array of class template items
 */
export async function getClassTemplates() {
  const results = game.items.filter(i => i.type === "classTemplate");

  for (const pack of game.packs) {
    if (pack.documentName !== "Item") continue;

    // Filter the lightweight index first
    const matches = pack.index.filter(i => i.type === "classTemplate");
    if (!matches.length) continue;

    const docs = await Promise.all(matches.map(m => pack.getDocument(m._id)));
    results.push(...docs);
  }

  return results;
}

/**
 * Build a list of available class template names from both the world and compendia.
 * @returns {Promise<Array<string>>} Array of class template names
 */
export async function getClassTemplateNames() {
  // World items
  const names = game.items
    .filter(i => i.type === "classTemplate")
    .map(i => i.name);

  // Compendium packs – use the index so we never load full documents
  for (const pack of game.packs) {
    if (pack.documentName !== "Item") continue;

    const packNames = pack.index
      .filter(i => i.type === "classTemplate")
      .map(i => i.name);

    names.push(...packNames);
  }

  return names.sort();
}

/**
 * Find a class template by name, searching both world items and compendia.
 * @param {*} name of classTemplate
 * @returns {Promise<Item|null>} The class template item or null if not found
 */
export async function getClassTemplate(name) {
  // Check world items first, as they take precedence if the same name exists in both
  const worldItem = game.items.find(i => 
    i.type === "classTemplate" && i.name.toLowerCase() === name.toLowerCase()
  );
  if (worldItem) return worldItem;

  // Not found? Search Item compendia
  for (const pack of game.packs) {
    if (pack.documentName !== "Item") continue;

    // Use the index so we only load the matching document
    const entry = pack.index.find(i => 
      i.type === "classTemplate" && i.name.toLowerCase() === name.toLowerCase()
    );
    if (!entry) continue;

    return await pack.getDocument(entry._id);
  }

  return null; // not found
}

/**
 * Load the plain-text list from a specific Journal Entry page
 * that lives in the specified compendium.
 *
 * @param {string} packName     Name of the compendium pack (e.g. "Equipment Lists")
 * @param {string} journalName  Name of the JournalEntry (e.g. "Armour")
 * @param {string} pageName     Name of the page inside it (e.g. "Shields")
 * @returns {Promise<string[]>} Array of cleaned paragraph texts
 */
export async function getJournalPageList(packName, journalName, pageName) {
  // 1. Find the compendium pack
  const pack = game.packs.find(p =>
    p.metadata.label === packName || p.metadata.name === packName
  );
  if (!pack) {
    console.warn(`Compendium "${packName}" not found.`);
    return [];
  }

  // 2. Find the Journal Entry inside the pack (use the index first)
  const entry = pack.index.find(i => i.name === journalName);
  if (!entry) {
    console.warn(`JournalEntry "${journalName}" not found in "${packName}".`);
    return [];
  }

  const journal = await pack.getDocument(entry._id);
  if (!journal) return [];

  // 3. Find the page
  const page = journal.pages.getName(pageName);
  if (!page) {
    console.warn(`Page "${pageName}" not found in journal "${journalName}".`);
    return [];
  }

  // 4. Get the HTML content and extract <p> texts
  const html = page.text?.content ?? "";
  if (!html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const list = Array.from(doc.querySelectorAll("p"))
    .map(p => p.textContent.trim())
    .filter(text => text.length > 0);

  return list;
}