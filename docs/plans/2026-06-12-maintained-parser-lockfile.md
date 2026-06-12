# Maintained Parser And Locked Dependencies

status: planned

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

## Verification

- Pending test-first implementation and verification.
