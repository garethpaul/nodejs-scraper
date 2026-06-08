.PHONY: check test static-check

check: test static-check

test:
	npm test

static-check:
	python3 scripts/check-baseline.py
