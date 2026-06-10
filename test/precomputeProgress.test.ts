import { describe, it } from "node:test";
import { ok, deepStrictEqual } from "node:assert";
import { precomputeProgress } from "../src/precomputeProgress.ts";

describe("precomputeGraph", () => {
  describe("linear flow", () => {
    const router = { a: "b", b: "c", c: null } as const;
    const graph = precomputeProgress(router, "a");

    it("initial node has progress less than max", () => {
      const { progress, max } = graph.getProgress("a");
      ok(progress < max);
    });

    it("nodes have increasing progress along the path", () => {
      const progressA = graph.getProgress("a").progress;
      const progressB = graph.getProgress("b").progress;
      const progressC = graph.getProgress("c").progress;
      ok(progressB > progressA);
      ok(progressC > progressB);
    });

    it("terminal node returns progress === max", () => {
      const { progress, max } = graph.getProgress("c");
      deepStrictEqual(progress, max);
    });

    it("max is always 100", () => {
      deepStrictEqual(graph.getProgress("a").max, 100);
      deepStrictEqual(graph.getProgress("b").max, 100);
      deepStrictEqual(graph.getProgress("c").max, 100);
    });

    it("isFinal is true for the terminal node", () => {
      deepStrictEqual(graph.isFinal("c"), true);
    });

    it("isFinal is false for non-terminal nodes", () => {
      deepStrictEqual(graph.isFinal("a"), false);
      deepStrictEqual(graph.isFinal("b"), false);
    });
  });

  describe("branching flow", () => {
    const router = {
      start: [{ target: "left" as const }, { target: "right" as const }],
      left: null,
      right: null,
    };
    const graph = precomputeProgress(router, "start");

    it("sibling branch nodes get the same depth", () => {
      deepStrictEqual(
        graph.getProgress("left").progress,
        graph.getProgress("right").progress,
      );
    });

    it("branch nodes have higher progress than their parent", () => {
      ok(
        graph.getProgress("left").progress >
          graph.getProgress("start").progress,
      );
    });
  });

  describe("array item locking", () => {
    const router = {
      list: [
        { target: "item" as const, type: "addArrayItem" as const },
        { target: "done" as const },
      ],
      item: "done" as const,
      done: null,
    };
    const graph = precomputeProgress(router, "list");

    it("array item node gets the same depth as its parent list node", () => {
      deepStrictEqual(
        graph.getProgress("item").progress,
        graph.getProgress("list").progress,
      );
    });

    it("done node has greater depth than list node", () => {
      ok(
        graph.getProgress("done").progress > graph.getProgress("list").progress,
      );
    });
  });

  describe("single-node flow", () => {
    const router = { only: null } as const;
    const graph = precomputeProgress(router, "only");

    it("returns max progress for the sole node", () => {
      const { progress, max } = graph.getProgress("only");
      deepStrictEqual(progress, max);
    });

    it("isFinal is true for the sole node", () => {
      deepStrictEqual(graph.isFinal("only"), true);
    });
  });

  describe("progress normalization", () => {
    it("non-final nodes have progress at most 99", () => {
      const router = { a: "b", b: null } as const;
      const graph = precomputeProgress(router, "a");
      ok(graph.getProgress("a").progress <= 99);
    });
  });
});
