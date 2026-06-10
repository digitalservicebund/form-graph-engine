import { describe, it } from "node:test";
import { compileFlowConfig } from "../src/compileFlowConfig.ts";
import z from "zod";
import { deepStrictEqual } from "node:assert";
import { throws } from "node:assert/strict";

const pages = {
  start: { path: "/start" },
  info: { path: "/info", pageSchema: { name: z.string() } },
  typed: { path: "/typed", pageSchema: z.object({ age: z.number() }) },
  end: { path: "/end" },
} as const;

const transitions = {
  start: "info",
  info: "typed",
  typed: "end",
  end: null,
} as const;

const flow = compileFlowConfig({ pages, initialStep: "start", transitions });

describe("compileFlowConfig", () => {
  describe("path round-trip", () => {
    it("getNodeKeyFromPath(getPathFromNodeKey(key)) === key for all nodes", () => {
      for (const key of Object.keys(pages) as (keyof typeof pages)[]) {
        const path = flow.getPathFromNodeKey(key);
        deepStrictEqual(flow.getNodeKeyFromPath(path!), key);
      }
    });

    it("getPathFromNodeKey returns undefined for undefined input", () => {
      deepStrictEqual(flow.getPathFromNodeKey(undefined), undefined);
    });

    it("getNodeKeyFromPath returns undefined for an unknown path", () => {
      deepStrictEqual(flow.getNodeKeyFromPath("/unknown"), undefined);
    });

    it("getPathFromNodeKey throws for an unknown node key", () => {
      throws(() => flow.getPathFromNodeKey("does-not-exist" as never), {
        message: /Missing page config for node key/,
      });
    });
  });

  describe("initialPath", () => {
    it("is derived from the configured initialStep", () => {
      const altFlow = compileFlowConfig({
        pages,
        initialStep: "typed",
        transitions,
      });
      deepStrictEqual(altFlow.initialPath, "/typed");
    });

    it("throws when initialStep has no page config", () => {
      throws(
        () => {
          compileFlowConfig({
            pages: { start: { path: "/start" } } as const,
            initialStep: "missing" as never,
            transitions: { start: null },
          });
        },
        { message: /Missing page config for node key/ },
      );
    });
  });

  describe("schema", () => {
    it("ZodRawShape is compiled to a ZodObject", () => {
      const schema = flow.getSchema("/info");
      deepStrictEqual(schema instanceof z.ZodObject, true);
    });

    it("ZodObject is passed through unchanged", () => {
      const schema = flow.getSchema("/typed");
      deepStrictEqual(schema instanceof z.ZodObject, true);
    });

    it("pages without schema return an empty schema that parses {}", () => {
      const schema = flow.getSchema("/start");
      deepStrictEqual(schema?.parse({}), {});
    });

    it("returns undefined for an unknown path", () => {
      deepStrictEqual(flow.getSchema("/unknown"), undefined);
    });
  });

  describe("fieldNames", () => {
    it("extracts field names from ZodRawShape", () => {
      deepStrictEqual(flow.getFieldNames("/info"), ["name"]);
    });

    it("extracts field names from a ZodObject", () => {
      deepStrictEqual(flow.getFieldNames("/typed"), ["age"]);
    });

    it("returns empty array for pages without a schema", () => {
      deepStrictEqual(flow.getFieldNames("/start"), []);
    });

    it("returns empty array for an unknown path", () => {
      deepStrictEqual(flow.getFieldNames("/unknown"), []);
    });

    it("getFieldNamesByNodeKey returns field names by node key", () => {
      deepStrictEqual(flow.getFieldNamesByNodeKey("info"), ["name"]);
    });
  });

  describe("mandatory leading slash", () => {
    it("throws when a path does not start with /", () => {
      throws(
        () => {
          compileFlowConfig({
            pages: { bad: { path: "no-slash" } } as const,
            initialStep: "bad",
            transitions: { bad: null },
          });
        },
        { message: /must start with "\// },
      );
    });
  });

  describe("duplicate paths", () => {
    it("uses the last page written to pathMap for getNodeKeyFromPath", () => {
      const duplicatePathFlow = compileFlowConfig({
        pages: { first: { path: "/same" }, second: { path: "/same" } } as const,
        initialStep: "first",
        transitions: { first: null, second: null },
      });

      deepStrictEqual(duplicatePathFlow.getNodeKeyFromPath("/same"), "second");
    });
  });

  describe("arrayInfo", () => {
    const arrayPages = {
      list: {
        path: "/list",
        arraySummary: { name: "items", schema: z.array(z.string()) },
      },
      item: { path: "/items/#/daten" },
      done: { path: "/done" },
    } as const;

    const arrayTransitions = {
      list: [
        { target: "item" as const, type: "addArrayItem" as const },
        { target: "done" as const },
      ],
      item: "done" as const,
      done: null,
    };

    const arrayFlow = compileFlowConfig({
      pages: arrayPages,
      initialStep: "list",
      transitions: arrayTransitions,
    });

    it("returns undefined for non-array pages", () => {
      deepStrictEqual(flow.getArrayInfo("/start"), undefined);
    });

    it("returns the array name from arraySummary", () => {
      deepStrictEqual(arrayFlow.getArrayInfo("/list")?.name, "items");
    });

    it("returns the entryPoint derived from the addArrayItem target path", () => {
      // path "/items/#/daten" → entryPoint is last segment after "#" → "daten"
      deepStrictEqual(arrayFlow.getArrayInfo("/list")?.entryPoint, "daten");
    });

    it("returns entryNodeKey for array summary pages", () => {
      deepStrictEqual(arrayFlow.getArrayInfo("/list")?.entryNodeKey, "item");
    });

    it("keeps only name when no addArrayItem transition exists", () => {
      const noAddFlow = compileFlowConfig({
        pages: {
          list: {
            path: "/list",
            arraySummary: { name: "items", schema: z.array(z.string()) },
          },
          done: { path: "/done" },
        } as const,
        initialStep: "list",
        transitions: { list: [{ target: "done" }], done: null },
      });

      deepStrictEqual(noAddFlow.getArrayInfo("/list"), { name: "items" });
    });

    it("returns undefined for unknown path", () => {
      deepStrictEqual(arrayFlow.getArrayInfo("/unknown"), undefined);
    });
  });

  describe("isFinal", () => {
    it("is false for non-terminal steps", () => {
      deepStrictEqual(flow.isFinal("/start"), false);
    });

    it("is true for the terminal step", () => {
      deepStrictEqual(flow.isFinal("/end"), true);
    });

    it("returns undefined for an unknown path", () => {
      deepStrictEqual(flow.isFinal("/unknown"), undefined);
    });
  });

  describe("getProgress", () => {
    it("terminal step has progress equal to max", () => {
      const result = flow.getProgress("/end");
      deepStrictEqual(result?.progress, result?.max);
    });

    it("initial step has progress less than max", () => {
      const result = flow.getProgress("/start");
      deepStrictEqual(result!.progress < result!.max, true);
    });

    it("returns undefined for an unknown path", () => {
      deepStrictEqual(flow.getProgress("/unknown"), undefined);
    });
  });
});
