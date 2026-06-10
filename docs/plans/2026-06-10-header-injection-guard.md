# Header Injection Guard

status: completed

## Context

The scraper already ignores non-object headers, but object headers can still
carry CR/LF characters in names or values. Those values should not be copied
into normalized request options before dispatch to the legacy `request` client.

## Objectives

- Drop caller-provided header names containing CR/LF characters.
- Drop caller-provided header values containing CR/LF characters.
- Preserve safe caller headers and the default `User-Agent`.
- Extend no-network tests, docs, and the active baseline checker for the header
  injection guard.

## Verification

- `npm test`
- `npm run check`
- `git diff --check`
