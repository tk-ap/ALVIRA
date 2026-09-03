import { describe, expect, test } from "bun:test";
import { buildAgentMailSendUrl } from "../src/email";

describe("AgentMail adapter", () => {
  test("builds the native inbox send endpoint", () => {
    expect(buildAgentMailSendUrl("alvira@agentmail.to")).toBe(
      "https://api.agentmail.to/v0/inboxes/alvira%40agentmail.to/messages/send",
    );
  });

  test("normalizes surrounding whitespace in the inbox id", () => {
    expect(buildAgentMailSendUrl("  alvira@agentmail.to  ")).toBe(
      "https://api.agentmail.to/v0/inboxes/alvira%40agentmail.to/messages/send",
    );
  });
});
