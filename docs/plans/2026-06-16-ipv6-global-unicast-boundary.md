# IPv6 Global-Unicast Request Boundary

status: completed

## Context

The built-in transport rejects known private and special-purpose IPv6 ranges,
but otherwise treats every syntactically valid IPv6 address as public. The
current IANA IPv6 address-space registry allocates the top-level global unicast
space from `2000::/3`; other top-level ranges remain reserved. Allowing
reserved literals or DNS answers through a public-address guard can route
scraper traffic to locally assigned or future special-purpose addresses.

Primary reference:
https://www.iana.org/assignments/ipv6-address-space/ipv6-address-space.xhtml

## Priorities

1. Reject IPv6 request targets outside the currently allocated `2000::/3`
   global-unicast space before dispatch.
2. Preserve the existing exclusions inside global unicast, including
   documentation, benchmarking, transition, segment-routing, and unique-local
   address boundaries.
3. Apply the same rule to direct URL literals, initial DNS results, and every
   redirect lookup without changing IPv4 behavior.
4. Keep validation dependency-free, deterministic, and free of live network
   requests.

## Implementation Units

### Address Classification

File: `lib/http-request.js`

- Add an explicit IPv6 global-unicast allocation check before consulting the
  existing special-purpose block list.
- Continue to require every DNS answer to pass the public-address classifier.
- Preserve the existing callback error contract for rejected hosts.

### Regression Contract

Files: `test/http-request.test.js`, `scripts/check-baseline.py`

- Cover a reserved IPv6 literal outside `2000::/3`, a hostname resolving to the
  same range, and a redirect targeting that range.
- Retain positive coverage for an ordinary global-unicast IPv6 address and the
  current special-purpose exclusions within `2000::/3`, proving that the new
  allocation gate composes with rather than replaces the existing block list.
- Require the implementation, runtime tests, documentation, and completed-plan
  evidence in the static baseline.

### Maintainer Guidance

Files: `README.md`, `SECURITY.md`, `VISION.md`, `CHANGES.md`, `AGENTS.md`

- Document that IPv6 targets must belong to the currently allocated global
  unicast range and must not match a blocked special-purpose subnet.
- Record that future IANA allocation changes require an intentional classifier
  and regression-test update.

## Verification

- Run the focused HTTP transport suite and the full package test suite.
- Run every Make target plus `make check` through the absolute Makefile path
  from an external directory.
- Run `npm audit --omit=dev` on the exact lockfile graph.
- Reject isolated mutations that remove the allocation check, literal test,
  DNS test, positive global-unicast case, checker contract, documentation, or
  completed-plan evidence.
- Audit the exact diff, whitespace, generated artifacts, large or binary files,
  conflict markers, file modes, and credential-shaped additions.

## Risks

- The IANA registry can evolve; the explicit allocation boundary must be
  maintained rather than assumed permanent.
- No live IPv6 route, DNS resolver, proxy, redirect target, or deployed scraper
  is exercised by the offline tests.
- The change must remain stacked on PR #5 and must not be merged or closed
  without explicit authorization.

## Work Completed

- Added an explicit `2000::/3` IPv6 global-unicast allocation gate before the
  existing special-purpose subnet exclusions.
- Added deterministic no-network coverage for reserved IPv6 literals, DNS
  answers, and redirect targets while retaining positive global-unicast and
  existing special-purpose classification coverage.
- Extended the static baseline and maintainer documentation so future IANA
  allocation changes require an intentional code, test, and guidance update.

## Verification Completed

- `node test/http-request.test.js`
- IPv4 and IPv6 classifier smoke checks for ordinary public, in-range special,
  and outside-allocation addresses
- `python3 -m py_compile scripts/check-baseline.py`
- `npm test`
- `npm run check`
- `npm audit --omit=dev` reported zero vulnerabilities
- `make lint`, `make test`, `make build`, and `make check`
- `make -f /absolute/path/to/Makefile check` from an external working directory
- Seven isolated hostile mutations rejected removal of the allocation gate,
  literal test, DNS test, redirect test, positive global-unicast case, static
  checker contract, and completed-plan evidence
- `git diff --check` plus generated-artifact, large/binary-file, conflict-marker,
  file-mode, and credential-shaped-addition audits
