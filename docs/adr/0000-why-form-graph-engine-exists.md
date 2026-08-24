# ADR 0: Why `form-graph-engine` exists

- **Status:** Draft
- **Date:** 2026-08-24

This ADR records why the package exists, and what it does that the alternatives do not. For the model in detail see [Concepts](../concepts.md); for the API, the [README](../../README.md).

## Context

Multi-page forms (funnels, wizards, questionnaires, ...) share a recurring set of hard problems:

- The set of pages a user sees depends on their answers, so the flow is a branching graph, not a fixed list.
- The "same" form must be evaluated from many entry points: a fresh start, a deep link, a resumed session, a server render, a back button.
- Data collected on pages that later become unreachable must not leak into the final result.
- Many elements (progress bars & labels, section sidebars, reachability guards) all need a consistent answer to "where is the user, and what is true here?"

The straightforward solution (hard-coding transitions or large if-trees) usually reaches its limit quickly and spreads flow knowledge across many layers (navigation, progress computation, data pruning). Those copies are hard to understand and drift apart over time.

We looked for an existing library to adopt before writing one. None of the obvious candidates model a form as a **data-driven graph** while staying out of rendering and state management (see [Alternatives](#alternatives-considered)).

## Scope

### Goals

- Describe a conditional multi-page flow as data (pages + transitions) in TypeScript, and infer the collected-data type from that same description.
- Evaluate the flow as a pure function of `(compiled config, userData, position)`, so server, client, resume, and deep link cannot disagree.
- Own the read models that follow from that evaluation: next/previous page, reachability, pruned data, completion, progress, status tree.
- Stay small, framework-agnostic, and composable with any renderer or form-field library.

### Non-goals

- Rendering, component, or field-state management.
- Runtime enforcement/coercion of submitted values.
- General-purpose state machines or event-driven workflows.
- Arrays / cyclic flows.

## The model in brief

A flow is a directed acyclic graph: nodes are pages, edges are transitions, and a transition may carry a guard, a pure predicate over user data. The graph holds no state of its own, so position and answers are supplied from outside and everything else is derived. Evaluating the same flow during a server render was an explicit design driver.

The API follows that split: `compileFlowConfig` does the answer-independent analysis once at startup, and `createFlowSession` turns `(compiled config, userData, position)` into a read-only snapshot, as often as a render needs it.

[Concepts](../concepts.md) covers the full model, including the active path everything is derived from, and the contract it assumes from callers.

## Alternatives considered

We grouped the field into three families and checked each against the four things this package must do: model a conditional multi-page graph, stay stateless and pure, own schema-driven validation and type inference, and derive flow-level read models such as reachability, pruning, and progress.

### State-machine / statechart libraries

**XState**, **Robot3**, and similar libraries model states, events, transitions, and guards. That is a superset of our transition model, and its inspiration. The mismatch is elsewhere:

- They are stateful and event-driven by design: an actor advances through `send`. Our position comes from outside and is evaluated purely, so adopting a running machine would mean synchronising that instance across server render, client, resume, and deep link.
- They have no notion of a form. No page schemas, no validation, no inference of the collected-data type from the graph.
- Reachability, pruning of dead branches, longest-path progress, and a section status tree would all be ours to build on top.

A great engine for transitions, then, but not a form flow engine.

### Form-state / validation libraries

**React Hook Form**, **Formik**, **React Final Form**, **TanStack Form**, and **rvf** (Remix Validated Form) own field state, per-field validation, and rendering integration, usually for a single form.

- They cover validation well, and RHF and TanStack overlap with how we use schemas.
- They generally do not model a conditional multi-page graph: routing between pages, cross-page reachability, and which branch is live are out of scope.
- They are coupled to rendering and to a framework, mostly React or Remix.

These are complementary rather than competing. A consumer can render each page with one of them while `form-graph-engine` decides which page comes next and which answers survive.

### Declarative form / survey engines

**SurveyJS**, **Formily**, **react-jsonschema-form (rjsf)**, and **jsonforms** are the closest domain neighbours: they do model conditional, multi-page, data-driven forms, through `visibleIf`, reactions, and JSON-Schema-driven fields.

- They are rendering engines. They own the components and the form runtime, and are configured through declarative JSON rather than TypeScript.
- Their conditional logic is stateful and rendering-bound, so there is no pure `(config, data, path) → snapshot` to call from a server or a test.
- The overlap is partial: SurveyJS has progress, and conditional visibility resembles reachability, but pruned answers as an output, a longest-path progress model, and a path-keyed status tree are not first-class.
- The collected-data shape is described in JSON Schema, so type inference in TypeScript is weak or absent.

If you want a batteries-included form renderer, these are excellent. We wanted the flow logic as a small, pure library that composes with our own renderer.

### Coverage at a glance

| Concern                            | `form-graph-engine` |  XState / Robot3  | RHF / Formik / TanStack / rvf | SurveyJS / Formily / rjsf / jsonforms |
| ---------------------------------- | :-----------------: | :---------------: | :---------------------------: | :-----------------------------------: |
| Conditional multi-page graph       |         ✅          |  ⚠️ generic FSM   |              ❌               |                  ✅                   |
| Stateless / pure evaluation        |         ✅          | ❌ stateful actor |       ❌ stateful store       |          ❌ rendering-bound           |
| Schema validation + type inference |      ✅ (Zod)       |        ❌         |       ✅ (field-level)        |     ⚠️ JSON Schema, weak TS types     |
| Reachability + data pruning        |         ✅          |        ❌         |              ❌               |    ⚠️ visibility, no pruned output    |
| Progress / step / status tree      |         ✅          |        ❌         |              ❌               |              ⚠️ partial               |
| Rendering / field state            |   ❌ (by design)    |        ❌         |              ✅               |           ✅ owns rendering           |
| Type-safe, TS-first config         |         ✅          |        ✅         |              ✅               |            ❌ JSON config             |
| Framework-agnostic                 |         ✅          |        ✅         |     ⚠️ mostly React/Remix     |                  ⚠️                   |

No single existing library fills the flow-logic rows while staying pure and rendering-free. The ones that own rendering and field state are the ones we want to compose with, not replace.

## Decision

Build and maintain `form-graph-engine` as a small, dependency-light (Zod only) TypeScript library that:

1. models a multi-page form as a **stateless DAG**,
2. splits the API into a **compiled config** (static, once) and an **interpreted session** (dynamic, pure, per-render), and
3. owns validation, routing, and pruning plus the read models derived from them, leaving rendering, field state, and runtime value enforcement to the caller.

## Trade-offs accepted

- **Coupled to Zod.** The Zod peer dependency was chosen for familiarity and its strong TypeScript inference, at the cost of coupling the engine to one validator. [Standard Schema](https://github.com/standard-schema/standard-schema) may be a better fit in a later version.
- **Progress is a heuristic.** `total` is the longest path through the whole graph and is constant for a given flow, so fast-track answers jump the counter forward rather than shortening the total.
- **Flat field namespace.** Page schemas are merged into one `userData` shape, so two pages declaring the same field name collide instead of being scoped per page.
- **No schema/answer migration.** When a flow evolves (renamed fields, changed schemas), reconciling previously persisted answers is a data-layer concern. Pruning removes unreachable fields but does not version or migrate them.
- **Guards are synchronous.** Data-dependent async checks (server lookups) must be resolved into `userData` before evaluation.

Structural properties the design relies on but does not yet verify (acyclicity, unique paths, branch totality, field-name collisions) are tracked in [Next steps](../nextSteps.md).

## Consequences

The payoff: one source of truth for "where is the user, and what is true here", identical across server, client, resume, and deep link. Sessions are pure, so they are cheap to recompute per render and easy to test without a DOM, and the static analysis is paid for once at startup.

The price: consumers supply user data and position themselves, and a complete solution needs a second library for rendering and field state. That is the separation-of-concerns bet this ADR makes.
