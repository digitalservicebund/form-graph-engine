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

    it("steps.total is the same for every node in the flow", () => {
      deepStrictEqual(graph.getProgress("a").steps.total, 3);
      deepStrictEqual(graph.getProgress("b").steps.total, 3);
      deepStrictEqual(graph.getProgress("c").steps.total, 3);
    });

    it("steps.current is 1-based and increments along the path", () => {
      deepStrictEqual(graph.getProgress("a").steps.current, 1);
      deepStrictEqual(graph.getProgress("b").steps.current, 2);
      deepStrictEqual(graph.getProgress("c").steps.current, 3);
    });

    it("terminal node has steps.current === steps.total", () => {
      const { steps } = graph.getProgress("c");
      deepStrictEqual(steps.current, steps.total);
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

    it("sibling branch nodes get the same steps.current", () => {
      deepStrictEqual(
        graph.getProgress("left").steps.current,
        graph.getProgress("right").steps.current,
      );
    });

    it("steps.total is the same for every node in the flow", () => {
      deepStrictEqual(graph.getProgress("start").steps.total, 2);
      deepStrictEqual(graph.getProgress("left").steps.total, 2);
      deepStrictEqual(graph.getProgress("right").steps.total, 2);
    });
  });

  describe("final node below max depth", () => {
    const router = {
      start: [{ target: "left" as const }, { target: "right" as const }],
      left: null,
      right: "deep" as const,
      deep: null,
    };
    const graph = precomputeProgress(router, "start");

    it("steps.total is the same for every node in the flow", () => {
      deepStrictEqual(graph.getProgress("start").steps.total, 3);
      deepStrictEqual(graph.getProgress("left").steps.total, 3);
      deepStrictEqual(graph.getProgress("right").steps.total, 3);
      deepStrictEqual(graph.getProgress("deep").steps.total, 3);
    });

    it("a final node on a short branch saturates to steps.total", () => {
      deepStrictEqual(graph.getProgress("left").steps, {
        total: 3,
        current: 3,
      });
    });

    it("non-final nodes report their actual depth", () => {
      deepStrictEqual(graph.getProgress("start").steps.current, 1);
      deepStrictEqual(graph.getProgress("right").steps.current, 2);
    });

    it("the deepest final node also reports steps.total", () => {
      deepStrictEqual(graph.getProgress("deep").steps.current, 3);
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

    it("array item node shares steps.current with its parent list node", () => {
      deepStrictEqual(
        graph.getProgress("item").steps.current,
        graph.getProgress("list").steps.current,
      );
    });

    it("steps.total does not count array item nodes", () => {
      deepStrictEqual(graph.getProgress("list").steps.total, 2);
      deepStrictEqual(graph.getProgress("item").steps.total, 2);
      deepStrictEqual(graph.getProgress("done").steps.total, 2);
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

    it("reports one step of one", () => {
      deepStrictEqual(graph.getProgress("only").steps, {
        total: 1,
        current: 1,
      });
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
