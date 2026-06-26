# Missing Response Status Design

Status: Completed

## Context

The scraper supports injected request functions for no-network testing and
alternate transports. Its non-success path distinguishes only `undefined`
responses before reading `response.statusCode`. A transport callback with no
error and a `null` response therefore throws a `TypeError` instead of reporting
the existing callback error with an unknown status.

## Decision

Treat every response without a usable `statusCode` as unknown metadata. Keep
successful status `200`, non-200 status reporting, parser behavior, and the
public callback shape unchanged.

## Verification

- Add a red no-network regression for `(null, null, null)` transport output.
- Require exactly one callback carrying the request URI and unknown status.
- Bind the regression and null-safe guard into the static baseline.
- Run Node 20 `make check`, the production dependency audit, exact-head Codex
  review, and hosted Node/CodeQL gates.
