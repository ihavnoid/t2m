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
        this.zoomLevel = 1.0;
        this.pendingClipart = null; // { unicode, size }
        this.pendingText = null; // { text, size }
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
            this._initText();
            this._initResizing();
            this._initCanvasEvents();
            this.initializedDocs.add(this.doc);
        }
    }

    _setCanvasSize(w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
        if (this.previewCanvas) {
            this.previewCanvas.width = w;
            this.previewCanvas.height = h;
        }
        this.applyZoom();
    }

    zoom(delta) {
        this.zoomLevel = Math.max(1.0, Math.min(8.0, this.zoomLevel + delta));
        this.applyZoom();
    }

    applyZoom() {
        const wrapper = this.doc.getElementById("drawing-canvas-wrapper");
        const spacer = this.doc.getElementById("drawing-canvas-spacer");
        const levelDisplay = this.doc.getElementById("draw-zoom-level");
        const mobileLevelDisplay = this.doc.getElementById(
            "draw-menu-zoom-level",
        );

        if (wrapper) {
            wrapper.style.transform = `scale(${this.zoomLevel})`;
        }

        if (spacer) {
            spacer.style.width = `${this.canvas.width * this.zoomLevel}px`;
            spacer.style.height = `${this.canvas.height * this.zoomLevel}px`;
        }

        if (levelDisplay) {
            levelDisplay.innerText = `${Math.round(this.zoomLevel * 100)}%`;
        }

        if (mobileLevelDisplay) {
            mobileLevelDisplay.innerText = `${Math.round(this.zoomLevel * 100)}%`;
        }
    }

    _initToolbar() {
        const d = this.doc;
        const bind = (id, fn) => {
            const el = d.getElementById(id);
            if (el) el.addEventListener("click", fn);
        };

        bind("draw-tool-pen", () => this.setTool("pen"));
        bind("draw-tool-eraser", () => this.setTool("eraser"));
        bind("draw-tool-clipart", (e) => {
            this._toggleClipartPanel();
            e.stopPropagation();
        });
        bind("draw-tool-text", (e) => {
            this._toggleTextPanel();
            e.stopPropagation();
        });
        bind("draw-tool-undo", () => this.undo());
        bind("draw-tool-redo", () => this.redo());
        bind("draw-tool-clear", () => this.clear());
        bind("draw-tool-help", () => this._toggleHelpPanel());
        bind("draw-zoom-in", () => this.zoom(0.1));
        bind("draw-zoom-out", () => this.zoom(-0.1));
        bind("draw-save", () => this.save());

        // Close/Cancel Events
        d.querySelectorAll("#drawing-modal .close-modal").forEach((btn) => {
            btn.addEventListener("click", () => this.close());
        });

        const closeHelp = d.getElementById("close-help");
        if (closeHelp) {
            closeHelp.addEventListener("click", () => {
                this._toggleHelpPanel(false);
            });
        }

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

        // Mobile more menu bindings (trigger click on desktop buttons)
        const bindShadowClick = (menuId, toolId) => {
            const menuBtn = d.getElementById(menuId);
            if (menuBtn) {
                menuBtn.addEventListener("click", (e) => {
                    const toolBtn = d.getElementById(toolId);
                    if (toolBtn) {
                        toolBtn.click();
                    }
                    const moreMenu = d.getElementById("draw-more-menu");
                    if (moreMenu) {
                        moreMenu.style.display = "none";
                    }
                    e.stopPropagation();
                });
            }
        };

        bindShadowClick("draw-menu-undo", "draw-tool-undo");
        bindShadowClick("draw-menu-redo", "draw-tool-redo");
        bindShadowClick("draw-menu-clear", "draw-tool-clear");
        bindShadowClick("draw-menu-help", "draw-tool-help");
        bindShadowClick("draw-menu-zoom-out", "draw-zoom-out");
        bindShadowClick("draw-menu-zoom-in", "draw-zoom-in");

        // Toggle mobile more menu dropdown
        const moreBtn = d.getElementById("draw-tool-more");
        if (moreBtn) {
            moreBtn.addEventListener("click", (e) => {
                const moreMenu = d.getElementById("draw-more-menu");
                if (moreMenu) {
                    const isVisible = moreMenu.style.display === "block";
                    moreMenu.style.display = isVisible ? "none" : "block";
                }
                e.stopPropagation();
            });
        }

        // Close more menu when clicking/touching elsewhere
        d.addEventListener("click", () => {
            const moreMenu = d.getElementById("draw-more-menu");
            if (moreMenu) {
                moreMenu.style.display = "none";
            }
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

    _initText() {
        const d = this.doc;
        const panel = d.getElementById("draw-text-panel");
        const backdrop = d.getElementById("draw-text-backdrop");
        if (!panel || !backdrop) return;

        // Isolate panel clicks
        [panel, backdrop].forEach((el) => {
            if (!el) return;
            el.addEventListener("mousedown", (e) => e.stopPropagation());
            el.addEventListener("click", (e) => e.stopPropagation());
        });

        const closeBtn = d.getElementById("close-draw-text");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                this._toggleTextPanel(false);
            });
        }

        const applyBtn = d.getElementById("draw-text-apply");
        if (applyBtn) {
            applyBtn.addEventListener("click", () => {
                const textInput = d.getElementById("draw-text-input");
                const sizeInput = d.getElementById("draw-text-size");
                const text = textInput ? textInput.value : "";
                const size = sizeInput ? parseInt(sizeInput.value) || 24 : 24;
                if (text.trim() === "") {
                    return;
                }
                this.pendingText = { text, size };
                this.setTool("text");
                this._toggleTextPanel(false);
            });
        }
    }

    _toggleHelpPanel(force) {
        const panel = this.doc.getElementById("draw-help-panel");
        if (!panel) return;

        const show =
            force !== undefined ? force : panel.style.display === "none";
        panel.style.display = show ? "flex" : "none";
        if (show) {
            this._toggleClipartPanel(false);
            this._toggleTextPanel(false);
        }
    }

    _toggleClipartPanel(force) {
        const panel = this.doc.getElementById("clipart-panel");
        const backdrop = this.doc.getElementById("clipart-backdrop");
        if (!panel || !backdrop) return;

        const show =
            force !== undefined ? force : panel.style.display === "none";
        panel.style.display = show ? "flex" : "none";
        backdrop.style.display = show ? "block" : "none";
        if (show) {
            this._toggleTextPanel(false);
            this._toggleHelpPanel(false);
        }
    }

    _toggleTextPanel(force) {
        const panel = this.doc.getElementById("draw-text-panel");
        const backdrop = this.doc.getElementById("draw-text-backdrop");
        if (!panel || !backdrop) return;

        const show =
            force !== undefined ? force : panel.style.display === "none";
        panel.style.display = show ? "flex" : "none";
        backdrop.style.display = show ? "block" : "none";

        if (show) {
            this._toggleClipartPanel(false);
            this._toggleHelpPanel(false);
            this.doc.getElementById("draw-text-input").focus();
        }
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
            "keydown",
            (e) => {
                if (!this.isActive) return;

                const step = 40 / this.zoomLevel;
                const container = this.doc.getElementById(
                    "drawing-canvas-container",
                );
                const key = e.key.toLowerCase();

                // Zoom Shortcuts
                if ((e.ctrlKey || e.metaKey) && key === "0") {
                    e.preventDefault();
                    this.zoomLevel = 1.0;
                    this.applyZoom();
                } else if (key === "e") {
                    this.zoom(0.1);
                    e.preventDefault();
                } else if (key === "q") {
                    this.zoom(-0.1);
                    e.preventDefault();
                }
                // Scroll Shortcuts (WASD + Arrows)
                else if (key === "w" || e.key === "ArrowUp") {
                    container.scrollTop -= step;
                    e.preventDefault();
                } else if (key === "s" || e.key === "ArrowDown") {
                    container.scrollTop += step;
                    e.preventDefault();
                } else if (key === "a" || e.key === "ArrowLeft") {
                    container.scrollLeft -= step;
                    e.preventDefault();
                } else if (key === "d" || e.key === "ArrowRight") {
                    container.scrollLeft += step;
                    e.preventDefault();
                } else if (key === "h" || e.key === "?") {
                    this._toggleHelpPanel();
                    e.preventDefault();
                }
            },
            true,
        );

        win.addEventListener(
            "paste",
            (e) => {
                if (!this.isActive) return;

                // Stop propagation immediately to prevent background listeners from firing
                e.stopImmediatePropagation();

                const items = (
                    e.clipboardData || e.originalEvent?.clipboardData
                )?.items;
                if (!items) return;

                for (const item of items) {
                    if (item.type.includes("image")) {
                        const blob = item.getAsFile();
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const img = new this.win.Image();
                            img.onload = () => {
                                if (
                                    this.isNewImage &&
                                    this.history.length <= 1
                                ) {
                                    this._setCanvasSize(
                                        Math.min(img.width, MAX_WIDTH),
                                        Math.min(img.height, MAX_HEIGHT),
                                    );
                                    this.context.fillStyle = "white";
                                    this.context.fillRect(
                                        0,
                                        0,
                                        this.canvas.width,
                                        this.canvas.height,
                                    );
                                    this.context.drawImage(img, 0, 0);
                                    this.saveSnapshot();
                                    this.isNewImage = false;
                                } else {
                                    this.pendingPaste = img;
                                    this.setTool("paste");
                                }
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

        win.addEventListener("mouseup", (e) => {
            if (this.isDrawing) {
                this.draw(e);
                this.stopDrawing();
            }
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
            (e) => {
                if (this.isDrawing) {
                    const touch = e.changedTouches[0];
                    const mouseEvent = new MouseEvent("mouseup", {
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                    });
                    this.draw(mouseEvent);
                    this.stopDrawing();
                }
                if (this.isResizing) this.stopResizing();
            },
            { passive: false },
        );
    }

    open(base64Image, callback) {
        this.onSaveCallback = callback;
        this.history = [];
        this.redoHistory = [];
        this.zoomLevel = 1.0;
        this.isNewImage = !base64Image;

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
        this._setCanvasSize(Math.min(container.clientWidth - 100, 500), 400);

        this.setTool("pen");

        // Initialize Image
        if (base64Image) {
            const img = new this.win.Image();
            img.onload = () => {
                this._setCanvasSize(
                    Math.min(img.width, MAX_WIDTH),
                    Math.min(img.height, MAX_HEIGHT),
                );
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
        const penBtn = d.getElementById("draw-tool-pen");
        const eraserBtn = d.getElementById("draw-tool-eraser");
        const clipartBtn = d.getElementById("draw-tool-clipart");
        const textBtn = d.getElementById("draw-tool-text");

        if (penBtn) penBtn.classList.toggle("active", tool === "pen");
        if (eraserBtn) eraserBtn.classList.toggle("active", tool === "eraser");
        if (clipartBtn)
            clipartBtn.classList.toggle("active", tool === "clipart");
        if (textBtn) textBtn.classList.toggle("active", tool === "text");

        this.canvas.classList.toggle(
            "clipart-tool",
            tool === "clipart" || tool === "paste" || tool === "text",
        );

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
            x: (e.clientX - rect.left) / this.zoomLevel,
            y: (e.clientY - rect.top) / this.zoomLevel,
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
        if (this.currentTool === "text" && this.pendingText) {
            this.drawText(
                this.pendingText.text,
                this.pendingText.size,
                pos.x,
                pos.y,
            );
            this.clearPreview();
            this.setTool("pen");
            this.pendingText = null;
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

    drawText(text, size, x, y) {
        this.context.save();
        this.context.font = `${size}px sans-serif`;
        this.context.fillStyle = this.currentColor;
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";

        const lines = text.split("\n");
        const lineHeight = size * 1.2;
        const totalHeight = lineHeight * (lines.length - 1);
        const startY = y - totalHeight / 2;

        lines.forEach((line, index) => {
            this.context.fillText(line, x, startY + index * lineHeight);
        });

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
        } else if (this.currentTool === "text" && this.pendingText) {
            const { text, size } = this.pendingText;
            this.previewContext.save();
            this.previewContext.globalAlpha = 0.5;
            this.previewContext.font = `${size}px sans-serif`;
            this.previewContext.fillStyle = this.currentColor;
            this.previewContext.textAlign = "center";
            this.previewContext.textBaseline = "middle";

            const lines = text.split("\n");
            const lineHeight = size * 1.2;
            const totalHeight = lineHeight * (lines.length - 1);
            const startY = pos.y - totalHeight / 2;

            lines.forEach((line, index) => {
                this.previewContext.fillText(
                    line,
                    pos.x,
                    startY + index * lineHeight,
                );
            });
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

        this._setCanvasSize(w, h);
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
            this._setCanvasSize(state.width, state.height);
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
                this._toggleTextPanel(false);
                this._toggleHelpPanel(false);
                this.clearPreview();
            }
        } catch (e) {}
        this.onSaveCallback = null;
        this.isActive = false;
    }
}

export const imageDrawer = new ImageDrawer();
