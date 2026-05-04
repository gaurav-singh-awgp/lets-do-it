import { randomUUID } from "node:crypto";
import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { Db } from "./db/client.js";
import { createDb, createPool } from "./db/client.js";
import { resolveDatabaseUrl } from "./db/resolve-database-url.js";
import { runMigrations } from "./db/run-migrations.js";
import { registerTodoRoutes } from "./routes/todos.js";
import { TodoRepository } from "./repositories/todo.repository.js";
import { TodoService } from "./services/todo.service.js";

export type BuildAppOptions = {
  /** When omitted, uses `process.env.DATABASE_URL` (required for todo routes). */
  databaseUrl?: string;
  /** Disable swagger in minimal tests. */
  enableSwagger?: boolean;
};

export async function buildApp(opts: BuildAppOptions = {}) {
  const app = Fastify({
    logger: true,
    genReqId: () => randomUUID(),
  });

  const databaseUrl = resolveDatabaseUrl(opts.databaseUrl);
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to build the todo API");
  }

  const pool = createPool(databaseUrl);
  const db: Db = createDb(pool);
  await runMigrations(db);

  app.addHook("onClose", async () => {
    await pool.end();
  });

  const enableSwagger = opts.enableSwagger ?? true;
  if (enableSwagger) {
    await app.register(swagger, {
      openapi: {
        openapi: "3.1.0",
        info: {
          title: "lets-do-it API",
          version: "1.0.0",
        },
        tags: [{ name: "todos", description: "Todo collection and items" }],
      },
    });
    await app.register(swaggerUi, {
      routePrefix: "/documentation",
    });
  }

  const webOrigin = process.env.WEB_ORIGIN ?? "http://127.0.0.1:5173";
  await app.register(helmet);
  await app.register(cors, {
    origin: webOrigin,
    credentials: true,
  });

  app.get("/health", async () => ({ ok: true }));

  const repo = new TodoRepository(db);
  const service = new TodoService(repo);
  await registerTodoRoutes(app, service);

  app.setErrorHandler((err, request, reply) => {
    request.log.error(err);

    const validation = readFastifyValidation(err);
    if (validation !== undefined) {
      const msg =
        err instanceof Error ? err.message : "Request validation failed";
      return reply.status(400).send({
        error: {
          code: "VALIDATION",
          message: msg || "Request validation failed",
          requestId: request.id,
          details: validation,
        },
      });
    }

    const fastifyErr = err as FastifyError;
    if (fastifyErr.code === "FST_ERR_RESPONSE_SERIALIZATION") {
      return reply.status(500).send({
        error: {
          code: "INTERNAL",
          message: "Response serialization failed",
          requestId: request.id,
        },
      });
    }

    return reply.status(500).send({
      error: {
        code: "INTERNAL",
        message: "Unexpected server error",
        requestId: request.id,
      },
    });
  });

  return app;
}

function readFastifyValidation(err: unknown): unknown[] | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const candidate = (err as { validation?: unknown }).validation;
  return Array.isArray(candidate) ? candidate : undefined;
}
