# Callback Completion Order

status: pending

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

Pending implementation.

## Verification Completed

Pending implementation and validation.
