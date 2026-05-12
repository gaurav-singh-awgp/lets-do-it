import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TodoRow } from "./TodoRow";

const sample = {
  id: "1",
  text: "Write tests & review",
  done: false,
  createdAt: new Date().toISOString(),
};

describe("TodoRow", () => {
  describe("done styling and a11y", () => {
    it("US-3.2.a: done=true — .todo-text.done class applied and checkbox checked", () => {
      const doneTodo = { ...sample, done: true };
      render(
        <TodoRow todo={doneTodo} onToggle={vi.fn()} onDelete={vi.fn()} />,
      );
      expect(screen.getByRole("checkbox")).toBeChecked();
      expect(screen.getByText(doneTodo.text)).toHaveClass("done");
    });

    it("US-3.2.b: toggle checkbox — onToggle called and aria-checked sync is verified", async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      const { rerender } = render(
        <TodoRow todo={sample} onToggle={onToggle} onDelete={vi.fn()} />,
      );
      const cb = screen.getByRole("checkbox");
      expect(cb).not.toBeChecked();
      await user.click(cb);
      expect(onToggle).toHaveBeenCalledWith(sample.id, true);
      // Controlled input: parent state update drives aria-checked/checked sync.
      rerender(
        <TodoRow
          todo={{ ...sample, done: true }}
          onToggle={onToggle}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.getByRole("checkbox")).toBeChecked();
    });
  });

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

  it("US-2.4.a: delete button accessible name includes todo title", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <TodoRow
        todo={sample}
        onToggle={vi.fn()}
        onDelete={onDelete}
      />,
    );
    await user.click(
      screen.getByRole("button", {
        name: /delete write tests & review/i,
      }),
    );
    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
