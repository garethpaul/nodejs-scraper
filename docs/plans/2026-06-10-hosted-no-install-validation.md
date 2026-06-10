# Hosted No-Install Validation

status: completed

## Context

The repository has dependency-injected tests that run without network access or
installed packages, plus a Python static baseline. Its 2011-era jsdom dependency
has no committed lockfile, so modern `npm install` is not reproducible.

## Priorities

1. Run the canonical no-install `make check` gate on hosted Linux.
2. Pin checkout, Python, permissions, runner, timeout, and concurrency behavior.
3. Enforce the workflow contract from the baseline checker.
4. Keep package installation, external scraping, and live requests outside CI.

## Implementation Units

Files:

- `.github/workflows/check.yml`
- `scripts/check-baseline.py`
- `README.md`
- `VISION.md`
- `SECURITY.md`
- `CHANGES.md`

Add push, pull-request, and manual triggers; read-only permissions; concurrency
cancellation; a bounded `ubuntu-24.04` job; commit-pinned checkout and Python
setup; Node availability reporting; and `make check`. Require that contract
from the baseline checker.

## Verification

- `make lint`
- `make test`
- `make build`
- `make check`
- workflow YAML parse
- `git diff --check`
- successful hosted Linux `Check` workflow for the pushed commit

## Boundaries

- Do not run `npm install` without a committed lockfile or modernization plan.
- Do not contact external sites or perform live scraping in CI.
