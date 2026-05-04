/** PRD FR-02: max Unicode code points (not JS string length). */
export const MAX_TODO_TEXT_CODE_POINTS = 500;

export function countUnicodeCodePoints(s: string): number {
  return [...s].length;
}
