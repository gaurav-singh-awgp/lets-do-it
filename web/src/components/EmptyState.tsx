type Props = {
  headline?: string;
  subline?: string;
};

export function EmptyState({
  headline = "No todos yet",
  subline = "Add your first task above.",
}: Props) {
  return (
    <section
      data-testid="todo-empty"
      className="mt-2 rounded-md border border-border bg-surface px-4 py-6"
      aria-labelledby="todo-empty-heading"
    >
      <h2
        id="todo-empty-heading"
        className="mb-1 text-lg font-medium text-text"
      >
        {headline}
      </h2>
      <p className="m-0 text-text-muted">{subline}</p>
    </section>
  );
}
