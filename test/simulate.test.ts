import { describe, it } from "node:test";
import { ok, deepStrictEqual } from "node:assert";
import z from "zod";
import { compileFlowConfig } from "../src/compileFlowConfig.ts";
import { simulate } from "../src/simulate.ts";

describe("simulate", () => {
  describe("linear flow", () => {
    const router = { a: "b", b: "c", c: null } as const;

    it("returns the full linear path in order", () => {
      const { path } = simulate(router, "a", {});
      deepStrictEqual(path, ["a", "b", "c"]);
    });

    it("terminates successfully when it reaches a null transition", () => {
      const { isComplete } = simulate(router, "a", {});
      deepStrictEqual(isComplete, true);
    });
  });

  describe("guarded transitions", () => {
    const flow = compileFlowConfig({
      pages: {
        start: {
          path: "/start",
          pageSchema: { flag: z.boolean().optional() },
        },
        "yes-path": { path: "/yes-path" },
        "no-path": { path: "/no-path" },
      },
      initialStep: "start",
      transitions: {
        start: [
          { target: "yes-path", guard: (d) => d.flag === true },
          { target: "no-path" },
        ],
        "yes-path": null,
        "no-path": null,
      },
    });

    it("follows the passing guard branch", () => {
      const { path } = simulate(flow.transitions, flow.initialStep, {
        flag: true,
      });
      deepStrictEqual(path, ["start", "yes-path"]);
    });

    it("follows the fallback when the guard fails", () => {
      const { path } = simulate(flow.transitions, flow.initialStep, {
        flag: false,
      });
      deepStrictEqual(path, ["start", "no-path"]);
    });

    it("does not terminate successfully when all guards fail", () => {
      const blockedFlow = compileFlowConfig({
        pages: {
          start: { path: "/start" },
          next: { path: "/next" },
        },
        initialStep: "start",
        transitions: {
          start: [{ target: "next", guard: () => false }],
          next: null,
        },
      });
      const { isComplete } = simulate(
        blockedFlow.transitions,
        blockedFlow.initialStep,
        {},
      );
      deepStrictEqual(isComplete, false);
    });
  });

  describe("cycle safety", () => {
    it("does not loop infinitely on a cycle", () => {
      const router = { a: "b", b: "a" } as const;
      const result = simulate(router, "a", {});
      ok(result !== undefined); // Should not throw
    });
  });

  describe("BFS reachableSet", () => {
    it("includes all nodes reachable under any guard outcome", () => {
      const flow = compileFlowConfig({
        pages: {
          start: {
            path: "/start",
            pageSchema: { go: z.boolean().optional() },
          },
          conditional: { path: "/conditional" },
          always: { path: "/always" },
        },
        initialStep: "start",
        transitions: {
          start: [
            { target: "conditional", guard: (d) => d.go === true },
            { target: "always" },
          ],
          conditional: null,
          always: null,
        },
      });
      const { reachableSet } = simulate(flow.transitions, flow.initialStep, {
        go: true,
      });
      ok(reachableSet.has("start"));
      ok(reachableSet.has("conditional"));
      ok(reachableSet.has("always"));
    });

    it("excludes nodes guarded by always-false guards", () => {
      const router = {
        start: [
          { target: "blocked" as const, guard: () => false },
          { target: "reachable" as const },
        ],
        blocked: null,
        reachable: null,
      };
      const { reachableSet } = simulate(router, "start", {});
      ok(reachableSet.has("reachable"));
      ok(!reachableSet.has("blocked"));
    });
  });

  describe("parentMap", () => {
    const router = { a: "b", b: "c", c: null } as const;

    it("maps each non-initial node to its BFS parent", () => {
      const { parentMap } = simulate(router, "a", {});
      deepStrictEqual(parentMap.get("b"), "a");
      deepStrictEqual(parentMap.get("c"), "b");
    });

    it("initial node has no entry in parentMap", () => {
      const { parentMap } = simulate(router, "a", {});
      ok(!parentMap.has("a"));
    });
  });
});
