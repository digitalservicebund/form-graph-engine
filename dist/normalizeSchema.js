import z from "zod";
const isObjectSchemaLike = (value) => "shape" in value && typeof value.parse === "function";
/**
 * Normalizes a page schema into a compiled Zod type and extracts field names.
 * Handles both raw shapes and ZodObjects.
 */
export const normalizeSchema = (pageSchema) => {
    if (!pageSchema)
        return { compiledSchema: z.object({}), fieldNames: [] };
    const isZodObject = isObjectSchemaLike(pageSchema);
    const compiledSchema = isZodObject ? pageSchema : z.object(pageSchema);
    const fieldNames = Object.keys(isZodObject ? pageSchema.shape : pageSchema);
    return { compiledSchema, fieldNames };
};
