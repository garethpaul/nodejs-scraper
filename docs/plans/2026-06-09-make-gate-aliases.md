# Make Gate Aliases

status: completed

## Context

The repository already had `npm test`, `npm run check`, and `make check`, but
the shared maintenance workflow also runs `make lint`, `make test`, and
`make build` before pushing. Those commands should reach the existing npm test
and SDK-free static verifier consistently.

## Objectives

- Keep `make test` delegated to `npm test`.
- Add `make lint` and `make build` aliases for the static baseline.
- Keep `make check` running both the npm tests and static baseline through
  `make verify`.
- Extend docs and the static baseline for the standard gate contract.

## Verification

- `make lint`
- `make test`
- `make build`
- `make check`
- `git diff --check`
