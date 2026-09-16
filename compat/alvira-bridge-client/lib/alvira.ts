const ALVIRA_API_BASE_URL = process.env.ALVIRA_API_BASE_URL || "https://alviratech.vercel.app";

export const bridgeClientId = process.env.BRIDGE_CLIENT_ID || "alvira-bridge";

export function bridgeCallbackUrl(origin: string) {
  return `${origin}/api/auth/callback`;
}

export async function exchangeCode(code: string, redirectUri: string) {
  const clientSecret = process.env.BRIDGE_CLIENT_SECRET;
  if (!clientSecret) throw new Error("BRIDGE_CLIENT_SECRET is not configured.");
  const response = await fetch(`${ALVIRA_API_BASE_URL}/api/bridge/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: bridgeClientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Unable to exchange the ALVIRA authorization code.");
  return response.json() as Promise<{ access_token: string; token_type: string; expires_at: string; scope: string }>;
}

export async function getProfiles(accessToken: string) {
  const response = await fetch(`${ALVIRA_API_BASE_URL}/api/bridge/profiles`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Unable to read your ALVIRA context.");
  return response.json() as Promise<{ profiles: Array<Record<string, unknown>> }>;
}
