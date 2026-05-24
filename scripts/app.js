/**
 * Main application entry point.
 */
import { unsavedChanges } from './modules/unsaved_changes.js';
import { navbar } from './modules/navbar.js';
import { shortcuts } from './modules/shortcuts.js';
import { modal } from './modules/modal.js';
import { paneResizer } from './modules/pane_resizer.js';
import { editorPane } from './modules/editor_pane.js';
import { settings } from './modules/settings.js';
import { fileImport } from './modules/file_import.js';
import { fileExport } from './modules/file_export.js';
import { appFunctions } from './modules/app_functions.js';
import { mindmap } from './modules/mindmap.js';

class App {
    constructor() {
        this.updateStack = 0;
        this.lastUpdateTime = 0;
    }

    init() {
        if (/Mobi/.test(navigator.userAgent)) {
            alert("The website doesn't currently work very well in mobile browsers, so it's recommended that you use a computer. Sorry about that!");
        }

        $(document).ready(() => {
            // Initialize Modules
            editorPane.init();
            editorPane.setEditable(false);

            // Before the user closes the window, warn them if they have unsaved changes.
            $(window).on("beforeunload", (event) => {
                if (unsavedChanges.getHasChanges() && false) { //TODO:
                    const message = "You have unsaved changes. Are you sure you want to leave without saving?";
                    if (event) {
                        event.returnValue = message;
                    }
                    return message;
                }
            });

            // Set up shortcut bindings
            $(document).on("keydown", shortcuts.handleKeypress);
            const bindings = {
                "Ctrl+N": () => appFunctions.fileNew(),
                "Ctrl+O": () => appFunctions.fileOpen(),
                "Ctrl+S": () => appFunctions.fileSave(),
                "Ctrl+Z": () => appFunctions.editUndo(),
                "Ctrl+Y": () => appFunctions.editRedo()
            };
            shortcuts.addBindings(bindings);

            // Initialize Navbar
            navbar.init({
                "file-new": () => appFunctions.fileNew(),
                "file-open": () => appFunctions.fileOpen(),
                "file-save": () => appFunctions.fileSave(),
                "file-rename": () => appFunctions.fileRename(),
                "file-preferences": () => appFunctions.filePreferences(),
            });

            // Initialize Modal
            modal.init();

            // Initialize Pane Resizer
            paneResizer.init();

            // Initialize Settings
            settings.init();

            // Initialize Mindmap
            mindmap.init();

            // Initialize File Import
            fileImport.init();

            $("#modal-settings-save").on("click", () => {
                $(".modal").removeClass("active");
            });

            editorPane.on("mouseup touchend", () => {
                // Doesn't really update text, just for cursor positions
                setTimeout(() => {
                    settings.setText();
                    if (window.mindmap) {
                        if (window.mindmap.moveViewToCurrentSelection) window.mindmap.moveViewToCurrentSelection();
                        if (window.mindmap.redraw) window.mindmap.redraw();
                    }
                }, 1);
            });

            editorPane.on("keydown", () => {
                unsavedChanges.setHasChanges(true);
                setTimeout(() => {
                    settings.setText();
                    if (window.mindmap) {
                        if (window.mindmap.moveViewToCurrentSelection) window.mindmap.moveViewToCurrentSelection();
                        if (window.mindmap.redraw) window.mindmap.redraw();
                    }
                }, 1);
            });

            $("#mindmap-lock-all").on("touchstart click", () => {
                settings.setText();
                navbar.closeDropdowns();
            });

            $("#mindmap-unlock-all").on("touchstart click", () => {
                settings.setText();
                navbar.closeDropdowns();
            });

            editorPane.observe(() => this.updateMindMap());
        });
    }

    updateMindMap() {
        this.updateStack++;
        const value = editorPane.get();
        unsavedChanges.setHasChanges(true);
        settings.setText();
        setTimeout(() => {
            this.updateStack--;
            if (this.updateStack > 0 || this.lastUpdateTime > Date.now() - 200) {
                return;
            }
            this.lastUpdateTime = Date.now();
            if (window.mindmap && window.mindmap.render) {
                window.mindmap.render();
            }
        }, 200);
    }
}

export const app = new App();
app.init();

// Attach modules to window for backward compatibility with old/ scripts
window.unsavedChanges = unsavedChanges;
window.navbar = navbar;
window.shortcuts = shortcuts;
window.modal = modal;
window.paneResizer = paneResizer;
window.editorPane = editorPane;
window.settings = settings;
window.fileImport = fileImport;
window.fileExport = fileExport;
window.appFunctions = appFunctions;
window.mindmap = mindmap;
