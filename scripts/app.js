import { unsavedChanges } from './modules/unsaved_changes.js';
import { navbar } from './modules/navbar.js';
import { shortcuts } from './modules/shortcuts.js';
import { modal } from './modules/modal.js';
import { paneResizer } from './modules/pane_resizer.js';
import { editorPane } from './modules/editor_pane.js';
import { settings } from './modules/settings.js';

// Attach to window for backward compatibility while we refactor other files
window.unsavedChanges = unsavedChanges;
window.navbar = navbar;
window.shortcuts = shortcuts;
window.modal = modal;
window.paneResizer = paneResizer;
window.editorPane = editorPane;
window.settings = settings;

console.log('App initialization started...');
