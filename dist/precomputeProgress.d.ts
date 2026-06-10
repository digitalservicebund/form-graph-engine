import type { NodeKey, PageConfigMap, TransitionConfigMap } from "./types.ts";
/**
 * Pre-computes static progress metrics for the flow graph.
 * Used to estimate completion percentage and node depth.
 */
export declare const precomputeProgress: <C extends PageConfigMap>(router: TransitionConfigMap<C>, initialStep: NodeKey<C>) => {
    getProgress: (key: NodeKey<C>) => {
        max: number;
        progress: number;
    };
    isFinal: (key: NodeKey<C>) => boolean;
};
