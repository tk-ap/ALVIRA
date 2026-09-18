# ALVIRA Bridge — provider and compatibility surface

## Product authority

This document implements the owner-ratified direction in `docs/ALVIRA_CONNECT_DIRECTION.md`.

The customer-facing product experience is **Connect ALVIRA**:

**Interview once → maintain living Context → Connect ALVIRA → approve what to share → use that Context in the AI tool the user already prefers.**

**ALVIRA Bridge** is the secure delivery infrastructure underneath that experience. Bridge is not a standalone customer product and should not require normal users to understand its protocols.

## Architectural rule

ALVIRA remains the **Context Engine and source of truth**. Bridge is an **ALVIRA capability** that distributes maintained Context to approved tools. It must consume the existing ALVIRA Context rather than recreate interview, validation, scoring, profile generation, or context storage.

The product flow is intentionally simpler than the protocol underneath:

**Choose where to use ALVIRA → the other app opens ALVIRA → choose what Context to share → approve → ALVIRA handles credentials → Connected or Failed.**

A normal user should not need to understand OAuth, PKCE, bearer tokens, MCP discovery, client registration, protocol versions, or redirect URIs. Those are implementation details.

## Connection architecture

Bridge is **MCP-first, not MCP-only**, while the customer experience may use destination-native language and packaging:

1. **Native plugin/connector or pre-registered adapter** should be used when a verified destination offers a better one-click installation and authorization experience.
2. **Remote MCP** is the default interoperability surface for compatible AI apps, agents, IDEs, and harnesses.
3. **Bridge API** remains the deterministic fallback for custom/server-side integrations that do not support MCP.
4. **Reviewed portable Context views** remain the human-readable fallback when a destination cannot support a secure live connection.
5. Browser extensions or prompt-injection helpers are optional compatibility adapters, not the canonical architecture.
6. Bridge never becomes execution authority. It provides approved Context; the receiving harness keeps its own execution permissions and governance.

Do not claim a named destination as supported until its complete connect → authorize → read → revoke lifecycle has been verified.

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
4. the `BRIDGE_CLIENT_SECRET` flow only for ALVIRA-owned/internal confidential clients.

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

The former pre-scope `alvira-bridge` tokens were revoked during standalone Bridge retirement on 2026-09-15. They are not a supported compatibility path. A user who needs Bridge access must reconnect through the current scoped flow.

**Owner-ratified target:** whole-profile scoping is an intermediate state. The canonical authorization unit should become an **approved Context view/projection** rather than exposing a raw full Context by default.

A Context view should allow the user to approve specific useful categories while withholding unrelated Context. The authorization record must preserve the approved scope and retrieval must not escape it.

Where the destination supports selective retrieval, Bridge should return the minimum approved Context relevant to the current task instead of sending a monolithic Context payload on every interaction.

Widening an approved Context view requires explicit user approval.

## Connection-state UX rule

The canonical Connect ALVIRA management surface (currently `/bridge`) is the user-facing source of truth for connection state. It should show:

- **Connected** only for an active, non-revoked token that ALVIRA can verify;
- the connecting app/client name when available;
- the approved Context or Context view the connection can read;
- read-only permission;
- expiration/reconnect timing;
- a direct Revoke control.

A generic authorization success redirect is not enough to claim a third-party app is connected. External connection success exists only after that client has exchanged its code for an active token.

Customer-facing UI should prefer **Connect ALVIRA**, **Use ALVIRA with…**, and **What this AI can access**. Protocol terminology belongs in advanced/developer details.

## Destination verification requirement

Before ALVIRA names an external AI product as supported, verify all of the following against the real destination:

1. connection can be initiated through a realistic user flow;
2. the destination opens ALVIRA authorization;
3. the user can select the Context/view to approve;
4. code/token exchange succeeds;
5. approved Context can be read;
6. unapproved Context cannot be read;
7. ALVIRA accurately shows the connection as active;
8. revocation prevents later reads;
9. reconnect works;
10. a later read reflects maintained ALVIRA Context after the user updates it.

Record verified destination support separately from theoretical protocol compatibility.

## Standalone Bridge retirement

The former `alviratech-bridge.vercel.app` application is no longer an authorization or MCP compatibility surface.

Retirement evidence on 2026-09-15:

- no real legacy-deployment traffic was observed in the preceding 30 days; the only observed requests during review were unauthenticated retirement checks;
- 12 active `client_id = alvira-bridge` access tokens across three users were revoked;
- zero active `alvira-bridge` tokens/connections remained after revocation;
- no unexpired `alvira-bridge` authorization codes remained;
- no registered OAuth client still advertised the old `alviratech-bridge.vercel.app` callback;
- a separately registered scoped MCP client was left untouched;
- `/api/bridge/authorize` no longer allowlists the standalone application's callback.

The source needed to understand the retired client remains under `compat/alvira-bridge-client/` as historical reference only. The canonical Bridge implementation and all supported connection surfaces live in ALVIRA.

The ALVIRA-owned internal confidential-client flow remains:

- `GET /api/bridge/auth/start`
- `GET /api/bridge/auth/callback`
- `GET|DELETE /api/bridge/context`

That flow resolves only to ALVIRA's own callback. The browser token stays HTTP-only and is never exposed for copy/paste.

## Security model

- ALVIRA session cookies are never exposed to third-party Bridge clients.
- Authorization codes are one-time and expire after five minutes.
- Public MCP clients use Authorization Code + PKCE S256.
- CIMD metadata URLs must be HTTPS, non-root, stable URLs with exact self-identifying `client_id` values.
- CIMD metadata fetches are size/time bounded, do not follow redirects, reject local/private/reserved network targets, and pin the vetted DNS result to reduce SSRF/DNS-rebinding risk.
- Public redirect URIs are validated and matched exactly.
- HTTPS redirects are required except localhost loopback redirects for native clients.
- Access tokens are stored only as SHA-256 hashes in Postgres.
- Bridge access is read-only and scoped to approved Context.
- Users can revoke active connections from ALVIRA.
- External Context access never grants execution authority or canonical Context write authority.
- Passwords, ALVIRA session cookies, and Bridge bearer tokens must never be displayed in the normal connection UI.

## Environment contract

ALVIRA production needs:

- `DATABASE_URL`
- `BRIDGE_CLIENT_ID=alvira-bridge`
- `BRIDGE_CLIENT_SECRET=<shared high-entropy secret>` for the ALVIRA-owned internal confidential client only

`BRIDGE_PUBLIC_URL` is retired and is not part of the supported ALVIRA environment contract.

Third-party public MCP clients do not receive or reuse `BRIDGE_CLIENT_SECRET`.

## Existing ALVIRA Connect draft

Draft PR #131 contains candidate portability and connector work. Reconcile it against `docs/ALVIRA_CONNECT_DIRECTION.md` before merging.

- reviewed Context views are aligned and important;
- native/plugin packaging is aligned when it preserves Bridge authorization and canonical ALVIRA Context;
- portable copy/download is a fallback and ownership path;
- its browser extension is optional compatibility infrastructure, not the preferred architecture when a secure direct connection is available.

## Do not duplicate

Do not add interview logic, Context generation, profile compilation, or a second profile database to Bridge. New representations should be projections from ALVIRA's canonical Context, and protocol/client surfaces should live in ALVIRA unless there is a clear platform reason otherwise.

Do not make users manually copy Bridge access tokens. If a client cannot complete the authorization flow itself, treat that as an unsupported/advanced integration rather than weakening the security model.

Do not create destination-specific copies that silently drift from the maintained ALVIRA source of truth.
