import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]


class MakefileRootTests(unittest.TestCase):
    def run_make(self, *arguments, environment=None):
        with tempfile.TemporaryDirectory(prefix="node scraper make path ") as directory:
            root = Path(directory)
            checkout = root / "checkout [hostile] 'quote"
            checkout.mkdir()
            shutil.copyfile(ROOT / "Makefile", checkout / "Makefile")
            external = root / "external caller"
            external.mkdir()
            env = os.environ.copy()
            if environment:
                env.update(environment)
            result = subprocess.run(
                ["make", "--no-print-directory", "-n", "-f", str(checkout / "Makefile"), *arguments],
                cwd=external,
                env=env,
                capture_output=True,
                text=True,
                check=False,
            )
            return result, checkout

    def test_all_aliases_preserve_spaced_absolute_makefile_path(self):
        for target in ("check", "lint", "static-check", "test", "build", "verify"):
            for name, arguments, environment in (
                ("none", (target,), None),
                ("command", (target, "ROOT=/tmp/attacker-root"), None),
                ("environment", (target,), {"ROOT": "/tmp/attacker-root"}),
            ):
                with self.subTest(target=target, override=name):
                    result, checkout = self.run_make(*arguments, environment=environment)
                    self.assertEqual(0, result.returncode, result.stderr)
                    self.assertIn(str(checkout), result.stdout)
                    self.assertNotIn("/tmp/attacker-root", result.stdout)

    def test_command_line_makefile_list_override_fails_closed(self):
        result, _ = self.run_make("check", "MAKEFILE_LIST=/tmp/attacker/Makefile")
        self.assertNotEqual(0, result.returncode)
        self.assertIn("MAKEFILE_LIST must not be overridden", result.stderr)

    def test_environment_makefile_list_override_fails_closed(self):
        result, _ = self.run_make(
            "-e", "check", environment={"MAKEFILE_LIST": "/tmp/attacker/Makefile"}
        )
        self.assertNotEqual(0, result.returncode)
        self.assertIn("MAKEFILE_LIST must not be overridden", result.stderr)

    def test_makefiles_preload_fails_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            preload = Path(directory) / "preload.mk"
            preload.write_text("override PYTHON := /bin/true\n", encoding="utf-8")
            result, _ = self.run_make(
                "static-check", environment={"MAKEFILES": str(preload)}
            )
        self.assertNotEqual(0, result.returncode)
        self.assertIn("MAKEFILES must not be set", result.stderr)

    def test_python_override_cannot_replace_verifier(self):
        result, _ = self.run_make("static-check", "PYTHON=/tmp/fake-python")
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertNotIn("/tmp/fake-python", result.stdout)
        self.assertIn("python3", result.stdout)

    def test_earlier_makefile_cannot_poison_relative_trusted_makefile(self):
        with tempfile.TemporaryDirectory(prefix="node scraper earlier make ") as directory:
            checkout = Path(directory) / "checkout [hostile] 'quote"
            checkout.mkdir()
            shutil.copyfile(ROOT / "Makefile", checkout / "Makefile")
            early = Path(directory) / "early.mk"
            early.write_text("# inert\n", encoding="utf-8")
            result = subprocess.run(
                ["make", "--no-print-directory", "-n", "-f", str(early), "-f", "Makefile", "static-check"],
                cwd=checkout,
                env={"PATH": os.environ.get("PATH", "")},
                capture_output=True,
                text=True,
                check=False,
            )
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertIn(str(checkout / "scripts/check-baseline.py"), result.stdout)
        self.assertNotIn(str(Path(directory) / "scripts/check-baseline.py"), result.stdout)


if __name__ == "__main__":
    unittest.main()
