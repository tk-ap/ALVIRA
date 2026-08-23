import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to verify Neon.");

const sql = neon(connectionString);
const expected = ["users", "sessions", "password_reset_tokens", "profiles", "purchases", "interview_drafts", "team_waitlist", "meos_comps", "draft_transfers", "events"];
const tables = await sql.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
) as Array<{ table_name: string }>;
const actual = new Set(tables.map((table) => table.table_name));
const missing = expected.filter((table) => !actual.has(table));
if (missing.length) throw new Error(`Neon schema is incomplete: missing ${missing.join(", ")}`);

await sql.query("SELECT 1 FROM users LIMIT 1");
console.log(`Neon verified: ${expected.length} required tables are available.`);
