#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from ietf_protocol_address_contract import validation_errors


transport = (ROOT / "lib" / "http-request.js").read_text(encoding="utf-8")
scraper = (ROOT / "lib" / "scraper.js").read_text(encoding="utf-8")
transport_tests = (ROOT / "test" / "http-request.test.js").read_text(encoding="utf-8")

errors = validation_errors(transport, scraper, transport_tests)
if errors:
    raise AssertionError(f"baseline IETF protocol-address contract invalid: {errors}")

mutations = {
    "IPv4 exception call removed": (
        transport.replace(
            "\tif (family === 4 && isGloballyReachableIetfProtocolAddress(address)) {\n"
            "\t\treturn true;\n"
            "\t}\n",
            "",
            1,
        ),
        scraper,
        transport_tests,
    ),
    "protocol block narrowed": (
        transport.replace("['192.0.0.0', 24]", "['192.0.0.0', 29]", 1),
        scraper,
        transport_tests,
    ),
    "PCP exception removed": (
        transport.replace("address === '192.0.0.9'", "address === '192.0.0.8'", 1),
        scraper,
        transport_tests,
    ),
    "TURN exception broadened": (
        transport.replace("address === '192.0.0.10'", "address === '192.0.0.11'", 1),
        scraper,
        transport_tests,
    ),
    "legacy URL parser restored": (
        transport,
        scraper.replace("parsed = new URL(uri)", "parsed = url.parse(uri)", 1),
        transport_tests,
    ),
    "literal regression removed": (
        transport,
        scraper,
        transport_tests.replace(
            "rejects unassigned IETF protocol literals before dispatch",
            "accepts unassigned IETF protocol literals",
            1,
        ),
    ),
    "DNS regression removed": (
        transport,
        scraper,
        transport_tests.replace(
            "rejects DNS answers in unassigned IETF protocol space",
            "accepts DNS answers in unassigned IETF protocol space",
            1,
        ),
    ),
    "redirect regression removed": (
        transport,
        scraper,
        transport_tests.replace(
            "rejects redirects to unassigned IETF protocol space",
            "accepts redirects to unassigned IETF protocol space",
            1,
        ),
    ),
}

for description, sources in mutations.items():
    if sources == (transport, scraper, transport_tests):
        raise AssertionError(f"{description} mutation did not alter the baseline")
    if not validation_errors(*sources):
        raise AssertionError(f"{description} mutation was accepted")

print(f"IETF protocol-address contract passed ({len(mutations)} mutations rejected).")
