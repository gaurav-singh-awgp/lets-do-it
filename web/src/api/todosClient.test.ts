import { afterEach, describe, expect, it, vi } from "vitest";
import { LIST_TODOS_FAILED_MESSAGE, listTodos } from "./todosClient";

describe("listTodos", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws stable message when 200 body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("not json", { status: 200 })),
    );
    await expect(listTodos()).rejects.toThrow(LIST_TODOS_FAILED_MESSAGE);
  });

  it("throws stable message when 200 JSON is not an array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 })),
    );
    await expect(listTodos()).rejects.toThrow(LIST_TODOS_FAILED_MESSAGE);
  });
});
