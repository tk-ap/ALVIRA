import { createFileRoute } from "@tanstack/react-router";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { hash as hashPassword } from "bcryptjs";
import { getDb, recordEvent } from "~/db";
import {
  AGENTID_ISSUER,
  AGENTID_TOKEN,
  agentIdConfig,
  randomBase64Url,
  verifyAgentIdToken,
} from "~/lib/agentid.server";

const TXN_COOKIE = "alvira_agentid_txn";
const SESSION_COOKIE = "alvira_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

function cookieOptions(maxAge?: number) {
  const domain = process.env.ALVIRA_SESSION_COOKIE_DOMAIN?.trim();
  return {
    path: "/",
    ...(maxAge ? { maxAge } : {}),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    ...(domain ? { domain } : {}),
  };
}

type Txn = { state: string; nonce: string; verifier: string; redirectUri: string; returnTo: string };
type UserRow = { id: string; email: string; tier: string };

function readTxn(): Txn | null {
  try {
    const raw = getCookie(TXN_COOKIE);
    if (!raw) return null;
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Txn;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/auth/agentid/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const txn = readTxn();
        deleteCookie(TXN_COOKIE, cookieOptions());

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const issuer = url.searchParams.get("iss");
        if (!txn || !code || !state || state !== txn.state || (issuer && issuer !== AGENTID_ISSUER)) {
          return Response.redirect(new URL("/login?agentid=invalid_callback", url.origin), 302);
        }

        try {
          const { clientId, clientSecret } = agentIdConfig();
          const tokenResponse = await fetch(AGENTID_TOKEN, {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code,
              redirect_uri: txn.redirectUri,
              code_verifier: txn.verifier,
            }),
          });
          if (!tokenResponse.ok) throw new Error(`AgentID token exchange failed (${tokenResponse.status}).`);

          const tokens = await tokenResponse.json() as { id_token?: string };
          if (!tokens.id_token) throw new Error("AgentID id_token is missing.");
          const claims = await verifyAgentIdToken(tokens.id_token, txn.nonce, clientId);

          const subject = String(claims.sub);
          const email = String(claims.email).trim().toLowerCase();
          const db = getDb();

          const identity = (await db.query(
            "SELECT user_id FROM auth_identities WHERE provider = $1 AND subject = $2",
            ["agentid", subject],
          ))[0] as { user_id: string } | undefined;
          let user = identity
            ? (await db.query("SELECT id, email, tier FROM users WHERE id = $1", [identity.user_id]))[0] as UserRow | undefined
            : undefined;

          if (!user) {
            const emailOwner = (await db.query("SELECT id FROM users WHERE email = $1", [email]))[0] as { id: string } | undefined;
            if (emailOwner) throw new Error("AgentID email already belongs to another ALVIRA account.");

            const userId = crypto.randomUUID();
            const passwordHash = await hashPassword(randomBase64Url(32), 10);
            user = (await db.query(
              "INSERT INTO users (id, email, password_hash, tier) VALUES ($1, $2, $3, 'free') RETURNING id, email, tier",
              [userId, email, passwordHash],
            ))[0] as UserRow;
          }

          await db.query(
            "INSERT INTO auth_identities (user_id, provider, subject, provider_email, actor_type, owner_sub) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (provider, subject) DO UPDATE SET provider_email = EXCLUDED.provider_email, actor_type = EXCLUDED.actor_type, owner_sub = EXCLUDED.owner_sub, updated_at = NOW()",
            [
              user.id,
              "agentid",
              subject,
              email,
              typeof claims.actor_type === "string" ? claims.actor_type : "agent",
              typeof claims.owner_sub === "string" ? claims.owner_sub : null,
            ],
          );

          const token = crypto.randomUUID();
          const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
          await db.query(
            "INSERT INTO sessions (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)",
            [crypto.randomUUID(), user.id, token, expiresAt],
          );
          setCookie(SESSION_COOKIE, token, cookieOptions(SESSION_MAX_AGE));

          try {
            await recordEvent("agentid_login_completed", {
              userId: user.id,
              props: { actorType: typeof claims.actor_type === "string" ? claims.actor_type : "agent" },
            });
          } catch {}

          return Response.redirect(new URL(txn.returnTo, url.origin), 302);
        } catch (error) {
          console.error("[agentid] callback failed", error instanceof Error ? error.message : String(error));
          return Response.redirect(new URL("/login?agentid=failed", url.origin), 302);
        }
      },
    },
  },
});
