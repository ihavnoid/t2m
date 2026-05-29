import { uploadImage } from "./file_upload.js";

// Constants
const MIN_SIZE = 50;
const MAX_WIDTH = 1000;
const MAX_HEIGHT = 1000;

/**
 * Image drawing tool logic using HTML5 Canvas.
 * Supports drawing, erasing, clipart "stamping", and real-time resizing/cropping.
 */
class ImageDrawer {
    constructor() {
        this.canvas = null;
        this.context = null;
        this.previewCanvas = null;
        this.previewContext = null;
        this.isDrawing = false;
        this.isResizing = false;
        this.currentTool = "pen";
        this.history = []; // Array of { dataUrl, width, height }
        this.redoHistory = [];
        this.onSaveCallback = null;
        this.lastPos = { x: 0, y: 0 };

        this.activeHandle = null;
        this.startResizeState = null; // { width, height, clientX, clientY, sourceCanvas }

        this.currentColor = "#000000";
        this.currentThickness = 5;
        this.pendingClipart = null; // { unicode, size }
        this.pendingPaste = null; // Image object
        this.isActive = false;
        this.boundWindow = null;
        this.initializedDocs = new WeakSet();
    }

    /**
     * Helpers to resolve the correct window/document context
     * (Supports both main window and floating popup)
     */
    get win() {
        return this.boundWindow || window;
    }
    get doc() {
        return this.win.document;
    }

    init(win = window) {
        this.boundWindow = win;
        this.canvas = this.doc.getElementById("drawing-canvas");
        if (!this.canvas) return;
        this.context = this.canvas.getContext("2d");

        this.previewCanvas = this.doc.getElementById("drawing-preview-canvas");
        if (this.previewCanvas) {
            this.previewContext = this.previewCanvas.getContext("2d");
        }

        if (!this.initializedDocs.has(this.doc)) {
            this._initToolbar();
            this._initClipart();
            this._initResizing();
            this._initCanvasEvents();
            this.initializedDocs.add(this.doc);
        }
    }

    _initToolbar() {
        const d = this.doc;
        const bind = (id, fn) =>
            d.getElementById(id).addEventListener("click", fn);

        bind("draw-tool-pen", () => this.setTool("pen"));
        bind("draw-tool-eraser", () => this.setTool("eraser"));
        bind("draw-tool-clipart", (e) => {
            this._toggleClipartPanel();
            e.stopPropagation();
        });
        bind("draw-tool-undo", () => this.undo());
        bind("draw-tool-redo", () => this.redo());
        bind("draw-tool-clear", () => this.clear());
        bind("draw-save", () => this.save());

        // Close/Cancel Events
        d.querySelectorAll("#drawing-modal .close-modal").forEach((btn) => {
            btn.addEventListener("click", () => this.close());
        });

        // Color Picker
        d.querySelectorAll(".color-swatch").forEach((swatch) => {
            swatch.addEventListener("click", () => {
                this.currentColor = swatch.dataset.color;
                d.querySelectorAll(".color-swatch").forEach((s) =>
                    s.classList.remove("active"),
                );
                swatch.classList.add("active");
                if (
                    this.currentTool === "pen" ||
                    this.currentTool === "clipart"
                ) {
                    this.context.strokeStyle = this.currentColor;
                }
            });
        });

        // Thickness Picker
        d.querySelectorAll(".thickness-swatch").forEach((swatch) => {
            swatch.addEventListener("click", () => {
                this.currentThickness = parseInt(swatch.dataset.thickness);
                d.querySelectorAll(".thickness-swatch").forEach((s) =>
                    s.classList.remove("active"),
                );
                swatch.classList.add("active");
                if (this.currentTool === "pen") {
                    this.context.lineWidth = this.currentThickness;
                }
            });
        });
    }

    _initClipart() {
        const d = this.doc;
        const panel = d.getElementById("clipart-panel");
        const backdrop = d.getElementById("clipart-backdrop");

        // Isolate panel clicks
        [panel, backdrop].forEach((el) => {
            if (!el) return;
            el.addEventListener("mousedown", (e) => e.stopPropagation());
            el.addEventListener("click", (e) => e.stopPropagation());
        });

        d.getElementById("close-clipart").addEventListener("click", () => {
            this._toggleClipartPanel(false);
        });

        d.querySelectorAll(".clipart-item").forEach((item) => {
            item.addEventListener("click", () => {
                const hex = item.dataset.unicode;
                const unicode = String.fromCodePoint(parseInt(hex, 16));
                const size = parseInt(d.getElementById("clipart-size").value);
                this.pendingClipart = { unicode, size };
                this.setTool("clipart");
                this._toggleClipartPanel(false);
            });
        });
    }

    _toggleClipartPanel(force) {
        const panel = this.doc.getElementById("clipart-panel");
        const backdrop = this.doc.getElementById("clipart-backdrop");
        console.log("DEBUG _toggleClipartPanel called", {force, panel: !!panel, backdrop: !!backdrop, boundWindow: this.boundWindow === window ? 'main' : 'popup', doc: this.doc === document ? 'main' : 'popup'});
        if (!panel || !backdrop) return;

        const show =
            force !== undefined ? force : panel.style.display === "none";
        panel.style.display = show ? "flex" : "none";
        backdrop.style.display = show ? "block" : "none";
        console.log("DEBUG _toggleClipartPanel finished", {show, panelDisplay: panel.style.display, backdropDisplay: backdrop.style.display});
    }

    _initResizing() {
        this.doc.querySelectorAll(".resize-handle").forEach((handle) => {
            handle.addEventListener("mousedown", (e) => this.startResizing(e));
            handle.addEventListener(
                "touchstart",
                (e) => {
                    const touch = e.touches[0];
                    const mouseEvent = new MouseEvent("mousedown", {
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                    });
                    Object.defineProperty(mouseEvent, "target", {
                        value: e.target,
                        enumerable: true,
                    });
                    this.startResizing(mouseEvent);
                    e.preventDefault();
                },
                { passive: false },
            );
        });
    }

    _initCanvasEvents() {
        const win = this.win;
        this.canvas.addEventListener("mousedown", (e) => this.startDrawing(e));

        win.addEventListener(
            "paste",
            (e) => {
                if (!this.isActive) return;
                
                // Stop propagation immediately to prevent background listeners from firing
                e.stopImmediatePropagation();

                const items = (e.clipboardData || e.originalEvent?.clipboardData)
                    ?.items;
                if (!items) return;

                for (const item of items) {
                    if (item.type.includes("image")) {
                        const blob = item.getAsFile();
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const img = new this.win.Image();
                            img.onload = () => {
                                this.pendingPaste = img;
                                this.setTool("paste");
                            };
                            img.src = event.target.result;
                        };
                        reader.readAsDataURL(blob);
                        e.preventDefault();
                        break;
                    }
                }
            },
            true,
        );

        win.addEventListener("mousemove", (e) => {
            if (this.isDrawing) this.draw(e);
            else if (this.isResizing) this.doResize(e);
            else this.drawPreview(e);
        });

        this.canvas.addEventListener("mouseleave", () => this.clearPreview());

        win.addEventListener("mouseup", () => {
            if (this.isDrawing) this.stopDrawing();
            if (this.isResizing) this.stopResizing();
        });

        this.canvas.addEventListener(
            "touchstart",
            (e) => {
                const touch = e.touches[0];
                this.startDrawing(
                    new MouseEvent("mousedown", {
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                    }),
                );
                e.preventDefault();
            },
            { passive: false },
        );

        win.addEventListener(
            "touchmove",
            (e) => {
                if (this.isDrawing || this.isResizing) {
                    const touch = e.touches[0];
                    const mouseEvent = new MouseEvent("mousemove", {
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                    });
                    if (this.isDrawing) this.draw(mouseEvent);
                    if (this.isResizing) this.doResize(mouseEvent);
                    e.preventDefault();
                }
            },
            { passive: false },
        );

        win.addEventListener(
            "touchend",
            () => {
                if (this.isDrawing) this.stopDrawing();
                if (this.isResizing) this.stopResizing();
            },
            { passive: false },
        );
    }

    open(base64Image, callback) {
        this.onSaveCallback = callback;
        this.history = [];
        this.redoHistory = [];

        // Determine which window to open the editor in
        let targetWin = window;
        if (
            window.editorPane?.selfWindow &&
            !window.editorPane.selfWindow.closed
        ) {
            targetWin = window.editorPane.selfWindow;
        }

        if (this.boundWindow !== targetWin) {
            this.init(targetWin);
        }

        const d = this.doc;
        const container = d.getElementById("drawing-canvas-container");

        // Initial reasonable default size
        this.canvas.width = Math.min(container.clientWidth - 100, 500);
        this.canvas.height = 400;

        this.setTool("pen");

        // Initialize Image
        if (base64Image) {
            const img = new this.win.Image();
            img.onload = () => {
                this.canvas.width = Math.min(img.width, MAX_WIDTH);
                this.canvas.height = Math.min(img.height, MAX_HEIGHT);
                this.setTool("pen");
                this.context.fillStyle = "white";
                this.context.fillRect(
                    0,
                    0,
                    this.canvas.width,
                    this.canvas.height,
                );
                this.context.drawImage(img, 0, 0);
                this.saveSnapshot();
            };
            img.src = base64Image;
        } else {
            this.context.fillStyle = "white";
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveSnapshot();
        }

        if (d.activeElement) {
            d.activeElement.blur();
        }

        d.getElementById("drawing-modal").classList.add("active");
        this.isActive = true;
        this.updateUndoRedoButtons();
    }

    setTool(tool) {
        const d = this.doc;
        this.currentTool = tool;
        d.getElementById("draw-tool-pen").classList.toggle(
            "active",
            tool === "pen",
        );
        d.getElementById("draw-tool-eraser").classList.toggle(
            "active",
            tool === "eraser",
        );
        d.getElementById("draw-tool-clipart").classList.toggle(
            "active",
            tool === "clipart",
        );

        this.canvas.classList.toggle("clipart-tool", tool === "clipart" || tool === "paste");

        this.context.lineJoin = "round";
        this.context.lineCap = "round";
        this.context.globalCompositeOperation = "source-over";

        if (tool === "pen") {
            this.context.strokeStyle = this.currentColor;
            this.context.lineWidth = this.currentThickness;
        } else if (tool === "eraser") {
            this.context.strokeStyle = "white";
            this.context.lineWidth = 20;
        }
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }

    startDrawing(e) {
        const pos = this.getMousePos(e);
        if (this.currentTool === "clipart" && this.pendingClipart) {
            this.drawClipart(
                this.pendingClipart.unicode,
                this.pendingClipart.size,
                pos.x,
                pos.y,
            );
            this.clearPreview();
            return;
        }
        if (this.currentTool === "paste" && this.pendingPaste) {
            const img = this.pendingPaste;
            this.context.drawImage(
                img,
                pos.x - img.width / 2,
                pos.y - img.height / 2,
            );
            this.saveSnapshot();
            this.setTool("pen");
            this.pendingPaste = null;
            this.clearPreview();
            return;
        }

        this.isDrawing = true;
        this.lastPos = pos;
    }

    draw(e) {
        if (!this.isDrawing) return;
        const currentPos = this.getMousePos(e);
        this.context.beginPath();
        this.context.moveTo(this.lastPos.x, this.lastPos.y);
        this.context.lineTo(currentPos.x, currentPos.y);
        this.context.stroke();
        this.lastPos = currentPos;
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveSnapshot();
        }
    }

    drawClipart(unicode, size, x, y) {
        this.context.save();
        this.context.font = `900 ${size}px "Font Awesome 6 Free"`;
        this.context.fillStyle = this.currentColor;
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillText(unicode, x, y);
        this.context.restore();
        this.saveSnapshot();
    }

    clearPreview() {
        if (this.previewContext) {
            this.previewContext.clearRect(
                0,
                0,
                this.previewCanvas.width,
                this.previewCanvas.height,
            );
        }
    }

    drawPreview(e) {
        if (!this.previewContext) return;
        this.clearPreview();

        const pos = this.getMousePos(e);

        if (this.currentTool === "paste" && this.pendingPaste) {
            const img = this.pendingPaste;
            this.previewContext.save();
            this.previewContext.globalAlpha = 0.5;
            this.previewContext.drawImage(
                img,
                pos.x - img.width / 2,
                pos.y - img.height / 2,
            );
            this.previewContext.restore();
        } else if (this.currentTool === "clipart" && this.pendingClipart) {
            const { unicode, size } = this.pendingClipart;
            this.previewContext.save();
            this.previewContext.globalAlpha = 0.5;
            this.previewContext.font = `900 ${size}px "Font Awesome 6 Free"`;
            this.previewContext.fillStyle = this.currentColor;
            this.previewContext.textAlign = "center";
            this.previewContext.textBaseline = "middle";
            this.previewContext.fillText(unicode, pos.x, pos.y);
            this.previewContext.restore();
        }
    }

    startResizing(e) {
        this.isResizing = true;
        this.activeHandle = e.target.dataset.handle;

        const sourceCanvas = this.doc.createElement("canvas");
        sourceCanvas.width = this.canvas.width;
        sourceCanvas.height = this.canvas.height;
        sourceCanvas.getContext("2d").drawImage(this.canvas, 0, 0);

        this.startResizeState = {
            width: this.canvas.width,
            height: this.canvas.height,
            clientX: e.clientX,
            clientY: e.clientY,
            sourceCanvas: sourceCanvas,
        };
        e.stopPropagation();
    }

    doResize(e) {
        if (!this.isResizing) return;

        const deltaX = e.clientX - this.startResizeState.clientX;
        const deltaY = e.clientY - this.startResizeState.clientY;
        const handle = this.activeHandle;

        let newWidth = this.startResizeState.width;
        let newHeight = this.startResizeState.height;
        let offsetX = 0;
        let offsetY = 0;

        if (handle.includes("l")) {
            newWidth = Math.max(
                MIN_SIZE,
                Math.min(MAX_WIDTH, this.startResizeState.width - deltaX),
            );
            offsetX = this.startResizeState.width - newWidth;
        } else if (handle.includes("r")) {
            newWidth = Math.max(
                MIN_SIZE,
                Math.min(MAX_WIDTH, this.startResizeState.width + deltaX),
            );
        }

        if (handle.includes("t")) {
            newHeight = Math.max(
                MIN_SIZE,
                Math.min(MAX_HEIGHT, this.startResizeState.height - deltaY),
            );
            offsetY = this.startResizeState.height - newHeight;
        } else if (handle.includes("b")) {
            newHeight = Math.max(
                MIN_SIZE,
                Math.min(MAX_HEIGHT, this.startResizeState.height + deltaY),
            );
        }

        this.resizeCanvas(
            Math.round(newWidth),
            Math.round(newHeight),
            Math.round(-offsetX) || 0,
            Math.round(-offsetY) || 0,
            this.startResizeState.sourceCanvas,
        );
    }

    resizeCanvas(w, h, contentOffsetX, contentOffsetY, source = null) {
        if (
            w === this.canvas.width &&
            h === this.canvas.height &&
            contentOffsetX === 0 &&
            contentOffsetY === 0 &&
            !source
        )
            return;

        let sourceContent = source;
        if (!sourceContent) {
            sourceContent = this.doc.createElement("canvas");
            sourceContent.width = this.canvas.width;
            sourceContent.height = this.canvas.height;
            sourceContent.getContext("2d").drawImage(this.canvas, 0, 0);
        }

        this.canvas.width = w;
        this.canvas.height = h;
        if (this.previewCanvas) {
            this.previewCanvas.width = w;
            this.previewCanvas.height = h;
        }
        this.setTool(this.currentTool);
        this.context.fillStyle = "white";
        this.context.fillRect(0, 0, w, h);
        this.context.drawImage(sourceContent, contentOffsetX, contentOffsetY);
    }

    stopResizing() {
        if (this.isResizing) {
            this.isResizing = false;
            this.startResizeState = null;
            this.saveSnapshot();
        }
    }

    saveSnapshot() {
        this.history.push({
            dataUrl: this.canvas.toDataURL(),
            width: this.canvas.width,
            height: this.canvas.height,
        });
        if (this.history.length > 50) this.history.shift();
        this.redoHistory = [];
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.history.length <= 1) return;
        const currentState = this.history.pop();
        this.redoHistory.push(currentState);
        this.restoreState(this.history[this.history.length - 1]);
        this.updateUndoRedoButtons();
    }

    redo() {
        if (this.redoHistory.length === 0) return;
        const nextState = this.redoHistory.pop();
        this.history.push(nextState);
        this.restoreState(nextState);
        this.updateUndoRedoButtons();
    }

    updateUndoRedoButtons() {
        const d = this.doc;
        const undoBtn = d.getElementById("draw-tool-undo");
        const redoBtn = d.getElementById("draw-tool-redo");
        if (undoBtn) undoBtn.disabled = this.history.length <= 1;
        if (redoBtn) redoBtn.disabled = this.redoHistory.length === 0;
    }

    restoreState(state) {
        const img = new this.win.Image();
        img.onload = () => {
            this.canvas.width = state.width;
            this.canvas.height = state.height;
            this.setTool(this.currentTool);
            this.context.fillStyle = "white";
            this.context.fillRect(0, 0, state.width, state.height);
            this.context.drawImage(img, 0, 0);
        };
        img.src = state.dataUrl;
    }

    clear() {
        if (
            this.win.confirm(
                "Are you sure you want to clear the entire canvas?",
            )
        ) {
            this.context.fillStyle = "white";
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveSnapshot();
        }
    }

    async save() {
        if (!this.onSaveCallback) return this.close();
        try {
            const url = await uploadImage(this.canvas.toDataURL());
            this.onSaveCallback(url);
            this.close();
        } catch (error) {}
    }

    close() {
        if (!this.isActive) return;
        try {
            if (this.boundWindow && !this.boundWindow.closed) {
                const d = this.doc;
                d.getElementById("drawing-modal").classList.remove("active");
                this._toggleClipartPanel(false);
                this.clearPreview();
            }
        } catch (e) {}
        this.onSaveCallback = null;
        this.isActive = false;
    }
}

export const imageDrawer = new ImageDrawer();
