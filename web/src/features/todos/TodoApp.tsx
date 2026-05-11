import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiEnvelopeError,
  createTodo,
  deleteTodo,
  listTodos,
  patchTodo,
} from "../../api/todosClient";
import { ErrorBanner } from "../../components/ErrorBanner";
import { AddTodoForm } from "./AddTodoForm";
import { todoKeys } from "./todoKeys";
import { TodoList } from "./TodoList";

function mutationErrorMessage(...errs: Array<Error | null | undefined>) {
  for (const e of errs) {
    if (e?.message) return e.message;
  }
  return undefined;
}

const GENERIC_LOAD_FAILURE = "We couldn't load your todos.";

function loadErrorDisplayMessage(error: Error | null | undefined): string {
  // AC4(b): show API-authored message verbatim, otherwise friendly fallback.
  // Plain `Error.message` may carry synthesized statusText / "Request failed"
  // from buildResponseError or a network-layer TypeError — none of those are
  // user-facing copy, so we substitute the generic line.
  if (error instanceof ApiEnvelopeError) {
    const m = error.message.trim();
    if (m.length > 0) return m;
  }
  return GENERIC_LOAD_FAILURE;
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

  const mutationBanner = mutationErrorMessage(
    create.error,
    patch.error,
    del.error,
  );

  const listLoading = q.isPending || (q.isError && q.isFetching);

  return (
    <div className="todo-app">
      {q.isError ? (
        <ErrorBanner
          message={loadErrorDisplayMessage(q.error)}
          onRetry={() => {
            void q.refetch();
          }}
        />
      ) : null}
      {mutationBanner ? (
        <div className="todo-error" role="alert">
          {mutationBanner}
        </div>
      ) : null}
      <AddTodoForm
        submitting={create.isPending}
        onCreate={async (text) => {
          await create.mutateAsync(text);
        }}
      />
      <TodoList
        loading={listLoading}
        todos={q.data ?? []}
        suppressContent={q.isError}
        onToggle={(id, done) => patch.mutate({ id, done })}
        onDelete={(id) => del.mutate(id)}
        togglingId={patch.isPending ? patch.variables?.id : undefined}
        deletingId={del.isPending ? del.variables : undefined}
      />
    </div>
  );
}
