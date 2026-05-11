import type { Todo } from "../../api/todosClient";
import { EmptyState } from "../../components/EmptyState";
import { TodoRow } from "./TodoRow";

type Props = {
  todos: Todo[];
  loading: boolean;
  /**
   * When true, suppresses both the populated list and the EmptyState (e.g. while
   * the parent owns an error UI that "replaces the list region" per AC4).
   * The loading skeleton always wins regardless.
   */
  suppressContent?: boolean;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
  togglingId?: string;
  deletingId?: string;
};

export function TodoList({
  todos,
  loading,
  suppressContent,
  onToggle,
  onDelete,
  togglingId,
  deletingId,
}: Props) {
  if (loading) {
    return (
      <div
        className="mt-2 space-y-2"
        role="status"
        aria-label="Loading todos"
      >
        <span className="sr-only">Loading todos…</span>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="motion-safe:animate-pulse h-10 rounded-md bg-surface"
            aria-hidden
          />
        ))}
      </div>
    );
  }

  if (suppressContent) return null;

  if (todos.length === 0) {
    return <EmptyState />;
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
