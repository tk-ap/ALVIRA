import { createHash, randomBytes } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "~/db";

const ALVIRA_SESSION_COOKIE = "alvira_session";
const OWNER_EMAIL = (process.env.ALVIRA_OWNER_EMAIL ?? "tahlia.ashwood@gmail.com").trim().toLowerCase();
const LEDGATO_PUBLIC_URL = process.env.LEDGATO_PUBLIC_URL?.trim() || "https://ledgato.vercel.app";
const HANDOFF_TTL_MS = 5 * 60 * 1000;

type OwnerSession = {
  id: string;
  email: string;
  session_expires_at: string;
};

function noStoreHeaders(extra: Record<string, string> = {}) {
  return {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    ...extra,
  };
}

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    if (key !== name) continue;
    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function validState(state: string): boolean {
  return /^[A-Za-z0-9_-]{32,128}$/.test(state);
}

function safeNextPath(value: string | null | undefined): string {
  const next = String(value ?? "").trim();
  return next.startsWith("/app") && !next.startsWith("//") ? next : "/app";
}

async function ensureSchema() {
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS ledgato_identity_handoffs (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      state TEXT NOT NULL,
      next_path TEXT NOT NULL,
      source_session_expires_at TIMESTAMPTZ NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query("CREATE INDEX IF NOT EXISTS idx_ledgato_identity_handoffs_user ON ledgato_identity_handoffs(user_id, created_at DESC)");
  await db.query(`
    CREATE TABLE IF NOT EXISTS ledgato_identity_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query("CREATE INDEX IF NOT EXISTS idx_ledgato_identity_sessions_user ON ledgato_identity_sessions(user_id, created_at DESC)");
}

async function ownerSessionFromRequest(request: Request): Promise<OwnerSession | null> {
  const token = parseCookie(request.headers.get("cookie"), ALVIRA_SESSION_COOKIE);
  if (!token) return null;
  const row = (await getDb().query(
    `SELECT u.id, u.email, s.expires_at AS session_expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = $1
        AND s.expires_at > NOW()
      LIMIT 1`,
    [token],
  ))[0] as OwnerSession | undefined;
  if (!row) return null;
  if (row.email.trim().toLowerCase() !== OWNER_EMAIL) return null;
  return row;
}

function loginRedirect(request: Request): Response {
  const current = new URL(request.url);
  const returnTo = `${current.pathname}${current.search}`;
  const login = new URL("/login", current.origin);
  login.searchParams.set("returnTo", returnTo);
  return new Response(null, {
    status: 302,
    headers: noStoreHeaders({ Location: `${login.pathname}${login.search}` }),
  });
}

async function startHandoff(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const state = url.searchParams.get("state")?.trim() || "";
  if (!validState(state)) {
    return Response.json({ error: "invalid_state" }, { status: 400, headers: noStoreHeaders() });
  }

  const owner = await ownerSessionFromRequest(request);
  if (!owner) return loginRedirect(request);

  await ensureSchema();
  const nextPath = safeNextPath(url.searchParams.get("next"));
  const code = randomBytes(32).toString("base64url");
  const now = Date.now();
  const sourceExpiry = new Date(owner.session_expires_at).getTime();
  const handoffExpiry = new Date(Math.min(now + HANDOFF_TTL_MS, sourceExpiry)).toISOString();
  if (!Number.isFinite(sourceExpiry) || sourceExpiry <= now) return loginRedirect(request);

  await getDb().query(
    `INSERT INTO ledgato_identity_handoffs
      (token_hash, user_id, state, next_path, source_session_expires_at, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)`,
    [tokenHash(code), owner.id, state, nextPath, owner.session_expires_at, handoffExpiry],
  );

  const callback = new URL("/api/auth/alvira", LEDGATO_PUBLIC_URL);
  callback.searchParams.set("code", code);
  callback.searchParams.set("state", state);
  callback.searchParams.set("next", nextPath);

  return new Response(null, {
    status: 302,
    headers: noStoreHeaders({ Location: callback.toString() }),
  });
}

async function consumeHandoff(code: string, state: string): Promise<Response> {
  if (!code || !validState(state)) {
    return Response.json({ error: "invalid_request" }, { status: 400, headers: noStoreHeaders() });
  }
  await ensureSchema();
  const row = (await getDb().query(
    `UPDATE ledgato_identity_handoffs
        SET consumed_at = NOW()
      WHERE token_hash = $1
        AND state = $2
        AND consumed_at IS NULL
        AND expires_at > NOW()
    RETURNING user_id, next_path, source_session_expires_at`,
    [tokenHash(code), state],
  ))[0] as { user_id: string; next_path: string; source_session_expires_at: string } | undefined;
  if (!row) {
    return Response.json({ error: "invalid_or_expired_handoff" }, { status: 410, headers: noStoreHeaders() });
  }

  const owner = (await getDb().query(
    "SELECT id, email FROM users WHERE id = $1 LIMIT 1",
    [row.user_id],
  ))[0] as { id: string; email: string } | undefined;
  if (!owner || owner.email.trim().toLowerCase() !== OWNER_EMAIL) {
    return Response.json({ error: "owner_access_required" }, { status: 403, headers: noStoreHeaders() });
  }

  const sourceExpiry = new Date(row.source_session_expires_at).getTime();
  if (!Number.isFinite(sourceExpiry) || sourceExpiry <= Date.now()) {
    return Response.json({ error: "source_session_expired" }, { status: 410, headers: noStoreHeaders() });
  }

  const sessionToken = randomBytes(32).toString("base64url");
  await getDb().query(
    `INSERT INTO ledgato_identity_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenHash(sessionToken), owner.id, new Date(sourceExpiry).toISOString()],
  );

  return Response.json(
    {
      ok: true,
      sessionToken,
      expiresAt: new Date(sourceExpiry).toISOString(),
      next: safeNextPath(row.next_path),
      owner: { id: owner.id, email: owner.email },
      authority: "identity_only",
    },
    { headers: noStoreHeaders() },
  );
}

async function validateLedgatoSession(token: string): Promise<Response> {
  if (!token) return Response.json({ ok: false }, { status: 401, headers: noStoreHeaders() });
  await ensureSchema();
  const row = (await getDb().query(
    `SELECT u.id, u.email, s.expires_at
       FROM ledgato_identity_sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
      LIMIT 1`,
    [tokenHash(token)],
  ))[0] as { id: string; email: string; expires_at: string } | undefined;
  if (!row || row.email.trim().toLowerCase() !== OWNER_EMAIL) {
    return Response.json({ ok: false }, { status: 401, headers: noStoreHeaders() });
  }
  return Response.json(
    {
      ok: true,
      owner: { id: row.id, email: row.email },
      expiresAt: row.expires_at,
      authority: "identity_only",
    },
    { headers: noStoreHeaders() },
  );
}

async function revokeLedgatoSession(token: string): Promise<Response> {
  if (token) {
    await ensureSchema();
    await getDb().query(
      "UPDATE ledgato_identity_sessions SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL",
      [tokenHash(token)],
    );
  }
  return Response.json({ ok: true }, { headers: noStoreHeaders() });
}

export const Route = createFileRoute("/api/handoff/ledgato")({
  server: {
    handlers: {
      GET: async ({ request }) => startHandoff(request),
      POST: async ({ request }) => {
        let body: { operation?: string; code?: string; state?: string; token?: string };
        try {
          body = await request.json() as { operation?: string; code?: string; state?: string; token?: string };
        } catch {
          return Response.json({ error: "invalid_request" }, { status: 400, headers: noStoreHeaders() });
        }

        if (body.operation === "consume") {
          return consumeHandoff(String(body.code ?? "").trim(), String(body.state ?? "").trim());
        }
        if (body.operation === "validate") {
          return validateLedgatoSession(String(body.token ?? "").trim());
        }
        if (body.operation === "revoke") {
          return revokeLedgatoSession(String(body.token ?? "").trim());
        }
        return Response.json({ error: "unsupported_operation" }, { status: 400, headers: noStoreHeaders() });
      },
    },
  },
});
