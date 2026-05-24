import { unsavedChanges } from './modules/unsaved_changes.js';

// Attach to window for backward compatibility while we refactor other files
window.unsavedChanges = unsavedChanges;

console.log('App initialization started...');
