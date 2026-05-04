import { migrate } from "drizzle-orm/node-postgres/migrator";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Db } from "./client.js";

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "migrations");

export async function runMigrations(db: Db): Promise<void> {
  await migrate(db, { migrationsFolder });
}
