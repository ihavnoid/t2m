// editor pane encapsulation

editorPane = (function() {
    function on(ev, f) {
        document.getElementById("textedit").addEventListener(ev, f);
    }
    function get() {
        return el.innerHTML;
    }
    function set(x) {
        el.innerHTML = x;
    }
    function getPos() {
        return [getCaretBeginIndex(el), getCaretIndex(el)];
    }
    function setPos(p1, p2) {
        setCaret(el, p1, p2);
    }
    function findRangeFromCharPos(el, pos) {
        // console.log("START", el, pos)
        function _f(el, pos) {
            // console.log(el, pos)
            if(pos == 0 || el.nodeType == Node.TEXT_NODE) {
                return [el, pos];
            } else if(el.outerHTML.length == 0) {
                return [el, 0];
            } else {
                let outer = el.outerHTML.indexOf(el.innerHTML)
                // console.log("strip", outer)
                pos -= outer
                for(let i = 0; i < el.childNodes.length; i++) {
                    var cel = el.childNodes[i]
                    if(cel.nodeType == Node.TEXT_NODE) {
                        if(pos > cel.textContent.length) {
                            // console.log("strip", cel.textContent.length, cel.textContent)
                            pos -= cel.textContent.length
                        } else {
                            return _f(cel, pos)
                        }
                    } else {
                        if(pos >= cel.outerHTML.length) {
                            // console.log("strip", pos, cel.outerHTML.length, cel.outerHTML)
                            pos -= cel.outerHTML.length
                        } else {
                            // strip header length
                            //let header = cel.outerHTML.indexOf(cel.innerHTML) 
                            //pos -= header
                            //console.log(cel.outerHTML.substring(header))
                            return _f(cel, pos)
                        }
                    }
                }
            }
            return [el, el.childNodes.length]
        }
        return _f(el, pos + el.outerHTML.indexOf(el.innerHTML.substring(0, 100)))
    }


    function findCharPosFromRange(el, container, pos) {
        // return el's offset relative to **innerHTML**
        function _f(el, container, pos) {
            if(el == container) {
                if( el.nodeType == Node.TEXT_NODE ) {
                    return pos;
                } else {
                    var cn = 0;
                    for(var i=0; i<pos; i++) {
                        var c = el.childNodes[i]
                        if(c.nodeType == Node.TEXT_NODE) {
                            cn += c.textContent.length;
                        } else {
                            cn += c.outerHTML.length;
                        }
                    }
                    return cn;
                }
            } else {
                if( el.nodeType == Node.TEXT_NODE) {
                    return -1;
                } else {
                    var cn = 0;
                    for(var i=0; i<el.childNodes.length; i++) {
                        var c = el.childNodes[i];
                        var p = findCharPosFromRange(c, container, pos);
                        if( p >= 0 ) {
                            if(c.nodeType == Node.TEXT_NODE) {
                                return cn + p;
                            } else {
                                return cn + c.outerHTML.indexOf(c.innerHTML) + p;
                            }
                        } else {
                            if(c.nodeType == Node.TEXT_NODE) {
                                cn += c.textContent.length;
                            } else {
                                cn += c.outerHTML.length;
                            }
                        }
                    }
                    return -1;
                }
            }
        }
        return _f(el, container, pos)
    }

    function findCharPosFromRangeDumb(el, container, pos) {
        // dumb code
        var p = 0;
        while (true) {
            let xx = findRangeFromCharPos(el, p);
            if(xx == null) { return -1;}
            else if(xx[0] == container && xx[1] == pos) {
                return p;
            }
            p++;
        }
        return -1
    }


    function getCaretIndex(element) {
        const isSupported = typeof window.getSelection !== "undefined";
        if (isSupported) {
            const selection = window.getSelection();
            if (selection.rangeCount !== 0) {
                const range = window.getSelection().getRangeAt(0);
                return findCharPosFromRange(element, range.endContainer, range.endOffset);
            }
        }
        return -1;
    }
    function getCaretBeginIndex(element) {
        let position = -1;
        const isSupported = typeof window.getSelection !== "undefined";
        if (isSupported) {
            const selection = window.getSelection();
            if (selection.rangeCount !== 0) {
                const range = window.getSelection().getRangeAt(0);
                return findCharPosFromRange(element, range.startContainer, range.startOffset);
            }
        }
        return -1;
    }

    function setCaret(el, beginCharNum, endCharNum) {
        var range = document.createRange()
        var sel = window.getSelection()
        
        range.selectNode(el)
        let r1 = findRangeFromCharPos(el, beginCharNum)
        let r2 = findRangeFromCharPos(el, endCharNum)
        range.setStart(r1[0], r1[1])
        range.setEnd(r2[0], r2[1])
        
        sel.removeAllRanges()
        sel.addRange(range)
    }

    function markCaretPos(t) {
        let el = document.getElementById("textedit");
        let idx = getCaretIndex(el);
        let idxb = getCaretBeginIndex(el);
        
        if(idx >= 0) {
            t = t.substring(0, idx) + "\0 r" + t.substring(idx);
            if(idx < idxb) {
                idxb += 3;
            }
        }
        if(idxb >= 0) {
            t = t.substring(0, idxb) + "\0 n" + t.substring(idxb);
        }
        return t;
    }
    function unmarkCaretPos(t) {
        let el = document.getElementById("textedit");
        let p1 = t.indexOf("\0 n");
        if(p1 >= 0) {
            t = t.substring(0, p1) + t.substring(p1+3);
        }
        let p2 = t.indexOf("\0 r");
        if(p2 >= 0) {
            t = t.substring(0, p2) + t.substring(p2+3);
        }
        if(p2 < p1) {
            p1 -= 3;
        }
        el.innerHTML = t;
        if(p1 >= 0 && p2 >= 0) {
            setCaret(el, p1, p2);
        }
        return t;
    }
    function cleanupHTML() {
        let el = document.getElementById("textedit");
        let text = el.innerHTML;
        text = markCaretPos(text);
        text = text.replaceAll("<ul>", "\0 u")
        text = text.replaceAll("</ul>", "\0 U")
        text = text.replaceAll("<li>", "\0 l")
        text = text.replaceAll("<br>", "\0 b")
        text = text.replaceAll("<br/>", "\0 b")
        text = text.replaceAll("</li>", "\0 L")
        text = text.replaceAll(/<[^>]*>/g, "") // strip tags
        text = text.replaceAll(/\s+/g, " ") // collapse whitespace;

        while(true) {
            let t2 = text.replaceAll(/\0 U ?\0 u/g, " ")
                         .replaceAll(/\0 u ?\0 U/g, " ")
                         .replaceAll(/\s+/g, " ") // collapse whitespace;
            if(t2 == text) break;
            text = t2;
        }
        text = text.replaceAll(/\0 l *\[([0-9\-]+) +([0-9\-]+)\]/g, "\0 l <i>[$1 $2]</i>"); 
        text = text.replaceAll("\0 u", "<ul>")
                .replaceAll("\0 U", "</ul>")
                .replaceAll("\0 l", "<li>")
                .replaceAll("\0 b", "<br>")
                .replaceAll("\0 L", "</li>\n" );

        // console.log(text)
        unmarkCaretPos(text);
    }

    function getProcessed() {
        let el = document.getElementById("textedit");
        function _f(el, depth) {
            let ret = "";
            if(el.nodeType == Node.TEXT_NODE) {
                // XXX : we shouldn't need this since all text will be within LI elements
                // and we will be collecting them from el.innerText
                // return el.textContent;
                return null;
            } else if(el.nodeName == "UL") {
                for(let n of el.childNodes) {
                    let x = _f(n, depth+1);
                    if(x !== null) ret += x + "\n";
                }
                return ret;
            } else if(el.nodeName == "LI") {
                for(let i=0; i < depth; i++) {
                    ret += " ";
                }
                ret += "-";
                ret += el.innerText;
                return ret;
            } else {
                if(el.hasChildNodes()) {
                    for(let n of el.childNodes) {
                        let x = _f(n, depth);
                        if(x !== null) ret += x + "\n";
                    }
                    return ret;
                } else {
                    return el.innerText;
                }
            }
        }
        return _f(el, 0);
    }
    
    function updateTextForCoordinates(nodenum, fixed, xp, yp) {
        // find starting position of li element
        let t = el.innerHTML;
        t = markCaretPos(t);
        let lipos = -1;
        for(let i=0; i<nodenum+1; i++) {
            lipos = t.indexOf("<li>", lipos+1);
        }
        if(lipos < 0) {
            // out of range
            return;
        }
        let clipos = t.indexOf("</li>", lipos);

        let tp = t.substring(lipos+4, clipos);
        // console.log(lipos, clipos, tp);
        tp = tp.replace(/^ *\[[0-9\- ]*\] */, "");
        if(fixed) {
            tp = "[" + xp + " " + yp + "]" + tp;
        }
        t = t.substring(0, lipos+4) + tp + t.substring(clipos);
        unmarkCaretPos(t);
    }

    function findSelectedNodes() {
        let t = markCaretPos(el.innerHTML);
        let r1 = t.indexOf("\0 n");
        let r2 = t.indexOf("\0 r");
        if(r1 > r2) {
            [r1, r2] = [r2, r1];
        }
        
        if(r1 < 0 || r2 < 0) {
            return [0, -1];
        }

        let l1 = -1, l2 = -1;
        let lipos = -1;
        let licnt = 0;
        while(true) {
            lipos = t.indexOf("<li>", lipos+1);
            if(lipos < 0) {
                break;
            }
            if(l1 < 0 && lipos > r1) {
                l1 = licnt - 1;
            }
            if(l2 < 0 && lipos > r2) {
                l2 = licnt - 1;
                break;
            }
            licnt++;
        }
        if(l1 < 0) {
            l1 = licnt - 1;
        }
        if(l2 < 0) {
            l2 = licnt - 1;
        }

        return [l1, l2];
    }

    function moveCursorToNode(nodenum) {
        // find starting position of li element
        let t = el.innerHTML;
        
        // don't mark caret, we will mark it ourselves here
        let lipos = -1;
        for(let i=0; i<nodenum+1; i++) {
            lipos = t.indexOf("<li>", lipos+1);
        }
        if(lipos < 0) {
            // out of range
            return;
        }
        let clipos = t.indexOf("</li>", lipos);
        t = t.substring(0, clipos) + "\0 n\0 r" + t.substring(clipos)
        unmarkCaretPos(t)

        // scroll to caret
        const isSupported = typeof window.getSelection !== "undefined";
        if (isSupported) {
            const selection = window.getSelection();
            let n = selection.getRangeAt(0).startContainer;
            let l = 0; let t = 0;
            while(n != el && n != null) {
                if(n.nodeType != Node.TEXT_NODE) {
                    l += n.offsetLeft; t += n.offsetTop;
                }
                n = n.parentElement;
            }
            el.scroll(l, t);
        }
    }

    $(document).ready(function() {
        el = document.getElementById("textedit");
        cleanupHTML();
    
        on("keydown", (ev) => {
            if(ev.which == 9) {
                cleanupHTML();
                // tab
                ev.preventDefault();

                let t = el.innerHTML;
                t = markCaretPos(t);
                t = t.split("\n");
                var p1 = -1, p2 = -1;
                for(var i=0; i<t.length; i++) {
                    let l = t[i];
                    if(l.indexOf("\0 n") >= 0 || l.indexOf("\0 r") >= 0) {
                        if(p1 == -1) p1 = i;
                        else if(p2 == -1) p2 = i;
                    }
                }
                if(p1 == -1) { p1 = p2;}
                if(p2 == -1) { p2 = p1;}
                if(p1 >= 0 && p2 >= 0) {
                    for(var i=p1; i<= p2; i++) {
                        if(ev.shiftKey) {
                            // XXX : this isn't that correct, since we shouldn't open the last 'ul' if we already hit the bottom level
                            t[i] = t[i].replaceAll("<li>", "</ul><li>") + "<ul>";
                        } else {
                            t[i] = t[i].replaceAll("<li>", "<ul><li>") + "</ul>";
                        }
                    }
                }
                t = t.join("\n");
                unmarkCaretPos(t);
                return;
            }

            
            // XXX : if we re pushing a key that don't affect text contents, there is no point cleaning up HTML
            if( ["Alt", "AltGraph", "CapsLock", "Control", "Fn", "FnLock", "Hyper", "Meta", "NumLock", 
                            "ScrollLock", "Shift", "Super", "Symbol", "SymbolLock",
                            "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp",
                            "End", "Home", "PageDown", "PageUp" ].includes(ev.key) === false ) {
                // we need the '<li>' element if we typed something but the current cursor is not part of the current text
                let p = getCaretBeginIndex(el);
                if(p >= 0) {
                    let [celement, cpos] = findRangeFromCharPos(el, p);
                    function foundLi(elem) {
                        if(elem === el || elem === null) {
                            return false;
                        } else if(elem.tagName == "LI" || elem.tagName == "li") {
                            return true;
                        } else {
                            return foundLi(elem.parentElement);
                        }
                    }
                    if(!foundLi(celement)) {
                        let t = el.innerHTML;
                        t = markCaretPos(t);
                        t = t.replace("\0 n", "<LI>\0 n</LI>");
                        unmarkCaretPos(t);
                    }
                }
                cleanupHTML();
            }
        });
    });
    return {
        getProcessed, get, set, getPos, setPos, on, moveCursorToNode, updateTextForCoordinates, findSelectedNodes
    };
}());
