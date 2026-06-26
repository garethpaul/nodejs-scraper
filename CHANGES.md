# Changes

## 2026-06-26T11:43:53Z — P2 usability/correctness — cycle: reusable option inputs

- Threads: confirmed the default branch was current and clean, found no open
  pull requests or issues, and selected the explicit roadmap gap for a clearer
  non-mutating option-reuse example.
- Example: added the reusable-options example at `examples/reused-options.js`,
  a deterministic no-network program that injects two in-memory responses,
  freezes one request-options
  object and one fetch-options object, reuses both across two scraper calls,
  and prints the unchanged-input result.
- Tests: added `test/examples.test.js` and wired it into `npm test`; the
  child-process regression requires both parsed titles, a clean exit, empty
  stderr, and both immutability confirmations.
- Documentation: linked the runnable command from `README.md`, distinguished
  the offline example from external placeholders, promoted the example to a
  maintained `VISION.md` invariant, and retired the completed roadmap item.
- Contracts: the baseline requires the example, executable regression, npm
  wiring, README guidance, completed plan, current vision invariant, latest
  cycle evidence, and focused hostile mutations.
- Validation: Node 20.19.0 ran the example, focused regression, complete npm
  suite, production audit, and Make test gate; the exact lockfile reported zero
  vulnerabilities. Final repository/external Make aliases and mutation results
  are recorded in the completed implementation plan.

## 2026-06-26T01:04:22Z — P2 correctness — cycle: missing response metadata

- Threads: selected the next explicitly licensed stale repository, confirmed
  no open work, reviewed transport, SSRF, parser, queue, dependency, and hosted
  boundaries, and verified the exact lockfile on Node 20.19.0.
- Bug fixed: an injected or alternate transport callback returning no error and
  a `null` response caused the scraper to read `response.statusCode` and throw a
  `TypeError` outside its documented callback error path.
- Fix: status formatting now reads `statusCode` only from a present response and
  otherwise reports `unknown` while preserving the requested URI.
- Tests: added a no-network red/green regression that requires one callback,
  null result values, no parser invocation, and the stable unknown-status error.
- Contracts: static verification requires the null-safe guard, executable
  regression, completed plan, audit evidence, and hostile mutations.
- Validation: the pre-fix Node 20 regression crashed on the null property read;
  the focused suite passed after the fix. Three hostile mutations were
  rejected. Repository and external-directory `make check`, `npm test`, six
  Make-root tests, static baseline checks, `git diff --check`, and
  `npm audit --omit=dev` all passed; the audit reported zero vulnerabilities.
- Blockers: host Node 18.19.1 is below the repository's Node 20.19.0 contract,
  so behavior validation uses the official Node 20.19.0 image.
- Hosted: implementation head `233fc0c` passed both Node 20 baseline runs and
  CodeQL for Actions, JavaScript/TypeScript, and Python. Exact-head Codex review
  reported no actionable regressions.
- Next: revalidate this documentation-only head, merge PR #12, and synchronize
  `master`.

## 2026-06-25T20:47:20Z — P1 security/correctness — cycle: unused responses

- Threads: inspected the default branch, open work, transport/parser boundary,
  redirect handling, request deadlines, streaming limits, dependency audit,
  hosted workflow, Make authority, and existing no-network coverage; no open
  pull requests or issues were present.
- Bug fixed: redirect and non-200 response bodies are now error-observed and
  destroyed instead of being drained without a size or completion bound, so a
  hostile unused body cannot retain a background socket after the scrape moves
  on or returns status metadata.
- Files: `lib/http-request.js` and `test/http-request.test.js`.
- Validation: reproduced both paths calling `resume()` under Node 20.19.0,
  passed the focused HTTP transport suite, passed `make check`, and confirmed
  `npm audit --omit=dev` reports zero vulnerabilities with the exact lockfile.
- Blockers: the host Node 18.19.1 is below the repository runtime contract, so
  validation used the official Node 20.19.0 Docker image; no release blocker
  remains.
- Next: continue auditing response and redirect lifecycle transitions for
  callback-at-most-once behavior under late stream and socket errors.

## 2026-06-21

- Made absolute Makefile verification safe for spaces and apostrophes and
  rejected `MAKEFILE_LIST` injection before npm or policy checks run.
- Rejected `MAKEFILES` preloads, froze the verifier interpreter and recipe
  shell, and preserved relative trusted Makefiles after inert earlier `-f`
  inputs.
- Exercised all six Make aliases from checkout paths containing spaces,
  brackets, and apostrophes, with command-line and environment root attacks.

## 2026-06-18

- Refreshed the transitive undici lockfile resolution to 7.28.0 and added a
  maintained baseline boundary for the newly disclosed high-severity advisory
  ranges.

## 2026-06-16

- Restricted built-in transport IPv6 targets to the currently allocated
  `2000::/3` global-unicast space across literals, DNS answers, and redirects.

## 2026-06-15

- Routed synchronous transport setup failures through the single callback
  boundary while clearing the total-request deadline.

## 2026-06-14

- Applied each normalized transport timeout as one total request deadline
  across redirects in addition to the existing socket inactivity timeout.
- Added deterministic no-wait coverage for deadline cleanup, active-request
  destruction, and callback-at-most-once behavior.

## 2026-06-13

- Changed positive `reqPerSec` throttling to space request starts uniformly
  without waiting for remote response completion, with deterministic coverage
  for integer, fractional, numeric-string, and invalid values.
- Defined array callback delivery as request/parser completion order and added
  no-network coverage for an out-of-order response pair.

## 2026-06-12

- Replaced legacy jsdom and vendored jQuery 1.6.1 with exact jsdom 29.1.1 and
  jQuery 4.0.0 dependencies behind an injectable document adapter.
- Added `package-lock.json`, real no-network parser integration tests, locked
  hosted installation, and a production dependency audit with zero findings.
- Replaced the retired direct `request` dependency with a Node 20 built-in
  HTTP(S) transport that validates public DNS results on every bounded redirect.
- Added streaming response limits, redirect credential-header stripping, and
  no-network coverage for private destinations, timeouts, redirects, and body
  limits.
- Made every Make verification alias resolve repository paths from the
  Makefile, including when invoked from another working directory.
- Updated the immutable `actions/setup-node` pin to v6.4.0 so hosted checks use
  the supported Node 24 action runtime while continuing to test Node.js 20.
- Added a 1 MiB default response body parse limit with a finite positive
  `fetchOptions.maxBodyBytes` override.
- Added no-network coverage for oversized, multibyte, Buffer, unsupported, and
  invalid-limit response body cases before legacy jsdom parsing.

## 2026-06-10

- Raised the maintained runtime contract from Node 6 to Node 20+ and added an
  `.nvmrc`, while keeping the legacy request/jsdom migration separately scoped.
- Added pinned, credential-free, read-only hosted validation on Node 20 for
  dependency-injected tests and static checks without installing the unlocked
  legacy dependency tree.
- Added a header injection guard so CR/LF-bearing request header names and
  values are dropped during normalization.
- Added a 10-second request timeout default with finite positive caller
  overrides and fallback for invalid timeout values.

## 2026-06-08

- Added dependency-injected scraper tests that run without external requests.
- Avoided reading missing response bodies before request error handling.
- Returned immediately after missing URI and request error callbacks.
- Normalized request options without mutating caller-provided objects.
- Added `npm test`, `npm run check`, `make check`, and static baseline checks.
- Documented no-network test expectations, external request handling, and
  network error behavior.
- Replaced retired Twitter Search example URLs with reserved `example.test`
  placeholders.
- Pinned the legacy `request/jsdom` dependency contract so installs do not
  silently float to incompatible package APIs.
- Matched package engine metadata to the pinned `request` dependency.
- Made examples import `../lib/scraper`, bounded the localhost load example,
  and closed its server after callbacks.
- Added queue coverage so concurrent fetches cannot silently skip items.
- Avoided mutating caller-provided fetch options while applying defaults.
- Treated non-positive `reqPerSec` values as unthrottled so queues still drain.
- Treated non-function callbacks as no-ops so async request completion cannot
  throw after a caller supplies an invalid callback value.
- Ignored non-object headers during request option normalization.
- Rejected non-HTTP(S) request URIs before dispatching to the request client.
- Rejected HTTP(S) request URIs without hosts before dispatching to the request
  client.
- Rejected HTTP(S) URI credentials before dispatching to the request client.
- Added `make lint` and `make build` aliases alongside `make test` and
  `make check` for consistent local verification.
