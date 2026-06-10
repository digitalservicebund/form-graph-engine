import type { NodeKey, PageConfigMap, TransitionConfigMap } from "./types.ts";
type Options<C extends PageConfigMap> = {
    pages: C;
    initialStep: NodeKey<C>;
    transitions: TransitionConfigMap<C>;
};
export declare const compileFlowConfig: <C extends PageConfigMap>({ pages, initialStep, transitions, }: Options<C>) => {
    pages: C;
    transitions: TransitionConfigMap<C>;
    initialStep: Extract<keyof C, string>;
    initialPath: string;
    getArrayInfo: (path: string) => Partial<Record<NodeKey<C>, {
        name: string;
        entryPoint?: string;
        entryNodeKey?: NodeKey<C>;
    }>>[NodeKey<C>] | undefined;
    getSchema: (path: string) => import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>> | undefined;
    getFieldNames: (path: string) => string[];
    getFieldNamesByNodeKey: (nodeKey: NodeKey<C>) => string[];
    getArrayInfoByNodeKey: (nodeKey: NodeKey<C>) => Partial<Record<NodeKey<C>, {
        name: string;
        entryPoint?: string;
        entryNodeKey?: NodeKey<C>;
    }>>[NodeKey<C>];
    getNodeKeyFromPath: (path: string) => NodeKey<C> | undefined;
    getPathFromNodeKey: (nodeKey?: NodeKey<C>) => string | undefined;
    isFinal: (path: string) => boolean | undefined;
    getProgress: (path: string) => {
        max: number;
        progress: number;
    } | undefined;
};
export type CompiledFlow<C extends PageConfigMap> = ReturnType<typeof compileFlowConfig<C>>;
export {};
//# sourceMappingURL=compileFlowConfig.d.ts.map