import { describe, it } from "node:test";
import {
  evaluateRoute,
  extractEdges,
  evaluateAllBranches,
} from "../src/routing.ts";
import { strictEqual } from "node:assert";

const noData = { pageData: { arrayIndexes: [] } };

describe("evaluateRoute", () => {
  it("returns null for undefined route", () => {
    strictEqual(evaluateRoute(undefined, noData), null);
  });

  it("returns null for null route", () => {
    strictEqual(evaluateRoute(null, noData), null);
  });

  it("returns the string target directly", () => {
    strictEqual(evaluateRoute("step2", noData), "step2");
  });

  it("returns first passing guard target", () => {
    const route = [
      { target: "a", guard: () => false },
      { target: "b", guard: () => true },
      { target: "c", guard: () => true },
    ];
    strictEqual(evaluateRoute(route, noData), "b");
  });

  it("returns null when no guard passes", () => {
    const route = [
      { target: "a", guard: () => false },
      { target: "b", guard: () => false },
    ];
    strictEqual(evaluateRoute(route, noData), null);
  });

  it("returns target when no guard is specified", () => {
    const route = [{ target: "a" }];
    strictEqual(evaluateRoute(route, noData), "a");
  });

  it("skips addArrayItem transition when traverseArrays is false", () => {
    const route = [
      { target: "item", type: "addArrayItem" as const },
      { target: "next" },
    ];
    strictEqual(evaluateRoute(route, noData, false), "next");
  });

  it("returns addArrayItem target when traverseArrays is true", () => {
    const route = [
      { target: "item", type: "addArrayItem" as const },
      { target: "next" },
    ];
    strictEqual(evaluateRoute(route, noData, true), "item");
  });

  it("passes data to guard function", () => {
    const route = [
      {
        target: "yes",
        guard: (d: { flag?: boolean }) => d.flag === true,
      },
      { target: "no" },
    ];
    strictEqual(
      evaluateRoute(route, { flag: true, pageData: { arrayIndexes: [] } }),
      "yes",
    );
    strictEqual(
      evaluateRoute(route, { flag: false, pageData: { arrayIndexes: [] } }),
      "no",
    );
  });
});

describe("extractEdges", () => {
  it("returns empty array for undefined", () => {
    strictEqual(extractEdges(undefined).length, 0);
  });

  it("returns empty array for null", () => {
    strictEqual(extractEdges(null).length, 0);
  });

  it("returns [string] for a string route", () => {
    strictEqual(extractEdges("step2").length, 1);
    strictEqual(extractEdges("step2")[0], "step2");
  });

  it("returns all non-null targets from array route", () => {
    const route = [{ target: "a" }, { target: null }, { target: "b" }];
    const edges = extractEdges(route);
    strictEqual(edges.length, 2);
    strictEqual(edges[0], "a");
    strictEqual(edges[1], "b");
  });

  it("returns empty array when all targets are null", () => {
    strictEqual(extractEdges([{ target: null }]).length, 0);
  });

  it("includes addArrayItem targets", () => {
    const route = [
      { target: "item", type: "addArrayItem" as const },
      { target: "next" },
    ];
    const edges = extractEdges(route);
    strictEqual(edges.length, 2);
    strictEqual(edges[0], "item");
    strictEqual(edges[1], "next");
  });
});

describe("evaluateAllBranches", () => {
  it("returns empty array for undefined", () => {
    strictEqual(evaluateAllBranches(undefined, noData).length, 0);
  });

  it("returns empty array for null", () => {
    strictEqual(evaluateAllBranches(null, noData).length, 0);
  });

  it("returns [string] for a string route", () => {
    const result = evaluateAllBranches("step2", noData);
    strictEqual(result.length, 1);
    strictEqual(result[0], "step2");
  });

  it("collects all passing-guard targets, not just first", () => {
    const route = [
      { target: "a", guard: () => true },
      { target: "b", guard: () => false },
      { target: "c", guard: () => true },
    ];
    const result = evaluateAllBranches(route, noData);
    strictEqual(result.length, 2);
    strictEqual(result[0], "a");
    strictEqual(result[1], "c");
  });

  it("includes targets without a guard", () => {
    const route = [
      { target: "a" },
      { target: "b", guard: () => false },
      { target: "c" },
    ];
    const result = evaluateAllBranches(route, noData);
    strictEqual(result.length, 2);
    strictEqual(result[0], "a");
    strictEqual(result[1], "c");
  });

  it("filters null targets even when guard passes", () => {
    const route = [{ target: null, guard: () => true }, { target: "a" }];
    const result = evaluateAllBranches(route, noData);
    strictEqual(result.length, 1);
    strictEqual(result[0], "a");
  });
});
