# Gemini Project Instructions: t2m (Text2Mindmap)

Foundational mandates and architectural patterns for the t2m project.

## Core Mandates

- **Security**: Never log, print, or commit secrets or API keys. Protect `config.json` and `.git`.
- **Image Hosting**: Use relative URLs (`images/[hash].png`) for all images to ensure server migration safety.
- **Legacy Support**: Do **not** retroactively convert old base64 images found in text; only convert to server-hosted PNGs upon new pastes or edits.
- **User Interface**: 
    - Implement a blocking UI overlay during asynchronous image uploads.
    - Disable "click-outside-to-close" behavior on the Image Editor modal to prevent accidental data loss.
- **Performance**: Garbage Collection (GC) is required for inactive mindmaps (> 2 years) and unreferenced images (> 14 days).

## Architecture & Engineering Standards

### Backend (PHP + SQLite3)
- **Modular Scripts**: Backend logic lives in `p/`.
- **Optimistic Locking**: Use the `seq` field in the `contents` table to prevent clobbering concurrent edits.
- **Access Tracking**: Every read/write must update the `last_accessed` timestamp in the `contents` table.
- **Image Registration**: New uploads must be registered in the `images` table with a `created_at` timestamp for GC tracking.
- **Documentation**: Maintain `p/BACKEND.md` for detailed field and script definitions.

### Frontend (Modular JavaScript)
- **Class Extraction**: Favor ES6 classes over factory functions (e.g., `MindmapEngine`, `ImageDrawer`).
- **Context Awareness**: Modules must support multi-window operation (main app vs. floating `edit_popup.php`). Use `this.boundWindow` or similar abstractions to resolve the correct `document` context.
- **Physics vs. State**: Maintain strict separation between `fixed` (layout engine physics state) and `frozen` (explicit user-defined `[x y]` coordinates).
- **Text Processing**: 
    - Use the custom linear diff algorithm in `mindmap.js` for node reconciliation.
    - During coordinate updates in `EditorPane`, tokenize `<img>` tags to preserve them, but strip all other HTML formatting tags (which are reconstructed via `cleanupHTML`).
- **Text Reorganization**: 
    - The "Paste Raw Text" feature uses a **deterministic heuristic** (not an LLM) to assign hierarchy based on indentation, bullets, colons, and capitalization.
    - **Cleaning Phase**: Before processing, the algorithm strips "noise" like redundant bullets, symbol-only separator lines, and empty lines.
    - **Comments**: Lines starting with `//`, `#`, `(`, or `note:` are treated as comments for the previous node (`-1` depth).
- **Event Isolation**: Use the **capture phase** and `stopImmediatePropagation()` in the Image Editor to prevent keyboard/paste events from leaking to the background text editor.

### Development Workflow
- **Formatting**: Use Prettier for all JavaScript and CSS files. Run `npx prettier --write .` before committing.
- **Testing**: 
    - **Frontend**: Use Vitest for unit tests in `tests/`.
    - **Backend**: Use the CLI-based Vitest suite in `tests/backend.test.js`.
- **Validation**: Always run the relevant test suite after making changes. Verification is the only path to finality.

## Key Constants & Constraints

- **Image Resolution**: Maximum canvas size for the Image Editor is 1000x1000 pixels.
- **Zoom Range**: Image Editor zoom must support 100% to 800% scaling.
- **Retention**: GC thresholds must be configurable in `config.json` (defaults: mindmap 730 days, image 14 days).
