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
export const evaluateAllBranches = (route, data) => {
    if (!route)
        return [];
    if (typeof route === "string")
        return [route];
    if (!Array.isArray(route))
        return [];
    const branches = [];
    for (const transition of route) {
        // Evaluate all guards. If there is no guard, or it passes, it is a valid branch.
        if (!transition.guard || transition.guard(data)) {
            if (transition.target)
                branches.push(transition.target);
        }
    }
    return branches;
};
/**
 * Finds the next incomplete node in a flow, navigating through pages in order.
 *
 * Traverses the flow graph from the current node and returns:
 * 1. The first incomplete schema page encountered
 * 2. If schema-less (non-input) pages precede an incomplete page, returns the earliest one
 * 3. If the flow ends with schema-less pages, returns the earliest one
 *
 * This ensures users navigate through information/display pages rather than skipping them.
 */
export const findNextIncompleteNode = (compiledFlow, guardData, currentNodeKey) => {
    const getNextNode = (nodeKey, pageData) => evaluateRoute(compiledFlow.transitions[nodeKey], {
        ...guardData,
        pageData,
    });
    const visited = new Set();
    let current = getNextNode(currentNodeKey, guardData.pageData ?? { arrayIndexes: [] });
    let lastNode = null;
    let earliestSchemaLessNode = null;
    while (current) {
        if (visited.has(current))
            break;
        visited.add(current);
        lastNode = current;
        const pageSchema = compiledFlow.getSchemaFromNodeKey(current);
        if (pageSchema &&
            ((pageSchema.safeEncode && pageSchema.safeEncode(guardData).success) ||
                pageSchema.safeParse(guardData).success)) {
            // Completed form page: reset tracking
            earliestSchemaLessNode = null;
        }
        else if (pageSchema) {
            // Incomplete form page: return earliest schema-less before it, or this incomplete page
            return earliestSchemaLessNode ?? current;
        }
        else if (!pageSchema && !earliestSchemaLessNode) {
            // Schema-less page: track the earliest one
            earliestSchemaLessNode = current;
        }
        current = getNextNode(current, { arrayIndexes: [] });
    }
    // If flow ends with schema-less pages, return the earliest one
    return earliestSchemaLessNode ?? lastNode;
};
