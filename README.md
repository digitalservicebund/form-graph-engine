# form-graph-engine

TypeScript library for compiling and running form flow graphs.

## Install

```bash
pnpm add form-graph-engine
```

## Usage

```ts
import { compileFlowConfig, createFlowSession } from "form-graph-engine";

// Compile your flow config once
const compiled = compileFlowConfig({
  // your flow definition
});

// Create a session to evaluate the current step
const session = createFlowSession(compiled, userData, currentPath);

// Session provides:
// - nodeKey: current step identifier
// - pageSchema: Zod schema for validating form data
// - fieldNames: names of fields in this step
// - nextPath: path to navigate forward
// - prevPath: path to navigate backward
// - isReachable(path): check if a path is reachable given current data
// - statusTree: overall flow completion status
// - prunedUserData: user data with irrelevant branches removed
```

## Development

```bash
pnpm install
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

## Node and Package Manager

- Development Node: 22.x (for direct TypeScript execution in local workflows)
- Runtime support for consumers: Node 18+
- Build target: ES2020 output in dist
- pnpm: see packageManager in package.json

## Contributing

[Deutsche sprache weiter unten](#mitwirken)

Everyone is welcome to contribute! You can contribute by giving feedback, adding issues, answering questions, providing documentation or opening pull requests. Please always follow the guidelines and our [Code of Conduct](CODE_OF_CONDUCT.md).

To contribute code, simply open a pull request with your changes and it will be reviewed by someone from the team. By submitting a pull request you declare that you have the right to license your contribution to the DigitalService and the community under the license picked by the project.

## Mitwirken

Jede:r ist herzlich eingeladen, die Entwicklung der _Project_ mitzugestalten. Du kannst einen Beitrag leisten, indem du Feedback gibst, Probleme beschreibst, Fragen beantwortest, die Dokumentation erweiterst, oder Pull-Requests eröffnest. Bitte befolge immer die Richtlinien und unseren [Verhaltenskodex](CODE_OF_CONDUCT.md).

Um Code beizutragen erstelle einfach einen Pull Requests mit deinen Änderungen, dieser wird dann von einer Person aus dem Team überprüft. Durch das Eröffnen eines Pull-Requests erklärst du ausdrücklich, dass du das Recht hast deine Beitrag an den DigitalService und die Community unter der vom Projekt gewählten Lizenz zu lizenzieren.
