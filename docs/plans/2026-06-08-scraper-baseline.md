# Node Scraper Baseline Plan

status: completed

## Context

`nodejs-scraper` is an old Node package that fetches pages and exposes their
HTML through a jQuery-like jsdom wrapper.

## Risks

- Request errors attempted to sanitize `body` before checking whether a body was
  present, which could throw before the caller received the real network error.
- Missing URI errors still fell through to the request client.
- Applying defaults mutated caller-provided request option objects.
- There was no local test or static-check command.

## Work Completed

- Added dependency injection through `createScraper` so tests can run without
  installing or calling legacy network dependencies.
- Normalized request options without mutating caller objects.
- Returned immediately after missing URI and request error callbacks.
- Added no-network Node tests plus a Python static baseline checker.
- Replaced retired Twitter Search examples with reserved `example.test`
  placeholders.
- Pinned the legacy `request/jsdom` dependency contract for deterministic
  maintenance checks.

## Verification

- `npm test`
- `npm run check`
- `make check`
- `git diff --check`
