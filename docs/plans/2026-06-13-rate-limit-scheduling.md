# Rate-Limit Scheduling

status: planned

## Context

The scraper normalizes positive `reqPerSec` values, but its current queue starts
`floor(reqPerSec)` requests immediately and schedules replacements after each
request completes. Integer rates can therefore burst well above their stated
start rate, while scheduling depends on remote response latency instead of the
caller-provided request rate.

## Priorities

1. Space throttled request starts uniformly from `reqPerSec`.
2. Allow slow requests to overlap without making later starts wait for them.
3. Cover integer, fractional, numeric-string, and invalid rate values without
   live network access or wall-clock sleeps.
4. Preserve unthrottled behavior for omitted and non-positive values.

## Implementation Units

### Queue Scheduler

File: `lib/scraper.js`

Start one throttled request immediately, then schedule each remaining queue
entry at `1000 / reqPerSec` milliseconds. Inject the private scheduling
function through `createScraper` dependencies for deterministic tests.

### No-Network Tests

File: `test/scraper.test.js`

Assert request start order and delay values for integer, fractional, and
numeric-string rates, prove scheduling does not wait for completion, and retain
unthrottled fallback for invalid values.

### Documentation And Static Contract

Files:

- `README.md`
- `SECURITY.md`
- `VISION.md`
- `CHANGES.md`
- `scripts/check-baseline.py`
- `docs/plans/2026-06-13-rate-limit-scheduling.md`

Document the request-start semantics and require the implementation, tests,
completed plan, and verification evidence.

## Verification Plan

- `node test/scraper.test.js`
- `npm test`
- `npm run check`
- `npm audit --omit=dev`
- `make lint`
- `make test`
- `make build`
- `make check`
- run the checker outside the repository working directory
- parse the workflow YAML and package manifests
- run focused hostile mutations against the scheduling contracts
- `git diff --check`
- scan the intended diff for secrets and generated artifacts

## Boundaries

- Do not change request validation, transport, parsing, redirects, or body
  limits.
- Do not add real network calls or sleep-based timing assertions.
- Do not change the exported scrape function signature.
- Do not interpret non-positive or non-finite rates as throttled values.
