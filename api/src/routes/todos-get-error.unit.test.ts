import Fastify from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { registerTodoRoutes } from "./todos.js";
import type { TodoService } from "../services/todo.service.js";

describe("GET /api/v1/todos failure envelope (IS-1.3.b, unit)", () => {
  let app: Awaited<ReturnType<typeof Fastify>>;

  afterEach(async () => {
    if (app) await app.close();
  });

  it("returns 500 with error envelope and requestId from Fastify genReqId", async () => {
    app = Fastify({
      logger: false,
      genReqId: () => "fixed-req-id-for-test",
    });

    const broken: Pick<TodoService, "listTodos"> = {
      listTodos: async () => {
        throw new Error("simulated DB failure");
      },
    };

    await registerTodoRoutes(app, broken as TodoService);

    const res = await app.inject({ method: "GET", url: "/api/v1/todos" });
    expect(res.statusCode).toBe(500);
    const body = res.json() as {
      error: { code: string; message: string; requestId?: string };
    };
    expect(body.error.code).toBe("INTERNAL");
    expect(body.error.requestId).toBe("fixed-req-id-for-test");
  });
});
