import { unsavedChanges } from './modules/unsaved_changes.js';
import { navbar } from './modules/navbar.js';

// Attach to window for backward compatibility while we refactor other files
window.unsavedChanges = unsavedChanges;
window.navbar = navbar;

console.log('App initialization started...');
