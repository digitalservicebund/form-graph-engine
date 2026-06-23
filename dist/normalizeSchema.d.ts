import { type ObjectSchemaLike, type PageSchema } from "./types.ts";
export type PageSchemaInfo = {
    compiledSchema: ObjectSchemaLike | undefined;
    fieldNames: string[];
};
/**
 * Normalizes a page schema into a compiled Zod type and extracts field names.
 * Handles both raw shapes and ZodObjects.
 */
export declare const normalizeSchema: (pageSchema?: PageSchema) => PageSchemaInfo;
