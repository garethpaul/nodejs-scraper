.PHONY: build check lint static-check test verify

PYTHON ?= python3
ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

check: verify

verify: test static-check

test:
	cd "$(ROOT)" && npm test

lint build: static-check

static-check:
	PYTHONDONTWRITEBYTECODE=1 $(PYTHON) "$(ROOT)scripts/check-baseline.py"
