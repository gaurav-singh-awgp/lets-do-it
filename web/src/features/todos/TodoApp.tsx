import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import {
  ApiEnvelopeError,
  LIST_TODOS_FAILED_MESSAGE,
  UnexpectedTodoResponseError,
  createTodo,
  deleteTodo,
  listTodos,
  patchTodo,
} from "../../api/todosClient";
import { ErrorBanner } from "../../components/ErrorBanner";
import { AddTodoForm } from "./AddTodoForm";
import { todoKeys } from "./todoKeys";
import { TodoList } from "./TodoList";

function patchDelErrorMessage(
  patchErr: Error | null | undefined,
  delErr: Error | null | undefined,
): string | undefined {
  for (const e of [patchErr, delErr]) {
    if (e instanceof ApiEnvelopeError) {
      const m = e.message.trim();
      if (m.length > 0) return m;
    }
    if (e?.message) return e.message;
  }
  return undefined;
}

function loadErrorDisplayMessage(error: Error | null | undefined): string {
  if (error instanceof ApiEnvelopeError) {
    const m = error.message.trim();
    if (m.length > 0) return m;
  }
  return LIST_TODOS_FAILED_MESSAGE;
}

const GENERIC_CREATE_FAILURE = "We couldn't add that todo.";

function createErrorDisplayMessage(error: Error | null | undefined): string {
  if (error instanceof ApiEnvelopeError) {
    const m = error.message.trim();
    if (m.length > 0) return m;
  }
  if (error instanceof UnexpectedTodoResponseError) {
    const m = error.message.trim();
    if (m.length > 0) return m;
  }
  return GENERIC_CREATE_FAILURE;
}

export function TodoApp() {
  const qc = useQueryClient();
  const retryLockRef = useRef(false);
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

  const createError =
    create.isError && create.error
      ? createErrorDisplayMessage(create.error)
      : null;

  const patchDelBanner = patchDelErrorMessage(patch.error, del.error);

  const listLoading = q.isPending || (q.isError && q.isFetching);

  const lastCreateText = create.variables;

  return (
    <div className="todo-app">
      {q.isError ? (
        <ErrorBanner
          key={`list-fetch-${q.failureCount}-${q.errorUpdatedAt}`}
          message={loadErrorDisplayMessage(q.error)}
          onRetry={() => {
            void q.refetch();
          }}
        />
      ) : null}
      {createError ? (
        <div className="todo-error todo-error-row" role="alert">
          <span>{createError}</span>
          <button
            type="button"
            className="todo-retry-button"
            disabled={create.isPending || lastCreateText === undefined}
            onClick={() => {
              if (
                retryLockRef.current ||
                create.isPending ||
                lastCreateText === undefined
              ) {
                return;
              }
              retryLockRef.current = true;
              void create
                .mutateAsync(lastCreateText)
                .finally(() => {
                  retryLockRef.current = false;
                });
            }}
          >
            Retry
          </button>
        </div>
      ) : null}
      {patchDelBanner ? (
        <div className="todo-error" role="alert">
          {patchDelBanner}
        </div>
      ) : null}
      <div className="todo-composer-sticky">
        <AddTodoForm
          submitting={create.isPending}
          onCreate={async (text) => {
            await create.mutateAsync(text);
          }}
        />
      </div>
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
