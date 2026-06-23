# form-graph-engine

> [!WARNING]
> This library is under development and might change without notice.

Library for configuring and running complex multi-page forms in a type-safe way. Its only dependency is zod 4+ for validation and type inference.

This library handles configuration, logical transitions, progress, reachability, done state.

This library does not provide rendering, state management or runtime validation.

## Concepts

A multi-page form is fundamentally a [directed acyclic graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph), with each page representing a node and transitions forming the edges between them. A node might have multiple edges that represent branching conditions.

![Example of an directed acyclic graph with multiple nodes and connecting edges](https://upload.wikimedia.org/wikipedia/commons/f/fe/Tred-G.svg).

## Usage

The library API is split in two:

1. **Static configuration**: Defining pages, transitions, schemas (see [Configuring a flow](#configuring-a-flow))
2. **Dynamic evaluation**: Computes properties based on static configuration + user data + position in the flow (see [Runtime interaction](#runtime-interaction))

### Configuring a flow

A form is configured in two collections, _pages_ (aka nodes) and _transitions_ (aka edges), plus a starting node.

#### Pages

Each page needs to at least configure a `path`, and optionally a `pageSchema` (exposed at runtime and used to infer user data types). Each page is indexed by a `pageKey`, which is used to refer to that page.

```ts
const pages = {
  pageKey: {
    path: "/pagePath",
    pageSchema: { myInput: z.string() }, // optional
  },
};
```

#### Transitions

A transition needs to be specified for each page. It can either be:

- **null**: No following node
- **primitive**: Always pointing to one other node
- **conditional**: An array of conditions and targets. They are evaluated top-to-bottom, resolving to the first target with a _true_ guard.

```ts
const transitions = {
  key1: "key2",
  key2: [{ guard: (userData) => userData.myInput.length > 5, target: "key3" }],
  key3: null,
};
```

#### compileFlowConfig

This configuration happens on calling `compileFlowConfig` which provides type safety, validity checks and pre-computation.

In the following example, `key1` always points to `key2`, `key2` transitions to `key3a` if the user input is longer than 5 characters and to `key3b` otherwise, and `key3a` & `key3b` both end the flow.

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

`createFlowSession` throws if `currentPath` does not match any configured page.

#### Navigation

`session.nextPath(newUserData?)` returns the path of the next node, evaluating transitions against the current user data. Optionally accepts `newUserData` that is merged in for the transition evaluation - useful when you want to resolve the next step before persisting the just-entered values.

`session.prevPath` returns the path of the previous node, or `undefined` at the start of the flow.

`session.nextIncomplete(newUserData?)` returns the path of the first reachable page that is not yet complete. Useful for "resume" or "jump to next incomplete" UX patterns. Accepts the same optional `newUserData` as `nextPath`.

`session.initialPath` is the path of the configured `initialStep`.

#### Page data

`session.pageSchema` is the Zod schema for the current page (as configured in `pages`), or `undefined` for schema-less pages.

`session.fieldNames` is the list of field names defined by the current page's schema.

`session.pageData` is the subset of user data for the current page's fields.

`session.prunedUserData` is the full user data with unreachable-page fields removed. Use this as the source of truth for processing data as it strips out values from branches that aren't relevant anymore.

#### Status

`session.isComplete` is `true` when the active BFS path has reached a terminal node (a page with a `null` transition).

`session.progress` is a `{ current, total }` object representing how far along the current path the active node is, based on the pre-computed graph structure.

`session.statusTree` is a nested tree of `{ isDone, isReachable }` status nodes, keyed by path prefixes. Useful for rendering section-level progress in a multi-part form (e.g. a sidebar showing which sections are complete).

For a flow with pages at `/personal/name`, `/personal/address`, and `/payment/card`, the tree groups by prefix:

```ts
{
  "/personal": { isDone: true,  isReachable: true,
    children: {
      "/name":    { isDone: true,  isReachable: true },
      "/address": { isDone: true,  isReachable: true },
    }
  },
  "/payment":  { isDone: false, isReachable: true,
    children: {
      "/card":    { isDone: false, isReachable: true },
    }
  },
}
```

`session.isReachable(path)` returns `true` if the given path is reachable from the initial step with the current user data.

#### Other

`session.nodeKey` is the key of the current page in the `pages` config.

`session.path` is the ordered list of node keys on the active BFS path through the flow.

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
