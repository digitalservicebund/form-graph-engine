import { describe, it } from "node:test";
import { ok, deepStrictEqual } from "node:assert";
import { buildStatusTree } from "../src/statusTree.ts";

describe("buildStatusTree", () => {
  describe("flat paths (single segment)", () => {
    const pages = { start: { path: "/start" } };

    it("single-segment path produces a top-level tree entry", () => {
      const tree = buildStatusTree(pages, {
        path: ["start"],
        reachableSet: new Set(["start"]),
        isComplete: true,
      });
      ok("/start" in tree);
    });

    it("flat path entry has isReachable true", () => {
      const tree = buildStatusTree(pages, {
        path: ["start"],
        reachableSet: new Set(["start"]),
        isComplete: true,
      });
      deepStrictEqual(tree["/start"]!.isReachable, true);
    });

    it("flat path entry has isDone true when flow terminates", () => {
      const tree = buildStatusTree(pages, {
        path: ["start"],
        reachableSet: new Set(["start"]),
        isComplete: true,
      });
      deepStrictEqual(tree["/start"]!.isDone, true);
    });
  });

  describe("two-level nested paths", () => {
    const pages = {
      name: { path: "/personal/name" },
      addr: { path: "/personal/address" },
    };
    const sim = {
      path: ["name", "addr"],
      reachableSet: new Set(["name", "addr"]),
      isComplete: true,
    };

    it("creates a section entry at the first segment", () => {
      ok("/personal" in buildStatusTree(pages, sim));
    });

    it("section isDone is true when the flow has terminated inside it", () => {
      deepStrictEqual(buildStatusTree(pages, sim)["/personal"]?.isDone, true);
    });

    it("section isReachable is true when any node in it is reachable", () => {
      deepStrictEqual(
        buildStatusTree(pages, sim)["/personal"]?.isReachable,
        true,
      );
    });

    it("section isDone is false when no nodes in it have been visited", () => {
      // path only visited "pre"; the /personal section was never entered
      const tree = buildStatusTree(pages, {
        path: ["pre"],
        reachableSet: new Set(["pre"]),
        isComplete: false,
      });
      deepStrictEqual(tree["/personal"]?.isDone, false);
    });
  });

  describe("three-level nesting", () => {
    it("creates a parent section and a nested child section", () => {
      const tree = buildStatusTree(
        { deep: { path: "/a/b/c" } },
        {
          path: ["deep"],
          reachableSet: new Set(["deep"]),
          isComplete: true,
        },
      );
      ok("/a" in tree);
      ok("/b" in tree["/a"].children!);
    });
  });

  describe("isReachable reflects the BFS reachableSet", () => {
    it("isReachable is false for sections not reached by BFS", () => {
      const pages = {
        start: { path: "/start" },
        other: { path: "/other" },
      };
      // "other" not in reachableSet
      const tree = buildStatusTree(pages, {
        path: ["start"],
        reachableSet: new Set(["start"]),
        isComplete: true,
      });
      deepStrictEqual(tree["/other"]?.isReachable, false);
    });
  });
});
