import { type FormEvent, useState } from "react";

type Props = {
  onCreate: (text: string) => Promise<void>;
  submitting: boolean;
};

export function AddTodoForm({ onCreate, submitting }: Props) {
  const [text, setText] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    await onCreate(t);
    setText("");
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <label htmlFor="todo-new" className="sr-only">
        New todo
      </label>
      <input
        id="todo-new"
        className="todo-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs doing?"
        maxLength={600}
        autoComplete="off"
      />
      <button type="submit" disabled={submitting || !text.trim()}>
        Add
      </button>
    </form>
  );
}
