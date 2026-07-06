import type { PageData } from "./pageDataSchema.ts";
import type * as z4 from "zod/v4/core";
type ArraySchemaLike = z4.$ZodType<unknown[]>;
type SchemaResult<Output> = {
    success: true;
    data: Output;
} | {
    success: false;
    error: unknown;
};
type RuntimeSchemaMethods<Output> = {
    parse: (data: unknown) => Output;
    safeParse: (data: unknown) => SchemaResult<Output>;
    safeEncode?: (data: Output) => SchemaResult<Output>;
};
export type ObjectSchemaLike<Shape extends z4.$ZodShape = z4.$ZodShape> = z4.$ZodObject<Shape> & RuntimeSchemaMethods<z4.output<z4.$ZodObject<Shape>>>;
type InferSchema<S> = S extends z4.$ZodType<infer Output> ? Output : S extends z4.$ZodShape ? z4.output<z4.$ZodObject<S>> : never;
export type PageSchema = ObjectSchemaLike | z4.$ZodShape;
type CompiledPageSchema<S extends PageSchema | undefined> = S extends ObjectSchemaLike ? S : S extends z4.$ZodShape ? ObjectSchemaLike<S> : undefined;
type CompiledPageSchemaForNode<Node> = Node extends {
    pageSchema?: infer S extends PageSchema | undefined;
} ? CompiledPageSchema<S> : undefined;
type PageConfig = {
    path: string;
    pageSchema?: PageSchema;
    arraySummary?: {
        name: string;
        schema: ArraySchemaLike;
    };
};
export type PageConfigMap = Record<string, PageConfig>;
export type NodeKey<C extends PageConfigMap> = Extract<keyof C, string>;
type NodeKeyForPath<C extends PageConfigMap, Path extends string> = {
    [K in NodeKey<C>]: C[K]["path"] extends Path ? K : never;
}[NodeKey<C>];
type FieldNameForSchema<S> = S extends z4.$ZodObject<infer Shape> ? Extract<keyof Shape, string> : S extends z4.$ZodShape ? Extract<keyof S, string> : never;
type FieldNameForNode<Node> = Node extends {
    pageSchema?: infer S extends PageSchema | undefined;
} ? FieldNameForSchema<S> : never;
export type FieldNameForNodeKey<C extends PageConfigMap, K extends NodeKey<C>> = FieldNameForNode<C[K]>;
export type FieldNameForPath<C extends PageConfigMap, Path extends string> = string extends Path ? FieldNameForNode<C[NodeKey<C>]> : [NodeKeyForPath<C, Path>] extends [never] ? never : FieldNameForNode<C[NodeKeyForPath<C, Path>]>;
export type SchemaForPath<C extends PageConfigMap, Path extends string> = string extends Path ? CompiledPageSchemaForNode<C[NodeKey<C>]> | undefined : [NodeKeyForPath<C, Path>] extends [never] ? undefined : CompiledPageSchemaForNode<C[NodeKeyForPath<C, Path>]>;
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
type ExtractNodeSchema<Node> = Node extends {
    pageSchema: infer S;
} ? InferSchema<S> : Node extends {
    arraySummary: {
        name: infer N extends string;
        schema: infer S extends ArraySchemaLike;
    };
} ? {
    [Key in N]: InferSchema<S>;
} : {};
export type InferredUserData<C extends PageConfigMap> = Partial<UnionToIntersection<ExtractNodeSchema<C[keyof C]>>>;
type Guard<Data> = (data: Data) => boolean;
type GuardedTransition<Key, Data> = {
    target: Key | null;
    guard?: Guard<Data>;
    type?: "addArrayItem";
};
export type TransitionConfig<Key, Data> = Key | null | Array<GuardedTransition<Key, Data>>;
export type TransitionConfigMap<C extends PageConfigMap> = Record<NodeKey<C>, TransitionConfig<NodeKey<C>, InferredUserData<C> & {
    pageData: PageData;
}>>;
export {};
