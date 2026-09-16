import { cookies } from "next/headers";
import { getProfiles } from "../../../lib/alvira";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = (await cookies()).get("alvira_bridge_token")?.value;
  if (!token) return Response.json({ connected: false, error: "not_connected" }, { status: 401 });
  try {
    const data = await getProfiles(token);
    return Response.json({ connected: true, ...data });
  } catch {
    return Response.json({ connected: false, error: "context_unavailable" }, { status: 502 });
  }
}
