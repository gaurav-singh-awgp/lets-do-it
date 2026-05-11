#!/usr/bin/env node
/**
 * US-1.5.a — assert root README keeps NFR-06 section headings.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const md = fs.readFileSync(path.join(root, "README.md"), "utf8");
const required = ["## Run", "## Test", "## API contract"];
const missing = required.filter((h) => !new RegExp(`^${h}$`, "m").test(md));
if (missing.length > 0) {
  console.error("README.md missing required headings:", missing.join(", "));
  process.exit(1);
}
console.log("README section headings OK (Run, Test, API contract).");
