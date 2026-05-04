import type { FastifyReply } from "fastify";
import { randomUUID } from "node:crypto";

export type ErrorBody = {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
};

export function sendError(
  reply: FastifyReply,
  status: number,
  code: string,
  message: string,
  opts?: { requestId?: string; details?: unknown },
) {
  const requestId = opts?.requestId ?? randomUUID();
  const body: ErrorBody = {
    error: {
      code,
      message,
      requestId,
      ...(opts?.details !== undefined ? { details: opts.details } : {}),
    },
  };
  return reply.status(status).send(body);
}
