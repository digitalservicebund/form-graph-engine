import { type PageSchema, type ZodSchemaLike } from "./types.ts";
export type PageSchemaInfo = {
    compiledSchema: ZodSchemaLike;
    fieldNames: string[];
};
/**
 * Normalizes a page schema into a compiled Zod type and extracts field names.
 * Handles both Zod types and raw shape objects.
 */
export declare const normalizeSchema: (pageSchema?: PageSchema) => PageSchemaInfo;
