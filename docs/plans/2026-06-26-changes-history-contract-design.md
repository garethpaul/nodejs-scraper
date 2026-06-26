# Changes History Contract Design

status: completed

## Context

The reusable-options verifier splits `CHANGES.md` and validates only the newest
entry. That proved the implementation cycle when it landed, but it also makes
all later maintenance entries fail unless they duplicate reusable-options
content. This conflicts with newest-first append-only maintenance history.

## Options Considered

1. Keep the reusable-options entry newest forever. This blocks future history
   and was rejected.
2. Duplicate reusable-options evidence into every new entry. This creates noisy,
   misleading history and was rejected.
3. Locate the original reusable-options entry by its stable heading/content and
   validate that entry regardless of newer records. This preserves evidence and
   allows future cycles.

## Decision

Use option 3. Add a small `changes_entry_containing` helper, use it for the
reusable-options evidence contract, and add a Python regression proving that a
newer unrelated entry does not hide or invalidate the historical evidence.

## Verification

- Add the regression first and observe failure against newest-entry lookup.
- Implement the helper and switch the verifier.
- Register the Python regression in `npm test`.
- Run Node 20.19.0 root/external gates, audit, hostile checks, and hosted CI.
- The final local integration gate is `make check`.
