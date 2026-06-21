# Safe Make Root

## Problem

The Makefile root used whitespace-splitting list functions and accepted a
caller-controlled `MAKEFILE_LIST`, so external verification could target the
wrong checkout.

## Change

- Resolve the raw Makefile path with POSIX-compatible system tooling.
- Reject non-file origins for GNU Make's automatic `MAKEFILE_LIST` value.
- Add regressions for spaces, a literal apostrophe, and injection.

## Validation

- Run exact dependency installation, package tests, static policy checks, and
  the production dependency audit.
- Confirm pinned Ubuntu CI and CodeQL pass at the exact pull-request head.
