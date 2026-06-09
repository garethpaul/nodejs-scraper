# Non-Object Headers Plan

status: completed

## Context

`normalizeRequestOptions` merges caller-provided headers with a default
`User-Agent`. When `headers` is a string or array, `Object.keys` exposes numeric
indexes, which can create invalid numeric request header names.

## Objectives

- Ignore non-object and array header values during normalization.
- Preserve the default `User-Agent` header.
- Keep valid object headers merged without mutating caller inputs.
- Add no-network regression tests and static guardrails for non-object headers.

## Verification

- `npm test`
- `npm run check`
- `git diff --check`
