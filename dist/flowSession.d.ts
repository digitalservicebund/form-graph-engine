import type { CompiledFlow } from "./compileFlowConfig.ts";
import type { PageConfigMap, InferredUserData } from "./types.ts";
/**
 * Creates a session for the current step in a flow.
 * Resolves navigation, schemas, and status based on current user data and path.
 */
export declare const createFlowSession: <C extends PageConfigMap>(compiledFlow: CompiledFlow<C>, userData: InferredUserData<C>, currentPath: string) => {
    nodeKey: Extract<keyof C, string>;
    pageSchema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>> | undefined;
    fieldNames: string[];
    initialPath: string;
    arrayInfo: Partial<Record<Extract<keyof C, string>, import("./arrays.ts").ArrayInfo<C>>>[Extract<keyof C, string>] | undefined;
    path: string[];
    isComplete: boolean;
    statusTree: Record<string, import("./statusTree.ts").StatusNode>;
    prunedUserData: Partial<((C[keyof C] extends infer T ? T extends C[keyof C] ? T extends {
        pageSchema: infer S;
    } ? S extends import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>> ? import("zod").infer<S> : S extends Readonly<{
        [k: string]: import("zod/v4/core").$ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
    }> ? import("zod/v4/core").$InferObjectOutput<S, {}> : never : T extends {
        arraySummary: {
            name: infer N extends string;
            schema: infer S_1;
        };
    } ? { [Key in N]: S_1 extends import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>> ? import("zod").infer<S_1> : S_1 extends Readonly<{
        [k: string]: import("zod/v4/core").$ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
    }> ? import("zod/v4/core").$InferObjectOutput<S_1, {}> : never; } : {} : never : never) extends infer T_1 ? T_1 extends (C[keyof C] extends infer T_2 ? T_2 extends C[keyof C] ? T_2 extends {
        pageSchema: infer S;
    } ? S extends import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>> ? import("zod").infer<S> : S extends Readonly<{
        [k: string]: import("zod/v4/core").$ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
    }> ? import("zod/v4/core").$InferObjectOutput<S, {}> : never : T_2 extends {
        arraySummary: {
            name: infer N extends string;
            schema: infer S_1;
        };
    } ? { [Key in N]: S_1 extends import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>> ? import("zod").infer<S_1> : S_1 extends Readonly<{
        [k: string]: import("zod/v4/core").$ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
    }> ? import("zod/v4/core").$InferObjectOutput<S_1, {}> : never; } : {} : never : never) ? T_1 extends any ? (k: T_1) => void : never : never : never) extends (k: infer I) => void ? I : never>;
    isReachable: (targetPath: string) => boolean;
    nextPath: string | undefined;
    prevPath: string | undefined;
};
export type FlowSession<C extends PageConfigMap> = ReturnType<typeof createFlowSession<C>>;
