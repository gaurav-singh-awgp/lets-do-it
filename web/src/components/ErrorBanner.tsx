type Props = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorBanner({
  message,
  onRetry,
  retryLabel = "Retry",
}: Props) {
  return (
    <div
      role="alert"
      className="mb-4 rounded-md border border-destructive/25 bg-error-bg px-4 py-3 text-error-fg"
    >
      <p className="m-0 mb-3">{message}</p>
      {onRetry ? (
        <button
          type="button"
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg ring-offset-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          onClick={onRetry}
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
