# Command to run: 
#   source .venv/bin/activate
#   python3 ./create-release.py
# Description:
#   1. Copies the hyp3e folders and files from the root folder to the release folder.
#   2. Zips the hyp3e folder and copies it to the release folder.
#   3. Tags the git repo with the version from system.json and pushes the tag to origin.
#   4. Creates a new github release, uploading the zip and system.json.

import json
import subprocess

from pathlib import Path
import shutil

from github import Github, Auth
from dotenv import load_dotenv
import os, sys

def run(cmd, **kwargs):
    print("Running:", " ".join(cmd))
    try:
        subprocess.run(cmd, check=True, **kwargs)
    except subprocess.CalledProcessError as e:
        print(f"Command failed with exit code {e.returncode}", file=sys.stderr)
        print(e.stderr.decode() if e.stderr else "", file=sys.stderr)
        raise

# Load .env file
load_dotenv()

source_root = Path("../hyp3e")
dest = Path("../hyp3e_release/hyp3e")
# base_name = dest / "hyp3e"
hyp3e_system = json.load(open('system.json', 'r'))

# Make sure destination folder exists
dest.mkdir(parents=True, exist_ok=True)

# Items to copy (with complete replacement)
items = [
    ("assets", True),     # True == it's a directory
    ("css", True),
    ("lang", True),
    ("lib", True),
    ("module", True),
    ("templates", True),
    ("CHANGELOG.md", False),
    ("CONTRIBUTING.md", False),
    ("LICENSE.OGL", False),
    ("LICENSE_boilerplate.txt", False),
    ("README.md", False),
    ("VARIABLES.md", False),
    ("system.json", False),
    ("template.json", False),
]

for name, is_dir in items:
    src = source_root / name
    dst = dest / name
    
    if is_dir:
        # Remove old folder completely if it exists
        if dst.exists():
            shutil.rmtree(dst)
        # Copy fresh copy
        shutil.copytree(src, dst)
    else:
        # For files: overwrite directly
        shutil.copy2(src, dst)

print("Copy complete — folders and files have been copied to the release folder.")

# Finally, zip the whole release folder: zip -r ../hyp3e_release/hyp3e.zip ../hyp3e -x ".git/*" -x ".env" -x ".venv/*" -x ".vscode/*"
shutil.make_archive(
    base_name     = str(dest),
    format        = "zip",
    root_dir      = str(dest),
    # base_dir      = ".",
    dry_run       = False,
    logger        = None,
)
print("Zipping complete.")

# Tag the repo in git
version = hyp3e_system['version']
tag = f"v{version}"
# Only create tag if it doesn't exist
existing_tags = subprocess.check_output(["git", "tag", "--list", tag]).decode().strip()
if not existing_tags:
    run(["git", "tag", "-a", tag, "-m", f"Release {tag}"])
    run(["git", "push", "origin", tag])
    print(f"Created and pushed tag {tag}")
else:
    print(f"Tag {tag} already exists — skipping tag creation")

# Create a new github release and upload the zip and system.json
github_token = os.getenv("GITHUB_TOKEN")
if not github_token:
    raise Exception("GITHUB_TOKEN environment variable not set.")
auth = Auth.Token(github_token)
g = Github(auth=auth)

repo = g.get_repo("thurianknight/hyp3e")

release_name = f"Release {tag}"
release = repo.create_git_release(tag=tag, name=release_name, message=f"Release of hyp3e version {version}", draft=False, prerelease=False)

# Upload system.json
system_json_path = source_root / "system.json"
release.upload_asset(str(system_json_path), label="system.json", content_type="application/json")
print("Uploaded system.json to github release.")
# Upload hyp3e.zip
zip_path = dest.with_suffix('.zip')
release.upload_asset(str(zip_path), label="hyp3e.zip", content_type="application/zip")
print("Uploaded hyp3e.zip to github release.")

print("Release creation complete.")
