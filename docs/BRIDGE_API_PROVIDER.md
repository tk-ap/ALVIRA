# ALVIRA Bridge — provider and compatibility surface

## Architectural rule

ALVIRA remains the **Context Engine and source of truth**. Bridge is an **ALVIRA capability** that distributes maintained Context to approved tools. It must consume the existing ALVIRA Context rather than recreate interview, validation, scoring, profile generation, or context storage.

The product flow is intentionally simpler than the protocol underneath:

**Choose where to use ALVIRA → the other app opens ALVIRA → choose one Context → approve → ALVIRA handles credentials → Connected or Failed.**

A normal user should not need to understand OAuth, PKCE, bearer tokens, MCP discovery, client registration, protocol versions, or redirect URIs. Those are implementation details.

## Connection architecture

Bridge is **MCP-first, not MCP-only**:

1. **Remote MCP** is the default interoperability surface for AI apps, agents, IDEs, and harnesses that support it.
2. **Native adapters / pre-registered clients** may sit above Bridge when a strategic platform offers a better one-click installation experience.
3. **Bridge API** remains the deterministic fallback for custom/server-side integrations that do not support MCP.
4. Bridge never becomes execution authority. It provides approved Context; the receiving harness keeps its own execution permissions and governance.

## Canonical connection surfaces

### AI app / agent — recommended

Remote MCP endpoint:

`https://alviratech.vercel.app/api/bridge/mcp`

A compatible MCP client should be able to start with that URL. The MCP endpoint returns a 401 with Protected Resource Metadata discovery, and ALVIRA publishes OAuth authorization-server metadata so the client can complete authorization without asking the user to copy a credential.

Discovery:

- `/.well-known/oauth-protected-resource`
- `/.well-known/oauth-protected-resource/api/bridge/mcp`
- `/.well-known/oauth-authorization-server`

OAuth endpoints:

- `GET /api/bridge/authorize` — ALVIRA sign-in/Context consent and authorization code issuance.
- `POST /api/bridge/token` — code exchange using PKCE S256 for public clients.
- `POST /api/bridge/register` — **deprecated compatibility fallback** for clients that still rely on Dynamic Client Registration.

### OAuth client priority

For external clients, prefer this order:

1. a deliberately pre-registered/native adapter when ALVIRA and the destination platform have an explicit integration relationship;
2. **Client ID Metadata Documents (CIMD)** for normal third-party MCP clients;
3. Dynamic Client Registration (DCR) only for backward compatibility;
4. the `BRIDGE_CLIENT_SECRET` flow only for ALVIRA-owned/legacy confidential clients.

ALVIRA advertises `client_id_metadata_document_supported: true`. A CIMD client uses the HTTPS URL of its metadata document as its `client_id`; ALVIRA fetches and verifies that document in the backend, validates the exact redirect URI, and never gives the client `BRIDGE_CLIENT_SECRET`.

### Custom app / API — advanced

- `GET /api/bridge/profiles` — bearer-token protected Context read API.
- `GET /api/bridge/connections` — signed-in ALVIRA user view of active Bridge connections.
- `DELETE /api/bridge/connections` — revokes one active connection owned by the signed-in user.

## MCP protocol contract

The preferred MCP revision is **2026-07-28**.

Modern clients:

- use stateless request/response HTTP; there is no protocol session or `Mcp-Session-Id`;
- may call `server/discover` and receive `2026-07-28` capabilities before other work;
- carry `io.modelcontextprotocol/protocolVersion` in request `_meta` on every call;
- mirror the request method in `Mcp-Method` and the target in `Mcp-Name` where required;
- receive `resultType: complete` and ALVIRA server identity metadata on successful modern responses;
- receive private cache hints on Context/list/read results.

Bridge validates the modern request headers against the JSON-RPC body rather than trusting routing headers independently.

The legacy `initialize` path remains available for clients on `2025-11-25` and earlier during the MCP deprecation/upgrade window. It is a compatibility downgrade path, not ALVIRA's preferred protocol.

## Context scoping

New Bridge connections are narrowed to one saved ALVIRA Context. The selected profile ID is carried through the short-lived authorization code into the access-token record. MCP and profile API reads must honor that selection.

Existing pre-scope tokens remain compatible but are identified in the Bridge UI as legacy account-wide access and should be replaced.

The future authorization unit should become an **approved Context view/projection** rather than exposing a raw full Context by default. That can allow a user to approve categories such as working style and current goals while withholding unrelated personal history.

## Connection-state UX rule

`/bridge` is the user-facing source of truth for connection state. It should show:

- **Connected** only for an active, non-revoked token that ALVIRA can verify;
- the connecting app/client name when available;
- the one Context the connection can read;
- read-only permission;
- expiration/reconnect timing;
- a direct Revoke control;
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
- CIMD metadata URLs must be HTTPS, non-root, stable URLs with exact self-identifying `client_id` values.
- CIMD metadata fetches are size/time bounded, do not follow redirects, reject local/private/reserved network targets, and pin the vetted DNS result to reduce SSRF/DNS-rebinding risk.
- Public redirect URIs are validated and matched exactly.
- HTTPS redirects are required except localhost loopback redirects for native clients.
- Access tokens are stored only as SHA-256 hashes in Postgres.
- Bridge access is read-only and scoped to one Context for new connections.
- Users can revoke active connections from ALVIRA Bridge.
- Passwords, ALVIRA session cookies, and Bridge bearer tokens must never be displayed in the normal connection UI.

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
