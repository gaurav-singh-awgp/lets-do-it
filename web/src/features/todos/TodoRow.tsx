import type { Todo } from "../../api/todosClient";

type Props = {
  todo: Todo;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
  busyToggle?: boolean;
  busyDelete?: boolean;
};

export function TodoRow({
  todo,
  onToggle,
  onDelete,
  busyToggle,
  busyDelete,
}: Props) {
  return (
    <div
      className="todo-row"
      aria-busy={busyToggle || busyDelete ? true : undefined}
    >
      <label className="todo-label">
        <input
          type="checkbox"
          checked={todo.done}
          disabled={busyToggle}
          onChange={(e) => onToggle(todo.id, e.target.checked)}
          aria-label={`Toggle done for ${todo.text}`}
        />
        <span className={todo.done ? "todo-text done" : "todo-text"}>
          {todo.text}
        </span>
      </label>
      <button
        type="button"
        className="todo-delete"
        disabled={busyDelete}
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete ${todo.text}`}
      >
        Delete
      </button>
    </div>
  );
}
