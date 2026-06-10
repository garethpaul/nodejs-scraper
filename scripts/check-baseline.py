#!/usr/bin/env python3
"""Static baseline checks for nodejs-scraper."""

from pathlib import Path
import json
import sys
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    ".gitignore",
    "CHANGES.md",
    "Makefile",
    "README.md",
    "SECURITY.md",
    "VISION.md",
    "docs/plans/2026-06-08-scraper-baseline.md",
    "docs/plans/2026-06-09-fetch-options-immutability.md",
    "docs/plans/2026-06-09-non-positive-rate-limit.md",
    "docs/plans/2026-06-09-non-function-callback.md",
    "docs/plans/2026-06-09-non-object-headers.md",
    "docs/plans/2026-06-09-http-uri-validation.md",
    "docs/plans/2026-06-09-http-uri-host-validation.md",
    "docs/plans/2026-06-09-http-uri-credential-validation.md",
    "docs/plans/2026-06-09-make-gate-aliases.md",
    "docs/plans/2026-06-10-header-injection-guard.md",
    "docs/readme-overview.svg",
    "lib/scraper.js",
    "package.json",
    "test/scraper.test.js",
]


def read(relative_path):
    return (ROOT / relative_path).read_text(encoding="utf-8", errors="replace")


def main():
    failures = []
    for path in REQUIRED:
        if not (ROOT / path).is_file():
            failures.append(f"required file missing: {path}")

    package = json.loads(read("package.json"))
    scripts = package.get("scripts", {})
    if scripts.get("test") != "node test/scraper.test.js":
        failures.append("package.json must expose npm test")
    if "scripts/check-baseline.py" not in scripts.get("check", ""):
        failures.append("package.json must expose npm run check")
    if package.get("main") != "./lib/scraper.js":
        failures.append("package.json main must point at ./lib/scraper.js")
    if package.get("engines") != {"node": ">=6"}:
        failures.append("package.json must match the pinned request engine baseline")
    dependencies = package.get("dependencies", {})
    if dependencies.get("request") != "2.88.2":
        failures.append("package.json must pin request to the documented legacy version")
    if dependencies.get("jsdom") != "0.2.19":
        failures.append("package.json must pin jsdom to the documented legacy API version")

    makefile = read("Makefile")
    for phrase in [
        ".PHONY: build check lint static-check test verify",
        "check: verify",
        "verify: test static-check",
        "lint build: static-check",
        "PYTHONDONTWRITEBYTECODE=1 $(PYTHON) scripts/check-baseline.py",
    ]:
        if phrase not in makefile:
            failures.append(f"Makefile must include standard gate alias: {phrase}")

    source = read("lib/scraper.js")
    for phrase in [
        "function createScraper",
        "function normalizeHeaders",
        "function isSafeHeader",
        "function normalizeRequestOptions",
        "function normalizeReqPerSec",
        "function isHttpUri",
        "require('url')",
        "url.parse(uri)",
        "parsed.hostname",
        "parsed.auth",
        "module.exports.createScraper",
        "module.exports.normalizeRequestOptions",
        "normalizedFetchOptions",
        "typeof callback !== 'function'",
        "isHttpUri(requestOptions['uri'])",
        "http or https uri",
        "Array.isArray(headers)",
        "String(value).indexOf('\\r')",
        "String(value).indexOf('\\n')",
        "var reqPerSec = normalizeReqPerSec",
        "body = (body || '').replace",
        "return;",
    ]:
        if phrase not in source:
            failures.append(f"scraper implementation must include {phrase}")
    if "body = body.replace" in source:
        failures.append("scraper must not read response body before error checks")
    if "requestOptions[key] =" in source:
        failures.append("scraper must not mutate caller request options while applying defaults")
    if "fetchOptions[key] =" in source:
        failures.append("scraper must not mutate caller fetch options while applying defaults")

    tests = read("test/scraper.test.js")
    for phrase in [
        "normalizes string request options",
        "does not mutate request options",
        "ignores non-object request headers",
        "drops unsafe request headers",
        "does not mutate fetch options",
        "reports missing uri",
        "rejects non-http request uri without calling request",
        "rejects http request uri without host without calling request",
        "rejects http request uri with credentials without calling request",
        "handles request errors",
        "handles non-200 responses",
        "does not skip queued requests",
        "does not stall queued requests for non-positive reqPerSec",
        "treats non-function callbacks as no-op",
    ]:
        if phrase not in tests:
            failures.append(f"tests must include {phrase}")

    for path in ["examples/simple.js", "examples/advanced.js", "examples/parallel.js"]:
        example = read(path)
        if "require('../lib/scraper')" not in example:
            failures.append(f"{path} must import the local scraper")
        if "search.twitter.com" in example:
            failures.append(f"{path} must not point at the retired Twitter search endpoint")
        if "https://example.test/" not in example:
            failures.append(f"{path} must use reserved example.test URLs")

    local_example = read("examples/test.js")
    if "SCRAPER_TEST_REQUESTS" not in local_example or "server.close()" not in local_example:
        failures.append("examples/test.js must bound local load and close its server")

    gitignore = read(".gitignore")
    for expected in ["node_modules/", "npm-debug.log", ".env"]:
        if expected not in gitignore:
            failures.append(f".gitignore must include {expected}")

    docs = "\n".join(read(path) for path in ["README.md", "SECURITY.md", "VISION.md"])
    for phrase in [
        "npm run check",
        "external requests",
        "network errors",
        "request/jsdom",
        "example.test",
        "rate limits",
        "non-positive",
        "reqPerSec",
        "non-function callbacks",
        "non-object headers",
        "header injection guard",
        "HTTP(S)",
        "HTTP(S) hosts",
        "HTTP(S) URI credentials",
        "make lint",
        "make test",
        "make build",
        "make check",
    ]:
        if phrase.lower() not in docs.lower():
            failures.append(f"docs must mention {phrase}")
    changes = read("CHANGES.md")
    for phrase in ["make lint", "make test", "make build", "make check"]:
        if phrase not in changes:
            failures.append(f"CHANGES must mention {phrase}")

    plan = read("docs/plans/2026-06-08-scraper-baseline.md")
    if "status: completed" not in plan or "npm test" not in plan:
        failures.append("plan must record completed status and verification")
    fetch_options_plan = read("docs/plans/2026-06-09-fetch-options-immutability.md")
    if "status: completed" not in fetch_options_plan or "npm test" not in fetch_options_plan:
        failures.append("fetch options plan must record completed status and verification")
    rate_limit_plan = read("docs/plans/2026-06-09-non-positive-rate-limit.md")
    if "status: completed" not in rate_limit_plan or "reqPerSec" not in rate_limit_plan:
        failures.append("rate limit plan must record completed status and verification")
    callback_plan = read("docs/plans/2026-06-09-non-function-callback.md")
    if "status: completed" not in callback_plan or "non-function callbacks" not in callback_plan:
        failures.append("callback plan must record completed status and verification")
    headers_plan = read("docs/plans/2026-06-09-non-object-headers.md")
    if "status: completed" not in headers_plan or "non-object headers" not in headers_plan:
        failures.append("non-object headers plan must record completed status and verification")
    uri_plan = read("docs/plans/2026-06-09-http-uri-validation.md")
    if "status: completed" not in uri_plan or "HTTP(S)" not in uri_plan:
        failures.append("HTTP URI validation plan must record completed status and verification")
    uri_host_plan = read("docs/plans/2026-06-09-http-uri-host-validation.md")
    if "status: completed" not in uri_host_plan or "HTTP(S) hosts" not in uri_host_plan:
        failures.append("HTTP URI host validation plan must record completed status and verification")
    uri_credentials_plan = read("docs/plans/2026-06-09-http-uri-credential-validation.md")
    if "status: completed" not in uri_credentials_plan or "HTTP(S) URI credentials" not in uri_credentials_plan:
        failures.append("HTTP URI credential validation plan must record completed status and verification")
    make_gate_plan_path = ROOT / "docs/plans/2026-06-09-make-gate-aliases.md"
    make_gate_plan = make_gate_plan_path.read_text(encoding="utf-8") if make_gate_plan_path.exists() else ""
    if "status: completed" not in make_gate_plan or "make lint" not in make_gate_plan or "make build" not in make_gate_plan:
        failures.append("make gate alias plan must record completed status and verification")
    header_injection_plan_path = ROOT / "docs/plans/2026-06-10-header-injection-guard.md"
    header_injection_plan = header_injection_plan_path.read_text(encoding="utf-8") if header_injection_plan_path.exists() else ""
    if "status: completed" not in header_injection_plan or "header injection guard" not in header_injection_plan.lower():
        failures.append("header injection guard plan must record completed status and verification")

    try:
        ET.parse(ROOT / "docs/readme-overview.svg")
    except ET.ParseError as error:
        failures.append(f"docs/readme-overview.svg must parse as XML: {error}")

    if failures:
        for failure in failures:
            print(failure, file=sys.stderr)
        return 1

    print("nodejs-scraper baseline checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
