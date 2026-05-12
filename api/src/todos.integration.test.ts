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

  it("IS-2.1.a: POST persists text and done=false in DB", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/todos",
      headers: { "content-type": "application/json" },
      payload: { text: "Persist me" },
    });
    expect(res.statusCode).toBe(201);
    const { id } = res.json() as { id: string };
    const row = await cleanPool.query<{ text: string; done: boolean }>(
      "SELECT text, done FROM todos WHERE id = $1",
      [id],
    );
    expect(row.rows).toHaveLength(1);
    expect(row.rows[0]!.text).toBe("Persist me");
    expect(row.rows[0]!.done).toBe(false);
  });

  it("IS-2.1.b: two sequential POSTs create two rows", async () => {
    const first = await app.inject({
      method: "POST",
      url: "/api/v1/todos",
      headers: { "content-type": "application/json" },
      payload: { text: "First" },
    });
    const second = await app.inject({
      method: "POST",
      url: "/api/v1/todos",
      headers: { "content-type": "application/json" },
      payload: { text: "Second" },
    });
    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(201);

    const list = await app.inject({ method: "GET", url: "/api/v1/todos" });
    expect(list.statusCode).toBe(200);
    const body = list.json() as Array<{ text: string }>;
    expect(body).toHaveLength(2);
    expect(body.map((t) => t.text).sort()).toEqual(["First", "Second"]);
  });

  it("POST rejects 501 Unicode code points and does not insert a row", async () => {
    const big = "x".repeat(501);
    expect([...big].length).toBe(501);
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/todos",
      headers: { "content-type": "application/json" },
      payload: { text: big },
    });
    expect(res.statusCode).toBe(400);
    const cnt = await cleanPool.query<{ n: string }>(
      "SELECT count(*)::text AS n FROM todos",
    );
    expect(Number(cnt.rows[0]!.n)).toBe(0);
  });

  it("IS-3.1.a: PATCH done:true — JSON and DB show done=true", async () => {
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
    const patchBody = res.json() as {
      id: string;
      text: string;
      done: boolean;
      createdAt: string;
    };
    expect(Object.keys(patchBody)).toEqual(["id", "text", "done", "createdAt"]);
    expect(patchBody.id).toBe(id);
    expect(patchBody.text).toBe("Walk");
    expect(patchBody.done).toBe(true);
    expect(patchBody.createdAt).toBeTruthy();

    const row = await cleanPool.query<{ done: boolean }>(
      "SELECT done FROM todos WHERE id = $1",
      [id],
    );
    expect(row.rows).toHaveLength(1);
    expect(row.rows[0]!.done).toBe(true);
  });

  it("IS-3.1.b: PATCH done:false after true — persisted done=false", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/todos",
      headers: { "content-type": "application/json" },
      payload: { text: "Toggle back" },
    });
    const id = (created.json() as { id: string }).id;

    const first = await app.inject({
      method: "PATCH",
      url: `/api/v1/todos/${id}`,
      headers: { "content-type": "application/json" },
      payload: { done: true },
    });
    expect(first.statusCode).toBe(200);
    expect((first.json() as { done: boolean }).done).toBe(true);

    const interim = await cleanPool.query<{ done: boolean }>(
      "SELECT done FROM todos WHERE id = $1",
      [id],
    );
    expect(interim.rows).toHaveLength(1);
    expect(interim.rows[0]!.done).toBe(true);

    const second = await app.inject({
      method: "PATCH",
      url: `/api/v1/todos/${id}`,
      headers: { "content-type": "application/json" },
      payload: { done: false },
    });
    expect(second.statusCode).toBe(200);
    const secondBody = second.json() as {
      id: string;
      text: string;
      done: boolean;
      createdAt: string;
    };
    expect(Object.keys(secondBody)).toEqual(["id", "text", "done", "createdAt"]);
    expect(secondBody.id).toBe(id);
    expect(secondBody.text).toBe("Toggle back");
    expect(secondBody.done).toBe(false);
    expect(secondBody.createdAt).toBeTruthy();

    const row = await cleanPool.query<{ done: boolean }>(
      "SELECT done FROM todos WHERE id = $1",
      [id],
    );
    expect(row.rows).toHaveLength(1);
    expect(row.rows[0]!.done).toBe(false);
  });

  it("IS-3.1.c: PATCH unknown id — 404 NOT_FOUND", async () => {
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

  it("PATCH rejects { done, text } — 400 VALIDATION (immutable text)", async () => {
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

  it("IS-3.1.e: PATCH with empty body {} — 400 VALIDATION (done is required)", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/todos",
      headers: { "content-type": "application/json" },
      payload: { text: "Body test" },
    });
    const id = (created.json() as { id: string }).id;
    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/todos/${id}`,
      headers: { "content-type": "application/json" },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe(
      "VALIDATION",
    );
  });

  it("IS-3.1.f: PATCH with done: 1 (non-boolean) — 400 VALIDATION", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/todos",
      headers: { "content-type": "application/json" },
      payload: { text: "Type test" },
    });
    const id = (created.json() as { id: string }).id;
    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/todos/${id}`,
      headers: { "content-type": "application/json" },
      payload: { done: 1 },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe(
      "VALIDATION",
    );
  });

  it("IS-2.3.a: DELETE existing todo → 204 then GET shows row absent", async () => {
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

  it("DELETE unknown id — 404 + envelope (regression for AC2)", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/v1/todos/00000000-0000-4000-8000-000000000002",
    });
    expect(res.statusCode).toBe(404);
    const body = res.json() as {
      error: { code: string; message: string; requestId?: string };
    };
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBeTruthy();
    expect(body.error.requestId).toBeTruthy();
  });

  it("IS-3.1.d: PATCH invalid UUID — 400 VALIDATION", async () => {
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

  it("DELETE invalid id — 400 + VALIDATION envelope (AC3)", async () => {
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

  it("OpenAPI JSON lists GET/POST /api/v1/todos, PATCH/DELETE /api/v1/todos/{id}", async () => {
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
        paths?: Record<
          string,
          {
            get?: unknown;
            post?: unknown;
            patch?: {
              parameters?: Array<{ name: string; schema?: { format?: string } }>;
              requestBody?: {
                content?: {
                  "application/json"?: {
                    schema?: {
                      properties?: Record<string, unknown>;
                      required?: string[];
                    };
                  };
                };
              };
              responses?: Record<string, unknown>;
            };
            delete?: {
              parameters?: Array<{ name: string; schema?: { format?: string } }>;
              responses?: Record<string, unknown>;
            };
          }
        >;
      };
      expect(spec.paths?.["/api/v1/todos"]?.get).toBeDefined();
      expect(spec.paths?.["/api/v1/todos"]?.post).toBeDefined();

      const patchPath = spec.paths?.["/api/v1/todos/{id}"]?.patch;
      expect(patchPath).toBeDefined();
      expect(patchPath?.responses?.["200"]).toBeDefined();
      expect(patchPath?.responses?.["400"]).toBeDefined();
      expect(patchPath?.responses?.["404"]).toBeDefined();
      expect(patchPath?.responses?.["500"]).toBeDefined();
      const patchBodySchema =
        patchPath?.requestBody?.content?.["application/json"]?.schema;
      expect(patchBodySchema?.properties?.done).toBeDefined();

      const patchIdParam = patchPath?.parameters?.find((p) => p.name === "id");
      expect(patchIdParam).toBeDefined();
      expect(patchIdParam?.schema?.format).toBe("uuid");

      const deletePath = spec.paths?.["/api/v1/todos/{id}"]?.delete;
      expect(deletePath).toBeDefined();
      expect(deletePath?.responses?.["204"]).toBeDefined();
      expect(deletePath?.responses?.["400"]).toBeDefined();
      expect(deletePath?.responses?.["404"]).toBeDefined();
      expect(deletePath?.responses?.["500"]).toBeDefined();
      const idParam = deletePath?.parameters?.find((p) => p.name === "id");
      expect(idParam?.schema?.format).toBe("uuid");
    } finally {
      await swApp.close();
    }
  });
});
