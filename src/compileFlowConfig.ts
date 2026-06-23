import { buildArrayInfoCache } from "./arrays.ts";
import { normalizeSchema, type PageSchemaInfo } from "./normalizeSchema.ts";
import { precomputeProgress } from "./precomputeProgress.ts";
import { validatePagePaths } from "./validatePageConfig.ts";
import type {
  NodeKey,
  PageConfigMap,
  SchemaForPath,
  TransitionConfigMap,
} from "./types.ts";

const buildPathAndSchemaMaps = <C extends PageConfigMap>(pages: C) => {
  const pathMap: Record<string, NodeKey<C>> = {};
  const pageSchemaInfoCache: Partial<Record<NodeKey<C>, PageSchemaInfo>> = {};

  for (const [key, pageNode] of Object.entries(pages)) {
    const nodeKey = key as NodeKey<C>;
    pathMap[pageNode.path] = nodeKey;
    pageSchemaInfoCache[nodeKey] = normalizeSchema(pageNode.pageSchema);
  }
  return { pathMap, pageSchemaInfoCache };
};

/**
 * Compiles a flow configuration into an optimized, executable form.
 * Performs static analysis, path mapping, and caches computed properties.
 */
export const compileFlowConfig = <C extends PageConfigMap>({
  pages,
  initialStep,
  transitions,
}: {
  pages: C;
  initialStep: NodeKey<C>;
  transitions: TransitionConfigMap<C>;
}) => {
  validatePagePaths(pages);
  const { pathMap, pageSchemaInfoCache } = buildPathAndSchemaMaps(pages);
  const arrayInfoCache = buildArrayInfoCache(pages, transitions);
  const graphStats = precomputeProgress(transitions, initialStep);

  const getNodeKeyFromPath = (path: string) => pathMap[path];

  const getPageByNodeKey = (nodeKey: NodeKey<C>) => {
    const page = pages[nodeKey];
    if (!page) {
      throw new Error(`Missing page config for node key: "${String(nodeKey)}"`);
    }
    return page;
  };

  const getPathFromNodeKey = (nodeKey?: NodeKey<C>): string | undefined => {
    if (nodeKey == null) return undefined;
    return getPageByNodeKey(nodeKey).path;
  };

  return {
    pages,
    transitions,
    initialStep,
    initialPath: getPageByNodeKey(initialStep).path,

    getArrayInfo: (path: string) => {
      const nodeKey = pathMap[path];
      return nodeKey ? arrayInfoCache[nodeKey] : undefined;
    },
    getSchema: <P extends string>(path: P): SchemaForPath<C, P> => {
      const nodeKey = pathMap[path];
      return (
        nodeKey ? pageSchemaInfoCache[nodeKey]?.compiledSchema : undefined
      ) as SchemaForPath<C, P>;
    },
    getFieldNames: (path: string): string[] => {
      const nodeKey = pathMap[path];
      return nodeKey ? (pageSchemaInfoCache[nodeKey]?.fieldNames ?? []) : [];
    },
    getFieldNamesByNodeKey: (nodeKey: NodeKey<C>): string[] =>
      pageSchemaInfoCache[nodeKey]?.fieldNames ?? [],
    arrayInfoCache,
    getNodeKeyFromPath,
    getPathFromNodeKey,
    isFinal: (path: string) => {
      const nodeKey = getNodeKeyFromPath(path);
      return nodeKey != null ? graphStats.isFinal(nodeKey) : undefined;
    },
    getProgress: (path: string) => {
      const nodeKey = getNodeKeyFromPath(path);
      return nodeKey != null ? graphStats.getProgress(nodeKey) : undefined;
    },
    progressByKey: (nodeKey: NodeKey<C>) => graphStats.getProgress(nodeKey),
  };
};

export type CompiledFlow<C extends PageConfigMap> = ReturnType<
  typeof compileFlowConfig<C>
>;
