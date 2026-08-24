# Next steps

Known gaps and hardening work, mostly surfaced while writing [ADR 0](./adr/0000-why-form-graph-engine-exists.md). These are the invariants the engine currently _assumes_ but does not _enforce_ (see [Concepts](./concepts.md) for what those assumptions buy), plus type-ergonomics issues. Ordered roughly by footgun severity.

## 1. Guards run against `Partial` data but are written as if fields exist

`InferredUserData<C>` is `Partial<...>` (see `src/types.ts`), so at evaluation time a guard may receive `userData` where its fields are still `undefined`. The documented pattern is now null-safe (`README.md`), but nothing stops a consumer from writing `userData.myInput.length > 5`, which throws when `myInput` is undefined.

- Mismatch between the `Partial` type and the ergonomic assumption that fields are present.
- Options: keep `Partial` and require null-safe guards (document + lint), or provide a guard-data type/helper that narrows filled fields, or run guards only once the source page's schema parses.

## 2. Acyclicity is assumed, not validated

`README.md` and [Concepts](./concepts.md) state flows are acyclic, but `validatePagePaths` (`src/validatePageConfig.ts`) only checks that paths start with `/`. `precomputeProgress` and `simulate` merely guard against infinite loops via `history`/`visitedEdges`/`visitedSet`; a cyclic config still compiles with undefined behavior.

- Add a compile-time cycle check in `compileFlowConfig` that throws on a back-edge, with the offending node keys in the message.

## 3. No duplicate-path detection

`buildPathAndSchemaMaps` (`src/compileFlowConfig.ts`) does `pathMap[page.path] = nodeKey`. Two pages with the same `path` silently overwrite — last one wins, and path→node lookups become ambiguous.

- Throw on duplicate `path` values at compile time.

## 4. No dead-end / branch-totality detection

A conditional node whose guards all evaluate false and that has no fallback branch makes `evaluateRoute` (`src/routing.ts`) return `null`. The node is not terminal (`extractEdges(route).length > 0`), so `simulate` does not mark the flow complete, and `nextPath` returns `undefined`. The user is stuck with no signal.

- Static analysis: warn/throw when a conditional node has no unconditional fallback (or cannot be proven total).
- Runtime: distinguish "terminal node" from "no branch matched" so callers can handle the stuck case explicitly.

## 5. Flat field namespace can collide silently

`InferredUserData` merges every page schema via `UnionToIntersection` (`src/types.ts`). Two pages that declare the same field name are intersected (and become `never` if the types are incompatible). There is no per-page scoping for regular (non-array) pages.

- Decide the policy: forbid duplicate field names at compile time, or namespace regular-page data by page key (as array pages already are by index).

## 6. Guards are synchronous only

`Guard<Data>` is `(data) => boolean` (`src/types.ts`). Flows that need a data-dependent async decision (server availability, dedupe lookup) must resolve it into `userData` before evaluation.

- Confirmed boundary for now. Revisit only if async routing becomes a real requirement; async guards would break the pure synchronous evaluation model.

## 7. "Session" is a misleading name

`createFlowSession` returns an immutable, per-call snapshot, but "session" on the web means something long-lived, server-held, and stateful (cookies, auth, `express-session`). The name promises exactly the ownership the design avoids, and collides with the caller's real session, which is often where `userData` comes from.

Candidates, in rough order of preference:

- `evaluateFlow(...)` → `FlowSnapshot`. Pairs with `compileFlowConfig` as "compile once, evaluate per render", which is how the docs already describe it. A verb also reads as a call rather than as an object you now own. Call sites become `const snapshot = evaluateFlow(compiledFlow, userData, currentPath)`, which avoids the `flow` / `compiledFlow` collision.
- `createFlowSnapshot(...)` → `FlowSnapshot`. Smallest diff, though `create` still hints at allocation and lifetime.
- `resolveFlow(...)` → `FlowResolution`. Accurate, a little abstract.
- Considered and dropped: `view` (reads as rendering, in a rendering-free library), `state` (implies mutability), `context` (taken by React), `step` (collides with `initialStep` and `progress.steps`), `lens` (jargon, and implies a setter).

Cheap while we are on 0.x, expensive after 1.0. Ship it as a rename plus a deprecated `createFlowSession` alias for one minor version, updating README, concepts, ADR 0, and tests in the same PR.

## Related follow-ups

- **Standard Schema** instead of a hard Zod peer dependency (see ADR 0, "Trade-offs accepted").
- **Array/repeating pages** are behind an unstable flag and slated for removal; decide and either stabilize or drop before 1.0.
