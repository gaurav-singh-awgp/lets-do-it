import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTodo,
  deleteTodo,
  listTodos,
  patchTodo,
} from "../../api/todosClient";
import { AddTodoForm } from "./AddTodoForm";
import { todoKeys } from "./todoKeys";
import { TodoList } from "./TodoList";

function firstErrorMessage(...errs: Array<Error | null | undefined>) {
  for (const e of errs) {
    if (e?.message) return e.message;
  }
  return undefined;
}

export function TodoApp() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: todoKeys.list(), queryFn: listTodos });
  const create = useMutation({
    mutationFn: (text: string) => createTodo(text),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: todoKeys.list() });
    },
  });
  const patch = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      patchTodo(id, done),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: todoKeys.list() });
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: todoKeys.list() });
    },
  });

  const banner = firstErrorMessage(
    q.error,
    create.error,
    patch.error,
    del.error,
  );

  return (
    <div className="todo-app">
      {banner ? (
        <div className="todo-error" role="alert">
          {banner}
        </div>
      ) : null}
      <AddTodoForm
        submitting={create.isPending}
        onCreate={async (text) => {
          await create.mutateAsync(text);
        }}
      />
      <TodoList
        loading={q.isPending}
        todos={q.data ?? []}
        onToggle={(id, done) => patch.mutate({ id, done })}
        onDelete={(id) => del.mutate(id)}
        togglingId={patch.isPending ? patch.variables?.id : undefined}
        deletingId={del.isPending ? del.variables : undefined}
      />
    </div>
  );
}
