# Spaced Absolute Makefile Path Verification

status: completed

## Context

GNU Make list functions split loaded paths on whitespace. Verification must
retain the complete trusted checkout when its path contains spaces, brackets,
and an apostrophe, including when invoked from another working directory.

## Scope

1. Exercise all six Make aliases through an absolute trusted Makefile path.
2. Preserve the frozen checkout root against command-line and environment
   input.
3. Reject `MAKEFILE_LIST` replacement and `MAKEFILES` preloads.
4. Preserve a relative trusted Makefile after an inert earlier `-f` input.
5. Keep the Python verifier authoritative instead of accepting caller
   replacement.

## Verification

- All six Make aliases retained the hostile checkout path with no override and
  with command-line or environment `ROOT` input.
- Both `MAKEFILE_LIST` replacement paths and a `MAKEFILES` preload failed
  closed.
- A caller-supplied Python path could not replace the repository verifier.
- An inert earlier absolute `-f` input could not poison a later relative
  trusted Makefile.
- Existing no-network scraper tests, production dependency audit, lockfile
  policy, and advisory boundaries remained green.

## Risk And Rollback

This follow-up expands verification coverage and standardizes the test module
name. It does not alter scraper, transport, parser, dependency, or scheduling
behavior.
