import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { MAX_TODO_TEXT_CODE_POINTS } from "../lib/constants.js";
import { createTodoBodySchema } from "./todo.zod.js";

describe("createTodoBodySchema (US-2.1.a)", () => {
  it("rejects empty text with flatten details suitable for error envelope", () => {
    try {
      createTodoBodySchema.parse({ text: "" });
      expect.fail("expected ZodError");
    } catch (e) {
      expect(e).toBeInstanceOf(ZodError);
      const flat = (e as ZodError).flatten();
      expect(flat.fieldErrors.text).toBeDefined();
      expect(Array.isArray(flat.fieldErrors.text)).toBe(true);
    }
  });

  it("rejects whitespace-only text after trim", () => {
    try {
      createTodoBodySchema.parse({ text: "   \t  " });
      expect.fail("expected ZodError");
    } catch (e) {
      expect(e).toBeInstanceOf(ZodError);
    }
  });
});

describe("createTodoBodySchema (US-2.1.b)", () => {
  it("accepts exactly MAX_TODO_TEXT_CODE_POINTS Unicode code points", () => {
    const max = "x".repeat(MAX_TODO_TEXT_CODE_POINTS);
    expect([...max].length).toBe(MAX_TODO_TEXT_CODE_POINTS);
    const parsed = createTodoBodySchema.parse({ text: max });
    expect(parsed.text).toBe(max);
  });

  it("rejects more than MAX_TODO_TEXT_CODE_POINTS Unicode code points", () => {
    const oversized = "x".repeat(MAX_TODO_TEXT_CODE_POINTS + 1);
    expect([...oversized].length).toBe(MAX_TODO_TEXT_CODE_POINTS + 1);

    try {
      createTodoBodySchema.parse({ text: oversized });
      expect.fail("expected ZodError");
    } catch (e) {
      expect(e).toBeInstanceOf(ZodError);
    }
  });
});
