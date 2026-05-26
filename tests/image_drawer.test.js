import { describe, it, expect, vi, beforeEach } from 'vitest';
import { imageDrawer } from '../scripts/modules/image_drawer.js';

describe('ImageDrawer Module', () => {
    beforeEach(() => {
        // Setup a minimal DOM for the drawer
        document.body.innerHTML = `
            <div id="drawing-modal">
                <button id="draw-tool-pen"></button>
                <button id="draw-tool-eraser"></button>
                <button id="draw-tool-undo"></button>
                <button id="draw-tool-redo"></button>
                <button id="draw-tool-clear"></button>
                <div id="drawing-modal-footer">
                   <button id="draw-save"></button>
                </div>
                <div class="color-picker">
                    <button class="color-swatch" data-color="#000000"></button>
                </div>
                <div class="thickness-picker">
                    <button class="thickness-swatch" data-thickness="2"></button>
                    <button class="thickness-swatch active" data-thickness="5"></button>
                </div>
                <div id="drawing-canvas-container">
                    <canvas id="drawing-canvas"></canvas>
                </div>
            </div>
        `;
        imageDrawer.history = [];
        imageDrawer.redoHistory = [];
        imageDrawer.isDrawing = false;
        imageDrawer.isActive = false;
        imageDrawer.init();
    });

    it('should initialize with pen tool active', () => {
        expect(imageDrawer.currentTool).toBe('pen');
    });

    it('should switch tools correctly', () => {
        imageDrawer.setTool('eraser');
        expect(imageDrawer.currentTool).toBe('eraser');
        expect(imageDrawer.context.strokeStyle).toBe('white');

        imageDrawer.setTool('pen');
        expect(imageDrawer.currentTool).toBe('pen');
        expect(imageDrawer.context.strokeStyle).toBe('#000000');
        expect(imageDrawer.context.lineWidth).toBe(5);
    });

    it('should start drawing on mousedown', () => {
        const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
        imageDrawer.canvas.dispatchEvent(event);
        expect(imageDrawer.isDrawing).toBe(true);
        expect(imageDrawer.lastPos).toEqual({ x: 100, y: 100 });
    });

    it('should stop drawing on mouseup and save snapshot', () => {
        imageDrawer.isDrawing = true;
        const event = new MouseEvent('mouseup');
        window.dispatchEvent(event);
        expect(imageDrawer.isDrawing).toBe(false);
        expect(imageDrawer.history.length).toBe(1);
    });

    it('should clear canvas and save snapshot', () => {
        global.confirm = vi.fn(() => true);
        imageDrawer.clear();
        expect(imageDrawer.context.fillRect).toHaveBeenCalled();
        expect(imageDrawer.history.length).toBe(1);
    });

    it('should undo last action', async () => {
        // Mock snapshots
        imageDrawer.history = [
            { dataUrl: 'state1', width: 100, height: 100 },
            { dataUrl: 'state2', width: 200, height: 200 }
        ];
        imageDrawer.undo();
        // Undo pops the current state and restores the previous one
        expect(imageDrawer.history.length).toBe(1);
        expect(imageDrawer.history[0].dataUrl).toBe('state1');
    });

    it('should resize canvas correctly', () => {
        imageDrawer.canvas.width = 100;
        imageDrawer.canvas.height = 100;
        
        // Mock clearRect and drawImage for resize
        const ctx = imageDrawer.context;
        
        imageDrawer.resizeCanvas(200, 200, 0, 0);
        
        expect(imageDrawer.canvas.width).toBe(200);
        expect(imageDrawer.canvas.height).toBe(200);
        expect(ctx.fillRect).toHaveBeenCalled(); // Background fill
        expect(ctx.drawImage).toHaveBeenCalled(); // Restore content
    });

    it('should handle expansion in Top and Left directions with offsets', () => {
        imageDrawer.canvas.width = 100;
        imageDrawer.canvas.height = 100;
        
        // Expand Left by 50px
        // newWidth = 150, contentOffsetX = 50
        imageDrawer.resizeCanvas(150, 100, 50, 0);
        
        expect(imageDrawer.canvas.width).toBe(150);
        expect(imageDrawer.context.drawImage).toHaveBeenCalledWith(expect.anything(), 50, 0);
    });

    it('should redo last undone action', async () => {
        // Mock snapshots
        imageDrawer.history = [
            { dataUrl: 'state1', width: 100, height: 100 },
            { dataUrl: 'state2', width: 200, height: 200 }
        ];
        imageDrawer.redoHistory = [];
        
        // Undo first
        imageDrawer.undo();
        expect(imageDrawer.history.length).toBe(1);
        expect(imageDrawer.redoHistory.length).toBe(1);
        
        // Redo
        imageDrawer.redo();
        expect(imageDrawer.history.length).toBe(2);
        expect(imageDrawer.redoHistory.length).toBe(0);
        expect(imageDrawer.history[1].dataUrl).toBe('state2');
    });

    it('should disable undo/redo buttons when appropriate', () => {
        const undoBtn = document.getElementById('draw-tool-undo');
        const redoBtn = document.getElementById('draw-tool-redo');
        
        imageDrawer.open();
        // Initial state: 1 snapshot in history, 0 in redo
        expect(undoBtn.disabled).toBe(true);
        expect(redoBtn.disabled).toBe(true);
        
        // Add snapshot
        imageDrawer.saveSnapshot();
        expect(undoBtn.disabled).toBe(false);
        expect(redoBtn.disabled).toBe(true);
        
        // Undo
        imageDrawer.undo();
        expect(undoBtn.disabled).toBe(true);
        expect(redoBtn.disabled).toBe(false);
        
        // Redo
        imageDrawer.redo();
        expect(undoBtn.disabled).toBe(false);
        expect(redoBtn.disabled).toBe(true);
    });

    it('should respect max resolution constraints (1000x1000)', () => {
        imageDrawer.canvas.width = 100;
        imageDrawer.canvas.height = 100;
        imageDrawer.activeHandle = 'br';
        imageDrawer.isResizing = true;
        imageDrawer.startResizeState = { 
            width: 100, 
            height: 100, 
            clientX: 0, 
            clientY: 0,
            sourceCanvas: document.createElement('canvas')
        };

        // Attempt to resize to 2000x2000
        imageDrawer.doResize({ clientX: 1900, clientY: 1900 });

        expect(imageDrawer.canvas.width).toBe(1000);
        expect(imageDrawer.canvas.height).toBe(1000);
    });

    it('should track isActive state', () => {
        expect(imageDrawer.isActive).toBe(false);
        imageDrawer.open();
        expect(imageDrawer.isActive).toBe(true);
        imageDrawer.close();
        expect(imageDrawer.isActive).toBe(false);
    });
});
