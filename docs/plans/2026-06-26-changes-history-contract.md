# Changes History Contract Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Preserve reusable-options verification without preventing newer maintenance history.

**Architecture:** Extract entry lookup from `CHANGES.md` by stable content instead of assuming the first entry owns old feature evidence. Cover the behavior with a dependency-free Python regression registered in the package test gate.

**Tech Stack:** Python 3 static verifier, Node.js package scripts, GNU Make, GitHub Actions

---

status: completed

### Task 1: Write The Failing Regression

**Files:**
- Add: `test/test_baseline_contracts.py`
- Modify: `package.json`

Create a fixture with a newer audit entry followed by the reusable-options entry
and require the verifier helper to return the matching historical entry.

### Task 2: Fix Entry Lookup

**Files:**
- Modify: `scripts/check-baseline.py`

Add `changes_entry_containing` and validate reusable-options evidence in the
matching entry instead of the latest entry.

### Task 3: Record The Cycle

**Files:**
- Modify: `CHANGES.md`
- Modify: `docs/plans/2026-06-26-changes-history-contract.md`

Record the verifier bug, unsupported Node 18 diagnostic, Node 20 evidence, and
completed validation.

### Task 4: Validate And Merge

Run focused regression, Node 20.19.0 package and Make gates from repository and
external directories, production audit, syntax/diff/secret audits, Codex review,
hosted checks, and exact-head merge verification.

## Verification Completed

- `python3 test/test_baseline_contracts.py` failed first because the historical
  entry helper did not exist, then passed after implementation.
- Node 20.19.0 `npm test` passed with the regression registered in the package
  test chain.
- Repository and external working directory `make check` plus all five Make
  aliases passed under Node 20.19.0; `npm audit --omit=dev` reported zero
  vulnerabilities.
- `git diff --check` passed.
- Hosted Node matrices remain authoritative for supported-runtime coverage.
