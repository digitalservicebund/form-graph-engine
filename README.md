# form-graph-engine

> [!WARNING]
> This library is under development and might change without notice.

Library for configuring and running complex multi-page forms in a type-safe way. Its only dependency is [Zod](https://zod.dev/) 4+ for validation and type inference.

This library handles: configuration, logical transitions, progress, reachability, done state.

This library does not provide: rendering, state management, runtime validation.

## Concepts

A multi-page form is abstracted as a [directed acyclic graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph):

![Example of an directed acyclic graph with multiple nodes and connecting edges](https://upload.wikimedia.org/wikipedia/commons/f/fe/Tred-G.svg).

- Each **node** represents a single page
- A node can have 0 or more **transitions**, connecting it to other nodes
- Each transition has exactly one **source** and one **target** and may depend on a condition
- There is one **entry node** (no incoming transition) and one or more **exit nodes** (no outgoing transitions)
- There are no loops in the diagram

## Usage

The library API is split in two:

1. **Static configuration**: Defining pages, transitions, schemas (see [Configuring a flow](#configuring-a-flow))
2. **Dynamic evaluation**: Computes properties based on static configuration + user data + position in the flow (see [Runtime interaction](#runtime-interaction))

### Configuring a flow

A form is configured in two collections, _pages_ and _transitions_, plus the starting node.

#### Pages

Each page needs to configure a `path`, and optionally a `pageSchema` (accessible at runtime and used to infer user data types). `pageSchema` can be either a full Zod schema or a raw shape object that will be compiled to `z.object(...)`. Each page is indexed by a `pageKey`, which is used to refer to that page throughout the configuration.

```ts
const pages = {
  pageKey: {
    path: "/pagePath",
    pageSchema: { myInput: z.string() }, // optional
  },
};
```

#### Transitions

A transition needs to be specified for each page.

##### Transition types

- **null**: No target (makes this node an final node)
- **primitive**: Always pointing to one other node
- **conditional**: An array of conditions and targets. They are evaluated top-to-bottom, resolving to the first target where the guard returns _true_.

##### Guards

A guard is a small function used in conditional transitions. It receives the data the machine was initialized with and returns a boolean, to indicate whether its corresponding target should be the next destination. The type of userData is fully inferred by the `pageSchemas` defined in `pages`.

##### Example

```ts
const transitions = {
  key1: "key2",
  key2: [{ guard: (userData) => userData.myInput.length > 5, target: "key3" }],
  key3: null,
};
```

#### compileFlowConfig

All this configuration happens on calling `compileFlowConfig`, which provides type safety, validity checks and pre-computation.

In the following example, `key1` always points to `key2`, `key2` transitions to `key3a` if the user input is longer than 5 characters and to `key3b` otherwise, and `key3a` & `key3b` both end the flow:

```ts
import { compileFlowConfig } from "form-graph-engine";

export const compiledFlow = compileFlowConfig({
  pages: {
    key1: { path: "/step1" },
    key2: {
      path: "/step2",
      pageSchema: { myInput: z.string() },
    },
    key3a: { path: "/path3a" },
    key3b: { path: "/path3b" },
  },
  transitions: {
    key1: "key2",
    key2: [
      { guard: (userData) => userData.myInput.length > 5, target: "key3a" },
      { guard: (userData) => true, target: "key3b" },
    ],
    key3a: null,
    key3b: null,
  },
  initialStep: "key1",
});
```

A flow is compiled once on app start and can be used through the application, usually in conjunction with `createFlowSession` (see below).

### Runtime interaction

`createFlowSession` takes a compiled flow, the current user data, and the current path. It returns a session object that evaluates the full state of the form at that position.

```ts
import { createFlowSession } from "form-graph-engine";
import { compiledFlow } from "../myCompiledFlow";

// Fetching user data and current path is the caller's responsibility
const userData = getUserDataFromSession();
const currentPath = getCurrentPath();

const session = createFlowSession(compiledFlow, userData, currentPath);
```

> [!NOTE]
> `createFlowSession` throws an error if `currentPath` does not match any configured page.

#### Navigation

`session.nextPath(newUserData?)` returns the path of the next node, evaluating transitions against the current user data. Optionally accepts `newUserData`, which is merged in for the transition evaluation.

`session.prevPath` returns the path of the previous node, or `undefined` at the start of the flow.

`session.nextIncomplete(newUserData?)` returns the path of the first reachable page that is not yet complete. Useful for "resume" or "jump to next incomplete" UX patterns. Accepts the same optional `newUserData` as `nextPath`.

`session.initialPath` is the path of the configured `initialStep`.

#### Page data

- `session.pageSchema` is the exact Zod schema for the current page. Raw shapes are exposed as compiled `ZodObject` instances.
- `session.fieldNames` is the list of field names defined by the current page's schema.
- `session.pageData` is the subset of user data for the current page's fields. Useful for pre-filling fields on reloads.
- `session.prunedUserData` is the user data with data of unreachable (and therefore irrelevant) pages removed. Use this as the source of truth for further processing.

#### Status

`session.isComplete` is `true` when the active [Breadth-first search](https://en.wikipedia.org/wiki/Breadth-first_search) path has reached a terminal node (a page with a `null` transition).

`session.progress` is a `{ current: number, total: number }` object representing how far along the current path the active node is, based on the pre-computed graph structure. Useful for progress bars.

`session.statusTree` is a nested tree of `{ isDone, isReachable }` status nodes, keyed by path prefixes. Useful for rendering section-level progress in a multi-part form (e.g. a sidebar showing which sections are complete).

For a flow with pages at `/personal/name`, `/personal/address`, and `/payment/card`, the tree groups by prefix:

```ts
const statusTree = {
  "/personal": {
    isDone: true,
    isReachable: true,
    children: {
      "/name": { isDone: true, isReachable: true },
      "/address": { isDone: true, isReachable: true },
    },
  },
  "/payment": {
    isDone: false,
    isReachable: true,
    children: {
      "/card": { isDone: false, isReachable: true },
    },
  },
};
```

`session.isReachable(path)` returns `true` if the given path is reachable with the current user data. This is useful for implementing a funnel with auto-redirect (avoiding deeplinks )

#### Other

`session.nodeKey` is the key of the current page in the `pages` config.

`session.path` is the ordered list of node keys on the active Breadth-first search path through the flow.

#### Array pages

> [!WARNING]
> Array pages (repeating sections of a flow, e.g. for collecting multiple items) are supported but not yet stabilized. The configuration API may change.

## Development

```bash
pnpm install
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

## Node and Package Manager

- Development Node: 26 (for direct TypeScript execution in local workflows)
- Runtime support for consumers: Node 22+
- Build target: ES2020 output in dist
- pnpm >= 11

## Contributing

[Deutsche sprache weiter unten](#mitwirken)

Everyone is welcome to contribute! You can contribute by giving feedback, adding issues, answering questions, providing documentation or opening pull requests. Please always follow the guidelines and our [Code of Conduct](CODE_OF_CONDUCT.md).

To contribute code, simply open a pull request with your changes and it will be reviewed by someone from the team. By submitting a pull request you declare that you have the right to license your contribution to the DigitalService and the community under the license picked by the project.

## Mitwirken

Jede:r ist herzlich eingeladen, die Entwicklung von _form-graph-engine_ mitzugestalten. Du kannst einen Beitrag leisten, indem du Feedback gibst, Probleme beschreibst, Fragen beantwortest, die Dokumentation erweiterst, oder Pull-Requests eröffnest. Bitte befolge immer die Richtlinien und unseren [Verhaltenskodex](CODE_OF_CONDUCT.md).

Um Code beizutragen erstelle einfach einen Pull Requests mit deinen Änderungen, dieser wird dann von einer Person aus dem Team überprüft. Durch das Eröffnen eines Pull-Requests erklärst du ausdrücklich, dass du das Recht hast, deinen Beitrag an den DigitalService und die Community unter der vom Projekt gewählten Lizenz zu lizenzieren.
