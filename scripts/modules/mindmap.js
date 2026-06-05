/**
 * Mindmap engine using D3 and KineticJS.
 * Refactored from scripts/old/mindmap.min.js
 */

import Kinetic from "./kineticjs.js";

class Mindmap {
    constructor() {
        this.epochDate = new Date(1, 1, 2e3, 12, 0, 0);
        this.isPaused = false;
        this.updateInterval = 500;
        this.engine = null;
        this.lastRenderTime = 0;
        this.picker = null;
        this.branchCount = 0;
        this.maxDepth = 0;
        this.lastProcessedText = ""; // last processed text
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
                img.addEventListener("load", onload, { once: true });
            }
            return img;
        }
        const img = new Image();
        if (onload) {
            img.addEventListener("load", onload, { once: true });
        }
        img.src = src;
        this.imageCache[src] = img;
        return img;
    }

    init() {
        this.engine = this.createEngine("stageHolder", {
            width: $("#viewer-container").innerWidth(),
            height: $("#viewer-container").innerHeight(),
        });

        $(window).on("keydown", (event) => {
            if (13 == event.which && event.ctrlKey) {
                event.preventDefault();
                this.engine.repositionFloatingNodes();
                this.render();
            }
        });

        const $stage = $("#stageHolder");
        const stageEl = $stage[0];

        if (stageEl) {
            stageEl.addEventListener(
                "wheel",
                (event) => {
                    event.preventDefault();
                    this.engine.zoom(-event.deltaY);
                },
                { passive: false },
            );
        }

        // Pinch-to-Zoom Support
        let lastDist = 0;
        $stage.on("touchstart", (ev) => {
            if (ev.originalEvent.touches.length === 2) {
                const t1 = ev.originalEvent.touches[0];
                const t2 = ev.originalEvent.touches[1];
                lastDist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
            }
        });

        $stage.on("touchmove", (ev) => {
            if (ev.originalEvent.touches.length === 2) {
                ev.preventDefault(); // Prevent browser zoom/scroll
                const t1 = ev.originalEvent.touches[0];
                const t2 = ev.originalEvent.touches[1];
                const dist = Math.hypot(
                    t1.pageX - t2.pageX,
                    t1.pageY - t2.pageY,
                );

                if (lastDist > 0) {
                    const delta = dist - lastDist;
                    if (Math.abs(delta) > 5) {
                        this.engine.zoom(delta * 5); // Amplify touch zoom speed
                        lastDist = dist;
                    }
                } else {
                    lastDist = dist;
                }
            }
        });

        $stage.on("touchend", (ev) => {
            if (ev.originalEvent.touches.length < 2) {
                lastDist = 0;
            }
        });

        $("#lockAfterMoving").change(function () {
            window.mindmap.engine.settings({
                lockAfterMoving: $(this).prop("checked"),
            });
            window.mindmap.engine.redrawAll();
        });

        $("#coloringMode").change(function () {
            window.mindmap.engine.settings({
                coloringMode: $(this).val(),
            });
            window.mindmap.engine.redrawAll();
        });

        $("a.fonts").on("touchstart click", function () {
            window.mindmap.engine.settings({
                font: $(this).text(),
            });
            window.mindmap.engine.redrawAll();
        });

        $("a.fontSize").on("mouseover touchstart", function () {
            window.mindmap.engine.settings({
                fontSize: $(this).text(),
            });
            window.mindmap.engine.redrawAll();
        });

        $(".lineWidth").on("mouseover touchstart", function () {
            window.mindmap.engine.settings({
                lineWidth: $(this).attr("val"),
            });
            window.mindmap.engine.redrawAll();
        });

        $("input.fontcolor").minicolors({
            textfield: false,
            animationSpeed: 0,
            change: function (color) {
                window.mindmap.engine.settings({
                    fontColor: color,
                });
                window.mindmap.engine.redrawAll();
            },
            position: "top left",
            hideSpeed: 0,
            showSpeed: 0,
        });

        $("input.linecolor").minicolors({
            textfield: false,
            animationSpeed: 0,
            change: function (color) {
                window.mindmap.engine.settings({
                    lineColor: color,
                });
                window.mindmap.engine.redrawAll();
            },
            position: "top left",
            hideSpeed: 0,
            showSpeed: 0,
        });

        $("#mindmap-lock-all").on("touchstart click", (event) => {
            event.stopPropagation();
            this.engine.setNodeLocks(true);
            return false;
        });

        $("#mindmap-unlock-all").on("touchstart click", (event) => {
            event.stopPropagation();
            this.engine.setNodeLocks(false);
            return false;
        });
    }

    indent_depth(line) {
        if (!line) return 0;
        for (let depth = 0, i = 0; i < line.length; i++) {
            const char = line.charAt(i);
            if (" " == char) depth++;
            else if ("\0" == char) return depth;
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

    trim_label(line) {
        if (typeof line === "undefined" || line === null) return null;

        const { cleanText, images } = this.extractImages(line);
        const result = {
            label: "",
            linkLabel: false,
            frozen: false,
            x: undefined,
            y: undefined,
            images: images,
        };

        let processed = cleanText.trim();
        if (processed.length > 0 && processed.includes("\0-")) {
            const idx = processed.indexOf("\0-");
            processed = processed.substring(idx + 2).trim();
        } else {
            return null;
        }

        if (processed.match(/^\[[0-9\- ]*\]/)) {
            const closingBracketIndex = processed.indexOf("]");
            let ftok = "";
            0 < closingBracketIndex &&
                ((ftok = processed.substr(1, closingBracketIndex - 1)),
                (processed = processed
                    .substring(closingBracketIndex + 1)
                    .trim()));
            const ftok_parts = ftok.split(/  */);
            if (ftok_parts.length == 2) {
                result.frozen = true;
                result.x = ftok_parts[0] * 1.0;
                result.y = ftok_parts[1] * 1.0;
            }
        }

        if ("(" == processed.charAt(0)) {
            const closingBracketIndex = processed.indexOf(")");
            0 < closingBracketIndex &&
                ((result.linkLabel = processed.substr(
                    1,
                    closingBracketIndex - 1,
                )),
                (processed = processed
                    .substring(closingBracketIndex + 1)
                    .trim()));
        }
        result.label = processed;
        return result;
    }

    moveViewToCurrentSelection() {
        if (this.engine) this.engine.moveViewToCurrentSelection();
    }

    render(skipHistory) {
        if (this.engine) {
            this.engine.execute(window.editorPane.getProcessed(), skipHistory);
            this.lastRenderTime = +new Date();
            this.updateColorPicker();
        }
        return false;
    }

    updateCanvasSize() {
        if (this.engine) {
            this.engine.settings({
                width: $("#viewer-container").innerWidth(),
                height: $("#viewer-container").innerHeight(),
            });
            this.engine.redraw();
        }
    }

    redraw() {
        if (this.engine) this.engine.redrawAll();
    }

    updateColorPicker() {
        const count =
            1 == this.engine.settings("coloringMode", false)
                ? this.engine.getLevels() + 1
                : this.engine.getBranches() + 1;
        const modeLabel =
            1 == this.engine.settings("coloringMode", false)
                ? "Level"
                : "Branch";

        $("#colorsdiv").empty();
        const bgColors = this.engine.settings("bgcolors", false);

        for (let index = 0; index < count; index++) {
            if (!bgColors[index]) {
                bgColors[index] = bgColors[bgColors.length - 1];
                this.engine.settings({ bgcolors: bgColors });
            }
            const label = 0 == index ? "Root" : modeLabel + " " + index;
            $("#colorsdiv")
                .append(
                    "<input class='bgcolors' id='color" +
                        index +
                        "' pickerNbr=" +
                        index +
                        " data-default-value=" +
                        bgColors[index] +
                        " type=text value='" +
                        bgColors[index] +
                        "'>",
                )
                .append("<span class=s50>" + label + "</span><br>");
        }

        $(".bgcolors").minicolors({
            textfield: false,
            change: (val) => {
                const colors = this.engine.settings("bgcolors", false);
                colors[parseInt(this.picker)] = val;
                this.engine.settings({ bgcolors: colors });
            },
            show: (event) => {
                this.picker = $(event.currentTarget).attr("pickerNbr");
            },
            position: "top left",
            hideSpeed: 0,
            showSpeed: 0,
        });
        this.engine.redrawAll();
    }

    createEngine(containerId, initialSettings) {
        return new MindmapEngine(this, containerId, initialSettings);
    }
}

class MindmapEngine {
    constructor(mindmap, containerId, initialSettings) {
        this.mindmap = mindmap;
        this.containerId = containerId;
        this.maxTextWidthCache = {};
        this.prevNb = -1;
        this.prevNe = -1;
        this.nodes = [];
        this.links = [];
        this.config = {};

        // Engine State Initialization
        this.config = $.extend(
            {
                bgcolors:
                    "#3f3a3a #2365ba #16c75e #ff481c #ffa81c #365C8E #31975A #C2583F #C2903F #9d9d9d".split(
                        " ",
                    ),
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
                gravity: -0.001,
            },
            initialSettings,
        );

        this.nextNodeId = 0;
        this.parentCounts = {};
        this.draggedNodes = [];
        this.isDraggingStage = false;
        this.dragStart = { x: 0, y: 0 };
        this.lastXPos = 0;
        this.lastYPos = 0;
        this.shiftKey = false;
        this.longPressTimer = null;
        this.layer = new Kinetic.Layer();
        this.stage = new Kinetic.Stage({
            container: containerId,
            width: this.config.width,
            height: this.config.height,
        });
        this.stage.add(this.layer);
        this.layer.move(
            $("#viewer-container").innerWidth() / 2,
            $("#viewer-container").innerHeight() / 2,
        );

        this._initDragAndDropEvents(containerId);
    }

    _getTouchPos(event) {
        if (event.pageX !== undefined && event.pageY !== undefined) {
            return { pageX: event.pageX, pageY: event.pageY };
        }
        const ev = event.originalEvent || event;
        const touch =
            ev.touches?.[0] || ev.targetTouches?.[0] || ev.changedTouches?.[0];
        if (touch) {
            return { pageX: touch.pageX, pageY: touch.pageY };
        }
        return { pageX: 0, pageY: 0 };
    }

    _initDragAndDropEvents(containerId) {
        const stageEl = document.getElementById(containerId);

        const getHitNode = (pageX, pageY) => {
            const pos = this.getPointerPos(pageX, pageY);
            // Iterate backwards to pick top-most node
            for (let i = this.nodes.length - 1; i >= 0; i--) {
                const node = this.nodes[i];
                if (!node.w || !node.h) continue;
                if (
                    Math.abs(pos.x - node.x) <= node.w / 2 &&
                    Math.abs(pos.y - node.y) <= node.h / 2
                ) {
                    return node;
                }
            }
            return null;
        };

        // Native event handler for stage panning and node dragging
        this._stagePanHandler = (ev) => {
            const { pageX, pageY } = this._getTouchPos(ev);

            if (this.isDraggingStage) {
                ev.stopPropagation();
                if (ev.type === "touchmove") ev.preventDefault();
                if (!this.dragStart.x && !this.dragStart.y) {
                    this.dragStart.x = pageX;
                    this.dragStart.y = pageY;
                }
                if (pageX && pageY) {
                    this.layer.move(
                        pageX - this.dragStart.x,
                        pageY - this.dragStart.y,
                    );
                    this.dragStart.x = pageX;
                    this.dragStart.y = pageY;
                    this.layer.draw();
                }
                return;
            }

            // If dragging nodes
            if (this.draggedNodes.length > 0) {
                ev.stopPropagation();
                if (ev.type === "touchmove") ev.preventDefault();
                const pos = this.getPointerPos(pageX, pageY);
                if (isNaN(pos.x) || isNaN(pos.y)) return;

                if (this.longPressTimer) {
                    const dist = Math.hypot(
                        pos.x - this.dragLastPos.x,
                        pos.y - this.dragLastPos.y,
                    );
                    if (dist > 10) {
                        clearTimeout(this.longPressTimer);
                        this.longPressTimer = null;
                    }
                }

                this.draggedNodes.forEach((node) => {
                    node.x += pos.x - this.dragLastPos.x;
                    node.y += pos.y - this.dragLastPos.y;
                    node.px = node.x;
                    node.py = node.y;
                });
                this.dragLastPos.x = pos.x;
                this.dragLastPos.y = pos.y;
                this.updateFixedNodeCoordinates();
                if (this.simulation && 0.02 > this.simulation.alpha()) {
                    this.simulation.alpha(0.025).restart();
                } else {
                    this.redraw();
                }
                return;
            }

            // Hover effects for mouse
            if (ev.type === "mousemove" && !this.isDraggingStage) {
                const hitNode = getHitNode(pageX, pageY);
                stageEl.style.cursor = hitNode ? "pointer" : "move";

                // Mouse-over selection effect
                if (hitNode && !ev.shiftKey) {
                    const [selectedStart, selectedEnd] =
                        window.editorPane.findSelectedNodes();
                    const index = this.nodes.indexOf(hitNode);
                    if (selectedStart != index || selectedEnd != index) {
                        window.editorPane.moveCursorToNode(index);
                        hitNode.data.redraw = true;
                        window.editorPane.refresh();
                        this.redraw();
                    }
                }
            }
        };

        window.addEventListener("touchmove", this._stagePanHandler, {
            passive: false,
        });
        window.addEventListener("mousemove", this._stagePanHandler);

        $(stageEl).on("touchstart mousedown", (event) => {
            this.shiftKey = event.shiftKey;
            const { pageX, pageY } = this._getTouchPos(event);
            const hitNode = getHitNode(pageX, pageY);

            if (hitNode) {
                if (!window.editorPane.isEditable()) return;
                if (event.shiftKey) {
                    this.draggedNodes = [hitNode];
                    this.nodes.forEach((n) => {
                        if (this.draggedNodes.indexOf(n.data.parent) >= 0) {
                            this.draggedNodes.push(n);
                            n.fixed = true;
                        }
                    });
                } else {
                    this.draggedNodes = [hitNode];
                }
                window.getSelection().removeAllRanges();
                hitNode.frozen = hitNode.frozen || this.config.lockAfterMoving;
                hitNode.fixed = true;

                this.dragLastPos = this.getPointerPos(pageX, pageY);

                // Long-press detection
                if (event.type === "touchstart") {
                    this.longPressTimer = setTimeout(() => {
                        hitNode.frozen = !hitNode.frozen;
                        const index = this.nodes.indexOf(hitNode);
                        window.editorPane.updateTextForCoordinates([
                            {
                                nodenum: index,
                                frozen: hitNode.frozen,
                                xp: hitNode.x,
                                yp: hitNode.y,
                            },
                        ]);
                        this.redraw();
                        this.longPressTimer = null;
                    }, 600);
                }
            } else {
                this.isDraggingStage = true;
                this.dragStart.x = pageX;
                this.dragStart.y = pageY;
            }
            event.stopPropagation();
        });

        $(window).on("mouseup touchend", (event) => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }

            if (this.draggedNodes.length > 0) {
                const { pageX, pageY } = this._getTouchPos(event);
                const pos = this.getPointerPos(pageX, pageY);
                const dist = Math.hypot(
                    pos.x - this.dragLastPos.x,
                    pos.y - this.dragLastPos.y,
                );

                if (dist < 5) {
                    const hitNode = getHitNode(pageX, pageY);
                    if (hitNode) {
                        const index = this.nodes.indexOf(hitNode);
                        window.editorPane.moveCursorToNode(index);
                    }
                }
            }

            this.shiftKey = event.shiftKey;
            this._finalizeDrag();
        });
    }

    _finalizeDrag() {
        if (this.isDraggingStage) {
            this.isDraggingStage = false;
        }
        const changes = [];
        this.draggedNodes.forEach((node) => {
            if (!node.data.parent) {
                node.fixed = true;
            }
            if (node.frozen) {
                changes.push({
                    nodenum: this.nodes.indexOf(node),
                    frozen: node.frozen,
                    xp: node.x,
                    yp: node.y,
                });
            }
            node.fixed = node.frozen;
        });
        if (changes.length > 0) {
            window.editorPane.updateTextForCoordinates(changes);
        }
        this.dragStart.x = this.dragStart.y = false;
        this.draggedNodes = [];
        this.updateFixedNodeCoordinates();
        this.redraw();
    }

    settings(settingsObj, triggerRedraw) {
        triggerRedraw =
            "undefined" == typeof triggerRedraw ? true : triggerRedraw;
        if ("object" == typeof settingsObj) {
            this.config = $.extend({}, this.config, settingsObj);
            if ("undefined" != typeof settingsObj.scale) {
                const oldScale = this.layer.getScale().x;
                const newScale = settingsObj.scale;
                this.layer.setScale(newScale);
                this.layer.move(
                    ((this.layer.getX() - this.lastXPos) *
                        (newScale - oldScale)) /
                        oldScale,
                    ((this.layer.getY() - this.lastYPos) *
                        (newScale - oldScale)) /
                        oldScale,
                );
            }
            if (
                "undefined" != typeof settingsObj.height ||
                "undefined" != typeof settingsObj.width
            ) {
                if (this.simulation) this.simulation.stop();
                this.stage.setHeight(this.config.height);
                this.stage.setWidth(this.config.width);
                if (this.simulation) this.simulation.alpha(0.02);
            }
            if ("undefined" != typeof settingsObj.transform) {
                const transform = settingsObj.transform;
                this.layer.move(transform[4], transform[5]);
                this.layer.setScale(transform[0], transform[3]);
            }
            if ("undefined" != typeof settingsObj.lockAfterMoving) {
                this.config.lockAfterMoving = settingsObj.lockAfterMoving;
            }
        } else if ("string" == typeof settingsObj)
            return "transform" == settingsObj
                ? this.layer.getTransform().m
                : this.config[settingsObj];
    }
    stopForce() {
        this.simulation && this.simulation.stop();
    }
    updateFixedNodeCoordinates() {
        this.nodes.forEach((node) => {
            if (node.fixed) {
                node.fx = node.x;
                node.fy = node.y;
            } else {
                node.fx = null;
                node.fy = null;
            }
        });
    }
    createSimulation(sizeScale) {
        this.redraw();
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            node.area = node.w * node.h;
            node.children_set = new Set();
            node.children_set.add(node);
        }
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const node = this.nodes[i];
            if (node.data.parent) {
                for (const childNode of node.children_set) {
                    node.data.parent.children_set.add(childNode);
                }
                node.data.parent.area += node.area;
            }
        }
        if (this.nodes.length > 0) {
            this.nodes[0].fixed = true;
        }
        this.nodes.forEach((node) => {
            node.distance_map = new Map();
            node.distance_map.set(node.id, 0);
        });
        for (let i = 0; i < 5; i++) {
            this.links.forEach((link) => {
                const source = link.source;
                const target = link.target;
                for (const [nodeId, distance] of source.distance_map) {
                    if (distance == i && !target.distance_map.has(nodeId)) {
                        target.distance_map.set(nodeId, distance + 1);
                    }
                }
                for (const [nodeId, distance] of target.distance_map) {
                    if (distance == i && !source.distance_map.has(nodeId)) {
                        source.distance_map.set(nodeId, distance + 1);
                    }
                }
            });
        }
        this.updateFixedNodeCoordinates();
        this.simulation = d3
            .forceSimulation(this.nodes)
            .alpha(0.3)
            .force(
                "collide",
                d3
                    .forceCollide((node) => {
                        return {
                            x: (node.w / 2.2) * sizeScale,
                            y: (node.h / 2.2) * sizeScale,
                        };
                    })
                    .iterations(2)
                    .strength(0.3),
            )
            .force(
                "link",
                d3
                    .forceLink(this.links)
                    .strength(0.1)
                    .distance(() => 10),
            )
            .force("center", d3.forceCenter(0, 0).strength(0.05))
            .force(
                "manybody",
                d3.forceManyBody().strength(-10).distanceMax(300),
            );
        return this.simulation;
    }
    runSimulation() {
        this.simulation = this.createSimulation(1.0);
        this.simulation.on("tick", () => {
            const alpha = this.simulation.alpha();
            if (0.011 > alpha) this.simulation.alpha(0.8 * alpha);
            if (alpha < 0.02) {
                this.nodes.forEach((node) => {
                    if (!node.data.parent) {
                        node.fixed = true;
                        node.fx = node.x;
                        node.fy = node.y;
                    }
                });
            }
            this.redraw();
        });
    }
    execute(processedText, skipHistory) {
        if (this.simulation) this.simulation.stop();
        this.text2mindmap(processedText);
        if (true !== skipHistory) {
            window.unsavedChanges.setHasChanges(true);
            $(".saveMsg").show();
        }
        this.runSimulation();
    }
    clear() {
        this.layer.removeChildren();
        this.nodes = [];
        this.links = [];
        this.simulation = false;
        this.mindmap.lastProcessedText = "";
        this.execute("");
    }
    getBranches() {
        return this.mindmap.branchCount;
    }
    getLevels() {
        return this.mindmap.maxDepth;
    }
    zoom(delta) {
        const oldScale = this.layer.getScale().x;
        let newScale;
        if (delta > 0) {
            newScale = Math.max(0.5, oldScale * 1.1);
        } else {
            newScale = Math.max(0.5, oldScale / 1.1);
        }
        this.settings({ scale: newScale });
        this.redraw();
    }
    addNode(index, data) {
        if (this.simulation) this.simulation.stop();
        const node = {
            id: this.nextNodeId++,
            fixed: data.fixed,
            frozen: data.frozen,
            x: data.x,
            y: data.y,
            px: data.x,
            py: data.y,
            data: data,
        };
        this.nodes.splice(index, 0, node);
        return node;
    }
    addLink(sourceNode, targetNode) {
        this.links.push({
            source: sourceNode,
            target: targetNode,
            data: {
                color: this.config.lineColor,
                weight: this.config.lineWidth,
                label: sourceNode.data.linkLabel,
            },
        });
    }
    getNode(index) {
        return this.nodes[index];
    }
    getLinksFrom(node) {
        const result = [];
        this.links.forEach((link) => {
            if (link.source.id == node.id) result.push(link);
        });
        return result;
    }
    isLinkedTo(nodeA, nodeB) {
        for (let i = 0; i < this.links.length; i++) {
            if (
                this.links[i].source.id == nodeA.id &&
                this.links[i].target.id == nodeB.id
            )
                return true;
        }
        return false;
    }
    removeLink(linkToRemove) {
        this.links.forEach((link, index) => {
            if (link == linkToRemove) {
                if (link.ui) {
                    if (link.ui.removeChildren) link.ui.removeChildren();
                    link.ui.remove();
                }
                this.links.splice(index, 1);
            }
        });
    }
    setNodeLocks(isLocked) {
        const changes = [];
        this.nodes.forEach((node, index) => {
            if (node.data.parent) {
                node.fixed = isLocked;
                node.frozen = isLocked;
                changes.push({
                    nodenum: index,
                    frozen: isLocked,
                    xp: node.x,
                    yp: node.y,
                });
            }
        });
        window.editorPane.updateTextForCoordinates(changes);
        this.execute(window.editorPane.getProcessed(), false);
    }
    removeNode(index) {
        if (this.simulation) this.simulation.stop();
        const node = this.nodes[index];
        if (node) {
            this.getLinksFrom(node).forEach((link) => this.removeLink(link));
            this.links.forEach((link) => {
                if (link.target.id == node.id) this.removeLink(link);
            });
            if (node.ui) {
                node.ui.removeChildren();
                node.ui.remove();
            }
            this.nodes.splice(index, 1);
        }
    }
    setStartPosition(node, index, totalCount) {
        if (!node.data.parent) {
            if (index == 0) {
                node.x = 0;
                node.y = 0;
                node.px = node.x;
                node.py = node.y;
                return node;
            }
            const radius = Math.sqrt(totalCount) * 200;
            const cos = Math.cos((index / totalCount) * 3.141592 * 2);
            const sin = Math.sin((index / totalCount) * 3.141592 * 2);
            node.x = radius * cos;
            node.y = radius * sin;
            node.px = node.x;
            node.py = node.y;
            return node;
        }
        node.x = node.data.parent.x;
        node.y = node.data.parent.y;
        let vx = 0,
            vy = 0;
        if (node.data.parent.data.parent) {
            vx = node.x - node.data.parent.data.parent.x;
            vy = node.y - node.data.parent.data.parent.y;
        }
        const totalChildren = node.data.parent.data.children || 4;
        if (!this.parentCounts[node.data.parent.id])
            this.parentCounts[node.data.parent.id] = 1;
        const childIdx = this.parentCounts[node.data.parent.id]++;
        const angle = ((2 * Math.PI) / totalChildren) * childIdx - Math.PI;
        const offsetDistance = 20;
        const parentDist = Math.sqrt(vx * vx + vy * vy);
        if (parentDist < 1e-3) {
            const cosine = Math.cos(angle);
            const sine = Math.sin(angle);
            vx = 1;
            vy = 0;
            node.x +=
                offsetDistance * (cosine * vx + sine * vy) + Math.random() * 5;
            node.y +=
                offsetDistance * (-sine * vx + cosine * vy) + Math.random() * 5;
        } else {
            const cosine = Math.cos(angle / 4);
            const sine = Math.sin(angle / 4);
            vx /= parentDist;
            vy /= parentDist;
            node.x +=
                offsetDistance * (cosine * vx + sine * vy) + Math.random() * 5;
            node.y +=
                offsetDistance * (-sine * vx + cosine * vy) + Math.random() * 5;
        }
        node.px = node.x;
        node.py = node.y;
        return node;
    }
    redrawAll() {
        this.nodes.forEach((node, index) => {
            node.data = this.setTheme(node.data);
            window.editorPane.setNodeColor(index, node.data.color);
            node.data.redraw = true;
        });
        this.links.forEach((link) => {
            link.data.color = this.config.lineColor;
            link.data.weight = this.config.lineWidth;
            link.data.redraw = true;
        });
        window.editorPane.refresh();
        this.redraw();
    }
    moveViewToCurrentSelection() {
        if (this.shiftKey) return;
        const [selectedStart, selectedEnd] =
            window.editorPane.findSelectedNodes();
        if (selectedStart != selectedEnd || selectedStart < 0) return;
        const node = this.nodes[selectedStart];
        if (!node) return;
        const scale = this.settings("scale");
        const width = $("#stageHolder").width();
        const height = $("#stageHolder").height();
        const newX = -node.x * scale + width / 2;
        const newY = -node.y * scale + height / 2;
        const curX = this.layer.getX();
        const curY = this.layer.getY();
        if (
            newX < curX - width / 2.2 ||
            newX > curX + width / 2.2 ||
            newY < curY - height / 2.2 ||
            newY > curY + height / 2.2
        ) {
            this.layer.setPosition({ x: newX, y: newY });
        }
    }
    redraw() {
        this.links.forEach((link) => {
            if (link.ui && !link.data.redraw) {
                link.ui.setPoints([link.source, link.target]);
            } else {
                if (link.ui) {
                    if (link.ui.removeChildren) link.ui.removeChildren();
                    link.ui.remove();
                }
                link.ui = this.newLine(link, link.source, link.target);
                this.layer.add(link.ui);
                link.ui.moveToBottom();
                link.data.redraw = false;
            }
        });
        const [selectedStart, selectedEnd] =
            window.editorPane.findSelectedNodes();
        const checkRedraw = (index) => {
            const isInSelectionRange =
                index >= selectedStart && index <= selectedEnd;
            const wasInSelectionRange =
                index >= this.prevNb && index <= this.prevNe;
            return (
                (isInSelectionRange && !wasInSelectionRange) ||
                (!isInSelectionRange && wasInSelectionRange)
            );
        };
        this.nodes.forEach((node, index) => {
            if (node.ui && !checkRedraw(index) && !node.data.redraw) {
                node.ui.setPosition({ x: node.x, y: node.y });
            } else {
                if (node.ui) {
                    node.ui.removeChildren();
                    node.ui.remove();
                }
                const isSelected =
                    index >= selectedStart && index <= selectedEnd;
                const group = this.newGroup(node, isSelected);
                node.ui = group[0];
                node.w = group[1];
                node.h = group[2];
                this.layer.add(node.ui);
                node.data.redraw = false;
            }
        });
        this.prevNb = selectedStart;
        this.prevNe = selectedEnd;
        this.layer.draw();
    }
    newLine(link, sourceNode, targetNode) {
        if (link.data.label) {
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const line = new Kinetic.Line({
                points: [0, 0, dx, dy],
                stroke: link.data.color,
                strokeWidth: link.data.weight,
            });
            const text = new Kinetic.Text({
                text: link.data.label,
                fontSize: 11,
                fontFamily: "Arial",
                fill: "#666",
                x: 0.5 * dx - 50,
                y: 0.5 * dy - 6,
                width: 100,
                align: "center",
            });
            const group = new Kinetic.Group({
                x: sourceNode.x,
                y: sourceNode.y,
            });
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
            points: [sourceNode.x, sourceNode.y, targetNode.x, targetNode.y],
            stroke: link.data.color,
            strokeWidth: link.data.weight,
        });
    }
    newGroup(node, isSelected) {
        const group = new Kinetic.Group({ x: node.x, y: node.y });
        const elements = [];
        let totalHeight = 0;
        let maxWidth = 0;

        const hPadding = 2;
        const vPadding = 2;
        const imgMargin = 8;
        const itemSpacing = 4;

        const addImages = (srcs) => {
            srcs.forEach((src) => {
                const imgObj = this.mindmap.getImage(src, () => {
                    node.data.redraw = true;
                    this.redraw();
                });
                if (imgObj && imgObj.complete && imgObj.naturalWidth > 0) {
                    const scale = Math.min(
                        200 / imgObj.width,
                        200 / imgObj.height,
                        1.0,
                    );
                    const width = imgObj.width * scale;
                    const height = imgObj.height * scale;
                    const kImg = new Kinetic.Shape({
                        drawFunc: function (canvas) {
                            const context = canvas.getContext();
                            context.drawImage(imgObj, 0, 0, width, height);
                        },
                        drawHitFunc: function (canvas) {
                            const context = canvas.getContext();
                            context.beginPath();
                            context.rect(0, 0, width, height);
                            context.closePath();
                            canvas.fill(this);
                        },
                        width: width,
                        height: height,
                        listening: false,
                    });
                    elements.push({
                        node: kImg,
                        w: width,
                        h: height,
                        isImage: true,
                    });
                    totalHeight += height + imgMargin * 2 + itemSpacing;
                    maxWidth = Math.max(maxWidth, width + imgMargin * 2);
                } else {
                    // Placeholder height while loading
                    totalHeight += 20 + imgMargin * 2 + itemSpacing;
                    maxWidth = Math.max(maxWidth, 20 + imgMargin * 2);
                }
            });
        };

        addImages(node.data.images || []);

        const textNode = this.newText(node);
        elements.push({
            node: textNode,
            w: textNode.getWidth(),
            h: textNode.getHeight(),
            isImage: false,
        });
        totalHeight += textNode.getHeight() + itemSpacing;
        maxWidth = Math.max(maxWidth, textNode.getWidth());

        addImages(node.data.commentImages || []);

        if (node.data.comment != "") {
            const commentNode = this.newComment(node);
            elements.push({
                node: commentNode,
                w: commentNode.getWidth(),
                h: commentNode.getHeight(),
                isImage: false,
            });
            totalHeight += commentNode.getHeight() + itemSpacing;
            maxWidth = Math.max(maxWidth, commentNode.getWidth());
        }

        // Remove the last spacing
        if (totalHeight > 0) totalHeight -= itemSpacing;

        const width = maxWidth + hPadding * 2;
        const height = totalHeight + vPadding * 2;
        const rect = this.newRect(node, width, height, isSelected);
        group.add(rect);

        let currentY = -0.5 * height + vPadding;
        elements.forEach((el) => {
            const yPos = el.isImage ? currentY + imgMargin : currentY;
            el.node.setPosition({ x: -0.5 * el.w, y: yPos });
            group.add(el.node);
            currentY += el.h + (el.isImage ? imgMargin * 2 : 0) + itemSpacing;
        });

        return [group, width, height];
    }
    newRect(node, width, height, isSelected) {
        return new Kinetic.Rect({
            x: -0.5 * width - 1,
            y: -0.5 * height,
            width: width + 2,
            height: height,
            cornerRadius: 2,
            fill: node.data.color,
            opacity: 1,
            shadowColor: "#999",
            shadowBlur: 2,
            shadowOffset: { x: 2, y: 2 },
            stroke: "#000000",
            strokeWidth: isSelected ? 4 : 0.01,
            shadowOpacity: 0.5,
        });
    }
    newComment(node) {
        const text = new Kinetic.Text({
            x: 0,
            y: 0,
            text: node.data.comment,
            lineHeight: 1.25,
            fontSize: node.data.fontSize * 0.8,
            fontFamily: node.data.font,
            fill: node.data.fontColor,
            opacity: 0.8,
            padding: 10 - Math.min(node.data.level * 3, 5),
            align: "left",
            listening: false,
        });
        const maxWidth = this.maxTextWidth(node);
        const area = text.getWidth() * text.getHeight();
        if (text.getWidth() > maxWidth)
            text.setWidth(Math.max(maxWidth, Math.sqrt(area)));
        return text;
    }
    newText(node) {
        const text = new Kinetic.Text({
            x: 0,
            y: 0,
            text: node.data.label,
            lineHeight: 1.1,
            fontSize: node.data.fontSize,
            fontFamily: node.data.font,
            fill: node.data.fontColor,
            padding: 10 - Math.min(node.data.level * 3, 5),
            align: "left",
            listening: false,
        });
        const maxWidth = this.maxTextWidth(node);
        const area = text.getWidth() * text.getHeight();
        if (text.getWidth() > maxWidth)
            text.setWidth(Math.max(maxWidth, Math.sqrt(area)));
        return text;
    }
    maxTextWidth(node) {
        if (
            this.maxTextWidthCache[node.data.fontSize] &&
            this.maxTextWidthCache[node.data.fontSize][node.data.font]
        ) {
            return this.maxTextWidthCache[node.data.fontSize][node.data.font];
        }
        if (!this.maxTextWidthCache[node.data.fontSize])
            this.maxTextWidthCache[node.data.fontSize] = {};
        const text = new Kinetic.Text({
            text: "MMMMMMMMMMMMMMMMMMMM",
            fontSize: node.data.fontSize,
            fontFamily: node.data.font,
        });
        const width = text.getWidth();
        this.maxTextWidthCache[node.data.fontSize][node.data.font] = width;
        return width;
    }
    findParent(index, depths) {
        if (0 == index) return -1;
        for (let depth = depths[index]; 0 <= index; index--) {
            if (depths[index] < depth) return index;
        }
        return -1;
    }
    text2mindmap(text) {
        // Helper: Extracts comment text by stripping the \0+ prefix
        const convert_to_comment = (line) => {
            const trimmed = line.trim();
            if (trimmed.substring(0, 2) === "\0+") return trimmed.substring(2);
            const plusIdx = line.indexOf("\0+");
            if (plusIdx !== -1) return line.substring(plusIdx + 2);
            return "";
        };

        // --- PASS 1: Split and Filter ---
        const lines = text.split(/\n/);
        const filtered_lines = [];
        const comments = [];
        let filteredIndex = 0;
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            if (lines[lineIndex].match(/^\s*\0-/)) {
                filtered_lines[filteredIndex] = lines[lineIndex];
                comments[filteredIndex] = "";
                filteredIndex++;
            } else if (filteredIndex > 0) {
                comments[filteredIndex - 1] +=
                    "\n" + convert_to_comment(lines[lineIndex]);
            }
        }

        // --- PASS 2: Structural Analysis ---
        const new_text = filtered_lines.join("\n");
        const new_lines = filtered_lines.map((l) => l.replace(/[\n\r]*$/g, ""));

        if (comments.length == 0) comments[0] = "";
        const depths = [];
        const parents = [];
        this.mindmap.maxDepth = 0;
        new_lines.forEach((line, idx) => {
            depths[idx] = this.mindmap.indent_depth(line);
            parents[idx] = this.findParent(idx, depths);
        });
        depths[0] = 0;
        for (let index = 0; index < depths.length; index++) {
            depths[index] = parents[index] < 0 ? 0 : depths[parents[index]] + 1;
            if (this.mindmap.maxDepth < depths[index])
                this.mindmap.maxDepth = depths[index];
        }

        // --- PASS 3: Custom Diff and Patch (Independent of difflib) ---
        // We identify identical prefix and suffix blocks to isolate the changed "middle".
        const old_text = this.mindmap.lastProcessedText || "";
        const old_lines = old_text === "" ? [] : old_text.split("\n");

        let addedNodesCount = 0,
            removedNodesCount = 0,
            modifiedNodesCount = 0;

        try {
            // 1. Scan from start to find unchanged lines
            let prefixLen = 0;
            while (
                prefixLen < old_lines.length &&
                prefixLen < new_lines.length &&
                old_lines[prefixLen] === new_lines[prefixLen]
            ) {
                prefixLen++;
            }

            // 2. Scan from end to find unchanged lines (without overlapping with prefix)
            let oldEnd = old_lines.length - 1;
            let newEnd = new_lines.length - 1;
            while (
                oldEnd >= prefixLen &&
                newEnd >= prefixLen &&
                old_lines[oldEnd] === new_lines[newEnd]
            ) {
                oldEnd--;
                newEnd--;
            }

            // 3. Update comments for unchanged prefix nodes
            for (let index = 0; index < prefixLen; index++) {
                if (this.nodes[index]) {
                    const rawComment = comments[index] || "";
                    const { cleanText: cleanComment, images: commentImages } =
                        this.mindmap.extractImages(rawComment);
                    if (this.nodes[index].data.comment != cleanComment.trim()) {
                        this.nodes[index].data.comment = cleanComment.trim();
                        this.nodes[index].data.commentImages = commentImages;
                        modifiedNodesCount++;
                    }
                }
            }

            // 4. Reconcile the "Middle" changed region
            const oldRegionLen = oldEnd - prefixLen + 1;
            const newRegionLen = newEnd - prefixLen + 1;

            // Step A: Update overlapping nodes in the middle
            const commonMidLen = Math.min(oldRegionLen, newRegionLen);
            for (let i = 0; i < commonMidLen; i++) {
                const index = prefixLen + i;
                const t = this.mindmap.trim_label(new_lines[index]);
                if (t && this.nodes[index]) {
                    const rawComment = comments[index] || "";
                    const { cleanText: cleanComment, images: commentImages } =
                        this.mindmap.extractImages(rawComment);

                    const node = this.nodes[index];
                    node.data.label = t.label;
                    node.data.images = t.images;
                    node.fixed = index == 0 || t.frozen;
                    node.frozen = t.frozen;
                    if (t.frozen) {
                        node.x = t.x;
                        node.y = t.y;
                        node.px = t.x;
                        node.py = t.y;
                    }
                    node.data.comment = cleanComment.trim();
                    node.data.commentImages = commentImages;
                    node.data.linkLabel = t.linkLabel;
                    modifiedNodesCount++;
                }
            }

            // Handle remaining nodes in the middle (Delete then Insert)
            if (oldRegionLen > newRegionLen) {
                const toDeleteCount = oldRegionLen - newRegionLen;
                for (let i = 0; i < toDeleteCount; i++) {
                    this.removeNode(prefixLen + commonMidLen);
                    removedNodesCount++;
                }
            } else if (newRegionLen > oldRegionLen) {
                const toInsertCount = newRegionLen - oldRegionLen;
                for (let i = 0; i < toInsertCount; i++) {
                    const index = prefixLen + commonMidLen + i;
                    const t = this.mindmap.trim_label(new_lines[index]);
                    if (t) {
                        const rawComment = comments[index] || "";
                        const {
                            cleanText: cleanComment,
                            images: commentImages,
                        } = this.mindmap.extractImages(rawComment);
                        this.addNode(index, {
                            label: t.label,
                            images: t.images,
                            comment: cleanComment.trim(),
                            commentImages: commentImages,
                            linkLabel: t.linkLabel,
                            children: 0,
                            fixed: index == 0 || t.frozen,
                            frozen: t.frozen,
                            x: t.x,
                            y: t.y,
                        });
                        addedNodesCount++;
                    }
                }
            }

            // 5. Update comments for unchanged suffix nodes
            const suffixLen = old_lines.length - 1 - oldEnd;
            for (let i = 0; i < suffixLen; i++) {
                const newIdx = newEnd + 1 + i;
                const node = this.nodes[newIdx];
                if (node) {
                    const rawComment = comments[newIdx] || "";
                    const { cleanText: cleanComment, images: commentImages } =
                        this.mindmap.extractImages(rawComment);
                    if (node.data.comment != cleanComment.trim()) {
                        node.data.comment = cleanComment.trim();
                        node.data.commentImages = commentImages;
                        modifiedNodesCount++;
                    }
                }
            }
        } catch (err) {
            console.error("Diff Patching Error:", err);
            this.clear();
            return false;
        }

        // --- PASS 4: Tree Reconstruction ---
        return this.reconstructTree(
            new_text,
            depths,
            parents,
            modifiedNodesCount,
            addedNodesCount,
            removedNodesCount,
        );
    }
    /**
     * Final phase of mindmap update: reconstructs parent-child links,
     * applies visual themes, and restarts the layout simulation.
     */
    reconstructTree(
        new_text,
        depths,
        parents,
        modifiedNodes,
        addedNodes,
        removedNodes,
    ) {
        // Update relationships and visual attributes for all nodes
        this.mindmap.lastProcessedText = new_text;
        this.mindmap.branchCount = 0;
        this.nodes.forEach((node, index) => {
            // Update branch and hierarchical level
            if (depths[index] == 0) this.mindmap.branchCount = 0;
            node.data.branch =
                1 == depths[index]
                    ? ++this.mindmap.branchCount
                    : this.mindmap.branchCount;

            // If the node moved to a new level and isn't fixed, reset its physics position
            if (node.data.level != depths[index] && !node.fixed) {
                node.x = undefined;
                node.y = undefined;
            }
            node.data.level = depths[index];
            node.data.parent =
                parents[index] < 0 ? false : this.nodes[parents[index]];

            // Apply visual theme and mark for redraw
            node.data = this.setTheme(node.data);
            node.data.redraw = true;

            // Re-calculate graph links (remove old link, add new parent link)
            if (node.data.parent && !this.isLinkedTo(node, node.data.parent)) {
                node.data.parent.data.children++;
                this.getLinksFrom(node).forEach((link) =>
                    this.removeLink(link),
                );
                this.addLink(node, node.data.parent);
            } else if (!node.data.parent) {
                this.getLinksFrom(node).forEach((link) =>
                    this.removeLink(link),
                );
            }

            // Update link labels if they changed
            const parentLink = this.getLinksFrom(node)[0];
            if (parentLink && parentLink.data.label != node.data.linkLabel) {
                parentLink.data.label = node.data.linkLabel;
                parentLink.data.redraw = true;
            }
            window.editorPane.setNodeColor(index, node.data.color);
        });

        // Trigger layout engine with a starting position if a large change occurred
        const updatedRate =
            (modifiedNodes + addedNodes + removedNodes - 5) /
            (this.nodes.length + 1e-6);
        this.buildStartingPos(updatedRate);
        return true;
    }
    repositionFloatingNodes() {
        let count = 0;
        this.nodes.forEach((node) => {
            if (!node.fixed && node.data.parent) {
                node.x = node.y = node.px = node.py = undefined;
                count++;
            }
        });
        this.buildStartingPos(count / (this.nodes.length + 1e-6));
    }
    buildStartingPos(updatedRate) {
        this.nodes.forEach((node, index) => {
            if (typeof node.x === "undefined") {
                this.setStartPosition(node, index, this.nodes.length);
            } else {
                node.fixed = true;
            }
        });
        for (
            let sizeScale = Math.max(0.0625, 1 - updatedRate);
            sizeScale <= 1.0;
            sizeScale *= 2
        ) {
            const links = this.links;
            let no_swap = false;
            for (let iteration = 0; iteration < 10 && !no_swap; iteration++) {
                no_swap = true;
                for (
                    let linkIndex1 = 0;
                    linkIndex1 < links.length;
                    linkIndex1++
                ) {
                    for (
                        let linkIndex2 = linkIndex1 + 1;
                        linkIndex2 < links.length;
                        linkIndex2++
                    ) {
                        if (
                            links[linkIndex1].source ==
                                links[linkIndex2].source ||
                            links[linkIndex1].source ==
                                links[linkIndex2].target ||
                            links[linkIndex1].target ==
                                links[linkIndex2].source ||
                            links[linkIndex1].target == links[linkIndex2].target
                        )
                            continue;

                        const links_intersect = (link1, link2) => {
                            const intersect_eq = (x, y, link) => {
                                return (
                                    (link.target.y - link.source.y) * x -
                                    (link.target.x - link.source.x) * y +
                                    link.target.x * link.source.y -
                                    link.source.x * link.target.y
                                );
                            };
                            const v1 =
                                intersect_eq(
                                    link1.source.x,
                                    link1.source.y,
                                    link2,
                                ) *
                                    intersect_eq(
                                        link1.target.x,
                                        link1.target.y,
                                        link2,
                                    ) <
                                0;
                            const v2 =
                                intersect_eq(
                                    link2.source.x,
                                    link2.source.y,
                                    link1,
                                ) *
                                    intersect_eq(
                                        link2.target.x,
                                        link2.target.y,
                                        link1,
                                    ) <
                                0;
                            return v1 && v2;
                        };

                        if (
                            links[linkIndex1].source.fixed &&
                            links[linkIndex2].source.fixed
                        )
                            continue;
                        if (
                            links_intersect(
                                links[linkIndex1],
                                links[linkIndex2],
                            )
                        ) {
                            if (
                                !links[linkIndex1].source.fixed &&
                                !links[linkIndex2].source.fixed
                            ) {
                                let temp = links[linkIndex1].source.x;
                                links[linkIndex1].source.x =
                                    links[linkIndex2].source.x;
                                links[linkIndex2].source.x = temp;
                                temp = links[linkIndex1].source.y;
                                links[linkIndex1].source.y =
                                    links[linkIndex2].source.y;
                                links[linkIndex2].source.y = temp;
                                no_swap = false;
                            } else if (!links[linkIndex1].source.fixed) {
                                links[linkIndex1].source.x =
                                    links[linkIndex1].target.x;
                                links[linkIndex1].source.y =
                                    links[linkIndex1].target.y;
                                no_swap = false;
                            } else if (!links[linkIndex2].source.fixed) {
                                links[linkIndex2].source.x =
                                    links[linkIndex2].target.x;
                                links[linkIndex2].source.y =
                                    links[linkIndex2].target.y;
                                no_swap = false;
                            }
                        }
                    }
                }
            }
            this.createSimulation(Math.min(1.0, sizeScale))
                .alpha(0.3)
                .alphaDecay(0)
                .tick(100)
                .stop();
        }
        this.nodes.forEach(
            (node) => (node.fixed = node.frozen || !node.data.parent),
        );
    }
    setTheme(data) {
        data.font = this.config.font;
        data.fontColor = this.config.fontColor ? this.config.fontColor : "#fff";
        data.fontSize = Math.max(
            this.config.fontMinSize,
            Math.round(this.config.fontSize * (1 - 0.17 * data.level)),
        );
        if (this.config.coloringMode == 1) {
            data.color =
                data.level >= this.config.bgcolors.length
                    ? this.config.bgcolors[this.config.bgcolors.length - 1]
                    : this.config.bgcolors[data.level];
        } else {
            data.color = !data.parent
                ? this.config.bgcolors[0]
                : data.branch >= this.config.bgcolors.length
                  ? this.config.bgcolors[this.config.bgcolors.length - 1]
                  : this.config.bgcolors[data.branch];
        }
        if (!data.color) data.color = "#eeeeee";
        let hex = data.color.replace(/^\s*#|\s*$/g, "");
        if (hex.length == 3) hex = hex.replace(/(.)/g, "$1$1");
        let red = parseInt(hex.substr(0, 2), 16),
            green = parseInt(hex.substr(2, 2), 16),
            blue = parseInt(hex.substr(4, 2), 16);
        data.shadow =
            "#" +
            (0 | (256 + red + (10 * (256 - red)) / 100))
                .toString(16)
                .substr(1) +
            (0 | (256 + green + (10 * (256 - green)) / 100))
                .toString(16)
                .substr(1) +
            (0 | (256 + blue + (10 * (256 - blue)) / 100))
                .toString(16)
                .substr(1);
        return data;
    }
    getPointerPos(pageX, pageY, isRaw) {
        // We must calculate the relative position on the canvas considering the zoom/pan transform.
        const transform = this.layer.getTransform().m;

        // For raw canvas positions (used internally by some D3 loops)
        if (isRaw)
            return {
                x: (pageX - transform[4]) / transform[0],
                y: (pageY - transform[5]) / transform[3],
            };

        // For standard event coordinates (pageX/Y), we must subtract the container's physical offset on the screen
        const container = document.getElementById(this.containerId);
        const rect = container.getBoundingClientRect();

        const relativeX = pageX - rect.left - window.scrollX;
        const relativeY = pageY - rect.top - window.scrollY;

        return {
            x: (relativeX - transform[4]) / transform[0],
            y: (relativeY - transform[5]) / transform[3],
        };
    }
}
export const mindmap = new Mindmap();
