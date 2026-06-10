import type { NodeKey, PageConfigMap, TransitionConfigMap } from "./types.ts";
export declare const ARRAY_WILDCARD = "#";
export declare const parseCurrentPath: (currentPath: string) => {
    normalizedPath: string;
    currentPageData: {
        arrayIndexes: number[];
    };
};
/**
 * Extracts the entry point path segment for array items from route configuration.
 * Returns the path segment after the wildcard in an array route.
 */
export declare const getArrayEntryPoint: <C extends PageConfigMap>(routes: TransitionConfigMap<C>[NodeKey<C>], pages: C) => string | undefined;
export type ArrayInfo<C extends PageConfigMap> = {
    name: string;
    entryPoint?: string;
    entryNodeKey?: NodeKey<C>;
};
export type ArrayInfoCache<C extends PageConfigMap> = Partial<Record<NodeKey<C>, ArrayInfo<C>>>;
/**
 * Builds cache of array metadata indexed by node key.
 * Extracts array names, entry points, and entry node keys from page config.
 */
export declare const buildArrayInfoCache: <C extends PageConfigMap>(pages: C, transitions: TransitionConfigMap<C>) => ArrayInfoCache<C>;
