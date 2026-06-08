# Changes

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
