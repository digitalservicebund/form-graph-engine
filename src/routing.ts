import type { TransitionConfig } from "./types.ts";

/**
 * Evaluates a route definition against user data to determine the next target.
 * Guards are checked in order; first matching branch wins.
 */
export const evaluateRoute = <FlowKey, UserData>(
  route: TransitionConfig<FlowKey, UserData> | undefined,
  data: UserData,
  traverseArrays = false,
): FlowKey | null => {
  if (!route) return null;
  if (typeof route === "string") return route;
  if (Array.isArray(route)) {
    for (const transition of route) {
      const isArrayTransition = transition.type === "addArrayItem";
      if (traverseArrays && isArrayTransition) return transition.target;
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
export const extractEdges = <FlowKey, UserData>(
  route?: TransitionConfig<FlowKey, UserData>,
): FlowKey[] => {
  if (!route) return [];
  if (Array.isArray(route)) {
    const edges: FlowKey[] = [];
    for (const transition of route) {
      if (transition.target) edges.push(transition.target);
    }
    return edges;
  }
  return [route];
};

/**
 * Evaluates all reachable branches from a route definition.
 * Returns nodes that could be reached under any valid data state.
 */
export const evaluateAllBranches = <FlowKey, UserData>(
  route: TransitionConfig<FlowKey, UserData> | undefined,
  data: UserData,
  options?: { excludeArrayTransitions?: boolean },
): FlowKey[] => {
  if (!route) return [];
  if (typeof route === "string") return [route];

  if (Array.isArray(route)) {
    const branches: FlowKey[] = [];
    for (const transition of route) {
      if (
        options?.excludeArrayTransitions &&
        transition.type === "addArrayItem"
      )
        continue;
      // Evaluate all guards. If there is no guard, or it passes, it is a valid branch.
      if (!transition.guard || transition.guard(data)) {
        if (transition.target) branches.push(transition.target);
      }
    }
    return branches;
  }
  return [];
};
