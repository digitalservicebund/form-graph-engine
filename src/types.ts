import type { PageData } from "./pageDataSchema.ts";

export type ZodSchemaLike<Output = unknown, Input = unknown> = {
  parse: (value: Input) => Output;
  safeParse: (
    value: Input,
  ) => { success: true; data: Output } | { success: false; error: unknown };
};

export type ZodRawShapeLike = Readonly<Record<string, ZodSchemaLike>>;

type InferSchema<S> =
  S extends ZodSchemaLike<infer Output, unknown>
    ? Output
    : S extends ZodRawShapeLike
      ? { [K in keyof S]: InferSchema<S[K]> }
      : never;

export type PageSchema = ZodSchemaLike | ZodRawShapeLike;

type PageConfig = {
  path: string;
  pageSchema?: PageSchema;
  arraySummary?: { name: string; schema: ZodSchemaLike };
};

export type PageConfigMap = Record<string, PageConfig>;
export type NodeKey<C extends PageConfigMap> = Extract<keyof C, string>;

// --- User Data Inference ---
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

type ExtractNodeSchema<Node> = Node extends { pageSchema: infer S }
  ? InferSchema<S>
  : Node extends {
        arraySummary: { name: infer N extends string; schema: infer S };
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
