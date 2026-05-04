export type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
};

const prefix = import.meta.env.VITE_API_BASE_URL ?? "";

async function readError(res: Response): Promise<string> {
  try {
    const j: unknown = await res.json();
    if (
      typeof j === "object" &&
      j !== null &&
      "error" in j &&
      typeof (j as { error: unknown }).error === "object" &&
      (j as { error: { message?: unknown } | null }).error !== null
    ) {
      const msg = (j as { error: { message?: unknown } }).error.message;
      if (typeof msg === "string" && msg.length > 0) return msg;
    }
  } catch {
    // ignore parse errors
  }
  return res.statusText || "Request failed";
}

export async function listTodos(): Promise<Todo[]> {
  const res = await fetch(`${prefix}/api/v1/todos`);
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<Todo[]>;
}

export async function createTodo(text: string): Promise<Todo> {
  const res = await fetch(`${prefix}/api/v1/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<Todo>;
}

export async function patchTodo(id: string, done: boolean): Promise<Todo> {
  const res = await fetch(`${prefix}/api/v1/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<Todo>;
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`${prefix}/api/v1/todos/${id}`, { method: "DELETE" });
  if (res.status === 204) return;
  if (!res.ok) throw new Error(await readError(res));
}
