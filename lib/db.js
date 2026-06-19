import pg from "pg";
import { getConfig } from "./config.js";

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    const config = getConfig();
    if (!config.databaseUrl) throw new Error("DATABASE_URL nao configurado.");
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseUrl.includes("sslmode=require") ? undefined : { rejectUnauthorized: false },
    });
  }
  return pool;
}

export function query(text, params = []) {
  return getPool().query(text, params);
}

export async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
