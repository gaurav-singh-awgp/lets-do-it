import "dotenv/config";
import { createDb, createPool } from "./client.js";
import { resolveDatabaseUrl } from "./resolve-database-url.js";
import { runMigrations } from "./run-migrations.js";

const databaseUrl = resolveDatabaseUrl();
if (!databaseUrl) {
  console.error("DATABASE_URL is required (see api/.env.example)");
  process.exit(1);
}

const pool = createPool(databaseUrl);
const db = createDb(pool);
try {
  await runMigrations(db);
  console.log("Migrations applied.");
} finally {
  await pool.end();
}
