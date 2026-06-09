# Node Scraper Fetch Options Immutability

status: completed

## Context

The scraper already normalizes request options without mutating caller-provided
objects, but the `fetchOptions` defaulting path still writes `reqPerSec` back
onto the object supplied by callers. That creates surprising side effects for
code that reuses an options object across scraper calls.

## Goals

- Preserve existing `reqPerSec` throttling behavior.
- Apply fetch defaults through an internal copy instead of mutating caller
  input.
- Add no-network test coverage for fetch option immutability.
- Extend the static baseline so the contract remains visible.

## Verification

- `npm test`
- `npm run check`
- `make check`
- `git diff --check`
