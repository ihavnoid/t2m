/**
 * Mindmap engine using D3 and KineticJS.
 * Refactored from scripts/old/mindmap.min.js
 */

class Mindmap {
    constructor() {
        this.v = new Date(1, 1, 2E3, 12, 0, 0);
        this.B = false;
        this.z = 500;
        this.d = null;
        this.l = 0;
        this.picker = null;
        this.A = 0;
        this.D = 0;
        this.y = ""; // last processed text
        this.imageCache = {};
    }

    getImage(src, onload) {
        if (this.imageCache[src]) {
            const img = this.imageCache[src];
            if (img.complete) {
                // Do NOT call onload() synchronously here.
                // The caller (newGroup) will use the image immediately if complete.
                return img;
            }
            if (onload) {
                img.addEventListener('load', onload, { once: true });
            }
            return img;
        }
        const img = new Image();
        if (onload) {
            img.addEventListener('load', onload, { once: true });
        }
        img.src = src;
        this.imageCache[src] = img;
        return img;
    }

    init() {
        this.d = this.createEngine("stageHolder", {
            width: $("#viewer-container").innerWidth(),
            height: $("#viewer-container").innerHeight()
        });

        $(window).on("keydown", (a) => {
            if (13 == a.which && a.ctrlKey) {
                a.preventDefault();
                this.d.repositionFloatingNodes();
                this.render();
            }
        });

        $("#stageHolder").on("wheel", (e) => {
            this.d.zoom(-e.originalEvent.deltaY);
        });

        $("#lockAfterMoving").change(function() {
            window.mindmap.d.settings({
                lockAfterMoving: $(this).prop("checked")
            });
            window.mindmap.d.redrawAll();
        });

        $("#coloringMode").change(function() {
            window.mindmap.d.settings({
                coloringMode: $(this).val()
            });
            window.mindmap.d.redrawAll();
        });

        $("a.fonts").on("touchstart click", function() {
            window.mindmap.d.settings({
                font: $(this).text()
            });
            window.mindmap.d.redrawAll();
        });

        $("a.fontSize").on("mouseover touchstart", function() {
            window.mindmap.d.settings({
                fontSize: $(this).text()
            });
            window.mindmap.d.redrawAll();
        });

        $(".lineWidth").on("mouseover touchstart", function() {
            window.mindmap.d.settings({
                lineWidth: $(this).attr("val")
            });
            window.mindmap.d.redrawAll();
        });

        $("input.fontcolor").minicolors({
            textfield: false,
            animationSpeed: 0,
            change: function(a) {
                window.mindmap.d.settings({
                    fontColor: a
                });
                window.mindmap.d.redrawAll();
            },
            position: "top left",
            hideSpeed: 0,
            showSpeed: 0
        });

        $("input.linecolor").minicolors({
            textfield: false,
            animationSpeed: 0,
            change: function(a) {
                window.mindmap.d.settings({
                    lineColor: a
                });
                window.mindmap.d.redrawAll();
            },
            position: "top left",
            hideSpeed: 0,
            showSpeed: 0
        });

        $("#mindmap-lock-all").on("touchstart click", (a) => {
            a.stopPropagation();
            this.d.setNodeLocks(true);
            return false;
        });

        $("#mindmap-unlock-all").on("touchstart click", (a) => {
            a.stopPropagation();
            this.d.setNodeLocks(false);
            return false;
        });
    }

    indent_depth(b) {
        if (!b) return 0;
        for (let r = 0, n = 0; n < b.length; n++) {
            const e = b.charAt(n);
            if (" " == e) r++;
            else if ("\0" == e) return r;
            else return 0;
        }
        return 0;
    }

    extractImages(text) {
        const images = [];
        if (!text) return { cleanText: text, images };
        
        // More robust parsing: find all occurrences of \0i[...]
        let pos = 0;
        let cleanText = "";
        while (true) {
            const start = text.indexOf("\0i[", pos);
            if (start === -1) {
                cleanText += text.substring(pos);
                break;
            }
            cleanText += text.substring(pos, start);
            const end = text.indexOf("]", start + 3);
            if (end === -1) {
                cleanText += text.substring(start);
                break;
            }
            const src = text.substring(start + 3, end);
            if (src) images.push(src);
            pos = end + 1;
        }
        return { cleanText, images };
    }

    trim_label(b) {
        if (typeof b === "undefined" || b === null) return null;
        
        const { cleanText, images } = this.extractImages(b);
        const r = {
            label: "",
            linkLabel: false,
            fixed: false,
            x: undefined,
            y: undefined,
            images: images
        };

        let processed = cleanText.trim();
        if (processed.length > 0 && processed.includes("\0-")) {
            const idx = processed.indexOf("\0-");
            processed = processed.substring(idx + 2).trim();
        } else {
            return null;
        }

        if (processed.match(/^\[[0-9\- ]*\]/)) {
            const n = processed.indexOf("]");
            let ftok = "";
            0 < n && (ftok = processed.substr(1, n - 1), processed = processed.substring(n + 1).trim());
            const ftok_parts = ftok.split(/  */);
            if (ftok_parts.length == 2) {
                r.fixed = true;
                r.x = ftok_parts[0] * 1.0;
                r.y = ftok_parts[1] * 1.0;
            }
        }

        if ("(" == processed.charAt(0)) {
            const n = processed.indexOf(")");
            0 < n && (r.linkLabel = processed.substr(1, n - 1), processed = processed.substring(n + 1).trim());
        }
        r.label = processed;
        return r;
    }

    moveViewToCurrentSelection() {
        if (this.d) this.d.moveViewToCurrentSelection();
    }

    render(a) {
        if (this.d) {
            this.d.execute(window.editorPane.getProcessed(), a);
            this.l = +new Date();
            this.updateColorPicker();
        }
        return false;
    }

    updateCanvasSize() {
        if (this.d) {
            this.d.settings({
                width: $("#viewer-container").innerWidth(),
                height: $("#viewer-container").innerHeight()
            });
            this.d.redraw();
        }
    }

    redraw() {
        if (this.d) this.d.redrawAll();
    }

    updateColorPicker() {
        const a = 1 == this.d.settings("coloringMode", false) ? this.d.getLevels() + 1 : this.d.getBranches() + 1;
        const g = 1 == this.d.settings("coloringMode", false) ? "Level" : "Branch";
        
        $("#colorsdiv").empty();
        const c = this.d.settings("bgcolors", false);
        
        for (let h = 0; h < a; h++) {
            if (!c[h]) {
                c[h] = c[c.length - 1];
                this.d.settings({ bgcolors: c });
            }
            const e = 0 == h ? "Root" : g + " " + h;
            $("#colorsdiv").append("<input class='bgcolors' id='color" + h + "' pickerNbr=" + h + " data-default-value=" + c[h] + " type=text value='" + c[h] + "'>").append("<span class=s50>" + e + "</span><br>");
        }

        $(".bgcolors").minicolors({
            textfield: false,
            change: (val) => {
                const g = this.d.settings("bgcolors", false);
                g[parseInt(this.picker)] = val;
                this.d.settings({ bgcolors: g });
            },
            show: (event) => {
                this.picker = $(event.currentTarget).attr("pickerNbr");
            },
            position: "top left",
            hideSpeed: 0,
            showSpeed: 0
        });
        this.d.redrawAll();
    }

    createEngine(q, r) {
        const self = this;
        const engine = {
            maxTextWidthCache: {},
            prevNb: -1,
            prevNe: -1,
            nodes: [],
            links: [],
            settings: function(a, g) {
                g = "undefined" == typeof g ? true : g;
                if ("object" == typeof a) {
                    this.e = $.extend({}, this.e, a);
                    if ("undefined" != typeof a.scale) {
                        const c = this.l.getScale().x;
                        const d = a.scale;
                        this.l.setScale(d);
                        this.l.move((this.l.getX() - this.lastXPos) * (d - c) / c, (this.l.getY() - this.lastYPos) * (d - c) / c);
                    }
                    if ("undefined" != typeof a.height || "undefined" != typeof a.width) {
                        this.f && this.f.stop();
                        this.v.setHeight(this.e.height);
                        this.v.setWidth(this.e.width);
                        this.f && this.f.alpha(0.02);
                    }
                    if ("undefined" != typeof a.transform) {
                        const h = a.transform;
                        this.l.move(h[4], h[5]);
                        this.l.setScale(h[0], h[3]);
                    }
                    if ("undefined" != typeof a.lockAfterMoving) {
                        this.e.lockAfterMoving = a.lockAfterMoving;
                    }
                } else if ("string" == typeof a) return "transform" == a ? this.l.getTransform().m : this.e[a];
            },
            stopForce: function() {
                this.f && this.f.stop();
            },
            updateFixedNodeCoordinates: function() {
                this.nodes.forEach((x) => {
                    if (x.fixed) {
                        x.fx = x.x;
                        x.fy = x.y;
                    } else {
                        x.fx = null;
                        x.fy = null;
                    }
                });
            },
            createSimulation: function(size_scale) {
                this.redraw();
                for (let i = 0; i < this.nodes.length; i++) {
                    const x = this.nodes[i];
                    x.area = x.w * x.h;
                    x.children_set = new Set();
                    x.children_set.add(x);
                }
                for (let i = this.nodes.length - 1; i >= 0; i--) {
                    const x = this.nodes[i];
                    if (x.data.parent) {
                        for (const v of x.children_set) {
                            x.data.parent.children_set.add(v);
                        }
                        x.data.parent.area += x.area;
                    }
                }
                if (this.nodes.length > 0) {
                    this.nodes[0].fixed = true;
                }
                this.nodes.forEach((x) => {
                    x.distance_map = new Map();
                    x.distance_map.set(x.id, 0);
                });
                for (let i = 0; i < 5; i++) {
                    this.links.forEach((lnk) => {
                        const src = lnk.source;
                        const tgt = lnk.target;
                        for (const [n, d] of src.distance_map) {
                            if (d == i && !tgt.distance_map.has(n)) {
                                tgt.distance_map.set(n, d + 1);
                            }
                        }
                        for (const [n, d] of tgt.distance_map) {
                            if (d == i && !src.distance_map.has(n)) {
                                src.distance_map.set(n, d + 1);
                            }
                        }
                    });
                }
                this.updateFixedNodeCoordinates();
                this.f = d3.forceSimulation(this.nodes)
                    .alpha(0.3)
                    .force("collide", d3.forceCollide((n) => {
                        return { x: n.w / 2.2 * size_scale, y: n.h / 2.2 * size_scale };
                    }).iterations(2).strength(0.3))
                    .force("link", d3.forceLink(this.links).strength(0.1).distance(() => 10))
                    .force("center", d3.forceCenter(0, 0).strength(0.05))
                    .force("manybody", d3.forceManyBody().strength(-10).distanceMax(300));
                return this.f;
            },
            runSimulation: function() {
                this.f = this.createSimulation(1.0);
                this.f.on("tick", () => {
                    const a = this.f.alpha();
                    if (0.011 > a) this.f.alpha(0.8 * a);
                    if (a < 0.02) {
                        this.nodes.forEach((x) => {
                            if (!x.data.parent) {
                                x.fixed = true;
                                x.fx = x.x;
                                x.fy = x.y;
                            }
                        });
                    }
                    this.redraw();
                });
            },
            execute: function(a, g) {
                if (this.f) this.f.stop();
                this.text2mindmap(a);
                if (true !== g) {
                    window.unsavedChanges.setHasChanges(true);
                    $(".saveMsg").show();
                }
                this.runSimulation();
            },
            clear: function() {
                this.l.removeChildren();
                this.nodes = [];
                this.links = [];
                this.f = false;
                self.y = "";
                this.execute("");
            },
            getBranches: function() { return self.A; },
            getLevels: function() { return self.D; },
            zoom: function(a) {
                const aorg = this.l.getScale().x;
                if (a > 0) {
                    a = Math.max(0.5, aorg * 1.1);
                } else {
                    a = Math.max(0.5, aorg / 1.1);
                }
                this.settings({ scale: a });
                this.redraw();
            },
            addNode: function(a, b) {
                if (this.f) this.f.stop();
                const c = {
                    id: this.w_cnt++,
                    fixed: b.fixed,
                    x: b.x,
                    y: b.y,
                    px: b.x,
                    py: b.y,
                    data: b
                };
                this.nodes.splice(a, 0, c);
                return c;
            },
            addLink: function(a, b) {
                this.links.push({
                    source: a,
                    target: b,
                    data: {
                        color: this.e.lineColor,
                        weight: this.e.lineWidth,
                        label: a.data.linkLabel
                    }
                });
            },
            getNode: function(x) { return this.nodes[x]; },
            getLinksFrom: function(a) {
                const b = [];
                this.links.forEach((c) => {
                    if (c.source.id == a.id) b.push(c);
                });
                return b;
            },
            isLinkedTo: function(a, b) {
                for (let c = 0; c < this.links.length; c++) {
                    if (this.links[c].source.id == a.id && this.links[c].target.id == b.id) return true;
                }
                return false;
            },
            removeLink: function(a) {
                this.links.forEach((b, c) => {
                    if (b == a) {
                        if (b.ui) {
                            if (b.ui.removeChildren) b.ui.removeChildren();
                            b.ui.remove();
                        }
                        this.links.splice(c, 1);
                    }
                });
            },
            setNodeLocks: function(a) {
                const xx = [];
                this.nodes.forEach((b, pos) => {
                    if (b.data.parent) {
                        b.fixed = a;
                        xx.push({ nodenum: pos, fixed: b.fixed, xp: b.x, yp: b.y });
                    }
                });
                window.editorPane.updateTextForCoordinates(xx);
                this.execute(window.editorPane.getProcessed(), false);
            },
            removeNode: function(a) {
                if (this.f) this.f.stop();
                const b = this.nodes[a];
                if (b) {
                    this.getLinksFrom(b).forEach((l) => this.removeLink(l));
                    this.links.forEach((lnk, idx) => {
                        if (lnk.target.id == b.id) this.removeLink(lnk);
                    });
                    if (b.ui) {
                        b.ui.removeChildren();
                        b.ui.remove();
                    }
                    this.nodes.splice(a, 1);
                }
            },
            setStartPosition: function(a, id, total_cnt) {
                if (!a.data.parent) {
                    if (id == 0) {
                        a.x = 0; a.y = 0; a.px = a.x; a.py = a.y;
                        return a;
                    }
                    const r = Math.sqrt(total_cnt) * 200;
                    const r1val = Math.cos(id / total_cnt * 3.141592 * 2);
                    const r2val = Math.sin(id / total_cnt * 3.141592 * 2);
                    a.x = r * r1val; a.y = r * r2val; a.px = a.x; a.py = a.y;
                    return a;
                }
                a.x = a.data.parent.x;
                a.y = a.data.parent.y;
                let vx = 0, vy = 0;
                if (a.data.parent.data.parent) {
                    vx = a.x - a.data.parent.data.parent.x;
                    vy = a.y - a.data.parent.data.parent.y;
                }
                const b = a.data.parent.data.children || 4;
                if (!this.p_cnts[a.data.parent.id]) this.p_cnts[a.data.parent.id] = 1;
                const c = this.p_cnts[a.data.parent.id]++;
                const angle = 2 * Math.PI / b * c - Math.PI;
                const dist = 20;
                const l_len = Math.sqrt(vx * vx + vy * vy);
                if (l_len < 1e-3) {
                    const cosine = Math.cos(angle);
                    const sine = Math.sin(angle);
                    vx = 1; vy = 0;
                    a.x += dist * (cosine * vx + sine * vy) + Math.random() * 5;
                    a.y += dist * (-sine * vx + cosine * vy) + Math.random() * 5;
                } else {
                    const cosine = Math.cos(angle / 4);
                    const sine = Math.sin(angle / 4);
                    vx /= l_len; vy /= l_len;
                    a.x += dist * (cosine * vx + sine * vy) + Math.random() * 5;
                    a.y += dist * (-sine * vx + cosine * vy) + Math.random() * 5;
                }
                a.px = a.x; a.py = a.y;
                return a;
            },
            redrawAll: function() {
                this.nodes.forEach((a, b) => {
                    a.data = this.setTheme(a.data);
                    window.editorPane.setNodeColor(b, a.data.color);
                    a.data.redraw = true;
                });
                this.links.forEach((a) => {
                    a.data.color = this.e.lineColor;
                    a.data.weight = this.e.lineWidth;
                    a.data.redraw = true;
                });
                window.editorPane.refresh();
                this.redraw();
            },
            moveViewToCurrentSelection: function() {
                if (this.shiftKey) return;
                const [nb, ne] = window.editorPane.findSelectedNodes();
                if (nb != ne || nb < 0) return;
                const n = this.nodes[nb];
                if (!n) return;
                const scl = this.settings("scale");
                const w = $("#stageHolder").width();
                const h = $("#stageHolder").height();
                const newx = -n.x * scl + w / 2;
                const newy = -n.y * scl + h / 2;
                const curx = this.l.getX();
                const cury = this.l.getY();
                if (newx < curx - w / 2.2 || newx > curx + w / 2.2 || newy < cury - h / 2.2 || newy > cury + h / 2.2) {
                    this.l.setPosition({ x: newx, y: newy });
                }
            },
            redraw: function() {
                this.links.forEach((a) => {
                    if (a.ui && !a.data.redraw) {
                        a.ui.setPoints([a.source, a.target]);
                    } else {
                        if (a.ui) {
                            if (a.ui.removeChildren) a.ui.removeChildren();
                            a.ui.remove();
                        }
                        a.ui = this.newLine(a, a.source, a.target);
                        this.l.add(a.ui);
                        a.ui.moveToBottom();
                        a.data.redraw = false;
                    }
                });
                const [nb, ne] = window.editorPane.findSelectedNodes();
                const checkRedraw = (pos) => {
                    const inrange = (pos >= nb && pos <= ne);
                    const p_inrange = (pos >= this.prevNb && pos <= this.prevNe);
                    return (inrange && !p_inrange) || (!inrange && p_inrange);
                };
                this.nodes.forEach((a, pos) => {
                    if (a.ui && !checkRedraw(pos) && !a.data.redraw) {
                        a.ui.setPosition({ x: a.x, y: a.y });
                    } else {
                        if (a.ui) {
                            a.ui.removeChildren();
                            a.ui.remove();
                        }
                        const selected = (pos >= nb && pos <= ne);
                        const g = this.newGroup(a, selected);
                        a.ui = g[0];
                        a.w = g[1];
                        a.h = g[2];
                        this.l.add(a.ui);
                        a.data.redraw = false;
                    }
                });
                this.prevNb = nb;
                this.prevNe = ne;
                this.l.draw();
            },
            newLine: function(a, b, c) {
                if (a.data.label) {
                    const dx = c.x - b.x;
                    const dy = c.y - b.y;
                    const line = new Kinetic.Line({
                        points: [0, 0, dx, dy],
                        stroke: a.data.color,
                        strokeWidth: a.data.weight
                    });
                    const text = new Kinetic.Text({
                        text: a.data.label,
                        fontSize: 11,
                        fontFamily: "Arial",
                        fill: "#666",
                        x: 0.5 * dx - 50,
                        y: 0.5 * dy - 6,
                        width: 100,
                        align: "center"
                    });
                    const group = new Kinetic.Group({ x: b.x, y: b.y });
                    group.add(line);
                    group.add(text);
                    group.setPoints = (pts) => {
                        const nx = pts[1].x - pts[0].x;
                        const ny = pts[1].y - pts[0].y;
                        line.setPoints([0, 0, nx, ny]);
                        text.setPosition({ x: 0.5 * nx - 50, y: 0.5 * ny - 6 });
                        group.setPosition({ x: pts[0].x, y: pts[0].y });
                    };
                    return group;
                }
                return new Kinetic.Line({
                    points: [b.x, b.y, c.x, c.y],
                    stroke: a.data.color,
                    strokeWidth: a.data.weight
                });
            },
            newGroup: function(a, selected) {
                const group = new Kinetic.Group({ x: a.x, y: a.y });
                const elements = [];
                let totalHeight = 0;
                let maxWidth = 0;

                const addImages = (srcs) => {
                    srcs.forEach(src => {
                        const imgObj = self.getImage(src, () => {
                            a.data.redraw = true;
                            this.redraw();
                        });
                        if (imgObj && imgObj.complete && imgObj.naturalWidth > 0) {
                            const scale = Math.min(200 / imgObj.width, 200 / imgObj.height, 1.0);
                            const w = imgObj.width * scale;
                            const h = imgObj.height * scale;
                            const kImg = new Kinetic.Shape({
                                drawFunc: function(canvas) {
                                    const context = canvas.getContext();
                                    context.drawImage(imgObj, 0, 0, w, h);
                                },
                                drawHitFunc: function(canvas) {
                                    const context = canvas.getContext();
                                    context.beginPath();
                                    context.rect(0, 0, w, h);
                                    context.closePath();
                                    canvas.fill(this);
                                },
                                width: w,
                                height: h,
                                listening: false
                            });
                            elements.push({ node: kImg, w: w, h: h });
                            totalHeight += h + 2;
                            maxWidth = Math.max(maxWidth, w);
                        } else {
                            totalHeight += 20;
                            maxWidth = Math.max(maxWidth, 20);
                        }
                    });
                };

                addImages(a.data.images || []);

                const textNode = this.newText(a);
                elements.push({ node: textNode, w: textNode.getWidth(), h: textNode.getHeight() });
                totalHeight += textNode.getHeight();
                maxWidth = Math.max(maxWidth, textNode.getWidth());

                addImages(a.data.commentImages || []);

                if (a.data.comment != "") {
                    const commentNode = this.newComment(a);
                    elements.push({ node: commentNode, w: commentNode.getWidth(), h: commentNode.getHeight() });
                    totalHeight += commentNode.getHeight();
                    maxWidth = Math.max(maxWidth, commentNode.getWidth());
                }

                const width = maxWidth + 4;
                const height = totalHeight;
                const rect = this.newRect(a, width, height, selected);
                group.add(rect);

                let currentY = -0.5 * height;
                elements.forEach(el => {
                    el.node.setPosition({ x: -0.5 * el.w, y: currentY });
                    group.add(el.node);
                    currentY += el.h;
                });

                group.on("touchstart mousedown", (ev) => {
                    if (!window.editorPane.isEditable()) return;
                    ev.cancelBubble = true;
                    if (ev.shiftKey) {
                        this.m_nodes = [a];
                        this.nodes.forEach((n) => {
                            if (this.m_nodes.indexOf(n.data.parent) >= 0) this.m_nodes.push(n);
                        });
                    } else {
                        this.m_nodes = [a];
                    }
                    window.getSelection().removeAllRanges();
                    a.fixedtemp = a.fixed || this.e.lockAfterMoving;
                    a.fixed = true;
                    this.C_pos = this.getPointerPos(ev.pageX || ev.targetTouches[0].pageX, ev.pageY || ev.targetTouches[0].pageY);
                });
                group.on("mouseover", () => {
                    if (!this.shiftKey) {
                        document.getElementById(q).style.cursor = "pointer";
                        const [nb, ne] = window.editorPane.findSelectedNodes();
                        const idx = this.nodes.indexOf(a);
                        if (nb != idx || ne != idx) {
                            window.editorPane.moveCursorToNode(idx);
                            a.data.redraw = true;
                            window.editorPane.refresh();
                            this.redraw();
                        }
                    }
                });
                group.on("mouseup touchend", () => {
                    const [nb, ne] = window.editorPane.findSelectedNodes();
                    const idx = this.nodes.indexOf(a);
                    if (nb != idx || ne != idx) {
                        window.editorPane.moveCursorToNode(idx);
                        this.redraw();
                    }
                    a.fixed = a.fixedtemp;
                    this.updateFixedNodeCoordinates();
                });
                group.on("mouseout", () => {
                    if (this.m_nodes.length == 0) document.getElementById(q).style.cursor = "move";
                    this.redraw();
                });
                return [group, width, height];
            },
            newRect: function(a, b, c, selected) {
                return new Kinetic.Rect({
                    x: -0.5 * b - 1,
                    y: -0.5 * c,
                    width: b + 2,
                    height: c,
                    cornerRadius: 2,
                    fill: a.data.color,
                    opacity: 1,
                    shadowColor: "#999",
                    shadowBlur: 2,
                    shadowOffset: { x: 2, y: 2 },
                    stroke: "#000000",
                    strokeWidth: selected ? 4 : 0.01,
                    shadowOpacity: 0.5
                });
            },
            newComment: function(a) {
                const g = new Kinetic.Text({
                    x: 0,
                    y: 0,
                    text: a.data.comment,
                    lineHeight: 1.25,
                    fontSize: a.data.fontSize * 0.8,
                    fontFamily: a.data.font,
                    fill: a.data.fontColor,
                    opacity: 0.8,
                    padding: 10 - Math.min(a.data.level * 3, 5),
                    align: "left",
                    listening: false
                });
                const c = this.maxTextWidth(a);
                const wh = g.getWidth() * g.getHeight();
                if (g.getWidth() > c) g.setWidth(Math.max(c, Math.sqrt(wh)));
                return g;
            },
            newText: function(a) {
                const g = new Kinetic.Text({
                    x: 0,
                    y: 0,
                    text: a.data.label,
                    lineHeight: 1.1,
                    fontSize: a.data.fontSize,
                    fontFamily: a.data.font,
                    fill: a.data.fontColor,
                    padding: 10 - Math.min(a.data.level * 3, 5),
                    align: "left",
                    listening: false
                });
                const c = this.maxTextWidth(a);
                const wh = g.getWidth() * g.getHeight();
                if (g.getWidth() > c) g.setWidth(Math.max(c, Math.sqrt(wh)));
                return g;
            },
            maxTextWidth: function(a) {
                if (this.maxTextWidthCache[a.data.fontSize] && this.maxTextWidthCache[a.data.fontSize][a.data.font]) {
                    return this.maxTextWidthCache[a.data.fontSize][a.data.font];
                }
                if (!this.maxTextWidthCache[a.data.fontSize]) this.maxTextWidthCache[a.data.fontSize] = {};
                const t = new Kinetic.Text({
                    text: "MMMMMMMMMMMMMMMMMMMM",
                    fontSize: a.data.fontSize,
                    fontFamily: a.data.font
                });
                const ret = t.getWidth();
                this.maxTextWidthCache[a.data.fontSize][a.data.font] = ret;
                return ret;
            },
            findParent: function(b, c) {
                if (0 == b) return -1;
                for (let a = c[b]; 0 <= b; b--) {
                    if (c[b] < a) return b;
                }
                return -1;
            },
            text2mindmap: function(a) {
                const convert_to_comment = (x) => {
                    x = x.trim();
                    return x.substring(0, 2) == "\0+" ? x.substring(2) : "";
                };
                const lines = a.split(/\n/);
                const filtered_lines = [];
                const comments = [];
                let j = 0;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].match(/^\s*\0-/)) {
                        filtered_lines[j] = lines[i];
                        comments[j] = "";
                        j++;
                    } else if (j > 0) {
                        comments[j - 1] += "\n" + convert_to_comment(lines[i]);
                    }
                }
                const new_text = filtered_lines.join("\n");
                const new_lines = difflib.stringAsLines(new_text);
                if (comments.length == 0) comments[0] = "";
                const depths = [];
                const parents = [];
                self.D = 0;
                new_lines.forEach((line, idx) => {
                    depths[idx] = self.indent_depth(line);
                    parents[idx] = this.findParent(idx, depths);
                });
                depths[0] = 0;
                for (let i = 0; i < depths.length; i++) {
                    depths[i] = parents[i] < 0 ? 0 : depths[parents[i]] + 1;
                    if (self.D < depths[i]) self.D = depths[i];
                }

                let addedNodes = 0, removedNodes = 0, modifiedNodes = 0;
                try {
                    const old_lines = difflib.stringAsLines(self.y);
                    const opcodes = (new difflib.SequenceMatcher(old_lines, new_lines)).get_opcodes();
                    for (let l_idx = 0; l_idx < opcodes.length; l_idx++) {
                        const entry = opcodes[l_idx];
                        const tag = entry[0], i1 = entry[1], i2 = entry[2], j1 = entry[3], j2 = entry[4];
                        const count = Math.max(i2 - i1, j2 - j1);
                        let i_ptr = i1, j_ptr = j1;
                        for (let v_idx = 0; v_idx < count; v_idx++) {
                            if (tag == "delete" || (tag == "replace" && j1 == j2)) {
                                const pos = i_ptr - removedNodes + addedNodes;
                                this.removeNode(pos);
                                removedNodes++;
                            } else if (tag == "insert" || (tag == "replace" && i1 == i2) || (tag == "replace" && !old_lines[i_ptr])) {
                                const pos = i_ptr - removedNodes + addedNodes;
                                const t = self.trim_label(j_ptr < j2 ? new_lines[j_ptr] : null);
                                if (t) {
                                    const rawComment = (comments[j_ptr] || "");
                                    const { cleanText: cleanComment, images: commentImages } = self.extractImages(rawComment);

                                    this.addNode(pos, {
                                        label: t.label,
                                        images: t.images,
                                        comment: cleanComment.trim(),
                                        commentImages: commentImages,
                                        linkLabel: t.linkLabel,
                                        children: 0,
                                        fixed: j_ptr == 0 || t.fixed,
                                        x: t.x,
                                        y: t.y,
                                    });
                                    addedNodes++;
                                }
                            } else if (tag == "replace") {
                                const pos = i_ptr - removedNodes + addedNodes;
                                const t = self.trim_label(j_ptr < j2 ? new_lines[j_ptr] : null);
                                if (t == null) {
                                    this.removeNode(pos);
                                    removedNodes++;
                                } else {
                                    const rawComment = (comments[j_ptr] || "");
                                    const { cleanText: cleanComment, images: commentImages } = self.extractImages(rawComment);

                                    this.nodes[pos].data.label = t.label;
                                    this.nodes[pos].data.images = t.images;
                                    this.nodes[pos].fixed = (j_ptr == 0 || t.fixed);
                                    if (t.fixed) {
                                        this.nodes[pos].x = t.x; this.nodes[pos].y = t.y;
                                        this.nodes[pos].px = t.x; this.nodes[pos].py = t.y;
                                    }
                                    this.nodes[pos].data.comment = cleanComment.trim();
                                    this.nodes[pos].data.commentImages = commentImages;
                                    this.nodes[pos].data.linkLabel = t.linkLabel;
                                }
                                modifiedNodes++;
                            } else if (tag == "equal") {
                                const pos = i_ptr - removedNodes + addedNodes;
                                if (pos < this.nodes.length && j_ptr < j2) {
                                    const rawComment = (comments[j_ptr] || "");
                                    const { cleanText: cleanComment, images: commentImages } = self.extractImages(rawComment);
                                    if (this.nodes[pos].data.comment != cleanComment.trim()) modifiedNodes++;
                                    this.nodes[pos].data.comment = cleanComment.trim();
                                    this.nodes[pos].data.commentImages = commentImages;
                                }
                            }
                            if (i_ptr < i2) i_ptr++;
                            if (j_ptr < j2) j_ptr++;
                        }
                    }
                } catch (err) {
                    console.log(err);
                    this.clear();
                    return false;
                }
                self.y = new_text;
                self.A = 0;
                this.nodes.forEach((node, idx) => {
                    if (depths[idx] == 0) self.A = 0;
                    node.data.branch = 1 == depths[idx] ? ++self.A : self.A;
                    if (node.data.level != depths[idx] && !node.fixed) {
                        node.x = undefined; node.y = undefined;
                    }
                    node.data.level = depths[idx];
                    node.data.parent = parents[idx] < 0 ? false : this.nodes[parents[idx]];
                    node.data = this.setTheme(node.data);
                    node.data.redraw = true;
                    if (node.data.parent && !this.isLinkedTo(node, node.data.parent)) {
                        node.data.parent.data.children++;
                        this.getLinksFrom(node).forEach((l) => this.removeLink(l));
                        this.addLink(node, node.data.parent);
                    } else if (!node.data.parent) {
                        this.getLinksFrom(node).forEach((l) => this.removeLink(l));
                    }
                    const parentLink = this.getLinksFrom(node)[0];
                    if (parentLink && parentLink.data.label != node.data.linkLabel) {
                        parentLink.data.label = node.data.linkLabel;
                        parentLink.data.redraw = true;
                    }
                    window.editorPane.setNodeColor(idx, node.data.color);
                });
                const updatedRate = (modifiedNodes + addedNodes + removedNodes - 5) / (this.nodes.length + 1e-6);
                this.buildStartingPos(updatedRate);
                return true;
            },
            repositionFloatingNodes: function() {
                let count = 0;
                this.nodes.forEach((node) => {
                    if (!node.fixed && node.data.parent) {
                        node.x = node.y = node.px = node.py = undefined;
                        count++;
                    }
                });
                this.buildStartingPos(count / (this.nodes.length + 1e-6));
            },
            buildStartingPos: function(updatedRate) {
                this.nodes.forEach((node, idx) => {
                    node.fixedtemp = node.fixed;
                    if (typeof node.x === "undefined") {
                        this.setStartPosition(node, idx, this.nodes.length);
                    } else {
                        node.fixed = true;
                    }
                });
                for (let size_scale = Math.max(0.0625, 1 - updatedRate); size_scale <= 1.0; size_scale *= 2) {
                    const links = this.links;
                    let no_swap = false;
                    for (let iter = 0; iter < 10 && !no_swap; iter++) {
                        no_swap = true;
                        for (let i = 0; i < links.length; i++) {
                            for (let j = i + 1; j < links.length; j++) {
                                if (links[i].source == links[j].source || links[i].source == links[j].target ||
                                    links[i].target == links[j].source || links[i].target == links[j].target) continue;

                                const links_intersect = (l1, l2) => {
                                    const intersect_eq = (x, y, link) => {
                                        return (link.target.y - link.source.y) * x - (link.target.x - link.source.x) * y + link.target.x * link.source.y - link.source.x * link.target.y;
                                    };
                                    const v1 = intersect_eq(l1.source.x, l1.source.y, l2) * intersect_eq(l1.target.x, l1.target.y, l2) < 0;
                                    const v2 = intersect_eq(l2.source.x, l2.source.y, l1) * intersect_eq(l2.target.x, l2.target.y, l1) < 0;
                                    return v1 && v2;
                                };

                                if (links[i].source.fixed && links[j].source.fixed) continue;
                                if (links_intersect(links[i], links[j])) {
                                    if (!links[i].source.fixed && !links[j].source.fixed) {
                                        let tmp = links[i].source.x; links[i].source.x = links[j].source.x; links[j].source.x = tmp;
                                        tmp = links[i].source.y; links[i].source.y = links[j].source.y; links[j].source.y = tmp;
                                        no_swap = false;
                                    } else if (!links[i].source.fixed) {
                                        links[i].source.x = links[i].target.x;
                                        links[i].source.y = links[i].target.y;
                                        no_swap = false;
                                    } else if (!links[j].source.fixed) {
                                        links[j].source.x = links[j].target.x;
                                        links[j].source.y = links[j].target.y;
                                        no_swap = false;
                                    }
                                }
                            }
                        }
                    }
                    this.createSimulation(Math.min(1.0, size_scale)).alpha(0.3).alphaDecay(0).tick(100).stop();
                }
                this.nodes.forEach((node) => node.fixed = node.fixedtemp);
            },
            setTheme: function(a) {
                a.font = this.e.font;
                a.fontColor = this.e.fontColor ? this.e.fontColor : "#fff";
                a.fontSize = Math.max(this.e.fontMinSize, Math.round(this.e.fontSize * (1 - 0.17 * a.level)));
                if (this.e.coloringMode == 1) {
                    a.color = a.level >= this.e.bgcolors.length ? this.e.bgcolors[this.e.bgcolors.length - 1] : this.e.bgcolors[a.level];
                } else {
                    a.color = !a.parent ? this.e.bgcolors[0] : (a.branch >= this.e.bgcolors.length ? this.e.bgcolors[this.e.bgcolors.length - 1] : this.e.bgcolors[a.branch]);
                }
                if (!a.color) a.color = "#eeeeee";
                let c = a.color.replace(/^\s*#|\s*$/g, "");
                if (c.length == 3) c = c.replace(/(.)/g, "$1$1");
                let r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
                a.shadow = "#" + (0 | 256 + r + 10 * (256 - r) / 100).toString(16).substr(1) +
                    (0 | 256 + g + 10 * (256 - g) / 100).toString(16).substr(1) + (0 | 256 + b + 10 * (256 - b) / 100).toString(16).substr(1);
                return a;
            },
            getPointerPos: function(ax, ay, c) {
                const h = this.l.getTransform().m;
                if (c) return { x: (ax - h[4]) / h[0], y: (ay - h[5]) / h[3] };
                const offset = $("#" + q).offset();
                return { x: (ax - offset.left - h[4]) / h[0], y: (ay - offset.top - h[5]) / h[3] };
            }
        };

        // Engine State Initialization
        engine.e = $.extend({
            bgcolors: "#3f3a3a #2365ba #16c75e #ff481c #ffa81c #365C8E #31975A #C2583F #C2903F #9d9d9d".split(" "),
            coloringMode: 2,
            fontSize: 26,
            fontMinSize: 11,
            font: "Helvetica, Verdana, sans-serif",
            fontColor: "#ffffff",
            lineColor: "#cccccc",
            lineWidth: 1.5,
            scale: 1,
            lockAfterMoving: true,
            linkLength: 10,
            friction: 0.9,
            charge: 1400,
            width: 400,
            height: 400,
            gravity: -0.001
        }, r);

        engine.w_cnt = 0;
        engine.p_cnts = {};
        engine.m_nodes = [];
        engine.is_dragging_stage = false;
        engine.drag_start = { x: 0, y: 0 };
        engine.lastXPos = 0;
        engine.lastYPos = 0;
        engine.shiftKey = false;
        engine.l = new Kinetic.Layer();
        engine.v = new Kinetic.Stage({ container: q, width: engine.e.width, height: engine.e.height });
        engine.v.add(engine.l);
        engine.l.move($("#viewer-container").innerWidth() / 2, $("#viewer-container").innerHeight() / 2);

        const $stage = $("#" + q);
        $stage.on("touchstart mousedown", (a) => {
            engine.shiftKey = a.shiftKey;
            if (engine.m_nodes.length == 0) {
                engine.is_dragging_stage = true;
                $(window).on("touchmove mousemove", (ev) => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    if (!engine.drag_start.x && !engine.drag_start.y) {
                        engine.drag_start.x = ev.pageX || ev.originalEvent.touches[0].pageX;
                        engine.drag_start.y = ev.pageY || ev.originalEvent.touches[0].pageY;
                    }
                    const bx = ev.pageX || ev.originalEvent.touches[0].pageX;
                    const by = ev.pageY || ev.originalEvent.touches[0].pageY;
                    engine.l.move(bx - engine.drag_start.x, by - engine.drag_start.y);
                    engine.drag_start.x = bx;
                    engine.drag_start.y = by;
                    engine.l.draw();
                });
            }
            a.stopPropagation();
        });

        $stage.on("touchmove mousemove", (a) => {
            engine.lastXPos = (a.pageX || a.originalEvent.touches[0].pageX) - $("#viewer-container").offset().left;
            engine.lastYPos = (a.pageY || a.originalEvent.touches[0].pageY) - $("#viewer-container").offset().top;
            engine.shiftKey = a.shiftKey;
            if (a.buttons == 0) {
                if (engine.is_dragging_stage) {
                    $(window).off("touchmove mousemove");
                    engine.is_dragging_stage = false;
                }
                const xx = [];
                engine.m_nodes.forEach((n) => {
                    if (!n.data.parent) n.fixed = true;
                    if (n.fixed) xx.push({ nodenum: engine.nodes.indexOf(n), fixed: n.fixed, xp: n.x, yp: n.y });
                });
                window.editorPane.updateTextForCoordinates(xx);
                engine.drag_start.x = engine.drag_start.y = false;
                engine.m_nodes = [];
            }
            if (engine.m_nodes.length > 0) {
                const pos = engine.getPointerPos(a.pageX || a.originalEvent.targetTouches[0].pageX, a.pageY || a.originalEvent.targetTouches[0].pageY);
                engine.m_nodes.forEach((n) => {
                    n.x += pos.x - engine.C_pos.x;
                    n.y += pos.y - engine.C_pos.y;
                    n.px = n.x; n.py = n.y;
                });
                engine.C_pos.x = pos.x; engine.C_pos.y = pos.y;
                engine.updateFixedNodeCoordinates();
                if (engine.f && 0.02 > engine.f.alpha()) {
                    engine.f.alpha(0.025).restart();
                } else {
                    engine.redraw();
                }
            }
        });

        $(window).on("mouseup touchend", (a) => {
            engine.shiftKey = a.shiftKey;
            if (engine.is_dragging_stage) {
                $(window).off("touchmove mousemove");
                engine.is_dragging_stage = false;
            }
            const xx = [];
            engine.m_nodes.forEach((n) => {
                if (!n.data.parent) n.fixed = true;
                if (n.fixed) xx.push({ nodenum: engine.nodes.indexOf(n), fixed: n.fixed, xp: n.x, yp: n.y });
            });
            window.editorPane.updateTextForCoordinates(xx);
            engine.drag_start.x = engine.drag_start.y = false;
            engine.m_nodes = [];
        });

        return engine;
    }
}

export const mindmap = new Mindmap();
