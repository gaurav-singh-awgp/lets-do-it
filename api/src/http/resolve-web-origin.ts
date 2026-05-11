/**
 * CORS allow-list: one browser origin string (what `@fastify/cors` expects).
 * Comma-separated lists are rejected so misconfiguration fails fast at boot.
 */
export function resolveWebOrigin(env: string | undefined): string {
  const trimmed = (env ?? "").trim();
  const value = trimmed === "" ? "http://127.0.0.1:5173" : trimmed;
  if (value.includes(",")) {
    throw new Error(
      "WEB_ORIGIN must be a single origin (no comma-separated list). Example: http://127.0.0.1:5173",
    );
  }
  return value;
}
