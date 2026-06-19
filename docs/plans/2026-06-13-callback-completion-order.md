# Callback Completion Order

status: completed

## Context

The rate-limit scheduler now spaces request starts independently of response
completion. The scraper has historically invoked the shared callback whenever
each request and document parse finishes, but the no-network suite only
completes queued responses in input order. That leaves callback ordering
undefined and could invite input-order buffering that blocks completed results
behind a slow or stalled earlier request.

## Requirements

- Prove that callbacks are delivered immediately in request/parser completion
  order, even when responses finish out of input order.
- Preserve uniformly spaced request starts, URI and response validation,
  parser errors, and the existing callback signature.
- Do not buffer completed results to restore input order or couple request
  scheduling to completion.
- Add mutation-sensitive static contracts and maintenance documentation.

## Scope Boundaries

- Do not add aggregate result collection, callback metadata, cancellation, or
  concurrency limits.
- Do not make live network requests in tests.

## Work Completed

- Added a deterministic no-network test that starts two throttled requests,
  completes the second response first, and proves its parsed result reaches the
  callback before the earlier request finishes.
- Documented request/parser completion order as the array callback contract and
  removed callback ordering from the open roadmap.
- Added static contracts for the out-of-order response sequence, immediate
  callback assertion, final callback order, documentation, and plan evidence.

## Verification Completed

- `node test/scraper.test.js`, `npm test`, and `npm run check` passed.
- `make lint`, `make test`, `make build`, and `make check` passed.
- `git diff --check` and focused generated-artifact and credential scans passed.
- Six isolated hostile mutations covering the test name, second-response-first
  sequence, immediate callback assertion, final order, documentation, and plan
  evidence were rejected.
