import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { createTodoBodySchema } from "./todo.zod.js";

describe("createTodoBodySchema (US-1.3.b)", () => {
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
});
