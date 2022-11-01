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
                +"<ul>  <li>Start creating your own mindmap by editing this text!</li>"
                +"      <li>Nodes' indentation level used as hierarchy levels</li>"
                +"      <li>Plaintext will be added on the node as comments</li>"
                +"      <li>Nodes with fixed locations will have its [x y] coordinates right after the dash</li>"
                +"      <li>To share the mindmap with other people, please share the links (read-only and read-write) with other people.</li>"
                +"      <ul><li>Read-only pages have an autoupdate option which reloads the contents as it gets edited (with some delay)</li></ul>"
                +"      <li>Careful - there is no locking mechanism permitting multiple people editing the same page!</li></ul>"
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
                +"  <li>Installing</li>"
                +"<ul>  <li>prerequisites<br>"
                +"          Server with php7 or later<br>"
                +"          sqlite3 (and php-sqlite) for storing mindmaps</li>"
                +"      <li>clone http://github.com/ihavnoid/t2m/ and then create config.json<br>"
                +"          Please refer to config.json.example for your own config settings.</li></ul>"
                +"  <li>TODO</li>"
                +"<ul>  <li>Performance optimization<br>"
                +"          Test some ultra-heavy large mindmaps and make sure performance is okay.<br>"
                +"          There are some not-so-scalable code which may cause headaches in the future.</li></ul>"
                +"</ul></ul>",
		"documentTitle": ""
	};

	// Used for converting settings values to actual font-familys.
	const fontFamilyMap = {
		"monospace": "monospace",
		"sans-serif": "sans-serif",
		"serif": "serif",
	};

    let rwkey = null;
    let rokey = null;

    var callstack = 0;
    var last_timestamp = 0;

    function updateKeys(rwkey, rokey) {
        let el1 = document.getElementById("keypane1");
        let el2 = document.getElementById("keypane2");
        if(rwkey) {
            el1.innerHTML = "<a target=\"_blank\" href=\"" + __serverBase__ + "/?k=" + rwkey + "\">Read-Write link</a> &nbsp; ";
            document.getElementById("autoupdate").checked = false;
            document.getElementById("autoupdate").disabled = true;
        } else {
            if(document.getElementById("autoupdate").disabled) {
                el1.innerHTML = "<a>(read-only)</a>";
                document.getElementById("autoupdate").checked = true;
                document.getElementById("autoupdate").disabled = false;
                enableAutoUpdate();
            }
        }
        if(rokey) {
            el2.innerHTML = "<a target=\"_blank\" href=\"" + __serverBase__ + "/?k=" + rokey + "\">Read-Only link</a> &nbsp; ";
        } else {
            el2.innerHTML = "&nbsp;";
        }
        addVisitedPages();
    }
    function createRwKey() {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', __serverBase__ + "/p/n.php");
        xhr.onload = (resp) => {
            if(xhr.status == 200 && !(rokey)) {
                let t = xhr.response;
                t = JSON.parse(t);
                rwkey = t["rwkey"];
                rokey = t["rokey"];
                updateKeys(rwkey, rokey);
                if(rwkey) {
                    editorPane.setEditable(true);
                    setSetting("documentTitle", rwkey);
                } else {
                    setSetting("documentTitle", rokey);
                }
                last_timestamp = 0;
            }
        };
        xhr.send();
    };

    function updateFromServer(key) {
        if(key == "") {
            rwkey = null;
            rokey = null;
            syncToServer();
            return;
        }
        editorPane.setEditable(false);
        let xhr = new XMLHttpRequest();
        xhr.open('POST', __serverBase__ + "/p/r.php");
        let data = new FormData();
        data.append('k', key);
        let ts = last_timestamp;
        data.append('ts', ts);
        xhr.onload = (resp) => {
            if(xhr.status == 200) {
                let t = xhr.response;
                t = JSON.parse(t);
                if(t["contents"]) {
                    rokey = t["rokey"];
                    rwkey = t["rwkey"];
                    last_timestamp = t["timestamp"];
                    updateKeys(rwkey, rokey);
                    editorPane.set(t["contents"]);
                    mindmap.render();
                    if(rwkey) {
                        editorPane.setEditable(true);
                        setSetting("documentTitle", rwkey);
                    } else {
                        editorPane.setEditable(false);
                        setSetting("documentTitle", rokey);
                    }
                } else if(ts == 0) {
                    console.log(t);
                    alert("Cannot find data with matching key " + key);
                }
            }
        };
        xhr.send(data);
    }
    function findTitle() {
        let t2 = editorPane.getProcessed();
        let begin = t2.indexOf('-');
        let end = t2.indexOf('\n', begin);
        t2 = t2.substring(begin+1, end).trim();
        t2 = t2.replace(/^\[[0-9\- ]*\] */g, "");

        return t2;
    }
    function syncToServer() {
        if(!rwkey) {
            createRwKey();
        }
        callstack++;
        setTimeout( () => {
            callstack--;
            if(callstack == 0) {
                let xhr = new XMLHttpRequest();
                xhr.open('POST', __serverBase__ + "/p/w.php");
                let data = new FormData();
                data.append('k', rwkey);

                let t = getSetting("documentContent");
                data.append('contents', t);
                data.append('title', findTitle());
                xhr.send(data);
            }
        }, 2000);
    }

    var history = []
    var redo_history = []

    function addVisitedPages() {
        let setting;
        try {
            setting = JSON.parse(localStorage.getItem(prefix + "visitedPages"));
        } catch (exception) {
            console.log(exception);
        }
        if (!setting || setting == "" || typeof setting == "Array") {
            setting = {};
        }
        if(rokey) {
            let d = { "rokey" : rokey};
            if(setting.hasOwnProperty("rokey")) {
                d = setting[rokey];
            }
            if(rwkey) {
                d["rwkey"] = rwkey;
            }
            d["title"] = findTitle();
            setting[rokey] = d;
        }
        localStorage.setItem(prefix + "visitedPages", JSON.stringify(setting));
        console.log(setting);
    }

	// Get the setting with the specified key. If the setting is null, use the default value.
	function getSetting(key) {
		let setting;
		try {
			setting = JSON.parse(sessionStorage.getItem(prefix+key));
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
			sessionStorage.setItem(prefix+key, JSON.stringify(value));
		} catch (exception) {
			console.error(`Error saving setting.\nKey: ${key}\nValue: ${value}\n`);
		}
        if(key == "documentTitle") {
            if(editorPane.isEditable()) {
                if(rwkey != value) {
                    updateFromServer(value);
                } 
            } else {
                if(rokey != value) {
                    updateFromServer(value);
                }
            }
        } else if(key == "documentContent") {
            syncToServer();
        }
	}
    function enableAutoUpdate() {
        if(!document.getElementById("autoupdate").checked) { return; }

        if(rwkey) {
            return;
        }
        console.log("auto-update");
        updateFromServer(rokey);
        setTimeout(enableAutoUpdate, 2000);
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

    $(document).ready(function() {
        document.getElementById("autoupdate").addEventListener("change", enableAutoUpdate);
    });
	return {
		getSetting,
		setSetting,
        setText, undoText, redoText, clearUndoHistory,
		fontFamilyMap,
		getDefaultValue,
		reset
	};
}());
