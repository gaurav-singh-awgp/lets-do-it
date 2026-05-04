import { describe, it, expect, afterEach } from "vitest";
import Fastify from "fastify";

describe("health route (unit)", () => {
  let app: ReturnType<typeof Fastify>;

  afterEach(async () => {
    if (app) await app.close();
  });

  it("responds with ok", async () => {
    app = Fastify();
    app.get("/health", async () => ({ ok: true }));
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });
});
