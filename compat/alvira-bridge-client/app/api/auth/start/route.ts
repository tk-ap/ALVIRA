import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const callback = `${origin}/api/auth/callback`;
  const alvira = new URL(`${process.env.ALVIRA_PUBLIC_URL || "https://alviratech.vercel.app"}/bridge/connect`);
  alvira.searchParams.set("return_to", callback);
  return NextResponse.redirect(alvira);
}
