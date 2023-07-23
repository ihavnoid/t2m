// A library of various functions that can be called by the app.
// This is kept in a seperate module, so the navbar and the shortcuts can call the same functions.

appFunctions = (function() {
	return {
		// Discard the current document and create an empty one.
		fileNew() {
			if (!unsavedChanges.confirmContinue()) {
				return;
			}
            settings.createNew();
			mindmap.render();
			unsavedChanges.setHasChanges(false);
		},

		// Open a markdown file from the user's computer
		fileOpen() {
			if (!unsavedChanges.confirmContinue()) {
				return;
			}
			fileImport.chooseFile();
		},

		// Save the current markdown document to the user's computer
		fileSave() {
			const content = editorPane.get();
			const title = settings.findTitle();
			const type = ".mindtxt";
			fileExport.saveFile(content, title, type);
			unsavedChanges.setHasChanges(false);
            settings.clearUndoHistory();
		},

		// Set the focus on the input box for renaming the document
		fileRename() {
			documentTitle.focus();
		},

		// Open the settings modal
		filePreferences() {
			$("#settings-modal").addClass("active");
		},

        editUndo() {
            const v = settings.undoText()
            if(v == null) {
                return
            }
            editorPane.set(v[0])
            editorPane.setPos(v[1], v[2])
			unsavedChanges.setHasChanges(true);
            mindmap.render()
        },
        editRedo() {
            const v = settings.redoText()
            if(v == null) {
                return
            }
            editorPane.set(v[0])
            editorPane.setPos(v[1], v[2])
			unsavedChanges.setHasChanges(true);
            mindmap.render()
        }
	};
}());
