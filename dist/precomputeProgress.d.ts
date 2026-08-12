import type { NodeKey, PageConfigMap, Progress, TransitionConfigMap } from "./types.ts";
/**
 * Pre-computes static progress metrics for the flow graph.
 * Used to estimate completion percentage and node depth.
 */
export declare const precomputeProgress: <C extends PageConfigMap>(router: TransitionConfigMap<C>, initialStep: NodeKey<C>) => {
    getProgress: (key: NodeKey<C>) => Progress;
    isFinal: (key: NodeKey<C>) => boolean;
};
