/**
 * Editor pane encapsulation.
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
        this.__cb_pane = (te, tem, w) => {};
    }

    init() {
        this.el = document.getElementById("textedit");
        this.elm = document.getElementById("textedit_message");
        for (const [ev, f] of this.all_events) {
            this.el.addEventListener(ev, f);
        }
        this.cleanupHTML();

        this.on("keydown", (ev) => {
            this.lastPressedKey = ev.key;
            if (this.lastPressedKey === "Enter" && ev.ctrlKey) {
                this.lastPressedKey = ""; // ctrl-enter is simple "refresh"
            }
            if (ev.which === 9) {
                // tab
                ev.preventDefault();
                let t = this.el.innerHTML;
                t = this.markCaretPos(t);
                const lines = t.split("\n");
                let p1 = -1, p2 = -1;
                for (let i = 0; i < lines.length; i++) {
                    const l = lines[i];
                    if (l.indexOf("\0 n") >= 0 || l.indexOf("\0 r") >= 0) {
                        if (p1 === -1) p1 = i;
                        else p2 = i;
                    }
                }
                if (p1 === -1) p1 = p2;
                if (p2 === -1) p2 = p1;

                if (p1 >= 0 && p2 >= 0) {
                    if (ev.shiftKey) {
                        let indent_level = 0;
                        for (let i = 0; i < p1; i++) {
                            indent_level += this.findCnt(lines[i], "<ul>") - this.findCnt(lines[i], "</ul>");
                        }
                        for (let i = p1; i <= p2; i++) {
                            const [first_li, len] = this.indexOfRegex(lines[i], /<li[^>]*>/i, 0);
                            if (first_li >= 0) {
                                const my_il = indent_level + this.findCnt(lines[i].substring(0, first_li), "<ul>") - this.findCnt(lines[i].substring(0, first_li), "</ul>");
                                if (my_il > 1) {
                                    lines[i] = lines[i].replaceAll(/<li[^>]*>/gi, "</ul><li>") + "<ul>";
                                }
                            }
                            indent_level += this.findCnt(lines[i], "<ul>") - this.findCnt(lines[i], "</ul>");
                        }
                    } else {
                        for (let i = p1; i <= p2; i++) {
                            lines[i] = lines[i].replaceAll(/<li[^>]*>/gi, "<ul><li>") + "</ul>";
                        }
                    }
                }
                t = lines.join("\n");
                this.unmarkCaretPos(t);
            }
        });
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
        if (this.el) {
            this.el.addEventListener(ev, f);
        }
    }

    observe(func) {
        const options = { subtree: true, childList: true, attributes: true, characterData: true };
        this.observer = new MutationObserver((mutationList) => {
            if (this.refresh()) {
                func();
            }
        });
        this.on("compositionstart", () => { this.compositionRunning = true; });
        this.on("compositionend", () => { this.compositionRunning = false; });
        this.observer.observe(this.el, options);
    }

    refresh() {
        if (!this.compositionRunning) {
            if (this.observer) {
                this.observer.disconnect();
            }
            const success = this.cleanupHTML();
            if (this.observer) {
                const options = { subtree: true, childList: true, attributes: true, characterData: true };
                this.observer.observe(this.el, options);
            }
            return success;
        } else {
            return this.updateProcessed();
        }
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
        if (3 === color.length) {
            color = color.replace(/(.)/g, "$1$1");
        }
        const r = parseInt(color.substr(0, 2), 16);
        const g = parseInt(color.substr(2, 2), 16);
        const b = parseInt(color.substr(4, 2), 16);
        color = "#" + (Math.floor(384 + r / 2)).toString(16).substr(1) +
            (Math.floor(384 + g / 2)).toString(16).substr(1) + (Math.floor(384 + b / 2)).toString(16).substr(1);
        this.nodeColors[index] = color;
    }

    getProcessed() {
        return this.processed;
    }

    updateProcessed() {
        const _f = (el, depth) => {
            let ret = "";
            if (el.nodeType === Node.TEXT_NODE) {
                return null;
            } else if (el.nodeName === "UL") {
                for (const n of el.childNodes) {
                    const x = _f(n, depth + 1);
                    if (x !== null) ret += x + "\n";
                }
                return ret;
            } else if (el.nodeName === "LI") {
                for (let i = 0; i < depth - 1; i++) {
                    ret += " ";
                }
                ret += "\0-";
                ret += el.innerText;
                ret = ret.replaceAll("\n", "\n\0+");
                return ret;
            } else {
                if (el.hasChildNodes()) {
                    for (const n of el.childNodes) {
                        const x = _f(n, depth);
                        if (x !== null) ret += x + "\n";
                    }
                    return ret;
                } else {
                    return el.innerText;
                }
            }
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
        if (this.el) {
            this.el.contentEditable = editable;
            if (editable) {
                this.el.style.backgroundColor = "#ffffff";
                if (this.elm) this.elm.style.visibility = "hidden";
            } else {
                this.el.style.backgroundColor = "#d0d0d0";
                if (this.elm) {
                    this.elm.innerHTML = message;
                    this.elm.style.visibility = "visible";
                }
            }
        }
    }

    isEditable() {
        return this.documentEditable;
    }

    startFloatMode(unfloat_cb) {
        this.__cb_pane = (te, tem, w) => {
            let pc = "";
            let pm = "";
            if (this.el !== null) {
                for (const [ev, f] of this.all_events) {
                    this.el.removeEventListener(ev, f);
                }
                pc = this.el.innerHTML;
            }
            if (this.elm !== null) {
                pm = this.elm.innerHTML;
            }
            this.el = te;
            this.elm = tem;
            this.selfWindow = w;
            this.el.innerHTML = pc;
            for (const [ev, f] of this.all_events) {
                this.el.addEventListener(ev, f);
            }
            if (this.observer !== null) {
                this.observer.disconnect();
                const options = { subtree: true, childList: true, attributes: true, characterData: true };
                this.observer.observe(this.el, options);
            }
            this.setEditable(this.documentEditable, pm);
        };
        this.unfloatCb = unfloat_cb;
        const w = window.open("edit_popup.html", "floatpane", "popup");
        const poll_window_exist = () => {
            if (this.getWindow() !== window) {
                setTimeout(poll_window_exist, 500);
            }
        };
        setTimeout(poll_window_exist, 500);
    }

    getWindow() {
        if (this.selfWindow !== window && this.selfWindow.closed) {
            this.__cb_pane(
                document.getElementById("textedit"),
                document.getElementById("textedit_message"),
                window
            );
            this.unfloatCb();
        }
        return this.selfWindow;
    }

    callbackFromPane(te, tem, w) {
        this.__cb_pane(te, tem, w);
    }

    // --- Caret and HTML cleaning methods ---

    findEscapedPosOnString(s, upos) {
        let sp = 0;
        let skip = false;
        for (let i = 0; i < s.length; i++) {
            if (upos === sp) return i;
            if (s.charAt(i) === '&') skip = true;
            else if (s.charAt(i) === ';') { skip = false; sp++; }
            else if (!skip) sp++;
        }
        return s.length;
    }

    findUnescapedPosOnString(s, pos) {
        let sp = 0;
        let skip = false;
        for (let i = 0; i < pos; i++) {
            if (s.charAt(i) === '&') skip = true;
            else if (s.charAt(i) === ';') { skip = false; sp++; }
            else if (!skip) sp++;
        }
        return sp;
    }

    indexOfRegex(s, pattern, startpos) {
        let start = -1, length = 0;
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
                    let celLength = t.indexOf("<");
                    if (celLength < 0) celLength = t.length;
                    if (pos > celLength) {
                        pos -= celLength;
                        t = t.substring(celLength);
                    } else {
                        return [cel, this.findUnescapedPosOnString(t, pos)];
                    }
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
            let cn = 0;
            let t = el.innerHTML;
            for (let i = 0; i < pos; i++) {
                const c = el.childNodes[i];
                if (c.nodeType === Node.TEXT_NODE) {
                    let textContentLength = t.indexOf('<');
                    if (textContentLength < 0) textContentLength = t.length;
                    cn += textContentLength;
                    t = t.substring(textContentLength);
                } else {
                    cn += c.outerHTML.length;
                    t = t.substring(c.outerHTML.length);
                }
            }
            return cn;
        } else {
            if (el.nodeType === Node.TEXT_NODE) return -1;
            let cn = 0;
            let t = el.innerHTML;
            for (let i = 0; i < el.childNodes.length; i++) {
                const c = el.childNodes[i];
                const p = this.findCharPosFromRange(c, container, pos);
                if (p >= 0) {
                    if (c.nodeType === Node.TEXT_NODE) {
                        return cn + this.findEscapedPosOnString(t, pos);
                    } else return cn + this.outerHeaderLength(c) + p;
                }
                if (c.nodeType === Node.TEXT_NODE) {
                    let textContentLength = t.indexOf('<');
                    if (textContentLength < 0) textContentLength = t.length;
                    cn += textContentLength;
                    t = t.substring(textContentLength);
                } else {
                    cn += c.outerHTML.length;
                    t = t.substring(c.outerHTML.length);
                }
            }
            return -1;
        }
    }

    getCaretIndex(element) {
        const selection = this.getWindow().getSelection();
        if (selection && selection.rangeCount !== 0) {
            const range = selection.getRangeAt(0);
            return this.findCharPosFromRange(element, range.endContainer, range.endOffset);
        }
        return -1;
    }

    getCaretBeginIndex(element) {
        const selection = this.getWindow().getSelection();
        if (selection && selection.rangeCount !== 0) {
            const range = selection.getRangeAt(0);
            return this.findCharPosFromRange(element, range.startContainer, range.startOffset);
        }
        return -1;
    }

    setCaret(el, beginCharNum, endCharNum) {
        const range = document.createRange();
        const sel = this.getWindow().getSelection();
        range.selectNode(el);
        const r1 = this.findRangeFromCharPos(el, beginCharNum);
        const r2 = this.findRangeFromCharPos(el, endCharNum);
        range.setStart(r1[0], r1[1]);
        range.setEnd(r2[0], r2[1]);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    markCaretPos(t) {
        let idx = this.getCaretIndex(this.el);
        let idxb = this.getCaretBeginIndex(this.el);
        if (idx >= 0) {
            t = t.substring(0, idx) + "\0 r" + t.substring(idx);
            if (idx < idxb) idxb += 3;
        }
        if (idxb >= 0) {
            t = t.substring(0, idxb) + "\0 n" + t.substring(idxb);
        }
        return t;
    }

    unmarkCaretPos(t, skip_if_no_content_update = false) {
        let p1 = t.indexOf("\0 n");
        if (p1 >= 0) t = t.substring(0, p1) + t.substring(p1 + 3);
        let p2 = t.indexOf("\0 r");
        if (p2 >= 0) t = t.substring(0, p2) + t.substring(p2 + 3);
        if (p2 < p1) p1 -= 3;
        if (skip_if_no_content_update) {
            if (this.el.innerHTML !== t) {
                this.el.innerHTML = t;
                if (p1 >= 0 && p2 >= 0) this.setCaret(this.el, p1, p2);
            }
        } else {
            if (this.el.innerHTML !== t) this.el.innerHTML = t;
            if (p1 >= 0 && p2 >= 0) this.setCaret(this.el, p1, p2);
        }
        return t;
    }

    cleanupHTML() {
        let [n1pos, n2pos] = this.findSelectedNodes();
        if (!this.highlightSelected) { n1pos = -1; n2pos = -1; }
        let t = this.el.innerHTML;
        t = this.markCaretPos(t);
        t = t.replace(/<ul[^>]*>/gi, "\0 u").replace(/<\/ul>/gi, "\0 U")
             .replace(/<li[^>]*>/gi, "\0 l").replace(/<br[^>]*>/gi, "\0 b")
             .replace(/<\/li>/gi, "\0 L").replace(/<[^>]*>/g, "")
             .replace(/\s+/g, " ");

        let tout = ""; let ptr = 0; let nodeno = 0; let level = 0;
        let tagOpen = false; let closeUlOnNextLi = false; let accumText = ""; let firstLine = true;
        let pk = this.lastPressedKey;
        if (["Del", "Clear", "Cut", "EraseEof"].includes(pk)) pk = "Delete";
        if (!["Enter", "Delete", "Backspace"].includes(pk)) pk = "";
        
        let nCaretPending = false; let rCaretPending = false;
        const processCode = (l) => {
            if (firstLine) {
                let cl = (nodeno in this.nodeColors) ? ` style="background-color:${this.nodeColors[nodeno]};" ` : " ";
                if (l.match(/^(?:&nbsp;|\s|\0 n|\0 r)*(\[(?:[0-9\- ]|\0 n|\0 r)*\])(.*)$/)) {
                    l = l.replace(/^((?:&nbsp;|\0 n|\0 r|\s)*)(\[(?:[0-9\- ]|\0 n|\0 r)*\])(.*)$/, `<span class="pos">$1$2</span><span${cl}class="header">$3</span>`);
                } else {
                    l = `<span${cl}class="header">${l}</span>`;
                }
            } else {
                if (l === "" || l === "\0 n" || l === "\0 r" || l === "\0 n\0 r" || l === "\0 r\0 n") return l;
                l = `<span class="comment">${l}</span>`;
            }
            return l;
        };

        const processCommand = (c) => {
            if (c === "u") { if (tagOpen) processCommand('L'); level++; tout += "<ul>"; }
            else if (c === "U") { if (tagOpen) processCommand('L'); level--; tout += "</ul>"; }
            else if (c === "l") {
                if (tagOpen) processCommand('L');
                if (level === 0) { processCommand('u'); closeUlOnNextLi = true; }
                tout += (nodeno >= n1pos && nodeno <= n2pos) ? `<li class="selected_node level${Math.min(level, 8)}">` : `<li class="level${Math.min(level, 8)}">`;
                firstLine = true; tagOpen = true;
                if (nCaretPending) { tout += "\0 n"; nCaretPending = false; }
                if (rCaretPending) { tout += "\0 r"; rCaretPending = false; }
            } else if (c === "L") {
                if (tagOpen) {
                    tout += processCode(accumText); tout += "</li>\n"; nodeno++; accumText = "";
                    if (closeUlOnNextLi) { closeUlOnNextLi = false; processCommand('U'); }
                }
                tagOpen = false;
            } else if (c === "b") { if (tagOpen) { tout += processCode(accumText); accumText = ""; tout += "<br>"; firstLine = false; } }
            else if (c === "n") {
                if (tagOpen) accumText += "\0 n";
                else {
                    if (pk === "Delete") nCaretPending = true;
                    else if (pk === "Backspace") {
                        let pos = tout.lastIndexOf("</li>");
                        if (pos < 0) nCaretPending = true; else tout = tout.substring(0, pos) + "\0 n" + tout.substring(pos);
                    } else if (pk === "Enter") { processCommand('l'); processCommand('L'); processCommand('l'); accumText += "\0 n"; }
                    else tout += "\0 n";
                }
            } else if (c === "r") {
                if (tagOpen) accumText += "\0 r";
                else {
                    if (pk === "Delete") rCaretPending = true;
                    else if (pk === "Backspace") {
                        let pos = tout.lastIndexOf("</li>");
                        if (pos < 0) rCaretPending = true; else tout = tout.substring(0, pos) + "\0 r" + tout.substring(pos);
                    } else if (pk === "Enter") { processCommand('l'); processCommand('L'); processCommand('l'); accumText += "\0 r"; }
                    else tout += "\0 r";
                }
            }
        };

        while (true) {
            const p = t.indexOf("\0 ", ptr);
            if (p < 0) { if (tagOpen) tout += t.substring(ptr); break; }
            if (tagOpen) accumText += t.substring(ptr, p);
            processCommand(t.charAt(p + 2));
            ptr = p + 3;
        }
        if (nCaretPending || rCaretPending) {
            processCommand('l');
            if (nCaretPending) accumText += "\0 n";
            if (rCaretPending) accumText += "\0 r";
            processCommand('L');
        }
        while (true) {
            let tout2 = tout.replaceAll("</ul><ul>", "").replaceAll("<ul></ul>", "");
            if (tout === tout2) break;
            tout = tout2;
        }
        this.unmarkCaretPos(tout, true);
        return this.updateProcessed();
    }

    updateTextForCoordinates(changedesc) {
        if (!this.documentEditable) return;
        const _do = (t, nodenum, fixed, xp, yp) => {
            let lipos = -1; let len = 0;
            for (let i = 0; i < nodenum + 1; i++) {
                [lipos, len] = this.indexOfRegex(t, /<li[^>]*>/i, lipos + 1);
            }
            if (lipos < 0) return t;
            const clipos = t.indexOf("</li>", lipos);
            let tp = t.substring(lipos + len, clipos).replaceAll("\n", "").replaceAll("<br>", "\n").replaceAll(/<[^>]*>/g, "");
            let p1 = tp.indexOf("\0 n");
            if (p1 >= 0) tp = tp.substr(0, p1) + tp.substr(p1 + 3);
            let p2 = tp.indexOf("\0 r");
            if (p2 >= 0) tp = tp.substr(0, p2) + tp.substr(p2 + 3);
            let len_prev = tp.length;
            tp = tp.replace(/^ *\[[0-9\- ]*\] */, "");
            let len_new = tp.length;
            if (p1 >= 0) { p1 -= len_prev - len_new; if (p1 < 0) p1 = 0; }
            if (p2 >= 0) { p2 -= len_prev - len_new; if (p2 < 0) p2 = 0; }
            if (fixed) {
                let header = "[" + Math.round(xp) + " " + Math.round(yp) + "] ";
                tp = header + tp;
                if (p1 >= 0) p1 += header.length;
                if (p2 >= 0) p2 += header.length;
            }
            if (p1 >= 0) tp = tp.substring(0, p1) + "\0 n" + tp.substring(p1);
            if (p2 >= 0) { if (p2 >= p1) p2 += 3; tp = tp.substring(0, p2) + "\0 r" + tp.substring(p2); }
            tp = tp.replaceAll("\n", "<br>");
            return t.substring(0, lipos + len) + tp + t.substring(clipos);
        };
        let t = this.el.innerHTML;
        t = this.markCaretPos(t);
        for (const x of changedesc) { t = _do(t, x.nodenum, x.fixed, x.xp, x.yp); }
        this.unmarkCaretPos(t);
    }

    findSelectedNodes() {
        let t = this.markCaretPos(this.el ? this.el.innerHTML : "");
        let r1 = t.indexOf("\0 n"); let r2 = t.indexOf("\0 r");
        if (r1 > r2) [r1, r2] = [r2, r1];
        if (r1 < 0 || r2 < 0) return [0, -1];
        let l1 = -1, l2 = -1; let lipos = -1; let licnt = 0;
        while (true) {
            t = t.substring(lipos + 1); r1 -= lipos + 1; r2 -= lipos + 1;
            lipos = t.search(/<li[^>]*>/);
            if (lipos < 0) break;
            if (l1 < 0 && lipos > r1) l1 = licnt - 1;
            if (l2 < 0 && lipos > r2) { l2 = licnt - 1; break; }
            licnt++;
        }
        if (l1 < 0) l1 = licnt - 1;
        if (l2 < 0) l2 = licnt - 1;
        return [l1, l2];
    }

    moveCursorToNode(nodenum) {
        let t = this.el.innerHTML;
        let lipos = -1; let len = 0;
        for (let i = 0; i < nodenum + 1; i++) {
            [lipos, len] = this.indexOfRegex(t, /<li[^>]*>/i, lipos + 1);
        }
        if (lipos < 0) return;
        const clipos = t.indexOf("</li>", lipos);
        t = t.substring(0, clipos) + "\0 n\0 r" + t.substring(clipos);
        this.unmarkCaretPos(t);
        const selection = this.getWindow().getSelection();
        if (selection && selection.rangeCount !== 0) {
            let n = selection.getRangeAt(0).startContainer;
            let l = 0; let top = -100;
            while (n !== this.el && n !== null) {
                if (n.nodeType !== Node.TEXT_NODE) { l += n.offsetLeft; top += n.offsetTop; }
                if (n.nodeName === "LI") break;
                n = n.parentElement;
            }
            this.el.scroll(l, top);
        }
        this.highlightSelected++;
        this.cleanupHTML();
        setTimeout(() => {
            this.highlightSelected--;
            if (this.highlightSelected === 0) this.cleanupHTML();
        }, 200);
    }
}

export const editorPane = new EditorPane();
