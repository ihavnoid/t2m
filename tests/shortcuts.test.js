import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shortcuts } from '../scripts/modules/shortcuts.js';

describe('Shortcuts Module', () => {
    beforeEach(() => {
        shortcuts.bindings = {};
    });

    it('should add a single binding correctly', () => {
        const callback = vi.fn();
        shortcuts.addBinding('Ctrl+S', callback);
        expect(shortcuts.bindings['ctrl+s']).toBe(callback);
    });

    it('should add multiple bindings correctly', () => {
        const cb1 = vi.fn();
        const cb2 = vi.fn();
        shortcuts.addBindings({
            'Ctrl+N': cb1,
            'Alt+X': cb2
        });
        expect(shortcuts.bindings['ctrl+n']).toBe(cb1);
        expect(shortcuts.bindings['alt+x']).toBe(cb2);
    });

    it('should correctly identify equal key arrays', () => {
        expect(shortcuts.keysEqual(['ctrl', 's'], ['S', 'CTRL'])).toBe(true);
        expect(shortcuts.keysEqual(['ctrl', 's'], ['ctrl', 'n'])).toBe(false);
        expect(shortcuts.keysEqual(['ctrl'], ['ctrl', 'shift'])).toBe(false);
    });

    it('should handle keypress and trigger callback', () => {
        const callback = vi.fn();
        shortcuts.addBinding('Ctrl+S', callback);
        
        const event = {
            key: 's',
            ctrlKey: true,
            shiftKey: false,
            altKey: false,
            preventDefault: vi.fn()
        };
        
        shortcuts.handleKeypress(event);
        
        expect(event.preventDefault).toHaveBeenCalled();
        expect(callback).toHaveBeenCalled();
    });

    it('should NOT trigger callback for wrong shortcut', () => {
        const callback = vi.fn();
        shortcuts.addBinding('Ctrl+S', callback);
        
        const event = {
            key: 'n',
            ctrlKey: true,
            shiftKey: false,
            altKey: false,
            preventDefault: vi.fn()
        };
        
        shortcuts.handleKeypress(event);
        
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
    });
});
