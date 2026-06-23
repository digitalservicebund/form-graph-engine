import { buildArrayInfoCache } from "./arrays.js";
import { normalizeSchema } from "./normalizeSchema.js";
import { precomputeProgress } from "./precomputeProgress.js";
import { validatePagePaths } from "./validatePageConfig.js";
const buildPathAndSchemaMaps = (pages) => {
    const pathMap = {};
    const pageSchemaInfoCache = {};
    for (const [key, pageNode] of Object.entries(pages)) {
        const nodeKey = key;
        pathMap[pageNode.path] = nodeKey;
        pageSchemaInfoCache[nodeKey] = normalizeSchema(pageNode.pageSchema);
    }
    return { pathMap, pageSchemaInfoCache };
};
/**
 * Compiles a flow configuration into an optimized, executable form.
 * Performs static analysis, path mapping, and caches computed properties.
 */
export const compileFlowConfig = ({ pages, initialStep, transitions, }) => {
    validatePagePaths(pages);
    const { pathMap, pageSchemaInfoCache } = buildPathAndSchemaMaps(pages);
    const arrayInfoCache = buildArrayInfoCache(pages, transitions);
    const graphStats = precomputeProgress(transitions, initialStep);
    const getNodeKeyFromPath = (path) => pathMap[path];
    const getPageByNodeKey = (nodeKey) => {
        const page = pages[nodeKey];
        if (!page) {
            throw new Error(`Missing page config for node key: "${String(nodeKey)}"`);
        }
        return page;
    };
    const getPathFromNodeKey = (nodeKey) => {
        if (nodeKey == null)
            return undefined;
        return getPageByNodeKey(nodeKey).path;
    };
    function getSchema(path) {
        const nodeKey = pathMap[path];
        return nodeKey ? pageSchemaInfoCache[nodeKey]?.compiledSchema : undefined;
    }
    function getFieldNames(path) {
        const nodeKey = pathMap[path];
        return nodeKey ? (pageSchemaInfoCache[nodeKey]?.fieldNames ?? []) : [];
    }
    function getFieldNamesByNodeKey(nodeKey) {
        return pageSchemaInfoCache[nodeKey]?.fieldNames ?? [];
    }
    return {
        pages,
        transitions,
        initialStep,
        initialPath: getPageByNodeKey(initialStep).path,
        getArrayInfo: (path) => {
            const nodeKey = pathMap[path];
            return nodeKey ? arrayInfoCache[nodeKey] : undefined;
        },
        getSchema,
        getFieldNames,
        getFieldNamesByNodeKey,
        arrayInfoCache,
        getNodeKeyFromPath,
        getPathFromNodeKey,
        isFinal: (path) => {
            const nodeKey = getNodeKeyFromPath(path);
            return nodeKey != null ? graphStats.isFinal(nodeKey) : undefined;
        },
        getProgress: (path) => {
            const nodeKey = getNodeKeyFromPath(path);
            return nodeKey != null ? graphStats.getProgress(nodeKey) : undefined;
        },
        progressByKey: (nodeKey) => graphStats.getProgress(nodeKey),
    };
};
