# nodejs-scraper

<!-- README-OVERVIEW-IMAGE -->
![Project overview](docs/readme-overview.svg)

## Overview

`garethpaul/nodejs-scraper` is a legacy Node.js scraping helper that fetches
pages and exposes a jQuery-like document interface.

This README is based on the checked-in source, manifests, scripts, and repository metadata on the `master` branch. The project language mix found during review was: JavaScript (5).

## Repository Contents

- `README.md` - project overview and local usage notes
- `package.json` - JavaScript dependency and script metadata
- `CHANGES.md` - baseline change log
- `Makefile` - local verification entry point
- `examples` - source or example code
- `lib` - source or example code
- `SECURITY.md` - security reporting and disclosure guidance
- `VISION.md` - project direction and maintenance guardrails
- `docs/plans/2026-06-08-scraper-baseline.md` - completed hardening plan
- `package-lock.json` - exact maintained parser dependency graph
- `scripts/check-baseline.py` - static baseline checks used by `npm run check`
- `test/document.test.js` - real no-network parser integration tests
- `test/http-request.test.js` - no-network transport security tests
- `test/scraper.test.js` - no-network behavior tests

Additional scan context:

- Source directories: examples, lib
- Dependency and build manifests: package.json
- Entry points or build surfaces: package.json
- Test-looking files: examples/test.js

## Getting Started

### Prerequisites

- Git
- Node.js and npm

### Setup

```bash
git clone https://github.com/garethpaul/nodejs-scraper.git
cd nodejs-scraper
npm ci
make lint
make test
make build
make check
npm run check
```

The setup commands above are derived from repository files. Legacy mobile, Python, or JavaScript samples may require older SDKs or package versions than a modern workstation uses by default.
The parser is locked to jsdom 29.1.1 and jQuery 4.0.0. Use `npm ci` so local and
hosted verification exercise the exact `package-lock.json` graph. Repository
maintenance requires Node 20.19.0 or newer; `.nvmrc` selects Node 20 for local
use. The default network path uses Node's built-in HTTP(S) transport, while the
dependency-injected request callback remains available for compatibility and
no-network tests.

## Running or Using the Project

- Import `scraper` from `lib/scraper.js` or use the package entry point.
- Pass a URL string, request options object, or array of either form.
- Request URIs must be HTTP(S); non-web schemes are rejected before the request
  client is called.
- HTTP(S) hosts are required, so malformed URLs like `http://` are rejected
  before the request client is called.
- HTTP(S) URI credentials are rejected, so `user:pass@host` targets do not
  reach the request client.
- Caller-provided request and fetch option objects are not mutated while
  defaults are applied.
- Non-object headers are ignored during request option normalization, while the
  default `User-Agent` header is retained.
- The header injection guard drops caller-provided header names or values that
  contain CR/LF characters before dispatch.
- Requests use a 10-second timeout by default. A finite positive `timeout`
  option overrides that default; invalid timeout values fall back to it.
- Successful response bodies use a 1 MiB parse limit by default. A finite
  positive `fetchOptions.maxBodyBytes` value overrides it; oversized or
  unsupported body types fail before jsdom parsing. The built-in
  transport applies the same limit while streaming, before full buffering.
- Successful documents are parsed by jsdom 29.1.1 and exposed through a jQuery
  4.0.0 `$` function. Remote page scripts and subresources are not enabled.
- The built-in transport follows at most five redirects by default, validates
  every redirect target, rejects private network and reserved IP destinations,
  and strips credential-bearing headers when a redirect crosses origins.
- Missing or non-function callbacks are treated as no-ops.
- The checked-in external examples use reserved `example.test` URLs; replace
  them with targets you own or have permission to test.
- Example scripts import `../lib/scraper` so they can run from this checkout.
- Use `reqPerSec` when issuing multiple external requests so callers do not
  overwhelm target services.
- Non-positive `reqPerSec` values are treated as unthrottled so the request
  queue still drains.

## Testing and Verification

- `npm test`
- `npm run check`
- `npm audit --omit=dev`
- `make lint`
- `make test`
- `make build`
- `make check`
- Pinned, credential-free, read-only `ubuntu-24.04` GitHub Actions sets up Node
  20, installs the exact lockfile with scripts disabled, audits production
  dependencies, and runs the no-network tests and static baseline.

When the required SDK or runtime is unavailable, use static checks and source review first, then verify on a machine that has the matching platform toolchain.

## Configuration and Secrets

- No required secret or credential file was identified in the repository scan.
- Keep credentials, private target URLs, captured pages, and environment files
  out of git.

## Security and Privacy Notes

- Review changes touching external API calls or credential-adjacent configuration; examples from the scan include examples/advanced.js, examples/parallel.js, examples/simple.js.
- Review changes touching network requests, sockets, or service endpoints; examples from the scan include examples/advanced.js, examples/parallel.js, examples/simple.js, examples/test.js, and 1 more.
- Tests should avoid external requests by injecting fake transport/document
  dependencies. Network errors should be surfaced to callbacks without reading
  missing response bodies, non-function callbacks should not throw during async
  completion, non-object headers should not create numeric header names, and
  option defaults should not mutate caller inputs. HTTP(S) URI validation should
  reject non-web schemes, missing HTTP(S) hosts, and HTTP(S) URI credentials
  before request dispatch.
- The response body parse limit bounds content entering jsdom, and the
  built-in transport enforces it while reading the network response.
- Keep parser scripts and external resource loading disabled; real parser tests
  use only local HTML and reserved or unreachable URLs.
- The header injection guard should keep unsafe CR/LF header names and values
  out of normalized request options.
- Keep the default request timeout bounded when callers omit or provide an
  invalid `timeout` option.
- Scraping workflows should respect robots guidance, terms of service, and
  rate limits.
- Treat non-positive `reqPerSec` values as a caller mistake rather than a
  queue-stalling throttle.

## Maintenance Notes

- See `SECURITY.md` for vulnerability reporting and safe research guidance.
- Run `npm run check`, `make lint`, `make test`, `make build`, and
  `make check` before changing scraper behavior, request handling, or examples.
- See `docs/plans/2026-06-09-make-gate-aliases.md` for the local verification
  gate aliases.
- See `docs/plans/2026-06-10-header-injection-guard.md` for the header
  injection guard.
- Keep transport/parser changes explicit and tested, and keep `package.json`
  and `package-lock.json` synchronized through `npm ci`.
- See `docs/plans/2026-06-12-maintained-parser-lockfile.md` for the maintained
  parser and reproducible dependency migration.
- See `VISION.md` for project direction and contribution guardrails.

## Contributing

Keep changes small and tied to the project that is already present in this repository. For code changes, document the toolchain used, avoid committing generated dependency directories or local configuration, and update this README when setup or verification steps change.
