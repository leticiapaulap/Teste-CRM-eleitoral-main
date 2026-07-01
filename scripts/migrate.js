import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPool } from "../lib/db.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(rootDir, "db", "migrations");

const files = (await readdir(migrationsDir))
  .filter((file) => file.endsWith(".sql"))
  .sort((a, b) => a.localeCompare(b));

if (!files.length) {
  console.log("Nenhuma migration encontrada.");
  process.exit(0);
}

const pool = getPool();

try {
  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    console.log(`Aplicando ${file}...`);
    await pool.query(sql);
  }
  console.log("Migrations aplicadas.");
} finally {
  await pool.end();
}
