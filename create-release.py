"""Build a clean release archive; publish only when run without --build-only."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import tempfile
import zipfile


RELEASE_ITEMS = (
    ("assets", True),
    ("css", True),
    ("lang", True),
    ("lib", True),
    ("module", True),
    ("packs", True),
    ("templates", True),
    ("ACTIVE_EFFECTS.md", False),
    ("CHANGELOG.md", False),
    ("CONTRIBUTING.md", False),
    ("LICENSE.OGL", False),
    ("LICENSE_boilerplate.txt", False),
    ("README.md", False),
    ("VARIABLES.md", False),
    ("hyperborea_combat_architecture.md", False),
    ("system.json", False),
)


def release_files(source_root):
    """Expand the existing release allowlist, rejecting linked or special files."""
    files = []
    for name, is_directory in RELEASE_ITEMS:
        source = source_root / name
        if not source.exists():
            raise FileNotFoundError(source)
        if source.is_dir() != is_directory:
            raise ValueError(f"Unexpected release input type: {name}")
        entries = [source]
        while entries:
            entry = entries.pop()
            attributes = getattr(entry.lstat(), "st_file_attributes", 0)
            if entry.is_symlink() or attributes & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0):
                raise ValueError(f"Linked release input: {entry}")
            if entry.is_file():
                files.append(entry.relative_to(source_root))
            elif entry.is_dir():
                entries.extend(entry.iterdir())
            else:
                raise ValueError(f"Special release input: {entry}")
    return sorted(files)


def build_release(source_root, output_directory):
    """Build and verify hyp3e.zip without credentials, Git, or publication."""
    source_root = Path(source_root).resolve()
    output_directory = Path(output_directory).resolve()
    if output_directory == source_root or source_root in output_directory.parents:
        raise ValueError("Release output must be outside the source directory")
    manifest = json.loads((source_root / "system.json").read_text(encoding="utf-8"))
    if manifest.get("id") != "hyp3e" or not isinstance(manifest.get("version"), str) or not manifest["version"]:
        raise ValueError("Release manifest must identify hyp3e and a version")
    files = release_files(source_root)
    expected = {name.as_posix(): hashlib.sha256((source_root / name).read_bytes()).digest() for name in files}
    if "template.json" in expected:
        raise ValueError("Deprecated template.json must not be packaged")

    output_directory.mkdir(parents=True, exist_ok=True)
    archive_path = output_directory / "hyp3e.zip"
    # Never reuse the old hyp3e_release/hyp3e tree: unlisted files can survive there.
    with tempfile.TemporaryDirectory(prefix=".hyp3e-build-", dir=output_directory) as temporary:
        staging = Path(temporary) / "hyp3e"
        candidate = Path(temporary) / "hyp3e.zip"
        for name in files:
            destination = staging / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_root / name, destination)
        with zipfile.ZipFile(candidate, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name in files:
                archive.write(staging / name, name.as_posix())
        with zipfile.ZipFile(candidate) as archive:
            if sorted(archive.namelist()) != sorted(expected):
                raise ValueError("Release archive file set differs from the allowlist")
            for name, digest in expected.items():
                if hashlib.sha256(archive.read(name)).digest() != digest:
                    raise ValueError(f"Release archive content differs from source: {name}")
        # A failed build must leave the previous archive intact.
        os.replace(candidate, archive_path)
    return archive_path


def publish_release(source_root, archive_path):
    # Publishing dependencies and credentials are not needed to build or test.
    from dotenv import load_dotenv
    from github import Auth, Github

    load_dotenv(source_root / ".env")
    github_token = os.getenv("GITHUB_TOKEN")
    if not github_token:
        raise RuntimeError("GITHUB_TOKEN environment variable not set.")
    with zipfile.ZipFile(archive_path) as archive:
        manifest_bytes = archive.read("system.json")
    version = json.loads(manifest_bytes)["version"]
    tag = f"v{version}"
    existing_tags = subprocess.check_output(
        ["git", "tag", "--list", tag], cwd=source_root, text=True
    ).strip()
    if not existing_tags:
        subprocess.run(["git", "tag", "-a", tag, "-m", f"Release {tag}"], cwd=source_root, check=True)
        subprocess.run(["git", "push", "origin", tag], cwd=source_root, check=True)
        print(f"Created and pushed tag {tag}")
    else:
        print(f"Tag {tag} already exists — skipping tag creation")

    github = Github(auth=Auth.Token(github_token))
    repo = github.get_repo("thurianknight/hyp3e")
    release = repo.create_git_release(
        tag=tag, name=f"Release {tag}", message=f"Pre-release of hyp3e version {version}",
        draft=False, prerelease=True,
    )
    # Upload the exact manifest packaged in the verified archive.
    with tempfile.TemporaryDirectory(prefix=".hyp3e-manifest-", dir=archive_path.parent) as temporary:
        manifest_path = Path(temporary) / "system.json"
        manifest_path.write_bytes(manifest_bytes)
        release.upload_asset(str(manifest_path), label="system.json", content_type="application/json")
    release.upload_asset(str(archive_path), label="hyp3e.zip", content_type="application/zip")
    print("Release creation complete.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build-only", action="store_true", help="Build locally without tagging or publishing")
    parser.add_argument("--source", type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument("--output", type=Path, help="Output directory (default: ../hyp3e_release beside source)")
    args = parser.parse_args()
    source_root = args.source.resolve()
    output_directory = args.output or source_root.parent / "hyp3e_release"
    archive_path = build_release(source_root, output_directory)
    print(f"Verified archive: {archive_path}")
    if not args.build_only:
        publish_release(source_root, archive_path)


if __name__ == "__main__":
    main()
