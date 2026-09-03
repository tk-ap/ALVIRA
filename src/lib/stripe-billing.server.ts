import { createHmac, timingSafeEqual } from "node:crypto";
import { getCookie } from "@tanstack/react-start/server";
import { getDb, getSessionByToken, getUserById, type User } from "~/db";

const SESSION_COOKIE = "alvira_session";
const SITE_URL = process.env.PUBLIC_SITE_URL || "https://alviratech.vercel.app";

export type BillingPlan = "pro-monthly" | "pro-annual" | "lifetime";

const PLAN_CONFIG: Record<BillingPlan, { priceId: string; entitlement: "pro" | "lifetime"; mode: "subscription" | "payment" }> = {
  "pro-monthly": { priceId: "price_1UAx9zFVePBsKetGtqocur09", entitlement: "pro", mode: "subscription" },
  "pro-annual": { priceId: "price_1UAxAeFVePBsKetGKHON6EsG", entitlement: "pro", mode: "subscription" },
  lifetime: { priceId: "price_1UAxB6FVePBsKetGLLCEt5Z9", entitlement: "lifetime", mode: "payment" },
};

export function isBillingPlan(value: unknown): value is BillingPlan {
  return value === "pro-monthly" || value === "pro-annual" || value === "lifetime";
}

export async function requireBillingUser(): Promise<User> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) throw new Error("Authentication required.");
  const session = await getSessionByToken(token);
  if (!session || new Date(session.expires_at) < new Date()) throw new Error("Authentication required.");
  const user = await getUserById(session.user_id);
  if (!user) throw new Error("Authentication required.");
  return user;
}

function stripeSecretKey(): string {
  const override = process.env.ALVIRA_STRIPE_SECRET_KEY?.trim();
  const key = override || process.env.STRIPE_SECRET_KEY?.trim();
  const source = override ? "ALVIRA_STRIPE_SECRET_KEY" : "STRIPE_SECRET_KEY";
  if (!key) throw new Error("Stripe checkout is not configured.");
  if (key.startsWith("mk_")) {
    console.error("[stripe-checkout] invalid Stripe credential", { source, kind: "managed_key_id" });
    throw new Error("Stripe checkout credential is a key ID, not an API secret.");
  }
  if (!key.startsWith("sk_") && !key.startsWith("rk_")) {
    console.error("[stripe-checkout] invalid Stripe credential", { source, kind: "unexpected_prefix" });
    throw new Error("Stripe checkout credential is not a supported secret API key.");
  }
  return key;
}

export async function createCheckoutSession(user: User, plan: BillingPlan): Promise<string> {
  const config = PLAN_CONFIG[plan];
  const body = new URLSearchParams();
  body.set("mode", config.mode);
  body.set("line_items[0][price]", config.priceId);
  body.set("line_items[0][quantity]", "1");
  body.set("success_url", `${SITE_URL}/account?checkout=success&plan=${encodeURIComponent(plan)}`);
  body.set("cancel_url", `${SITE_URL}/pricing?checkout=cancelled`);
  body.set("client_reference_id", user.id);
  body.set("metadata[app]", "alvira");
  body.set("metadata[alvira_user_id]", user.id);
  body.set("metadata[entitlement]", config.entitlement);
  body.set("metadata[plan]", plan);
  body.set("metadata[catalog_version]", "2026-09-01");
  if (user.stripe_customer_id) body.set("customer", user.stripe_customer_id);
  else body.set("customer_email", user.email);
  if (config.mode === "subscription") {
    body.set("subscription_data[metadata][app]", "alvira");
    body.set("subscription_data[metadata][alvira_user_id]", user.id);
    body.set("subscription_data[metadata][entitlement]", "pro");
    body.set("subscription_data[metadata][plan]", plan);
  } else {
    body.set("customer_creation", "always");
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${stripeSecretKey()}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = (await response.json()) as { url?: string; error?: { message?: string } };
  if (!response.ok || !payload.url) {
    console.error("[stripe-checkout] session creation failed", { status: response.status, message: payload.error?.message ?? "unknown_error", plan, userId: user.id });
    throw new Error("Unable to start secure checkout.");
  }
  return payload.url;
}

export function verifyStripeSignature(payload: string, signatureHeader: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !signatureHeader) return false;
  const parts = signatureHeader.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !signatures.length) return false;
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds) || Math.abs(Date.now() / 1000 - timestampSeconds) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return signatures.some((candidate) => {
    try {
      const candidateBuffer = Buffer.from(candidate, "hex");
      return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
    } catch { return false; }
  });
}

function stripeId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof (value as { id?: unknown }).id === "string") return (value as { id: string }).id;
  return null;
}

async function resolveUserId(object: any): Promise<string | null> {
  const metadataUserId = object?.metadata?.alvira_user_id;
  if (typeof metadataUserId === "string" && metadataUserId) return metadataUserId;
  const customerId = stripeId(object?.customer);
  if (!customerId) return null;
  const rows = await getDb().query("SELECT id FROM users WHERE stripe_customer_id = $1 LIMIT 1", [customerId]) as Array<{ id: string }>;
  return rows[0]?.id ?? null;
}

async function setStripeCustomer(userId: string, customerId: string | null): Promise<void> {
  if (customerId) await getDb().query("UPDATE users SET stripe_customer_id = $1 WHERE id = $2", [customerId, userId]);
}

async function grantTier(userId: string, tier: "pro" | "lifetime"): Promise<void> {
  if (tier === "lifetime") {
    await getDb().query("UPDATE users SET tier = 'lifetime' WHERE id = $1", [userId]);
    return;
  }
  await getDb().query("UPDATE users SET tier = CASE WHEN tier = 'lifetime' THEN tier ELSE 'pro' END WHERE id = $1", [userId]);
}

async function removeProTier(userId: string): Promise<void> {
  await getDb().query("UPDATE users SET tier = 'free' WHERE id = $1 AND tier = 'pro'", [userId]);
}

async function handleCheckoutSession(session: any): Promise<void> {
  const userId = await resolveUserId(session);
  if (!userId) throw new Error("Stripe checkout session has no ALVIRA user mapping.");
  await setStripeCustomer(userId, stripeId(session.customer));
  const entitlement = session?.metadata?.entitlement;
  if (entitlement === "lifetime") {
    if (session.payment_status === "paid") await grantTier(userId, "lifetime");
    return;
  }
  if (entitlement === "pro" && session.mode === "subscription") await grantTier(userId, "pro");
}

async function handleSubscription(subscription: any): Promise<void> {
  const userId = await resolveUserId(subscription);
  if (!userId) throw new Error("Stripe subscription has no ALVIRA user mapping.");
  const subscriptionId = stripeId(subscription);
  const customerId = stripeId(subscription.customer);
  if (!subscriptionId || !customerId) throw new Error("Stripe subscription is missing identifiers.");
  const status = typeof subscription.status === "string" ? subscription.status : "unknown";
  const priceId = stripeId(subscription?.items?.data?.[0]?.price);
  const periodEndSeconds = Number(subscription?.items?.data?.[0]?.current_period_end ?? subscription?.current_period_end ?? 0);
  const periodEnd = Number.isFinite(periodEndSeconds) && periodEndSeconds > 0 ? new Date(periodEndSeconds * 1000).toISOString() : null;
  await setStripeCustomer(userId, customerId);
  await getDb().query(`INSERT INTO stripe_subscriptions (subscription_id, user_id, customer_id, price_id, status, current_period_end, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (subscription_id) DO UPDATE SET user_id=EXCLUDED.user_id, customer_id=EXCLUDED.customer_id, price_id=EXCLUDED.price_id, status=EXCLUDED.status, current_period_end=EXCLUDED.current_period_end, updated_at=NOW()`,
    [subscriptionId, userId, customerId, priceId, status, periodEnd]);
  if (status === "active" || status === "trialing" || status === "past_due") await grantTier(userId, "pro");
  else await removeProTier(userId);
}

export async function processStripeEvent(event: any): Promise<void> {
  const eventId = typeof event?.id === "string" ? event.id : null;
  const eventType = typeof event?.type === "string" ? event.type : null;
  if (!eventId || !eventType) throw new Error("Malformed Stripe event.");
  const seen = await getDb().query("SELECT 1 FROM stripe_events WHERE event_id = $1 LIMIT 1", [eventId]);
  if (seen.length) return;
  const object = event?.data?.object;
  switch (eventType) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await handleCheckoutSession(object); break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscription(object); break;
    default: break;
  }
  await getDb().query("INSERT INTO stripe_events (event_id, event_type) VALUES ($1, $2) ON CONFLICT (event_id) DO NOTHING", [eventId, eventType]);
}
