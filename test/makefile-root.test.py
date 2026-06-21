#!/usr/bin/env python3
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]


class MakefileRootTests(unittest.TestCase):
    def test_absolute_makefile_path_with_spaces_and_apostrophe(self):
        with tempfile.TemporaryDirectory(prefix="Node scraper's gate ") as directory:
            checkout = Path(directory)
            makefile = checkout / "Makefile"
            makefile.write_text(
                (ROOT / "Makefile").read_text(encoding="utf-8"), encoding="utf-8"
            )
            result = subprocess.run(
                ["make", "-n", "-f", str(makefile), "static-check"],
                cwd=checkout.parent,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                check=False,
                env={"PATH": os.environ.get("PATH", "")},
            )
            self.assertEqual(result.returncode, 0, result.stdout)
            self.assertNotIn('python3 " ', result.stdout)
            self.assertIn(str(checkout / "scripts" / "check-baseline.py"), result.stdout)
            self.assertIn(str(checkout / "test" / "makefile-root.test.py"), result.stdout)

    def test_makefile_list_override_fails_closed(self):
        result = subprocess.run(
            ["make", "-n", "-f", str(ROOT / "Makefile"), "MAKEFILE_LIST=/tmp/untrusted", "check"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            check=False,
            env={"PATH": os.environ.get("PATH", "")},
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("MAKEFILE_LIST must not be overridden", result.stdout)


if __name__ == "__main__":
    unittest.main()
