import { z } from "zod";
import { countUnicodeCodePoints, MAX_TODO_TEXT_CODE_POINTS } from "../lib/constants.js";

const textField = z
  .string()
  .trim()
  .min(1, "Text is required")
  .refine(
    (s) => countUnicodeCodePoints(s) <= MAX_TODO_TEXT_CODE_POINTS,
    `Text must be at most ${MAX_TODO_TEXT_CODE_POINTS} Unicode code points`,
  );

export const createTodoBodySchema = z.object({
  text: textField,
});

/** Only `done` may be sent; any other key is rejected (immutable text). */
export const patchTodoBodySchema = z
  .object({
    done: z.boolean(),
  })
  .strict();

export type CreateTodoBody = z.infer<typeof createTodoBodySchema>;
export type PatchTodoBody = z.infer<typeof patchTodoBodySchema>;
