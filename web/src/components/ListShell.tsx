import type { ReactNode } from "react";

type Props = { children: ReactNode };

export function ListShell({ children }: Props) {
  return (
    <main className="mx-auto min-h-svh max-w-2xl bg-bg px-4 pb-16 pt-8 text-left text-text sm:px-6">
      <h1 className="mb-2 text-4xl font-medium tracking-tight text-text">
        Todos
      </h1>
      <p className="mb-6 text-text-muted">
        Create, complete, and delete tasks.
      </p>
      {children}
    </main>
  );
}
