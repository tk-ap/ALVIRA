# ALVIRA Bridge — provider and compatibility surface

## Architectural rule

ALVIRA remains the **Context Engine and source of truth**. Bridge is an **ALVIRA capability** that distributes maintained Context to approved tools. It must consume the existing ALVIRA Context rather than recreate interview, validation, scoring, profile generation, or context storage.

The current direction is: **Context Engine → Bridge → approved tools / agents**. ALVIRA produces and maintains the Context; Bridge provides narrow, revocable read access.

The former `alviratech-bridge` deployment remains a compatibility client during migration. It is not the canonical home for Bridge logic.

## Canonical ALVIRA API contract

Provider endpoints:

- `GET /bridge/connect` — consent UI for a signed-in ALVIRA user.
- `GET /api/bridge/authorize` — validates the ALVIRA session and issues a short-lived, one-time authorization code.
- `POST /api/bridge/token` — exchanges the code for a 30-day Bridge access token.
- `GET /api/bridge/profiles` — bearer-token protected Context read API.

Migrated Bridge client / compatibility endpoints now hosted directly by ALVIRA:

- `GET /api/bridge/auth/start` — starts an ALVIRA-owned authorization flow.
- `GET /api/bridge/auth/callback` — exchanges the authorization code and stores the resulting Bridge token in an HTTP-only ALVIRA cookie.
- `GET /api/bridge/context` — same-origin Context access for the ALVIRA-owned Bridge surface.
- `GET|POST|DELETE /api/bridge/mcp` — bearer-token protected stateless JSON MCP endpoint exposing `alvira://profiles`, `get_alvira_context`, and `list_alvira_profiles`.

The token currently has `context:read profile:read` scope only.

## Compatibility rule

The authorization endpoint allowlists both:

- the canonical ALVIRA callback: `https://alviratech.vercel.app/api/bridge/auth/callback`
- the legacy Bridge callback derived from `BRIDGE_PUBLIC_URL`, currently `https://alviratech-bridge.vercel.app/api/auth/callback`

This keeps existing `alviratech-bridge` authorization/callback/context/MCP clients operational while new connections can remain fully inside ALVIRA.

Do not remove the legacy callback allowlist or retire the old deployment until existing integrations have been checked and migrated deliberately.

## Security model

- ALVIRA session cookies are never exposed to third-party Bridge clients.
- Authorization codes are one-time and expire after five minutes.
- Access tokens are stored only as SHA-256 hashes in Postgres.
- Redirect URIs are explicitly allowlisted.
- Bridge receives read access; it does not receive password/session credentials.
- The ALVIRA-owned callback stores its access token in an HTTP-only, same-site cookie.
- MCP continues to require a bearer Bridge token and reads the current Context at request time.
- Future scopes should be explicit and revocable.

## MCP relationship

MCP is now served by ALVIRA at `/api/bridge/mcp`; a separate Bridge deployment is no longer required for the protocol surface. The endpoint validates the same Bridge access token and reads the current ALVIRA Context directly through the shared Bridge primitives.

The legacy `alviratech-bridge` MCP endpoint may continue proxying ALVIRA during the compatibility period.

## Environment contract

ALVIRA production needs:

- `DATABASE_URL`
- `BRIDGE_PUBLIC_URL=https://alviratech-bridge.vercel.app` while the compatibility callback remains supported
- `BRIDGE_CLIENT_ID=alvira-bridge`
- `BRIDGE_CLIENT_SECRET=<shared high-entropy secret>`

The legacy Bridge deployment must retain the same client ID/secret pair for as long as its callback remains active. Never commit the secret.

## Do not duplicate

Do not add interview logic, Context generation, profile compilation, or a second profile database to Bridge. New representations should be projections from ALVIRA's canonical Context, and protocol/client surfaces should live in ALVIRA unless there is a clear platform reason otherwise.
