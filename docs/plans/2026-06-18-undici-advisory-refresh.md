---
title: "security: Refresh the transitive Undici advisory boundary"
type: security
status: planned
date: 2026-06-18
execution: code
---

# Refresh the Transitive Undici Advisory Boundary

## Summary

Refresh the lockfile-defined `undici` dependency to a release that is outside
the newly disclosed high-severity advisory ranges, and make the repository
baseline reject a future regression to an affected resolution.

## Problem Frame

The exact PR #6 head previously passed `npm audit --omit=dev`, but the current
advisory database now reports the transitive `undici` resolution as vulnerable
to TLS option loss in SOCKS proxy handling and shared-cache cross-user data
disclosure. The package is pulled through the maintained `jsdom` dependency;
the application does not declare `undici` directly.

## Requirements

- R1. Resolve transitive `undici` to version `7.28.0` or newer without changing
  the public scraper API or weakening the existing transport boundaries.
- R2. Keep `package.json` and `package-lock.json` synchronized and avoid adding
  a direct dependency when the existing transitive range can carry the fix.
- R3. Make the maintained baseline reject lockfiles that resolve `undici`
  inside either current advisory range.
- R4. Preserve the existing callback, deadline, redirect, parser-size, DNS,
  socket-address, URI-authority, and IPv6 global-unicast contracts.
- R5. Record the exact advisory boundary and bounded verification without
  claiming live network, proxy, or cross-user cache execution.

## Technical Approach

- Use the package manager's lockfile-aware update path to select a compatible,
  patched transitive `undici` release while leaving the direct manifest stable
  unless compatibility proves that impossible.
- Extend `scripts/check-baseline.py` to parse the lockfile structurally and
  require the resolved `node_modules/undici` version to be outside the affected
  ranges.
- Add mutation-sensitive evidence for both the lockfile version and the
  baseline predicate so a stale or weakened boundary fails verification.
- Synchronize the repository security and verification guidance with the new
  dependency boundary.

## Scope Boundaries

- Do not alter scraper request semantics, callback ordering, throttling,
  redirect handling, parser behavior, address classification, or public APIs.
- Do not introduce proxy support, shared caching, live external requests, or
  an unrelated dependency modernization.
- Do not merge or close any stacked pull request.

## Implementation Units

### U1. Refresh the lockfile resolution

- **Files:** `package-lock.json` and, only if required by compatibility,
  `package.json`
- Select a patched `undici` resolution through the existing `jsdom` dependency
  graph and retain deterministic `npm ci` behavior.

### U2. Enforce the advisory boundary

- **Files:** `scripts/check-baseline.py`
- Parse the lockfile and reject missing, malformed, or advisory-affected
  `undici` versions.

### U3. Synchronize project evidence

- **Files:** `README.md`, `SECURITY.md`, `VISION.md`, `CHANGES.md`, and this plan
- Document the transitive dependency boundary and the actual bounded
  verification performed.

## Verification Plan

- Install exactly from the finalized lockfile with `npm ci --ignore-scripts`.
- Run `npm audit --omit=dev` and require zero known production vulnerabilities.
- Run all documented Make targets from the repository root and through the
  absolute Makefile path from an external directory.
- Run the package scripts, Python checker compilation, and `git diff --check`.
- Reject isolated hostile mutations to the resolved version and checker
  boundary.
- Audit the final diff for credentials, private target data, generated files,
  conflict markers, unintended modes, and unrelated dependency churn.

## Risks

- The advisory database can change after this plan is completed; the explicit
  lockfile boundary supplements but does not replace recurring `npm audit`.
- Static and unit verification cannot reproduce SOCKS proxy TLS behavior or a
  shared-cache cross-user disclosure without introducing out-of-scope systems.

## Completion Evidence

To be filled with the exact resolved version, validation commands, mutation
results, hosted run identifiers, and remaining runtime boundaries after the
implementation is finalized.
