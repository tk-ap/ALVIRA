import { afterEach, describe, expect, test } from "bun:test";
import { authorizeInterviewLabMachineRequest } from "../src/lib/interview-lab-machine.server";

const originalToken = process.env.ALVIRA_INTERVIEW_LAB_MACHINE_TOKEN;
const originalClients = process.env.ALVIRA_INTERVIEW_LAB_MACHINE_CLIENTS;

afterEach(() => {
  if (originalToken === undefined) delete process.env.ALVIRA_INTERVIEW_LAB_MACHINE_TOKEN;
  else process.env.ALVIRA_INTERVIEW_LAB_MACHINE_TOKEN = originalToken;
  if (originalClients === undefined) delete process.env.ALVIRA_INTERVIEW_LAB_MACHINE_CLIENTS;
  else process.env.ALVIRA_INTERVIEW_LAB_MACHINE_CLIENTS = originalClients;
});

function request(token?: string, client = "hermes"): Request {
  const headers = new Headers({ "x-alvira-lab-client": client });
  if (token) headers.set("authorization", `Bearer ${token}`);
  return new Request("https://example.test/api/interview-lab/machine", { headers });
}

describe("Interview Lab machine authorization", () => {
  test("fails closed when the machine secret is not configured", () => {
    delete process.env.ALVIRA_INTERVIEW_LAB_MACHINE_TOKEN;
    expect(authorizeInterviewLabMachineRequest(request())).toEqual({
      ok: false,
      status: 503,
      error: "machine_access_not_configured",
    });
  });

  test("rejects an incorrect bearer token", () => {
    process.env.ALVIRA_INTERVIEW_LAB_MACHINE_TOKEN = "a".repeat(48);
    const result = authorizeInterviewLabMachineRequest(request("b".repeat(48)));
    expect(result).toEqual({ ok: false, status: 401, error: "unauthorized" });
  });

  test("allows Hermes with the configured bearer token", () => {
    const token = "c".repeat(48);
    process.env.ALVIRA_INTERVIEW_LAB_MACHINE_TOKEN = token;
    delete process.env.ALVIRA_INTERVIEW_LAB_MACHINE_CLIENTS;
    expect(authorizeInterviewLabMachineRequest(request(token))).toEqual({
      ok: true,
      client: "hermes",
    });
  });

  test("rejects a client that is not explicitly allowed", () => {
    const token = "d".repeat(48);
    process.env.ALVIRA_INTERVIEW_LAB_MACHINE_TOKEN = token;
    process.env.ALVIRA_INTERVIEW_LAB_MACHINE_CLIENTS = "hermes";
    expect(authorizeInterviewLabMachineRequest(request(token, "other-tool"))).toEqual({
      ok: false,
      status: 403,
      error: "client_not_allowed",
    });
  });
});
