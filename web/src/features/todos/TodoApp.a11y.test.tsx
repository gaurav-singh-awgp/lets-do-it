import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureAxe } from "jest-axe";
import { http, HttpResponse } from "msw";
import { describe, it } from "vitest";
import type { Todo } from "../../api/todosClient";
import { server } from "../../test/mswServer";
import { TodoApp } from "./TodoApp";

// Color-contrast rules do not work reliably in jsdom — disable them per jest-axe
// recommendations; this matches the baseline scope for NFR-07 (critical only).
const runAxe = configureAxe({
  rules: { "color-contrast": { enabled: false } },
});

/** Assert zero axe violations with impact === "critical" (NFR-07 baseline gate). */
async function assertNoCriticalViolations(container: HTMLElement): Promise<void> {
  const results = await runAxe(container);
  const violations = (
    results as {
      violations: Array<{
        impact: string | null;
        id: string;
        description: string;
        nodes: { html: string }[];
      }>;
    }
  ).violations;
  const critical = violations.filter((v) => v.impact === "critical");
  if (critical.length > 0) {
    const details = critical
      .map((v) => `  [${v.id}] ${v.description}`)
      .join("\n");
    throw new Error(
      `${critical.length} critical axe violation(s):\n${details}`,
    );
  }
}

function renderWithClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const { container } = render(
    <QueryClientProvider client={client}>
      <TodoApp />
    </QueryClientProvider>,
  );
  return container as HTMLElement;
}

const mockTodos: Todo[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    text: "Buy oat milk",
    done: false,
    createdAt: "2020-01-01T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    text: "Walk the dog",
    done: true,
    createdAt: "2020-01-02T00:00:00.000Z",
  },
];

describe("TodoApp a11y — GET outcome states (NFR-07 baseline)", () => {
  it("US-1.6.a — empty state: zero critical violations", async () => {
    // Default MSW handler returns [] (see mswServer.ts)
    const container = renderWithClient();
    await waitFor(() =>
      screen.getByTestId("todo-empty"),
    );
    await assertNoCriticalViolations(container);
  });

  it("US-1.6.b — populated list: zero critical violations", async () => {
    server.use(
      http.get("*/api/v1/todos", () => HttpResponse.json(mockTodos)),
    );
    const container = renderWithClient();
    await waitFor(() =>
      screen.getByRole("list", { name: /todo list/i }),
    );
    await assertNoCriticalViolations(container);
  });

  it("US-1.6.c — error banner visible: zero critical violations", async () => {
    server.use(
      http.get("*/api/v1/todos", () =>
        HttpResponse.json(
          {
            error: {
              code: "INTERNAL",
              message: "Server unavailable",
              requestId: "test-a11y",
            },
          },
          { status: 500 },
        ),
      ),
    );
    const container = renderWithClient();
    await waitFor(() =>
      screen.getByRole("alert"),
    );
    await assertNoCriticalViolations(container);
  });
});

describe("TodoApp keyboard — IS-1.6.a focus order in populated state", () => {
  it("IS-1.6.a — tab traverses composer → add → row toggle → row delete", async () => {
    server.use(
      http.get("*/api/v1/todos", () => HttpResponse.json(mockTodos)),
    );
    const user = userEvent.setup();
    renderWithClient();

    await waitFor(() =>
      screen.getByRole("list", { name: /todo list/i }),
    );

    // 1. First Tab: lands on the text input (#todo-new in AddTodoForm)
    await user.tab();
    const input = document.getElementById("todo-new");
    expect(document.activeElement).toBe(input);

    // 2. The Add button is disabled when text is empty, so it is excluded from
    //    tab order. Next Tab goes directly to the first row's toggle checkbox.
    await user.tab();
    expect(document.activeElement).toHaveAttribute("type", "checkbox");

    // 3. Next Tab: first row's delete button
    await user.tab();
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/^delete /i),
    );

    // 4. Next Tab: second row's toggle checkbox — confirms no focus trap between rows
    await user.tab();
    expect(document.activeElement).toHaveAttribute("type", "checkbox");
  });
});
