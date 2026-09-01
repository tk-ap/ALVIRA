import { createHash, randomBytes } from "node:crypto";
import { getCookie } from "@tanstack/react-start/server";
import { getDb } from "~/db";

const SESSION_COOKIE = "alvira_session";
const DEFAULT_BRIDGE_CLIENT_ID = "alvira-bridge";
const DEFAULT_BRIDGE_URL = "https://alviratech-bridge.vercel.app";

/**
 * Raised when the code-to-token exchange is rejected for a permanent,
 * client-side reason (bad/expired code, wrong client id or secret). These map
 * to an OAuth-style 4xx in the calling route.
 */
export class BridgeExchangeError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = "BridgeExchangeError";
  }
}

/**
 * Logs an exchange failure with enough context to diagnose an outage (a
 * missing env var, an outbound DB/HTTP failure, an unexpected error) without
 * ever printing an authorization code or a client secret.
 */
export function logBridgeError(where: string, error: unknown) {
  const detail = error instanceof Error
    ? { name: error.name, message: error.message, code: (error as { code?: string }).code, stack: error.stack }
    : { value: String(error) };
  console.error(`[bridge:${where}] code-to-token exchange failed`, detail);
}

let bridgeSchemaReady: Promise<void> | null = null;

function ensureBridgeSchema() {
  if (bridgeSchemaReady) return bridgeSchemaReady;
  bridgeSchemaReady = (async () => {
    const db = getDb();
    await db.query(`
      CREATE TABLE IF NOT EXISTS bridge_authorization_codes (
        code_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_id TEXT NOT NULL,
        redirect_uri TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS bridge_access_tokens (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_id TEXT NOT NULL,
        scope TEXT NOT NULL DEFAULT 'context:read profile:read',
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        revoked_at TIMESTAMPTZ
      )
    `);
    await db.query("CREATE INDEX IF NOT EXISTS idx_bridge_codes_expiry ON bridge_authorization_codes(expires_at)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_bridge_tokens_user_id ON bridge_access_tokens(user_id)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_bridge_tokens_expiry ON bridge_access_tokens(expires_at)");
  })().catch((error) => {
    bridgeSchemaReady = null;
    throw error;
  });
  return bridgeSchemaReady;
}

export function bridgeClientId() {
  return process.env.BRIDGE_CLIENT_ID?.trim() || DEFAULT_BRIDGE_CLIENT_ID;
}

export function bridgePublicUrl() {
  return process.env.BRIDGE_PUBLIC_URL?.trim() || DEFAULT_BRIDGE_URL;
}

export function hashBridgeSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createBridgeSecret() {
  return randomBytes(32).toString("base64url");
}

export async function getBridgeUserFromSession() {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  const session = (await getDb().query(
    "SELECT user_id, expires_at FROM sessions WHERE token = $1",
    [token],
  ))[0] as { user_id: string; expires_at: string } | undefined;
  if (!session || new Date(session.expires_at) <= new Date()) return null;
  const user = (await getDb().query(
    "SELECT id, email, tier FROM users WHERE id = $1",
    [session.user_id],
  ))[0] as { id: string; email: string; tier: string } | undefined;
  return user ?? null;
}

export async function issueBridgeAuthorizationCode(userId: string, redirectUri: string) {
  await ensureBridgeSchema();
  const code = createBridgeSecret();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await getDb().query(
    "INSERT INTO bridge_authorization_codes (code_hash, user_id, client_id, redirect_uri, expires_at) VALUES ($1, $2, $3, $4, $5)",
    [hashBridgeSecret(code), userId, bridgeClientId(), redirectUri, expiresAt],
  );
  return { code, expiresAt };
}

export async function exchangeBridgeAuthorizationCode(code: string, clientId: string, redirectUri: string, clientSecret: string) {
  if (clientId !== bridgeClientId()) throw new BridgeExchangeError("Invalid Bridge client.", "invalid_client");
  const expectedSecret = process.env.BRIDGE_CLIENT_SECRET?.trim();
  if (!expectedSecret || clientSecret !== expectedSecret) throw new BridgeExchangeError("Invalid Bridge client credentials.", "invalid_client");

  await ensureBridgeSchema();
  const db = getDb();
  const row = (await db.query(
    "DELETE FROM bridge_authorization_codes WHERE code_hash = $1 AND client_id = $2 AND redirect_uri = $3 AND expires_at > NOW() RETURNING user_id",
    [hashBridgeSecret(code), clientId, redirectUri],
  ))[0] as { user_id: string } | undefined;
  if (!row) throw new BridgeExchangeError("Authorization code is invalid or expired.", "invalid_grant");

  const accessToken = createBridgeSecret();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await db.query(
    "INSERT INTO bridge_access_tokens (token_hash, user_id, client_id, scope, expires_at) VALUES ($1, $2, $3, $4, $5)",
    [hashBridgeSecret(accessToken), row.user_id, clientId, "context:read profile:read", expiresAt],
  );
  return { accessToken, expiresAt, scope: "context:read profile:read" };
}

export async function getBridgePrincipal(accessToken: string) {
  await ensureBridgeSchema();
  const row = (await getDb().query(
    "SELECT user_id, client_id, scope, expires_at FROM bridge_access_tokens WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()",
    [hashBridgeSecret(accessToken)],
  ))[0] as { user_id: string; client_id: string; scope: string; expires_at: string } | undefined;
  if (!row || row.client_id !== bridgeClientId()) return null;
  return row;
}

export async function getBridgeProfiles(userId: string) {
  const rows = (await getDb().query(
    "SELECT id, topic, offering, tier, state_json, portrait_json, updated_at FROM profiles WHERE user_id = $1 ORDER BY updated_at DESC",
    [userId],
  )) as Array<{ id: string; topic: string; offering: string; tier: string; state_json: string; portrait_json: string | null; updated_at: string }>;
  return rows.map((row) => ({
    id: row.id,
    topic: row.topic,
    offering: row.offering,
    tier: row.tier,
    state: JSON.parse(row.state_json),
    portrait: row.portrait_json ? JSON.parse(row.portrait_json) : null,
    updated_at: row.updated_at,
  }));
}
