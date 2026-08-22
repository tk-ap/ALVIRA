import { NextResponse } from "next/server";
import { sql } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV === "production" && process.env.ALViRA_NEON_HEALTHCHECK !== "1") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: "DATABASE_URL missing" }, { status: 500 });
  try {
    const rows = await sql(process.env.DATABASE_URL)`SELECT current_database() AS database, current_timestamp AS now`;
    return NextResponse.json({ ok: true, database: rows[0]?.database ?? null });
  } catch {
    return NextResponse.json({ ok: false, error: "Neon unavailable" }, { status: 503 });
  }
}
