# AgentMail inbound reply rail

ALVIRA receives customer replies through a verified AgentMail webhook and surfaces them only in the private owner dashboard.

## Production webhook

Create an inbox-scoped webhook for `alvira@agentmail.to` with:

- URL: `https://alviratech.vercel.app/api/agentmail/webhooks`
- event type: `message.received`
- signing secret stored in Vercel as `AGENTMAIL_WEBHOOK_SECRET`

Do not expose the signing secret in GitHub, browser code, or logs.

## Verification boundary

Every request must provide `svix-id`, `svix-timestamp`, and `svix-signature`. ALVIRA verifies the signature against the exact raw request body and rejects timestamps outside a five-minute tolerance before parsing or persisting the event.

## Persistence

`customer_email_threads` stores the owner-facing thread state: correspondent, account/reservation match, unread count, needs-reply state, subject/preview, and latest message identifiers.

`customer_email_events` stores one row per verified inbound message. `event_id`, `svix_id`, and `message_id` make AgentMail retries idempotent. ALVIRA stores useful text/preview only; it does not persist arbitrary raw webhook payloads or inbound HTML.

## Matching

Inbound sender addresses are normalized and matched against:

1. `users.email`
2. `founding_beta_reservations.email`
3. otherwise `unknown`

Matching is informational. A sender match does not grant authentication or entitlement.

## Owner workflow

The `/dashboard` owner view shows unread and needs-reply counts plus recent verified threads. The owner can mark a thread read or resolved. ALVIRA does not auto-reply in this phase.
