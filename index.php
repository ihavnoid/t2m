<?php
    if(array_key_exists("k", $_GET)) {
        // addslashes shouldn't be useful here, but this is to block code injection type thingies
        $k = addslashes($_GET["k"]);
?>
<html>
    <header><script>
        sessionStorage.setItem("text2mindmap"+"documentTitle", JSON.stringify("<?php echo $k; ?>"));
        window.location.replace("/");
    </script></header>
<body> &nbsp; </body>
</html>
<?php
        exit(0);
    }

    $config = json_decode(file_get_contents(__DIR__."/config.json"));
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
	<script defer src="https://use.fontawesome.com/releases/v5.0.9/js/all.js" integrity="sha384-8iPTk2s/jMVj81dnzb/iFR2sdA7u06vHJyyLlAd4snFpCl/SnyUjRrbdJsw1pGIl" crossorigin="anonymous"></script>

    <script>
        __serverBase__ = "<?php echo $config->base_url;?>";
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
    <script src="scripts/old/d3_force.js"></script>
    <script src="scripts/old/kineticjs.js"></script>
    <script src="scripts/old/jquery.cookie.min.js"></script>
    <script src="scripts/old/difflib.js"></script>
    <script src="scripts/old/mindmap.min.js"></script>
    <script src="scripts/unsaved_changes.js"></script>
    <script src="scripts/editor_pane.js"></script>
    <script src="scripts/settings.js"></script>
    <script src="scripts/file_import.js"></script>
    <script src="scripts/file_export.js"></script>
    <script src="scripts/app_functions.js"></script>
    <script src="scripts/navbar.js"></script>
    <script src="scripts/modal.js"></script>
    <script src="scripts/pane_resizer.js"></script>
    <script src="scripts/shortcuts.js"></script>
    <script src="scripts/main.js"></script>
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
						<li><a href="#" id="file-new"><i class="fa fa-file fa-fw"></i>New<span class="dropdown-shortcut">Ctrl+N</span></a></li>
						<li><a href="#" id="file-open"><i class="fa fa-upload fa-fw"></i>Open...<span class="dropdown-shortcut">Ctrl+O</span></a></li>
						<li><a href="#" id="file-save"><i class="fa fa-save fa-fw"></i>Save...<span class="dropdown-shortcut">Ctrl+S</span></a></li>
					</ul>
				</li>
				<li class="navbar-item navbar-button navbar-dropdown">
					<a href="#">Mind Map</a>
					<ul class="dropdown-content">
						<li><a href="#" id="mindmap-lock-all"><i class="fa fa-lock fa-fw"></i>Lock all<span class="dropdown-shortcut"></span></a></li>
						<li><a href="#" id="mindmap-unlock-all"><i class="fa fa-unlock fa-fw"></i>Unlock all<span class="dropdown-shortcut"></span></a></li>
						<li class="dropdown-divider"></li>
						<li><a href="#" id="file-preferences"><i class="fa fa-cogs fa-fw"></i>Preferences</a></li>
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
                        <div class="collapse-button" id="editor-collapse-button" style="visibility: visible;left: calc(100% - 29px);">
                                <div>
                                    <i class="fa fa-fw fa-chevron-left"></i>
                                </div>
                            </div>
                            <div id="textedit_message"></div>
                            <div id="textedit" spellcheck="false" contenteditable="true"></div>
                </div>
			</div>
			<div id="viewer-pane">
				<div class="collapse-button" id="viewer-collapse-button" style="visibility: hidden;">
					<div>
						<i class="fa fa-fw fa-chevron-right"></i>
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
							<i class="fa fa-save fa-lg"></i>Save
						</button>
					</div>
				</div>
			</div>
			<div class="modal-backdrop close-modal"></div>
		</div>
	</div>
	<input id="file-input" type="file" accept=".mindtxt">
</body>
</html>
