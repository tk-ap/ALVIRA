import { createFileRoute } from "@tanstack/react-router";
import { createCheckoutSession, isBillingPlan, requireBillingUser } from "~/lib/stripe-billing.server";

export const Route = createFileRoute("/api/stripe/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as { plan?: unknown };
          if (!isBillingPlan(body.plan)) return Response.json({ error: "invalid_plan" }, { status: 400 });
          const user = await requireBillingUser();
          const url = await createCheckoutSession(user, body.plan);
          return Response.json({ url }, { status: 200 });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unable to start checkout.";
          const status = message === "Authentication required." ? 401 : message === "Stripe checkout is not configured." ? 503 : 502;
          console.error("[stripe-checkout] request failed", { status, message });
          return Response.json({ error: status === 401 ? "authentication_required" : "checkout_unavailable" }, { status });
        }
      },
    },
  },
});
