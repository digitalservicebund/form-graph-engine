# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.3] - 2026-06-30

### Changed

- upgraded to pnpm@11.9.0, oxfmt@0.56.0, oxlint@1.71.0, node@26.4.0
- `findNextIncompleteNode`: returns earliest schema-less page at flow end (not last one); ensures all non-input pages are navigated in sequence

## [0.0.2] - 2026-06-24

### Added

- tests: comprehensive unit tests for `findNextIncompleteNode` covering first incomplete page, schema-less predecessors, and fallback behaviors

### Changed

- `findNextIncompleteNode`: refactored logic to return first incomplete schema page, or earliest schema-less page preceding it
- `findNextIncompleteNode`: simplified conditional structure to avoid negation-based branching

## [0.0.1] - 2026-06-23

### Added

- `flowSession.nextIncomplete()`: navigate to the first incomplete page
- `flowSession.pageData`: expose current page's data
- `flowSession.fieldNames`: strongly infer from page schemas
- tests: add type tests
- Add typed pruned userdata
- CI: Dependabot for automated dependency updates
- CI: node version matrix (tests run across multiple Node versions)

### Changed

- `nextPath()`: new optional `newUserData` argument
- Zod 4 set as peer dependency (`>=4 <5`)
- Minimum Node.js version raised to 22
- Remove need for matched zod version
- simplified normalizeSchema
- pageSchema may be `undefined`
