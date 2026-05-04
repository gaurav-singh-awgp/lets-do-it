import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default async function globalSetup() {
  try {
    execSync("docker compose up -d", { cwd: root, stdio: "ignore" });
  } catch {
    // Docker may be unavailable; tests still run if Postgres is already up.
  }
}
