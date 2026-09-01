import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to verify Neon.");

const sql = neon(connectionString);
// Every table the application requires at runtime. This is the deploy gate's
// definition of a "matching schema": if any of these is absent the app would
// fail in production, so verification must fail here rather than green-light a
// broken deploy. Bridge tables are included (a missing
// `bridge_authorization_codes` table is exactly what caused the live 500s).
const expected = [
  // core auth / sessions / profiles / entitlements
  "users",
  "sessions",
  "password_reset_tokens",
  "profiles",
  "purchases",
  "interview_drafts",
  "draft_transfers",
  "meos_comps",
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
const tables = await sql.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
) as Array<{ table_name: string }>;
const actual = new Set(tables.map((table) => table.table_name));
const missing = expected.filter((table) => !actual.has(table));
if (missing.length) throw new Error(`Neon schema is incomplete: missing ${missing.join(", ")}`);

await sql.query("SELECT 1 FROM users LIMIT 1");
console.log(`Neon verified: ${expected.length} required tables are available.`);
