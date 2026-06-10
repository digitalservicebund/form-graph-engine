import type { NodeKey, PageConfigMap } from "./types.ts";

/**
 * Validates that all page paths start with "/" as required.
 */
export const validatePagePaths = <C extends PageConfigMap>(pages: C): void => {
  for (const [key, pageNode] of Object.entries(pages)) {
    const nodeKey = key as NodeKey<C>;
    if (!pageNode.path.startsWith("/")) {
      throw new Error(
        `path must start with "/": "${pageNode.path}" (nodeKey: "${String(nodeKey)}")`,
      );
    }
  }
};
