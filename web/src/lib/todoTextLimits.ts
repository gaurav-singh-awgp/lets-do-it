/** Matches api `MAX_TODO_TEXT_CODE_POINTS` (FR-02). */
export const MAX_TODO_TEXT_CODE_POINTS = 500;

/** Unicode code point count (spread length), not UTF-16 `.length`. */
export function countUnicodeCodePoints(s: string): number {
  return [...s].length;
}
