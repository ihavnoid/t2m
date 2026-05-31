import { modal } from "./modal.js";
import { editorPane } from "./editor_pane.js";

/**
 * Module for AI-powered text reorganization.
 * Handles the UI for pasting raw text and coordinates with a Web Worker for AI processing.
 */
class AIReorganizer {
    constructor() {
        this.worker = null;
        this.isProcessing = false;
        this.isModelLoaded = false;
    }

    init() {
        const btn = document.getElementById("ai-process-btn");
        if (btn) {
            btn.addEventListener("click", () => this.process());
        }

        // Initialize worker lazily when modal is opened for the first time
    }

    open() {
        modal.show("ai-paste-modal");
        this._ensureWorker();
        document.getElementById("ai-paste-input").focus();
    }

    _ensureWorker() {
        if (!this.worker) {
            this._updateStatus("Loading AI model (this may take a moment)...");
            
            // Create a new worker
            // Note: In a production ESM environment, we'd use new Worker(new URL('./ai_worker.js', import.meta.url))
            this.worker = new Worker("scripts/modules/ai_worker.js", { type: "module" });

            this.worker.onmessage = (event) => {
                const { type, data, message } = event.data;
                if (type === "ready") {
                    this.isModelLoaded = true;
                    this._updateStatus("AI is ready.");
                } else if (type === "result") {
                    this._handleResult(data);
                } else if (type === "error") {
                    this._updateStatus("Error: " + message, true);
                    this.isProcessing = false;
                } else if (type === "status") {
                    this._updateStatus(message);
                }
            };
        }
    }

    _updateStatus(msg, isError = false) {
        const statusEl = document.getElementById("ai-status");
        if (statusEl) {
            statusEl.innerText = msg;
            statusEl.style.color = isError ? "#dc3545" : "#2365ba";
        }
    }

    /**
     * Pre-processes the input text according to the cleaning phase in AI_DESIGN.md.
     */
    _cleanText(text) {
        if (!text) return [];
        
        return text.split('\n')
            .map(line => line.trim())
            // 1. Empty Line Removal
            .filter(line => line.length > 0)
            // 2. Symbol-Only Line Removal (---, ===, ***, etc.)
            .filter(line => !/^[ \-\*\=_]+$/.test(line))
            // 3. Bullet Stripping and 4. Trim
            .map(line => {
                // Remove common bullet symbols at the start: -, *, +, •, >, and numbering like 1.
                return line.replace(/^[\s\-\*\+\•\>]+/, '')
                           .replace(/^\d+[\.\)\s]+/, '')
                           .trim();
            })
            .filter(line => line.length > 0);
    }

    async process() {
        if (this.isProcessing || !this.isModelLoaded) return;

        const input = document.getElementById("ai-paste-input").value;
        const cleanedLines = this._cleanText(input);

        if (cleanedLines.length === 0) {
            this._updateStatus("Please paste some text first.", true);
            return;
        }

        this.isProcessing = true;
        this._updateStatus("Processing hierarchy...");
        document.getElementById("ai-process-btn").disabled = true;

        this.worker.postMessage({
            type: "process",
            lines: cleanedLines
        });
    }

    _handleResult(depths) {
        const input = document.getElementById("ai-paste-input").value;
        const cleanedLines = this._cleanText(input);

        // Map cleaned lines and depths to HTML structure
        const html = this._buildHierarchyHTML(cleanedLines, depths);

        // Inject into editor
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        
        // We want to insert the child nodes of the tempDiv (the <ul>)
        const fragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }

        editorPane.insertAtCursor(fragment);
        editorPane.refresh();
        if (editorPane.observerFunc) editorPane.observerFunc();

        // Cleanup and Close
        this.isProcessing = false;
        document.getElementById("ai-process-btn").disabled = false;
        document.getElementById("ai-paste-input").value = "";
        this._updateStatus("Ready");
        modal.hide("ai-paste-modal");
    }

    /**
     * Converts a flat array of lines and their corresponding depths into <ul><li> HTML.
     */
    _buildHierarchyHTML(lines, depths) {
        if (lines.length === 0) return "";
        
        let html = "<ul>";
        let currentDepth = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const targetDepth = depths[i] || 0;

            if (targetDepth > currentDepth) {
                // Move deeper: Open ULs
                for (let d = currentDepth; d < targetDepth; d++) {
                    html += "<ul>";
                }
            } else if (targetDepth < currentDepth) {
                // Move shallower: Close LIs and ULs
                for (let d = currentDepth; d > targetDepth; d--) {
                    html += "</li></ul>";
                }
                html += "</li>";
            } else if (i > 0) {
                // Same level: Close previous LI
                html += "</li>";
            }

            html += `<li>${this._escapeHTML(line)}`;
            currentDepth = targetDepth;
        }

        // Close all remaining tags
        for (let d = currentDepth; d >= 0; d--) {
            html += "</li></ul>";
        }

        // Remove the outer-most extra </li> (since we start with <ul> and append </li> inside the loop)
        // Correct logic: our loop starts <ul>, then adds <li>...
        // For depth 0: <ul> <li>...
        // The final closure will be </li> </ul>
        // Wait, the logic above is a bit tricky. Let's simplify.
        
        return html;
    }

    _escapeHTML(str) {
        return str.replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m]));
    }
}

export const aiReorganizer = new AIReorganizer();
