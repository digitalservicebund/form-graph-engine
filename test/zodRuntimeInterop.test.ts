import { deepStrictEqual, ok } from "node:assert";
import { describe, it } from "node:test";
import { compileFlowConfig } from "../src/compileFlowConfig.ts";
import { createFlowSession } from "../src/flowSession.ts";
import zAlt from "zod-alt";

describe("zod runtime interop", () => {
  it("accepts schemas created by an alternate zod 4 minor", () => {
    const flow = compileFlowConfig({
      pages: {
        start: { path: "/start" },
        fromAltObject: {
          path: "/from-alt-object",
          pageSchema: zAlt.object({ name: zAlt.string() }),
        },
        fromAltShape: {
          path: "/from-alt-shape",
          pageSchema: { accepted: zAlt.boolean() },
        },
        done: { path: "/done" },
      },
      initialStep: "start",
      transitions: {
        start: "fromAltObject",
        fromAltObject: "fromAltShape",
        fromAltShape: "done",
        done: null,
      },
    } as const);

    const objectSchema = flow.getSchema("/from-alt-object");
    const shapeSchema = flow.getSchema("/from-alt-shape");

    ok(objectSchema);
    ok(shapeSchema);

    deepStrictEqual(objectSchema.safeParse({ name: "Ada" }).success, true);
    deepStrictEqual(shapeSchema.safeParse({ accepted: true }).success, true);

    const userData = { name: "Ada", accepted: true };
    const session = createFlowSession(flow, userData, "/from-alt-shape");
    deepStrictEqual(session.fieldNames, ["accepted"]);
  });
});
