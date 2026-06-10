import type { NodeKey, PageConfigMap, TransitionConfigMap } from "./types.ts";
/**
 * Compiles a flow configuration into an optimized, executable form.
 * Performs static analysis, path mapping, and caches computed properties.
 */
export declare const compileFlowConfig: <C extends PageConfigMap>({ pages, initialStep, transitions, }: {
    pages: C;
    initialStep: NodeKey<C>;
    transitions: TransitionConfigMap<C>;
}) => {
    pages: C;
    transitions: TransitionConfigMap<C>;
    initialStep: NodeKey<C>;
    initialPath: string;
    getArrayInfo: (path: string) => Partial<Record<Extract<keyof C, string>, import("./arrays.ts").ArrayInfo<C>>>[Extract<keyof C, string>] | undefined;
    getSchema: (path: string) => import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>> | undefined;
    getFieldNames: (path: string) => string[];
    getFieldNamesByNodeKey: (nodeKey: NodeKey<C>) => string[];
    arrayInfoCache: Partial<Record<Extract<keyof C, string>, import("./arrays.ts").ArrayInfo<C>>>;
    getNodeKeyFromPath: (path: string) => Extract<keyof C, string> | undefined;
    getPathFromNodeKey: (nodeKey?: NodeKey<C>) => string | undefined;
    isFinal: (path: string) => boolean | undefined;
    getProgress: (path: string) => {
        max: number;
        progress: number;
    } | undefined;
};
export type CompiledFlow<C extends PageConfigMap> = ReturnType<typeof compileFlowConfig<C>>;
