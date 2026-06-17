import z from "zod";
import {
  type PageSchema,
  type ZodRawShapeLike,
  type ZodSchemaLike,
} from "./types.ts";

export type PageSchemaInfo = {
  compiledSchema: ZodSchemaLike;
  fieldNames: string[];
};

const isSchemaLike = (value: unknown): value is ZodSchemaLike => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { parse?: unknown; safeParse?: unknown };
  return (
    typeof candidate.parse === "function" &&
    typeof candidate.safeParse === "function"
  );
};

const isRawShapeLike = (value: unknown): value is ZodRawShapeLike => {
  if (!value || typeof value !== "object") return false;
  return Object.values(value).every(isSchemaLike);
};

const extractFieldNames = (schema: ZodSchemaLike): string[] => {
  const candidate = schema as {
    shape?: unknown;
    innerType?: unknown;
  };

  if (
    candidate.shape &&
    typeof candidate.shape === "object" &&
    !Array.isArray(candidate.shape)
  ) {
    return Object.keys(candidate.shape as Record<string, unknown>);
  }

  if (typeof candidate.innerType === "function") {
    const inner = (candidate.innerType as () => unknown)();
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
export const normalizeSchema = (pageSchema?: PageSchema): PageSchemaInfo => {
  if (!pageSchema) return { compiledSchema: z.object({}), fieldNames: [] };

  if (isRawShapeLike(pageSchema)) {
    return {
      // Cast keeps this adapter compatible across Zod v4+ internals.
      compiledSchema: z.object(pageSchema as Record<string, z.ZodTypeAny>),
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
