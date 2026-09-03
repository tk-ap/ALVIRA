import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "~/db";
import { ensureCustomerEmailSchema } from "~/lib/customer-email";
import { extractEmailAddress, verifyAgentMailWebhook } from "~/lib/agentmail-webhook";

type MessageReceivedEvent = {
  event_type: "message.received";
  event_id: string;
  message: {
    inbox_id: string;
    thread_id: string;
    message_id: string;
    timestamp?: string;
    received_timestamp?: string;
    from: string;
    subject?: string;
    preview?: string;
    text?: string;
    extracted_text?: string;
  };
  thread?: {
    subject?: string;
    preview?: string;
    received_timestamp?: string;
  };
};

function clipped(value: unknown, max: number): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, max) : null;
}

export const Route = createFileRoute("/api/agentmail/webhooks")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.AGENTMAIL_WEBHOOK_SECRET?.trim();
        if (!secret) return new Response("Webhook verification is not configured.", { status: 503 });

        const rawBody = await request.text();
        const svixId = request.headers.get("svix-id") ?? "";
        const svixTimestamp = request.headers.get("svix-timestamp") ?? "";
        const svixSignature = request.headers.get("svix-signature") ?? "";
        if (!svixId || !svixTimestamp || !svixSignature) return new Response("Missing webhook verification headers.", { status: 400 });

        let event: MessageReceivedEvent;
        try {
          event = verifyAgentMailWebhook<MessageReceivedEvent>({ rawBody, secret, svixId, svixTimestamp, svixSignature });
        } catch {
          return new Response("Webhook verification failed.", { status: 400 });
        }

        if (event.event_type !== "message.received") return new Response(null, { status: 204 });
        const message = event.message;
        const expectedInbox = (process.env.AGENTMAIL_INBOX_ID || "alvira@agentmail.to").trim().toLowerCase();
        if (!message?.inbox_id || message.inbox_id.trim().toLowerCase() !== expectedInbox) return new Response(null, { status: 204 });

        const senderEmail = extractEmailAddress(message.from || "");
        if (!senderEmail || !message.thread_id || !message.message_id || !event.event_id) return new Response("Incomplete message event.", { status: 400 });

        await ensureCustomerEmailSchema();
        const db = getDb();
        const user = (await db.query("SELECT id, email FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1", [senderEmail]))[0] as { id: string; email: string } | undefined;
        const reservation = (await db.query("SELECT email FROM founding_beta_reservations WHERE LOWER(email)=LOWER($1) LIMIT 1", [senderEmail]))[0] as { email: string } | undefined;
        const subject = clipped(message.subject ?? event.thread?.subject, 500);
        const preview = clipped(message.preview ?? event.thread?.preview, 1000);
        const bodyText = clipped(message.extracted_text ?? message.text ?? message.preview, 20000);
        const receivedAt = message.received_timestamp ?? message.timestamp ?? event.thread?.received_timestamp ?? new Date().toISOString();

        await db.query(`
          INSERT INTO customer_email_threads (
            thread_id, inbox_id, correspondent_email, user_id, reservation_email, subject,
            last_message_id, last_preview, last_received_at, unread_count, needs_reply, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,TRUE,NOW())
          ON CONFLICT (thread_id) DO NOTHING`,
          [message.thread_id, message.inbox_id, senderEmail, user?.id ?? null, reservation?.email ?? null, subject, message.message_id, preview, receivedAt],
        );

        const inserted = await db.query(`
          INSERT INTO customer_email_events (
            event_id, svix_id, event_type, thread_id, message_id, inbox_id, sender_email,
            user_id, reservation_email, subject, preview, body_text, received_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          ON CONFLICT DO NOTHING
          RETURNING event_id`,
          [event.event_id, svixId, event.event_type, message.thread_id, message.message_id, message.inbox_id, senderEmail, user?.id ?? null, reservation?.email ?? null, subject, preview, bodyText, receivedAt],
        );

        if (inserted.length > 0) {
          await db.query(`
            UPDATE customer_email_threads
               SET correspondent_email=$2,
                   user_id=COALESCE($3,user_id),
                   reservation_email=COALESCE($4,reservation_email),
                   subject=COALESCE($5,subject),
                   last_message_id=$6,
                   last_preview=COALESCE($7,last_preview),
                   last_received_at=$8,
                   unread_count=unread_count+1,
                   needs_reply=TRUE,
                   resolved_at=NULL,
                   updated_at=NOW()
             WHERE thread_id=$1`,
            [message.thread_id, senderEmail, user?.id ?? null, reservation?.email ?? null, subject, message.message_id, preview, receivedAt],
          );
        }

        return new Response(null, { status: 204 });
      },
    },
  },
});
