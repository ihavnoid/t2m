// Helper functions for saving and loading user settings with localstorage.
settings = (function() {
	// Used for seperating settings on the same domain
	const prefix = "text2mindmap";
	
	// Default values for various user settings.
	const defaultValues = {
		"documentContent": "-t2m\n"
                + "  - This is a modified version of text2mindmap\n"
                + "  - http://github.com/ihavnoid/t2m/\n"
                + "  - [100 -300] Notes\n    - Nodes should start with a dash (-)\n"
                + "    - Plaintext will be added on the node as comments\n"
                + "    - Nodes with fixed locations will have its [x y] coordinates right after the dash\n" 
                + "  - [100 0] shortcuts:\n"
                + "    - ctrl-enter\n"
                + "      redraw\n"
                + "    - ctrl-]\n"
                + "      freeze selected nodes in text region\n"
                + "    - ctrl-[\n"
                + "      unfreeze selected nodes in text region\n"
                + "    - tab / shift-tab\n"
                + "      indent/de-indent selected region\n"
                + "    - ctrl-z\n"
                + "      undo\n"
                + "    - ctrl-y\n"
                + "      redo\n"
                + "  - [100 300] mouse:\n"
                + "    - Dragging node\n"
                + "      moves node location and locks the node position\n"
                + "    - Shift-dragging node\n"
                + "      moves node and all children's location, and locks only the clicked node\n"
                + "  - TODO:\n"
                + "    - Auto-layout keeps overlapping nodes.  Come up with custom layout engine\n",
 
		"documentTitle": "Untitled Document"
	};

	// Used for converting settings values to actual font-familys.
	const fontFamilyMap = {
		"monospace": "monospace",
		"sans-serif": "sans-serif",
		"serif": "serif",
	};

    var history = []
    var redo_history = []
	// Get the setting with the specified key. If the setting is null, use the default value.
	function getSetting(key) {
		let setting;
		try {
			setting = JSON.parse(localStorage.getItem(prefix+key));
		} catch (exception) {
			// Ignored
		}
		if (!setting || setting == "") {
			setting = getDefaultValue(key);
			setSetting(key, setting);
		}
		return setting;
	}

	// Set the setting with the specified key to the specified value.
	function setSetting(key, value) {
		if (!value) {
			value = getDefaultValue(key);
		}
		try {
			localStorage.setItem(prefix+key, JSON.stringify(value));
		} catch (exception) {
			console.error(`Error saving setting.\nKey: ${key}\nValue: ${value}\n`);
		}
	}

    function setText(value, p1, p2) {
        if(history.length > 0 && value == history[history.length-1][0]) {
            history[history.length-1][1] = p1
            history[history.length-1][2] = p2
            return
        }
        history.push([value, p1, p2])
        if(history.length > 100) {
            history.shift()
        }
        redo_history = []
        setSetting("documentContent", value)
    }

    function undoText() {
        if (history.length <= 1) {
            return null
        }
        var t = history.pop() 
        redo_history.push(t)
        t = history[history.length-1]
        setSetting("documentContent", t[0])
        return t
    }

    function redoText() {
        if (redo_history.length == 0) {
            return null
        }
        var t = redo_history.pop() 
        history.push(t)
        setSetting("documentContent", t[0])
        return t
    }

    function clearUndoHistory() {
        redo_history = []
        history = []
    }
	// Get the default value of the setting with the specified key.
	function getDefaultValue(key) {
		if (key in defaultValues) {
			return defaultValues[key];
		}
	}

	// Reset all the settings to their default values.
	function reset() {
		for (let key in defaultValues) {
			setSetting(key, getDefaultValue(key));
		}
	}

	return {
		getSetting,
		setSetting,
        setText, undoText, redoText, clearUndoHistory,

		fontFamilyMap,
		getDefaultValue,
		reset
	};
}());
