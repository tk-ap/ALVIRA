import { NextResponse } from "next/server";
import { bridgeCallbackUrl, exchangeCode } from "../../../../lib/alvira";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "missing_code" }, { status: 400 });

  try {
    const redirectUri = bridgeCallbackUrl(url.origin);
    const token = await exchangeCode(code, redirectUri);
    const response = NextResponse.redirect(new URL("/", url.origin));
    response.cookies.set("alvira_bridge_token", token.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(0, Math.floor((new Date(token.expires_at).getTime() - Date.now()) / 1000)),
    });
    return response;
  } catch {
    return NextResponse.json({ error: "authorization_failed" }, { status: 400 });
  }
}
