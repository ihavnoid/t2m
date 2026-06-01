import { describe, it, expect, vi, beforeEach } from 'vitest';
import { editorPane } from '../scripts/modules/editor_pane.js';

describe('EditorPane - Paste and Link Regression Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '<div id="textedit"></div><div id="textedit_message"></div>';
        editorPane.init();
        
        // Mock common editor dependencies
        vi.spyOn(editorPane, 'refresh').mockImplementation(() => {
            editorPane.cleanupHTML();
            return true;
        });
    });

    /**
     * UTILITY: Mock browser selection
     */
    function mockSelection(container, offset) {
        const range = {
            startContainer: container,
            startOffset: offset,
            deleteContents: vi.fn(),
            insertNode: vi.fn((node) => {
                // Better insertNode mock
                if (container.nodeType === 3) { // Text node
                    const parent = container.parentNode;
                    const next = container.nextSibling;
                    if (node.nodeType === 11) {
                        while (node.firstChild) parent.insertBefore(node.firstChild, next);
                    } else {
                        parent.insertBefore(node, next);
                    }
                } else {
                    const ref = container.childNodes[offset];
                    if (node.nodeType === 11) {
                        while (node.firstChild) container.insertBefore(node.firstChild, ref);
                    } else {
                        if (ref) container.insertBefore(node, ref);
                        else container.appendChild(node);
                    }
                }
            }),
            setStartAfter: vi.fn(),
            setStart: vi.fn(),
            collapse: vi.fn(),
            get commonAncestorContainer() { return container; }
        };
        const selection = {
            rangeCount: 1,
            getRangeAt: () => range,
            removeAllRanges: vi.fn(),
            addRange: vi.fn(),
        };
        vi.spyOn(editorPane, 'getWindow').mockReturnValue({ getSelection: () => selection });
        return selection;
    }

    describe('Single-Node vs Multi-Node Paste', () => {
        it('should merge single-node HTML paste inline', async () => {
            editorPane.el.innerHTML = '<ul><li><span class="header">Parent</span></li></ul>';
            const li = editorPane.el.querySelector('li');
            mockSelection(li, 1);

            const html = '<ul><li>Pasted</li></ul>';
            await editorPane._processPasteContent(html, "");

            // Should be merged into the existing LI
            expect(li.textContent).toBe('ParentPasted');
        });

        it('should move block-paste to the end of node and insert as siblings', async () => {
            editorPane.el.innerHTML = '<ul><li id="p1"><span class="header">Parent</span><br><span class="comment">Comment</span></li></ul>';
            const header = editorPane.el.querySelector('.header');
            mockSelection(header.firstChild, 3); // middle of "Parent"

            const html = '<ul><li>New 1</li><li>New 2</li></ul>';
            await editorPane._processPasteContent(html, "");

            // Should NOT be inside the first LI
            const lis = editorPane.el.querySelectorAll('#textedit > ul > li');
            expect(lis.length).toBe(3);
            expect(lis[0].textContent).toContain('Parent');
            expect(lis[1].textContent).toBe('New 1');
        });
    });

    describe('Comment Mode Paste', () => {
        it('should treat multi-line plaintext as comments when in a comment section', async () => {
            editorPane.el.innerHTML = '<ul><li><span class="header">Node</span><br><span class="comment"></span></li></ul>';
            const commentSpan = editorPane.el.querySelector('.comment');
            mockSelection(commentSpan, 0);

            const text = 'Line 1\nLine 2';
            await editorPane._processPasteContent("", text, true);

            // Should be joined by BR and eventually wrapped in comment spans by cleanupHTML
            expect(editorPane.el.querySelectorAll('li').length).toBe(1);
            expect(editorPane.el.innerHTML).toContain('Line 1');
            expect(editorPane.el.innerHTML).toContain('Line 2');
        });

        it('should override comment mode when pasting structured HTML', async () => {
            editorPane.el.innerHTML = '<ul><li><span class="header">Node</span><br></li></ul>';
            const li = editorPane.el.querySelector('li');
            mockSelection(li, 2); // After header and BR

            const html = '<ul><li>Sub Branch<ul><li>Leaf</li></ul></li></ul>';
            await editorPane._processPasteContent(html, "");

            // Should jump out and paste as sibling
            const rootLis = editorPane.el.querySelectorAll('#textedit > ul > li');
            expect(rootLis.length).toBe(2);
            expect(rootLis[1].textContent).toContain('Sub Branch');
        });
    });

    describe('Link Support', () => {
        it('cleanupHTML should preserve <a> tags with href and target', () => {
            editorPane.el.innerHTML = '<ul><li><a href="https://google.com">Search</a></li></ul>';
            editorPane.cleanupHTML();

            const a = editorPane.el.querySelector('a');
            expect(a).not.toBeNull();
            expect(a.getAttribute('href')).toBe('https://google.com');
            expect(a.getAttribute('target')).toBe('_blank');
            expect(a.textContent).toBe('Search');
        });

        it('updateTextForCoordinates should preserve <a> tags', () => {
            editorPane.el.innerHTML = '<ul><li><a href="https://google.com">Search</a></li></ul>';
            editorPane.documentEditable = true;
            editorPane.updateTextForCoordinates([{ nodenum: 0, frozen: true, xp: 50, yp: 50 }]);

            expect(editorPane.el.innerHTML).toContain('[50 50]');
            expect(editorPane.el.querySelector('a')).not.toBeNull();
        });

        it('should process text/link-preview MIME type', async () => {
            const data = JSON.stringify({ url: 'https://t2m.com', title: 'T2M' });
            const mockClipboard = {
                items: [],
                getData: (mime) => (mime === 'text/link-preview' ? data : '')
            };
            const ev = { clipboardData: mockClipboard, preventDefault: vi.fn() };
            
            // Need a valid selection for insertAtCursor
            editorPane.el.innerHTML = '<ul><li></li></ul>';
            mockSelection(editorPane.el.querySelector('li'), 0);

            vi.spyOn(editorPane, 'insertAtCursor');
            await editorPane._handlePaste(ev);

            expect(ev.preventDefault).toHaveBeenCalled();
            const frag = editorPane.insertAtCursor.mock.calls[0][0];
            expect(frag.getAttribute('href')).toBe('https://t2m.com');
            expect(frag.textContent).toBe('T2M');
        });
    });

    describe('Comment Precision', () => {
        it('should preserve prefixes in structural comments (depth -2)', async () => {
            editorPane.el.innerHTML = '<ul><li></li></ul>';
            mockSelection(editorPane.el.querySelector('li'), 0);
            
            const html = '<ul><li>Node<br><span class="comment">// Important Code Comment</span></li></ul>';
            await editorPane._processPasteContent(html, "");
            expect(editorPane.el.innerHTML).toContain('// Important Code Comment');
        });

        it('should strip prefixes in heuristic comments (depth -1)', async () => {
            editorPane.el.innerHTML = '<ul><li></li></ul>';
            mockSelection(editorPane.el.querySelector('li'), 0);

            const text = 'Node\n// Plaintext Comment';
            await editorPane._processPasteContent("", text);
            expect(editorPane.el.innerHTML).toContain('Plaintext Comment');
            expect(editorPane.el.innerHTML).not.toContain('//');
        });
    });
});
