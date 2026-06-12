# Bounded Request Timeout

status: completed

## Context

Requests previously had no default timeout, allowing an unresponsive target to
hold scraper work open indefinitely. The public request options API should keep
supporting caller overrides without accepting invalid values that remove the
bound accidentally.

## Objectives

- Apply a 10-second request timeout when callers omit `timeout`.
- Preserve finite positive numeric and numeric-string timeout overrides.
- Fall back to the default for non-finite or non-positive values.
- Verify normalized and dispatched request options without external traffic.
- Document the reliability and security posture in active project guidance.

## Verification

- `make lint`
- `make test`
- `make build`
- `make check`
- `git diff --check`
