(function() {
    if (/Mobi/.test(navigator.userAgent)) {
        alert("The website doesn't currently work very well in mobile browsers, so it's recommended that you use a computer. Sorry about that!")
    }

    $(document).ready(function() {
        editorPane.setEditable(false);

        // Before the user closes the window, warn them if they have unsaved changes.
        $(window).on("beforeunload", function(event) {
            if (unsavedChanges.getHasChanges() && false ) { //TODO:
                const message = "You have unsaved changes. Are you sure you want to leave without saving?";
                if (event) {
                    event.returnValue = message;
                }
                return message;
            }
            return;
        });

        // Set up shortcut bindings
	    $(document).on("keydown", shortcuts.handleKeypress);
	    const bindings = {
            "Ctrl+N": appFunctions.fileNew,
            "Ctrl+O": appFunctions.fileOpen,
            "Ctrl+S": appFunctions.fileSave,
            "Ctrl+Z": appFunctions.editUndo,
            "Ctrl+Y": appFunctions.editRedo
        };
        shortcuts.addBindings(bindings);

        $("#modal-settings-save").on("click", function() {
            $(".modal").removeClass("active");
        });

        var updateStack = 0;
        var lastUpdateTime = 0;
        function updateMindMap() {
            updateStack++;
            const value = editorPane.get();
            unsavedChanges.setHasChanges(true);
            settings.setText();
            setTimeout(() => {
                updateStack--;
                if(updateStack > 0 || lastUpdateTime > Date.now() - 200) {
                    return;
                }
                lastUpdateTime = Date.now()
                mindmap.render();
            }, 200);
        }

        editorPane.on("mouseup touchend", function(e) {
            // Doesn't really update text, just for cursor positions
            setTimeout(()=> {
                settings.setText()
                mindmap.redraw()
            }, 1);
        });
        editorPane.on("keydown", function(e) {
            let keyCode = e.keyCode || e.which;
            if (keyCode == 9 || keyCode == 13 || keyCode == 219 || keyCode == 221) { 
                updateMindMap();
            } 
            unsavedChanges.setHasChanges(true);
            setTimeout(()=> {
                settings.setText()
                mindmap.redraw()
            }, 1);
        });
        
        $("#mindmap-lock-all").on("touchstart click", function(a) {
            settings.setText()
            navbar.closeDropdowns()
        });
        $("#mindmap-unlock-all").on("touchstart click", function(a) {
            settings.setText()
            navbar.closeDropdowns()
        });
        editorPane.observe(updateMindMap);
    })
}());
