/**
 * Evaluates a route definition against user data to determine the next target.
 * Guards are checked in order; first matching branch wins.
 */
export const evaluateRoute = (route, data, traverseArrays = false) => {
    if (!route)
        return null;
    if (typeof route === "string")
        return route;
    if (Array.isArray(route)) {
        for (const transition of route) {
            const isArrayTransition = transition.type === "addArrayItem";
            if (traverseArrays && isArrayTransition)
                return transition.target;
            if (!isArrayTransition && (!transition.guard || transition.guard(data))) {
                return transition.target;
            }
        }
    }
    return null;
};
/**
 * Extracts all possible target edges from a route definition.
 * Used for static analysis and reachability computations.
 */
export const extractEdges = (route) => {
    if (!route)
        return [];
    if (Array.isArray(route)) {
        const edges = [];
        for (const transition of route) {
            if (transition.target)
                edges.push(transition.target);
        }
        return edges;
    }
    return [route];
};
/**
 * Evaluates all reachable branches from a route definition.
 * Returns nodes that could be reached under any valid data state.
 */
export const evaluateAllBranches = (route, data, options) => {
    if (!route)
        return [];
    if (typeof route === "string")
        return [route];
    if (Array.isArray(route)) {
        const branches = [];
        for (const transition of route) {
            if (options?.excludeArrayTransitions &&
                transition.type === "addArrayItem")
                continue;
            // Evaluate all guards. If there is no guard, or it passes, it is a valid branch.
            if (!transition.guard || transition.guard(data)) {
                if (transition.target)
                    branches.push(transition.target);
            }
        }
        return branches;
    }
    return [];
};
export const findNextIncompleteNode = (compiledFlow, guardData, currentNodeKey) => {
    const getNextNode = (nodeKey, pageData) => evaluateRoute(compiledFlow.transitions[nodeKey], {
        ...guardData,
        pageData,
    });
    const visited = new Set();
    let current = getNextNode(currentNodeKey, guardData.pageData ?? { arrayIndexes: [] });
    let lastNode = null;
    let earliestSchemaLessBeforeIncomplete = null;
    while (current) {
        if (visited.has(current))
            break;
        visited.add(current);
        lastNode = current;
        const pageSchema = compiledFlow.getSchemaFromNodeKey(current);
        if (pageSchema && pageSchema.safeParse(guardData).success) {
            earliestSchemaLessBeforeIncomplete = null;
        }
        else if (pageSchema) {
            return earliestSchemaLessBeforeIncomplete ?? current;
        }
        else if (!pageSchema && !earliestSchemaLessBeforeIncomplete) {
            earliestSchemaLessBeforeIncomplete = current;
        }
        current = getNextNode(current, { arrayIndexes: [] });
    }
    return lastNode;
};
