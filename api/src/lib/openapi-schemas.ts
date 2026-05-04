/**
 * JSON Schema fragments for Fastify route `schema` and @fastify/swagger.
 * Keep in sync with `TodoDto` / `ErrorBody` in application code.
 */

export const todoDtoJsonSchema = {
  type: "object",
  required: ["id", "text", "done", "createdAt"],
  properties: {
    id: { type: "string", format: "uuid" },
    text: { type: "string" },
    done: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

export const errorEnvelopeJsonSchema = {
  type: "object",
  required: ["error"],
  properties: {
    error: {
      type: "object",
      required: ["code", "message"],
      properties: {
        code: { type: "string", description: "Stable machine-readable code" },
        message: { type: "string", description: "Human-readable summary" },
        requestId: { type: "string", description: "Request correlation id" },
        details: { description: "Validation or extra context (shape varies)" },
      },
    },
  },
} as const;
