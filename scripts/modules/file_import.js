/**
 * Logic for importing a document from the user's local drive.
 */
class FileImport {
    constructor() {
        this.$fileInput = null;
    }

    init() {
        if (window.FileReader) {
            this.$fileInput = $("#file-input");
            this.$fileInput.on("change", (event) => this.fileInput(event));
        }
    }

    /**
     * Handler function for whenever the user chooses a file from the dialog prompt.
     * @param {Event} event 
     */
    fileInput(event) {
        event.stopPropagation();
        event.preventDefault();
        if (event.target && event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];
            const reader = new FileReader();
            const fileName = selectedFile.name;
            reader.onloadend = (event) => {
                this.handleUpload(event, fileName);
            };
            reader.readAsText(selectedFile);
        }
        if (this.$fileInput) {
            this.$fileInput.val("");
        }
    }

    /**
     * Handler method for when the file has been loaded from the drive.
     * @param {Event} event 
     * @param {string} fileName 
     */
    handleUpload(event, fileName) {
        if (event.target.readyState !== 2) {
            return;
        }
        if (event.target.error) {
            alert("There was an error opening the file.");
            return;
        }
        const content = event.target.result;

        window.editorPane.set(content);
        if (window.mindmap && window.mindmap.render) {
            window.mindmap.render();
        }
        window.unsavedChanges.setHasChanges(false);
    }

    /**
     * Try to click the hidden <input type="file"> tag, triggering the file upload process.
     */
    chooseFile() {
        if (!window.FileReader) {
            alert("Your browser doesn't support opening files, consider upgrading to a newer version of your browser.");
            return;
        }
        if (this.$fileInput) {
            this.$fileInput.click();
        }
    }
}

export const fileImport = new FileImport();
