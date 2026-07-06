import { deepStrictEqual, ok } from "node:assert";
import { describe, it } from "node:test";
import { compileFlowConfig } from "../src/compileFlowConfig.ts";
import { createFlowSession } from "../src/flowSession.ts";
import type { PageSchema } from "../src/types.ts";
import zAlt from "zod-alt";

const altObjectSchema = zAlt.object({ name: zAlt.string() }) as unknown as PageSchema;
const altRawShape = {
  accepted: zAlt.boolean(),
} as unknown as PageSchema;

describe("zod runtime interop", () => {
  it("accepts schemas created by an alternate zod 4 minor", () => {
    const flow = compileFlowConfig({
      pages: {
        start: { path: "/start" },
        fromAltObject: {
          path: "/from-alt-object",
          pageSchema: altObjectSchema,
        },
        fromAltShape: {
          path: "/from-alt-shape",
          pageSchema: altRawShape,
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

    const session = createFlowSession(flow, { name: "Ada", accepted: true }, "/from-alt-shape");
    deepStrictEqual(session.fieldNames, ["accepted"]);
  });
});
