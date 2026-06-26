# Missing Response Status Handling

status: completed

## Goal

Keep absent transport response metadata on the scraper's asynchronous error
callback path instead of throwing while formatting a status error.

## Steps

1. Add the failing null-response callback regression.
2. Derive status only from a present response object.
3. Add static and mutation-sensitive verification.
4. Run local, hosted, audit, and review gates.

## Acceptance Criteria

- A null response produces one callback error containing `unknown`.
- The error retains the requested URI for diagnosis.
- No document parser is invoked without a successful response.
- Existing transport and parser tests remain green on Node 20.19.0.

## Verification Completed

- The pre-fix `node test/scraper.test.js` run crashed on the null response
  property read; the corrected focused run passed on Node 20.19.0.
- `npm test`, `make check`, and `npm audit --omit=dev` passed with the exact
  lockfile; the audit reported zero vulnerabilities.
- The same `make check` passed from an external working directory.
- Three isolated hostile mutations were rejected for restoring the null read,
  removing the executable regression, and weakening the unknown-status
  assertion.
- `git diff --check` passed without generated or dependency changes.

## Merge Gate

Implementation head `233fc0c` passed both hosted Node 20 baseline runs and
CodeQL for Actions, JavaScript/TypeScript, and Python. Exact-head Codex review
reported no actionable regressions.
