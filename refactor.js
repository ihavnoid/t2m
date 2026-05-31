const fs = require("fs");

let text = fs.readFileSync("scripts/modules/mindmap.js", "utf8");

const startIdx = text.indexOf(
    "    createEngine(containerId, initialSettings) {",
);
const endIdx = text.indexOf("export const mindmap = new Mindmap();");

const prefix = text.substring(0, startIdx);
const suffix = text.substring(endIdx);

const createEngineCode = text.substring(startIdx, endIdx);

const engineStart = createEngineCode.indexOf("        const engine = {\n");
const engineEnd = createEngineCode.indexOf(
    "\n        };\n\n        // Engine State Initialization",
);

const engineObjCode = createEngineCode.substring(
    engineStart + "        const engine = {\n".length,
    engineEnd,
);

let firstFuncIdx = engineObjCode.indexOf("            settings: function");
let methodsStr = engineObjCode.substring(firstFuncIdx);

// Convert `methodName: function(...) {` to `methodName(...) {`
methodsStr = methodsStr.replace(
    /^            ([a-zA-Z0-9_]+):\s*function\s*\(/gm,
    "    $1(",
);

// Replace `},` on a line by itself at 12 spaces to `    }`
methodsStr = methodsStr.replace(/^            \},/gm, "    }");
// Replace `}` on a line by itself at 12 spaces to `    }` (for the last method)
methodsStr = methodsStr.replace(/^            \}/gm, "    }");

// For single line methods like `    getBranches() { return self.branchCount; },`
methodsStr = methodsStr.replace(
    /^    ([a-zA-Z0-9_]+)\((.*?)\)\s*\{\s*(.*?)\s*\},/gm,
    "    $1($2) { $3 }",
);

// Final replace for `self.` to `this.mindmap.`
methodsStr = methodsStr.replace(/self\./g, "this.mindmap.");
methodsStr = methodsStr.replace(/const self = this;\n/g, "");

const initStart = createEngineCode.indexOf("// Engine State Initialization");
const initEnd = createEngineCode.lastIndexOf("return engine;");
let initCode = createEngineCode.substring(initStart, initEnd);

initCode = initCode.replace(/engine\./g, "this.");

const eventListenersStart = initCode.indexOf(
    'const $stage = $("#" + containerId);',
);
const constructorInit = initCode
    .substring(0, eventListenersStart)
    .trim()
    .split("\n")
    .map((l) => (l.trimStart() ? "        " + l.trimStart() : ""))
    .join("\n");
const eventListenersCode = initCode
    .substring(eventListenersStart)
    .trim()
    .split("\n")
    .map((l) => (l.trimStart() ? "        " + l.trimStart() : ""))
    .join("\n");

const classDefinition = `class MindmapEngine {
    constructor(mindmap, containerId, initialSettings) {
        this.mindmap = mindmap;
        this.maxTextWidthCache = {};
        this.prevNb = -1;
        this.prevNe = -1;
        this.nodes = [];
        this.links = [];
        this.config = {};
        
${constructorInit}
        
        this._initDragAndDropEvents(containerId);
    }

    _initDragAndDropEvents(containerId) {
${eventListenersCode}
    }

${methodsStr}
}
`;

const newCreateEngine = `    createEngine(containerId, initialSettings) {
        return new MindmapEngine(this, containerId, initialSettings);
    }
}

`;

const newText = prefix + newCreateEngine + classDefinition + suffix;

fs.writeFileSync("scripts/modules/mindmap.js", newText);
