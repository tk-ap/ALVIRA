import { timingSafeEqual } from "node:crypto";

export type InterviewLabMachineAuth =
  | { ok: true; client: string }
  | { ok: false; status: 401 | 403 | 503; error: string };

function secureEqual(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(actual, "utf8");
  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

function bearerToken(request: Request): string {
  const value = request.headers.get("authorization")?.trim() ?? "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : "";
}

function allowedMachineClients(): Set<string> {
  const configured = process.env.ALVIRA_INTERVIEW_LAB_MACHINE_CLIENTS?.trim();
  const clients = (configured || "hermes")
    .split(",")
    .map((client) => client.trim().toLowerCase())
    .filter(Boolean);
  return new Set(clients);
}

export function authorizeInterviewLabMachineRequest(
  request: Request,
): InterviewLabMachineAuth {
  const expected = process.env.ALVIRA_INTERVIEW_LAB_MACHINE_TOKEN?.trim() ?? "";
  if (expected.length < 32) {
    return { ok: false, status: 503, error: "machine_access_not_configured" };
  }

  const token = bearerToken(request);
  if (!token || !secureEqual(expected, token)) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  const client = request.headers.get("x-alvira-lab-client")?.trim().toLowerCase() ?? "";
  if (!client || !allowedMachineClients().has(client)) {
    return { ok: false, status: 403, error: "client_not_allowed" };
  }

  return { ok: true, client };
}
