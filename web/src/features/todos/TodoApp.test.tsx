import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Todo } from "../../api/todosClient";
import { TodoApp } from "./TodoApp";

function renderWithClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <TodoApp />
    </QueryClientProvider>,
  );
}

describe("TodoApp", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders empty list after fetch", async () => {
    vi.mocked(fetch).mockImplementation(async () => {
      return new Response(JSON.stringify([]), { status: 200 });
    });
    renderWithClient();
    await waitFor(() =>
      expect(screen.getByTestId("todo-empty")).toBeVisible(),
    );
  });

  it("creates a todo and refreshes list", async () => {
    const user = userEvent.setup();
    let list: Todo[] = [];
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : String(input);
      const method = init?.method ?? "GET";
      if (method === "GET" && url.endsWith("/api/v1/todos")) {
        return new Response(JSON.stringify(list), { status: 200 });
      }
      if (method === "POST" && url.endsWith("/api/v1/todos")) {
        const body = JSON.parse(String(init?.body ?? "{}")) as { text?: string };
        const created: Todo = {
          id: "00000000-0000-4000-8000-000000000099",
          text: String(body.text ?? ""),
          done: false,
          createdAt: new Date().toISOString(),
        };
        list = [created];
        return new Response(JSON.stringify(created), { status: 201 });
      }
      return new Response("unexpected", { status: 500 });
    });

    renderWithClient();
    await waitFor(() =>
      expect(screen.getByTestId("todo-empty")).toBeVisible(),
    );

    await user.type(
      screen.getByRole("textbox", { name: /new todo/i }),
      "Ship it",
    );
    await user.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() =>
      expect(screen.getByText("Ship it")).toBeVisible(),
    );
  });
});
