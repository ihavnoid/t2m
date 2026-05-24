/**
 * A library of various functions that can be called by the app.
 * This is kept in a separate module, so the navbar and the shortcuts can call the same functions.
 */
class AppFunctions {
    // Discard the current document and create an empty one.
    fileNew() {
        if (!window.unsavedChanges.confirmContinue()) {
            return;
        }
        window.settings.createNew();
        if (window.mindmap && window.mindmap.render) {
            window.mindmap.render();
        }
        window.unsavedChanges.setHasChanges(false);
    }

    // Open a markdown file from the user's computer
    fileOpen() {
        if (!window.unsavedChanges.confirmContinue()) {
            return;
        }
        window.fileImport.chooseFile();
    }

    // Save the current markdown document to the user's computer
    fileSave() {
        const content = window.editorPane.get();
        const title = window.settings.findTitle();
        const type = ".mindtxt";
        window.fileExport.saveFile(content, title, type);
        window.unsavedChanges.setHasChanges(false);
        window.settings.clearUndoHistory();
    }

    // Set the focus on the input box for renaming the document
    fileRename() {
        // documentTitle was mentioned in original code but doesn't seem to be a global object anymore or yet
        // documentTitle.focus();
    }

    // Open the settings modal
    filePreferences() {
        $("#settings-modal").addClass("active");
    }

    editUndo() {
        const v = window.settings.undoText();
        if (v == null) {
            return;
        }
        window.editorPane.set(v[0]);
        window.editorPane.setPos(v[1], v[2]);
        window.unsavedChanges.setHasChanges(true);
        if (window.mindmap && window.mindmap.render) {
            window.mindmap.render();
        }
    }

    editRedo() {
        const v = window.settings.redoText();
        if (v == null) {
            return;
        }
        window.editorPane.set(v[0]);
        window.editorPane.setPos(v[1], v[2]);
        window.unsavedChanges.setHasChanges(true);
        if (window.mindmap && window.mindmap.render) {
            window.mindmap.render();
        }
    }
}

export const appFunctions = new AppFunctions();
