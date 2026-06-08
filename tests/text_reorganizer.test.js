import { describe, it, expect, beforeEach } from "vitest";
import * as textReorganizer from "../scripts/modules/text_reorganizer.js";

describe("TextReorganizer Heuristic (Dynamic Stack)", () => {
    let context;

    beforeEach(() => {
        context = { indentStack: [0] };
    });

    it("1-5: Progressive Messy Indentation", () => {
        // level 1 with 3 space, level 2 with 4 space, level 3 with 8 spaces
        expect(textReorganizer.detectDepth("Root", null, 0, context)).toBe(0);
        expect(
            textReorganizer.detectDepth("   Level 1", "Root", 0, context),
        ).toBe(1);
        expect(
            textReorganizer.detectDepth("    Level 2", "   Level 1", 1, context),
        ).toBe(2);
        expect(
            textReorganizer.detectDepth(
                "        Level 3",
                "    Level 2",
                2,
                context,
            ),
        ).toBe(3);
        expect(
            textReorganizer.detectDepth(
                "   Back to Level 1",
                "        Level 3",
                3,
                context,
            ),
        ).toBe(1);
    });

    it("Edge Case: Empty or Whitespace Lines", () => {
        expect(textReorganizer.cleanLines("")).toEqual([]);
        expect(textReorganizer.cleanLines("\n\n  \n")).toEqual([]);
        expect(textReorganizer.cleanLines("Line 1\n\nLine 2")).toEqual(["Line 1", "Line 2"]);
    });

    it("Edge Case: Extreme Indentation (Performance/Stress)", () => {
        const massiveIndent = " ".repeat(1000) + "Deep Node";
        expect(textReorganizer.detectDepth(massiveIndent, "Root", 0, context)).toBeGreaterThan(0);
    });

    it("Edge Case: Mixed Tabs and Spaces", () => {
        // Tab (4) + 2 spaces = 6
        const mixedLine = "\t  Mixed";
        expect(textReorganizer.detectDepth(mixedLine, "Root", 0, context)).toBeGreaterThan(0);
    });

    it("Edge Case: Heavy Punctuation/Separators", () => {
        const separators = ["---", "===", "***", "   "];
        expect(textReorganizer.cleanLines(separators.join("\n"))).toEqual([]);
    });


    it("6-10: Inconsistent Dedenting (Snapping)", () => {
        textReorganizer.detectDepth("Root", null, 0, context); // Stack [0]
        textReorganizer.detectDepth("     L1", "Root", 0, context); // Stack [0, 5]
        textReorganizer.detectDepth("          L2", "L1", 1, context); // Stack [0, 5, 10]
        // Dedent to 2 spaces (not in stack). Should pop 10, 5. Landing at 0.
        // Since 2 > 0, it pushes 2. Stack becomes [0, 2], Level 1.
        expect(textReorganizer.detectDepth("  L1 New", "L2", 2, context)).toBe(
            1,
        );
        expect(context.indentStack).toEqual([0, 2]);
    });

    it("11-15: Tab Support (4 spaces equivalent)", () => {
        expect(textReorganizer.detectDepth("Root", null, 0, context)).toBe(0);
        expect(textReorganizer.detectDepth("\tTab L1", "Root", 0, context)).toBe(
            1,
        );
        expect(
            textReorganizer.detectDepth("    Spaces L1", "\tTab L1", 1, context),
        ).toBe(1);
        expect(
            textReorganizer.detectDepth("\t\tTab L2", "Spaces L1", 1, context),
        ).toBe(2);
    });

    it("16-20: Colon Hierarchy Logic", () => {
        expect(textReorganizer.detectDepth("Topic:", null, 0, context)).toBe(0);
        // No indent but previous had colon -> Child (Depth 1)
        expect(textReorganizer.detectDepth("Subtopic", "Topic:", 0, context)).toBe(
            1,
        );
        // Indented child
        expect(
            textReorganizer.detectDepth("  Indented:", "Subtopic", 1, context),
        ).toBe(1);
        expect(
            textReorganizer.detectDepth("  Child", "  Indented:", 1, context),
        ).toBe(2);
    });

    it("21-25: Punctuation Stripping (HTML Gen Check)", () => {
        const lines = ["Item 1.", "Item 2,", "Item 3;", "Keep..."];
        const depths = [0, 0, 0, 0];
        const html = textReorganizer.buildHierarchyHTML(lines, depths);
        expect(html).toContain("<li>Item 1</li>");
        expect(html).toContain("<li>Item 2</li>");
        expect(html).toContain("<li>Item 3</li>");
        expect(html).toContain("<li>Keep...</li>");
    });

    it("26-100: Comprehensive Stress Test", () => {
        const stackContext = { indentStack: [0] };
        // Random walks through indentation
        let prevLine = "Root";
        let prevDepth = 0;
        const history = [{ indent: 0, depth: 0 }];

        for (let i = 0; i < 75; i++) {
            // Pick a random level from history or go deeper
            const goDeeper = Math.random() > 0.4;
            let currentIndent;

            if (goDeeper) {
                currentIndent = history[history.length - 1].indent + 2 + Math.floor(Math.random() * 5);
            } else {
                const randomLevel = Math.floor(Math.random() * history.length);
                currentIndent = history[randomLevel].indent;
            }

            const line = " ".repeat(currentIndent) + "Node " + i;
            const result = textReorganizer.detectDepth(line, prevLine, prevDepth, stackContext);
            
            // Basic sanity check: if indent increased, depth must increase.
            if (currentIndent > history[history.length - 1].indent) {
                expect(result).toBeGreaterThan(prevDepth);
            } else if (currentIndent < history[history.length - 1].indent) {
                expect(result).toBeLessThanOrEqual(prevDepth);
            }

            prevLine = line;
            prevDepth = result;
            history.push({ indent: currentIndent, depth: result });
        }
    });
});

