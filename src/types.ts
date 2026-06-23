import type { PageData } from "./pageDataSchema.ts";

type SafeParseResult<Output> =
  | { success: true; data: Output }
  | { success: false; error: unknown };

type SchemaLike<Output = unknown> = {
  parse(data: unknown): Output;
  safeParse(data: unknown): SafeParseResult<Output>;
};

type PageShape = Record<string, SchemaLike>;

export type ObjectSchemaLike<
  Shape extends Record<string, unknown> = PageShape,
> = SchemaLike<{
  [K in keyof Shape]: Shape[K] extends SchemaLike<infer Output>
    ? Output
    : never;
}> & { shape: Shape };

type ArraySchemaLike<Item = unknown> = SchemaLike<Item[]>;

type InferSchema<S> =
  S extends SchemaLike<infer Output>
    ? Output
    : S extends PageShape
      ? {
          [K in keyof S]: S[K] extends SchemaLike<infer Output>
            ? Output
            : never;
        }
      : never;

export type PageSchema = ObjectSchemaLike | PageShape;

type EmptyObjectSchema = ObjectSchemaLike<{}>;

type CompiledPageSchema<S extends PageSchema | undefined> =
  S extends ObjectSchemaLike
    ? S
    : S extends PageShape
      ? ObjectSchemaLike<S>
      : EmptyObjectSchema;

type CompiledPageSchemaForNode<Node> = Node extends {
  pageSchema: infer S extends PageSchema;
}
  ? CompiledPageSchema<S>
  : EmptyObjectSchema;

type PageConfig = {
  path: string;
  pageSchema?: PageSchema;
  arraySummary?: { name: string; schema: ArraySchemaLike };
};

export type PageConfigMap = Record<string, PageConfig>;
export type NodeKey<C extends PageConfigMap> = Extract<keyof C, string>;

type NodeKeyForPath<C extends PageConfigMap, Path extends string> = {
  [K in NodeKey<C>]: C[K]["path"] extends Path ? K : never;
}[NodeKey<C>];

export type SchemaForPath<
  C extends PageConfigMap,
  Path extends string,
> = string extends Path
  ? CompiledPageSchemaForNode<C[NodeKey<C>]> | undefined
  : [NodeKeyForPath<C, Path>] extends [never]
    ? undefined
    : CompiledPageSchemaForNode<C[NodeKeyForPath<C, Path>]>;

// --- User Data Inference ---
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

type ExtractNodeSchema<Node> = Node extends { pageSchema: infer S }
  ? InferSchema<S>
  : Node extends {
        arraySummary: {
          name: infer N extends string;
          schema: infer S extends ArraySchemaLike;
        };
      }
    ? { [Key in N]: InferSchema<S> }
    : {};

export type InferredUserData<C extends PageConfigMap> = Partial<
  UnionToIntersection<ExtractNodeSchema<C[keyof C]>>
>;

// --- Routing & Guards ---
type Guard<Data> = (data: Data) => boolean;

type GuardedTransition<Key, Data> = {
  target: Key | null;
  guard?: Guard<Data>;
  type?: "addArrayItem";
};

export type TransitionConfig<Key, Data> =
  | Key
  | null
  | Array<GuardedTransition<Key, Data>>;

export type TransitionConfigMap<C extends PageConfigMap> = Record<
  NodeKey<C>,
  TransitionConfig<NodeKey<C>, InferredUserData<C> & { pageData: PageData }>
>;
