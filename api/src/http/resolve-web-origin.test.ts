import { describe, expect, it } from "vitest";
import { resolveWebOrigin } from "./resolve-web-origin.js";

describe("resolveWebOrigin", () => {
  it("defaults when undefined or blank", () => {
    expect(resolveWebOrigin(undefined)).toBe("http://127.0.0.1:5173");
    expect(resolveWebOrigin("")).toBe("http://127.0.0.1:5173");
    expect(resolveWebOrigin("   ")).toBe("http://127.0.0.1:5173");
  });

  it("returns trimmed single origin", () => {
    expect(resolveWebOrigin("  http://localhost:5173  ")).toBe(
      "http://localhost:5173",
    );
  });

  it("rejects comma-separated list", () => {
    expect(() =>
      resolveWebOrigin("http://127.0.0.1:5173,http://localhost:5173"),
    ).toThrow(/single origin/);
  });
});
