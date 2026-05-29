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
 */
async function buildCompendiumFolderMap(pack) {
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