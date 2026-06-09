# HTTP URI Credential Validation

status: completed

## Context

The scraper rejects missing, non-HTTP(S), and hostless request URIs before
calling `request`. Credentialed web URLs such as
`https://user:pass@example.com` were still accepted, which can make credentials
easier to leak through request logs, error messages, or copied examples.

## Objectives

- Reject HTTP(S) URI credentials before invoking `request`.
- Preserve HTTP(S) scheme and host validation.
- Add offline coverage that credentialed URLs do not call the request layer.
- Extend the static baseline and docs for the URI credential guard.

## Verification

- `npm test`
- `npm run check`
- `make lint`
- `make test`
- `make build`
- `make check`
- `git diff --check`
