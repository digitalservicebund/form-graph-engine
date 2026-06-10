import type { NodeKey, PageConfigMap, TransitionConfigMap } from "./types.ts";
export declare const precomputeProgress: <C extends PageConfigMap>(router: TransitionConfigMap<C>, initialStep: NodeKey<C>) => {
    getProgress: (key: NodeKey<C>) => {
        max: number;
        progress: number;
    };
    isFinal: (key: NodeKey<C>) => boolean;
};
//# sourceMappingURL=precomputeProgress.d.ts.map