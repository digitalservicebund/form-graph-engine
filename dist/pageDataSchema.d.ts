import { z } from "zod";
export declare const pageDataSchema: z.ZodObject<{
    arrayIndexes: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
}, z.core.$strip>;
export type PageData = z.infer<typeof pageDataSchema>;
/** Returns the first array index from pageData, if present. */
export declare function firstArrayIndex(pageData?: PageData): number | undefined;
export declare function isValidArrayIndex(array: unknown[] | undefined, pageData?: PageData): boolean;
