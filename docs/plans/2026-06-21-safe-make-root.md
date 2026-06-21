# Safe Make Root

## Problem

The Makefile root used whitespace-splitting list functions and accepted a
caller-controlled `MAKEFILE_LIST`, so external verification could target the
wrong checkout.

## Change

- Resolve the final existing trusted Makefile suffix without splitting spaces
  inside its path, including after an inert earlier `-f` input.
- Reject non-file origins for GNU Make's automatic `MAKEFILE_LIST` value.
- Reject `MAKEFILES` preloads and freeze the recipe shell, Python verifier, and
  derived root on every public target.
- Add regressions for spaces, a literal apostrophe, preload and interpreter
  replacement, relative trusted Makefiles, and injection.

## Validation

- Run exact dependency installation, package tests, static policy checks, and
  the production dependency audit.
- Confirm pinned Ubuntu CI and CodeQL pass at the exact pull-request head.
