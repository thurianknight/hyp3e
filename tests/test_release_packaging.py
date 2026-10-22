"""Release archives must contain current allowlisted bytes, never stale output."""

import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile


SCRIPT = Path(__file__).resolve().parents[1] / "create-release.py"
DIRECTORIES = ("assets", "css", "lang", "lib", "module", "packs", "templates")
DOCUMENTS = (
    "ACTIVE_EFFECTS.md", "CHANGELOG.md", "CONTRIBUTING.md", "LICENSE.OGL",
    "LICENSE_boilerplate.txt", "README.md", "VARIABLES.md",
    "hyperborea_combat_architecture.md",
)


class ReleasePackagingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location("hyp3e_release", SCRIPT)
        cls.release = importlib.util.module_from_spec(spec)
        # Importing packaging must not execute publication commands.
        with patch("subprocess.run", side_effect=AssertionError("Unexpected command")), \
             patch("subprocess.check_output", side_effect=AssertionError("Unexpected command")):
            spec.loader.exec_module(cls.release)

    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.source = self.root / "hyp3e"
        self.output = self.root / "hyp3e_release"
        self.source.mkdir()
        self.expected = {"system.json": json.dumps({"id": "hyp3e", "version": "4.5.0"}).encode()}
        for name in DIRECTORIES:
            self.expected[f"{name}/example.dat"] = b"\x00\xffBinary content\r\n"
        for name in DOCUMENTS:
            self.expected[name] = "Hyperborea — release fixture\n".encode("utf-8")
        for name, content in self.expected.items():
            target = self.source / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(content)

    def read_archive(self):
        archive_path = self.release.build_release(self.source, self.output)
        self.assertEqual(archive_path, self.output / "hyp3e.zip")
        with zipfile.ZipFile(archive_path) as archive:
            self.assertEqual(len(archive.namelist()), len(set(archive.namelist())))
            return {name: archive.read(name) for name in archive.namelist() if not name.endswith("/")}

    def test_stale_staging_and_unlisted_source_files_never_enter_archive(self):
        stale = self.output / "hyp3e"
        stale.mkdir(parents=True)
        for root in (stale, self.source):
            for name in ("template.json", "obsolete.txt", ".env", "template.json.backup"):
                (root / name).write_text("must not be packaged", encoding="utf-8")
        self.assertEqual(self.read_archive(), self.expected)
        # Building does not delete the maintainer's previous staging folder.
        self.assertTrue((stale / "obsolete.txt").is_file())

    def test_rebuild_drops_deleted_and_renamed_files(self):
        self.read_archive()
        (self.source / "module/example.dat").rename(self.source / "module/renamed.dat")
        self.expected["module/renamed.dat"] = self.expected.pop("module/example.dat")
        (self.source / "assets/example.dat").unlink()
        del self.expected["assets/example.dat"]
        self.assertEqual(self.read_archive(), self.expected)

    def test_missing_required_input_preserves_previous_archive(self):
        self.read_archive()
        archive = self.output / "hyp3e.zip"
        previous = archive.read_bytes()
        (self.source / "system.json").unlink()
        with self.assertRaises(FileNotFoundError):
            self.release.build_release(self.source, self.output)
        self.assertEqual(archive.read_bytes(), previous)

    def test_wrong_package_id_is_rejected(self):
        (self.source / "system.json").write_text('{"id":"other","version":"4.5.0"}', encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "hyp3e"):
            self.release.build_release(self.source, self.output)

    def test_output_inside_source_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "outside"):
            self.release.build_release(self.source, self.source / "assets/output")

    def test_linked_input_is_rejected_before_reading_its_target(self):
        external = self.root / "private"
        external.mkdir()
        (external / "private.txt").write_text("not package content", encoding="utf-8")
        link = self.source / "assets/linked"
        try:
            link.symlink_to(external, target_is_directory=True)
        except OSError as error:
            if os.name != "nt":
                self.skipTest(f"Symlink creation is unavailable: {error}")
            # Windows junctions need no symlink privilege and must also be refused.
            subprocess.run(["cmd", "/c", "mklink", "/J", str(link), str(external)],
                           check=True, capture_output=True)
        with self.assertRaisesRegex(ValueError, "Linked"):
            self.release.build_release(self.source, self.output)

    def test_modified_staged_bytes_do_not_replace_previous_archive(self):
        self.read_archive()
        archive = self.output / "hyp3e.zip"
        previous = archive.read_bytes()
        original_copy = self.release.shutil.copy2

        def corrupt_copy(source, destination, **kwargs):
            copied = original_copy(source, destination, **kwargs)
            if Path(source).name == "README.md":
                Path(destination).write_bytes(b"corrupt")
            return copied

        with patch.object(self.release.shutil, "copy2", side_effect=corrupt_copy):
            with self.assertRaisesRegex(ValueError, "content"):
                self.release.build_release(self.source, self.output)
        self.assertEqual(archive.read_bytes(), previous)

    def test_build_only_cli_works_without_publishing_dependencies_or_repository(self):
        # -I -S excludes third-party packages and Python environment customizations.
        completed = subprocess.run(
            [sys.executable, "-I", "-S", str(SCRIPT), "--build-only",
             "--source", str(self.source), "--output", str(self.output)],
            cwd=self.root, capture_output=True, text=True, check=False,
        )
        self.assertEqual(completed.returncode, 0, completed.stdout + completed.stderr)
        with zipfile.ZipFile(self.output / "hyp3e.zip") as archive:
            self.assertEqual({name: archive.read(name) for name in archive.namelist()}, self.expected)


if __name__ == "__main__":
    unittest.main()
