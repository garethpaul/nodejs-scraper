# Changes

## 2026-06-13

- Changed positive `reqPerSec` throttling to space request starts uniformly
  without waiting for remote response completion, with deterministic coverage
  for integer, fractional, numeric-string, and invalid values.

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
