import { describe, it, expect, vi, beforeAll } from "vitest";
import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";

/**
 * Integration / Smoke Test
 *
 * This test verifies that the entire module graph can be loaded without
 * throwing "missing export" or "reference errors".
 */
describe("Project Smoke Test (Import Graph Validation)", () => {
    beforeAll(() => {
        // 1. Setup a basic DOM
        const dom = new JSDOM(
            '<!DOCTYPE html><html><body><div id="textedit"></div><div id="textedit_message"></div><div id="stageHolder"></div></body></html>',
        );
        global.window = dom.window;
        global.document = dom.window.document;
        global.Node = dom.window.Node;
        global.navigator = dom.window.navigator;
        global.MouseEvent = dom.window.MouseEvent;
        global.FileReader = dom.window.FileReader;

        dom.window.HTMLCanvasElement.prototype.getContext = vi
            .fn()
            .mockReturnValue({
                beginPath: vi.fn(),
                moveTo: vi.fn(),
                lineTo: vi.fn(),
                stroke: vi.fn(),
                clearRect: vi.fn(),
                fillRect: vi.fn(),
                drawImage: vi.fn(),
                save: vi.fn(),
                restore: vi.fn(),
                translate: vi.fn(),
                scale: vi.fn(),
                rotate: vi.fn(),
                measureText: vi.fn().mockReturnValue({ width: 100 }),
                fillText: vi.fn(),
                strokeText: vi.fn(),
                setTransform: vi.fn(),
            });

        // 2. Mock jQuery (since it's a CDN dependency)
        const mockJQuery = vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            off: vi.fn().mockReturnThis(),
            hide: vi.fn().mockReturnThis(),
            show: vi.fn().mockReturnThis(),
            val: vi.fn().mockReturnValue(""),
            attr: vi.fn().mockReturnThis(),
            parent: vi.fn().mockReturnThis(),
            find: vi.fn().mockReturnThis(),
            empty: vi.fn().mockReturnThis(),
            append: vi.fn().mockReturnThis(),
            width: vi.fn().mockReturnValue(800),
            height: vi.fn().mockReturnValue(600),
            innerWidth: vi.fn().mockReturnValue(800),
            innerHeight: vi.fn().mockReturnValue(600),
            offset: vi.fn().mockReturnValue({ left: 0, top: 0 }),
            ready: (fn) => fn(),
            prop: vi.fn().mockReturnValue(true),
        }));
        mockJQuery.extend = Object.assign;
        global.$ = global.jQuery = mockJQuery;

        // 3. Mock Kinetic (Canvas library)
        global.Kinetic = {
            Stage: vi.fn().mockImplementation(function () {
                this.add = vi.fn();
                this.setHeight = vi.fn();
                this.setWidth = vi.fn();
                return this;
            }),
            Layer: vi.fn().mockImplementation(function () {
                this.add = vi.fn();
                this.move = vi.fn();
                this.getScale = vi.fn(() => ({ x: 1, y: 1 }));
                this.getX = vi.fn(() => 0);
                this.getY = vi.fn(() => 0);
                this.getTransform = vi.fn(() => ({ m: [1, 0, 0, 1, 0, 0] }));
                this.draw = vi.fn();
                this.setPosition = vi.fn();
                this.removeChildren = vi.fn();
                this.setScale = vi.fn();
                return this;
            }),
            Group: vi.fn().mockImplementation(function () {
                this.add = vi.fn();
                this.on = vi.fn();
                this.setPosition = vi.fn();
                return this;
            }),
            Text: vi.fn().mockImplementation(function () {
                this.getWidth = vi.fn(() => 100);
                this.getHeight = vi.fn(() => 20);
                this.setAttrs = vi.fn();
                this.setPosition = vi.fn();
                return this;
            }),
            Line: vi.fn().mockImplementation(function () {
                this.moveToBottom = vi.fn();
                this.setPoints = vi.fn();
                return this;
            }),
            Rect: vi.fn().mockImplementation(function () {
                this.moveToBottom = vi.fn();
                return this;
            }),
            Shape: vi.fn().mockImplementation(function () {
                return this;
            }),
        };

        // 4. Mock D3
        global.d3 = {
            forceSimulation: vi.fn(() => ({
                alpha: vi.fn().mockReturnThis(),
                force: vi.fn().mockReturnThis(),
                on: vi.fn().mockReturnThis(),
                stop: vi.fn().mockReturnThis(),
                restart: vi.fn().mockReturnThis(),
            })),
            forceCollide: vi.fn().mockReturnThis(),
            forceLink: vi.fn().mockReturnThis(),
            forceCenter: vi.fn().mockReturnThis(),
            forceManyBody: vi.fn().mockReturnThis(),
            iterations: vi.fn().mockReturnThis(),
            strength: vi.fn().mockReturnThis(),
            distance: vi.fn().mockReturnThis(),
            distanceMax: vi.fn().mockReturnThis(),
        };
    });

    it("should load all core modules without export errors", async () => {
        // We dynamic import the modules. If any export is missing, this will throw.
        const modules = [
            "../scripts/modules/editor_pane.js",
            "../scripts/modules/image_drawer.js",
            "../scripts/modules/mindmap.js",
            "../scripts/modules/text_reorganizer.js",
            "../scripts/modules/history.js",
            "../scripts/modules/file_upload.js",
        ];

        for (const modulePath of modules) {
            try {
                await import(modulePath);
            } catch (error) {
                throw new Error(
                    `Failed to load module ${modulePath}: ${error.message}`,
                );
            }
        }
    });

    it("should be able to initialize the MindmapEngine class", async () => {
        const { mindmap } = await import("../scripts/modules/mindmap.js");
        // This indirectly tests the MindmapEngine class which was extracted recently
        const engine = mindmap.createEngine("stageHolder", {
            width: 400,
            height: 400,
        });
        expect(engine).toBeDefined();
        expect(engine.nodes).toBeInstanceOf(Array);
    });
});
