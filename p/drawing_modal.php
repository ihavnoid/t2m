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
							<span class="divider desktop-only"></span>
							<button id="draw-tool-undo" class="desktop-only" title="Undo"><i class="fa-solid fa-arrow-rotate-left"></i></button>
							<button id="draw-tool-redo" class="desktop-only" title="Redo"><i class="fa-solid fa-arrow-rotate-right"></i></button>
							<button id="draw-tool-clear" class="desktop-only" title="Clear Canvas"><i class="fa-solid fa-trash"></i></button>
							<button id="draw-tool-help" class="desktop-only" title="Keyboard Shortcuts (H or ?)"><i class="fa-solid fa-circle-question"></i></button>
							<span class="divider desktop-only"></span>
							<button id="draw-zoom-out" class="desktop-only" title="Zoom Out (Q)"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
							<span id="draw-zoom-level" class="desktop-only" style="min-width: 45px; text-align: center; font-family: monospace; font-weight: bold;">100%</span>
							<button id="draw-zoom-in" class="desktop-only" title="Zoom In (Ctrl +)"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
							<span class="divider desktop-only"></span>

							<button id="draw-tool-more" class="toolbar-more-btn" title="More Options"><i class="fa-solid fa-ellipsis-vertical"></i></button>
							<div id="draw-more-menu" class="draw-more-dropdown" style="display: none;">
								<button id="draw-menu-undo" title="Undo"><i class="fa-solid fa-arrow-rotate-left fa-fw"></i> Undo</button>
								<button id="draw-menu-redo" title="Redo"><i class="fa-solid fa-arrow-rotate-right fa-fw"></i> Redo</button>
								<button id="draw-menu-clear" title="Clear Canvas"><i class="fa-solid fa-trash fa-fw"></i> Clear Canvas</button>
								<button id="draw-menu-help" title="Keyboard Shortcuts"><i class="fa-solid fa-circle-question fa-fw"></i> Help</button>
								<div class="menu-divider"></div>
								<div class="menu-zoom-controls">
									<button id="draw-menu-zoom-out" title="Zoom Out"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
									<span id="draw-menu-zoom-level" style="min-width: 45px; text-align: center; font-family: monospace; font-weight: bold; color: black; display: inline-block;">100%</span>
									<button id="draw-menu-zoom-in" title="Zoom In"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
								</div>
							</div>

							<button id="draw-save" class="button-save" title="Save Image"><i class="fa-solid fa-check"></i> Save</button>
							<button class="button-cancel close-modal" title="Cancel"><i class="fa-solid fa-xmark"></i> Cancel</button>
						</div>
						
						<div id="clipart-backdrop" class="clipart-backdrop" style="display: none;"></div>
						<div id="clipart-panel" class="clipart-panel" style="display: none;">
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
								<button class="clipart-item" data-unicode="f118" title="Smile"><i class="fa-solid fa-smile"></i></button>
								<button class="clipart-item" data-unicode="f004" title="Heart"><i class="fa-solid fa-heart"></i></button>
								<button class="clipart-item" data-unicode="f005" title="Star"><i class="fa-solid fa-star"></i></button>
								<button class="clipart-item" data-unicode="f164" title="Thumbs Up"><i class="fa-solid fa-thumbs-up"></i></button>
								<button class="clipart-item" data-unicode="f165" title="Thumbs Down"><i class="fa-solid fa-thumbs-down"></i></button>
								<button class="clipart-item" data-unicode="f00c" title="Check"><i class="fa-solid fa-check"></i></button>
								<button class="clipart-item" data-unicode="f00d" title="X-Mark"><i class="fa-solid fa-xmark"></i></button>
								<button class="clipart-item" data-unicode="f062" title="Arrow Up"><i class="fa-solid fa-arrow-up"></i></button>
								<button class="clipart-item" data-unicode="f063" title="Arrow Down"><i class="fa-solid fa-arrow-down"></i></button>
								<button class="clipart-item" data-unicode="f060" title="Arrow Left"><i class="fa-solid fa-arrow-left"></i></button>
								<button class="clipart-item" data-unicode="f061" title="Arrow Right"><i class="fa-solid fa-arrow-right"></i></button>
								<button class="clipart-item" data-unicode="f111" title="Circle"><i class="fa-solid fa-circle"></i></button>
								<button class="clipart-item" data-unicode="f0c8" title="Square"><i class="fa-solid fa-square"></i></button>
								<button class="clipart-item" data-unicode="f071" title="Warning"><i class="fa-solid fa-triangle-exclamation"></i></button>
								<button class="clipart-item" data-unicode="f129" title="Info"><i class="fa-solid fa-info"></i></button>
								<button class="clipart-item" data-unicode="f128" title="Question"><i class="fa-solid fa-question"></i></button>
								<button class="clipart-item" data-unicode="f0eb" title="Lightbulb"><i class="fa-solid fa-lightbulb"></i></button>
								<button class="clipart-item" data-unicode="f0f3" title="Bell"><i class="fa-solid fa-bell"></i></button>
								<button class="clipart-item" data-unicode="f133" title="Calendar"><i class="fa-solid fa-calendar"></i></button>
								<button class="clipart-item" data-unicode="f017" title="Clock"><i class="fa-solid fa-clock"></i></button>
								<button class="clipart-item" data-unicode="f007" title="User"><i class="fa-solid fa-user"></i></button>
								<button class="clipart-item" data-unicode="f015" title="House"><i class="fa-solid fa-house"></i></button>
								<button class="clipart-item" data-unicode="f0c2" title="Cloud"><i class="fa-solid fa-cloud"></i></button>
								<button class="clipart-item" data-unicode="f185" title="Sun"><i class="fa-solid fa-sun"></i></button>
								<button class="clipart-item" data-unicode="f186" title="Moon"><i class="fa-solid fa-moon"></i></button>
								<button class="clipart-item" data-unicode="f024" title="Flag"><i class="fa-solid fa-flag"></i></button>
								<button class="clipart-item" data-unicode="f0e7" title="Bolt"><i class="fa-solid fa-bolt"></i></button>
								<button class="clipart-item" data-unicode="f06c" title="Leaf"><i class="fa-solid fa-leaf"></i></button>
								<button class="clipart-item" data-unicode="f06d" title="Fire"><i class="fa-solid fa-fire"></i></button>
								<button class="clipart-item" data-unicode="f002" title="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
							</div>
						</div>

						<div id="draw-help-panel" class="help-panel" style="display: none;">
							<div class="help-header">
								<span>Keyboard Shortcuts</span>
								<button id="close-help">&times;</button>
							</div>
							<div class="help-content">
								<table class="shortcuts-table">
									<tr><td><kbd>W</kbd> / <kbd>&uarr;</kbd></td><td>Scroll Up</td></tr>
									<tr><td><kbd>S</kbd> / <kbd>&darr;</kbd></td><td>Scroll Down</td></tr>
									<tr><td><kbd>A</kbd> / <kbd>&larr;</kbd></td><td>Scroll Left</td></tr>
									<tr><td><kbd>D</kbd> / <kbd>&rarr;</kbd></td><td>Scroll Right</td></tr>
									<tr><td><kbd>E</kbd></td><td>Zoom In</td></tr>
									<tr><td><kbd>Q</kbd></td><td>Zoom Out</td></tr>
									<tr><td><kbd>Ctrl</kbd> + <kbd>0</kbd></td><td>Reset Zoom</td></tr>
									<tr><td><kbd>Ctrl</kbd> + <kbd>Z</kbd></td><td>Undo</td></tr>
									<tr><td><kbd>Ctrl</kbd> + <kbd>Y</kbd></td><td>Redo</td></tr>
									<tr><td><kbd>Ctrl</kbd> + <kbd>V</kbd></td><td>Paste Image</td></tr>
									<tr><td><kbd>H</kbd> / <kbd>?</kbd></td><td>Toggle Help</td></tr>
								</table>
							</div>
						</div>

						<div id="drawing-canvas-container">
							<div id="drawing-canvas-scroller" style="display: flex; justify-content: center; align-items: center; min-width: 100%; min-height: 100%;">
								<div id="drawing-canvas-spacer" style="position: relative; transition: width 0.1s, height 0.1s;">
									<div id="drawing-canvas-wrapper">
										<canvas id="drawing-canvas"></canvas>
										<canvas id="drawing-preview-canvas" style="position: absolute; top: 0; left: 0;"></canvas>
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
				</div>
			</div>
			<div class="modal-backdrop"></div>
		</div>
