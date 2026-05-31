<div class="modal" id="text-paste-modal">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <span class="modal-title">Text Reorganizer</span>
                <button class="close-button close-modal">&times;</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <p style="margin-bottom: 10px; font-size: 0.9rem; color: #666;">
                    Paste your raw notes or unorganized lists below.
                    The algorithm will structure them into a mindmap hierarchy based on indentation, bullets, and content.
                </p>
                <textarea id="text-paste-input" 
                    style="width: 100%; height: 250px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: sans-serif; resize: vertical;"
                    placeholder="Example:
Meeting Notes
  - Project X:
    - Budget
    - Timeline
  (Remember to ask about Y)"></textarea>
                <div id="text-reorganizer-status" style="margin-top: 10px; font-size: 0.85rem; color: #2365ba; font-weight: bold; min-height: 1.2em;">
                    Ready
                </div>
            </div>
            <div class="modal-footer">
                <button id="text-process-btn" class="button" style="background-color: #2365ba; color: white; border-color: #2365ba;">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Process & Paste
                </button>
                <button class="button close-modal">Cancel</button>
            </div>
        </div>
    </div>
</div>
