import { uploadImage } from "./file_upload.js";
import { imageDrawer } from "./image_drawer.js";
import { reformatText } from "./text_reorganizer.js";

/**
 * Editor pane encapsulation.
 * Manages rich text editing, HTML cleanup, caret tracking, and multi-window transitions.
 */
class EditorPane {
    constructor() {
        this.debugMode = false;
        this.nodeColors = {};
        this.processed = "";
        this.documentEditable = true;
        this.lastPressedKey = "";
        this.el = null;
        this.elm = null;
        this.selfWindow = window;
        this.unfloatCb = null;
        this.all_events = [];
        this.highlightSelected = 0;
        this.compositionRunning = false;
        this.observer = null;
        this.observerFunc = null;
        this._onContextTransfer = () => {};

        this._initListeners();
    }

    _initListeners() {
        this.on("dblclick", (ev) => {
            if (ev.target.tagName === "IMG") {
                imageDrawer.open(ev.target.src, (url) => {
                    ev.target.src = url;
                    if (this.refresh()) {
                        if (this.observerFunc) this.observerFunc();
                    }
                });
            }
        });
    }

    init() {
        this.el = document.getElementById("textedit");
        this.elm = document.getElementById("textedit_message");
        this.all_events.forEach(([ev, f]) => this.el.addEventListener(ev, f));
        this.cleanupHTML();

        this.on("keydown", (ev) => this._handleKeyDown(ev));
        this.on("paste", (ev) => this._handlePaste(ev));
    }

    _handleKeyDown(ev) {
        if (imageDrawer.isActive) {
            ev.preventDefault();
            return;
        }
        this.lastPressedKey = ev.key;
        if (this.lastPressedKey === "Enter" && ev.ctrlKey) {
            this.lastPressedKey = "";
        }
        if (ev.which === 9) {
            // Tab
            ev.preventDefault();
            this._handleTab(ev.shiftKey);
        }
    }

    _handleTab(isShift) {
        let t = this.markCaretPos(this.el.innerHTML);
        const lines = t.split("\n");
        let p1 = -1,
            p2 = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes("\0n") || lines[i].includes("\0r")) {
                if (p1 === -1) p1 = i;
                else p2 = i;
            }
        }
        if (p1 === -1) p1 = p2;
        if (p2 === -1) p2 = p1;

        if (p1 >= 0 && p2 >= 0) {
            if (isShift) {
                this._outdentLines(lines, p1, p2);
            } else {
                this._indentLines(lines, p1, p2);
            }
        }
        this.unmarkCaretPos(lines.join("\n"));
    }

    _indentLines(lines, start, end) {
        for (let i = start; i <= end; i++) {
            lines[i] = lines[i].replaceAll(/<li[^>]*>/gi, "<ul><li>") + "</ul>";
        }
    }

    _outdentLines(lines, start, end) {
        let level = 0;
        for (let i = 0; i < start; i++) {
            level +=
                this.findCnt(lines[i], "<ul>") -
                this.findCnt(lines[i], "</ul>");
        }
        for (let i = start; i <= end; i++) {
            const [first_li] = this.indexOfRegex(lines[i], /<li[^>]*>/i, 0);
            if (first_li >= 0) {
                const my_il =
                    level +
                    this.findCnt(lines[i].substring(0, first_li), "<ul>") -
                    this.findCnt(lines[i].substring(0, first_li), "</ul>");
                if (my_il > 1) {
                    lines[i] =
                        lines[i].replaceAll(/<li[^>]*>/gi, "</ul><li>") +
                        "<ul>";
                }
            }
            level +=
                this.findCnt(lines[i], "<ul>") -
                this.findCnt(lines[i], "</ul>");
        }
    }

    async _handlePaste(ev) {
        if (imageDrawer.isActive) {
            ev.preventDefault();
            return;
        }
        const clipboardData =
            ev.clipboardData || ev.originalEvent.clipboardData;
        const items = clipboardData.items;
        let hasImage = Array.from(items).some((item) =>
            item.type.includes("image"),
        );

        if (hasImage) {
            ev.preventDefault();
            for (const item of items) {
                if (item.type.includes("image")) {
                    const blob = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            const url = await uploadImage(event.target.result);
                            this.insertAtCursor(this._createEditorImage(url));
                            this.refresh();
                            if (this.observerFunc) this.observerFunc();
                        } catch (e) {}
                    };
                    reader.readAsDataURL(blob);
                }
            }
        } else {
            const html = clipboardData.getData("text/html");
            const text = clipboardData.getData("text/plain");

            if (html || text) {
                ev.preventDefault();
                this._processPasteContent(html, text);
            }
        }
    }

    async _processPasteContent(html, text) {
        let fragment;

        if (html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const container = doc.body;

            // Step 1: Upload any external images
            await this._migrateExternalImages(container);

            // Step 2: Determine if we use HTML as-is or reorganize from text
            // Heuristic: If it contains <li>, it's structured.
            if (container.querySelector("li")) {
                this._cleanHTMLForEditor(container);
                fragment = document.createDocumentFragment();
                while (container.firstChild) {
                    fragment.appendChild(container.firstChild);
                }
            } else if (text) {
                const reformatted = reformatText(text);
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = reformatted;
                fragment = document.createDocumentFragment();
                while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                }
            }
        } else if (text) {
            const reformatted = reformatText(text);
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = reformatted;
            fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }
        }

        if (fragment) {
            this.insertAtCursor(fragment);
            this.refresh();
            if (this.observerFunc) this.observerFunc();
        }
    }

    async _migrateExternalImages(container) {
        const imgs = Array.from(container.querySelectorAll("img"));
        for (const img of imgs) {
            const src = img.getAttribute("src");
            if (src && !src.startsWith("images/")) {
                try {
                    // Try to fetch the image and upload it
                    const response = await fetch(src);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    const dataUrl = await new Promise((resolve) => {
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                    const localUrl = await uploadImage(dataUrl);
                    img.setAttribute("src", localUrl);
                } catch (e) {
                    console.warn("Failed to migrate external image:", src, e);
                    // Leave original src as fallback
                }
            }
        }
    }

    _cleanHTMLForEditor(container) {
        // Strip all attributes except src on images
        const all = container.querySelectorAll("*");
        all.forEach((el) => {
            const attrs = Array.from(el.attributes);
            attrs.forEach((attr) => {
                if (el.tagName === "IMG" && attr.name === "src") return;
                el.removeAttribute(attr.name);
            });
        });
        
        // Remove styling tags but keep structure and images
        const forbidden = container.querySelectorAll("style, script, meta, link");
        forbidden.forEach(el => el.remove());
    }

    _createEditorImage(src) {
        const img = document.createElement("img");
        img.src = src;
        img.style.maxWidth = "200px";
        img.style.maxHeight = "200px";
        img.style.display = "inline-block";
        img.style.verticalAlign = "middle";
        return img;
    }

    insertAtCursor(node) {
        const selection = this.getWindow().getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(node);
            range.setStartAfter(node);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    findCnt(str, pattern) {
        let count = 0;
        let idx = str.indexOf(pattern);
        while (idx !== -1) {
            count++;
            idx = str.indexOf(pattern, idx + 1);
        }
        return count;
    }

    on(ev, f) {
        this.all_events.push([ev, f]);
        if (this.el) this.el.addEventListener(ev, f);
    }

    observe(func) {
        this.observerFunc = func;
        this.observer = new MutationObserver(() => {
            if (this.refresh() && this.observerFunc) this.observerFunc();
        });
        this.on("compositionstart", () => {
            this.compositionRunning = true;
        });
        this.on("compositionend", () => {
            this.compositionRunning = false;
        });
        this.observer.observe(this.el, {
            subtree: true,
            childList: true,
            attributes: true,
            characterData: true,
        });
    }

    refresh() {
        if (this.compositionRunning) return this.updateProcessed();
        if (this.observer) this.observer.disconnect();
        const success = this.cleanupHTML();
        if (this.observer)
            this.observer.observe(this.el, {
                subtree: true,
                childList: true,
                attributes: true,
                characterData: true,
            });
        return success;
    }

    get() {
        return this.el ? this.el.innerHTML : "";
    }
    set(x) {
        if (this.el) {
            this.el.innerHTML = x;
            this.lastPressedKey = "";
            this.refresh();
        }
    }
    getPos() {
        return [this.getCaretBeginIndex(this.el), this.getCaretIndex(this.el)];
    }
    setPos(p1, p2) {
        this.setCaret(this.el, p1, p2);
    }

    setNodeColor(index, color) {
        color = color.replace(/^\s*#|\s*$/g, "");
        if (color.length === 3) color = color.replace(/(.)/g, "$1$1");
        const r = parseInt(color.substr(0, 2), 16),
            g = parseInt(color.substr(2, 2), 16),
            b = parseInt(color.substr(4, 2), 16);
        this.nodeColors[index] =
            "#" +
            Math.floor(384 + r / 2)
                .toString(16)
                .substr(1) +
            Math.floor(384 + g / 2)
                .toString(16)
                .substr(1) +
            Math.floor(384 + b / 2)
                .toString(16)
                .substr(1);
    }

    getProcessed() {
        return this.processed;
    }

    updateProcessed() {
        const _f = (el, depth) => {
            if (el.nodeType === Node.TEXT_NODE) return el.textContent;
            if (el.nodeName === "UL") {
                let ret = "";
                for (const n of el.childNodes) {
                    const x = _f(n, depth + 1);
                    if (x !== null) ret += x + "\n";
                }
                return ret;
            }
            if (el.nodeName === "LI") {
                let ret = " ".repeat(Math.max(0, depth - 1)) + "\0-";
                for (const n of el.childNodes) {
                    const x = _f(n, depth);
                    if (x !== null) ret += x;
                }
                return ret.replaceAll("\n", "\n\0+");
            }
            if (el.nodeName === "IMG") return `\0i[${el.src}]`;
            if (el.nodeName === "BR") return "\n";
            let ret = "";
            if (el.hasChildNodes()) {
                for (const n of el.childNodes) {
                    const x = _f(n, depth);
                    if (x !== null) ret += x;
                }
            } else ret = el.innerText || "";
            return ret;
        };
        const t = _f(this.el, 0);
        if (t !== this.processed) {
            this.processed = t;
            return true;
        }
        return false;
    }

    setEditable(editable, message = "") {
        this.documentEditable = editable;
        if (!this.el) return;
        this.el.contentEditable = editable;
        this.el.style.backgroundColor = editable ? "#ffffff" : "#d0d0d0";
        if (this.elm) {
            this.elm.innerHTML = message;
            this.elm.style.visibility = editable ? "hidden" : "visible";
        }
    }

    isEditable() {
        return this.documentEditable;
    }

    startFloatMode(unfloat_cb) {
        this._onContextTransfer = (te, tem, w) => {
            let pc = "",
                pm = "";
            if (this.el !== null) {
                this.all_events.forEach(([ev, f]) => {
                    try {
                        this.el.removeEventListener(ev, f);
                    } catch (e) {}
                });
                pc = this.el.innerHTML;
            }
            if (this.elm !== null) pm = this.elm.innerHTML;

            const returning = this.selfWindow !== window && w === window;
            this.el = te;
            this.elm = tem;
            this.selfWindow = w;
            if (pc !== "") this.el.innerHTML = pc;
            this.all_events.forEach(([ev, f]) =>
                this.el.addEventListener(ev, f),
            );
            if (this.observer !== null) {
                this.observer.disconnect();
                this.observer.observe(this.el, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                    characterData: true,
                });
            }
            this.setEditable(this.documentEditable, pm);
            if (returning) {
                if (this.unfloatCb) {
                    this.unfloatCb();
                    this.unfloatCb = null;
                }
                if (imageDrawer?.isActive) imageDrawer.close();
            }
        };
        this.unfloatCb = unfloat_cb;
        const w = window.open("edit_popup.php", "floatpane", "popup");
        if (window.shortcuts) window.shortcuts.bindToWindow(w);
        const poll = () => {
            if (this.getWindow() !== window) setTimeout(poll, 500);
        };
        setTimeout(poll, 500);
    }

    getWindow() {
        if (this.selfWindow !== window && this.selfWindow.closed) {
            this.callbackFromPane(
                document.getElementById("textedit"),
                document.getElementById("textedit_message"),
                window,
            );
        }
        return this.selfWindow;
    }

    callbackFromPane(te, tem, w) {
        this._onContextTransfer(te, tem, w);
    }

    // --- Caret and HTML cleaning methods ---

    indexOfRegex(s, pattern, startpos) {
        let start = -1,
            length = 0;
        s.substring(startpos).replace(pattern, (match, offset) => {
            start = offset;
            length = match.length;
        });
        return start < 0 ? [-1, length] : [start + startpos, length];
    }

    outerHeaderLength(el) {
        return el.outerHTML.indexOf(">") + 1;
    }

    findRangeFromCharPos(el, pos) {
        const _f = (el, pos) => {
            if (pos === 0 || el.nodeType === Node.TEXT_NODE) return [el, pos];
            if (el.outerHTML.length === 0) return [el, 0];
            pos -= this.outerHeaderLength(el);
            let t = el.innerHTML;
            for (let i = 0; i < el.childNodes.length; i++) {
                const cel = el.childNodes[i];
                if (cel.nodeType === Node.TEXT_NODE) {
                    let celLen = t.indexOf("<");
                    if (celLen < 0) celLen = t.length;
                    if (pos > celLen) {
                        pos -= celLen;
                        t = t.substring(celLen);
                    } else return [cel, this._unescapedPos(t, pos)];
                } else {
                    if (pos >= cel.outerHTML.length) {
                        pos -= cel.outerHTML.length;
                        t = t.substring(cel.outerHTML.length);
                    } else return _f(cel, pos);
                }
            }
            return [el, el.childNodes.length];
        };
        return _f(el, pos + this.outerHeaderLength(el));
    }

    findCharPosFromRange(el, container, pos) {
        if (el === container) {
            if (el.nodeType === Node.TEXT_NODE) return pos;
            let cn = 0,
                t = el.innerHTML;
            for (let i = 0; i < pos; i++) {
                const c = el.childNodes[i];
                if (c.nodeType === Node.TEXT_NODE) {
                    let len = t.indexOf("<");
                    if (len < 0) len = t.length;
                    cn += len;
                    t = t.substring(len);
                } else {
                    cn += c.outerHTML.length;
                    t = t.substring(c.outerHTML.length);
                }
            }
            return cn;
        } else {
            if (el.nodeType === Node.TEXT_NODE) return -1;
            let cn = 0,
                t = el.innerHTML;
            for (let i = 0; i < el.childNodes.length; i++) {
                const c = el.childNodes[i];
                const p = this.findCharPosFromRange(c, container, pos);
                if (p >= 0)
                    return c.nodeType === Node.TEXT_NODE
                        ? cn + this._escapedPos(t, pos)
                        : cn + this.outerHeaderLength(c) + p;
                if (c.nodeType === Node.TEXT_NODE) {
                    let len = t.indexOf("<");
                    if (len < 0) len = t.length;
                    cn += len;
                    t = t.substring(len);
                } else {
                    cn += c.outerHTML.length;
                    t = t.substring(c.outerHTML.length);
                }
            }
            return -1;
        }
    }

    _escapedPos(s, upos) {
        let sp = 0,
            skip = false;
        for (let i = 0; i < s.length; i++) {
            if (upos === sp) return i;
            if (s.charAt(i) === "&") skip = true;
            else if (s.charAt(i) === ";") {
                skip = false;
                sp++;
            } else if (!skip) sp++;
        }
        return s.length;
    }

    _unescapedPos(s, pos) {
        let sp = 0,
            skip = false;
        for (let i = 0; i < pos; i++) {
            if (s.charAt(i) === "&") skip = true;
            else if (s.charAt(i) === ";") {
                skip = false;
                sp++;
            } else if (!skip) sp++;
        }
        return sp;
    }

    getCaretIndex(el) {
        const sel = this.getWindow().getSelection();
        return sel && sel.rangeCount !== 0
            ? this.findCharPosFromRange(
                  el,
                  sel.getRangeAt(0).endContainer,
                  sel.getRangeAt(0).endOffset,
              )
            : -1;
    }

    getCaretBeginIndex(el) {
        const sel = this.getWindow().getSelection();
        return sel && sel.rangeCount !== 0
            ? this.findCharPosFromRange(
                  el,
                  sel.getRangeAt(0).startContainer,
                  sel.getRangeAt(0).startOffset,
              )
            : -1;
    }

    setCaret(el, begin, end) {
        const range = document.createRange(),
            sel = this.getWindow().getSelection();
        range.selectNode(el);
        const r1 = this.findRangeFromCharPos(el, begin),
            r2 = this.findRangeFromCharPos(el, end);
        range.setStart(r1[0], r1[1]);
        range.setEnd(r2[0], r2[1]);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    markCaretPos(t) {
        let idx = this.getCaretIndex(this.el),
            idxb = this.getCaretBeginIndex(this.el);
        if (idx >= 0) {
            t = t.substring(0, idx) + "\0r" + t.substring(idx);
            if (idx < idxb) idxb += 2;
        }
        if (idxb >= 0) t = t.substring(0, idxb) + "\0n" + t.substring(idxb);
        return t;
    }

    unmarkCaretPos(t, skip_update = false) {
        let p1 = t.indexOf("\0n");
        if (p1 >= 0) t = t.substring(0, p1) + t.substring(p1 + 2);
        let p2 = t.indexOf("\0r");
        if (p2 >= 0) t = t.substring(0, p2) + t.substring(p2 + 2);
        if (p2 < p1) p1 -= 2;
        if (!skip_update || this.el.innerHTML !== t) {
            this.el.innerHTML = t;
            if (p1 >= 0 && p2 >= 0) this.setCaret(this.el, p1, p2);
        }
        return t;
    }

    cleanupHTML() {
        let [n1, n2] = this.findSelectedNodes();
        if (!this.highlightSelected) {
            n1 = -1;
            n2 = -1;
        }
        let t = this.markCaretPos(this.el.innerHTML);
        const imgs = [];
        t = t.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, (m, src) => {
            imgs.push(src);
            return `\0i${imgs.length - 1}\0`;
        });
        t = t
            .replace(/<ul[^>]*>/gi, "\0u")
            .replace(/<\/ul>/gi, "\0U")
            .replace(/<li[^>]*>/gi, "\0l")
            .replace(/<br[^>]*>/gi, "\0b")
            .replace(/<\/li>/gi, "\0L")
            .replace(/<[^>]*>/g, "")
            .replace(/\s+/g, " ");

        let tout = "",
            nodeno = 0,
            level = 0,
            tagOpen = false,
            closeUl = false,
            accum = "",
            first = true;
        let pk = this.lastPressedKey;
        if (["Del", "Clear", "Cut", "EraseEof"].includes(pk)) pk = "Delete";
        if (!["Enter", "Delete", "Backspace"].includes(pk)) pk = "";
        let nPending = false,
            rPending = false;

        const _proc = (l) => {
            if (!first)
                return l === "" || "\0n\0r".includes(l)
                    ? l
                    : `<span class="comment">${l}</span>`;
            let cl =
                nodeno in this.nodeColors
                    ? ` style="background-color:${this.nodeColors[nodeno]};" `
                    : " ";
            const m = l.match(
                /^((?:&nbsp;|\0n|\0r|\s)*)(\[(?:[0-9\- ]|\0n|\0r)*\])(.*)$/,
            );
            return m
                ? l.replace(
                      m[0],
                      `<span class="pos">${m[1]}${m[2]}</span><span${cl}class="header">${m[3]}</span>`,
                  )
                : `<span${cl}class="header">${l}</span>`;
        };

        const _cmd = (c) => {
            if (c === "u") {
                if (tagOpen) _cmd("L");
                level++;
                tout += "<ul>";
            } else if (c === "U") {
                if (tagOpen) _cmd("L");
                level--;
                tout += "</ul>";
            } else if (c === "l") {
                if (tagOpen) _cmd("L");
                if (level === 0) {
                    _cmd("u");
                    closeUl = true;
                }
                tout += `<li class="${nodeno >= n1 && nodeno <= n2 ? "selected_node " : ""}level${Math.min(level, 8)}">`;
                first = true;
                tagOpen = true;
                if (nPending) {
                    tout += "\0n";
                    nPending = false;
                }
                if (rPending) {
                    tout += "\0r";
                    rPending = false;
                }
            } else if (c === "L") {
                if (tagOpen) {
                    tout += _proc(accum) + "</li>\n";
                    nodeno++;
                    accum = "";
                    if (closeUl) {
                        closeUl = false;
                        _cmd("U");
                    }
                }
                tagOpen = false;
            } else if (c === "b") {
                if (tagOpen) {
                    tout += _proc(accum);
                    accum = "";
                    tout += "<br>";
                    first = false;
                }
            } else if ("nr".includes(c)) {
                if (tagOpen) accum += "\0" + c;
                else {
                    const isN = c === "n";
                    if (pk === "Delete") {
                        if (isN) nPending = true;
                        else rPending = true;
                    } else if (pk === "Backspace") {
                        let pos = tout.lastIndexOf("</li>");
                        if (pos < 0) {
                            if (isN) nPending = true;
                            else rPending = true;
                        } else
                            tout =
                                tout.substring(0, pos) +
                                "\0" +
                                c +
                                tout.substring(pos);
                    } else if (pk === "Enter") {
                        _cmd("l");
                        _cmd("L");
                        _cmd("l");
                        accum += "\0" + c;
                    } else tout += "\0" + c;
                }
            }
        };

        let p = 0;
        while (true) {
            const next = t.indexOf("\0", p);
            if (next < 0) {
                if (tagOpen) tout += t.substring(p);
                break;
            }
            if (tagOpen) accum += t.substring(p, next);
            const cmd = t.charAt(next + 1);
            if (cmd === "i") {
                p = next + 2;
                const n = t.indexOf("\0", p);
                if (n >= 0) {
                    const idx = parseInt(t.substring(p, n));
                    if (!isNaN(idx) && imgs[idx]) {
                        const img = `<img src="${imgs[idx]}" style="max-width:200px; max-height:200px; display:inline-block; vertical-align:middle;">`;
                        if (tagOpen) accum += img;
                        else tout += img;
                    }
                    p = n + 1;
                } else p = next + 2;
            } else {
                _cmd(cmd);
                p = next + 2;
            }
        }
        if (nPending || rPending) {
            _cmd("l");
            if (nPending) accum += "\0n";
            if (rPending) accum += "\0r";
            _cmd("L");
        }
        while (true) {
            let t2 = tout
                .replaceAll("</ul><ul>", "")
                .replaceAll("<ul></ul>", "");
            if (tout === t2) break;
            tout = t2;
        }
        this.unmarkCaretPos(tout, true);
        return this.updateProcessed();
    }

    /**
     * Updates the text of specific nodes to include or remove coordinate headers [x y].
     * This is used for "freezing" nodes in place.
     * @param {Object[]} changedesc Array of { nodenum, frozen, xp, yp }
     */
    updateTextForCoordinates(changedesc) {
        if (!this.documentEditable) return;
        if (changedesc.length == 0) return;

        // Internal helper to update a single <li> content
        const _do = (t, nodenum, frozen, xp, yp) => {
            // Find the N-th <li> tag in the HTML
            let lipos = -1,
                len = 0;
            for (let i = 0; i < nodenum + 1; i++)
                [lipos, len] = this.indexOfRegex(t, /<li[^>]*>/i, lipos + 1);
            if (lipos < 0) return t;

            // Extract the content of this <li>, but STOP before any child <ul>
            const nextUl = t.toLowerCase().indexOf("<ul>", lipos + len);
            const nextLiEnd = t.toLowerCase().indexOf("</li>", lipos + len);

            // The 'header' ends at either the start of children (UL) or the end of the node (LI)
            let endOfHeader = nextLiEnd;
            if (nextUl !== -1 && nextUl < nextLiEnd) {
                endOfHeader = nextUl;
            }

            let tp = t.substring(lipos + len, endOfHeader);

            // Temporarily tokenize images to avoid interfering with text manipulation
            const imgs = [];
            tp = tp.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, (m, src) => {
                imgs.push(src);
                return `\0i${imgs.length - 1}\0`;
            });

            // Flatten for text manipulation (strip all other formatting tags)
            tp = tp
                .replaceAll("\n", "")
                .replaceAll("<br>", "\n")
                .replaceAll(/<[^>]*>/g, "");

            // Identify selection markers
            let p1 = tp.indexOf("\0n");
            if (p1 >= 0) tp = tp.substring(0, p1) + tp.substring(p1 + 2);
            let p2 = tp.indexOf("\0r");
            if (p2 >= 0) tp = tp.substring(0, p2) + tp.substring(p2 + 2);

            // Remove existing coordinates
            let lp = tp.length;
            tp = tp.replace(/^ *\[[0-9\- ]*\] */, "");
            let ln = tp.length;
            if (p1 >= 0) p1 = Math.max(0, p1 - (lp - ln));
            if (p2 >= 0) p2 = Math.max(0, p2 - (lp - ln));

            if (frozen) {
                const header = `[${Math.round(xp)} ${Math.round(yp)}] `;
                tp = header + tp;
                if (p1 >= 0) p1 += header.length;
                if (p2 >= 0) p2 += header.length;
            }

            // Re-insert markers
            if (p1 >= 0) tp = tp.substring(0, p1) + "\0n" + tp.substring(p1);
            if (p2 >= 0) {
                if (p1 >= 0 && p2 >= p1) p2 += 2;
                tp = tp.substring(0, p2) + "\0r" + tp.substring(p2);
            }

            // Restore image tokens back to actual <img> tags
            tp = tp.replace(/\0i(\d+)\0/g, (m, idx) =>
                imgs[idx]
                    ? `<img src="${imgs[idx]}" style="max-width:200px; max-height:200px; display:inline-block; vertical-align:middle;">`
                    : "",
            );

            // Reconstruct the <li> by swapping the old header with the new one
            return (
                t.substring(0, lipos + len) +
                tp.replaceAll("\n", "<br>") +
                t.substring(endOfHeader)
            );
        };

        // Capture current caret/selection state using markers \0n and \0r
        let t = this.markCaretPos(this.el.innerHTML);

        // Apply all requested coordinate changes
        changedesc.forEach(
            (x) => (t = _do(t, x.nodenum, x.frozen, x.xp, x.yp)),
        );

        // Remove markers and restore the actual browser selection/caret
        this.unmarkCaretPos(t);
    }

    /**
     * Determines which mindmap nodes (0-indexed) are currently covered by the text selection.
     * @returns {[number, number]} [startNodeIndex, endNodeIndex]
     */
    findSelectedNodes() {
        // Mark selection and find the marker indices
        let t = this.markCaretPos(this.el ? this.el.innerHTML : ""),
            r1 = t.indexOf("\0n"),
            r2 = t.indexOf("\0r");

        // Normalize range
        if (r1 > r2) [r1, r2] = [r2, r1];
        if (r1 < 0 || r2 < 0) return [0, -1];

        let l1 = -1,
            l2 = -1,
            pos = -1,
            cnt = 0;
        // Step through each <li> tag to find which ones contain the selection markers
        while (true) {
            t = t.substring(pos + 1);
            r1 -= pos + 1;
            r2 -= pos + 1;
            pos = t.search(/<li[^>]*>/);
            if (pos < 0) break;

            // If the start of the current <li> is after our marker,
            // then the marker belongs to the PREVIOUS node.
            if (l1 < 0 && pos > r1) l1 = Math.max(0, cnt - 1);
            if (l2 < 0 && pos > r2) {
                l2 = Math.max(0, cnt - 1);
                break;
            }
            cnt++;
        }

        // Fallback for selection extending to the last node
        return [
            l1 < 0 ? Math.max(0, cnt - 1) : l1,
            l2 < 0 ? Math.max(0, cnt - 1) : l2,
        ];
    }

    moveCursorToNode(nodenum) {
        let lipos = -1,
            len = 0;
        for (let i = 0; i < nodenum + 1; i++)
            [lipos, len] = this.indexOfRegex(
                this.el.innerHTML,
                /<li[^>]*>/i,
                lipos + 1,
            );
        if (lipos < 0) return;
        const clipos = this.el.innerHTML.indexOf("</li>", lipos);
        this.unmarkCaretPos(
            this.el.innerHTML.substring(0, clipos) +
                "\0n\0r" +
                this.el.innerHTML.substring(clipos),
        );
        const sel = this.getWindow().getSelection();
        if (sel && sel.rangeCount !== 0) {
            let n = sel.getRangeAt(0).startContainer,
                l = 0,
                top = -100;
            while (n !== this.el && n !== null) {
                if (n.nodeType !== Node.TEXT_NODE) {
                    l += n.offsetLeft;
                    top += n.offsetTop;
                }
                if (n.nodeName === "LI") break;
                n = n.parentElement;
            }
            this.el.scroll(l, top);
        }
        this.highlightSelected++;
        this.cleanupHTML();
        setTimeout(() => {
            if (--this.highlightSelected === 0) this.cleanupHTML();
        }, 200);
    }
}

export const editorPane = new EditorPane();
