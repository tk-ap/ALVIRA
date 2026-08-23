// ── Postgres storage backend ──
// Server-only. Used when DATABASE_URL is set (Neon on Vercel). Presents the same
// query/run/exec surface as the SQLite backend in src/db.ts, so every existing
// helper and route keeps working unchanged. The SQL that callers emit is
// SQLite-flavored (see src/db.ts + route files); we translate the small, finite
// set of SQLite idioms to Postgres on the way through.
//
// Uses the `pg` TCP driver: works against any Postgres (Neon included) and is
// testable against a local Postgres. (The @neondatabase/serverless WebSocket
// driver is Neon-only and cannot reach a plain Postgres, so we don't use it.)
import { Pool } from "pg";

function buildPoolConfig(connectionString: string): { connectionString: string; ssl?: boolean | { rejectUnauthorized?: boolean } } {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return { connectionString };
  }
  // If the URL explicitly sets sslmode, let pg honor it from the URL.
  if (url.searchParams.get("sslmode")) {
    return { connectionString };
  }
  // Local/dev Postgres typically doesn't need TLS; everything else does.
  const local = ["127.0.0.1", "localhost", "::1", "0.0.0.0"].includes(url.hostname);
  return { connectionString, ssl: local ? undefined : { rejectUnauthorized: false } };
}

// ── SQLite -> Postgres translation ──
// Only the idioms actually used across src/db.ts and the server routes are
// translated. Everything else (CREATE TABLE, SELECT, etc.) is already
// Postgres-compatible with TEXT/INTEGER column types.
export function translateSqliteToPostgres(sql: string): string {
  let s = sql;

  const wasIgnore = /INSERT\s+OR\s+IGNORE\s+INTO/i.test(s);
  const wasReplace = /INSERT\s+OR\s+REPLACE\s+INTO\s+interview_drafts/i.test(s);

  // PRAGMA pragmas are SQLite-only; drop them for Postgres.
  s = s.replace(/PRAGMA[^;]*;/gi, " ");

  // INSERT OR IGNORE/REPLACE are not Postgres syntax.
  s = s.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, "INSERT INTO");
  s = s.replace(/INSERT\s+OR\s+REPLACE\s+INTO/gi, "INSERT INTO");

  // datetime('now') is not Postgres; map the idioms we actually emit.
  //  - datetime('now', ?)  -> now() + CAST(? AS interval)   (param like '-180 days')
  //  - datetime('now','+30 days') / ('-7 days') ...          -> now() + interval '...'
  //  - datetime('now')                                       -> now()
  s = s.replace(/datetime\(\s*'now'\s*,\s*\?\s*\)/gi, "now() + CAST(? AS interval)");
  s = s.replace(
    /datetime\(\s*'now'\s*,\s*'([+-]?\d+\s+(?:days?|minutes?|hours?|seconds?))'\s*\)/gi,
    "now() + interval '$1'",
  );
  s = s.replace(/datetime\(\s*'now'\s*\)/gi, "now()");

  // Temporal columns must be TIMESTAMPTZ in Postgres so `col < now()` comparisons
  // and `DEFAULT now()` / `now() + interval` inserts type-check. In the original
  // SQLite schema these are TEXT (datetime / ISO strings); the phrase
  // "<name> TEXT" only appears in DDL column definitions, never in query clauses.
  s = s.replace(/\bcreated_at\s+TEXT\b/gi, "created_at TIMESTAMPTZ");
  s = s.replace(/\bupdated_at\s+TEXT\b/gi, "updated_at TIMESTAMPTZ");
  s = s.replace(/\bexpires_at\s+TEXT\b/gi, "expires_at TIMESTAMPTZ");

  // Rewrite ? positional placeholders to $1..$N, skipping ? inside string
  // literals so quoted text is preserved. (No emitted SQL uses ? in a literal,
  // but guarding keeps it safe.)
  let n = 0;
  s = s.replace(/\?/g, () => {
    n += 1;
    return `$${n}`;
  });

  // Restore upsert semantics at the end of the statement.
  if (wasReplace) {
    s +=
      " ON CONFLICT (user_id, offering) DO UPDATE SET topic=EXCLUDED.topic, state_json=EXCLUDED.state_json, updated_at=EXCLUDED.updated_at";
  } else if (wasIgnore) {
    s += " ON CONFLICT DO NOTHING";
  }

  return s;
}

export type PostgresQueryHandle = {
  get: (...args: unknown[]) => Promise<unknown>;
  all: (...args: unknown[]) => Promise<unknown[]>;
};

export type PostgresDbLike = {
  exec: (sql: string) => Promise<void>;
  run: (sql: string, params?: unknown[]) => Promise<unknown>;
  query: (sql: string) => PostgresQueryHandle;
};

export function createPostgresDb(connectionString: string, schemaStatements: string[]): PostgresDbLike {
  const pool = new Pool(buildPoolConfig(connectionString));

  // Lazy, idempotent schema+seed init. Memoized so it only runs once per cold start.
  let initPromise: Promise<void> | null = null;
  function ensureInitialized(): Promise<void> {
    if (!initPromise) {
      initPromise = (async () => {
        for (const stmt of schemaStatements) {
          const translated = translateSqliteToPostgres(stmt);
          if (!translated.trim()) continue;
          // ALTER TABLE ADD COLUMN is non-idempotent (fails if column exists).
          // Those are wrapped below; tolerate a "duplicate column" error which is
          // exactly the "already migrated" case.
          await execTranslated(translated, true);
        }
      })().catch(async (err) => {
        initPromise = null; // allow retry on next call
        throw err;
      });
    }
    return initPromise;
  }

  async function execTranslated(translated: string, ignoreColumnExistsErrors: boolean): Promise<void> {
    // Postgres extended protocol accepts only one statement per query, so split
    // the multi-statement CREATE TABLE block on ';'.
    const statements = translated
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (err) {
        if (ignoreColumnExistsErrors && /duplicate column|already exists/i.test(String((err as Error).message))) {
          continue;
        }
        throw err;
      }
    }
  }

  return {
    async exec(sql: string): Promise<void> {
      await ensureInitialized();
      await execTranslated(translateSqliteToPostgres(sql), true);
    },
    async run(sql: string, params: unknown[] = []): Promise<unknown> {
      await ensureInitialized();
      const translated = translateSqliteToPostgres(sql);
      const res = await pool.query(translated, params as unknown[]);
      return res;
    },
    query(sql: string): PostgresQueryHandle {
      const translated = translateSqliteToPostgres(sql);
      return {
        get: async (...args: unknown[]) => {
          await ensureInitialized();
          const res = await pool.query(translated, args as unknown[]);
          return res.rows[0];
        },
        all: async (...args: unknown[]) => {
          await ensureInitialized();
          const res = await pool.query(translated, args as unknown[]);
          return res.rows;
        },
      };
    },
  };
}
