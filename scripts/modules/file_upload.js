/**
 * Logic for uploading images to the server.
 */
export async function uploadImage(base64Data) {
    showUploadOverlay(true);
    try {
        const response = await fetch("p/image_upload.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: base64Data }),
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.error) {
            throw new Error(result.error);
        }

        return result.url;
    } catch (error) {
        console.error("Error uploading image:", error);
        alert(`Failed to upload image: ${error.message}`);
        throw error;
    } finally {
        showUploadOverlay(false);
    }
}

function showUploadOverlay(show) {
    let overlay = document.getElementById("upload-overlay");
    if (!overlay && show) {
        overlay = document.createElement("div");
        overlay.id = "upload-overlay";
        overlay.innerHTML = `
            <div class="upload-overlay-content">
                <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
                <div>Uploading...</div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Add styles if not present
        if (!document.getElementById("upload-overlay-styles")) {
            const style = document.createElement("style");
            style.id = "upload-overlay-styles";
            style.textContent = `
                #upload-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    color: white;
                    font-family: sans-serif;
                }
                .upload-overlay-content {
                    text-align: center;
                    background: #333;
                    padding: 20px 40px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                .upload-overlay-content div {
                    margin-top: 10px;
                    font-weight: bold;
                }
            `;
            document.head.appendChild(style);
        }
    }

    if (overlay) {
        overlay.style.display = show ? "flex" : "none";
    }
}
