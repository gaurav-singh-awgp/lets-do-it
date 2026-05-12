export type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
};

/** Shown when list GET succeeds but the body is not usable JSON array of todos. */
export const LIST_TODOS_FAILED_MESSAGE =
  "We couldn't load your todos.";

/** 200/201 success body was not JSON or not a single todo object (camelCase fields). */
export class UnexpectedTodoResponseError extends Error {
  constructor(
    message = "We couldn't read the server's response for this todo.",
  ) {
    super(message);
    this.name = "UnexpectedTodoResponseError";
  }
}

const prefix = import.meta.env.VITE_API_BASE_URL ?? "";

function parseTodoResponse(raw: unknown): Todo {
  if (typeof raw !== "object" || raw === null) {
    throw new UnexpectedTodoResponseError();
  }
  const o = raw as Record<string, unknown>;
  if (
    typeof o.id === "string" &&
    typeof o.text === "string" &&
    typeof o.done === "boolean" &&
    typeof o.createdAt === "string"
  ) {
    return { id: o.id, text: o.text, done: o.done, createdAt: o.createdAt };
  }
  throw new UnexpectedTodoResponseError();
}

async function readSuccessJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    throw new UnexpectedTodoResponseError();
  }
}

/**
 * Thrown only when the response body parsed into a recognizable API error envelope
 * (`{ error: { message, code?, requestId? } }`). Consumers can use `instanceof`
 * to distinguish API-authored messages from client-synthesized fallbacks (network
 * errors, non-JSON 5xx, opaque failures) and decide whether to surface verbatim
 * or substitute friendly copy.
 */
export class ApiEnvelopeError extends Error {
  readonly code?: string;
  readonly requestId?: string;
  constructor(message: string, code?: string, requestId?: string) {
    super(message);
    this.name = "ApiEnvelopeError";
    this.code = code;
    this.requestId = requestId;
  }
}

async function buildResponseError(res: Response): Promise<Error> {
  try {
    const j: unknown = await res.json();
    if (
      typeof j === "object" &&
      j !== null &&
      "error" in j &&
      typeof (j as { error: unknown }).error === "object" &&
      (j as { error: unknown }).error !== null
    ) {
      const errObj = (j as {
        error: { message?: unknown; code?: unknown; requestId?: unknown };
      }).error;
      const msg = errObj.message;
      if (typeof msg === "string" && msg.length > 0) {
        const code = typeof errObj.code === "string" ? errObj.code : undefined;
        const requestId =
          typeof errObj.requestId === "string" ? errObj.requestId : undefined;
        return new ApiEnvelopeError(msg, code, requestId);
      }
    }
  } catch {
    // ignore parse errors
  }
  return new Error(res.statusText || "Request failed");
}

export async function listTodos(): Promise<Todo[]> {
  const res = await fetch(`${prefix}/api/v1/todos`);
  if (!res.ok) throw await buildResponseError(res);
  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw new Error(LIST_TODOS_FAILED_MESSAGE);
  }
  if (!Array.isArray(raw)) {
    throw new Error(LIST_TODOS_FAILED_MESSAGE);
  }
  return raw as Todo[];
}

export async function createTodo(text: string): Promise<Todo> {
  const res = await fetch(`${prefix}/api/v1/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw await buildResponseError(res);
  const raw = await readSuccessJson(res);
  return parseTodoResponse(raw);
}

export async function patchTodo(id: string, done: boolean): Promise<Todo> {
  const res = await fetch(`${prefix}/api/v1/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done }),
  });
  if (!res.ok) throw await buildResponseError(res);
  const raw = await readSuccessJson(res);
  return parseTodoResponse(raw);
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`${prefix}/api/v1/todos/${id}`, { method: "DELETE" });
  if (res.status === 204) return;
  if (!res.ok) throw await buildResponseError(res);
}
