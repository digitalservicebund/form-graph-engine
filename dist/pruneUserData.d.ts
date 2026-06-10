import type { CompiledFlow } from "./compileFlowConfig.ts";
import type { PageConfigMap, NodeKey, InferredUserData } from "./types.ts";
import type { PageData } from "./pageDataSchema.ts";
/**
 * Removes unreachable fields from user data based on reachability.
 * Keeps only data that is actually relevant to the current flow state.
 */
export declare const pruneUserData: <C extends PageConfigMap>(compiledFlow: CompiledFlow<C>, visitedContexts: Array<{
    key: NodeKey<C>;
    pageData: PageData;
    scopeData: Record<string, unknown>;
    arrayPath: string[];
}>, data: InferredUserData<C>) => InferredUserData<C>;
