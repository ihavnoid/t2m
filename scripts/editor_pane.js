// editor pane encapsulation

editorPane = (function() {
    var nodeColors = {};
    var processed = "";
    function setNodeColor(index, color) {
        // console.log(color);
        color = color.replace(/^\s*#|\s*$/g, "");
        if(3 == color.length) {
            color = color.replace(/(.)/g, "$1$1");
        }
        let r = parseInt(color.substr(0, 2), 16);
        let g = parseInt(color.substr(2, 2), 16);
        let b = parseInt(color.substr(4, 2), 16);
        color = "#" + (Math.floor(384 + r/2)).toString(16).substr(1) +
            (Math.floor(384 + g/2)).toString(16).substr(1) + (Math.floor(384 + b/2)).toString(16).substr(1)
        
        // console.log(color);
        nodeColors[index] = color; 
    }

    // performance-wise not so good :( need to fix
    function indexOfRegex(s, pattern, startpos) {
        let start = -1, length = 0;
        s.substring(startpos).replace(pattern, (match, offset, string, groups) => {
            start = offset;
            length = match.length; 
        });
        if(start < 0) {
            return [-1, length];
        } else {
            return [start + startpos, length];
        }
    }

    var highlightSelected = 0;
    var compositionRunning = false;

    var observer = null;
    function on(ev, f) {
        $("#textedit").on(ev, f);
    }
    function observe(func) {
        let options = {subtree:true, childList:true, attributes: true, characterData: true};
        observer = new MutationObserver(
            function(mutationList, observer) {
                let refreshNeeded = refresh();
                if(refreshNeeded) {
                    func();
                }
            }
        )
        // The purpose of this code is so that we don't rebuild our text when composition is running.
        // if we rebuild our contents while composition is running (e.g., typing syllables in Korean)
        // the refresh routine will try to move the caret and we will end up getting corrupted letters.
        // instead, we should only do the rebuilding when we have no composition running.
        on("compositionstart", () => { compositionRunning = true; });
        on("compositionend", () => { compositionRunning = false; });
        observer.observe($("#textedit").get(0), options);
    }
    // return true if there was a change on the processed contents, which means we have to redraw the mindmap
    // (instead of just cosmetic changes due to any external events)
    function refresh() {
        if(!compositionRunning) {
            if(observer != null) {
                observer.disconnect();
            }
            let success = cleanupHTML();
            if(observer != null) {
                let options = {subtree:true, childList:true, attributes: true, characterData: true};
                observer.observe($("#textedit").get(0), options);
            }
            return success;
        } else {
            return false;
        }
    }
    function get() {
        return el.innerHTML;
    }
    function set(x) {
        el.innerHTML = x; // this will invoke cleanupHTML
        refresh();
    }
    function getPos() {
        return [getCaretBeginIndex(el), getCaretIndex(el)];
    }
    function setPos(p1, p2) {
        setCaret(el, p1, p2);
    }

    function outerHeaderLength(el) {
        return el.outerHTML.indexOf(">"+el.innerHTML) + 1
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
                let outer = outerHeaderLength(el);
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
                            return _f(cel, pos)
                        }
                    }
                }
            }
            return [el, el.childNodes.length]
        }
        return _f(el, pos + outerHeaderLength(el));
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
                                return cn + outerHeaderLength(c) + p;
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

        let [n1pos, n2pos] = findSelectedNodes();

        if(!highlightSelected) {
            n1pos = -1; n2pos = -1;
        }
        let t = el.innerHTML;
        // console.log("begin", text)
        t = markCaretPos(t);
        t = t.replace(/<ul[^>]*>/gi, "\0 u");
        t = t.replace(/<\/ul>/gi, "\0 U");
        t = t.replace(/<li[^>]*>/gi, "\0 l");
        t = t.replace(/<\/?br\/?>/gi, "\0 b");
        t = t.replace(/<\/li>/gi, "\0 L");
        t = t.replace(/<[^>]*>/g, ""); // strip tags
        t = t.replace(/\s+/g, " "); // collapse whitespace;

        let tout = "";
        let copyMode = false;
        let ptr = 0;
        let nodeno = 0;
        let level = 0;
        let tagOpen = false;
        let closeUlOnNextLi = false;
        let lastc = '\0';
        function _li() {
            if(nodeno >= n1pos && nodeno <= n2pos) { 
                tout += "<li class=\"selected_node level"+Math.min(level, 8)+"\">"
            } else {
                tout += "<li class=\"level"+Math.min(level, 8)+"\">"
            }
        }
        let accumText = "";
        let firstLine = true;
        function processCode(l) {
            if(firstLine) {
                if(nodeno in nodeColors) {
                    cl = " style=\"background-color:"+nodeColors[nodeno]+";\" ";
                } else {
                    cl = " ";
                }
                if(l.match(/^ *(\[(?:[0-9\- ]|\0 n|\0 r)*\])(.*)$/)) {
                    l = l.replace(/^ *(\[(?:[0-9\- ]|\0 n|\0 r)*\])(.*)$/, "<span class=\"pos\">$1</span><span"+cl+"class=\"header\">$2</span>");
                } else {
                    l = "<span"+cl+"class=\"header\">"+l+"</span>";
                }
            } else {
                l = "<span class=\"comment\">" + l + "</span>";
            }
            return l;
        }

        while(true) {
            const p = t.indexOf("\0 ", ptr);
            if( p < 0) {
                if(copyMode){
                    tout += t.substring(ptr);
                }
                break;
            }
            if(copyMode){
                let l = t.substring(ptr, p);
                accumText += l;
            }
            const c = t.charAt(p+2);
            if(c == "u") {
                level++;
                tout += "<ul>";
            } else if(c == "U") {
                level--;
                tout += "</ul>";
            } else if(c == "l") {
                if(tagOpen) {
                    tout += "</li>\n";
                    nodeno++;
                    if(closeUlOnNextLi) {
                        closeUlOnNextLi = false;
                        tout += "</ul>";
                        level--;
                    }
                }
                tagOpen = true;
                if(level == 0) {
                    tout += "<ul>";
                    level++;
                    closeUlOnNextLi = true;
                }
                _li();
                firstLine = true;
                copyMode = true;
            } else if(c == "L") {
                if(tagOpen) {
                    tout += processCode(accumText);
                    tout += "</li>\n";
                    nodeno++;
                    accumText = "";
                    copyMode = false;
                    if(closeUlOnNextLi) {
                        closeUlOnNextLi = false;
                        tout += "</ul>";
                        level--;
                    }
                }
                tagOpen = false;
            } else if(c == "b") {
                if(tagOpen) {
                    tout += processCode(accumText);
                    accumText = "";
                    tout += "<br>";
                    firstLine = false;
                }
            } else if(c == "n") {
                accumText += "\0 n"; 
            } else if(c == "r") {
                accumText += "\0 r"; 
            }
            lastc = c;
            ptr = p + 3;
        }

        unmarkCaretPos(tout);
        return updateProcessed();
    }

    function getProcessed() {
        return processed;
    }
    function updateProcessed() {
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
                for(let i=0; i < depth-1; i++) {
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
        let t = _f(el, 0);
        if(t != processed) {
            processed = t;
            return true;
        } else {
            return false;
        }
    }
    
    function updateTextForCoordinates(nodenum, fixed, xp, yp) {
        // find starting position of li element
        let t = el.innerHTML;
        t = markCaretPos(t);
        let lipos = -1;
        for(let i=0; i<nodenum+1; i++) {
            [lipos, len] = indexOfRegex(t, /<li[^>]*>/i, lipos+1);
        }
        if(lipos < 0) {
            // out of range
            return;
        }
        let clipos = t.indexOf("</li>", lipos);

        let tp = t.substring(lipos+len, clipos);

        // preserve BR before stripping tags
        tp = tp.replaceAll("\n", "");
        tp = tp.replaceAll("<br>", "\n");

        // strip tags
        tp = tp.replaceAll(/<[^>]*>/g, "");

        // console.log(lipos, clipos, tp);
        
        // we need to deal with caret escape codes
        let p1 = tp.indexOf("\0 n");
        if(p1 >= 0) {
            tp = tp.substr(0, p1) + tp.substr(p1+3);
        }
        let p2 = tp.indexOf("\0 r");
        if(p2 >= 0) {
            tp = tp.substr(0, p2) + tp.substr(p2+3);
        }
        let len_prev = tp.length; 

        tp = tp.replace(/^ *\[[0-9\- ]*\] */, "");
        let len_new = tp.length; 
        if(p1 >= 0){
            p1 -= len_prev - len_new;
            if(p1 < 0) p1 = 0;
        } if(p2 >= 0) {
            p2 -= len_prev - len_new;
            if(p2 < 0) p2 = 0;
        }

        if(fixed) {
            let header = "[" + Math.round(xp) + " " + Math.round(yp) + "] ";
            tp = header + tp;
            if(p1 >= 0) p1 += header.length;
            if(p2 >= 0) p2 += header.length;
        }
        if(p1 >= 0) {
            tp = tp.substring(0, p1) + "\0 n" + tp.substring(p1);
        }
        if(p2 >= 0) {
            if(p2 >= p1) { p2 += 3; }
            tp = tp.substring(0, p2) + "\0 r" + tp.substring(p2);
        }
        tp = tp.replaceAll("\n", "<br>");
        t = t.substring(0, lipos+len) + tp + t.substring(clipos);
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
            t = t.substring(lipos+1);
            r1 -= lipos+1;
            r2 -= lipos+1;
            lipos = t.search(/<li[^>]*>/);
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
            [lipos, len] = indexOfRegex(t, /<li[^>]*>/i, lipos+1);
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

        highlightSelected++;
        cleanupHTML();
        setTimeout(() => {
            highlightSelected--;
            if(highlightSelected == 0) {
                cleanupHTML();
            }
        }, 200);
    }

    $(document).ready(function() {
        el = document.getElementById("textedit");
        cleanupHTML();
        
        function findCnt(str, pattern) {
            let idx = -1;
            for(let i=0; ; i++) {
                idx = str.indexOf(pattern, idx+1);
                if(idx < 0) {
                    return i;
                }
            }
        } 
        on("keydown", (ev) => {
            if(ev.which == 9) {
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
                    if(ev.shiftKey) {
                        let indent_level = 0;
                        for(var i=0; i<p1; i++) {
                            indent_level += findCnt(t[i], "<ul>") - findCnt(t[i], "</ul>");
                        }
                        for(var i=p1; i<= p2; i++) {
                            let [first_li, len] = indexOfRegex(t[i], /<li[^>]*>/i, 0);
                            if(first_li >= 0) {
                                let my_il = indent_level + findCnt(t[i].substring(0, first_li), "<ul>") - findCnt(t[i].substring(0, first_li), "</ul>");
                                if(my_il > 1) {
                                    t[i] = t[i].replaceAll(/<li[^>]*>/gi, "</ul><li>") + "<ul>";
                                }
                            }
                            indent_level += findCnt(t[i], "<ul>") - findCnt(t[i], "</ul>");
                        }
                    } else {
                        for(var i=p1; i<= p2; i++) {
                            t[i] = t[i].replaceAll(/<li[^>]*>/gi, "<ul><li>") + "</ul>";
                        }
                    }
                }
                t = t.join("\n");
                unmarkCaretPos(t);
                return;
            }
            
            /*
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
            }
            */
        });
    });
    return {
        getProcessed, get, set, getPos, setPos, on, moveCursorToNode, updateTextForCoordinates, findSelectedNodes, observe, setNodeColor, refresh
    };
}());
