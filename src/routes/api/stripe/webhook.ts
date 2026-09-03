import { createFileRoute } from "@tanstack/react-router";
import { processStripeEvent, verifyStripeSignature } from "~/lib/stripe-billing.server";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.text();
        const signature = request.headers.get("stripe-signature");
        if (!verifyStripeSignature(payload, signature)) return Response.json({ error: "invalid_signature" }, { status: 400 });
        try {
          const event = JSON.parse(payload);
          await processStripeEvent(event);
          return Response.json({ received: true }, { status: 200 });
        } catch (error) {
          const message = error instanceof Error ? error.message : "unknown_error";
          console.error("[stripe-webhook] processing failed", { message });
          return Response.json({ error: "processing_failed" }, { status: 500 });
        }
      },
    },
  },
});
