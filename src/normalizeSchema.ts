import z from "zod";

export type PageSchemaInfo = {
  compiledSchema: z.ZodTypeAny;
  fieldNames: string[];
};

/**
 * Normalizes a page schema into a compiled Zod type and extracts field names.
 * Handles both Zod types and raw shape objects.
 */
export const normalizeSchema = (
  schema?: z.ZodTypeAny | z.ZodRawShape,
): PageSchemaInfo => {
  if (!schema) return { compiledSchema: z.object({}), fieldNames: [] };

  if (!(schema instanceof z.ZodType)) {
    return {
      compiledSchema: z.object(schema),
      fieldNames: Object.keys(schema),
    };
  }

  let fieldNames: string[] = [];
  if (schema instanceof z.ZodObject) {
    fieldNames = Object.keys(schema.shape);
  } else if ("innerType" in schema && typeof schema.innerType === "function") {
    // Handles simple ZodEffects (.refine) wrapping an object
    const inner = schema.innerType();
    if (inner instanceof z.ZodObject) {
      fieldNames = Object.keys(inner.shape);
    }
  }

  return { compiledSchema: schema, fieldNames };
};
