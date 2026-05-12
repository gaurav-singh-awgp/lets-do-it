import { describe, expect, it } from "vitest";
import { countUnicodeCodePoints, MAX_TODO_TEXT_CODE_POINTS } from "./todoTextLimits";

describe("todoTextLimits", () => {
  it("counts astral-plane characters as one code point each", () => {
    const s = "a🌟b";
    expect(s.length).toBe(4);
    expect(countUnicodeCodePoints(s)).toBe(3);
  });

  it("documents parity with server max", () => {
    expect(MAX_TODO_TEXT_CODE_POINTS).toBe(500);
  });
});
