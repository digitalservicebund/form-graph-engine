// The "#" wildcard used in array paths (e.g. "/kinder/#/daten").
export const ARRAY_WILDCARD = "#";
const INTEGER_SEGMENT = /^\d+$/;
export const parseCurrentPath = (currentPath) => {
    const arrayIndexes = [];
    const normalizedSegments = currentPath.split("/").map((segment) => {
        if (!INTEGER_SEGMENT.test(segment))
            return segment;
        arrayIndexes.push(Number(segment));
        return ARRAY_WILDCARD;
    });
    return {
        normalizedPath: normalizedSegments.join("/"),
        currentPageData: { arrayIndexes },
    };
};
/**
 * Extracts the entry point path segment for array items from route configuration.
 * Returns the path segment after the wildcard in an array route.
 */
export const getArrayEntryPoint = (routes, pages) => {
    if (!Array.isArray(routes))
        return undefined;
    const addTransition = routes.find((route) => route?.type === "addArrayItem");
    if (!addTransition?.target)
        return undefined;
    const targetPage = pages[addTransition.target];
    if (!targetPage)
        return undefined;
    return targetPage.path.split(ARRAY_WILDCARD).at(-1)?.slice(1);
};
/**
 * Builds cache of array metadata indexed by node key.
 * Extracts array names, entry points, and entry node keys from page config.
 */
export const buildArrayInfoCache = (pages, transitions) => {
    const cache = {};
    for (const [key, pageNode] of Object.entries(pages)) {
        const nodeKey = key;
        if (!pageNode.arraySummary)
            continue;
        const arrayTransitions = transitions[nodeKey];
        const addTransition = Array.isArray(arrayTransitions)
            ? arrayTransitions.find((t) => t?.type === "addArrayItem")
            : undefined;
        const arrayInfo = { name: pageNode.arraySummary.name };
        const entryPoint = getArrayEntryPoint(arrayTransitions, pages);
        if (entryPoint !== undefined) {
            arrayInfo.entryPoint = entryPoint;
        }
        if (addTransition?.target != null) {
            arrayInfo.entryNodeKey = addTransition.target;
        }
        cache[nodeKey] = arrayInfo;
    }
    return cache;
};
