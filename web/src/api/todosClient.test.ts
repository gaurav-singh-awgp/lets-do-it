import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LIST_TODOS_FAILED_MESSAGE,
  UnexpectedTodoResponseError,
  createTodo,
  listTodos,
  patchTodo,
} from "./todosClient";

const validTodo = {
  id: "00000000-0000-4000-8000-000000000001",
  text: "x",
  done: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};

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

describe("createTodo / patchTodo success bodies", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("createTodo throws UnexpectedTodoResponseError when 201 body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 201 })),
    );
    await expect(createTodo("hello")).rejects.toBeInstanceOf(
      UnexpectedTodoResponseError,
    );
  });

  it("createTodo throws when 201 JSON is not a todo object", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ foo: 1 }), { status: 201 }),
      ),
    );
    await expect(createTodo("hello")).rejects.toBeInstanceOf(
      UnexpectedTodoResponseError,
    );
  });

  it("patchTodo returns todo when 200 body is valid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ...validTodo, done: true }), {
          status: 200,
        }),
      ),
    );
    await expect(patchTodo(validTodo.id, true)).resolves.toEqual({
      ...validTodo,
      done: true,
    });
  });

  it("patchTodo throws when 200 JSON is not a todo object", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 })),
    );
    await expect(patchTodo(validTodo.id, true)).rejects.toBeInstanceOf(
      UnexpectedTodoResponseError,
    );
  });
});
