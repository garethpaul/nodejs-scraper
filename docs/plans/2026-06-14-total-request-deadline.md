# Total Request Deadline

status: completed

## Context

The built-in transport configures `ClientRequest.setTimeout`, which bounds
socket inactivity but not total elapsed request time. A target can therefore
send data often enough to avoid the inactivity timeout and keep a scrape open
indefinitely, including across redirects.

## Priorities

1. Apply the normalized request timeout as one wall-clock deadline for the
   complete request, including redirects.
2. Preserve the existing socket inactivity timeout as an additional failure
   boundary.
3. Destroy the active request and invoke the callback at most once when the
   total deadline expires.
4. Keep tests deterministic and free of live network or real-time waits.

## Implementation Units

### Transport Deadline

File: `lib/http-request.js`

- Start one injected timer before the initial dispatch.
- Reuse that deadline across every redirect instead of resetting it.
- Clear the timer on every terminal success or failure.
- Destroy the current request when the deadline expires.

### Regression Contract

Files: `test/http-request.test.js`, `scripts/check-baseline.py`

- Capture the injected timer and assert its normalized duration.
- Trigger the deadline without sleeping and assert one callback plus active
  request destruction.
- Require the implementation, test, documentation, and completed plan evidence
  in the static baseline.

### Documentation

Files: `README.md`, `SECURITY.md`, `VISION.md`, `CHANGES.md`

- Clarify that the timeout bounds total elapsed request time as well as socket
  inactivity.

## Work Completed

- Added one injected deadline timer before initial dispatch and retained it
  across every redirect.
- Cleared the timer and detached the active request before every terminal
  callback.
- Destroyed the active request before delivering a total-timeout error.
- Added no-wait tests for timeout duration, timer cleanup, active-request
  destruction, callback-at-most-once behavior, and single-timer redirect reuse.
- Documented the total request deadline in the consumer, security, vision, and
  change records.

## Verification Completed

- `node test/http-request.test.js` passed the focused transport suite.
- `npm test` passed all scraper, transport, and document tests.
- `npm run check` passed the package test and static contract gate.
- `npm audit --omit=dev` reported zero vulnerabilities.
- `make lint`, `make test`, `make build`, and `make check` passed.
- The checker passed from an external working directory using the absolute
  Makefile path.
- JavaScript and Python syntax checks passed.
- Five hostile mutations removing the deadline, cleanup, active-request
  destruction, redirect fixture, or completed plan evidence were rejected.
- `git diff --check` passed.

## Risks

- Timer cleanup must happen before the user callback so callback exceptions do
  not leave timer handles open.
- Redirect dispatch must update the active request without creating a fresh
  deadline.
