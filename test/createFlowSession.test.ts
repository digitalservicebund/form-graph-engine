import { describe, it } from "node:test";
import { ok, deepStrictEqual, throws, strictEqual } from "node:assert";
import { createFlowSession } from "../src/flowSession.ts";
import { compileFlowConfig } from "../src/compileFlowConfig.ts";
import z from "zod";

const noData = {};

const pages = {
  start: { path: "/start" },
  middle: { path: "/middle", pageSchema: { answer: z.string() } },
  end: { path: "/end" },
} as const;

const transitions = {
  start: "middle",
  middle: "end",
  end: null,
} as const;

const flow = compileFlowConfig({ pages, initialStep: "start", transitions });

describe("createFlowSession", () => {
  describe("invalid path", () => {
    it("throws an Error for an unknown path", () => {
      throws(() => createFlowSession(flow, noData, "/unknown"), /Invalid path/);
    });

    it("allows known but currently unreachable paths", () => {
      const branchedFlow = compileFlowConfig({
        pages: {
          start: { path: "/start" },
          blocked: { path: "/blocked" },
          open: { path: "/open" },
        },
        initialStep: "start",
        transitions: {
          start: [
            { target: "blocked", guard: () => false },
            { target: "open" },
          ],
          blocked: null,
          open: null,
        },
      });

      const session = createFlowSession(branchedFlow, noData, "/blocked");
      strictEqual(session.nodeKey, "blocked");
      ok(!session.isReachable("/blocked"));
    });
  });

  describe("nodeKey", () => {
    it("returns the correct nodeKey for the current path", () => {
      const session = createFlowSession(flow, noData, "/start");
      deepStrictEqual(session.nodeKey, "start");
    });

    it("returns the correct nodeKey for a non-initial step", () => {
      const session = createFlowSession(flow, noData, "/middle");
      deepStrictEqual(session.nodeKey, "middle");
    });

    it("normalizes numeric array segments before node lookup", () => {
      const arrayFlow = compileFlowConfig({
        pages: {
          list: {
            path: "/list",
            arraySummary: { name: "items", schema: z.array(z.string()) },
          },
          item: { path: "/items/#/daten" },
          done: { path: "/done" },
        },
        initialStep: "list",
        transitions: {
          list: [
            { target: "item" as const, type: "addArrayItem" as const },
            { target: "done" as const },
          ],
          item: [
            {
              target: "done" as const,
              guard: (d) => d.pageData.arrayIndexes?.[0] === 2,
            },
            { target: "list" as const },
          ],
          done: null,
        },
      });

      const session = createFlowSession(arrayFlow, noData, "/items/2/daten");
      deepStrictEqual(session.nodeKey, "item");
      deepStrictEqual(session.nextPath, "/done");
    });
  });

  describe("initialPath", () => {
    it("always returns the path of the initial step", () => {
      const session = createFlowSession(flow, noData, "/end");
      deepStrictEqual(session.initialPath, "/start");
    });
  });

  describe("isComplete", () => {
    it("is true when the simulation reaches a null transition", () => {
      const session = createFlowSession(flow, noData, "/start");
      deepStrictEqual(session.isComplete, true);
    });

    it("is false when guards block all forward progress", () => {
      const blockedPages = {
        a: { path: "/a" },
        b: { path: "/b" },
      } as const;
      const blockedTransitions = {
        a: [{ target: "b" as const, guard: () => false }],
        b: null,
      };
      const blockedFlow = compileFlowConfig({
        pages: blockedPages,
        initialStep: "a",
        transitions: blockedTransitions,
      });
      const session = createFlowSession(blockedFlow, noData, "/a");
      deepStrictEqual(session.isComplete, false);
    });
  });

  describe("pageSchema", () => {
    it("returns a ZodObject for pages with a schema", () => {
      const session = createFlowSession(flow, noData, "/middle");
      ok(session.pageSchema instanceof z.ZodObject);
    });

    it("returns an empty-object schema for pages without a schema", () => {
      const session = createFlowSession(flow, noData, "/start");
      deepStrictEqual(session.pageSchema?.parse({}), {});
    });
  });

  describe("fieldNames", () => {
    it("returns field names for pages with a schema", () => {
      const session = createFlowSession(flow, noData, "/middle");
      deepStrictEqual(session.fieldNames, ["answer"]);
    });

    it("returns an empty array for pages without a schema", () => {
      const session = createFlowSession(flow, noData, "/start");
      deepStrictEqual(session.fieldNames, []);
    });
  });

  describe("nextPath", () => {
    it("returns the next step path", () => {
      const session = createFlowSession(flow, noData, "/start");
      deepStrictEqual(session.nextPath, "/middle");
    });

    it("returns undefined at the terminal step", () => {
      const session = createFlowSession(flow, noData, "/end");
      deepStrictEqual(session.nextPath, undefined);
    });

    it("skips addArrayItem transitions to return the next main-branch step", () => {
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
      const session = createFlowSession(arrayFlow, noData, "/list");
      deepStrictEqual(session.nextPath, "/done");
    });

    it("chooses the first guard branch that matches current data", () => {
      const guardedFlow = compileFlowConfig({
        pages: {
          start: { path: "/start", pageSchema: { answer: z.string() } },
          yes: { path: "/yes" },
          no: { path: "/no" },
          fallback: { path: "/fallback" },
        },
        initialStep: "start",
        transitions: {
          start: [
            { target: "yes", guard: (d) => d.answer === "yes" },
            { target: "no", guard: (d) => d.answer === "no" },
            { target: "fallback" },
          ],
          yes: null,
          no: null,
          fallback: null,
        },
      });

      const session = createFlowSession(
        guardedFlow,
        { answer: "no" },
        "/start",
      );
      deepStrictEqual(session.nextPath, "/no");
    });
  });

  describe("prevPath", () => {
    it("returns the previous step path via BFS parentMap", () => {
      const session = createFlowSession(flow, noData, "/middle");
      deepStrictEqual(session.prevPath, "/start");
    });

    it("returns undefined at the initial step", () => {
      const session = createFlowSession(flow, noData, "/start");
      deepStrictEqual(session.prevPath, undefined);
    });
  });

  describe("isReachable", () => {
    it("returns true for paths reachable from the initial step", () => {
      const session = createFlowSession(flow, noData, "/start");
      ok(session.isReachable("/middle"));
      ok(session.isReachable("/end"));
    });

    it("returns false for an unknown path", () => {
      const session = createFlowSession(flow, noData, "/start");
      ok(!session.isReachable("/nonexistent"));
    });

    it("returns false for a path blocked by always-false guards", () => {
      const branchedPages = {
        start: { path: "/start" },
        blocked: { path: "/blocked" },
        open: { path: "/open" },
      } as const;
      const branchedTransitions = {
        start: [
          { target: "blocked" as const, guard: () => false },
          { target: "open" as const },
        ],
        blocked: null,
        open: null,
      };
      const branchedFlow = compileFlowConfig({
        pages: branchedPages,
        initialStep: "start",
        transitions: branchedTransitions,
      });
      const session = createFlowSession(branchedFlow, noData, "/start");
      ok(!session.isReachable("/blocked"));
      ok(session.isReachable("/open"));
    });
  });

  describe("arrayInfo", () => {
    it("returns undefined for non-array pages", () => {
      const session = createFlowSession(flow, noData, "/start");
      deepStrictEqual(session.arrayInfo, undefined);
    });

    it("returns the array name and entryPoint for array summary pages", () => {
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
      const session = createFlowSession(arrayFlow, noData, "/list");
      strictEqual(session.arrayInfo?.name, "items");
      strictEqual(session.arrayInfo?.entryPoint, "daten");
    });
  });

  describe("path", () => {
    it("contains the simulation path from initial to terminal step", () => {
      const session = createFlowSession(flow, noData, "/start");
      deepStrictEqual(session.path, ["start", "middle", "end"]);
    });
  });

  describe("statusTree", () => {
    it("is populated for flows with nested stepIds", () => {
      const nestedPages = {
        a: { path: "/section/a" },
        b: { path: "/section/b" },
      } as const;
      const nestedTransitions = { a: "b", b: null } as const;
      const nestedFlow = compileFlowConfig({
        pages: nestedPages,
        initialStep: "a",
        transitions: nestedTransitions,
      });
      const session = createFlowSession(nestedFlow, noData, "/section/a");
      ok("/section" in session.statusTree);
    });

    it("marks prefixes as reachable/done based on simulation", () => {
      const treeFlow = compileFlowConfig({
        pages: {
          a: { path: "/section/a" },
          b: { path: "/section/b" },
          hidden: { path: "/hidden/a" },
        },
        initialStep: "a",
        transitions: {
          a: "b",
          b: null,
          hidden: null,
        },
      });

      const session = createFlowSession(treeFlow, noData, "/section/a");
      strictEqual(session.statusTree["/section"]?.isReachable, true);
      strictEqual(session.statusTree["/section"]?.isDone, true);
      strictEqual(session.statusTree["/hidden"]?.isReachable, false);
    });
  });

  describe("prunedUserData", () => {
    it("keeps fields belonging to reachable pages", () => {
      const session = createFlowSession(flow, { answer: "hello" }, "/start");
      deepStrictEqual(session.prunedUserData, { answer: "hello" });
    });

    it("removes fields belonging to unreachable pages", () => {
      const guardedFlow = compileFlowConfig({
        pages: {
          start: { path: "/start" },
          yes: { path: "/yes", pageSchema: { yesField: z.string() } },
          no: { path: "/no", pageSchema: { noField: z.string() } },
        },
        initialStep: "start",
        transitions: {
          start: [
            { target: "yes", guard: (d) => d.yesField === "y" },
            { target: "no" },
          ],
          yes: null,
          no: null,
        },
      });
      // Guard fails → "yes" is unreachable → yesField should be pruned
      const session = createFlowSession(
        guardedFlow,
        { yesField: "no", noField: "n" },
        "/start",
      );
      deepStrictEqual(session.prunedUserData, { noField: "n" });
    });

    it("keeps the top-level array field when the array summary page is reachable", () => {
      const arrayFlow = compileFlowConfig({
        pages: {
          list: {
            path: "/list",
            arraySummary: {
              name: "items",
              schema: z.array(z.object({ val: z.string() })),
            },
          },
          item: { path: "/items/#/daten", pageSchema: { val: z.string() } },
          done: { path: "/done" },
        },
        initialStep: "list",
        transitions: {
          list: [
            { target: "item" as const, type: "addArrayItem" as const },
            { target: "done" as const },
          ],
          item: "done" as const,
          done: null,
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const session = createFlowSession(
        arrayFlow,
        { items: [{ val: "a" }] } as any,
        "/list",
      );
      deepStrictEqual(session.prunedUserData, { items: [{ val: "a" }] });
    });

    it("does not fan out array item paths when summary data is not an array", () => {
      const arrayFlow = compileFlowConfig({
        pages: {
          list: {
            path: "/list",
            arraySummary: {
              name: "items",
              schema: z.array(z.object({ val: z.string() })),
            },
          },
          item: { path: "/items/#/daten", pageSchema: { val: z.string() } },
          done: { path: "/done" },
        },
        initialStep: "list",
        transitions: {
          list: [
            { target: "item" as const, type: "addArrayItem" as const },
            { target: "done" as const },
          ],
          item: "done" as const,
          done: null,
        },
      });

      const session = createFlowSession(
        arrayFlow,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { items: {} as any } as any,
        "/list",
      );

      ok(!session.isReachable("/items/#/daten"));
      deepStrictEqual(session.nextPath, "/done");
      deepStrictEqual(session.prunedUserData, {});
    });

    it("prunes stale fields within each array item based on per-item BFS traversal", () => {
      // Each item asks isAdult first, then branches:
      //   isAdult=yes → name page
      //   isAdult=no  → birthday page
      // If an item previously had isAdult=yes+name, then the user changed to isAdult=no+birthday,
      // the name field should be pruned even though 'name' is reachable for other items.
      const arrayFlow = compileFlowConfig({
        pages: {
          list: {
            path: "/list",
            arraySummary: {
              name: "people",
              schema: z.array(
                z.object({
                  isAdult: z.string(),
                  name: z.string().optional(),
                  birthday: z.string().optional(),
                }),
              ),
            },
          },
          adultCheck: {
            path: "/people/#/adult-check",
            pageSchema: { isAdult: z.string() },
          },
          namePage: {
            path: "/people/#/name",
            pageSchema: { name: z.string() },
          },
          birthdayPage: {
            path: "/people/#/birthday",
            pageSchema: { birthday: z.string() },
          },
          done: { path: "/done" },
        },
        initialStep: "list",
        transitions: {
          list: [
            { target: "adultCheck" as const, type: "addArrayItem" as const },
            { target: "done" as const },
          ],
          adultCheck: [
            {
              target: "namePage" as const,
              guard: (d) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (d as any).people?.[(d as any).pageData?.arrayIndexes?.[0]]
                  ?.isAdult === "yes",
            },
            { target: "birthdayPage" as const },
          ],
          namePage: "list" as const,
          birthdayPage: "list" as const,
          done: null,
        },
      });

      // item 0: adult (isAdult=yes) → name reachable, birthday unreachable
      // item 1: minor (isAdult=no) → birthday reachable, name unreachable
      // item 1 also has a stale 'name' from a previous answer that should be pruned
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const session = createFlowSession(
        arrayFlow,
        {
          people: [
            { isAdult: "yes", name: "Alice" },
            { isAdult: "no", birthday: "1990-01-01", name: "stale" },
          ],
        } as any,
        "/list",
      );

      deepStrictEqual(session.prunedUserData, {
        people: [
          { isAdult: "yes", name: "Alice" },
          { isAdult: "no", birthday: "1990-01-01" },
        ],
      });
    });

    it("does not include pageData in prunedUserData", () => {
      const session = createFlowSession(flow, noData, "/start");
      ok(!("pageData" in session.prunedUserData));
    });

    it("prunes stale fields in nested array items based on per-item traversal", () => {
      // Flow: childrenList → childEntry (name) → toyList → toyEntry (toyName + isFavorite)
      //       → toyColor (if isFavorite=yes) → toyList → childrenList → done
      // Toy 0: isFavorite=yes → color kept
      // Toy 1: isFavorite=no  → stale color pruned
      const nestedFlow = compileFlowConfig({
        pages: {
          childrenList: {
            path: "/children",
            arraySummary: {
              name: "children",
              schema: z.array(z.object({ name: z.string() })),
            },
          },
          childEntry: {
            path: "/children/#/name",
            pageSchema: { name: z.string() },
          },
          toyList: {
            path: "/children/#/toys",
            arraySummary: {
              name: "toys",
              schema: z.array(z.object({ toyName: z.string() })),
            },
          },
          toyEntry: {
            path: "/children/#/toys/#/entry",
            pageSchema: { toyName: z.string(), isFavorite: z.string() },
          },
          toyColor: {
            path: "/children/#/toys/#/color",
            pageSchema: { color: z.string() },
          },
          done: { path: "/done" },
        },
        initialStep: "childrenList",
        transitions: {
          childrenList: [
            { target: "childEntry" as const, type: "addArrayItem" as const },
            { target: "done" as const },
          ],
          childEntry: "toyList" as const,
          toyList: [
            { target: "toyEntry" as const, type: "addArrayItem" as const },
            { target: "childrenList" as const },
          ],
          toyEntry: [
            {
              target: "toyColor" as const,
              guard: (d) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (d as any).children?.[(d as any).pageData?.arrayIndexes?.[0]]
                  ?.toys?.[(d as any).pageData?.arrayIndexes?.[1]]
                  ?.isFavorite === "yes",
            },
            { target: "toyList" as const },
          ],
          toyColor: "toyList" as const,
          done: null,
        },
      });

      // Child 0 "Alice" has two toys:
      //   toy 0: isFavorite=yes → color="red" is kept
      //   toy 1: isFavorite=no  → color="stale" should be pruned
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const session = createFlowSession(
        nestedFlow,
        {
          children: [
            {
              name: "Alice",
              toys: [
                { toyName: "Lego", isFavorite: "yes", color: "red" },
                { toyName: "Ball", isFavorite: "no", color: "stale" },
              ],
            },
          ],
        } as any,
        "/children",
      );

      deepStrictEqual(session.prunedUserData, {
        children: [
          {
            name: "Alice",
            toys: [
              { toyName: "Lego", isFavorite: "yes", color: "red" },
              { toyName: "Ball", isFavorite: "no" },
            ],
          },
        ],
      });
    });
  });
});
