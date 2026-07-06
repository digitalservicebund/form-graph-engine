import * as z from "zod/v4";
const isObjectSchemaLike = (value) => "_zod" in value && "shape" in value;
/**
 * Normalizes a page schema into a compiled Zod type and extracts field names.
 * Handles both raw shapes and ZodObjects.
 */
export const normalizeSchema = (pageSchema) => {
    if (!pageSchema)
        return { compiledSchema: undefined, fieldNames: [] };
    const isZodObject = isObjectSchemaLike(pageSchema);
    const compiledSchema = isZodObject ? pageSchema : z.object(pageSchema);
    const fieldNames = Object.keys(compiledSchema._zod.def.shape);
    return { compiledSchema, fieldNames };
};
