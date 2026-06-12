# Secure Built-In Transport Replacement

status: completed

## Problem

The default scraper transport still depends on the retired `request` package,
which has an open SSRF advisory and no patched release. It also buffers the
entire response before the existing `maxBodyBytes` parser boundary can run.
The dependency-injected tests are safe, but the default runtime path therefore
retains both redirect/private-network and transport-memory risks.

## Plan

1. Preserve the existing injected request callback seam for compatibility and
   no-network tests.
2. Replace only the default transport with Node 20 `http`/`https` primitives.
3. Validate every DNS address actually offered to the socket and reject local,
   private, link-local, reserved, documentation, multicast, and mapped ranges.
4. Follow only bounded HTTP(S) redirects, rejecting credentials and rechecking
   DNS policy on every hop.
5. Enforce `maxBodyBytes` while streaming, before full buffering and before
   legacy jsdom parsing, while retaining the parser-side defense in depth.
6. Remove the direct `request` dependency, update security and maintenance
   documentation, and extend the static checker.

## Work Completed

- Added a Node 20 `http`/`https` adapter while preserving the injected request
  callback seam.
- Added literal and DNS-result public-address checks, including bracketed IPv6,
  mapped-address, translation-prefix, private, reserved, and multicast ranges.
- Added bounded per-hop redirects and stripped credential-bearing headers when
  redirects cross origins.
- Enforced `maxBodyBytes` during streaming and retained the parser-side limit as
  defense in depth.
- Removed the direct `request` dependency and updated repository contracts.
- Recorded that legacy jsdom still resolves `request` transitively; removing
  that installation-only debt remains part of the parser migration.
- Made the Make gates resolve the repository root after external verification
  exposed a working-directory assumption.

## Verification

- `npm test` passed both no-network suites, including private DNS and redirect
  rejection, mixed-address DNS rejection, bracketed IPv6 literals, streaming
  limits, timeout handling, redirect limits, and cross-origin credential-header
  stripping.
- `npm run check`, `make lint`, `make test`, `make build`, `make check`, and
  `make verify` passed.
- `make -f /home/gjones/code/private/repos/garethpaul/nodejs-scraper/Makefile check`
  passed from `/tmp`, proving the Make gates are independent of the caller's
  working directory.
- `python3 -m py_compile scripts/check-baseline.py` and `git diff --check`
  passed.
- Seven hostile mutations were rejected: restoring the direct dependency,
  restoring the retired default client, removing socket DNS policy, removing
  streaming termination, removing private-redirect coverage, reverting plan
  completion, and removing Makefile root resolution.
- Exact implementation head
  `09860dc686ce29247d543c9bf3d042853ade921a` passed canonical push Check run
  `27428350128`, pull-request Check run `27428349984`, and CodeQL run
  `27428348464` for actions, JavaScript/TypeScript, and Python.
