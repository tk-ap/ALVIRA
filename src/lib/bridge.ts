import { createHash, randomBytes } from "node:crypto";
import { getCookie } from "@tanstack/react-start/server";
import { getDb } from "~/db";

const SESSION_COOKIE = "alvira_session";
const DEFAULT_BRIDGE_CLIENT_ID = "alvira-bridge";
const DEFAULT_BRIDGE_URL = "https://alviratech-bridge.vercel.app";

export type BridgeDestination = "mcp" | "api";

export type BridgeOAuthClient = {
  client_id: string;
  client_name: string;
  redirect_uris: string[];
  application_type: string;
  token_endpoint_auth_method: string;
};

export function isBridgeDestination(value: string | null): value is BridgeDestination {
  return value === "mcp" || value === "api";
}

export class BridgeExchangeError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = "BridgeExchangeError";
  }
}

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
    await db.query(`
      CREATE TABLE IF NOT EXISTS bridge_oauth_clients (
        client_id TEXT PRIMARY KEY,
        client_name TEXT NOT NULL,
        redirect_uris_json TEXT NOT NULL,
        application_type TEXT NOT NULL DEFAULT 'native',
        token_endpoint_auth_method TEXT NOT NULL DEFAULT 'none',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ
      )
    `);
    await db.query("ALTER TABLE bridge_authorization_codes ADD COLUMN IF NOT EXISTS selected_profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL");
    await db.query("ALTER TABLE bridge_authorization_codes ADD COLUMN IF NOT EXISTS destination TEXT");
    await db.query("ALTER TABLE bridge_authorization_codes ADD COLUMN IF NOT EXISTS code_challenge TEXT");
    await db.query("ALTER TABLE bridge_authorization_codes ADD COLUMN IF NOT EXISTS code_challenge_method TEXT");
    await db.query("ALTER TABLE bridge_authorization_codes ADD COLUMN IF NOT EXISTS connection_id TEXT");
    await db.query("ALTER TABLE bridge_access_tokens ADD COLUMN IF NOT EXISTS selected_profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL");
    await db.query("ALTER TABLE bridge_access_tokens ADD COLUMN IF NOT EXISTS destination TEXT");
    await db.query("ALTER TABLE bridge_access_tokens ADD COLUMN IF NOT EXISTS connection_id TEXT");
    await db.query("CREATE INDEX IF NOT EXISTS idx_bridge_codes_expiry ON bridge_authorization_codes(expires_at)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_bridge_tokens_user_id ON bridge_access_tokens(user_id)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_bridge_tokens_expiry ON bridge_access_tokens(expires_at)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_bridge_tokens_selected_profile ON bridge_access_tokens(selected_profile_id) WHERE revoked_at IS NULL");
    await db.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_bridge_tokens_connection_id ON bridge_access_tokens(connection_id) WHERE connection_id IS NOT NULL");
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

function pkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

function validPublicRedirect(uri: string, applicationType: string) {
  try {
    const parsed = new URL(uri);
    if (parsed.protocol === "https:") return true;
    const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "::1" || parsed.hostname === "[::1]";
    return applicationType === "native" && parsed.protocol === "http:" && local;
  } catch {
    return false;
  }
}

export async function registerBridgeOAuthClient(input: {
  clientName: string;
  redirectUris: string[];
  applicationType?: string;
}) {
  await ensureBridgeSchema();
  const clientName = input.clientName.trim().slice(0, 120) || "AI app";
  const applicationType = input.applicationType === "web" ? "web" : "native";
  const redirectUris = Array.from(new Set(input.redirectUris.map((value) => value.trim()).filter(Boolean)));
  if (redirectUris.length === 0 || redirectUris.length > 10 || redirectUris.some((uri) => !validPublicRedirect(uri, applicationType))) {
    throw new BridgeExchangeError("Invalid redirect URI.", "invalid_redirect_uri");
  }
  const clientId = `bridge_${randomBytes(18).toString("base64url")}`;
  await getDb().query(
    "INSERT INTO bridge_oauth_clients (client_id, client_name, redirect_uris_json, application_type, token_endpoint_auth_method) VALUES ($1, $2, $3, $4, 'none')",
    [clientId, clientName, JSON.stringify(redirectUris), applicationType],
  );
  return {
    client_id: clientId,
    client_name: clientName,
    redirect_uris: redirectUris,
    application_type: applicationType,
    token_endpoint_auth_method: "none",
  } satisfies BridgeOAuthClient;
}

export async function getBridgeOAuthClient(clientId: string): Promise<BridgeOAuthClient | null> {
  await ensureBridgeSchema();
  const row = (await getDb().query(
    "SELECT client_id, client_name, redirect_uris_json, application_type, token_endpoint_auth_method FROM bridge_oauth_clients WHERE client_id = $1",
    [clientId],
  ))[0] as {
    client_id: string;
    client_name: string;
    redirect_uris_json: string;
    application_type: string;
    token_endpoint_auth_method: string;
  } | undefined;
  if (!row) return null;
  let redirectUris: string[] = [];
  try { redirectUris = JSON.parse(row.redirect_uris_json) as string[]; } catch { redirectUris = []; }
  return {
    client_id: row.client_id,
    client_name: row.client_name,
    redirect_uris: redirectUris,
    application_type: row.application_type,
    token_endpoint_auth_method: row.token_endpoint_auth_method,
  };
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

export async function issueBridgeAuthorizationCode(
  userId: string,
  redirectUri: string,
  selectedProfileId: string | null = null,
  destination: BridgeDestination | null = null,
  options: { clientId?: string; codeChallenge?: string | null; codeChallengeMethod?: string | null } = {},
) {
  await ensureBridgeSchema();

  if (selectedProfileId) {
    const profile = (await getDb().query(
      "SELECT id FROM profiles WHERE id = $1 AND user_id = $2",
      [selectedProfileId, userId],
    ))[0] as { id: string } | undefined;
    if (!profile) throw new BridgeExchangeError("Selected Context is not available.", "invalid_profile");
  }

  const clientId = options.clientId || bridgeClientId();
  const code = createBridgeSecret();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await getDb().query(
    "INSERT INTO bridge_authorization_codes (code_hash, user_id, client_id, redirect_uri, selected_profile_id, destination, code_challenge, code_challenge_method, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [hashBridgeSecret(code), userId, clientId, redirectUri, selectedProfileId, destination, options.codeChallenge || null, options.codeChallengeMethod || null, expiresAt],
  );
  return { code, expiresAt };
}

export async function exchangeBridgeAuthorizationCode(
  code: string,
  clientId: string,
  redirectUri: string,
  credential: string | { clientSecret?: string | null; codeVerifier?: string | null },
) {
  await ensureBridgeSchema();
  const auth = typeof credential === "string" ? { clientSecret: credential, codeVerifier: null } : credential;

  if (clientId === bridgeClientId()) {
    const expectedSecret = process.env.BRIDGE_CLIENT_SECRET?.trim();
    if (!expectedSecret || auth.clientSecret !== expectedSecret) throw new BridgeExchangeError("Invalid Bridge client credentials.", "invalid_client");
  } else {
    const client = await getBridgeOAuthClient(clientId);
    if (!client || !client.redirect_uris.includes(redirectUri)) throw new BridgeExchangeError("Invalid Bridge client.", "invalid_client");
  }

  const db = getDb();
  const row = (await db.query(
    "DELETE FROM bridge_authorization_codes WHERE code_hash = $1 AND client_id = $2 AND redirect_uri = $3 AND expires_at > NOW() RETURNING user_id, selected_profile_id, destination, code_challenge, code_challenge_method",
    [hashBridgeSecret(code), clientId, redirectUri],
  ))[0] as {
    user_id: string;
    selected_profile_id: string | null;
    destination: BridgeDestination | null;
    code_challenge: string | null;
    code_challenge_method: string | null;
  } | undefined;
  if (!row) throw new BridgeExchangeError("Authorization code is invalid or expired.", "invalid_grant");

  if (row.code_challenge) {
    if (row.code_challenge_method !== "S256" || !auth.codeVerifier || pkceChallenge(auth.codeVerifier) !== row.code_challenge) {
      throw new BridgeExchangeError("PKCE verification failed.", "invalid_grant");
    }
  } else if (clientId !== bridgeClientId()) {
    throw new BridgeExchangeError("PKCE is required for public Bridge clients.", "invalid_grant");
  }

  const accessToken = createBridgeSecret();
  const connectionId = `conn_${randomBytes(16).toString("base64url")}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await db.query(
    "INSERT INTO bridge_access_tokens (token_hash, user_id, client_id, scope, selected_profile_id, destination, connection_id, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [hashBridgeSecret(accessToken), row.user_id, clientId, "context:read profile:read", row.selected_profile_id, row.destination, connectionId, expiresAt],
  );
  if (clientId !== bridgeClientId()) {
    await db.query("UPDATE bridge_oauth_clients SET last_seen_at = NOW() WHERE client_id = $1", [clientId]);
  }
  return {
    accessToken,
    expiresAt,
    scope: "context:read profile:read",
    selectedProfileId: row.selected_profile_id,
    destination: row.destination,
    connectionId,
  };
}

export async function getBridgePrincipal(accessToken: string) {
  await ensureBridgeSchema();
  const row = (await getDb().query(
    "SELECT user_id, client_id, scope, selected_profile_id, destination, expires_at, connection_id FROM bridge_access_tokens WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()",
    [hashBridgeSecret(accessToken)],
  ))[0] as {
    user_id: string;
    client_id: string;
    scope: string;
    selected_profile_id: string | null;
    destination: BridgeDestination | null;
    expires_at: string;
    connection_id: string | null;
  } | undefined;
  return row ?? null;
}

export async function revokeBridgeAccessToken(accessToken: string) {
  await ensureBridgeSchema();
  const rows = await getDb().query(
    "UPDATE bridge_access_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL RETURNING token_hash",
    [hashBridgeSecret(accessToken)],
  );
  return rows.length > 0;
}

export async function listBridgeConnectionsForUser(userId: string) {
  await ensureBridgeSchema();
  return (await getDb().query(
    `SELECT t.connection_id, t.client_id,
            COALESCE(c.client_name, CASE WHEN t.client_id = $2 THEN 'ALVIRA Bridge' ELSE 'Connected AI app' END) AS client_name,
            t.selected_profile_id, p.topic AS profile_topic, t.destination, t.scope, t.expires_at, t.created_at
       FROM bridge_access_tokens t
       LEFT JOIN bridge_oauth_clients c ON c.client_id = t.client_id
       LEFT JOIN profiles p ON p.id = t.selected_profile_id AND p.user_id = t.user_id
      WHERE t.user_id = $1
        AND t.connection_id IS NOT NULL
        AND t.revoked_at IS NULL
        AND t.expires_at > NOW()
      ORDER BY t.created_at DESC`,
    [userId, bridgeClientId()],
  )) as Array<{
    connection_id: string;
    client_id: string;
    client_name: string;
    selected_profile_id: string | null;
    profile_topic: string | null;
    destination: BridgeDestination | null;
    scope: string;
    expires_at: string;
    created_at: string;
  }>;
}

export async function revokeBridgeConnectionForUser(userId: string, connectionId: string) {
  await ensureBridgeSchema();
  const rows = await getDb().query(
    "UPDATE bridge_access_tokens SET revoked_at = NOW() WHERE user_id = $1 AND connection_id = $2 AND revoked_at IS NULL RETURNING connection_id",
    [userId, connectionId],
  );
  return rows.length > 0;
}

export async function getBridgeProfiles(userId: string, selectedProfileId: string | null = null) {
  const rows = (await getDb().query(
    selectedProfileId
      ? "SELECT id, topic, offering, tier, state_json, portrait_json, updated_at FROM profiles WHERE user_id = $1 AND id = $2 ORDER BY updated_at DESC"
      : "SELECT id, topic, offering, tier, state_json, portrait_json, updated_at FROM profiles WHERE user_id = $1 ORDER BY updated_at DESC",
    selectedProfileId ? [userId, selectedProfileId] : [userId],
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
