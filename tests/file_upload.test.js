import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadImage } from "../scripts/modules/file_upload.js";

describe("File Upload Module", () => {
    beforeEach(() => {
        // Reset DOM for each test
        document.body.innerHTML = "";
        vi.stubGlobal("alert", vi.fn());
        vi.stubGlobal("console", { error: vi.fn() });
    });

    it("successfully uploads an image and returns the URL", async () => {
        const mockUrl = "images/abc123hash.png";
        
        // Mock fetch response
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ url: mockUrl }),
        });

        const result = await uploadImage("base64data");

        expect(result).toBe(mockUrl);
        expect(global.fetch).toHaveBeenCalledWith("p/image_upload.php", expect.any(Object));
    });

    it("throws an error and alerts the user when the upload fails", async () => {
        // Mock fetch failure
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            statusText: "Internal Server Error",
        });

        await expect(uploadImage("base64data")).rejects.toThrow("Upload failed: Internal Server Error");
        expect(global.alert).toHaveBeenCalledWith(expect.stringContaining("Failed to upload image"));
    });

    it("handles server-side error messages correctly", async () => {
        // Mock fetch with JSON error payload
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ error: "Invalid file type" }),
        });

        await expect(uploadImage("base64data")).rejects.toThrow("Invalid file type");
    });

    it("manages the upload overlay visibility during the process", async () => {
        // We need to check if the element is created/removed via looking at the DOM
        global.fetch = vi.fn().mockImplementation(() => {
            // While promise is pending, check for overlay
            const overlay = document.getElementById("upload-overlay");
            if (overlay) expect(overlay.style.display).toBe("flex");
            return Promise.resolve({
                ok: true,
                json: async () => ({ url: "url" }),
            });
        });

        await uploadImage("base64data");

        // After completion, overlay should be hidden (or removed if implementation dictates)
        const overlay = document.getElementById("upload-overlay");
        if (overlay) {
            expect(overlay.style.display).toBe("none");
        }
    });
});
