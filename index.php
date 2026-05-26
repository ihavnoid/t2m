<?php
    $config = json_decode(file_get_contents(__DIR__."/config.json"), true);
    if(array_key_exists("k", $_GET)) {
        // addslashes shouldn't be useful here, but this is to block code injection type thingies
        $k = addslashes($_GET["k"]);
?>
<html>
    <header><script>
        sessionStorage.setItem("text2mindmap"+"documentTitle", JSON.stringify("<?php echo $k; ?>"));
        window.location.replace("<?php echo $config["base_url"];?>");
    </script></header>
<body> &nbsp; </body>
</html>
<?php
        exit(0);
    }

?>
<!DOCTYPE HTML>
<html>

<head>
	<meta charset="utf-8">
	<title>Text2MindMap</title>
	<link rel="shortcut icon" type="image/png" href="favicon.png">

	<link rel="stylesheet" href="styles/old/customstyles.css">
	<link rel="stylesheet" href="styles/old/jquery-ui-1.10.3.custom.min.css">
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/jquery.minicolors/2.0.4/jquery.minicolors.css"/>
	<script defer src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/js/all.min.js" integrity="sha512-GWzVrcGlo0TxTRvz9ttioyYJ+Wwk9Ck0G81D+eO63BaqHaJ3YZX9wuqjwgfcV/MrB2PhaVX9DkYVhbFpStnqpQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>

    <script>
        globals = {
            <?php
                foreach(array(
                        "query_retry_period"=>500, 
                        "lock_poll_period"=>2000,
                        "write_poll_period"=>2000,
                        "write_min_sync"=>10000)  as $x=>$defval) {
                    if(array_key_exists($x, $config)) {
                        echo "$x : ".$config[$x].",";
                    } else {
                        echo "$x : ".$defval.",";
                    }
                }
            ?>
            _end_ : 0
        };

        __serverBase__ = "<?php echo $config["base_url"];?>";
    </script>
    <link rel="stylesheet" href="styles/app.css">
    <link rel="stylesheet" href="styles/navbar.css">
    <link rel="stylesheet" href="styles/modal.css">
    <link rel="stylesheet" href="styles/document_title.css">
    <link rel="stylesheet" href="styles/editor.css">
    <link rel="stylesheet" href="styles/viewer.css">
    <link rel="stylesheet" href="styles/pane_resizer.css">
	
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.js"></script>
    <script src="https://cdn.jsdelivr.net/jquery.minicolors/2.0.4/jquery.minicolors.js"></script>
<?php if(file_exists(__DIR__."/t2m.min.js")) { ?>
    <script src="t2m.min.js"></script>
<?php } else { ?>
    <script src="scripts/old/d3-dispatch.js"></script>
    <script src="scripts/old/d3-quadtree.js"></script>
    <script src="scripts/old/d3-timer.js"></script>
    <script src="scripts/old/d3-force.js"></script>
    <script src="scripts/old/kineticjs.js"></script>
    <script src="scripts/old/jquery.cookie.min.js"></script>
    <script src="scripts/old/difflib.js"></script>
    <script type="module" src="scripts/app.js"></script>
<?php } ?>
</head>

<body>
	<div class="wrapper">
		<div class="navbar">
			<ul>
				<li id="keypane1" class="navbar-item" style="width: 200px;">
                </li>
				<li id="keypane2" class="navbar-item" style="width: 200px;">
                </li>
				<li class="navbar-item navbar-button navbar-dropdown">
					<a href="#">File</a>
					<ul class="dropdown-content">
						<li><a href="#" id="file-new"><i class="fa-solid fa-file fa-fw"></i>New<span class="dropdown-shortcut">Ctrl+N</span></a></li>
						<li><a href="#" id="file-open"><i class="fa-solid fa-upload fa-fw"></i>Open...<span class="dropdown-shortcut">Ctrl+O</span></a></li>
						<li><a href="#" id="file-save"><i class="fa-solid fa-save fa-fw"></i>Save...<span class="dropdown-shortcut">Ctrl+S</span></a></li>
					</ul>
				</li>
				<li class="navbar-item navbar-button navbar-dropdown">
					<a href="#">Mind Map</a>
					<ul class="dropdown-content">
						<li><a href="#" id="mindmap-lock-all"><i class="fa-solid fa-lock fa-fw"></i>Lock all<span class="dropdown-shortcut"></span></a></li>
						<li><a href="#" id="mindmap-unlock-all"><i class="fa-solid fa-unlock fa-fw"></i>Unlock all<span class="dropdown-shortcut"></span></a></li>
						<li class="dropdown-divider"></li>
						<li><a href="#" id="file-preferences"><i class="fa-solid fa-gear fa-fw"></i>Preferences</a></li>
					</ul>
				</li>
				<li class="navbar-item" style="width: 200px;">
                    <a href="visited.php" target="_blank">Show pages visited</a>
                </li>
				<li id="keypane3" class="navbar-item" style="width: 200px;">
                    <a><input type="checkbox" value="true" id="autoupdate" name="autoupdate" disabled> &nbsp; <label for="autoupdate">Auto-update</label></a>
                </li>
			</ul>
		</div>

		<div id="pane-container">
			<div id="editor-pane">
                <div id="editor">
                        <div class="float-button" id="editor-float-button" style="visibility: visible;left: calc(100% - 29px); top: 0px;">
                                <div>
                                    <i class="fa-regular fa-window-restore"></i>
                                </div>
                            </div>
                        <div class="collapse-button" id="editor-collapse-button" style="visibility: visible;left: calc(100% - 29px);">
                                <div>
                                    <i class="fa-solid fa-fw fa-chevron-left"></i>
                                </div>
                            </div>
                            <div id="textedit_message"></div>
                            <div id="textedit" spellcheck="false" contenteditable="true"></div>
                </div>
			</div>
			<div id="viewer-pane">
				<div class="collapse-button" id="viewer-collapse-button" style="visibility: hidden;">
					<div>
						<i class="fa-solid fa-fw fa-chevron-right"></i>
					</div>
				</div>
				<div id="dragbar"></div>
				<div id="viewer-container">
					<div id="stageHolder"></div>
				</div>
			</div>
		</div>
	</div>
	<div class="modal-container">
		<div class="modal" id="settings-modal">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<span class="modal-title">Preferences</span>
						<button class="close-button close-modal">&times;</button>
						<ul class="modal-tabs">
							<li data-tab="setting-tab-general" class="active">General</li>
						</ul>
					</div>
					<div class="modal-body">
						<div class="tab-content active" id="setting-tab-general">
                            <form>
								<div class="form-group">
									<label class="control-label">Lock after moving</label>
									<div class="checkbox-control">
										<input type="checkbox" id="lockAfterMoving" checked="true">
										<label for="lockAfterMoving">Freeze a node after it has been moved</label>
									</div>
								</div>
								<div class="form-group">
									<label class="control-label">Color mode</label>
									<select id="coloringMode">
										<option value="2">Branch</option>
										<option value="1">Level</option>
									</select>
								</div>
								<div class="form-group">
									<label class="control-label">Colors</label>
									<div id="colorsdiv" class="form-div"></div>
								</div>
                            </form>
						</div>
					</div>
					<div class="modal-footer">
						<button class="button close-modal">Cancel</button>
						<button class="button dark" id="modal-settings-save">
							<i class="fa-solid fa-save fa-lg"></i>Save
						</button>
					</div>
				</div>
			</div>
			<div class="modal-backdrop close-modal"></div>
		</div>

		<div class="modal" id="drawing-modal">
			<div class="modal-dialog modal-lg">
				<div class="modal-content">
					<div class="modal-header">
						<span class="modal-title">Draw Image</span>
						<button class="close-button close-modal">&times;</button>
					</div>
					<div class="modal-body">
						<div class="drawing-toolbar">
							<button id="draw-tool-pen" class="active" title="Pen (Black)"><i class="fa-solid fa-pencil"></i></button>
							<button id="draw-tool-eraser" title="Eraser"><i class="fa-solid fa-eraser"></i></button>
							<button id="draw-tool-clipart" title="Paste Clipart"><i class="fa-solid fa-icons"></i></button>
							<span class="divider"></span>
							<div class="color-picker">
								<button class="color-swatch active" data-color="#000000" style="background-color: #000000;" title="Black"></button>
								<button class="color-swatch" data-color="#444444" style="background-color: #444444;" title="Dark Gray"></button>
								<button class="color-swatch" data-color="#800000" style="background-color: #800000;" title="Maroon"></button>
								<button class="color-swatch" data-color="#006400" style="background-color: #006400;" title="Dark Green"></button>
								<button class="color-swatch" data-color="#00008b" style="background-color: #00008b;" title="Dark Blue"></button>
								<button class="color-swatch" data-color="#4b0082" style="background-color: #4b0082;" title="Indigo"></button>
								<button class="color-swatch" data-color="#8b4513" style="background-color: #8b4513;" title="Saddle Brown"></button>
								<button class="color-swatch" data-color="#2f4f4f" style="background-color: #2f4f4f;" title="Dark Slate Gray"></button>
							</div>
							<span class="divider"></span>
							<div class="thickness-picker">
								<button class="thickness-swatch" data-thickness="2" title="Thin"><div class="dot" style="width: 4px; height: 4px;"></div></button>
								<button class="thickness-swatch active" data-thickness="5" title="Medium"><div class="dot" style="width: 8px; height: 8px;"></div></button>
								<button class="thickness-swatch" data-thickness="10" title="Thick"><div class="dot" style="width: 14px; height: 14px;"></div></button>
							</div>
							<span class="divider"></span>
							<button id="draw-tool-undo" title="Undo"><i class="fa-solid fa-arrow-rotate-left"></i></button>
							<button id="draw-tool-redo" title="Redo"><i class="fa-solid fa-arrow-rotate-right"></i></button>
							<button id="draw-tool-clear" title="Clear Canvas"><i class="fa-solid fa-trash"></i></button>
							<span class="divider"></span>
							<button id="draw-save" class="button-save" title="Save Image"><i class="fa-solid fa-check"></i> Save</button>
							<button class="button-cancel close-modal" title="Cancel"><i class="fa-solid fa-xmark"></i> Cancel</button>
						</div>
						
						<div id="clipart-panel" class="clipart-panel">
							<div class="clipart-header">
								<span>Select Clipart</span>
								<select id="clipart-size">
									<option value="32">Small</option>
									<option value="64" selected>Medium</option>
									<option value="128">Large</option>
								</select>
								<button id="close-clipart">&times;</button>
							</div>
							<div class="clipart-grid">
								<button class="clipart-item" data-unicode="\uf118" title="Smile"><i class="fa-solid fa-smile"></i></button>
								<button class="clipart-item" data-unicode="\uf004" title="Heart"><i class="fa-solid fa-heart"></i></button>
								<button class="clipart-item" data-unicode="\uf005" title="Star"><i class="fa-solid fa-star"></i></button>
								<button class="clipart-item" data-unicode="\uf164" title="Thumbs Up"><i class="fa-solid fa-thumbs-up"></i></button>
								<button class="clipart-item" data-unicode="\uf165" title="Thumbs Down"><i class="fa-solid fa-thumbs-down"></i></button>
								<button class="clipart-item" data-unicode="\uf00c" title="Check"><i class="fa-solid fa-check"></i></button>
								<button class="clipart-item" data-unicode="\uf00d" title="X-Mark"><i class="fa-solid fa-xmark"></i></button>
								<button class="clipart-item" data-unicode="\uf062" title="Arrow Up"><i class="fa-solid fa-arrow-up"></i></button>
								<button class="clipart-item" data-unicode="\uf063" title="Arrow Down"><i class="fa-solid fa-arrow-down"></i></button>
								<button class="clipart-item" data-unicode="\uf060" title="Arrow Left"><i class="fa-solid fa-arrow-left"></i></button>
								<button class="clipart-item" data-unicode="\uf061" title="Arrow Right"><i class="fa-solid fa-arrow-right"></i></button>
								<button class="clipart-item" data-unicode="\uf111" title="Circle"><i class="fa-solid fa-circle"></i></button>
								<button class="clipart-item" data-unicode="\uf0c8" title="Square"><i class="fa-solid fa-square"></i></button>
								<button class="clipart-item" data-unicode="\uf071" title="Warning"><i class="fa-solid fa-triangle-exclamation"></i></button>
								<button class="clipart-item" data-unicode="\uf129" title="Info"><i class="fa-solid fa-info"></i></button>
								<button class="clipart-item" data-unicode="\uf128" title="Question"><i class="fa-solid fa-question"></i></button>
								<button class="clipart-item" data-unicode="\uf0eb" title="Lightbulb"><i class="fa-solid fa-lightbulb"></i></button>
								<button class="clipart-item" data-unicode="\uf0f3" title="Bell"><i class="fa-solid fa-bell"></i></button>
								<button class="clipart-item" data-unicode="\uf133" title="Calendar"><i class="fa-solid fa-calendar"></i></button>
								<button class="clipart-item" data-unicode="\uf017" title="Clock"><i class="fa-solid fa-clock"></i></button>
								<button class="clipart-item" data-unicode="\uf007" title="User"><i class="fa-solid fa-user"></i></button>
								<button class="clipart-item" data-unicode="\uf015" title="House"><i class="fa-solid fa-house"></i></button>
								<button class="clipart-item" data-unicode="\uf0c2" title="Cloud"><i class="fa-solid fa-cloud"></i></button>
								<button class="clipart-item" data-unicode="\uf185" title="Sun"><i class="fa-solid fa-sun"></i></button>
								<button class="clipart-item" data-unicode="\uf186" title="Moon"><i class="fa-solid fa-moon"></i></button>
								<button class="clipart-item" data-unicode="\uf024" title="Flag"><i class="fa-solid fa-flag"></i></button>
								<button class="clipart-item" data-unicode="\uf0e7" title="Bolt"><i class="fa-solid fa-bolt"></i></button>
								<button class="clipart-item" data-unicode="\uf06c" title="Leaf"><i class="fa-solid fa-leaf"></i></button>
								<button class="clipart-item" data-unicode="\uf06d" title="Fire"><i class="fa-solid fa-fire"></i></button>
								<button class="clipart-item" data-unicode="\uf002" title="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
							</div>
						</div>

						<div id="drawing-canvas-container">
							<div id="drawing-canvas-wrapper">
								<canvas id="drawing-canvas"></canvas>
								<div class="resize-handle tl" data-handle="tl"></div>
								<div class="resize-handle t" data-handle="t"></div>
								<div class="resize-handle tr" data-handle="tr"></div>
								<div class="resize-handle l" data-handle="l"></div>
								<div class="resize-handle r" data-handle="r"></div>
								<div class="resize-handle bl" data-handle="bl"></div>
								<div class="resize-handle b" data-handle="b"></div>
								<div class="resize-handle br" data-handle="br"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="modal-backdrop close-modal"></div>
		</div>
	</div>
	<input id="file-input" type="file" accept=".mindtxt">
</body>
</html>
