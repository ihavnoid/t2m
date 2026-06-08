import { vi } from "vitest";
import $ from "jquery";

global.$ = global.jQuery = $;

// Mock global variables expected by some modules
global.__serverBase__ = "http://localhost:8080";
global.globals = {
    query_retry_period: 500,
    lock_poll_period: 2000,
    write_poll_period: 2000,
    write_min_sync: 10000,
};

// Mock browser features that JSDOM might not fully support or we want to control
global.confirm = vi.fn(() => true);
global.alert = vi.fn();

// Mock Kinetic and d3 for mindmap tests later
global.Kinetic = {
    Stage: class {
        constructor() {
            this.add = vi.fn();
            this.setHeight = vi.fn();
            this.setWidth = vi.fn();
            this.remove = vi.fn();
            this.toDataURL = vi.fn();
        }
    },
    Layer: class {
        constructor() {
            this.move = vi.fn();
            this.add = vi.fn();
            this.draw = vi.fn();
            this.getScale = vi.fn().mockReturnValue({ x: 1, y: 1 });
            this.setScale = vi.fn();
            this.getX = vi.fn().mockReturnValue(0);
            this.getY = vi.fn().mockReturnValue(0);
            this.setPosition = vi.fn();
            this.getTransform = vi
                .fn()
                .mockReturnValue({ m: [1, 0, 0, 1, 0, 0] });
            this.removeChildren = vi.fn();
            this.clone = vi.fn().mockReturnThis();
        }
    },
    Group: class {
        constructor() {
            this.add = vi.fn();
            this.on = vi.fn();
            this.setPosition = vi.fn();
            this.removeChildren = vi.fn();
            this.remove = vi.fn();
        }
    },
    Line: class {
        constructor() {
            this.moveToBottom = vi.fn();
            this.setPoints = vi.fn();
            this.remove = vi.fn();
        }
    },
    Text: class {
        constructor() {
            this.getWidth = vi.fn().mockReturnValue(100);
            this.getHeight = vi.fn().mockReturnValue(20);
            this.setPosition = vi.fn();
            this.setWidth = vi.fn();
            this.remove = vi.fn();
        }
    },
    Rect: class {
        constructor() {}
    },
};

// Mock Image
global.Image = class {
    constructor() {
        this.onload = null;
        this.src = "";
        setTimeout(() => {
            if (this.onload) this.onload();
        }, 0);
    }
    get complete() {
        return true;
    }
};

// Mock Canvas and Context
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
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

HTMLCanvasElement.prototype.toDataURL = vi
    .fn()
    .mockReturnValue("data:image/png;base64,mock");
HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
    left: 0,
    top: 0,
    width: 500,
    height: 500,
});

global.d3 = {
    forceSimulation: vi.fn().mockReturnThis(),
    forceCollide: vi.fn().mockReturnThis(),
    forceLink: vi.fn().mockReturnThis(),
    forceCenter: vi.fn().mockReturnThis(),
    forceManyBody: vi.fn().mockReturnThis(),
    alpha: vi.fn().mockReturnThis(),
    alphaDecay: vi.fn().mockReturnThis(),
    force: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    tick: vi.fn().mockReturnThis(),
    iterations: vi.fn().mockReturnThis(),
    strength: vi.fn().mockReturnThis(),
    distance: vi.fn().mockReturnThis(),
    distanceMax: vi.fn().mockReturnThis(),
};
