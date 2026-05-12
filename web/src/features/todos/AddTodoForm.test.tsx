import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddTodoForm } from "./AddTodoForm";

describe("AddTodoForm", () => {
  it("allows submit while text is empty (client validation blocks POST)", () => {
    render(<AddTodoForm submitting={false} onCreate={vi.fn()} />);
    expect(screen.getByRole("button", { name: /add/i })).toBeEnabled();
  });

  it("submits trimmed text", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<AddTodoForm submitting={false} onCreate={onCreate} />);
    await user.type(
      screen.getByRole("textbox", { name: /new todo/i }),
      "  Buy tea  ",
    );
    await user.click(screen.getByRole("button", { name: /add/i }));
    expect(onCreate).toHaveBeenCalledWith("Buy tea");
    expect(screen.getByRole("textbox", { name: /new todo/i })).toHaveValue("");
  });
});
