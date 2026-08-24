# Concepts

How `form-graph-engine` models a flow, and what the values it derives mean.

- **Why** the library exists, and what was considered instead: [ADR 0](./adr/0000-why-form-graph-engine-exists.md)
- **How** to configure and call it: [README](../README.md)
- **What is not enforced yet**: [Next steps](./nextSteps.md)

## A flow is a stateless DAG

A flow is modelled as a [directed acyclic graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph):

- each **node** is a page,
- each **transition** is an edge with exactly one source and one target,
- transitions may carry a **guard**, a pure predicate over user data,
- there is one entry node and one or more terminal nodes (no outgoing edges), and no cycles.

Unlike a classic state machine, the graph holds no state. Position and previous answers are supplied from outside; everything else is derived. The same flow can therefore be evaluated on the server, on the client, mid-resume, or from a deep link.

This does not remove state, it re-uses it. Position and answers already live somewhere in a real app: the URL or router, and a persisted answer store. The engine adds no second state container to keep in sync.

## The active path

Guards are deterministic functions of user data, so a given answer set selects exactly one **active path**: the chain of nodes from the entry node onwards, taking the first matching branch at each step.

Nearly everything a session reports is a statement about that path, computed in a single traversal. Routing, reachability, progress, and pruning therefore cannot disagree about which pages count:

- `path` is the active path itself, as an ordered list of paths.
- `prevPath` is the predecessor of the current node on that path, so Back works without stored history.
- `isReachable(path)` and the `isReachable` flags in `statusTree` mean "lies on the active path for the current answers", not "reachable under some hypothetical answers".
- `isComplete` is true once the active path arrives at a terminal node.
- `prunedUserData` keeps the fields of pages on the active path and drops the rest.

Change an earlier answer and the path is re-selected, with every derived value following in the same evaluation.

## Compiled config vs. interpreted session

The API is split into a static half and a dynamic half.

```
              compile once                         interpret per render
  config ──▶ compileFlowConfig ──▶ CompiledFlow ──▶ createFlowSession ──▶ session
                                        ▲                    ▲
                                  static structure    userData + path (supplied)
```

`compileFlowConfig(...)` runs once at startup. It validates the pages, transitions, and initial step, then precomputes everything that does not depend on answers: path↔node lookups, per-node schema info, longest-path statistics, terminal-node detection. The resulting `CompiledFlow` is immutable and shareable across the app.

`createFlowSession(compiledFlow, userData, path)` runs as often as needed, typically once per render. It is a pure function of its three inputs and returns a read-only snapshot of everything true at that position. It stores nothing and mutates nothing, so it is cheap to call anywhere, including on a server or in a test.

## Validation

Two layers:

- **Structural**, at compile time, so misconfiguration surfaces at startup rather than mid-flow. Today that means page-path well-formedness plus the graph analysis behind progress and terminal detection. Acyclicity, duplicate paths, branch totality, and field-name collisions are assumed but not yet checked ([next steps](./nextSteps.md)).
- **Schema**, via [Zod](https://zod.dev). A page may declare a `pageSchema`, which the engine uses both to infer the type of `userData` across the whole flow and to decide whether a page counts as complete.

Enforcing submitted values at runtime is left to the caller: the engine consumes validation results, it is not a form-field runtime.

## Routing

- `nextPath` evaluates the current node's transitions in order and returns the first target whose guard passes.
- `prevPath` returns the node that routed into the current one under the current answers, rather than a stored history entry.
- `nextIncomplete` walks the active path forward to the first page that is not yet complete, backing up to any schema-less pages before it so information screens are not skipped. Useful for "resume" and "jump to next unanswered".

## Pruning

A user can answer a page and then change an earlier answer that makes it unreachable. `prunedUserData` returns the user data with those fields removed, giving the app one trustworthy value to persist or submit.

Pruning is an output, not a mutation: the engine never touches the caller's store, so persisting the pruned value stays the caller's decision.

## Progress

`progress` is a heuristic, worth understanding before showing it to users:

- `steps.total` is the length of the longest path through the whole graph, computed at compile time. It is constant for a given flow.
- `steps.current` is the depth of the active page, so a "fast-track" answer jumps the counter forward (e.g. 2/10 → 7/10) instead of shortening the total.
- `progress` is a percentage, capped at 99 for non-terminal pages, so only a terminal page reports 100.

Along any path it increases monotonically, which is what a progress bar needs.

## Caller contract

The guarantees above hold only while these do. The engine cannot check them; they are properties of your code and runtime:

- **Guards are pure and deterministic.** No `Date.now()`, `Math.random()`, or external mutable state. Impure guards break server/client parity.
- **Guards are null-safe.** `userData` is typed `Partial`, so a guard may run against fields that are not filled yet, and must tolerate `undefined`.
- **Server and client evaluate the same compiled config and the same `userData`.** Keeping them in parity is the caller's job.

## Array pages

Repeating pages let a sub-flow run once per collected item. They are exploratory: the configuration API may change, and they may be removed before 1.0. They are not part of the model described above.
