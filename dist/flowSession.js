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
    const nextNodeKey = evaluateRoute(compiledFlow.transitions[nodeKey], {
        ...userData,
        pageData: currentPageData,
    }) ?? undefined;
    return {
        nodeKey,
        pageSchema: compiledFlow.getSchema(normalizedPath),
        fieldNames: compiledFlow.getFieldNames(normalizedPath),
        initialPath: compiledFlow.initialPath,
        arrayInfo: compiledFlow.getArrayInfo(normalizedPath),
        path: simulation.path,
        isComplete: simulation.isComplete,
        statusTree: buildStatusTree(compiledFlow.pages, simulation),
        prunedUserData: pruneUserData(compiledFlow, simulation.visitedContexts, userData),
        isReachable: (targetPath) => {
            const key = compiledFlow.getNodeKeyFromPath(targetPath);
            return key != null && simulation.reachableSet.has(key);
        },
        nextPath: compiledFlow.getPathFromNodeKey(nextNodeKey),
        prevPath: compiledFlow.getPathFromNodeKey(prevNodeKey),
    };
};
