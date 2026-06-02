# Manual Test Plan for t2m Mindmap UI (Tablet/Touch)

As the Gemini CLI cannot access a physical touch device, please perform the following tests manually on a tablet or a smartphone.

## 1. Pinch-to-Zoom
*   **Action**: Place two fingers on the mindmap area and pinch them together or spread them apart.
*   **Expected**: The mindmap should zoom in/out smoothly. The browser should NOT try to zoom the entire webpage (no browser UI artifacts should appear).
*   **Verification**: Check if the "Scale" value in the engine updates correctly (nodes get visually larger/smaller).

## 2. Stage Panning
*   **Action**: Drag a single finger on the empty background of the mindmap.
*   **Expected**: The entire mindmap layer should move with your finger.
*   **Verification**: Ensure the movement is 1:1 and doesn't "jump" when you start or stop dragging. The browser should NOT scroll the page.

## 3. Node Dragging
*   **Action**: Press and hold a node, then drag it to a new location.
*   **Expected**: The node should follow your finger. If it's a root node or "fixed" node, its new coordinates should be reflected in the text editor.
*   **Verification**: Let go of the node and check if the coordinates `[x y]` appear or update in the text area.

## 4. Tap-to-Select
*   **Action**: Briefly tap a mindmap node.
*   **Expected**: The text cursor in the left-hand editor should automatically jump to the line corresponding to that node.
*   **Verification**: The tapped node should get a thick black border (selection highlight), and the editor should scroll to that line.

## 5. Long-Press to Lock/Unlock
*   **Action**: Press and hold a node for about 1 second without moving your finger.
*   **Expected**: The node's "Frozen" state should toggle.
*   **Verification**: If the node was floating, it should now have a `[x y]` coordinate header in the text editor and stay in place. If it was already frozen, the coordinates should disappear, and it should start floating (pushed by physics).

## 6. Edge Case: Dragging off-canvas
*   **Action**: Start dragging a node or the stage and move your finger completely off the edge of the tablet screen.
*   **Expected**: The dragging state should finalize cleanly when you lift your finger outside the viewport.
*   **Verification**: The mindmap shouldn't get "stuck" in a dragging state.

## 7. Performance Check
*   **Action**: Rapidly pan and zoom a large mindmap.
*   **Expected**: Frame rate should stay high, and there should be no significant "ghosting" or lag in touch response.
