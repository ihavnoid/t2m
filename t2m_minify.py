import sys
import subprocess
import re

all_files = [
    "scripts/old/d3-dispatch.js",
    "scripts/old/d3-quadtree.js",
    "scripts/old/d3-timer.js",
    "scripts/old/d3-force.js",
    "scripts/modules/kineticjs.js",
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
    content = re.sub(r'^export\s+default\s+.*?;$', '', content, flags=re.MULTILINE)
    content = re.sub(r'^export\s+\{.*?\};$', '', content, flags=re.MULTILINE)
    content = re.sub(r'^export\s+', '', content, flags=re.MULTILINE)
    f += content + "\n"

# Minify the code locally using terser
process = subprocess.Popen(
    ["npx", "terser", "--compress", "--mangle"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    encoding="utf-8"
)
stdout, stderr = process.communicate(input=f)

if process.returncode != 0:
    print("Minification failed:", stderr, file=sys.stderr)
    sys.exit(process.returncode)

fout = open("t2m.min.js", "w", encoding="utf-8")
fout.write(stdout)
fout.close()

