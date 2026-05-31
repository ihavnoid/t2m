/**
 * Utility for heuristic-based text reorganization.
 * Processes raw text into a hierarchical mindmap structure.
 */

/**
 * Pre-processes the input text to remove meaningless lines.
 * @param {string} text
 * @returns {string[]}
 */
export function cleanLines(text) {
    if (!text) return [];

    return text
        .split("\n")
        // Filter out empty lines or lines with only symbols/bullets
        .filter((line) => {
            const trimmed = line.trim();
            if (trimmed.length === 0) return false;
            // Drop lines that are just separators (---, ===, ***)
            if (/^[ \-\*\=_]+$/.test(trimmed)) return false;
            return true;
        });
}

/**
 * HEURISTIC FUNCTION: Detects the indentation level of a line.
 *
 * This function implements the core logic for inferring hierarchy from raw text.
 * Priority:
 * 1. Explicit Indentation (Spaces/Tabs)
 * 2. Semantic Cues (Colons, Bullets)
 * 3. Fallback (Reset to Level 0)
 *
 * @param {string} line - The current line being processed.
 * @param {string|null} prevLine - The previous meaningful line.
 * @param {number} prevDepth - The depth of the previous meaningful line.
 * @param {object} context - Shared state across lines (e.g., indentStack).
 * @returns {number} depth (0, 1, 2...) or -1 for comments.
 */
export function detectDepth(line, prevLine, prevDepth, context = {}) {
    const trimmed = line.trim();
    const prevTrimmed = prevLine ? prevLine.trim() : "";

    // 1. COMMENT DETECTION
    if (
        trimmed.startsWith("//") ||
        trimmed.startsWith("#") ||
        (trimmed.startsWith("(") && trimmed.endsWith(")")) ||
        trimmed.toLowerCase().startsWith("note:") ||
        trimmed.toLowerCase().startsWith("remark:")
    ) {
        return -1;
    }

    // 2. INDENTATION CALCULATION
    if (!context.indentStack) {
        context.indentStack = [0]; // Index 0 is always 0 spaces
    }

    const leadingMatch = line.match(/^[\s\t]*/);
    const leadingText = leadingMatch ? leadingMatch[0] : "";

    // Tab = 4 space equivalent for stack calculation
    const tabEquivalent = 4;
    const currentIndent =
        (leadingText.match(/ /g) || []).length +
        (leadingText.match(/\t/g) || []).length * tabEquivalent;

    // Determine raw indentation level based on stack
    const lastIndent = context.indentStack[context.indentStack.length - 1];

    if (currentIndent > lastIndent) {
        // Indent: New level
        context.indentStack.push(currentIndent);
    } else if (currentIndent < lastIndent) {
        // Dedent: Pop levels until we find a match or smaller
        while (
            context.indentStack.length > 1 &&
            context.indentStack[context.indentStack.length - 1] > currentIndent
        ) {
            context.indentStack.pop();
        }
        // "Forgiving Snap": If it doesn't match a previous level exactly,
        // treat it as a new level relative to where we landed.
        if (context.indentStack[context.indentStack.length - 1] < currentIndent) {
            context.indentStack.push(currentIndent);
        }
    }
    const indentLevel = context.indentStack.length - 1;

    // 3. SEMANTIC CUES
    const parentRequested = prevTrimmed.endsWith(":");

    // 4. DEPTH RESOLUTION
    let depth = indentLevel;

    // Special case: "Virtual" indentation via colons (for scribbles without indentation)
    if (currentIndent === 0) {
        if (parentRequested) {
            depth = prevDepth + 1;
        } else {
            depth = 0;
            context.indentStack = [0]; // Reset stack if we explicitly return to root column
        }
    } else if (parentRequested && depth <= prevDepth) {
        // If previous line asked for a child and we indented but not enough, force +1
        depth = prevDepth + 1;
    }

    // Sanity guard: prevent massive jumps without physical indentation
    if (currentIndent === 0 && depth > prevDepth + 1) {
        depth = prevDepth + 1;
    }

    return depth;
}

/**
 * Converts a flat array of lines and their corresponding depths into <ul><li> HTML.
 * @param {string[]} lines
 * @param {number[]} depths
 * @returns {string}
 */
export function buildHierarchyHTML(lines, depths) {
    if (lines.length === 0) return "";

    let html = "<ul>";
    const stack = [0]; // Tracks open ULs

    for (let i = 0; i < lines.length; i++) {
        let lineText = lines[i].trim();

        // 1. Strip mindmap control tokens
        lineText = lineText.replace(/\0[\-\+\nr]/g, "");

        // 2. Remove leading bullet/numbering for the mindmap node text
        // We carefully avoid matching \0i tokens here.
        if (!lineText.startsWith("\0i")) {
            lineText = lineText
                .replace(/^[\s\-\*\+\•\>]+\s?/, "")
                .replace(/^\d+[\.\)\s]+\s?/, "");
        }

        // 3. Heuristic: Remove trailing punctuations (Periods, commas, semicolons).
        if (!lineText.endsWith("...")) {
            lineText = lineText.replace(/[\.\,\;]$/, "");
        }

        const depth = depths[i];

        if (depth === -1) {
            // Comment: Append to the previous node
            const comment = lines[i]
                .trim()
                .replace(/^\/\/\s?|^note:\s?|^remark:\s?/i, "");
            const commentToken = ` <span class="comment">${escapeHTML(comment)}</span>`;

            const lastLiIdx = html.lastIndexOf("</li>");
            if (lastLiIdx !== -1) {
                html =
                    html.substring(0, lastLiIdx) +
                    commentToken +
                    html.substring(lastLiIdx);
            }
            continue;
        }

        const targetDepth = depth;
        let currentDepth = stack.length - 1;

        if (targetDepth > currentDepth) {
            for (let d = currentDepth; d < targetDepth; d++) {
                html += "<ul>";
                stack.push(0);
            }
        } else if (targetDepth < currentDepth) {
            for (let d = currentDepth; d > targetDepth; d--) {
                html += "</li></ul>";
                stack.pop();
            }
            html += "</li>";
        } else if (i > 0) {
            html += "</li>";
        }

        html += `<li>${escapeHTML(lineText)}`;
    }

    // Close remaining
    while (stack.length > 0) {
        html += "</li></ul>";
        stack.pop();
    }

    return html;
}

function escapeHTML(str) {
    return str.replace(/[&<>"']/g, (m) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }[m]));
}

/**
 * Main entry point for reformatting a block of text.
 * @param {string} text 
 * @returns {string} HTML
 */
export function reformatText(text) {
    const lines = cleanLines(text);
    if (lines.length === 0) return "";

    const depths = [];
    const context = { indentStack: [0] };
    for (let i = 0; i < lines.length; i++) {
        const d = detectDepth(
            lines[i],
            i > 0 ? lines[i - 1] : null,
            i > 0 ? depths[i - 1] : 0,
            context
        );
        depths.push(d);
    }

    return buildHierarchyHTML(lines, depths);
}
