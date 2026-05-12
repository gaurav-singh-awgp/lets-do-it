import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Todo } from "../../api/todosClient";
import { server } from "../../test/mswServer";
import { todoKeys } from "./todoKeys";
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

    it("US-2.2.a empty or whitespace submit shows validation and does not POST", async () => {
      const user = userEvent.setup();
      let postCount = 0;
      server.use(
        http.get("*/api/v1/todos", () => HttpResponse.json([])),
        http.post("*/api/v1/todos", () => {
          postCount++;
          return HttpResponse.json(
            { error: { message: "unexpected", code: "INTERNAL" } },
            { status: 500 },
          );
        }),
      );
      renderWithClient();
      await waitFor(() =>
        expect(screen.getByTestId("todo-empty")).toBeVisible(),
      );
      const input = screen.getByRole("textbox", { name: /new todo/i });
      await user.click(input);
      const form = input.closest("form");
      expect(form).toBeTruthy();
      fireEvent.submit(form!);
      expect(
        await screen.findByText(/Enter a short description/i),
      ).toBeVisible();
      expect(postCount).toBe(0);

      await user.type(input, "   ");
      fireEvent.submit(form!);
      expect(postCount).toBe(0);
    });

    it("US-2.2.a rejects over 500 Unicode code points without POST", async () => {
      const user = userEvent.setup();
      let postCount = 0;
      server.use(
        http.get("*/api/v1/todos", () => HttpResponse.json([])),
        http.post("*/api/v1/todos", () => {
          postCount++;
          return HttpResponse.json({}, { status: 201 });
        }),
      );
      renderWithClient();
      await waitFor(() =>
        expect(screen.getByTestId("todo-empty")).toBeVisible(),
      );
      const input = screen.getByRole("textbox", { name: /new todo/i });
      await user.click(input);
      const tooLongUnicode = "🙂".repeat(501);
      expect([...tooLongUnicode]).toHaveLength(501);
      expect(tooLongUnicode.length).toBeGreaterThan(501);
      await user.paste(tooLongUnicode);
      await user.click(screen.getByRole("button", { name: /^add$/i }));
      expect(
        await screen.findByText(/Keep todo text at or below 500/i),
      ).toBeVisible();
      expect(postCount).toBe(0);
    });

    it("US-2.2.b POST 201 clears composer and invalidates list query", async () => {
      const user = userEvent.setup();
      const client = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      const invalidateSpy = vi.spyOn(client, "invalidateQueries");
      render(
        <QueryClientProvider client={client}>
          <TodoApp />
        </QueryClientProvider>,
      );
      let list: Todo[] = [];
      server.use(
        http.get("*/api/v1/todos", () => HttpResponse.json(list)),
        http.post("*/api/v1/todos", async ({ request }) => {
          const body = (await request.json()) as { text?: string };
          const created: Todo = {
            id: "00000000-0000-4000-8000-000000000099",
            text: String(body.text ?? ""),
            done: false,
            createdAt: new Date().toISOString(),
          };
          list = [created];
          return HttpResponse.json(created, { status: 201 });
        }),
      );
      await waitFor(() =>
        expect(screen.getByTestId("todo-empty")).toBeVisible(),
      );
      await user.type(screen.getByRole("textbox", { name: /new todo/i }), "Hello");
      await user.click(screen.getByRole("button", { name: /^add$/i }));
      await waitFor(() =>
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: todoKeys.list(),
        }),
      );
      await waitFor(() =>
        expect(screen.getByRole("textbox", { name: /new todo/i })).toHaveValue(""),
      );
      await waitFor(() => expect(screen.getByText("Hello")).toBeVisible());
    });

    it("IS-2.2.a POST failure shows Retry on create error and succeeds on retry", async () => {
      const user = userEvent.setup();
      let postAttempts = 0;
      let list: Todo[] = [];
      server.use(
        http.get("*/api/v1/todos", () => HttpResponse.json(list)),
        http.post("*/api/v1/todos", async ({ request }) => {
          postAttempts++;
          if (postAttempts === 1) {
            return HttpResponse.json(
              {
                error: {
                  message: "Save failed",
                  code: "INTERNAL",
                },
              },
              { status: 500 },
            );
          }
          const body = (await request.json()) as { text?: string };
          const created: Todo = {
            id: "00000000-0000-4000-8000-000000000088",
            text: String(body.text ?? ""),
            done: false,
            createdAt: new Date().toISOString(),
          };
          list = [created];
          return HttpResponse.json(created, { status: 201 });
        }),
      );
      renderWithClient();
      await waitFor(() =>
        expect(screen.getByTestId("todo-empty")).toBeVisible(),
      );
      await user.type(screen.getByRole("textbox", { name: /new todo/i }), "Fix");
      await user.click(screen.getByRole("button", { name: /^add$/i }));
      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("Save failed");
      await user.click(
        within(alert).getByRole("button", { name: /^retry$/i }),
      );
      await waitFor(() => expect(screen.getByText("Fix")).toBeVisible());
      expect(postAttempts).toBe(2);
    });

    it("US-2.4.b: DELETE failure — row visible + patchDelBanner error surfaced", async () => {
      const user = userEvent.setup();
      const todo: Todo = {
        id: "00000000-0000-4000-8000-000000000042",
        text: "Buy eggs",
        done: false,
        createdAt: "2024-01-01T00:00:00.000Z",
      };
      server.use(
        http.get("*/api/v1/todos", () => HttpResponse.json([todo])),
        http.delete("*/api/v1/todos/*", async () => {
          await delay(40);
          return HttpResponse.json(
            {
              error: {
                code: "NOT_FOUND",
                message: "Todo not found",
                requestId: "r1",
              },
            },
            { status: 404 },
          );
        }),
      );

      renderWithClient();
      await waitFor(() => expect(screen.getByText("Buy eggs")).toBeVisible());
      const deleteButton = screen.getByRole("button", { name: "Delete Buy eggs" });
      await user.click(deleteButton);

      await waitFor(() => expect(deleteButton).toBeDisabled());

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Todo not found",
      );
      expect(screen.getByText("Buy eggs")).toBeVisible();
    });

    it("IS-2.4.a: DELETE last item → empty state restores", async () => {
      const user = userEvent.setup();
      const todo: Todo = {
        id: "00000000-0000-4000-8000-000000000043",
        text: "Only todo",
        done: false,
        createdAt: "2024-01-02T00:00:00.000Z",
      };
      let deleteDone = false;
      server.use(
        http.get("*/api/v1/todos", () =>
          HttpResponse.json(deleteDone ? [] : [todo]),
        ),
        http.delete("*/api/v1/todos/*", () => {
          deleteDone = true;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      renderWithClient();
      await waitFor(() => expect(screen.getByText("Only todo")).toBeVisible());
      await user.click(screen.getByRole("button", { name: "Delete Only todo" }));

      await waitFor(() =>
        expect(screen.getByTestId("todo-empty")).toBeVisible(),
      );
      expect(screen.queryByText("Only todo")).not.toBeInTheDocument();
    });
  });
});
