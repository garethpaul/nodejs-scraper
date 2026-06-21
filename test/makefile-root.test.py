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

    def test_makefiles_preload_fails_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            preload = Path(directory) / "preload.mk"
            preload.write_text("override PYTHON := /bin/true\n", encoding="utf-8")
            environment = {
                "PATH": os.environ.get("PATH", ""),
                "MAKEFILES": str(preload),
            }
            result = subprocess.run(
                ["make", "-n", "-f", str(ROOT / "Makefile"), "static-check"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                check=False,
                env=environment,
            )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("MAKEFILES must not be set", result.stdout)

    def test_python_override_cannot_replace_verifier(self):
        result = subprocess.run(
            [
                "make",
                "-n",
                "-f",
                str(ROOT / "Makefile"),
                "PYTHON=/tmp/fake-python",
                "static-check",
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            check=False,
            env={"PATH": os.environ.get("PATH", "")},
        )
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertNotIn("/tmp/fake-python", result.stdout)
        self.assertIn("python3", result.stdout)

    def test_earlier_makefile_cannot_poison_relative_trusted_makefile(self):
        with tempfile.TemporaryDirectory() as directory:
            checkout = Path(directory) / "checkout"
            checkout.mkdir()
            (checkout / "Makefile").write_text(
                (ROOT / "Makefile").read_text(encoding="utf-8"),
                encoding="utf-8",
            )
            early = Path(directory) / "early.mk"
            early.write_text("# inert\n", encoding="utf-8")
            result = subprocess.run(
                ["make", "-n", "-f", str(early), "-f", "Makefile", "static-check"],
                cwd=checkout,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                check=False,
                env={"PATH": os.environ.get("PATH", "")},
            )
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertIn(str(checkout / "scripts/check-baseline.py"), result.stdout)
        self.assertNotIn(str(Path(directory) / "scripts/check-baseline.py"), result.stdout)


if __name__ == "__main__":
    unittest.main()
