.PHONY: build check lint static-check test verify

PYTHON ?= python3
ifneq ($(origin MAKEFILE_LIST),file)
$(error MAKEFILE_LIST must not be overridden)
endif
override ROOT := $(shell path='$(subst ','"'"',$(MAKEFILE_LIST))'; path=$$(printf '%s' "$$path" | /usr/bin/sed 's/^ //'); /usr/bin/dirname -- "$$path")

check: verify

verify: test static-check

test:
	cd "$(ROOT)" && npm test

lint build: static-check

static-check:
	PYTHONDONTWRITEBYTECODE=1 $(PYTHON) "$(ROOT)/scripts/check-baseline.py"
	PYTHONDONTWRITEBYTECODE=1 $(PYTHON) "$(ROOT)/test/makefile-root.test.py"
