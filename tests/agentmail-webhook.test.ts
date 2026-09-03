import { createHmac } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { extractEmailAddress, verifyAgentMailWebhook } from "../src/lib/agentmail-webhook";

function fixture() {
  const rawBody = JSON.stringify({ event_type: "message.received", event_id: "evt_123" });
  const svixId = "msg_123";
  const svixTimestamp = "1788397200";
  const key = Buffer.from("test-webhook-secret");
  const secret = `whsec_${key.toString("base64")}`;
  const signature = createHmac("sha256", key).update(`${svixId}.${svixTimestamp}.${rawBody}`).digest("base64");
  return { rawBody, svixId, svixTimestamp, secret, svixSignature: `v1,${signature}` };
}

describe("AgentMail webhook verification", () => {
  test("verifies a valid Svix-style signature", () => {
    const input = fixture();
    const result = verifyAgentMailWebhook<{ event_id: string }>({ ...input, nowSeconds: Number(input.svixTimestamp) });
    expect(result.event_id).toBe("evt_123");
  });

  test("rejects an invalid signature", () => {
    const input = fixture();
    expect(() => verifyAgentMailWebhook({ ...input, svixSignature: "v1,ZmFrZQ==", nowSeconds: Number(input.svixTimestamp) })).toThrow();
  });

  test("rejects stale webhook timestamps", () => {
    const input = fixture();
    expect(() => verifyAgentMailWebhook({ ...input, nowSeconds: Number(input.svixTimestamp) + 301 })).toThrow();
  });

  test("normalizes common sender formats", () => {
    expect(extractEmailAddress("Customer Name <Person@Example.com>")).toBe("person@example.com");
    expect(extractEmailAddress("person@example.com")).toBe("person@example.com");
  });
});
