import type { TransitionConfig } from "./types.ts";
/**
 * Evaluates a route definition against user data to determine the next target.
 * Guards are checked in order; first matching branch wins.
 */
export declare const evaluateRoute: <FlowKey, UserData>(route: TransitionConfig<FlowKey, UserData> | undefined, data: UserData, traverseArrays?: boolean) => FlowKey | null;
/**
 * Extracts all possible target edges from a route definition.
 * Used for static analysis and reachability computations.
 */
export declare const extractEdges: <FlowKey, UserData>(route?: TransitionConfig<FlowKey, UserData>) => FlowKey[];
/**
 * Evaluates all reachable branches from a route definition.
 * Returns nodes that could be reached under any valid data state.
 */
export declare const evaluateAllBranches: <FlowKey, UserData>(route: TransitionConfig<FlowKey, UserData> | undefined, data: UserData, options?: {
    excludeArrayTransitions?: boolean;
}) => FlowKey[];
