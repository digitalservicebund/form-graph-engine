export type PageData = {
    arrayIndexes?: number[] | undefined;
};
/** Returns the first array index from pageData, if present. */
export declare function firstArrayIndex(pageData?: PageData): number | undefined;
export declare function isValidArrayIndex(array: unknown[] | undefined, pageData?: PageData): boolean;
