import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to run database migrations.");

const migrationUrl = new URL("../migrations/001_postgres.sql", import.meta.url);
const migration = await readFile(fileURLToPath(migrationUrl), "utf8");
const sql = neon(connectionString);
for (const statement of migration.split(";").map((part) => part.trim()).filter(Boolean)) {
  await sql.query(statement);
}
console.log("Postgres schema is ready.");
