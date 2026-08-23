import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to run database migrations.");

const sql = neon(connectionString);
const migrationsUrl = new URL("../migrations/", import.meta.url);
const files = (await readdir(fileURLToPath(migrationsUrl)))
  .filter((name) => /^\\d+.*\\.sql$/.test(name))
  .sort();

for (const file of files) {
  const migration = await readFile(fileURLToPath(new URL(file, migrationsUrl)), "utf8");
  for (const statement of migration.split(";").map((part) => part.trim()).filter(Boolean)) {
    await sql.query(statement);
  }
  console.log(`Applied ${file}`);
}
console.log("Postgres schema is ready.");
