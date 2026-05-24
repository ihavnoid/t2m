import { describe, it, expect, vi } from 'vitest';
import { unsavedChanges } from '../scripts/modules/unsaved_changes.js';

describe('UnsavedChanges Module', () => {
    it('should initialize with no changes', () => {
        expect(unsavedChanges.getHasChanges()).toBe(false);
    });

    it('should correctly set hasChanges', () => {
        unsavedChanges.setHasChanges(true);
        expect(unsavedChanges.getHasChanges()).toBe(true);
        unsavedChanges.setHasChanges(false);
        expect(unsavedChanges.getHasChanges()).toBe(false);
    });

    it('should confirm continue when there are no changes', () => {
        unsavedChanges.setHasChanges(false);
        const result = unsavedChanges.confirmContinue();
        expect(result).toBe(true);
        expect(global.confirm).not.toHaveBeenCalled();
    });

    it('should show confirm dialog when there are unsaved changes', () => {
        unsavedChanges.setHasChanges(true);
        global.confirm = vi.fn(() => true);
        
        const result = unsavedChanges.confirmContinue();
        
        expect(global.confirm).toHaveBeenCalled();
        expect(result).toBe(true);
    });
});
