import { describe, expect, it, vi } from "vitest";
import type { TodoRepository } from "../repositories/todo.repository.js";
import type { TodoRow } from "../db/schema.js";
import { TodoService } from "./todo.service.js";

describe("TodoService", () => {
  it("US-1.3.a: listTodos maps camelCase and sorts createdAt descending", async () => {
    const older = new Date("2020-01-01T00:00:00.000Z");
    const newer = new Date("2025-06-01T12:00:00.000Z");
    /** Repository is responsible for `createdAt` DESC; service maps rows as returned. */
    const rows: TodoRow[] = [
      {
        id: "00000000-0000-4000-8000-000000000002",
        text: "newer",
        done: true,
        createdAt: newer,
        updatedAt: null,
      },
      {
        id: "00000000-0000-4000-8000-000000000001",
        text: "older",
        done: false,
        createdAt: older,
        updatedAt: null,
      },
    ];
    const mockRepo: Pick<TodoRepository, "list"> = {
      list: vi.fn().mockResolvedValue(rows),
    };
    const svc = new TodoService(mockRepo as TodoRepository);
    const out = await svc.listTodos();

    expect(out).toHaveLength(2);
    expect(out[0]!.id).toBe("00000000-0000-4000-8000-000000000002");
    expect(out[1]!.id).toBe("00000000-0000-4000-8000-000000000001");
    expect(Object.keys(out[0]!)).toEqual(["id", "text", "done", "createdAt"]);
    expect(out[0]!.createdAt).toMatch(/Z$/);
  });
});
