import re

with open('scripts/modules/mindmap.js', 'r') as f:
    text = f.read()

start_idx = text.find('    createEngine(containerId, initialSettings) {')
end_idx = text.find('export const mindmap = new Mindmap();')

prefix = text[:start_idx]

new_create_engine = """    createEngine(containerId, initialSettings) {
        return new MindmapEngine(this, containerId, initialSettings);
    }
}
"""

create_engine_code = text[start_idx:text.rfind('}\n\nexport const mindmap = new Mindmap();')]

engine_start = create_engine_code.find('        const engine = {\n')
engine_end = create_engine_code.find('\n        };\n\n        // Engine State Initialization')

engine_obj_code = create_engine_code[engine_start + len('        const engine = {\n'):engine_end]

first_func_idx = engine_obj_code.find('            settings: function')
methods_str = engine_obj_code[first_func_idx:]

# Replace "            name: function(" with "    name("
methods_str = re.sub(r'^            ([a-zA-Z0-9_]+):\s*function\s*\(', r'    \1(', methods_str, flags=re.MULTILINE)

# Remove trailing commas at the end of functions
methods_str = re.sub(r'\},(\s*)$', r'}\1', methods_str)
methods_str = re.sub(r'\},(\s*\n\s*[a-zA-Z0-9_]+\()', r'}\1', methods_str)
# Handle any remaining commas between functions by finding `},` that precedes `    method(`
methods_str = re.sub(r'\},(\s*[a-zA-Z0-9_]+\()', r'}\1', methods_str)

# Replace self. with this.mindmap.
methods_str = methods_str.replace('self.', 'this.mindmap.')

init_start = create_engine_code.find('// Engine State Initialization')
init_code = create_engine_code[init_start:create_engine_code.rfind('return engine;')]

init_code = init_code.replace('engine.', 'this.')

event_listeners_start = init_code.find('const $stage = $("#" + containerId);')

# Fix indentation for init codes
constructor_init_lines = init_code[:event_listeners_start].strip().split('\n')
constructor_init = "\n        ".join(line.lstrip() for line in constructor_init_lines)

event_listeners_lines = init_code[event_listeners_start:].strip().split('\n')
event_listeners_code = "\n        ".join(line.lstrip() for line in event_listeners_lines)

class_definition = f"""
class MindmapEngine {{
    constructor(mindmap, containerId, initialSettings) {{
        this.mindmap = mindmap;
        this.maxTextWidthCache = {{}};
        this.prevNb = -1;
        this.prevNe = -1;
        this.nodes = [];
        this.links = [];
        this.config = {{}};
        
        {constructor_init}
        
        this._initDragAndDropEvents(containerId);
    }}

    _initDragAndDropEvents(containerId) {{
        {event_listeners_code}
    }}

{methods_str}
}}
"""

new_text = prefix + new_create_engine + class_definition + "\nexport const mindmap = new Mindmap();\n"

with open('scripts/modules/mindmap.js', 'w') as f:
    f.write(new_text)
