// Helper functions for saving and loading user settings with localstorage.
settings = (function() {
	// Used for seperating settings on the same domain
	const prefix = "text2mindmap";
	
	// Default values for various user settings.
	const defaultValues = {

		"documentContent": "<ul>"
                +"<li>t2m</li>"
                +"<ul><li>Author</li>"
                +"<ul>  <li>This is a modified version of text2mindmap<br>"
                +"          https://github.com/tobloef/text2mindmap</li>"
                +"      <li>http://github.com/ihavnoid/t2m/</li></ul>"
                +"    <li><i>[100 -300]</i> Notes</li>"
                +"<ul>  <li>Nodes should start with a dash (-)</li>"
                +"      <li>Plaintext will be added on the node as comments</li>"
                +"      <li>Nodes with fixed locations will have its [x y] coordinates right after the dash</li></ul>"
                +"  <li><i>[100 0]</i> Shortcuts:</li>"
                +"<ul>  <li>ctrl-enter<br>"
                +"          redraw</li>"
                +"      <li>ctrl-]<br>"
                +"          freeze selected nodes in text region</li>"
                +"      <li>ctrl-[<br>"
                +"          unfreeze selected nodes in text region</li>"
                +"      <li>tab / shift-tab<br>"
                +"          indent/de-indent selected region</li>"
                +"      <li>ctrl-z<br>"
                +"          undo</li>"
                +"      <li>ctrl-y<br>"
                +"          redo</li></ul>"
                +"  <li>[-150 0] mouse:</li>"
                +"<ul>  <li>Dragging node<br>"
                +"          moves node location and locks the node position</li>"
                +"      <li>Shift-dragging node<br>"
                +"          moves node and all children's location, and locks only the clicked node</li></ul>"
                +"  <li>TODO</li>"
                +"<ul>  <li>Performance optimization<br>"
                +"          Test some ultra-heavy large mindmaps and make sure performance is okay.<br>"
                +"          There are some not-so-scalable code which may cause headaches in the future.</li></ul>"
                +"</ul></ul>",
		"documentTitle": "untitled"
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

    function setText() {
        let value = editorPane.get();
        let [p1, p2] = editorPane.getPos();
        if(history.length > 0 && value == history[history.length-1][0]) {
            // console.log("setText(short)", value, p1, p2, history.length)
            history[history.length-1][1] = p1
            history[history.length-1][2] = p2
            return
        }
        // console.log("setText", value, p1, p2, history.length)
        history.push([value, p1, p2])
        if(history.length > 100) {
            history.shift()
        }
        redo_history = []
        setSetting("documentContent", value)
    }

    function undoText() {
        if (history.length <= 1) {
            // console.log("undoText (empty)")
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
        // console.log("redoText", t);
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
