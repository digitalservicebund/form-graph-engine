import * as z from "zod/v4";
import type { ObjectSchemaLike, PageSchema } from "./types.ts";

export type PageSchemaInfo = {
  compiledSchema: ObjectSchemaLike | undefined;
  fieldNames: string[];
};

const isObjectSchemaLike = (value: PageSchema): value is ObjectSchemaLike =>
  "_zod" in value && "shape" in value;

/**
 * Normalizes a page schema into a compiled Zod type and extracts field names.
 * Handles both raw shapes and ZodObjects.
 */
export const normalizeSchema = (pageSchema?: PageSchema): PageSchemaInfo => {
  if (!pageSchema) return { compiledSchema: undefined, fieldNames: [] };
  const isZodObject = isObjectSchemaLike(pageSchema);
  const compiledSchema = isZodObject ? pageSchema : z.object(pageSchema);
  const fieldNames = Object.keys(compiledSchema._zod.def.shape);
  return { compiledSchema, fieldNames };
};
