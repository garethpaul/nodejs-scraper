# HTTP URI Host Validation

status: completed

## Context

The scraper rejects non-HTTP(S) schemes before dispatching to the request
client. A malformed HTTP(S) string such as `http://` still matched the simple
scheme check and could reach the request client without a host.

## Objectives

- Parse request URIs before dispatch.
- Require HTTP(S) URIs to include a hostname.
- Preserve non-web scheme rejection.
- Add no-network test coverage for malformed HTTP(S) URIs.
- Extend the static baseline and docs for HTTP(S) hosts.

## Verification

- `npm test`
- `npm run check`
- `make check`
- `git diff --check`
