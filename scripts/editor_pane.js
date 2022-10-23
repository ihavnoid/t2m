// editor pane encapsulation

editorPane = (function() {

    function getProcessed() {
        return $("#textedit").val();
    }

    function get() {
        return $("#textedit").val();
    }
    function set(x) {
        $("#textedit").val(x);
    }

    function getPos() {
        return [$("#textedit").get(0).selectionStart, $("#textedit").get(0).selectionEnd];
    }

    function setPos(p1, p2) {
        $("#textedit").get(0).selectionStart = p1;
        $("#textedit").get(0).selectionEnd = p2;
    }
    function on(evname, f) {
        return $("#textedit").on(evname, f);
    }

    function scrollToLine(line) {
        gg = parseInt($("textedit").css("line-height"))
        $("#textedit").scrollTop(line * gg)
    }

    function updateTextForCoordinates(nodenum, fixed, xp, yp) {
        let g = get().split(/\n/)
        let x = ""
        let pos = 0
        
        let [sel_begin, sel_end] = editorPane.getPos();
        let charpos = 0
        let c = nodenum;

        for (let f = 0; f <= c; f++) {
            charpos += g[f].length + 1
            if(!g[f].match(/^\s*-/)) {
                // increment line number for each skipped line
                // see text2mindmap function
                c++
            }
        }

        let l = g[c]
        charpos -= l.length + 1

        let stripped = 0
        while(l.charAt(pos) == " ") {
            pos++;
            x += " "
        }
        if(l.charAt(pos) != "-") {
            return
        }
        while(l.charAt(pos) == "-") {
            pos++;
            x += "-"
        }
        while(l.charAt(pos) == " ") {
            pos++; stripped++;
        }

        if ("[" == l.charAt(pos)) {
            let pos2 = l.indexOf("]", pos) + 1;
            stripped += pos2 - pos;
            pos = pos2
            while(l.charAt(pos) == " ")
            {
                pos++; stripped++;
            }
        }

        let newarr = " "
        if(fixed) {
            newarr = " [" + Math.floor(xp) + " " + Math.floor(yp) + "] "
        }
        g[c] = x + newarr + l.substring(pos)
        let text = g.join("\n")
        editorPane.set(text)
    
        if(sel_end - charpos >= x.length && sel_end - charpos < x.length + stripped) {
            sel_end = charpos + x.length
        } else if (sel_end - charpos >= x.length + stripped) {
            sel_end += newarr.length - stripped
        }

        if(sel_begin - charpos >= x.length && sel_begin - charpos < x.length + stripped) {
            sel_begin = charpos + x.length
        } else if (sel_begin - charpos >= x.length + stripped) {
            sel_begin += newarr.length - stripped
        }
        setPos(sel_begin, sel_end);
    }

    function shiftIndent(shiftOut) {
        let [g, c] = getPos();

        if (g <= c) {
            let h = get();
            let e = h.lastIndexOf("\n", g - 1);
            let lastBreak = h.indexOf("\n", c - 1);
            lastBreak < c && (lastBreak = c);
            let d = h.substring(e + 1, lastBreak).split("\n");
            let nbr = 0;
            let f = 0;
            if (shiftOut) {
                for(let i = 0; i < d.length; i++) {
                    if(d[i].length >= 2 && d[i].substring(0, 2) == "  ") {
                        d[i] = d[i].substring(2)
                        nbr += 2
                    } else if(d[i].length > 0 && d[i].substring(0, 1) == " ") {
                        d[i] = d[i].substring(1)
                        nbr += 1
                    }
                }
                f = d.join("\n")
            } else {
                f = "  " + d.join("\n  ");
                nbr = d.length * 2;
            }
            set(h.substring(0, e + 1) + f + h.substring(lastBreak, h.length));
            let s = shiftOut ? Math.max(e+1, g - Math.min(2, nbr)) : g + Math.min(2, nbr);
            e = shiftOut ? c - nbr : c + nbr
            setPos(s, e);
        }
    }

    function insertBr() {
        let [g, c] = getPos();
        let h = get();
        let e = h.lastIndexOf("\n", g - 1)
        let aa = "\n";
        for (c = e+1; c <= h.length; c++) {
            f = h.charAt(c)
            if (" " == f || "-" == f) {
                aa += " ";
            } else  {
                break;
            }
        }
        let g2 = g;
        while(g >= 0) {
            if(h.charAt(g-1) == " " || h.charAt(g-1) == "-") {
                g--;
            } else if(h.charAt(g-1) == "\n") {
                break;
            } else {
                g = g2;
                break;
            }
        }
        while(g2 < h.length) {
            if(h.charAt(g2) == " " || h.charAt(g2) == "-") {
                g2++;
            } else {
                break;
            }               
        }
        set(h.substring(0, g) + aa + h.substring(g2, h.length));
        setPos(g + aa.length, g + aa.length);
    }
    function insertNewLine() {
        let [g, c] = getPos();
        let h = get();
        let e = h.lastIndexOf("\n", g - 1)
        let aa = "\n";
        for (c = e+1; c <= h.length; c++) {
            f = h.charAt(c)
            if (" " == f || "-" == f) {
                aa += f;
            } else  {
                break;
            }
        }
        let g2 = g;
        while(g >= 0) {
            if(h.charAt(g-1) == " " || h.charAt(g-1) == "-") {
                g--;
            } else if(h.charAt(g-1) == "\n") {
                break;
            } else {
                g = g2;
                break;
            }
        }
        while(g2 < h.length) {
            if(h.charAt(g2) == " " || h.charAt(g2) == "-") {
                g2++;
            } else {
                break;
            }               
        }
        set(h.substring(0, g) + aa + h.substring(g2, h.length));
        setPos(g + aa.length, g + aa.length);
    }
    function findSelectedNodes() {
        let v = get().split("\n")
        let [p1, p2] = getPos()
        let firstNode = 0;
        let lastNode = 0;
        let nc = 0;
        let accumPos = 0;
        let doCapture = false;
        for(let i=0; i<v.length; i++) {
            if(v[i].match(/^\s*-/)) {
                nc++
            }
            accumPos += v[i].length + 1
            if(!doCapture) {
                if(p1 < accumPos) {
                    doCapture = true; firstNode = nc;
                }
            }
            if(doCapture) {
                if(p2 < accumPos) {
                    lastNode = nc;
                    break;
                }
            }
        }
        return [firstNode-1, lastNode-1];
    }
    function moveCursorToNode(index) {
        let e = -1;
        let c = index;
        let g = editorPane.get().split(/\n/);
        for (let f = 0; f <= c; f++) {
            if(!g[f].match(/^\s*-/)) {
                // increment line number for each skipped line
                // see text2mindmap function
                c++;
            }
            e += g[f].length + 1;
        }
        if(e >= 0) {
            setPos(e, e);
            scrollToLine(c);
            let el = $("#textedit").get(0);
            el.focus();
        }
    }

    $(document).ready(function() {
        on("keydown", function(a) {
            var g = this.selectionStart,
                c = this.selectionEnd,
                h = $(this).val(),
                e = h.lastIndexOf("\n", g - 1)

            if (9 == a.which) {
                a.preventDefault();
                shiftIndent(a.shiftKey);
            } else if (13 == a.which) {
                if (a.ctrlKey) {}
                else if(a.shiftKey) {
                    a.preventDefault();
                    insertBr();
                } else {
                    a.preventDefault();
                    insertNewLine();
                }
            }
        });
    });
    
    return {
        getProcessed, get, set, getPos, setPos, on, moveCursorToNode, updateTextForCoordinates, findSelectedNodes
    };
}());
