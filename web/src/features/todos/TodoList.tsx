import type { Todo } from "../../api/todosClient";
import { TodoRow } from "./TodoRow";

type Props = {
  todos: Todo[];
  loading: boolean;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
  togglingId?: string;
  deletingId?: string;
};

export function TodoList({
  todos,
  loading,
  onToggle,
  onDelete,
  togglingId,
  deletingId,
}: Props) {
  if (loading) {
    return (
      <p className="todo-muted" role="status">
        Loading…
      </p>
    );
  }

  if (todos.length === 0) {
    return (
      <p className="todo-empty" data-testid="todo-empty">
        No todos yet. Add one above.
      </p>
    );
  }

  return (
    <ul className="todo-list" aria-label="Todo list">
      {todos.map((todo) => (
        <li key={todo.id}>
          <TodoRow
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
            busyToggle={togglingId === todo.id}
            busyDelete={deletingId === todo.id}
          />
        </li>
      ))}
    </ul>
  );
}
