import z from "zod";
const isSchemaLike = (value) => {
    if (!value || typeof value !== "object")
        return false;
    const candidate = value;
    return (typeof candidate.parse === "function" &&
        typeof candidate.safeParse === "function");
};
const isRawShapeLike = (value) => {
    if (!value || typeof value !== "object")
        return false;
    return Object.values(value).every(isSchemaLike);
};
const extractFieldNames = (schema) => {
    const candidate = schema;
    if (candidate.shape &&
        typeof candidate.shape === "object" &&
        !Array.isArray(candidate.shape)) {
        return Object.keys(candidate.shape);
    }
    if (typeof candidate.innerType === "function") {
        const inner = candidate.innerType();
        if (isSchemaLike(inner)) {
            return extractFieldNames(inner);
        }
    }
    return [];
};
/**
 * Normalizes a page schema into a compiled Zod type and extracts field names.
 * Handles both Zod types and raw shape objects.
 */
export const normalizeSchema = (pageSchema) => {
    if (!pageSchema)
        return { compiledSchema: z.object({}), fieldNames: [] };
    if (isRawShapeLike(pageSchema)) {
        return {
            // Cast keeps this adapter compatible across Zod v4+ internals.
            compiledSchema: z.object(pageSchema),
            fieldNames: Object.keys(pageSchema),
        };
    }
    if (isSchemaLike(pageSchema)) {
        return {
            compiledSchema: pageSchema,
            fieldNames: extractFieldNames(pageSchema),
        };
    }
    throw new Error("Invalid pageSchema: expected Zod schema or raw shape");
};
