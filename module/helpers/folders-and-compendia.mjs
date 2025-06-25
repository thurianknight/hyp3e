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

        const index = await pack.getIndex({ fields: ["name", "type", "folder"] });
        console.log(`Searching pack: ${pack.collection}:`, index);
        for (const entry of index) {
            // Check item type
            if (entry.type !== itemTypeFilter) continue;

            // This section checks to see if the folder name also matches the include/exclude criteria
            const folderId = entry.folder;
            let folderName = null;
            if (folderId) {
                // Try to get folder from compendium metadata
                const fullDoc = await pack.getDocument(entry._id);
                folderName = fullDoc.folder?.name ?? null;
                console.log(`Found folder name: ${folderName} for item ${entry.name} in pack ${pack.collection}`);
            }
            // Apply folder name filters
            if (folderName) {
                if (!shouldInclude(folderName) || shouldExclude(folderName)) continue;
            }

            // All checks passed, include the item
            const item = await pack.getDocument(entry._id);
            matchedItems.push(item.name);
        }
    }

    // Sort alphabetically & return the results
    matchedItems.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return matchedItems;
}
