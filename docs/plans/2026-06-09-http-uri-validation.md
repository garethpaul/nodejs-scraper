# HTTP URI Validation Plan

status: completed

## Context

The scraper accepts URL strings and request option objects, then forwards them
to the `request` dependency. Missing URIs were rejected, but non-web schemes
such as `file:` could still reach request dispatch.

## Objectives

- Preserve HTTP and HTTPS scraping inputs.
- Reject non-HTTP(S) URI schemes before calling the request client.
- Avoid echoing rejected URI values in validation errors.
- Add no-network regression coverage and static guardrails for URI validation.

## Verification

- `npm test`
- `npm run check`
- `make check`
- `python3 scripts/check-baseline.py`
- `git diff --check`
