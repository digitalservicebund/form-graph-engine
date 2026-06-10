import z from "zod";
export type PageSchemaInfo = {
    compiledSchema: z.ZodTypeAny;
    fieldNames: string[];
};
/**
 * Normalizes a page schema into a compiled Zod type and extracts field names.
 * Handles both Zod types and raw shape objects.
 */
export declare const normalizeSchema: (schema?: z.ZodTypeAny | z.ZodRawShape) => PageSchemaInfo;
