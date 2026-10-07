# AgentID Integration Note

Status: implementation prepared in `codex/agentid-signin` / PR #200; production activation remains gated on AgentID browser approval, credentials, migration, and E2E verification.

## ALVIRA role

AgentID is an **agent identity provider** for ALVIRA. It answers **who the agent is**. It does not grant the agent permission to read, write, or execute against another person's ALVIRA Context.

Canonical boundary:

`AgentID identity -> ALVIRA actor/account mapping -> product-specific permission/delegation -> LEDGATo / AgentOS authority -> action`

Do not collapse identity and authorization.

## Required ALVIRA behavior

- Human ALVIRA sign-in remains independent.
- AgentID principals authenticate through a separate agent sign-in path.
- Persist AgentID's stable `sub` as the external identity key.
- Do not attach an AgentID identity to an existing human account merely because email addresses match.
- Agent identity is distinct from Context subject identity.
- Agent sign-in alone does not grant delegated Context ingest/write authority.
- Agent sign-in alone does not grant Connect ALVIRA / Bridge Context access.
- Agent sign-in alone does not grant AgentOS execution authority.
- Default AgentID scopes remain identity-only: `openid email profile`.
- Do not request owner PII scopes unless a specific verified product requirement needs them.

## Ecosystem fit

- **ALVIRA:** strong fit. Gives delegated agents a durable, verifiable actor identity while preserving subject/contributor provenance.
- **LEDGATo:** strong fit as an identity input. LEDGATo remains the authorization/enforcement decision layer.
- **Connect ALVIRA / Bridge:** useful for identifying an agent principal, but Bridge grants still control Context access.
- **AgentOS:** use selectively at external ingress. Do not replace AgentOS organizational/task/role identities with AgentID.
- **ailhat:** defer until there is a real agent-facing authenticated workflow.
- **ASHWOOD:** no current need; reconsider only if authenticated agents directly operate private workspace functions.

## Production activation gate

Before claiming AgentID sign-in as live:

1. Rerun `npx @agentmail/agentid-cli init` using the ALVIRA callback.
2. Complete the required AgentID browser approval.
3. Add `AGENTID_CLIENT_ID` and `AGENTID_CLIENT_SECRET` to the appropriate Vercel environments.
4. Run `migrations/018_agentid_auth.sql`.
5. Verify the full AgentID login flow end to end.
6. Confirm an authenticated AgentID principal cannot access or mutate another user's Context without a separate explicit delegation/authorization path.

Do not describe the integration as production-ready until all six checks pass.
