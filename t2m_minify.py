import sys
import requests
all_files = [
    "scripts/old/d3-dispatch.js",
    "scripts/old/d3-quadtree.js",
    "scripts/old/d3-timer.js",
    "scripts/old/d3-force.js",
    "scripts/old/kineticjs.js",
    "scripts/old/jquery.cookie.min.js",
    "scripts/old/difflib.js",
    "scripts/old/mindmap.min.js",
    "scripts/unsaved_changes.js",
    "scripts/editor_pane.js",
    "scripts/settings.js",
    "scripts/file_import.js",
    "scripts/file_export.js",
    "scripts/app_functions.js",
    "scripts/navbar.js",
    "scripts/modal.js",
    "scripts/pane_resizer.js",
    "scripts/shortcuts.js",
    "scripts/main.js"
]
f = ""
for fn in all_files:
    f += open(fn).read() + "\n"

response = requests.post('https://www.toptal.com/developers/javascript-minifier/api/raw', data=dict(input=f)).text

fout = open("t2m.min.js", "w")
fout.write("{}".format(response))

