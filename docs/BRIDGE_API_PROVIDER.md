# ALVIRA → Bridge API Provider

## Architectural rule

ALVIRA remains the **Context Engine and source of truth**. Bridge is the **context distribution layer**. Bridge must consume the existing ALVIRA Profile rather than recreate interview, validation, scoring, profile generation, or context storage.

This follows the ecosystem direction: Context Engine → Bridge → Workflow Studio → AI Agents. The Context Engine produces a portable ALVIRA Profile; Bridge makes that profile available wherever the user works. fileciteturn61file0L38-L50 fileciteturn61file0L104-L139

## Current API contract

- `GET /bridge/connect` — consent UI for a signed-in ALVIRA user.
- `GET /api/bridge/authorize` — validates the ALVIRA session and issues a short-lived, one-time authorization code.
- `POST /api/bridge/token` — exchanges the code for a 30-day Bridge access token.
- `GET /api/bridge/profiles` — bearer-token protected profile/context read API.

The token only has `context:read profile:read` scope in this first release.

## Security model

- ALVIRA session cookies are never shared with Bridge.
- Authorization codes are one-time and expire after five minutes.
- Access tokens are stored only as SHA-256 hashes in Postgres.
- Redirect URI is allowlisted to the Bridge callback.
- Bridge receives read access; it does not receive password/session credentials.
- Future scopes should be explicit and revocable.

## MCP relationship

Bridge is the MCP-facing layer. MCP clients connect to Bridge, not directly to the Context Engine database. Bridge validates the access token and reads the current ALVIRA Profile from the provider API on demand.

This keeps the architecture aligned with the product thesis: ALVIRA knows the user; Bridge makes that context available everywhere. fileciteturn61file0L806-L818

## Environment contract

ALVIRA production needs:

- `DATABASE_URL`
- `BRIDGE_PUBLIC_URL=https://alviratech-bridge.vercel.app`
- `BRIDGE_CLIENT_ID=alvira-bridge`
- `BRIDGE_CLIENT_SECRET=<shared high-entropy secret>`

The same client ID/secret pair must be configured on the Bridge deployment. Never commit the secret.

## Do not duplicate

Do not add interview logic, context generation, profile compilation, or a second profile database to Bridge. If Bridge needs a new representation, add a provider/API projection in ALVIRA and keep the canonical context in the Context Engine.
