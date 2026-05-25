import sys
import requests
import re

all_files = [
    "scripts/old/d3-dispatch.js",
    "scripts/old/d3-quadtree.js",
    "scripts/old/d3-timer.js",
    "scripts/old/d3-force.js",
    "scripts/old/kineticjs.js",
    "scripts/old/jquery.cookie.min.js",
    "scripts/old/difflib.js",
    "scripts/modules/unsaved_changes.js",
    "scripts/modules/navbar.js",
    "scripts/modules/shortcuts.js",
    "scripts/modules/modal.js",
    "scripts/modules/pane_resizer.js",
    "scripts/modules/editor_pane.js",
    "scripts/modules/settings.js",
    "scripts/modules/file_import.js",
    "scripts/modules/file_export.js",
    "scripts/modules/app_functions.js",
    "scripts/modules/image_drawer.js",
    "scripts/modules/mindmap.js",
    "scripts/app.js"
]
f = ""
for fn in all_files:
    content = open(fn).read()
    # Strip ES module imports and exports for simple concatenation
    content = re.sub(r'^import\s+.*?;$', '', content, flags=re.MULTILINE)
    content = re.sub(r'^export\s+', '', content, flags=re.MULTILINE)
    f += content + "\n"

response = requests.post('https://www.toptal.com/developers/javascript-minifier/api/raw', data=dict(input=f)).text

fout = open("t2m.min.js", "w")
fout.write("{}".format(response))

