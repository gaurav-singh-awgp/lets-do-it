import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TodoRow } from "./TodoRow";

const sample = {
  id: "1",
  text: "Write tests",
  done: false,
  createdAt: new Date().toISOString(),
};

describe("TodoRow", () => {
  it("calls onToggle when checkbox changes", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <TodoRow
        todo={sample}
        onToggle={onToggle}
        onDelete={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith("1", true);
  });

  it("calls onDelete when delete is pressed", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <TodoRow
        todo={sample}
        onToggle={vi.fn()}
        onDelete={onDelete}
      />,
    );
    await user.click(screen.getByRole("button", { name: /delete write tests/i }));
    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
