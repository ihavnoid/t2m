// editor pane encapsulation

__cb_pane = (te, tem, w) => {};
function callbackFromPane(te, tem, w) {
    __cb_pane(te, tem, w);
}

editorPane = (function() {
    var debugMode = false;
    var nodeColors = {};
    var processed = "";
    var documentEditable = true;
    var lastPressedKey = "";
    var el = null;
    var elm = null;
    var selfWindow = window;
    var unfloatCb = null;
    var all_events = [];

    function escape_html(x) {
       /* 
        var rules = [
            { expression: /&/g, replacement: '&amp;'  }, // keep this rule at first position
            { expression: /</g, replacement: '&lt;'   },
            { expression: />/g, replacement: '&gt;'   },
            { expression: /^ /g, replacement: '&nbsp;'   }, // first space matches with nbsp
            // { expression: /"/g, replacement: '&quot;' },
            // { expression: /'/g, replacement: '&#039;' } // or  &#39;  or  &#0039;
                                                        // &apos;  is not supported by IE8
                                                        // &apos;  is not defined in HTML 4
        ];
        var result = x;
        for (var i = 0; i < rules.length; ++i) {
            var rule = rules[i];
            result = result.replace(rule.expression, rule.replacement);
        }
        return result;
        */
        let n = document.createElement("pre")
        n.innerText = x;
        let c = n.innerHTML;
        let c2 = c.replaceAll("<br>", "\n");
       
        if (c2.replaceAll(/<[^>]*>/g, "") != c2) {
            console.log("*** unstripped tags from <pre>", c2);
        }
        return c2;
    }

    function findEscapedPosOnString(s, upos) {
        // s : string with all the html escape characters (e.g., "&nbsp;")
        // upos : character position if we un-escaped the characters
        // returns character position if we escaped the characters

        // e.g., findEscapedPosOnString("&nbsp;&amp;", 1) = 5
        let sp = 0;
        let skip = false;

        for(let i=0; i < s.length ; i++) {
            if(upos == sp) return i;
            if(s.charAt(i) == '&') {
                skip = true;
            } else if(s.charAt(i) == ';') {
                skip = false;
                sp++;
            } else {
                if(!skip) {
                    sp++;
                }
            }
        }
        return s.length;
    }

    function findUnescapedPosOnString(s, pos) {
        // s : string with all the html escape characters (e.g., "&nbsp;")
        // pos : character position if we escaped the characters
        // returns character position if we un-escaped the characters
        // e.g., findUnescapedPosOnString("&nbsp;&amp;", 5) = 1

        let sp = 0;
        let skip = false;
        for(let i=0; i<pos; i++) {
            if(s.charAt(i) == '&') {
                skip = true;
            } else if(s.charAt(i) == ';') {
                skip = false;
                sp++;
            } else {
                if(!skip) {
                    sp++;
                }
            }
        }
        return sp;
    }

    function getWindow() {
        if(selfWindow != window && selfWindow.closed) {
            __cb_pane(
                document.getElementById("textedit"),
                document.getElementById("textedit_message"),
                window
            );
            unfloatCb();
        }
        return selfWindow;
    }
    function startFloatMode(unfloat_cb) {
        __cb_pane = (te, tem, w) => {
            // this function will be called by the popup itself as the callback,
            // sending out the textElement and textElement message element
            let pc = "";
            let pm = "";
            if(el != null) {
                // un-attach all events
                for(let [ev, f] of all_events) {
                    el.removeEventListener(ev, f);
                }
                pc = el.innerHTML;
            }
            if(elm != null) {
                pm = elm.innerHTML;
            }
            el = te;
            elm = tem;
            selfWindow = w;
            el.innerHTML = pc;
            for(let [ev, f] of all_events) {
                el.addEventListener(ev, f);
            }
            if(observer != null) {
                observer.disconnect();
                let options = {subtree:true, childList:true, attributes: true, characterData: true};
                observer.observe(el, options);
            }
            setEditable(documentEditable, pm);
        };
        unfloatCb = unfloat_cb;
        let w = window.open("edit_popup.html", "floatpane", "popup")

        let poll_window_exist = () => {
            if(getWindow() != window) {
                setTimeout(poll_window_exist, 500);
            }
        }
        setTimeout(poll_window_exist, 500);
    }


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
        all_events.push([ev, f]);
        if(el != null) {
            el.addEventListener(ev, f);
        }
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
        observer.observe(el, options);
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
                observer.observe(el, options);
            }
            return success;
        } else {
            return updateProcessed();
        }
    }
    function get() {
        return el.innerHTML;
    }
    function set(x) {
        el.innerHTML = x; // this will invoke cleanupHTML
        lastPressedKey = ""; // this 'change' wasn't invoked by a key input
        refresh();
    }
    function getPos() {
        return [getCaretBeginIndex(el), getCaretIndex(el)];
    }
    function setPos(p1, p2) {
        setCaret(el, p1, p2);
    }

    function outerHeaderLength(el) {
//        return el.outerHTML.indexOf(">"+el.innerHTML) + 1
        return el.outerHTML.indexOf(">") + 1
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
            
                // XXX : don't use textContent.  The contents don't match the html contents.
                let t = el.innerHTML;
                for(let i = 0; i < el.childNodes.length; i++) {
                    var cel = el.childNodes[i]
                    if(cel.nodeType == Node.TEXT_NODE) {
                        let celLength = t.indexOf("<");
                        if(celLength < 0) {
                            celLength = t.length;
                        }
                        if(pos > celLength) {
                            // console.log("strip", cel.textContent.length, cel.textContent)
                            pos -= celLength;
                            t = t.substring(celLength);
                        } else {
                            return [cel, findUnescapedPosOnString(t, pos)];
                        }
                    } else {
                        if(pos >= cel.outerHTML.length) {
                            // console.log("strip", pos, cel.outerHTML.length, cel.outerHTML)
                            pos -= cel.outerHTML.length
                            t = t.substring(cel.outerHTML.length);
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
        if(el == container) {
            if( el.nodeType == Node.TEXT_NODE ) {
                return pos;
            } else {
                var cn = 0;

                // XXX : don't use textContent.  The contents don't match the html contents.
                let t = el.innerHTML;
                for(var i=0; i<pos; i++) {
                    var c = el.childNodes[i]
                    if(c.nodeType == Node.TEXT_NODE) {
                        let textContentLength = t.indexOf('<');
                        if(textContentLength < 0) {
                            textContentLength = t.length;
                        }
                        cn += textContentLength;
                        t = t.substring(textContentLength);
                    } else {
                        cn += c.outerHTML.length;
                        t = t.substring(c.outerHTML.length);
                    }
                }
                return cn;
            }
        } else {
            if( el.nodeType == Node.TEXT_NODE) {
                return -1;
            } else {
                var cn = 0;

                // XXX : don't use textContent.  The contents don't match the html contents.
                let t = el.innerHTML;
                for(var i=0; i<el.childNodes.length; i++) {
                    var c = el.childNodes[i];
                    var p = findCharPosFromRange(c, container, pos);
                    if( p >= 0 ) {
                        if(c.nodeType == Node.TEXT_NODE) {
                            // if this is the case, 'p' isn't the right value
                            // since the offset should be the escaped html
                            // while the pos is the unescaped html position.
                            // let's do things a little backwards...
                            p = findEscapedPosOnString(t, pos);
                            return cn + p;
                        } else {
                            return cn + outerHeaderLength(c) + p;
                        }
                    } else {
                        if(c.nodeType == Node.TEXT_NODE) {
                            let textContentLength = t.indexOf('<');
                            if(textContentLength < 0) {
                                textContentLength = t.length;
                            }
                            cn += textContentLength;
                            t = t.substring(textContentLength);
                        } else {
                            cn += c.outerHTML.length;
                            t = t.substring(c.outerHTML.length);
                        }
                    }
                }
                return -1;
            }
        }
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
        const isSupported = typeof getWindow().getSelection !== "undefined";
        if (isSupported) {
            const selection = getWindow().getSelection();
            if (selection.rangeCount !== 0) {
                const range = getWindow().getSelection().getRangeAt(0);
                return findCharPosFromRange(element, range.endContainer, range.endOffset);
            }
        }
        return -1;
    }
    function getCaretBeginIndex(element) {
        let position = -1;
        const isSupported = typeof getWindow().getSelection !== "undefined";
        if (isSupported) {
            const selection = getWindow().getSelection();
            if (selection.rangeCount !== 0) {
                const range = getWindow().getSelection().getRangeAt(0);
                return findCharPosFromRange(element, range.startContainer, range.startOffset);
            }
        }
        return -1;
    }

    function setCaret(el, beginCharNum, endCharNum) {
        var range = document.createRange()
        var sel = getWindow().getSelection()

        range.selectNode(el)
        let r1 = findRangeFromCharPos(el, beginCharNum)
        let r2 = findRangeFromCharPos(el, endCharNum)
        range.setStart(r1[0], r1[1])
        range.setEnd(r2[0], r2[1])

        sel.removeAllRanges()
        sel.addRange(range)
    }

    function markCaretPos(t) {
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
    function unmarkCaretPos(t, skip_if_no_content_update = false) {
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
        if(skip_if_no_content_update) {
            if(el.innerHTML != t) {
                el.innerHTML = t;
                if(p1 >= 0 && p2 >= 0) {
                    setCaret(el, p1, p2);
                }
            }
        } else {
            if(el.innerHTML != t) {
                el.innerHTML = t;
            }
            if(p1 >= 0 && p2 >= 0) {
                setCaret(el, p1, p2);
            }
        }

        return t;
    }
    function cleanupHTML() {
        let [n1pos, n2pos] = findSelectedNodes();

        if(!highlightSelected) {
            n1pos = -1; n2pos = -1;
        }
        let t = el.innerHTML;
        t = markCaretPos(t);
        if(debugMode) {
            console.log("begin", t)
        }
        t = t.replace(/<ul[^>]*>/gi, "\0 u");
        t = t.replace(/<\/ul>/gi, "\0 U");
        t = t.replace(/<li[^>]*>/gi, "\0 l");
        t = t.replace(/<br[^>]*>/gi, "\0 b");
        t = t.replace(/<\/li>/gi, "\0 L");
        t = t.replace(/<[^>]*>/g, ""); // strip tags
        t = t.replace(/\s+/g, " "); // collapse whitespace;

        let tout = "";
        let ptr = 0;
        let nodeno = 0;
        let level = 0;
        let lastLiLevel = 0;
        let tagOpen = false;
        let closeUlOnNextLi = false;
        let accumText = "";
        let firstLine = true;

        // HACK : If the caret is outside of the legal region, how it should be handled depends on the
        // last key event.
        // - if we typed 'enter' then we should be creating a new line, and thus should create a new bullet on that location.
        // - if we typed 'backspace' then we should be removing the current bullet.  Move caret BACK to the next legal position.
        //   if there is no legal position, act as if we hit 'enter'.
        // - if we typed 'delete' then we should be removing the current bullet.  Move caret FORWARD to the next legal position.
        //   if there is no legal position, act as if we hit 'enter'.
        // - for everything else, we won't do anything related to carets
        let pk = lastPressedKey;
        if(pk == "Del" || pk == "Clear" || pk == "Cut" || pk == "EraseEof") {
            pk = "Delete";
        } 
        if(pk != "Enter" && pk != "Delete" && pk != "Backspace") {
            pk = "";
        }
        
        // console.log("Before handling cleanup (pk=",pk);
        // console.log(t);
        // if true, we should append the caret on the next legal LI
        let nCaretPending = false;
        let rCaretPending = false;
        function processCode(l) {
            if(firstLine) {
                if(l == "" || l == "\0 n" || l == "\0 r" || l == "\0 n\0 r" || l == "\0 r\0 n") { l = l; }
                if(nodeno in nodeColors) {
                    cl = " style=\"background-color:"+nodeColors[nodeno]+";\" ";
                } else {
                    cl = " ";
                }
                if(l.match(/^(?:&nbsp;|\s|\0 n|\0 r)*(\[(?:[0-9\- ]|\0 n|\0 r)*\])(.*)$/)) {
                    l = l.replace(/^((?:&nbsp;|\0 n|\0 r|\s)*)(\[(?:[0-9\- ]|\0 n|\0 r)*\])(.*)$/, "<span class=\"pos\">$1$2</span><span"+cl+"class=\"header\">$3</span>");
                } else {
                    l = "<span"+cl+"class=\"header\">"+l+"</span>";
                }
            } else {
                if(l == "" || l == "\0 n" || l == "\0 r" || l == "\0 n\0 r" || l == "\0 r\0 n") { return "" + l; }
                l = "<span class=\"comment\">" + l + "</span>";
            }
            return l;
        }
        function processCommand(c) {
            if(c == "u") {
                if(tagOpen) {
                    processCommand('L');
                }
                level++;
                tout += "<ul>";
            } else if(c == "U") {
                if(tagOpen) {
                    processCommand('L');
                }
                level--;
                tout += "</ul>";
            } else if(c == "l") {
                if(tagOpen) {
                    processCommand('L');
                }
                if(level == 0) {
                    processCommand('u');
                    closeUlOnNextLi = true;
                }
                lastLiLevel = level;
                if(nodeno >= n1pos && nodeno <= n2pos) {
                    tout += "<li class=\"selected_node level"+Math.min(level, 8)+"\">"
                } else {
                    tout += "<li class=\"level"+Math.min(level, 8)+"\">"
                }

                firstLine = true;
                tagOpen = true;

                if(nCaretPending) {
                    tout += "\0 n";
                    nCaretPending = false;
                }
                if(rCaretPending) {
                    tout += "\0 r";
                    rCaretPending = false;
                }
            } else if(c == "L") {
                if(tagOpen) {
                    tout += processCode(accumText);
                    tout += "</li>\n";
                    nodeno++;
                    accumText = "";
                    if(closeUlOnNextLi) {
                        closeUlOnNextLi = false;
                        processCommand('U');
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
                if(tagOpen) {
                    accumText += "\0 n";
                } else {
                    if(pk == "Delete") {
                        nCaretPending = true;
                    } else if(pk == "Backspace") {
                        let pos = tout.lastIndexOf("</li>");
                        if(pos < 0) {
                            nCaretPending = true;
                        } else {
                            tout = tout.substring(0, pos) + "\0 n" + tout.substring(pos);
                        }
                    } else if(pk == "Enter") {
                        processCommand('l');
                        processCommand('L');
                        processCommand('l');
                        accumText += "\0 n";
                    } else {
                        tout += "\0 n";
                    }
                }
            } else if(c == "r") {
                if(tagOpen) {
                    accumText += "\0 r";
                } else {
                    if(pk == "Delete") {
                        rCaretPending = true;
                    } else if(pk == "Backspace") {
                        let pos = tout.lastIndexOf("</li>");
                        if(pos < 0) {
                            rCaretPending = true;
                        } else {
                            tout = tout.substring(0, pos) + "\0 r" + tout.substring(pos);
                        }
                    } else if (pk == "Enter") {
                        processCommand('l');
                        processCommand('L');
                        processCommand('l');
                        accumText += "\0 r";
                    } else {
                        tout += "\0 r";
                    }
                }
            }
        }

        while(true) {
            const p = t.indexOf("\0 ", ptr);
            if( p < 0) {
                if(tagOpen){
                    tout += t.substring(ptr);
                }
                break;
            }
            if(tagOpen){
                let l = t.substring(ptr, p);
                accumText += l;
            }
            const c = t.charAt(p+2);
            processCommand(c);
            ptr = p + 3;
        }
        // Handling cursor placed outside of a node:
        if(nCaretPending || rCaretPending) {
            processCommand('l'); 
            if(nCaretPending) accumText += "\0 n";
            if(rCaretPending) accumText += "\0 r";
            processCommand('L'); 
        }
        while(true){
            let tout2 = tout.replaceAll("</ul><ul>", "");
            tout2 = tout2.replaceAll("<ul></ul>", "");
            if(tout == tout2) { break; }
            tout = tout2;
        }

        if(debugMode) {
            console.log("After handling cleanup");
            console.log(tout);
        }

        unmarkCaretPos(tout, true);

        if(debugMode) {
            console.log("re-read", markCaretPos(el.innerHTML));
        }
        return updateProcessed();
    }

    function getProcessed() {
        return processed;
    }
    function updateProcessed() {
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
                ret += "\0-";
                ret += el.innerText;
                ret = ret.replaceAll("\n", "\n\0+")
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

    function updateTextForCoordinates(changedesc) {
        if(!documentEditable) return;
        
        function _do(t, nodenum, fixed, xp, yp) {
            // find starting position of li element
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

            return t;
        }
        let t = el.innerHTML;
        t = markCaretPos(t);
        for(let x of changedesc) {
            // console.log(x);
            t = _do(t, x.nodenum, x.fixed, x.xp, x.yp);
        }

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
        const isSupported = typeof getWindow().getSelection !== "undefined";
        if (isSupported) {
            const selection = getWindow().getSelection();
            let n = selection.getRangeAt(0).startContainer;
            let l = 0; let t = -100;
            while(n != el && n != null) {
                if(n.nodeType != Node.TEXT_NODE) {
                    l += n.offsetLeft; t += n.offsetTop;
                }
                if(n.nodeName == "LI") {
                    break;
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

    function setEditable(editable, message) {
        if(!message) {
            message = "";
        }

        documentEditable = editable;
        el.contentEditable = editable;
        if(editable) {
            el.style.backgroundColor = "#ffffff";
            elm.style.visibility = "hidden";
        } else {
            el.style.backgroundColor = "#d0d0d0";
            elm.innerHTML = message;
            elm.style.visibility = "visible";
        }
    }
    function isEditable() {
        return documentEditable;
    }
    $(document).ready(function() {
        el = document.getElementById("textedit");
        elm = document.getElementById("textedit_message");
        for(let [ev, f] of all_events) {
            el.addEventListener(ev, f);
        }
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
            lastPressedKey = ev.key;
            if(lastPressedKey == "Enter" && ev.ctrlKey) {
                lastPressedKey = ""; // ctrl-enter is simple "refresh"
            }
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
        getProcessed, get, set, getPos, setPos, on, moveCursorToNode, updateTextForCoordinates, findSelectedNodes, observe, setNodeColor, refresh,
        setEditable, isEditable,
        startFloatMode
    };
}());
