# Non-Positive Rate Limit Handling

status: completed

## Context

The scraper starts queued fetches based on `reqPerSec`. Negative values produced
a negative concurrency count, so no fetch was started and callbacks never ran.

## Objectives

- Preserve positive `reqPerSec` throttling behavior.
- Treat non-positive or invalid `reqPerSec` values as unthrottled.
- Add no-network regression coverage that fails if the queue stalls.
- Extend the static baseline and documentation for the rate-limit boundary.

## Verification

- `npm test`
- `npm run check`
- `make check`
- `python3 scripts/check-baseline.py`
- `git diff --check`
