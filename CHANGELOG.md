# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1] - 2026-06-23

### Added

- `flowSession.nextIncomplete()`: navigate to the first incomplete page
- `flowSession.pageData`: expose current page's data
- CI: Dependabot for automated dependency updates
- CI: node version matrix (tests run across multiple Node versions)

### Changed

- `nextPath()`: new optional `newUserData` argument
- Zod 4 set as peer dependency (`>=4 <5`)
- Minimum Node.js version raised to 22
