import type { CompiledFlow } from "./compileFlowConfig.ts";
import type { InferredUserData, PageConfigMap } from "./types.ts";
/**
 * Creates a session for the current step in a flow.
 * Resolves navigation, schemas, and status based on current user data and path.
 */
export declare const createFlowSession: <C extends PageConfigMap, P extends string>(compiledFlow: CompiledFlow<C>, userData: NoInfer<InferredUserData<C>>, currentPath: P) => {
    nodeKey: Extract<keyof C, string>;
    pageSchema: import("./types.ts").SchemaForPath<C, P>;
    pageData: Partial<((C[keyof C] extends infer T ? T extends C[keyof C] ? T extends {
        pageSchema: infer S;
    } ? S extends import("zod/v4/core").$ZodType<infer Output, unknown, import("zod/v4/core").$ZodTypeInternals<infer Output, unknown>> ? Output : S extends Readonly<{
        [k: string]: import("zod/v4/core").$ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
    }> ? import("zod/v4/core").$InferObjectOutput<S, Record<string, unknown>> : never : T extends {
        arraySummary: {
            name: infer N extends string;
            schema: infer S_1 extends import("zod/v4/core").$ZodType<unknown[], unknown, import("zod/v4/core").$ZodTypeInternals<unknown[], unknown>>;
        };
    } ? { [Key in N]: S_1 extends import("zod/v4/core").$ZodType<infer Output, unknown, import("zod/v4/core").$ZodTypeInternals<infer Output, unknown>> ? Output : S_1 extends Readonly<{
        [k: string]: import("zod/v4/core").$ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
    }> ? import("zod/v4/core").$InferObjectOutput<S_1, Record<string, unknown>> : never; } : {} : never : never) extends infer T_1 ? T_1 extends (C[keyof C] extends infer T_2 ? T_2 extends C[keyof C] ? T_2 extends {
        pageSchema: infer S;
    } ? S extends import("zod/v4/core").$ZodType<infer Output, unknown, import("zod/v4/core").$ZodTypeInternals<infer Output, unknown>> ? Output : S extends Readonly<{
        [k: string]: import("zod/v4/core").$ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
    }> ? import("zod/v4/core").$InferObjectOutput<S, Record<string, unknown>> : never : T_2 extends {
        arraySummary: {
            name: infer N extends string;
            schema: infer S_1 extends import("zod/v4/core").$ZodType<unknown[], unknown, import("zod/v4/core").$ZodTypeInternals<unknown[], unknown>>;
        };
    } ? { [Key in N]: S_1 extends import("zod/v4/core").$ZodType<infer Output, unknown, import("zod/v4/core").$ZodTypeInternals<infer Output, unknown>> ? Output : S_1 extends Readonly<{
        [k: string]: import("zod/v4/core").$ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
    }> ? import("zod/v4/core").$InferObjectOutput<S_1, Record<string, unknown>> : never; } : {} : never : never) ? T_1 extends any ? (k: T_1) => void : never : never : never) extends (k: infer I) => void ? I : never>;
    fieldNames: (C[Extract<keyof C, string>] extends infer T_3 ? T_3 extends C[Extract<keyof C, string>] ? T_3 extends {
        pageSchema?: infer S_2 extends import("./types.ts").PageSchema | undefined;
    } ? S_2 extends import("zod/v4/core").$ZodObject<infer Shape extends Readonly<Readonly<{
        [k: string]: import("zod/v4/core").$ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
    }>>, import("zod/v4/core").$ZodObjectConfig> ? Extract<keyof Shape, string> : S_2 extends Readonly<{
        [k: string]: import("zod/v4/core").$ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
    }> ? Extract<keyof S_2, string> : never : never : never : never)[];
    initialPath: string;
    arrayInfo: Partial<Record<Extract<keyof C, string>, import("./arrays.ts").ArrayInfo<C>>>[Extract<keyof C, string>] | undefined;
    path: string[];
    isComplete: boolean;
    statusTree: Record<string, import("./statusTree.ts").StatusNode>;
    prunedUserData: Partial<((C[keyof C] extends infer T_4 ? T_4 extends C[keyof C] ? T_4 extends {
        pageSchema: infer S;
    } ? S extends import("zod/v4/core").$ZodType<infer Output, unknown, import("zod/v4/core").$ZodTypeInternals<infer Output, unknown>> ? Output : S extends Readonly<{
        [k: string]: import("zod/v4/core").$ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
    }> ? import("zod/v4/core").$InferObjectOutput<S, Record<string, unknown>> : never : T_4 extends {
        arraySummary: {
            name: infer N extends string;
            schema: infer S_1 extends import("zod/v4/core").$ZodType<unknown[], unknown, import("zod/v4/core").$ZodTypeInternals<unknown[], unknown>>;
        };
    } ? { [Key in N]: S_1 extends import("zod/v4/core").$ZodType<infer Output, unknown, import("zod/v4/core").$ZodTypeInternals<infer Output, unknown>> ? Output : S_1 extends Readonly<{
        [k: string]: import("zod/v4/core").$ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
    }> ? import("zod/v4/core").$InferObjectOutput<S_1, Record<string, unknown>> : never; } : {} : never : never) extends infer T_5 ? T_5 extends (C[keyof C] extends infer T_6 ? T_6 extends C[keyof C] ? T_6 extends {
        pageSchema: infer S;
    } ? S extends import("zod/v4/core").$ZodType<infer Output, unknown, import("zod/v4/core").$ZodTypeInternals<infer Output, unknown>> ? Output : S extends Readonly<{
        [k: string]: import("zod/v4/core").$ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
    }> ? import("zod/v4/core").$InferObjectOutput<S, Record<string, unknown>> : never : T_6 extends {
        arraySummary: {
            name: infer N extends string;
            schema: infer S_1 extends import("zod/v4/core").$ZodType<unknown[], unknown, import("zod/v4/core").$ZodTypeInternals<unknown[], unknown>>;
        };
    } ? { [Key in N]: S_1 extends import("zod/v4/core").$ZodType<infer Output, unknown, import("zod/v4/core").$ZodTypeInternals<infer Output, unknown>> ? Output : S_1 extends Readonly<{
        [k: string]: import("zod/v4/core").$ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
    }> ? import("zod/v4/core").$InferObjectOutput<S_1, Record<string, unknown>> : never; } : {} : never : never) ? T_5 extends any ? (k: T_5) => void : never : never : never) extends (k: infer I) => void ? I : never>;
    isReachable: (targetPath: string) => boolean;
    prevPath: string | undefined;
    nextPath: (newUserData?: InferredUserData<C>) => string | undefined;
    nextIncomplete: (newUserData?: InferredUserData<C>) => string | undefined;
    progress: {
        max: number;
        progress: number;
    };
};
