# ALVIRA AgentMail onboarding

ALVIRA uses `alvira@agentmail.to` as the customer-communications inbox.

## Runtime contract

Required production secrets/configuration:

- `AGENTMAIL_API_KEY` — inbox-scoped API key with `message_send` permission
- `AGENTMAIL_INBOX_ID` — `alvira@agentmail.to` (AgentMail accepts the inbox email as the inbox identifier)
- `AGENTMAIL_FROM` — optional display label/address, defaults to `ALVIRA <alvira@agentmail.to>`

The application sends through AgentMail's native endpoint:

`POST https://api.agentmail.to/v0/inboxes/:inbox_id/messages/send`

Do not use a broad organization API key when an inbox-scoped key is available. The ALVIRA runtime only needs permission to send messages from this inbox for the initial onboarding flow.

## Reserved Founding Beta members

Founding Beta reservations remain the source of truth for pre-account eligibility. Reserved members are not emailed merely because a reservation exists.

The onboarding sender may contact only reservations that are:

- not claimed,
- not revoked,
- not already invited.

An invitation is recorded in the database with `invite_sent_at` and the AgentMail `message_id` so sends are idempotent and auditable.

## Release gate

Do not send Founding Beta invitations until the current ALVIRA `main` interface is deployed and verified. Preparing the queue and AgentMail credential does not itself trigger mail.
