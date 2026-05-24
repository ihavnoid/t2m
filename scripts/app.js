import { unsavedChanges } from './modules/unsaved_changes.js';
import { navbar } from './modules/navbar.js';
import { shortcuts } from './modules/shortcuts.js';
import { modal } from './modules/modal.js';

// Attach to window for backward compatibility while we refactor other files
window.unsavedChanges = unsavedChanges;
window.navbar = navbar;
window.shortcuts = shortcuts;
window.modal = modal;

console.log('App initialization started...');
