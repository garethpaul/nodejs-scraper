.PHONY: build check lint static-check test verify

override SHELL := /bin/sh
override .SHELLFLAGS := -c
ifneq ($(strip $(MAKEFILES)),)
$(error MAKEFILES must not be set)
endif
override MAKEFILES :=
ifneq ($(origin MAKEFILE_LIST),file)
$(error MAKEFILE_LIST must not be overridden)
endif
override ROOT := $(shell MAKEFILE_LIST_RAW='$(subst ','"'"',$(MAKEFILE_LIST))' python3 -c "import os; raw = os.environ['MAKEFILE_LIST_RAW']; candidates = [raw] + [raw[index + 1:] for index, char in enumerate(raw) if char == ' ']; path = next((candidate for candidate in candidates if (candidate == 'Makefile' or candidate.endswith('/Makefile')) and os.path.isfile(os.path.abspath(candidate))), None); assert path is not None, 'trusted Makefile path not found'; print(os.path.dirname(os.path.abspath(path)))")
override PYTHON := python3
build check lint static-check test verify: override ROOT := $(ROOT)
build check lint static-check test verify: override PYTHON := $(PYTHON)

check: verify

verify: test static-check

test:
	cd "$(ROOT)" && npm test

lint build: static-check

static-check:
	PYTHONDONTWRITEBYTECODE=1 $(PYTHON) "$(ROOT)/scripts/check-baseline.py"
	PYTHONDONTWRITEBYTECODE=1 $(PYTHON) "$(ROOT)/test/makefile-root.test.py"
