import type { CompiledFlow } from "./compileFlowConfig.ts";
import type { InferredUserData, NodeKey, PageConfigMap, TransitionConfig } from "./types.ts";
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
export declare const evaluateAllBranches: <FlowKey, UserData>(route: TransitionConfig<FlowKey, UserData> | undefined, data: UserData) => FlowKey[];
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
export declare const findNextIncompleteNode: <C extends PageConfigMap>(compiledFlow: CompiledFlow<C>, guardData: InferredUserData<C> & {
    pageData?: {
        arrayIndexes: number[];
    };
}, currentNodeKey: NodeKey<C>) => NodeKey<C> | null;
