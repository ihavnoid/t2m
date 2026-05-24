/**
 * Save a file to the user's local drive.
 */
class FileExport {
    /**
     * Convert some data to a file and save it to the user's local drive with
     * the specified filename and extension.
     * @param {string|Blob} data 
     * @param {string} filename 
     * @param {string} extension 
     */
    saveFile(data, filename, extension) {
        const file = new Blob([data]);
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(file, filename + extension);
        } else {
            const url = URL.createObjectURL(file);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename + extension;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    }
}

export const fileExport = new FileExport();
