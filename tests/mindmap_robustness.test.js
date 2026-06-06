import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mindmap } from "../scripts/modules/mindmap.js";

describe("Mindmap Parser robustnes", () => {
    beforeEach(() => {
        document.body.innerHTML =
            '<div id="textedit"></div><div id="textedit_message"></div><div id="stageHolder"></div>';

        // Reset the singleton instance to a clean state for every test
        mindmap.lastProcessedText = "";
        if (mindmap.engine) {
            mindmap.engine.nodes = [];
            mindmap.engine.links = [];
        }

        global.editorPane = {
            setNodeColor: vi.fn(),
            refresh: vi.fn(),
            getProcessed: vi.fn(),
            updateTextForCoordinates: vi.fn(),
            findSelectedNodes: vi.fn().mockReturnValue([0, -1]),
        };
        global.unsavedChanges = {
            setHasChanges: vi.fn(),
        };
    });

    it("should correctly parse images from label and comments", () => {
        const mockEngine = mindmap.createEngine("stageHolder", {});
        mindmap.engine = mockEngine;

        // Initial empty state
        mindmap.lastProcessedText = "";
        mindmap.engine.nodes = [];

        // Data with images in both label and comment
        const text =
            "\0-Header Node \0i[data:image/png;base64,header_img]\n\0+Comment text \0i[data:image/png;base64,comment_img]";

        mindmap.engine.text2mindmap(text);

        const node = mindmap.engine.nodes[0];
        expect(node).toBeDefined();
        expect(node.data.label).toContain("Header Node");
        expect(node.data.images).toContain("data:image/png;base64,header_img");
        expect(node.data.comment).toContain("Comment text");
        expect(node.data.commentImages).toContain(
            "data:image/png;base64,comment_img",
        );
    });

    it("should correctly handle images in empty comment section", () => {
        const mockEngine = mindmap.createEngine("stageHolder", {});
        mindmap.engine = mockEngine;

        // Initial empty state
        mindmap.lastProcessedText = "";
        mindmap.engine.nodes = [];

        // This simulates a node where Shift+Enter was pressed (\n\0+) followed by an image
        const text = "\0-Header\n\0+\0i[data:image/png;base64,img]";

        mindmap.engine.text2mindmap(text);

        const node = mindmap.engine.nodes[0];
        expect(node).toBeDefined();
        expect(node.data.label).toBe("Header");
        expect(node.data.comment).toBe("");
        expect(node.data.commentImages).toContain("data:image/png;base64,img");
    });

    it("should preserve node identities and physics positions during text updates", () => {
        const mockEngine = mindmap.createEngine("stageHolder", {});
        mindmap.engine = mockEngine;

        // 1. Initial State
        const text1 = "\0-Node 1\n\0-Node 2";
        mindmap.engine.text2mindmap(text1);

        const node1 = mindmap.engine.nodes[0];
        const node2 = mindmap.engine.nodes[1];

        expect(node1).toBeDefined();
        expect(node2).toBeDefined();

        // Set some dummy physics positions
        node1.x = 100;
        node1.y = 100;
        node2.x = 200;
        node2.y = 200;

        // 2. Update text (Node 1 label changes, Node 2 stays same)
        const text2 = "\0-Node 1 Modified\n\0-Node 2";
        mindmap.engine.text2mindmap(text2);

        // Verify identities are preserved
        expect(mindmap.engine.nodes[0]).toBe(node1);
        expect(mindmap.engine.nodes[1]).toBe(node2);

        // Verify label was updated
        expect(node1.data.label).toBe("Node 1 Modified");

        // Verify physics positions were preserved
        expect(node1.x).toBe(100);
        expect(node2.x).toBe(200);
    });

    it("should handle splitting one node into two while preserving the first node", () => {
        const mockEngine = mindmap.createEngine("stageHolder", {});
        mindmap.engine = mockEngine;

        // 1. Initial State
        mindmap.engine.text2mindmap("\0-AB");
        const nodeA = mindmap.engine.nodes[0];
        expect(nodeA).toBeDefined();
        nodeA.x = 50;

        // 2. Split AB into A and B
        mindmap.engine.text2mindmap("\0-A\n\0-B");

        expect(mindmap.engine.nodes.length).toBe(2);
        expect(mindmap.engine.nodes[0]).toBe(nodeA); // Identity preserved
        expect(nodeA.data.label).toBe("A");
        expect(nodeA.x).toBe(50);
        expect(mindmap.engine.nodes[1].data.label).toBe("B"); // New node
    });

    describe("Blocked Interaction during Image Drawer Active", () => {
        beforeEach(() => {
            global.window.imageDrawer = { isActive: true };
        });

        afterEach(() => {
            delete global.window.imageDrawer;
        });

        it("should not execute stagePanHandler when imageDrawer is active", () => {
            const mockEngine = mindmap.createEngine("stageHolder", {});
            mindmap.engine = mockEngine;

            const spyGetTouchPos = vi.spyOn(mockEngine, "_getTouchPos");

            // Invoke stagePanHandler
            mockEngine._stagePanHandler(new MouseEvent("mousemove"));

            // It should have returned early without executing _getTouchPos
            expect(spyGetTouchPos).not.toHaveBeenCalled();
        });

        it("should not execute tick or redraw in simulation when imageDrawer is active", () => {
            const mockEngine = mindmap.createEngine("stageHolder", {});
            mindmap.engine = mockEngine;

            const spyRedraw = vi.spyOn(mockEngine, "redraw");

            mockEngine.runSimulation();

            // Trigger simulation tick callback
            const tickCall = global.d3.on.mock.calls.find(
                (call) => call[0] === "tick",
            );
            expect(tickCall).toBeDefined();

            const tickCallback = tickCall[1];

            // Clear the initial call to redraw made during createSimulation/runSimulation
            spyRedraw.mockClear();

            tickCallback();

            // It should have returned early without executing redraw
            expect(spyRedraw).not.toHaveBeenCalled();
        });
    });
});
