/**
 * Helper functions for saving and loading user settings with localstorage.
 */
class Settings {
    constructor() {
        this.prefix = "text2mindmap";
        this.defaultContent = "<ul>"
            + "<li>t2m</li>"
            + "<ul><li>Author</li>"
            + "<ul>  <li>This is a modified version of text2mindmap<br>"
            + "          https://github.com/tobloef/text2mindmap</li>"
            + "      <li>http://github.com/ihavnoid/t2m/</li></ul>"
            + "    <li><i>[100 -300]</i> Notes</li>"
            + "<ul>  <li>Start creating your own mindmap by editing this text!</li>"
            + "      <li>Nodes' indentation level used as hierarchy levels</li>"
            + "      <li>Plaintext will be added on the node as comments</li>"
            + "      <li>Nodes with fixed locations will have its [x y] coordinates right after the dash</li>"
            + "      <li>To share the mindmap with other people, please share the links (read-only and read-write) with other people.</li>"
            + "      <ul><li>Read-only pages have an autoupdate option which reloads the contents as it gets edited (with some delay)</li></ul>"
            + "      <li>Careful - there is no locking mechanism permitting multiple people editing the same page!</li></ul>"
            + "  <li><i>[100 0]</i> Shortcuts:</li>"
            + "<ul>  <li>ctrl-enter<br>"
            + "          redraw</li>"
            + "      <li>ctrl-]<br>"
            + "          freeze selected nodes in text region</li>"
            + "      <li>ctrl-[<br>"
            + "          unfreeze selected nodes in text region</li>"
            + "      <li>tab / shift-tab<br>"
            + "          indent/de-indent selected region</li>"
            + "      <li>ctrl-z<br>"
            + "          undo</li>"
            + "      <li>ctrl-y<br>"
            + "          redo</li></ul>"
            + "  <li>[-150 0] mouse:</li>"
            + "<ul>  <li>Dragging node<br>"
            + "          moves node location and locks the node position</li>"
            + "      <li>Shift-dragging node<br>"
            + "          moves node and all children's location, and locks only the clicked node</li></ul>"
            + "  <li>Installing</li>"
            + "<ul>  <li>prerequisites<br>"
            + "          Server with php7 or later<br>"
            + "          sqlite3 (and php-sqlite) for storing mindmaps</li>"
            + "      <li>clone http://github.com/ihavnoid/t2m/ and then create config.json<br>"
            + "          Please refer to config.json.example for your own config settings.</li></ul>"
            + "  <li><i>[150 150]</i> Features:</li>"
            + "<ul>  <li>Image Support<br>"
            + "          Paste images from clipboard!</li>"
            + "      <li><img src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==\"></li></ul>"
            + "  <li>TODO</li>"
            + "<ul>  <li>Performance optimization<br>"
            + "          Test some ultra-heavy large mindmaps and make sure performance is okay.<br>"
            + "          There are some not-so-scalable code which may cause headaches in the future.</li></ul>"
            + "</ul></ul>";

        this.fontFamilyMap = {
            "monospace": "monospace",
            "sans-serif": "sans-serif",
            "serif": "serif",
        };

        this.rwkey = null;
        this.rokey = null;
        this.seq = 0;
        this.callstack = 0;
        this.last_timestamp = 0;
        this.last_push_time = 0;
        this.history = [];
        this.redo_history = [];
        this.evtSource = null;
        this.xhr = new XMLHttpRequest();
    }

    init() {
        document.getElementById("autoupdate").addEventListener("change", () => this.enableAutoUpdate());
        
        let setting;
        try {
            setting = JSON.parse(sessionStorage.getItem(this.prefix + "documentTitle"));
        } catch (exception) {
            // Ignored
        }

        if (!setting || setting === "") {
            setTimeout(() => this.createNew(), 1);
        } else {
            this.updateFromServer(setting);
        }

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'hidden') {
                const url = window.__serverBase__ + "/p/w.php";
                const data = new FormData();
                data.append('k', this.rwkey);
                const t = window.editorPane.get();
                data.append('contents', t);
                data.append('sync', 1);
                data.append('title', this.findTitle());
                data.append('seq', this.seq);

                console.log("sendBeacon", data);
                navigator.sendBeacon(url, data);

                this.seq = this.seq + 1;
                this.last_push_time = 0;
            }
        });
    }

    updateKeys(rwkey, rokey) {
        const el1 = document.getElementById("keypane1");
        const el2 = document.getElementById("keypane2");
        const autoupdateEl = document.getElementById("autoupdate");

        if (rwkey) {
            el1.innerHTML = `<a target="_blank" href="${window.__serverBase__}/?k=${rwkey}">Read-Write link</a> &nbsp; `;
            autoupdateEl.checked = false;
            autoupdateEl.disabled = true;
        } else {
            if (autoupdateEl.disabled) {
                el1.innerHTML = "<a>(read-only)</a>";
                autoupdateEl.checked = true;
                autoupdateEl.disabled = false;
                this.enableAutoUpdate();
            }
        }

        if (rokey) {
            el2.innerHTML = `<a target="_blank" href="${window.__serverBase__}/?k=${rokey}">Read-Only link</a> &nbsp; `;
        } else {
            el2.innerHTML = "&nbsp;";
        }
        this.addVisitedPages();
    }

    findTitle() {
        const t2 = window.editorPane.getProcessed();
        const begin = t2.indexOf('\0-');
        const end = t2.indexOf('\n', begin);
        let title = t2.substring(begin + 2, end).trim();
        title = title.replace(/^\[[0-9\- ]*\] */g, "");
        return title;
    }

    createRwKey() {
        console.assert(this.xhr.readyState === 0 || this.xhr.readyState === 4, "Illegal XHR state");
        this.xhr.open('GET', window.__serverBase__ + "/p/n.php");
        this.xhr.onload = () => {
            if (this.xhr.status === 200) {
                const t = JSON.parse(this.xhr.response);
                console.log("createRwKey", "resp", t);
                if (this.rokey) {
                    return;
                }
                this.rwkey = t["rwkey"];
                this.rokey = t["rokey"];
                this.seq = t["seq"];
                if (this.rwkey) {
                    window.editorPane.setEditable(true);
                    sessionStorage.setItem(this.prefix + "documentTitle", JSON.stringify(this.rwkey));
                } else {
                    window.editorPane.setEditable(false);
                    sessionStorage.setItem(this.prefix + "documentTitle", JSON.stringify(this.rokey));
                }
                this.updateKeys(this.rwkey, this.rokey);
                this.last_timestamp = 0;
                if (this.rwkey) {
                    this.syncToServer();
                }
            } else {
                setTimeout(() => this.createRwKey(), window.globals.query_retry_period);
            }
        };
        this.xhr.onerror = () => {
            setTimeout(() => this.createRwKey(), window.globals.query_retry_period);
        };
        this.xhr.send();
    }

    updateFromServer(key) {
        console.log("updateFromServer", key);
        console.assert(this.xhr.readyState === 0 || this.xhr.readyState === 4, "Illegal XHR state");

        this.xhr.open('POST', window.__serverBase__ + "/p/r.php");
        const data = new FormData();
        data.append('k', key);
        const ts = this.last_timestamp;
        data.append('ts', ts);
        this.xhr.onload = () => {
            if (this.xhr.status === 200) {
                const t = JSON.parse(this.xhr.response);
                console.log("updateFromServer", "resp", t);
                if (t["contents"]) {
                    this.rokey = t["rokey"];
                    this.rwkey = t["rwkey"];
                    this.seq = t["seq"];

                    const contents = t["contents"].replaceAll("\r\n", "\n");
                    if (window.editorPane.get() !== contents) {
                        window.editorPane.set(contents);
                        window.editorPane.refresh();
                        if (window.mindmap && window.mindmap.render) {
                            window.mindmap.render();
                        }
                    }
                    this.updateKeys(this.rwkey, this.rokey);

                    if (this.rwkey) {
                        if (t["lockdelay"] > 0) {
                            window.editorPane.setEditable(false, "Somebody else is editing... please wait");
                            setTimeout(() => this.updateFromServer(key), Math.min(window.globals.lock_poll_period, t["lockdelay"]));
                        } else {
                            this.last_timestamp = t["timestamp"];
                            sessionStorage.setItem(this.prefix + "documentTitle", JSON.stringify(this.rwkey));
                            this.callstack++;
                            this.syncToServerImmediately();
                        }
                    } else {
                        this.last_timestamp = t["timestamp"];
                        window.editorPane.setEditable(false);
                        sessionStorage.setItem(this.prefix + "documentTitle", JSON.stringify(this.rokey));
                    }
                } else if (ts === 0) {
                    console.log(t);
                    alert("Cannot find data with matching key " + key);
                }
            } else {
                setTimeout(() => this.updateFromServer(key), window.globals.query_retry_period);
            }
        };
        this.xhr.onerror = () => {
            setTimeout(() => this.updateFromServer(key), window.globals.query_retry_period);
        };
        this.xhr.send(data);
    }

    syncToServerImmediately() {
        console.log("synctoServer", "push", this.rwkey);
        console.assert(this.xhr.readyState === 0 || this.xhr.readyState === 4, "Illegal XHR state");
        this.xhr.open('POST', window.__serverBase__ + "/p/w.php");
        const data = new FormData();
        data.append('k', this.rwkey);

        const t = window.editorPane.get();
        data.append('contents', t);
        data.append('sync', 0);
        data.append('title', this.findTitle());
        data.append('seq', this.seq);
        this.xhr.onload = () => {
            const t = this.xhr.response;
            if (t !== "1") {
                console.log("Failed syncing");
                window.editorPane.setEditable(false);
                this.updateFromServer(this.rwkey);
            } else {
                window.editorPane.setEditable(true);
                this.seq += 1;
                this.last_push_time = Date.now();
            }
            if (this.callstack > 0) {
                this.callstack--;
            }
        };
        this.xhr.onerror = () => {
            console.log("Failed syncing - socket error");
            window.editorPane.setEditable(false);
            this.updateFromServer(this.rwkey);
            if (this.callstack > 0) {
                this.callstack--;
            }
        };
        this.xhr.send(data);
    }

    syncToServer(delay) {
        if (!delay) {
            delay = window.globals.write_poll_period;
        }
        if (Date.now() - this.last_push_time > 10000) {
            delay = 1;
        }
        if (!this.rokey) {
            this.createRwKey();
            return;
        }

        this.addVisitedPages();
        this.callstack++;
        setTimeout(() => {
            if (this.callstack === 1 && this.rwkey && window.editorPane.isEditable()) {
                this.syncToServerImmediately();
            } else {
                this.callstack--;
            }
        }, delay);
    }

    addVisitedPages() {
        let setting;
        try {
            setting = JSON.parse(localStorage.getItem(this.prefix + "visitedPages"));
        } catch (exception) {
            console.log("localStorage parsing failed : ", exception);
        }
        if (!setting || setting === "" || Array.isArray(setting)) {
            setting = {};
        }
        if (this.rokey) {
            let d = { "rokey": this.rokey };
            if (Object.prototype.hasOwnProperty.call(setting, this.rokey)) {
                d = setting[this.rokey];
            }
            if (this.rwkey) {
                d["rwkey"] = this.rwkey;
            }
            d["title"] = this.findTitle();
            setting[this.rokey] = d;
        }
        localStorage.setItem(this.prefix + "visitedPages", JSON.stringify(setting));
    }

    createNew() {
        window.editorPane.setEditable(false);
        this.clearUndoHistory();
        this.rwkey = null;
        this.rokey = null;

        window.editorPane.set(this.defaultContent);
        window.editorPane.refresh();

        this.syncToServer();
        if (window.mindmap && window.mindmap.render) {
            window.mindmap.render();
        }
    }

    enableAutoUpdate() {
        const autoupdateEl = document.getElementById("autoupdate");
        if (autoupdateEl.checked) {
            if (this.rwkey || this.evtSource !== null) {
                return;
            }
            this.evtSource = new EventSource(window.__serverBase__ + "/p/pollpage.php?k=" + this.rokey);
            this.evtSource.onmessage = (x) => {
                console.log("auto-update");
                this.updateFromServer(this.rokey);
            };
            this.evtSource.onerror = (x) => {
                this.evtSource.close();
                this.evtSource = null;
                setTimeout(() => this.enableAutoUpdate(), window.globals.query_retry_period);
            };
        } else {
            if (this.evtSource) {
                this.evtSource.close();
                this.evtSource = null;
            }
        }
    }

    setText() {
        if (!window.editorPane.isEditable()) {
            return;
        }
        const value = window.editorPane.get();
        const [p1, p2] = window.editorPane.getPos();
        if (this.history.length > 0 && window.editorPane.getProcessed() === this.history[this.history.length - 1][3]) {
            this.history[this.history.length - 1][0] = value;
            this.history[this.history.length - 1][1] = p1;
            this.history[this.history.length - 1][2] = p2;
            return;
        }
        this.history.push([value, p1, p2, window.editorPane.getProcessed()]);
        if (this.history.length > 100) {
            this.history.shift();
        }
        this.redo_history = [];
        this.syncToServer();
    }

    undoText() {
        if (!window.editorPane.isEditable()) {
            return null;
        }
        if (this.history.length <= 1) {
            return null;
        }
        const t = this.history.pop();
        this.redo_history.push(t);
        const result = this.history[this.history.length - 1];
        this.syncToServer();
        return result;
    }

    redoText() {
        if (!window.editorPane.isEditable()) {
            return null;
        }
        if (this.redo_history.length === 0) {
            return null;
        }
        const t = this.redo_history.pop();
        this.history.push(t);
        this.syncToServer();
        return t;
    }

    clearUndoHistory() {
        this.redo_history = [];
        this.history = [];
    }

    reset() {
        sessionStorage.setItem(this.prefix + "documentTitle", JSON.stringify(""));
    }
}

export const settings = new Settings();
