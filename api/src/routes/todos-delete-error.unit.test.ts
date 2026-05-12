import Fastify from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { registerTodoRoutes } from "./todos.js";
import type { TodoService } from "../services/todo.service.js";

describe("US-2.3.a: DELETE /api/v1/todos/:id unknown id → 404 + envelope (unit)", () => {
  let app: Awaited<ReturnType<typeof Fastify>>;

  afterEach(async () => {
    if (app) await app.close();
  });

  it("US-2.3.a: returns 404 NOT_FOUND with requestId when deleteTodo resolves false", async () => {
    app = Fastify({
      logger: false,
      genReqId: () => "fixed-req-id-delete-test",
    });

    const stub: Pick<TodoService, "deleteTodo"> = {
      deleteTodo: async (_id: string) => false,
    };

    await registerTodoRoutes(app, stub as TodoService);

    const res = await app.inject({
      method: "DELETE",
      url: "/api/v1/todos/00000000-0000-4000-8000-000000000099",
    });

    expect(res.statusCode).toBe(404);
    const body = res.json() as {
      error: { code: string; message: string; requestId?: string };
    };
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBeTruthy();
    expect(body.error.requestId).toBe("fixed-req-id-delete-test");
  });
});
