# Command to run: 
#   source .venv/bin/activate
#   python3 ./unpack-data.py
# Description: Unpacks the hyp3e core data into the compendium-src folder. The world must not be 
#   open or logged into at the time of running this script.

import json
import subprocess

subprocess.run(["fvtt", "package", "workon", "hyp3e"])

compendia = json.load(open('system.json', 'r'))
for pack in compendia['packs']:
    print (f"Unpacking {pack['name']}...")
    cmd = ["fvtt", "package", "unpack", pack['name'], "--out", "./compendium-src/" + pack['name'], "--clean"]
    print(cmd)
    subprocess.run(cmd)
