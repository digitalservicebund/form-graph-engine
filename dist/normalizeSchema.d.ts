import z from "zod";
export type PageSchemaInfo = {
    compiledSchema: z.ZodTypeAny;
    fieldNames: string[];
};
export declare const normalizeSchema: (schema?: z.ZodTypeAny | z.ZodRawShape) => PageSchemaInfo;
//# sourceMappingURL=normalizeSchema.d.ts.map