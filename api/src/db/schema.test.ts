import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { todos } from "./schema.js";

describe("todos schema (US-1.2.a)", () => {
  it("defines expected columns and index metadata", () => {
    const { columns, indexes, name } = getTableConfig(todos);
    expect(name).toBe("todos");
    const colNames = columns.map((c) => c.name);
    expect(colNames.sort()).toEqual(
      ["created_at", "done", "id", "text", "updated_at"].sort(),
    );
    const indexNames = indexes.map((i) => i.config.name);
    expect(indexNames).toContain("idx_todos_created_at_desc");
  });
});
