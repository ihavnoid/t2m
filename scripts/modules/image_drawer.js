/**
 * Image drawing tool logic using HTML5 Canvas.
 */
class ImageDrawer {
    constructor() {
        this.canvas = null;
        this.context = null;
        this.isDrawing = false;
        this.currentTool = 'pen'; // 'pen' or 'eraser'
        this.history = [];
        this.onSaveCallback = null;
        this.lastPos = { x: 0, y: 0 };
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

        // Mouse Events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch Events
        this.canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });
    }

    open(base64Image, callback) {
        this.onSaveCallback = callback;
        this.history = [];
        
        // Size the canvas dynamically
        const container = document.getElementById('drawing-canvas-container');
        this.canvas.width = container.clientWidth - 40;
        this.canvas.height = 600;

        // Reset Styles
        this.context.lineJoin = 'round';
        this.context.lineCap = 'round';
        this.context.lineWidth = 3;
        this.setTool('pen');

        if (base64Image) {
            const img = new Image();
            img.onload = () => {
                // If the loaded image is bigger than current canvas, resize canvas
                if (img.width > this.canvas.width) this.canvas.width = img.width;
                if (img.height > this.canvas.height) this.canvas.height = img.height;
                
                this.context.fillStyle = 'white';
                this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.context.drawImage(img, 0, 0);
                this.saveSnapshot(); // Initial state
            };
            img.src = base64Image;
        } else {
            this.context.fillStyle = 'white';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveSnapshot(); // Initial state
        }

        document.getElementById('drawing-modal').classList.add('active');
    }

    setTool(tool) {
        this.currentTool = tool;
        document.getElementById('draw-tool-pen').classList.toggle('active', tool === 'pen');
        document.getElementById('draw-tool-eraser').classList.toggle('active', tool === 'eraser');
        
        if (tool === 'pen') {
            this.context.globalCompositeOperation = 'source-over';
            this.context.strokeStyle = 'black';
            this.context.lineWidth = 3;
        } else {
            // Since background is white, eraser is just a white pen
            this.context.globalCompositeOperation = 'source-over';
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

    saveSnapshot() {
        this.history.push(this.canvas.toDataURL());
        if (this.history.length > 50) this.history.shift();
    }

    undo() {
        if (this.history.length <= 1) return;
        
        this.history.pop(); // Remove current state
        const lastState = this.history[this.history.length - 1];
        
        const img = new Image();
        img.onload = () => {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.drawImage(img, 0, 0);
        };
        img.src = lastState;
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
