import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TodoList } from "./TodoList";

describe("TodoList", () => {
  it("shows empty state", () => {
    render(
      <TodoList
        loading={false}
        todos={[]}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByTestId("todo-empty")).toBeVisible();
  });

  it("shows loading", () => {
    render(
      <TodoList
        loading
        todos={[]}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("status", { name: /loading todos/i }),
    ).toBeVisible();
  });
});
