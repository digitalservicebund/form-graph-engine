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
    } ? S extends {
        parse: (data: unknown) => infer Output;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: infer Output;
        };
    } ? Output : S extends Readonly<Record<string, {
        parse: (data: unknown) => unknown;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: unknown;
        };
    }>> ? { -readonly [K in keyof S]: S[K] extends {
        parse: (data: unknown) => infer Output_1;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: infer Output_1;
        };
    } ? Output_1 : never; } : never : T extends {
        arraySummary: {
            name: infer N extends string;
            schema: infer S_1 extends {
                parse: (data: unknown) => unknown[];
                safeParse: (data: unknown) => {
                    success: false;
                    error: unknown;
                } | {
                    success: true;
                    data: unknown[];
                };
            };
        };
    } ? { [Key in N]: S_1 extends {
        parse: (data: unknown) => infer Output;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: infer Output;
        };
    } ? Output : S_1 extends Readonly<Record<string, {
        parse: (data: unknown) => unknown;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: unknown;
        };
    }>> ? { -readonly [K_1 in keyof S_1]: S_1[K_1] extends {
        parse: (data: unknown) => infer Output_1;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: infer Output_1;
        };
    } ? Output_1 : never; } : never; } : {} : never : never) extends infer T_1 ? T_1 extends (C[keyof C] extends infer T_2 ? T_2 extends C[keyof C] ? T_2 extends {
        pageSchema: infer S;
    } ? S extends {
        parse: (data: unknown) => infer Output;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: infer Output;
        };
    } ? Output : S extends Readonly<Record<string, {
        parse: (data: unknown) => unknown;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: unknown;
        };
    }>> ? { -readonly [K in keyof S]: S[K] extends {
        parse: (data: unknown) => infer Output_1;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: infer Output_1;
        };
    } ? Output_1 : never; } : never : T_2 extends {
        arraySummary: {
            name: infer N extends string;
            schema: infer S_1 extends {
                parse: (data: unknown) => unknown[];
                safeParse: (data: unknown) => {
                    success: false;
                    error: unknown;
                } | {
                    success: true;
                    data: unknown[];
                };
            };
        };
    } ? { [Key in N]: S_1 extends {
        parse: (data: unknown) => infer Output;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: infer Output;
        };
    } ? Output : S_1 extends Readonly<Record<string, {
        parse: (data: unknown) => unknown;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: unknown;
        };
    }>> ? { -readonly [K_1 in keyof S_1]: S_1[K_1] extends {
        parse: (data: unknown) => infer Output_1;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: infer Output_1;
        };
    } ? Output_1 : never; } : never; } : {} : never : never) ? T_1 extends any ? (k: T_1) => void : never : never : never) extends (k: infer I) => void ? I : never>;
    fieldNames: (C[Extract<keyof C, string>] extends infer T_3 ? T_3 extends C[Extract<keyof C, string>] ? T_3 extends {
        pageSchema?: infer S_2 extends import("./types.ts").PageSchema | undefined;
    } ? S_2 extends {
        shape: infer Shape extends Record<string, unknown>;
    } ? Extract<keyof Shape, string> : S_2 extends Readonly<Record<string, {
        parse: (data: unknown) => unknown;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: unknown;
        };
    }>> ? Extract<keyof S_2, string> : never : never : never : never)[];
    initialPath: string;
    arrayInfo: Partial<Record<Extract<keyof C, string>, import("./arrays.ts").ArrayInfo<C>>>[Extract<keyof C, string>] | undefined;
    path: string[];
    isComplete: boolean;
    statusTree: Record<string, import("./statusTree.ts").StatusNode>;
    prunedUserData: Partial<((C[keyof C] extends infer T_4 ? T_4 extends C[keyof C] ? T_4 extends {
        pageSchema: infer S;
    } ? S extends {
        parse: (data: unknown) => infer Output;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: infer Output;
        };
    } ? Output : S extends Readonly<Record<string, {
        parse: (data: unknown) => unknown;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: unknown;
        };
    }>> ? { -readonly [K in keyof S]: S[K] extends {
        parse: (data: unknown) => infer Output_1;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: infer Output_1;
        };
    } ? Output_1 : never; } : never : T_4 extends {
        arraySummary: {
            name: infer N extends string;
            schema: infer S_1 extends {
                parse: (data: unknown) => unknown[];
                safeParse: (data: unknown) => {
                    success: false;
                    error: unknown;
                } | {
                    success: true;
                    data: unknown[];
                };
            };
        };
    } ? { [Key in N]: S_1 extends {
        parse: (data: unknown) => infer Output;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: infer Output;
        };
    } ? Output : S_1 extends Readonly<Record<string, {
        parse: (data: unknown) => unknown;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: unknown;
        };
    }>> ? { -readonly [K_1 in keyof S_1]: S_1[K_1] extends {
        parse: (data: unknown) => infer Output_1;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: infer Output_1;
        };
    } ? Output_1 : never; } : never; } : {} : never : never) extends infer T_5 ? T_5 extends (C[keyof C] extends infer T_6 ? T_6 extends C[keyof C] ? T_6 extends {
        pageSchema: infer S;
    } ? S extends {
        parse: (data: unknown) => infer Output;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: infer Output;
        };
    } ? Output : S extends Readonly<Record<string, {
        parse: (data: unknown) => unknown;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: unknown;
        };
    }>> ? { -readonly [K in keyof S]: S[K] extends {
        parse: (data: unknown) => infer Output_1;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: infer Output_1;
        };
    } ? Output_1 : never; } : never : T_6 extends {
        arraySummary: {
            name: infer N extends string;
            schema: infer S_1 extends {
                parse: (data: unknown) => unknown[];
                safeParse: (data: unknown) => {
                    success: false;
                    error: unknown;
                } | {
                    success: true;
                    data: unknown[];
                };
            };
        };
    } ? { [Key in N]: S_1 extends {
        parse: (data: unknown) => infer Output;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: infer Output;
        };
    } ? Output : S_1 extends Readonly<Record<string, {
        parse: (data: unknown) => unknown;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: unknown;
        };
    }>> ? { -readonly [K_1 in keyof S_1]: S_1[K_1] extends {
        parse: (data: unknown) => infer Output_1;
        safeParse: (data: unknown) => {
            success: false;
            error: unknown;
        } | {
            success: true;
            data: infer Output_1;
        };
    } ? Output_1 : never; } : never; } : {} : never : never) ? T_5 extends any ? (k: T_5) => void : never : never : never) extends (k: infer I) => void ? I : never>;
    isReachable: (targetPath: string) => boolean;
    prevPath: string | undefined;
    nextPath: (newUserData?: InferredUserData<C>) => string | undefined;
    nextIncomplete: (newUserData?: InferredUserData<C>) => string | undefined;
    progress: {
        max: number;
        progress: number;
    };
};
