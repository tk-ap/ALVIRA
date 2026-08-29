import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { getDb, getSessionByToken, getUserById } from "~/db";

const SESSION_COOKIE = "alvira_session";
let schemaReady: Promise<void> | null = null;

export function ensureContextVersioningSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const db = getDb();
    await db.query(`
      CREATE TABLE IF NOT EXISTS context_versions (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        source TEXT NOT NULL DEFAULT 'before_update',
        offering TEXT NOT NULL,
        topic TEXT NOT NULL,
        tier TEXT NOT NULL,
        state_json TEXT NOT NULL,
        portrait_json TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(profile_id, version)
      )
    `);
    await db.query("CREATE INDEX IF NOT EXISTS idx_context_versions_profile_created ON context_versions(profile_id, created_at DESC)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_context_versions_user_created ON context_versions(user_id, created_at DESC)");
    await db.query(`
      CREATE OR REPLACE FUNCTION alvira_capture_context_version()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $fn$
      DECLARE next_version INTEGER;
      BEGIN
        IF OLD.state_json IS NOT DISTINCT FROM NEW.state_json
          AND OLD.portrait_json IS NOT DISTINCT FROM NEW.portrait_json
          AND OLD.topic IS NOT DISTINCT FROM NEW.topic
          AND OLD.offering IS NOT DISTINCT FROM NEW.offering
          AND OLD.tier IS NOT DISTINCT FROM NEW.tier THEN
          RETURN NEW;
        END IF;
        SELECT COALESCE(MAX(version), 0) + 1 INTO next_version
          FROM context_versions
          WHERE profile_id = OLD.id;
        INSERT INTO context_versions (
          id, profile_id, user_id, version, source, offering, topic, tier, state_json, portrait_json
        ) VALUES (
          OLD.id || ':v' || next_version::text,
          OLD.id,
          OLD.user_id,
          next_version,
          'before_update',
          OLD.offering,
          OLD.topic,
          OLD.tier,
          OLD.state_json,
          OLD.portrait_json
        );
        RETURN NEW;
      END;
      $fn$
    `);
    await db.query(`
      DO $do$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'trg_alvira_capture_context_version'
        ) THEN
          CREATE TRIGGER trg_alvira_capture_context_version
          BEFORE UPDATE OF state_json, portrait_json, topic, offering, tier ON profiles
          FOR EACH ROW EXECUTE FUNCTION alvira_capture_context_version();
        END IF;
      END
      $do$
    `);
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

async function optionalUser() {
  let token: string | null = null;
  try { token = getCookie(SESSION_COOKIE) ?? null; } catch { token = null; }
  if (!token) return null;
  const session = await getSessionByToken(token);
  if (!session || new Date(session.expires_at).getTime() <= Date.now()) return null;
  return getUserById(session.user_id);
}

async function requireUser() {
  const user = await optionalUser();
  if (!user) throw new Error("Authentication required.");
  return user;
}

function parseState(value: string): Record<string, unknown> {
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
}

function domainMap(state: Record<string, unknown>): Record<string, unknown> {
  const domains = state.domains;
  return domains && typeof domains === "object" ? domains as Record<string, unknown> : {};
}

function changedDomains(previous: Record<string, unknown> | null, current: Record<string, unknown>): string[] {
  const now = domainMap(current);
  if (!previous) return Object.keys(now).filter((key) => JSON.stringify(now[key]) !== "{}");
  const before = domainMap(previous);
  return Array.from(new Set([...Object.keys(before), ...Object.keys(now)]))
    .filter((key) => JSON.stringify(before[key] ?? null) !== JSON.stringify(now[key] ?? null));
}

export const ensureContextVersioning = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await optionalUser())) return { ready: false };
  await ensureContextVersioningSchema();
  return { ready: true };
});

export const listContextHistory = createServerFn({ method: "POST" })
  .validator((input: unknown) => ({ profileId: String((input as { profileId?: string }).profileId ?? "") }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await ensureContextVersioningSchema();
    const profile = (await getDb().query(
      "SELECT id, topic, offering, tier, state_json, portrait_json, updated_at FROM profiles WHERE id = $1 AND user_id = $2",
      [data.profileId, user.id],
    ))[0] as { id: string; topic: string; offering: string; tier: string; state_json: string; portrait_json: string | null; updated_at: string } | undefined;
    if (!profile) throw new Error("Context not found.");

    const stored = await getDb().query(
      "SELECT version, source, offering, topic, tier, state_json, portrait_json, created_at FROM context_versions WHERE profile_id = $1 AND user_id = $2 ORDER BY version ASC",
      [profile.id, user.id],
    ) as Array<{ version: number; source: string; offering: string; topic: string; tier: string; state_json: string; portrait_json: string | null; created_at: string }>;

    let previous: Record<string, unknown> | null = null;
    const versions = stored.map((row) => {
      const state = parseState(row.state_json);
      const changed = changedDomains(previous, state);
      previous = state;
      return {
        version: Number(row.version),
        current: false,
        source: row.source,
        createdAt: row.created_at,
        topic: row.topic,
        offering: row.offering,
        changedDomains: changed,
      };
    });

    const currentState = parseState(profile.state_json);
    const nextVersion = stored.length ? Number(stored[stored.length - 1].version) + 1 : 1;
    versions.push({
      version: nextVersion,
      current: true,
      source: "current",
      createdAt: profile.updated_at,
      topic: profile.topic,
      offering: profile.offering,
      changedDomains: changedDomains(previous, currentState),
    });

    return { profile: { id: profile.id, topic: profile.topic, offering: profile.offering }, versions };
  });
