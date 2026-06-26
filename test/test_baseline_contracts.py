#!/usr/bin/env python3
import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CHECKER_PATH = ROOT / "scripts" / "check-baseline.py"


def load_checker():
    spec = importlib.util.spec_from_file_location("scraper_baseline", CHECKER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load scraper baseline checker")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class ChangesHistoryContractTests(unittest.TestCase):
    def test_finds_historical_evidence_after_newer_entry(self):
        checker = load_checker()
        changes = """# Changes

## 2026-06-26 13:20 PDT - P3 - Later audit

- No behavior changed.

## 2026-06-26T11:43:53Z — P2 usability/correctness — cycle: reusable option inputs

- Example: added the reusable-options example at `examples/reused-options.js`.
- Tests: added `test/examples.test.js` and focused hostile mutations.
"""

        entry = checker.changes_entry_containing(changes, "cycle: reusable option inputs")

        self.assertIn("examples/reused-options.js", entry)
        self.assertIn("test/examples.test.js", entry)
        self.assertIn("hostile mutations", entry)
        self.assertNotIn("Later audit", entry)


if __name__ == "__main__":
    unittest.main()
