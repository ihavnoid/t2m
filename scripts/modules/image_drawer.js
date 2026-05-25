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
        this.onSaveCallback = null;
        this.lastPos = { x: 0, y: 0 };
        
        this.activeHandle = null;
        this.startResizeState = null; // { width, height, clientX, clientY }
        
        this.maxWidth = 1000;
        this.maxHeight = 1000;
        this.minSize = 50;
    }

    init() {
        this.canvas = document.getElementById('drawing-canvas');
        if (!this.canvas) return;
        this.context = this.canvas.getContext('2d');

        // Toolbar Events
        document.getElementById('draw-tool-pen').addEventListener('click', () => this.setTool('pen'));
        document.getElementById('draw-tool-eraser').addEventListener('click', () => this.setTool('eraser'));
        document.getElementById('draw-tool-undo').addEventListener('click', () => this.undo());
        document.getElementById('draw-tool-clear').addEventListener('click', () => this.clear());
        document.getElementById('draw-save').addEventListener('click', () => this.save());

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
            if (this.isDrawing) this.draw(e);
            if (this.isResizing) this.doResize(e);
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
        
        const container = document.getElementById('drawing-canvas-container');
        this.canvas.width = Math.min(container.clientWidth - 80, this.maxWidth);
        this.canvas.height = Math.min(600, this.maxHeight);

        this.setTool('pen');

        if (base64Image) {
            const img = new Image();
            img.onload = () => {
                let w = img.width;
                let h = img.height;
                if (w > this.maxWidth) w = this.maxWidth;
                if (h > this.maxHeight) h = this.maxHeight;
                
                this.canvas.width = w;
                this.canvas.height = h;
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
    }

    setTool(tool) {
        this.currentTool = tool;
        document.getElementById('draw-tool-pen').classList.toggle('active', tool === 'pen');
        document.getElementById('draw-tool-eraser').classList.toggle('active', tool === 'eraser');
        
        this.context.lineJoin = 'round';
        this.context.lineCap = 'round';
        this.context.globalCompositeOperation = 'source-over';

        if (tool === 'pen') {
            this.context.strokeStyle = 'black';
            this.context.lineWidth = 3;
        } else {
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
        this.isDrawing = true;
        this.lastPos = this.getMousePos(e);
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

    startResizing(e) {
        this.isResizing = true;
        this.activeHandle = e.target.dataset.handle;
        this.startResizeState = {
            width: this.canvas.width,
            height: this.canvas.height,
            clientX: e.clientX,
            clientY: e.clientY
        };
        e.stopPropagation();
    }

    doResize(e) {
        if (!this.isResizing) return;

        const deltaX = e.clientX - this.startResizeState.clientX;
        const deltaY = e.clientY - this.startResizeState.clientY;
        
        let newWidth = this.startResizeState.width;
        let newHeight = this.startResizeState.height;
        let offsetX = 0;
        let offsetY = 0;

        const handle = this.activeHandle;

        if (handle.includes('r')) {
            newWidth = this.startResizeState.width + deltaX;
        } else if (handle.includes('l')) {
            newWidth = this.startResizeState.width - deltaX;
            offsetX = deltaX;
        }

        if (handle.includes('b')) {
            newHeight = this.startResizeState.height + deltaY;
        } else if (handle.includes('t')) {
            newHeight = this.startResizeState.height - deltaY;
            offsetY = deltaY;
        }

        // Constraints
        if (newWidth < this.minSize) {
            offsetX -= (this.minSize - newWidth) * (handle.includes('l') ? -1 : 0);
            newWidth = this.minSize;
        }
        if (newHeight < this.minSize) {
            offsetY -= (this.minSize - newHeight) * (handle.includes('t') ? -1 : 0);
            newHeight = this.minSize;
        }
        if (newWidth > this.maxWidth) newWidth = this.maxWidth;
        if (newHeight > this.maxHeight) newHeight = this.maxHeight;

        this.resizeCanvas(Math.round(newWidth), Math.round(newHeight), Math.round(-offsetX), Math.round(-offsetY));
        
        // Update start state for relative Top/Left expansion so we don't accumulate offset
        // Actually for real-time it's easier to just calculate relative to original start clientX/Y
        // but we need to update the CLIENT position if we clamped
    }

    resizeCanvas(w, h, contentOffsetX, contentOffsetY) {
        if (w === this.canvas.width && h === this.canvas.height && contentOffsetX === 0 && contentOffsetY === 0) return;

        // Store content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        tempCanvas.getContext('2d').drawImage(this.canvas, 0, 0);

        // Resize
        this.canvas.width = w;
        this.canvas.height = h;

        // Restore styles (resizing canvas resets context)
        this.setTool(this.currentTool);

        // Fill background
        this.context.fillStyle = 'white';
        this.context.fillRect(0, 0, w, h);

        // Draw back content
        this.context.drawImage(tempCanvas, contentOffsetX, contentOffsetY);
    }

    stopResizing() {
        if (this.isResizing) {
            this.isResizing = false;
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
    }

    undo() {
        if (this.history.length <= 1) return;
        
        this.history.pop(); 
        const state = this.history[this.history.length - 1];
        
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

    save() {
        if (this.onSaveCallback) {
            this.onSaveCallback(this.canvas.toDataURL());
        }
        this.close();
    }

    close() {
        document.getElementById('drawing-modal').classList.remove('active');
        this.onSaveCallback = null;
    }
}

export const imageDrawer = new ImageDrawer();
