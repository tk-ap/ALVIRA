import { createPublicKey, verify } from "node:crypto";

export const AGENTID_ISSUER = "https://auth.agentid.com";
export const AGENTID_AUTHORIZE = `${AGENTID_ISSUER}/v0/authorize`;
export const AGENTID_TOKEN = `${AGENTID_ISSUER}/v0/token`;
export const AGENTID_JWKS_URL = `${AGENTID_ISSUER}/v0/jwks.json`;
export const AGENTID_SCOPES = "openid email profile";

export type AgentIdClaims = Record<string, unknown> & {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nonce?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean;
  actor_type?: string;
  owner_sub?: string;
};

export function agentIdConfig() {
  const clientId = process.env.AGENTID_CLIENT_ID?.trim();
  const clientSecret = process.env.AGENTID_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("AgentID is not configured.");
  return { clientId, clientSecret };
}

export function callbackUrl(origin: string): string {
  return process.env.AGENTID_REDIRECT_URI?.trim() || `${origin}/api/auth/agentid/callback`;
}

export function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/app";
  return value;
}

export function randomBase64Url(bytes = 32): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return Buffer.from(data).toString("base64url");
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return Buffer.from(new Uint8Array(digest)).toString("base64url");
}

function parseJwtPart<T>(part: string): T {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
}

export async function verifyAgentIdToken(idToken: string, expectedNonce: string, audience: string): Promise<AgentIdClaims> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("AgentID id_token is malformed.");

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = parseJwtPart<{ alg?: string; kid?: string }>(encodedHeader);
  const claims = parseJwtPart<AgentIdClaims>(encodedPayload);
  if (header.alg !== "ES256" || !header.kid) throw new Error("AgentID token algorithm is invalid.");

  const jwksResponse = await fetch(AGENTID_JWKS_URL, { headers: { accept: "application/json" } });
  if (!jwksResponse.ok) throw new Error("Unable to load AgentID signing keys.");
  const jwks = await jwksResponse.json() as { keys?: Array<JsonWebKey & { kid?: string; alg?: string }> };
  const jwk = jwks.keys?.find((key) => key.kid === header.kid && (!key.alg || key.alg === "ES256"));
  if (!jwk) throw new Error("AgentID signing key was not found.");

  const publicKey = createPublicKey({ key: jwk as any, format: "jwk" });
  const signatureValid = verify(
    "sha256",
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    { key: publicKey, dsaEncoding: "ieee-p1363" },
    Buffer.from(encodedSignature, "base64url"),
  );
  if (!signatureValid) throw new Error("AgentID token signature is invalid.");

  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== AGENTID_ISSUER || !audiences.includes(audience)) throw new Error("AgentID token issuer or audience is invalid.");
  if (typeof claims.exp !== "number" || claims.exp <= now) throw new Error("AgentID token has expired.");
  if (claims.nonce !== expectedNonce) throw new Error("AgentID nonce mismatch.");
  if (typeof claims.sub !== "string" || !claims.sub) throw new Error("AgentID subject is missing.");
  if (typeof claims.email !== "string" || claims.email_verified !== true) throw new Error("AgentID email is not verified.");
  return claims;
}
