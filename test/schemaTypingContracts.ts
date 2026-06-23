import { compileFlowConfig } from "../src/compileFlowConfig.ts";
import { createFlowSession } from "../src/flowSession.ts";
import z from "zod";

const pages = {
  start: { path: "/start" },
  info: {
    path: "/info",
    pageSchema: { name: z.string(), answer: z.enum(["ja", "nein"]) },
  },
  typed: { path: "/typed", pageSchema: z.object({ age: z.number() }) },
} as const;

const transitions = {
  start: "info",
  info: "typed",
  typed: null,
} as const;

const flow = compileFlowConfig({ pages, initialStep: "start", transitions });

const rawShapeSchema = flow.getSchema("/info");
const typedSchema: z.ZodObject<{ age: z.ZodNumber }> = flow.getSchema("/typed");
const startSchema: undefined = flow.getSchema("/start");
const unknownSchema: undefined = flow.getSchema("/unknown");

const infoFieldNames: Array<"name" | "answer"> = flow.getFieldNames("/info");
const typedFieldNames: Array<"age"> = flow.getFieldNames("/typed");
const startFieldNames: never[] = flow.getFieldNames("/start");
const unknownFieldNames: never[] = flow.getFieldNames("/unknown");
const infoFieldNamesByNodeKey: Array<"name" | "answer"> =
  flow.getFieldNamesByNodeKey("info");
const typedFieldNamesByNodeKey: Array<"age"> =
  flow.getFieldNamesByNodeKey("typed");
const startFieldNamesByNodeKey: never[] = flow.getFieldNamesByNodeKey("start");

const parsedRawShape: { name: string; answer: "ja" | "nein" } =
  rawShapeSchema.parse({ name: "Ada", answer: "ja" });

const typedSessionSchema: z.ZodObject<{ age: z.ZodNumber }> = createFlowSession(
  flow,
  {},
  "/typed",
).pageSchema;
const startSessionSchema: undefined = createFlowSession(
  flow,
  {},
  "/start",
).pageSchema;

void rawShapeSchema;
void typedSchema;
void startSchema;
void unknownSchema;
void infoFieldNames;
void typedFieldNames;
void startFieldNames;
void unknownFieldNames;
void infoFieldNamesByNodeKey;
void typedFieldNamesByNodeKey;
void startFieldNamesByNodeKey;
void parsedRawShape;
void typedSessionSchema;
void startSessionSchema;
