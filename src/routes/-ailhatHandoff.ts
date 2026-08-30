import { createHash, randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { getDb } from "~/db";

const SESSION_COOKIE = "alvira_session";
const AILHAT_URL = process.env.AILHAT_PUBLIC_URL?.trim() || "https://ailhat.vercel.app";

export type AilhatHandoffProfile = { id: string; topic: string; offering: string; updated_at: string };
export type AilhatHandoffOpportunity = {
  eligible: boolean;
  reason: string | null;
  profiles: AilhatHandoffProfile[];
  suggestedProfileId: string | null;
};

async function requireUser() {
  const token = getCookie(SESSION_COOKIE);
  if (!token) throw new Error("Authentication required.");
  const row = (await getDb().query(
    `SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = $1 AND s.expires_at > NOW() LIMIT 1`,
    [token],
  ))[0] as { id: string; email: string } | undefined;
  if (!row) throw new Error("Authentication required.");
  return row;
}

async function ensureHandoffSchema() {
  await getDb().query(`
    CREATE TABLE IF NOT EXISTS ailhat_handoffs (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      profile_id TEXT NOT NULL,
      snapshot_json JSONB NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await getDb().query("CREATE INDEX IF NOT EXISTS idx_ailhat_handoffs_user ON ailhat_handoffs(user_id, created_at DESC)");
}

export const getAilhatHandoffOpportunity = createServerFn({ method: "GET" }).handler(async (): Promise<AilhatHandoffOpportunity> => {
  const user = await requireUser();
  const rows = (await getDb().query(
    `SELECT id, topic, offering, updated_at, state_json
       FROM profiles WHERE user_id = $1 ORDER BY updated_at DESC`,
    [user.id],
  )) as Array<AilhatHandoffProfile & { state_json: string }>;
  if (rows.length === 0) return { eligible: false, reason: null, profiles: [], suggestedProfileId: null };

  const text = rows.map((row) => `${row.topic} ${row.state_json}`).join(" ").toLowerCase();
  const portfolioTerms = ["product", "project", "venture", "startup", "business", "brand", "company", "client", "roadmap", "launch"];
  const priorityTerms = ["priorit", "focus", "attention", "tradeoff", "resource", "which", "next", "competing"];
  const portfolioHits = portfolioTerms.filter((term) => text.includes(term)).length;
  const priorityHits = priorityTerms.filter((term) => text.includes(term)).length;
  const eligible = (rows.length >= 2 && portfolioHits >= 1) || (portfolioHits >= 3 && priorityHits >= 1);
  const reason = eligible
    ? rows.length >= 2
      ? "Your saved Context spans multiple active areas. That may be a portfolio question, not only a Context question."
      : "Your Context contains multiple product or project signals plus a prioritization question."
    : null;

  return {
    eligible,
    reason,
    profiles: rows.map(({ id, topic, offering, updated_at }) => ({ id, topic, offering, updated_at })),
    suggestedProfileId: rows[0]?.id ?? null,
  };
});

export const createAilhatHandoff = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const profileId = String((input as { profileId?: string })?.profileId ?? "").trim();
    if (!profileId) throw new Error("Choose a Context to carry into ailhat.");
    return { profileId };
  })
  .handler(async ({ data }) => {
    const user = await requireUser();
    await ensureHandoffSchema();
    const profile = (await getDb().query(
      `SELECT id, topic, offering, tier, state_json, portrait_json, updated_at
         FROM profiles WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [data.profileId, user.id],
    ))[0] as { id: string; topic: string; offering: string; tier: string; state_json: string; portrait_json: string | null; updated_at: string } | undefined;
    if (!profile) throw new Error("Context not found.");

    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const snapshot = {
      schema: "alvira.ailhat-handoff.v1",
      source: "ALVIRA",
      purpose: "portfolio-intelligence-starter-context",
      profile: {
        id: profile.id,
        topic: profile.topic,
        offering: profile.offering,
        tier: profile.tier,
        state: JSON.parse(profile.state_json),
        portrait: profile.portrait_json ? JSON.parse(profile.portrait_json) : null,
        updated_at: profile.updated_at,
      },
      created_at: new Date().toISOString(),
    };

    await getDb().query(
      `INSERT INTO ailhat_handoffs (token_hash, user_id, profile_id, snapshot_json, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [tokenHash, user.id, profile.id, JSON.stringify(snapshot), expiresAt],
    );
    const url = new URL("/import/alvira", AILHAT_URL);
    url.searchParams.set("token", token);
    return { url: url.toString(), expiresAt };
  });
