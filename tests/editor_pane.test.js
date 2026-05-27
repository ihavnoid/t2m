import { describe, it, expect, vi, beforeEach } from 'vitest';
import { editorPane } from '../scripts/modules/editor_pane.js';

describe('EditorPane Module - Coordinate Updates', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="textedit"></div><div id="textedit_message"></div>';
        
        // Mock getSelection with all required methods
        const mockSelection = {
            rangeCount: 0,
            removeAllRanges: vi.fn(),
            addRange: vi.fn(),
            getRangeAt: vi.fn()
        };
        global.window.getSelection = vi.fn().mockReturnValue(mockSelection);
        
        editorPane.init();
    });

    it('should preserve images when updating coordinates', () => {
        const imgBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        const initialHtml = `<ul><li><img src="${imgBase64}"> Node Text</li></ul>`;
        editorPane.el.innerHTML = initialHtml;

        // Trigger coordinate update
        // We simulate a change descriptor for the first node (index 0)
        const changedesc = [{
            nodenum: 0,
            frozen: true,
            xp: 100,
            yp: 200
        }];

        editorPane.updateTextForCoordinates(changedesc);

        const updatedHtml = editorPane.el.innerHTML;
        
        // Check if header is present
        expect(updatedHtml).toContain("[100 200]");
        // Check if image is still present
        expect(updatedHtml).toContain(`src="${imgBase64}"`);
        // Check if text is still present
        expect(updatedHtml).toContain("Node Text");
    });

    it('should strip old coordinates and add new ones while preserving images', () => {
        const imgBase64 = "data:image/png;base64,header";
        const initialHtml = `<ul><li>[50 50] <img src="${imgBase64}"> Text</li></ul>`;
        editorPane.el.innerHTML = initialHtml;

        const changedesc = [{
            nodenum: 0,
            frozen: true,
            xp: 120,
            yp: 130
        }];

        editorPane.updateTextForCoordinates(changedesc);

        const updatedHtml = editorPane.el.innerHTML;
        
        expect(updatedHtml).not.toContain("[50 50]");
        expect(updatedHtml).toContain("[120 130]");
        expect(updatedHtml).toContain(`src="${imgBase64}"`);
    });

    it('should correctly tokenize images in comment section (after BR)', () => {
        const imgBase64 = "data:image/png;base64,img";
        const initialHtml = `<ul><li>Header<br><img src="${imgBase64}"></li></ul>`;
        editorPane.el.innerHTML = initialHtml;

        editorPane.updateProcessed();
        const processed = editorPane.getProcessed();
        
        // Should produce \0-Header\n\0+\0i[data:...]
        expect(processed).toContain("\0-Header");
        expect(processed).toContain("\n\0+");
        expect(processed).toContain(`\0i[${imgBase64}]`);
    });

    it('should preserve images in comment section through cleanupHTML', () => {
        const imgBase64 = "data:image/png;base64,img";
        // Simulate DOM after Shift+Enter and Paste
        const initialHtml = `<ul><li>Header<br><img src="${imgBase64}"></li></ul>`;
        editorPane.el.innerHTML = initialHtml;

        editorPane.cleanupHTML();
        const finalHtml = editorPane.el.innerHTML;
        
        // Final HTML should contain the image in a comment span
        expect(finalHtml).toContain("Header");
        expect(finalHtml).toContain("<br>");
        expect(finalHtml).toContain(`src="${imgBase64}"`);
        expect(finalHtml).toContain('class="comment"');
    });

    it('should handle image paste into empty comment through cleanupHTML', () => {
        const imgBase64 = "data:image/png;base64,empty_comment_img";
        // Header, followed by a BR, followed by an image
        const initialHtml = `Header<br><img src="${imgBase64}">`;
        // Wrapped in LI
        editorPane.el.innerHTML = `<ul><li>${initialHtml}</li></ul>`;

        editorPane.cleanupHTML();
        const finalHtml = editorPane.el.innerHTML;
        
        expect(finalHtml).toContain("Header");
        expect(finalHtml).toContain("<br>");
        expect(finalHtml).toContain(`src="${imgBase64}"`);
        expect(finalHtml).toContain('class="comment"');
    });

    describe('findSelectedNodes', () => {
        it('should identify a single selected node', () => {
            editorPane.el.innerHTML = '<ul><li>Node 0</li><li>Node 1</li><li>Node 2</li></ul>';
            vi.spyOn(editorPane, 'markCaretPos').mockReturnValue('<ul><li>Node 0</li><li>\0nSelected\0r Node 1</li><li>Node 2</li></ul>');
            const [start, end] = editorPane.findSelectedNodes();
            expect(start).toBe(1);
            expect(end).toBe(1);
            editorPane.markCaretPos.mockRestore();
        });

        it('should identify multiple selected nodes', () => {
            editorPane.el.innerHTML = '<ul><li>Node 0</li><li>Node 1</li><li>Node 2</li></ul>';
            vi.spyOn(editorPane, 'markCaretPos').mockReturnValue('<ul><li>\0nNode 0</li><li>Node 1\0r</li><li>Node 2</li></ul>');
            const [start, end] = editorPane.findSelectedNodes();
            expect(start).toBe(0);
            expect(end).toBe(1);
            editorPane.markCaretPos.mockRestore();
        });

        it('should handle selection at the very beginning of the document', () => {
            editorPane.el.innerHTML = '<ul><li>Node 0</li></ul>';
            vi.spyOn(editorPane, 'markCaretPos').mockReturnValue('\0n\0r<ul><li>Node 0</li></ul>');
            const [start, end] = editorPane.findSelectedNodes();
            expect(start).toBe(0);
            expect(end).toBe(0);
            editorPane.markCaretPos.mockRestore();
        });
    });

    describe('updateTextForCoordinates Selection Preservation', () => {
        it('should not garble text when unfreezing a node with a selection', () => {
            editorPane.el.innerHTML = '<ul><li>[100 100] First Node</li></ul>';
            vi.spyOn(editorPane, 'markCaretPos').mockImplementation(() => '<ul><li>[100 100] First Node\0n\0r</li></ul>');
            editorPane.updateTextForCoordinates([{ nodenum: 0, frozen: false, xp: 0, yp: 0 }]);
            expect(editorPane.el.innerHTML).toBe('<ul><li>First Node</li></ul>');
            editorPane.markCaretPos.mockRestore();
        });

        it('should not garble text when caret is inside the coordinate block being removed', () => {
            editorPane.el.innerHTML = '<ul><li>[100 100] Node</li></ul>';
            vi.spyOn(editorPane, 'markCaretPos').mockImplementation(() => '<ul><li>[100 \0n\0r100] Node</li></ul>');
            editorPane.updateTextForCoordinates([{ nodenum: 0, frozen: false, xp: 0, yp: 0 }]);
            expect(editorPane.el.innerHTML).toBe('<ul><li>Node</li></ul>');
            editorPane.markCaretPos.mockRestore();
        });
    });
});
