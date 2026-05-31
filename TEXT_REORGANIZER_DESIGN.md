# AI Design Document: Local Text Reorganization

This document outlines the design and implementation strategy for the "AI-Powered Text Reorganization" feature. This feature allows users to paste raw, unformatted text and have it automatically structured into a hierarchical mindmap format using local, client-side AI.

## 1. Objectives

- Provide a "Local-First" AI experience (no data leaves the browser).
- Automatically assign hierarchy (indentation) to plaintext based on semantic meaning.
- **Content Preservation**: The AI must preserve all meaningful text and ideas.
- **Noise Reduction**: The algorithm is permitted to drop "formatting noise" for a cleaner result. This includes:
    - Bullet points (dashes, asterisks, bullets).
    - Redundant punctuations.
    - Empty lines.
    - Lines consisting only of symbols (e.g., `---`, `===`, `***`).
- Ensure broad browser compatibility (Chrome, Firefox, Safari, Edge).

## 2. User Flow

1. **Trigger**: User clicks "Paste Text" in the top Navbar.
2. **Input**: A modal appears with a large `<textarea>`. The user pastes their raw scribbles (e.g., a list of ideas from a meeting).
3. **Action**: User clicks the "Process" button in the modal.
4. **AI Transformation**:
    - The app splits the input into lines.
    - A local AI model analyzes the relationships between these lines.
    - The model returns a structure (likely a list of depth levels).
5. **Output**: The application converts the lines and depths into the `<ul><li>` format used by the editor and inserts it at the current cursor position.

## 3. Technology Selection: Transformers.js (WebAssembly)

While **WebLLM** offers more powerful LLMs via WebGPU, **Transformers.js (v3)** is selected for this feature because:

- **WASM Fallback**: It runs on CPU/WebAssembly if WebGPU is unavailable, providing the "widest browser support" requested.
- **Smaller Footprint**: We can use specialized, highly-quantized models (e.g., "all-MiniLM-L6-v2" or "Xenova/bge-small-en-v1.5") that are only 20-80MB.
- **Task Fit**: For simple hierarchy (deciding if Line B belongs under Line A), a lightweight encoder model or a small Decoder model is sufficient.

### Alternative: WebLLM + SmolLM

If pure semantic similarity (Transformers.js) isn't "smart" enough, we can use **WebLLM** with **SmolLM-135M**. It is tiny, fast, and capable of following instructions like "Group these lines by topic".

## 4. Proposed Logic: "The Depth Vector"

To guarantee that the core ideas are preserved while removing noise, the process follows these phases:

### 4.1 Cleaning Phase (Pre-processing)

The input text is passed through a "denoising" pass before being sent to the model:

1.  **Empty Line Removal**: All purely whitespace lines are dropped.
2.  **Symbol-Only Line Removal**: Lines matching `/^[ \-\*\=_]+$/` are dropped.
3.  **Bullet Stripping**: Leading symbols like `-`, `*`, `+`, `•` are removed from each line.
4.  **Trim**: Excessive whitespace and trailing punctuations are trimmed from each line for a cleaner look.

### 4.2 AI Task (The Depth Vector)

Input: `["Fruits", "- Apple", "* Banana", "---", "Vehicles", "  > Car"]`
Cleaned: `["Fruits", "Apple", "Banana", "Vehicles", "Car"]`
AI Output: `[0, 1, 1, 0, 1]` (An array of integers representing depth)

### 4.3 Post-processing

Map the **Cleaned Lines** to the **AI Depths** to build the HTML string:

```html
<ul>
    <li>
        Fruits
        <ul>
            <li>Apple</li>
            <li>Banana</li>
        </ul>
    </li>
    <li>
        Vehicles
        <ul>
            <li>Car</li>
        </ul>
    </li>
</ul>
```

## 5. UI Integration

### 5.1 Navbar Update

Add a new item to the "File" or a new "AI" dropdown:

```html
<li>
    <a href="#" id="ai-paste-text"
        ><i class="fa-solid fa-wand-magic-sparkles"></i> Paste Raw Text...</a
    >
</li>
```

### 5.2 Modal structure (`p/ai_paste_modal.php`)

```html
<div class="modal" id="ai-paste-modal">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <span class="modal-title">AI Reorganizer</span>
                <button class="close-button close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <textarea
                    id="ai-paste-input"
                    placeholder="Paste your raw notes here..."
                ></textarea>
                <div id="ai-status">Ready</div>
            </div>
            <div class="modal-footer">
                <button id="ai-process-btn" class="button">
                    Process & Paste
                </button>
            </div>
        </div>
    </div>
</div>
```

## 6. Implementation Roadmap

1. **Step 1: Scaffold UI**: Add the modal and navbar button.
2. **Step 2: AI Worker**: Implement `scripts/modules/ai_worker.js`. Loading the model in a worker prevents the UI from stuttering.
3. **Step 3: Logic**:
    - Use `transformers.js` to get embeddings for each line.
    - Calculate cosine similarity between consecutive lines.
    - If similarity(Line N, Line N-1) > Threshold, indent Line N.
    - OR: Use a small Seq2Seq model to output the depth array.
4. **Step 4: Editor Integration**: Use `window.editorPane.insertAtCursor()` to inject the resulting HTML.
