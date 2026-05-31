import { describe, it, expect, beforeEach } from 'vitest';
import { textReorganizer } from '../scripts/modules/text_reorganizer.js';

describe('TextReorganizer Heuristic (detectDepth)', () => {
  let context;

  beforeEach(() => {
    context = { indentSize: 2 }; // Default to 2 for predictable tests
  });

  it('1-5: Basic Indentation', () => {
    expect(textReorganizer.detectDepth("Root", null, 0, context)).toBe(0);
    expect(textReorganizer.detectDepth("  Child", "Root", 0, context)).toBe(1);
    expect(textReorganizer.detectDepth("    Grandchild", "  Child", 1, context)).toBe(2);
    expect(textReorganizer.detectDepth("  Sibling", "  Child", 1, context)).toBe(1);
    expect(textReorganizer.detectDepth("Root Again", "  Sibling", 1, context)).toBe(0);
  });

  it('6-10: Bullets', () => {
    expect(textReorganizer.detectDepth("- Item 1", null, 0, context)).toBe(0);
    expect(textReorganizer.detectDepth("* Item 2", "- Item 1", 0, context)).toBe(0);
    expect(textReorganizer.detectDepth("  + Sub-item", "* Item 2", 0, context)).toBe(1);
    expect(textReorganizer.detectDepth("  • Another Sub", "  + Sub-item", 1, context)).toBe(1);
    expect(textReorganizer.detectDepth("> Quote style", "Root", 0, context)).toBe(0);
  });

  it('11-15: Numbering', () => {
    expect(textReorganizer.detectDepth("1. First", null, 0, context)).toBe(0);
    expect(textReorganizer.detectDepth("2) Second", "1. First", 0, context)).toBe(0);
    expect(textReorganizer.detectDepth("  1.1 Sub", "2) Second", 0, context)).toBe(1);
    expect(textReorganizer.detectDepth("  a) Alpha", "  1.1 Sub", 1, context)).toBe(1);
    expect(textReorganizer.detectDepth("3. Third", "  a) Alpha", 1, context)).toBe(0);
  });

  it('16-20: Colons', () => {
    expect(textReorganizer.detectDepth("Header:", null, 0, context)).toBe(0);
    expect(textReorganizer.detectDepth("Detail", "Header:", 0, context)).toBe(1);
    expect(textReorganizer.detectDepth("  Subheader:", "Detail", 1, context)).toBe(1);
    expect(textReorganizer.detectDepth("  More Detail", "  Subheader:", 1, context)).toBe(2);
    expect(textReorganizer.detectDepth("Back", "  More Detail", 2, context)).toBe(0);
  });

  it('21-25: Comments', () => {
    expect(textReorganizer.detectDepth("// JS comment", "Node", 0, context)).toBe(-1);
    expect(textReorganizer.detectDepth("# Shell comment", "Node", 0, context)).toBe(-1);
    expect(textReorganizer.detectDepth("(Parenthesis)", "Node", 0, context)).toBe(-1);
    expect(textReorganizer.detectDepth("note: check this", "Node", 0, context)).toBe(-1);
    expect(textReorganizer.detectDepth("Remark: very important", "Node", 0, context)).toBe(-1);
  });

  it('26-30: Case sensitivity', () => {
    expect(textReorganizer.detectDepth("TOP LEVEL", "  detail", 1, context)).toBe(0);
    expect(textReorganizer.detectDepth("ANOTHER HEADER", "TOP LEVEL", 0, context)).toBe(0);
    expect(textReorganizer.detectDepth("Not a Header", "ANOTHER HEADER", 0, context)).toBe(0);
    expect(textReorganizer.detectDepth("  SHOUTING CHILD", "Header", 0, context)).toBe(1);
    expect(textReorganizer.detectDepth("BACK TO ROOT", "  SHOUTING CHILD", 1, context)).toBe(0);
  });

  it('31-40: Mixed whitespace', () => {
    expect(textReorganizer.detectDepth("\tTabbed", null, 0, context)).toBe(1);
    expect(textReorganizer.detectDepth("  Spaces", "\tTabbed", 1, context)).toBe(1);
    expect(textReorganizer.detectDepth("    More Spaces", "  Spaces", 1, context)).toBe(2);
    expect(textReorganizer.detectDepth("\t\tDouble Tab", "    More Spaces", 2, context)).toBe(2);
    expect(textReorganizer.detectDepth("No indent", "\t\tDouble Tab", 2, context)).toBe(0);
    // ... more mixed
    expect(textReorganizer.detectDepth("  Indented:", "Root", 0, context)).toBe(1);
    expect(textReorganizer.detectDepth("  Child", "  Indented:", 1, context)).toBe(2);
    expect(textReorganizer.detectDepth("  Sibling", "  Child", 2, context)).toBe(1);
    expect(textReorganizer.detectDepth("    Sub-sibling", "  Sibling", 1, context)).toBe(2);
    expect(textReorganizer.detectDepth("Root", "    Sub-sibling", 2, context)).toBe(0);
  });

  it('41-100: Systematic Stress Test', () => {
    // We'll run a loop to generate 60 variations of the above rules
    for (let i = 0; i < 60; i++) {
        const targetDepth = i % 4;
        const spaces = " ".repeat(targetDepth * 2);
        const line = `${spaces}Test Node ${i}`;
        // If targetDepth is 0, don't use a colon in prev line
        const prev = targetDepth === 0 ? "Previous" : "Previous:";
        const prevDepth = targetDepth > 0 ? targetDepth - 1 : 0;
        
        const result = textReorganizer.detectDepth(line, prev, prevDepth, context);
        expect(result).toBe(targetDepth);
    }
  });
});
