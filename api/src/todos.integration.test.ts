import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import pg from "pg";
import { buildApp } from "./app.js";
import { resolveDatabaseUrl } from "./db/resolve-database-url.js";
import type { FastifyInstance } from "fastify";

const databaseUrl = resolveDatabaseUrl();

describe.skipIf(!databaseUrl)("todo API (integration)", () => {
  let app: FastifyInstance;
  let cleanPool: pg.Pool;

  beforeAll(async () => {
    app = await buildApp({
      databaseUrl: databaseUrl!,
      enableSwagger: false,
    });
    cleanPool = new pg.Pool({ connectionString: databaseUrl });
  });

  beforeEach(async () => {
    await cleanPool.query("DELETE FROM todos");
  });

  it("IS-1.2.a: todos table and created_at DESC index exist after migrations", async () => {
    const tbl = await cleanPool.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'todos'
       ORDER BY ordinal_position`,
    );
    const cols = tbl.rows.map((r) => r.column_name);
    expect(cols).toEqual(["id", "text", "done", "created_at", "updated_at"]);

    const idx = await cleanPool.query<{ indexdef: string }>(
      `SELECT indexdef FROM pg_indexes
       WHERE schemaname = 'public' AND tablename = 'todos' AND indexname = 'idx_todos_created_at_desc'`,
    );
    expect(idx.rows).toHaveLength(1);
    expect(idx.rows[0]!.indexdef).toMatch(/created_at.*DESC/i);
  });

  afterAll(async () => {
    await cleanPool.end();
    await app.close();
  });

  it("GET /api/v1/todos returns empty list", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/todos" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it("POST /api/v1/todos creates a todo", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/todos",
      headers: { "content-type": "application/json" },
      payload: { text: "Buy milk" },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as {
      id: string;
      text: string;
      done: boolean;
      createdAt: string;
    };
    expect(body.text).toBe("Buy milk");
    expect(body.done).toBe(false);
    expect(body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("POST /api/v1/todos rejects invalid body", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/todos",
      headers: { "content-type": "application/json" },
      payload: { text: "" },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json() as { error: { code: string } };
    expect(body.error.code).toBe("VALIDATION");
  });

  it("PATCH /api/v1/todos/:id toggles done", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/todos",
      headers: { "content-type": "application/json" },
      payload: { text: "Walk" },
    });
    const id = (created.json() as { id: string }).id;

    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/todos/${id}`,
      headers: { "content-type": "application/json" },
      payload: { done: true },
    });
    expect(res.statusCode).toBe(200);
    expect((res.json() as { done: boolean }).done).toBe(true);
  });

  it("PATCH /api/v1/todos/:id returns 404 for unknown id", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/todos/00000000-0000-4000-8000-000000000001",
      headers: { "content-type": "application/json" },
      payload: { done: true },
    });
    expect(res.statusCode).toBe(404);
    expect((res.json() as { error: { code: string } }).error.code).toBe(
      "NOT_FOUND",
    );
  });

  it("PATCH rejects extra keys (immutable text)", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/todos",
      headers: { "content-type": "application/json" },
      payload: { text: "A" },
    });
    const id = (created.json() as { id: string }).id;
    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/todos/${id}`,
      headers: { "content-type": "application/json" },
      payload: { done: true, text: "nope" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("DELETE /api/v1/todos/:id removes todo", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/todos",
      headers: { "content-type": "application/json" },
      payload: { text: "Temp" },
    });
    const id = (created.json() as { id: string }).id;

    const del = await app.inject({
      method: "DELETE",
      url: `/api/v1/todos/${id}`,
    });
    expect(del.statusCode).toBe(204);

    const list = await app.inject({ method: "GET", url: "/api/v1/todos" });
    expect(list.json()).toEqual([]);
  });

  it("DELETE returns 404 for unknown id", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/v1/todos/00000000-0000-4000-8000-000000000002",
    });
    expect(res.statusCode).toBe(404);
  });

  it("PATCH returns 400 for invalid uuid", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/todos/not-a-uuid",
      headers: { "content-type": "application/json" },
      payload: { done: true },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe(
      "VALIDATION",
    );
  });

  it("DELETE returns 400 for invalid uuid", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/v1/todos/not-a-uuid",
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe(
      "VALIDATION",
    );
  });

  it("IS-1.3.a: GET returns two todos newest first with camelCase keys", async () => {
    await cleanPool.query(
      `INSERT INTO todos (id, text, done, created_at, updated_at) VALUES
        ('00000000-0000-4000-8000-000000000010', 'older-row', false, '2019-06-01T00:00:00.000Z', NULL),
        ('00000000-0000-4000-8000-000000000011', 'newer-row', false, '2030-06-01T00:00:00.000Z', NULL)`,
    );
    const res = await app.inject({ method: "GET", url: "/api/v1/todos" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as Array<{
      id: string;
      text: string;
      done: boolean;
      createdAt: string;
    }>;
    expect(body).toHaveLength(2);
    expect(body[0]!.text).toBe("newer-row");
    expect(body[1]!.text).toBe("older-row");
    expect(Object.keys(body[0]!)).toEqual(["id", "text", "done", "createdAt"]);
  });

  it("OpenAPI JSON lists GET /api/v1/todos", async () => {
    const swApp = await buildApp({
      databaseUrl: databaseUrl!,
      enableSwagger: true,
    });
    try {
      const res = await swApp.inject({
        method: "GET",
        url: "/documentation/json",
      });
      expect(res.statusCode).toBe(200);
      const spec = res.json() as {
        paths?: Record<string, { get?: unknown }>;
      };
      expect(spec.paths?.["/api/v1/todos"]?.get).toBeDefined();
    } finally {
      await swApp.close();
    }
  });
});
