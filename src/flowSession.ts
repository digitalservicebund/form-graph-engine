import { simulate } from "./simulate.ts";
import type { CompiledFlow } from "./compileFlowConfig.ts";
import type { InferredUserData, PageConfigMap } from "./types.ts";
import { evaluateRoute, findNextIncompleteNode } from "./routing.ts";
import { buildStatusTree } from "./statusTree.ts";
import { pruneUserData } from "./pruneUserData.ts";
import { parseCurrentPath } from "./arrays.ts";

const getCurrentNode = <C extends PageConfigMap>(
  compiledFlow: CompiledFlow<C>,
  currentPath: string,
) => {
  const { normalizedPath, currentPageData } = parseCurrentPath(currentPath);
  const nodeKey = compiledFlow.getNodeKeyFromPath(normalizedPath);
  return { nodeKey, normalizedPath, currentPageData };
};

/**
 * Creates a session for the current step in a flow.
 * Resolves navigation, schemas, and status based on current user data and path.
 */
export const createFlowSession = <C extends PageConfigMap, P extends string>(
  compiledFlow: CompiledFlow<C>,
  userData: NoInfer<InferredUserData<C>>,
  currentPath: P,
) => {
  const { nodeKey, normalizedPath, currentPageData } = getCurrentNode(
    compiledFlow,
    currentPath,
  );
  if (!nodeKey) throw new Error(`Invalid path: ${currentPath}`);

  const simulation = simulate(
    compiledFlow.transitions,
    compiledFlow.initialStep,
    userData,
    compiledFlow.arrayInfoCache,
  );

  // Prev: The BFS parent guarantees a direct, chronological Back step.
  const prevNodeKey = simulation.parentMap.get(nodeKey);
  const prunedUserData = pruneUserData(
    compiledFlow,
    simulation.visitedContexts,
    userData,
  );
  const fieldNames = compiledFlow.getFieldNames(normalizedPath);

  const pageData = Object.fromEntries(
    Object.entries(prunedUserData).filter(([key, _]) =>
      fieldNames.includes(key),
    ),
  ) as InferredUserData<C>;

  return {
    nodeKey,
    pageSchema: compiledFlow.getSchema(normalizedPath as P),
    pageData,
    fieldNames,
    initialPath: compiledFlow.initialPath,
    arrayInfo: compiledFlow.getArrayInfo(normalizedPath),
    path: simulation.path,
    isComplete: simulation.isComplete,
    statusTree: buildStatusTree(compiledFlow.pages, simulation),
    prunedUserData,
    isReachable: (targetPath: string): boolean => {
      const key = compiledFlow.getNodeKeyFromPath(targetPath);
      return key != null && simulation.reachableSet.has(key);
    },
    prevPath: compiledFlow.getPathFromNodeKey(prevNodeKey),
    nextPath: (newUserData?: InferredUserData<C>) => {
      const mergedUserData = { ...userData, ...newUserData };
      // Next: evaluateRoute skips addArrayItem transitions to find the next main-branch step.
      const nextNodeKey = evaluateRoute(compiledFlow.transitions[nodeKey], {
        ...mergedUserData,
        pageData: currentPageData,
      });
      return compiledFlow.getPathFromNodeKey(nextNodeKey ?? undefined);
    },
    nextIncomplete: (newUserData?: InferredUserData<C>) => {
      const guardData = {
        ...{ ...userData, ...newUserData },
        pageData: currentPageData,
      };
      const nextNodeKey = findNextIncompleteNode(
        compiledFlow,
        guardData,
        nodeKey,
      );
      return compiledFlow.getPathFromNodeKey(nextNodeKey ?? undefined);
    },
    progress: compiledFlow.progressByKey(nodeKey),
  };
};
