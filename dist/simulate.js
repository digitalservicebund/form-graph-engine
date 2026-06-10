import { evaluateAllBranches, evaluateRoute, extractEdges } from "./routing.js";
const createEdgeTracker = () => {
    const edges = new Map();
    return {
        has: (from, to) => edges.get(from)?.has(to) ?? false,
        add: (from, to) => {
            if (!edges.has(from))
                edges.set(from, new Set());
            edges.get(from).add(to);
        },
    };
};
/**
 * Simulates the flow to compute reachable nodes, visited contexts, and completion status.
 * Builds the parent map for back navigation (BFS-based).
 */
export const simulate = (router, initialStep, userData, arrayInfoCache = {}) => {
    const rootPageData = { arrayIndexes: [] };
    const rootGuardData = { ...userData, pageData: rootPageData };
    // Pass 1: Edge-Tracking Linear Evaluation
    const path = [];
    let currentLinear = initialStep;
    const visitedEdges = createEdgeTracker();
    let isComplete = false;
    while (currentLinear) {
        path.push(currentLinear);
        const route = router[currentLinear];
        let next = evaluateRoute(route, rootGuardData, true);
        if (next && visitedEdges.has(currentLinear, next)) {
            const branches = evaluateAllBranches(route, rootGuardData);
            next = branches.find((b) => !visitedEdges.has(currentLinear, b)) || null;
        }
        if (!next) {
            if (extractEdges(route).length === 0)
                isComplete = true;
            break;
        }
        visitedEdges.add(currentLinear, next);
        currentLinear = next;
    }
    const reachableSet = new Set();
    const parentMap = new Map();
    const visitedSet = new Set(); // "${key}:${arrayIndexes}"
    const visitedContexts = [];
    const queue = [
        {
            key: initialStep,
            pageData: rootPageData,
            scopeData: userData,
            arrayPath: [],
        },
    ];
    while (queue.length > 0) {
        const { key: current, pageData, scopeData, arrayPath } = queue.shift();
        const visitId = `${current}:${(pageData.arrayIndexes ?? []).join(",")}`;
        if (visitedSet.has(visitId))
            continue;
        visitedSet.add(visitId);
        reachableSet.add(current);
        visitedContexts.push({ key: current, pageData, scopeData, arrayPath });
        const route = router[current];
        const itemData = { ...userData, pageData };
        // Regular (non-array) branches — propagate the current scope unchanged.
        for (const branch of evaluateAllBranches(route, itemData, {
            excludeArrayTransitions: true,
        })) {
            if (!parentMap.has(branch))
                parentMap.set(branch, current);
            queue.push({ key: branch, pageData, scopeData, arrayPath });
        }
        // Array branches: fan out once per item. scopeData is narrowed to the
        // specific array item so nested arrays can be counted and pruned correctly.
        if (Array.isArray(route)) {
            const addTransition = route.find((t) => t?.type === "addArrayItem");
            if (addTransition?.target != null) {
                const arrayInfo = arrayInfoCache[current];
                if (arrayInfo) {
                    const items = scopeData[arrayInfo.name];
                    const count = Array.isArray(items) ? items.length : 0;
                    for (let i = 0; i < count; i++) {
                        const itemScopeData = (Array.isArray(items) ? items[i] : {});
                        const itemPageData = {
                            arrayIndexes: [...(pageData.arrayIndexes ?? []), i],
                        };
                        if (!parentMap.has(addTransition.target))
                            parentMap.set(addTransition.target, current);
                        queue.push({
                            key: addTransition.target,
                            pageData: itemPageData,
                            scopeData: itemScopeData,
                            arrayPath: [...arrayPath, arrayInfo.name],
                        });
                    }
                }
            }
        }
    }
    return { path, isComplete, reachableSet, parentMap, visitedContexts };
};
