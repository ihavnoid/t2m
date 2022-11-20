// Helper functions for saving and loading user settings with localstorage.
settings = (function() {
	// Used for seperating settings on the same domain
	const prefix = "text2mindmap";
	
	// Default values for various user settings.
	const defaultContent = "<ul>"
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
        +"</ul></ul>";

	// Used for converting settings values to actual font-familys.
	const fontFamilyMap = {
		"monospace": "monospace",
		"sans-serif": "sans-serif",
		"serif": "serif",
	};

    let rwkey = null;
    let rokey = null;
    let seq = 0;

    var callstack = 0;
    var last_timestamp = 0;
    var last_push_time = 0;

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

    function findTitle() {
        let t2 = editorPane.getProcessed();
        let begin = t2.indexOf('\0-');
        let end = t2.indexOf('\n', begin);
        t2 = t2.substring(begin+0, end).trim();
        t2 = t2.replace(/^\[[0-9\- ]*\] */g, "");

        return t2;
    }

    let xhr = new XMLHttpRequest();
    function createRwKey() {
        console.log("createRwKey");
        console.assert(xhr.readyState == 0 || xhr.readyState == 4, "Illegal XHR state");
        xhr.open('GET', __serverBase__ + "/p/n.php");
        xhr.onload = (resp) => {
            if(xhr.status == 200) {
                let t = xhr.response;
                t = JSON.parse(t);
                console.log("createRwKey", "resp", t);
                if(rokey) {
                    // race condition - we already have key.
                    // barf as we don't want to throw away key from server
                    return;
                } 
                rwkey = t["rwkey"];
                rokey = t["rokey"];
                seq = t["seq"];
                if(rwkey) {
                    editorPane.setEditable(true);
                    sessionStorage.setItem(prefix + "documentTitle", JSON.stringify(rwkey));
                } else {
                    editorPane.setEditable(false);
                    sessionStorage.setItem(prefix + "documentTitle", JSON.stringify(rokey));
                }
                updateKeys(rwkey, rokey);
                last_timestamp = 0;
    
                // attempt to push data only if we actually have a RW key
                if(rwkey) {
                    syncToServer();
                }
            } else {
                // try again after 500ms
                setTimeout(createRwKey, globals.query_retry_period);
            }
        };
        xhr.onerror = (resp) => {
            // try again after 500ms
            setTimeout(createRwKey, globals.query_retry_period);
        };
        xhr.send();
    };

    function updateFromServer(key) {
        console.log("updateFromServer", key);
        console.assert(xhr.readyState == 0 || xhr.readyState == 4, "Illegal XHR state");

        xhr.open('POST', __serverBase__ + "/p/r.php");
        let data = new FormData();
        data.append('k', key);
        let ts = last_timestamp;
        data.append('ts', ts);
        xhr.onload = (resp) => {
            if(xhr.status == 200) {
                let t = xhr.response;
                t = JSON.parse(t);
                console.log("updateFromServer", "resp", t);
                if(t["contents"]) {
                    rokey = t["rokey"];
                    rwkey = t["rwkey"];
                    seq = t["seq"];

                    if(editorPane.get() != t["contents"]) {
                        editorPane.set(t["contents"]);
                        editorPane.refresh();
                        mindmap.render();
                    }
                    updateKeys(rwkey, rokey);

                    if(rwkey) {
                        if(t["lockdelay"] > 0) {
                            editorPane.setEditable(false, "Somebody else is editing... please wait");
                            // if server asked us to wait for lock, wait at least 2 seconds and poll again
                            setTimeout( () => { updateFromServer(key) }, Math.min(globals.lock_poll_period, t["lockdelay"]));
                        } else {
                            last_timestamp = t["timestamp"];
                            sessionStorage.setItem(prefix + "documentTitle", JSON.stringify(rwkey));
                            callstack++;
                            syncToServerImmediately();
                        }
                    } else {
                        last_timestamp = t["timestamp"];
                        editorPane.setEditable(false);
                        sessionStorage.setItem(prefix + "documentTitle", JSON.stringify(rokey));
                    }
                } else if(ts == 0) {
                    console.log(t);
                    alert("Cannot find data with matching key " + key);
                }
            } else {
                // try again after 500ms
                setTimeout( () => { updateFromServer(key) }, globals.query_retry_period);
            }
        };
        xhr.onerror = () => {
            setTimeout( () => { updateFromServer(key) }, globals.query_retry_period);
        };
        xhr.send(data);
    }
    function syncToServerImmediately() {
        console.log("synctoServer", "push", rwkey);
        console.assert(xhr.readyState == 0 || xhr.readyState == 4, "Illegal XHR state");
        xhr.open('POST', __serverBase__ + "/p/w.php");
        let data = new FormData();
        data.append('k', rwkey);

        let t = editorPane.get();
        data.append('contents', t);
        data.append('sync', 0);
        data.append('title', findTitle());
        data.append('seq', seq);
        xhr.onload = (resp) => {
            let t = xhr.response;
            if(t != "1") {
                console.log("Failed syncing");
                editorPane.setEditable(false);
                console.assert(rwkey, "No WR key and we are updating from server?");
                updateFromServer(rwkey);
            } else {
                // we successfully written to the server.  We probably have the right to write
                editorPane.setEditable(true);
                seq += 1;
                last_push_time = Date.now();
            }
            if(callstack > 0) {
                callstack--;
            }
        };
        xhr.onerror = () => {
            console.log("Failed syncing - socket error");
            editorPane.setEditable(false);
            console.assert(rwkey, "No WR key and we are updating from server?");
            updateFromServer(rwkey);
            if(callstack > 0) {
                callstack--;
            }
        };
        xhr.send(data);
    }

    function syncToServer(delay) {
        if(!delay) {
            delay = globals.write_poll_period;
        }
        if(Date.now() - last_push_time > 10000) {
            delay = 1;
        }
        console.log("synctoServer");
        if(!rokey) {
            createRwKey();
            return;
        }

        addVisitedPages();
        callstack++;
        setTimeout( () => {
            // if we don't have key, then we give up syncing.  we will have future chance to do so
            if(callstack == 1 && rwkey && editorPane.isEditable()) {
                syncToServerImmediately();
            } else {
                callstack--;
            }
        }, delay);
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
            if(setting.hasOwnProperty(rokey)) {
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

    // new document
    function createNew() {
        editorPane.setEditable(false);
        clearUndoHistory();
        rwkey = null;
        rokey = null;

        editorPane.set(defaultContent);
        editorPane.refresh();

        syncToServer(); 
        mindmap.render();
    }

    let evtSource = null;
    function enableAutoUpdate() {
        if(document.getElementById("autoupdate").checked) { 
            if(rwkey) {
                return;
            }
            if(evtSource != null) {
                return;
            }
            evtSource = new EventSource(__serverBase__ + "/p/pollpage.php?k=" + rokey);
            evtSource.onmessage = function(x) {
                console.log("auto-update");
                updateFromServer(rokey);
            };
            evtSource.onerror = function(x) {
                evtSource.close();
                evtSource = null;
                setTimeout(enableAutoUpdate, globals.query_retry_period);
            }
        } else {
            evtSource.close();
            evtSource = null;
        }
    }

    function setText() {
        if(!editorPane.isEditable()) {
            return;
        }
        let value = editorPane.get();
        let [p1, p2] = editorPane.getPos();
        if(history.length > 0 && value == history[history.length-1][0]) {
            // console.log("setText(short)", value, p1, p2, history.length)
            history[history.length-1][1] = p1;
            history[history.length-1][2] = p2;
            return;
        }
        // console.log("setText", value, p1, p2, history.length)
        history.push([value, p1, p2]);
        if(history.length > 100) {
            history.shift();
        }
        redo_history = [];
        syncToServer();
    }

    function undoText() {
        if(!editorPane.isEditable()) {
            return null;
        }
        if (history.length <= 1) {
            // console.log("undoText (empty)")
            return null
        }
        var t = history.pop() 
        redo_history.push(t)
        t = history[history.length-1]
        syncToServer();
        return t
    }

    function redoText() {
        if(!editorPane.isEditable()) {
            return null;
        }
        if (redo_history.length == 0) {
            return null
        }
        var t = redo_history.pop() 
        // console.log("redoText", t);
        history.push(t)
        syncToServer();
        return t
    }

    function clearUndoHistory() {
        redo_history = []
        history = []
    }

	// Reset all the settings to their default values.
	function reset() {
        sessionStorage.setItem(prefix + "documentTitle", JSON.stringify(""));
	}

    $(document).ready(function() {
        document.getElementById("autoupdate").addEventListener("change", enableAutoUpdate);
        let setting;
		try {
			setting = JSON.parse(sessionStorage.getItem(prefix+"documentTitle"));
		} catch (exception) {
			// Ignored
		}
		if (!setting || setting == "") {
            createNew();
        } else {
            updateFromServer(setting);
        }
        document.addEventListener("visibilitychange", function() {
            if(document.visibilityState == 'hidden') {
                let url = __serverBase__ + "/p/w.php";
                let data = new FormData();
                data.append('k', rwkey);
                let t = editorPane.get();
                data.append('contents', t);
                data.append('sync', 1);
                data.append('title', findTitle());
                data.append('seq', seq);

                console.log("sendBeacon", data);
                navigator.sendBeacon(url, data);

                seq = seq + 1;
                last_push_time = 0;
            }
        });
    });
	return {
        createNew,
        setText, undoText, redoText, clearUndoHistory,
		fontFamilyMap,
		reset
	};
}());
