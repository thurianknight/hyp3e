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

  const matchedItems = [];

  // Match folders
  for (const folder of game.folders) {
    if (folder.type !== "Item") continue;
    const folderName = folder.name;
    if (!shouldInclude(folderName) || shouldExclude(folderName)) continue;

    for (const item of folder.contents) {
      if (item.type === itemTypeFilter) {
        matchedItems.push(item.name);
      }
    }
  }

  // Match compendia
  for (const pack of game.packs) {
    if (pack.documentName !== "Item") continue;
    const label = pack.metadata.label;
    if (!shouldInclude(label) || shouldExclude(label)) continue;

    const index = await pack.getIndex();
    for (const entry of index) {
      const item = await pack.getDocument(entry._id);
      if (item.type === itemTypeFilter) {
        matchedItems.push(item.name);
      }
    }
  }

  // Sort alphabetically & return the results
  matchedItems.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  return matchedItems;
}
