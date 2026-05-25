import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mindmap } from '../scripts/modules/mindmap.js';

describe('Mindmap Parser robustnes', () => {
    beforeEach(() => {
        // Mock global dependencies if needed, though mindmap.js uses window.*
        global.editorPane = {
            setNodeColor: vi.fn(),
            refresh: vi.fn(),
            getProcessed: vi.fn(),
            updateTextForCoordinates: vi.fn(),
            findSelectedNodes: vi.fn().mockReturnValue([0, -1])
        };
        global.unsavedChanges = {
            setHasChanges: vi.fn()
        };
    });

    it('should not throw when j_ptr reaches j2 in replace tag', () => {
        // This is a bit tricky to trigger without full engine init, 
        // but we can try to call text2mindmap directly if we mock enough.
        
        // Let's mock the engine part that text2mindmap uses
        const mockEngine = mindmap.createEngine('stageHolder', {});
        mindmap.d = mockEngine;
        
        // Initial state
        mindmap.y = "\0-Node 1\n\0-Node 2";
        
        // New state with a replacement that is shorter than original
        // e.g. replacing 2 lines with 1 line.
        // difflib might return a 'replace' opcode with i2-i1=2 and j2-j1=1
        const newText = "\0-Node 1 modified";
        
        // We need to mock difflib.SequenceMatcher to return specifically what we want
        global.difflib.SequenceMatcher = class {
            constructor() {
                this.get_opcodes = vi.fn().mockReturnValue([
                    ['replace', 0, 2, 0, 1]
                ]);
            }
        };
        global.difflib.stringAsLines = vi.fn((s) => s.split('\n'));

        // This should not throw
        expect(() => {
            mindmap.d.text2mindmap(newText);
        }).not.toThrow();
    });
});
