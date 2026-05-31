/**
 * Logic for the visit history modal.
 */
class History {
    constructor() {
        this.prefix = "text2mindmap";
        this.container = null;
    }

    init() {
        this.container = document.getElementById("history-table-container");
        if (!this.container) return;

        document
            .getElementById("history-clear")
            .addEventListener("click", () => this.clearHistory());
        document
            .getElementById("history-refresh")
            .addEventListener("click", () => this.buildTable());
    }

    open() {
        this.buildTable();
        document.getElementById("history-modal").classList.add("active");
    }

    buildTable() {
        try {
            const history =
                JSON.parse(
                    localStorage.getItem(this.prefix + "visitedPages"),
                ) || {};
            const keys = Object.keys(history);

            if (keys.length === 0) {
                this.container.innerHTML =
                    '<p class="empty-history">(Visit history is empty)</p>';
                return;
            }

            let html = '<table class="history-table">';
            html +=
                "<thead><tr><th>Title</th><th>Last Visited</th><th>Links</th><th>Action</th></tr></thead><tbody>";

            // Sort by lastVisited descending
            const sortedKeys = keys.sort((a, b) => {
                const timeA = history[a].lastVisited || 0;
                const timeB = history[b].lastVisited || 0;
                return timeB - timeA;
            });

            for (const key of sortedKeys) {
                const entry = history[key];
                let title = entry.title || "(Untitled)";
                const lastVisitedStr = entry.lastVisited
                    ? new Date(entry.lastVisited).toLocaleString()
                    : "(Unknown)";

                // Parse image tokens
                title = title.replace(/\0i\[([^\]]*)\]/g, (match, src) => {
                    return `<img src="${src}" class="history-thumbnail">`;
                });

                const baseUrl = window.__serverBase__ || "";
                const roLink = `${baseUrl}?k=${entry.rokey}`;
                const rwLink = entry.rwkey
                    ? `${baseUrl}?k=${entry.rwkey}`
                    : null;

                html += "<tr>";
                html += `<td class="history-title-cell">${title}</td>`;
                html += `<td class="history-time-cell">${lastVisitedStr}</td>`;
                html += '<td class="history-links-cell">';
                html += `<a href="${roLink}" class="history-link" target="_blank">Read-only</a>`;
                if (rwLink) {
                    html += ` | <a href="${rwLink}" class="history-link" target="_blank">Read-write</a>`;
                }
                html += "</td>";
                html += `<td><button class="button danger small" onclick="window.historyModule.deleteEntry('${entry.rokey}')">Delete</button></td>`;
                html += "</tr>";
            }

            html += "</tbody></table>";
            this.container.innerHTML = html;
        } catch (e) {
            console.error("Failed to build history table:", e);
            this.container.innerHTML =
                '<p class="error-text">Error reading history.</p>';
        }
    }

    deleteEntry(rokey) {
        try {
            const history =
                JSON.parse(
                    localStorage.getItem(this.prefix + "visitedPages"),
                ) || {};
            delete history[rokey];
            localStorage.setItem(
                this.prefix + "visitedPages",
                JSON.stringify(history),
            );
            this.buildTable();
        } catch (e) {
            console.error("Failed to delete history entry:", e);
        }
    }

    clearHistory() {
        if (
            confirm(
                "Are you sure? You won't be able to access the pages if you don't have the links.",
            )
        ) {
            localStorage.setItem(this.prefix + "visitedPages", "{}");
            this.buildTable();
        }
    }
}

export const historyModule = new History();
window.historyModule = historyModule; // Export to window for inline onclick handlers
