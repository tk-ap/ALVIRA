# ALVIRA Bridge — provider and compatibility surface

## Architectural rule

ALVIRA remains the **Context Engine and source of truth**. Bridge is an **ALVIRA capability** that distributes maintained Context to approved tools. It must consume the existing ALVIRA Context rather than recreate interview, validation, scoring, profile generation, or context storage.

The product flow is intentionally simpler than the protocol underneath:

**Choose where to use ALVIRA → the other app opens ALVIRA → choose one Context → approve → ALVIRA handles credentials → Connected or Failed.**

A normal user should not need to understand OAuth, PKCE, bearer tokens, MCP discovery, client registration, or redirect URIs. Those are implementation details.

## Canonical connection surfaces

### AI app / agent — recommended

Remote MCP endpoint:

`https://alviratech.vercel.app/api/bridge/mcp`

A compatible MCP client should be able to start with that URL. The MCP endpoint returns a 401 with Protected Resource Metadata discovery, and ALVIRA publishes OAuth authorization-server metadata so the client can register and perform Authorization Code + PKCE without asking the user to copy a credential.

Discovery:

- `/.well-known/oauth-protected-resource`
- `/.well-known/oauth-protected-resource/api/bridge/mcp`
- `/.well-known/oauth-authorization-server`

OAuth endpoints:

- `POST /api/bridge/register` — compatibility Dynamic Client Registration for MCP clients.
- `GET /api/bridge/authorize` — ALVIRA sign-in/Context consent and authorization code issuance.
- `POST /api/bridge/token` — code exchange. Public clients use PKCE S256; the legacy ALVIRA client may continue using its client secret.

### Custom app / API — advanced

- `GET /api/bridge/profiles` — bearer-token protected Context read API.
- `GET /api/bridge/connections` — signed-in ALVIRA user view of active Bridge connections.
- `DELETE /api/bridge/connections` — revokes one active connection owned by the signed-in user.

## Context scoping

New Bridge connections are narrowed to one saved ALVIRA Context. The selected profile ID is carried through the short-lived authorization code into the access-token record. MCP and profile API reads must honor that selection.

Existing pre-scope tokens remain compatible but are identified in the Bridge UI as legacy account-wide access and should be replaced.

## Connection-state UX rule

`/bridge` is the user-facing source of truth for connection state. It should show:

- **Connected** only for an active, non-revoked token that ALVIRA can verify.
- the connecting app/client name when available.
- the one Context the connection can read.
- read-only permission.
- expiration/reconnect timing.
- a direct Revoke control.
- legacy connections separately with a clear update/removal prompt.

A generic authorization success redirect is not enough to claim a third-party app is connected. External connection success exists only after that client has exchanged its code for an active token.

## Compatibility rule

The former `alviratech-bridge` deployment remains a compatibility client during migration. It is not the canonical home for Bridge logic.

The legacy callback derived from `BRIDGE_PUBLIC_URL` remains allowlisted while existing integrations are migrated deliberately. Do not retire it without checking current consumers.

The ALVIRA-owned compatibility flow remains:

- `GET /api/bridge/auth/start`
- `GET /api/bridge/auth/callback`
- `GET|DELETE /api/bridge/context`

The browser token stays HTTP-only and is never exposed for copy/paste.

## Security model

- ALVIRA session cookies are never exposed to third-party Bridge clients.
- Authorization codes are one-time and expire after five minutes.
- Public MCP clients use Authorization Code + PKCE S256.
- Public redirect URIs are registered and matched exactly.
- HTTPS redirects are required except localhost loopback redirects for native clients.
- Access tokens are stored only as SHA-256 hashes in Postgres.
- Bridge access is read-only and scoped to one Context for new connections.
- Users can revoke active connections from ALVIRA Bridge.
- Passwords, ALVIRA session cookies, and Bridge bearer tokens must never be displayed in the normal connection UI.

## MCP relationship

MCP is served directly by ALVIRA at `/api/bridge/mcp`. A separate Bridge deployment is not required for the protocol surface. The endpoint validates the Bridge access token and reads the currently maintained ALVIRA Context at request time.

The endpoint advertises ALVIRA's authorization metadata through `WWW-Authenticate` when a client arrives without a valid token. This is what lets a compatible client move from “I have a server URL” to the ALVIRA sign-in/consent flow automatically.

## Environment contract

ALVIRA production needs:

- `DATABASE_URL`
- `BRIDGE_PUBLIC_URL=https://alviratech-bridge.vercel.app` while the compatibility callback remains supported
- `BRIDGE_CLIENT_ID=alvira-bridge`
- `BRIDGE_CLIENT_SECRET=<shared high-entropy secret>` for the legacy/internal confidential client only

Third-party public MCP clients do not receive or reuse `BRIDGE_CLIENT_SECRET`.

## Do not duplicate

Do not add interview logic, Context generation, profile compilation, or a second profile database to Bridge. New representations should be projections from ALVIRA's canonical Context, and protocol/client surfaces should live in ALVIRA unless there is a clear platform reason otherwise.

Do not make users manually copy Bridge access tokens. If a client cannot complete the authorization flow itself, treat that as an unsupported/advanced integration rather than weakening the security model.
