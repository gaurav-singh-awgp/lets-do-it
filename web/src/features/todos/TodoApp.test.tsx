import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Todo } from "../../api/todosClient";
import { server } from "../../test/mswServer";
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
  describe("fetch stubbed (legacy)", () => {
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
          const body = JSON.parse(String(init?.body ?? "{}")) as {
            text?: string;
          };
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

  describe("MSW", () => {
    it("US-1.4.a empty state via MSW", async () => {
      renderWithClient();
      await waitFor(() =>
        expect(screen.getByTestId("todo-empty")).toBeVisible(),
      );
      expect(
        screen.getByRole("heading", { name: /no todos yet/i }),
      ).toBeVisible();
    });

    it("US-1.4.b loading state while request pending", async () => {
      server.use(
        http.get("*/api/v1/todos", async () => {
          await delay("infinite");
          return HttpResponse.json([]);
        }),
      );
      renderWithClient();
      expect(
        await screen.findByRole("status", { name: /loading todos/i }),
      ).toBeVisible();
    });

    it("US-1.4.c error banner + Retry on 500", async () => {
      server.use(
        http.get("*/api/v1/todos", () =>
          HttpResponse.json(
            {
              error: {
                code: "INTERNAL",
                message: "Failed to list todos",
                requestId: "test-req",
              },
            },
            { status: 500 },
          ),
        ),
      );
      renderWithClient();
      const alert = await screen.findByRole("alert");
      expect(alert).toBeVisible();
      expect(alert).toHaveTextContent("Failed to list todos");
      expect(
        screen.getByRole("button", { name: /retry/i }),
      ).toBeVisible();
    });

    it("IS-1.4.a renders two todos newest-first", async () => {
      const older: Todo = {
        id: "00000000-0000-4000-8000-000000000001",
        text: "Older",
        done: false,
        createdAt: "2020-01-01T00:00:00.000Z",
      };
      const newer: Todo = {
        id: "00000000-0000-4000-8000-000000000002",
        text: "Newer",
        done: false,
        createdAt: "2021-06-01T00:00:00.000Z",
      };
      server.use(
        http.get("*/api/v1/todos", () =>
          HttpResponse.json([newer, older]),
        ),
      );
      renderWithClient();
      await waitFor(() =>
        expect(screen.getByRole("list", { name: /todo list/i })).toBeVisible(),
      );
      const items = screen.getAllByRole("listitem");
      expect(items[0]).toHaveTextContent("Newer");
      expect(items[1]).toHaveTextContent("Older");
    });

    it("IS-1.4.b retry recovers from initial failure", async () => {
      const user = userEvent.setup();
      const recovered: Todo = {
        id: "00000000-0000-4000-8000-000000000003",
        text: "Recovered",
        done: false,
        createdAt: "2022-01-01T00:00:00.000Z",
      };
      // Mode flag driven by the test (not by request counts) so any incidental
      // GET during the failure phase still returns 500 — recovery only happens
      // after we explicitly flip the mode, before clicking Retry.
      let mode: "fail" | "ok" = "fail";
      server.use(
        http.get("*/api/v1/todos", async () => {
          if (mode === "fail") {
            return HttpResponse.json(
              {
                error: {
                  code: "INTERNAL",
                  message: "Temporary failure",
                  requestId: "r1",
                },
              },
              { status: 500 },
            );
          }
          // Brief delay so the retry's loading affordance is observable.
          await delay(40);
          return HttpResponse.json([recovered]);
        }),
      );
      renderWithClient();
      expect(await screen.findByRole("alert")).toBeVisible();
      expect(screen.getByRole("alert")).toHaveTextContent("Temporary failure");
      mode = "ok";
      await user.click(screen.getByRole("button", { name: /retry/i }));
      // AC4 loading-during-retry: skeleton must appear while refetch is in flight.
      expect(
        await screen.findByRole("status", { name: /loading todos/i }),
      ).toBeVisible();
      await waitFor(() =>
        expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
      );
      await waitFor(() =>
        expect(screen.getByText("Recovered")).toBeVisible(),
      );
    });
  });
});
