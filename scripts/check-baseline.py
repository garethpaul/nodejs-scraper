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
    "README.md",
    "SECURITY.md",
    "VISION.md",
    "docs/plans/2026-06-08-scraper-baseline.md",
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

    source = read("lib/scraper.js")
    for phrase in [
        "function createScraper",
        "function normalizeRequestOptions",
        "module.exports.createScraper",
        "module.exports.normalizeRequestOptions",
        "body = (body || '').replace",
        "return;",
    ]:
        if phrase not in source:
            failures.append(f"scraper implementation must include {phrase}")
    if "body = body.replace" in source:
        failures.append("scraper must not read response body before error checks")
    if "requestOptions[key] =" in source:
        failures.append("scraper must not mutate caller request options while applying defaults")

    tests = read("test/scraper.test.js")
    for phrase in [
        "normalizes string request options",
        "does not mutate request options",
        "reports missing uri",
        "handles request errors",
        "handles non-200 responses",
    ]:
        if phrase not in tests:
            failures.append(f"tests must include {phrase}")

    gitignore = read(".gitignore")
    for expected in ["node_modules/", "npm-debug.log", ".env"]:
        if expected not in gitignore:
            failures.append(f".gitignore must include {expected}")

    docs = "\n".join(read(path) for path in ["README.md", "SECURITY.md", "VISION.md"])
    for phrase in ["npm run check", "external requests", "network errors"]:
        if phrase.lower() not in docs.lower():
            failures.append(f"docs must mention {phrase}")

    plan = read("docs/plans/2026-06-08-scraper-baseline.md")
    if "status: completed" not in plan or "npm test" not in plan:
        failures.append("plan must record completed status and verification")

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
