import { extractEdges } from "./routing.js";
const getTransitions = (route) => {
    if (!route)
        return [];
    if (Array.isArray(route)) {
        return route.flatMap((t) => t.target !== null
            ? [{ target: t.target, isArray: t.type === "addArrayItem" }]
            : []);
    }
    return [{ target: route, isArray: false }];
};
/**
 * Pre-computes static progress metrics for the flow graph.
 * Used to estimate completion percentage and node depth.
 */
export const precomputeProgress = (router, initialStep) => {
    const nodeDepths = new Map();
    let maxOverallProgress = 0;
    const queue = [
        {
            node: initialStep,
            depth: 0,
            history: new Set([initialStep]),
            isLocked: false,
        },
    ];
    while (queue.length > 0) {
        const { node, depth, history, isLocked } = queue.shift();
        const existingDepth = nodeDepths.get(node) ?? -1;
        if (depth > existingDepth) {
            nodeDepths.set(node, depth);
            if (depth > maxOverallProgress) {
                maxOverallProgress = depth;
            }
            for (const t of getTransitions(router[node])) {
                if (!history.has(t.target)) {
                    const nextLocked = isLocked || t.isArray;
                    const nextDepth = nextLocked ? depth : depth + 1;
                    queue.push({
                        node: t.target,
                        depth: nextDepth,
                        history: new Set(history).add(t.target),
                        isLocked: nextLocked,
                    });
                }
            }
        }
    }
    const isFinal = (key) => extractEdges(router[key]).length === 0;
    const max = 100;
    // Steps are 1-based counts, so a flow of max depth N has N + 1 steps.
    const totalSteps = maxOverallProgress + 1;
    return {
        getProgress: (key) => {
            if (maxOverallProgress === 0 || isFinal(key))
                return {
                    max,
                    progress: max,
                    steps: { total: totalSteps, current: totalSteps },
                };
            const depth = nodeDepths.get(key) ?? 0;
            const progress = Math.min((depth / maxOverallProgress) * max, 99);
            return {
                max,
                progress,
                steps: { total: totalSteps, current: depth + 1 },
            };
        },
        isFinal,
    };
};
