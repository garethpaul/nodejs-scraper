# Node 20 toolchain baseline

status: completed

## Goal

Move repository maintenance and verification off the obsolete Node 6 runtime
without combining that toolchain change with the larger request/jsdom API
migration.

## Changes

- Require Node 20 or newer in package metadata.
- Add `.nvmrc` for a reproducible local major version.
- Keep the dependency-injected test and static-contract gates runnable without network access.
- Preserve pinned legacy request/jsdom versions until their APIs are replaced in a dedicated change.

## Verification

Run `make check` and `git diff --check` on Node 20 or newer.
