import { vi } from 'vitest';
import $ from 'jquery';

global.$ = global.jQuery = $;

// Mock global variables expected by some modules
global.__serverBase__ = 'http://localhost:8080';
global.globals = {
  query_retry_period: 500,
  lock_poll_period: 2000,
  write_poll_period: 2000,
  write_min_sync: 10000
};

// Mock browser features that JSDOM might not fully support or we want to control
global.confirm = vi.fn(() => true);
global.alert = vi.fn();

// Mock Kinetic and d3 for mindmap tests later
global.Kinetic = {
    Stage: vi.fn().mockImplementation(() => ({
        add: vi.fn(),
        setHeight: vi.fn(),
        setWidth: vi.fn(),
        remove: vi.fn(),
        toDataURL: vi.fn()
    })),
    Layer: vi.fn().mockImplementation(() => ({
        move: vi.fn(),
        add: vi.fn(),
        draw: vi.fn(),
        getScale: vi.fn().mockReturnValue({ x: 1, y: 1 }),
        setScale: vi.fn(),
        getX: vi.fn().mockReturnValue(0),
        getY: vi.fn().mockReturnValue(0),
        setPosition: vi.fn(),
        getTransform: vi.fn().mockReturnValue({ m: [1, 0, 0, 1, 0, 0] }),
        removeChildren: vi.fn(),
        clone: vi.fn().mockReturnThis()
    })),
    Group: vi.fn().mockImplementation(() => ({
        add: vi.fn(),
        on: vi.fn(),
        setPosition: vi.fn(),
        removeChildren: vi.fn(),
        remove: vi.fn()
    })),
    Line: vi.fn().mockImplementation(() => ({
        moveToBottom: vi.fn(),
        setPoints: vi.fn(),
        remove: vi.fn()
    })),
    Text: vi.fn().mockImplementation(() => ({
        getWidth: vi.fn().mockReturnValue(100),
        getHeight: vi.fn().mockReturnValue(20),
        setPosition: vi.fn(),
        setWidth: vi.fn(),
        remove: vi.fn()
    })),
    Rect: vi.fn().mockImplementation(() => ({}))
};

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
    tick: vi.fn().mockReturnThis()
};

// Mock difflib
global.difflib = {
    stringAsLines: vi.fn((s) => s.split('\n')),
    SequenceMatcher: vi.fn().mockImplementation(() => ({
        get_opcodes: vi.fn().mockReturnValue([])
    }))
};
