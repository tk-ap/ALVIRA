import { createFileRoute } from "@tanstack/react-router";
import { neon } from "@neondatabase/serverless";

/**
 * Readiness probe for orchestration/load balancers and post-deploy smoke tests.
 *
 * Returns 200 only when every critical dependency is available: the database
 * answers `SELECT 1` AND every table the application requires at runtime is
 * present (the same allowed set the deploy gate verifies). Returns 503
 * otherwise. It never exposes connection strings, table contents, stack
 * traces, or any other internal detail.
 */
const REQUIRED_TABLES = [
  // core auth / sessions / profiles / entitlements
  "users",
  "sessions",
  "password_reset_tokens",
  "profiles",
  "purchases",
  "interview_drafts",
  "draft_transfers",
  "team_waitlist",
  "events",
  // Bridge
  "bridge_authorization_codes",
  "bridge_access_tokens",
  // founding beta / feedback
  "founding_beta_access",
  "beta_feedback",
  // context versioning
  "context_versions",
];

export const Route = createFileRoute("/api/health/ready")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const connectionString = process.env.DATABASE_URL;
          if (!connectionString) {
            return Response.json({ status: "not_ready" }, { status: 503 });
          }
          const sql = neon(connectionString);

          await sql.query("SELECT 1");

          const tables = (await sql.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
          )) as Array<{ table_name: string }>;
          const actual = new Set(tables.map((table) => table.table_name));
          const missing = REQUIRED_TABLES.filter((table) => !actual.has(table));
          if (missing.length) {
            return Response.json({ status: "not_ready", missing }, { status: 503 });
          }

          return Response.json({ status: "ready" }, { status: 200 });
        } catch {
          // Any database unavailability, connection failure, or query error
          // means "not ready"; no internals are leaked to the caller.
          return Response.json({ status: "not_ready" }, { status: 503 });
        }
      },
    },
  },
});
