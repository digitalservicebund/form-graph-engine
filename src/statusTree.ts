export type StatusNode = {
  isDone: boolean;
  isReachable: boolean;
  children?: Record<string, StatusNode>;
};

export type StatusSimulationResult = {
  path: string[];
  reachableSet: Set<string>;
  isComplete: boolean;
};

const getPrefixes = (id: string, includeFlat: boolean = true) => {
  // 1. Strip leading slashes (empty strings) and array wildcards ("#")
  const parts = id.split("/").filter((p) => p !== "" && p !== "#");
  if (parts.length <= 1) {
    const [first] = parts;
    return includeFlat && first !== undefined ? [first] : [];
  }

  // Generates cumulative clean prefixes: ["kinder", "kinder/spielzeuge"]
  return parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join("/"));
};

const calcStatus = (
  keys: Set<string>,
  path: string[],
  reachableSet: Set<string>,
  isComplete: boolean,
) => {
  // Reachable if the simulation found ANY valid route into this folder
  const isReachable = Array.from(keys).some((node) => reachableSet.has(node));
  const visited = path.filter((node) => keys.has(node));
  const activeNode = path.at(-1);

  return {
    isReachable,
    isDone:
      visited.length > 0 &&
      // If the user's active node is no longer inside this prefix's keys, they've exited the folder
      (activeNode === undefined || !keys.has(activeNode) || isComplete),
  };
};

const upsertPrefixNode = (
  tree: Record<string, StatusNode>,
  prefix: string,
  status: Pick<StatusNode, "isDone" | "isReachable">,
) => {
  const parts = prefix.split("/").filter(Boolean);
  let level = tree;

  for (const [index, part] of parts.entries()) {
    const key = `/${part}`;
    const isLeaf = index === parts.length - 1;
    const existingNode = level[key];

    if (isLeaf) {
      level[key] = {
        children: {},
        ...existingNode,
        ...status,
      };
      return;
    }

    if (!existingNode) {
      level[key] = {
        isDone: false,
        isReachable: false,
        children: {},
      };
    } else if (!existingNode.children) {
      existingNode.children = {};
    }

    const nextLevel = level[key]?.children;
    if (!nextLevel) {
      throw new Error(`Failed to initialize status tree node for key: ${key}`);
    }
    level = nextLevel;
  }
};

/**
 * Builds a hierarchical tree of node statuses (done, reachable) from flow simulation.
 * Used to track completion and availability of steps and sub-steps.
 */
export const buildStatusTree = (
  config: Record<string, { path: string }>,
  { path, reachableSet, isComplete }: StatusSimulationResult,
): Record<string, StatusNode> => {
  const prefixPairs: Array<{ prefix: string; key: string }> = [];
  for (const [key, { path }] of Object.entries(config)) {
    for (const prefix of getPrefixes(path)) {
      prefixPairs.push({ prefix, key });
    }
  }

  // Results in: { "kinder": Set(["key1", "key2"]), "kinder/spielzeuge": Set(["key3"]) }
  const prefixMap: Record<string, Set<string>> = {};
  for (const { prefix, key } of prefixPairs) {
    if (!prefixMap[prefix]) {
      prefixMap[prefix] = new Set<string>();
    }
    prefixMap[prefix].add(key);
  }

  // Calculate status and build tree
  const tree: Record<string, StatusNode> = {};

  Object.keys(prefixMap)
    .sort((a, b) => a.length - b.length)
    .forEach((prefix) => {
      const keys = prefixMap[prefix];
      if (!keys) return;

      const status = calcStatus(keys, path, reachableSet, isComplete);

      upsertPrefixNode(tree, prefix, status);
    });

  return tree;
};
