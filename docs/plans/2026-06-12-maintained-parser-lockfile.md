# Maintained Parser And Locked Dependencies

status: completed

## Problem

The default transport no longer uses the retired `request` package, but
`jsdom@0.2.19` still resolves `request: 2.x` transitively and requires an
unlocked, obsolete native dependency tree. Hosted checks therefore cannot
install or exercise the real parser integration, and the returned jQuery
surface still comes from vendored jQuery 1.6.1.

## Compatibility Boundary

- Preserve the public scraper callback contract: successful responses return a
  jQuery-compatible `$` function bound to the parsed document.
- Preserve the dependency-injected request seam and no-network transport tests.
- Keep remote page scripts and subresources disabled during parsing.
- Keep response normalization, byte limits, URI policy, queueing, status errors,
  and callback behavior unchanged.
- Do not emulate removed jQuery APIs beyond the selectors and document methods
  exercised by this repository.

## Plan

1. Replace legacy jsdom with exact `jsdom@29.1.1` and replace vendored jQuery
   with exact `jquery@4.0.0` through its documented `jquery/factory` entry point.
2. Isolate document construction behind a small injectable adapter so scraper
   orchestration tests remain deterministic.
3. Add real, no-network parser tests for head/body selection, malformed HTML,
   disabled inline scripts, disabled external resources, and parser errors.
4. Commit `package-lock.json`, require `npm ci`, and run `npm audit` against the
   exact production dependency graph.
5. Update hosted validation to install the lockfile before the full gate and
   extend the static checker to reject dependency, lockfile, parser, and
   no-install regressions.
6. Remove the obsolete vendored jQuery file only after the maintained adapter
   passes focused and full verification.

## Work Completed

- Replaced legacy jsdom with exact jsdom 29.1.1 and vendored jQuery 1.6.1 with
  exact jQuery 4.0.0 through the documented `jquery/factory` API.
- Added an asynchronous injectable document adapter and preserved the public
  successful callback's jQuery-compatible `$` function.
- Added real local-only parser tests and full scraper integration coverage for
  head/body selection, malformed HTML, inert scripts, disabled resources, and
  construction errors.
- Added `package-lock.json`, removed the obsolete vendored asset, and updated
  hosted validation to install with scripts disabled and audit production
  dependencies.
- Updated repository contracts and documentation for Node 20.19.0+, exact
  dependency installation, and disabled remote parser execution/loading.

## Verification

- The initial `node test/document.test.js` run failed because `lib/document.js`
  did not exist, confirming the test-first boundary.
- `node test/document.test.js` and `npm test` passed against real jsdom 29.1.1
  and jQuery 4.0.0 without live network requests.
- `npm ls request --all` returned an empty dependency tree.
- `npm audit --omit=dev` reported zero production vulnerabilities.
- A clean `npm ci --ignore-scripts --no-audit --no-fund` installed the exact
  40-package production graph from `package-lock.json`.
- `npm run check`, `make lint`, `make test`, `make build`, `make check`, and
  `make verify` passed.
- External `make -f
  /home/gjones/code/private/repos/garethpaul/nodejs-scraper/Makefile check`
  passed from `/tmp`.
- JavaScript syntax checks, Python compilation, `git diff --check`, and
  `npm pack --dry-run --json` passed; the package artifact excluded generated
  bytecode and retired vendored jQuery.
- Eight hostile mutations were rejected: legacy jsdom restoration, request
  lockfile restoration, script execution, resource loading, missing real
  parser integration coverage, incomplete plan status, unlocked CI, and
  vendored jQuery restoration.
- Exact implementation head
  `c443e15f55ccd29f02e6c4368350821fa4c50d65` passed canonical push Check run
  `27428808753`, pull-request Check run `27428810003`, and CodeQL run
  `27428808202` for actions, JavaScript/TypeScript, and Python.
