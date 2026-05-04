/**
 * Resolves PostgreSQL URL from override or `DATABASE_URL`.
 * Whitespace-only values are treated as unset so callers fail fast with a clear error.
 */
export function resolveDatabaseUrl(override?: string): string | undefined {
  const raw = override !== undefined ? override : process.env.DATABASE_URL;
  if (raw === undefined || raw === null) return undefined;
  const trimmed = String(raw).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
