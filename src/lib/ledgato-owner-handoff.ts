import { createHash, randomBytes } from "node:crypto";
import { getDb } from "~/db";

const OWNER_EMAIL_DEFAULT = "tahlia.ashwood@gmail.com";
const LEDGATO_URL = process.env.LEDGATO_PUBLIC_URL?.trim() || "https://ledgato.vercel.app";
const HANDOFF_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type LedgatoOwner = { id: string; email: string };
export type AlviraOwnerSession = LedgatoOwner & { sessionId: string; sessionExpiresAt: string };
export type LedgatoSession = LedgatoOwner & { token: string; expiresAt: string; returnPath: string };

export function ownerEmail(): string {
  return (process.env.ALVIRA_OWNER_EMAIL ?? OWNER_EMAIL_DEFAULT).trim().toLowerCase();
}

export function safeLedgatoReturnPath(value: string | null | undefined): string {
  if (typeof value === "string" && value.startsWith("/app") && !value.startsWith("//")) return value;
  return "/app";
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function validOpaque(value: string, min = 32, max = 256): boolean {
  return value.length >= min && value.length <= max && /^[A-Za-z0-9_-]+$/.test(value);
}

export function validPkceChallenge(value: string): boolean {
  return value.length === 43 && /^[A-Za-z0-9_-]+$/.test(value);
}

export function validState(value: string): boolean {
  return validOpaque(value, 24, 128);
}

async function ensureSchema(): Promise<void> {
  await getDb().query(`
    CREATE TABLE IF NOT EXISTS ledgato_owner_handoffs (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source_session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      code_challenge TEXT NOT NULL,
      state TEXT NOT NULL,
      return_path TEXT NOT NULL DEFAULT '/app',
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await getDb().query("CREATE INDEX IF NOT EXISTS idx_ledgato_owner_handoffs_user ON ledgato_owner_handoffs(user_id, created_at DESC)");
  await getDb().query(`
    CREATE TABLE IF NOT EXISTS ledgato_owner_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source_session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await getDb().query("CREATE INDEX IF NOT EXISTS idx_ledgato_owner_sessions_user ON ledgato_owner_sessions(user_id, created_at DESC)");
}

export async function ownerFromAlviraSession(sessionToken: string | null): Promise<AlviraOwnerSession | null> {
  if (!sessionToken) return null;
  const row = (await getDb().query(
    `SELECT u.id, u.email, s.id AS "sessionId", s.expires_at AS "sessionExpiresAt"
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = $1
        AND s.expires_at > NOW()
        AND LOWER(u.email) = $2
      LIMIT 1`,
    [sessionToken, ownerEmail()],
  ))[0] as AlviraOwnerSession | undefined;
  return row ?? null;
}

export async function createOwnerHandoff(input: {
  userId: string;
  sourceSessionId: string;
  sourceSessionExpiresAt: string;
  codeChallenge: string;
  state: string;
  returnPath: string;
}): Promise<{ url: string; expiresAt: string }> {
  await ensureSchema();
  if (!validPkceChallenge(input.codeChallenge) || !validState(input.state)) throw new Error("Invalid handoff request.");

  const token = randomBytes(32).toString("base64url");
  const sourceExpiry = new Date(input.sourceSessionExpiresAt).getTime();
  if (!Number.isFinite(sourceExpiry) || sourceExpiry <= Date.now()) throw new Error("Source session expired.");
  const expiresAt = new Date(Math.min(Date.now() + HANDOFF_TTL_MS, sourceExpiry)).toISOString();
  const returnPath = safeLedgatoReturnPath(input.returnPath);

  await getDb().query(
    `INSERT INTO ledgato_owner_handoffs
       (token_hash, user_id, source_session_id, code_challenge, state, return_path, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [sha256(token), input.userId, input.sourceSessionId, input.codeChallenge, input.state, returnPath, expiresAt],
  );

  const callback = new URL("/api/auth/alvira/callback", LEDGATO_URL);
  callback.searchParams.set("token", token);
  callback.searchParams.set("state", input.state);
  return { url: callback.toString(), expiresAt };
}

export async function consumeOwnerHandoff(input: {
  token: string;
  verifier: string;
  state: string;
}): Promise<LedgatoSession | null> {
  if (!validOpaque(input.token) || !validOpaque(input.verifier) || !validState(input.state)) return null;
  await ensureSchema();

  const sessionToken = randomBytes(32).toString("base64url");
  const sessionHash = sha256(sessionToken);
  const expectedChallenge = createHash("sha256").update(input.verifier).digest("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const row = (await getDb().query(
    `WITH consumed AS (
       UPDATE ledgato_owner_handoffs
          SET consumed_at = NOW()
        WHERE token_hash = $1
          AND state = $2
          AND code_challenge = $3
          AND consumed_at IS NULL
          AND expires_at > NOW()
      RETURNING user_id, source_session_id, return_path
     ),
     inserted AS (
       INSERT INTO ledgato_owner_sessions (token_hash, user_id, source_session_id, expires_at)
       SELECT $4, c.user_id, c.source_session_id, LEAST($5::timestamptz, src.expires_at)
         FROM consumed c
         JOIN sessions src ON src.id = c.source_session_id
        WHERE src.expires_at > NOW()
       RETURNING user_id, source_session_id, expires_at
     )
     SELECT i.user_id AS id, u.email, i.expires_at, c.return_path
       FROM inserted i
       JOIN consumed c ON c.user_id = i.user_id AND c.source_session_id = i.source_session_id
       JOIN users u ON u.id = i.user_id
      WHERE LOWER(u.email) = $6
      LIMIT 1`,
    [sha256(input.token), input.state, expectedChallenge, sessionHash, expiresAt, ownerEmail()],
  ))[0] as { id: string; email: string; expires_at: string; return_path: string } | undefined;

  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    token: sessionToken,
    expiresAt: row.expires_at,
    returnPath: safeLedgatoReturnPath(row.return_path),
  };
}

export async function validateOwnerSession(token: string): Promise<LedgatoOwner | null> {
  if (!validOpaque(token)) return null;
  await ensureSchema();
  const row = (await getDb().query(
    `SELECT u.id, u.email
       FROM ledgato_owner_sessions s
       JOIN users u ON u.id = s.user_id
       JOIN sessions src ON src.id = s.source_session_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
        AND src.expires_at > NOW()
        AND LOWER(u.email) = $2
      LIMIT 1`,
    [sha256(token), ownerEmail()],
  ))[0] as LedgatoOwner | undefined;
  return row ?? null;
}

export async function revokeOwnerSession(token: string): Promise<void> {
  if (!validOpaque(token)) return;
  await ensureSchema();
  await getDb().query(
    "UPDATE ledgato_owner_sessions SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL",
    [sha256(token)],
  );
}
