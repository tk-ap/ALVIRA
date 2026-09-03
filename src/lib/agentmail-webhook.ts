import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TOLERANCE_SECONDS = 300;

function decodeSecret(secret: string): Buffer {
  const encoded = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  return Buffer.from(encoded, "base64");
}

export function extractEmailAddress(value: string): string {
  const bracketed = value.match(/<([^<>\s]+@[^<>\s]+)>/);
  const candidate = bracketed?.[1] ?? value;
  const bare = candidate.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  return bare.trim().toLowerCase();
}

export function verifyAgentMailWebhook<T = unknown>(input: {
  rawBody: string;
  secret: string;
  svixId: string;
  svixTimestamp: string;
  svixSignature: string;
  nowSeconds?: number;
  toleranceSeconds?: number;
}): T {
  const timestamp = Number(input.svixTimestamp);
  if (!Number.isFinite(timestamp)) throw new Error("Invalid webhook timestamp.");

  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = input.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (Math.abs(now - timestamp) > tolerance) throw new Error("Webhook timestamp outside tolerance.");

  const signedContent = `${input.svixId}.${input.svixTimestamp}.${input.rawBody}`;
  const expected = createHmac("sha256", decodeSecret(input.secret)).update(signedContent).digest();
  const signatures = input.svixSignature
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split(",", 2))
    .filter(([version, signature]) => version === "v1" && Boolean(signature));

  const verified = signatures.some(([, signature]) => {
    let supplied: Buffer;
    try {
      supplied = Buffer.from(signature, "base64");
    } catch {
      return false;
    }
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  });

  if (!verified) throw new Error("Invalid webhook signature.");
  return JSON.parse(input.rawBody) as T;
}
