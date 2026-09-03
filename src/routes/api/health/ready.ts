import { createFileRoute } from "@tanstack/react-router";
import { neon } from "@neondatabase/serverless";

/**
 * Readiness probe for orchestration/load balancers and post-deploy smoke tests.
 * Returns 200 only when the database answers and every critical runtime table
 * is present. No connection strings, table contents, or stack traces leak.
 */
const REQUIRED_TABLES = [
  "users",
  "sessions",
  "password_reset_tokens",
  "profiles",
  "purchases",
  "interview_drafts",
  "draft_transfers",
  "team_waitlist",
  "events",
  "bridge_authorization_codes",
  "bridge_access_tokens",
  "founding_beta_access",
  "beta_feedback",
  "context_versions",
  "stripe_events",
  "stripe_subscriptions",
];

export const Route = createFileRoute("/api/health/ready")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const connectionString = process.env.DATABASE_URL;
          if (!connectionString) return Response.json({ status: "not_ready" }, { status: 503 });
          const sql = neon(connectionString);
          await sql.query("SELECT 1");
          const tables = (await sql.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
          )) as Array<{ table_name: string }>;
          const actual = new Set(tables.map((table) => table.table_name));
          const missing = REQUIRED_TABLES.filter((table) => !actual.has(table));
          if (missing.length) return Response.json({ status: "not_ready", missing }, { status: 503 });
          return Response.json({ status: "ready" }, { status: 200 });
        } catch {
          return Response.json({ status: "not_ready" }, { status: 503 });
        }
      },
    },
  },
});
