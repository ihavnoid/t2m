import { modal } from "./modal.js";
import { editorPane } from "./editor_pane.js";

/**
 * Module for heuristic-based text reorganization.
 * Processes raw text into a hierarchical mindmap structure.
 */
class TextReorganizer {
    constructor() {
        this.isProcessing = false;
    }

    init() {
        const btn = document.getElementById("text-process-btn");
        if (btn) {
            btn.addEventListener("click", () => this.process());
        }
    }

    open() {
        modal.show("text-paste-modal");
        document.getElementById("text-paste-input").focus();
    }

    /**
     * Pre-processes the input text to remove meaningless lines.
     */
    _cleanLines(text) {
        if (!text) return [];

        return (
            text
                .split("\n")
                // Filter out empty lines or lines with only symbols/bullets
                .filter((line) => {
                    const trimmed = line.trim();
                    if (trimmed.length === 0) return false;
                    // Drop lines that are just separators (---, ===, ***)
                    if (/^[ \-\*\=_]+$/.test(trimmed)) return false;
                    return true;
                })
        );
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
     * @param {object} context - Shared state across lines (e.g., detected indentSize).
     * @returns {number} depth (0, 1, 2...) or -1 for comments.
     */
    detectDepth(line, prevLine, prevDepth, context = {}) {
        const trimmed = line.trim();
        const prevTrimmed = prevLine ? prevLine.trim() : "";

        // 1. COMMENT DETECTION
        // We look for common comment markers like //, #, or parenthesized text.
        // Also 'note:' and 'remark:' prefixes are treated as metadata/comments.
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
        // First, we extract all leading whitespace (spaces and tabs).
        const leadingMatch = line.match(/^[\s\t]*/);
        const leadingText = leadingMatch ? leadingMatch[0] : "";

        // We count tabs as 1 full indent unit each.
        const tabCount = (leadingText.match(/\t/g) || []).length;
        // We count spaces separately.
        const spaceCount = (leadingText.match(/ /g) || []).length;

        // AUTO-DETECT INDENT SIZE:
        // If we haven't determined the space-per-level yet (e.g., 4),
        // we use the first indented line we find as the template.
        const defaultIndentSize = 4;
        const indentSize = context.indentSize || defaultIndentSize;
        if (!context.indentSize && spaceCount > 0) {
            context.indentSize = spaceCount;
        }

        // indentLevel is the sum of tabs and standardized space blocks.
        const indentLevel = tabCount + Math.floor(spaceCount / indentSize);

        // 3. SEMANTIC CUES
        // - Bullets: -, *, +, •, >
        // - Numbering: 1. , 1), (1)
        // - Suffix Colon: "Topic:" usually implies the next line is a child.
        const isBullet = /^[\-\*\+\•\>]\s/.test(trimmed);
        const isNumeric = /^\d+[\.\)\s]/.test(trimmed);
        const hasPrefix = isBullet || isNumeric;
        const parentRequested = prevTrimmed.endsWith(":");

        // 4. DEPTH RESOLUTION
        let depth = indentLevel;

        // CASE A: The line has NO physical indentation (starts at column 0).
        if (leadingText.length === 0) {
            if (parentRequested) {
                // Previous line ended with ':', so we force this line to be a child.
                depth = prevDepth + 1;
            } else {
                // No physical indent and no colon-request -> Reset to Root (0).
                depth = 0;
            }
        }
        // CASE B: Explicit indentation was used.
        else {
            // If the previous line had a colon (requesting a child), but the user
            // also indented manually, we ensure the depth is at least one level deeper
            // than the previous line.
            if (parentRequested && depth <= prevDepth) {
                depth = prevDepth + 1;
            }
        }

        // SANITY GUARD:
        // If the user didn't use any physical indentation, don't let the depth jump
        // forward by more than 1 level at a time (e.g. from 0 to 5) via colons.
        if (leadingText.length === 0 && depth > prevDepth + 1) {
            depth = prevDepth + 1;
        }

        return depth;
    }

    process() {
        if (this.isProcessing) return;

        const input = document.getElementById("text-paste-input").value;
        const lines = this._cleanLines(input);

        if (lines.length === 0) {
            this._updateStatus("Please paste some text first.", true);
            return;
        }

        this.isProcessing = true;
        this._updateStatus("Processing hierarchy...");

        // Run heuristic
        const depths = [];
        const context = { indentSize: 0 };
        for (let i = 0; i < lines.length; i++) {
            const d = this.detectDepth(
                lines[i],
                i > 0 ? lines[i - 1] : null,
                i > 0 ? depths[i - 1] : 0,
                context,
            );
            depths.push(d);
        }

        // Build HTML
        const html = this._buildHierarchyHTML(lines, depths);

        // Inject into editor
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        const fragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }

        editorPane.insertAtCursor(fragment);
        editorPane.refresh();
        if (editorPane.observerFunc) editorPane.observerFunc();

        // Cleanup
        this.isProcessing = false;
        document.getElementById("text-paste-input").value = "";
        this._updateStatus("Ready");
        modal.hide("text-paste-modal");
    }

    _buildHierarchyHTML(lines, depths) {
        if (lines.length === 0) return "";

        let html = "<ul>";
        const stack = [0]; // Tracks open ULs

        for (let i = 0; i < lines.length; i++) {
            let lineText = lines[i].trim();
            // Remove leading bullet/numbering for the mindmap node text
            lineText = lineText
                .replace(/^[\s\-\*\+\•\>]+\s?/, "")
                .replace(/^\d+[\.\)\s]+\s?/, "");

            const depth = depths[i];

            if (depth === -1) {
                // Comment: Append to the previous node if possible.
                // In our format, comments are <span class="comment"> inside the <li> or after it.
                // We'll use the ' [comment]' syntax or just append as text if it's simpler.
                // The most robust way for this editor is to use the double space or bracketed style.
                // Let's use " (comment)" at the end of the previous line's text.
                const comment = lines[i]
                    .trim()
                    .replace(/^\/\/\s?|^note:\s?|^remark:\s?/i, "");
                const commentToken = ` <span class="comment">${this._escapeHTML(comment)}</span>`;

                // This is tricky because we already closed or are about to close the LI.
                // We need to surgically insert into the last LI.
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

            html += `<li>${this._escapeHTML(lineText)}`;
        }

        // Close remaining
        while (stack.length > 0) {
            html += "</li></ul>";
            stack.pop();
        }

        return html;
    }

    _updateStatus(msg, isError = false) {
        const statusEl = document.getElementById("text-reorganizer-status");
        if (statusEl) {
            statusEl.innerText = msg;
            statusEl.style.color = isError ? "#dc3545" : "#2365ba";
        }
    }

    _escapeHTML(str) {
        return str.replace(
            /[&<>"']/g,
            (m) =>
                ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;",
                })[m],
        );
    }
}

export const textReorganizer = new TextReorganizer();
