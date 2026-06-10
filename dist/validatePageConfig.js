/**
 * Validates that all page paths start with "/" as required.
 */
export const validatePagePaths = (pages) => {
    for (const [key, pageNode] of Object.entries(pages)) {
        const nodeKey = key;
        if (!pageNode.path.startsWith("/")) {
            throw new Error(`path must start with "/": "${pageNode.path}" (nodeKey: "${String(nodeKey)}")`);
        }
    }
};
