// ── One-time migration: SQLite -> Postgres (seed/migrate) ──
// Copies every row from an existing SQLite ALVIRA database into the Postgres
// backend (Neon on Vercel), so existing accounts (including the owner) keep
// working after the app switches to DATABASE_URL-backed persistence.
//
// Why: before this change the app was 100% SQLite and on Vercel that file lived
// in /tmp (ephemeral). The owner's real account data lives in the local SQLite
// .data/alvira.db (and weekly backups under /home/team/shared/backups/). Run this
// ONCE against the real Neon DATABASE_URL to recover that data.
//
// Usage:
//   DATABASE_URL="postgres://..." bun scripts/seed-postgres.ts [source.db]
//
//   source.db defaults to .data/alvira.db (the freshest local DB, WAL included).
//   Idempotent: uses INSERT ... ON CONFLICT DO NOTHING, so it is safe to re-run.
import { Database } from "bun:sqlite";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL?.trim();
if (!DATABASE_URL) {
  console.error("[seed] DATABASE_URL is required (set it to the Neon connection string).");
  process.exit(1);
}
const source = process.argv[2] ?? join(process.cwd(), ".data", "alvira.db");
if (!existsSync(source)) {
  console.error(`[seed] source SQLite DB not found: ${source}`);
  process.exit(1);
}

// Tables in the app schema. Columns named *_at are TIMESTAMPTZ in Postgres.
const TEMPORAL_COLS = new Set(["created_at", "updated_at", "expires_at"]);

function normalizeTemporal(v: unknown): unknown {
  if (typeof v !== "string" || !v) return v;
  // SQLite stores datetime('now') as "YYYY-MM-DD HH:MM:SS" (UTC, no zone).
  // Postgres TIMESTAMPTZ needs an explicit zone, so treat no-zone values as UTC.
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v)) {
    return v.replace(" ", "T") + "Z";
  }
  return v;
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function main() {
  // Ensure the Postgres schema exists (creates tables + idempotent seeds via the
  // app's own migration path). Errors here are reported but not fatal — the app
  // will also create the schema lazily on first request at deploy time.
  try {
    const { getOwnerMetrics } = await import("../src/db");
    await getOwnerMetrics();
  } catch (err) {
    console.warn("[seed] schema init warning (app will also init lazily):", String((err as Error).message));
  }

  const sqlite = new Database(source, { readonly: true });
  const tables = (sqlite.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as Array<{ name: string }>).map((r) => r.name);

  const report: string[] = [];
  for (const table of tables) {
    const rows = sqlite.query(`SELECT * FROM "${table}"`).all() as Array<Record<string, unknown>>;
    if (rows.length === 0) {
      report.push(`  ${table}: 0 rows`);
      continue;
    }
    const cols = Object.keys(rows[0]);
    const colList = cols.map((c) => `"${c}"`).join(", ");

    for (const row of rows) {
      const values = cols.map((c) => (TEMPORAL_COLS.has(c) ? normalizeTemporal(row[c]) : row[c]));
      const placeholders = cols.map((_, i) => "$" + (i + 1)).join(", ");
      // Target-less ON CONFLICT DO NOTHING aborts on ANY constraint violation,
      // which is exactly what an idempotent one-time seed wants (e.g. the app's
      // migration already inserted a meos_comps row with the same email).
      const sql = `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
      try {
        await pool.query(sql, values);
      } catch (err) {
        console.error(`[seed] FAILED ${table}: ${String((err as Error).message)}`);
        console.error(`  sql: ${sql}\n  values: ${JSON.stringify(values)}`);
        throw err;
      }
    }
    report.push(`  ${table}: ${rows.length} rows`);
  }
  sqlite.close();
  console.log("[seed] done.\n" + report.join("\n"));
  await pool.end();
}

main().catch(async (err) => {
  console.error("[seed] failed:", err);
  await pool.end().catch(() => {});
  process.exit(1);
});
