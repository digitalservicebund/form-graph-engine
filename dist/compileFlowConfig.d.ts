import type { FieldNameForNodeKey, FieldNameForPath, NodeKey, PageConfigMap, SchemaForPath, TransitionConfigMap } from "./types.ts";
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
    getSchema: <P extends string>(path: P) => SchemaForPath<C, P>;
    getSchemaFromNodeKey: (nodeKey: NodeKey<C>) => import("./types.ts").ObjectSchemaLike | undefined;
    getFieldNames: <P extends string>(path: P) => Array<FieldNameForPath<C, P>>;
    getFieldNamesByNodeKey: <K extends NodeKey<C>>(nodeKey: K) => Array<FieldNameForNodeKey<C, K>>;
    arrayInfoCache: Partial<Record<Extract<keyof C, string>, import("./arrays.ts").ArrayInfo<C>>>;
    getNodeKeyFromPath: (path: string) => Extract<keyof C, string> | undefined;
    getPathFromNodeKey: (nodeKey?: NodeKey<C>) => string | undefined;
    isFinal: (path: string) => boolean | undefined;
    getProgress: (path: string) => {
        max: number;
        progress: number;
    } | undefined;
    progressByKey: (nodeKey: NodeKey<C>) => {
        max: number;
        progress: number;
    };
};
export type CompiledFlow<C extends PageConfigMap> = ReturnType<typeof compileFlowConfig<C>>;
