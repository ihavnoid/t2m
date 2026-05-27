/**
 * Logic for handling bindings for keyboard shortcuts.
 */
class Shortcuts {
    constructor() {
        this.bindings = {};
        this.handleKeypress = this.handleKeypress.bind(this);
    }

    /**
     * Attach the shortcut handler to a specific window.
     * @param {Window} win 
     */
    bindToWindow(win) {
        win.addEventListener("keydown", this.handleKeypress);
    }

    /**
     * Handler function for all keypress events the user makes.
     * Will convert the key-combination to a string and compare it to existing
     * shortcut bindings. If the binding is found, call the appropriate function.
     * @param {KeyboardEvent} event 
     */
    handleKeypress(event) {
        const keys = [event.key.toLowerCase()];
        if (event.shiftKey) {
            keys.push("shift");
        }
        if ((event.ctrlKey || event.metaKey)) {
            keys.push("ctrl");
        }
        if (event.altKey) {
            keys.push("alt");
        }
        for (const key in this.bindings) {
            if (this.keysEqual(key.split("+"), keys)) {
                event.preventDefault();
                this.bindings[key]();
            }
        }
    }

    /**
     * Add a keyboard binding to the list.
     * @param {string} shortcut String formatted like this: "ctrl+shift+v"
     * @param {Function} callback Function to call when the shortcut is pressed.
     */
    addBinding(shortcut, callback) {
        this.bindings[shortcut.toLowerCase()] = callback;
    }

    /**
     * Add an object of bindings to the list.
     * @param {Object} newBindings 
     */
    addBindings(newBindings) {
        for (const binding in newBindings) {
            this.bindings[binding.toLowerCase()] = newBindings[binding];
        }
    }

    /**
     * Check if two arrays of keys are equal.
     * @param {string[]} keys1 
     * @param {string[]} keys2 
     * @returns {boolean}
     */
    keysEqual(keys1, keys2) {
        if (!keys1 || !keys2) {
            return false;
        }
        if (keys1.length !== keys2.length) {
            return false;
        }
        const s1 = [...keys1].map(k => k.toLowerCase()).sort();
        const s2 = [...keys2].map(k => k.toLowerCase()).sort();
        for (let i = 0; i < s1.length; i++) {
            if (s1[i] !== s2[i]) {
                return false;
            }
        }
        return true;
    }
}

export const shortcuts = new Shortcuts();
