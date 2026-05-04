import { afterEach, describe, expect, it } from "vitest";
import { resolveDatabaseUrl } from "./resolve-database-url.js";

describe("resolveDatabaseUrl", () => {
  const prev = process.env.DATABASE_URL;

  afterEach(() => {
    if (prev === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prev;
  });

  it("returns undefined when env is unset and no override", () => {
    delete process.env.DATABASE_URL;
    expect(resolveDatabaseUrl()).toBeUndefined();
  });

  it("treats whitespace-only env as unset", () => {
    process.env.DATABASE_URL = "   \t\n  ";
    expect(resolveDatabaseUrl()).toBeUndefined();
  });

  it("trims and returns env value", () => {
    process.env.DATABASE_URL = "  postgres://x@y/z  ";
    expect(resolveDatabaseUrl()).toBe("postgres://x@y/z");
  });

  it("override wins over env", () => {
    process.env.DATABASE_URL = "postgres://env/db";
    expect(resolveDatabaseUrl("postgres://override/db")).toBe("postgres://override/db");
  });

  it("treats whitespace-only override as unset", () => {
    process.env.DATABASE_URL = "postgres://env/db";
    expect(resolveDatabaseUrl("  \n")).toBeUndefined();
  });
});
