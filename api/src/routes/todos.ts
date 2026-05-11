import type { FastifyInstance, FastifyRequest } from "fastify";
import { ZodError, z } from "zod";
import { sendError } from "../lib/errors.js";
import { errorEnvelopeJsonSchema, todoDtoJsonSchema } from "../lib/openapi-schemas.js";
import { MAX_TODO_TEXT_CODE_POINTS } from "../lib/constants.js";
import { createTodoBodySchema, patchTodoBodySchema } from "../schemas/todo.zod.js";
import { TodoService } from "../services/todo.service.js";

function rid(request: FastifyRequest) {
  return String(request.id);
}

const todoIdParamSchema = z.string().uuid();

const createTodoBodyOpenApi = {
  type: "object",
  required: ["text"],
  additionalProperties: false,
  properties: {
    text: {
      type: "string",
      minLength: 1,
      description: `Non-empty text; max ${MAX_TODO_TEXT_CODE_POINTS} Unicode code points enforced at runtime by Zod (OpenAPI omits maxLength so documented contract matches code-point semantics, not UTF-16 units).`,
    },
  },
} as const;

const patchTodoBodyOpenApi = {
  type: "object",
  required: ["done"],
  additionalProperties: false,
  properties: {
    done: { type: "boolean" },
  },
} as const;

const todoIdParamOpenApi = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", format: "uuid", description: "Todo id" },
  },
} as const;

export async function registerTodoRoutes(
  app: FastifyInstance,
  service: TodoService,
) {
  app.get(
    "/api/v1/todos",
    {
      schema: {
        tags: ["todos"],
        summary: "List todos",
        description:
          "Returns a JSON array (no wrapper object) sorted by createdAt descending.",
        response: {
          200: {
            description: "Todos sorted newest first",
            type: "array",
            items: { ...todoDtoJsonSchema },
          },
          500: {
            description: "Server or persistence failure",
            ...errorEnvelopeJsonSchema,
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const list = await service.listTodos();
        return reply.send(list);
      } catch (e) {
        app.log.error(e);
        return sendError(reply, 500, "INTERNAL", "Failed to list todos", {
          requestId: rid(request),
        });
      }
    },
  );

  app.post(
    "/api/v1/todos",
    {
      schema: {
        tags: ["todos"],
        summary: "Create todo",
        body: { ...createTodoBodyOpenApi },
        response: {
          201: {
            ...todoDtoJsonSchema,
          },
          400: {
            description: "Validation failure",
            ...errorEnvelopeJsonSchema,
          },
          500: {
            description: "Server failure",
            ...errorEnvelopeJsonSchema,
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = createTodoBodySchema.parse(request.body);
        const created = await service.createTodo(body);
        return reply.code(201).send(created);
      } catch (e) {
        if (e instanceof ZodError) {
          return sendError(reply, 400, "VALIDATION", "Invalid request body", {
            requestId: rid(request),
            details: e.flatten(),
          });
        }
        app.log.error(e);
        return sendError(reply, 500, "INTERNAL", "Failed to create todo", {
          requestId: rid(request),
        });
      }
    },
  );

  app.patch<{ Params: { id: string } }>(
    "/api/v1/todos/:id",
    {
      schema: {
        tags: ["todos"],
        summary: "Update todo (done only)",
        params: { ...todoIdParamOpenApi },
        body: { ...patchTodoBodyOpenApi },
        response: {
          200: {
            ...todoDtoJsonSchema,
          },
          400: {
            description: "Invalid id or body",
            ...errorEnvelopeJsonSchema,
          },
          404: {
            description: "Todo not found",
            ...errorEnvelopeJsonSchema,
          },
          500: {
            description: "Server failure",
            ...errorEnvelopeJsonSchema,
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const idParse = todoIdParamSchema.safeParse(request.params.id);
        if (!idParse.success) {
          return sendError(reply, 400, "VALIDATION", "Invalid todo id", {
            requestId: rid(request),
            details: idParse.error.flatten(),
          });
        }
        const body = patchTodoBodySchema.parse(request.body);
        const updated = await service.patchTodo(idParse.data, body);
        if (!updated) {
          return sendError(reply, 404, "NOT_FOUND", "Todo not found", {
            requestId: rid(request),
          });
        }
        return reply.send(updated);
      } catch (e) {
        if (e instanceof ZodError) {
          return sendError(reply, 400, "VALIDATION", "Invalid request body", {
            requestId: rid(request),
            details: e.flatten(),
          });
        }
        app.log.error(e);
        return sendError(reply, 500, "INTERNAL", "Failed to update todo", {
          requestId: rid(request),
        });
      }
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/api/v1/todos/:id",
    {
      schema: {
        tags: ["todos"],
        summary: "Delete todo",
        params: { ...todoIdParamOpenApi },
        response: {
          204: {
            description: "No content — todo deleted",
          },
          400: {
            description: "Invalid id",
            ...errorEnvelopeJsonSchema,
          },
          404: {
            description: "Todo not found",
            ...errorEnvelopeJsonSchema,
          },
          500: {
            description: "Server failure",
            ...errorEnvelopeJsonSchema,
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const idParse = todoIdParamSchema.safeParse(request.params.id);
        if (!idParse.success) {
          return sendError(reply, 400, "VALIDATION", "Invalid todo id", {
            requestId: rid(request),
            details: idParse.error.flatten(),
          });
        }
        const deleted = await service.deleteTodo(idParse.data);
        if (!deleted) {
          return sendError(reply, 404, "NOT_FOUND", "Todo not found", {
            requestId: rid(request),
          });
        }
        return reply.code(204).send();
      } catch (e) {
        app.log.error(e);
        return sendError(reply, 500, "INTERNAL", "Failed to delete todo", {
          requestId: rid(request),
        });
      }
    },
  );
}
