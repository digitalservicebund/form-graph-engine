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
const isPageCompleted = (compiledFlow, userData, nodeKey) => {
    const nodePath = compiledFlow.getPathFromNodeKey(nodeKey);
    if (!nodePath)
        return false;
    const fieldNames = compiledFlow.getFieldNames(nodePath);
    const fieldNameSet = new Set(fieldNames.map(String));
    // Schema-less pages stay visitable. Stateless session cannot infer prior visits.
    if (fieldNames.length === 0)
        return false;
    const schema = compiledFlow.getSchema(nodePath);
    if (!schema)
        return false;
    const pageData = Object.fromEntries(Object.entries(userData).filter(([key]) => fieldNameSet.has(key)));
    return schema.safeParse(pageData).success;
};
export const findNextIncompleteNode = (compiledFlow, guardData, currentNodeKey) => {
    const getNextNode = (nodeKey, pageData) => evaluateRoute(compiledFlow.transitions[nodeKey], {
        ...guardData,
        pageData,
    });
    const visited = new Set();
    let current = getNextNode(currentNodeKey, guardData.pageData);
    let lastNode = null;
    let lastIncompleteNode = null;
    while (current) {
        if (visited.has(current))
            break;
        visited.add(current);
        lastNode = current;
        const nodePath = compiledFlow.getPathFromNodeKey(current);
        const hasFieldSchema = nodePath != null && compiledFlow.getFieldNames(nodePath).length > 0;
        if (hasFieldSchema && !isPageCompleted(compiledFlow, guardData, current)) {
            lastIncompleteNode = current;
        }
        current = getNextNode(current, { arrayIndexes: [] });
    }
    return lastIncompleteNode ?? lastNode;
};
