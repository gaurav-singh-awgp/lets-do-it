import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { MAX_TODO_TEXT_CODE_POINTS } from "../lib/constants.js";
import { createTodoBodySchema, patchTodoBodySchema } from "./todo.zod.js";

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

describe("US-3.1.a: patchTodoBodySchema", () => {
  it("accepts { done: true }", () => {
    expect(patchTodoBodySchema.parse({ done: true })).toEqual({ done: true });
  });

  it("accepts { done: false }", () => {
    expect(patchTodoBodySchema.parse({ done: false })).toEqual({ done: false });
  });

  it("rejects { text, done } (immutable text)", () => {
    expect(() =>
      patchTodoBodySchema.parse({ done: true, text: "x" }),
    ).toThrow(ZodError);
  });

  it("rejects unknown keys (strict)", () => {
    expect(() =>
      patchTodoBodySchema.parse({ done: true, extra: 1 }),
    ).toThrow(ZodError);
  });

  it("rejects {} — done is required", () => {
    expect(() => patchTodoBodySchema.parse({})).toThrow(ZodError);
  });

  it("rejects { done: 1 } — done must be boolean, not a number", () => {
    expect(() =>
      patchTodoBodySchema.parse({ done: 1 }),
    ).toThrow(ZodError);
  });

  it("rejects { done: null } — done must be boolean, not null", () => {
    expect(() =>
      patchTodoBodySchema.parse({ done: null }),
    ).toThrow(ZodError);
  });
});
