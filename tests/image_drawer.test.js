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
                <button id="draw-tool-clear"></button>
                <div id="drawing-modal-footer">
                   <button id="draw-save"></button>
                </div>
                <div id="drawing-canvas-container">
                    <canvas id="drawing-canvas"></canvas>
                </div>
            </div>
        `;
        imageDrawer.history = [];
        imageDrawer.isDrawing = false;
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
        expect(imageDrawer.context.strokeStyle).toBe('black');
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
        imageDrawer.canvas.dispatchEvent(event);
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
        imageDrawer.history = ['state1', 'state2'];
        imageDrawer.undo();
        // Undo pops the current state and restores the previous one
        expect(imageDrawer.history.length).toBe(1);
        expect(imageDrawer.history[0]).toBe('state1');
    });
});
