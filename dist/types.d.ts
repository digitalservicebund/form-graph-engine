import type { PageData } from "./pageDataSchema.ts";
type SchemaResult<Output> = {
    success: true;
    data: Output;
} | {
    success: false;
    error: unknown;
};
type SchemaLike<Output = unknown> = {
    parse: (data: unknown) => Output;
    safeParse: (data: unknown) => SchemaResult<Output>;
};
type ArraySchemaLike = SchemaLike<unknown[]>;
type SchemaRecord = Readonly<Record<string, SchemaLike>>;
type SafeEncodeLike<Output = unknown> = (...args: any[]) => SchemaResult<Output>;
type ObjectOutput<Shape extends SchemaRecord> = {
    -readonly [K in keyof Shape]: Shape[K] extends SchemaLike<infer Output> ? Output : never;
};
type CompiledRawShapeSchema<Shape extends SchemaRecord> = {
    parse: (data: unknown) => ObjectOutput<Shape>;
    safeParse: (data: unknown) => SchemaResult<ObjectOutput<Shape>>;
    safeEncode?: (data: ObjectOutput<Shape>) => SchemaResult<ObjectOutput<Shape>>;
    shape: Shape;
};
export type ObjectSchemaLike = {
    parse: (data: unknown) => unknown;
    safeParse: (data: unknown) => SchemaResult<unknown>;
    safeEncode?: SafeEncodeLike<unknown>;
    shape: SchemaRecord;
};
type InferSchema<S> = S extends SchemaLike<infer Output> ? Output : S extends SchemaRecord ? ObjectOutput<S> : never;
export type PageSchema = ObjectSchemaLike | SchemaRecord;
type CompiledPageSchema<S extends PageSchema | undefined> = S extends ObjectSchemaLike ? S : S extends SchemaRecord ? CompiledRawShapeSchema<S> : undefined;
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
type FieldNameForSchema<S> = S extends {
    shape: infer Shape extends Record<string, unknown>;
} ? Extract<keyof Shape, string> : S extends SchemaRecord ? Extract<keyof S, string> : never;
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
