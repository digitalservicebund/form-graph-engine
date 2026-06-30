import { describe, it } from "node:test";
import {
  evaluateRoute,
  extractEdges,
  evaluateAllBranches,
  findNextIncompleteNode,
} from "../src/routing.ts";
import { strictEqual } from "node:assert";
import { compileFlowConfig } from "../src/compileFlowConfig.ts";
import z from "zod";

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

describe("findNextIncompleteNode", () => {
  const flow = compileFlowConfig({
    pages: {
      start: { path: "/start" },
      a: { path: "/a", pageSchema: { requiredA: z.string() } },
      b: { path: "/b", pageSchema: { requiredB: z.string() } },
      done: { path: "/done" },
    },
    initialStep: "start",
    transitions: {
      start: "a",
      a: "b",
      b: "done",
      done: null,
    },
  });

  it("returns first incomplete schema page regardless of later fields", () => {
    const withEmpty = findNextIncompleteNode(flow, {}, "start");
    strictEqual(withEmpty, "a");

    const withLaterData = findNextIncompleteNode(
      flow,
      { requiredB: "ok" },
      "start",
    );
    strictEqual(withLaterData, "a");
  });

  it("returns the deepest reachable node when all form pages are complete", () => {
    const nextIncomplete = findNextIncompleteNode(
      flow,
      {
        requiredA: "ok",
        requiredB: "ok",
      },
      "start",
    );

    strictEqual(nextIncomplete, "done");
  });

  it("returns the earliest schema-less page when it precedes the first incomplete schema page", () => {
    const flowWithInfoPages = compileFlowConfig({
      pages: {
        start: { path: "/start" },
        infoOne: { path: "/info-one" },
        infoTwo: { path: "/info-two" },
        form: { path: "/form", pageSchema: { requiredField: z.string() } },
        done: { path: "/done" },
      },
      initialStep: "start",
      transitions: {
        start: "infoOne",
        infoOne: "infoTwo",
        infoTwo: "form",
        form: "done",
        done: null,
      },
    });

    const nextIncomplete = findNextIncompleteNode(
      flowWithInfoPages,
      {},
      "start",
    );

    strictEqual(nextIncomplete, "infoOne");
  });

  it("returns schema-less pages at flow end instead of skipping them", () => {
    const flowEndingWithInfo = compileFlowConfig({
      pages: {
        form: { path: "/form", pageSchema: { requiredField: z.string() } },
        infoOne: { path: "/info-one" },
        infoTwo: { path: "/info-two" },
      },
      initialStep: "form",
      transitions: {
        form: "infoOne",
        infoOne: "infoTwo",
        infoTwo: null,
      },
    });

    const userData = { requiredField: "ok" };

    strictEqual(
      findNextIncompleteNode(flowEndingWithInfo, userData, "form"),
      "infoOne",
    );
    strictEqual(
      findNextIncompleteNode(flowEndingWithInfo, userData, "infoOne"),
      "infoTwo",
    );
  });
});
