import { uploadImage } from './file_upload.js';

/**
 * Image drawing tool logic using HTML5 Canvas.
 * Supports drawing, erasing, and real-time resizing/cropping.
 */
class ImageDrawer {
    constructor() {
        this.canvas = null;
        this.context = null;
        this.isDrawing = false;
        this.isResizing = false;
        this.currentTool = 'pen'; 
        this.history = []; // Array of { dataUrl, width, height }
        this.redoHistory = [];
        this.onSaveCallback = null;
        this.lastPos = { x: 0, y: 0 };
        
        this.activeHandle = null;
        this.startResizeState = null; // { width, height, clientX, clientY }
        
        this.currentColor = '#000000';
        this.currentThickness = 5;
        this.pendingClipart = null; // { unicode, size }
        this.maxWidth = 1000;
        this.maxHeight = 1000;
        this.minSize = 50;
        this.isActive = false;
    }

    init() {
        this.canvas = document.getElementById('drawing-canvas');
        if (!this.canvas) return;
        this.context = this.canvas.getContext('2d');

        // Toolbar Events
        document.getElementById('draw-tool-pen').addEventListener('click', () => this.setTool('pen'));
        document.getElementById('draw-tool-eraser').addEventListener('click', () => this.setTool('eraser'));
        document.getElementById('draw-tool-clipart').addEventListener('click', () => {
            const panel = document.getElementById('clipart-panel');
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        });
        document.getElementById('draw-tool-undo').addEventListener('click', () => this.undo());
        document.getElementById('draw-tool-redo').addEventListener('click', () => this.redo());
        document.getElementById('draw-tool-clear').addEventListener('click', () => this.clear());
        document.getElementById('draw-save').addEventListener('click', () => this.save());

        // Color Picker Events
        const swatches = document.querySelectorAll('.color-swatch');
        swatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                this.currentColor = swatch.dataset.color;
                swatches.forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                if (this.currentTool === 'pen' || this.currentTool === 'clipart') {
                    this.context.strokeStyle = this.currentColor;
                }
            });
        });

        // Thickness Picker Events
        const thicknessSwatches = document.querySelectorAll('.thickness-swatch');
        thicknessSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                this.currentThickness = parseInt(swatch.dataset.thickness);
                thicknessSwatches.forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                if (this.currentTool === 'pen') {
                    this.context.lineWidth = this.currentThickness;
                }
            });
        });

        // Clipart Panel Events
        const clipartPanel = document.getElementById('clipart-panel');
        const closeClipartBtn = document.getElementById('close-clipart');
        const clipartItems = document.querySelectorAll('.clipart-item');

        closeClipartBtn.addEventListener('click', () => {
            clipartPanel.style.display = 'none';
        });

        clipartItems.forEach(item => {
            item.addEventListener('click', () => {
                const unicode = item.dataset.unicode;
                const size = parseInt(document.getElementById('clipart-size').value);
                this.pendingClipart = { unicode, size };
                this.setTool('clipart');
                clipartPanel.style.display = 'none';
            });
        });

        // Handle Events
        const handles = document.querySelectorAll('.resize-handle');
        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => this.startResizing(e));
            handle.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                // We need to pass the target too
                Object.defineProperty(mouseEvent, 'target', {value: e.target, enumerable: true});
                this.startResizing(mouseEvent);
                e.preventDefault();
            }, { passive: false });
        });

        // Mouse Events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        
        window.addEventListener('mousemove', (e) => {
            if (this.isDrawing) {
                this.draw(e);
            } else if (this.isResizing) {
                this.doResize(e);
            }
        });
        
        window.addEventListener('mouseup', () => {
            if (this.isDrawing) this.stopDrawing();
            if (this.isResizing) this.stopResizing();
        });

        // Touch Events for Canvas
        this.canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.startDrawing(mouseEvent);
            e.preventDefault();
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (this.isDrawing || this.isResizing) {
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                if (this.isDrawing) this.draw(mouseEvent);
                if (this.isResizing) this.doResize(mouseEvent);
                e.preventDefault();
            }
        }, { passive: false });

        window.addEventListener('touchend', () => {
            if (this.isDrawing) this.stopDrawing();
            if (this.isResizing) this.stopResizing();
        }, { passive: false });
    }

    open(base64Image, callback) {
        this.onSaveCallback = callback;
        this.history = [];
        this.redoHistory = [];
        
        const container = document.getElementById('drawing-canvas-container');
        
        // Initial reasonable default size
        this.canvas.width = Math.min(container.clientWidth - 100, 500);
        this.canvas.height = 400;

        this.setTool('pen');

        // Initialize Image
        if (base64Image) {
            const img = new Image();
            img.onload = () => {
                let w = img.width;
                let h = img.height;
                if (w > this.maxWidth) w = this.maxWidth;
                if (h > this.maxHeight) h = this.maxHeight;
                
                this.canvas.width = w;
                this.canvas.height = h;
                this.setTool('pen'); // Restore styles after width/height reset
                this.context.fillStyle = 'white';
                this.context.fillRect(0, 0, w, h);
                this.context.drawImage(img, 0, 0);
                this.saveSnapshot(); 
            };
            img.src = base64Image;
        } else {
            this.context.fillStyle = 'white';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveSnapshot(); 
        }

        document.getElementById('drawing-modal').classList.add('active');
        this.isActive = true;
        this.updateUndoRedoButtons();
    }

    setTool(tool) {
        this.currentTool = tool;
        document.getElementById('draw-tool-pen').classList.toggle('active', tool === 'pen');
        document.getElementById('draw-tool-eraser').classList.toggle('active', tool === 'eraser');
        document.getElementById('draw-tool-clipart').classList.toggle('active', tool === 'clipart');
        
        this.canvas.classList.toggle('clipart-tool', tool === 'clipart');

        this.context.lineJoin = 'round';
        this.context.lineCap = 'round';
        this.context.globalCompositeOperation = 'source-over';

        if (tool === 'pen') {
            this.context.strokeStyle = this.currentColor;
            this.context.lineWidth = this.currentThickness;
        } else if (tool === 'eraser') {
            this.context.strokeStyle = 'white';
            this.context.lineWidth = 20;
        }
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    startDrawing(e) {
        const pos = this.getMousePos(e);
        if (this.currentTool === 'clipart' && this.pendingClipart) {
            this.drawClipart(this.pendingClipart.unicode, this.pendingClipart.size, pos.x, pos.y);
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
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.fillText(unicode, x, y);
        this.context.restore();
        
        this.saveSnapshot();
    }

    startResizing(e) {
        this.isResizing = true;
        this.activeHandle = e.target.dataset.handle;

        // Capture original content to avoid cumulative offset errors during real-time resize
        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = this.canvas.width;
        sourceCanvas.height = this.canvas.height;
        sourceCanvas.getContext('2d').drawImage(this.canvas, 0, 0);

        this.startResizeState = {
            width: this.canvas.width,
            height: this.canvas.height,
            clientX: e.clientX,
            clientY: e.clientY,
            sourceCanvas: sourceCanvas
        };
        e.stopPropagation();
    }

    doResize(e) {
        if (!this.isResizing) return;

        // Use total delta from the start of the resize operation
        const deltaX = e.clientX - this.startResizeState.clientX;
        const deltaY = e.clientY - this.startResizeState.clientY;
        
        let newWidth = this.startResizeState.width;
        let newHeight = this.startResizeState.height;
        let offsetX = 0;
        let offsetY = 0;

        const handle = this.activeHandle;

        // Calculate horizontal changes
        if (handle.includes('l')) {
            newWidth = Math.max(this.minSize, Math.min(this.maxWidth, this.startResizeState.width - deltaX));
            offsetX = this.startResizeState.width - newWidth;
        } else if (handle.includes('r')) {
            newWidth = Math.max(this.minSize, Math.min(this.maxWidth, this.startResizeState.width + deltaX));
        }

        // Calculate vertical changes
        if (handle.includes('t')) {
            newHeight = Math.max(this.minSize, Math.min(this.maxHeight, this.startResizeState.height - deltaY));
            offsetY = this.startResizeState.height - newHeight;
        } else if (handle.includes('b')) {
            newHeight = Math.max(this.minSize, Math.min(this.maxHeight, this.startResizeState.height + deltaY));
        }

        this.resizeCanvas(
            Math.round(newWidth), 
            Math.round(newHeight), 
            Math.round(-offsetX) || 0, 
            Math.round(-offsetY) || 0, 
            this.startResizeState.sourceCanvas
        );
    }

    resizeCanvas(w, h, contentOffsetX, contentOffsetY, source = null) {
        if (w === this.canvas.width && h === this.canvas.height && contentOffsetX === 0 && contentOffsetY === 0 && !source) return;

        // Use provided source or current canvas
        let sourceContent = source;
        if (!sourceContent) {
            sourceContent = document.createElement('canvas');
            sourceContent.width = this.canvas.width;
            sourceContent.height = this.canvas.height;
            sourceContent.getContext('2d').drawImage(this.canvas, 0, 0);
        }

        // Resize
        this.canvas.width = w;
        this.canvas.height = h;

        // Restore styles (resizing canvas resets context)
        this.setTool(this.currentTool);

        // Fill background
        this.context.fillStyle = 'white';
        this.context.fillRect(0, 0, w, h);

        // Draw back content
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
            height: this.canvas.height
        });
        if (this.history.length > 50) this.history.shift();
        this.redoHistory = []; // Clear redo history on new action
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.history.length <= 1) return;
        
        const currentState = this.history.pop();
        this.redoHistory.push(currentState);
        
        const prevState = this.history[this.history.length - 1];
        this.restoreState(prevState);
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
        const undoBtn = document.getElementById('draw-tool-undo');
        const redoBtn = document.getElementById('draw-tool-redo');
        if (undoBtn) undoBtn.disabled = this.history.length <= 1;
        if (redoBtn) redoBtn.disabled = this.redoHistory.length === 0;
    }

    restoreState(state) {
        const img = new Image();
        img.onload = () => {
            this.canvas.width = state.width;
            this.canvas.height = state.height;
            this.setTool(this.currentTool); // Restore styles after resize
            this.context.fillStyle = 'white';
            this.context.fillRect(0, 0, state.width, state.height);
            this.context.drawImage(img, 0, 0);
        };
        img.src = state.dataUrl;
    }

    clear() {
        if (confirm("Are you sure you want to clear the entire canvas?")) {
            this.context.fillStyle = 'white';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveSnapshot();
        }
    }

    async save() {
        if (this.onSaveCallback) {
            try {
                const url = await uploadImage(this.canvas.toDataURL());
                this.onSaveCallback(url);
                this.close();
            } catch (error) {
                // Error handled by uploadImage (alert)
            }
        } else {
            this.close();
        }
    }

    close() {
        document.getElementById('drawing-modal').classList.remove('active');
        document.getElementById('clipart-panel').style.display = 'none';
        this.onSaveCallback = null;
        this.isActive = false;
    }
}

export const imageDrawer = new ImageDrawer();
