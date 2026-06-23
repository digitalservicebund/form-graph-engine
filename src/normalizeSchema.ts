import z from "zod";
import { type ObjectSchemaLike, type PageSchema } from "./types.ts";

export type PageSchemaInfo = {
  compiledSchema: ObjectSchemaLike;
  fieldNames: string[];
};

const isObjectSchemaLike = (value: PageSchema): value is ObjectSchemaLike =>
  "shape" in value && typeof value.parse === "function";

/**
 * Normalizes a page schema into a compiled Zod type and extracts field names.
 * Handles both raw shapes and ZodObjects.
 */
export const normalizeSchema = (pageSchema?: PageSchema): PageSchemaInfo => {
  if (!pageSchema) return { compiledSchema: z.object({}), fieldNames: [] };
  const isZodObject = isObjectSchemaLike(pageSchema);
  const compiledSchema = isZodObject ? pageSchema : z.object(pageSchema);
  const fieldNames = Object.keys(isZodObject ? pageSchema.shape : pageSchema);
  return { compiledSchema, fieldNames };
};
