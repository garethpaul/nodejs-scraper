.PHONY: build check lint static-check test verify

PYTHON ?= python3

check: verify

verify: test static-check

test:
	npm test

lint build: static-check

static-check:
	PYTHONDONTWRITEBYTECODE=1 $(PYTHON) scripts/check-baseline.py
