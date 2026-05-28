/**
 * Manages unsaved changes state and confirmation dialogs.
 */
class UnsavedChanges {
    constructor() {
        this.hasChanges = false;
    }

    setHasChanges(value) {
        this.hasChanges = !!value;
    }

    getHasChanges() {
        return this.hasChanges;
    }

    confirmContinue() {
        if (this.hasChanges) {
            return confirm(
                "You have unsaved changes. Are you sure you want to continue?",
            );
        }
        return true;
    }
}

export const unsavedChanges = new UnsavedChanges();
