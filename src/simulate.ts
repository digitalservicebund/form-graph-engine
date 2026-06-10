import { evaluateAllBranches, evaluateRoute, extractEdges } from "./routing.ts";
import type {
  NodeKey,
  PageConfigMap,
  TransitionConfigMap,
  InferredUserData,
} from "./types.ts";
import type { PageData } from "./pageDataSchema.ts";

type SimulationResult = {
  path: string[];
  reachableSet: Set<string>;
  isComplete: boolean;
};

const createEdgeTracker = <T>() => {
  const edges = new Map<T, Set<T>>();
  return {
    has: (from: T, to: T): boolean => edges.get(from)?.has(to) ?? false,
    add: (from: T, to: T): void => {
      if (!edges.has(from)) edges.set(from, new Set());
      edges.get(from)!.add(to);
    },
  };
};

/**
 * Simulates the flow to compute reachable nodes, visited contexts, and completion status.
 * Builds the parent map for back navigation (BFS-based).
 */
export const simulate = <C extends PageConfigMap>(
  router: TransitionConfigMap<C>,
  initialStep: NodeKey<C>,
  userData: InferredUserData<C>,
  arrayInfoCache: Partial<Record<NodeKey<C>, { name: string }>> = {},
): SimulationResult & {
  parentMap: Map<NodeKey<C>, NodeKey<C>>;
  visitedContexts: Array<{
    key: NodeKey<C>;
    pageData: PageData;
    scopeData: Record<string, unknown>;
    arrayPath: string[];
  }>;
} => {
  type FlowKey = NodeKey<C>;
  const rootPageData = { arrayIndexes: [] };
  const rootGuardData = { ...userData, pageData: rootPageData };

  // Pass 1: Edge-Tracking Linear Evaluation
  const path: FlowKey[] = [];
  let currentLinear: FlowKey | null = initialStep;

  const visitedEdges = createEdgeTracker<FlowKey>();
  let isComplete = false;

  while (currentLinear) {
    path.push(currentLinear);

    const route: TransitionConfigMap<C>[FlowKey] = router[currentLinear];
    let next = evaluateRoute(route, rootGuardData, true);

    if (next && visitedEdges.has(currentLinear, next)) {
      const branches = evaluateAllBranches(route, rootGuardData);
      next = branches.find((b) => !visitedEdges.has(currentLinear!, b)) || null;
    }

    if (!next) {
      if (extractEdges(route).length === 0) isComplete = true;
      break;
    }

    visitedEdges.add(currentLinear, next);
    currentLinear = next;
  }

  // Pass 2: BFS with per-item context.
  // Each queue item carries:
  //   pageData   – passed to guards so they can navigate userData by index
  //   scopeData  – the data object at the current array nesting level, used
  //                to count sub-array items without needing global navigation
  //   arrayPath  – names of ancestor arrays (e.g. ["children", "toys"]),
  //                used by pruneUserData to reconstruct the nested output path
  // De-duplication is by (nodeKey, arrayIndexes) so the same page can be
  // visited once per array entry while the same top-level page is visited once.
  type BfsItem = {
    key: FlowKey;
    pageData: PageData;
    scopeData: Record<string, unknown>;
    arrayPath: string[];
  };
  const reachableSet = new Set<FlowKey>();
  const parentMap = new Map<FlowKey, FlowKey>();
  const visitedSet = new Set<string>(); // "${key}:${arrayIndexes}"
  const visitedContexts: Array<{
    key: FlowKey;
    pageData: PageData;
    scopeData: Record<string, unknown>;
    arrayPath: string[];
  }> = [];
  const queue: BfsItem[] = [
    {
      key: initialStep,
      pageData: rootPageData,
      scopeData: userData as unknown as Record<string, unknown>,
      arrayPath: [],
    },
  ];

  while (queue.length > 0) {
    const { key: current, pageData, scopeData, arrayPath } = queue.shift()!;
    const visitId = `${current}:${(pageData.arrayIndexes ?? []).join(",")}`;
    if (visitedSet.has(visitId)) continue;
    visitedSet.add(visitId);

    reachableSet.add(current);
    visitedContexts.push({ key: current, pageData, scopeData, arrayPath });

    const route = router[current];
    const itemData = { ...userData, pageData };

    // Regular (non-array) branches — propagate the current scope unchanged.
    for (const branch of evaluateAllBranches(route, itemData, {
      excludeArrayTransitions: true,
    })) {
      if (!parentMap.has(branch)) parentMap.set(branch, current);
      queue.push({ key: branch, pageData, scopeData, arrayPath });
    }

    // Array branches: fan out once per item. scopeData is narrowed to the
    // specific array item so nested arrays can be counted and pruned correctly.
    if (Array.isArray(route)) {
      const addTransition = route.find((t) => t?.type === "addArrayItem");
      if (addTransition?.target != null) {
        const arrayInfo = arrayInfoCache[current];
        if (arrayInfo) {
          const items = scopeData[arrayInfo.name];
          const count = Array.isArray(items) ? items.length : 0;
          for (let i = 0; i < count; i++) {
            const itemScopeData = (
              Array.isArray(items) ? items[i] : {}
            ) as Record<string, unknown>;
            const itemPageData: PageData = {
              arrayIndexes: [...(pageData.arrayIndexes ?? []), i],
            };
            if (!parentMap.has(addTransition.target))
              parentMap.set(addTransition.target, current);
            queue.push({
              key: addTransition.target,
              pageData: itemPageData,
              scopeData: itemScopeData,
              arrayPath: [...arrayPath, arrayInfo.name],
            });
          }
        }
      }
    }
  }

  return { path, isComplete, reachableSet, parentMap, visitedContexts };
};
