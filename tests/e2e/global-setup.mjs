import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default async function globalSetup() {
  // In CI, Postgres is already provided by the Actions services: container.
  // Running Compose would race on port 5432 and fail silently.
  if (process.env.CI) return;

  try {
    const compose = path.join(root, "scripts", "compose.sh");
    execSync("sh", [compose, "up", "-d"], { cwd: root, stdio: "ignore" });
  } catch {
    // Docker may be unavailable; tests still run if Postgres is already up.
  }
}
