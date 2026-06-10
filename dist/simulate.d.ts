import type { NodeKey, PageConfigMap, TransitionConfigMap, InferredUserData } from "./types.ts";
import type { PageData } from "./pageDataSchema.ts";
type SimulationResult = {
    path: string[];
    reachableSet: Set<string>;
    isComplete: boolean;
};
/**
 * Simulates the flow to compute reachable nodes, visited contexts, and completion status.
 * Builds the parent map for back navigation (BFS-based).
 */
export declare const simulate: <C extends PageConfigMap>(router: TransitionConfigMap<C>, initialStep: NodeKey<C>, userData: InferredUserData<C>, arrayInfoCache?: Partial<Record<NodeKey<C>, {
    name: string;
}>>) => SimulationResult & {
    parentMap: Map<NodeKey<C>, NodeKey<C>>;
    visitedContexts: Array<{
        key: NodeKey<C>;
        pageData: PageData;
        scopeData: Record<string, unknown>;
        arrayPath: string[];
    }>;
};
export {};
