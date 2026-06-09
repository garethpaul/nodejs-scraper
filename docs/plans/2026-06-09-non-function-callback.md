# Non-Function Callback Plan

status: completed

## Context

The scraper already treated missing callbacks as no-ops, but a truthy
non-function callback could survive validation and throw after an asynchronous
request completed.

## Objectives

- Treat non-function callbacks the same way as missing callbacks.
- Add no-network regression coverage for invalid callback values.
- Document the callback behavior in the baseline docs and static checker.

## Verification

- `npm test`
- `npm run check`
- `make check`
- `git diff --check`
