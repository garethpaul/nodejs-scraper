# Reusable Options Example

status: completed

## Context

The scraper preserves caller-provided request and fetch option objects, but the
checked-in examples do not show users how to reuse those objects safely. The
existing examples also require external network access, so they cannot serve as
an executable proof of the immutability contract.

## Goals

- Add a deterministic no-network example that reuses request and fetch options.
- Freeze the shared inputs to make the caller-owned boundary explicit.
- Execute two scraper calls and show that both shared objects remain unchanged.
- Add regression and static contracts for the example and documentation.

## Work Completed

- Added `examples/reused-options.js` with an injected in-memory transport.
- Reused frozen request and fetch options across two sequential scraper calls.
- Added a child-process output regression to the complete npm test command.
- Documented the command and retired the corresponding vision roadmap item.
- Extended the static baseline across implementation, tests, docs, and evidence.

## Verification Completed

- Node 20.19.0 ran `node test/examples.test.js`, `npm test`, and
  `npm audit --omit=dev`; all tests passed and the production audit reported
  zero vulnerabilities.
- `npm run check`, `make lint`, `make test`, `make build`, and
  `make check` passed against the completed repository state.
- Absolute-Makefile `make check` passed from an external working directory.
- Seven focused hostile mutations were rejected across the required example,
  frozen-input contract, executable output, npm wiring, README guidance, vision
  invariant, and completed-plan evidence.
- `git diff --check` passed.
