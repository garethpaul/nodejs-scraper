# Normalize Synchronous Transport Setup Failures

status: completed

## Summary

Route synchronous `client.request(...)` setup failures through the scraper
transport's single callback boundary and clear the total-request deadline.

## Problem

The built-in transport handles asynchronous request, response, body-limit, and
deadline failures through `finish`, but `client.request(...)` can throw before
an outgoing request object exists. That exception currently escapes the API,
leaves the total deadline armed, and may later invoke the callback from the
stale timer.

## Requirements

- Catch synchronous transport construction and option-validation failures.
- Complete through `finish` so the total deadline is cleared exactly once.
- Preserve the original error and the callback's null response/body contract.
- Do not weaken public-address, redirect, credential-header, body-size, or
  total-deadline protections.
- Add focused runtime coverage, mutation-sensitive static contracts, and
  matching maintenance documentation.

## Implementation

- Declare the outgoing request before transport setup.
- Wrap only `client.request(...)` construction in `try/catch`.
- Return through `finish(error)` when setup throws; otherwise install the
  existing request listeners, socket inactivity timeout, and dispatch.
- Extend the checker, test suite, guidance, changelog, and completed evidence.

## Verification

- Run the focused HTTP transport suite, full package tests, all Make gates,
  production dependency audit, and external-directory `make check`.
- Reject six isolated mutations removing the catch, callback error, timer cleanup
  evidence, null response/body assertions, documentation, or completed plan.
- Audit exact diff, whitespace, generated artifacts, conflict markers,
  intended paths, binary/large files, and changed-line credential patterns.

## Risks

- No live public target, proxy, TLS failure, DNS rebinding, compression, or
  changing-page behavior is exercised.
- The change must remain stacked on PR #4 and must not be merged or closed
  without explicit owner authorization.

## Verification Completed

- `node test/http-request.test.js`, `npm test`, every Make gate, and
  `npm audit --omit=dev` passed.
- `make check` passed from an external working directory through the absolute
  Makefile path.
- Six isolated hostile mutations covering the setup catch, callback error,
  deadline cleanup evidence, null response/body contract, documentation, and
  completed-plan status were rejected.
- `git diff --check`, exact-diff, generated-artifact, conflict-marker,
  intended-path, binary, large-file, and changed-line credential audits passed.
