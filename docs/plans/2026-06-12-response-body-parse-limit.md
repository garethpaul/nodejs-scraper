# Response Body Parse Limit

status: completed

## Context

Successful scraper responses are passed directly into a legacy jsdom parser
without a size or type boundary. An unexpectedly large page can amplify memory
use during DOM construction, while Buffer or object bodies can fail with raw
method errors before the caller receives a useful scraper error.

The legacy `request` client buffers callback bodies, so this change cannot cap
network download memory. It can still prevent oversized content from entering
the substantially more expensive jsdom parse path.

## Priority

The library processes untrusted remote HTML through an old parser. A clear,
configurable parse limit and body-type contract reduce denial-of-service risk
and make failure behavior deterministic without changing dependencies.

## Prioritized Engineering Backlog

1. Bound response bodies before legacy jsdom parsing now.
2. Replace the retired `request` and jsdom integrations with maintained,
   streaming-capable dependencies in a separately versioned compatibility
   change.
3. Add redirect target validation and private-network policy options when the
   transport layer is modernized.

## Requirements

- R1. Default HTML parsing must be limited to 1 MiB by byte length.
- R2. A finite positive `fetchOptions.maxBodyBytes` value must override the
  default; invalid values must fall back safely.
- R3. String and Buffer response bodies must remain supported.
- R4. Oversized bodies and unsupported body types must return callback errors
  without invoking jsdom.
- R5. Error messages must not include response contents.
- R6. Queue scheduling, request timeouts, URI validation, and option
  immutability must remain unchanged.
- R7. Tests must be dependency-injected and make no external requests.
- R8. README, security guidance, vision, changes, and the static baseline must
  document and protect the parse boundary.

## Scope Boundaries

- Do not claim to bound network buffering in the legacy request client.
- Do not replace request, jsdom, or jQuery in this focused change.
- Do not alter non-200 response behavior.
- Do not add dependencies.

## Verification

- `npm test`
- `npm run check`
- `make lint`
- `make test`
- `make build`
- `make check`
- `git diff --check`

## Verification Completed

- `node test/scraper.test.js` and `npm test` passed the dependency-injected,
  no-network scraper suite, including default and overridden byte limits,
  multibyte strings, raw Buffers, unsupported body types, and parser isolation.
- `npm run check` passed the static maintenance baseline.
- `make lint`, `make test`, `make build`, and `make check` all passed.
- `git diff --check` passed.

## Work Completed

- Added a 1 MiB default parse limit and finite positive override normalization.
- Added exact raw Buffer byte measurement, text normalization, and explicit
  unsupported-body errors before jsdom invocation.
- Added no-network tests for default, override, invalid fallback, UTF-8 byte
  measurement, raw Buffer measurement, Buffer support, and parser isolation.
- Updated the static baseline and maintenance documentation.
