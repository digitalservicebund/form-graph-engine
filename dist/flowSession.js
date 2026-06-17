import { simulate } from "./simulate.js";
import { evaluateRoute } from "./routing.js";
import { buildStatusTree } from "./statusTree.js";
import { pruneUserData } from "./pruneUserData.js";
import { parseCurrentPath } from "./arrays.js";
const getCurrentNode = (compiledFlow, currentPath) => {
    const { normalizedPath, currentPageData } = parseCurrentPath(currentPath);
    const nodeKey = compiledFlow.getNodeKeyFromPath(normalizedPath);
    return { nodeKey, normalizedPath, currentPageData };
};
/**
 * Creates a session for the current step in a flow.
 * Resolves navigation, schemas, and status based on current user data and path.
 */
export const createFlowSession = (compiledFlow, userData, currentPath) => {
    const { nodeKey, normalizedPath, currentPageData } = getCurrentNode(compiledFlow, currentPath);
    if (!nodeKey)
        throw new Error(`Invalid path: ${currentPath}`);
    const simulation = simulate(compiledFlow.transitions, compiledFlow.initialStep, userData, compiledFlow.arrayInfoCache);
    // Prev: The BFS parent guarantees a direct, chronological Back step.
    const prevNodeKey = simulation.parentMap.get(nodeKey);
    // Next: evaluateRoute skips addArrayItem transitions to find the next main-branch step.
    const currentTransition = compiledFlow.transitions[nodeKey];
    const nextNodeKey = evaluateRoute(currentTransition, {
        ...userData,
        pageData: currentPageData,
    });
    const prunedUserData = pruneUserData(compiledFlow, simulation.visitedContexts, userData);
    const fieldNames = compiledFlow.getFieldNames(normalizedPath);
    const pageData = Object.fromEntries(Object.entries(prunedUserData).filter(([key, _]) => fieldNames.includes(key)));
    return {
        nodeKey,
        pageSchema: compiledFlow.getSchema(normalizedPath),
        pageData,
        fieldNames,
        initialPath: compiledFlow.initialPath,
        arrayInfo: compiledFlow.getArrayInfo(normalizedPath),
        path: simulation.path,
        isComplete: simulation.isComplete,
        statusTree: buildStatusTree(compiledFlow.pages, simulation),
        prunedUserData,
        isReachable: (targetPath) => {
            const key = compiledFlow.getNodeKeyFromPath(targetPath);
            return key != null && simulation.reachableSet.has(key);
        },
        nextPath: compiledFlow.getPathFromNodeKey(nextNodeKey ?? undefined),
        prevPath: compiledFlow.getPathFromNodeKey(prevNodeKey),
        advanceWithNewData: (newUserData) => {
            const mergedUserData = { ...userData, ...newUserData };
            const nextNodeKey = evaluateRoute(currentTransition, {
                ...mergedUserData,
                pageData: currentPageData,
            });
            return compiledFlow.getPathFromNodeKey(nextNodeKey ?? undefined);
        },
    };
};
