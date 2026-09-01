import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { Pool } from "@neondatabase/serverless";

/**
 * Idempotent, version-tracked database migrations.
 *
 * Migration contract:
 * - A `schema_migrations` table records each migration version (the filename
 *   without `.sql`) the moment it has been applied successfully.
 * - Only migrations whose version is NOT already recorded are run, in filename
 *   (i.e. numeric prefix) order. Re-running against an up-to-date schema is a
 *   no-op.
 * - Each migration runs inside a single transaction: all of its statements
 *   succeed or none of them are committed, and the version row is inserted in
 *   the same transaction as the DDL so a failed migration never leaves a
 *   "half applied but recorded" state.
 *
 * Existing `migrations/*.sql` files are left unchanged. They use `IF NOT
 * EXISTS` / `ON CONFLICT ... DO NOTHING` guards so replaying SQL after the
 * table already exists is harmless; the version table is what stops us from
 * blindly re-running them on every deploy.
 */

/**
 * Split a SQL script into individual statements on `;`, while ignoring
 * semicolons that appear inside comments (`-- …`, `/* … *\/`), single-quoted
 * strings (`'…'` with `''` escapes), double-quoted identifiers, or dollar-quoted
 * bodies (`$$…$$` / `$tag$…$tag$`). A naive `script.split(";")` breaks on a
 * `;` inside a comment (e.g. `-- Existing accounts only; future signups…`),
 * which produced a bogus statement and a `syntax error at or near "future"`.
 */
function splitSqlStatements(script: string): string[] {
  const statements: string[] = [];
  let current = "";
  let i = 0;
  const n = script.length;

  while (i < n) {
    const ch = script[i];
    const next = script[i + 1];

    // Line comment: skip to end of line.
    if (ch === "-" && next === "-") {
      while (i < n && script[i] !== "\n") i++;
      continue;
    }

    // Block comment: skip to closing `*/`.
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < n && !(script[i] === "*" && script[i + 1] === "/")) i++;
      i += 2;
      continue;
    }

    // Dollar-quoted string: skip to the matching closing tag.
    if (ch === "$") {
      const tagMatch = script.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
      if (tagMatch) {
        const tag = tagMatch[0];
        const closeIdx = script.indexOf(tag, i + tag.length);
        if (closeIdx !== -1) {
          i = closeIdx + tag.length;
          continue;
        }
        // Malformed/unterminated dollar quote: treat the rest as literal.
        i = n;
        continue;
      }
    }

    // Single-quoted string: skip to closing quote (handling `''`).
    if (ch === "'") {
      i += 1;
      while (i < n) {
        if (script[i] === "'" && script[i + 1] === "'") {
          i += 2;
          continue;
        }
        if (script[i] === "'") {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    // Double-quoted identifier: skip to closing quote.
    if (ch === '"') {
      i += 1;
      while (i < n && script[i] !== '"') i++;
      i += 1;
      continue;
    }

    if (ch === ";") {
      statements.push(current);
      current = "";
      i += 1;
      continue;
    }

    current += ch;
    i += 1;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements.map((s) => s.trim()).filter(Boolean);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to run database migrations.");

const pool = new Pool({ connectionString });
const migrationsDir = fileURLToPath(new URL("../migrations/", import.meta.url));
const files = (await readdir(migrationsDir))
  .filter((name) => /^\d+.*\.sql$/.test(name))
  .sort();

const client = await pool.connect();
let appliedCount = 0;
try {
  // Ensure the version table exists (idempotent); safe on a fresh DB where no
  // app tables exist yet.
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);

  const recordedResult = await client.query("SELECT version FROM schema_migrations");
  const recorded = new Set<string>(recordedResult.rows.map((row) => row.version));

  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    if (recorded.has(version)) {
      console.log(`Skipping ${file} (already applied)`);
      continue;
    }

    const migration = await readFile(join(migrationsDir, file), "utf8");
    const statements = splitSqlStatements(migration);

    await client.query("BEGIN");
    try {
      for (const statement of statements) {
        await client.query(statement);
      }
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [version]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    console.log(`Applied ${file}`);
    appliedCount++;
  }
} finally {
  client.release();
  await pool.end();
}

console.log(
  appliedCount
    ? `Applied ${appliedCount} migration${appliedCount === 1 ? "" : "s"}.`
    : "Schema is up to date — no migrations to apply.",
);
console.log("Postgres schema is ready.");
