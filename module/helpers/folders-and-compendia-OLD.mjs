/**
 * Find item names from folders or compendia whose names match any of the given fragments.
 * @param {string} nameFragments - A comma-separated string of name fragments (e.g., "armor, weapons").
 * @param {string} systemTypeFilter - The value to match against item.system.type.
 * @returns {Promise<string[]>} Array of matching item names.
 */
export async function findItemsByFolderOrCompendiumName(nameFragments, systemTypeFilter) {
  const fragments = nameFragments
    .split(",")
    .map(f => f.trim().toLowerCase())
    .filter(f => f.length > 0);

  const matchesFragment = name =>
    fragments.some(frag => name.toLowerCase().includes(frag));

  const matchedItems = [];

  // Match folders
  for (const folder of game.folders) {
    if (folder.type !== "Item") continue;
    if (!matchesFragment(folder.name)) continue;

    for (const item of folder.contents) {
      if (item.type === systemTypeFilter) {
        matchedItems.push(item.name);
      }
    }
  }

  // Match compendia
  for (const pack of game.packs) {
    if (pack.documentName !== "Item") continue;
    if (!matchesFragment(pack.metadata.label)) continue;

    const index = await pack.getIndex();
    for (const entry of index) {
      const item = await pack.getDocument(entry._id);
      if (item.type === systemTypeFilter) {
        matchedItems.push(item.name);
      }
    }
  }

  return matchedItems;
}
