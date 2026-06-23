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
const unknownSchema: undefined = flow.getSchema("/unknown");

const parsedRawShape: { name: string; answer: "ja" | "nein" } =
  rawShapeSchema.parse({ name: "Ada", answer: "ja" });

const typedSessionSchema: z.ZodObject<{ age: z.ZodNumber }> = createFlowSession(
  flow,
  {},
  "/typed",
).pageSchema;
const startSessionSchema = createFlowSession(flow, {}, "/start").pageSchema;
const parsedStartSession: {} = startSessionSchema.parse({});

void rawShapeSchema;
void typedSchema;
void unknownSchema;
void parsedRawShape;
void typedSessionSchema;
void startSessionSchema;
void parsedStartSession;
